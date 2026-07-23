// Realitäts-Check v2 (Metapopulation): reproduziert der Raum-Kern echte
// biogeografische Makro-Muster? (Ergänzt engine↔Realität um die Raum-Ebene.)
//  C1 Arten-Areal: mehr (isolierte) Orte -> mehr verschiedene Formen.
//  C2 Konnektivität homogenisiert: stark verbundene Orte -> weniger Formen (Beta-Diversität sinkt).
//  C3 Ökologische Gelegenheit: Klimawandel an einem Ort -> neue Form (freie Nische).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "../dist/world/world.js";
import { formKey, describe } from "../dist/world/describe.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

const POOL = [
  ["Eiszeit",   { temperature: .08, predation: .15, foodAbundance: .55, foodHeight: .15, light: .4, water: .5 }],
  ["Dschungel", { temperature: .6,  predation: .4,  foodAbundance: .85, foodHeight: .8,  light: .5, water: .8 }],
  ["Wüste",     { temperature: .92, predation: .1,  foodAbundance: .3,  foodHeight: .1,  light: .9, water: .15 }],
  ["Tiefsee",   { temperature: .35, predation: .5,  foodAbundance: .2,  foodHeight: .05, light: .05, water: 1. }],
  ["Savanne",   { temperature: .7,  predation: .6,  foodAbundance: .6,  foodHeight: .3,  light: .7, water: .4 }],
  ["Hochmoor",  { temperature: .3,  predation: .2,  foodAbundance: .5,  foodHeight: .2,  light: .6, water: .95 }],
];

function buildWorld(k, connectRate, seed = 5) {
  const w = new World({ phys, popConfig: { numGenes: NG }, seed });
  for (let i = 0; i < k; i++) w.addPlace(POOL[i][0], POOL[i][1]);
  if (connectRate > 0) for (let i = 0; i + 1 < k; i++) w.connect(i, i + 1, connectRate);
  return w;
}
function evolve(w, gens = 200) { for (let i = 0; i < gens; i++) w.step(); }
function formsOf(w) { return new Set(w.places.map((_, i) => formKey(w.mean(i)))).size; }

// C1 Arten-Areal
const w2 = buildWorld(2, 0); evolve(w2); const f2 = formsOf(w2);
const w6 = buildWorld(6, 0); evolve(w6); const f6 = formsOf(w6);
// C2 Konnektivität
const w6c = buildWorld(6, 0.35); evolve(w6c); const f6c = formsOf(w6c);
// C3 ökologische Gelegenheit
const wc = buildWorld(1, 0); wc.addPlace("Wüste2", POOL[2][1]); evolve(wc, 200);
const before = describe(wc.mean(1));
wc.triggerEvent(1, { type: "climateShift", to: { water: .9, temperature: .5, foodAbundance: .7, light: .5 } });
evolve(wc, 200);
const after = describe(wc.mean(1));

console.log("Realitäts-Check v2 — Metapopulations-Makro-Muster\n");
console.log(`  C1 Arten-Areal:     2 Orte -> ${f2} Formen | 6 Orte -> ${f6} Formen`);
console.log(`  C2 Konnektivität:   6 isoliert -> ${f6} | 6 stark verbunden -> ${f6c} Formen`);
console.log(`  C3 Gelegenheit:     "${before}"  --Klimawandel-->  "${after}"`);

const c1 = f6 > f2;
const c2 = f6c < f6;
const c3 = before !== after;
console.log("");
console.log(`  C1 mehr Orte -> mehr Formen (Arten-Areal):        ${c1 ? "OK" : "FAIL"}`);
console.log(`  C2 Verbindung senkt Formen-Zahl (Homogenisierung):${c2 ? "OK" : "FAIL"}`);
console.log(`  C3 Klimawandel öffnet neue Form (Gelegenheit):    ${c3 ? "OK" : "FAIL"}`);
if (c1 && c2 && c3) console.log("\nStatus: OK — der Raum-Kern reproduziert reale biogeografische Muster.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
