// Biotische Interaktion (v2, Umbau — Stufe 5): Räuber-Beute-Koevolution.
//
// Bisher war `predation` ein fixer Umwelt-Regler. Hier wird der Druck ENDOGEN:
// eine eigene Räuber-Population jagt die Beute nach Merkmals-Passung (Räuber
// fangen Beute ähnlicher Größe). Beute weicht aus → Räuber folgen → Wettrüsten.
// Das ist der Red-Queen-Mechanismus, einer der stärksten realen Vielfalts-Treiber.
//
// Reine Ergänzung; berührt die Live-App NICHT. Nutzt die validierte Fitness.

import { Population } from "./population.js";
import type { PopulationConfig } from "./population.js";
import type { Environment, Physics } from "../engine/types.js";
import { fitness } from "../engine/fitness.js";

export interface CoevoConfig {
  matchAxis: number; // Merkmals-Achse der Passung (Default SIZE = 1)
  matchWidth: number; // Breite des Fang-Kernels (kleiner = spezialisierter Räuber)
  predationScale: number; // maximaler endogener Räuberdruck auf die Beute (0..1)
  predFloor: number; // Grund-Reproduktion des Räubers ohne Beute-Treffer
  predGain: number; // wie stark Beute-Passung die Räuber-Fitness hebt
  selPower: number;
}

export const DEFAULT_COEVO: CoevoConfig = {
  matchAxis: 1,
  matchWidth: 0.15,
  predationScale: 0.9,
  predFloor: 0.3,
  predGain: 1.6,
  selPower: 2.0,
};

export class Ecosystem {
  prey: Population;
  predator: Population;
  private env: Environment;
  private phys: Physics;
  private cfg: CoevoConfig;
  history: { preyMean: number; predMean: number; predation: number }[] = [];

  constructor(
    env: Environment,
    phys: Physics,
    popCfg: Partial<PopulationConfig>,
    coevo: Partial<CoevoConfig> = {},
    seed = 1,
  ) {
    this.env = env;
    this.phys = phys;
    this.cfg = { ...DEFAULT_COEVO, ...coevo };
    this.prey = new Population(popCfg, seed);
    this.predator = new Population(popCfg, seed ^ 0x9e3779b9);
  }

  private axis(pop: Population): number[] {
    return pop.axisValues(this.cfg.matchAxis);
  }

  /** Ein koevolutionärer Schritt: endogene Praedation + Räuber-Erfolg. */
  step(withPredators = true): void {
    const { matchWidth, predationScale, predFloor, predGain, selPower } = this.cfg;
    const inv2w2 = 1 / (2 * matchWidth * matchWidth);
    const preyX = this.axis(this.prey);
    const predX = this.axis(this.predator);
    const nPred = predX.length;

    // Beute-Gewichte: fitness mit INDIVIDUELLER Praedation aus dem Räuber-Match.
    const preyW = new Array<number>(this.prey.size);
    let meanPred = 0;
    for (let i = 0; i < this.prey.size; i++) {
      let match = 0;
      if (withPredators) {
        for (let p = 0; p < nPred; p++) {
          const d = preyX[i] - predX[p];
          match += Math.exp(-d * d * inv2w2);
        }
        match /= nPred; // 0..1: wie stark diese Beute ins Beuteschema passt
      }
      const P = withPredators ? predationScale * match : 0;
      meanPred += P / this.prey.size;
      const envI: Environment = { ...this.env, predation: Math.min(1, this.env.predation + P) };
      preyW[i] = Math.pow(fitness(this.prey.genomes[i], envI, this.phys), selPower);
    }

    // Räuber-Gewichte: Grundviabilität × Beute-Treffer (Passung an vorhandene Beute).
    if (withPredators) {
      const predW = new Array<number>(nPred);
      for (let p = 0; p < nPred; p++) {
        let food = 0;
        for (let i = 0; i < preyX.length; i++) {
          const d = predX[p] - preyX[i];
          food += Math.exp(-d * d * inv2w2);
        }
        food /= preyX.length;
        const base = Math.pow(fitness(this.predator.genomes[p], this.env, this.phys), selPower);
        predW[p] = base * (predFloor + predGain * food);
      }
      this.predator.reproduceWith(predW);
    }
    this.prey.reproduceWith(preyW);

    this.history.push({
      preyMean: mean(preyX),
      predMean: withPredators ? mean(predX) : 0,
      predation: meanPred,
    });
  }

  preyMeanAxis(): number {
    return mean(this.axis(this.prey));
  }
  predMeanAxis(): number {
    return mean(this.axis(this.predator));
  }
}

function mean(a: number[]): number {
  return a.reduce((s, c) => s + c, 0) / a.length;
}

/** Zeitliche Streuung einer History-Grösse über die letzten n Schritte (Red-Queen-Mass). */
export function temporalSd(vals: number[], lastN: number): number {
  const s = vals.slice(-lastN);
  const m = mean(s);
  return Math.sqrt(s.reduce((a, c) => a + (c - m) ** 2, 0) / s.length);
}
