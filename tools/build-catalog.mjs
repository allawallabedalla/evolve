// Erzeugt app/catalog.js — den realen Artenkatalog (BACKLOG Punkt 12, Schritt 0.2).
//
// BOOTSTRAP-STUFE. Der spaetere Katalog kommt aus der Wikidata-Ernte (Schritt 1.x) mit
// tausenden Arten und gemessenen Genom-Positionen. Diese Stufe baut denselben Katalog
// aus dem, was heute schon handkuratiert vorliegt — den 65 „≈ in echt"-Zuordnungen in
// app/exemplar.js — damit die gesamte Kette (Format -> Laden -> Sharding -> Stufe-2-
// Matcher -> Anzeige) Ende zu Ende steht und geprueft ist, BEVOR die grosse Ernte
// beginnt. Steht sie, ist 1.4 nur noch ein Austausch der Datenquelle.
//
// Was hier ECHT ist: Wikidata-QID, wissenschaftlicher Name, taxonomischer Rang und die
// Elterntaxon-Kette werden live gegen Wikidata aufgeloest (ueber den dewiki-Sitelink des
// kuratierten Artikels). Das ist bereits die Datenqualitaet, die der spaetere Katalog hat.
//
// Was hier NOCH NICHT echt ist: die Genom-Position. Sie ist der Prototyp der zugehoerigen
// Bauplan-Gruppe — also die Behauptung „dieses reale Vorbild sitzt dort, wo sein Archetyp
// sitzt". Deshalb traegt JEDES Gen dieser Eintraege Konfidenz 2 (aus der Klade abgeleitet)
// und keines Konfidenz 3 (gemessen). Schritt 1.2/1.3 ersetzt genau das.
//
// Aufruf:  npm run build-catalog             (aus dem Netz, schreibt app/catalog.js)
//          npm run build-catalog -- --offline (ohne Netz: nur Prototyp + Wikipedia-Titel,
//                                              QID/sci/Kette bleiben leer)
//
// Das npm-Script setzt NODE_USE_ENV_PROXY=1. Grund: Nodes eingebautes fetch() liest
// HTTPS_PROXY nicht von selbst (s. /root/.ccr/README.md) und laeuft hinter einem Proxy
// sonst in ein 403 „Host not in allowlist", obwohl der Host erlaubt ist. In GitHub
// Actions gibt es keinen Proxy, dort ist die Variable wirkungslos.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OFFLINE = process.argv.includes("--offline");
const UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)";
const CACHE = join(ROOT, "tools", ".catalog-cache.json");

// ---------------------------------------------------------------------------
// Quellen einlesen

const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const ARCH = archWin.ARCHETYPES;

const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const grab = (re, what) => {
  const m = html.match(re);
  if (!m) { console.error(`build-catalog: ${what} nicht gefunden.`); process.exit(1); }
  return m[0];
};
const PARAMS = new Function(`${grab(/const PARAMS = \{[\s\S]*?\n\};/, "PARAMS")}; return PARAMS;`)();
const GENE_LABELS = new Function(
  `${grab(/const GENE_LABELS = \[[\s\S]*?\];/, "GENE_LABELS")}; return GENE_LABELS;`)();
const NG = GENE_LABELS.length;

// app/exemplar.js ist ein ES-Modul — direkt importierbar.
const { archetypeWiki } = await import(join(ROOT, "app", "exemplar.js"));

/** Prototyp-Vektor einer Form (identisch zu protoGenome() in app/index.html). */
function protoGenome(f) {
  const g = PARAMS.mutationAnchor.slice(0, NG);
  for (const k in f.proto) {
    const i = ARCH.genes.indexOf(k);
    if (i >= 0 && i < NG) g[i] = f.proto[k];
  }
  return g;
}

// ---------------------------------------------------------------------------
// Wikidata-Aufloesung ueber den dewiki-Sitelink (gecacht — der Bootstrap darf nicht
// bei jedem Lauf 65 Anfragen stellen, und ohne Netz muss er trotzdem durchlaufen).

let cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf-8")) : {};

// Hoeflichkeit gegenueber der API: mindestens PAUSE ms zwischen zwei Anfragen, und bei
// 429 (Rate-Limit) exponentiell zurueckziehen statt aufzugeben. Die Elterntaxon-Ketten
// erzeugen pro Art bis zu 30 Anfragen — ohne Drosselung laeuft der Lauf zuverlaessig in
// ein 429, wie beim ersten Versuch beobachtet.
const PAUSE = 120;
let lastCall = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, attempt = 0) {
  const wait = lastCall + PAUSE - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (r.status === 429 && attempt < 5) {
    await sleep(1000 * 2 ** attempt);
    return api(url, attempt + 1);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** dewiki-Titel -> { qid, sci, rank, lineage[] } ; null wenn nicht aufloesbar. */
async function resolve(title) {
  if (cache[title]) return cache[title];
  if (OFFLINE) return null;
  // Ueber die WIKIPEDIA-API aufloesen, nicht ueber den Sitelink: nur sie folgt
  // Weiterleitungen (`redirects=1`). Die kuratierten Titel in app/exemplar.js zeigen
  // teils auf Weiterleitungen ("Amoeben" -> "Amoebozoa"), die per Sitelink ins Leere
  // liefen — gemessen: 12 von 65 Eintraegen blieben so ohne QID.
  const pd = await api("https://de.wikipedia.org/w/api.php?action=query&prop=pageprops"
    + `&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(title)}&format=json`);
  const pages = pd.query?.pages || {};
  const page = Object.values(pages)[0];
  const qid = page?.pageprops?.wikibase_item;
  if (!qid) return (cache[title] = null);
  const d = await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}`
    + "&props=claims|labels&languages=de&format=json");
  const e = d.entities?.[qid];
  if (!e) return (cache[title] = null);
  const c = e.claims || {};
  const one = (p) => c[p]?.[0]?.mainsnak?.datavalue?.value;
  const rec = {
    qid,
    sci: typeof one("P225") === "string" ? one("P225") : null,
    rank: one("P105")?.id || null,
    de: e.labels?.de?.value || null,
    parent: one("P171")?.id || null,
  };
  // Elterntaxon-Kette bis zur Wurzel (max. 30 Schritte — Schutz vor Zyklen in Wikidata).
  const lineage = [];
  let cur = rec.parent, guard = 0;
  while (cur && guard++ < 30) {
    if (cache["#" + cur]) { lineage.push(cur); cur = cache["#" + cur]; continue; }
    lineage.push(cur);
    const pd = await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${cur}`
      + "&props=claims&format=json");
    const pc = pd.entities?.[cur]?.claims || {};
    const next = pc.P171?.[0]?.mainsnak?.datavalue?.value?.id || null;
    cache["#" + cur] = next;
    cur = next;
  }
  rec.lineage = lineage;
  cache[title] = rec;
  return rec;
}

