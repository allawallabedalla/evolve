// Emergente Rarität (v2, Umbau — Stufe 6+): wie leicht/oft entsteht eine Art?
//
// v1 hatte eine Rarität aus einem Sweep über handgeschriebene Formen. v2 macht
// dasselbe auf EMERGENTEN Formen (formKey): über viele zufällige Umwelten eine
// Population evolvieren und zählen, welche Form dabei herauskommt. Häufig
// entstehende Formen = häufig; nie im Sweep gesehen = legendär (nur über Drift/
// seltene Nischen). Vertieft die Chronik ohne handgeschriebene Tabelle.

import { Population, mulberry32 } from "./population.js";
import { formKey } from "./describe.js";
import type { Environment, Physics } from "../engine/types.js";

export type RarityTier = "häufig" | "gelegentlich" | "selten" | "sehr selten" | "extrem selten";

export function rarityTier(fraction: number): RarityTier {
  if (fraction >= 0.15) return "häufig";
  if (fraction >= 0.05) return "gelegentlich";
  if (fraction >= 0.02) return "selten";
  if (fraction > 0) return "sehr selten";
  return "extrem selten";
}

export interface RarityOptions {
  samples?: number; // Anzahl zufälliger Umwelten
  gens?: number; // Generationen je Umwelt
  seed?: number;
}

/** Häufigkeit je emergenter Form über einen Zufalls-Umwelt-Sweep (formKey → Anteil 0..1). */
export function rarityMap(phys: Physics, opts: RarityOptions = {}): Map<string, number> {
  const samples = opts.samples ?? 140;
  const gens = opts.gens ?? 180;
  const NG = phys.traits.length;
  const rng = mulberry32(opts.seed ?? 12345);
  const counts = new Map<string, number>();
  for (let s = 0; s < samples; s++) {
    const env: Environment = {
      temperature: rng(),
      predation: rng(),
      foodAbundance: rng(),
      foodHeight: rng(),
      light: rng(),
      water: rng(),
    };
    const pop = new Population({ numGenes: NG }, (s * 2654435761) >>> 0);
    for (let i = 0; i < gens; i++) pop.step(env, phys);
    const key = formKey(pop.mean());
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const map = new Map<string, number>();
  for (const [k, c] of counts) map.set(k, c / samples);
  return map;
}

/** Rarität einer konkreten Form (Fallback legendär, wenn im Sweep nie gesehen). */
export function rarityOf(key: string, map: Map<string, number>): { fraction: number; tier: RarityTier } {
  const fraction = map.get(key) ?? 0;
  return { fraction, tier: rarityTier(fraction) };
}
