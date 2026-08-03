// Mittelfeld-Fidelity-Gate — schliesst den bisher UNGEDECKTEN blinden Fleck:
// parity/ecology pruefen die Fitness bzw. den AGENTENBASIERTEN Kern, aber NICHT die
// Mittelfeld-Einzelwesen-Bahn, die der Nutzer tatsaechlich beobachtet (app-inline
// stepGeneration). Ein unabhaengiger Cross-Check gegen das Orakel deckte auf, dass die
// 15 bedingten Kosten-Gene (Stressor-Resistenzen + Nischen-Mechaniken) in gutartigen,
// PRODUKTIVEN Biomen NICHT abgeworfen wurden (sie hingen bei ~0.5 statt ~0.15) — die
// summierte Phantom-Unterhaltslast drueckte die angezeigte Vitalitaet auf bis zu 1/5.
//
// Dieses Gate rechnet die ECHTE 25-Gen-Mittelfeld-Bahn (mit den aus app/index.html
// extrahierten PARAMS + der app-parity-gleichen Engine-Fitness) und prueft die
// Invariante, die der Bug verletzt hat:
//   A) BENIGN: in einer reichen, stressfreien Umwelt werden die bedingten Gene abgeworfen
//      (Mittel der Gene 10..24 < BENIGN_MAX) — kein Phantom-Unterhalt.
//   B) STRESSOR: unter dem passenden Umwelt-Stressor taucht die Anpassung auf
//      (Resistenz-Gen > EMERGE_MIN) — das „standardmaessig aus" bleibt reversibel.
//
// Rein deterministisch, kein Orakel/Python noetig -> schnell genug fuers Smoke.
// Aufruf: npm run mf-fidelity
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../dist/engine/fitness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const TRAITS = phys.traits;
const NG = TRAITS.length;

// PARAMS + eps aus der App extrahieren (dieselbe Quelle, die der Nutzer laeuft).
function arr(name) {
  const m = html.match(new RegExp(name + "\\s*:\\s*\\[([^\\]]*)\\]"));
  if (!m) throw new Error("PARAM nicht gefunden: " + name);
  return m[1].split(",").map((x) => parseFloat(x));
}
function num(name) {
  const m = html.match(new RegExp(name + "\\s*:\\s*([0-9.eE+-]+)"));
  if (!m) throw new Error("PARAM nicht gefunden: " + name);
  return parseFloat(m[1]);
}
const responseRate = arr("responseRate");
const mutationAnchor = arr("mutationAnchor");
const selectionStrength = num("selectionStrength");
const mutationRate = num("mutationRate");
const varianceWeight = num("varianceWeight");
const eps = num("eps");
if (responseRate.length !== NG || mutationAnchor.length !== NG)
  throw new Error(`PARAMS-Laenge != ${NG} (responseRate ${responseRate.length}, mutationAnchor ${mutationAnchor.length})`);

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
// Spiegel der app-inline stepGeneration (deterministisch, ohne Drift).
function step(m, env) {
  const next = m.slice();
  for (let g = 0; g < NG; g++) {
    const up = m.slice(); up[g] = clamp01(up[g] + eps);
    const dn = m.slice(); dn[g] = clamp01(dn[g] - eps);
    const grad = (fitness(up, env, phys) - fitness(dn, env, phys)) / (2 * eps);
    const vf = 4 * next[g] * (1 - next[g]);
    const speedMod = varianceWeight * vf + (1 - varianceWeight);
    next[g] += responseRate[g] * selectionStrength * grad * speedMod;
    const anchor = mutationAnchor ? mutationAnchor[g] : 0.5;
    next[g] += mutationRate * (anchor - next[g]);
    next[g] = clamp01(next[g]);
  }
  return next;
}
function evolve(env, gens = 400) {
  let m = new Array(NG).fill(0.5);
  for (let i = 0; i < gens; i++) m = step(m, env);
  return m;
}

const BASE = { temperature: 0.5, predation: 0.3, foodAbundance: 0.5, foodHeight: 0.3, light: 0.5, water: 0.4,
  toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };
const env = (kw) => ({ ...BASE, ...kw });
const idx = (n) => TRAITS.indexOf(n);
const COND = ["detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense","desicc","radres","fireres","frostres","windres","nfix","resprout"];
const condIdx = COND.map(idx);
const condMean = (m) => condIdx.reduce((s, i) => s + m[i], 0) / condIdx.length;

const BENIGN_MAX = 0.25;  // bedingte Gene muessen in reichen Biomen abgeworfen sein
const EMERGE_MIN = 0.55;  // unter dem Stressor muss die Anpassung auftauchen

