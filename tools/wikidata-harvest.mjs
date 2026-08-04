// Wikidata-Ernte (BACKLOG Punkt 12, Schritt 1.1 — docs/artenkatalog-plan.md Abschnitt 5a).
//
// Erntet Taxa mit deutschem Wikipedia-Artikel top-down ueber P171 (Elterntaxon),
// gefiltert auf Artrang (P105=Q7432). Zwei Strategien, adaptiv gewaehlt:
//
//   SCHNELLER PFAD   ?t wdt:P171* wd:{clade} ; wdt:P105 wd:Q7432 ; ... dewiki ...
//                    LIMIT/OFFSET paginiert. Funktioniert direkt fuer mittelgrosse
//                    Kladen (gemessen: Saeugetiere/Voegel/Amphibien/Bakterien).
//   ZERLEGUNG        Schlaegt die erste Seite fehl (Timeout/502 bei sehr grossen,
//                    stark verzweigten Kladen wie Insekten), wird NICHT retried —
//                    stattdessen die direkten Kinder der Klade geholt (EIN Hop,
//                    `wdt:P171 wd:{clade}`, immer schnell) und jedes einzeln
//                    rekursiv nach derselben Regel verarbeitet. Terminiert, weil
//                    Teil-Kladen irgendwann klein genug fuer den schnellen Pfad sind.
//
// Nie beides gemischt: entweder eine Klade liefert ihre Arten komplett ueber den
// schnellen Pfad, oder sie wird komplett zerlegt — sonst zaehlten Arten doppelt.
//
// Resumierbar: Fortschritt (Warteschlange + bereits geerntete Arten) wird laufend
// nach tools/.harvest-state.json geschrieben (nicht eingecheckt — Artefakt, kein
// Quelltext). Ein Abbruch verliert nichts weiter als die letzte unvollstaendige Seite.
//
// Aufruf:  npm run wikidata-harvest              (erntet weiter / neu)
//          npm run wikidata-harvest -- --report  (nur Bericht ueber den aktuellen Stand)
//          npm run wikidata-harvest -- --minutes=30  (nach N Minuten sauber anhalten)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "tools", ".harvest-state.json");
const UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)";
const ENDPOINT = "https://query.wikidata.org/sparql";
const REPORT_ONLY = process.argv.includes("--report");
const RETRY_FAILED = process.argv.includes("--retry-failed");
const minutesArg = process.argv.find((a) => a.startsWith("--minutes="));
const DEADLINE = minutesArg ? Date.now() + Number(minutesArg.split("=")[1]) * 60000 : Infinity;
const PAGE = 500;

// Wurzel-Kladen — verifiziert per wbsearchentities/Label-Abfrage (2026-08-01), nicht aus
// dem Gedaechtnis geraten (das ging beim ersten Versuch schief, s. Commit-Historie).
const ROOTS = [
  // Tier
  ["Q7377", "Saeugetiere"], ["Q5113", "Voegel"], ["Q10811", "Reptilien"],
  ["Q10908", "Amphibien"], ["Q127282", "Strahlenflosser"], ["Q1390", "Insekten"],
  ["Q1358", "Spinnentiere"], ["Q25364", "Krebstiere"], ["Q25326", "Weichtiere"],
  ["Q25522", "Ringelwuermer"], ["Q25441", "Nesseltiere"], ["Q44631", "Stachelhaeuter"],
  // Pflanze
  ["Q25314", "Bedecktsamer"], ["Q133712", "Nacktsamer"],
  // Q373615 (Polypodiopsida) statt Q80005 (Bugfix 2026-08-03): Q80005 ist kein
  // Taxon-Item (kein P225, kein P171) und lieferte deshalb immer 0 Arten -
  // s. docs/artenkatalog-plan.md Zeilen 600-601 / tools/lib/clade-rules.mjs.
  ["Q373615", "Farne"],
  ["Q25347", "Laubmoose"],
  // Pilz
  ["Q174698", "Basidiomycota"], ["Q174726", "Ascomycota"],
  // Mikrobe
  ["Q10876", "Bakterien"], ["Q10872", "Archaeen"],
  // Protist (keine monophyletische Gruppe, aber die App-Reich-Zuordnung folgt ohnehin
  // keiner strengen Kladistik — s. app/archetypes.js Kommentar zu Reich k)
  ["Q473809", "Amoebozoa"], ["Q106345", "Ciliophora"], ["Q499086", "Euglenozoa"],
  ["Q107027", "Foraminifera"], ["Q162678", "Diatomeen"],
];

