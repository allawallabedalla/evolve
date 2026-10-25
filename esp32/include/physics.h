// AUTOMATISCH ERZEUGT von esp32/tools/gen-physics.mjs aus physics.json
// Nicht von Hand ändern – Generator neu laufen lassen.
#pragma once
#include "evo_real.h"

namespace phys {

constexpr int NUM_GENES = 26;

// Trait-Indizes (Reihenfolge = TRAITS in engine/types.ts)
constexpr int T_INSULATION = 0;
constexpr int T_SIZE = 1;
constexpr int T_LIMBLENGTH = 2;
constexpr int T_METABOLISM = 3;
constexpr int T_ARMOR = 4;
constexpr int T_PHOTOSYNTHESIS = 5;
constexpr int T_MOBILITY = 6;
constexpr int T_STRUCTURE = 7;
constexpr int T_WING = 8;
constexpr int T_BIOLUM = 9;
constexpr int T_DETOX = 10;
constexpr int T_OXYEFF = 11;
constexpr int T_OSMO = 12;
constexpr int T_BURROW = 13;
constexpr int T_PIGMENT = 14;
constexpr int T_FILTER = 15;
constexpr int T_CAMO = 16;
constexpr int T_BARO = 17;
constexpr int T_SENSE = 18;
constexpr int T_DESICC = 19;
constexpr int T_RADRES = 20;
constexpr int T_FIRERES = 21;
constexpr int T_FROSTRES = 22;
constexpr int T_WINDRES = 23;
constexpr int T_NFIX = 24;
constexpr int T_RESPROUT = 25;

static const char *const TRAIT_NAMES[NUM_GENES] = {"insulation", "size", "limbLength", "metabolism", "armor", "photosynthesis", "mobility", "structure", "wing", "biolum", "detox", "oxyEff", "osmo", "burrow", "pigment", "filter", "camo", "baro", "sense", "desicc", "radres", "fireres", "frostres", "windres", "nfix", "resprout"};
static const char *const TRAIT_LABELS[NUM_GENES] = {
    "Fell / Isolation",
    "Koerpergroesse",
    "Gliedmassenlaenge",
    "Stoffwechsel",
    "Panzerung",
    "Photosynthese",
    "Mobilitaet",
    "Stuetzgewebe / Verholzung",
    "Fluegelflaeche",
    "Biolumineszenz",
    "Entgiftung",
    "Sauerstoff-Effizienz",
    "Osmoregulation",
    "Grabtrieb",
    "Schutzpigment",
    "Filterapparat",
    "Tarnung",
    "Druck-Toleranz",
    "Sinne",
    "Austrocknungs-Toleranz",
    "Strahlungsresistenz",
    "Feuerresistenz",
    "Frostschutz",
    "Windhärte",
    "Stickstoff-Fixierung",
    "Wiederaustrieb",
};

constexpr real lightAccessBase = real(0.4);
constexpr real structureLightFloor = real(0.3);
constexpr real photoSizeFloor = real(0.7);
constexpr real exclusion = real(0.8);
constexpr real reachFromLimb = real(0.65);
constexpr real reachFromSize = real(0.35);
constexpr real heightPenalty = real(1.5);
constexpr real forageBase = real(0.55);
constexpr real forageMetabolism = real(0.9);
constexpr real flightSizePenalty = real(1.5);
constexpr real flightMetabFloor = real(0.35);
constexpr real flightReach = real(0.75);
constexpr real defenseFromFlight = real(0.2);
constexpr real absorbYield = real(1.3);
constexpr real absorbBase = real(0.4);
constexpr real absorbMetabolism = real(0.85);
constexpr real absorbWaterFloor = real(0.3);
constexpr real aquaticYield = real(1.4);
constexpr real aquaticBase = real(0.4);
constexpr real aquaticWaterFloor = real(0.5);
constexpr real aquaticLimbDrag = real(0.7);
constexpr real aquaticArmorDrag = real(0.5);
constexpr real amphibiousYield = real(0.8);
constexpr real amphibiousWaterCenter = real(0.65);
constexpr real amphibiousBandWidth = real(0.13);
constexpr real amphibiousLimbOpt = real(0.45);
constexpr real amphibiousLimbWidth = real(0.3);
constexpr real biolumYield = real(0.72);
constexpr real biolumMobFloor = real(0.62);
constexpr real biolumDefense = real(0.3);
constexpr real biolumDarkFloor = real(0.3);
constexpr real endothermyMetabFloor = real(0.5);
constexpr real photoTempOpt = real(0.6);
constexpr real photoTempStrength = real(0.6);
constexpr real disturbStructureLoss = real(0.7);
constexpr real fireresWoodCost = real(4.0);
constexpr real photoWaterSat = real(0.35);
constexpr real photoYield = real(1.0);
constexpr real nutritionFloor = real(0.15);
constexpr real energyScale = real(5.0);
constexpr real defenseFromArmor = real(0.46);
constexpr real defenseFromStructure = real(0.35);
constexpr real defenseFromSize = real(0.25);
constexpr real defenseFromMobility = real(0.18);
constexpr real wThermal = real(1.0);
constexpr real wPred = real(1.0);
constexpr real wNutrition = real(1.2);
constexpr real floor = real(0.02);
constexpr real eps = real(0.02);
constexpr real toxLethality = real(0.9);
constexpr real wTox = real(1.0);
constexpr real insulWaterLoss = real(1.0);
constexpr real hypoxiaSeverity = real(0.9);
constexpr real wOxy = real(1.0);
constexpr real salinityLethality = real(0.85);
constexpr real wOsmo = real(1.0);
constexpr real kleiberDecades = real(0.6);
constexpr real defenseFromBurrow = real(0.4);
constexpr real uvLethality = real(0.85);
constexpr real wUv = real(1.0);
constexpr real filterYield = real(0.5);
constexpr real filterBase = real(0.25);
constexpr real defenseFromCamo = real(0.5);
constexpr real baroLethality = real(0.85);
constexpr real wBaro = real(1.0);
constexpr real senseForage = real(0.3);
constexpr real desiccLethality = real(0.85);
constexpr real landDesiccation = real(0.0);
constexpr real wDesicc = real(1.0);
constexpr real radLethality = real(0.85);
constexpr real wRad = real(1.0);
constexpr real fireLethality = real(0.85);
constexpr real wFire = real(1.0);
constexpr real frostLethality = real(0.85);
constexpr real wFrost = real(1.0);
constexpr real windLethality = real(0.85);
constexpr real wWind = real(1.0);
constexpr real nfixYield = real(0.35);
constexpr real nfixBase = real(0.2);
constexpr real tractionYield = real(2.0);
constexpr real tractionHeatFloor = real(0.7);
constexpr real tractionScarcityCeiling = real(0.5);
constexpr real resproutReach = real(0.15);
constexpr real resproutCost = real(0.15);
constexpr real resproutSeverity = real(0.6);
constexpr real wResprout = real(1.0);

namespace m {  // maintenance
constexpr real base = real(0.05);
constexpr real size = real(0.22);
constexpr real insulation = real(0.12);
constexpr real armor = real(0.15);
constexpr real metabolism = real(0.16);
constexpr real photosynthesis = real(0.14);
constexpr real mobility = real(0.15);
constexpr real structure = real(0.15);
constexpr real wing = real(0.16);
constexpr real biolum = real(0.14);
constexpr real detox = real(0.07);
constexpr real oxyEff = real(0.07);
constexpr real osmo = real(0.07);
constexpr real burrow = real(0.11);
constexpr real pigment = real(0.07);
constexpr real filter = real(0.12);
constexpr real camo = real(0.12);
constexpr real baro = real(0.07);
constexpr real sense = real(0.12);
constexpr real desicc = real(0.07);
constexpr real radres = real(0.07);
constexpr real fireres = real(0.07);
constexpr real frostres = real(0.07);
constexpr real windres = real(0.07);
constexpr real nfix = real(0.12);
}  // namespace m

namespace mq {  // maintenanceQuad
constexpr real metabolism = real(0.22);
constexpr real mobility = real(0.25);
constexpr real armor = real(0.15);
}  // namespace mq

}  // namespace phys
