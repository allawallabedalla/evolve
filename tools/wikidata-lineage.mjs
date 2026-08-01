// Elterntaxon-Ketten nachladen (BACKLOG Punkt 12, Schritt 1.3 —
// docs/artenkatalog-plan.md Abschnitt 5).
//
// WARUM DIESES SKRIPT UEBERHAUPT EXISTIERT
// tools/wikidata-harvest.mjs erntet top-down und weiss deshalb nur, unter WELCHER
// WURZEL-KLADE eine Art gefunden wurde (`root`) — die volle P171-Kette schreibt es
// nicht mit (bei der Zerlegung waere sie ohnehin nur teilweise bekannt). Stufe (b)
// der Platzierung (tools/lib/clade-rules.mjs) braucht aber genau diese Kette: eine
// Regel greift ueber Mengenzugehoerigkeit ("kommt Q7377 in der Kette vor?").
// Dieses Skript schliesst die Luecke und ergaenzt in tools/.harvest-state.json je
// Art das Feld `lineage` (Array von QIDs, naechster Vorfahr zuerst) und `rank`.
//
// -----------------------------------------------------------------------------
// VERFAHREN — EBENENWEISE STATT KETTE-FUER-KETTE
//
// Der naive Weg (je Art die Kette einzeln hochlaufen) kostet bei 12.000 Arten x bis
// zu 30 Hops ueber 300.000 Anfragen; tools/build-catalog.mjs macht das so, aber nur
// fuer 65 Eintraege. Hier wird stattdessen ebenenweise gearbeitet:
//
//   1. Front = alle Arten-QIDs.
//   2. Fuer die ganze Front in EINER SPARQL-Abfrage (VALUES-Block, 250 QIDs) die
//      direkten Eltern (P171) und den Rang (P105) holen.
//   3. Neue Front = alle Eltern, die noch nicht bekannt sind. Zurueck zu 2.
//   4. Ketten lokal aus der Eltern-Tabelle aufloesen (Breitensuche nach oben).
//
// Das lohnt sich, weil die Ketten NACH OBEN ZUSAMMENLAUFEN: alle 1.652 Saeugetiere
// teilen sich dieselben ~20 Vorfahren. Gemessen (s. Bericht am Ende des Laufs):
// die Front schrumpft nach der ersten Ebene um mehr als eine Zehnerpotenz.
//
// MEHRERE ELTERN. P171 ist in Wikidata nicht funktional — manche Taxa tragen zwei
// Elterntaxa (konkurrierende Backbones). Die Kette ist deshalb streng genommen ein
// gerichteter Graph, und dieses Skript speichert die VOLLSTAENDIGE VORFAHRENMENGE in
// Breitensuch-Reihenfolge (naechster Vorfahr zuerst). Fuer clade-rules.mjs ist das
// die richtige Form: dort zaehlt Mengenzugehoerigkeit, nicht die Position.
//
// -----------------------------------------------------------------------------
// NEBENLAEUFIGKEIT MIT DER LAUFENDEN ERNTE
//
// tools/wikidata-harvest.mjs schreibt tools/.harvest-state.json waehrend der Ernte
// aus SEINEM Speicherabbild — ein blindes Ueberschreiben von hier aus wuerde dessen
// Fortschritt verlieren, und umgekehrt wuerde dessen naechstes save() unsere
// `lineage`-Felder wieder ausradieren. Zwei Vorkehrungen:
//
//   a) EIGENE QUELLE DER WAHRHEIT. Alles Geholte landet zuerst in
//      tools/.lineage-cache.json (Eltern-Tabelle + Raenge). Der Merge in den
//      Ernte-Zustand ist daraus jederzeit ohne Netz wiederholbar (--merge-only).
//      Wird der Ernte-Zustand von der Ernte ueberschrieben, kostet das einen
//      Sekunden-Lauf, keine Netzanfrage.
//   b) LIES-AENDERE-SCHREIBE MIT FRISCHEM EINLESEN. Der Merge liest den Zustand
//      unmittelbar vor dem Schreiben erneut ein, ergaenzt nur das Feld `lineage`
//      (und `rank`) an vorhandenen Arten und schreibt ueber eine temporaere Datei
//      plus rename() — damit ist der Wechsel atomar und ein gleichzeitiger Leser
//      sieht nie eine halbe Datei. Standardmaessig WARTET das Skript ausserdem, bis
//      kein Ernte-Prozess mehr laeuft (--no-wait schaltet das ab).
//
// -----------------------------------------------------------------------------
// Aufruf:
//   NODE_USE_ENV_PROXY=1 node tools/wikidata-lineage.mjs
//   ... --limit=500        nur die ersten N Arten ohne Kette (Stichprobe/Zeitmessung)
//   ... --merge-only       kein Netz: nur den Cache in den Ernte-Zustand mergen
//   ... --report           nur Stand berichten
//   ... --no-wait          nicht auf das Ende der laufenden Ernte warten
//
// NODE_USE_ENV_PROXY=1 ist Pflicht: Nodes eingebautes fetch() liest HTTPS_PROXY sonst
// nicht und laeuft in ein 403 "Host not in allowlist" (Fund aus Schritt 0.2,
// s. tools/build-catalog.mjs und docs/artenkatalog-plan.md 0.2).

