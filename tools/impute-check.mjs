// impute-check — Pruefstand fuer Schritt 1.3 des Artenkatalog-Plans
// (docs/artenkatalog-plan.md Abschnitt 5, Stufen (c) und (d) · BACKLOG Punkt 12).
//
// BEWUSST NICHT IN package.json REGISTRIERT: dieses Skript braucht
// tools/.harvest-state.json MIT Elterntaxon-Ketten (tools/wikidata-lineage.mjs) und
// optional tools/.traits-linked.json (tools/build-traits.mjs, haengt an einer
// Python-Abhaengigkeit). Beides sind Artefakte, keine eingecheckten Dateien — als
// Pflicht-Gate wuerde es auf einem frischen Klon rot leuchten, ohne dass etwas kaputt
// ist. Dieselbe Begruendung wie bei tools/build-traits.mjs.
//
// Vier Pruefungen:
//
//   I1  HARTE REGEL       20 zufaellige Arten mit Kladen-Treffern: jeder Wert aus
//                         Stufe (a)/(b) muss BITGLEICH durch placeSpecies() laufen,
//                         und seine Konfidenz muss 3 bzw. 2 bleiben. Das ist die
//                         nicht verhandelbare Bedingung aus Plan Abschnitt 5.
//   I2  VOLLSTAENDIGKEIT  Kein Gen bleibt am Ende `null`, jede Konfidenz liegt in 0..3.
//   I3  KONFIDENZ         Verteilung ueber 200 Arten: wie viele Gene landen bei
//                         conf 3/2/1/0? Die Zahl beantwortet die eigentliche Frage —
//                         ist Stufe (d) eine Notloesung fuer wenige Gene oder traegt
//                         sie den Grossteil?
//   I4  DETERMINISMUS     Zweimal aufgerufen -> bitgleich (kein Rauschen, kein
//                         Cache-Effekt, der das Ergebnis verschiebt).
//   I5  HABITAT-REGELWERK Jede Regel hat eine Begruendung, und jede QID darin steht
//                         schon in clade-rules.mjs — dort ist sie gegen Wikidata
//                         geprueft. Damit kann in dieser Datei keine geratene QID
//                         hereinkommen (der Fehler, der in Schritt 1.1 „Taylor Dayne“
//                         statt einer Klade traf, s. Plan 1.1).
//
// Aufruf:  npm run build && node tools/impute-check.mjs
//          node tools/impute-check.mjs --n=500     (groessere Stichprobe fuer I3)

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCladeRules, GENES, RULE_QIDS } from "./lib/clade-rules.mjs";
import { placeSpecies, buildCorpus, traitsToGenes, backfillCacheStats, backfillByHabitat,
         habitatOf, HABITAT_RULES } from "./lib/impute.mjs";
import { loadLineageCache, chainOf } from "./lib/lineage.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "tools", ".harvest-state.json");
const TRAITS = join(ROOT, "tools", ".traits-linked.json");
const NG = GENES.length;

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const SAMPLE = Number(arg("n") || 200);

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); return cond ? "OK" : "VERFEHLT"; };

console.log("============================================================");
console.log("  impute-check — Schritt 1.3: Imputation + Habitat-Rueckwaertslauf");
console.log("============================================================\n");

if (!existsSync(STATE)) {
  console.error("tools/.harvest-state.json fehlt — erst `npm run wikidata-harvest` laufen lassen.");
  process.exit(1);
}
const state = JSON.parse(readFileSync(STATE, "utf-8"));
// Ketten bevorzugt aus dem Ernte-Zustand, sonst aus tools/.lineage-cache.json — solange
// die Ernte laeuft, kann sie das Feld `lineage` im Zustand jederzeit wieder ueberschreiben
// (sie schreibt aus ihrem eigenen Speicherabbild). Der Cache ist die Quelle der Wahrheit,
// s. tools/lib/lineage.mjs.
const linCache = loadLineageCache();
let fromCache = 0;
const all = Object.entries(state.species || {}).map(([qid, r]) => {
  let lineage = Array.isArray(r.lineage) && r.lineage.length ? r.lineage : null;
  if (!lineage && linCache.parent[qid]) { lineage = chainOf(linCache, qid); fromCache++; }
  return { qid, ...r, lineage, rank: r.rank || linCache.rank[qid] || null };
});
const withLineage = all.filter((s) => s.lineage && s.lineage.length);
if (!withLineage.length) {
  console.error("Keine Art traegt eine Elterntaxon-Kette — erst `node tools/wikidata-lineage.mjs` laufen lassen.");
  process.exit(1);
}
console.log(`Datenlage: ${all.length} geerntete Arten, ${withLineage.length} mit Elterntaxon-Kette `
  + `(${fromCache} davon aus tools/.lineage-cache.json nachgeschlagen).`);

