// Paritätstest: C++-Kern (esp32/lib/evolve_core) gegen die TS-Engine.
// Vorgehen wie tools/app-parity.mjs – dieselben Stichproben durch beide Seiten schicken.
//
//   A  RNG:        mulberry32-Folge bit-identisch
//   B  Fitness:    3000 Zufalls-Genome × Zufalls-Umwelten, |C++ - TS| < 1e-4
//   C  Population: gleicher Seed + Umwelt, Mittelwert-Genom nach 50 Gen., Abweichung < 0.02
//   D  describe(): gleiche Kurzbeschreibung (nur double – float darf an Schwellen kippen)
//   E  Board-Kernel: Reproduktions-Gewichte der Gründer, relative Abweichung < 1e-3
//   F  Board-Kernel: Mittelwert-Genom über 16 Seeds je Umwelt statistisch gleich (|z| < 4)
//
// Warum E/F statt C für den Board-Build: der Ganzzahl-Kernel (EVO_FAST_KERNEL) weicht je
// Gewicht um ~1e-4 ab. Das kippt früher oder später eine Elternwahl, und ab da läuft der
// Lauf eine andere, gleich gültige Bahn – wie mit einem anderen Seed. Bahn-Gleichheit ist
// dafür das falsche Maß; gleich sein müssen die Gewichte und die Verteilung der Ergebnisse.
//
// A–D laufen gegen native (double, muss praktisch exakt sein) und native_float (float-Kern),
// E/F gegen native_fast (float + Ganzzahl-Konkurrenz-Kernel = genau der Board-Build).
//
// Voraussetzung: npm run build (dist/) und g++ im PATH. Aufruf:
//   node esp32/tools/parity.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ESP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(ESP, "..");
if (!existsSync(join(ROOT, "dist", "world", "population.js"))) {
  console.error("parity: dist/ fehlt – erst `npm run build`.");
  process.exit(1);
}
const { fitness } = await import("../../dist/engine/fitness.js");
const { Population, mulberry32 } = await import("../../dist/world/population.js");
const { describe } = await import("../../dist/world/describe.js");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

// C++-Seite bauen (beide Gleitkomma-Varianten)
execFileSync("python", ["-m", "platformio", "run", "-d", ESP, "-e", "native", "-e", "native_float", "-e", "native_fast"], {
  stdio: ["ignore", "ignore", "inherit"],
});
const bin = (env) => join(ESP, ".pio", "build", env, process.platform === "win32" ? "program.exe" : "program");
const run = (env, args, input) =>
  execFileSync(bin(env), args, { input, encoding: "utf-8", maxBuffer: 64 << 20 }).trim().split(/\r?\n/);

// Reihenfolge = set_env() in esp32/src/native_main.cpp
const ENV_DIMS = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water", "toxicity",
  "oxygen", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];
const envArgs = (e) => ENV_DIMS.map((k) => String(e[k] ?? (k === "oxygen" ? 1 : 0)));

// Konfiguration wie SWARM in app/index.html, N wie auf dem Board
const N = 100;
const GENS = 50;
const POP_CFG = {
  size: N, numGenes: NG, mutationSd: 0.05, selPower: 2.0, recombProb: 0.5, startSpread: 0.06,
  founderSpread: "uniform",
  competition: { axes: [1, 2, 5, 6, 4, 8, 9, 15], sigmaC: 0.22, sigmaK: 50, kCenter: 0.5 },
};
const base = { toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };
const ENVS = [
  { name: "gemäßigtes Land", temperature: 0.5, predation: 0.3, foodAbundance: 0.6, foodHeight: 0.2, light: 0.6, water: 0.4 },
  { name: "Tiefsee", temperature: 0.3, predation: 0.5, foodAbundance: 0.4, foodHeight: 0.1, light: 0.05, water: 0.95, pressure: 0.8 },
  { name: "Tundra", temperature: 0.1, predation: 0.2, foodAbundance: 0.3, foodHeight: 0.1, light: 0.5, water: 0.3, frost: 0.6 },
  { name: "Wüste", temperature: 0.92, predation: 0.2, foodAbundance: 0.3, foodHeight: 0.3, light: 0.95, water: 0.1, aridity: 0.5 },
  { name: "Sumpf", temperature: 0.6, predation: 0.4, foodAbundance: 0.7, foodHeight: 0.3, light: 0.5, water: 0.65 },
  { name: "Urwald", temperature: 0.7, predation: 0.6, foodAbundance: 0.8, foodHeight: 0.8, light: 0.8, water: 0.45 },
].map((e) => ({ ...base, ...e }));
const SEEDS = [1, 7, 12345];

let failed = false;
const verdict = (ok, label) => {
  if (!ok) failed = true;
  return `${ok ? "OK  " : "FAIL"} ${label}`;
};

// --- A: RNG ------------------------------------------------------------------
{
  let mism = 0;
  for (const seed of [1, 42, 0xc0ffee, 4294967295]) {
    const r = mulberry32(seed);
    const js = Array.from({ length: 10000 }, () => String(r() * 4294967296));
    const cc = run("native", ["rng", String(seed), "10000"]);
    for (let i = 0; i < js.length; i++) if (js[i] !== cc[i]) mism++;
  }
  console.log(verdict(mism === 0, `A  RNG: 4 Seeds × 10000 Werte, ${mism} Abweichungen`));
}

