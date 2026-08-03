// ============================================================================
// ARCHETYP-BIBLIOTHEK — Daten statt Kontrollfluss.
//
// Ersetzt die alte if/else-Kaskade `classify()` in app/index.html („erster Treffer
// gewinnt"). Jede Lebensform ist hier ein PROTOTYP: die Stelle im Merkmalsraum, die
// diese Form am reinsten verkoerpert. Benannt wird ueber die selektions-gewichtete
// NAEHE zu diesen Stellen (matchArchetype() in index.html), nicht ueber eine
// Reihenfolge von Schwellen-Abfragen.
//
// Warum das der Kern des Umbaus ist (docs/engine-forschungsergebnis.md, Abschnitt 4):
// die Kaskade hatte eine Identitaets-Klippe — ein Wesen mit viel Waermedaemmung UND
// Leuchtorgan wurde IMMER „Leuchtwesen · Tiefsee", weil der Biolumineszenz-Zweig vor
// dem Fell-Zweig stand. Bei Naehe-Benennung zaehlt das ganze Genom, gewichtet danach,
// welche Gene in DIESER Umwelt ueberhaupt ueber Leben und Tod entscheiden.
//
// ---------------------------------------------------------------------------
// HERKUNFT DER ZAHLEN — die Migration ist mechanisch, nicht erfunden.
//
// Erzeugt von `node tools/research/archetype-derive.mjs` — nicht von Hand geraten.
// Reihenfolge, Namen, Emojis, Kommentare und die `requires`-Fenster sind kuratiert, die
// Prototyp-ZAHLEN sind gemessen, in zwei Schritten:
//
// (1) WELCHE Gene nennt ein Prototyp?  Aus der GEOMETRIE seines Kaskaden-Zweigs: 4 Mio
//     gleichverteilte Genome durch die alte classify()-Kaskade schicken und je Form die
//     Streuung pro Gen messen. Kleine Streuung (sd < 0.235) = der Zweig legt das Gen fest
//     -> es gehoert in den Prototyp; grosse Streuung = der Zweig sagt nichts dazu -> es
//     bleibt weg. Das erfasst automatisch auch alle Bedingungen, die sich erst aus der
//     NEGATION frueherer Zweige ergeben (ein „Fell-Warmblueter" darf z. B. nicht
//     gliedmassenlos sein, sonst haette ihn der Fisch-Zweig vorher gefangen).
//     Nicht genannte Gene gehen NICHT in den Abstand ein: der Fisch-Zweig prueft
//     `limb<0.3 && armor<0.32 && mob>0.6` und sagt nichts ueber Groesse oder Daemmung —
//     ein Prototyp, der dort trotzdem einen Wert behauptete, wuerde kalte Tiefsee-Fische
//     (die real Isolation ~0.9 entwickeln) aus ihrer eigenen Form heraus druecken.
//     Ein Prototyp ist also eine TEIL-Spezifikation, genau wie ein Kaskaden-Zweig eine
//     Teil-Bedingung war.
//
// (2) WELCHEN Wert bekommt es?  Zur Haelfte die geometrische Mitte des Schwellen-Fensters
//     („die Schwellen sind schon die Information, sie wandern nur von Grenzen zu Zentren"),
//     zur Haelfte der Mittelwert ueber ERREICHBARE Genome derselben Form — also ueber das,
//     was die Engine unter 9000 zufaelligen Umwelten wirklich hervorbringt. Ohne den
//     zweiten Teil stuende im Prototyp die Mitte eines Intervalls, das die Evolution nie
//     besucht (eine echte Bakterie hat Stoffwechsel 0.02, nicht 0.30 = die Mitte von
//     [0, 0.6]); ohne den ersten waere die Benennung an die heutige Dynamik gefesselt.
//     Formen mit zu wenigen erreichbaren Beispielen behalten die reine Geometrie.
//
// (3) `requires` = WEICHES Plausibilitaetsfenster, kein Verbot (kuratiert, nicht gemessen):
//     liegt die Umwelt ausserhalb, wird der Abstand mit `requiresPenalty` multipliziert.
//     Ein Landtier in der Tiefsee wird unwahrscheinlich, aber nicht unmoeglich.
//
// (4) Die 15 bedingten Gene aus der alten Kaskaden-Aera (Index 10..24: Stressor-
//     Resistenzen, Nischen-Mechaniken) tauchen in keinem Prototyp auf — die alte Kaskade
//     hat sie nie angesehen, und ohne ihren Stressor driften sie frei (gemessen: ~64 %
//     des rohen 25-D-Abstands ist dieses Driftrauschen). Sie wirken trotzdem: ueber die
//     Selektionsgewichte (in einer giftigen Welt wird „Entgiftung" identitaetsstiftend)
//     und ueber die unerklaerte Merkmalslast.
//
//     AUSNAHME `resprout` (Index 25, AXIS-25, 2026-08-03): dieses Gen kam NACH der alten
//     Kaskade dazu, es gibt also keinen Kaskaden-Zweig, aus dessen Geometrie sich ein Wert
//     ableiten liesse (Methode (1)/(2) oben setzt genau das voraus). Bei bluetenkraut/farn/
//     kraut steht deshalb ein direkt GEMESSENER Wert: Hill-Climb nur auf resprout, Uebrige
//     Gene fest auf dem jeweiligen Prototyp, gemittelt ueber mehrere Stoerungsgrade (Feuer
//     0.2..1.0) — dieselbe Idee wie Methode (2) („Mittelwert ueber erreichbare Genome"),
//     nur ohne den Geometrie-Anteil (1), den es fuer ein kaskaden-loses Gen nicht geben
//     kann. Begruendung/Messwerte: docs/coverage-report.md AXIS-25.
//
// Reich (`k`), Name (`n`) und Emoji (`e`) sind BIT-IDENTISCH zur alten Kaskade — die
// Namen sind Schluessel fuer Lebensbaum (TREE), Raritaet (RARITY), Icons (FICON),
// Herausforderungen (app/challenges.js) und Chronik (app/story.js).
//
// Warum .js und nicht .json? Der Matcher laeuft synchron beim App-Start (newLineage()
// benennt das frisch geborene Wesen, bevor irgendetwas gerendert wird). Ein fetch()
// waere asynchron und braeuchte einen Umbau der Startsequenz plus einen Fehlerpfad fuer
// die zentralste Funktion der App. Dieselbe Loesung wie bei influences.js /
// challenges.js / gene-explain.js: reine Daten, per <script src> synchron geladen, von
// GitHub Pages als Teil von app/ ausgeliefert. Node-Werkzeuge lesen die Datei mit
// derselben Technik wie app/influences.js (tools/lib/app-core.mjs).
// ============================================================================
window.ARCHETYPES = {
  version: 1,

  // Reihenfolge der Gene = engine/types.ts TRAITS = Reihenfolge von GENE_LABELS in
  // app/index.html. Der Matcher liest die Reihenfolge aus DIESER Liste.
  genes: ["insulation","size","limbLength","metabolism","armor","photosynthesis","mobility","structure",
          "wing","biolum","detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense",
          "desicc","radres","fireres","frostres","windres","nfix","resprout"],

  // Weiche Strafe auf den Abstand, wenn die Umwelt ausserhalb von `requires` liegt.
  requiresPenalty: 1.30,

  // Abstands-Schwelle, ab der KEINE Form mehr erzwungen wird, sondern ein Name aus den
  // staerksten Abweichungen entsteht. Kalibriert am Abstandsspektrum echter Genome:
  // ueber 35 000 Momentaufnahmen aus 2500 Umwelten (inkl. Uebergangszustaende) lag der
  // groesste Abstand bei 0.145 — die Schwelle liegt knapp darueber. Ein Wesen, das die
  // Evolution in dieser Welt hervorbringen kann, bekommt also immer einen echten Namen;
  // der erzeugte Name ist fuer Bauplaene reserviert, die es hier gar nicht geben kann.
  novelThreshold: 0.15,

  // Konfidenz = relativer Vorsprung vor dem Zweitplatzierten, mit diesem Faktor
  // gespreizt und auf 0..1 geklemmt.
  confidenceGain: 4.5,

  // Unerklaerte Merkmalslast (s. unusedBurden() in index.html): um wie viel besser ginge
  // es dem Wesen, wenn es alle 15 bedingten Merkmale (Index 10..24) ablegte? Traegt es
  // Ruestung, die seine Welt gar nicht abfragt, ist es keine saubere Form, sondern eine
  // Chimaere — die Konfidenz sinkt entsprechend. Gemessen, nicht geraten.
  // `burdenRest` = Ruhewert eines ungenutzten Gens (vgl. PARAMS.mutationAnchor 0.12),
  // `burdenFull` = relativer Fitness-Gewinn, ab dem die Konfidenz auf 0 faellt.
  // Kalibriert: konvergierte Wesen liegen bei 0.0-0.5 %, ein frisch geborenes Wesen mit
  // allen 25 Genen auf 0.5 bei 9.8 %.
  burdenRest: 0.15,
  burdenFull: 0.10,

  // Selektionsgewichte: w = floor + (1-floor) * (|dFitness/dGen| / max)^sharpen.
  // `sharpen` > 1 drueckt Gene, die hier kaum etwas bewirken, deutlicher nach unten —
  // noetig, weil schon die blosse Unterhaltslast jedem Gen eine kleine Ableitung gibt.
  // `floor` haelt sie trotzdem sichtbar: nie ganz ignorieren.
  weightFloor: 0.30,
  weightSharpen: 2.5,

  // Spezifitaets-Bonus (s. matchArchetype()): ein Prototyp, der zu vielen Genen etwas sagt,
  // gewinnt bei sonst gleichem Abstand gegen einen, der zu wenigen etwas sagt. Ohne ihn
  // gewaenne immer der vagere — er hat weniger zu treffen. 0 = aus, 1 = maximal.
  // Kalibriert gegen die Uebereinstimmung mit der alten Kaskade auf erreichbaren Genomen.
  specificityBonus: 0.55,

  // Nur als Rueckfall, wenn classify() ohne Umwelt UND ausserhalb der laufenden App
  // aufgerufen wird (Node-Pruefstaende, die den Inline-Kern extrahieren). In der App
  // gilt immer die echte Welt des Wesens. Werte = Startzustand von `env` in index.html.
  fallbackEnv: { temperature:.5, predation:.3, foodAbundance:.5, foodHeight:.2, light:.5,
                 water:.6, toxicity:0, oxygen:1, salinity:0, uv:0, pressure:0, aridity:0,
                 radiation:0, fire:0, frost:0, wind:0 },

  forms: [
    // ===== Reich PFLANZEN — autotroph (Photosynthese) + sessil ==================
    // Kaskaden-Tor: photo>0.45 && mob<0.4
    { key:"gruenalge", k:"Pflanze", n:"Grünalge", e:"🟢",
      // if(size<0.18 && struct<0.32)
      proto:{ size:.09, photosynthesis:.72, mobility:.20, structure:.16 },
      requires:{ water:[0.40,1.00] } },

    { key:"moos", k:"Pflanze", n:"Moos", e:"🌱",
      // if(struct<0.28 && size<0.42) — zu gross fuer die Gruenalge
      proto:{ size:.30, photosynthesis:.72, mobility:.20, structure:.14 } },

    { key:"sukkulente", k:"Pflanze", n:"Sukkulente · Kaktus", e:"🌵",
      // if(armor>0.5)
      proto:{ armor:.76, photosynthesis:.61, mobility:.25 },
      requires:{ water:[0.00,0.45] } },

    { key:"polsterpflanze", k:"Pflanze", n:"Polster-Kältepflanze", e:"🏔️",
      // if(insul>0.6), Panzerung bleibt unter 0.5
      proto:{ insulation:.83, armor:.28, photosynthesis:.67, mobility:.17 },
      requires:{ temperature:[0.00,0.45] } },

    { key:"nadelbaum", k:"Pflanze", n:"Nadelbaum", e:"🌲",
      // if(struct>0.6 && size>0.5) mit insul in (0.4,0.6]
      proto:{ insulation:.50, size:.75, armor:.25, photosynthesis:.73, mobility:.20,
              structure:.80 },
      requires:{ temperature:[0.00,0.60] } },

    { key:"laubbaum", k:"Pflanze", n:"Laubbaum", e:"🌳",
      // if(struct>0.6 && size>0.5) mit insul<=0.4
      // requires water (PHASE-0, 2026-07-30): fehlte bisher jedes Plausibilitaets-Fenster,
      // dadurch gewann ein Landbaum-Prototyp auch in fast vollstaendig untergetauchten
      // Umwelten (gemessen: "Sonniges Flachmeer"-Preset water=0.85 -> Laubbaum-Verwandter
      // "Verholzter Strauch"). Obergrenze knapp unter aquaticWaterFloor (0.5): ab dort
      // uebernimmt ohnehin der eigene aquatische Energiekanal.
      proto:{ insulation:.12, size:.82, armor:.21, photosynthesis:.86, mobility:.10,
              structure:.89 }, requires:{ water:[0.05,0.65] } },

    { key:"strauch", k:"Pflanze", n:"Verholzter Strauch", e:"🪴",
      // if(struct>0.55), aber nicht gross genug fuer einen Baum
      // requires water: s. Laubbaum-Kommentar — derselbe fehlende Fenster-Befund.
      proto:{ insulation:.18, size:.24, armor:.15, photosynthesis:.83, mobility:.10,
              structure:.83 }, requires:{ water:[0.05,0.65] } },

    { key:"bluetenkraut", k:"Pflanze", n:"Blütenkraut", e:"🌸",
      // if(photo>0.75 && struct<0.42)
      // KURATION (CLS-4-Rest, 2026-07-30): `size` lag mit sd=0.244 hauchdünn über der
      // automatischen SD_MAX=0.235-Aufnahmeschwelle (archetype-derive.mjs) und blieb
      // deshalb bisher unbenannt — mit nur 5 statt 6 Genen hatte der Prototyp im
      // Spezifitäts-Bonus (matchArchetype()) einen strukturellen Nachteil gegen seine
      // 6-Gene-Nachbarn Nadelbaum/Farn/Laubbaum/Strauch und verlor Grenzfälle an sie,
      // obwohl er ihnen distanzmäßig nicht unterlegen war (gemessen: reine
      // Fenster-Ziehung, die laut alter Kaskade zu 100% "Blütenkraut" ist, wurde vom
      // echten Matcher in der Fallback-Welt nur zu 41.5% auch so genannt, 11.5% davon
      // gingen an Nadelbaum). size:.63 = Mittelwert über 8 Mio. gleichverteilte
      // Kraut-Genome im Blütenkraut-Zweig (dieselbe Geometrie-Methode wie
      // archetype-derive.mjs Schritt 1, hier nur unterhalb ihrer eigenen Schwelle).
      // resprout .59 = Hill-Climb-Mittel ueber Feuer .2-1.0 bei sonst fixem Proto (AXIS-25,
      // s. Kommentar zu `genes` oben) - macht das Fenster zwischen Moos/Gruenalge (.09)
      // und Strauch/Laubbaum (.83/.89) erstmals real erreichbar statt nur geometrisch.
      proto:{ insulation:.30, size:.63, armor:.25, photosynthesis:.87, mobility:.20,
              structure:.24, resprout:.59 }, requires:{ water:[0.05,0.70] } },

    { key:"farn", k:"Pflanze", n:"Farn", e:"🌿",
      // if(struct<0.42 && size>0.35), photo<=0.75
      // requires water: Farne moegen es feucht/schattig, aber nicht untergetaucht — s.
      // Laubbaum-Kommentar (PHASE-0, 2026-07-30).
      // resprout .62 (AXIS-25, gemessen wie bei bluetenkraut): reale Farne (z. B.
      // Adlerfarn) treiben nach Feuer/Frost aus tief sitzenden Rhizomen wieder aus,
      // ohne oberirdisches Gewebe ueber die Saison zu erhalten.
      proto:{ insulation:.30, size:.70, armor:.25, photosynthesis:.60, mobility:.20,
              structure:.22, resprout:.62 }, requires:{ water:[0.15,0.75] } },

    { key:"kraut", k:"Pflanze", n:"Kraut · niedrige Pflanze", e:"☘️",
      // Auffang-Zweig der Pflanzen. requires water: s. Laubbaum-Kommentar.
      // KEIN resprout-Eintrag (AXIS-25, Korrektur 2026-08-03): anders als bluetenkraut/farn
      // ist kraut kein neu erschlossenes Stoerungs-Nische, sondern der generische Auffang-
      // Zweig, der schon vorher (ohne resprout) in praktisch jeder Umwelt erreichbar war.
      // Ein erster Versuch, ihm einen gemessenen resprout-Wert (.77) mitzugeben, gab ihm
      // einen Abstands-Sollwert auf einem Gen, das in JEDER ungestoerten Umwelt (fire=frost=0,
      // der Normalfall) nahe seinem Anker (0.12) bleibt - das riss kraut (937 Arten) aus der
      // Erreichbarkeit (gemessen: coverage-check engineGapGroups, Vorher/Nachher-Vergleich
      // gegen den Commit vor AXIS-25). Nur Archetypen, deren Identitaet WIRKLICH an
      // Stoerung haengt (bluetenkraut/farn), bekommen einen resprout-Wert.
      proto:{ insulation:.30, armor:.25, photosynthesis:.71, mobility:.20, structure:.47 },
      requires:{ water:[0.05,0.70] } },

    // ===== Reich TIERE — heterotroph + mobil ====================================
    // Kaskaden-Tor: mob>0.45 && photo<0.4
    { key:"leuchtwesen", k:"Tier", n:"Leuchtwesen · Tiefsee", e:"🪼",
      // if(biolum>0.55 && limb<0.3 && armor<0.35) — stromlinienfoermiger Tiefsee-Leuchter
      proto:{ limbLength:.13, armor:.12, photosynthesis:.10, mobility:.84, biolum:.86 },
      requires:{ light:[0.00,0.30], water:[0.40,1.00] } },

    { key:"fledermaus", k:"Tier", n:"Flugsäuger · Fledermaus", e:"🦇",
      // if(wing>0.5 && size<0.34 && armor<0.4) + metab>0.7 + insul>0.62
      proto:{ insulation:.84, size:.10, metabolism:.92, armor:.13, photosynthesis:.10,
              mobility:.85, wing:.77 },
      requires:{ water:[0.00,0.60] } },

    { key:"vogel", k:"Tier", n:"Flatterer · Vogel", e:"🐦",
      // dito, metab>0.7, insul<=0.62
      proto:{ insulation:.32, size:.10, metabolism:.92, armor:.12, photosynthesis:.10,
              mobility:.86, wing:.77 },
      requires:{ water:[0.00,0.60] } },

    { key:"fluginsekt", k:"Tier", n:"Fluginsekt · Segler", e:"🦋",
      // dito, metab<=0.7
      proto:{ size:.17, metabolism:.35, armor:.20, photosynthesis:.20, mobility:.73,
              wing:.75 },
      requires:{ water:[0.00,0.60] } },

    { key:"koloss", k:"Tier", n:"Gepanzerter Koloss", e:"🦏",
      // if(armor>0.55 && size>0.55)
      proto:{ size:.68, armor:.75, photosynthesis:.23, mobility:.62 } },

    { key:"krebstier", k:"Tier", n:"Krebstier · Arthropode", e:"🦀",
      // if(armor>0.5 && limb>0.5), nicht kolossal
      proto:{ size:.39, limbLength:.64, armor:.71, photosynthesis:.23, mobility:.61 } },

    { key:"beutetier", k:"Tier", n:"Gepanzertes Beutetier", e:"🐢",
      // if(armor>0.55), weder gross noch langgliedrig
      proto:{ size:.37, limbLength:.37, armor:.75, photosynthesis:.23, mobility:.61 } },

    { key:"schnecke", k:"Tier", n:"Schnecke · Weichtier", e:"🐌",
      // if(armor>0.45 && limb<0.3 && mob<0.6)
      proto:{ limbLength:.15, armor:.50, photosynthesis:.20, mobility:.52 } },

    { key:"fisch", k:"Tier", n:"Fisch · Aalform", e:"🐟",
      // if(limb<0.3 && armor<0.32 && mob>0.6); biolum bleibt unter dem Leucht-Zweig
      proto:{ limbLength:.12, armor:.10, photosynthesis:.10, mobility:.88, biolum:.16 },
      requires:{ water:[0.40,1.00] } },

    { key:"wurm", k:"Tier", n:"Wurm", e:"🪱",
      // if(limb<0.3 && size<0.35), traeger oder gepanzerter als der Fisch
      proto:{ size:.18, limbLength:.15, armor:.41, photosynthesis:.20, mobility:.73 } },

    { key:"insekt", k:"Tier", n:"Insekt · Gliederfüßer", e:"🐜",
      // if(limb>0.6 && size<0.32 && insul<0.4)
      proto:{ insulation:.19, size:.15, limbLength:.82, armor:.17, photosynthesis:.10,
              mobility:.82 } },

    { key:"kopffuesser", k:"Tier", n:"Kopffüßer · Tintenfisch", e:"🐙",
      // if(limb>0.55 && struct<0.32 && armor<0.32 && insul<0.35 && size>0.32)
      proto:{ insulation:.15, size:.60, limbLength:.83, armor:.10, photosynthesis:.10,
              mobility:.84, structure:.17 },
      requires:{ water:[0.40,1.00] } },

    { key:"grossjaeger", k:"Tier", n:"Aktiver Großjäger", e:"🐺",
      // if(size>0.6 && metab>0.6), ungepanzert
      proto:{ size:.86, metabolism:.89, armor:.16, photosynthesis:.10, mobility:.80 } },

    { key:"fellgrosstier", k:"Tier", n:"Fell-Großtier", e:"🐻",
      // if(insul>0.6 && size>0.52), aber kein hochaktiver Grossjaeger
      proto:{ insulation:.86, size:.65, metabolism:.65, armor:.28, photosynthesis:.11,
              mobility:.75 } },

    { key:"fellwarm", k:"Tier", n:"Fell-Warmblüter", e:"🦊",
      // if(insul>0.6), mittelgross
      proto:{ insulation:.83, size:.26, armor:.18, photosynthesis:.10, mobility:.80 } },

    { key:"kletterer", k:"Tier", n:"Behänder Kletterer", e:"🐒",
      // if(limb>0.6 && size<0.45), zu gross/zu warm gepolstert fuer „Insekt"
      proto:{ insulation:.43, size:.26, limbLength:.82, armor:.17, photosynthesis:.10,
              mobility:.83 },
      requires:{ foodHeight:[0.20,1.00] } },

    { key:"flink", k:"Tier", n:"Kleines flinkes Tier", e:"🐭",
      // if(size<0.28), mit Gliedmassen (sonst Wurm/Insekt)
      proto:{ insulation:.28, size:.13, limbLength:.48, armor:.18, photosynthesis:.10,
              mobility:.81 } },

    { key:"amphibie", k:"Tier", n:"Amphibie · Lurch", e:"🐸",
      // if(armor<0.32 && insul<0.32 && struct<0.35 && metab<0.5)
      proto:{ insulation:.16, size:.66, limbLength:.42, metabolism:.25, armor:.16,
              photosynthesis:.20, mobility:.70, structure:.19 },
      requires:{ water:[0.30,1.00] } },

    { key:"reptil", k:"Tier", n:"Reptil · Echse", e:"🦎",
      // if(armor<0.32 && insul<0.32), aber aktiver/fester als die Amphibie
      proto:{ insulation:.14, size:.49, limbLength:.55, armor:.12, photosynthesis:.10,
              mobility:.84, structure:.44 } },

    { key:"generalist", k:"Tier", n:"Generalisten-Tier", e:"🦥",
      // Auffang-Zweig der Tiere: von allem etwas, nichts im Extrem
      proto:{ insulation:.41, size:.51, armor:.21, photosynthesis:.10, mobility:.83 } },

    // ===== Reich PILZE & MIKROBEN — heterotroph + sessil ========================
    // Kaskaden-Tor: photo<0.45 && mob<0.4
    { key:"archaee", k:"Mikrobe", n:"Archaee · Extremophil", e:"🦠",
      // if(size<0.16) mit metab>0.6 ODER insul>0.6 — das ODER legt weder
      // Stoffwechsel noch Daemmung fest, also sagt der Prototyp dazu nichts
      proto:{ size:.06, photosynthesis:.12, mobility:.12 } },

    { key:"bakterie", k:"Mikrobe", n:"Bakterie", e:"🧫",
      // if(size<0.16), weder hochaktiv noch stark gedaemmt
      proto:{ insulation:.21, size:.05, metabolism:.24, photosynthesis:.12, mobility:.11 } },

    { key:"amoebe", k:"Mikrobe", n:"Protist · Amöbe", e:"🔬",
      // if(size<0.28 && struct<0.35), groesser als eine Bakterie
      proto:{ size:.22, photosynthesis:.12, mobility:.13, structure:.19 } },

    { key:"hefe", k:"Pilz", n:"Hefe", e:"🫧",
      // if(metab>0.55 && size<0.35)
      proto:{ size:.27, metabolism:.80, photosynthesis:.12, mobility:.15 } },

    { key:"koralle", k:"Tier", n:"Koralle · Riffbildner", e:"🪸",
      // if(photo>0.28 && struct>0.5 && armor>0.4) — sessiles Tier mit Symbiose-Algen
      proto:{ size:.54, armor:.71, photosynthesis:.37, mobility:.26, structure:.66 },
      requires:{ water:[0.45,1.00], light:[0.20,1.00] } },

    { key:"flechte", k:"Pilz", n:"Flechte · Symbiose", e:"🍥",
      // if(photo>0.28) — Pilz + Alge, aber ohne Riff-Struktur
      proto:{ size:.54, photosynthesis:.38, mobility:.23 } },

    { key:"schwamm", k:"Tier", n:"Schwamm", e:"🧽",
      // if(struct<0.3 && armor<0.3 && metab<0.45 && size>0.38) — sessiler Filtrierer
      proto:{ size:.69, metabolism:.22, armor:.15, photosynthesis:.14, mobility:.20,
              structure:.15 },
      requires:{ water:[0.45,1.00] } },

    { key:"porling", k:"Pilz", n:"Baumpilz · Porling", e:"🪵",
      // if(struct>0.55 && size>0.4)
      proto:{ size:.66, photosynthesis:.11, mobility:.18, structure:.75 } },

    { key:"zunderschwamm", k:"Pilz", n:"Zunderschwamm", e:"🟤",
      // if(armor>0.5), weniger verholzt als der Porling
      proto:{ size:.49, armor:.70, photosynthesis:.16, mobility:.25 } },

    { key:"schimmel", k:"Pilz", n:"Schimmel · Fadenpilz", e:"🧵",
      // if(struct<0.3 && size<0.42), traeger als die Hefe
      proto:{ size:.36, armor:.26, photosynthesis:.14, mobility:.20, structure:.15 } },

    { key:"hutpilz", k:"Pilz", n:"Hutpilz", e:"🍄",
      // if(size>0.45), mittleres Stuetzgewebe
      proto:{ size:.63, armor:.23, photosynthesis:.10, mobility:.18, structure:.38 } },

    { key:"myzel", k:"Pilz", n:"Myzel · Pilzgeflecht", e:"🍂",
      // Auffang-Zweig der Pilze: das Geflecht ohne Fruchtkoerper
      proto:{ size:.32, armor:.25, photosynthesis:.10, mobility:.17, structure:.60 } },

    // ===== Reich PROTISTEN — schwimmen UND Photosynthese (Mischotroph) ==========
    // Kaskaden-Rest: weder rein autotroph-sessil noch rein heterotroph-mobil
    { key:"plankton", k:"Protist", n:"Plankton", e:"✨",
      // if(size<0.2)
      proto:{ size:.08, photosynthesis:.34, mobility:.56 },
      requires:{ water:[0.35,1.00] } },

    { key:"euglenoid", k:"Protist", n:"Euglenoid · Mixotroph", e:"🦠",
      // Auffang-Zweig: der bewegliche Halb-Autotroph
      proto:{ size:.55, photosynthesis:.54, mobility:.58 } },

    // ===== PHASE 1 (2026-07-30, docs/lebensbaum-luecken.md §6 / BACKLOG.md Punkt 10) ====
    // 22 neue Formen fuer 15 Gene, die die Selektion laengst hochzieht, aber bisher KEIN
    // Prototyp benannte (gap-sweep.mjs: burrow 26.7%, nfix 21.8%, filter 18.0% der Umwelten,
    // die 9 Stressor-Gene je 4-5%, biolum nur von 2 Formen genannt). Herkunft der Zahlen:
    // node scratchpad/derive-proto.mjs — Mittelwert ueber erreichbare Genome, die die
    // jeweilige Nischen-Bedingung erfuellen (12000 gemischte Umwelten, 0-2 Stressoren aktiv),
    // gefiltert auf Gene mit sd<0.28 (dieselbe Grund-Methode wie archetype-derive.mjs).
    // Zwei Ausnahmen curatiert statt gemessen (Kommentar an Ort und Stelle): die
    // Seestern/Chamaeleon-Nischen erwiesen sich im Sweep als geometrisch inkohaerent
    // (Treffer verteilten sich auf 3+ voellig verschiedene Bestandsformen) -> geometrische
    // Fenster-Mitte statt verrauschter Mittelwert, exakt der Fall, den ARCHETYPES' eigene
    // Methodik fuer zu wenige/uneindeutige Beispiele vorsieht.

    // ---- Paket A: 9 Extremophile, je ein Stressor-Gen — bewusst NUR das eine Gen im
    // Prototyp (keine Nebengene): jedes der 9 Stressor-Gene ist im Sweep bei aktivem
    // Stressor bei ~0.90-0.96 UND bei jedem anderen Gen ueberlappen alle 9 Nischen nahezu
    // identisch (generische "kleines Wesen"-Werte) — ein Kaskaden-Zweig, der NUR den
    // Stressor abfragt, darf laut ARCHETYPES-Methodik auch nur den Stressor nennen.
    { key:"schwefelbakterie", k:"Mikrobe", n:"Schwefelbakterie · Chemotroph", e:"🌋",
      proto:{ detox:.95 }, requires:{ toxicity:[0.30,1.00] } },
    { key:"salinenkrebs", k:"Tier", n:"Salinenkrebs · Halophil", e:"🧂",
      proto:{ osmo:.96 }, requires:{ salinity:[0.30,1.00] } },
    { key:"schneealge", k:"Pflanze", n:"Schneealge · UV-hart", e:"🍉",
      proto:{ pigment:.95 }, requires:{ uv:[0.30,1.00] } },
    { key:"tiefseeamphipode", k:"Tier", n:"Tiefsee-Amphipode · Druckfest", e:"⚓",
      proto:{ baro:.96 }, requires:{ pressure:[0.30,1.00] } },
    { key:"baertierchen", k:"Tier", n:"Bärtierchen · Anhydrobiont", e:"🥟",
      proto:{ desicc:.95 }, requires:{ aridity:[0.30,1.00] } },
    { key:"deinococcus", k:"Mikrobe", n:"Deinococcus · Strahlenfest", e:"🔴",
      proto:{ radres:.92 }, requires:{ radiation:[0.30,1.00] } },
    { key:"feuerkaefer", k:"Tier", n:"Feuerkäfer · Pyrophil", e:"🪲",
      proto:{ fireres:.96 }, requires:{ fire:[0.30,1.00] } },
    { key:"frostspanner", k:"Tier", n:"Frostspanner · Winterfalter", e:"🌙",
      proto:{ frostres:.94 }, requires:{ frost:[0.30,1.00] } },
    { key:"krummholz", k:"Pflanze", n:"Krummholz · Windzwerg", e:"🎋",
      proto:{ windres:.95 }, requires:{ wind:[0.30,1.00] } },

    // ---- Paket B: 5 Nischen-Gene-Formen (burrow/filter/biolum) — Knöllchenbakterium
    // (nfix) GEMESSEN UND WIEDER ENTFERNT, s. Befund unten am Wühler-Eintrag.
    { key:"wuehler", k:"Tier", n:"Wühler · Grabtier", e:"🕳️",
      // requires predation (NACHTRAG nach Regressionsmessung, 2026-07-30): burrow ist wie
      // nfix ein "opportunistisches" Gen (laeuft laut gap-sweep.mjs bei 26.7% ALLER
      // Umwelten hoch, auch ohne Raeuberdruck). ANDERS als nfix korreliert burrow aber
      // ECHT mit predation (engine/fitness.ts: burrow traegt nur zur Verteidigung bei,
      // predSurvival gewichtet defenseScore MIT env.predation — bei niedrigem Raeuberdruck
      // ist Graben reine Wartungslast ohne Nutzen). Gemessen (node tools/research/archetype-transition-check.mjs (Diagnose-Variante)):
      // Median-Praedation der Wühler-Treffer lag schon VOR diesem Gate bei 0.72, nur 11%
      // hatten predation<0.4 — die predation-Anforderung schaerft eine bereits reale
      // Korrelation, statt eine fehlende zu erzwingen. Erreichbarkeit blieb bei ~5%,
      // Fell-Warmblüter/Reptil/Kleines flinkes Tier NICHT unter ihre alte Erreichbarkeit
      // gedrueckt (node tools/research/archetype-transition-check.mjs bestaetigt).
      proto:{ size:.27, limbLength:.67, metabolism:.89, armor:.06, mobility:.94,
              structure:.23, burrow:.84 }, requires:{ water:[0.00,0.50], predation:[0.40,1.00] } },
    // Knöllchenbakterium (Stickstoff-Mikrobe, nfix) — GEBAUT, GEMESSEN, WIEDER ENTFERNT
    // (2026-07-30, node tools/research/archetype-transition-check.mjs): anders als burrow hat
    // nfix zwar auch einen echten Umwelt-Treiber (engine/fitness.ts: Ertrag skaliert mit
    // (1-foodAbundance), Naehrstoffarmut lohnt N-Fixierung) — aber der Ertrag ist NIE null
    // (nfixBase=0.2 auch bei foodAbundance=1), nfix drueckt also IMMER leicht nach oben,
    // nicht nur unter Not. Ein Prototyp, der nfix nennt, aber sonst (Groesse/Photosynthese/
    // Mobilitaet) fast identisch zu Bakterie ist, gewann dadurch jeden Bakterie-Bauplan mit
    // nur leicht erhoehtem nfix — auch mit requires-Fenster (foodAbundance<0.30) und
    // proto-Schwelle nfix:.97 blieb Bakterie bei 0.8%/Archaee bei 1.4% (vorher 9.5%/9.9%),
    // eine Erreichbarkeits-Kollision, die die zwei haeufigsten Formen des Baums in die
    // "sehr selten"-Stufe gedrueckt haette. Entfernt statt live geschickt — deckt sich mit
    // dem bereits in BACKLOG.md Punkt 6 dokumentierten Befund: "nfix ... der binaere Kern/
    // Kosten-Anker ist dafuer zu grob", eine Struktur-, keine Namensfrage. Ohne den Eintrag
    // erholten sich Bakterie auf 5.0%, Archaee auf 4.7% (node tools/research/archetype-transition-check.mjs).
    { key:"bartenwal", k:"Tier", n:"Bartenwal · Filtrierschwimmer", e:"🐋",
      proto:{ size:.85, limbLength:.17, metabolism:.99, armor:.04, mobility:.96,
              structure:.66, filter:.82 }, requires:{ water:[0.50,1.00] } },
    { key:"muschel", k:"Tier", n:"Muschel · Sessiler Filtrierer", e:"🦪",
      proto:{ armor:.16, mobility:.15, filter:.90 }, requires:{ water:[0.40,1.00] } },
    { key:"krill", k:"Tier", n:"Krill · Filtrierendes Kleinstwesen", e:"🦐",
      // nfix im Sweep-Mittel spurios hoch (Artefakt der "winzig"-Nische, s. Knoellchenbakterium)
      // — real fixiert Krill keinen Stickstoff, bewusst nicht uebernommen (Kuration).
      proto:{ size:.07, filter:.87 }, requires:{ water:[0.40,1.00] } },
    { key:"hallimasch", k:"Pilz", n:"Hallimasch · Leuchtpilz", e:"💡",
      proto:{ size:.23, photosynthesis:.10, mobility:.10, biolum:.91 },
      requires:{ light:[0.00,0.30] } },

    // ---- Paket C: 7 Bauplan-Verfeinerungen ----
    { key:"robbe", k:"Tier", n:"Robbe · Meeressäuger", e:"🦭",
      // filter bewusst NICHT uebernommen (Sweep-Mittel 0.71) — sonst nicht von Bartenwal
      // unterscheidbar; Robbe ist der NICHT-filtrierende Meeressaeuger (Einzeljagd).
      proto:{ insulation:.90, size:.75, limbLength:.12, metabolism:.95, armor:.08,
              mobility:.95 }, requires:{ water:[0.50,1.00] } },
    { key:"seestern", k:"Tier", n:"Seestern · Stachelhäuter", e:"⭐",
      // KURATIERT statt gemessen: der Sweep-Filter (armor>.5, limb>.45, mob<.55, water>.4)
      // erwies sich als geometrisch inkohaerent — Treffer verteilten sich auf Koralle (33%),
      // Euglenoid (21%) UND Zunderschwamm (13%), drei verschiedene Reiche/Kaskaden-Aeste,
      // kein einheitlicher Attraktor. Werte = Fenster-Mitte der eigenen Filterbedingung.
      // requires water auf 0.55 angehoben (NACHTRAG Phase 2, 2026-07-30): Seesterne sind
      // marin, kein Land/Wasser-Uebergangstier. Mit dem neuen energyAmphibious-Kanal
      // (schmale Nische um aquaticWaterFloor=0.5) fing Seestern faelschlich das GESAMTE
      // Uebergangsband (water 0.42-0.72) — genau die Nische, die eigentlich Amphibie
      // erreichbar machen sollte (gemessen: node scratchpad/moderwald-refix.mjs). Ab 0.55
      // (klar oberhalb des Bandes) bleibt Seestern echtes Meerestier, Amphibie bekommt
      // ihre eigene schmale Nische zurueck.
      proto:{ size:.35, limbLength:.45, armor:.55, mobility:.35 },
      requires:{ water:[0.55,1.00] } },
    { key:"laufvogel", k:"Tier", n:"Laufvogel · Strauß", e:"🦤",
      // burrow im Sweep-Mittel spurios hoch (0.75) — Artefakt aus hoher Raeuberdruck-
      // Selektion in denselben Umwelten, nicht Teil des Laufvogel-Bauplans (Kuration).
      proto:{ size:.55, limbLength:.90, metabolism:.95, armor:.08, mobility:.95, wing:.05 },
      requires:{ water:[0.00,0.50] } },
    { key:"methanogen", k:"Mikrobe", n:"Methanogenes Archaeon · Anaerobier", e:"⚫",
      proto:{ metabolism:.85, oxyEff:.94 }, requires:{ oxygen:[0.00,0.50] } },
    { key:"erle", k:"Pflanze", n:"Erle · Knöllchen-Pflanze", e:"🍃",
      // size mittig zwischen Strauch (.24) und Laubbaum (.82) verankert, sonst waere die
      // Form von beiden Nachbarn ueberdeckt und nie ueber nfix erreichbar.
      proto:{ photosynthesis:.90, structure:.85, size:.55, nfix:.85 },
      requires:{ water:[0.05,0.70] } },
    { key:"mammutbaum", k:"Pflanze", n:"Mammutbaum · Riesenpflanze", e:"🗼",
      // nfix im Sweep-Mittel spurios hoch (0.92, derselbe "grosse Pflanze"-Artefakt wie bei
      // Erle) — real kein Merkmal von Mammutbaeumen, nicht uebernommen (Kuration).
      proto:{ size:.97, photosynthesis:.95, structure:.98, armor:.16 },
      requires:{ water:[0.05,0.65] } },
    { key:"chamaeleon", k:"Tier", n:"Chamäleon · Tarnjäger", e:"👁️",
      // KURATIERT statt gemessen: der Sweep-Filter (camo>.55, mob>.4) fing ueberwiegend
      // grosse schnelle Wasser-/Landjaeger (Fisch 75%, Grossjaeger 24%) — das Gegenteil
      // eines Lauerjaegers. Ein echter Tarnjaeger bewegt sich WENIG (Stille als Tarnung),
      // daher mobility hier bewusst niedrig statt des verrauschten Sweep-Mittels (0.88).
      proto:{ size:.35, mobility:.30, camo:.70 } },
  ],

  // ---- Wortschatz fuer NEUARTIGE Bauplaene ---------------------------------
  // Passt kein Prototyp (Abstand > novelThreshold), wird KEINE Form erzwungen. Der Name
  // entsteht dann aus den ein bis zwei selektionsrelevantesten Abweichungen: ein
  // Adjektiv („Gepanzert-"), ein Kompositions-Stamm („Leucht") und ein Bauplan-Grundwort
  // („Schwimmer") — z. B. „Gepanzerter Leuchtschwimmer". `adj` ist der ungebeugte Stamm;
  // die Endung (-er maskulin / -es neutrum) kommt vom Grundwort.
  novel: {
    axes: [
      { gene:"armor",          dir:"hi", adj:"Gepanzert",     stem:"Panzer" },
      { gene:"biolum",         dir:"hi", adj:"Leuchtend",     stem:"Leucht" },
      { gene:"insulation",     dir:"hi", adj:"Pelzig",        stem:"Fell" },
      { gene:"wing",           dir:"hi", adj:"Geflügelt",     stem:"Flügel" },
      { gene:"structure",      dir:"hi", adj:"Verholzt",      stem:"Holz" },
      { gene:"limbLength",     dir:"hi", adj:"Langgliedrig",  stem:"Glieder" },
      { gene:"photosynthesis", dir:"hi", adj:"Ergrünt",       stem:"Blatt" },
      { gene:"size",           dir:"hi", adj:"Riesig",        stem:"Riesen" },
      { gene:"size",           dir:"lo", adj:"Winzig",        stem:"Zwerg" },
      { gene:"metabolism",     dir:"hi", adj:"Hochaktiv",     stem:"Glut" },
      { gene:"metabolism",     dir:"lo", adj:"Träg",          stem:"Schlaf" },
      { gene:"mobility",       dir:"hi", adj:"Rastlos",       stem:"Renn" },
      { gene:"filter",         dir:"hi", adj:"Filtrierend",   stem:"Filter" },
      { gene:"camo",           dir:"hi", adj:"Getarnt",       stem:"Tarn" },
      { gene:"burrow",         dir:"hi", adj:"Grabend",       stem:"Grab" },
      { gene:"sense",          dir:"hi", adj:"Spürend",       stem:"Spür" },
      { gene:"detox",          dir:"hi", adj:"Giftfest",      stem:"Gift" },
      { gene:"osmo",           dir:"hi", adj:"Salzfest",      stem:"Salz" },
      { gene:"pigment",        dir:"hi", adj:"Sonnenhart",    stem:"Sonnen" },
      { gene:"baro",           dir:"hi", adj:"Druckfest",     stem:"Tief" },
      { gene:"desicc",         dir:"hi", adj:"Dürrefest",     stem:"Dürre" },
      { gene:"radres",         dir:"hi", adj:"Strahlenfest",  stem:"Strahlen" },
      { gene:"fireres",        dir:"hi", adj:"Brandfest",     stem:"Brand" },
      { gene:"frostres",       dir:"hi", adj:"Frostfest",     stem:"Frost" },
      { gene:"windres",        dir:"hi", adj:"Sturmfest",     stem:"Sturm" },
      { gene:"oxyEff",         dir:"hi", adj:"Zehrarm",       stem:"Atem" },
      { gene:"nfix",           dir:"hi", adj:"Selbstdüngend", stem:"Dünger" },
    ],
    // Bezugswert fuer „Abweichung", wenn der naechste Prototyp zu diesem Gen gar nichts
    // sagt: der Ruhewert eines ungenutzten Gens (vgl. PARAMS.mutationAnchor = 0.12 fuer
    // die 15 bedingten Gene) bzw. die neutrale Mitte fuer die 10 Kern-Gene.
    silentCore: 0.50,
    silentCond: 0.15,
    // Grundwort nach Bauplan, mit Geschlecht fuer die Adjektiv-Endung.
    nouns: {
      flieger:  { w:"Flieger",     g:"m" },   // Fluegelflaeche hoch, an Land/in der Luft
      schwimmer:{ w:"Schwimmer",   g:"m" },   // mobil im tiefen Wasser, ohne Gliedmassen
      laeufer:  { w:"Läufer",      g:"m" },   // mobil mit Gliedmassen
      kriecher: { w:"Kriecher",    g:"m" },   // mobil ohne Gliedmassen
      mischling:{ w:"Mischzeller", g:"m" },   // winzig, Photosynthese UND Mobilitaet
      gewaechs: { w:"Gewächs",     g:"n" },   // sessil + Photosynthese
      geflecht: { w:"Geflecht",    g:"n" },   // sessil, heterotroph
      zeller:   { w:"Zeller",      g:"m" },   // sessil, winzig
    },
    fallback: "Unbestimmtes Wesen",
  },
};
