// EINE PHYSIK, ZWEI DATEIEN — und der Nachweis, dass sie dasselbe sagen.
//
// WOZU. Die App laedt BEIDE Physiken gleichzeitig:
//   app/index.html:473   const PHYS = { … }                    aus physics.json
//   app/index.html:8797  PHYS2 = fetch("./core/physics-v2.json")
// Die Kreatur-Simulation rechnet mit der einen, der Welt-Kern (world/*.ts, Zensus,
// Raritaet, Biogeografie) mit der anderen. Dieselbe Kreatur in derselben Umwelt darf
// nicht zwei verschiedene Fitness-Werte haben, je nachdem welcher Teil der App fragt.
//
// WAS SCHIEFGING. `world/physics-v2.json` war stehengeblieben: ZEHN Schluessel fehlten
// (photoYield, photoWaterSat, landDesiccation, disturbStructureLoss, fireresWoodCost und
// die fuenf amphibious*), und alle zehn werden in engine/fitness.ts dereferenziert.
// `undefined * x` ist NaN, und NaN pflanzt sich durch die ganze Bewertung fort:
//
//   fitness(0.5er-Genom, world/physics-v2.json) = NaN
//
// Damit lief der gesamte Welt-Kern ohne wirksame Selektion — die Gene drifteten zur
// Mitte (gemessenes Photosynthese-Mittel 0,35–0,60 statt 0,06–0,11 mit echter Fitness).
// census-check meldete 0 Arten; rarity-check, seed-check und world-ecology-check meldeten
// OK, obwohl sie auf einer Welt liefen, die gar nicht rechnete. Ein Pruefstand, der
// gruen wird, weil nichts passiert, ist kein Pruefstand.
//
// WARUM VOLLABGLEICH UND NICHT NUR DIE ZEHN SCHLUESSEL. Die beiden Dateien wichen
// zusaetzlich in drei Werten ab (defenseFromArmor 0.45/0.46, defenseFromMobility
// 0.35/0.18, defenseFromCamo 0.30/0.50). Gemessen ueber 4.000 Zufallsproben ergaeben
// diese drei allein 2,25 % mittlere und bis zu 6,3 % maximale Abweichung zwischen den
// beiden Physiken — also genau den Widerspruch, den es zu beseitigen gilt. Und sie
// tragen keinen Kalibrier-Beleg: `fitted-params.json` enthaelt keinen davon, `Stufe 3b`
// hat sie nicht angefasst. `physics.json` ist dagegen die Datei, gegen die 23 der 27
// Pruefstaende validieren (reality 21/21, distribution B3 auf dem Baseline-Wert,
// Orakel-Paritaet 1,388e-17). Die validierte Seite gewinnt.
//
// Der Kopfkommentar von bundle-app-core.mjs sprach von einer „getunten v2-Landschaft".
// Diese Absicht mag es gegeben haben — die Datei erfuellt sie seit dem NaN nicht mehr.
//
// Aufruf:  node tools/physics-sync.mjs           (pruefen, Exit 1 bei Abweichung)
//          node tools/physics-sync.mjs --write   (world/physics-v2.json neu erzeugen)

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUELLE = join(ROOT, "physics.json");
const ZIEL = join(ROOT, "world", "physics-v2.json");
const WRITE = process.argv.includes("--write");

const js = JSON.parse(readFileSync(QUELLE, "utf-8"));

