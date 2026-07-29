// Reachability-Experiment: welche Formen erreicht welches Regime? (Punkt 2, Migrations-Stufe
// 0). Kein Gate — Referenzmessung fuer docs/engine-forschungsergebnis.md, Messung 3.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stepGeneration } from "../../dist/engine/simulate.js";
import { Population, mulberry32 } from "../../dist/world/population.js";
import { clusters } from "../../dist/world/cluster.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const fitted = JSON.parse(readFileSync(join(ROOT, "fitted-params.json"), "utf8")).params;

const SAMPLES = 400;
const GENS = 250;

function envFor(rng) {
  return {
    temperature: rng(), predation: rng(), foodAbundance: rng(),
    foodHeight: rng(), light: rng(), water: rng(),
  };
}

function tally(map, name) { map.set(name, (map.get(name) ?? 0) + 1); }
function report(label, map, denom) {
  const rows = [...map.entries()].sort((a,b)=>b[1]-a[1]);
  console.log(`\n### ${label}  (${rows.length} verschiedene Formen)`);
  for (const [n,c] of rows) console.log(`   ${(100*c/denom).toFixed(1).padStart(5)}%  ${n}`);
}

// --- A: Status quo, Mean-Field-Gradientenaufstieg von 0.5, ohne Drift ---
{
  const rng = mulberry32(999);
  const map = new Map();
  const t0 = performance.now();
  for (let s = 0; s < SAMPLES; s++) {
    const env = envFor(rng);
    let m = new Array(25).fill(0.5);
    for (let i = 0; i < GENS; i++) m = stepGeneration(m, env, phys, fitted);
    tally(map, classify(m).n);
  }
  console.log(`A dauer: ${(performance.now()-t0).toFixed(0)}ms`);
  report("A) Status quo: Mean-Field-Gradientenaufstieg, deterministisch", map, SAMPLES);
}

// --- B: Status quo + Drift (Spiel-Modus, seed) ---
{
  const rng = mulberry32(999);
  const map = new Map();
  for (let s = 0; s < SAMPLES; s++) {
    const env = envFor(rng);
    const r2 = mulberry32(s * 2654435761 >>> 0);
    const randn = () => { const u = Math.max(r2(),1e-9), v = r2(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
    let m = new Array(25).fill(0.5);
    for (let i = 0; i < GENS; i++) m = stepGeneration(m, env, phys, fitted, randn);
    tally(map, classify(m).n);
  }
  report("B) Status quo + stochastische Drift (Spiel-Modus)", map, SAMPLES);
}

// --- C: Agentenpopulation N=300, Mittelwert-Genom ---
{
  const rng = mulberry32(999);
  const map = new Map();
  const t0 = performance.now();
  for (let s = 0; s < SAMPLES; s++) {
    const env = envFor(rng);
    const pop = new Population({ size: 300, numGenes: 25 }, (s*2654435761)>>>0);
    for (let i = 0; i < GENS; i++) pop.step(env, phys);
    tally(map, classify(pop.mean()).n);
  }
  console.log(`C dauer: ${(performance.now()-t0).toFixed(0)}ms`);
  report("C) Agentenpopulation N=300, Mittelwert", map, SAMPLES);
}

// --- D: Agentenpopulation + Konkurrenz-Kernel, ALLE Cluster gezaehlt ---
{
  const rng = mulberry32(999);
  const map = new Map();
  let total = 0;
  const t0 = performance.now();
  for (let s = 0; s < SAMPLES; s++) {
    const env = envFor(rng);
    const pop = new Population({ size: 300, numGenes: 25,
      competition: { axis: 1, sigmaC: 0.10, sigmaK: 0.25, kCenter: 0.5 } }, (s*2654435761)>>>0);
    for (let i = 0; i < GENS; i++) pop.step(env, phys);
    const cl = clusters(pop.genomes, { radius: 0.6, minFraction: 0.08 });
    for (const c of cl) { tally(map, classify(c.centroid).n); total++; }
  }
  console.log(`D dauer: ${(performance.now()-t0).toFixed(0)}ms, ${(total/SAMPLES).toFixed(2)} Cluster/Umwelt`);
  report("D) Population + Konkurrenz (size-Achse), alle Cluster", map, total);
}

// --- E: 4 Demes mit gestreuten Startpunkten + Konkurrenz, alle Cluster ---
{
  const rng = mulberry32(999);
  const map = new Map();
  let total = 0;
  const t0 = performance.now();
  const STARTS = [0.5, 0.2, 0.75, 0.35];
  for (let s = 0; s < SAMPLES; s++) {
    const env = envFor(rng);
    for (let d = 0; d < 4; d++) {
      const pop = new Population({ size: 150, numGenes: 25, startSpread: 0.22,
        competition: { axis: 1, sigmaC: 0.10, sigmaK: 0.25, kCenter: 0.5 } },
        ((s*4+d)*2654435761)>>>0, STARTS[d]);
      for (let i = 0; i < GENS; i++) pop.step(env, phys);
      const cl = clusters(pop.genomes, { radius: 0.6, minFraction: 0.10 });
      for (const c of cl) { tally(map, classify(c.centroid).n); total++; }
    }
  }
  console.log(`E dauer: ${(performance.now()-t0).toFixed(0)}ms, ${(total/SAMPLES).toFixed(2)} Cluster/Umwelt`);
  report("E) 4 Demes, gestreute Starts + Konkurrenz, alle Cluster", map, total);
}
