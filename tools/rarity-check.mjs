// Stufe 6+ — emergente Rarität: wie leicht/oft entsteht eine Form? Über viele
// Zufalls-Umwelten eine Population evolvieren und zählen, welche Form herauskommt.
// Häufig entstehende Formen = häufig; nie gesehene = legendär. Keine handgeschriebene
// Rarität-Tabelle — Seltenheit ist eine EIGENSCHAFT der Landschaft, kein Autoren-Label.
// Zusätzlich: der Zensus annotiert Arten korrekt mit ihrer Rarität.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { World } from "../dist/world/world.js";
import { census } from "../dist/world/census.js";
import { rarityMap, rarityTier, rarityOf } from "../dist/world/rarity.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "world", "physics-v2.json"), "utf-8"));
const NG = phys.traits.length;

console.log("Stufe 6+ — emergente Rarität\n");

// 1) Die Schwellen-Funktion selbst
const tiers = [rarityTier(0.3), rarityTier(0.08), rarityTier(0.03), rarityTier(0.005), rarityTier(0)];
const tiersOk =
  tiers[0] === "häufig" && tiers[1] === "gelegentlich" && tiers[2] === "selten" &&
  tiers[3] === "sehr selten" && tiers[4] === "extrem selten";
console.log(`  Schwellen 0.30/0.08/0.03/0.005/0 -> ${tiers.join(", ")}`);

// 2) Der Sweep produziert eine echte Verteilung (nicht alles auf eine Form)
const rmap = rarityMap(phys, { samples: 90, gens: 150 });
const forms = [...rmap.entries()].sort((a, b) => b[1] - a[1]);
const distinctTiers = new Set(forms.map(([, f]) => rarityTier(f)));
const total = forms.reduce((s, [, f]) => s + f, 0);
console.log(`\n  Sweep (90 Umwelten): ${forms.length} verschiedene Formen, Summe ${total.toFixed(2)}`);
for (const [k, f] of forms.slice(0, 6)) console.log(`    ${(f * 100).toFixed(0).padStart(3)}%  ${rarityTier(f).padEnd(12)} ${k}`);

const manyForms = forms.length >= 3;
const spread = distinctTiers.size >= 2; // mehr als nur „häufig"
const sums = Math.abs(total - 1) < 1e-6; // jeder Sweep landet in genau einer Form

// 3) Der Zensus annotiert echte Arten mit Rarität; unbekannte Form -> legendär
const POOL = [
  ["Eiszeit",   { temperature: .08, predation: .15, foodAbundance: .55, foodHeight: .15, light: .4, water: .5 }],
  ["Dschungel", { temperature: .6,  predation: .4,  foodAbundance: .85, foodHeight: .8,  light: .5, water: .8 }],
  ["Wüste",     { temperature: .92, predation: .1,  foodAbundance: .3,  foodHeight: .1,  light: .9, water: .15 }],
  ["Tiefsee",   { temperature: .35, predation: .5,  foodAbundance: .2,  foodHeight: .05, light: .05, water: 1. }],
];
const w = new World({ phys, popConfig: { numGenes: NG }, seed: 11 });
for (const [n, e] of POOL) w.addPlace(n, e);
for (let i = 0; i < 220; i++) w.step();
const sp = census(w, { rarityMap: rmap });
console.log("\n  Zensus mit Rarität:");
for (const s of sp) console.log(`    • ${s.name}  —  ${s.rarity}  (${((s.rarityFraction ?? 0) * 100).toFixed(0)}%)`);

const allAnnotated = sp.every((s) => s.rarity !== undefined);
const legendaryFallback = rarityOf("Reich|gibtsnicht", rmap).tier === "extrem selten";

console.log("");
console.log(`  Schwellen korrekt:                           ${tiersOk ? "OK" : "FAIL"}`);
console.log(`  Sweep -> mehrere Formen:                     ${manyForms ? "OK" : "FAIL"} (${forms.length})`);
console.log(`  Sweep -> mehrere Rarität-Stufen:             ${spread ? "OK" : "FAIL"} (${[...distinctTiers].join("/")})`);
console.log(`  Sweep-Anteile summieren zu 1:                ${sums ? "OK" : "FAIL"}`);
console.log(`  Zensus-Arten sind annotiert:                 ${allAnnotated ? "OK" : "FAIL"}`);
console.log(`  Unbekannte Form -> legendär (Fallback):      ${legendaryFallback ? "OK" : "FAIL"}`);

if (tiersOk && manyForms && spread && sums && allAnnotated && legendaryFallback)
  console.log("\nStatus: OK — Rarität ist emergent (Landschafts-Eigenschaft), Zensus annotiert sie.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
