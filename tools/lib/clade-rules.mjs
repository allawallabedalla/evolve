// Kladen-Regelwerk — Stufe (b) der Platzierungs-Methode
// (BACKLOG Punkt 12, Schritt 1.2 · docs/artenkatalog-plan.md Abschnitt 5).
//
// AUFGABE. Aus der Elterntaxon-Kette (P171) eines realen Lebewesens Gen-Werte
// ableiten. Reine Datentabelle + Zuordnungsfunktion: deterministisch, offline,
// kein Netz, kein LLM zur Laufzeit (Plan Abschnitt 2, „Kein LLM in der
// Datenpipeline“). Zweimal aufgerufen -> bitgleiches Ergebnis.
//
// -----------------------------------------------------------------------------
// WARUM DIESE STUFE DIE LAST TRAEGT
//
// Die Messung in Plan-Abschnitt 5a hat gezeigt: Wikidata ist ein Namens- und
// Verweis-Register, keine Merkmalsdatenbank (Masse bei 6 % der Saeuger, Habitat
// bei 8 %). Stufe (a) — direkte Merkmale — traegt also fast nichts. Was zu 100 %
// da ist, ist die Elterntaxon-Kette. Genau darauf setzt dieses Modul auf.
//
// -----------------------------------------------------------------------------
// SCHNITTSTELLE UND KONVENTIONEN
//
//   applyCladeRules(lineageQids, rank, opts) -> Ergebnisobjekt (s. u.)
//
// REIHENFOLGE DER KETTE IST EGAL. Eine Regel greift ueber MENGENZUGEHOERIGKEIT
// („kommt diese QID in der Kette vor?“), nicht ueber die Position im Array. Die
// Spezifitaet steht als `level` in der Regel selbst. Damit funktioniert das Modul
// mit der Konvention aus tools/build-catalog.mjs (naechster Vorfahr zuerst,
// Wurzel zuletzt) genauso wie mit umgekehrter oder unsortierter Kette — und es
// bleibt robust, wenn eine Ernte die Kette einmal anders herum liefert.
//   Empfohlen (und im Pruefstand so benutzt): die Kette DARF die QID des Taxons
//   selbst als erstes Element enthalten. Nur so greifen die wenigen Regeln, die
//   auf einer Gattung sitzen (z. B. Q159525 Salicornia), auch fuer den Eintrag
//   dieser Gattung selbst.
//
// `level` = ORDNUNGSZAHL DER SPEZIFITAET, KEINE LINNE-RANGSTUFE. Verbindlich ist
// nur die Relation: liegt Regel A in einer echten P171-Kette OBERHALB von B, muss
// level(A) < level(B) gelten. Bei Konflikt gewinnt die groessere Zahl. Als grobe
// Orientierung: 1 Reich · 3 Stamm/Abteilung · 4 Klasse · 5 Ordnung · 6 Unterordnung
// · 7 Familie · 8 Unterfamilie · 9 Gattung. Die Relation wird nicht behauptet,
// sondern in tools/clade-rules-check.mjs (Pruefung R3) gegen 135 echte
// Wikidata-Ketten nachgerechnet — Wikidatas Baum haelt sich naemlich NICHT an Linne:
// Q1390 Insecta haengt dort UNTER Q25364 Crustacea.
//
// KEINE UEBERSCHREIBUNG HOEHERER KONFIDENZ. Diese Funktion entscheidet NICHT,
// ob ihr Wert einen gemessenen Wert aus Stufe (a) verdraengen darf. Sie liefert
// Konfidenz 2 und ueberlaesst die Entscheidung dem Aufrufer in Schritt 1.3
// (Plan Abschnitt 5, „(b) darf nicht ueberschreiben, was (a) gemessen hat“).
//
// -----------------------------------------------------------------------------
// WERTSKALA — WORAN DIE ZAHLEN GEEICHT SIND
//
// Alle Gene liegen in [0,1]. Der RUHEWERT (kein Selektionsdruck) ist
// PARAMS.mutationAnchor aus app/index.html: 0.5 fuer die Gene 0..9, 0.12 fuer die
// 15 bedingten Stressor-Gene 10..24. Ein Gen, zu dem KEINE Regel etwas sagt,
// bleibt hier `null` — der Aufrufer setzt es auf den Ruhewert (Konfidenz 0) oder
// imputiert es (Stufe c). Deshalb ist es KEINE Kleinigkeit, ein irrelevantes Gen
// der ersten Zehnergruppe unbelegt zu lassen: `wing` bliebe bei 0.5 und kostete
// einen Baumpilz 0.16*0.5 Unterhalt fuer Fluegel, die er nie hatte. Darum setzen
// die Reich-Regeln `wing`/`biolum`/`limbLength` auch dort ausdruecklich auf ~0,
// wo sie „selbstverstaendlich“ null sind.
//
// Geeicht an den 65 Bauplan-Prototypen in app/archetypes.js (deren Zahlen selbst
// gemessen sind, s. Kopfkommentar dort) — nicht frei geraten. Ankerpunkte:
//   size        0.05 Bakterie · 0.15 Insekt · 0.26 Kleinsaeuger · 0.55 Laufvogel
//               · 0.68 Koloss · 0.85 Blauwal · 0.97 Mammutbaum
//   insulation  0.83 Fell-Warmblueter · 0.50 Nadelbaum · 0.12 Laubbaum
//   mobility    0.88 Fisch · 0.80 Landtier · 0.20 Alge · 0.10 Laubbaum
//   structure   0.89 Laubbaum · 0.60 Myzel · 0.38 Hutpilz · 0.16 Gruenalge
//   armor       0.76 Sukkulente/Kaktus · 0.71 Krebstier · 0.10 Fisch
//
// -----------------------------------------------------------------------------
// WAS DIE GENE IN DER SIMULATION WIRKLICH TUN (aus engine/fitness.ts, physics.json
// nachgelesen — die Namen allein sind irrefuehrend, und genau daran waere dieses
// Regelwerk sonst gescheitert):
//
//   insulation  Waermehaltung, ABER effInsulation = insulation * endoFactor(metabolism)
//               * (1 - insulWaterLoss*water), und insulWaterLoss ist 1.0: im Wasser
//               ist Isolation VOLLSTAENDIG wirkungslos und dann reine Kostenlast.
//               Darum bekommen Wale hier KEINEN hohen Wert, obwohl sie Speck haben.
//   size        zahlt auf Photosynthese (Blattflaeche), Reichweite und Verteidigung
//               ein, kostet am meisten von allen Genen (m.size 0.22), gibt aber ueber
//               die Kleibersche Allometrie Rabatt auf die Stoffwechselkosten.
//   limbLength  Reichweite NUR an Land; im Wasser reiner Widerstand (aquaticLimbDrag
//               0.7). Zweitens Teil von insectShape (Substrat-Traktion).
//   metabolism  Multiplikator auf Jagd, Absorption, Aquatik und Flug; Voraussetzung
//               dafuer, dass Isolation ueberhaupt wirkt (endothermyMetabFloor 0.5).
//               Quadratische Grenzkosten.
//   armor       Verteidigung (defenseFromArmor 0.46), im Wasser Widerstand
//               (aquaticArmorDrag 0.5), quadratische Grenzkosten.
//   photosynthesis  Autotrophie; SCHLIESST Mobilitaet aus (exclusion 0.8) und
//               umgekehrt. Ein „mobiler Photosynthetiker“ ist in dieser Physik
//               ein schlechter Kompromiss, kein Bonus — Mixotrophe zahlen dafuer.
//   mobility    Traeger von Jagd/Aquatik; schliesst Photosynthese UND Absorption aus.
//               Sessile Tiere (Koralle, Muschel, Seepocke) brauchen darum NIEDRIGE
//               Mobilitaet, sonst verlieren sie ihren eigenen Energieweg.
//   structure   Lichtzugang der Pflanze (nur bei vertikaler Konkurrenz) plus
//               Verteidigung. Bei Tieren nur Verteidigung.
//   wing        Flug nur bei kleiner Masse (flightSizePenalty 1.5) und hohem
//               Stoffwechsel, und nur an Land/in der Luft.
//   biolum      wirkt NUR unterhalb biolumDarkFloor (light < 0.3) — Tiefsee/Hoehle.
//   detox/oxyEff/osmo/pigment/baro/desicc/radres/fireres/frostres/windres
//               reine Stressor-Neutralisierer: ohne den Stressor NUR Kosten. Sie
//               werden hier nur gesetzt, wo eine Klade den Stressor per Definition
//               traegt (Halophile, Flechten, Endosporenbildner …).
//   burrow      Verteidigung durch Flucht in den Bau; braucht Land UND Mobilitaet.
//   filter      Suspensionsfressen; braucht Wasserkoerper, KEINE Mobilitaet — der
//               Energieweg der sessilen Filtrierer.
//   sense       hebt die WAHRGENOMMENE Nahrungsdichte, wirkt nur bei Knappheit.
//   nfix        Naehrstoff-Erschliessung, zahlt sich nur bei ARMUT aus und
//               schliesst Mobilitaet aus.
//
// -----------------------------------------------------------------------------
// EHRLICHKEIT UEBER DIE GRENZEN (Plan Abschnitt 5a, „muss so berichtet werden“)
//
// · Sehr diverse Kladen bekommen WENIGE Gene, nicht geratene 25. Zu „Insekten“
//   pauschal laesst sich Groesse, Gliedmasse und Ektothermie sagen — zu Fluegeln
//   erst eine Ebene tiefer, weil Ameisen und Floehe sekundaer fluegellos sind.
// · Osmoregulation wird nur fuer Kladen gesetzt, die AUSNAHMSLOS marin sind
//   (Stachelhaeuter, Kopffuesser, Seegras, Halobacteria). Fuer „ueberwiegend
//   marine“ Kladen steht ein mittlerer Wert, der ausdruecklich ein Klassenmittel
//   ist und den Stufe (d) je Art korrigieren soll.
// · Parasitismus hat in dieser Physik KEINEN Energieweg. Vollparasiten (Cuscuta,
//   Rafflesiaceae, Rostpilze) landen deshalb an einer Stelle, an der die Engine
//   sie nicht belohnen kann. Das ist bewusst nicht wegdefiniert — es ist genau
//   das Signal, das der Abdeckungs-Report in Phase 3.1 einsammeln soll.
// · Die Abbildung Masse -> `size` (Stufe a) ist hier NICHT enthalten. Sie braucht
//   eine eigene Eichung gegen sizeClassOf() in engine/development.ts und eine
//   Merkmalsquelle aus Schritt 1.1b; `kleiberDecades` ist ein Kosten-Tuning-
//   Parameter und ausdruecklich nicht die Massenskala.
//
// -----------------------------------------------------------------------------
// HERKUNFT DER QIDs
//
// JEDE QID unten ist gegen Wikidata geprueft — entweder ueber P225 (exakter
// Taxonname) oder dadurch, dass sie in einer echten, vollstaendig abgelaufenen
// P171-Kette einer realen Art auftaucht. Geraten wurde keine. Zwei Funde aus
// dieser Pruefung, die man aus dem Gedaechtnis nicht haette wissen koennen:
//   · Es gibt DREI parallele Bedecktsamer-Items (Q25314, Q14562931, Q14832431),
//     je nach Backbone. Eine Regel auf nur einem davon greift bei zwei Dritteln
//     der Bluetenpflanzen nicht.
//   · Q80005 („Farne“, eine der 25 Wurzel-Kladen in tools/wikidata-harvest.mjs)
//     ist gar kein Taxon-Item: kein P225, kein P171. Die echten Farn-Knoten sind
//     Q373615 Polypodiopsida und Q178249 Pteridophyta. Q80005 steht hier
//     trotzdem mit drin, damit die Wurzel-Klade abgedeckt ist, falls die Ernte
//     sie doch einmal in eine Kette schreibt.

// ---------------------------------------------------------------------------
// Gen-Namen — Reihenfolge IDENTISCH zu app/archetypes.js `genes`, physics.json
// `traits` und engine/types.ts TRAITS. Eine Verschiebung wuerde jede Position
// still verdrehen; tools/clade-rules-check.mjs prueft das (G1).
export const GENES = [
  "insulation", "size", "limbLength", "metabolism", "armor", "photosynthesis",
  "mobility", "structure", "wing", "biolum", "detox", "oxyEff", "osmo", "burrow",
  "pigment", "filter", "camo", "baro", "sense", "desicc", "radres", "fireres",
  "frostres", "windres", "nfix",
];

export const GENE_INDEX = Object.fromEntries(GENES.map((g, i) => [g, i]));

/** Ruhewert je Gen (PARAMS.mutationAnchor, app/index.html) — der Wert, den ein
 *  Gen ohne jede Aussage annimmt. Hier nur zur Dokumentation exportiert; dieses
 *  Modul fuellt NICHTS damit auf (das ist Aufgabe von Schritt 1.3). */
export const RESTING = GENES.map((_, i) => (i < 10 ? 0.5 : 0.12));

/** Konfidenz, mit der dieses Modul arbeitet (Plan Abschnitt 4). */
export const CLADE_CONFIDENCE = 2;

// ===========================================================================
// DAS REGELWERK
//
// Felder je Regel:
//   qid     QID oder Array von QIDs (mehrere = parallele/synonyme Wikidata-Items
//           oder Schwester-Familien mit identischem Bauplan)
//   sci     wissenschaftlicher Name (zur Lesbarkeit; nicht Teil der Zuordnung)
//   de      deutscher Name
//   level   Spezifitaet, groesser gewinnt (s. Kopfkommentar)
//   genes   die gesetzten Gene — NUR die, zu denen die Klade wirklich etwas sagt
//   reason  WARUM diese Werte. Pflichtfeld; tools/clade-rules-check.mjs (R1)
//           laesst keine Regel ohne Begruendung durch.
// ===========================================================================

