// Trainings-Schleife: kalibriert die schlanke Engine gegen das Referenz-Orakel.
//
// Methode: genetischer Algorithmus (passenderweise!) sucht die Engine-Parameter,
// die die Orakel-Trajektorien der TRAININGS-Szenarien am besten nachbilden.
// Danach wird die Validitaet auf ZURUECKGEHALTENEN Test-Szenarien gemessen
// (Overfitting-Schutz) - das ist die Zahl fuer den Prozentbalken.
//
// Autonomie-Regel (mit dir abgestimmt): hier werden NUR kontinuierliche
// Parameter automatisch gefittet. Struktur (neue Gene/Mechaniken) bleibt eine
// bewusste, bestaetigte Entscheidung und passiert NICHT hier.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runSimulation } from "../engine/index.js";
import type { EngineParams, Environment, Physics, TraitVector } from "../engine/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", ".."); // dist/training -> repo root

// ---- Ziel-Band (mit dir abgestimmt) ----
const TARGET_LOW = 80;
const TARGET_HIGH = 90;
// Skala fuer die Validitaets-Umrechnung: MAE 0 -> 100%, MAE >= 0.25 -> 0%.
const VALIDITY_SCALE = 0.25;

// ---- Parameter-Grenzen fuer den GA ----
// Reihenfolge: responseRate[0..7] (8 Gene), mutationRate, selectionStrength, varianceWeight
// responseRate/selectionStrength weiter gefasst, weil die Varianz-Daempfung die
// effektiven Schritte verkleinert - schnelle Szenarien brauchen mehr Spielraum.
const NUM_GENES = 9;
const BOUNDS: [number, number][] = [
  ...Array.from({ length: NUM_GENES }, () => [0.005, 0.8] as [number, number]),
  [0.0, 0.12], // mutationRate
  [0.3, 6.0], // selectionStrength
  [0.0, 1.0], // varianceWeight
];
const DIM = BOUNDS.length;

