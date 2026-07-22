// Archetyp-Erkennung: liest das fertige Genom und benennt, WAS daraus geworden
// ist ("Tier - Aktiver Grossjaeger", "Pflanze - Verholzt/Baum-artig", ...).
// Das ist die spuerbare Auszahlung ("ich bin fast alles koennen") und zugleich
// der Kern des spaeteren Genbuchs/Bestiariums.

import type { TraitVector } from "./types.js";

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

export interface Archetype {
  kingdom: "Pflanze" | "Tier" | "Uebergangsform";
  name: string;
  emoji: string;
}

export function classify(t: TraitVector): Archetype {
  const photo = t[I.photosynthesis];
  const mob = t[I.mobility];
  const struct = t[I.structure];
  const size = t[I.size];
  const armor = t[I.armor];
  const insul = t[I.insulation];
  const limb = t[I.limbLength];
  const metab = t[I.metabolism];

  // Reich bestimmen ueber die Energie-Achse.
  if (photo > 0.45 && mob < 0.4) {
    // --- Pflanzen-Pfad ---
    if (struct > 0.6) return { kingdom: "Pflanze", name: "Verholzt / Baum-artig (Licht-Konkurrent)", emoji: "🌳" };
    if (armor > 0.5) return { kingdom: "Pflanze", name: "Bewehrte Pflanze (Dornen / Rinde)", emoji: "🌵" };
    if (insul > 0.6) return { kingdom: "Pflanze", name: "Polsterpflanze (kaelteangepasst)", emoji: "🌿" };
    return { kingdom: "Pflanze", name: "Kraut / niedrige Pflanze", emoji: "☘️" };
  }

  if (mob > 0.45 && photo < 0.4) {
    // --- Tier-Pfad ---
    if (armor > 0.55 && size > 0.55) return { kingdom: "Tier", name: "Gepanzerter Koloss", emoji: "🦏" };
    if (armor > 0.55) return { kingdom: "Tier", name: "Gepanzertes Beutetier", emoji: "🐢" };
    if (size > 0.6 && metab > 0.6) return { kingdom: "Tier", name: "Aktiver Grossjaeger", emoji: "🐺" };
    if (limb > 0.6 && size < 0.45) return { kingdom: "Tier", name: "Behaender Kletterer / Springer", emoji: "🐒" };
    if (insul > 0.6) return { kingdom: "Tier", name: "Fell-Warmblueter (kaelteangepasst)", emoji: "🦊" };
    if (size < 0.3) return { kingdom: "Tier", name: "Kleines flinkes Tier", emoji: "🐭" };
    return { kingdom: "Tier", name: "Generalisten-Tier", emoji: "🦎" };
  }

  // --- Zwischenform ---
  return { kingdom: "Uebergangsform", name: "Mischotroph (Pflanze/Tier-Zwischenform)", emoji: "🦠" };
}