// ---------------------------------------------------------------------------
// Merkmale (Stufe a) anbinden, soweit vorhanden.
const traitTables = existsSync(TRAITS) ? JSON.parse(readFileSync(TRAITS, "utf-8")) : null;
const binom = (sci) => { const p = (sci || "").split(" "); return p.length >= 2 ? `${p[0]} ${p[1]}`.toLowerCase() : null; };
function traitsFor(s) {
  if (!traitTables) return null;
  const k = binom(s.sci);
  if (!k) return null;
  const rec = traitTables.pantheria?.[k];
  return rec || null;
}

// ---------------------------------------------------------------------------
// (a)+(b) fuer ALLE Arten — das ist die Grundlage, aus der Stufe (c) ihren Korpus
// zieht (Plan: "arbeite mit dem, was aus (a)+(b) bereits berechenbar ist").
console.log("Stufe (a)+(b) fuer alle Arten mit Kette …");
let withMass = 0;
const base = withLineage.map((s) => {
  const clade = applyCladeRules(s.lineage, s.rank || null, { selfQid: s.qid });
  const tg = traitsToGenes(traitsFor(s));
  if (tg.size !== undefined) withMass++;
  const genome = clade.genome.slice();
  for (const [g, v] of Object.entries(tg)) genome[GENES.indexOf(g)] = v;
  return { ...s, clade, traitGenes: tg, genome };
});
console.log(`  ${withMass} Arten mit gemessener Koerpermasse (PanTHERIA) -> Stufe (a).`);
const cladeHits = base.filter((s) => s.clade.count > 0);
console.log(`  ${cladeHits.length} Arten mit mindestens einem Kladen-Treffer `
  + `(${(100 * cladeHits.length / base.length).toFixed(1)} %), im Mittel `
  + `${(base.reduce((a, s) => a + s.clade.count, 0) / base.length).toFixed(1)} von 25 Genen aus (a)+(b).`);

const corpus = buildCorpus(base);
console.log(`  Korpus: ${corpus.size} Vorfahren-Knoten mit belegten Geschwistern.\n`);

// Deterministische Stichprobe (kein Math.random): ein einfacher LCG mit festem Seed —
// „zufaellig gewaehlt“ soll heissen „nicht handverlesen“, nicht „bei jedem Lauf anders“.
// Sonst waere ein roter Lauf nicht reproduzierbar.
function sampleOf(pool, n, seed = 20260801) {
  let x = seed;
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const j = x % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => pool[i]);
}

const place = (s) => placeSpecies(s.traitGenes, s.clade, null,
  { lineage: s.lineage, corpus });

// ---------------------------------------------------------------------------
// I1 — die harte Regel
// ---------------------------------------------------------------------------
console.log("I1 · Harte Regel: (c)/(d) ueberschreiben nie (a)/(b)\n");
const i1pool = sampleOf(cladeHits, 20);
let checkedGenes = 0, violations = 0;
for (const s of i1pool) {
  const r = place(s);
  for (let i = 0; i < NG; i++) {
    const want = s.traitGenes[GENES[i]] !== undefined ? s.traitGenes[GENES[i]] : s.clade.genome[i];
    if (want === null || want === undefined) continue;
    const wantConf = s.traitGenes[GENES[i]] !== undefined ? 3 : 2;
    checkedGenes++;
    // BITGLEICH, nicht „nahe genug“: eine Toleranz waere hier die Hintertuer, durch die
    // eine stille Verschiebung schluepft.
    if (r.genome[i] !== want || r.conf[i] !== wantConf) {
      violations++;
      if (violations <= 5)
        console.log(`  ! ${s.label || s.qid} · ${GENES[i]}: erwartet ${want} (conf ${wantConf}), `
          + `bekommen ${r.genome[i]} (conf ${r.conf[i]})`);
    }
  }
}
console.log(`  ${i1pool.length} Arten, ${checkedGenes} Gene aus (a)/(b) geprueft, `
  + `${violations} Abweichungen — ${ok(violations === 0, "I1: (c)/(d) hat einen (a)/(b)-Wert veraendert")}`);
console.log(`  Beispiele: ` + i1pool.slice(0, 5).map((s) => `${s.label || s.qid} (${s.clade.count} Gene)`).join(", ") + "\n");

