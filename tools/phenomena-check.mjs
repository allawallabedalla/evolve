// Schicht-A-Portfolio (Realitaetstreue-Loop, Backlog Punkt 9 Schritt 2): jedes
// der acht Evolutionstheorie-Phaenomene (docs/evolution-fidelity-loop.md,
// "### 2. Die bekannten emergenten Phaenomene" + Tabelle "### Schicht A") als
// eigenstaendiges Szenario mit Zielband, PLUS ein Ablations-Lauf je Phaenomen
// (Validierungsplan Teil V Punkt 1): die fuer das Phaenomen ursaechliche Kraft
// abschalten MUSS das Zielband verfehlen, sonst waere der Test kein Beweis
// fuer Emergenz. Reine Szenario-/Metrik-Logik liegt in world/phenomena.ts
// (analog zu world/cluster.ts <-> tools/branching-check.mjs).
//
// Wiederverwendung statt Neubau (vier der acht Phaenomene):
//   P2 Branching  <- tools/branching-check.mjs (sigmaC<sigmaK, >=2 Cluster)
//   P3 Allopatrie <- tools/world-check.mjs (isolierte Orte divergieren)
//   P5 Red Queen  <- tools/coevolution-check.mjs (anhaltende Merkmalsoszillation)
//   P8 Aussterben <- tools/world-check.mjs (Katastrophe senkt Diversitaet),
//                    HIER um die Erholung ergaenzt (world-check prueft nur den
//                    Einbruch, nicht was danach passiert).
// Net-neu: P1 Radiation, P4 Konvergenz, P6 Kontingenz.
// P7 Verteilungsgesetze: bewusst NICHT hier implementiert, s. u.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ph from "../dist/world/phenomena.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

const ALL_ON = { competition: true, migration: true, coevolution: true, drift: true };
const results = []; // { id, name, ok, note }

function report(id, name, { metric, band, defaultOk, ablationLabel, ablationMetric, ablationMisses }) {
  const ok = defaultOk && ablationMisses;
  results.push({ id, name, ok });
  console.log(`\n${id} · ${name}`);
  console.log(`  Metrik:            ${metric}`);
  console.log(`  Zielband:          ${band}`);
  console.log(`  Im Zielband:       ${defaultOk ? "OK" : "FAIL"}`);
  console.log(`  Ablation (${ablationLabel}): ${ablationMetric}`);
  console.log(`  Ablation verfehlt Zielband:  ${ablationMisses ? "OK (wie erwartet)" : "FAIL (Ablation haette scheitern muessen)"}`);
  console.log(`  Status:            ${ok ? "OK" : "FAIL"}`);
  return ok;
}

console.log("Schicht-A-Portfolio — Evolutionstheorie-Phaenomene P1-P8\n" + "=".repeat(60));

// ---------------------------------------------------------------------------
// P1 — Adaptive Radiation
// ---------------------------------------------------------------------------
// Zielband-Begruendung: "ueberproportional" operationalisiert als Verhaeltnis
// >= 2 (Artenzahl verdoppelt sich mindestens gegenueber der Baseline ohne
// Nischen-Oeffnung) — ein klarer, konservativ gewaehlter Schwellenwert
// deutlich unter dem beobachteten Default (3.5x) und deutlich ueber dem
// beobachteten Ablations-Wert (1.0x, s. u.).
{
  const RATIO_THRESHOLD = 2.0;
  const def = ph.radiation(phys, { ...ALL_ON, migration: true });
  const abl = ph.radiation(phys, { ...ALL_ON, migration: false });
  report("P1", "Adaptive Radiation", {
    metric: `Δ Artenzahl-Verhaeltnis (Nischen offen / Baseline) = ${def.treatmentSpecies}/${def.baselineSpecies} = ${def.ratio.toFixed(2)}x`,
    band: `Verhaeltnis >= ${RATIO_THRESHOLD}x (ueberproportional gegenueber Baseline ohne Nischen-Oeffnung)`,
    defaultOk: def.ratio >= RATIO_THRESHOLD,
    ablationLabel: "migration aus -> keine Kolonisation neuer Nischen",
    ablationMetric: `${abl.treatmentSpecies}/${abl.baselineSpecies} = ${abl.ratio.toFixed(2)}x`,
    ablationMisses: abl.ratio < RATIO_THRESHOLD,
  });
}