// A) Benigne, produktive Umwelten: bedingte Gene abgeworfen?
const BENIGN = {
  "Warm-ueppig-hoch": env({ temperature: 0.7, foodAbundance: 0.8, foodHeight: 0.8, light: 0.8, water: 0.5 }),
  "Lichtarm-nass":    env({ temperature: 0.5, light: 0.15, water: 0.7, foodAbundance: 0.5 }),
  "Raeuberland":      env({ temperature: 0.5, predation: 0.85, foodAbundance: 0.6, foodHeight: 0.2, light: 0.5, water: 0.3 }),
  "Gemaessigt":       env({ temperature: 0.5, foodAbundance: 0.6, light: 0.6, water: 0.4 }),
};
// B) Stressor-Umwelt -> welches Resistenz-Gen MUSS auftauchen (reine Kosten-Stressoren).
const STRESS = [
  ["Gift",        { toxicity: 0.85 }, "detox"],
  // Hypoxie bestraft NUR hohen Stoffwechsel (oxy_survival ~ metabolism); ohne einen Grund
  // fuer hohen Stoffwechsel entkommt das Wesen per Sparflamme statt per oxyEff. Reichliche
  // Nahrung haelt den Stoffwechsel hoch (wie in reality-check) -> Hypoxie beisst -> oxyEff.
  ["Hypoxie",     { oxygen: 0.12, foodAbundance: 0.85 }, "oxyEff"],
  ["Salz",        { salinity: 0.85 }, "osmo"],
  ["UV",          { uv: 0.85 }, "pigment"],
  ["Tiefsee-Druck", { pressure: 0.85, water: 0.95, light: 0.1 }, "baro"],
  ["Duerre",      { aridity: 0.85 }, "desicc"],
  ["Strahlung",   { radiation: 0.85 }, "radres"],
  ["Feuer",       { fire: 0.85 }, "fireres"],
  ["Frost",       { frost: 0.85 }, "frostres"],
  ["Wind",        { wind: 0.85 }, "windres"],
  // Kein eigener Part-B-Eintrag fuer 'resprout' (AXIS-25): regrowthSurvival nimmt
  // max(fireres,resprout) - unter reinem Feuer/Frost-Stress deckt das guenstigere fireres/
  // frostres (die zusaetzlich auf die eigene fireSurvival/frostSurvival einzahlen) denselben
  // Kanal, resprout bleibt aus einem neutralen Start unterselektiert. Das ist keine Fidelity-
  // Luecke, sondern dieselbe Lage wie bei nfix/burrow/camo/sense/filter oben, die aus
  // demselben Grund ebenfalls keinen Part-B-Eintrag haben - resprouts reale Nische
  // (Bluetenkraut/Kraut/Farn) ist in app/archetypes.js separat gemessen (Hill-Climb ab
  // Pflanzen-Prototyp), s. physics.json-Kommentar Version 9.
];

console.log(`Mittelfeld-Fidelity — echte 25-Gen-App-Bahn (aus app/index.html), NG=${NG}\n`);
let ok = true;

console.log(`A) Benigne Biome: bedingte Gene (10..24) abgeworfen?  (Mittel < ${BENIGN_MAX})`);
for (const [name, e] of Object.entries(BENIGN)) {
  const m = evolve(e);
  const cm = condMean(m);
  const fit = fitness(m, e, phys);
  const pass = cm < BENIGN_MAX;
  if (!pass) ok = false;
  console.log(`   ${pass ? "✓" : "✗"}  ${name.padEnd(17)} Mittel bedingt = ${cm.toFixed(3)}   (Vitalitaet ${fit.toFixed(3)})`);
}

console.log(`\nB) Stressor-Biome: passende Anpassung taucht auf?  (Gen > ${EMERGE_MIN})`);
for (const [name, kw, gene] of STRESS) {
  const m = evolve(env(kw));
  const v = m[idx(gene)];
  const pass = v > EMERGE_MIN;
  if (!pass) ok = false;
  console.log(`   ${pass ? "✓" : "✗"}  ${name.padEnd(15)} ${gene.padEnd(9)} = ${v.toFixed(3)}`);
}

console.log(ok
  ? "\nStatus: OK — das Mittelfeld wirft ungenutzte Kosten-Gene ab und bildet die passende Anpassung unter Stress."
  : "\nStatus: ABWEICHUNG — die Mittelfeld-Bahn verletzt die Fidelity-Invariante (Phantom-Last oder fehlende Anpassung).");
process.exit(ok ? 0 : 1);
