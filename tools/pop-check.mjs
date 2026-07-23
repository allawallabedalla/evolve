// Dynamik-Treue: die TS-Population (world/population.ts) muss auf denselben
// Attraktor konvergieren wie das Python-Orakel (dessen Benchmark-Finals). Beide
// sind Populationen auf derselben Fitness; sie duerfen nur um Drift/RNG abweichen.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const scenarios = JSON.parse(readFileSync(join(ROOT, "scenarios.json"), "utf-8")).scenarios;
const idx = JSON.parse(readFileSync(join(ROOT, "oracle", "benchmark", "index.json"), "utf-8"));
const NG = phys.traits.length;

const finals = new Map();
for (const e of idx) {
  const b = JSON.parse(readFileSync(join(ROOT, "oracle", "benchmark", e.file), "utf-8"));
  finals.set(b.name, b.final);
}

let worst = 0, sum = 0, n = 0;
console.log("Szenario            gen   mittl.|TS-Orakel|  (schlechteste Achse)");
for (const sc of scenarios) {
  const oracleFinal = finals.get(sc.name);
  if (!oracleFinal) continue;
  // Mehrere Seeds mitteln (Drift rausmitteln), wie der Benchmark ueber Laeufe.
  const R = 4, meanAcc = new Array(NG).fill(0);
  for (let r = 0; r < R; r++) {
    const pop = new Population({ numGenes: NG }, 1234 + r * 101);
    for (let i = 0; i < sc.generations; i++) pop.step(sc.env, phys);
    const m = pop.mean();
    for (let g = 0; g < NG; g++) meanAcc[g] += m[g] / R;
  }
  let mad = 0, mx = 0;
  for (let g = 0; g < NG; g++) {
    const d = Math.abs(meanAcc[g] - oracleFinal[g]);
    mad += d / NG; mx = Math.max(mx, d);
  }
  sum += mad; n++; worst = Math.max(worst, mad);
  console.log(`  ${sc.name.padEnd(18)} ${String(sc.generations).padStart(3)}   ${mad.toFixed(3)}            (${mx.toFixed(2)})`);
}
const avg = sum / n;
console.log(`\nDurchschnitt |TS-Orakel| = ${avg.toFixed(3)} | schlechtestes Szenario = ${worst.toFixed(3)}`);
const THRESH = 0.10;
if (avg < THRESH && worst < 0.18) {
  console.log(`Status: OK — TS-Population deckt sich mit dem Orakel-Attraktor (< ${THRESH}).`);
} else {
  console.log(`Status: ABWEICHUNG zu gross — Dynamik weicht vom Orakel ab.`);
  process.exit(1);
}