export const CLADE_RULES = [
  // =========================================================================
  // REICHE — die Grundaussage. Setzt vor allem die Gene der ersten Zehnergruppe,
  // die sonst bei 0.5 als teurer Phantom-Unterhalt haengen blieben.
  // =========================================================================
  {
    qid: "Q729", sci: "Animalia", de: "Tiere", level: 1,
    genes: { photosynthesis: 0.10, mobility: 0.70, structure: 0.25, wing: 0.04, biolum: 0.04 },
    reason: "Heterotrophie plus Ortsbewegung ist die Definition des Tierbauplans; der exclusion-Term (0.8) macht Photosynthese und Mobilitaet unvereinbar, also muss eines von beiden nahe null liegen — Fluegel und Leuchtorgane sind dagegen seltene Sonderfaelle und wuerden bei 0.5 nur Unterhalt kosten.",
  },
  {
    qid: "Q756", sci: "Plantae", de: "Pflanzen", level: 1,
    genes: { photosynthesis: 0.82, mobility: 0.06, metabolism: 0.25, insulation: 0.15,
             limbLength: 0.04, wing: 0.02, biolum: 0.02, armor: 0.20 },
    reason: "Spiegelbild des Tierbauplans: Autotrophie zahlt nur bei sessiler Lebensweise (exclusion), und Stoffwechsel zahlt in dieser Physik ausschliesslich auf Jagd/Absorption/Flug ein — fuer eine Pflanze ist er reine Kostenlast, ebenso Gliedmassen, Fluegel und Leuchten.",
  },
  {
    qid: "Q764", sci: "Fungi", de: "Pilze", level: 1,
    genes: { photosynthesis: 0.08, mobility: 0.10, metabolism: 0.55, structure: 0.35,
             insulation: 0.10, limbLength: 0.04, wing: 0.02, biolum: 0.02 },
    reason: "Osmotrophie ist der dritte Energieweg der Physik (energyAbsorb) und verlangt ausdruecklich BEIDES — heterotroph UND sessil; ihr Ertragshebel ist der Stoffwechsel (absorbBase 0.4 + 0.85*metabolism), weil extrazellulaere Enzyme die eigentliche Verdauungsleistung sind.",
  },
  {
    qid: "Q10876", sci: "Bacteria", de: "Bakterien", level: 1,
    genes: { size: 0.05, insulation: 0.15, metabolism: 0.35, mobility: 0.11,
             photosynthesis: 0.10, structure: 0.10, armor: 0.15, limbLength: 0.03,
             wing: 0.02, biolum: 0.02 },
    reason: "Einzellig und mikrometrisch — der Prototyp „Bakterie“ in app/archetypes.js sitzt gemessen bei size 0.05, mobility 0.11; bei dieser Groesse gibt die Kleibersche Allometrie keinen Rabatt, ein hoher Stoffwechsel waere also unbezahlbar.",
  },
  {
    qid: "Q10872", sci: "Archaea", de: "Archaeen", level: 1,
    genes: { size: 0.05, insulation: 0.12, metabolism: 0.35, mobility: 0.10,
             photosynthesis: 0.08, structure: 0.10, armor: 0.15, limbLength: 0.03,
             wing: 0.02, biolum: 0.02, oxyEff: 0.55 },
    reason: "Wie Bakterien im Bauplan, aber mit erhoehter Sauerstoff-Effizienz: der weit ueberwiegende Teil der beschriebenen Archaeen lebt anaerob oder mikroaerophil, und oxyEff ist in dieser Physik genau der Puffer gegen Unterversorgung (hypoxiaSeverity 0.9).",
  },

  // =========================================================================
  // TIERE — Staemme und Unterstaemme
  // =========================================================================
  {
    qid: "Q25241", sci: "Vertebrata", de: "Wirbeltiere", level: 3,
    genes: { structure: 0.40, sense: 0.55, limbLength: 0.40, size: 0.40, mobility: 0.75,
             metabolism: 0.50, armor: 0.12 },
    reason: "Das Innenskelett ist Stuetzgewebe ohne Wasserwiderstand (anders als Panzer) und zahlt auf defenseFromStructure ein; hochentwickelte Fernsinne sind der gemeinsame Nenner aller Wirbeltiere und heben ueber senseForage die wahrgenommene Nahrungsdichte.",
  },
  {
    // Level 2 und NICHT 3: in Wikidata haengt Q25364 Crustacea unter Q1360 Arthropoda,
    // die Krebstier-Regel muss also spezifischer sein duerfen als diese hier.
    qid: "Q1360", sci: "Arthropoda", de: "Gliederfuesser", level: 2,
    genes: { armor: 0.50, limbLength: 0.70, size: 0.15, structure: 0.15, insulation: 0.04,
             photosynthesis: 0.08, metabolism: 0.40, wing: 0.03, biolum: 0.04, sense: 0.40 },
    reason: "Aussenskelett aus Chitin und gegliederte Extremitaeten sind die namensgebenden Merkmale; das Aussenskelett begrenzt zugleich die Koerpergroesse, weil Haeutung und Diffusionsatmung mit der Masse nicht mitskalieren.",
  },
  {
    qid: "Q25364", sci: "Crustacea", de: "Krebstiere", level: 3,
    genes: { armor: 0.55, limbLength: 0.65, size: 0.20, mobility: 0.55, osmo: 0.50,
             metabolism: 0.40, structure: 0.15, insulation: 0.04, photosynthesis: 0.08,
             wing: 0.02, biolum: 0.05, sense: 0.40 },
    reason: "Kalkeingelagerter Panzer und ueberwiegend marines Leben; der mittlere Osmo-Wert ist ausdruecklich ein Klassenmittel zwischen Meer und Suesswasser, das Stufe (d) je Art korrigieren soll. ACHTUNG: In Wikidata haengt Q1390 Insecta UNTER dieser Klade — die Insekten-Regel muss deshalb hoehere Spezifitaet tragen und tut es (level 4).",
  },
  {
    qid: "Q25326", sci: "Mollusca", de: "Weichtiere", level: 3,
    genes: { armor: 0.55, mobility: 0.35, limbLength: 0.10, structure: 0.25, size: 0.20,
             insulation: 0.04, photosynthesis: 0.08, metabolism: 0.35, wing: 0.02,
             biolum: 0.05, osmo: 0.45 },
    reason: "Die Kalkschale ist der Grundbauplan und in dieser Physik ein Verteidigungsgewinn, der im Wasser mit Widerstand bezahlt wird (aquaticArmorDrag 0.5) — daher der zugleich niedrige Mobilitaetswert; der weichhaeutige Fuss ist keine Gliedmasse im Sinne von limbLength.",
  },
  {
    qid: "Q25522", sci: "Annelida", de: "Ringelwuermer", level: 3,
    genes: { limbLength: 0.08, armor: 0.10, size: 0.12, mobility: 0.55, structure: 0.08,
             burrow: 0.65, insulation: 0.03, photosynthesis: 0.08, metabolism: 0.35,
             wing: 0.02, biolum: 0.05, camo: 0.30 },
    reason: "Der wurmfoermige, hydrostatisch gestuetzte Koerper ohne Skelett und ohne Panzer ist ein Grabkoerper; burrow ist in dieser Physik die billige Verteidigung ohne Panzer-Widerstand und damit genau die oekologische Antwort dieses Bauplans.",
  },
  {
    qid: "Q25441", sci: "Cnidaria", de: "Nesseltiere", level: 3,
    genes: { mobility: 0.20, filter: 0.55, armor: 0.25, limbLength: 0.10, structure: 0.35,
             size: 0.25, osmo: 0.60, photosynthesis: 0.15, biolum: 0.25, insulation: 0.03,
             metabolism: 0.25, wing: 0.02, sense: 0.15 },
    reason: "Zweischichtige Tiere ohne Zentralnervensystem, die Beute aus dem Wasser fangen statt sie zu erjagen — das ist der Filter-Energieweg, der ausdruecklich OHNE Mobilitaet funktioniert; Nesseltiere sind ausserdem die haeufigsten Traeger mariner Biolumineszenz und fast ausnahmslos Meeresbewohner.",
  },
  {
    qid: "Q44631", sci: "Echinodermata", de: "Stachelhaeuter", level: 3,
    genes: { armor: 0.60, mobility: 0.25, limbLength: 0.35, structure: 0.45, size: 0.30,
             osmo: 0.70, insulation: 0.03, photosynthesis: 0.08, metabolism: 0.20,
             wing: 0.02, biolum: 0.08, sense: 0.15 },
    reason: "Kalkiges Innenskelett aus Ossikeln und Wassergefaesssystem statt Muskelkraft — langsam und gut gepanzert; der hohe Osmo-Wert ist hier KEIN Klassenmittel, sondern hart begruendet: es gibt keinen einzigen Suesswasser-Stachelhaeuter, alle sind reine Osmokonformer im Meerwasser.",
  },

  // ------------------------------- Saeugetiere -------------------------------
  {
    qid: "Q7377", sci: "Mammalia", de: "Saeugetiere", level: 4,
    genes: { insulation: 0.78, metabolism: 0.75, mobility: 0.78, size: 0.35, limbLength: 0.55,
             armor: 0.15, structure: 0.35, photosynthesis: 0.08, wing: 0.04, biolum: 0.03,
             sense: 0.55 },
    reason: "Endothermie ist der Kern des Bauplans, und in dieser Physik wirkt Fell nur zusammen mit dem metabolischen Ofen (effInsulation = insulation * endoFactor, endothermyMetabFloor 0.5) — Isolation ohne Stoffwechsel waere die halbe Wirkung zum vollen Preis; die mittlere Groesse ist bewusst klein, weil Nagetiere und Fledertiere zusammen die Mehrheit aller Saeugerarten stellen.",
  },
  {
    qid: "Q28425", sci: "Chiroptera", de: "Fledertiere", level: 5,
    genes: { wing: 0.80, size: 0.10, metabolism: 0.92, limbLength: 0.30, mobility: 0.85,
             sense: 0.80, insulation: 0.78, armor: 0.05 },
    reason: "Aktiver Schlagflug verlangt in dieser Physik zwingend beides — grosse Fluegelflaeche UND kleine Masse (flightSizePenalty 1.5 macht Fluegel ab size ~0.67 wirkungslos) — plus hohen Stoffwechsel als Antrieb; die Echoortung ist genau das, was senseForage modelliert: Beute finden, die sonst unentdeckt bliebe.",
  },
  {
    qid: "Q27850", sci: "Cetartiodactyla", de: "Paarhufer und Wale", level: 5,
    genes: { size: 0.65, mobility: 0.80, metabolism: 0.72 },
    reason: "Gemeinsamer Nenner einer Gruppe, die vom Zwergmoschustier bis zum Blauwal reicht: ueberdurchschnittlich gross und aktiv — mehr laesst sich auf dieser Ebene ehrlich nicht sagen, die Aufspaltung in Land- und Wasserform folgt eine Ebene tiefer.",
  },
  {
    qid: ["Q192164", "Q25329"], sci: "Ruminantia / Artiodactyla", de: "Wiederkaeuer und Paarhufer", level: 6,
    genes: { size: 0.68, limbLength: 0.78, mobility: 0.82, insulation: 0.70, armor: 0.15,
             metabolism: 0.70, sense: 0.60 },
    reason: "Grosse Lauftiere mit langen Extremitaeten: lange Beine sind in dieser Physik zugleich Fluchtgeschwindigkeit und Reichweite ins hohe Futter (reachFromLimb 0.65, aber nur an Land) — das ist die Kombination, die den Huftierbauplan traegt. Die Regel sitzt auf Q192164 Ruminantia und NICHT nur auf Q25329 Artiodactyla, weil Wikidatas Ketten die Paarhufer ueber Ruminantia/Artiofabula fuehren und Q25329 in echten Ketten praktisch nie vorkommt (an Bos taurus nachgeprueft) — Artiofabula selbst scheidet aus, weil dort auch die Wale drunter haengen.",
  },
  {
    qid: "Q25374", sci: "Perissodactyla", de: "Unpaarhufer", level: 6,
    genes: { size: 0.75, limbLength: 0.82, mobility: 0.85, insulation: 0.60, metabolism: 0.68 },
    reason: "Dieselbe Lauftier-Loesung wie bei den Paarhufern, aber durchweg groessere Koerper (Pferd, Nashorn, Tapir) — Groesse zahlt hier doppelt: als Reichweite und als defenseFromSize.",
  },
  {
    qid: "Q160", sci: "Cetacea", de: "Wale", level: 6,
    genes: { limbLength: 0.08, armor: 0.05, mobility: 0.92, size: 0.85, insulation: 0.30,
             metabolism: 0.85, structure: 0.45, wing: 0.02, osmo: 0.55, baro: 0.35,
             sense: 0.65 },
    reason: "Vollstaendig aquatisch: Gliedmassen und Panzer sind hier kein Vorteil mehr, sondern Widerstand (aquaticLimbDrag 0.7, aquaticArmorDrag 0.5), und Isolation bekommt bewusst NUR einen mittleren Wert — Wale sind praktisch haarlos, ihre Waermehaltung ist Speck, und insulWaterLoss = 1.0 entwertet das Gen unter Wasser ohnehin vollstaendig.",
  },
  {
    qid: "Q168366", sci: "Mysticeti", de: "Bartenwale", level: 7,
    genes: { filter: 0.85, size: 0.92, sense: 0.40, metabolism: 0.90 },
    reason: "Die Barten sind ein Filterapparat im Wortsinn — energyFilter ist der einzige Energieweg der Physik, der Suspensionsfressen abbildet; die extreme Koerpergroesse ist die direkte Folge davon, dass Filtrieren nur bei sehr grossem Durchsatz traegt.",
  },
  {
    qid: "Q144144", sci: "Odontoceti", de: "Zahnwale", level: 7,
    genes: { sense: 0.88, size: 0.65, mobility: 0.94, filter: 0.05 },
    reason: "Echoortung ist der Gegenentwurf zur Barte: aktive Einzelbeutejagd statt Durchsatz, also hoher Sinnes- und Mobilitaetswert und ausdruecklich KEIN Filterapparat.",
  },
  {
    qid: ["Q30263", "Q25587", "Q26700", "Q2292156"], sci: "Pinnipedia (Phocidae/Otariidae/Odobenidae)",
    de: "Robben", level: 7,
    genes: { insulation: 0.60, limbLength: 0.15, size: 0.72, mobility: 0.90, armor: 0.06,
             metabolism: 0.88, osmo: 0.55, sense: 0.60 },
    reason: "Amphibisch zwischen Meer und Land: Flossenfuesse sind stromlinienfoermig reduziert, aber anders als bei Walen bleibt Fell wirksam, solange das Tier an Land oder auf Eis liegt — daher ein hoher, aber nicht maximaler Isolationswert. Die drei Familien stehen mit in der Regel, weil Q30263 Pinnipedia in Wikidatas P171-Ketten nicht zuverlaessig auftaucht (Phocidae haengt dort direkt unter Caniformia).",
  },
  {
    qid: "Q25431", sci: "Sirenia", de: "Seekuehe", level: 5,
    genes: { limbLength: 0.10, mobility: 0.50, size: 0.80, metabolism: 0.40, insulation: 0.20,
             armor: 0.10, osmo: 0.40, sense: 0.30 },
    reason: "Die einzigen rein pflanzenfressenden Meeressaeuger: Seegrasweide braucht keine Jagdgeschwindigkeit, deshalb der fuer ein Meeressaeugetier auffallend niedrige Stoffwechsel — und Kuestennaehe/Suesswasser-Zufluesse erklaeren den nur mittleren Osmo-Wert.",
  },
  {
    qid: "Q25306", sci: "Carnivora", de: "Raubtiere", level: 5,
    genes: { size: 0.55, sense: 0.78, mobility: 0.86, metabolism: 0.80, limbLength: 0.55,
             insulation: 0.75, armor: 0.12 },
    reason: "Aktive Einzelbeutejaeger: Geruchs- und Gehoerleistung ist ihr Kernwerkzeug und wirkt in dieser Physik ueber senseForage genau dort, wo Nahrung knapp ist — Panzerung waere fuer einen Jaeger nur Ballast.",
  },
  {
    qid: "Q11788", sci: "Ursidae", de: "Baeren", level: 7,
    genes: { size: 0.80, insulation: 0.86, mobility: 0.72, metabolism: 0.70, limbLength: 0.45 },
    reason: "Die groessten Landraubtiere, und mit dichter Unterwolle die am staerksten isolierten — beides zusammen ist in dieser Physik die kalte Nische: defenseFromSize plus effInsulation, bezahlt durch den hoechsten Gen-Unterhalt (m.size 0.22).",
  },
  {
    qid: "Q7380", sci: "Primates", de: "Primaten", level: 5,
    genes: { limbLength: 0.80, sense: 0.72, size: 0.45, insulation: 0.60, mobility: 0.80,
             metabolism: 0.70 },
    reason: "Greifextremitaeten fuer das Klettern im Kronendach: lange Gliedmassen sind in dieser Physik der Zugang zu hoch haengendem Futter (reachFromLimb 0.65 an Land) — genau die Nische, die der Prototyp „Behaender Kletterer“ mit limbLength 0.82 besetzt.",
  },
  {
    qid: "Q10850", sci: "Rodentia", de: "Nagetiere", level: 5,
    genes: { size: 0.16, limbLength: 0.35, burrow: 0.60, mobility: 0.82, metabolism: 0.82,
             insulation: 0.72, sense: 0.55 },
    reason: "Die artenreichste Saeugerordnung ist durchweg klein, und kleine Endotherme haben massenspezifisch die hoechsten Stoffwechselkosten (Kleiber: der Rabatt skaliert mit size); ihre Antwort auf Raeuberdruck ist der Bau, in dieser Physik die billige Verteidigung ohne Panzer-Widerstand.",
  },
  {
    qid: "Q16635184", sci: "Eulipotyphla", de: "Insektenfresser", level: 5,
    genes: { size: 0.10, metabolism: 0.92, sense: 0.62, burrow: 0.55, limbLength: 0.30,
             insulation: 0.70 },
    reason: "Spitzmaeuse haben den hoechsten massenspezifischen Umsatz aller Saeuger und muessen praktisch pausenlos fressen — der winzige Koerper bekommt keinerlei Kleiber-Rabatt, was diesen Bauplan in der Physik teuer und nur bei hoher Nahrungsaufnahme tragfaehig macht.",
  },
  {
    qid: ["Q104825", "Q750383"], sci: "Talpidae / Bathyergidae", de: "Maulwuerfe und Sandgraeber", level: 7,
    genes: { burrow: 0.90, size: 0.14, limbLength: 0.45, sense: 0.60, camo: 0.20,
             insulation: 0.70, oxyEff: 0.55, mobility: 0.75 },
    reason: "Vollstaendig unterirdisch lebend: burrow ist hier nicht Fluchtoption, sondern der Lebensraum selbst — und die schlecht durchlueftete Roehre ist ein echter Hypoxie-Stressor, gegen den oxyEff der einzige Puffer der Physik ist (Nacktmulle sind die extremsten bekannten Saeuger-Hypoxietoleranten).",
  },
  {
    qid: "Q26308", sci: "Proboscidea", de: "Ruesseltiere", level: 5,
    genes: { size: 0.96, insulation: 0.08, limbLength: 0.72, mobility: 0.62, metabolism: 0.50,
             armor: 0.30, sense: 0.70 },
    reason: "Groesste heute lebende Landtiere — und ausgerechnet nahezu haarlos, weil bei diesem Volumen-Oberflaechen-Verhaeltnis nicht Waermehaltung, sondern Waermeabgabe das Problem ist; die Physik bildet das korrekt ab: bei size 0.96 gibt die Kleiber-Allometrie den maximalen Stoffwechsel-Rabatt, Isolation waere reine Zusatzlast.",
  },
  {
    qid: ["Q1242326", "Q2191516"], sci: "Cingulata / Pholidota", de: "Guerteltiere und Schuppentiere", level: 5,
    genes: { armor: 0.82, burrow: 0.68, size: 0.28, mobility: 0.48, insulation: 0.20,
             limbLength: 0.35, sense: 0.55 },
    reason: "Zwei nicht verwandte Linien, die dieselbe Loesung gefunden haben — starre Panzerung plus Grabtrieb statt Flucht; in dieser Physik ist das die teure, aber mobilitaetsunabhaengige Verteidigung (defenseFromArmor 0.46 mit quadratischen Grenzkosten).",
  },
  {
    qid: "Q25336", sci: "Marsupialia", de: "Beuteltiere", level: 5,
    genes: { metabolism: 0.55, size: 0.30, insulation: 0.72 },
    reason: "Beuteltiere fahren belegt einen um etwa ein Drittel niedrigeren Grundumsatz als vergleichbar grosse Plazentatiere — in dieser Physik senkt das direkt die Unterhaltskosten und schwaecht zugleich die Wirkung des Fells (endoFactor).",
  },
  {
    qid: "Q21790", sci: "Monotremata", de: "Kloakentiere", level: 5,
    genes: { metabolism: 0.45, size: 0.35, insulation: 0.75, burrow: 0.60, sense: 0.65 },
    reason: "Die urspruenglichsten Saeuger halten die niedrigste Koerpertemperatur der Klasse (~32 °C) — der Stoffwechselwert liegt entsprechend unter dem Saeugermittel, was den Isolationsgewinn ueber endoFactor daempft.",
  },

  // --------------------------------- Voegel ---------------------------------
  {
    qid: "Q5113", sci: "Aves", de: "Voegel", level: 4,
    genes: { insulation: 0.58, metabolism: 0.90, wing: 0.78, size: 0.16, mobility: 0.85,
             limbLength: 0.40, armor: 0.06, structure: 0.30, photosynthesis: 0.08,
             biolum: 0.02, sense: 0.72 },
    reason: "Federkleid und Flugstoffwechsel bedingen einander: Voegel halten die hoechsten Koerpertemperaturen aller Wirbeltiere, und die Physik verlangt fuer Flug genau diese Kombination (flightMetabFloor 0.35) bei geringer Masse; der Median-Vogel ist ein Sperlingsvogel von wenigen Dutzend Gramm, nicht ein Adler.",
  },
  {
    qid: ["Q19166", "Q840849", "Q19173", "Q1113470", "Q11085824"],
    sci: "Palaeognathae (Struthio-/Casuarii-/Rhei-/Apterygiformes)", de: "Laufvoegel", level: 6,
    genes: { wing: 0.05, size: 0.72, limbLength: 0.90, mobility: 0.92, metabolism: 0.78,
             insulation: 0.55 },
    reason: "Sekundaer flugunfaehig: in dieser Physik ist der Fluegel bei dieser Masse ohnehin wirkungslos (size 0.72 x flightSizePenalty 1.5 > 1) und waere reine Kostenlast — die Reichweite kommt stattdessen ueber extrem lange Laufbeine, exakt der Prototyp „Laufvogel · Strauss“ (limbLength 0.9, wing 0.05).",
  },
  {
    qid: "Q12198609", sci: "Sphenisciformes", de: "Pinguine", level: 5,
    genes: { wing: 0.20, limbLength: 0.10, mobility: 0.92, insulation: 0.70, size: 0.55,
             armor: 0.05, osmo: 0.55, metabolism: 0.90, sense: 0.55 },
    reason: "Flossenfluegel statt Flugfluegel: unter Wasser gibt es in dieser Physik keinen Flug (landFactor = 0), der Vortrieb laeuft ueber den Aquatik-Kanal und verlangt Stromlinienform; die hohe Isolation bleibt trotzdem begruendet, weil Pinguine ihre Brutzeit an Land in extremer Kaelte verbringen — nur dort wirkt sie (insulWaterLoss).",
  },
  {
    qid: "Q21651", sci: "Anseriformes", de: "Gaensevoegel", level: 5,
    genes: { limbLength: 0.35, mobility: 0.85, size: 0.38, filter: 0.35, osmo: 0.30,
             wing: 0.70, insulation: 0.70 },
    reason: "Der Lamellenschnabel der Enten ist ein echter Seihapparat und damit der Filter-Energieweg im Wortsinn; das dichte, eingefettete Gefieder haelt auch im Wasser noch Luft — der seltene Fall, in dem hohe Isolation trotz Nasslebens verteidigbar ist.",
  },
  {
    qid: "Q25978", sci: "Charadriiformes", de: "Regenpfeiferartige", level: 5,
    genes: { limbLength: 0.52, size: 0.22, osmo: 0.45, wing: 0.80, mobility: 0.86, sense: 0.70 },
    reason: "Watvoegel sitzen genau im amphibischen Kanal der Physik, dessen Gliedmassen-Optimum bei 0.45 liegt (amphibiousLimbOpt) — weder Langbein-Laeufer noch flossenlose Schwimmer, sondern der mittlere Bauplan am Wasserrand.",
  },
  {
    qid: ["Q21736", "Q25222"], sci: "Accipitriformes / Strigiformes", de: "Greifvoegel und Eulen", level: 5,
    genes: { sense: 0.94, size: 0.45, mobility: 0.88, wing: 0.86, armor: 0.04, metabolism: 0.88 },
    reason: "Die schaerfsten Sinne im Tierreich (Sehleistung der Greife, Gehoerortung der Eulen) — genau die Nische, die senseForage geschaffen hat: ein Sinnesjaeger in kargem Revier, in dem normale Nahrungssuche nicht mehr traegt.",
  },
  {
    qid: "Q25950", sci: "Apodiformes", de: "Seglervoegel", level: 5,
    genes: { size: 0.05, metabolism: 0.98, wing: 0.90, mobility: 0.92, limbLength: 0.10,
             insulation: 0.45 },
    reason: "Kolibris und Segler fahren den hoechsten massenspezifischen Stoffwechsel aller Wirbeltiere; in dieser Physik ist das die einzige Kombination, die den Flugterm maximiert — winzige Masse (flightSizePenalty greift kaum) mal maximalem Antrieb.",
  },
  {
    qid: "Q25341", sci: "Passeriformes", de: "Sperlingsvoegel", level: 5,
    genes: { size: 0.09, wing: 0.76, metabolism: 0.92, sense: 0.68, limbLength: 0.30,
             insulation: 0.55 },
    reason: "Mit ueber der Haelfte aller Vogelarten stellen die Sperlingsvoegel das Mittel der Klasse und sind fast durchweg klein — sie definieren damit den unteren Groessenanker des Vogel-Bauplans.",
  },
  {
    qid: "Q21659", sci: "Galliformes", de: "Huehnervoegel", level: 5,
    genes: { wing: 0.32, size: 0.42, limbLength: 0.62, mobility: 0.68, metabolism: 0.72,
             camo: 0.55, insulation: 0.68 },
    reason: "Bodenvoegel mit nur kurzem Auffliegen: Fluegel bleiben vorhanden, tragen aber kaum zum Nahrungserwerb bei, weshalb die Verteidigung ueber Tarnung statt ueber Flucht in die Luft laeuft (defenseFromCamo 0.5 ist in dieser Physik die billigste Verteidigung ueberhaupt).",
  },
  {
    qid: "Q21685", sci: "Procellariiformes", de: "Roehrennasen", level: 5,
    genes: { wing: 0.94, size: 0.35, osmo: 0.65, sense: 0.72, mobility: 0.88, metabolism: 0.85 },
    reason: "Hochsee-Segler mit den extremsten Fluegelstreckungen ueberhaupt; der hohe Osmo-Wert ist nicht geschaetzt, sondern anatomisch belegt — die namensgebenden Salzdruesen ueber dem Schnabel sind ein Osmoregulations-Organ, das nur bei Meerwasseraufnahme Sinn hat.",
  },

  // -------------------------------- Reptilien --------------------------------
  {
    qid: "Q10811", sci: "Reptilia", de: "Reptilien", level: 4,
    genes: { insulation: 0.06, metabolism: 0.22, photosynthesis: 0.08, mobility: 0.65,
             armor: 0.35, limbLength: 0.50, structure: 0.42, wing: 0.03, biolum: 0.02,
             sense: 0.45, desicc: 0.45, camo: 0.45, pigment: 0.30, size: 0.35 },
    reason: "Ektothermie kehrt die Saeuger-Rechnung um: ohne inneren Ofen bringt Isolation ueber endoFactor kaum Wirkung und kostet doch vollen Unterhalt, waehrend der niedrige Grundumsatz die Unterhaltskosten insgesamt drueckt. Die verhornte, wasserdichte Haut ist die Schluesselinnovation der Amnioten gegenueber den Amphibien und rechtfertigt als einzige Wirbeltier-Klasse einen echten Austrocknungs-Wert.",
  },
  {
    qid: "Q223044", sci: "Testudines", de: "Schildkroeten", level: 5,
    genes: { armor: 0.90, mobility: 0.22, limbLength: 0.28, size: 0.45, structure: 0.62,
             camo: 0.20, metabolism: 0.15 },
    reason: "Der Panzer ist hier kein Zusatz, sondern der ganze Bauplan — und die Physik bildet den Preis korrekt ab: quadratische Panzer-Grenzkosten plus Wasserwiderstand, bezahlt durch fast vollstaendigen Verzicht auf Geschwindigkeit.",
  },
  {
    qid: "Q219329", sci: "Chelonioidea", de: "Meeresschildkroeten", level: 7,
    genes: { limbLength: 0.18, mobility: 0.75, armor: 0.55, osmo: 0.62, size: 0.72,
             structure: 0.55 },
    reason: "Zurueck ins Meer heisst in dieser Physik: Panzer und Gliedmassen abbauen, weil beide Widerstand erzeugen (aquaticArmorDrag 0.5, aquaticLimbDrag 0.7) — genau das ist der Unterschied zwischen Land- und Meeresschildkroete, und die Salzdruesen begruenden den Osmo-Wert.",
  },
  {
    qid: "Q25363", sci: "Crocodilia", de: "Krokodile", level: 5,
    genes: { size: 0.82, armor: 0.75, limbLength: 0.32, mobility: 0.62, metabolism: 0.18,
             structure: 0.58, sense: 0.62, camo: 0.60 },
    reason: "Grosse, schwer gepanzerte Lauerjaeger am Wasserrand: der extrem niedrige Ektothermen-Stoffwechsel macht diesen sonst unbezahlbaren Bauplan tragfaehig — grosse Masse plus schwerer Panzer waeren mit Saeuger-Unterhaltskosten in dieser Physik nicht finanzierbar.",
  },
  {
    qid: "Q122422", sci: "Squamata", de: "Schuppenkriechtiere", level: 5,
    genes: { armor: 0.22, limbLength: 0.50, camo: 0.55, size: 0.25, mobility: 0.72 },
    reason: "Anders als bei Schildkroete und Krokodil ist die Schuppenhaut leicht und beweglich — die Verteidigung laeuft hier ueber Krypsis statt Panzerung, in dieser Physik die billigere Loesung (m.camo 0.12 gegen m.armor 0.15 plus quadratische Grenzkosten).",
  },
  {
    qid: "Q25537662", sci: "Serpentes", de: "Schlangen", level: 6,
    genes: { limbLength: 0.02, size: 0.35, mobility: 0.70, camo: 0.65, armor: 0.12,
             sense: 0.65, burrow: 0.35, structure: 0.30 },
    reason: "Vollstaendiger Gliedmassenverlust: in dieser Physik verzichtet die Schlange damit auf den Reichweiten-Kanal (reachFromLimb) und gewinnt Stromlinienform — die Nahrungssuche laeuft ueber Chemo- und Waermesinn, was den hohen Sinneswert traegt.",
  },
  {
    qid: "Q37686", sci: "Chamaeleonidae", de: "Chamaeleons", level: 7,
    genes: { camo: 0.88, mobility: 0.22, limbLength: 0.62, sense: 0.75, size: 0.20 },
    reason: "Der einzige Bauplan, der Tarnung statt Flucht bis zum Aeussersten treibt — genau die Nische, fuer die defenseFromCamo (0.5) angehoben wurde: eine Verteidigung, die ohne Mobilitaet und ohne Panzer-Widerstand funktioniert.",
  },
  {
    qid: "Q1008888", sci: "Gekkota", de: "Geckoartige", level: 6,
    genes: { size: 0.10, camo: 0.60, sense: 0.62, limbLength: 0.50, mobility: 0.70 },
    reason: "Kleine, ueberwiegend naechtliche Kletterer: nachtaktive Jagd erklaert die hohe Sinnesleistung, und bei dieser Koerpergroesse ist Tarnung die einzige bezahlbare Verteidigung.",
  },

  // -------------------------------- Amphibien --------------------------------
  {
    qid: "Q10908", sci: "Amphibia", de: "Amphibien", level: 4,
    genes: { insulation: 0.04, metabolism: 0.20, limbLength: 0.45, mobility: 0.68, armor: 0.05,
             photosynthesis: 0.08, structure: 0.25, wing: 0.02, biolum: 0.02, size: 0.28,
             desicc: 0.04, osmo: 0.04, camo: 0.55, sense: 0.40 },
    reason: "Die nackte, drueckenreiche Haut atmet mit und ist damit das exakte Gegenteil einer Austrocknungssperre — ein hoher desicc-Wert waere hier biologisch falsch UND reine Kostenlast. Die Gliedmassenlaenge trifft mit 0.45 genau amphibiousLimbOpt: der mittlere Bauplan am Wasserrand, den die Physik als eigene Nische fuehrt.",
  },
  {
    qid: "Q53636", sci: "Anura", de: "Froschlurche", level: 5,
    genes: { limbLength: 0.52, size: 0.22, mobility: 0.74, camo: 0.60 },
    reason: "Sprungbeine sind verlaengerte Hinterextremitaeten — in dieser Physik zugleich Reichweite an Land und Fluchtleistung, waehrend der Koerper selbst klein und ungepanzert bleibt.",
  },
  {
    qid: "Q53663", sci: "Caudata", de: "Schwanzlurche", level: 5,
    genes: { limbLength: 0.28, size: 0.22, mobility: 0.52, camo: 0.55, metabolism: 0.15 },
    reason: "Molche und Salamander bewegen sich schlaengelnd mit kurzen Beinen und haben unter den Landwirbeltieren die niedrigsten Stoffwechselraten ueberhaupt — beides senkt in dieser Physik die Unterhaltskosten deutlich.",
  },
  {
    qid: "Q4758", sci: "Gymnophiona", de: "Schleichenlurche", level: 5,
    genes: { limbLength: 0.02, burrow: 0.85, size: 0.22, mobility: 0.50, sense: 0.20,
             camo: 0.25 },
    reason: "Beinlose, grabende Lurche mit rueckgebildeten Augen: burrow ist hier Lebensraum, nicht Fluchtweg, und der Sinneswert muss entsprechend niedrig liegen — die Physik belohnt Sinnesschaerfe nur ueber die Nahrungssuche im Freien.",
  },

  // ---------------------------------- Fische ---------------------------------
  {
    qid: "Q127282", sci: "Actinopterygii", de: "Strahlenflosser", level: 4,
    genes: { limbLength: 0.10, armor: 0.10, mobility: 0.85, insulation: 0.04, metabolism: 0.45,
             photosynthesis: 0.08, structure: 0.35, wing: 0.02, biolum: 0.05, osmo: 0.40,
             sense: 0.55, oxyEff: 0.35, size: 0.32 },
    reason: "Der Aquatik-Kanal der Physik belohnt ausdruecklich einen STROMLINIENFOERMIGEN Koerper: Flossen sind keine Gliedmassen, Schuppen kein Panzer, beides wuerde nur Widerstand erzeugen. Der Sauerstoff-Wert ist kein Rateergebnis, sondern folgt daraus, dass Wasser rund 30-mal weniger Sauerstoff traegt als Luft — Kiemen SIND eine Hypoxie-Anpassung.",
  },
  {
    qid: "Q25371", sci: "Chondrichthyes", de: "Knorpelfische", level: 4,
    genes: { limbLength: 0.10, armor: 0.08, mobility: 0.88, size: 0.60, sense: 0.88,
             osmo: 0.75, metabolism: 0.55, insulation: 0.03, photosynthesis: 0.08,
             structure: 0.22, wing: 0.02, biolum: 0.06, oxyEff: 0.30 },
    reason: "Haie und Rochen sind im Mittel deutlich groesser als Knochenfische und tragen mit den Lorenzinischen Ampullen einen Sinn, den kein anderer Bauplan hat; der hohe Osmo-Wert ist hart begruendet: sie sind Harnstoff-Osmokonformer und praktisch ausnahmslos marin. Das Knorpelskelett ist leichter als Knochen, daher der niedrigere Stuetzgewebe-Wert.",
  },
  {
    qid: "Q194257", sci: "Elasmobranchii", de: "Plattenkiemer", level: 5,
    genes: { mobility: 0.88, limbLength: 0.10, armor: 0.08, sense: 0.88 },
    reason: "Bestaetigt die Knorpelfisch-Werte eine Ebene tiefer, weil Wikidatas Ketten fuer Haie und Rochen ueber diesen Knoten laufen und nicht immer bis Chondrichthyes durchgeschrieben sind.",
  },
  {
    qid: "Q796580", sci: "Myliobatiformes", de: "Rochen (Stechrochenartige)", level: 6,
    genes: { limbLength: 0.05, mobility: 0.68, camo: 0.60, size: 0.62, burrow: 0.35,
             sense: 0.80 },
    reason: "Der abgeflachte, bodenlebende Gegenentwurf zum Hai: eingegraben im Sediment statt frei schwimmend, weshalb Tarnung und Grabverhalten die Mobilitaet teilweise ersetzen.",
  },
  {
    qid: "Q128685", sci: "Anguilliformes", de: "Aalartige", level: 5,
    genes: { limbLength: 0.02, size: 0.40, mobility: 0.88, armor: 0.03, structure: 0.20 },
    reason: "Die reinste Umsetzung der Stromlinien-Vorgabe: kein Flossenanhang, kein Panzer, nichts, was Widerstand erzeugt — exakt der Prototyp „Fisch · Aalform“ (limbLength 0.12, armor 0.10).",
  },
  {
    qid: "Q206948", sci: "Lophiiformes", de: "Armflosser (Anglerfische)", level: 5,
    genes: { biolum: 0.70, baro: 0.60, mobility: 0.50, sense: 0.50, size: 0.25, camo: 0.65,
             metabolism: 0.20 },
    reason: "Die Leuchtangel ist in dieser Physik ein eigener Energieweg (energyGlow), der ausdruecklich NUR unterhalb biolumDarkFloor (light < 0.3) traegt — also genau in der Tiefsee, wo Photosynthese tot ist. Einschraenkung, die hier nicht verschwiegen wird: die Ordnung enthaelt auch flache Anglerfische ohne Leuchtorgan, der Wert ist ein Ordnungsmittel.",
  },
  {
    qid: "Q657570", sci: "Stomiiformes", de: "Maulstachler", level: 5,
    genes: { biolum: 0.88, baro: 0.68, size: 0.10, mobility: 0.60, sense: 0.55, camo: 0.50,
             metabolism: 0.20 },
    reason: "Die dichtest mit Leuchtorganen besetzten Wirbeltiere ueberhaupt und rein mesopelagisch — hier ist der hohe Biolumineszenz- und Druckwert keine Mittelung, sondern gilt fuer praktisch jede Art der Ordnung.",
  },
  {
    qid: "Q59577", sci: "Pleuronectiformes", de: "Plattfische", level: 5,
    genes: { camo: 0.88, mobility: 0.42, burrow: 0.40, size: 0.35, limbLength: 0.05 },
    reason: "Bodenbewohner, deren gesamte Verteidigung auf Verschwinden statt Fliehen beruht — defenseFromCamo ist in dieser Physik ausdruecklich so gebaut, dass sie auch fuer schlanke Schwimmer nutzbar ist (kein Wasserwiderstand, anders als Panzer).",
  },
  {
    qid: "Q650692", sci: "Syngnathiformes", de: "Seenadelartige", level: 5,
    genes: { camo: 0.78, mobility: 0.20, armor: 0.45, size: 0.10, limbLength: 0.05,
             metabolism: 0.20 },
    reason: "Seepferdchen und Seenadeln haben Geschwindigkeit vollstaendig gegen Knochenring-Panzerung und Mimese eingetauscht — in dieser Physik ein bewusster Ausstieg aus dem Aquatik-Kanal (der Mobilitaet verlangt) zugunsten reiner Verteidigung.",
  },

  // -------------------------------- Insekten --------------------------------
  {
    qid: "Q1390", sci: "Insecta", de: "Insekten", level: 4,
    genes: { size: 0.10, limbLength: 0.78, insulation: 0.04, armor: 0.25, photosynthesis: 0.08,
             mobility: 0.75, metabolism: 0.45, structure: 0.12, wing: 0.05, biolum: 0.03,
             desicc: 0.45, sense: 0.45, osmo: 0.06 },
    reason: "Die Physik hat fuer genau diesen Bauplan einen eigenen Kanal (energyTraction): insectShape = limb * (1-size) * (1-armor) * (1-insulation), quadriert — winzig, langbeinig, nackt und ungepanzert zugleich. Ein hoher Panzerwert waere hier kontraproduktiv. Die Wachsschicht der Kutikula ist die Landanpassung der Gruppe und traegt den desicc-Wert; Insekten sind dagegen fast ausnahmslos Land- und Suesswassertiere, daher praktisch kein Osmo-Bedarf.",
  },
  {
    qid: "Q22708", sci: "Pterygota", de: "Fluginsekten", level: 5,
    genes: { wing: 0.68, mobility: 0.78 },
    reason: "Fluegel erst eine Ebene unter „Insekten“, weil Urinsekten fluegellos sind — und ausdruecklich nur ein mittlerer Wert, weil innerhalb der Fluginsekten Ameisen, Termitenarbeiter und Floehe sekundaer fluegellos wurden und ihn eine Ebene tiefer wieder kassieren.",
  },
  {
    qid: "Q28319", sci: "Lepidoptera", de: "Schmetterlinge", level: 6,
    genes: { wing: 0.88, size: 0.12, mobility: 0.70, metabolism: 0.55, camo: 0.60,
             limbLength: 0.42, armor: 0.10 },
    reason: "Grosse Schuppenfluegel an sehr leichtem Koerper — das Maximum dessen, was der Flugterm hergibt; die duenne, ungepanzerte Huelle macht Tarnung zur einzigen verfuegbaren Verteidigung.",
  },
  {
    qid: "Q22671", sci: "Coleoptera", de: "Kaefer", level: 6,
    genes: { armor: 0.62, wing: 0.32, limbLength: 0.62, size: 0.14, mobility: 0.68, camo: 0.50 },
    reason: "Die Elytren sind zu Panzerdeckeln umgebaute Vorderfluegel — Kaefer tauschen also buchstaeblich Flugflaeche gegen Panzerung ein, und die Physik bestraft das doppelt: weniger Flug UND Ausschluss aus dem Traktionskanal, der (1-armor) verlangt. Genau deshalb ist der Kaefer ein anderer Bauplan als die Ameise.",
  },
  {
    qid: "Q22651", sci: "Hymenoptera", de: "Hautfluegler", level: 6,
    genes: { wing: 0.72, size: 0.08, sense: 0.58, limbLength: 0.68, mobility: 0.80,
             armor: 0.18 },
    reason: "Kleine, flinke Flieger mit ausgepraegter Chemo-Orientierung (Pheromone, Bluetenerkennung) — Sinnesleistung ist bei dieser Gruppe der Zugang zu punktuell verteilten Ressourcen, also genau der senseForage-Fall.",
  },
  {
    qid: "Q7386", sci: "Formicidae", de: "Ameisen", level: 8,
    genes: { wing: 0.04, burrow: 0.78, size: 0.04, limbLength: 0.82, mobility: 0.86,
             armor: 0.15, sense: 0.55 },
    reason: "Arbeiterinnen sind fluegellos und leben im Bau — das kassiert den Fluegelwert der Fluginsekten und ersetzt ihn durch Grabtrieb; zugleich erfuellen Ameisen alle vier Bedingungen des Traktionskanals (winzig, langbeinig, ungepanzert, nackt) so vollstaendig wie kaum ein anderer Bauplan.",
  },
  {
    qid: "Q25312", sci: "Diptera", de: "Zweifluegler", level: 6,
    genes: { wing: 0.82, size: 0.05, metabolism: 0.72, mobility: 0.82, sense: 0.52,
             limbLength: 0.60, armor: 0.08 },
    reason: "Reduktion auf ein Fluegelpaar plus Schwingkoelbchen ergibt die wendigsten Flieger der Insekten bei minimaler Masse — der Flugterm belohnt genau diese Kombination am staerksten.",
  },
  {
    qid: "Q25375", sci: "Odonata", de: "Libellen", level: 6,
    genes: { wing: 0.90, sense: 0.88, mobility: 0.90, size: 0.20, limbLength: 0.40,
             metabolism: 0.75, armor: 0.10 },
    reason: "Groesste Komplexaugen im Insektenreich und Jagd im Flug: Libellen sind der reine Sinnesjaeger-Typ, den senseForage abbilden soll, und ihr Fluegelapparat erlaubt als einziger unabhaengige Steuerung beider Paare.",
  },
  {
    qid: "Q174273", sci: "Ephemeroptera", de: "Eintagsfliegen", level: 6,
    genes: { wing: 0.62, size: 0.09, metabolism: 0.30, oxyEff: 0.04, mobility: 0.55,
             limbLength: 0.50 },
    reason: "Bewusst ein NIEDRIGER Sauerstoff-Wert, gegen den ersten Reflex: die Larven tragen zwar Tracheenkiemen, sind aber gerade deshalb die klassischen Zeigerarten fuer sauerstoffREICHES Fliesswasser — sie tolerieren Hypoxie schlechter als fast jede andere Wasserinsektengruppe, und oxyEff misst Toleranz, nicht Kiemenbesitz.",
  },
  {
    qid: "Q167810", sci: "Orthoptera", de: "Heuschrecken", level: 6,
    genes: { limbLength: 0.90, size: 0.20, camo: 0.60, wing: 0.42, mobility: 0.78,
             armor: 0.15 },
    reason: "Sprungbeine sind der extremste Gliedmassen-Bauplan der Insekten und maximieren zugleich insectShape (limb geht dort linear ein, das Ganze quadriert) — Flug ist demgegenueber sekundaer und bei vielen Arten reduziert.",
  },
  {
    qid: "Q25309", sci: "Blattodea", de: "Schaben und Termiten", level: 6,
    genes: { size: 0.14, limbLength: 0.70, camo: 0.50, wing: 0.30, desicc: 0.55,
             mobility: 0.72, armor: 0.28 },
    reason: "Abgeflachte Spaltenbewohner mit besonders undurchlaessiger Kutikula — die Austrocknungstoleranz ist hier hoeher als im Insektenmittel, weil das Leben in trockenen Ritzen und Totholz genau diesen Stressor traegt.",
  },
  {
    qid: "Q546583", sci: "Isoptera", de: "Termiten", level: 7,
    genes: { burrow: 0.82, wing: 0.06, size: 0.05, camo: 0.15, mobility: 0.70, armor: 0.10 },
    reason: "Arbeiterinnen sind fluegellos, blind und verlassen den Bau nie — wie bei den Ameisen weicht der Fluegelwert dem Grabtrieb, und Tarnung ist im Dunkeln des Baus wertlos.",
  },
  {
    qid: "Q388162", sci: "Siphonaptera", de: "Floehe", level: 6,
    genes: { wing: 0.02, size: 0.02, limbLength: 0.72, mobility: 0.70, armor: 0.35 },
    reason: "Sekundaer vollstaendig fluegellos und seitlich abgeflacht; der auffallend feste Chitinpanzer ist bei einem Ektoparasiten Schutz vor dem Kratzen des Wirts — ein Druck, den diese Physik nicht kennt, weshalb der Wert hier bewusst moderat bleibt.",
  },
  {
    qid: "Q26371", sci: "Hemiptera", de: "Schnabelkerfe", level: 6,
    genes: { size: 0.08, limbLength: 0.55, wing: 0.45, mobility: 0.55, camo: 0.55,
             armor: 0.22 },
    reason: "Saugende Pflanzen- und Beutesauger, oft sessil oder wenig beweglich (Blattlaeuse, Schildlaeuse) — deutlich geringere Mobilitaet als bei den aktiv jagenden oder fliegenden Insektenordnungen.",
  },

  // ------------------------------- Spinnentiere -------------------------------
  {
    qid: "Q1358", sci: "Arachnida", de: "Spinnentiere", level: 4,
    genes: { size: 0.09, limbLength: 0.82, armor: 0.28, mobility: 0.55, insulation: 0.03,
             photosynthesis: 0.08, metabolism: 0.30, wing: 0.02, biolum: 0.02, structure: 0.10,
             desicc: 0.52, sense: 0.58, camo: 0.48 },
    reason: "Acht lange Beine an winzigem, fluegellosem Koerper — dieselbe Traktions-Nische wie bei den Insekten, aber ohne jede Flugoption; die dichte Wachsschicht macht Spinnentiere zu den trockenheitsresistentesten Gliederfuessern ueberhaupt.",
  },
  {
    qid: "Q1357", sci: "Araneae", de: "Webspinnen", level: 5,
    genes: { limbLength: 0.90, sense: 0.68, mobility: 0.55, size: 0.07, armor: 0.12 },
    reason: "Lauernde Netz- und Laufjaeger: die Beine sind zugleich Fortbewegung und Vibrationssinn, und der ungepanzerte Hinterleib laesst nur den Traktions- und Sinnesweg offen.",
  },
  {
    qid: "Q19125", sci: "Scorpiones", de: "Skorpione", level: 5,
    genes: { armor: 0.65, size: 0.20, desicc: 0.80, pigment: 0.45, mobility: 0.45,
             limbLength: 0.62, sense: 0.60 },
    reason: "Skorpione sind ausgesprochene Trockenspezialisten mit der undurchlaessigsten Kutikula unter den Landgliederfuessern und extrem niedrigen Stoffwechselraten — in dieser Physik der Xerophyten-Fall unter den Tieren; die schwere Panzerung schliesst sie zugleich vom Traktionskanal aus.",
  },
  {
    qid: "Q19116", sci: "Opiliones", de: "Weberknechte", level: 5,
    genes: { limbLength: 0.96, armor: 0.08, size: 0.05, mobility: 0.60 },
    reason: "Das extremste Bein-zu-Koerper-Verhaeltnis im ganzen Tierreich, bei praktisch fehlender Panzerung — der Reinfall des Traktionskanals, dessen insectShape genau diese Kombination quadratisch belohnt.",
  },
  {
    qid: "Q19137", sci: "Acari", de: "Milben", level: 5,
    genes: { size: 0.02, limbLength: 0.42, mobility: 0.32, desicc: 0.58, armor: 0.30,
             sense: 0.25 },
    reason: "An der unteren Groessengrenze vielzelligen Lebens und mit stark verkuerzten Beinen — bei dieser Groesse dominiert das Verhaeltnis Oberflaeche zu Volumen, weshalb Austrocknung der entscheidende Stressor ist und Beweglichkeit kaum Ertrag bringt.",
  },

  // -------------------------------- Krebstiere --------------------------------
  {
    qid: "Q182978", sci: "Malacostraca", de: "Hoehere Krebse", level: 4,
    genes: { armor: 0.64, limbLength: 0.70, size: 0.30, osmo: 0.55, mobility: 0.55 },
    reason: "Die groessten und am staerksten kalzifizierten Krebstiere; Panzer und viele Extremitaeten zugleich sind in dieser Physik der teuerste Bauplan im Wasser (beide erzeugen Widerstand), was den durchweg benthischen Lebenswandel dieser Gruppe erklaert.",
  },
  {
    qid: "Q4610", sci: "Decapoda", de: "Zehnfusskrebse", level: 5,
    genes: { armor: 0.74, limbLength: 0.74, size: 0.42, mobility: 0.48, structure: 0.30,
             sense: 0.45 },
    reason: "Krabben und Hummer sind der Prototyp „Krebstier · Arthropode“ (armor 0.71, limbLength 0.64) — gehen statt schwimmen, weil Panzer und Scheren den Aquatik-Kanal ueber den Widerstandsterm praktisch schliessen.",
  },
  {
    qid: "Q206338", sci: "Isopoda", de: "Asseln", level: 5,
    genes: { armor: 0.55, size: 0.08, limbLength: 0.55, burrow: 0.38, mobility: 0.45,
             desicc: 0.30 },
    reason: "Die einzige Krebsgruppe mit erfolgreicher Landbesiedlung: kleine, abgeflachte Panzertraeger, die sich unter Steine und Rinde zurueckziehen — burrow steht hier fuer genau dieses Verstecken.",
  },
  {
    qid: "Q29498", sci: "Euphausiacea", de: "Krill", level: 5,
    genes: { filter: 0.86, size: 0.06, mobility: 0.58, armor: 0.15, osmo: 0.55, biolum: 0.40,
             limbLength: 0.45 },
    reason: "Der Prototyp „Krill · Filtrierendes Kleinstwesen“ (size 0.07, filter 0.87): die Thorakopoden bilden einen echten Seihkorb, und Krill traegt zugleich ausgepraegte Leuchtorgane — beide Gene sind hier keine Mittelung, sondern gelten fuer die ganze Ordnung.",
  },
  {
    qid: "Q189973", sci: "Copepoda", de: "Ruderfusskrebse", level: 4,
    genes: { size: 0.03, filter: 0.62, mobility: 0.50, armor: 0.12, osmo: 0.50,
             limbLength: 0.35 },
    reason: "Das haeufigste vielzellige Tier der Erde und die Basis des marinen Nahrungsnetzes: mikroskopisch klein, mit Mundwerkzeug-Filterstrudel — dieselbe Nische wie Krill, nur zwei Groessenordnungen darunter.",
  },
  {
    qid: "Q188360", sci: "Branchiopoda", de: "Kiemenfusskrebse", level: 4,
    genes: { size: 0.04, filter: 0.75, mobility: 0.40, armor: 0.10, osmo: 0.12,
             limbLength: 0.40 },
    reason: "Blattfoermige Beine, die zugleich Kieme und Filterapparat sind — und anders als die uebrigen Krebstiere ueberwiegend SUESSWASSER-Bewohner, weshalb der Osmo-Wert hier ausdruecklich nach unten korrigiert wird.",
  },
  {
    qid: "Q853383", sci: "Anostraca", de: "Feenkrebse", level: 5,
    genes: { osmo: 0.10, size: 0.06, filter: 0.72, mobility: 0.45 },
    reason: "Die Ordnung ist trotz ihres beruehmtesten Vertreters ueberwiegend suesswasserbewohnend (Temporaergewaesser, Schmelzwassertuempel) — der Salzwert gehoert nicht hierhin, sondern eine Ebene tiefer.",
  },
  {
    qid: ["Q15715526", "Q134772"], sci: "Artemiidae / Artemia", de: "Salinenkrebse", level: 7,
    genes: { osmo: 0.96, desicc: 0.75, size: 0.05, filter: 0.72, mobility: 0.50 },
    reason: "Der Prototyp „Salinenkrebs · Halophil“ (osmo 0.96): Artemia lebt in gesaettigter Salzlake, in der praktisch kein Raeuber ueberlebt — genau die Nische, die salinityLethality (0.85) modelliert; die Dauereier ueberstehen zusaetzlich vollstaendige Austrocknung.",
  },
  {
    qid: "Q220457", sci: "Cirripedia", de: "Rankenfusskrebse", level: 5,
    genes: { mobility: 0.05, filter: 0.90, armor: 0.80, structure: 0.55, size: 0.12,
             osmo: 0.60, limbLength: 0.30, metabolism: 0.30 },
    reason: "Seepocken sind festgewachsene Krebstiere — der einzige Fall, in dem ein Gliederfuesser den sessilen Filtrierer-Bauplan faehrt; hier ist niedrige Mobilitaet kein Mangel, sondern Voraussetzung, weil energyFilter Mobilitaet gar nicht braucht und die Kalkschale ohne Schwimmwiderstand bezahlbar wird.",
  },

  // -------------------------------- Weichtiere --------------------------------
  {
    qid: "Q4867740", sci: "Gastropoda", de: "Schnecken", level: 4,
    genes: { armor: 0.55, mobility: 0.32, limbLength: 0.08, size: 0.14, camo: 0.35,
             structure: 0.25 },
    reason: "Der Prototyp „Schnecke · Weichtier“ (armor 0.5, mobility 0.52): ein Kriechfuss ist eine langsame Fortbewegung, und das Gehaeuse ersetzt Geschwindigkeit durch Verteidigung.",
  },
  {
    qid: "Q25368", sci: "Bivalvia", de: "Muscheln", level: 4,
    genes: { filter: 0.92, mobility: 0.06, armor: 0.74, limbLength: 0.04, structure: 0.45,
             size: 0.22, osmo: 0.50, sense: 0.06, metabolism: 0.25 },
    reason: "Der Prototyp „Muschel · Sessiler Filtrierer“ (filter 0.9, mobility 0.15): Kiemen, die zugleich Atem- und Seihorgan sind. Die Mobilitaet muss hier NIEDRIG liegen — energyFilter braucht sie nicht, und jeder Mobilitaetswert wuerde ueber den exclusion-Term nur andere Energiewege beschaedigen.",
  },
  {
    qid: "Q128257", sci: "Cephalopoda", de: "Kopffuesser", level: 4,
    genes: { limbLength: 0.80, armor: 0.05, mobility: 0.85, sense: 0.88, size: 0.50,
             camo: 0.78, biolum: 0.28, osmo: 0.65, structure: 0.15, metabolism: 0.78 },
    reason: "Der Prototyp „Kopffuesser · Tintenfisch“ (limbLength 0.83, armor 0.1, mobility 0.84): Schale aufgegeben zugunsten von Geschwindigkeit, dazu das komplexeste Nervensystem und die schnellste Farbwechsel-Tarnung aller Wirbellosen. Ausnahmslos marin und Osmokonformer — daher ein hoher, hier nicht gemittelter Osmo-Wert.",
  },

  // ------------------------------ Ringelwuermer ------------------------------
  {
    qid: "Q839350", sci: "Clitellata", de: "Guerteltwuermer", level: 4,
    genes: { burrow: 0.82, osmo: 0.05, desicc: 0.05, limbLength: 0.03, mobility: 0.55,
             size: 0.12 },
    reason: "Regenwuermer und Verwandte sind Land- und Suesswasserbewohner mit permanent feuchter Hautatmung: sie sterben bei Austrocknung binnen Stunden — ein hoher desicc-Wert waere hier nicht nur falsch, sondern das genaue Gegenteil der Biologie.",
  },
  {
    qid: "Q43012", sci: "Hirudinea", de: "Egel", level: 5,
    genes: { burrow: 0.12, mobility: 0.55, size: 0.10, armor: 0.08, sense: 0.40 },
    reason: "Anders als Regenwuermer graben Egel nicht, sondern schwimmen und kriechen an Oberflaechen — der Grabwert der Guerteltwuermer wird hier ausdruecklich zurueckgenommen.",
  },
  {
    qid: "Q18952", sci: "Polychaeta", de: "Vielborster", level: 4,
    genes: { osmo: 0.60, mobility: 0.50, filter: 0.35, burrow: 0.60, limbLength: 0.20,
             size: 0.12 },
    reason: "Fast ausnahmslos marin, und ein grosser Teil lebt in Roehren als Sedimentfresser oder Filtrierer — die Parapodien sind Stummelfuesse, die eine geringe, aber echte Gliedmassenlaenge rechtfertigen.",
  },

  // ------------------------------- Nesseltiere -------------------------------
  {
    qid: "Q28524", sci: "Anthozoa", de: "Blumentiere", level: 4,
    genes: { mobility: 0.05, structure: 0.55, armor: 0.50, filter: 0.60, size: 0.35,
             photosynthesis: 0.25 },
    reason: "Ausschliesslich Polypen, niemals Medusen — also lebenslang festsitzend; damit ist der Filter-Kanal der einzige verfuegbare Energieweg, und er verlangt ausdruecklich KEINE Mobilitaet.",
  },
  {
    qid: "Q195605", sci: "Scleractinia", de: "Steinkorallen", level: 5,
    genes: { armor: 0.82, structure: 0.80, photosynthesis: 0.45, mobility: 0.04, filter: 0.55,
             size: 0.55, osmo: 0.62 },
    reason: "Der Prototyp „Koralle · Riffbildner“ (armor 0.71, structure 0.66, photosynthesis 0.37): riffbildende Korallen sind echte Mixotrophe — die Zooxanthellen liefern den Grossteil der Energie. Die Physik bestraft diese Doppelstrategie ueber den exclusion-Term, und genau das ist die ehrliche Aussage: die Symbiose ist ein Kompromiss, kein Gratis-Bonus.",
  },
  {
    qid: "Q147256", sci: "Actiniaria", de: "Seeanemonen", level: 5,
    genes: { mobility: 0.08, filter: 0.58, armor: 0.12, structure: 0.20, photosynthesis: 0.18,
             size: 0.25 },
    reason: "Wie die Steinkorallen sessil, aber ohne Kalkskelett — deshalb weder Panzerung noch Stuetzgewebe, und die Energie kommt fast vollstaendig aus dem Beutefang statt aus Symbionten.",
  },
  {
    qid: "Q272388", sci: "Scyphozoa", de: "Schirmquallen", level: 4,
    genes: { mobility: 0.45, filter: 0.62, armor: 0.02, structure: 0.04, size: 0.40,
             biolum: 0.38, osmo: 0.62, limbLength: 0.15 },
    reason: "Freischwimmende Medusen ohne jedes Stuetz- oder Panzergewebe (ueber 95 % Wasser): sie treiben und pulsieren, statt zu jagen, weshalb ein mittlerer Mobilitaetswert und der Filter-Kanal zusammen ihre Energie tragen.",
  },
  {
    qid: "Q181989", sci: "Hydrozoa", de: "Hydrozoen", level: 4,
    genes: { size: 0.05, mobility: 0.25, filter: 0.52, biolum: 0.35, structure: 0.10,
             armor: 0.06 },
    reason: "Winzige Polypen und Medusen, oft koloniebildend; die Gruppe stellt einen Grossteil der biolumineszenten Meeresorganismen (das Gruen-Fluoreszenz-Protein stammt von einer Hydromeduse).",
  },

  // ------------------------------ Stachelhaeuter ------------------------------
  {
    qid: "Q25349", sci: "Asteroidea", de: "Seesterne", level: 4,
    genes: { limbLength: 0.50, armor: 0.55, size: 0.32, mobility: 0.30 },
    reason: "Der Prototyp „Seestern · Stachelhaeuter“ (limbLength 0.45, armor 0.55, size 0.35): die Arme sind echte, wenn auch langsame Fortsaetze, und das Ossikel-Skelett gibt Verteidigung ohne die Beweglichkeit ganz aufzugeben.",
  },
  {
    qid: "Q83483", sci: "Echinoidea", de: "Seeigel", level: 4,
    genes: { armor: 0.88, limbLength: 0.12, mobility: 0.16, size: 0.22, structure: 0.55 },
    reason: "Geschlossene Kalkschale plus bewegliche Stacheln — die konsequenteste Panzerung unter den Stachelhaeutern, bezahlt mit nahezu vollstaendigem Verzicht auf Beweglichkeit.",
  },
  {
    qid: "Q127470", sci: "Holothuroidea", de: "Seegurken", level: 4,
    genes: { armor: 0.06, structure: 0.06, limbLength: 0.04, mobility: 0.25, burrow: 0.52,
             size: 0.35 },
    reason: "Der Gegenentwurf zum Seeigel: das Kalkskelett ist auf mikroskopische Skleriten reduziert, der Koerper weich und wurmfoermig — Verteidigung laeuft ueber Eingraben im Sediment statt ueber Panzerung.",
  },
  {
    qid: "Q33666", sci: "Crinoidea", de: "Seelilien und Haarsterne", level: 4,
    genes: { filter: 0.86, mobility: 0.06, limbLength: 0.55, structure: 0.58, size: 0.28 },
    reason: "Die einzigen festsitzenden Stachelhaeuter: die gefiederten Arme sind ein Fangnetz fuer Schwebstoffe — der Filter-Kanal in Reinform, mit dem Stiel als Stuetzgewebe.",
  },

  // =========================================================================
  // PFLANZEN
  // =========================================================================
  {
    qid: ["Q27133", "Q2997417"], sci: "Tracheophyta / Cormophyta", de: "Gefaesspflanzen", level: 3,
    genes: { structure: 0.45, size: 0.42, photosynthesis: 0.85, windres: 0.35 },
    reason: "Leitgewebe und Lignin sind die Definition dieser Gruppe und in dieser Physik genau das, was structure bedeutet — aufrechter Wuchs erschliesst Licht bei vertikaler Konkurrenz (structureLightFloor 0.3) und setzt die Pflanze zugleich dem Wind aus. Zwei QIDs, weil Wikidata parallele Backbones fuehrt und ein Teil der Bluetenpflanzen nur ueber Cormophyta laeuft.",
  },
  {
    qid: ["Q25314", "Q14562931", "Q14832431"], sci: "Angiospermae (drei parallele Items)",
    de: "Bedecktsamer", level: 4,
    genes: { photosynthesis: 0.88, structure: 0.45, size: 0.42, metabolism: 0.28 },
    reason: "Die effizientesten Photosynthese-Apparate im Pflanzenreich (Gefaessnetz mit Tracheen, hohe Blattflaechendichte). Drei QIDs, weil Wikidata drei parallele Bedecktsamer-Items fuehrt — eine Regel auf nur einem davon greift bei zwei Dritteln der Bluetenpflanzen nicht (gemessen an echten P171-Ketten).",
  },
  {
    qid: "Q1147601", sci: "Liliopsida", de: "Einkeimblaettrige", level: 5,
    genes: { size: 0.32, structure: 0.30 },
    reason: "Monokotylen fehlt das Kambium und damit das sekundaere Dickenwachstum — sie bilden kein echtes Holz und bleiben deshalb im Mittel kleiner und weniger verholzt als die Zweikeimblaettrigen.",
  },
  {
    qid: "Q43238", sci: "Poaceae", de: "Suessgraeser", level: 7,
    genes: { structure: 0.22, size: 0.26, photosynthesis: 0.88, windres: 0.68, armor: 0.32,
             fireres: 0.55 },
    reason: "Biegsame Halme statt starrer Staemme sind die Windantwort der Graeser, Silikat-Einlagerungen ihr Frassschutz, und die bodennahen Meristeme lassen sie nach Feuer aus der Basis wieder austreiben — in dieser Physik sind das drei verschiedene Gene fuer eine einzige Wuchsform.",
  },
  {
    qid: "Q25400", sci: "Asteraceae", de: "Korbbluetler", level: 7,
    genes: { structure: 0.20, size: 0.24, photosynthesis: 0.86, windres: 0.30 },
    reason: "Die artenreichste Pflanzenfamilie ist ganz ueberwiegend krautig — anders als bei den meisten Familien laesst sich die Wuchsform hier aus der Klade ableiten, und das ist wichtig, weil ein Loewenzahn sonst das Stuetzgewebe der Bedecktsamer-Regel (0.45) erben wuerde und in die Naehe eines Strauchs geriete.",
  },
  {
    qid: "Q44448", sci: "Fabaceae", de: "Huelsenfruechtler", level: 7,
    genes: { nfix: 0.88, photosynthesis: 0.86, size: 0.35 },
    reason: "Die Rhizobien-Knoellchensymbiose ist der Lehrbuchfall der Stickstoff-Fixierung, und energyNfix zahlt in dieser Physik ausdruecklich NUR bei knappen Naehrstoffen aus (nfixBase 0.2 + 0.8*(1-foodAbundance)) — genau die Pioniernische, in der Leguminosen real dominieren.",
  },
  {
    qid: "Q14560", sci: "Cactaceae", de: "Kakteen", level: 7,
    genes: { desicc: 0.90, armor: 0.78, structure: 0.28, size: 0.35, photosynthesis: 0.62,
             mobility: 0.04, pigment: 0.60 },
    reason: "Der Prototyp „Sukkulente · Kaktus“ (armor 0.76, photosynthesis 0.61): Dornen sind umgewandelte Blaetter und damit echte Panzerung, und der reduzierte Photosynthese-Wert ist kein Versehen — CAM oeffnet die Spaltoeffnungen nur nachts, was Wasser spart und Ertrag kostet.",
  },
  {
    qid: ["Q155938", "Q156219"], sci: "Crassulaceae / Aizoaceae", de: "Dickblatt- und Mittagsblumengewaechse", level: 7,
    genes: { desicc: 0.85, size: 0.16, structure: 0.18, pigment: 0.52, photosynthesis: 0.68 },
    reason: "Blattsukkulenz mit CAM, aber ohne die Dornen der Kakteen — dieselbe Trockennische ueber eine andere Bauform, weshalb hier der Panzerwert fehlt und stattdessen die Kompaktheit steht.",
  },
  {
    qid: "Q21881", sci: "Fagales", de: "Buchenartige", level: 6,
    genes: { structure: 0.85, size: 0.78, photosynthesis: 0.86, windres: 0.45 },
    reason: "Eine der wenigen grossen Ordnungen, die AUSNAHMSLOS verholzt ist (Buchen, Eichen, Birken, Erlen, Walnuesse) — deshalb darf hier ausnahmsweise die Wuchsform aus der Klade abgeleitet werden, was bei den meisten Pflanzenordnungen unmoeglich waere.",
  },
  {
    qid: "Q145977", sci: "Fagaceae", de: "Buchengewaechse", level: 7,
    genes: { size: 0.86, structure: 0.88, photosynthesis: 0.86, armor: 0.20 },
    reason: "Der Prototyp „Laubbaum“ (size 0.82, structure 0.89, photosynthesis 0.86): Eichen und Buchen sind die kanonischen Grossbaeume der gemaessigten Zone und liegen exakt auf diesen Werten.",
  },
  {
    qid: "Q158487", sci: "Salicaceae", de: "Weidengewaechse", level: 7,
    genes: { structure: 0.78, size: 0.62, photosynthesis: 0.88, windres: 0.55 },
    reason: "Verholzt, aber ausgesprochen biegsam und ueberwiegend an Gewaessern und auf Rohboden wachsend — Pioniergehoelze sind kleiner und windzaeher als Klimaxbaeume.",
  },
  {
    qid: "Q21037", sci: "Zosteraceae", de: "Seegraeser", level: 7,
    genes: { osmo: 0.88, structure: 0.10, size: 0.22, windres: 0.04, desicc: 0.03,
             photosynthesis: 0.82 },
    reason: "Die einzigen Bluetenpflanzen, die vollstaendig untergetaucht im Meerwasser leben — hier ist der hohe Osmo-Wert keine Mittelung, sondern gilt fuer jede Art der Familie; Stuetzgewebe und Windhaerte fallen dagegen ganz weg, weil das Wasser die Halme traegt.",
  },
  {
    qid: ["Q15962941", "Q159525"], sci: "Salicornioideae / Salicornia", de: "Quellergewaechse", level: 8,
    genes: { osmo: 0.90, desicc: 0.55, structure: 0.14, size: 0.10, photosynthesis: 0.80 },
    reason: "Obligate Halophyten der Salzwiese, die Salz aktiv in Vakuolen einlagern — der Lehrbuchfall des Halophyten, den salinityLethality (0.85) modelliert; die sukkulenten Sprosse begruenden zusaetzlich die Trockentoleranz.",
  },
  {
    qid: "Q161429", sci: "Lemnoideae", de: "Wasserlinsen", level: 8,
    genes: { size: 0.02, structure: 0.04, photosynthesis: 0.85, windres: 0.04, desicc: 0.02,
             mobility: 0.05 },
    reason: "Die kleinsten Bluetenpflanzen ueberhaupt, frei auf dem Wasser treibend: kein Spross, keine Verholzung, keine Windangriffsflaeche — in dieser Physik der Gegenpol des Baumes bei identischer Photosyntheseleistung.",
  },
  {
    qid: "Q148650", sci: "Nymphaeaceae", de: "Seerosengewaechse", level: 7,
    genes: { structure: 0.10, size: 0.38, windres: 0.05, desicc: 0.03, photosynthesis: 0.84 },
    reason: "Grosse Schwimmblaetter an einem im Schlamm wurzelnden Rhizom: das Wasser uebernimmt die Stuetzfunktion vollstaendig, weshalb Stuetzgewebe hier reine Kostenlast waere.",
  },
  {
    qid: "Q25308", sci: "Orchidaceae", de: "Orchideen", level: 7,
    genes: { size: 0.18, structure: 0.18, photosynthesis: 0.72, desicc: 0.40 },
    reason: "Ganz ueberwiegend epiphytische Kraeuter ohne Verholzung; als Aufsitzer ohne Bodenanschluss sind sie regelmaessiger Trockenheit ausgesetzt, was Luftwurzeln und CAM bei vielen Arten erklaert.",
  },
  {
    qid: ["Q156185", "Q2704296"], sci: "Droseraceae / Nepenthaceae", de: "Fleischfressende Pflanzen", level: 7,
    genes: { nfix: 0.55, size: 0.14, structure: 0.14, photosynthesis: 0.70 },
    reason: "Karnivorie ist Naehrstoff-Erschliessung unabhaengig vom Boden — genau das, was energyNfix modelliert („zahlt VOR ALLEM bei knappen Naehrstoffen“) und der Grund, warum diese Pflanzen ausgerechnet in naehrstoffarmen Mooren stehen. Eine eigene Achse fuer Karnivorie gibt es nicht; dass nfix hier als Naeherung dient, ist ausdruecklich eine Naeherung.",
  },
  {
    qid: ["Q157019", "Q190505"], sci: "Rafflesiaceae / Cuscuta", de: "Vollparasitische Pflanzen", level: 8,
    genes: { photosynthesis: 0.04, structure: 0.06, mobility: 0.04, size: 0.12 },
    reason: "Vollparasiten ohne Chlorophyll — und damit ein bewusst stehen gelassenes Loch: diese Physik kennt KEINEN Parasitismus-Energieweg, also landen sie an einer Stelle, an der die Engine ihnen kein Einkommen zuweisen kann. Das ist nicht wegdefiniert, sondern genau das Signal, das der Abdeckungs-Report in Phase 3.1 einsammeln soll.",
  },
  {
    qid: "Q156192", sci: "Orobanchaceae", de: "Sommerwurzgewaechse", level: 7,
    genes: { photosynthesis: 0.35, structure: 0.12, size: 0.18 },
    reason: "Anders als die Vollparasiten ist diese Familie ueberwiegend HEMIparasitisch (Klappertopf, Augentrost betreiben eigene Photosynthese und zapfen nur Wasser und Mineralstoffe ab) — deshalb ein reduzierter, aber nicht ausgeschalteter Photosynthese-Wert.",
  },

  // ------------------------------- Nacktsamer -------------------------------
  {
    qid: ["Q133712", "Q132825"], sci: "Gymnospermae / Pinophyta", de: "Nacktsamer", level: 4,
    genes: { structure: 0.85, size: 0.76, photosynthesis: 0.74, insulation: 0.35,
             frostres: 0.52, desicc: 0.45, windres: 0.50, armor: 0.25, mobility: 0.04 },
    reason: "Der Prototyp „Nadelbaum“ (insulation 0.5, structure 0.8, photosynthesis 0.73): immergruene Nadeln mit dicker Kutikula und Harz ueberdauern den Winter, statt das Laub abzuwerfen — die niedrigere Photosyntheseleistung gegenueber Laubbaeumen ist der Preis fuer diese Dauerhaftigkeit. Zwei QIDs, weil Koniferen in Wikidata NICHT unter Q133712 haengen, sondern ueber Q132825 laufen (an echten Ketten geprueft).",
  },
  {
    qid: "Q101680", sci: "Pinaceae", de: "Kieferngewaechse", level: 7,
    genes: { size: 0.84, structure: 0.88, frostres: 0.62, insulation: 0.45 },
    reason: "Die Baumfamilie der borealen Zone und der Hochgebirge — hier ist die Frosthaerte kein Klassenmittel, sondern das definierende Merkmal des Verbreitungsgebiets.",
  },
  {
    qid: "Q146037", sci: "Cupressaceae", de: "Zypressengewaechse", level: 7,
    genes: { size: 0.80, structure: 0.88, desicc: 0.60, armor: 0.28 },
    reason: "Schuppenblaetter mit stark reduzierter Oberflaeche sind eine Trockenanpassung; die Familie stellt zugleich die groessten und langlebigsten Baeume ueberhaupt (Mammutbaum, Wacholder in Halbwuesten).",
  },
  {
    qid: ["Q5605610", "Q157114"], sci: "Cycadopsida / Cycadales", de: "Palmfarne", level: 5,
    genes: { structure: 0.55, size: 0.42, armor: 0.52, desicc: 0.55, photosynthesis: 0.68,
             nfix: 0.45 },
    reason: "Harte, oft stachelige Wedel an einem gedrungenen Stamm; die Korallenwurzeln der Palmfarne beherbergen stickstoff-fixierende Cyanobakterien — eine der wenigen Symbiosen ausserhalb der Huelsenfruechtler, die diesen Wert wirklich tragen.",
  },
  {
    qid: "Q10788836", sci: "Ginkgoopsida", de: "Ginkgogewaechse", level: 5,
    genes: { structure: 0.86, size: 0.82, photosynthesis: 0.80, detox: 0.55 },
    reason: "Sommergruener Grossbaum mit auffallender Widerstandsfaehigkeit gegen Schadstoffe und Stadtklima (der Grund, warum er weltweit als Strassenbaum gepflanzt wird) — detox misst in dieser Physik genau die Toleranz gegen giftige Milieus.",
  },

  // ---------------------------------- Farne ----------------------------------
  {
    qid: ["Q373615", "Q178249", "Q80005"], sci: "Polypodiopsida / Pteridophyta", de: "Farne", level: 4,
    genes: { photosynthesis: 0.72, structure: 0.24, size: 0.35, mobility: 0.05, desicc: 0.08,
             windres: 0.20, armor: 0.22 },
    reason: "Der Prototyp „Farn“ (photosynthesis 0.6, structure 0.22): Gefaesspflanzen ohne Samen — ihre freischwimmenden Spermatozoiden binden die Fortpflanzung an einen Wasserfilm, weshalb der Austrocknungswert hier ausdruecklich NIEDRIG steht, obwohl viele Farne selbst robust sind. Q80005 („Farne“) steht mit dabei, obwohl es gar kein Taxon-Item ist (kein P225, kein P171) — als Absicherung, weil es in tools/wikidata-harvest.mjs als Wurzel-Klade gefuehrt wird.",
  },
  {
    qid: "Q7175204", sci: "Salviniales", de: "Wasserfarne", level: 6,
    genes: { size: 0.04, structure: 0.05, desicc: 0.03, windres: 0.04, photosynthesis: 0.78 },
    reason: "Frei schwimmende Kleinfarne ohne Stuetzgewebe — dieselbe Bauform wie die Wasserlinsen, nur in einer voellig anderen Verwandtschaft entstanden.",
  },
  {
    qid: "Q1128633", sci: "Azolla", de: "Algenfarn", level: 9,
    genes: { nfix: 0.72 },
    reason: "Azolla traegt in Blatthoehlen die stickstoff-fixierende Cyanobakterie Anabaena — das ist der Grund fuer ihren jahrhundertealten Einsatz als Gruenduenger im Nassreisbau und rechtfertigt den Wert auf Gattungsebene, nicht fuer die ganze Ordnung (Salvinia hat den Symbionten nicht).",
  },

  // ---------------------------------- Moose ----------------------------------
  {
    qid: "Q25347", sci: "Bryophyta", de: "Laubmoose", level: 3,
    genes: { size: 0.08, structure: 0.05, photosynthesis: 0.72, mobility: 0.04, desicc: 0.58,
             windres: 0.58, insulation: 0.10, limbLength: 0.02, wing: 0.02, biolum: 0.02,
             armor: 0.06, metabolism: 0.18, frostres: 0.45 },
    reason: "Der Prototyp „Moos“ (size 0.3, photosynthesis 0.72, structure 0.14): das FEHLENDE Leitgewebe ist die Definition der Moose und begrenzt sie auf wenige Zentimeter. Poikilohydrie — vollstaendig austrocknen und bei Wiederbefeuchtung weiterleben — ist ihr Kernmerkmal und genau das, was desicc misst; der bodennahe Polsterwuchs macht sie zugleich praktisch windunangreifbar.",
  },
  {
    qid: "Q1422487", sci: "Sphagnopsida", de: "Torfmoose", level: 5,
    genes: { desicc: 0.35, size: 0.14, detox: 0.55, photosynthesis: 0.74 },
    reason: "Torfmoose saeuern ihr Milieu aktiv an (Kationenaustausch) und leben in genau diesem sauren, naehrstoffarmen Wasser — detox misst in dieser Physik die Toleranz gegen chemisch feindliche Milieus; als staendig wassergesaettigte Moore-Bewohner sind sie zugleich weniger austrocknungstolerant als andere Moose.",
  },
  {
    // Zwei QIDs: Wikidatas Ketten fuer Lebermoose laufen ueberwiegend NICHT ueber
    // Q189808, sondern ueber die Unterklasse Q1272901 Marchantiidae (an Marchantia
    // polymorpha nachgeprueft) — mit nur einem der beiden griffe die Regel selten.
    qid: ["Q189808", "Q1272901"], sci: "Marchantiophyta", de: "Lebermoose", level: 3,
    genes: { size: 0.05, structure: 0.03, photosynthesis: 0.70, mobility: 0.04, desicc: 0.22,
             windres: 0.55, limbLength: 0.02, wing: 0.02, biolum: 0.02, armor: 0.05,
             metabolism: 0.18, insulation: 0.08 },
    reason: "Noch einfacher gebaut als die Laubmoose (thallose Formen haben nicht einmal Blaettchen) und deutlich staerker an dauerfeuchte Standorte gebunden — daher ein klar niedrigerer Austrocknungswert als bei den Laubmoosen.",
  },
  {
    qid: "Q191156", sci: "Anthocerotophyta", de: "Hornmoose", level: 3,
    genes: { size: 0.05, structure: 0.03, photosynthesis: 0.70, mobility: 0.04, desicc: 0.20,
             nfix: 0.50, windres: 0.55, metabolism: 0.18, armor: 0.05 },
    reason: "Hornmoose beherbergen in Schleimhoehlen regelmaessig Nostoc-Kolonien, die Luftstickstoff fixieren — eine der wenigen Pflanzengruppen ausserhalb der Huelsenfruechtler, bei der dieser Wert nicht geschaetzt, sondern anatomisch belegt ist.",
  },

  // =========================================================================
  // PILZE
  // =========================================================================
  {
    qid: "Q174698", sci: "Basidiomycota", de: "Staenderpilze", level: 3,
    genes: { size: 0.42, structure: 0.40 },
    reason: "Die Gruppe mit den groessten und langlebigsten Fruchtkoerpern des Pilzreichs — Hutpilze und Porlinge bilden echte, tragende Gewebe, was sie von den ueberwiegend mikroskopischen Schlauchpilzen unterscheidet.",
  },
  {
    qid: "Q27720", sci: "Agaricomycetes", de: "Staenderpilze i. e. S.", level: 4,
    genes: { size: 0.55, structure: 0.42, armor: 0.22, metabolism: 0.58 },
    reason: "Die Klasse der Holz- und Streuzersetzer: ihre Ligninasen sind der einzige biologische Weg, verholztes Substrat aufzuschliessen — in dieser Physik ist genau das der Stoffwechsel-Hebel des Absorptions-Kanals.",
  },
  {
    qid: "Q221448", sci: "Agaricales", de: "Blaetterpilze", level: 5,
    genes: { size: 0.62, structure: 0.38, armor: 0.22 },
    reason: "Der Prototyp „Hutpilz“ (size 0.63, structure 0.38, armor 0.23): weiche, kurzlebige Fruchtkoerper aus lockerem Hyphengeflecht — gross, aber nicht hart.",
  },
  {
    qid: "Q1343309", sci: "Polyporales", de: "Porlinge", level: 5,
    genes: { structure: 0.76, armor: 0.62, size: 0.58, metabolism: 0.62 },
    reason: "Der Prototyp „Baumpilz · Porling“ (structure 0.75) und „Zunderschwamm“ (armor 0.7): mehrjaehrige, holzharte Konsolen — hier ist Stuetzgewebe wortwoertlich verholztes Material und traegt zugleich die Verteidigung.",
  },
  {
    qid: ["Q133651", "Q1204312"], sci: "Pucciniomycotina / Ustilaginomycotina", de: "Rost- und Brandpilze", level: 4,
    genes: { size: 0.02, structure: 0.04, metabolism: 0.50, mobility: 0.03 },
    reason: "Mikroskopische Pflanzenparasiten ohne Fruchtkoerper — und wie bei den parasitischen Pflanzen ein bewusst offen gelassenes Loch: diese Physik hat keinen Parasitismus-Kanal, der Absorptions-Kanal traegt sie nur schwach.",
  },
  {
    qid: "Q174726", sci: "Ascomycota", de: "Schlauchpilze", level: 3,
    genes: { size: 0.22, structure: 0.22 },
    reason: "Ganz ueberwiegend mikroskopisch oder kleinfruchtig; die grossen Fruchtkoerper (Morchel, Trueffel) sind die Ausnahme, nicht die Regel — daher deutlich niedrigere Groessen- und Stuetzwerte als bei den Staenderpilzen.",
  },
  {
    qid: "Q508019", sci: "Saccharomycotina", de: "Echte Hefen", level: 4,
    genes: { size: 0.03, metabolism: 0.82, structure: 0.04, mobility: 0.05 },
    reason: "Der Prototyp „Hefe“ (size 0.27, metabolism 0.8): einzellig und ganz auf Durchsatz gebaut — Gaerung ist ein Hochdurchsatz-Stoffwechsel mit schlechter Ausbeute, und genau ein solcher Stoffwechsel ist der Ertragshebel des Absorptions-Kanals.",
  },
  {
    qid: "Q132180", sci: "Eurotiomycetes", de: "Schimmel- und Giesskannenpilze", level: 4,
    genes: { size: 0.10, structure: 0.10, metabolism: 0.66, desicc: 0.52, detox: 0.45 },
    reason: "Der Prototyp „Schimmel · Fadenpilz“ (size 0.36, structure 0.15): trockenresistente Sporen und ein Sekundaerstoffwechsel, der Antibiotika und Mykotoxine produziert — dieser Bauplan besiedelt chemisch und osmotisch feindliche Substrate, die andere Pilze meiden.",
  },
  {
    qid: "Q843232", sci: "Pezizomycetes", de: "Becherlinge", level: 4,
    genes: { size: 0.34, structure: 0.28, metabolism: 0.55, burrow: 0.30 },
    reason: "Die einzigen Schlauchpilze mit regelmaessig makroskopischen Fruchtkoerpern (Morcheln, Trueffel); der Grabwert steht fuer die unterirdisch fruchtenden Trueffel, deren ganze Strategie das Verbergen im Boden ist.",
  },
  {
    qid: "Q133571", sci: "Lecanoromycetes", de: "Flechtenpilze", level: 4,
    genes: { photosynthesis: 0.45, mobility: 0.03, size: 0.28, structure: 0.35, metabolism: 0.14,
             desicc: 0.88, windres: 0.82, frostres: 0.70, pigment: 0.65, radres: 0.45,
             nfix: 0.35, armor: 0.20 },
    reason: "DER SONDERFALL. Eine Flechte ist keine Art, sondern eine Symbiose: der Pilz allein waere heterotroph, mit Photobiont wird das Ganze autotroph — deshalb steht hier ein echter, wenn auch mittlerer Photosynthese-Wert bei praktisch null Mobilitaet, was in dieser Physik zusammenpasst (exclusion). Alles Weitere folgt aus dem, was Flechten wirklich koennen: poikilohydrisch vollstaendig austrocknen und wiederaufleben (der Grund, warum sie nackten Fels und Tundra besiedeln), Flechtensaeuren als UV-Schutz, extrem langsames Wachstum, und im Weltraum-Experiment ueberlebte Vakuum- und Strahlungsexposition. Cyanoflechten fixieren zusaetzlich Stickstoff. Einschraenkung: nicht alle Lecanoromycetes sind lichenisiert, aber die grosse Mehrheit — der Rest ist Preis der Kladen-Aufloesung.",
  },

  // =========================================================================
  // BAKTERIEN
  // =========================================================================
  {
    qid: ["Q25577567", "Q93315", "Q18575364"], sci: "Cyanobacteriota / Cyanophyceae",
    de: "Cyanobakterien", level: 3,
    genes: { photosynthesis: 0.80, nfix: 0.60, mobility: 0.05, pigment: 0.58, size: 0.06,
             structure: 0.10 },
    reason: "Die einzigen Bakterien mit oxygener Photosynthese und zugleich die wichtigsten Stickstoff-Fixierer der Erde (Heterozysten). Der Pigmentwert ist nicht geraten: Scytonemin und Carotinoide sind explizite UV-Schutzstoffe, und Cyanobakterien besiedeln die am staerksten UV-exponierten Standorte ueberhaupt (Krusten, Fels, Oberflaechenwasser). Drei QIDs wegen paralleler Wikidata-Items.",
  },
  {
    qid: "Q1771045", sci: "Nostocaceae", de: "Nostocgewaechse", level: 7,
    genes: { nfix: 0.88 },
    reason: "Die Familie mit den ausgepraegtesten Heterozysten — Nostoc und Anabaena sind die Symbionten in Flechten, Hornmoosen, Palmfarnen und Azolla und damit die Stickstoffquelle gleich mehrerer anderer Regeln dieses Regelwerks.",
  },
  {
    qid: "Q88926185", sci: "Deinococcota", de: "Deinococcus-Gruppe", level: 3,
    genes: { radres: 0.95, desicc: 0.78, size: 0.06, mobility: 0.04 },
    reason: "Der Prototyp „Deinococcus · Strahlenfest“ (radres 0.92). Wichtig ist die MITBEGRUENDUNG: die beruehmte Strahlungsresistenz ist ein Nebenprodukt der Austrocknungsresistenz — beide Stressoren erzeugen DNA-Doppelstrangbrueche, und dieselbe Reparaturmaschinerie deckt beide ab. Deshalb steht hier neben radres zwingend auch desicc.",
  },
  {
    qid: "Q25519942", sci: "Bacillota", de: "Firmicutes", level: 3,
    genes: { desicc: 0.72, metabolism: 0.42, size: 0.06 },
    reason: "Die Endosporenbildner (Bacillus, Clostridium): eine Endospore ueberdauert Jahrzehnte vollstaendiger Trockenheit — das ist Anhydrobiose im Wortsinn und genau das, was desicc misst.",
  },
  {
    qid: "Q62573436", sci: "Actinomycetota", de: "Actinobakterien", level: 3,
    genes: { structure: 0.28, detox: 0.48, desicc: 0.52, metabolism: 0.50, size: 0.07,
             mobility: 0.04 },
    reason: "Myzelartig wachsende Bodenbakterien und die Hauptquelle aller natuerlichen Antibiotika — sie leben in einem chemisch umkaempften Milieu, in dem Toleranz gegen fremde Sekundaermetabolite Ueberlebensbedingung ist.",
  },
  {
    qid: "Q12962137", sci: "Pseudomonadota", de: "Proteobakterien", level: 3,
    genes: { mobility: 0.22, metabolism: 0.48, size: 0.05 },
    reason: "Der stoffwechselvielfaeltigste Bakterienstamm, ueberwiegend begeisselt und aktiv beweglich — mehr laesst sich zu einer Gruppe, die von Rhizobium bis Escherichia reicht, ehrlich nicht sagen.",
  },
  {
    qid: "Q136594", sci: "Rhizobiales", de: "Rhizobien", level: 5,
    genes: { nfix: 0.88, mobility: 0.10 },
    reason: "Die Knoellchenbakterien der Huelsenfruechtler: der Symbiosepartner, der die Fabaceae-Regel ueberhaupt erst traegt — energyNfix schliesst ausdruecklich Mobilitaet aus, was zur symbiontischen, festsitzenden Lebensweise passt.",
  },
  {
    qid: ["Q124660536", "Q63436528", "Q1465692"], sci: "Beggiatoales / Beggiatoaceae / Thiotrichales",
    de: "Schwefelbakterien", level: 5,
    genes: { detox: 0.90, oxyEff: 0.70, size: 0.12, mobility: 0.15, metabolism: 0.55 },
    reason: "Der Prototyp „Schwefelbakterie · Chemotroph“ (detox 0.95): Sulfid-Oxidierer leben von einem Stoff, der fuer fast alles andere ein Zellgift ist, und zwar in der sauerstoffarmen Grenzschicht — beides zusammen ist in dieser Physik genau detox plus oxyEff. Thiomargarita ist zudem die groesste bekannte Bakterie, was den erhoehten Groessenwert traegt.",
  },

  // =========================================================================
  // ARCHAEEN
  // =========================================================================
  {
    qid: ["Q1136630", "Q3316454"], sci: "Methanobacteria / Methanobacteriales", de: "Methanbildner", level: 4,
    genes: { oxyEff: 0.92, metabolism: 0.70, size: 0.05, mobility: 0.06 },
    reason: "Der Prototyp „Methanogenes Archaeon · Anaerobier“ (oxyEff 0.94): obligate Anaerobier, fuer die Sauerstoff unmittelbar toedlich ist — der Extremfall dessen, was hypoxiaSeverity (0.9) modelliert. Der Wert sitzt bewusst auf der Klasse und nicht auf dem uebergeordneten Stamm, weil unter demselben Stamm auch die aeroben Halobacteria haengen.",
  },
  {
    qid: "Q1054206", sci: "Halobacteria", de: "Halobakterien", level: 4,
    genes: { osmo: 0.95, pigment: 0.72, oxyEff: 0.25, size: 0.05, mobility: 0.15 },
    reason: "Obligate Extremhalophile, die in nahezu gesaettigter Salzlake leben und dort Molarkonzentrationen an Kalium in der Zelle halten — das Maximum dessen, was osmo abbilden kann. Ihr Bacteriorhodopsin und die Carotinoide, die Salzseen rot faerben, sind zugleich echte Lichtschutzpigmente.",
  },
  {
    qid: "Q21447237", sci: "Thermoproteota", de: "Crenarchaeota", level: 3,
    genes: { detox: 0.82, oxyEff: 0.40, radres: 0.35, size: 0.05, metabolism: 0.45 },
    reason: "Thermoacidophile aus Solfataren und heissen Quellen: pH um 2, Schwefelsaeure und geloeste Schwermetalle — die chemisch feindlichste Umwelt, in der Leben nachgewiesen ist, und damit der Reinfall von detox.",
  },

  // =========================================================================
  // PROTISTEN — die fuenf Wurzel-Kladen aus tools/wikidata-harvest.mjs
  // =========================================================================
  {
    qid: "Q473809", sci: "Amoebozoa", de: "Amoeben", level: 3,
    genes: { size: 0.18, mobility: 0.13, photosynthesis: 0.10, structure: 0.16, limbLength: 0.04,
             wing: 0.02, biolum: 0.02, armor: 0.10, metabolism: 0.35, insulation: 0.05 },
    reason: "Der Prototyp „Protist · Amoebe“ (size 0.22, mobility 0.13, structure 0.19): Kriechen mit Scheinfuesschen ist die langsamste Fortbewegung ueberhaupt und traegt in dieser Physik kaum Jagd-Einkommen — der Bauplan lebt von Phagocytose im Substrat.",
  },
  {
    qid: "Q106345", sci: "Ciliophora", de: "Wimpertierchen", level: 3,
    genes: { size: 0.10, mobility: 0.48, filter: 0.42, photosynthesis: 0.10, structure: 0.10,
             limbLength: 0.04, wing: 0.02, biolum: 0.02, armor: 0.12, metabolism: 0.50,
             insulation: 0.04 },
    reason: "Cilien leisten zweierlei zugleich: schnelle Fortbewegung (Wimpertierchen sind die schnellsten Einzeller) und einen Strudel, der Bakterien in den Zellmund traegt — das ist Suspensionsfressen und damit echter Filter-Ertrag, nicht nur Mobilitaet.",
  },
  {
    qid: ["Q499086", "Q25834462"], sci: "Euglenozoa", de: "Euglenozoen", level: 3,
    genes: { photosynthesis: 0.45, mobility: 0.45, size: 0.08, structure: 0.08, limbLength: 0.04,
             wing: 0.02, biolum: 0.02, armor: 0.08, metabolism: 0.50, insulation: 0.04 },
    reason: "Der Prototyp „Euglenoid · Mixotroph“ (photosynthesis 0.54, mobility 0.58): Augentierchen betreiben Photosynthese UND fressen. Die Physik bestraft das ueber den exclusion-Term (0.8) — und das ist die ehrliche Aussage: Mixotrophie ist ein Kompromiss aus zwei halben Strategien, kein Bonus. Zwei QIDs, weil Wikidata zwei geschachtelte Euglenozoa-Items fuehrt.",
  },
  {
    qid: "Q107027", sci: "Foraminifera", de: "Foraminiferen", level: 3,
    genes: { armor: 0.58, size: 0.08, mobility: 0.14, filter: 0.32, osmo: 0.60,
             photosynthesis: 0.12, structure: 0.30, limbLength: 0.04, wing: 0.02, biolum: 0.02,
             metabolism: 0.30, insulation: 0.04 },
    reason: "Einzeller mit echtem Kalkgehaeuse — ihre Schalen bilden ganze Kalksteinformationen; ein Panzer ohne Beweglichkeit, weil das Gehaeuse jede schnelle Fortbewegung ausschliesst, und ausnahmslos marin.",
  },
  {
    qid: ["Q9642991", "Q162678"], sci: "Bacillariophyta / Diatomea", de: "Kieselalgen", level: 3,
    genes: { photosynthesis: 0.80, armor: 0.45, size: 0.05, mobility: 0.07, osmo: 0.42,
             structure: 0.10, limbLength: 0.03, wing: 0.02, biolum: 0.02, metabolism: 0.25,
             insulation: 0.04 },
    reason: "Photoautotrophe Einzeller in einer zweiteiligen Schale aus Siliziumdioxid — Glas ist echte Panzerung, und Kieselalgen leisten rund ein Viertel der globalen Primaerproduktion, was den hohen Photosynthese-Wert traegt. Zwei QIDs, weil Wikidata die Gruppe unter zwei Items fuehrt und die echten P171-Ketten ueber Q9642991 laufen.",
  },
];