// ---------------------------------------------------------------------------
// P2 — Sympatrische Speziation / Branching (Wiederverwendung branching-check.mjs)
// ---------------------------------------------------------------------------
{
  const MODES_THRESHOLD = 1.5; // trennt "ueberall 2 Cluster" (Default) von "ueberall 1" (Ablation)
  const SD_THRESHOLD = 0.25; // liegt zwischen Ablation (~0.16) und Default (~0.38)
  const def = ph.branching(phys, { ...ALL_ON, competition: true });
  const abl = ph.branching(phys, { ...ALL_ON, competition: false });
  const defAvgModes = def.modes.reduce((a, c) => a + c, 0) / def.modes.length;
  const ablAvgModes = abl.modes.reduce((a, c) => a + c, 0) / abl.modes.length;
  report("P2", "Sympatrische Speziation / Branching", {
    metric: `Cluster entlang der Groessen-Achse = ${JSON.stringify(def.modes)} (Ø ${defAvgModes.toFixed(1)}), SD = ${def.sd.toFixed(3)}`,
    band: `Ø Cluster >= ${MODES_THRESHOLD} (≥2 Modi) UND SD >= ${SD_THRESHOLD} (disruptiv)`,
    defaultOk: defAvgModes >= MODES_THRESHOLD && def.sd >= SD_THRESHOLD,
    ablationLabel: "competition aus",
    ablationMetric: `Modi ${JSON.stringify(abl.modes)} (Ø ${ablAvgModes.toFixed(1)}), SD = ${abl.sd.toFixed(3)}`,
    ablationMisses: !(ablAvgModes >= MODES_THRESHOLD && abl.sd >= SD_THRESHOLD),
  });
}

// ---------------------------------------------------------------------------
// P3 — Allopatrische Speziation (Wiederverwendung world-check.mjs, oberer Teil)
// ---------------------------------------------------------------------------
// Zielband-Begruendung: Schwelle 0.7 liegt zwischen den zwei empirisch
// stabilen (deterministische Seeds) Referenzwerten aus world-check.mjs:
// isoliert 1.062 / verbunden 0.409 — mit Marge zu beiden Seiten.
{
  const DIVERGENCE_THRESHOLD = 0.7;
  const def = ph.allopatry(phys, { ...ALL_ON, migration: false });
  const abl = ph.allopatry(phys, { ...ALL_ON, migration: true });
  report("P3", "Allopatrische Speziation", {
    metric: `Genom-Divergenz zwischen 2 isolierten Orten = ${def.divergence.toFixed(3)}`,
    band: `Divergenz >= ${DIVERGENCE_THRESHOLD} (> 0, deutlich getrennt)`,
    defaultOk: def.divergence >= DIVERGENCE_THRESHOLD,
    ablationLabel: "migration an (Genfluss 0.30) -> Homogenisierung",
    ablationMetric: `Divergenz = ${abl.divergence.toFixed(3)}`,
    ablationMisses: abl.divergence < DIVERGENCE_THRESHOLD,
  });
}

// ---------------------------------------------------------------------------
// P4 — Konvergente Evolution (net-neu)
// ---------------------------------------------------------------------------
// Zielband-Begruendung: Schwelle 0.30 liegt zwischen dem beobachteten Fall MIT
// Selektion (0.183, Default) und OHNE Selektion (0.653, Ablation) — s.
// world/phenomena.ts fuer die ausfuehrliche Begruendung, warum die Ablation
// hier direkt Selektion abschaltet statt einen der vier Mechanismen zu
// missbrauchen (Konkurrenz auf der Groessen-Achse veraendert den Abstand
// empirisch kaum: 0.183 vs. 0.201).
{
  const DISTANCE_THRESHOLD = 0.30;
  const def = ph.convergence(phys, ALL_ON);
  const abl = ph.convergenceNoSelection(phys);
  report("P4", "Konvergente Evolution", {
    metric: `mittlere paarweise End-Distanz (5 Startpunkte 0.1..0.9, gleiche Umwelt) = ${def.meanPairwiseDistance.toFixed(3)}`,
    band: `Distanz <= ${DISTANCE_THRESHOLD} (klein — verschiedene Starts landen im selben Genom-Areal)`,
    defaultOk: def.meanPairwiseDistance <= DISTANCE_THRESHOLD,
    ablationLabel: "Selektion abgeschaltet (neutrale Reproduktion; s. Code-Kommentar, kein Mechanismus-Missbrauch)",
    ablationMetric: `Distanz = ${abl.meanPairwiseDistance.toFixed(3)}`,
    ablationMisses: abl.meanPairwiseDistance > DISTANCE_THRESHOLD,
  });
}