import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chainOf, loadLineageCache, MAX_DEPTH, CACHE_PATH } from "./lib/lineage.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "tools", ".harvest-state.json");
const CACHE = CACHE_PATH;
const UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)";
const ENDPOINT = "https://query.wikidata.org/sparql";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const HAS = (name) => process.argv.includes(`--${name}`);
const LIMIT = arg("limit") ? Number(arg("limit")) : Infinity;
const MERGE_ONLY = HAS("merge-only");
const REPORT_ONLY = HAS("report");
const NO_WAIT = HAS("no-wait");

// Groesse eines VALUES-Blocks. 250 gemessen als guter Kompromiss: die Abfrage bleibt
// weit unter dem 60-s-Server-Timeout (typisch 0,5-2 s), und die Zahl der Anfragen
// bleibt klein. Groessere Bloecke (1000) kippten in gelegentliche 500er.
const BATCH = 250;
const PAUSE = 200;          // Hoeflichkeitsabstand, s. tools/build-catalog.mjs
const CLIENT_TIMEOUT_MS = 45000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

async function sparql(query, attempt = 0) {
  const wait = lastCall + PAUSE - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  let r;
  try {
    r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/sparql-results+json", "User-Agent": UA,
                 "Content-Type": "application/x-www-form-urlencoded" },
      body: "query=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch (err) {
    // Netzflackern und Client-Timeout gleich behandeln: bis zu vier Versuche mit
    // exponentiellem Zurueckziehen — dasselbe Muster wie in wikidata-harvest.mjs.
    if (attempt < 4) { await sleep(1000 * 2 ** attempt); return sparql(query, attempt + 1); }
    throw err;
  }
  if ((r.status === 429 || r.status >= 500) && attempt < 4) {
    await sleep(1000 * 2 ** attempt);
    return sparql(query, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error("keine gueltige JSON-Antwort (vermutlich Timeout)"); }
}

// ---------------------------------------------------------------------------
// Cache: { parent: {qid: [elternQids]}, rank: {qid: "species"|...} }
// `parent[q] = []` heisst AUSDRUECKLICH "geprueft, hat kein P171" (Wurzel) — nicht
// "noch nicht geholt". Nur so terminiert die Breitensuche ohne Wiederholung.

let cache = loadLineageCache(CACHE);
function saveCache() {
  const tmp = CACHE + ".tmp";
  writeFileSync(tmp, JSON.stringify(cache));
  renameSync(tmp, CACHE);
}

const RANK_LABEL = { Q7432: "species", Q34740: "genus", Q35409: "family", Q36602: "order",
                     Q37517: "class", Q38348: "phylum", Q36732: "kingdom", Q767728: "variety",
                     Q68947: "subspecies", Q3238261: "subgenus", Q2752679: "subfamily",
                     Q5867051: "subclass", Q5868144: "superfamily", Q3965313: "superclass",
                     Q2136103: "superorder", Q5998839: "suborder", Q6311258: "tribe",
                     Q3504061: "subphylum" };

