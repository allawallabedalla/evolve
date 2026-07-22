// Die schlanke Engine (das "Surrogat").
//
// Mechanik bewusst ANDERS als das Orakel: statt einer Population expliziter
// Individuen (agentenbasiert, stochastisch) fuehrt die Engine einen einzigen
// Mittelwert-Vektor der Merkmale und bewegt ihn entlang des Selektions-
// gradienten. Schnell, deterministisch, lesbar.
//
// Genau weil die Mechanik anders ist als beim Orakel, ist der Abgleich
// (Training) nicht trivial - er zwingt die Engine, die *emergente Dynamik* des
// schweren Modells mit wenigen Parametern nachzubilden (Model Distillation).

import { fitness } from "./fitness.js";
import type { Environment, EngineParams, Physics, TraitVector } from "./types.js";
import { TRAITS } from "./types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export interface SimResult {
  /** Merkmals-Mittelwert pro Generation, inkl. Startzustand. Laenge = generations + 1. */
  trajectory: TraitVector[];
  /** Endzustand (letzte Generation). */
  final: TraitVector;
  /** Startzustand. */
  start: TraitVector;
}

/**
 * Simuliert die Anpassung eines Merkmalsvektors ueber Generationen.
 * Pro Generation und Gen:
 *   1. Selektionsgradient per finiter Differenz schaetzen
 *   2. Mittelwert in Richtung hoeherer Fitness schieben (responseRate * selectionStrength)
 *   3. Mutations-Ruecktrieb zur Mitte (Mutation-Selektion-Balance -> stabile Gleichgewichte)
 */
export function runSimulation(
  env: Environment,
  generations: number,
  phys: Physics,
  params: EngineParams,
  start?: TraitVector,
): SimResult {
  const n = TRAITS.length;
  let m: TraitVector = start ? start.slice() : new Array(n).fill(0.5);
  const trajectory: TraitVector[] = [m.slice()];
  const eps = phys.eps;

  for (let gen = 0; gen < generations; gen++) {
    const next = m.slice();
    for (let g = 0; g < n; g++) {
      // Selektionsgradient in Richtung Gen g (zentrale finite Differenz)
      const up = m.slice();
      up[g] = clamp01(up[g] + eps);
      const dn = m.slice();
      dn[g] = clamp01(dn[g] - eps);
      const grad = (fitness(up, env, phys) - fitness(dn, env, phys)) / (2 * eps);

      // Selektionsschritt
      next[g] += params.responseRate[g] * params.selectionStrength * grad;
      // Mutations-Ruecktrieb zur Mitte
      next[g] += params.mutationRate * (0.5 - next[g]);
      next[g] = clamp01(next[g]);
    }
    m = next;
    trajectory.push(m.slice());
  }

  return { trajectory, final: m.slice(), start: trajectory[0].slice() };
}
