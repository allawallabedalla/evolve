// Die Fitness-Funktion = die "Physik" der Welt.
// GENAU diese Logik ist in oracle/reference_model.py gespiegelt. Beide lesen
// dieselben Konstanten aus physics.json, damit der Benchmark-Vergleich fair ist.
//
// Version 2: Reich-Gabelung. Energie kommt aus ZWEI sich gegenseitig
// ausschliessenden Strategien:
//   - Photosynthese (sessil, braucht Licht + Wasser)  -> Pflanzen-Pfad
//   - Nahrungssuche (mobil, braucht Futter)            -> Tier-Pfad
// Der 'exclusion'-Term macht beide unvereinbar (ein Blatt kann nicht jagen),
// sodass Selektion zur Spezialisierung zwingt -> emergente Verzweigung.

import type { Environment, Physics, TraitVector } from "./types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// Trait-Indizes (Reihenfolge = TRAITS in types.ts)
const INSULATION = 0;
const SIZE = 1;
const LIMB = 2;
const METABOLISM = 3;
const ARMOR = 4;
const PHOTO = 5;
const MOBILITY = 6;
const STRUCTURE = 7;

export function fitness(traits: TraitVector, env: Environment, phys: Physics): number {
  const insulation = traits[INSULATION];
  const size = traits[SIZE];
  const limb = traits[LIMB];
  const metabolism = traits[METABOLISM];
  const armor = traits[ARMOR];
  const photo = traits[PHOTO];
  const mobility = traits[MOBILITY];
  const structure = traits[STRUCTURE];

  // 1) Thermoregulation (universell): ideale Isolation = Kaelte.
  //    Quadratisch (glatter Peak, kein Knick) - verhindert das Ueberschwingen /
  //    die Oszillation der gradientenbasierten Engine bei mittlerer Temperatur.
  const thermalIdeal = 1 - env.temperature;
  const dT = insulation - thermalIdeal;
  const thermal = 1 - dT * dT;

  // 2) Energie - zwei Strategien, gegenseitig ausschliessend.
  //    a) Photosynthese: braucht Licht UND Wasser. Stuetzgewebe erhoeht die
  //       Lichtausbeute (hoeher wachsen, Konkurrenz ums Licht).
  const lightAccess = phys.lightAccessBase + (1 - phys.lightAccessBase) * structure;
  const energyPhoto =
    photo * env.light * env.water * lightAccess * (1 - phys.exclusion * mobility);

  //    b) Nahrungssuche: braucht Mobilitaet + erreichbares Futter.
  const reach = clamp01(limb * phys.reachFromLimb + size * phys.reachFromSize);
  const access =
    env.foodHeight <= reach ? 1 : clamp01(1 - (env.foodHeight - reach) * phys.heightPenalty);
  const energyForage =
    mobility *
    env.foodAbundance *
    access *
    (phys.forageBase + phys.forageMetabolism * metabolism) *
    (1 - phys.exclusion * photo);

  // Grund-Energie: ein kleiner Sockel (minimale Aufnahme), damit die
  // Fitness-Landschaft auch ohne Nahrungsquelle nicht voellig flach wird -
  // sonst uebten Temperatur/Praedation gar keinen Selektionsdruck aus ("tote Zone").
  const totalEnergy = phys.baseEnergy + energyPhoto + energyForage;

  //    Unterhaltskosten: jedes Merkmal kostet Energie.
  const m = phys.maintenance;
  const maintenance =
    m.base +
    size * m.size +
    insulation * m.insulation +
    armor * m.armor +
    metabolism * m.metabolism +
    photo * m.photosynthesis +
    mobility * m.mobility +
    structure * m.structure;

  const nutrition = sigmoid((totalEnergy - maintenance) * phys.energyScale);

  // 3) Praedation: Verteidigung aus Panzer + Stuetzgewebe + Groesse, plus
  //    Flucht durch Mobilitaet.
  const defenseScore = clamp01(
    armor * phys.defenseFromArmor +
      structure * phys.defenseFromStructure +
      size * phys.defenseFromSize +
      mobility * phys.defenseFromMobility,
  );
  const predSurvival = 1 - env.predation * (1 - defenseScore);

  const fit =
    Math.pow(thermal, phys.wThermal) *
    Math.pow(predSurvival, phys.wPred) *
    Math.pow(nutrition, phys.wNutrition);

  return Math.max(fit, phys.floor);
}
