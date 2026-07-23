// Stufe 5 — Red Queen: mit endogenen, koevolvierenden Räubern erreicht das
// System KEIN statisches Gleichgewicht (fortwährendes Wettrüsten), während es
// ohne Räuber zur Ruhe kommt. Zusätzlich: Räuber halten echten Druck aufrecht.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ecosystem, temporalSd } from "../dist/world/coevolution.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const env = { temperature: 0.5, predation: 0.2, foodAbundance: 0.75, foodHeight: 0.35, light: 0.45, water: 0.5 };
const GENS = 500, LAST = 150;

function run(withPred, seed) {
  const eco = new Ecosystem(env, phys, { numGenes: NG }, {}, seed);
  for (let i = 0; i < GENS; i++) eco.step(withPred);
  const preyMeans = eco.history.map((h) => h.preyMean);
  const preds = eco.history.slice(-LAST).map((h) => h.predation);
  return {
    sd: temporalSd(preyMeans, LAST),
    meanPredation: preds.reduce((a, c) => a + c, 0) / preds.length,
  };
}

const SEEDS = [1, 2, 3];
const ctl = SEEDS.map((s) => run(false, s));
const coe = SEEDS.map((s) => run(true, s));
const ctlSd = ctl.reduce((a, r) => a + r.sd, 0) / ctl.length;
const coeSd = coe.reduce((a, r) => a + r.sd, 0) / coe.length;
const coePred = coe.reduce((a, r) => a + r.meanPredation, 0) / coe.length;

console.log("Stufe 5 — Räuber-Beute-Koevolution (Red Queen), 3 Seeds, 500 Generationen\n");
console.log(`  ohne Räuber:  zeitl. SD der Beute-Größe (letzte ${LAST} Gen) = ${ctlSd.toFixed(4)}  (kommt zur Ruhe)`);
console.log(`  mit Räubern:  zeitl. SD der Beute-Größe (letzte ${LAST} Gen) = ${coeSd.toFixed(4)}  (Wettrüsten)`);
console.log(`  mit Räubern:  mittlerer endogener Räuberdruck = ${coePred.toFixed(3)}`);

const redQueen = coeSd > 2.5 * ctlSd;
const realPressure = coePred > 0.05;
console.log("");
console.log(`  Koevolution destabilisiert (Red Queen, kein Stillstand):  ${redQueen ? "OK" : "FAIL"} (${(coeSd / Math.max(ctlSd,1e-6)).toFixed(1)}x)`);
console.log(`  Räuber üben echten endogenen Druck aus:                   ${realPressure ? "OK" : "FAIL"}`);
if (redQueen && realPressure) console.log("\nStatus: OK — biotische Interaktion erzeugt Red-Queen-Dynamik im Kern.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
