// Die Fitness-Funktion = die "Physik" der Welt.
// GENAU diese Logik ist in oracle/reference_model.py gespiegelt. Beide lesen
// dieselben Konstanten aus physics.json, damit der Benchmark-Vergleich fair ist.
//
// Lesbarkeit ist Absicht: jeder Term hat eine klare biologische Bedeutung und
// einen Trade-off (Nutzen + Preis), damit die Ursache-Wirkung-Kette
// nachvollziehbar bleibt.

import type { Environment, Physics, TraitVector } from "./types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// Trait-Indizes
const INSULATION = 0;
const SIZE = 1;
const LIMB = 2;
const METABOLISM = 3;
const ARMOR = 4;

/**
 * Fitness eines Merkmalsvektors in einer Umwelt. Ergebnis in [floor, 1].
 * Geometrische Kopplung: jeder Ueberlebensfaktor wird gebraucht - ein Nullwert
 * in einem Bereich (z.B. erfriert) kann nicht durch einen anderen kompensiert
 * werden.
 */
export function fitness(traits: TraitVector, env: Environment, phys: Physics): number {
  const insulation = traits[INSULATION];
  const size = traits[SIZE];
  const limb = traits[LIMB];
  const metabolism = traits[METABOLISM];
  const armor = traits[ARMOR];

  // 1) Thermoregulation: die ideale Isolation entspricht der Kaelte.
  //    Kalt (temp~0) -> Ideal ~1 (dickes Fell). Heiss (temp~1) -> Ideal ~0.
  const thermalIdeal = 1 - env.temperature;
  const thermal = 1 - Math.abs(insulation - thermalIdeal);

  // 2) Praedation: Verteidigung aus Panzerung + Groesse senkt das Risiko.
  const defense = clamp01(armor * phys.defenseFromArmor + size * phys.defenseFromSize);
  const predSurvival = 1 - env.predation * (1 - defense);

  // 3) Nahrungsaufnahme vs. Energiebedarf (der zentrale Trade-off).
  //    Reichweite (Gliedmassen + Groesse) entscheidet, ob hohe Nahrung erreicht wird.
  const reach = clamp01(limb * phys.reachFromLimb + size * phys.reachFromSize);
  const access =
    env.foodHeight <= reach ? 1 : clamp01(1 - (env.foodHeight - reach) * phys.heightPenalty);
  const forage = env.foodAbundance * access * (phys.forageBase + phys.forageMetabolism * metabolism);

  //    Unterhaltskosten: grosse, gepanzerte, warme, schnelle Koerper kosten mehr.
  const m = phys.maintenance;
  const maintenance =
    m.base + size * m.size + insulation * m.insulation + armor * m.armor + metabolism * m.metabolism;

  const energy = forage - maintenance;
  const nutrition = sigmoid(energy * phys.energyScale);

  const fit =
    Math.pow(thermal, phys.wThermal) *
    Math.pow(predSurvival, phys.wPred) *
    Math.pow(nutrition, phys.wNutrition);

  return Math.max(fit, phys.floor);
}
