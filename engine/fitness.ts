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
const WING = 8;
const BIOLUM = 9;

export function fitness(traits: TraitVector, env: Environment, phys: Physics): number {
  const insulation = traits[INSULATION];
  const size = traits[SIZE];
  const limb = traits[LIMB];
  const metabolism = traits[METABOLISM];
  const armor = traits[ARMOR];
  const photo = traits[PHOTO];
  const mobility = traits[MOBILITY];
  const structure = traits[STRUCTURE];
  const wing = traits[WING];
  const biolum = traits[BIOLUM] ?? 0;

  // Flug (AXIS-1): nur leichte, aktive Koerper fliegen. Grosse Masse (size) macht
  // Fluegel wirkungslos, hoher Stoffwechsel treibt den Flug an. Zwei Auszahlungen
  // unten: (a) erreicht hohe Nahrung/Licht ohne Reichweiten-Strafe, (b) Flucht.
  const flight =
    wing *
    clamp01(1 - size * phys.flightSizePenalty) *
    (phys.flightMetabFloor + (1 - phys.flightMetabFloor) * metabolism);

  // 1) Thermoregulation (universell): ideale Isolation = Kaelte.
  //    Quadratisch (glatter Peak, kein Knick) - verhindert das Ueberschwingen /
  //    die Oszillation der gradientenbasierten Engine bei mittlerer Temperatur.
  //    Endothermie (Biologie-Audit): Fell HAELT Waerme, aber ohne metabolischen
  //    "Ofen" gibt es kaum Koerperwaerme zu halten -> Kaelte-Anpassung braucht
  //    Isolation UND Stoffwechsel (echte Warmblueter = Fell + hoher Stoffwechsel).
  const endoFactor = phys.endothermyMetabFloor + (1 - phys.endothermyMetabFloor) * metabolism;
  const effInsulation = insulation * endoFactor;
  const thermalIdeal = 1 - env.temperature;
  const dT = effInsulation - thermalIdeal;
  const thermal = 1 - dT * dT;

  // 2) Energie - zwei Strategien, gegenseitig ausschliessend.
  //    a) Photosynthese: braucht Licht UND Wasser.
  //       Stuetzgewebe hilft dem Licht nur bei echter vertikaler Konkurrenz
  //       (foodHeight = wie hoch das Licht umkaempft ist) - auf offenem Boden
  //       bringt Hochwachsen nichts, daher bleiben niedrige Pflanzen (Kraut) moeglich.
  const structureLight = phys.structureLightFloor + (1 - phys.structureLightFloor) * env.foodHeight;
  const lightAccess = phys.lightAccessBase + (1 - phys.lightAccessBase) * structure * structureLight;
  //       Groessere Pflanzen haben mehr Blattflaeche -> Groesse zahlt auf
  //       Photosynthese ein (macht baumartige Groesse ueberhaupt lohnend).
  const photoSize = phys.photoSizeFloor + (1 - phys.photoSizeFloor) * size;
  //       Temperatur-Abhaengigkeit (Biologie-Audit): Photosynthese hat ein
  //       Temperatur-Optimum; in starker Kaelte/Hitze sinkt die Enzym-Leistung.
  //       Milde Glocke -> Kaelte-Standorte (Tundra) tragen weniger Pflanzen.
  const photoThermal = clamp01(
    1 - phys.photoTempStrength * (env.temperature - phys.photoTempOpt) * (env.temperature - phys.photoTempOpt)
  );
  const energyPhoto =
    photo * env.light * env.water * lightAccess * photoSize * photoThermal * (1 - phys.exclusion * mobility);

  //    b) Nahrungssuche: braucht Mobilitaet + erreichbares Futter.
  //       Flug erweitert die Reichweite in die Hoehe (Luftraum/Kronendach).
  const reach = clamp01(limb * phys.reachFromLimb + size * phys.reachFromSize + flight * phys.flightReach);
  const access =
    env.foodHeight <= reach ? 1 : clamp01(1 - (env.foodHeight - reach) * phys.heightPenalty);
  const energyForage =
    mobility *
    env.foodAbundance *
    access *
    (phys.forageBase + phys.forageMetabolism * metabolism) *
    (1 - phys.exclusion * photo);

  //    c) Absorption / Zersetzung (Osmotrophie): SESSILE Heterotrophie.
  //       Der Organismus waechst in sein Substrat (Totholz/Detritus) und verdaut
  //       extrazellulaer - braucht daher KEINE Mobilitaet (Gegenteil der Jagd).
  //       - heterotroph  -> schliesst Photosynthese aus (1 - exclusion*photo)
  //       - sessil       -> schliesst Mobilitaet aus    (1 - exclusion*mobility)
  //       - Enzyme       -> zahlt auf Stoffwechsel ein
  //       - Zersetzung ist ein Nass-Prozess -> skaliert mit Feuchte (water)
  //       - Substrat = totes organisches Material -> skaliert mit foodAbundance
  //       Ohne diesen Term hatten Pilze/sessile Zersetzer null Nahrungsenergie -
  //       biologisch falsch (Pilze sind hoch erfolgreich). Das schafft den
  //       Fitness-Gipfel "heterotroph + sessil" = Reich der Pilze/Mikroben.
  const substrate =
    env.foodAbundance * (phys.absorbWaterFloor + (1 - phys.absorbWaterFloor) * env.water);
  const energyAbsorb =
    phys.absorbYield *
    (phys.absorbBase + phys.absorbMetabolism * metabolism) *
    substrate *
    (1 - phys.exclusion * photo) *
    (1 - phys.exclusion * mobility);

  //    d) Aquatische Jagd (AXIS-4): schwimmende Heterotrophie im Wasserkoerper.
  //       Anders als Landjagd braucht Schwimmen KEINE Reichweite (Gliedmassen) -
  //       Nahrung wird im offenen Wasser erschwommen. Belohnt Mobilitaet, aber
  //       einen STROMLINIENFOERMIGEN Koerper: Gliedmassen und Panzer erzeugen
  //       Wasserwiderstand (Drag). Nur im tiefen Wasser wirksam (aquaticWaterFloor),
  //       heterotroph -> schliesst Photosynthese aus. Schafft den Fitness-Gipfel
  //       "schlank + mobil im Wasser" = Fisch/Aal, Kopffuesser, Amphibie.
  const aquaHabitat = clamp01((env.water - phys.aquaticWaterFloor) / (1 - phys.aquaticWaterFloor));
  const streamline = clamp01(1 - limb * phys.aquaticLimbDrag - armor * phys.aquaticArmorDrag);
  const energyAquatic =
    phys.aquaticYield *
    mobility *
    env.foodAbundance *
    aquaHabitat *
    streamline *
    (phys.aquaticBase + (1 - phys.aquaticBase) * metabolism) *
    (1 - phys.exclusion * photo);

  //    e) Biolumineszenz (AXIS-5): ein Leuchtorgan lockt/beleuchtet Beute — aber NUR
  //       im Dunkeln (dark = 1-light). Wo Photosynthese tot ist und normale Reichweite
  //       nichts bringt (Tiefsee/Hoehle), schafft das Leuchten ein Nahrungs-Einkommen.
  //       Aktive Koerper nutzen es besser (Lockjagd), heterotroph (schliesst Photo aus).
  // „Dunkel" nur unterhalb biolumDarkFloor (Tiefsee/Hoehle) — sonst ueberstrahlt Tageslicht
  // das Leuchten und es bliebe reine Kostenlast. Haelt Leuchtwesen eine schmale Nische.
  const dark = clamp01((phys.biolumDarkFloor - env.light) / phys.biolumDarkFloor);
  const glow = biolum * dark;
  const energyGlow =
    phys.biolumYield *
    glow *
    (phys.biolumMobFloor + (1 - phys.biolumMobFloor) * mobility) *
    env.foodAbundance *
    (1 - phys.exclusion * photo);

  const totalEnergy = energyPhoto + energyForage + energyAbsorb + energyAquatic + energyGlow;

  //    Unterhaltskosten: jedes Merkmal kostet Energie.
  const m = phys.maintenance;
  const mq = phys.maintenanceQuad;
  const maintenance =
    m.base +
    size * m.size +
    insulation * m.insulation +
    armor * m.armor +
    metabolism * m.metabolism +
    photo * m.photosynthesis +
    mobility * m.mobility +
    structure * m.structure +
    wing * m.wing +
    biolum * m.biolum +
    // Steigende Grenzkosten: hoher Stoffwechsel/hohe Mobilitaet/Panzerung werden
    // ueberproportional teuer -> innere Optima statt Dauer-Saettigung bei 1.
    // Panzer-Grenzkosten (BAL-5): ohne sie war "gepanzert + mobil" ein fast
    // universeller Gewinner (~30% aller Umwelten drei Panzer-Formen) -> Verteilung
    // entzerrt, mittlere Umwelten bringen wieder vielfaeltige Baupläne.
    metabolism * metabolism * mq.metabolism +
    mobility * mobility * mq.mobility +
    armor * armor * mq.armor;

  // Nutrition-Floor: die Nahrungs-Komponente faellt in der Fitness nie ganz auf 0.
  // So bleiben Temperatur/Praedations-Gradienten auch ohne Energiequelle lebendig
  // (keine "tote Zone"), OHNE dem Wesen Gratis-Energie zu geben - der Anreiz, sich
  // auf einen echten Energiepfad festzulegen, bleibt erhalten.
  const rawNutrition = sigmoid((totalEnergy - maintenance) * phys.energyScale);
  const nutrition = phys.nutritionFloor + (1 - phys.nutritionFloor) * rawNutrition;

  // 3) Praedation: Verteidigung aus Panzer + Stuetzgewebe + Groesse, plus
  //    Flucht durch Mobilitaet.
  const defenseScore = clamp01(
    armor * phys.defenseFromArmor +
      structure * phys.defenseFromStructure +
      size * phys.defenseFromSize +
      mobility * phys.defenseFromMobility +
      flight * phys.defenseFromFlight +
      // Gegenbeleuchtung/Schreck-Leuchten: wirkt nur im echten Dunkeln (dark).
      biolum * dark * phys.biolumDefense,
  );
  const predSurvival = 1 - env.predation * (1 - defenseScore);

  const fit =
    Math.pow(thermal, phys.wThermal) *
    Math.pow(predSurvival, phys.wPred) *
    Math.pow(nutrition, phys.wNutrition);

  return Math.max(fit, phys.floor);
}