let state = existsSync(STATE)
  ? JSON.parse(readFileSync(STATE, "utf-8"))
  : { species: {}, queue: ROOTS.map(([qid, label]) => ({ qid, label, offset: 0 })),
      done: [], failed: [], decomposed: [], stats: {} };

function save() { writeFileSync(STATE, JSON.stringify(state)); }

let lastCall = 0;
const PAUSE = 180; // Hoeflichkeitsabstand — s. auch tools/build-catalog.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Client-seitiges Zeitlimit DEUTLICH unter dem Server-Timeout (~60s): eine Klade, die
// serverseitig erst nach 55s mit 502 aufgibt, kostet uns sonst 55s, nur um danach exakt
// dieselbe Zerlegung einzuschlagen, die ein 20s-Abbruch genauso ausloest. Gemessen: Voegel
// und Reptilien brauchten >40s bis zum Server-Fehler. Das Risiko, eine Klade abzubrechen,
// die in 25s erfolgreich gewesen waere, ist der Preis — Zerlegung ist immer sicher
// (keine Doppelzaehlung), holt also am Ende dieselben Arten ueber kleinere Kladen nach.
const CLIENT_TIMEOUT_MS = 20000;

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
    if (err.name === "TimeoutError" || err.name === "AbortError")
      throw new Error(`Client-Timeout nach ${CLIENT_TIMEOUT_MS}ms`);
    throw err;
  }
  if (r.status === 429 && attempt < 4) { await sleep(1000 * 2 ** attempt); return sparql(query, attempt + 1); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error("keine gueltige JSON-Antwort (vermutlich Timeout)"); }
}

const dewikiFilter = "?a schema:about ?t ; schema:isPartOf <https://de.wikipedia.org/> .";

/** Eine Seite Arten dieser Klade (transitiv). Wirft bei Timeout/502.
 *
 * FUND (nach dem ersten Testlauf): `?tLabel` (rdfs:label via SERVICE wikibase:label)
 * ist der DEUTSCHE ANZEIGENAME, wenn einer existiert — bei bekannten Arten also "Eisbär",
 * nicht "Ursus maritimus". Fuer die Verknuepfung mit Merkmalsquellen (Schritt 1.1b, die
 * ueber "Gattung Art" schluesseln) und fuer das Katalog-Feld `sci` ist das unbrauchbar.
 * Deshalb wird der wissenschaftliche Name explizit ueber P225 mitgezogen (`?sci`);
 * `label` bleibt fuer die Anzeige/den Bericht, `sci` ist der Schluessel fuer 1.1b/1.4. */
async function fetchSpeciesPage(qid, offset) {
  const q = `SELECT ?t ?tLabel ?sci WHERE { ?t wdt:P171* wd:${qid} ; wdt:P105 wd:Q7432 . ${dewikiFilter}
    OPTIONAL { ?t wdt:P225 ?sci . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". } }
    ORDER BY ?t LIMIT ${PAGE} OFFSET ${offset}`;
  const d = await sparql(q);
  return d.results.bindings.map((b) => ({
    qid: b.t.value.split("/").pop(), label: b.tLabel?.value, sci: b.sci?.value || null,
  }));
}

/** Direkte Kinder (ein Hop) — immer schnell, unabhaengig von der Groesse der Klade. */
async function fetchChildren(qid) {
  const q = `SELECT ?c ?cLabel WHERE { ?c wdt:P171 wd:${qid} .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". } } LIMIT 2000`;
  const d = await sparql(q);
  return d.results.bindings.map((b) => ({ qid: b.c.value.split("/").pop(), label: b.cLabel?.value }));
}

