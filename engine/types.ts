// Geteilte Typen fuer die schlanke Engine.
// Die Engine ist "isomorph": sie liest keine Dateien selbst, sondern bekommt
// Physik + Parameter hereingereicht. So laeuft sie unveraendert im Browser
// (fetch) wie im Node-Pruefstand (fs).

/** Die Gene / Merkmale (Phaenotyp-Achse), jeweils normiert 0..1.
 *  Reihenfolge ist bindend - Engine (TS) und Orakel (Python) teilen sie. */
export const TRAITS = [
  "insulation",
  "size",
  "limbLength",
  "metabolism",
  "armor",
  "photosynthesis",
  "mobility",
  "structure",
  "wing",
  "biolum",
] as const;
export type TraitName = (typeof TRAITS)[number];

/** Ein Merkmalsvektor in der Reihenfolge von TRAITS. */
export type TraitVector = number[];

/** Die Umwelt-Regler, die der Spieler steuert. Jeweils 0..1. */
export interface Environment {
  temperature: number; // 0 = eiskalt, 1 = heiss
  predation: number; // 0 = keine Raeuber, 1 = extrem
  foodAbundance: number; // 0 = Hungersnot, 1 = Ueberfluss
  foodHeight: number; // 0 = Boden, 1 = hoch/schwer erreichbar
  light: number; // 0 = dunkel, 1 = volles Sonnenlicht (fuer Photosynthese)
  water: number; // 0 = Duerre, 1 = feucht (Photosynthese braucht Wasser)
  toxicity?: number; // 0 = sauber, 1 = giftig (AXIS-6, kommt NICHT ueber die 6 Regler,
  //                    sondern ueber Umwelt-Einfluesse: Serpentin/Schwermetall, Schwefel/Saeure).
  oxygen?: number; // 1 = normaler O2-Gehalt (Meereshoehe), 0 = extreme Hypoxie (AXIS-7,
  //                  kommt ueber Umwelt-Einfluesse: Duenne Hoehenluft, sauerstoffarmes Wasser).
  salinity?: number; // 0 = suess/salzarm, 1 = hypersalin (AXIS-8, kommt ueber Umwelt-
  //                    Einfluesse: Salzsee/Brine, Aestuar, Salzboden, Meerspray).
}

/** Die geteilte Fitness-Landschaft (aus physics.json). */
export interface Physics {
  traits: string[];
  traitLabels: Record<string, string>;
  lightAccessBase: number;
  structureLightFloor: number;
  photoSizeFloor: number;
  exclusion: number;
  reachFromLimb: number;
  reachFromSize: number;
  heightPenalty: number;
  forageBase: number;
  forageMetabolism: number;
  flightSizePenalty: number;
  flightMetabFloor: number;
  flightReach: number;
  defenseFromFlight: number;
  absorbYield: number;
  absorbBase: number;
  absorbMetabolism: number;
  absorbWaterFloor: number;
  aquaticYield: number;
  aquaticBase: number;
  aquaticWaterFloor: number;
  aquaticLimbDrag: number;
  aquaticArmorDrag: number;
  biolumYield: number;
  biolumMobFloor: number;
  biolumDefense: number;
  biolumDarkFloor: number;
  endothermyMetabFloor: number;
  photoTempOpt: number;
  photoTempStrength: number;
  toxLethality: number;
  wTox: number;
  insulWaterLoss: number;
  hypoxiaSeverity: number;
  wOxy: number;
  salinityLethality: number;
  wOsmo: number;
  kleiberDecades: number;
  maintenance: {
    base: number;
    size: number;
    insulation: number;
    armor: number;
    metabolism: number;
    photosynthesis: number;
    mobility: number;
    structure: number;
    wing: number;
    biolum: number;
    detox: number;
    oxyEff: number;
    osmo: number;
  };
  maintenanceQuad: {
    metabolism: number;
    mobility: number;
    armor: number;
  };
  nutritionFloor: number;
  energyScale: number;
  defenseFromArmor: number;
  defenseFromStructure: number;
  defenseFromSize: number;
  defenseFromMobility: number;
  wThermal: number;
  wPred: number;
  wNutrition: number;
  floor: number;
  eps: number;
}

/**
 * Die Parameter der schlanken Engine, die die Trainings-Schleife an das Orakel
 * anpasst ("das Lernen"). NICHT die Physik - die ist fix. Hier wird nur die
 * *Dynamik* (wie schnell/stark sich Gene bewegen) kalibriert.
 */
export interface EngineParams {
  responseRate: number[]; // pro Gen: wie schnell es dem Selektionsdruck folgt (8 Werte, einer je Gen)
  mutationRate: number; // Mutations-Ruecktrieb zur Mitte (Mutation-Selektion-Balance)
  selectionStrength: number; // globale Staerke der Selektion
  varianceWeight: number; // 0..1: wie stark die Anpassung sich nahe Fixierung (Gen ->0/1) verlangsamt.
  // Modelliert die genetische Varianz x*(1-x): weniger Variation -> langsamere
  // Reaktion. Verhindert Uebersteuern ueber das Orakel-Gleichgewicht hinaus.
}

export const DEFAULT_ENGINE_PARAMS: EngineParams = {
  responseRate: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
  mutationRate: 0.03,
  selectionStrength: 1.5,
  varianceWeight: 0.5,
};
