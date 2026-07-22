// Entwicklungs-Schicht: Genotyp -> Phaenotyp (Bauplan).
//
// Uebersetzt das validierte 8-Gen-Genom deterministisch in einen strukturierten,
// modularen Koerper. Das ist der "viele Formen aus wenigen Bausteinen"-Motor UND
// die Datenstruktur, die spaeter ein prozeduraler Renderer direkt zeichnen kann.
//
// Wichtig: rein GENOTYP-abhaengig und deterministisch (keine Umwelt, kein
// Zufall) - so ist der Bauplan reproduzierbar und testbar. Er veraendert die
// Fitness NICHT, daher beruehrt er die Validitaet gegen das Orakel nicht.

import type { TraitVector } from "./types.js";
import { classify, type Archetype } from "./archetype.js";

const I = {
  insulation: 0,
  size: 1,
  limbLength: 2,
  metabolism: 3,
  armor: 4,
  photosynthesis: 5,
  mobility: 6,
  structure: 7,
};

export interface Appendage {
  type: string; // z.B. "Laufbein", "Blatt", "Greifwerkzeug"
  count: number;
  note: string; // Kurzcharakter, z.B. "lang" / "kraeftig"
}

export interface Morphology {
  kingdom: Archetype["kingdom"];
  symmetry: "radiaer" | "bilateral" | "asymmetrisch";
  sizeClass: string;
  segments: number;
  covering: string[];
  appendages: Appendage[];
  locomotion: string;
  energyMode: string;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function sizeClassOf(size: number): string {
  if (size < 0.15) return "winzig";
  if (size < 0.35) return "klein";
  if (size < 0.6) return "mittelgross";
  if (size < 0.8) return "gross";
  return "riesig";
}

/** Bildet das Genom auf einen konkreten Bauplan ab. */
export function develop(genome: TraitVector): Morphology {
  const insulation = genome[I.insulation];
  const size = genome[I.size];
  const limb = genome[I.limbLength];
  const metabolism = genome[I.metabolism];
  const armor = genome[I.armor];
  const photo = genome[I.photosynthesis];
  const mobility = genome[I.mobility];
  const structure = genome[I.structure];

  const arch = classify(genome);
  const isPlant = arch.kingdom === "Pflanze";
  const isAnimal = arch.kingdom === "Tier";

  const symmetry: Morphology["symmetry"] = isPlant
    ? "radiaer"
    : isAnimal
      ? "bilateral"
      : "asymmetrisch";

  // Segmentierung: groessere, staerker strukturierte Koerper sind staerker gegliedert.
  const segments = 1 + Math.round(clamp01(0.5 * size + 0.5 * structure) * 5); // 1..6

  // Bedeckung (kingdom-gerecht)
  const covering: string[] = [];
  if (insulation > 0.5)
    covering.push(isPlant ? "isolierende Behaarung (Trichome)" : "dichtes Fell / Isolationsschicht");
  if (armor > 0.5) covering.push(isPlant ? "harte Rinde / Dornen" : "Panzerplatten / Schale");
  if (isPlant && structure > 0.6) covering.push("verholzte Aussenschicht");
  if (covering.length === 0) covering.push(isPlant ? "weiches Pflanzengewebe" : "nackte Haut");

  // Anhaenge
  const appendages: Appendage[] = [];
  if (isPlant) {
    const leaves = Math.round(photo * 8);
    if (leaves > 0)
      appendages.push({
        type: "Photosynthese-Flaeche / Blatt",
        count: leaves,
        note: photo > 0.7 ? "grossflaechig" : "sparsam",
      });
    if (structure > 0.55 && size > 0.4)
      appendages.push({ type: "Stamm / Stuetzachse", count: 1, note: "tragend" });
    else if (structure > 0.55)
      appendages.push({ type: "verdichtete Sprossachse", count: 1, note: "niedrig" });
    if (structure > 0.4)
      appendages.push({ type: "Wurzel / Halt-Struktur", count: 2 + Math.round(structure * 3), note: "verankernd" });
  } else {
    // Tier / Uebergangsform: Fortbewegungs- und Greif-Anhaenge
    const locomotorCount = Math.round(clamp01(0.6 * mobility + 0.4 * limb) * 8);
    if (locomotorCount > 0)
      appendages.push({
        type: limb > 0.55 ? "langes Lauf-/Greifbein" : "kurze Extremitaet",
        count: locomotorCount,
        note: mobility > 0.6 ? "kraeftig" : "schwach",
      });
    if (limb > 0.5 && metabolism > 0.4)
      appendages.push({
        type: "Fress-/Greifwerkzeug",
        count: 1 + Math.round(limb * 2),
        note: "aktiv",
      });
    if (armor > 0.6)
      appendages.push({ type: "Verteidigungsstruktur (Horn/Stachel)", count: 1 + Math.round(armor * 3), note: "hart" });
    if (appendages.length === 0)
      appendages.push({ type: "reduzierter Koerperfortsatz", count: 1, note: "ruhend" });
  }

  // Fortbewegung
  let locomotion: string;
  if (isPlant) locomotion = "sessil (festgewachsen)";
  else if (mobility < 0.3) locomotion = "kaum beweglich (dormant)";
  else if (limb > 0.6 && size < 0.45) locomotion = "Kletterer / Springer";
  else if (size > 0.6) locomotion = "schwerer Laeufer";
  else locomotion = "Laeufer / Renner";

  const energyMode = isPlant
    ? "Photosynthese"
    : isAnimal
      ? "Jaeger / Sammler"
      : "Mischotroph (beides)";

  return {
    kingdom: arch.kingdom,
    symmetry,
    sizeClass: sizeClassOf(size),
    segments,
    covering,
    appendages,
    locomotion,
    energyMode,
  };
}

/** Bauplan als lesbarer deutscher Satz (fuer die Text-Demo). */
export function describeMorphology(m: Morphology): string {
  const app = m.appendages.map((a) => `${a.count}× ${a.type} (${a.note})`).join(", ");
  const segLabel =
    m.kingdom === "Pflanze"
      ? `${m.segments} Verzweigungsebene(n)`
      : `${m.segments} Koerpersegment(e)`;
  return (
    `${m.symmetry}symmetrisch, ${m.sizeClass}, ${segLabel}. ` +
    `Bedeckung: ${m.covering.join(" + ")}. ` +
    `Anhaenge: ${app}. ` +
    `Energie: ${m.energyMode}. Fortbewegung: ${m.locomotion}.`
  );
}
