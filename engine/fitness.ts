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
const DETOX = 10;
const OXYEFF = 11;
const OSMO = 12;
const BURROW = 13;
const PIGMENT = 14;
const FILTER = 15;
const CAMO = 16;
const BARO = 17;
const SENSE = 18;
const DESICC = 19;
const RADRES = 20;
const FIRERES = 21;
const FROSTRES = 22;
const WINDRES = 23;
const NFIX = 24;

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
  const detox = traits[DETOX] ?? 0;
  const oxyEff = traits[OXYEFF] ?? 0;
  const osmo = traits[OSMO] ?? 0;
  const burrow = traits[BURROW] ?? 0;
  const pigment = traits[PIGMENT] ?? 0;
  const filter = traits[FILTER] ?? 0;
  const camo = traits[CAMO] ?? 0;
  const baro = traits[BARO] ?? 0;
  const sense = traits[SENSE] ?? 0;
  const desicc = traits[DESICC] ?? 0;
  const radres = traits[RADRES] ?? 0;
  const fireres = traits[FIRERES] ?? 0;
  const frostres = traits[FROSTRES] ?? 0;
  const windres = traits[WINDRES] ?? 0;
  const nfix = traits[NFIX] ?? 0;

  // "An Land" (0..1): 1 ausserhalb des tiefen Wassers, 0 im offenen Wasserkoerper.
  // Landjagd UND Flug sind terrestrisch/aerisch - sie funktionieren nicht unter
  // Wasser. Im Wasser uebernimmt die aquatische Jagd (Schwimmen). Ohne diese Gate
  // bildete ein Tiefsee-Schwimmer absurde Beine/Fluegel fuers "hohe" Futter.
  const landFactor = 1 - clamp01((env.water - phys.aquaticWaterFloor) / (1 - phys.aquaticWaterFloor));

  // Flug (AXIS-1): nur leichte, aktive Koerper fliegen. Grosse Masse (size) macht
  // Fluegel wirkungslos, hoher Stoffwechsel treibt den Flug an. Unter Wasser kein
  // Flug (landFactor). Zwei Auszahlungen: (a) erreicht hohe Nahrung, (b) Flucht.
  const flight =
    wing *
    clamp01(1 - size * phys.flightSizePenalty) *
    (phys.flightMetabFloor + (1 - phys.flightMetabFloor) * metabolism) *
    landFactor;

  // 1) Thermoregulation (universell): ideale Isolation = Kaelte.
  //    Quadratisch (glatter Peak, kein Knick) - verhindert das Ueberschwingen /
  //    die Oszillation der gradientenbasierten Engine bei mittlerer Temperatur.
  //    Endothermie (Biologie-Audit): Fell HAELT Waerme, aber ohne metabolischen
  //    "Ofen" gibt es kaum Koerperwaerme zu halten -> Kaelte-Anpassung braucht
  //    Isolation UND Stoffwechsel (echte Warmblueter = Fell + hoher Stoffwechsel).
  const endoFactor = phys.endothermyMetabFloor + (1 - phys.endothermyMetabFloor) * metabolism;
  //    Fell wirkt UNTER WASSER kaum (Biologie): Isolation hält warm, indem sie Luft
  //    einschliesst - Wasser verdrängt die Luft. Darum ist die Tiefsee voller Fische
  //    und Kopffuesser, nicht pelziger Warmblueter. Ohne diese Kopplung zuechtete die
  //    Engine „Fell-Wesen unter Wasser". effInsulation sinkt mit dem Wasser.
  const effInsulation = insulation * endoFactor * (1 - phys.insulWaterLoss * env.water);
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
  //       Biologie-Audit: GLIEDMASSEN erschliessen hohes Futter nur an LAND
  //       (limb*landFactor). Unter Wasser greift man hohes Futter nicht mit langen
  //       Beinen - man schwimmt hinauf (aquatische Jagd). So bildet der Tiefsee-
  //       Schwimmer keine absurden Beine/Fluegel mehr, nur weil das Futter "hoch"
  //       stand. Groesse zaehlt weiter (grosse Koerper ragen ohnehin hoch).
  const reach = clamp01(limb * phys.reachFromLimb * landFactor + size * phys.reachFromSize + flight * phys.flightReach);
  const access =
    env.foodHeight <= reach ? 1 : clamp01(1 - (env.foodHeight - reach) * phys.heightPenalty);
  //       Sinne (AXIS-13): geschaerfte Wahrnehmung (Augen/Riechen/Echolot) spuert
  //       Beute auf, die sonst unentdeckt bliebe — wirkt daher als Aufwertung der
  //       WAHRGENOMMENEN Nahrungsdichte, nicht als Multiplikator auf das durch Mangel
  //       bereits kollabierte Grundeinkommen (Bugfix, zurueckgestellt aus Phase 0 der
  //       Lebendige-Welt-Roadmap, BACKLOG.md Punkt 10): energyForage skaliert linear
  //       mit env.foodAbundance, also blieb ein reiner *1.3-Multiplikator bei echter
  //       Knappheit ein Bonus auf eine bereits winzige Zahl — selbst bei sense=1 nie
  //       genug, um maintenance.sense zu decken (gemessen: Nettoverlust in JEDER
  //       Umwelt). Jetzt hebt sense die effektive Nahrungsdichte selbst an, nur bei
  //       echter Knappheit wirksam (Faktor 1-foodAbundance), im Ueberfluss ohne Effekt.
  //       Schafft die Sinnesjaeger-Nische (Eule/Fledermaus/Hai) in kargen Revieren.
  const foodPerceived = env.foodAbundance + phys.senseForage * sense * (1 - env.foodAbundance);
  const energyForage =
    mobility *
    foodPerceived *
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

  //    d.2) Amphibische Nische — VERSUCHT UND WIEDER ENTFERNT (Phase 2, Lebendige-Welt-
  //       Roadmap, 2026-07-30). Ein additiver Energiekanal exakt am Land/Wasser-Uebergang
  //       (water=aquaticWaterFloor, Dreieck-Peak bei moderatem limb) machte Amphibie
  //       tatsaechlich schwach erreichbar, brach aber tools/coevolution-check.mjs (Red
  //       Queen P5): die Testumwelt liegt bei water=0.5 — exakt am Zentrum des Kanals.
  //       Jeder getestete Ertrag (0.3/0.6/0.9/1.5) senkte das Koevolutions/Kontroll-
  //       Verhaeltnis von 6.6x auf 1.4-2.1x, unter die 2.5x-Schwelle: der Kanal gab der
  //       Beute-Population einen Ausweg aus dem groessenbasierten Ruestungswettlauf.
  //       Siehe docs/roadmap-lebendige-welt.md Phase 2 fuer den vollen Befund.

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

  //    f) Filtrieren / Suspensionsfressen (AXIS-3): schwebende Partikel (Plankton,
  //       Detritus) aus dem Wasser sieben. Anders als die aktive Jagd braucht das WEDER
  //       Mobilitaet NOCH Stromlinienform — ein SESSILER Filtrierer (Schwamm, Koralle,
  //       Muschel, Seepocke) pumpt Wasser durch Filterstrukturen. Rewards das Gen 'filter',
  //       skaliert mit Wasserkoerper (aquaHabitat) + Partikel-Angebot (foodAbundance),
  //       heterotroph (schliesst Photosynthese aus). Schafft die aquatische Sessil-
  //       Filtrier-Nische als eigenen Energieweg (bisher nur schwach ueber Absorption).
  const energyFilter =
    phys.filterYield *
    filter *
    aquaHabitat *
    (phys.filterBase + (1 - phys.filterBase) * env.foodAbundance) *
    (1 - phys.exclusion * photo);

  //    g) Stickstoff-Fixierung / Chemosynthese (AXIS-19): manche Organismen erschliessen
  //       Naehrstoffe unabhaengig vom Futter-Angebot — Rhizobien/Cyanobakterien fixieren
  //       Luft-Stickstoff, Chemolithotrophe oxidieren Mineralien. Der Gewinn zaehlt VOR ALLEM
  //       bei KNAPPEN Naehrstoffen (1 - foodAbundance): Pionier auf armem Boden (Erle/Klee,
  //       mikrobielle Krusten). Metabolisch teuer -> sessil/langsam (schliesst Mobilitaet aus),
  //       kostet Unterhalt (maintenance.nfix). Kein Universal-Bonus, sondern eine Armut-Nische.
  const energyNfix =
    phys.nfixYield *
    nfix *
    (phys.nfixBase + (1 - phys.nfixBase) * (1 - env.foodAbundance)) *
    (1 - phys.exclusion * mobility);

  //    h) Gliedmassen-Substrat-Traktion (AXIS-20, Stufe 3.5): viele/lange Gliedmassen an
  //       einem KLEINEN Koerper erschliessen ein eigenes, kleines Einkommen aus zerstreuter
  //       Boden-/Unterholz-Nahrung (Laubstreu, Rindenritzen, Kleinstbeute) — das ist
  //       Wendigkeit im ENGEN Substrat, nicht Reichweite nach oben (das leistet bereits
  //       reachFromSize). Ein GROSSER Koerper kann das nicht ueber Groesse nachbilden:
  //       (1-size) macht den Bonus exklusiv fuer kleine Baupläne, waehrend reachFromSize
  //       einem grossen Koerper weiterhin billig dieselbe Reichweite gab und so die
  //       Insekten-Nische (winziger Koerper + viele Gliedmassen) unerreichbar machte
  //       (Multi-Start-Sweep: 0.14 %, docs/engine-forschungsergebnis.md Messung 3).
  //       Braucht Mobilitaet (Durchsuchen des Substrats), nur an LAND (landFactor),
  //       heterotroph (schliesst Photosynthese aus).
  //       BEWUSST ein eigener, KLEINER additiver Kanal statt eines Multiplikators auf die
  //       gesamte energyForage (wie senseBoost, urspruenglich versucht): ein Multiplikator
  //       auf die volle Jagd-Einkommensbasis wirkt fuer JEDES Landtier mit etwas Gliedmasse
  //       (nicht nur kleine/gliedmassenreiche) und kippt schon bei kleinen Werten die
  //       Reich-Balance (Oekologie-Check C4: Tier > 55 %), lange bevor Insekt 2 % erreicht —
  //       gemessen und verworfen. Als eigener, kleiner Kanal (Praezedenz: energyFilter/
  //       energyNfix/energyAbsorb) bleibt der Vorteil auf die schmale Nische begrenzt.
  //       Zusaetzlich exklusiv fuer den WIRKLICH insektoiden Bauplan: (1-armor)*(1-insulation)
  //       schliesst gepanzerte (Krebstier/Koloss) und pelzige (Fell-Warmblueter) Baupläne
  //       aus - ein dick gepanzerter oder pelziger Koerper ist per Definition NICHT das enge,
  //       nackte Wendigkeits-Substrat-Profil eines Insekts, sondern loest sein Ueberleben
  //       anders (Panzer/Fell). Ohne diese Exklusivitaet floss der Bonus in JEDES kleine,
  //       gliedmaßenreiche Landtier (auch gepanzert/pelzig) und blaehte die gesamte
  //       Tier-Nische in der Reich-Balance auf (gemessen, verworfen) - mit ihr bleibt er
  //       eine schmale, plausibel begruendete Nische statt eines General-Boosts.
  //       Skaliert zusaetzlich mit env.temperature: Gliedmassenreiche Kleinstwesen sind
  //       ueberwiegend Ektotherme (Insekten/Spinnentiere) - ihre Stoffwechselrate und damit
  //       ihre Aktivitaet im Unterholz haengt an der Umgebungswaerme, ohne eigene Heizung
  //       (kein insulation-Ofen wie bei Endothermen, s. thermal-Abschnitt oben). In der Kaelte
  //       gibt es kaum Landgliederfuesser (Wüsten/Steppen/Tropen sind ihr Kerngebiet, nicht
  //       die Tundra). Das haelt den Kanal in kalten Umwelten inaktiv (dort gewinnt ohnehin
  //       Fell/Isolation) und konzentriert ihn auf die Umwelten, in denen die Insekten-Nische
  //       real existiert - ohne diese Kopplung war der Bonus ueber ALLE Temperaturen hinweg
  //       aktiv und blaehte die Tier-Nische in kalten Umwelten unbegruendet auf (gemessen).
  //       insectShape wird QUADRIERT: das schaerft den Peak auf Baupläne, die ALLE VIER
  //       Bedingungen (viel Gliedmasse, wenig Groesse, wenig Panzer, wenig Fell) zugleich
  //       GUT erfuellen, statt schon bei TEIL-Erfuellung (z. B. nur kleiner Koerper, mittel
  //       viel Panzer/Limb) spuerbar auszuzahlen. Reduziert den Streueffekt auf generische
  //       kleine/mobile Tiere (z. B. in der Raeuber-Beute-Koevolution, s.u.), die insectShape
  //       nur maessig erfuellen.
  //       Umwelt-Gate ECHTE Schwellen (analog aquaticWaterFloor/biolumDarkFloor), NICHT
  //       linear: nur in WIRKLICHER Hitze (oberhalb tractionHeatFloor) UND WIRKLICHER
  //       Nahrungsknappheit (unterhalb tractionScarcityCeiling) aktiv - die reale Nische
  //       der Landgliederfuesser (Wueste/Trockensavanne, docs Messung 3 "Hitze-Duerre":
  //       temperature .92, foodAbundance .3), NICHT jede gemaessigt-warme oder leicht
  //       knappe Umwelt. Notwendig (gemessen): eine LINEARE Kopplung an env.temperature
  //       (mit/ohne (1-foodAbundance)) trennte die Ziel-Nische nicht ausreichend von (a) der
  //       Reich-Balance ueber den vollen Umwelt-Wuerfel (Oekologie-Check C4: Tier > 55 %,
  //       weil auch gemaessigt warme/durchschnittliche Umwelten spuerbar mit-profitierten)
  //       und (b) der Test-Umwelt der endogenen Raeuber-Beute-Koevolution (Rote Koenigin,
  //       P5/coevolution-check: temperature=0.5, foodAbundance=0.75 - deutlich unterhalb
  //       beider Schwellen, daher mit den Schwellen exakt 0 statt nur "klein"). Mit echten
  //       Schwellen bleibt der Kanal fuer die weit ueberwiegende Mehrheit der Umwelten
  //       GENAU NULL (kein Effekt auf ihre Selektion) und wirkt nur in der schmalen
  //       Hitze-Duerre-artigen Nische, in der die Insekten-Nische real existiert.
  const hot = clamp01((env.temperature - phys.tractionHeatFloor) / (1 - phys.tractionHeatFloor));
  const dry = clamp01((phys.tractionScarcityCeiling - env.foodAbundance) / phys.tractionScarcityCeiling);
  const insectShape = limb * clamp01(1 - size) * clamp01(1 - armor) * clamp01(1 - insulation);
  const traction = insectShape * insectShape * landFactor * hot * dry;
  const energyTraction = phys.tractionYield * mobility * traction * (1 - phys.exclusion * photo);

  const totalEnergy =
    energyPhoto + energyForage + energyAbsorb + energyAquatic + energyGlow + energyFilter + energyNfix + energyTraction;

  //    Unterhaltskosten: jedes Merkmal kostet Energie.
  const m = phys.maintenance;
  const mq = phys.maintenanceQuad;
  // Kleibersche Allometrie (Biologie-Audit): die MASSENSPEZIFISCHen Stoffwechselkosten
  // sinken mit der Koerpermasse (Gesamt-Stoffwechsel ~ Masse^0.75 -> pro Gramm ~
  // Masse^-0.25). Grosse Koerper "verbrennen" pro Einheit Stoffwechsel weniger -
  // Groessenoekonomie. size (0..1) spannt kleiberDecades Groessenordnungen an Masse
  // auf; der Rabatt gilt NUR den Stoffwechsel-Kosten (nicht dem Grundpreis fuer Masse
  // selbst, m.size). So werden grosse, aktive Endotherme energetisch ueberhaupt erst
  // tragbar, ohne dass Masse "gratis" wird.
  const kleiber = Math.pow(10, -0.25 * phys.kleiberDecades * size);
  const maintenance =
    m.base +
    size * m.size +
    insulation * m.insulation +
    armor * m.armor +
    metabolism * m.metabolism * kleiber +
    photo * m.photosynthesis +
    mobility * m.mobility +
    structure * m.structure +
    wing * m.wing +
    biolum * m.biolum +
    detox * m.detox +
    oxyEff * m.oxyEff +
    osmo * m.osmo +
    burrow * m.burrow +
    pigment * m.pigment +
    filter * m.filter +
    camo * m.camo +
    baro * m.baro +
    sense * m.sense +
    desicc * m.desicc +
    radres * m.radres +
    fireres * m.fireres +
    frostres * m.frostres +
    windres * m.windres +
    nfix * m.nfix +
    // Steigende Grenzkosten: hoher Stoffwechsel/hohe Mobilitaet/Panzerung werden
    // ueberproportional teuer -> innere Optima statt Dauer-Saettigung bei 1.
    // Panzer-Grenzkosten (BAL-5): ohne sie war "gepanzert + mobil" ein fast
    // universeller Gewinner (~30% aller Umwelten drei Panzer-Formen) -> Verteilung
    // entzerrt, mittlere Umwelten bringen wieder vielfaeltige Baupläne.
    metabolism * metabolism * mq.metabolism * kleiber +
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
      biolum * dark * phys.biolumDefense +
      // Graben (AXIS-9): fossoriale Flucht in den Boden — ein Bau/Versteck entzieht
      // dem Räuber die Beute. Wirkt nur an LAND (landFactor); im offenen Wasser gibt es
      // keinen Bau. Eine BILLIGE Verteidigung ohne Panzer-Drag: schafft die fossoriale
      // Nische (Maulwurf/Wühlmaus) als Alternative zu Panzerung/Größe bei Räuberdruck.
      // Skaliert zusaetzlich mit mobility (Bugfix, zurueckgestellt aus Phase 0, BACKLOG.md
      // Punkt 10): das Fluchtverhalten braucht Bewegung in den Bau — ohne diesen Faktor
      // profitierte auch ein voellig sessiler Bauplan (mobility=0, z. B. Pilz/Pflanze)
      // von einer "Flucht", die er koerperlich gar nicht ausfuehren kann.
      burrow * phys.defenseFromBurrow * landFactor * mobility +
      // Tarnung (AXIS-11): visuelle Krypsis (Färbung/Muster/Form) lässt den Räuber die
      // Beute übersehen. Anders als Panzer erzeugt sie KEINEN Wasser-Drag (auch für
      // schlanke Schwimmer nutzbar: Plattfisch/Tintenfisch) und braucht kein Stützgewebe
      // -> eigene, billige Verteidigungs-Nische (Stabschrecke, Gespenstschrecke, Chamäleon).
      camo * phys.defenseFromCamo,
  );
  const predSurvival = 1 - env.predation * (1 - defenseScore);

  // 4) Chemischer Stress (AXIS-6 Extremchemie): giftige Milieus (Schwermetalle,
  //    Schwefel/Säure, Serpentin) töten, WENN keine Entgiftung vorliegt. Das Gen
  //    'detox' neutralisiert den Toxin-Druck, kostet aber Unterhalt (maintenance.detox)
  //    -> in sauberen Umwelten (toxicity 0) ist detox reine Last und wird wegselektiert;
  //    nur in giftigen Nischen entsteht der Extremophile/Metallophyt. toxicity ist eine
  //    Umwelt-Dimension, die NICHT über die 6 Regler kommt, sondern über Umwelt-Einflüsse.
  const toxicity = env.toxicity ?? 0;
  const toxSurvival = clamp01(1 - toxicity * (1 - detox) * phys.toxLethality);

  // 5) Sauerstoffmangel (AXIS-7 Hypoxie): duenne Hoehenluft / sauerstoffarmes Wasser.
  //    oxygen<1 bedeutet Unterversorgung. Wer viel Stoffwechsel faehrt (metabolism),
  //    braucht viel O2 und leidet am staerksten; das Gen 'oxyEff' (effiziente Atmung/
  //    Sauerstoffbindung, vgl. Hoehen-Haemoglobin) neutralisiert den Druck, kostet
  //    aber Unterhalt (maintenance.oxyEff) -> auf Meereshoehe (oxygen=1) reine Last,
  //    wird wegselektiert; nur in Hypoxie-Nischen entsteht der Hoehen-/Anoxie-Spezialist.
  //    oxygen ist eine Umwelt-Dimension aus Umwelt-Einfluessen, NICHT aus den 6 Reglern.
  const oxygen = env.oxygen ?? 1;
  const oxySurvival = clamp01(1 - (1 - oxygen) * metabolism * (1 - oxyEff) * phys.hypoxiaSeverity);

  // 6) Osmotischer Stress (AXIS-8 Salinitaet): salzige Milieus (Salzsee/Brine, Aestuar,
  //    Salzboden, Meerspray) ziehen dem Koerper osmotisch Wasser aus - toedlich, WENN
  //    keine Osmoregulation (Ionenpumpen/kompatible Solute) vorliegt. Das Gen 'osmo'
  //    neutralisiert den Salzdruck, kostet aber Unterhalt (maintenance.osmo) -> in
  //    Suesswasser/Nicht-Salz-Milieus (salinity 0) reine Last, wird wegselektiert; nur
  //    in salzigen Nischen entsteht der Halophyt/Salzspezialist (Salzkrebschen, Queller).
  //    salinity ist eine Umwelt-Dimension aus Umwelt-Einfluessen, NICHT aus den 6 Reglern.
  const salinity = env.salinity ?? 0;
  const osmoSurvival = clamp01(1 - salinity * (1 - osmo) * phys.salinityLethality);

  // 7) UV-Stress (AXIS-10): starke UV-Strahlung (Höhe, Ozonloch, junge Atmosphäre)
  //    schädigt die DNA, WENN keine Schutzpigmente (Melanin/Flavonoide/Sporopollenin)
  //    vorliegen. Das Gen 'pigment' puffert den UV-Schaden, kostet aber Unterhalt
  //    (maintenance.pigment) -> ohne UV reine Last, wird wegselektiert; nur unter UV
  //    entsteht der pigmentierte Spezialist. uv kommt über Umwelt-Einflüsse, nicht die 6 Regler.
  const uv = env.uv ?? 0;
  const uvSurvival = clamp01(1 - uv * (1 - pigment) * phys.uvLethality);

  // 8) Druck-Stress (AXIS-12 Tiefsee): extremer hydrostatischer Druck der Tiefsee/Tiefe
  //    zerstört Membranen/Proteine, WENN keine Druck-Anpassung (piezolyte Solute, druck-
  //    stabile Enzyme) vorliegt. Das Gen 'baro' puffert, kostet aber Unterhalt -> ohne
  //    Druck reine Last (wegselektiert), nur in der Tiefsee der Piezophile. pressure kommt
  //    über Umwelt-Einflüsse (Tiefsee/Hadal), nicht die 6 Regler.
  const pressure = env.pressure ?? 0;
  const baroSurvival = clamp01(1 - pressure * (1 - baro) * phys.baroLethality);

  // 9) Austrocknung (AXIS-14 Anhydrobiose): extreme Trockenheit/geringe Luftfeuchte
  //    entzieht dem Gewebe Wasser, toedlich WENN keine Austrocknungs-Toleranz vorliegt
  //    (kompatible Solute/Trehalose, Resurrektions-Physiologie). 'desicc' puffert,
  //    kostet Unterhalt -> nur in ariden Nischen der Xerophyt/Anhydrobiont (Baerentierchen,
  //    Auferstehungspflanze). aridity kommt ueber Umwelt-Einfluesse (Duerre/Aridifizierung).
  const aridity = env.aridity ?? 0;
  const desiccSurvival = clamp01(1 - aridity * (1 - desicc) * phys.desiccLethality);

  // 10) Ionisierende Strahlung (AXIS-15): radioaktive Boeden (Selen/Arsen/Radon, Uran-
  //     Erz) und kosmische Strahlung erzeugen DNA-Doppelstrangbrueche, toedlich WENN
  //     keine Strahlungsresistenz (redundante Genome, DNA-Reparatur wie bei Deinococcus,
  //     Baertierchen). 'radres' puffert, kostet Unterhalt -> nur in Strahlungs-Nischen.
  //     radiation kommt ueber Umwelt-Einfluesse, nicht die 6 Regler.
  const radiation = env.radiation ?? 0;
  const radSurvival = clamp01(1 - radiation * (1 - radres) * phys.radLethality);

  // 11) Feuer (AXIS-16 Pyrophyt): wiederkehrende Braende (Savanne, mediterranes Buschland)
  //     toeten, WENN keine Feuer-Anpassung vorliegt (Korkrinde, unterirdische Lignotuber,
  //     serotine Zapfen). 'fireres' puffert, kostet Unterhalt -> nur in Feuer-Regimen der
  //     Pyrophyt. fire kommt ueber Umwelt-Einfluesse (Feuer-Regime), nicht die 6 Regler.
  const fire = env.fire ?? 0;
  const fireSurvival = clamp01(1 - fire * (1 - fireres) * phys.fireLethality);

  // 12) Frost (AXIS-17 Kryoprotektion): tiefer Frost bildet Eiskristalle, die Zellen
  //     zerreissen — toedlich OHNE Frostschutz (Frostschutzproteine, Glycerol, kontrolliertes
  //     Ausfrieren wie beim Waldfrosch / antarktischen Eisfisch). Anders als Fell (das nur
  //     Waerme haelt) verhindert 'frostres' den Gefrierschaden selbst. Kostet Unterhalt.
  //     frost kommt ueber Umwelt-Einfluesse (Eiszeit/Permafrost), nicht die 6 Regler.
  const frost = env.frost ?? 0;
  const frostSurvival = clamp01(1 - frost * (1 - frostres) * phys.frostLethality);

  // 13) Wind/Exposition (AXIS-18): Dauerwind/Sturm uebt mechanischen Stress aus (Austrocknung,
  //     Abbrechen, Umwerfen) — abgefedert durch Windhaerte (biegsame/verholzte Stiele, Krueppel-
  //     wuchs, Verankerung). 'windres' puffert, kostet Unterhalt -> nur an windexponierten
  //     Standorten (Grat/Kueste/Steppe) der windharte Krueppel. wind kommt ueber Umwelt-Einfluesse.
  const wind = env.wind ?? 0;
  const windSurvival = clamp01(1 - wind * (1 - windres) * phys.windLethality);

  const fit =
    Math.pow(thermal, phys.wThermal) *
    Math.pow(predSurvival, phys.wPred) *
    Math.pow(nutrition, phys.wNutrition) *
    Math.pow(toxSurvival, phys.wTox) *
    Math.pow(oxySurvival, phys.wOxy) *
    Math.pow(osmoSurvival, phys.wOsmo) *
    Math.pow(uvSurvival, phys.wUv) *
    Math.pow(baroSurvival, phys.wBaro) *
    Math.pow(desiccSurvival, phys.wDesicc) *
    Math.pow(radSurvival, phys.wRad) *
    Math.pow(fireSurvival, phys.wFire) *
    Math.pow(frostSurvival, phys.wFrost) *
    Math.pow(windSurvival, phys.wWind);

  return Math.max(fit, phys.floor);
}
