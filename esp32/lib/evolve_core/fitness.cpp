// Port von engine/fitness.ts – gleiche Terme in gleicher Reihenfolge, damit der
// double-Build bit-nah an der TS-Engine liegt. Begründungen der einzelnen Terme
// stehen in engine/fitness.ts und werden hier nicht wiederholt.
#include "fitness.h"

#include <cmath>

#include "physics.h"

namespace P = phys;

static inline real clamp01(real x) { return x < 0 ? real(0) : x > 1 ? real(1) : x; }
static inline real sigmoid(real x) { return real(1) / (real(1) + std::exp(-x)); }

real fitness(const real *t, const Environment &env) {
  const real insulation = t[P::T_INSULATION];
  const real size = t[P::T_SIZE];
  const real limb = t[P::T_LIMBLENGTH];
  const real metabolism = t[P::T_METABOLISM];
  const real armor = t[P::T_ARMOR];
  const real photo = t[P::T_PHOTOSYNTHESIS];
  const real mobility = t[P::T_MOBILITY];
  const real structure = t[P::T_STRUCTURE];
  const real wing = t[P::T_WING];
  const real biolum = t[P::T_BIOLUM];
  const real detox = t[P::T_DETOX];
  const real oxyEff = t[P::T_OXYEFF];
  const real osmo = t[P::T_OSMO];
  const real burrow = t[P::T_BURROW];
  const real pigment = t[P::T_PIGMENT];
  const real filter = t[P::T_FILTER];
  const real camo = t[P::T_CAMO];
  const real baro = t[P::T_BARO];
  const real sense = t[P::T_SENSE];
  const real desicc = t[P::T_DESICC];
  const real radres = t[P::T_RADRES];
  const real fireres = t[P::T_FIRERES];
  const real frostres = t[P::T_FROSTRES];
  const real windres = t[P::T_WINDRES];
  const real nfix = t[P::T_NFIX];
  const real resprout = t[P::T_RESPROUT];

  const real landFactor = 1 - clamp01((env.water - P::aquaticWaterFloor) / (1 - P::aquaticWaterFloor));

  const real flight = wing * clamp01(1 - size * P::flightSizePenalty) *
                      (P::flightMetabFloor + (1 - P::flightMetabFloor) * metabolism) * landFactor;

  // 1) Thermoregulation
  const real endoFactor = P::endothermyMetabFloor + (1 - P::endothermyMetabFloor) * metabolism;
  const real effInsulation = insulation * endoFactor * (1 - P::insulWaterLoss * env.water);
  const real thermalIdeal = 1 - env.temperature;
  const real dT = effInsulation - thermalIdeal;
  const real thermal = 1 - dT * dT;

  // 2a) Photosynthese
  const real disturbance = clamp01(std::max(env.fire, env.frost));
  const real structureBurn = 1 - P::disturbStructureLoss * disturbance;
  const real structureLight =
      (P::structureLightFloor + (1 - P::structureLightFloor) * env.foodHeight) * structureBurn;
  const real lightAccess = clamp01(P::lightAccessBase + (1 - P::lightAccessBase) * structure * structureLight +
                                   P::resproutReach * resprout * disturbance * (1 - size));
  const real photoSize = P::photoSizeFloor + (1 - P::photoSizeFloor) * size;
  const real photoThermal = clamp01(1 - P::photoTempStrength * (env.temperature - P::photoTempOpt) *
                                            (env.temperature - P::photoTempOpt));
  const real photoWater = clamp01(env.water / P::photoWaterSat);
  const real energyPhoto = P::photoYield * photo * env.light * photoWater * lightAccess * photoSize *
                           photoThermal * (1 - P::exclusion * mobility);

  // 2b) Nahrungssuche
  const real reach =
      clamp01(limb * P::reachFromLimb * landFactor + size * P::reachFromSize + flight * P::flightReach);
  const real access =
      env.foodHeight <= reach ? real(1) : clamp01(1 - (env.foodHeight - reach) * P::heightPenalty);
  const real foodPerceived = env.foodAbundance + P::senseForage * sense * (1 - env.foodAbundance);
  const real energyForage = mobility * foodPerceived * access *
                            (P::forageBase + P::forageMetabolism * metabolism) * (1 - P::exclusion * photo);

  // 2c) Absorption
  const real substrate = env.foodAbundance * (P::absorbWaterFloor + (1 - P::absorbWaterFloor) * env.water);
  const real energyAbsorb = P::absorbYield * (P::absorbBase + P::absorbMetabolism * metabolism) * substrate *
                            (1 - P::exclusion * photo) * (1 - P::exclusion * mobility);

  // 2d) Aquatische Jagd
  const real aquaHabitat = clamp01((env.water - P::aquaticWaterFloor) / (1 - P::aquaticWaterFloor));
  const real streamline = clamp01(1 - limb * P::aquaticLimbDrag - armor * P::aquaticArmorDrag);
  const real energyAquatic = P::aquaticYield * mobility * env.foodAbundance * aquaHabitat * streamline *
                             (P::aquaticBase + (1 - P::aquaticBase) * metabolism) * (1 - P::exclusion * photo);

  // 2d.2) Amphibisch
  const real amphWaterTri =
      clamp01(1 - std::fabs(env.water - P::amphibiousWaterCenter) / P::amphibiousBandWidth);
  const real amphLimbTri = clamp01(1 - std::fabs(limb - P::amphibiousLimbOpt) / P::amphibiousLimbWidth);
  const real energyAmphibious = P::amphibiousYield * amphWaterTri * amphLimbTri * mobility * env.foodAbundance *
                                (1 - P::exclusion * photo);

  // 2e) Biolumineszenz
  const real dark = clamp01((P::biolumDarkFloor - env.light) / P::biolumDarkFloor);
  const real glow = biolum * dark;
  const real energyGlow = P::biolumYield * glow * (P::biolumMobFloor + (1 - P::biolumMobFloor) * mobility) *
                          env.foodAbundance * (1 - P::exclusion * photo);

  // 2f) Filtrieren
  const real energyFilter = P::filterYield * filter * aquaHabitat *
                            (P::filterBase + (1 - P::filterBase) * env.foodAbundance) * (1 - P::exclusion * photo);

  // 2g) Stickstoff-Fixierung
  const real energyNfix =
      P::nfixYield * nfix * (P::nfixBase + (1 - P::nfixBase) * (1 - env.foodAbundance)) * (1 - P::exclusion * mobility);

  // 2h) Gliedmaßen-Traktion
  const real hot = clamp01((env.temperature - P::tractionHeatFloor) / (1 - P::tractionHeatFloor));
  const real dry = clamp01((P::tractionScarcityCeiling - env.foodAbundance) / P::tractionScarcityCeiling);
  const real insectShape = limb * clamp01(1 - size) * clamp01(1 - armor) * clamp01(1 - insulation);
  const real traction = insectShape * insectShape * landFactor * hot * dry;
  const real energyTraction = P::tractionYield * mobility * traction * (1 - P::exclusion * photo);

  const real totalEnergy = energyPhoto + energyForage + energyAbsorb + energyAquatic + energyAmphibious +
                           energyGlow + energyFilter + energyNfix + energyTraction;

  // Unterhalt (Kleiber-Allometrie auf Stoffwechselkosten)
  const real kleiber = std::pow(real(10), real(-0.25) * P::kleiberDecades * size);
  const real maintenance =
      P::m::base + size * P::m::size + insulation * P::m::insulation + armor * P::m::armor +
      metabolism * P::m::metabolism * kleiber + photo * P::m::photosynthesis + mobility * P::m::mobility +
      structure * P::m::structure + wing * P::m::wing + biolum * P::m::biolum + detox * P::m::detox +
      oxyEff * P::m::oxyEff + osmo * P::m::osmo + burrow * P::m::burrow + pigment * P::m::pigment +
      filter * P::m::filter + camo * P::m::camo + baro * P::m::baro + sense * P::m::sense +
      desicc * P::m::desicc + radres * P::m::radres +
      fireres * P::m::fireres * (1 + P::fireresWoodCost * (1 - structure)) + frostres * P::m::frostres +
      windres * P::m::windres + nfix * P::m::nfix + metabolism * metabolism * P::mq::metabolism * kleiber +
      mobility * mobility * P::mq::mobility + armor * armor * P::mq::armor;

  const real totalEnergyAfterResprout = totalEnergy * (1 - P::resproutCost * resprout * disturbance);

  const real rawNutrition = sigmoid((totalEnergyAfterResprout - maintenance) * P::energyScale);
  const real nutrition = P::nutritionFloor + (1 - P::nutritionFloor) * rawNutrition;

  // 3) Prädation
  const real defenseScore =
      clamp01(armor * P::defenseFromArmor + structure * P::defenseFromStructure + size * P::defenseFromSize +
              mobility * P::defenseFromMobility + flight * P::defenseFromFlight + biolum * dark * P::biolumDefense +
              burrow * P::defenseFromBurrow * landFactor * mobility + camo * P::defenseFromCamo);
  const real predSurvival = 1 - env.predation * (1 - defenseScore);

  // 4)–13) Stressoren
  const real toxSurvival = clamp01(1 - env.toxicity * (1 - detox) * P::toxLethality);
  const real oxySurvival = clamp01(1 - (1 - env.oxygen) * metabolism * (1 - oxyEff) * P::hypoxiaSeverity);
  const real osmoSurvival = clamp01(1 - env.salinity * (1 - osmo) * P::salinityLethality);
  const real uvSurvival = clamp01(1 - env.uv * (1 - pigment) * P::uvLethality);
  const real baroSurvival = clamp01(1 - env.pressure * (1 - baro) * P::baroLethality);
  const real landDry = clamp01((P::aquaticWaterFloor - env.water) / P::aquaticWaterFloor);
  const real effAridity = clamp01(env.aridity + P::landDesiccation * landDry);
  const real desiccSurvival = clamp01(1 - effAridity * (1 - desicc) * P::desiccLethality);
  const real radSurvival = clamp01(1 - env.radiation * (1 - radres) * P::radLethality);
  const real fireSurvival = clamp01(1 - env.fire * (1 - fireres) * P::fireLethality);
  const real frostSurvival = clamp01(1 - env.frost * (1 - frostres) * P::frostLethality);
  const real windSurvival = clamp01(1 - env.wind * (1 - windres) * P::windLethality);

  // 14) Wiederaustrieb
  const real regrowthSurvival =
      clamp01(1 - disturbance * (1 - std::max(fireres, resprout)) * P::resproutSeverity);

  const real fit = std::pow(thermal, P::wThermal) * std::pow(predSurvival, P::wPred) *
                   std::pow(nutrition, P::wNutrition) * std::pow(toxSurvival, P::wTox) *
                   std::pow(oxySurvival, P::wOxy) * std::pow(osmoSurvival, P::wOsmo) *
                   std::pow(uvSurvival, P::wUv) * std::pow(baroSurvival, P::wBaro) *
                   std::pow(desiccSurvival, P::wDesicc) * std::pow(radSurvival, P::wRad) *
                   std::pow(fireSurvival, P::wFire) * std::pow(frostSurvival, P::wFrost) *
                   std::pow(windSurvival, P::wWind) * std::pow(regrowthSurvival, P::wResprout);

  return std::max(fit, P::floor);
}
