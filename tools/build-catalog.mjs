// Erzeugt app/catalog.js — den realen Artenkatalog (BACKLOG Punkt 12).
//
// ZWEI STUFEN, EIN SKRIPT.
//   FULL      (Standard, sobald tools/.harvest-state.json existiert): baut aus der
//             Wikidata-Ernte (1.1) + Kladen-Regelwerk (1.2) + Imputation/Habitat-
//             Rueckwaertslauf (1.3) den vollen Katalog — tausende Arten, gemessene
//             Konfidenz je Gen, `stage:"full"`. Ab hier ersetzt der Katalog die
//             Benennung (CATALOG_NAMES in app/index.html kippt automatisch).
//   BOOTSTRAP (`--bootstrap`, oder Ruecksprung wenn die Ernte fehlt): baut denselben
//             Katalog aus den 65 handkuratierten „≈ in echt"-Zuordnungen in
//             app/exemplar.js — die Stufe, mit der Schritt 0.2 die ganze Kette
//             (Format -> Laden -> Sharding -> Stufe-2-Matcher -> Anzeige) Ende zu
//             Ende geprueft hat, BEVOR die grosse Ernte fertig war. Jedes Gen traegt
//             hier Konfidenz 2 (Bauplan-Prototyp), nie 3 — Bootstrap misst nichts.
//
// Aufruf:  npm run build-catalog               (FULL, sobald die Ernte vorliegt)
//          npm run build-catalog -- --bootstrap (erzwingt die alte Bootstrap-Stufe)
//          npm run build-catalog -- --offline   (nur im Bootstrap-Pfad: kein Netz,
//                                                QID/sci/Kette bleiben leer)
//
// Das npm-Script setzt NODE_USE_ENV_PROXY=1. Grund: Nodes eingebautes fetch() liest
// HTTPS_PROXY nicht von selbst (s. /root/.ccr/README.md) und laeuft hinter einem Proxy
// sonst in ein 403 „Host not in allowlist", obwohl der Host erlaubt ist. In GitHub
// Actions gibt es keinen Proxy, dort ist die Variable wirkungslos.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAppCore } from "./lib/app-core.mjs";
import { applyCladeRules, GENES, GENE_INDEX } from "./lib/clade-rules.mjs";
import { traitsToGenes, buildCorpus, placeSpecies, habitatOf } from "./lib/impute.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OFFLINE = process.argv.includes("--offline");
const UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)";
const CACHE = join(ROOT, "tools", ".catalog-cache.json");
const HARVEST_PATH = join(ROOT, "tools", ".harvest-state.json");
const TRAITS_PATH = join(ROOT, "tools", ".traits-linked.json");
const FULL_MODE = existsSync(HARVEST_PATH) && !process.argv.includes("--bootstrap");

// ---------------------------------------------------------------------------
// Quellen einlesen

const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const ARCH = archWin.ARCHETYPES;
// Name -> Schluessel (identisch zu FORM_KEY_BY_NAME in app/index.html, Schritt 0.1) —
// gebraucht, um im FULL-Modus den "novum"-Sonderfall von matchArchetype() aufzuloesen
// (dort ist `key` absichtlich "novum", aber `alt` der Name des naechsten Verwandten).
const NAME_TO_KEY = Object.fromEntries(ARCH.forms.map((f) => [f.n, f.key]));
const ARCH_KEY_BY_NAME = new Set(ARCH.forms.map((f) => f.key));

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

// ---------------------------------------------------------------------------
// FULL-MODUS (Schritt 1.4) — montiert die bereits geprueften Bausteine aus
// 1.1 (Ernte) + 1.2 (Kladen-Regeln) + 1.3 (Imputation/Habitat-Rueckwaertslauf) zum
// vollen Katalog. Reine Zusammensetzung: keine neue Platzierungslogik hier.

/** "Genus species" (klein) -> massG aus PanTHERIA, fuer traitsToGenes() (Stufe a). */
function loadTraitLookup() {
  if (!existsSync(TRAITS_PATH)) return new Map();
  const linked = JSON.parse(readFileSync(TRAITS_PATH, "utf-8"));
  const m = new Map();
  for (const [k, v] of Object.entries(linked.pantheria || {})) if (v.massG) m.set(k, { massG: v.massG });
  return m;
}

/** Nur Stufe (a)+(b), OHNE Habitat-Rueckwaertslauf — das ist der Korpus fuer Stufe (c)
 *  (s. tools/lib/impute.mjs buildCorpus-Doku: "die (a)+(b)-Genome ALLER geernteten
 *  Arten"). Stufe (d) darf hier NICHT einfliessen, sonst imputiert Stufe (c) aus
 *  bereits geratenen Werten statt aus gemessenen/abgeleiteten — ein sich selbst
 *  bestaetigender Fehler. */
function computeAB(traitValues, cladeResult) {
  const g = new Array(GENES.length).fill(null);
  for (const [gene, value] of Object.entries(traitsToGenes(traitValues)))
    g[GENE_INDEX[gene]] = Math.max(0, Math.min(1, value));
  if (cladeResult?.genome)
    for (let i = 0; i < GENES.length; i++)
      if (g[i] === null && cladeResult.genome[i] !== null && cladeResult.genome[i] !== undefined)
        g[i] = cladeResult.genome[i];
  return g;
}

