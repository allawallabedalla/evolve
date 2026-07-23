// Ökologischer Plausibilitäts-Abgleich: vergleicht die NISCHEN-BESETZUNG der
// Engine (welche Umwelt -> welcher gewinnende Phänotyp) gegen die reale
// Biodiversitäts-Struktur aus docs/biodiversity-reference.md.
//
// WICHTIG: Das ist KEIN Abgleich der Artenzahl (die Engine hat keinen
// Speziations-Mechanismus), sondern der robusten Struktur-Aussagen (C1..C6).
// Ergänzt die Orakel-Validität (Dynamik-Treue) um die fehlende Ebene
// "stimmt das Modell mit der REALITÄT?".
//
// Aufruf:  npm run ecology   (baut vorher, läuft dann dieses Skript)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runSimulation } from "../dist/engine/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const params = JSON.parse(readFileSync(join(ROOT, "fitted-params.json"), "utf-8")).params;

// Reich-Klassifikation auf Kingdom-Ebene — gespiegelt aus classify() in
// app/index.html (nur die Reich-Achse: Photosynthese x Mobilität + Größe).
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

// Umwelt-Sweep: 4^6-Gitter, jede Umwelt bis zur Konvergenz evolvieren.
const KEYS = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];
const VALS = [0.1, 0.37, 0.63, 0.9];
const GENERATIONS = 300;
const counts = { Tier: 0, Pflanze: 0, Pilz: 0, Mikrobe: 0, Protist: 0 };
let total = 0;

const grid = Math.pow(VALS.length, KEYS.length);
for (let n = 0; n < grid; n++) {
  let t = n;
  const env = {};
  for (let d = 0; d < KEYS.length; d++) {
    env[KEYS[d]] = VALS[t % VALS.length];
    t = Math.floor(t / VALS.length);
  }
  const { final } = runSimulation(env, GENERATIONS, phys, params);
  counts[kingdom(final)]++;
  total++;
}

const pct = (k) => (100 * counts[k]) / total;
const hetero = pct("Tier") + pct("Pilz") + pct("Mikrobe");
const macro = { Tier: pct("Tier"), Pflanze: pct("Pflanze"), Pilz: pct("Pilz") };
const macroSorted = Object.entries(macro).sort((a, b) => b[1] - a[1]);
const tierTop2 = macroSorted.slice(0, 2).some(([k]) => k === "Tier");
const maxShare = Math.max(...Object.keys(counts).map(pct));
const leader = Object.keys(counts).sort((a, b) => pct(b) - pct(a))[0];

console.log(`Ökologie-Abgleich — ${total} Umwelten (${VALS.length}^${KEYS.length}-Gitter, ${GENERATIONS} Gen)\n`);
console.log("Reich-Anteil (Nischen-Besetzung):");
for (const k of Object.keys(counts).sort((a, b) => pct(b) - pct(a))) {
  console.log(`  ${k.padEnd(9)} ${pct(k).toFixed(1).padStart(5)} %  ${"█".repeat(Math.round(pct(k) / 2))}`);
}
console.log(`  (Heterotrophe zusammen: ${hetero.toFixed(1)} %)\n`);

// --- Kriterien aus docs/biodiversity-reference.md (§4) ---
const checks = [
  ["C1 alle 5 Reiche vorhanden", Object.values(counts).every((c) => c > 0)],
  ["C2 Heterotrophe (Tier+Pilz+Mikrobe) >= 60 %", hetero >= 60],
  ["C3 Tiere >= 15 % und Top-2 der Makro-Reiche", pct("Tier") >= 15 && tierTop2],
  ["C4 kein Reich > 55 %", maxShare <= 55],
  ["C5 Pilze >= 5 %", pct("Pilz") >= 5],
  ["C6 Pflanzen 2..35 %", pct("Pflanze") >= 2 && pct("Pflanze") <= 35],
];
console.log("Kriterien (real begründet):");
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? "✓" : "✗ FAIL"}  ${name}`);
  if (!ok) failed++;
}

// Bewusste, dokumentierte Abweichung: Artenzahl vs. Ubiquität.
console.log("");
if (leader !== "Tier") {
  console.log(`WARN: Größtes Reich ist "${leader}", nicht Tiere. Nach ARTENZAHL müssten`);
  console.log(`      Tiere führen; das Engine-Maß ist Nischen-Besetzung (~Ubiquität),`);
  console.log(`      wo Mikroben real dominieren. Akzeptabel solange C3 hält (Tiere Top-2).`);
  console.log(`      Echte Arten-Dominanz bräuchte einen Speziations-Mechanismus (Backlog).`);
}

console.log("");
if (failed === 0) {
  console.log("Status: OK — Engine deckt sich mit den realen Struktur-Kriterien.");
} else {
  console.log(`Status: ${failed} Kriterium/Kriterien VERLETZT — Engine driftet von der Realität weg.`);
  process.exit(1);
}