// ---------------------------------------------------------------------------
// I2/I3 — Vollstaendigkeit und Konfidenz-Verteilung
// ---------------------------------------------------------------------------
console.log(`I2/I3 · Vollstaendigkeit und Konfidenz-Verteilung (Stichprobe ${SAMPLE})\n`);
const pool = sampleOf(base, Math.min(SAMPLE, base.length));
const tally = [0, 0, 0, 0];                     // conf 0..3, ueber alle Gene summiert
const perGene = GENES.map(() => [0, 0, 0, 0]);
const habits = new Map();
let holes = 0, badConf = 0;
// Zwei Kennzahlen, ohne die der Anteil conf 0 nicht lesbar ist:
//  · coreLow — wieviele der ZEHN Kern-Gene (0-9) bei Konfidenz 0/1 landen. Genau das
//              waere der Alarmfall: der Bauplan selbst kaeme dann aus dem Habitat statt
//              aus Messung und Klade. Gate bei 2 % (nicht 0 %: einzelne Kladen sagen zu
//              `armor` nichts, und dort ist der Geschwister-Median die richtige Antwort).
//  · dOff    — wieviele conf-0-Werte die Aussage „Gen aus“ tragen (<= 0.05). Das ist
//              KEIN Rueckfall auf den Ruhewert (0.12), sondern ein Ergebnis: in einer
//              Umwelt ohne den passenden Stressor ist das Gen reine Kostenlast, und die
//              Engine wirft es ab. Der Rest sind echte, vom Habitat getragene Werte.
const CORE_LOW_MAX = 0.02;
let coreLow = 0, coreD = 0, dOff = 0, dReal = 0;
const t0 = Date.now();
for (const s of pool) {
  const r = place(s);
  habits.set(r.habitat, (habits.get(r.habitat) || 0) + 1);
  for (let i = 0; i < NG; i++) {
    const v = r.genome[i], c = r.conf[i];
    if (v === null || v === undefined || !Number.isFinite(v)) holes++;
    if (!(c >= 0 && c <= 3)) { badConf++; continue; }
    tally[c]++; perGene[i][c]++;
    if (i < 10 && c <= 1) { coreLow++; if (c === 0) coreD++; }
    if (c === 0) (v <= 0.05 ? dOff++ : dReal++);
  }
}
const ms = Date.now() - t0;
console.log(`  ${ok(holes === 0, "I2: es blieb ein Gen ohne Wert")} — ${holes} Gene ohne Wert, `
  + `${badConf} mit ungueltiger Konfidenz. `
  + `${(ms / pool.length).toFixed(1)} ms je Art (${backfillCacheStats().size} Konvergenzen gerechnet).`);

const total = tally.reduce((a, b) => a + b, 0);
const LABEL = ["(d) Habitat-Rueckwaertslauf", "(c) hierarchisch imputiert",
               "(b) aus der Klade", "(a) direkt gemessen"];
console.log("\n  Konfidenz  Herkunft                        Gene      Anteil");
for (let c = 3; c >= 0; c--)
  console.log(`     ${c}       ${LABEL[c].padEnd(30)} ${String(tally[c]).padStart(6)}   `
    + `${(100 * tally[c] / total).toFixed(1).padStart(6)} %`);
console.log(`             ${"gesamt".padEnd(30)} ${String(total).padStart(6)}`);
const coreFrac = coreLow / (pool.length * 10);
console.log(`\n  Kern-Gene (0-9): ${coreLow} von ${pool.length * 10} (${(100 * coreFrac).toFixed(2)} %) `
  + `mit Konfidenz 0 oder 1 — ${ok(coreFrac <= CORE_LOW_MAX, `I3: ${(100 * coreFrac).toFixed(2)} % der Kern-Gene kamen aus (c)/(d), erlaubt sind ${100 * CORE_LOW_MAX} %`)}. `
  + `Der Bauplan selbst haengt damit praktisch vollstaendig an gemessenen und kladen-abgeleiteten Werten. `
  + `Davon aus Stufe (d): ${coreD} — ${ok(coreD === 0, "I3: Stufe (d) hat ein Kern-Gen gefuellt")}.`);
console.log(`  Von den ${tally[0]} conf-0-Genen tragen ${dOff} `
  + `(${(100 * dOff / Math.max(1, tally[0])).toFixed(1)} %) die Aussage „Gen aus“ (<= 0.05) — `
  + `der Rueckwaertslauf wirft in einer Umwelt ohne den passenden Stressor die Resistenz ab, `
  + `statt sie beim Ruhewert 0.12 als Phantom-Unterhalt stehen zu lassen. `
  + `${dReal} conf-0-Gene tragen einen vom Habitat getragenen Wert darueber.`);