// ===========================================================================
// ZUORDNUNG
// ===========================================================================

/** Interner Index: QID -> Liste der Regeln, die auf dieser QID sitzen. */
const RULE_BY_QID = new Map();
for (const rule of CLADE_RULES) {
  for (const q of Array.isArray(rule.qid) ? rule.qid : [rule.qid]) {
    if (!RULE_BY_QID.has(q)) RULE_BY_QID.set(q, []);
    RULE_BY_QID.get(q).push(rule);
  }
}

/** Alle QIDs, auf die irgendeine Regel sitzt (fuer Abdeckungsberichte). */
export const RULE_QIDS = new Set(RULE_BY_QID.keys());

/**
 * Findet alle Regeln, die auf eine Elterntaxon-Kette passen.
 * @param {string[]} lineageQids  Kette in BELIEBIGER Reihenfolge; darf die QID des
 *                                Taxons selbst enthalten.
 * @returns {object[]} Regeln, SPEZIFISCHSTE ZUERST (absteigend nach `level`).
 *                     Bei gleichem Level entscheidet die Reihenfolge in CLADE_RULES —
 *                     deterministisch, aber in der Praxis irrelevant, weil zwei Regeln
 *                     gleicher Spezifitaet sich in echten Ketten ausschliessen.
 */