// --- B: Fitness --------------------------------------------------------------
{
  const rng = mulberry32(0xc0ffee);
  const samples = [];
  for (let i = 0; i < 3000; i++) {
    const traits = Array.from({ length: NG }, () => rng());
    const env = Object.fromEntries(ENV_DIMS.map((k) => [k, rng()]));
    samples.push({ traits, env });
  }
  const input = samples.map((s) => [...s.traits, ...envArgs(s.env)].join(" ")).join("\n") + "\n";
  const ref = samples.map((s) => fitness(s.traits, s.env, phys));
  for (const [env, tol] of [["native", 1e-9], ["native_float", 1e-4]]) {
    const out = run(env, ["fitness"], input).map(Number);
    let max = 0, bad = 0;
    out.forEach((v, i) => {
      if (!Number.isFinite(v)) bad++;
      max = Math.max(max, Math.abs(v - ref[i]));
    });
    console.log(verdict(bad === 0 && max < tol && out.length === ref.length,
      `B  Fitness ${env.padEnd(12)} max |Δ| = ${max.toExponential(2)}  (Grenze ${tol})`));
  }
}

// --- C + D: Population -------------------------------------------------------
for (const env of ["native", "native_float"]) {
  let max = 0, worst = "", descMism = 0;
  const floatDesc = [];
  for (const e of ENVS) {
    for (const seed of SEEDS) {
      const pop = new Population(POP_CFG, seed);
      for (let g = 0; g < GENS; g++) pop.step(e, phys);
      const m = pop.mean();
      const out = run(env, ["run", String(seed), String(GENS), String(N), ...envArgs(e)]);
      const cm = out.slice(0, NG).map(Number);
      const d = Math.max(...cm.map((v, k) => Math.abs(v - m[k])));
      if (d > max) { max = d; worst = `${e.name}, Seed ${seed}`; }
      const tsDesc = describe(m);
      if (out[NG] !== tsDesc) {
        descMism++;
        floatDesc.push(`${e.name}/${seed}: TS „${tsDesc}" vs C++ „${out[NG]}"`);
      }
    }
  }
  const runs = ENVS.length * SEEDS.length;
  console.log(verdict(max < 0.02,
    `C  Population ${env.padEnd(12)} ${runs} Läufe × ${GENS} Gen., max |Δ Mittelwert-Genom| = ${max.toExponential(2)} (${worst})`));
  if (env === "native") {
    console.log(verdict(descMism === 0, `D  describe() ${env.padEnd(12)} ${runs - descMism}/${runs} gleich`));
    for (const l of floatDesc) console.log("     " + l);
  } else {
    console.log(`     describe() ${env}: ${runs - descMism}/${runs} gleich (informativ)`);
    for (const l of floatDesc) console.log("     " + l);
  }
}

// --- E: Board-Kernel, Gewichte ------------------------------------------------
{
  let max = 0, worst = "";
  for (const e of ENVS) {
    for (const seed of SEEDS) {
      const ref = new Population(POP_CFG, seed).weights(e, phys);
      const out = run("native_fast", ["weights", String(seed), String(N), ...envArgs(e)]).map(Number);
      out.forEach((v, i) => {
        const rel = Math.abs(v - ref[i]) / Math.max(ref[i], 1e-12);
        if (rel > max) { max = rel; worst = `${e.name}, Seed ${seed}, Individuum ${i}`; }
      });
    }
  }
  console.log(verdict(max < 1e-3, `E  Gewichte   native_fast  max relative Abweichung = ${max.toExponential(2)} (${worst})`));
}

// --- F: Board-Kernel, Ergebnis-Verteilung -------------------------------------
{
  const SEEDS_F = Array.from({ length: 16 }, (_, k) => k + 1);
  const stats = (rows) => {
    const n = rows.length;
    const m = rows[0].map((_, g) => rows.reduce((s, r) => s + r[g], 0) / n);
    const v = rows[0].map((_, g) => rows.reduce((s, r) => s + (r[g] - m[g]) ** 2, 0) / (n - 1));
    return { n, m, v };
  };
  const compare = (a, b) => {
    let maxD = 0, maxZ = 0;
    for (let g = 0; g < NG; g++) {
      const d = Math.abs(a.m[g] - b.m[g]);
      const se = Math.sqrt(a.v[g] / a.n + b.v[g] / b.n);
      maxD = Math.max(maxD, d);
      maxZ = Math.max(maxZ, d / Math.max(se, 1e-6));
    }
    return { maxD, maxZ };
  };
  const tsRun = (e, seeds) => seeds.map((seed) => {
    const pop = new Population(POP_CFG, seed);
    for (let g = 0; g < GENS; g++) pop.step(e, phys);
    return pop.mean();
  });
  let worstZ = 0, worstD = 0, baseZ = 0, where = "";
  for (const e of ENVS) {
    const ts = stats(tsRun(e, SEEDS_F));
    const fast = stats(SEEDS_F.map((seed) =>
      run("native_fast", ["run", String(seed), String(GENS), String(N), ...envArgs(e)]).slice(0, NG).map(Number)));
    // Vergleichsmaß: TS gegen TS mit anderen Seeds – so groß ist reines Seed-Rauschen
    const ts2 = stats(tsRun(e, SEEDS_F.map((s) => s + 1000)));
    const c = compare(ts, fast);
    if (c.maxZ > worstZ) { worstZ = c.maxZ; where = e.name; }
    worstD = Math.max(worstD, c.maxD);
    baseZ = Math.max(baseZ, compare(ts, ts2).maxZ);
  }
  console.log(verdict(worstZ < 4,
    `F  Verteilung native_fast  ${ENVS.length} Umwelten × ${SEEDS_F.length} Seeds, max |z| = ${worstZ.toFixed(2)} (${where}), max |Δ| = ${worstD.toFixed(3)}; Seed-Rauschen TS↔TS max |z| = ${baseZ.toFixed(2)}`));
}

console.log(failed ? "\nparity: ABWEICHUNG" : "\nparity: alles im Rahmen");
process.exit(failed ? 1 : 0);
