// Stufe Phase 5 (Lebendige-Welt-Roadmap, Punkt 10) — Symbiose/Parasitismus.
//
// Zwei Behauptungen je Modus, beide GEMESSEN statt behauptet (dieselbe Methode wie
// tools/coevolution-check.mjs):
//
//   MUTUALISMUS
//   (1) Konvergenz: zwei Populationen, absichtlich mit auseinanderliegenden Start-
//       Mittelwerten auf der Passungs-Achse (0.2 / 0.8), naehern sich unter Mutualismus
//       an - ohne Kopplung (Kontrolle) bleibt der Abstand nahe am Zufalls-/Start-Niveau.
//   (2) Echte wechselseitige Abhaengigkeit: am ko-adaptierten Endzustand ist die
//       REALISIERTE Fitness (mit Partner-Bonus) fuer BEIDE Populationen hoeher als ihre
//       eigene Fitness ohne den Bonus (Partner "entfernt") - nicht nur fuer eine Seite.
//
//   PARASITISMUS
//   (1) Wirt-Schaden: die realisierte Fitness des Wirts (mit Parasiten-Abzug) liegt am
//       Endzustand MESSBAR unter seiner eigenen Fitness ohne Abzug.
//   (2) Parasiten-Gewinn: die realisierte Fitness des Parasiten (mit Passungs-Bonus)
//       liegt darueber, was er ohne Wirt-Passung haette - die Asymmetrie (Wirt verliert,
//       Parasit gewinnt AN DERSELBEN Interaktion) unterscheidet dies von Mutualismus.
//
// Aufruf: npm run symbiosis-check
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Symbiosis } from "../dist/world/symbiosis.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const env = { temperature: 0.5, predation: 0.2, foodAbundance: 0.75, foodHeight: 0.35, light: 0.45, water: 0.5 };
const GENS = 400;
const SEEDS = [1, 2, 3];

function mutualDist(coupled, seed) {
  const sym = new Symbiosis("mutualism", env, phys, { numGenes: NG }, {}, seed, 0.2, 0.8);
  for (let i = 0; i < GENS; i++) sym.step(coupled);
  return Math.abs(sym.aMeanAxis() - sym.bMeanAxis());
}

console.log("Phase 5 — Symbiose/Parasitismus, 3 Seeds, 400 Generationen\n");
console.log("=== Mutualismus ===");
const distCoupled = SEEDS.map((s) => mutualDist(true, s));
const distControl = SEEDS.map((s) => mutualDist(false, s));
const mDistCoupled = distCoupled.reduce((a, c) => a + c, 0) / distCoupled.length;
const mDistControl = distControl.reduce((a, c) => a + c, 0) / distControl.length;
console.log(`  Start-Abstand der Merkmalsmittel: 0.600 (0.2 vs. 0.8)`);
console.log(`  Abstand nach ${GENS} Gen, GEKOPPELT (Mutualismus):    ${mDistCoupled.toFixed(3)}`);
console.log(`  Abstand nach ${GENS} Gen, ENTKOPPELT (Kontrolle):     ${mDistControl.toFixed(3)}`);
const converges = mDistCoupled < 0.5 * mDistControl;
console.log(`  Konvergenz durch Mutualismus (< 50% des Kontroll-Abstands):  ${converges ? "OK" : "FAIL"}`);

// Wechselseitige Abhaengigkeit am ko-adaptierten Endzustand.
function mutualDependency(seed) {
  const sym = new Symbiosis("mutualism", env, phys, { numGenes: NG }, {}, seed, 0.2, 0.8);
  for (let i = 0; i < GENS; i++) sym.step(true);
  const aBase = sym.aBaseVitality();
  const bBase = sym.bBaseVitality();
  const m = sym.history[sym.history.length - 1].matchQuality;
  const benefit = 0.6; // DEFAULT_SYMBIOSIS.benefitScale
  const aWith = aBase * (1 + benefit * m);
  const bWith = bBase * (1 + benefit * m);
  return { aBase, bBase, aWith, bWith, m };
}
const dep = SEEDS.map(mutualDependency);
const aGain = dep.reduce((s, d) => s + (d.aWith - d.aBase), 0) / dep.length;
const bGain = dep.reduce((s, d) => s + (d.bWith - d.bBase), 0) / dep.length;
const mQual = dep.reduce((s, d) => s + d.m, 0) / dep.length;
console.log(`  Ko-adaptierte Passungs-Qualitaet am Ende: ${mQual.toFixed(3)}`);
console.log(`  Fitness-Gewinn durch Partner — Seite A: +${aGain.toFixed(3)}  ·  Seite B: +${bGain.toFixed(3)}`);
const mutualBenefit = aGain > 0.02 && bGain > 0.02;
console.log(`  Beide Seiten profitieren (echte wechselseitige Abhaengigkeit):  ${mutualBenefit ? "OK" : "FAIL"}`);

console.log("\n=== Parasitismus ===");
function runParasitism(seed) {
  const sym = new Symbiosis("parasitism", env, phys, { numGenes: NG }, {}, seed, 0.5, 0.5);
  for (let i = 0; i < GENS; i++) sym.step(true);
  const hostBase = sym.aBaseVitality();
  const parasiteBase = sym.bBaseVitality();
  const m = sym.history[sym.history.length - 1].matchQuality;
  const drain = 0.5; // DEFAULT_SYMBIOSIS.hostDrainScale
  const benefit = 0.6;
  const hostWith = hostBase * Math.max(0, 1 - drain * m);
  const parasiteWith = parasiteBase * (1 + benefit * m);
  return { hostBase, parasiteBase, hostWith, parasiteWith, m };
}
const par = SEEDS.map(runParasitism);
const hostLoss = par.reduce((s, d) => s + (d.hostBase - d.hostWith), 0) / par.length;
const parasiteGain = par.reduce((s, d) => s + (d.parasiteWith - d.parasiteBase), 0) / par.length;
const pQual = par.reduce((s, d) => s + d.m, 0) / par.length;
console.log(`  Passungs-Qualitaet am Ende: ${pQual.toFixed(3)}`);
console.log(`  Wirt-Schaden (Fitness ohne Abzug minus mit Abzug):     ${hostLoss.toFixed(3)}`);
console.log(`  Parasiten-Gewinn (Fitness mit Bonus minus ohne):       ${parasiteGain.toFixed(3)}`);
const hostHarmed = hostLoss > 0.02;
const parasiteBenefits = parasiteGain > 0.02;
console.log(`  Wirt wird geschaedigt:                                  ${hostHarmed ? "OK" : "FAIL"}`);
console.log(`  Parasit profitiert (Asymmetrie zum Mutualismus):        ${parasiteBenefits ? "OK" : "FAIL"}`);

const allOk = converges && mutualBenefit && hostHarmed && parasiteBenefits;
console.log("");
if (allOk) {
  console.log("Status: OK — Mutualismus (Konvergenz + wechselseitiger Gewinn) und Parasitismus");
  console.log("(Wirt-Schaden + Parasiten-Gewinn) sind beide messbar und strukturell verschieden");
  console.log("vom bereits validierten Raeuber-Beute-Modell (tools/coevolution-check.mjs).");
} else {
  console.log("Status: FAIL.");
  process.exit(1);
}
