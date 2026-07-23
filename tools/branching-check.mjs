// Emergenz-Nachweis (produktiv): frequenzabhaengige Konkurrenz erzeugt in unserem
// Populations-Kern echtes evolutionaeres Branching — Vielfalt, die reine Selektion
// (Kontrolle) prinzipiell nicht kann (Fisher: Selektion zehrt Varianz auf).
// Produktive Fassung des Befunds aus spike/FINDINGS.md.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";
import { modes1D } from "../dist/world/cluster.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const SIZE = 1; // Koerpergroesse als Ressourcen-Achse (klassisches Character-Displacement)
const env = { temperature: 0.5, predation: 0.4, foodAbundance: 0.7, foodHeight: 0.35, light: 0.45, water: 0.5 };
const SEEDS = [1, 2, 3, 4, 5];

function trial(comp, seed) {
  const pop = new Population({ numGenes: NG, competition: comp }, seed);
  for (let i = 0; i < 600; i++) pop.step(env, phys);
  const sz = pop.axisValues(SIZE);
  const mean = sz.reduce((a, c) => a + c, 0) / sz.length;
  const sd = Math.sqrt(sz.reduce((a, c) => a + (c - mean) ** 2, 0) / sz.length);
  return { modes: modes1D(sz, { bandwidth: 0.05 }).count, sd };
}

const COMP = { axis: SIZE, sigmaC: 0.35, sigmaK: 9, kCenter: 0.5 };
const ctl = SEEDS.map((s) => trial(null, s));
const brc = SEEDS.map((s) => trial(COMP, s));
const ctlModes = ctl.map((r) => r.modes);
const brcModes = brc.map((r) => r.modes);
const ctlSd = ctl.reduce((a, r) => a + r.sd, 0) / ctl.length;
const brcSd = brc.reduce((a, r) => a + r.sd, 0) / brc.length;

console.log("Branching-Test — Groessen-Achse, 5 Seeds, 600 Generationen\n");
console.log(`  Kontrolle (keine Konkurrenz):   Modi ${JSON.stringify(ctlModes)}  mittl. SD ${ctlSd.toFixed(3)}`);
console.log(`  Konkurrenz (sigmaC<sigmaK):      Modi ${JSON.stringify(brcModes)}  mittl. SD ${brcSd.toFixed(3)}`);

const ctlAll1 = ctlModes.every((m) => m === 1);
const brcAll2 = brcModes.every((m) => m >= 2);
const disruptive = brcSd > 1.4 * ctlSd;
console.log("");
console.log(`  Kontrolle stets unimodal (1 Cluster):        ${ctlAll1 ? "OK" : "FAIL"}`);
console.log(`  Konkurrenz spaltet auf (>=2 Cluster):        ${brcAll2 ? "OK" : "FAIL"}`);
console.log(`  Konkurrenz erhoeht Varianz (disruptiv):      ${disruptive ? "OK" : "FAIL"} (${(brcSd / ctlSd).toFixed(2)}x)`);
if (ctlAll1 && brcAll2 && disruptive) {
  console.log("\nStatus: OK — Branching emergiert im Populations-Kern (Koexistenz aus Frequenzabhaengigkeit).");
} else {
  console.log("\nStatus: FAIL — Branching nicht reproduziert.");
  process.exit(1);
}
