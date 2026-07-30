// Biotische Zeitachse (Lebendige-Welt-Roadmap Phase 6, Punkt 10): Umwelt als Funktion
// der Zeit statt eines festen Punktwerts. Bisher war jede Umwelt in dieser Engine eine
// EINZELNE Momentaufnahme — Population.step(env, phys) bekommt bei jedem Aufruf denselben
// env. Hier bekommt jede Generation einen ANDEREN, zyklisch schwankenden env — derselbe
// Populations-Kern, aber die Umwelt selbst "atmet".
//
// Reine Ergaenzung; beruehrt die Live-App NICHT. Kein neues Gen, keine physics.json-
// Aenderung — nur ein Umwelt-GENERATOR, der Population.step() bereits akzeptiert.

import { Population } from "./population.js";
import type { PopulationConfig } from "./population.js";
import type { Environment, Physics } from "../engine/types.js";

export interface SeasonalConfig {
  axis: keyof Environment; // welche Umwelt-Achse oszilliert (z. B. "temperature")
  amplitude: number; // Schwingungs-Halbbreite um den Basiswert (0..0.5 sinnvoll)
  period: number; // Generationen je vollem Zyklus ("Jahr")
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Umwelt zur Generation `gen`: Basis + sinusfoermige Schwingung auf EINER Achse. */
export function envAtGeneration(base: Environment, cfg: SeasonalConfig, gen: number): Environment {
  const phase = (2 * Math.PI * gen) / cfg.period;
  const baseVal = (base[cfg.axis] as number | undefined) ?? 0;
  const v = clamp01(baseVal + cfg.amplitude * Math.sin(phase));
  return { ...base, [cfg.axis]: v } as Environment;
}

export interface SeasonalRun {
  pop: Population;
  history: { gen: number; envVal: number; traitMean: number }[];
}

/**
 * Population ueber `generations` Generationen unter einer zyklischen (oder bei
 * amplitude=0 flachen) Umwelt evolvieren. `traitAxis` ist der Gen-Index, dessen Mittel
 * je Generation mitgeschrieben wird (fuer Lag-/Tracking-Messungen).
 */
export function runSeasonal(
  popCfg: Partial<PopulationConfig>,
  phys: Physics,
  base: Environment,
  cfg: SeasonalConfig,
  traitAxis: number,
  generations: number,
  seed: number,
): SeasonalRun {
  const pop = new Population(popCfg, seed);
  const history: SeasonalRun["history"] = [];
  for (let g = 0; g < generations; g++) {
    const env = envAtGeneration(base, cfg, g);
    pop.step(env, phys);
    history.push({ gen: g, envVal: env[cfg.axis] as number, traitMean: pop.mean()[traitAxis] });
  }
  return { pop, history };
}