console.log("\n  Je Gen (Anteil conf 0 = allein aus dem Habitat geschaetzt):");
const rows = GENES.map((g, i) => [g, perGene[i][0] / pool.length, perGene[i]]);
for (const [g, frac, p] of rows)
  console.log(`    ${g.padEnd(14)} conf3 ${String(p[3]).padStart(4)}  conf2 ${String(p[2]).padStart(4)}  `
    + `conf1 ${String(p[1]).padStart(4)}  conf0 ${String(p[0]).padStart(4)}   (${(100 * frac).toFixed(0)} % nur Habitat)`);

console.log("\n  Habitat-Zuordnung der Stichprobe:");
for (const [h, n] of [...habits].sort((a, b) => b[1] - a[1]))
  console.log(`    ${h.padEnd(22)} ${String(n).padStart(4)}`);

// Ablation: was traegt Stufe (c) wirklich? Ohne Korpus muessten dieselben Gene bei (d)
// landen — die Differenz ist der gemessene Beitrag der Imputation (Plan 1.3, Gate).
let cWith = 0, cWithout = 0;
for (const s of pool) {
  cWith += place(s).stages.c;
  cWithout += placeSpecies(s.traitGenes, s.clade, null, { lineage: s.lineage }).stages.c;
}
console.log(`\n  Ablation Stufe (c): mit Korpus ${cWith} imputierte Gene, ohne Korpus ${cWithout} `
  + `(Differenz ${cWith - cWithout} = gemessener Beitrag der Imputation).`);

// ---------------------------------------------------------------------------
// I4 — Determinismus
// ---------------------------------------------------------------------------
console.log("\nI4 · Determinismus\n");
// Zwei Ebenen, weil die obere allein zu wenig prueft: placeSpecies() zweimal aufzurufen
// trifft beim zweiten Mal den Konvergenz-Cache und waere damit trivial gleich. Deshalb
// zusaetzlich der Rueckwaertslauf SELBST, am Cache vorbei.
let drift = 0, driftRaw = 0;
for (const s of sampleOf(base, 30, 777)) {
  const a = place(s), b = place(s);
  for (let i = 0; i < NG; i++) if (a.genome[i] !== b.genome[i] || a.conf[i] !== b.conf[i]) drift++;
  const hab = habitatOf(s.lineage, null);
  const x = backfillByHabitat(hab.env, s.genome), y = backfillByHabitat(hab.env, s.genome);
  for (let i = 0; i < NG; i++) if (x[i] !== y[i]) driftRaw++;
}
console.log(`  placeSpecies() zweimal: ${drift} abweichende Gene — `
  + `${ok(drift === 0, "I4: zwei Laeufe lieferten unterschiedliche Genome")}`);
console.log(`  backfillByHabitat() zweimal (ohne Cache): ${driftRaw} abweichende Gene — `
  + `${ok(driftRaw === 0, "I4: der Rueckwaertslauf selbst ist nicht deterministisch")}`);

// ---------------------------------------------------------------------------
// I5 — Habitat-Regelwerk
// ---------------------------------------------------------------------------
console.log("\nI5 · Habitat-Regelwerk\n");
const noReason = HABITAT_RULES.filter((r) => !r.reason || r.reason.length < 40);
const unknownQids = [];
for (const r of HABITAT_RULES)
  for (const q of Array.isArray(r.qid) ? r.qid : [r.qid])
    if (!RULE_QIDS.has(q)) unknownQids.push(q);
console.log(`  ${HABITAT_RULES.length} Regeln · ${noReason.length} ohne Begruendung — `
  + `${ok(noReason.length === 0, "I5: eine Habitat-Regel ohne Begruendung")}`);
console.log(`  ${unknownQids.length} QIDs, die nicht schon in clade-rules.mjs stehen `
  + `${unknownQids.length ? "(" + unknownQids.join(", ") + ") " : ""}— `
  + `${ok(unknownQids.length === 0, "I5: Habitat-Regel fuehrt eine in clade-rules.mjs unbekannte QID ein")}`);

console.log("\n============================================================");
if (fails.length) { console.log("  FEHLGESCHLAGEN:\n   · " + fails.join("\n   · ")); process.exit(1); }
console.log("  Alle Pruefungen bestanden.");
console.log("============================================================");