// ---- Seedbarer RNG (mulberry32) fuer reproduzierbares Training ----
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240607);
function randn(): number {
  // Box-Muller
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Scenario {
  name: string;
  split: "train" | "test";
  generations: number;
  env: Environment;
}
interface Benchmark {
  name: string;
  trajectory: TraitVector[];
}

function vecToParams(v: number[]): EngineParams {
  return {
    responseRate: v.slice(0, NUM_GENES),
    mutationRate: v[NUM_GENES],
    selectionStrength: v[NUM_GENES + 1],
    varianceWeight: v[NUM_GENES + 2],
  };
}

/** Mittlerer absoluter Fehler zwischen Engine- und Orakel-Trajektorie. */
function trajectoryMAE(a: TraitVector[], b: TraitVector[]): number {
  const len = Math.min(a.length, b.length);
  const dim = a[0].length;
  let sum = 0;
  let count = 0;
  for (let t = 0; t < len; t++) {
    for (let g = 0; g < dim; g++) {
      sum += Math.abs(a[t][g] - b[t][g]);
      count++;
    }
  }
  return sum / count;
}

function meanMAEover(
  scenarios: Scenario[],
  benchmarks: Map<string, Benchmark>,
  params: EngineParams,
  phys: Physics,
): number {
  let sum = 0;
  for (const sc of scenarios) {
    const bench = benchmarks.get(sc.name);
    if (!bench) continue;
    const result = runSimulation(sc.env, sc.generations, phys, params);
    sum += trajectoryMAE(result.trajectory, bench.trajectory);
  }
  return sum / scenarios.length;
}

function clampToBounds(v: number[]): number[] {
  return v.map((x, i) => {
    const [lo, hi] = BOUNDS[i];
    return x < lo ? lo : x > hi ? hi : x;
  });
}

function randomVector(): number[] {
  return BOUNDS.map(([lo, hi]) => lo + rng() * (hi - lo));
}

function maeToValidity(mae: number): number {
  const v = 100 * (1 - mae / VALIDITY_SCALE);
  return v < 0 ? 0 : v > 100 ? 100 : v;
}

function main() {
  const phys: Physics = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(ROOT, "scenarios.json"), "utf-8"),
  ).scenarios;

  // Orakel-Benchmarks laden
  const benchIndex: { name: string; file: string }[] = JSON.parse(
    readFileSync(join(ROOT, "oracle", "benchmark", "index.json"), "utf-8"),
  );
  const benchmarks = new Map<string, Benchmark>();
  for (const entry of benchIndex) {
    const b: Benchmark = JSON.parse(
      readFileSync(join(ROOT, "oracle", "benchmark", entry.file), "utf-8"),
    );
    benchmarks.set(b.name, b);
  }

  const trainSet = scenarios.filter((s) => s.split === "train");
  const testSet = scenarios.filter((s) => s.split === "test");
  console.log(
    `Training an ${trainSet.length} Szenarien, Validierung an ${testSet.length} zurueckgehaltenen.`,
  );

  // ---- Genetischer Algorithmus ----
  // Budget skaliert mit der Parameterzahl (11 Dim bei 8 Genen).
  const POP = 72;
  const GENS = 140;
  const ELITE = 3;
  const TOURN = 3;

  let population = Array.from({ length: POP }, randomVector);
  const evalLoss = (v: number[]) =>
    meanMAEover(trainSet, benchmarks, vecToParams(clampToBounds(v)), phys);
  let scored = population.map((v) => ({ v, loss: evalLoss(v) }));
  scored.sort((a, b) => a.loss - b.loss);

  for (let gen = 0; gen < GENS; gen++) {
    const next: number[][] = scored.slice(0, ELITE).map((s) => s.v.slice());
    while (next.length < POP) {
      // Turnierselektion
      const pick = () => {
        let best = scored[Math.floor(rng() * scored.length)];
        for (let i = 1; i < TOURN; i++) {
          const c = scored[Math.floor(rng() * scored.length)];
          if (c.loss < best.loss) best = c;
        }
        return best.v;
      };
      const pa = pick();
      const pb = pick();
      // Uniforme Rekombination + gausssche Mutation
      const child = pa.map((_, i) => {
        let g = rng() < 0.5 ? pa[i] : pb[i];
        const [lo, hi] = BOUNDS[i];
        const sd = (hi - lo) * 0.08;
        if (rng() < 0.3) g += randn() * sd;
        return g;
      });
      next.push(clampToBounds(child));
    }
    population = next;
    scored = population.map((v) => ({ v, loss: evalLoss(v) }));
    scored.sort((a, b) => a.loss - b.loss);

    if (gen % 10 === 0 || gen === GENS - 1) {
      const best = scored[0];
      console.log(
        `  Gen ${String(gen).padStart(3)}: Train-MAE ${best.loss.toFixed(4)}  ` +
          `(~${maeToValidity(best.loss).toFixed(1)}% Train-Validitaet)`,
      );
    }
  }

  const bestVec = clampToBounds(scored[0].v);
  const bestParams = vecToParams(bestVec);

  const trainMAE = meanMAEover(trainSet, benchmarks, bestParams, phys);
  const testMAE = meanMAEover(testSet, benchmarks, bestParams, phys);
  const validityTrain = maeToValidity(trainMAE);
  const validityTest = maeToValidity(testMAE);

  const output = {
    _comment:
      "Automatisch von training/fit.ts erzeugt. Von Engine/Mockup gelesen. " +
      "'validityTest' (zurueckgehaltene Szenarien) treibt den Prozentbalken.",
    params: bestParams,
    validityTrain,
    validityTest,
    trainMAE,
    testMAE,
    targetLow: TARGET_LOW,
    targetHigh: TARGET_HIGH,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(ROOT, "fitted-params.json"), JSON.stringify(output, null, 2), "utf-8");

  console.log("\n=== Trainingsergebnis ===");
  console.log(`Train-Validitaet: ${validityTrain.toFixed(1)}%`);
  console.log(`Test-Validitaet (zurueckgehalten): ${validityTest.toFixed(1)}%  <- der Prozentbalken`);
  console.log(`Ziel-Band: ${TARGET_LOW}-${TARGET_HIGH}%`);
  // Rundungskonsistent zum angezeigten Wert (1 Nachkommastelle).
  const shown = Math.round(validityTest * 10) / 10;
  const inBand = shown >= TARGET_LOW && shown <= TARGET_HIGH;
  const status = inBand
    ? shown < TARGET_LOW + 1
      ? `im Ziel-Band (unteres Ende; roh ${validityTest.toFixed(2)}%).`
      : "im Ziel-Band."
    : shown > TARGET_HIGH
      ? "ueber dem Band - Engine evtl. zu nah am schweren Modell."
      : "unter dem Band - Engine muss reicher/besser kalibriert werden.";
  console.log(`Status: ${status}`);
  console.log("Gespeichert: fitted-params.json");
}

main();