async function buildFullEntries() {
  const harvest = JSON.parse(readFileSync(HARVEST_PATH, "utf-8"));
  let species = Object.entries(harvest.species).filter(([, v]) => v.lineage && v.lineage.length);
  const skippedNoLineage = Object.keys(harvest.species).length - species.length;
  // Nur fuer die Entwicklung: --limit=N reduziert auf eine Stichprobe (schneller Zyklus
  // beim Testen). Ohne das Flag laeuft der volle Bestand.
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  if (limitArg) species = species.slice(0, Number(limitArg.split("=")[1]));
  const traitLookup = loadTraitLookup();
  const core = loadAppCore("build-catalog");

  console.log(`Full-Modus: ${species.length} Arten mit Kette (${skippedNoLineage} ohne Kette übersprungen).`);

  // Durchlauf 1: (a)+(b) je Art — Grundlage sowohl fuer den Korpus (Stufe c) als auch
  // fuer die spaetere volle Platzierung (kein zweites Mal applyCladeRules() aufrufen).
  const pre = species.map(([qid, v]) => {
    const parts = (v.sci || "").split(" ");
    const traitValues = parts.length >= 2 ? traitLookup.get(`${parts[0]} ${parts[1]}`.toLowerCase()) || null : null;
    const cladeResult = applyCladeRules(v.lineage, v.rank, { selfQid: qid });
    return { qid, v, traitValues, cladeResult, ab: computeAB(traitValues, cladeResult) };
  });

  const corpus = buildCorpus(pre.map((p) => ({ lineage: p.v.lineage, genome: p.ab })));
  console.log(`Korpus für Stufe (c): ${corpus.size} Vorfahren-Knoten mit ≥1 belegtem Gen.`);

  // Durchlauf 2: volle Platzierung (a+b+c+d) + Bauplan-Gruppe je Art.
  const entries = [];
  const confHist = [0, 0, 0, 0];
  const coreLowSignal = []; // Arten, deren KERN-Gene (0-9) ueberwiegend aus (d) stammen
  let done = 0;
  for (const p of pre) {
    // placeSpecies() erwartet FERTIGE Gen-Werte (traitsToGenes()-Ausgabe), nicht das
    // rohe Merkmal — sonst versucht sie GENE_INDEX["massG"] nachzuschlagen und findet
    // nichts (Stufe a faellt dann still auf 0 zurueck, ohne Fehler).
    const placed = placeSpecies(traitsToGenes(p.traitValues), p.cladeResult, null, { lineage: p.v.lineage, corpus });
    const habEnv = habitatOf(p.v.lineage, null).env;
    const t = placed.genome; // 0..1, vollstaendig belegt
    const match = core.matchArchetype(t, habEnv);
    // Regulaerer Fall: `key` ist schon ein echter Bauplan-Schluessel. Sonderfall
    // "novum" (Abstand > novelThreshold, s. app/index.html matchArchetype()): dort
    // ist `alt` der ANZEIGENAME des naechsten Verwandten (nicht dessen Schluessel) —
    // fuer die Katalog-ZUORDNUNG (nicht die spaetere Live-Benennung) reicht der
    // naechste Verwandte trotzdem als Gruppe, ueber NAME_TO_KEY aufgeloest.
    const group = ARCH_KEY_BY_NAME.has(match.key) ? match.key : (NAME_TO_KEY[match.alt] || match.key);

    for (const c of placed.conf) confHist[c]++;
    const coreConf2plus = placed.conf.slice(0, 10).filter((c) => c >= 2).length;
    if (coreConf2plus <= 2) coreLowSignal.push(p.qid);

    entries.push({
      qid: p.qid,
      // Bevorzugt der ECHTE Artikeltitel als deutscher Anzeigename: die Wikidata-
      // Beschriftung (`label`, SPARQL-Ernte) faellt bei vielen Arten auf den
      // wissenschaftlichen Namen zurueck, obwohl ein Artikel mit deutschem
      // Trivialnamen existiert (gemessen: "Hyla chrysoscelis" als Label, aber
      // Artikel "Copes Grauer Laubfrosch") — `wiki` (tools/wikidata-sitelinks.mjs)
      // ist der verlaesslichere Beleg dafuer.
      de: (p.v.wiki && p.v.wiki !== p.v.sci) ? p.v.wiki
        : (p.v.label && p.v.label !== p.v.sci ? p.v.label : null),
      sci: p.v.sci,
      wiki: p.v.wiki || p.v.sci, // echter dewiki-Artikeltitel (tools/wikidata-sitelinks.mjs); sci nur als Notnagel
      group,
      rank: p.v.rank,
      lineage: p.v.lineage.slice(0, 12), // s. CORPUS_DEPTH in impute.mjs — mehr wird nirgends gelesen
      genome: t.map((x) => Math.max(0, Math.min(255, Math.round(x * 255)))),
      conf: placed.conf,
      src: "wikidata-full",
    });
    if (++done % 2000 === 0) process.stdout.write(`\r  ${done}/${pre.length} platziert …`);
  }
  process.stdout.write(`\r  ${pre.length}/${pre.length} platziert.\n`);

  console.log(`Konfidenz gesamt (${pre.length * GENES.length} Gen-Werte): `
    + `conf3 ${(100 * confHist[3] / (pre.length * GENES.length)).toFixed(1)}% · `
    + `conf2 ${(100 * confHist[2] / (pre.length * GENES.length)).toFixed(1)}% · `
    + `conf1 ${(100 * confHist[1] / (pre.length * GENES.length)).toFixed(1)}% · `
    + `conf0 ${(100 * confHist[0] / (pre.length * GENES.length)).toFixed(1)}%`);
  console.log(`Arten mit ≤2 von 10 Kern-Genen auf Konfidenz ≥2 (fast reiner Habitat-Rückwärtslauf): `
    + `${coreLowSignal.length}/${pre.length} (${(100 * coreLowSignal.length / pre.length).toFixed(1)}%) — `
    + `NICHT ausgeschlossen, s. Aufnahmeschwelle-Diskussion im Plan.`);

  // Ehrlicher Befund statt verschwiegener Kollaps: ohne gemessene Merkmale (Stufe a
  // deckt praktisch nur Saeuger-Masse) faellt die Platzierung innerhalb eines
  // Bauplans oft auf denselben Kladen-/Imputations-Punkt zurueck — mehrere reale
  // Arten teilen sich dann BUCHSTAEBLICH dasselbe Genom. Stufe 2 waehlt unter ihnen
  // dann nicht mehr nach Naehe, sondern per Sortier-Zufall. Wird gemessen, nicht
  // erfunden behoben — s. „Bewusst offen" im Plan.
  const byGroupGenome = new Map();
  for (const e of entries) {
    const key = e.group + "|" + e.genome.join(",");
    byGroupGenome.set(key, (byGroupGenome.get(key) || 0) + 1);
  }
  const clones = entries.length - byGroupGenome.size;
  console.log(`Arten mit einem genom-identischen Zwilling in derselben Gruppe: `
    + `${clones}/${entries.length} (${(100 * clones / entries.length).toFixed(1)}%) — `
    + `${byGroupGenome.size} unterscheidbare Punkte insgesamt.`);

  return entries;
}

