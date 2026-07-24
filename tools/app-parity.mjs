// App-Inline-Paritaet: prueft die HAND-GEPFLEGTE App-Kopie der Fitness
// (app/index.html, inline) gegen die Engine/Orakel-Physik. Diese dritte Kopie
// hatte bisher KEINE automatische Abdeckung — parity/ecology testen nur
// engine<->oracle. Genau hier schlug der NaN-Bug zu (fehlendes PHYS.kleiberDecades,
// live kaputt seit v0.42.0). Dieser Check haette ihn sofort gefangen.
//
// Vorgehen: PHYS + fitness() aus app/index.html extrahieren, mit denselben
// Zufallsstichproben wie tools/parity.mjs gegen die Engine-Fitness vergleichen.
// Bricht bei |App - Engine| > 1e-9 ODER bei NaN/Infinity.
//
// Aufruf:  npm run app-parity
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness as engineFitness } from "../dist/engine/fitness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");

// --- App-Inline-fitness() rekonstruieren ---
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const physMatch = html.match(/const PHYS = (\{[\s\S]*?\n\});/);
const fnMatch = html.match(/function fitness\(t, e\)\{[\s\S]*?\n\}/);
if (!physMatch || !fnMatch) {
  console.error("app-parity: PHYS oder fitness() nicht in app/index.html gefunden."); process.exit(1);
}
// eslint-disable-next-line no-eval
const PHYS = eval("(" + physMatch[1] + ")");
let appFitness;
// eslint-disable-next-line no-eval
eval(fnMatch[0] + "\nappFitness = fitness;");

// Sanity: jede in fitness() referenzierte PHYS.<key> muss in PHYS existieren
const refs = [...new Set([...fnMatch[0].matchAll(/PHYS\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))];
const missing = refs.filter((k) => !(k in PHYS));
if (missing.length) {
  console.error("app-parity: PHYS fehlt Konstante(n): " + missing.join(", ")); process.exit(1);
}

// --- Seedbarer RNG (mulberry32), identisch zu tools/parity.mjs ---
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(0xC0FFEE);
const ENV_DIMS = ["temperature","predation","foodAbundance","foodHeight","light","water","toxicity","oxygen","salinity","uv","pressure","aridity"];

const N = 3000;
let maxDiff = 0, worst = null, nanCount = 0;
for (let i = 0; i < N; i++) {
  const traits = Array.from({ length: phys.traits.length }, () => rng());
  const env = {};
  for (const k of ENV_DIMS) env[k] = rng();
  const a = appFitness(traits, env);
  const e = engineFitness(traits, env, phys);
  if (!Number.isFinite(a) || !Number.isFinite(e)) { nanCount++; worst = { traits, env, a, e }; continue; }
  const d = Math.abs(a - e);
  if (d > maxDiff) { maxDiff = d; worst = { traits, env, a, e }; }
}

console.log(`[app-parity] ${N} Stichproben: App-Inline-fitness vs Engine.`);
if (nanCount > 0) {
  console.log(`[app-parity] FEHLER: ${nanCount} nicht-endliche Ergebnisse (NaN/Infinity).`);
  console.log("  Beispiel:", JSON.stringify(worst));
  process.exit(1);
}
console.log(`[app-parity] Max |App - Engine| = ${maxDiff.toExponential(3)}`);
if (maxDiff < 1e-9) {
  console.log("[app-parity] OK — die App-Inline-Kopie deckt sich mit Engine/Orakel.");
} else {
  console.log("[app-parity] ABWEICHUNG: App-Inline-Fitness weicht von der Engine ab.");
  console.log("  Schlechteste Stichprobe:", JSON.stringify(worst));
  process.exit(1);
}
