// Raum-Test: Vielfalt aus der Metapopulation. Isolierte Orte divergieren,
// verbundene homogenisieren; Founder-Kolonisation & Katastrophe senken Diversität.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World, meanDistance } from "../dist/world/world.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const cold = { temperature: 0.08, predation: 0.15, foodAbundance: 0.55, foodHeight: 0.15, light: 0.4, water: 0.5 };
const hot  = { temperature: 0.92, predation: 0.10, foodAbundance: 0.30, foodHeight: 0.10, light: 0.9, water: 0.15 };
const GENS = 160;

function twoPlaces(migRate) {
  const w = new World({ phys, popConfig: { numGenes: NG }, seed: 42 });
  w.addPlace("Kälte", cold);
  w.addPlace("Hitze", hot);
  if (migRate > 0) w.connect(0, 1, migRate);
  for (let i = 0; i < GENS; i++) w.step();
  return meanDistance(w.mean(0), w.mean(1));
}

const isolated = twoPlaces(0);      // isoliert -> divergieren
const connected = twoPlaces(0.30);  // stark verbunden -> homogenisieren (Swamping)
console.log("Raum-Test (2 Orte: Kälte vs Hitze, je 160 Generationen)\n");
console.log(`  isoliert    → |Mittel_Kälte − Mittel_Hitze| = ${isolated.toFixed(3)}  (Divergenz)`);
console.log(`  verbunden   → |Mittel_Kälte − Mittel_Hitze| = ${connected.toFixed(3)}  (Homogenisierung)`);

// Founder & Katastrophe: eine entwickelte, diverse Population
const w = new World({ phys, popConfig: { numGenes: NG }, seed: 7 });
w.addPlace("Quelle", { temperature: 0.5, predation: 0.4, foodAbundance: 0.7, foodHeight: 0.35, light: 0.45, water: 0.5 });
w.addPlace("Neuland", { temperature: 0.5, predation: 0.4, foodAbundance: 0.7, foodHeight: 0.35, light: 0.45, water: 0.5 });
for (let i = 0; i < 120; i++) w.step();
const divSource = w.diversityNN(0);
w.colonize(0, 1, 5);            // Founder: 5 Gründer
const divFounder = w.diversityNN(1);
w.catastrophe(0, 0.05);        // Flaschenhals im Quell-Ort
const divAfterCat = w.diversityNN(0);
console.log(`\n  Quell-Diversität (Nächster-Nachbar):          ${divSource.toFixed(3)}`);
console.log(`  Neuland nach Founder-Kolonisation (5):     ${divFounder.toFixed(3)}  (Gründer-Effekt)`);
console.log(`  Quelle nach Katastrophe (5% Überlebende):  ${divAfterCat.toFixed(3)}  (Flaschenhals)`);

const okDiverge = isolated > 0.25;
const okHomog = connected < 0.4 * isolated;
const okFounder = divFounder < 0.4 * divSource;
const okCat = divAfterCat < 0.7 * divSource;
console.log("");
console.log(`  isolierte Orte divergieren:               ${okDiverge ? "OK" : "FAIL"}`);
console.log(`  Verbindung homogenisiert:                 ${okHomog ? "OK" : "FAIL"}`);
console.log(`  Founder-Kolonisation senkt Diversität:    ${okFounder ? "OK" : "FAIL"}`);
console.log(`  Katastrophe senkt Diversität:             ${okCat ? "OK" : "FAIL"}`);
if (okDiverge && okHomog && okFounder && okCat) {
  console.log("\nStatus: OK — Raum, Isolation & Katastrophe erzeugen Vielfalt wie erwartet.");
} else {
  console.log("\nStatus: FAIL.");
  process.exit(1);
}
