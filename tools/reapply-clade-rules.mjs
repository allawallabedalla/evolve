// ============================================================================
// reapply-clade-rules — wendet das KORRIGIERTE Kladen-Regelwerk auf den bereits
// gebauten app/catalog.js an, ohne die ganze Wikidata-Ernte zu wiederholen.
//
// Warum es das gibt: der volle Neubau (tools/build-catalog.mjs) braucht
// tools/.harvest-state.json — ein gitignoriertes Artefakt der ~30k-Arten-Ernte.
// Ohne diese Datei faellt build-catalog in den 65-Eintraege-Bootstrap zurueck und
// wuerde den Katalog zerstoeren. Eine Regelkorrektur waere damit erst nach einer
// mehrstuendigen Neuernte wirksam. Der Katalog traegt aber pro Eintrag `lineage`
// (Vorfahrenmenge) UND `conf` je Gen — genug, um die Kladen-Stufe gezielt neu zu
// rechnen.
//
// STRIKT MINIMAL: geschrieben werden NUR Gene, die laut `conf` bereits aus der
// Klade stammen (conf == 2). Gemessene Werte (3) bleiben unberuehrt, ebenso
// imputierte (1) und aus dem Habitat geschaetzte (0) — deren Herleitung braucht
// den Gesamtkorpus und laesst sich hier nicht reproduzieren. Ein Gen, das eine
// neue Regel erstmals abdeckt, wird also NICHT aufgewertet; das bleibt dem
// echten Neubau vorbehalten.
//
// Aufruf:
//   node tools/reapply-clade-rules.mjs           (Trockenlauf, zeigt nur an)
//   node tools/reapply-clade-rules.mjs --write   (schreibt app/catalog.js)
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCladeRules, GENE_INDEX, CLADE_CONFIDENCE } from "./lib/clade-rules.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const CAT_PATH = join(ROOT, "app", "catalog.js");

// Katalog laden, indem die Datei als Skript mit gestubbtem `window` ausgefuehrt wird —
// robuster als Regex ueber 30k Eintraege.
const src = readFileSync(CAT_PATH, "utf-8");
const win = {};
new Function("window", src)(win);
const CAT = win.CATALOG;
if (!CAT || !Array.isArray(CAT.entries)) { console.error("app/catalog.js nicht lesbar."); process.exit(1); }

// Die Gen-Reihenfolge des Katalogs muss zur Regel-Reihenfolge passen, sonst
// landen Werte im falschen Gen.
for (const [gene, idx] of Object.entries(GENE_INDEX)) {
  if (CAT.genes[idx] !== gene) {
    console.error(`Gen-Reihenfolge weicht ab: Katalog[${idx}]="${CAT.genes[idx]}", Regelwerk="${gene}". Abbruch.`);
    process.exit(1);
  }
}

const changes = [];           // je geaendertem Gen ein Eintrag
const perGene = {};           // Gen -> Anzahl
let touched = 0;

for (const e of CAT.entries) {
  const applied = applyCladeRules(e.lineage || [], e.rank || null, { selfQid: e.qid });
  let entryTouched = false;
  for (const [gene, value] of Object.entries(applied.byGene)) {
    const i = GENE_INDEX[gene];
    if (e.conf[i] !== CLADE_CONFIDENCE) continue;      // nur was schon aus der Klade kam
    const next = Math.round(value * 255);
    if (next === e.genome[i]) continue;
    changes.push({ sci: e.sci, de: e.de, gene, from: e.genome[i] / 255, to: value });
    perGene[gene] = (perGene[gene] || 0) + 1;
    e.genome[i] = next;
    entryTouched = true;
  }
  if (entryTouched) touched++;
}

console.log(`reapply-clade-rules — ${CAT.entries.length} Eintraege geprueft`);
console.log(`  geaenderte Eintraege: ${touched}   geaenderte Gen-Werte: ${changes.length}\n`);
if (Object.keys(perGene).length) {
  console.log("  je Gen:");
  for (const [g, n] of Object.entries(perGene).sort((a, b) => b[1] - a[1]))
    console.log(`    ${g.padEnd(16)} ${n}`);
}
const sample = changes.slice(0, 12);
if (sample.length) {
  console.log("\n  Beispiele:");
  for (const c of sample)
    console.log(`    ${(c.de || c.sci).padEnd(30)} ${c.gene.padEnd(12)} ${c.from.toFixed(3)} -> ${c.to.toFixed(3)}`);
}

// ---------------------------------------------------------------------------
// SCHUTZ: Laesst sich die Kladen-Stufe aus den gespeicherten Daten ueberhaupt
// reproduzieren? Der Katalog kappt `lineage` auf 12 QIDs (29.728 von 30.286
// Eintraegen haben exakt 12), die echte Kette ist aber 40+ lang — die oberen
// Taxa (Mammalia, Chordata, Animalia ...) fehlen also. Mit der gekappten Kette
// treffen deutlich WENIGER Regeln als beim Bau, das Ergebnis waere kein
// korrigierter Katalog, sondern ein kaputter.
//
// Messbar gemacht statt vorausgesetzt: wenn die Neuanwendung einen unplausibel
// grossen Teil des Katalogs anfasst, kann die Eingabe den Bau nicht reproduzieren.
// Eine echte Einzelregel-Korrektur beruehrt Promille, nicht Prozent.
const touchedPct = touched / CAT.entries.length * 100;
const LIMIT = 5;
if (touchedPct > LIMIT) {
  console.log(`\n  ✗ ABBRUCH: ${touchedPct.toFixed(1)} % der Eintraege wuerden sich aendern (Grenze ${LIMIT} %).`);
  console.log("    Die gespeicherte Vorfahrenkette ist auf 12 QIDs gekappt und enthaelt die");
  console.log("    oberen Taxa nicht mehr — die Kladen-Stufe laesst sich daraus NICHT");
  console.log("    rekonstruieren. Eine Regelkorrektur wird erst mit einem echten Neubau");
  console.log("    wirksam (tools/build-catalog.mjs mit tools/.harvest-state.json, d. h.");
  console.log("    nach einer neuen Wikidata-Ernte). Katalog bleibt unveraendert.");
  process.exit(WRITE ? 1 : 0);
}

if (!WRITE) { console.log("\n  Trockenlauf — nichts geschrieben. Mit --write anwenden."); process.exit(0); }

// Header unveraendert uebernehmen (alles bis zur window.CATALOG-Zeile), damit die
// Datei formatgleich zu tools/build-catalog.mjs bleibt.
const head = src.slice(0, src.indexOf("window.CATALOG = {"));
const out = `${head}window.CATALOG = {
  version: ${JSON.stringify(CAT.version)},
  stage: ${JSON.stringify(CAT.stage)},
  genes: ${JSON.stringify(CAT.genes)},
  // Index der Eintraege je Bauplan-Gruppe — Stufe 2 durchsucht nur diese Teilmenge.
  byGroup: ${JSON.stringify(CAT.byGroup)},
  entries: [
${CAT.entries.map((e) => "    " + JSON.stringify(e)).join(",\n")}
  ],
};
`;
writeFileSync(CAT_PATH, out);
console.log(`\n  app/catalog.js geschrieben.`);