let entries = [];
const missing = [];

if (FULL_MODE) {
  entries = await buildFullEntries();
} else {
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
}

// Nach Bauplan-Gruppe sortieren: der Stufe-2-Matcher liest immer nur EINE Gruppe,
// zusammenhaengende Bloecke machen das spaetere Sharding zu einem Slice.
entries.sort((a, b) => a.group.localeCompare(b.group) || (a.de || "").localeCompare(b.de || ""));

const byGroup = {};
for (let i = 0; i < entries.length; i++) (byGroup[entries[i].group] ||= []).push(i);

const STAGE = FULL_MODE ? "full" : "bootstrap";
const stageComment = FULL_MODE
  ? `// Stand: FULL (Schritt 1.4). ${entries.length} Arten aus der Wikidata-Ernte (1.1),
// Kladen-Regelwerk (1.2) und Imputation/Habitat-Rueckwaertslauf (1.3) — s.
// docs/artenkatalog-plan.md. Konfidenz je Gen gemessen, nicht angenommen (0-3, s. u.).
// Ab dieser Stufe kippt CATALOG_NAMES in app/index.html: die Live-Benennung zeigt die
// naechste reale Art statt des Bauplan-Namens (Plan Abschnitt 2/3).`
  : `// Stand: BOOTSTRAP (Schritt 0.2). ${entries.length} Eintraege aus den kuratierten
// „≈ in echt"-Zuordnungen in app/exemplar.js; QID/sci/Rang/Elternkette live aus Wikidata.
// Die Genom-Positionen sind noch Bauplan-Prototypen (Konfidenz 2 = aus der Klade
// abgeleitet), NICHT gemessen — das ersetzt Schritt 1.2/1.3.`;

const out = `// AUTO-GENERIERT von tools/build-catalog.mjs — nicht von Hand editieren.
//
// Der reale Artenkatalog: jede Zeile ein belegtes Lebewesen mit Wikipedia-Artikel.
// Stufe 1 (matchArchetype) benennt die BAUPLAN-GRUPPE, Stufe 2 sucht darin die naechste
// reale Art — s. docs/artenkatalog-plan.md Abschnitt 3.
//
${stageComment}
//
// genome: 25 Gene, je 0..255 (Gen*255 gerundet). Aufloesung 1/255 ~ 0.004 — weit unter
// novelThreshold (0.15) und Mutations-SD (0.06), s. Plan Abschnitt 4.
// conf:   Herkunft je Gen — 3 gemessen · 2 aus Klade · 1 imputiert · 0 aus Habitat.
window.CATALOG = {
  version: 1,
  stage: "${STAGE}",
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
