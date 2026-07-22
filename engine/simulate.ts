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

/**
 * Staerke der stochastischen genetischen Drift/Mutation pro Generation im
 * SPIEL-Modus (nur wenn ein Seed uebergeben wird). Bewusst mittelwertfrei:
 * der Erwartungswert bleibt das validierte deterministische Ergebnis, aber
 * jeder Lauf weicht individuell ab -> jedes Wesen wird einzigartig.
 */
export const DRIFT_SCALE = 0.05;

// Seedbarer RNG (mulberry32) + gausssches Rauschen (Box-Muller) fuer
// reproduzierbare, aber pro Seed unterschiedliche Laeufe.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  seed?: number,
): SimResult {
  const n = TRAITS.length;
  let m: TraitVector = start ? start.slice() : new Array(n).fill(0.5);
  const trajectory: TraitVector[] = [m.slice()];
  const eps = phys.eps;

  // SPIEL-Modus: mit Seed wird jeder Lauf individuell (Drift/Mutation).
  // Ohne Seed bleibt alles exakt deterministisch (fuer Validierung/Training).
  const rng = seed === undefined ? null : mulberry32(seed);
  const randn = (): number => {
    const u = Math.max(rng!(), 1e-9);
    const v = rng!();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const randnOrNull = rng ? randn : undefined;
  for (let gen = 0; gen < generations; gen++) {
    m = stepGeneration(m, env, phys, params, randnOrNull);
    trajectory.push(m.slice());
  }

  return { trajectory, final: m.slice(), start: trajectory[0].slice() };
}

/**
 * Eine einzelne Generation: schiebt den Merkmalsvektor `m` einen Schritt weiter.
 * Basis fuer die KONTINUIERLICHE Zeit im Spiel - man ruft das laufend auf und
 * kann die Umwelt zwischendurch aendern; das Wesen passt sich ab seinem
 * aktuellen Zustand an (kein Neustart bei 0.5).
 *
 * `randn` optional: liefert es standardnormales Rauschen, driftet der Lauf
 * individuell (Spiel-Modus); ohne `randn` ist der Schritt deterministisch.
 */
export function stepGeneration(
  m: TraitVector,
  env: Environment,
  phys: Physics,
  params: EngineParams,
  randn?: () => number,
): TraitVector {
  const n = TRAITS.length;
  const eps = phys.eps;
  const next = m.slice();
  for (let g = 0; g < n; g++) {
    const up = m.slice();
    up[g] = clamp01(up[g] + eps);
    const dn = m.slice();
    dn[g] = clamp01(dn[g] - eps);
    const grad = (fitness(up, env, phys) - fitness(dn, env, phys)) / (2 * eps);

    // Genetische Varianz x*(1-x), normiert (max bei 0.5, 0 an den Raendern).
    const varFactor = 4 * next[g] * (1 - next[g]);
    const speedMod = params.varianceWeight * varFactor + (1 - params.varianceWeight);

    next[g] += params.responseRate[g] * params.selectionStrength * grad * speedMod;
    next[g] += params.mutationRate * (0.5 - next[g]);
    // Stochastische Drift (nur wenn randn gegeben) - mittelwertfrei, skaliert mit
    // Varianz: stark selektierte Gene bleiben stabil, neutrale driften.
    if (randn) next[g] += randn() * DRIFT_SCALE * (0.35 + 0.65 * varFactor);
    next[g] = clamp01(next[g]);
  }
  return next;
}
