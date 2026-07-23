// Test von Population.seedFrom / World.addPlace(seedGenome): ein Ort kann aus EINEM
// konkreten Genom (der Linie des Spielers) starten — anfangs nahe daran, geringe
// Diversität — und evolviert dann normal weiter. Grundlage für „dein Wesen als Ort".
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "../dist/world/world.js";
import { meanDistance } from "../dist/world/world.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "world", "physics-v2.json"), "utf-8"));
const NG = phys.traits.length;

// Ein deutlich „nicht-neutrales" Genom (z. B. großes verholztes Wesen)
const seed = Array.from({ length: NG }, (_, k) => (k === 1 ? 0.85 : k === 7 ? 0.8 : 0.2));
const env = { temperature: .5, predation: .3, foodAbundance: .6, foodHeight: .4, light: .6, water: .6 };

const w = new World({ phys, popConfig: { numGenes: NG }, seed: 7 });
w.addPlace("Deine Linie", env, 0.5, seed);

const meanStart = w.mean(0);
const distToSeed = meanDistance(meanStart, seed);
const divStart = w.diversityNN(0);

for (let i = 0; i < 60; i++) w.step();
const divAfter = w.diversityNN(0);
const meanAfter = w.mean(0);
const moved = meanDistance(meanStart, meanAfter);

console.log("Population.seedFrom / addPlace(seedGenome)\n");
console.log(`  Startmittel nahe am Seed-Genom:   |mean-seed| = ${distToSeed.toFixed(3)}`);
console.log(`  Anfangs geringe Diversität:       NN = ${divStart.toFixed(3)}`);
console.log(`  Nach 60 Gen. evolviert weiter:    |Δmean| = ${moved.toFixed(3)}, NN = ${divAfter.toFixed(3)}`);

const nearSeed = distToSeed < 0.06;   // Start praktisch = Seed (nur Streuung)
const tight = divStart < 0.12 && divAfter > divStart * 2;  // monomorph am Start, danach klar breiter
const evolves = moved > 0.02;         // Selektion bewegt die Linie danach
console.log("");
console.log(`  Start = Seed-Genom (± Streuung):   ${nearSeed ? "OK" : "FAIL"}`);
console.log(`  Monomorpher Start (NN klein):      ${tight ? "OK" : "FAIL"}`);
console.log(`  Evolviert danach normal weiter:    ${evolves ? "OK" : "FAIL"}`);

if (nearSeed && tight && evolves) console.log("\nStatus: OK — ein Ort kann aus der Spieler-Linie starten und lebt dann weiter.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
