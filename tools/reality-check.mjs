// Realitäts-Abgleich Ebene 2: REGEL-TREUE der Fitness-Landschaft.
//
// Der Ökologie-Check (npm run ecology) prüft die MAKRO-Struktur (Reich-Anteile).
// Dieser Check prüft eine andere, feinere Realitäts-Ebene: reagiert JEDES Merkmal
// auf seinen Umwelt-Treiber mit dem biologisch KORREKTEN Vorzeichen? Das sind
// Lehrbuch-Regeln der Öko-Evolution (Thermoregulation, Verteidigung, Stromlinien-
// form, Photosynthese-Licht, Höhen-Flug + die neuen Extremnischen-Achsen).
//
// Methode: der Populations-Kern (world/population.ts, alle Gene) evolviert je Regel
// eine Umwelt mit NIEDRIGEM und HOHEM Treiber (Rest neutral, aber so gewählt, dass
// die Auszahlung des Merkmals überhaupt verfügbar ist). Erwartet wird, dass sich das
// Zielmerkmal in die vorhergesagte Richtung bewegt (Δ über Schwelle). Ground Truth
// ist die geteilte Fitness selbst — der Check deckt also "Modell ↔ reale Regel" ab,
// unabhängig von der Reich-Verteilung.
//
// Aufruf:  npm run reality
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const T = Object.fromEntries(phys.traits.map((t, i) => [t, i]));

const GEN = 240, SEEDS = 5;
// Attraktor-Mittel eines Merkmals in Umwelt `env` (über Seeds gemittelt).
function evolve(env, traitIdx) {
  let acc = 0;
  for (let s = 0; s < SEEDS; s++) {
    const pop = new Population({ numGenes: NG }, 4242 + s * 97);
    for (let i = 0; i < GEN; i++) pop.step(env, phys);
    acc += pop.mean()[traitIdx] / SEEDS;
  }
  return acc;
}

// Neutrale Basis-Umwelt; jede Regel überschreibt den Treiber + nötigen Kontext.
const BASE = { temperature: 0.5, predation: 0.3, foodAbundance: 0.65, foodHeight: 0.2, light: 0.5, water: 0.4, toxicity: 0, oxygen: 1, salinity: 0 };
const mk = (over) => ({ ...BASE, ...over });

