// Durchsatz/Performance-Referenzmessung (Punkt 2, Migrations-Stufe 0). Kein Gate — reine
// Kennzahlen fuer docs/engine-forschungsergebnis.md Abschnitt 5, erneut laufen lassen, um
// Regressionen bei spaeteren Migrations-Stufen zu bemerken.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { Population } from "../../dist/world/population.js";
import { clusters } from "../../dist/world/cluster.js";
import { stepGeneration } from "../../dist/engine/simulate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const env = { temperature: 0.3, predation: 0.4, foodAbundance: 0.6, foodHeight: 0.4, light: 0.5, water: 0.8 };

// 1) raw fitness throughput
const g = new Array(25).fill(0.5);
let s = 0;
let t0 = performance.now();
const NF = 2_000_000;
for (let i = 0; i < NF; i++) { g[1] = (i % 100) / 100; s += fitness(g, env, phys); }
let t1 = performance.now();
console.log(`fitness(): ${NF} calls in ${(t1-t0).toFixed(1)}ms -> ${((t1-t0)/NF*1e6).toFixed(0)} ns/call, ${(NF/(t1-t0)/1000).toFixed(2)} M/s  (sink ${s.toFixed(2)})`);

// 2) Population.step for several N
for (const N of [100, 200, 300, 500, 1000]) {
  const pop = new Population({ size: N, numGenes: 25 }, 42);
  for (let i = 0; i < 20; i++) pop.step(env, phys);
  const reps = 200;
  t0 = performance.now();
  for (let i = 0; i < reps; i++) pop.step(env, phys);
  t1 = performance.now();
  console.log(`Population.step N=${N}: ${((t1-t0)/reps).toFixed(3)} ms/gen`);
}

// 3) Population.step WITH competition kernel (O(N^2))
for (const N of [100, 200, 300, 500]) {
  const pop = new Population({ size: N, numGenes: 25, competition: { axis: 1, sigmaC: 0.1, sigmaK: 0.25, kCenter: 0.5 } }, 42);
  for (let i = 0; i < 10; i++) pop.step(env, phys);
  const reps = 100;
  t0 = performance.now();
  for (let i = 0; i < reps; i++) pop.step(env, phys);
  t1 = performance.now();
  console.log(`Population.step+competition N=${N}: ${((t1-t0)/reps).toFixed(3)} ms/gen`);
}

// 4) clusters() O(N^2 * G)
for (const N of [100, 200, 300, 500]) {
  const pop = new Population({ size: N, numGenes: 25 }, 7);
  for (let i = 0; i < 50; i++) pop.step(env, phys);
  const reps = 50;
  t0 = performance.now();
  let c;
  for (let i = 0; i < reps; i++) c = clusters(pop.genomes, { radius: 0.7, minFraction: 0.06 });
  t1 = performance.now();
  console.log(`clusters() N=${N}: ${((t1-t0)/reps).toFixed(3)} ms  (found ${c.length})`);
}

// 5) current mean-field stepGeneration (25 genes -> 50 fitness evals + baseline)
const params = {
  responseRate: new Array(25).fill(0.15),
  mutationRate: 0.03, selectionStrength: 1.5, varianceWeight: 0.5,
  mutationAnchor: new Array(25).fill(0).map((_, i) => (i < 10 ? 0.5 : 0.12)),
};
let m = new Array(25).fill(0.5);
for (let i = 0; i < 100; i++) m = stepGeneration(m, env, phys, params);
const reps = 20000;
t0 = performance.now();
for (let i = 0; i < reps; i++) m = stepGeneration(m, env, phys, params);
t1 = performance.now();
console.log(`stepGeneration() (status quo mean-field): ${((t1-t0)/reps*1000).toFixed(1)} us/gen`);
