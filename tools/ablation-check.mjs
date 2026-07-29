// Mechanismus-Ablationsstudie (Realitaetstreue-Loop, Backlog Punkt 9 Schritt 3;
// Validierungsplan Teil V Punkt 2).
//
// Schritt 2 (tools/phenomena-check.mjs / world/phenomena.ts) hat pro Phaenomen
// bereits GENAU EINEN, fuer dieses Phaenomen ausgewaehlten Ablations-Lauf
// gebaut (die Kraft abschalten, von der Schritt 2 annimmt, dass sie ursaechlich
// ist -- und geprueft, dass das Zielband dann verfehlt wird). Diese Datei geht
// einen Schritt weiter: sie testet **alle vier** Mechanismen gegen **jedes**
// Phaenomen (nicht nur das jeweils "vermutete" Paar) und macht daraus eine
// vollstaendige Matrix. Das ist bewusst KEIN Gate (kein process.exit(1)) --
// eine Diagnose-/Dokumentations-Ausgabe, die zeigt, welcher Mechanismus
// welches Phaenomen tatsaechlich kausal traegt (und welcher NICHT, was
// genauso interessant ist).
//
// Wiederverwendung: reine Nutzung von world/phenomena.ts' Mechanisms-
// Interface + popConfigFor()-Baustein + den P1-P8-Szenario-Funktionen (Schritt
// 2 hat sie ausdruecklich fuer genau diese Wiederverwendung entworfen, s.
// Kommentar dort: "von Anfang an so gebaut, dass Schritt 3 ... ihn direkt
// wiederverwenden kann"). Keine neue Szenario-Logik hier, nur Orchestrierung
// + Tabellenausgabe. Zielband-Konstanten sind 1:1 aus tools/phenomena-check.mjs
// uebernommen (dort ausfuehrlich begruendet) -- hier nicht erneut hergeleitet,
// nur referenziert.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ph from "../dist/world/phenomena.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

const ALL_ON = { competition: true, migration: true, coevolution: true, drift: true };

// ---------------------------------------------------------------------------
// Mechanismen, die je einzeln (nie kombiniert) "ausgeschaltet" werden.
// ---------------------------------------------------------------------------
const MECHS = [
  { key: "competition", label: "Konkurrenz" },
  { key: "migration", label: "Migration" },
  { key: "coevolution", label: "Ko-Evolution" },
  { key: "drift", label: "Drift" },
];

// ---------------------------------------------------------------------------
// Ein Phaenomen-Eintrag definiert:
//  - baseline: die Mechanismus-Konfiguration, unter der Schritt 2 das
//    Phaenomen demonstriert (identisch zu phenomena-check.mjs' "def"-Fall;
//    fuer P3 ist das migration:false -- die Isolation IST dort der Normalfall,
//    nicht ALL_ON, s. world/phenomena.ts-Kommentar zu allopatry()).
//  - evaluate(cfg): laeuft das Szenario und liefert { ok, metric }.
//  - special: optionale Ausnahme je Mechanismus-Schluessel ("n/a"-Grund statt
//    eines echten Kippen/Kein-Kippen-Befunds).
// ---------------------------------------------------------------------------

const P4_COMPETITION_NOTE =
  "n/a — s. Schritt 2: Konkurrenz auf der Groessen-Achse veraendert die End-Distanz " +
  "empirisch kaum (0.183 vs. 0.201 ueber 250 Gen.); die echte Ablation fuer P4 ist " +
  "Selektion direkt abschalten (ph.convergenceNoSelection), kein Mechanismus-Schalter. " +
  "Zahl unten zur Transparenz trotzdem mitgefuehrt, zaehlt aber nicht als Kippen/Kein-Kippen.";

const PHENOMENA = [
  {
    id: "P1",
    name: "Adaptive Radiation",
    baseline: { ...ALL_ON },
    evaluate(cfg) {
      const r = ph.radiation(phys, cfg);
      return { ok: r.ratio >= 2.0, metric: `${r.ratio.toFixed(2)}x` };
    },
  },
  {
    id: "P2",
    name: "Sympatr. Speziation / Branching",
    baseline: { ...ALL_ON },
    evaluate(cfg) {
      const r = ph.branching(phys, cfg);
      const avgModes = r.modes.reduce((a, c) => a + c, 0) / r.modes.length;
      return { ok: avgModes >= 1.5 && r.sd >= 0.25, metric: `Ø${avgModes.toFixed(1)} Modi, SD ${r.sd.toFixed(3)}` };
    },
  },
  {
    id: "P3",
    name: "Allopatrische Speziation",
    baseline: { ...ALL_ON, migration: false }, // Isolation ist hier der Normalfall, nicht ALL_ON.
    evaluate(cfg) {
      const r = ph.allopatry(phys, cfg);
      return { ok: r.divergence >= 0.7, metric: `Divergenz ${r.divergence.toFixed(3)}` };
    },
  },
  {
    id: "P4",
    name: "Konvergente Evolution",
    baseline: { ...ALL_ON },
    special: { competition: P4_COMPETITION_NOTE },
    evaluate(cfg) {
      const r = ph.convergence(phys, cfg);
      return { ok: r.meanPairwiseDistance <= 0.3, metric: `Distanz ${r.meanPairwiseDistance.toFixed(3)}` };
    },
  },
  {
    id: "P5",
    name: "Rote-Koenigin-Dynamik",
    baseline: { ...ALL_ON },
    evaluate(cfg) {
      const r = ph.redQueen(phys, cfg);
      return {
        ok: r.sd >= 0.08 && r.meanPredation >= 0.05,
        metric: `SD ${r.sd.toFixed(4)}, Praed. ${r.meanPredation.toFixed(3)}`,
      };
    },
  },
  {
    id: "P6",
    name: "Kontingenz",
    baseline: { ...ALL_ON },
    evaluate(cfg) {
      const r = ph.contingency(phys, cfg);
      const upper = 0.1 * ph.contingencyRandomReference(NG);
      return { ok: r.variance > 1e-5 && r.variance < upper, metric: `Var ${r.variance.toExponential(2)}` };
    },
  },
  {
    id: "P8",
    name: "Aussterben & Erholung",
    baseline: { ...ALL_ON },
    evaluate(cfg) {
      const r = ph.extinctionRecovery(phys, cfg);
      const ok = r.before >= 0.3 && r.trough <= 0.3 * r.before && r.after >= 0.5 * r.before && r.after > r.trough;
      return { ok, metric: `vor ${r.before.toFixed(2)} / Tief ${r.trough.toFixed(2)} / nach ${r.after.toFixed(2)}` };
    },
  },
];