export function matchRules(lineageQids) {
  const seen = new Set();
  const hits = [];
  for (const q of lineageQids || []) {
    for (const rule of RULE_BY_QID.get(q) || []) {
      if (seen.has(rule)) continue;
      seen.add(rule);
      hits.push(rule);
    }
  }
  // Stabile Sortierung: Level absteigend, bei Gleichstand Deklarationsreihenfolge.
  const order = new Map(CLADE_RULES.map((r, i) => [r, i]));
  hits.sort((a, b) => b.level - a.level || order.get(a) - order.get(b));
  return hits;
}

/**
 * Stufe (b): Gen-Werte aus der Elterntaxon-Kette ableiten.
 *
 * @param {string[]} lineageQids  Elterntaxon-Kette (P171). Reihenfolge egal, s. Kopf.
 * @param {string|null} rank      taxonomischer Rang (P105 als Klartext, z. B. "species",
 *                                "genus", "family"). Aendert KEINEN Genwert — siehe
 *                                `broad` unten fuer den einzigen Effekt.
 * @param {object} [opts]
 * @param {string|null} [opts.selfQid]  QID des Taxons selbst; wird der Kette vorangestellt,
 *                                falls die Ernte sie nicht mitliefert.
 * @returns {{
 *   genome: (number|null)[],   // 25 Werte, null = diese Stufe sagt nichts dazu
 *   conf:   (number|null)[],   // 25x 2 (aus der Klade abgeleitet) bzw. null
 *   byGene: Record<string, number>,   // nur die gesetzten Gene, benannt
 *   source: Record<string, string>,   // Gen -> QID der Regel, die gewonnen hat
 *   matched: {qid:string, sci:string, de:string, level:number}[],  // spezifischste zuerst
 *   count: number,             // Anzahl belegter Gene
 *   rank: string|null,
 *   broad: boolean             // true, wenn der Eintrag selbst kein Art-/Gattungsrang ist
 * }}
 *
 * KONFLIKTREGEL: Setzen mehrere Regeln dasselbe Gen, gewinnt die mit dem HOECHSTEN
 * `level` (die spezifischste Klade). Umgesetzt, indem die Regeln von der breitesten
 * zur spezifischsten angewandt werden und spaetere frueheren ueberschreiben.
 *
 * KEINE ENTSCHEIDUNG GEGEN STUFE (a): das Ergebnis traegt durchgehend Konfidenz 2.
 * Ob ein hier abgeleiteter Wert einen gemessenen Wert (Konfidenz 3) verdraengen darf,
 * entscheidet allein der Aufrufer in Schritt 1.3 — dieses Modul weiss nichts davon.
 */
