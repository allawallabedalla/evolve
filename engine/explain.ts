// Klartext-Erklaerungen: WARUM entwickelt sich das Wesen so?
// Das ist das Herz der Text-Demo - die Ursache-Wirkung-Kette sichtbar machen.

import type { Environment, Physics } from "./types.js";
import { TRAITS } from "./types.js";
import type { SimResult } from "./simulate.js";

export interface ExplainEvent {
  trait: string;
  label: string;
  from: number;
  to: number;
  delta: number;
  cause: string;
  newlyDiscovered: boolean;
}

const DISCOVERY_THRESHOLD = 0.7;
const MOVE_THRESHOLD = 0.05;

function causeFor(trait: string, delta: number, env: Environment): string {
  const up = delta > 0;
  switch (trait) {
    case "insulation":
      return up
        ? "anhaltende Kaelte selektiert fuer waermende Isolation"
        : "Hitze macht Isolation zur Last (Ueberhitzung) - sie wird abgebaut";
    case "size":
      if (up) {
        if (env.predation > 0.5) return "Praedationsdruck belohnt Koerpergroesse als Schutz";
        if (env.foodHeight > 0.5) return "Groesse hilft, hoeher gelegene Nahrung zu erreichen";
        return "reichliche Nahrung macht einen groesseren Koerper tragbar";
      }
      // Groesse faellt: Ursache haengt davon ab, ob Nahrung knapp ist.
      if (env.foodAbundance < 0.4)
        return "knappe Nahrung bestraft den hohen Energiebedarf grosser Koerper";
      if (env.predation > 0.5)
        return "Groesse ist ein teurer Weg zur Verteidigung - guenstigere Merkmale (Panzer, Mobilitaet) uebernehmen";
      return "ohne klaren Vorteil lohnt der hohe Energiebedarf eines grossen Koerpers nicht";
    case "limbLength":
      return up
        ? "schwer erreichbare Nahrung selektiert fuer laengere Gliedmassen (Reichweite)"
        : "ohne Reichweitenbedarf verschwindet die Investition in lange Gliedmassen";
    case "metabolism":
      return up
        ? "reichliche Nahrung macht einen schnellen Stoffwechsel bezahlbar und vorteilhaft"
        : "bei Nahrungsknappheit senkt ein sparsamer Stoffwechsel den Energiebedarf";
    case "armor":
      return up
        ? "hoher Praedationsdruck selektiert fuer Panzerung"
        : "ohne Raeuber ist Panzerung nur teurer Ballast und wird abgebaut";
    case "photosynthesis":
      if (up) return "viel Licht bei knappem Futter macht Photosynthese zur besten Energiequelle (Pflanzen-Pfad)";
      if (env.light < 0.3 || env.water < 0.3) return "ohne Licht bzw. Wasser traegt Photosynthese nicht";
      return "reichliche Nahrung macht die Nahrungssuche lohnender als Photosynthese";
    case "mobility":
      if (up) return "erreichbares Futter belohnt aktive Fortbewegung (Tier-Pfad)";
      if (env.light > 0.6 && env.foodAbundance < 0.4)
        return "Photosynthese verdraengt die teure Mobilitaet (Pflanzen-Pfad)";
      return "kaum erreichbare Nahrung macht aktive Fortbewegung unrentabel (Energie sparen)";
    case "structure":
      return up
        ? (env.foodHeight > 0.5 || env.light > 0.6)
          ? "Stuetzgewebe erlaubt hoeheres Wachstum - mehr Licht bzw. Reichweite"
          : "Stuetzgewebe dient als Schutz (Rinde/Schale)"
        : "ohne Hoehen- oder Schutzbedarf wird Stuetzgewebe abgebaut";
    default:
      return up ? "Selektionsdruck nach oben" : "Selektionsdruck nach unten";
  }
}

/** Erzeugt Erklaer-Events aus Start- und Endzustand einer Simulation. */
export function explainRun(
  result: SimResult,
  env: Environment,
  phys: Physics,
): ExplainEvent[] {
  const events: ExplainEvent[] = [];
  for (let g = 0; g < TRAITS.length; g++) {
    const trait = TRAITS[g];
    const from = result.start[g];
    const to = result.final[g];
    const delta = to - from;
    if (Math.abs(delta) < MOVE_THRESHOLD) continue;
    events.push({
      trait,
      label: phys.traitLabels[trait] ?? trait,
      from,
      to,
      delta,
      cause: causeFor(trait, delta, env),
      newlyDiscovered: from < DISCOVERY_THRESHOLD && to >= DISCOVERY_THRESHOLD,
    });
  }
  // Groesste Veraenderung zuerst
  events.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return events;
}
