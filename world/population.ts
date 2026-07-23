// Populations-Kern (v2, Umbau — Stufe 1+2).
//
// Eine agentenbasierte Population, die auf der VALIDIERTEN Fitness-Landschaft
// (engine/fitness.ts, physics.json) evolviert — NICHT der Mean-Field-Mittelwert
// der Live-App, sondern der Schwarm selbst. Damit werden Koexistenz und
// evolutionaeres Branching darstellbar (der Mittelwert eines gespaltenen
// Schwarms laege im leeren Tal; siehe spike/FINDINGS.md).
//
// Dynamik = Spiegel des Python-Orakels (oracle/reference_model.py):
// fitness-proportionale Fortpflanzung + Rekombination + gaussche Mutation +
// endliche Population -> Drift. Optional frequenzabhaengige Konkurrenz.
//
// WICHTIG: Beruehrt die Live-App NICHT. Reines headless-Fundament.

import { fitness } from "../engine/fitness.js";
import type { Environment, Physics } from "../engine/types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Seedbarer RNG (mulberry32) — identisch zu Engine/Orakel, fuer Reproduzierbarkeit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gauss-Zufall (Box-Muller) aus einem uniformen RNG. */
function makeRandn(rng: () => number): () => number {
  return () => {
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Frequenzabhaengige Konkurrenz entlang EINER Merkmals-Achse (Ressourcen-Achse).
 * w_i wird geteilt durch die effektive Dichte aehnlich "grosser" Konkurrenten und
 * multipliziert mit der Ressourcen-Verfuegbarkeit K(x). Branching entsteht, wenn
 * die Konkurrenz schmaler ist als die Ressource (sigmaC < sigmaK). Dieckmann &
 * Doebeli 1999; validiert in spike/FINDINGS.md.
 */
export interface CompetitionConfig {
  axis: number; // Trait-Index als Ressourcen-/Nischen-Achse (z.B. SIZE = 1)
  sigmaC: number; // Breite des Konkurrenz-Kernels
  sigmaK: number; // Breite der Ressourcen-Verteilung K(x) (Gauss um kCenter)
  kCenter: number; // Ressourcen-Gipfel (Default 0.5)
}

export interface PopulationConfig {
  size: number; // Anzahl Agenten N
  numGenes: number; // Genom-Laenge
  mutationSd: number; // SD der gaussschen Mutation
  selPower: number; // Fitness^selPower (Selektions-Schaerfe)
  recombProb: number; // Rekombinations-Wahrscheinlichkeit je Gen
  startSpread: number; // Anfangsstreuung um den Startwert
  competition: CompetitionConfig | null;
}

/** Defaults spiegeln das Orakel (ORACLE_POP/MUT_SD/SEL_POWER/RECOMB_PROB). */
export const DEFAULT_POP_CONFIG: PopulationConfig = {
  size: 300,
  numGenes: 9,
  mutationSd: 0.06,
  selPower: 2.0,
  recombProb: 0.5,
  startSpread: 0.03,
  competition: null,
};

export class Population {
  readonly cfg: PopulationConfig;
  genomes: number[][];
  private rng: () => number;
  private randn: () => number;

  constructor(cfg: Partial<PopulationConfig>, seed: number, start = 0.5) {
    this.cfg = { ...DEFAULT_POP_CONFIG, ...cfg };
    this.rng = mulberry32(seed);
    this.randn = makeRandn(this.rng);
    const { size, numGenes, startSpread } = this.cfg;
    this.genomes = Array.from({ length: size }, () =>
      Array.from({ length: numGenes }, () => clamp01(start + this.randn() * startSpread)),
    );
  }

  get size(): number {
    return this.genomes.length;
  }

  /**
   * Population aus EINEM konkreten Genom neu befüllen (mit kleiner Streuung) —
   * z. B. um einen Ort mit der Linie des Spielers zu besiedeln („dein Wesen als
   * Ort in der Welt"). Fehlende/überzählige Gene werden auf numGenes normiert.
   */
  seedFrom(genome: number[], spread = this.cfg.startSpread): void {
    const { size, numGenes } = this.cfg;
    const base = Array.from({ length: numGenes }, (_, k) => clamp01(genome[k] ?? 0.5));
    this.genomes = Array.from({ length: size }, () =>
      base.map((v) => clamp01(v + this.randn() * spread)),
    );
  }

  /** Reproduktions-Gewichte je Individuum (Fitness^selPower, optional /Konkurrenz). */
  weights(env: Environment, phys: Physics): number[] {
    const { selPower, competition } = this.cfg;
    const base = this.genomes.map((g) => Math.pow(fitness(g, env, phys), selPower));
    if (!competition) return base;
    const { axis, sigmaC, sigmaK, kCenter } = competition;
    const x = this.genomes.map((g) => g[axis]);
    const inv2c2 = 1 / (2 * sigmaC * sigmaC);
    const inv2k2 = 1 / (2 * sigmaK * sigmaK);
    const N = this.size;
    const w = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      let n = 0;
      for (let j = 0; j < N; j++) {
        const d = x[i] - x[j];
        n += Math.exp(-d * d * inv2c2);
      }
      n /= N; // mittlere Konkurrenz-Dichte (0..1)
      const dk = x[i] - kCenter;
      const K = Math.exp(-dk * dk * inv2k2);
      w[i] = (base[i] * K) / (n + 1e-9);
    }
    return w;
  }

  /** Ein Individuum fitness-proportional ziehen (Roulette ueber kumulierte Gewichte). */
  private pick(cum: number[], total: number): number[] {
    const r = this.rng() * total;
    // binaere Suche
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return this.genomes[lo];
  }

  /** Eine Generation weiter: Selektion + Rekombination + Mutation. */
  step(env: Environment, phys: Physics): void {
    this.reproduceWith(this.weights(env, phys));
  }

  /**
   * Reproduktion mit EXTERN berechneten Gewichten — erlaubt biotische
   * Interaktionen (Praedation, Konkurrenz zwischen Populationen), deren Fitness
   * nicht allein aus der fixen Landschaft kommt (Stufe 5, world/coevolution.ts).
   */
  reproduceWith(w: number[]): void {
    const N = this.size;
    // kumulierte Gewichte
    const cum = new Array<number>(N);
    let total = 0;
    for (let i = 0; i < N; i++) {
      total += w[i];
      cum[i] = total;
    }
    const next: number[][] = new Array(N);
    const { numGenes, recombProb, mutationSd } = this.cfg;
    for (let k = 0; k < N; k++) {
      const pa = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
      const pb = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
      const child = new Array<number>(numGenes);
      for (let g = 0; g < numGenes; g++) {
        const base = this.rng() < recombProb ? pb[g] : pa[g];
        child[g] = clamp01(base + this.randn() * mutationSd);
      }
      next[k] = child;
    }
    this.genomes = next;
  }

  /** Mittleres Genom (nur sinnvoll bei unimodaler Population). */
  mean(): number[] {
    const N = this.size;
    const G = this.cfg.numGenes;
    const m = new Array<number>(G).fill(0);
    for (const ind of this.genomes) for (let g = 0; g < G; g++) m[g] += ind[g];
    return m.map((s) => s / N);
  }

  /** Werte einer Achse (fuer Cluster-Analyse). */
  axisValues(axis: number): number[] {
    return this.genomes.map((g) => g[axis]);
  }
}
