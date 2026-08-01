// Prüfstand für app/catalog.js (BACKLOG Punkt 12, Schritt 0.2 — docs/artenkatalog-plan.md).
//
// Der Katalog ist ein erzeugtes Artefakt und wird deshalb wie eines geprueft: Form,
// Schluessel-Integritaet gegen die Bauplan-Gruppen, Sortier-Invariante fuers Sharding
// und ein Groessen-/Ladebudget. Der Prüfstand gilt unveraendert fuer den spaeteren
// echten Katalog aus Schritt 1.4 — nur die Zahlen darin wachsen.
//
//   C1  Kopf vollstaendig (version, stage, genes, byGroup, entries) und Gen-Liste
//       identisch zu app/archetypes.js — ein verschobenes Gen wuerde jede Position
//       still verdrehen.
//   C2  Jeder Eintrag formal gueltig: Genom 25x 0..255, Konfidenz 25x 0..3,
//       Wikipedia-Titel vorhanden, QID (wenn gesetzt) im Q-Format.
//   C3  Jede `group` ist ein echter Bauplan-Schluessel aus app/archetypes.js.
//   C4  byGroup stimmt exakt mit den Eintraegen ueberein (Index = Wahrheit fuers Sharding).
//   C5  Eintraege nach Gruppe zusammenhaengend sortiert — Voraussetzung dafuer, dass ein
//       Shard ein zusammenhaengender Slice ist und kein Streuzugriff.
//   C6  Keine QID zweimal in derselben Gruppe (dieselbe Art doppelt gelistet).
//   C7  Groessenbudget: der ausgelieferte Katalog muss ins Ladebudget passen.
//
// BERICHTET, aber kein Fehler: Gruppen ohne Eintrag (dort bleibt es beim Bauplan-Namen)
// und die Konfidenz-Verteilung. In der Bootstrap-Stufe ist beides erwartbar schwach —
// der Prüfstand soll das sichtbar machen, nicht verbieten.

import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZE_BUDGET_KB = 4096;   // ~4 MB: bei 20.000 Arten die Obergrenze aus Plan Abschnitt 4

const win = {};
new Function("window", readFileSync(join(ROOT, "app", "catalog.js"), "utf-8"))(win);
const CAT = win.CATALOG;

const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const ARCH = archWin.ARCHETYPES;
const groupKeys = new Set(ARCH.forms.map((f) => f.key));

const problems = [];
const note = (code, msg) => problems.push(`${code}  ${msg}`);
const NG = ARCH.genes.length;

// C1 — Kopf
for (const k of ["version", "stage", "genes", "byGroup", "entries"])
  if (CAT[k] === undefined) note("C1", `Kopf-Feld "${k}" fehlt.`);
if (JSON.stringify(CAT.genes) !== JSON.stringify(ARCH.genes))
  note("C1", "Gen-Liste weicht von app/archetypes.js ab — Positionen waeren verdreht.");

// C2/C3 — Eintraege
const entries = CAT.entries || [];
for (let i = 0; i < entries.length; i++) {
  const e = entries[i], at = `Eintrag ${i} (${e.de || e.wiki || "?"})`;
  if (!Array.isArray(e.genome) || e.genome.length !== NG)
    note("C2", `${at}: Genom hat ${e.genome?.length} statt ${NG} Werte.`);
  else if (e.genome.some((v) => !Number.isInteger(v) || v < 0 || v > 255))
    note("C2", `${at}: Genom-Wert ausserhalb 0..255 oder nicht ganzzahlig.`);
  if (!Array.isArray(e.conf) || e.conf.length !== NG)
    note("C2", `${at}: Konfidenz hat ${e.conf?.length} statt ${NG} Werte.`);
  else if (e.conf.some((v) => !Number.isInteger(v) || v < 0 || v > 3))
    note("C2", `${at}: Konfidenz ausserhalb 0..3.`);
  if (!e.wiki) note("C2", `${at}: kein Wikipedia-Titel — der Beleg ist die ganze Idee.`);
  if (e.qid && !/^Q[1-9][0-9]*$/.test(e.qid)) note("C2", `${at}: QID "${e.qid}" nicht im Q-Format.`);
  if (!groupKeys.has(e.group)) note("C3", `${at}: Gruppe "${e.group}" ist kein Bauplan-Schluessel.`);
}

// C4 — byGroup gegen die Eintraege
const rebuilt = {};
entries.forEach((e, i) => (rebuilt[e.group] ||= []).push(i));
if (JSON.stringify(rebuilt) !== JSON.stringify(CAT.byGroup))
  note("C4", "byGroup stimmt nicht mit den Eintraegen ueberein.");

