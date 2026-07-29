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
// (4) Die 15 bedingten Gene (Index 10..24: Stressor-Resistenzen, Nischen-Mechaniken)
//     tauchen in keinem Prototyp auf — die alte Kaskade hat sie nie angesehen, und ohne
//     ihren Stressor driften sie frei (gemessen: ~64 % des rohen 25-D-Abstands ist dieses
//     Driftrauschen). Sie wirken trotzdem: ueber die Selektionsgewichte (in einer giftigen
//     Welt wird „Entgiftung" identitaetsstiftend) und ueber die unerklaerte Merkmalslast.
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
          "desicc","radres","fireres","frostres","windres","nfix"],

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
      proto:{ insulation:.12, size:.82, armor:.21, photosynthesis:.86, mobility:.10,
              structure:.89 } },

    { key:"strauch", k:"Pflanze", n:"Verholzter Strauch", e:"🪴",
      // if(struct>0.55), aber nicht gross genug fuer einen Baum
      proto:{ insulation:.18, size:.24, armor:.15, photosynthesis:.83, mobility:.10,
              structure:.83 } },

    { key:"bluetenkraut", k:"Pflanze", n:"Blütenkraut", e:"🌸",
      // if(photo>0.75 && struct<0.42)
      proto:{ insulation:.30, armor:.25, photosynthesis:.87, mobility:.20, structure:.24 } },

    { key:"farn", k:"Pflanze", n:"Farn", e:"🌿",
      // if(struct<0.42 && size>0.35), photo<=0.75
      proto:{ insulation:.30, size:.70, armor:.25, photosynthesis:.60, mobility:.20,
              structure:.22 } },

    { key:"kraut", k:"Pflanze", n:"Kraut · niedrige Pflanze", e:"☘️",
      // Auffang-Zweig der Pflanzen
      proto:{ insulation:.30, armor:.25, photosynthesis:.71, mobility:.20, structure:.47 } },

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
