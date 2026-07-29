// Realitaetstreue-Loop (BACKLOG.md Punkt 9, Schritt 5) — Diagnose-Skript fuer
// training/fidelity-config.ts. Kein Gate im Sinne von "npm run all" (Schritt 6
// baut den echten Drei-Schichten-Loop, der diese Konstanten als Blackbox-
// Fitness einhaengt) — hier geht es nur darum, sichtbar zu belegen, dass die
// Pro-Schicht-Mindestschwellen den AKTUELLEN Stand (Score_A=1.0 nach Schritt 2,
// Score_B=1.0 nach Schritt 4, Score_C~0.72 aus training/fit.ts validityTest)
// absichtlich knapp durchfallen lassen, statt beim ersten Lauf gruen zu sein.
//
// Exit-Code 0, wenn das Diagnose-Ergebnis dem erwarteten "knapp durchgefallen"
// entspricht (also wenn das GATE tut, was Schritt 5 verlangt) — 1 sonst.

import { computeFidelity } from "../dist/training/fidelity-config.js";

const CURRENT_SCORE_A = 1.0; // 8/8 Phaenomene, tools/phenomena-check.mjs (Schritt 2)
const CURRENT_SCORE_B = 1.0; // 4/4 Verteilungsformen, tools/distribution-check.mjs (Schritt 4)
const CURRENT_SCORE_C = 0.72; // training/fit.ts validityTest ~71-72%, s. BACKLOG.md Punkt 9 Schritt 1

const result = computeFidelity(CURRENT_SCORE_A, CURRENT_SCORE_B, CURRENT_SCORE_C);

console.log("Realitaetstreue-Loop — Fidelity-Diagnose (aktueller Stand, Schritt 1+2+4)\n");
console.log(`  Score_A (Phaenomene)     = ${CURRENT_SCORE_A.toFixed(3)}  (Mindestschwelle ${(7 / 8).toFixed(3)})`);
console.log(`  Score_B (Verteilungen)   = ${CURRENT_SCORE_B.toFixed(3)}  (Mindestschwelle ${(3 / 4).toFixed(3)})`);
console.log(`  Score_C (Distillation)   = ${CURRENT_SCORE_C.toFixed(3)}  (Mindestschwelle 0.800)`);
console.log(`  Fidelity (gewichtet 1/3) = ${result.fidelity.toFixed(4)}`);
console.log(`  passesThresholds         = ${result.passesThresholds}`);
console.log(`  failingLayers            = [${result.failingLayers.join(", ")}]`);

// Erwartung fuer Schritt 5: das Gate faellt jetzt durch (nur Schicht C reisst
// die Schwelle, A und B bestehen knapp) — und zwar knapp, nicht durch eine
// riesige Luecke (Fidelity liegt trotzdem deutlich ueber 0, s. Kommentar bei
// MIN_SCORE_C in training/fidelity-config.ts).
const expectedFail = !result.passesThresholds;
const onlyCFails = result.failingLayers.length === 1 && result.failingLayers[0] === "C";
const ok = expectedFail && onlyCFails;

console.log(
  ok
    ? "\nOK — faellt wie gefordert knapp durch (nur Schicht C), kein Gruen-beim-ersten-Lauf."
    : "\nFAIL — Diagnose entspricht NICHT der erwarteten 'knapp durchgefallen'-Erwartung aus Schritt 5.",
);
process.exit(ok ? 0 : 1);