// C5 — Gruppen zusammenhaengend
const seenGroups = new Set();
let prev = null;
for (const e of entries) {
  if (e.group !== prev) {
    if (seenGroups.has(e.group)) note("C5", `Gruppe "${e.group}" liegt in mehreren Bloecken — Shard waere kein Slice.`);
    seenGroups.add(e.group);
    prev = e.group;
  }
}

// C6 — keine Art doppelt in einer Gruppe
const perGroup = {};
for (const e of entries) {
  if (!e.qid) continue;
  const set = (perGroup[e.group] ||= new Set());
  if (set.has(e.qid)) note("C6", `QID ${e.qid} steht zweimal in Gruppe "${e.group}".`);
  set.add(e.qid);
}

// C7 — Groessenbudget
const kb = statSync(join(ROOT, "app", "catalog.js")).size / 1024;
if (kb > SIZE_BUDGET_KB) note("C7", `Katalog ${kb.toFixed(0)} KB > Budget ${SIZE_BUDGET_KB} KB.`);

// --- Bericht ---
const withQid = entries.filter((e) => e.qid).length;
const withSci = entries.filter((e) => e.sci).length;
const emptyGroups = [...groupKeys].filter((k) => !CAT.byGroup[k]);
const confCount = [0, 0, 0, 0];
for (const e of entries) for (const c of e.conf || []) confCount[c]++;
const confTotal = confCount.reduce((a, b) => a + b, 0) || 1;

console.log(`catalog-check — Stufe "${CAT.stage}", ${entries.length} Eintraege in ${Object.keys(CAT.byGroup || {}).length} Bauplan-Gruppen, ${kb.toFixed(1)} KB`);
console.log(`  Beleg: ${withQid}/${entries.length} mit Wikidata-QID · ${withSci} mit wissenschaftlichem Namen`);
console.log(`  Konfidenz je Gen: ${confCount.map((c, i) => `${i}=${(100 * c / confTotal).toFixed(0)}%`).join("  ")}`
  + "   (3 gemessen · 2 Klade · 1 imputiert · 0 Habitat)");
if (emptyGroups.length)
  console.log(`  ohne reale Art (bleibt beim Bauplan-Namen): ${emptyGroups.length} Gruppen — ${emptyGroups.slice(0, 8).join(", ")}${emptyGroups.length > 8 ? " …" : ""}`);

// Rechenzeit-Budget der Stufe 2 (Plan Abschnitt 3): der Matcher laeuft pro Generation,
// darf also den Bildlauf nicht bremsen. Gemessen wird der echte innere Schleifenkern auf
// den echten Eintraegen — und auf die groesste Gruppe hochgerechnet, denn die bestimmt
// den schlechtesten Fall. Budget 2 ms: unterhalb eines 60-Hz-Bildschritts (16,7 ms) mit
// reichlich Luft fuer alles andere, was pro Generation passiert.
const BUDGET_MS = 2;
if (entries.length) {
  const t = new Array(NG).fill(0.5), w = new Array(NG).fill(0.65);
  const bench = (list, reps) => {
    const t0 = process.hrtime.bigint();
    for (let r = 0; r < reps; r++) {
      let dBest = Infinity;
      for (const e of list) {
        let sum = 0, z = 0;
        for (let g = 0; g < NG; g++) { const d = (t[g] - e.genome[g] / 255) * w[g]; sum += d * d; z += w[g] * w[g]; }
        const dist = Math.sqrt(sum / Math.max(z, 1e-9));
        if (dist < dBest) dBest = dist;
      }
    }
    return Number(process.hrtime.bigint() - t0) / 1e6 / reps;
  };
  bench(entries, 200);                                   // aufwaermen (JIT)
  const perEntryMs = bench(entries, 2000) / entries.length;
  const biggest = Math.max(...Object.values(CAT.byGroup).map((a) => a.length));
  const worstMs = perEntryMs * biggest;
  console.log(`  Stufe-2-Kosten: ${(perEntryMs * 1000).toFixed(2)} µs/Eintrag · groesste Gruppe ${biggest} `
    + `-> ${worstMs.toFixed(3)} ms je classify() (Budget ${BUDGET_MS} ms)`);
  console.log(`  Hochrechnung: ${Math.floor(BUDGET_MS / perEntryMs).toLocaleString("de-DE")} Eintraege je Gruppe passen ins Budget`);
  if (worstMs > BUDGET_MS) note("C8", `Stufe 2 kostet ${worstMs.toFixed(2)} ms > Budget ${BUDGET_MS} ms.`);
}

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  for (const p of problems.slice(0, 40)) console.error("  " + p);
  if (problems.length > 40) console.error(`  … und ${problems.length - 40} weitere`);
  process.exit(1);
}
console.log("  Format, Schluessel, Sortierung und Budget in Ordnung ✓");