// Jede Regel: Zielmerkmal, Umwelt "lo" und "hi", und die erwartete Richtung des
// Merkmals von lo -> hi (up = steigt, down = fällt). ctx erklärt die Biologie.
const RULES = [
  { name: "Kälte → Wärmedämmung", trait: "insulation", dir: "up",
    lo: mk({ temperature: 0.9 }), hi: mk({ temperature: 0.1 }),
    ctx: "kältere Umwelt selektiert Isolation (Thermoregulation)" },
  { name: "Räuberdruck → Panzerung", trait: "armor", dir: "up",
    lo: mk({ predation: 0.05 }), hi: mk({ predation: 0.95, foodAbundance: 0.8 }),
    ctx: "hoher Räuberdruck selektiert Verteidigung" },
  { name: "Räuberdruck an Land → Grabtrieb", trait: "burrow", dir: "up",
    lo: mk({ predation: 0.05, water: 0.3, foodAbundance: 0.8 }),
    hi: mk({ predation: 0.95, water: 0.3, foodAbundance: 0.8 }),
    ctx: "an Land bietet Graben/Verstecken eine billige Räuber-Flucht (fossorial)" },
  { name: "Tiefes Wasser → Stromlinie (weniger Gliedmaßen)", trait: "limbLength", dir: "down",
    lo: mk({ water: 0.2, foodAbundance: 0.8 }), hi: mk({ water: 0.97, foodAbundance: 0.8 }),
    ctx: "im Wasserkörper erzeugen Gliedmaßen Drag -> schlanke Schwimmer" },
  { name: "Mehr Licht → mehr Photosynthese", trait: "photosynthesis", dir: "up",
    lo: mk({ light: 0.08, water: 0.8, foodAbundance: 0.25, predation: 0.15 }),
    hi: mk({ light: 0.97, water: 0.8, foodAbundance: 0.25, predation: 0.15 }),
    ctx: "Licht ist die Energiequelle der Photosynthese" },
  { name: "Hohe Nahrung (Höhe) → Flügelfläche", trait: "wing", dir: "up",
    lo: mk({ foodHeight: 0.05, foodAbundance: 0.85, water: 0.25 }),
    hi: mk({ foodHeight: 0.95, foodAbundance: 0.85, water: 0.25 }),
    ctx: "hoch stehende Nahrung/Licht belohnt Flug (Luftraum/Kronendach)" },
  { name: "Gift → Entgiftung", trait: "detox", dir: "up",
    lo: mk({ toxicity: 0 }), hi: mk({ toxicity: 0.9 }),
    ctx: "giftiges Milieu selektiert Entgiftung (Extremophil/Metallophyt)" },
  { name: "Hypoxie → Sauerstoff-Effizienz", trait: "oxyEff", dir: "up",
    lo: mk({ oxygen: 1, foodAbundance: 0.85 }), hi: mk({ oxygen: 0.12, foodAbundance: 0.85 }),
    ctx: "dünne Höhenluft/anoxisches Wasser selektiert effiziente Atmung" },
  { name: "Salz → Osmoregulation", trait: "osmo", dir: "up",
    lo: mk({ salinity: 0 }), hi: mk({ salinity: 0.9 }),
    ctx: "salziges Milieu selektiert Osmoregulation (Halophyt)" },
  { name: "UV-Strahlung → Schutzpigment", trait: "pigment", dir: "up",
    lo: mk({ uv: 0 }), hi: mk({ uv: 0.9 }),
    ctx: "starke UV-Strahlung selektiert Schutzpigmentierung" },
  { name: "Wasser + Partikel → Filterapparat", trait: "filter", dir: "up",
    lo: mk({ water: 0.2, foodAbundance: 0.85, predation: 0.1 }),
    hi: mk({ water: 0.97, foodAbundance: 0.85, predation: 0.1 }),
    ctx: "im partikelreichen Wasserkörper lohnt Suspensionsfressen (sessiler Filtrierer)" },
  { name: "Räuberdruck → Tarnung", trait: "camo", dir: "up",
    lo: mk({ predation: 0.05, foodAbundance: 0.8 }), hi: mk({ predation: 0.95, foodAbundance: 0.8 }),
    ctx: "hoher Räuberdruck selektiert visuelle Krypsis (billige, drag-freie Verteidigung)" },
];

const THRESH = 0.05; // Mindest-Δ in die erwartete Richtung
console.log(`Realitäts-Regel-Abgleich — ${RULES.length} Öko-Evolutions-Regeln (Pop-Kern, ${GEN} Gen, ${SEEDS} Seeds)\n`);
let pass = 0;
for (const r of RULES) {
  const ti = T[r.trait];
  const vLo = evolve(r.lo, ti), vHi = evolve(r.hi, ti);
  const delta = vHi - vLo;                 // Bewegung lo -> hi
  const signed = r.dir === "up" ? delta : -delta; // in "richtige Richtung" positiv
  const ok = signed >= THRESH;
  if (ok) pass++;
  const arrow = r.dir === "up" ? "↑" : "↓";
  console.log(`  ${ok ? "✓" : "✗"}  ${r.name}`);
  console.log(`       ${r.trait} ${arrow}  ${vLo.toFixed(2)} -> ${vHi.toFixed(2)}  (Δ ${signed >= 0 ? "+" : ""}${signed.toFixed(2)})   ${r.ctx}`);
}
console.log(`\n${pass}/${RULES.length} Regeln erfüllt.`);
if (pass === RULES.length) {
  console.log("Status: OK — die Fitness-Landschaft folgt den realen Öko-Evolutions-Regeln.");
} else {
  console.log("Status: ABWEICHUNG — mindestens eine Merkmal↔Treiber-Regel bricht.");
  process.exit(1);
}
