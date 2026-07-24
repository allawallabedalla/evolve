// Paritaets-Pruefung Teil 1 (Node): erzeugt seed-basierte Zufallsstichproben,
// berechnet die TS-Fitness (engine/fitness.ts via dist) und schreibt alles nach
// .parity.json. Teil 2 (oracle/check_parity.py) rechnet dieselben Stichproben in
// Python und vergleicht - so ist garantiert, dass Engine und Orakel EXAKT
// dieselbe Fitness-Physik verwenden.
//
// Aufruf ueber:  npm run parity   (baut vorher, laeuft dann beide Teile)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../dist/engine/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));

// Seedbarer RNG (mulberry32) fuer reproduzierbare Stichproben.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(987654321);
const N = 2000;
const samples = [];
for (let i = 0; i < N; i++) {
  const traits = Array.from({ length: phys.traits.length }, () => rng());
  const env = {
    temperature: rng(),
    predation: rng(),
    foodAbundance: rng(),
    foodHeight: rng(),
    light: rng(),
    water: rng(),
    toxicity: rng(),   // AXIS-6: giftiges Milieu (nur hier zufällig, um den toxSurvival-Term zu prüfen)
    oxygen: rng(),     // AXIS-7: Sauerstoffgehalt (nur hier zufällig, um den oxySurvival-Term zu prüfen)
    salinity: rng(),   // AXIS-8: Salinität (nur hier zufällig, um den osmoSurvival-Term zu prüfen)
    uv: rng(),         // AXIS-10: UV-Strahlung (nur hier zufällig, um den uvSurvival-Term zu prüfen)
  };
  samples.push({ traits, env, tsFit: fitness(traits, env, phys) });
}

writeFileSync(join(ROOT, ".parity.json"), JSON.stringify({ samples }), "utf-8");
console.log(`[parity] ${N} Stichproben mit TS-Fitness geschrieben -> .parity.json`);
