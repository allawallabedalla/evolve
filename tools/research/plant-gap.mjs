// Nutzer-Frage (2026-08-09), Anschluss an random-diversity-sweep: Pflanzen gewinnen in
// nur 5.0 % der Zufalls-Umwelten, obwohl sie mit 14 Bauplaenen das zweitgroesste Angebot
// stellen (Tier 35, Pflanze 14, Pilz 8, Mikrobe 6, Protist 2) und 9 davon erreichbar sind.
// Frage: liegt das an der Physik (Photosynthese-Kanal strukturell schwaecher) oder ist es
// echte Oekologie (Pflanzen gewinnen real nur in einem engen Umwelt-Fenster)?
//
// METHODE — bewusst OHNE Nachbau der Kanal-Formeln (die liegen in engine/fitness.ts und
// haben dort ihre einzige Wahrheit): gemessen wird das ERGEBNIS. Je Zufalls-Umwelt wird
// zweimal bergsteigend optimiert, einmal mit erzwungener Pflanzen-Strategie (photo hoch,
// mobility 0) und einmal ohne Photosynthese (photo 0). Der Abstand der beiden
// End-Fitnesswerte sagt, ob und wie deutlich die Pflanze verliert -- und in welchen
// Umwelten sie gewinnt.
//
// Kein Gate, reine Referenzmessung.
// Aufruf: node tools/research/plant-gap.mjs [--n=300] [--seed=1]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { mulberry32 } from "../../dist/world/population.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const N_ENV = +opt("n", 300);
const SEED = +opt("seed", 1);

const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const GENES = archWin.ARCHETYPES.genes;
const NG = GENES.length;
const PHOTO = GENES.indexOf("photosynthesis");
const MOB = GENES.indexOf("mobility");
const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

const LEVERS = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];
const REST = { toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0,
  radiation: 0, fire: 0, frost: 0, wind: 0 };

/** Bergsteigen mit festgehaltenen Genen (pinned: {index: wert}). */
function climb(env, pinned, rng, iters = 3000) {
  let g = new Array(NG).fill(0.5);
  for (const i in pinned) g[+i] = pinned[i];
  let best = fitness(g, env, phys);
  for (let it = 0; it < iters; it++) {
    const i = (rng() * NG) | 0;
    if (i in pinned) continue;
    const step = (rng() - 0.5) * 0.3;
    const old = g[i];
    g[i] = clamp01(old + step);
    const f = fitness(g, env, phys);
    if (f > best) best = f; else g[i] = old;
  }
  return { fit: best, genome: g };
}

const rng = mulberry32(SEED >>> 0);
const rows = [];
for (let i = 0; i < N_ENV; i++) {
  const env = { ...REST };
  for (const l of LEVERS) env[l] = Math.round(rng() * 100) / 100;
  // Pflanze: Photosynthese an, sessil. Nicht-Pflanze: Photosynthese aus.
  const plant = climb(env, { [PHOTO]: 0.95, [MOB]: 0.02 }, mulberry32((i * 7919 + 1) >>> 0));
  const other = climb(env, { [PHOTO]: 0.0 }, mulberry32((i * 7919 + 2) >>> 0));
  rows.push({ env, plant: plant.fit, other: other.fit, gap: plant.fit - other.fit });
  if ((i + 1) % 50 === 0) process.stdout.write(`\r  ${i + 1}/${N_ENV} Umwelten …   `);
}
process.stdout.write("\n");

const plantWins = rows.filter(r => r.gap > 0);
const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);

console.log(`\n=== Pflanzen-Luecke ueber ${N_ENV} Zufalls-Umwelten ===\n`);
console.log(`Pflanzen-Strategie gewinnt in ${plantWins.length}/${N_ENV} Umwelten (${(plantWins.length / N_ENV * 100).toFixed(1)} %)`);
console.log(`mittlere Fitness  Pflanze ${mean(rows.map(r => r.plant)).toFixed(4)} · Nicht-Pflanze ${mean(rows.map(r => r.other)).toFixed(4)}`);
console.log(`mittlerer Abstand (Pflanze - andere): ${mean(rows.map(r => r.gap)).toFixed(4)}`);

// Wovon haengt der Abstand ab? Korrelation je Regler.
console.log(`\nKorrelation des Abstands mit den 6 Reglern (positiv = beguenstigt Pflanzen):`);
for (const l of LEVERS) {
  const xs = rows.map(r => r.env[l]), ys = rows.map(r => r.gap);
  const mx = mean(xs), my = mean(ys);
  const cov = mean(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const sx = Math.sqrt(mean(xs.map(x => (x - mx) ** 2))), sy = Math.sqrt(mean(ys.map(y => (y - my) ** 2)));
  console.log(`  ${l.padEnd(15)} r = ${(cov / (sx * sy)).toFixed(3)}`);
}

// In welchem Fenster gewinnt die Pflanze wirklich?
if (plantWins.length) {
  console.log(`\nUmwelt-Fenster, in dem die Pflanze gewinnt (Mittelwert / Spanne):`);
  for (const l of LEVERS) {
    const vs = plantWins.map(r => r.env[l]).sort((a, b) => a - b);
    console.log(`  ${l.padEnd(15)} ${mean(vs).toFixed(2)}  [${vs[0].toFixed(2)} … ${vs[vs.length - 1].toFixed(2)}]`);
  }
}

writeFileSync(join(ROOT, "docs", "plant-gap.json"), JSON.stringify({
  n: N_ENV, seed: SEED,
  plantWinRate: plantWins.length / N_ENV,
  meanPlant: mean(rows.map(r => r.plant)), meanOther: mean(rows.map(r => r.other)),
  meanGap: mean(rows.map(r => r.gap)),
  rows,
}, null, 1));
console.log(`\nRohdaten: docs/plant-gap.json`);
