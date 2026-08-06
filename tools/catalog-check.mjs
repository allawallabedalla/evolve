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
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// GEZIPPT, nicht roh: GitHub Pages liefert .js immer komprimiert aus, die rohe
// Byte-Zahl ueberzeichnet die reale Ladekosten massiv (gemessen bei 20.178 Arten:
// 8,7 MB roh -> 784 KB gzip).
// Nachtrag (2026-08-04, Harvester-Fortsetzung 20.178 -> 30.286 Arten): die urspruengliche
// Annahme "Budget mit Luft fuer Wachstum auf ~40.000 Arten" bei UNVERAENDERTEM Budget war
// falsch kalibriert. Rohe Bytes/Art blieben nahezu konstant (431 -> 436 B/Art), aber die
// GZIP-Bytes/Art fast verdoppelten sich (38,8 -> 68,6 B/Art) - der Harvester hat seither
// ueberwiegend tief verzweigte, kleinteilige Kladen erschlossen (Insekten-/Pilz-Gattungen
// mit oft nur 1-2 Arten je Klade), deren Abstammungsketten sich viel weniger wiederholen
// als bei den zuerst geernteten grossen, artenreichen Kladen (Saeugetiere/Voegel) - weniger
// Redundanz heisst schlechtere Kompression, unabhaengig von der Artenzahl selbst. Budget neu
// gesetzt mit moderater Luft ueber dem gemessenen Stand (2.079 KB), NICHT mit dem alten
// Wachstumsziel - weiteres Wachstum braucht eine bewusste neue Kalibrierung, kein
// automatisches Mitwachsen der Annahme. Echte Loesung fuer weiteres Wachstum waere Sharding/
// Lazy-Loading (docs/artenkatalog-plan.md Abschnitt 8, "bewusst offen"), nicht nur diese Zahl.
// Nachtrag (2026-08-06, Reptilien-Nachernte + Bugfix im Retry-Offset des Harvesters):
// 30.286 -> 42.648 Arten (+41%), gemessen 2.875 KB gzip (67,4 B/Art, praktisch unveraendert
// zu den 68,6 B/Art vom letzten Nachtrag) - kein neuer Redundanz-Einbruch, nur mehr Arten.
// Bewusst neu kalibriert mit derselben moderaten Luft wie beim letzten Mal, NICHT automatisch
// mitgewachsen. Sharding/Lazy-Loading bleibt die eigentliche Loesung fuer weiteres Wachstum.
const GZIP_BUDGET_KB = 3200;

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

// C7 — Groessenbudget (gzip, s. Begruendung oben)
const catalogPath = join(ROOT, "app", "catalog.js");
const kb = statSync(catalogPath).size / 1024;
const gzipKb = gzipSync(readFileSync(catalogPath)).length / 1024;
if (gzipKb > GZIP_BUDGET_KB) note("C7", `Katalog ${gzipKb.toFixed(0)} KB gzip > Budget ${GZIP_BUDGET_KB} KB.`);

// --- Bericht ---
const withQid = entries.filter((e) => e.qid).length;
const withSci = entries.filter((e) => e.sci).length;
const emptyGroups = [...groupKeys].filter((k) => !CAT.byGroup[k]);
const confCount = [0, 0, 0, 0];
for (const e of entries) for (const c of e.conf || []) confCount[c]++;
const confTotal = confCount.reduce((a, b) => a + b, 0) || 1;

console.log(`catalog-check — Stufe "${CAT.stage}", ${entries.length} Eintraege in ${Object.keys(CAT.byGroup || {}).length} Bauplan-Gruppen, ${kb.toFixed(0)} KB roh / ${gzipKb.toFixed(0)} KB gzip`);
console.log(`  Beleg: ${withQid}/${entries.length} mit Wikidata-QID · ${withSci} mit wissenschaftlichem Namen`);
console.log(`  Konfidenz je Gen: ${confCount.map((c, i) => `${i}=${(100 * c / confTotal).toFixed(0)}%`).join("  ")}`
  + "   (3 gemessen · 2 Klade · 1 imputiert · 0 Habitat)");
if (emptyGroups.length)
  console.log(`  ohne reale Art (bleibt beim Bauplan-Namen): ${emptyGroups.length} Gruppen — ${emptyGroups.slice(0, 8).join(", ")}${emptyGroups.length > 8 ? " …" : ""}`);

// BERICHTET, kein Fehler: wie oft teilen sich mehrere reale Arten in derselben Gruppe
// buchstaeblich denselben Punkt (moegliche Folge duenner Kladen-Regel-Aufloesung, s.
// docs/artenkatalog-plan.md "Bewusst offen" — der Stufe-2-Matcher waehlt unter
// Zwillingen nicht mehr nach Naehe, sondern per Sortier-Reihenfolge).
if (entries.length) {
  const seen = new Map();
  for (const e of entries) {
    const key = e.group + "|" + e.genome.join(",");
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const clones = entries.length - seen.size;
  console.log(`  Arten mit einem genom-identischen Zwilling in ihrer Gruppe: `
    + `${clones}/${entries.length} (${(100 * clones / entries.length).toFixed(1)}%) — `
    + `${seen.size} unterscheidbare Punkte insgesamt.`);
}

// Rechenzeit-Budget der Stufe 2 (Plan Abschnitt 3): der Matcher laeuft pro Generation,
// darf also den Bildlauf nicht bremsen. Gemessen wird der echte innere Schleifenkern auf
// den echten Eintraegen — und auf die groesste Gruppe hochgerechnet, denn die bestimmt
// den schlechtesten Fall. Budget 2 ms: unterhalb eines 60-Hz-Bildschritts (16,7 ms) mit
// reichlich Luft fuer alles andere, was pro Generation passiert.
// Nachtrag (2026-08-06, Reptilien-Nachernte): groesste Gruppe „Strauch" waechst von 6.244
// auf 9.105 Eintraege, gemessener Fall 2,92 ms. Bewusst auf 3 ms neu kalibriert (statt
// automatisch mitwachsen zu lassen) — bleibt immer noch weit unter dem 16,7-ms-Bildschritt
// mit Luft fuer alles andere pro Generation.
const BUDGET_MS = 3;
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