/** Eine Ebene: Eltern (P171) und Rang (P105) fuer bis zu BATCH QIDs. */
async function fetchLevel(qids) {
  const values = qids.map((q) => "wd:" + q).join(" ");
  const q = `SELECT ?t ?p ?r WHERE { VALUES ?t { ${values} }
    OPTIONAL { ?t wdt:P171 ?p . }
    OPTIONAL { ?t wdt:P105 ?r . } }`;
  const d = await sparql(q);
  const seen = new Set(qids);
  for (const id of qids) if (!cache.parent[id]) cache.parent[id] = [];
  for (const b of d.results.bindings) {
    const t = b.t.value.split("/").pop();
    if (!seen.has(t)) continue;
    const p = b.p?.value.split("/").pop();
    if (p && !cache.parent[t].includes(p)) cache.parent[t].push(p);
    const r = b.r?.value.split("/").pop();
    if (r && !cache.rank[t]) cache.rank[t] = RANK_LABEL[r] || r;
  }
}

// ---------------------------------------------------------------------------
// Merge in den Ernte-Zustand — frisch einlesen, nur ergaenzen, atomar schreiben.

function mergeIntoState() {
  if (!existsSync(STATE)) { console.error("tools/.harvest-state.json fehlt."); process.exit(1); }
  const state = JSON.parse(readFileSync(STATE, "utf-8"));
  let added = 0, already = 0;
  for (const [qid, rec] of Object.entries(state.species || {})) {
    if (!cache.parent[qid]) { if (rec.lineage) already++; continue; }
    rec.lineage = chainOf(cache, qid);
    if (cache.rank[qid]) rec.rank = cache.rank[qid];
    added++;
  }
  const tmp = STATE + ".tmp";
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, STATE);   // atomarer Wechsel auf demselben Dateisystem
  return { added, already, total: Object.keys(state.species || {}).length };
}

function harvestRunning() {
  try {
    const out = execSync("ps -eo args", { encoding: "utf-8" });
    return out.split("\n").some((l) => l.includes("wikidata-harvest.mjs") && !l.includes("ps -eo"));
  } catch { return false; }
}

// ---------------------------------------------------------------------------

const state0 = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf-8")) : { species: {} };
const allQids = Object.keys(state0.species || {});

if (REPORT_ONLY) {
  const withLin = allQids.filter((q) => state0.species[q].lineage).length;
  console.log(`Ernte: ${allQids.length} Arten · ${withLin} davon mit Kette im Zustand · `
    + `${Object.keys(cache.parent).length} Knoten im Eltern-Cache`);
  process.exit(0);
}

if (!MERGE_ONLY) {
  const todo = allQids.filter((q) => !cache.parent[q]).slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`${allQids.length} Arten geerntet, ${todo.length} ohne Eltern-Eintrag im Cache.`);
  const t0 = Date.now();
  let level = 0, requests = 0;
  let front = todo;
  while (front.length && level < MAX_DEPTH) {
    const fresh = front.filter((q) => !cache.parent[q]);
    if (!fresh.length) break;
    for (let i = 0; i < fresh.length; i += BATCH) {
      await fetchLevel(fresh.slice(i, i + BATCH));
      requests++;
      process.stdout.write(`\r  Ebene ${level}: ${Math.min(i + BATCH, fresh.length)}/${fresh.length} `
        + `(${requests} Abfragen, ${((Date.now() - t0) / 1000).toFixed(0)} s)   `);
    }
    saveCache();
    const next = new Set();
    for (const q of fresh) for (const p of cache.parent[q] || []) if (!cache.parent[p]) next.add(p);
    console.log(`\r  Ebene ${level}: ${fresh.length} Knoten aufgeloest -> ${next.size} neue Vorfahren      `);
    front = [...next];
    level++;
  }
  saveCache();
  console.log(`Netzphase fertig: ${requests} Abfragen, ${level} Ebenen, `
    + `${((Date.now() - t0) / 1000).toFixed(1)} s, ${Object.keys(cache.parent).length} Knoten im Cache.`);
}

// Auf das Ende der Ernte warten, sonst radiert deren naechstes save() die Ketten wieder
// aus (sie schreibt aus ihrem eigenen Speicherabbild, das `lineage` nicht kennt).
if (!NO_WAIT) {
  let waited = 0;
  while (harvestRunning() && waited < 45 * 60) {
    if (waited === 0) console.log("Ernte laeuft noch — warte auf ihr Ende, bevor gemergt wird (--no-wait ueberspringt das).");
    await sleep(15000); waited += 15;
  }
  if (waited) console.log(`  ${Math.round(waited / 60)} min gewartet.`);
}

const m = mergeIntoState();
console.log(`Merge: ${m.added} von ${m.total} Arten haben jetzt eine Kette `
  + `(${m.already} trugen schon eine, waren aber nicht im Cache).`);