export function applyCladeRules(lineageQids, rank = null, opts = {}) {
  const chain = opts.selfQid ? [opts.selfQid, ...(lineageQids || [])] : (lineageQids || []);
  const hits = matchRules(chain);

  const genome = new Array(GENES.length).fill(null);
  const conf = new Array(GENES.length).fill(null);
  const byGene = {};
  const source = {};

  // Von der breitesten Regel zur spezifischsten — die spezifischste schreibt zuletzt
  // und gewinnt damit jeden Konflikt.
  for (let i = hits.length - 1; i >= 0; i--) {
    const rule = hits[i];
    const tag = Array.isArray(rule.qid) ? rule.qid[0] : rule.qid;
    for (const [gene, value] of Object.entries(rule.genes)) {
      const idx = GENE_INDEX[gene];
      if (idx === undefined) continue;      // unbekanntes Gen -> ignorieren (G2 im Pruefstand faengt das)
      genome[idx] = value;
      conf[idx] = CLADE_CONFIDENCE;
      byGene[gene] = value;
      source[gene] = tag;
    }
  }

  const SPECIFIC_RANKS = new Set(["species", "subspecies", "variety", "genus", "subgenus"]);

  return {
    genome,
    conf,
    byGene,
    source,
    matched: hits.map((r) => ({
      qid: Array.isArray(r.qid) ? r.qid[0] : r.qid, sci: r.sci, de: r.de, level: r.level,
    })),
    count: genome.filter((v) => v !== null).length,
    rank: rank ?? null,
    // Einziger Effekt von `rank`: eine Markierung fuer den Aufrufer. Ein Eintrag
    // oberhalb des Gattungsrangs beschreibt ein KLADEN-MITTEL, keine Art — Schritt 1.4
    // kann das bei der Aufnahmeschwelle beruecksichtigen. Auf die Genwerte selbst darf
    // der Rang nicht wirken: dieselbe Klade sagt ueber eine Art nichts anderes aus als
    // ueber ihre Gattung, und eine rangabhaengige Korrektur waere eine erfundene Zahl.
    broad: rank != null && !SPECIFIC_RANKS.has(rank),
  };
}

/**
 * Abdeckungsbericht: wie viele der 25 Gene belegt eine Kette, und welche Regel
 * war die spezifischste? Fuer den Pruefstand und fuer Schritt 1.3.
 */
export function coverageOf(lineageQids, rank = null, opts = {}) {
  const r = applyCladeRules(lineageQids, rank, opts);
  return {
    count: r.count,
    fraction: r.count / GENES.length,
    mostSpecific: r.matched[0] || null,
    rules: r.matched.length,
    missing: GENES.filter((_, i) => r.genome[i] === null),
  };
}
