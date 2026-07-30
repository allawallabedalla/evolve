// Realitaetstreue-Loop (BACKLOG.md Punkt 9, Schritt 5) — Diagnose-Skript fuer
// training/fidelity-config.ts. Kein Gate im Sinne von "npm run all" (Schritt 6
// baut den echten Drei-Schichten-Loop, der diese Konstanten als Blackbox-
// Fitness einhaengt).
//
// AUFGABE DIESES SKRIPTS, NEU GEFASST BEI MIGRATIONS-STUFE 6 (Punkt 2):
// Vorher belegte es, dass die Pro-Schicht-Schwellen den damaligen Ist-Stand
// ABSICHTLICH knapp durchfallen lassen — Schicht C war die Distillations-Guete
// `validityTest` (~0.72) und riss die Schwelle 0.80. Diese Messgrundlage
// existiert nicht mehr: Score_C ist seit Stufe 6 die VERTEILUNGS-Naehe des
// produktiven Schwarms (Jensen-Shannon-Divergenz, tools/spectrum-check.mjs), und
// die faellt gemessen deutlich BESSER aus als ihre Schwelle. Ein "absichtlich
// knapp durchgefallen" waere jetzt nur noch durch eine kuenstlich hoch gesetzte
// Schwelle herstellbar — also durch Zurechtbiegen des Pruefstands an ein
// gewuenschtes Ergebnis. Genau das soll er nicht.
//
// Der Beweis "diese Schwellen pruefen etwas" wird deshalb anders gefuehrt, und
// zwar strenger: mit GEGENTESTS statt mit einem verfehlten Ist-Stand. Geprueft
// wird die Mechanik selbst —
//   (1) der Ist-Stand besteht alle drei Schwellen (und wird beziffert),
//   (2) jede Schicht KANN einzeln rot werden (drei Gegentests),
//   (3) der Goodhart-Schutz haelt: eine hohe gewichtete Summe erkauft eine
//       kaputte Schicht NICHT (das ist die eigentliche Zusage aus docs
//       Teil II, "### Aggregat"),
//   (4) die Gewichte summieren zu 1.
//
// Exit-Code 0, wenn all das zutrifft — 1 sonst.

import {
  MIN_SCORE_A, MIN_SCORE_B, MIN_SCORE_C, TARGET_JSD, WEIGHT_A, WEIGHT_B, WEIGHT_C,
  computeFidelity, scoreCFromJsd,
} from "../dist/training/fidelity-config.js";

const CURRENT_SCORE_A = 1.0; // 8/8 Phaenomene, tools/phenomena-check.mjs (Schritt 2)
const CURRENT_SCORE_B = 1.0; // 4/4 Verteilungsformen, tools/distribution-check.mjs (Schritt 4)
// Gemessene JS-Divergenz Browser-N=200 <-> Orakel-N=2000 ueber 11 Biom-Presets x 5
// Laeufe, 250 Generationen (tools/spectrum-check.mjs, Migrations-Stufe 6). Wie
// CURRENT_SCORE_A/B eine per Hand eingetragene Messzahl — dieses Skript rechnet
// die teure Messung nicht selbst nach (~45 min Orakel-Seite).
const CURRENT_JSD = 0.0218;
const CURRENT_SCORE_C = scoreCFromJsd(CURRENT_JSD);

const result = computeFidelity(CURRENT_SCORE_A, CURRENT_SCORE_B, CURRENT_SCORE_C);

