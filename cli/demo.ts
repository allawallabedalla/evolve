// Terminal-Version der Text-Demo. Nutzt EXAKT dieselbe Engine wie das
// Browser-Mockup - so ist die Kernlogik auch ohne Browser pruefbar.
//
// Aufruf:
//   node dist/cli/demo.js                 -> Standard-Szenario
//   node dist/cli/demo.js "Eiszeit"       -> benanntes Szenario
//   node dist/cli/demo.js all             -> alle Szenarien
//   node dist/cli/demo.js "" 0.1 0.8 0.6 0.2 0.5 0.6 60  -> freie Umwelt: temp pred food height light water gens

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runSimulation,
  formatRunReport,
  DEFAULT_ENGINE_PARAMS,
} from "../engine/index.js";
import type { EngineParams, Environment, Physics, ValidityInfo } from "../engine/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

interface Scenario {
  name: string;
  split: string;
  generations: number;
  env: Environment;
}

function load(): {
  phys: Physics;
  scenarios: Scenario[];
  params: EngineParams;
  validity?: ValidityInfo;
} {
  const phys: Physics = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(ROOT, "scenarios.json"), "utf-8"),
  ).scenarios;

  let params = DEFAULT_ENGINE_PARAMS;
  let validity: ValidityInfo | undefined;
  const fp = join(ROOT, "fitted-params.json");
  if (existsSync(fp)) {
    const fitted = JSON.parse(readFileSync(fp, "utf-8"));
    params = fitted.params;
    validity = {
      validityTest: fitted.validityTest,
      validityTrain: fitted.validityTrain,
      targetLow: fitted.targetLow,
      targetHigh: fitted.targetHigh,
    };
  } else {
    console.log("(Noch keine fitted-params.json - nutze Default-Parameter. 'npm run all' fuers Training.)\n");
  }
  return { phys, scenarios, params, validity };
}

function runScenario(sc: Scenario, phys: Physics, params: EngineParams, validity?: ValidityInfo) {
  const result = runSimulation(sc.env, sc.generations, phys, params);
  console.log(formatRunReport(sc.name, sc.env, result, phys, validity));
  console.log("");
}

function main() {
  const { phys, scenarios, params, validity } = load();
  const arg = process.argv[2];

  if (arg === "all") {
    for (const sc of scenarios) runScenario(sc, phys, params, validity);
    return;
  }

  // Freie Umwelt?  demo.js "" temp pred food height light water gens
  if (arg === "" && process.argv.length >= 10) {
    // Robust: NaN -> 0.5, Regler auf 0..1 klemmen, gens als Integer >= 0.
    const lever = (s: string) => {
      const v = Number(s);
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
    };
    const [temp, pred, food, height, light, water] = process.argv.slice(3, 9).map(lever);
    const gensRaw = Number(process.argv[9]);
    const gens = Number.isFinite(gensRaw) ? Math.max(0, Math.floor(gensRaw)) : 60;
    const sc: Scenario = {
      name: "Freie Umwelt",
      split: "custom",
      generations: gens,
      env: { temperature: temp, predation: pred, foodAbundance: food, foodHeight: height, light, water },
    };
    runScenario(sc, phys, params, validity);
    return;
  }

  const name = arg ?? "Eiszeit";
  const sc = scenarios.find((s) => s.name === name) ?? scenarios[0];
  runScenario(sc, phys, params, validity);
}

main();
