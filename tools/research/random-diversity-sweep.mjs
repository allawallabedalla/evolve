// Nutzer-Frage (2026-08-09): "wie viel Vielfalt erreichen wir WIRKLICH, wenn ich einfach
// 1000 zufaellige Umwelten durchprobiere?" Kein Gate, reine Referenzmessung — beantwortet
// die Frage direkt statt sie aus docs/coverage-report.md abzuleiten (der misst etwas
// Verwandtes, aber ueber ein festes Gitter + kuratierte Biome/Einfluesse, nicht ueber
// echte Zufalls-Regler-Stellungen).
//
// Methode: pro Lauf eine zufaellige Stellung der 6 Kern-Regler (dieselben, die der
// Spieler bedient), dann EIN echter Schwarm-Lauf (world/population.ts, Live-SWARM-Konfig
// aus app/index.html gelesen — keine zweite, potenziell abweichende Kopie), 250
// Generationen (dieselbe Zahl, gegen die N=200 in tools/spectrum-check.mjs abgenommen
// ist). Benannt wird, was der Spieler wirklich sieht: die Cluster-Zentroide der
// selektionsgewichteten Population (readSwarm()-Technik), nicht ein Mittelfeld-Punkt.
//
// Aufruf: node tools/research/random-diversity-sweep.mjs [--n=1000] [--gens=250] [--seed=1]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population, mulberry32 } from "../../dist/world/population.js";
import { clusters, selectionWeights as popWeights } from "../../dist/world/cluster.js";
import { loadAppCore } from "../lib/app-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const N_RUNS = +opt("n", 1000);
const GENS = +opt("gens", 250);
const SEED0 = +opt("seed", 1);

const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const grab = (re, what) => { const m = html.match(re); if (!m) { console.error(`fehlt: ${what}`); process.exit(1); } return m[0]; };
const SWARM = new Function(`${grab(/const SWARM = \{[\s\S]*?\n\};/, "SWARM")}; return SWARM;`)();
const LEVERS = new Function(`${grab(/const LEVERS = \[[\s\S]*?\];/, "LEVERS")}; return LEVERS;`)();
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const core = loadAppCore("random-diversity-sweep");
const NG = core.NG;

// Die 6 Kern-Regler zufaellig, die 10 Stress-Achsen auf ihrem Ruhewert — das IST "freie
// Umwelt": kein Umwelt-Einfluss aktiv, nur die Regler, die der Spieler direkt bedient.
const REST_ENV = { toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0,
  radiation: 0, fire: 0, frost: 0, wind: 0 };
function randomEnv(rng) {
  const e = { ...REST_ENV };
  for (const l of LEVERS) e[l.key] = Math.round(rng() * 100) / 100;
  return e;
}

console.log(`random-diversity-sweep: ${N_RUNS} zufaellige Umwelten, je ein Schwarm-Lauf ` +
  `(N=${SWARM.N}, ${GENS} Generationen, world/population.ts) — Seed ${SEED0}.`);
const rng = mulberry32(SEED0 >>> 0);

const endpoints = []; // { env, t, w }
const t0 = Date.now();
for (let i = 0; i < N_RUNS; i++) {
  const env = randomEnv(rng);
  const pop = new Population({
    size: SWARM.N, numGenes: NG, mutationSd: SWARM.mutationSd, selPower: SWARM.selPower,
    recombProb: SWARM.recombProb, founderSpread: "uniform",
    competition: { axes: SWARM.niche, sigmaC: SWARM.sigmaC, sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter },
  }, ((i + 1) * 2654435761 + SEED0) >>> 0);
  for (let g = 0; g < GENS; g++) pop.step(env, phys);
  const w = popWeights(pop.mean(), env, phys);
  const cl = clusters(pop.genomes, { radius: SWARM.radius, minFraction: SWARM.minFraction, weights: w });
  const pts = cl.length ? cl.map(c => c.centroid) : [pop.mean()];
  for (const t of pts) endpoints.push({ env, t });
  if ((i + 1) % 50 === 0 || i + 1 === N_RUNS) {
    const elapsed = (Date.now() - t0) / 1000;
    const eta = elapsed / (i + 1) * (N_RUNS - i - 1);
    process.stdout.write(`\r  ${i + 1}/${N_RUNS} Laeufe (${elapsed.toFixed(0)}s, ETA ${eta.toFixed(0)}s) …   `);
  }
}
process.stdout.write("\n");

// ---------------------------------------------------------------------------
// Auswertung: welche Baupläne, welche realen Arten, welche Reiche entstehen wirklich?
// ---------------------------------------------------------------------------
const kingdomCounts = new Map();
const formCounts = new Map();      // Bauplan-key -> Anzahl
const speciesCounts = new Map();   // realer Anzeigename -> Anzahl
let novelCount = 0;

for (const ep of endpoints) {
  const a = core.classify(ep.t, ep.env);
  kingdomCounts.set(a.k, (kingdomCounts.get(a.k) || 0) + 1);
  if (a.novel) { novelCount++; continue; }
  formCounts.set(a.form, (formCounts.get(a.form) || 0) + 1);
  speciesCounts.set(a.n, (speciesCounts.get(a.n) || 0) + 1);
}

const totalForms = core.ARCH.forms.length;
const sortedForms = [...formCounts.entries()].sort((a, b) => b[1] - a[1]);
const sortedSpecies = [...speciesCounts.entries()].sort((a, b) => b[1] - a[1]);
const sortedKingdoms = [...kingdomCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\n=== Ergebnis ueber ${endpoints.length} Endpunkte aus ${N_RUNS} Zufalls-Umwelten ===\n`);
console.log(`Reiche getroffen: ${sortedKingdoms.length}/5`);
for (const [k, n] of sortedKingdoms) console.log(`  ${k.padEnd(10)} ${n.toString().padStart(5)}  (${(n / endpoints.length * 100).toFixed(1)}%)`);

console.log(`\nBauplaene (Kacheln) getroffen: ${formCounts.size}/${totalForms}`);
console.log(`  jenseits novelThreshold (erfundener Name statt Bauplan): ${novelCount} (${(novelCount / endpoints.length * 100).toFixed(1)}%)`);
console.log(`\n  Top 20 haeufigste Baupläne:`);
for (const [form, n] of sortedForms.slice(0, 20)) console.log(`    ${n.toString().padStart(4)}×  ${form}`);
console.log(`\n  Seltenste getroffene Baupläne (<=2 Treffer):`);
for (const [form, n] of sortedForms.filter(([, n]) => n <= 2)) console.log(`    ${n}×  ${form}`);

console.log(`\nReale Artnamen getroffen: ${speciesCounts.size} verschiedene`);
console.log(`  Top 15:`);
for (const [sp, n] of sortedSpecies.slice(0, 15)) console.log(`    ${n.toString().padStart(4)}×  ${sp}`);

const out = {
  n_runs: N_RUNS, gens: GENS, seed: SEED0, endpoints: endpoints.length,
  kingdoms: Object.fromEntries(sortedKingdoms),
  forms_reached: formCounts.size, forms_total: totalForms,
  novel_fraction: novelCount / endpoints.length,
  forms: Object.fromEntries(sortedForms),
  species_reached: speciesCounts.size,
  top_species: Object.fromEntries(sortedSpecies.slice(0, 50)),
};
writeFileSync(join(ROOT, "docs", "random-diversity-sweep.json"), JSON.stringify(out, null, 1));
console.log(`\nRohdaten: docs/random-diversity-sweep.json`);