console.log("Realitaetstreue-Loop — Fidelity-Diagnose (Stand nach Migrations-Stufe 6)\n");
console.log(`  Score_A (Phaenomene)       = ${CURRENT_SCORE_A.toFixed(3)}  (Mindestschwelle ${MIN_SCORE_A.toFixed(3)})`);
console.log(`  Score_B (Verteilungsformen)= ${CURRENT_SCORE_B.toFixed(3)}  (Mindestschwelle ${MIN_SCORE_B.toFixed(3)})`);
console.log(`  Score_C (Verteilungs-Naehe)= ${CURRENT_SCORE_C.toFixed(3)}  (Mindestschwelle ${MIN_SCORE_C.toFixed(3)})`);
console.log(`     aus JSD = ${CURRENT_JSD.toFixed(4)}  [Zielkriterium JSD < ${TARGET_JSD}]`);
console.log(`  Fidelity (gewichtet 1/3)   = ${result.fidelity.toFixed(4)}`);
console.log(`  passesThresholds           = ${result.passesThresholds}`);
console.log(`  failingLayers              = [${result.failingLayers.join(", ")}]`);

// (1) Ist-Stand besteht.
const currentPasses = result.passesThresholds;

// (2) Jede Schicht kann einzeln rot werden. Die Gegenwerte liegen jeweils knapp
//     UNTER der Schwelle (ein Phaenomen-Ausfall mehr; eine Verteilungspruefung
//     mehr; eine JS-Divergenz oberhalb des Stufe-6-Kriteriums) — es geht darum,
//     dass die Schwelle greift, nicht dass sie bei Unsinnswerten greift.
const failA = computeFidelity(6 / 8, 1.0, CURRENT_SCORE_C);
const failB = computeFidelity(1.0, 2 / 4, CURRENT_SCORE_C);
const failC = computeFidelity(1.0, 1.0, scoreCFromJsd(TARGET_JSD + 0.01));
const canFailA = !failA.passesThresholds && failA.failingLayers.join() === "A";
const canFailB = !failB.passesThresholds && failB.failingLayers.join() === "B";
const canFailC = !failC.passesThresholds && failC.failingLayers.join() === "C";

// (3) Goodhart-Schutz: perfekte A und B, voellig kaputte Verteilung (JSD 0.6 =
//     Spektren weit auseinander). Die gewichtete Summe liegt dann noch bei ~0.80,
//     also HOEHER als manche bestehende Konstellation — trotzdem muss das Gate rot
//     sein. Genau das ist die Zusage "eine Schicht darf nicht erkauft werden".
const bought = computeFidelity(1.0, 1.0, scoreCFromJsd(0.6));
const goodhart = !bought.passesThresholds && bought.fidelity > 0.75;

// (4) Gewichte summieren zu 1.
const weightsOk = Math.abs(WEIGHT_A + WEIGHT_B + WEIGHT_C - 1) < 1e-12;

console.log("\nMechanik-Gegentests:");
console.log(`  Ist-Stand besteht alle drei Schwellen:              ${currentPasses ? "OK" : "FAIL"}`);
console.log(`  Schicht A kann rot werden (6/8 Phaenomene):         ${canFailA ? "OK" : "FAIL"}`);
console.log(`  Schicht B kann rot werden (2/4 Verteilungen):       ${canFailB ? "OK" : "FAIL"}`);
console.log(`  Schicht C kann rot werden (JSD ${(TARGET_JSD + 0.01).toFixed(2)}):          ${canFailC ? "OK" : "FAIL"}`);
console.log(`  Goodhart-Schutz haelt (Fidelity ${bought.fidelity.toFixed(3)}, trotzdem rot):  ${goodhart ? "OK" : "FAIL"}`);
console.log(`  Gewichte summieren zu 1:                           ${weightsOk ? "OK" : "FAIL"}`);

const ok = currentPasses && canFailA && canFailB && canFailC && goodhart && weightsOk;
console.log(
  ok
    ? "\nOK — Schwellen greifen pro Schicht, sind nicht erkaufbar, und der Ist-Stand\n" +
      "     besteht sie mit Reserve (Score_C-Reserve: JSD " +
      `${CURRENT_JSD.toFixed(4)} gegen Ziel ${TARGET_JSD}).`
    : "\nFAIL — die Schwellen-Mechanik verhaelt sich nicht wie in docs/evolution-fidelity-loop.md beschrieben.",
);
process.exit(ok ? 0 : 1);