// ---------------------------------------------------------------------------
// P5 — Rote Koenigin (Wiederverwendung coevolution-check.mjs)
// ---------------------------------------------------------------------------
{
  const SD_THRESHOLD = 0.08; // zwischen Ablation (~0.019) und Default (~0.164)
  const PRED_THRESHOLD = 0.05; // wie im bestehenden coevolution-check.mjs
  const def = ph.redQueen(phys, { ...ALL_ON, coevolution: true });
  const abl = ph.redQueen(phys, { ...ALL_ON, coevolution: false });
  report("P5", "Rote-Koenigin-Dynamik", {
    metric: `zeitliche SD der Beute-Groesse (letzte 150 Gen, 3 Seeds) = ${def.sd.toFixed(4)}, mittl. Raeuberdruck = ${def.meanPredation.toFixed(3)}`,
    band: `SD >= ${SD_THRESHOLD} UND Raeuberdruck >= ${PRED_THRESHOLD} (anhaltende Oszillation ohne Gleichgewicht)`,
    defaultOk: def.sd >= SD_THRESHOLD && def.meanPredation >= PRED_THRESHOLD,
    ablationLabel: "coevolution aus (keine Raeuber)",
    ablationMetric: `SD = ${abl.sd.toFixed(4)}, Raeuberdruck = ${abl.meanPredation.toFixed(3)}`,
    ablationMisses: !(abl.sd >= SD_THRESHOLD && abl.meanPredation >= PRED_THRESHOLD),
  });
}

// ---------------------------------------------------------------------------
// P6 — Kontingenz (net-neu)
// ---------------------------------------------------------------------------
// Zielband-Begruendung (ausfuehrlich in world/phenomena.ts dokumentiert):
//   Untergrenze: > 1e-5 (jede messbare Streuung ueber Numerik-Rauschen hinaus
//     erfuellt die Aussage "nicht deterministisch").
//   Obergrenze: 10% der theoretischen "komplett unselektierten" Referenz-
//     Varianz (Uniform(0,1) je Gen, NG Gene: NG/12). Eine real selektierte
//     Population, die daran heranreicht, waere kein Kontingenz-Befund mehr,
//     sondern ein Zeichen, dass Selektion gar nicht wirkt.
{
  const LOWER = 1e-5;
  const randomRef = ph.contingencyRandomReference(NG);
  const UPPER = 0.1 * randomRef;
  const def = ph.contingency(phys, { ...ALL_ON, drift: true });
  const abl = ph.contingency(phys, { ...ALL_ON, drift: false });
  report("P6", "Kontingenz", {
    metric: `Varianz der Endzustaende ueber 8 Seeds (gleicher Start, gleiche Umwelt) = ${def.variance.toFixed(5)}`,
    band: `${LOWER.toExponential(0)} < Varianz < ${UPPER.toFixed(3)} (= 10% der "voellig unselektiert"-Referenz NG/12 = ${randomRef.toFixed(3)})`,
    defaultOk: def.variance > LOWER && def.variance < UPPER,
    ablationLabel: "drift aus (mutationSd=0, startSpread=0, N=2500)",
    ablationMetric: `Varianz = ${abl.variance.toExponential(3)}`,
    ablationMisses: !(abl.variance > LOWER && abl.variance < UPPER),
  });
}

