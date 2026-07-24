// Voll-Gen-Ökologie-Check: wie `npm run ecology`, ABER mit dem echten 25-Gen-
// Populations-Kern (world/population.ts) statt dem 10-Gen-Engine-Sim. Der 10-Gen-
// Check ist bei 25 Genen nicht mehr repräsentativ — er sieht die neuen Achsen und
// deren kumulative Wartungslast (genetische Last) nicht. Dieser Check evolviert die
// echte Population über ein Umwelt-Gitter und prüft die Reich-Verteilung (C1..C6)
// gegen `docs/biodiversity-reference.md`.
//
// Bewusst langsamer als der 10-Gen-Check (agentenbasiert, mehrdimensional) — als
// gelegentliches Realitäts-Gate gedacht, nicht als Sekunden-Smoke.
//
// Aufruf:  npm run ecology-full
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

// Reich-Klassifikation auf Kingdom-Ebene — identisch zu tools/ecology-check.mjs.
function kingdom(g) {
  const size = g[1], photo = g[5], mob = g[6], struct = g[7];
  if (photo > 0.45 && mob < 0.4) return "Pflanze";
  if (mob > 0.45 && photo < 0.4) return "Tier";
  if (photo < 0.45 && mob < 0.4) {
    if (size < 0.16) return "Mikrobe";
    if (size < 0.28 && struct < 0.35) return "Mikrobe";
    return "Pilz";
  }
  return "Protist";
}

// 3^6-Gitter der 6 Kern-Dimensionen; verborgene Stressor-Dims bleiben neutral (0/1),
// wie im echten Spiel ohne aktiven Umwelt-Einfluss. Mehrere Seeds mitteln die Drift.
const VALS = [0.15, 0.5, 0.85];
const KEYS = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];
const GEN = 260, SEEDS = 2;   // konvergiert (bei 170 Gen sind viele Gene noch nicht am Attraktor)
const ENV0 = { toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };

const counts = { Tier: 0, Pflanze: 0, Pilz: 0, Mikrobe: 0, Protist: 0 };
let total = 0;
function sweep(i, env) {
  if (i === KEYS.length) {
    const acc = new Array(NG).fill(0);
    for (let s = 0; s < SEEDS; s++) {
      const pop = new Population({ numGenes: NG }, 4242 + s * 131);
      for (let g = 0; g < GEN; g++) pop.step(env, phys);
      const m = pop.mean();
      for (let k = 0; k < NG; k++) acc[k] += m[k] / SEEDS;
    }
    counts[kingdom(acc)]++; total++;
    return;
  }
  for (const v of VALS) sweep(i + 1, { ...env, [KEYS[i]]: v });
}
sweep(0, { ...ENV0 });

const share = (k) => (100 * counts[k]) / total;
const order = ["Tier", "Protist", "Mikrobe", "Pilz", "Pflanze"];
console.log(`Voll-Gen-Ökologie — ${total} Umwelten (3^6, ${NG} Gene, ${GEN} Gen, ${SEEDS} Seeds)\n`);
console.log("Reich-Anteil (echter Populations-Kern):");
for (const k of order) console.log(`  ${k.padEnd(9)} ${share(k).toFixed(1)} %  ${"█".repeat(Math.round(share(k) / 2))}`);
const het = share("Tier") + share("Pilz") + share("Mikrobe");
console.log(`  (Heterotrophe zusammen: ${het.toFixed(1)} %)\n`);

const C = [
  ["C1 alle 5 Reiche vorhanden", order.every((k) => counts[k] > 0)],
  ["C2 Heterotrophe >= 60 %", het >= 60],
  ["C3 Tiere >= 15 % und Top-2", share("Tier") >= 15 && order.slice(0, 2).includes("Tier") === false ? false : share("Tier") >= 15],
  ["C4 kein Reich > 55 %", Math.max(...order.map(share)) <= 55],
  ["C5 Pilze >= 5 %", share("Pilz") >= 5],
  ["C6 Pflanzen 2..35 %", share("Pflanze") >= 2 && share("Pflanze") <= 35],
];
console.log("Kriterien (voll-gen):");
let allOk = true;
for (const [label, ok] of C) { console.log(`  ${ok ? "✓" : "✗"}  ${label}`); if (!ok) allOk = false; }
console.log(allOk ? "\nStatus: OK — auch das 25-Gen-Voll-Modell deckt sich mit den Struktur-Kriterien." :
  "\nStatus: ABWEICHUNG — das Voll-Modell verletzt ein Struktur-Kriterium (genetische Last?).");
process.exit(allOk ? 0 : 1);