// ---------------------------------------------------------------------------
// Matrix aufbauen: fuer jedes Phaenomen den Baseline-Befund einmal berechnen,
// dann fuer jeden Mechanismus die EINE Konfiguration testen, die genau diesen
// Mechanismus (ausgehend von der Baseline) umschaltet -- fuer P3s Migration
// heisst "umschalten" folgerichtig ANschalten (Baseline ist dort aus), fuer
// alle anderen Zellen AUSschalten (Baseline ist ALL_ON, also ueberall an).
// ---------------------------------------------------------------------------

console.log("Mechanismus-Ablationsstudie — Schicht-A-Portfolio (P1-P8)\n" + "=".repeat(70));
console.log(
  "\nJede Zeile: EIN Mechanismus wird (ausgehend von der Schritt-2-Baseline\n" +
    "des jeweiligen Phaenomens) einzeln umgeschaltet, alle anderen bleiben wie\n" +
    "in Schritt 2 etabliert. Kein Gate -- reine Diagnose, druckt nur die Matrix.\n",
);

const matrix = []; // { mechLabel, cells: [{ id, status, metric, note }] }
const baselineCache = new Map(); // id -> { ok, metric }

for (const p of PHENOMENA) {
  baselineCache.set(p.id, p.evaluate(p.baseline));
}

for (const mech of MECHS) {
  const cells = [];
  for (const p of PHENOMENA) {
    const base = baselineCache.get(p.id);
    const cfg = { ...p.baseline, [mech.key]: !p.baseline[mech.key] };
    const perturbed = p.evaluate(cfg);
    const specialNote = p.special && p.special[mech.key];
    let status;
    if (specialNote) {
      status = "n/a";
    } else if (base.ok && !perturbed.ok) {
      status = "KIPPT";
    } else if (!base.ok) {
      status = "Baseline selbst n. i. Zielband (?)";
    } else {
      status = "kein Effekt";
    }
    cells.push({ id: p.id, status, metric: perturbed.metric, note: specialNote });
  }
  matrix.push({ mechLabel: mech.label, cells });
}

// ---------------------------------------------------------------------------
// Tabellenausgabe.
// ---------------------------------------------------------------------------

const idWidth = 6;
const header = "Mechanismus".padEnd(14) + PHENOMENA.map((p) => p.id.padEnd(idWidth)).join("");
console.log(header);
console.log("-".repeat(header.length));
for (const row of matrix) {
  const cells = row.cells
    .map((c) => (c.status === "KIPPT" ? "KIPPT" : c.status === "n/a" ? "n/a" : c.status === "kein Effekt" ? "-" : "?!"))
    .map((s) => s.padEnd(idWidth));
  console.log(row.mechLabel.padEnd(14) + cells.join(""));
}
console.log("\nLegende: KIPPT = Baseline im Zielband, Umschalten verfehlt es -> kausal gebunden.");
console.log("         -     = kein Effekt auf dieses Zielband (Mechanismus wird von diesem");
console.log("                 Phaenomen-Szenario nicht genutzt bzw. aendert das Ergebnis nicht spuerbar).");
console.log("         n/a   = dedizierte Schritt-2-Ausnahme, s. Detailtext unten.\n");

// ---------------------------------------------------------------------------
// Detailtext je Zelle (Metriken, damit die Matrix nachvollziehbar bleibt).
// ---------------------------------------------------------------------------

console.log("=".repeat(70) + "\nDetails\n" + "=".repeat(70));
for (const row of matrix) {
  console.log(`\n${row.mechLabel}:`);
  for (const c of row.cells) {
    const base = baselineCache.get(c.id);
    const p = PHENOMENA.find((x) => x.id === c.id);
    console.log(`  ${c.id} (${p.name})`);
    console.log(`    Baseline:   ${base.metric} (${base.ok ? "im Zielband" : "AUSSERHALB Zielband"})`);
    console.log(`    Umgeschaltet: ${c.metric} -> ${c.status}`);
    if (c.note) console.log(`    Hinweis: ${c.note}`);
  }
}

console.log(
  "\n" +
    "=".repeat(70) +
    "\nHinweis: dies ist eine Diagnose-/Dokumentationsausgabe (Backlog Punkt 9\n" +
    "Schritt 3) -- kein Pass/Fail-Gate, kein process.exit(1). Kurzfassung +\n" +
    "Interpretation je Mechanismus: docs/ablation-results.md.\n",
);
