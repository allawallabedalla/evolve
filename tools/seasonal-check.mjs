// Stufe Phase 6 (Lebendige-Welt-Roadmap, Punkt 10) — Umwelt als Funktion der Zeit.
//
// Bisher war jede Umwelt eine Momentaufnahme (ein fester Punktwert). Hier oszilliert
// eine Umwelt-Achse ueber Generationen ("Jahreszeiten"), derselbe Populations-Kern wie
// ueberall sonst. Zwei strukturell verschiedene, GEMESSENE Behauptungen (dieselbe
// Methode wie coevolution-check.mjs/symbiosis-check.mjs):
//
//   (1) KOMPROMISS/HEDGING: eine zyklisch schwankende Umwelt fuehrt NICHT zum selben
//       Endzustand wie ihr FLACHES Mittel (naive Erwartung: Durchschnitt der Extreme =
//       Umwelt beim Mittelwert). Die multiplikative, floor-begrenzte Fitness-Landschaft
//       bestraft Fehlanpassung an EINEM Extrem des Zyklus haerter als Ueberanpassung am
//       anderen - die Population "hedged" zu einem Wert, den keine einzelne Momentaufnahme
//       erklaert. Das ist der Kern der Roadmap-Aussage "ein zyklischer Jahresgang ist etwas
//       anderes als ein hoher oder tiefer Wert".
//
//   (2) LAG/DAEMPFUNG: bei KURZER Zyklusdauer (viele "Jahreszeiten" pro Anpassungs-
//       Zeitskala) kann die Population dem Zyklus nicht folgen - ihr Merkmalsmittel
//       oszilliert gedaempft, mit kleinerer Amplitude als die Umwelt selbst. Bei LANGER
//       Zyklusdauer (viel Zeit pro Jahreszeit) folgt sie fast vollstaendig. Das ist ein
//       generisches Merkmal periodisch angetriebener dynamischer Systeme, hier zum ersten
//       Mal ueberhaupt messbar, weil die Engine bisher nur Punkt-Umwelten kannte.
//
// Aufruf: npm run seasonal-check
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runSeasonal } from "../dist/world/seasonal.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const BASE = {
  temperature: 0.5, predation: 0.3, foodAbundance: 0.65, foodHeight: 0.2, light: 0.5, water: 0.4,
  toxicity: 0, oxygen: 1, salinity: 0,
};
const INSULATION = 0;
const GEN = 400;
const SEEDS = [1, 2, 3];

console.log("Phase 6 — Umwelt als Funktion der Zeit, 3 Seeds, 400 Generationen\n");

console.log("=== (1) Kompromiss/Hedging: Zyklus vs. flaches Mittel ===");
function finalInsulation(amplitude, period, seed) {
  const { pop } = runSeasonal(
    { numGenes: NG }, phys, BASE,
    { axis: "temperature", amplitude, period }, INSULATION, GEN, seed,
  );
  return pop.mean()[INSULATION];
}
const diffs = SEEDS.map((s) => finalInsulation(0.35, 40, s) - finalInsulation(0, 40, s));
const meanDiff = diffs.reduce((a, c) => a + c, 0) / diffs.length;
for (const [i, s] of SEEDS.entries()) {
  console.log(`  seed ${s}: Δ Isolation (zyklisch − flaches Mittel) = ${diffs[i].toFixed(3)}`);
}
console.log(`  Mittlere Abweichung: ${meanDiff.toFixed(3)}`);
const hedges = Math.abs(meanDiff) > 0.15;
console.log(`  Zyklische Umwelt weicht vom flachen Mittel ab (> 0.15):  ${hedges ? "OK" : "FAIL"}`);

console.log("\n=== (2) Lag/Dämpfung: kurzer vs. langer Zyklus ===");
function trackingAmplitude(period, seed) {
  const { history } = runSeasonal(
    { numGenes: NG }, phys, BASE,
    { axis: "temperature", amplitude: 0.35, period }, INSULATION, GEN, seed,
  );
  const tail = history.slice(-Math.min(period * 3, 200));
  const vals = tail.map((h) => h.traitMean);
  return (Math.max(...vals) - Math.min(...vals)) / 2;
}
const shortAmp = SEEDS.map((s) => trackingAmplitude(10, s));
const longAmp = SEEDS.map((s) => trackingAmplitude(150, s));
const mShort = shortAmp.reduce((a, c) => a + c, 0) / shortAmp.length;
const mLong = longAmp.reduce((a, c) => a + c, 0) / longAmp.length;
console.log(`  kurzer Zyklus (period=10):   beobachtete Merkmals-Amplitude = ${mShort.toFixed(3)}  (Umwelt-Amplitude 0.35)`);
console.log(`  langer Zyklus (period=150):  beobachtete Merkmals-Amplitude = ${mLong.toFixed(3)}  (Umwelt-Amplitude 0.35)`);
const damped = mShort < 0.5 * mLong;
const tracks = mLong > 0.8 * 0.35;
console.log(`  kurzer Zyklus gedaempft (< 50% des langen):               ${damped ? "OK" : "FAIL"}`);
console.log(`  langer Zyklus folgt fast vollstaendig (> 80% der Umwelt):  ${tracks ? "OK" : "FAIL"}`);

const allOk = hedges && damped && tracks;
console.log("");
if (allOk) {
  console.log("Status: OK — eine zyklische Umwelt erzeugt sowohl einen eigenen Kompromiss-");
  console.log("Endzustand als auch periodenabhaengige Daempfung - beides existiert nicht bei");
  console.log("einer Punkt-Umwelt und ist damit ein echter Zeitachsen-Effekt.");
} else {
  console.log("Status: FAIL.");
  process.exit(1);
}