function report() {
  const n = Object.keys(state.species).length;
  console.log(`Ernte-Stand: ${n} Arten · ${state.queue.length} in der Warteschlange · `
    + `${state.done.length} Kladen fertig · ${state.decomposed.length} zerlegt · ${state.failed.length} endgueltig fehlgeschlagen`);
  if (state.failed.length) console.log("  fehlgeschlagen: " + state.failed.map((f) => f.label).join(", "));
}

if (RETRY_FAILED && state.failed.length) {
  // Netzwerk-Flackern statt strukturellem Problem ist der haeufigste Grund fuer einen
  // endgueltigen Fehlschlag (Client-Timeout auf BEIDEN Versuchen kurz hintereinander).
  // Genau EIN erneuter Versuch je Knoten -- kein Endlos-Retry, sonst verstopft ein
  // wirklich zu grosser Knoten die Warteschlange dauerhaft.
  console.log(`${state.failed.length} zuvor fehlgeschlagene Knoten werden erneut versucht.`);
  for (const f of state.failed) state.queue.push({ qid: f.qid, label: f.label, rootLabel: f.rootLabel, offset: 0 });
  state.failed = [];
}

if (REPORT_ONLY) { report(); process.exit(0); }

console.log(`Start — ${state.queue.length} Kladen in der Warteschlange, ${Object.keys(state.species).length} Arten bereits geerntet.`);

while (state.queue.length && Date.now() < DEADLINE) {
  const node = state.queue.shift();
  try {
    const page = await fetchSpeciesPage(node.qid, node.offset);
    for (const s of page) if (!state.species[s.qid]) state.species[s.qid] = { label: s.label, sci: s.sci, root: node.rootLabel || node.label };
    if (page.length === PAGE) {
      // Weitere Seite derselben Klade — ans Ende der Warteschlange, damit andere
      // Kladen zwischendurch drankommen (kein Verhungern grosser Kladen kleinerer).
      state.queue.push({ ...node, offset: node.offset + PAGE });
    } else if (node.offset === 0) {
      state.done.push(node.label);
    } else {
      state.done.push(node.label + ` (${node.offset + page.length} Arten, letzte Seite)`);
    }
    console.log(`  ${node.label} @${node.offset}: +${page.length} Arten (gesamt ${Object.keys(state.species).length})`);
  } catch (err) {
    if (node.offset > 0) {
      // Schneller Pfad war schon teilweise erfolgreich, dann kam ein Timeout — nicht
      // zerlegen (die schon geernteten Seiten bleiben gueltig, keine Doppelzaehlung),
      // sondern als bekannten Rest markieren statt in eine Endlosschleife zu laufen.
      state.failed.push({ ...node, reason: `Seite @${node.offset}: ${err.message}` });
      console.log(`  ! ${node.label} @${node.offset} fehlgeschlagen (${err.message}) — vorige Seiten bleiben gueltig.`);
      continue;
    }
    // Erste Seite ist schon fehlgeschlagen -> zerlegen.
    try {
      const kids = await fetchChildren(node.qid);
      if (!kids.length) { state.failed.push({ ...node, reason: `keine Kinder, aber Arten-Abfrage schlug fehl: ${err.message}` }); continue; }
      state.decomposed.push(node.label);
      for (const k of kids) state.queue.push({ qid: k.qid, label: k.label || k.qid, rootLabel: node.rootLabel || node.label, offset: 0 });
      console.log(`  ~ ${node.label} zerlegt in ${kids.length} Teil-Kladen (Grund: ${err.message})`);
    } catch (err2) {
      state.failed.push({ ...node, reason: `Zerlegung fehlgeschlagen: ${err2.message}` });
      console.log(`  ! ${node.label}: Zerlegung fehlgeschlagen (${err2.message})`);
    }
  }
  save();
}

report();
if (!state.queue.length) console.log("Warteschlange leer — Ernte abgeschlossen (bis auf endgueltig fehlgeschlagene Kladen).");
else console.log("Zeitbudget erschoepft — erneuter Aufruf setzt fort (Zustand gespeichert).");