// ---------------------------------------------------------------------------
// P8 — Aussterben & Erholung (Einbruch = Wiederverwendung world-check.mjs
// unterer Teil; Erholung danach ist net-neu)
// ---------------------------------------------------------------------------
// Zielband-Begruendung: BEFORE_MIN=0.3 stellt sicher, dass ueberhaupt reale
// Ausgangsdiversitaet vorhanden war (sonst waere ein "Einbruch" vakuos).
// COLLAPSE (trough <= 30% von before) und RECOVERY (after >= 50% von before
// UND after > trough) sind bewusst asymmetrisch grosszuegig gewaehlt (der
// beobachtete Default erreicht ~100% Erholung; 50% laesst Marge fuer
// natuerliche Lauf-zu-Lauf-Schwankung, ohne eine bloss triviale
// Wieder-Vermehrung schon als "Erholung" durchzuwinken).
{
  const BEFORE_MIN = 0.3;
  const COLLAPSE_FRAC = 0.3;
  const RECOVERY_FRAC = 0.5;
  const def = ph.extinctionRecovery(phys, { ...ALL_ON, drift: true });
  const abl = ph.extinctionRecovery(phys, { ...ALL_ON, drift: false });
  const passes = (r) =>
    r.before >= BEFORE_MIN && r.trough <= COLLAPSE_FRAC * r.before && r.after >= RECOVERY_FRAC * r.before && r.after > r.trough;
  report("P8", "Aussterben & Erholung", {
    metric: `Diversitaet vor Katastrophe = ${def.before.toFixed(3)}, Einbruch = ${def.trough.toFixed(3)}, nach 200 Gen Erholung = ${def.after.toFixed(3)}`,
    band: `before >= ${BEFORE_MIN}, trough <= ${COLLAPSE_FRAC}·before (Einbruch), after >= ${RECOVERY_FRAC}·before UND after > trough (Erholung)`,
    defaultOk: passes(def),
    ablationLabel: "drift aus (keine neue Variation nach dem Flaschenhals moeglich)",
    ablationMetric: `before = ${abl.before.toFixed(3)}, trough = ${abl.trough.toFixed(3)}, after = ${abl.after.toFixed(3)}`,
    ablationMisses: !passes(abl),
  });
}

// ---------------------------------------------------------------------------
// P7 — Verteilungsgesetze: bewusst NICHT hier implementiert (Platzhalter).
// Wartet auf Schritt 4 (Schicht B, tools/distribution-check.mjs). Sobald das
// existiert, ruft dieser Platz dessen Fit-Funktion auf und prueft nur
// "Distanz unter Schwelle" — keine eigene Verteilungs-Fit-Logik hier, sonst
// entsteht doppelte, potenziell widerspruechliche Logik (Backlog Punkt 9
// Schritt 2, ausdruecklich so verlangt).
// ---------------------------------------------------------------------------
console.log("\nP7 · Verteilungsgesetze");
console.log("  Status:            wartet auf Schritt 4 (Schicht B) — noch nicht gebaut, kein Platzhalter-FAIL.");
results.push({ id: "P7", name: "Verteilungsgesetze", ok: null });

// ---------------------------------------------------------------------------
// Gesamt-Zusammenfassung
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(60));
const implemented = results.filter((r) => r.ok !== null);
const passing = implemented.filter((r) => r.ok);
for (const r of results) {
  const tag = r.ok === null ? "· wartet auf Schritt 4" : r.ok ? "OK" : "FAIL";
  console.log(`  ${r.id.padEnd(4)} ${r.name.padEnd(32)} ${tag}`);
}
console.log(`\nGesamt: ${passing.length}/8 Phaenomene im Zielband (P7 zaehlt als "wartet auf Schritt 4", nicht als FAIL).`);

const allImplementedPass = implemented.every((r) => r.ok);
if (allImplementedPass) {
  console.log("Status: OK — alle implementierten Phaenomene (P1-P6, P8) im Zielband, alle Ablationen verfehlen es wie erwartet.");
} else {
  console.log("Status: FAIL — mindestens ein implementiertes Phaenomen oder dessen Ablation liegt falsch.");
  process.exit(1);
}
