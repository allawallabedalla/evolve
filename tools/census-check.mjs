// Stufe 6 — emergenter Arten-Zensus: eine vielfältige Welt liefert eine sinnvolle,
// prozedural benannte Arten-Liste (keine handgeschriebene classify-Kaskade);
// Verbindung homogenisiert die Artenzahl.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "../dist/world/world.js";
import { census, formatSpecies } from "../dist/world/census.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "world", "physics-v2.json"), "utf-8"));
const NG = phys.traits.length;
const POOL = [
  ["Eiszeit",   { temperature: .08, predation: .15, foodAbundance: .55, foodHeight: .15, light: .4, water: .5 }],
  ["Dschungel", { temperature: .6,  predation: .4,  foodAbundance: .85, foodHeight: .8,  light: .5, water: .8 }],
  ["Wüste",     { temperature: .92, predation: .1,  foodAbundance: .3,  foodHeight: .1,  light: .9, water: .15 }],
  ["Tiefsee",   { temperature: .35, predation: .5,  foodAbundance: .2,  foodHeight: .05, light: .05, water: 1. }],
  ["Savanne",   { temperature: .7,  predation: .6,  foodAbundance: .6,  foodHeight: .3,  light: .7, water: .4 }],
];
function build(connect) {
  const w = new World({ phys, popConfig: { numGenes: NG }, seed: 11 });
  for (const [n, e] of POOL) w.addPlace(n, e);
  if (connect > 0) for (let i = 0; i + 1 < POOL.length; i++) w.connect(i, i + 1, connect);
  for (let i = 0; i < 220; i++) w.step();
  return w;
}

const iso = census(build(0));
// Starke Verbindung: mit der aquatischen Nische sind die Biome eigenständiger,
// darum braucht die Homogenisierung mehr Genfluss, um Arten zu verschmelzen.
const con = census(build(0.6));

console.log("Stufe 6 — emergenter Arten-Zensus (5 Orte)\n");
console.log("  Isolierte Welt — Chronik:");
for (const s of iso) console.log("    • " + formatSpecies(s));
console.log(`\n  Verbundene Welt: ${con.length} Arten (vs. isoliert ${iso.length}).`);

const named = iso.every((s) => s.name && s.name.length > 3 && s.places.length >= 1);
const rich = iso.length >= 3;
const homog = con.length < iso.length;
console.log("");
console.log(`  Arten sind benannt & Orten zugeordnet:     ${named ? "OK" : "FAIL"}`);
console.log(`  Vielfältige Welt -> >=3 emergente Arten:   ${rich ? "OK" : "FAIL"} (${iso.length})`);
console.log(`  Verbindung senkt die Artenzahl:            ${homog ? "OK" : "FAIL"}`);
if (named && rich && homog) console.log("\nStatus: OK — emergente Arten-Erfassung ohne handgeschriebene classify().");
else { console.log("\nStatus: FAIL."); process.exit(1); }
