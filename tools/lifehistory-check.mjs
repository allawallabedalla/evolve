// Stufe Phase 7 (Lebendige-Welt-Roadmap, Punkt 10) — Populations-/Life-History-Ebene:
// r/K-Selektion (MacArthur & Wilson 1967) als WELT-Eigenschaft, kein Einzel-Gen-
// Phänotyp. world/lifehistory.ts fügt variable Populationsgröße hinzu (logistisches
// Wachstum zur Tragfähigkeit K) neben dem bisher IMMER festgrößigen Population-Kern.
//
// Zwei Vorhersagen der klassischen r/K-Theorie, beide GEMESSEN (dieselbe Methode wie
// coevolution-check.mjs/symbiosis-check.mjs/seasonal-check.mjs):
//
//   (1) r-Strategen (hohe Wachstumsrate r, schwache Selektionsschärfe je Nachkomme)
//       erholen sich nach einem Bestands-Engpass (Katastrophe) SCHNELLER auf die
//       Tragfähigkeit als K-Strategen — der klassische Vorteil in instabilen/
//       unvorhersehbaren Umwelten.
//   (2) K-Strategen (niedrige Wachstumsrate, scharfe Selektion um wenige Plätze bei
//       Tragfähigkeit) erreichen in einer STABILEN, überfüllten Umwelt (kein Engpass,
//       Population bei K) eine HÖHERE mittlere Fitness am Gleichgewicht als r-Strategen
//       — der klassische Vorteil bei Ressourcen-Knappheit/Konkurrenz statt roher Zahl.
//
// Aufruf: npm run lifehistory-check
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population, mulberry32 } from "../dist/world/population.js";
import { stepVariableSize, makeRandn } from "../dist/world/lifehistory.js";
import { fitness } from "../dist/engine/fitness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const env = {
  temperature: 0.5, predation: 0.3, foodAbundance: 0.65, foodHeight: 0.2, light: 0.5, water: 0.4,
  toxicity: 0, oxygen: 1, salinity: 0,
};

const K = 200;
const R_STRAT = { r: 1.2, K, selPower: 1.0 };
const K_STRAT = { r: 0.25, K, selPower: 3.5 };
const SEEDS = [1, 2, 3];
const GENS = 300;
const CRASH_EVERY = 60;
const CRASH_TO_FRAC = 0.1;

console.log("Phase 7 — Populations-/Life-History-Ebene (r/K-Selektion), 3 Seeds\n");

function meanFitness(pop) {
  return pop.genomes.reduce((s, g) => s + fitness(g, env, phys), 0) / pop.size;
}

function shuffleKeep(pop, frac, rng) {
  const keep = Math.max(2, Math.round(pop.size * frac));
  const idx = Array.from({ length: pop.size }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  pop.genomes = idx.slice(0, keep).map((i) => pop.genomes[i]);
}

function runDisturbance(cfg, seed) {
  const rng = mulberry32(seed * 7 + 3);
  const randn = makeRandn(rng);
  const pop = new Population({ numGenes: NG, size: 20 }, seed);
  const sizes = [];
  for (let g = 0; g < GENS; g++) {
    if (g > 0 && g % CRASH_EVERY === 0) shuffleKeep(pop, CRASH_TO_FRAC, rng);
    stepVariableSize(pop, env, phys, cfg, rng, randn);
    sizes.push(pop.size);
  }
  const afterLastCrash = sizes.slice(GENS - CRASH_EVERY);
  const idx = afterLastCrash.findIndex((s) => s >= 0.9 * K);
  return idx < 0 ? CRASH_EVERY : idx;
}

console.log("=== (1) Erholung nach Engpass (alle 60 Gen auf 10% von K gecrasht) ===");
const rRecover = SEEDS.map((s) => runDisturbance(R_STRAT, s));
const kRecover = SEEDS.map((s) => runDisturbance(K_STRAT, s));
const mR = rRecover.reduce((a, c) => a + c, 0) / rRecover.length;
const mK = kRecover.reduce((a, c) => a + c, 0) / kRecover.length;
console.log(`  r-Stratege: mittlere Erholungszeit auf 90% K = ${mR.toFixed(1)} Gen`);
console.log(`  K-Stratege: mittlere Erholungszeit auf 90% K = ${mK.toFixed(1)} Gen`);
const rRecoversFaster = mR < 0.5 * mK;
console.log(`  r-Stratege erholt sich deutlich schneller (< 50% der K-Zeit):  ${rRecoversFaster ? "OK" : "FAIL"}`);

console.log("\n=== (2) Qualität im stabilen, überfüllten Regime (kein Crash, Start bei K) ===");
function runStable(cfg, seed) {
  const rng = mulberry32(seed * 11 + 5);
  const randn = makeRandn(rng);
  const pop = new Population({ numGenes: NG, size: K }, seed);
  for (let g = 0; g < GENS; g++) stepVariableSize(pop, env, phys, cfg, rng, randn);
  return meanFitness(pop);
}
const rFit = SEEDS.map((s) => runStable(R_STRAT, s));
const kFit = SEEDS.map((s) => runStable(K_STRAT, s));
const mRf = rFit.reduce((a, c) => a + c, 0) / rFit.length;
const mKf = kFit.reduce((a, c) => a + c, 0) / kFit.length;
console.log(`  r-Stratege: mittlere Fitness am Gleichgewicht = ${mRf.toFixed(4)}`);
console.log(`  K-Stratege: mittlere Fitness am Gleichgewicht = ${mKf.toFixed(4)}`);
const kFitterAtEquilibrium = mKf > 1.15 * mRf;
console.log(`  K-Stratege erreicht deutlich hoehere Qualitaet (> 15% mehr):    ${kFitterAtEquilibrium ? "OK" : "FAIL"}`);

const allOk = rRecoversFaster && kFitterAtEquilibrium;
console.log("");
if (allOk) {
  console.log("Status: OK — r/K-Selektion (MacArthur & Wilson 1967) reproduziert sich als");
  console.log("Populations-Eigenschaft: r gewinnt bei Stoerung, K gewinnt bei Ueberfuellung.");
} else {
  console.log("Status: FAIL.");
  process.exit(1);
}
