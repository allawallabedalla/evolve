// AUTO-GENERIERT von tools/bundle-app-core.mjs — nicht von Hand editieren.
// Quelle: world/*.ts + engine/fitness.ts (via tsc). Neu bündeln: npm run bundle-app
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
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
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
export function fitness(traits, env, phys) {
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
    // "An Land" (0..1): 1 ausserhalb des tiefen Wassers, 0 im offenen Wasserkoerper.
    // Landjagd UND Flug sind terrestrisch/aerisch - sie funktionieren nicht unter
    // Wasser. Im Wasser uebernimmt die aquatische Jagd (Schwimmen). Ohne diese Gate
    // bildete ein Tiefsee-Schwimmer absurde Beine/Fluegel fuers "hohe" Futter.
    const landFactor = 1 - clamp01((env.water - phys.aquaticWaterFloor) / (1 - phys.aquaticWaterFloor));
    // Flug (AXIS-1): nur leichte, aktive Koerper fliegen. Grosse Masse (size) macht
    // Fluegel wirkungslos, hoher Stoffwechsel treibt den Flug an. Unter Wasser kein
    // Flug (landFactor). Zwei Auszahlungen: (a) erreicht hohe Nahrung, (b) Flucht.
    const flight = wing *
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
    const photoThermal = clamp01(1 - phys.photoTempStrength * (env.temperature - phys.photoTempOpt) * (env.temperature - phys.photoTempOpt));
    const energyPhoto = photo * env.light * env.water * lightAccess * photoSize * photoThermal * (1 - phys.exclusion * mobility);
    //    b) Nahrungssuche: braucht Mobilitaet + erreichbares Futter.
    //       Flug erweitert die Reichweite in die Hoehe (Luftraum/Kronendach).
    //       Biologie-Audit: GLIEDMASSEN erschliessen hohes Futter nur an LAND
    //       (limb*landFactor). Unter Wasser greift man hohes Futter nicht mit langen
    //       Beinen - man schwimmt hinauf (aquatische Jagd). So bildet der Tiefsee-
    //       Schwimmer keine absurden Beine/Fluegel mehr, nur weil das Futter "hoch"
    //       stand. Groesse zaehlt weiter (grosse Koerper ragen ohnehin hoch).
    const reach = clamp01(limb * phys.reachFromLimb * landFactor + size * phys.reachFromSize + flight * phys.flightReach);
    const access = env.foodHeight <= reach ? 1 : clamp01(1 - (env.foodHeight - reach) * phys.heightPenalty);
    const energyForage = mobility *
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
    const substrate = env.foodAbundance * (phys.absorbWaterFloor + (1 - phys.absorbWaterFloor) * env.water);
    const energyAbsorb = phys.absorbYield *
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
    const energyAquatic = phys.aquaticYield *
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
    const energyGlow = phys.biolumYield *
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
    const energyFilter = phys.filterYield *
        filter *
        aquaHabitat *
        (phys.filterBase + (1 - phys.filterBase) * env.foodAbundance) *
        (1 - phys.exclusion * photo);
    const totalEnergy = energyPhoto + energyForage + energyAbsorb + energyAquatic + energyGlow + energyFilter;
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
    const maintenance = m.base +
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
    const defenseScore = clamp01(armor * phys.defenseFromArmor +
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
        burrow * phys.defenseFromBurrow * landFactor +
        // Tarnung (AXIS-11): visuelle Krypsis (Färbung/Muster/Form) lässt den Räuber die
        // Beute übersehen. Anders als Panzer erzeugt sie KEINEN Wasser-Drag (auch für
        // schlanke Schwimmer nutzbar: Plattfisch/Tintenfisch) und braucht kein Stützgewebe
        // -> eigene, billige Verteidigungs-Nische (Stabschrecke, Gespenstschrecke, Chamäleon).
        camo * phys.defenseFromCamo);
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
    const fit = Math.pow(thermal, phys.wThermal) *
        Math.pow(predSurvival, phys.wPred) *
        Math.pow(nutrition, phys.wNutrition) *
        Math.pow(toxSurvival, phys.wTox) *
        Math.pow(oxySurvival, phys.wOxy) *
        Math.pow(osmoSurvival, phys.wOsmo) *
        Math.pow(uvSurvival, phys.wUv) *
        Math.pow(baroSurvival, phys.wBaro);
    return Math.max(fit, phys.floor);
}
