// Headless-Demo des v2-Kerns: eine kleine lebende Welt über Zeit.
// Zeigt emergente Formen je Ort, ein Welt-Event (Katastrophe + Wieder-Besiedlung)
// und die Erholung — ganz ohne die Live-App. Aufruf: npm run world-demo
//
// „Formen" werden prozedural aus dem Genom benannt (world/describe.ts) —
// emergenz-abgeleitet, keine handgeschriebene Formen-Tabelle.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "../world/world.js";
import { describe } from "../world/describe.js";
import { census, formatSpecies } from "../world/census.js";
import type { Physics } from "../engine/types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys: Physics = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

const BIOMES: Record<string, any> = {
  Eiszeit: { temperature: 0.08, predation: 0.15, foodAbundance: 0.55, foodHeight: 0.15, light: 0.4, water: 0.5 },
  Dschungel: { temperature: 0.6, predation: 0.4, foodAbundance: 0.85, foodHeight: 0.8, light: 0.5, water: 0.8 },
  Wüste: { temperature: 0.92, predation: 0.1, foodAbundance: 0.3, foodHeight: 0.1, light: 0.9, water: 0.15 },
  Tiefsee: { temperature: 0.35, predation: 0.5, foodAbundance: 0.2, foodHeight: 0.05, light: 0.05, water: 1.0 },
};

function formOf(genome: number[]): string {
  return describe(genome);
}

function snapshot(world: World): string {
  return world.places.map((p, i) => `${p.name}: ${formOf(world.mean(i))}`).join("  |  ");
}

function run() {
  const world = new World({ phys, popConfig: { numGenes: NG }, seed: 20240808 });
  for (const [name, env] of Object.entries(BIOMES)) world.addPlace(name, env);
  // schwach verbundene Nachbarschaft (Kette) — etwas Genfluss, aber Divergenz bleibt
  world.connect(0, 1, 0.02);
  world.connect(1, 2, 0.02);
  world.connect(2, 3, 0.02);

  console.log("=== Lebende Welt (v2-Kern) — 4 Orte, schwach verbunden ===\n");
  console.log("Start (alle monomorph):");
  console.log("  " + snapshot(world));

  for (let gen = 1; gen <= 200; gen++) {
    world.step();
    if (gen % 50 === 0) console.log(`\nGeneration ${gen}:\n  ${snapshot(world)}`);
  }

  // WELT-EVENT: Meteoriteneinschlag verwüstet den Dschungel (Ort 1)
  console.log("\n>>> EREIGNIS: Katastrophe im Dschungel (5% überleben) <<<");
  world.triggerEvent(1, { type: "catastrophe", survivorFraction: 0.05 });
  console.log("  direkt danach:  " + snapshot(world) + `   (Diversität Dschungel: ${world.diversityNN(1).toFixed(3)})`);

  // Wieder-Besiedlung aus dem Nachbarn + Erholung
  console.log("\n>>> Wieder-Besiedlung aus der Eiszeit (Founder) + 150 Generationen Erholung <<<");
  world.triggerEvent(1, { type: "colonize", from: 0, founders: 6 });
  for (let gen = 1; gen <= 150; gen++) world.step();
  console.log("  nach Erholung:  " + snapshot(world) + `   (Diversität Dschungel: ${world.diversityNN(1).toFixed(3)})`);

  // ZUSTAND ÄNDERN: die Wüste wird feucht (Klima-„provozieren")
  console.log("\n>>> ZUSTAND: die Wüste wird feucht & kühl (Klimawandel) + 150 Generationen <<<");
  world.triggerEvent(2, { type: "climateShift", to: { water: 0.85, temperature: 0.5, foodAbundance: 0.7 } });
  for (let gen = 1; gen <= 150; gen++) world.step();
  console.log("  Ergebnis:       " + snapshot(world));

  console.log("\n=== Chronik: emergenter Baum des Lebens (Arten-Zensus) ===");
  for (const s of census(world)) console.log("  • " + formatSpecies(s));
  console.log("\nJeder Ort ging seinen eigenen Weg — Vielfalt aus Raum, Isolation und Ereignissen.");
}

run();