// ---------------------------------------------------------------------------
// SCHREIBEN — die abgeleitete Datei entsteht, sie wird nicht gepflegt.
if (WRITE) {
  const out = { ...js };
  out._comment = "AUTO-GENERIERT von tools/physics-sync.mjs aus physics.json — nicht von "
    + "Hand editieren. Der Welt-Kern (world/*.ts) und die Kreatur-Simulation der App "
    + "muessen dieselbe Physik benutzen; jede Abweichung gibt derselben Kreatur zwei "
    + "verschiedene Fitness-Werte. Aendern heisst: physics.json aendern und dieses "
    + "Werkzeug mit --write laufen lassen. Vorheriger Stand: hand-gepflegt, zehn "
    + "Schluessel fehlten, fitness() lieferte NaN.";
  writeFileSync(ZIEL, JSON.stringify(out, null, 1) + "\n");
  console.log(`world/physics-v2.json aus physics.json erzeugt — ${Object.keys(out).length} Schluessel.`);
  console.log("Naechster Schritt: npm run bundle-app (kopiert nach app/core/) und npm run pdca.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// PRUEFEN
const v2 = JSON.parse(readFileSync(ZIEL, "utf-8"));
const probleme = [];

const fehlend = Object.keys(js).filter((k) => k !== "_comment" && !(k in v2));
const ueberzaehlig = Object.keys(v2).filter((k) => k !== "_comment" && !(k in js));
if (fehlend.length) probleme.push(`fehlende Schluessel: ${fehlend.join(", ")}`);
if (ueberzaehlig.length) probleme.push(`ueberzaehlige Schluessel: ${ueberzaehlig.join(", ")}`);

const abweichend = Object.keys(js).filter((k) =>
  k !== "_comment" && k in v2 && JSON.stringify(js[k]) !== JSON.stringify(v2[k]));
if (abweichend.length)
  probleme.push(`abweichende Werte: ${abweichend.map((k) => `${k} ${JSON.stringify(v2[k])} statt ${JSON.stringify(js[k])}`).join(" · ")}`);

// Der eigentliche Nachweis: nicht die Schluessel, sondern das ERGEBNIS. Zwei Dateien
// koennen sich in einem unbenutzten Wert unterscheiden und trotzdem dieselbe Physik
// sein — und umgekehrt reicht ein fehlender Schluessel fuer NaN. Gemessen wird deshalb
// die Fitness selbst, ueber zufaellige Genome in zufaelligen Umwelten.
const { fitness } = await import(join(ROOT, "dist", "engine", "fitness.js"));
const AX = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];
const ST = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];
let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

let maxAbs = 0, sumRel = 0, n = 0, nanJs = 0, nanV2 = 0;
const N = 4000;
for (let k = 0; k < N; k++) {
  const env = { oxygen: 1 };
  for (const a of AX) env[a] = rnd();
  for (const x of ST) env[x] = 0;
  if (k % 2 === 0) env[ST[Math.floor(rnd() * ST.length)]] = 0.3 + rnd() * 0.6;
  const g = Array.from({ length: js.traits.length }, () => rnd());
  const a = fitness(g, env, js), b = fitness(g, env, v2);
  if (!Number.isFinite(a)) { nanJs++; continue; }
  if (!Number.isFinite(b)) { nanV2++; continue; }
  const d = Math.abs(a - b);
  if (d > maxAbs) maxAbs = d;
  if (a > 0) sumRel += d / a;
  n++;
}
if (nanV2) probleme.push(`fitness() liefert mit world/physics-v2.json in ${nanV2} von ${N} Faellen NaN — der Welt-Kern rechnet dann ohne Selektion.`);
if (nanJs) probleme.push(`fitness() liefert mit physics.json in ${nanJs} von ${N} Faellen NaN.`);
if (maxAbs > 0) probleme.push(`max |Δfitness| = ${maxAbs.toExponential(3)} · mittlere relative Abweichung ${((100 * sumRel) / Math.max(n, 1)).toFixed(2)} %`);

console.log("physics-sync — physics.json gegen world/physics-v2.json");
console.log(`  ${n} vergleichbare Stichproben · max |Δfitness| ${maxAbs.toExponential(3)}`);
if (!probleme.length) {
  console.log("\nStatus: OK — beide Dateien beschreiben dieselbe Physik (bitweise gleiche Fitness).");
  process.exit(0);
}
console.log("\n" + probleme.length + " Problem(e):");
for (const p of probleme) console.log("  ✗ " + p);
console.log("\nBeheben: node tools/physics-sync.mjs --write && npm run bundle-app");
console.log("Status: FAIL.");
process.exit(1);
