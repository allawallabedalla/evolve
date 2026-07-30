// Populations-/Life-History-Ebene (Lebendige-Welt-Roadmap Phase 7, Punkt 10): r/K-
// Strategie als WELT-Eigenschaft, kein Einzel-Gen-Phänotyp.
//
// world/population.ts haelt die Populationsgroesse IMMER fest (reproduceWith erzeugt
// exakt so viele Nachkommen wie Eltern vorhanden waren) — jede bisherige Dynamik
// (Koevolution, Symbiose, Jahreszeiten) lebt bei konstantem N. Echte r/K-Selektion
// (MacArthur & Wilson 1967) braucht aber eine Populations GROESSE, die selbst auf die
// Umwelt reagiert: r-Strategen wachsen schnell aus einem Engpass heraus (viele nachkommen,
// wenig Konkurrenz-Druck je Individuum), K-Strategen wachsen langsam, aber ihre Population
// erreicht bei intensiver Konkurrenz eine hoehere individuelle Qualitaet.
//
// Reine Ergaenzung in einem NEUEN Modul, world/population.ts bleibt unangetastet — das
// bewusst variable-Groessen-Wachstum hier soll das validierte, feste-Groesse-Verhalten von
// Population.reproduceWith() nicht gefaehrden. Kein neues Gen, keine physics.json-
// Aenderung, beruehrt die Live-App nicht.

import { Population, mulberry32 } from "./population.js";
import type { Environment, Physics } from "../engine/types.js";
import { fitness } from "../engine/fitness.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export interface LifeHistoryConfig {
  r: number; // maximale Wachstumsrate je Generation (r-Anteil der Strategie)
  K: number; // Tragfaehigkeit (Populationsobergrenze)
  selPower: number; // Selektions-Schaerfe bei der Reproduktion DIESER Population
  // (K-Strategen: hoch — intensive Konkurrenz um wenige Nachkommen-Plaetze;
  //  r-Strategen: niedrig — viele Nachkommen, weniger scharfe Auswahl je Individuum)
}

/** Logistisches Wachstum: >1 (waechst) wenn N<K, <1 (schrumpft) wenn N>K, 1 bei N=K. */
function nextSize(N: number, cfg: LifeHistoryConfig): number {
  const growth = 1 + cfg.r * (1 - N / cfg.K);
  return Math.max(2, Math.min(cfg.K, Math.round(N * growth)));
}

/**
 * Eine Population variabler Groesse einen Schritt weiter — Selektion + Rekombination +
 * Mutation wie Population.reproduceWith, aber die Nachkommenzahl folgt `nextSize()`
 * statt der aktuellen Groesse. `pop.genomes` wird direkt ersetzt (kein Umweg ueber
 * Population.reproduceWith, das eine feste Groesse voraussetzt).
 */
export function stepVariableSize(
  pop: Population,
  env: Environment,
  phys: Physics,
  life: LifeHistoryConfig,
  rng: () => number,
  randn: () => number,
): void {
  const N = pop.size;
  const w = pop.genomes.map((g) => Math.pow(fitness(g, env, phys), life.selPower));
  const cum = new Array<number>(N);
  let total = 0;
  for (let i = 0; i < N; i++) {
    total += w[i];
    cum[i] = total;
  }
  const pick = (): number[] => {
    if (total <= 0) return pop.genomes[(rng() * N) | 0];
    const r = rng() * total;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return pop.genomes[lo];
  };

  const target = nextSize(N, life);
  const { numGenes, recombProb, mutationSd } = pop.cfg;
  const next: number[][] = new Array(target);
  for (let k = 0; k < target; k++) {
    const pa = pick();
    const pb = pick();
    const child = new Array<number>(numGenes);
    for (let g = 0; g < numGenes; g++) {
      const base = rng() < recombProb ? pb[g] : pa[g];
      child[g] = clamp01(base + randn() * mutationSd);
    }
    next[k] = child;
  }
  pop.genomes = next;
}

/** Gauss-Zufall (Box-Muller) aus einem uniformen RNG — identisch zur Konvention in population.ts. */
export function makeRandn(rng: () => number): () => number {
  return () => {
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

export { mulberry32 };