// ---------------------------------------------------------------------------
// Katalog bauen

const RANK_LABEL = { Q7432: "species", Q34740: "genus", Q35409: "family", Q36602: "order",
                     Q37517: "class", Q38348: "phylum", Q36732: "kingdom", Q767728: "variety",
                     Q68947: "subspecies", Q3238261: "subgenus", Q2752679: "subfamily" };

const entries = [];
const missing = [];
for (const f of ARCH.forms) {
  const ex = archetypeWiki(f.n);
  if (!ex) { missing.push(f.n); continue; }
  const title = decodeURIComponent(ex.wiki.split("/wiki/")[1]).replace(/_/g, " ");
  let wd = null;
  try { wd = await resolve(title); } catch (err) { console.error(`  ! ${title}: ${err.message}`); }
  const g = protoGenome(f);
  entries.push({
    qid: wd?.qid || null,
    de: ex.name,                                   // kuratierter Anzeigename
    sci: wd?.sci || null,
    wiki: title,
    group: f.key,                                  // Bauplan-Gruppe = Stufe-1-Schluessel
    rank: RANK_LABEL[wd?.rank] || (wd?.rank ? "other" : null),
    lineage: wd?.lineage || [],
    genome: g.map((x) => Math.max(0, Math.min(255, Math.round(x * 255)))),
    // Bootstrap: jedes Gen stammt aus dem Bauplan-Prototyp -> Konfidenz 2, nie 3.
    conf: new Array(NG).fill(2),
    src: "bootstrap-exemplar",
  });
  process.stdout.write(`\r  ${entries.length}/${ARCH.forms.length} aufgeloest …`);
}
process.stdout.write("\n");

writeFileSync(CACHE, JSON.stringify(cache, null, 0));

// Nach Bauplan-Gruppe sortieren: der Stufe-2-Matcher liest immer nur EINE Gruppe,
// zusammenhaengende Bloecke machen das spaetere Sharding zu einem Slice.
entries.sort((a, b) => a.group.localeCompare(b.group) || (a.de || "").localeCompare(b.de || ""));

const byGroup = {};
for (let i = 0; i < entries.length; i++) (byGroup[entries[i].group] ||= []).push(i);

const out = `// AUTO-GENERIERT von tools/build-catalog.mjs — nicht von Hand editieren.
//
// Der reale Artenkatalog: jede Zeile ein belegtes Lebewesen mit Wikipedia-Artikel.
// Stufe 1 (matchArchetype) benennt die BAUPLAN-GRUPPE, Stufe 2 sucht darin die naechste
// reale Art — s. docs/artenkatalog-plan.md Abschnitt 3.
//
// Stand: BOOTSTRAP (Schritt 0.2). ${entries.length} Eintraege aus den kuratierten
// „≈ in echt"-Zuordnungen in app/exemplar.js; QID/sci/Rang/Elternkette live aus Wikidata.
// Die Genom-Positionen sind noch Bauplan-Prototypen (Konfidenz 2 = aus der Klade
// abgeleitet), NICHT gemessen — das ersetzt Schritt 1.2/1.3.
//
// genome: 25 Gene, je 0..255 (Gen*255 gerundet). Aufloesung 1/255 ~ 0.004 — weit unter
// novelThreshold (0.15) und Mutations-SD (0.06), s. Plan Abschnitt 4.
// conf:   Herkunft je Gen — 3 gemessen · 2 aus Klade · 1 imputiert · 0 aus Habitat.
window.CATALOG = {
  version: 1,
  stage: "bootstrap",
  genes: ${JSON.stringify(ARCH.genes)},
  // Index der Eintraege je Bauplan-Gruppe — Stufe 2 durchsucht nur diese Teilmenge.
  byGroup: ${JSON.stringify(byGroup)},
  entries: [
${entries.map((e) => "    " + JSON.stringify(e)).join(",\n")}
  ],
};
`;
writeFileSync(join(ROOT, "app", "catalog.js"), out);

const withQid = entries.filter((e) => e.qid).length;
const withSci = entries.filter((e) => e.sci).length;
const groups = Object.keys(byGroup).length;
console.log(`app/catalog.js geschrieben — ${entries.length} Eintraege in ${groups} Bauplan-Gruppen`);
console.log(`  Wikidata aufgeloest: ${withQid}/${entries.length} QID · ${withSci} wiss. Name`);
if (missing.length) console.log(`  ohne „≈ in echt"-Zuordnung (kein Eintrag): ${missing.join(", ")}`);
