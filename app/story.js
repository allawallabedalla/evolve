// ============================================================================
// Erzählwerk — die Chronik-Stimme des Spiels.
//
// AUFGABE: das Gefühl eines UNENDLICHEN Vorrats an Sätzen, ohne externes
// Sprachmodell, offline, in einer Datei, deterministisch.
//
// Warum kein flacher Phrasen-Katalog: 100 feste Sätze sind nach zwei Sitzungen
// auswendig gelernt. Warum kein reiner Zufalls-Baukasten: das ist Comptons
// „10.000 Schüsseln Haferbrei" — mathematisch verschieden, gefühlt identisch.
// Rabii & Cook (FDG 2023) zeigen formal, woran das liegt: die Komplexität der
// Ausgabe ist durch das WISSEN begrenzt, das im Generator steckt. Mehr Würfel
// erzeugen keine Bedeutung, nur Rauschen.
//
// UNSER WISSEN IST DIE SIMULATION. Emily Shorts Begriff dafür ist *Salienz*:
// wie viel vom Weltmodell steckt im Satz. Das Spiel hat 25 Gene, 16 Umwelt-
// Achsen, 43 Formen, 5 Reiche, Fitness und einen Selektionsgradienten — der
// Generator liest sie und redet über SIE. Zwei Sätze sind dann nicht deshalb
// verschieden, weil ein Würfel anders fiel, sondern weil die Welt anders steht.
//
// AUFBAU (drei Schichten, wie in Bruno Dias' „Improv": Modell → Tags → Grammatik)
//   1. tagsOf(ctx)  — Simulationszustand -> Menge von Fakten-Tags (kalt, jagd,
//      hunger, k-pilz, gepanzert, not, …). Das ist die Salienz-Schicht.
//   2. KERN-Pools   — situationsspezifische Hauptaussagen, nach Tags gefiltert.
//      Sie tragen die BEDEUTUNG (welches Gen, welche Achse, welches Reich).
//   3. Textur-Pools — #auftakt#, #ausklang#, #zeit# + Satz-Schablonen. Sie
//      tragen den KLANG. Nach denselben Tags gefiltert, damit nie ein
//      Hitze-Bild in einer Eiswelt landet.
//
// GRAMMATIK-REGELN (damit deutsche Sätze montierbar bleiben)
//   · Jedes Fragment ist ein VOLLSTÄNDIGER Hauptsatz in Verbzweitstellung.
//     Dadurch entfällt jede Kongruenz-Frage zwischen den Bausteinen — der
//     klassische Fallstrick bei deutscher Wort-für-Wort-Generierung.
//   · Fragmente beginnen KLEIN; polish() setzt Satzanfänge groß.
//   · Schablonen verbinden nur mit „. ", „ — ", „: ", „, und " — alles
//     Verbindungen, die die Verbstellung NICHT ändern (kein „weil/obwohl").
//
// DETERMINISMUS: keine Zufallszahl, keine Uhr. Die Auswahl ist eine reine
// Funktion aus (lineageSeed, Beat, Situations-Schlüssel, Generation, Gedächtnis).
// Derselbe Spielverlauf erzählt dieselbe Geschichte — reproduzierbar und
// prüfbar (`npm run story-check`, Stichproben-Lint über 20.000 Sätze).
//
// LEITPLANKEN (BACKLOG „Produkt-Pfeiler"), maschinell erzwungen:
//   · keine Absichts-Sprache („will/versucht/lernt") — erzählt wird AUSLESE.
//   · kein Ausrufezeichen, kein Emoji, kein Sammel-Nag, max. 132 Zeichen.
// ============================================================================
(function (root) {
  "use strict";

  const VERSION = 2;
  const MAX_LEN = 120;
  // Zwei Gedächtnisse, weil Wiederholung auf zwei Ebenen auffällt: ein bekannter
  // BAUSTEIN wirkt schal, eine bekannte ZEILE wirkt kaputt. Beide werden im
  // selben Ringpuffer gehalten (Zeilen-Hashes tragen das Präfix „L").
  const MEM_FRAG = 90;     // zuletzt benutzte Bausteine, die gemieden werden
  const MEM_LINE = 160;    // zuletzt gesagte Zeilen, die nicht wiederkommen dürfen
  const TRIES = 12;        // Anläufe je Zeile (Länge/Wortdopplung/Wiederholung)

  // Beats = die sinnvollen Stellen im Spiel. `gap` = Mindestruhe (ms), bevor
  // dieser Beat erneut sprechen darf. Die großen Momente warten nicht.
  const BEATS = {
    anfang:   { gap: 0,     label: "Ein neues Leben beginnt" },
    heimkehr: { gap: 0,     label: "Rückkehr nach Abwesenheit" },
    welt:     { gap: 5000,  label: "Die Umwelt hat sich geändert" },
    druck:    { gap: 20000, label: "Ein Merkmal steht anhaltend unter Auslese" },
    wandel:   { gap: 2000,  label: "Die Form ist gekippt" },
    reich:    { gap: 0,     label: "Ein Reich des Lebens erwacht" },
    fund:     { gap: 0,     label: "Eine neue Form ist aufgetaucht" },
    ruhe:     { gap: 20000, label: "Gleichgewicht — nichts bewegt sich mehr" },
    not:      { gap: 25000, label: "Die Passung ist lange schlecht" },
    bluete:   { gap: 25000, label: "Die Passung ist lange sehr gut" },
    zeit:     { gap: 12000, label: "Eine Generationen-Marke ist gefallen" },
  };

  // ==========================================================================
  // 1. SALIENZ — Simulationszustand zu Fakten-Tags
  // ==========================================================================
  const GENE_TAGS = [   // Gen-Index -> Körper-Tag, wenn stark ausgeprägt
    null, null, null, null, "gepanzert", "gruen", "mobil", "hoch", "fliegend", "leuchtend",
  ];

  function tagsOf(ctx) {
    const t = new Set();
    const e = ctx.env || {};
    const n = (k, d) => (e[k] === undefined ? d : e[k]);
    const g = ctx.genome || [];

    // --- Klima / Milieu (die sechs Kern-Achsen) ---
    const T = n("temperature", .5);
    t.add(T < .3 ? "kalt" : T > .7 ? "heiss" : "mild");
    if (T < .12) t.add("eis");
    if (T > .88) t.add("glut");
    const L = n("light", .5);
    t.add(L < .3 ? "dunkel" : L > .7 ? "hell" : "daemmer");
    if (L < .12) t.add("finster");
    const W = n("water", .6);
    t.add(W < .3 ? "trocken" : W > .7 ? "nass" : "feucht");
    const F = n("foodAbundance", .5);
    t.add(F < .3 ? "hunger" : F > .7 ? "fuelle" : "karg");
    const P = n("predation", .3);
    t.add(P > .6 ? "jagd" : P < .2 ? "sicher" : "wachsam");
    t.add(n("foodHeight", .2) > .6 ? "hochnahrung" : "bodennah");

    // --- verborgene Stressoren (kommen nur über Umwelt-Einflüsse) ---
    if (n("toxicity", 0) > .05) t.add("gift");
    if (n("oxygen", 1) < .8) t.add("hypoxie");
    if (n("salinity", 0) > .05) t.add("salz");
    if (n("uv", 0) > .05) t.add("uv");
    if (n("pressure", 0) > .05) t.add("tiefe");
    if (n("aridity", 0) > .05) t.add("duerre");
    if (n("radiation", 0) > .05) t.add("strahlung");
    if (n("fire", 0) > .05) t.add("feuer");
    if (n("frost", 0) > .05) t.add("frostnacht");
    if (n("wind", 0) > .05) t.add("sturm");
    if (["gift","hypoxie","salz","uv","tiefe","duerre","strahlung","feuer","frostnacht","sturm"]
        .some(x => t.has(x))) t.add("extrem");

    // --- Körper / Reich (der Phänotyp, der gerade lebt) ---
    if (ctx.kingdom) t.add("k-" + String(ctx.kingdom).toLowerCase().replace(/[^a-zäöü]/g, ""));
    for (let i = 0; i < GENE_TAGS.length; i++) {
      if (GENE_TAGS[i] && g[i] !== undefined && g[i] > .66) t.add(GENE_TAGS[i]);
    }
    if (g[1] !== undefined) t.add(g[1] < .25 ? "winzig" : g[1] > .75 ? "riesig" : "mittelgross");
    if (g[6] !== undefined && g[6] < .25) t.add("sessil");

    // --- Lage der Linie ---
    const v = ctx.vit;
    if (v !== undefined) t.add(v < .35 ? "not" : v > .8 ? "bluete" : "auskommen");
    const gen = ctx.gen || 0;
    t.add(gen < 200 ? "jung" : gen > 5000 ? "uralt" : "gewachsen");
    if (ctx.dir === 1) t.add("auf");
    if (ctx.dir === -1) t.add("ab");
    if (ctx.rarity) t.add("r-" + ctx.rarity);
    // Der Anlass selbst ist ein Tag. Damit kann jeder Textur-Baustein sagen,
    // wo er NICHT hinpasst — „seit vielen Generationen unverändert" darf nicht
    // in dem Moment stehen, in dem sich die Welt gerade geändert hat.
    if (ctx.beat) t.add("b-" + ctx.beat);
    return t;
  }

  // ==========================================================================
  // 2. TEXTUR — geteilte Pools. Schreibweise: [Text, "tag,tag" | "!tag"]
  //    leere Bedingung = immer erlaubt. Alle Fragmente: Hauptsatz, klein
  //    beginnend, ohne Schlusspunkt.
  // ==========================================================================

  // #auftakt# — verortet den Satz in der Welt, die gerade wirklich eingestellt ist
  const AUFTAKT = [
    ["die Kälte steht über allem", "kalt"],
    ["nichts hier gibt Wärme zurück", "kalt"],
    ["der Frost sitzt im Boden", "kalt"],
    ["jeder Atemzug kostet Wärme", "kalt"],
    ["die Hitze drückt auf jeden Körper", "heiss"],
    ["die Luft flimmert über dem Grund", "heiss"],
    ["Schatten ist hier wertvoller als Nahrung", "heiss"],
    ["das Licht reicht bis auf den Grund", "hell"],
    ["über allem steht eine offene Sonne", "hell"],
    ["Licht liegt im Überfluss", "hell"],
    ["kaum ein Strahl kommt hier unten an", "dunkel"],
    ["die Dunkelheit verschluckt jede Farbe", "dunkel"],
    ["hier gibt es nichts zu sehen und viel zu ertasten", "finster"],
    ["das Wasser steht bis in jede Ritze", "nass"],
    ["alles hier trieft", "nass"],
    ["der Boden hält keinen Tropfen", "trocken"],
    ["die Luft zieht jede Feuchte aus dem Gewebe", "trocken"],
    ["Nahrung liegt herum, als koste sie nichts", "fuelle"],
    ["der Tisch ist gedeckt", "fuelle"],
    ["zwischen den Mahlzeiten liegen Generationen", "hunger"],
    ["hier ist Hunger der Normalzustand", "hunger"],
    ["was essbar ist, hängt außer Reichweite", "hochnahrung"],
    ["etwas jagt hier, und es hat Zeit", "jagd"],
    ["Augen liegen auf jedem, der sich bewegt", "jagd"],
    ["niemand jagt hier", "sicher"],
    ["diese Welt lässt einen in Ruhe", "sicher"],
    ["das Milieu ist vergiftet", "gift"],
    ["Salz zieht durch jedes Gewebe", "salz"],
    ["die Luft trägt kaum noch Sauerstoff", "hypoxie"],
    ["die Sonne brennt ungefiltert herunter", "uv"],
    ["über allem liegt das Gewicht des Wassers", "tiefe"],
    ["der Wind hört nicht auf", "sturm"],
    ["Feuer gehört hier zum Jahreslauf", "feuer"],
    ["die Welt ringsum bleibt, wie sie ist", "!b-welt,!b-wandel,!b-heimkehr"],
    ["die Bedingungen sind gesetzt", ""],
    ["so steht die Welt gerade", ""],
    ["das ist die Welt, in die du {wesen} gestellt hast", ""],
    ["hier lebt {wesen} gerade", ""],
    ["die Umgebung, die du eingestellt hast, wirkt", ""],
    ["die Umgebung macht {demwesen} das Leben nicht leicht", "!bluete"],
    ["so, wie es hier steht, muss {wesen} damit zurechtkommen", ""],
    ["an dieser Umgebung gibt es nichts zu deuteln", ""],
    ["hier zählt nur, was durchkommt", ""],
    // Die MITTE ist keine Lücke, sondern ein Zustand: milde Welten müssen
    // genauso viele Bilder haben wie die Extreme, sonst wird der Auftakt-Pool
    // dort dünn und die Wiederholung spürbar (Befund des Prüfstands).
    ["nichts hier ist übertrieben", "mild"],
    ["diese Welt hat weder Zähne noch Geschenke", "mild"],
    ["ein Klima ohne Ausreden", "mild"],
    ["die Wärme reicht, mehr aber auch nicht", "mild"],
    ["das Licht steht halbhoch", "daemmer"],
    ["zwischen Licht und Schatten ist alles möglich", "daemmer"],
    ["im Halbdunkel entscheidet nicht das Auge", "daemmer"],
    ["es gibt genug, aber nichts im Überfluss", "karg"],
    ["die Nahrung reicht, wenn man sparsam ist", "karg"],
    ["Feuchte genug, um zu wachsen", "feucht"],
    ["gelegentlich streift etwas vorbei", "wachsam"],
    ["Gefahr gibt es, aber sie kommt selten", "wachsam"],
    ["alles Wichtige liegt am Boden", "bodennah"],
    ["hier stehen weder Rekorde noch Ruinen", "mittelgross"],
    // Der KÖRPER, der gerade lebt, ist genauso Teil der Lage wie das Klima.
    ["was hier wächst, wird nie einen Schritt tun", "k-pflanze"],
    ["dieses Leben rührt sich nicht vom Fleck", "sessil"],
    ["hier bewegt sich etwas und sucht", "k-tier"],
    ["was hier lebt, lebt vom Zerfall", "k-pilz"],
    ["das Kleinste ist hier das Zäheste", "k-mikrobe"],
    ["eine einzelne Zelle hält hier alles zusammen", "winzig"],
    ["diese Masse muss jeden Tag verdient werden", "riesig"],
    ["unter dem Panzer geht das Leben ruhiger", "gepanzert"],
    ["dieser Körper gehört inzwischen der Luft", "fliegend"],
    ["das eigene Licht ist das einzige weit und breit", "leuchtend"],
    ["das Grün trägt hier die ganze Rechnung", "gruen"],
    ["dieser Bau ist auf Bewegung gerechnet", "mobil"],
    ["{wesen} stammt aus einer sehr langen Reihe von Vorfahren", "uralt"],
    ["{wesen} hat erst wenige Generationen hinter sich", "jung"],
  ];

  // #ausklang# — der Nachhall: was das Gesagte über Evolution bedeutet
  // #ausklang# — der Nachsatz. NEU (Nutzer 2026-07): nüchtern und konkret statt
  // sentenzhaft. Der alte Pool war ein Aphorismen-Buch über Evolution im Allgemeinen
  // („kein einzelnes Wesen erlebt diesen Satz") — das schob den Spieler weg von SEINEM
  // Tier. Der Nachsatz sagt jetzt, was das für dieses Wesen bedeutet, was es kostet,
  // was man sehen wird und was passiert, wenn man die Welt wieder ändert.
  // {wesen} = Name oder „dein Wesen"; {demwesen} = Dativ; {gen} = Generation.
  const AUSKLANG = [
    // — was man sehen wird
    ["am Umriss ist davon schon etwas zu erkennen", ""],
    ["du siehst es am Bild, wenn du eine Weile zuschaust", ""],
    ["noch ist es kaum zu sehen", ""],
    ["in ein paar hundert Generationen sieht {wesen} anders aus als jetzt", ""],
    ["die nächsten Generationen zeigen, ob das reicht", ""],
    ["bei {demwesen} ist es schon angelegt", ""],
    ["viel schneller geht das nicht", ""],
    ["das braucht Zeit, keine Entscheidung", ""],
    // — was es kostet
    ["billig ist das nicht", ""],
    ["die Energie dafür fehlt an anderer Stelle", ""],
    ["{wesen} bezahlt das woanders", ""],
    ["jeder Vorteil hier kostet etwas dort", ""],
    ["dafür bleibt weniger für alles andere übrig", ""],
    // — Abhängigkeit von DEINER Welt
    ["solange du die Welt so lässt, bleibt das so", ""],
    ["drehst du wieder daran, dreht sich auch das zurück", ""],
    ["stell die Welt anders ein, und es gilt nicht mehr", ""],
    ["das gilt hier und an keinem anderen Ort", ""],
    ["eine andere Umgebung hätte etwas anderes hervorgebracht", ""],
    // — Bezug zur Vorgeschichte des Wesens
    ["am Anfang war davon nichts da", ""],
    ["vor hundert Generationen sah das noch anders aus", ""],
    ["das ist der Stand nach {gen} Generationen", ""],
    ["die Nachkommen tragen mehr davon als die Eltern", ""],
    ["Schritt für Schritt, seit dem ersten Vorfahren dieser Linie", ""],
    // — nüchterne Mechanik, ohne Sentenz
    ["nicht das einzelne Tier ändert sich, sondern was von Generation zu Generation übrig bleibt", ""],
    ["die Nachkommen mit dem Merkmal werden einfach mehr", ""],
    ["wer hier besser zurechtkommt, hinterlässt mehr Junge", ""],
    ["der Unterschied ist winzig und wirkt trotzdem", ""],
    // — lagebezogen
    ["die Kälte lässt kaum eine andere Wahl", "kalt"],
    ["in der Hitze wird jedes Gramm zu viel zum Problem", "heiss"],
    ["bei so wenig Nahrung zählt jede eingesparte Kalorie", "hunger"],
    ["bei so viel Nahrung fällt Verschwendung nicht ins Gewicht", "fuelle"],
    ["im Dunkeln nützt {demwesen} kein grünes Blatt", "dunkel"],
    ["das Licht liefert hier zuverlässiger als jede Beute", "hell"],
    ["Wasser ist hier das knappste Gut", "trocken"],
    ["mit Jägern draußen zählt vor allem, nicht aufzufallen", "jagd"],
    ["hier draußen verzeiht nichts einen Fehler", "extrem"],
    ["mehr ist aus dieser Welt nicht herauszuholen", "not"],
    ["besser wird es hier kaum noch", "bluete"],
    ["{wesen} kommt damit gut durch", "bluete"],
  ];

  // #zeit# — Zeitmaß als nachgestelltes Adverbial oder Vorspann
  // Ein Zeitmaß, das Dauer behauptet, passt nicht in einen Moment des Umbruchs
  // — darum tragen die Verlaufs-Angaben „!b-welt,!b-wandel,!b-fund" usw.
  const LAUF = "!b-welt,!b-wandel,!b-fund,!b-reich,!b-anfang";
  const ZEIT = [
    ["Generation für Generation", "!b-welt"],
    ["über hunderte Generationen hinweg", LAUF],
    ["in wenigen Dutzend Generationen", "!b-welt"],
    ["langsam, aber ohne Pause", "!b-welt"],
    ["seit vielen Generationen unverändert", LAUF + ",!b-heimkehr,!b-druck"],
    ["Schritt für Schritt, ohne Umweg", "!b-welt"],
    ["über eine Kette, die nie riss", LAUF],
    ["so lange, wie diese Welt so steht", ""],
    ["stetig, wie ein Tropfen auf Stein", "!b-welt"],
    ["mit jedem Nachwuchs ein Stück weiter", "!b-welt"],
    ["in der Zeitrechnung der Vererbung", ""],
    ["über mehr Generationen, als du zusehen magst", LAUF],
    ["seit dem ersten Tag dieser Linie", "jung," + LAUF],
    ["länger, als diese Linie zurückblicken kann", "uralt," + LAUF],
    // Umbruch-Momente brauchen ein Zeitmaß, das nach VORN zeigt.
    ["von dieser Generation an", "b-welt"],
    ["ab dem nächsten Nachwuchs", "b-welt"],
    ["von jetzt an, jede Generation neu", "b-welt"],
    ["und das ab sofort", "b-welt,b-wandel"],
  ];

  // ==========================================================================
  // 3. KERN — die situationsspezifischen Aussagen. Sie tragen die Salienz:
  //    hier steckt drin, WAS in der Simulation tatsächlich passiert ist.
  // ==========================================================================

  // --- anfang -------------------------------------------------------------
  const ANFANG = [
    ["hier fängt etwas ohne Eigenschaften an", ""],
    ["alles steht auf Anfang, in jeder Achse die Mitte", ""],
    ["was daraus wird, entscheidet die Welt ringsum", ""],
    ["noch ist nichts entschieden", ""],
    ["eine neue Linie beginnt bei null", ""],
    ["dieselben Regeln wie beim letzten Mal, ein anderer Ausgang", ""],
    ["diese Bahn wird sich nie genau wiederholen", ""],
    ["die erste Generation kennt noch keinen Vorteil", ""],
    ["die Kälte wird die erste Frage stellen", "kalt"],
    ["die Hitze stellt die erste Rechnung", "heiss"],
    ["ein Start im Dunkeln, wo Grün nichts einbringt", "dunkel"],
    ["ein Start unter offener Sonne", "hell"],
    ["ein gefährlicher Anfang, gleich unter Jägern", "jagd"],
    ["ein sanfter Anfang, ohne Feinde", "sicher"],
    ["ein karger Anfang, an dem Sparsamkeit zählt", "hunger"],
    ["{wesen} fängt bei null an", ""],
    ["was aus {demwesen} wird, hängt jetzt an dir", ""],
    ["du bestimmst die Welt, nicht das Tier darin", ""],
  ];

  // --- heimkehr (Offline-Zeit) --------------------------------------------
  const HEIMKEHR = {
    "kurz-stabil": [
      ["für dich war es ein Moment, für die Linie Generationen", ""],
      ["ein paar Generationen sind ohne dich vergangen", ""],
      ["die Zeit lief weiter, die Form hielt sich", ""],
    ],
    "kurz-wandel": [
      ["in der kurzen Zeit ist die Form gekippt", ""],
      ["du warst kaum fort, und schon steht hier etwas anderes", ""],
      ["ein kurzer Moment für dich, ein Umbruch für die Linie", ""],
    ],
    "lang-stabil": [
      ["viele Generationen ohne dich, und die Form blieb", ""],
      ["diese Welt verlangte nichts Neues", ""],
      ["die Linie ist lange gelaufen und doch dieselbe geblieben", ""],
      ["was passt, muss sich nicht bewegen", ""],
    ],
    "lang-wandel": [
      ["die Linie ging weiter und kam als etwas anderes zurück", ""],
      ["in deiner Abwesenheit hat sich die Auslese durchgesetzt", ""],
      ["über all die Generationen ist die Form gekippt", ""],
      ["was hier lebt, ist nicht mehr das, was du verlassen hast", ""],
    ],
  };

  // --- welt: der Spieler hat eine Achse verschoben ------------------------
  // Schlüssel: "<achse><+|->" — die Aussage benennt die Änderung selbst.
  const WELT = {
    "temperature-": ["die Welt kühlt aus", "die Kälte greift weiter aus", "es wird kälter, Grad um Grad", "Wärme zu halten wird zur Hauptfrage"],
    "temperature+": ["die Welt heizt sich auf", "die Wärme steigt", "was eben noch schützte, wird jetzt zur Last", "Kühlung wird zum knappen Gut"],
    "predation+":   ["etwas jagt hier ab jetzt", "der Druck von außen steigt", "nicht mehr das Fressen entscheidet, sondern das Nicht-gefressen-Werden", "Deckung wird plötzlich wertvoll"],
    "predation-":   ["die Jäger sind fort", "der Druck von außen fällt weg", "Panzer und Flucht kosten weiter, zahlen aber nicht mehr"],
    "foodAbundance-": ["die Nahrung wird knapp", "der Tisch leert sich", "ab jetzt gewinnt, wer mit wenig auskommt", "Sparsamkeit schlägt Stärke"],
    "foodAbundance+": ["Nahrung liegt jetzt im Überfluss", "die Knappheit ist vorbei", "wo genug da ist, wird auch Aufwand getragen"],
    "foodHeight+":  ["das Essbare hängt jetzt hoch", "Reichweite entscheidet ab jetzt", "wer nicht hinaufkommt, geht leer aus"],
    "foodHeight-":  ["alles Essbare liegt jetzt am Boden", "Höhe trägt sich nicht mehr", "der Aufwand nach oben zahlt sich nicht mehr"],
    "light+":       ["das Licht nimmt zu", "die Sonne steht jetzt offen über allem", "wo Licht satt macht, muss niemand laufen"],
    "light-":       ["das Licht schwindet", "es wird dunkel", "Grün allein ernährt hier niemanden mehr"],
    "water+":       ["das Wasser steigt", "Feuchte zieht durch alles", "nasse Welten öffnen Wege, die trockene verschließen"],
    "water-":       ["das Wasser zieht sich zurück", "es trocknet aus", "jeder Tropfen im Körper wird jetzt zum Vorteil"],
    "toxicity+":    ["Gift sickert ins Milieu", "das Milieu kippt ins Giftige", "ab jetzt zählt, wer es unschädlich macht"],
    "toxicity-":    ["das Gift ist fort", "die teure Entgiftung trägt sich nicht mehr"],
    "oxygen-":      ["die Luft wird dünn", "der Sauerstoff wird knapp", "jeder Atemzug muss jetzt mehr wert sein"],
    "oxygen+":      ["der Sauerstoff kehrt zurück", "das Atmen wird wieder billig"],
    "salinity+":    ["Salz zieht ins Wasser", "das Milieu wird salzig", "wer sein Inneres nicht im Gleichgewicht hält, trocknet von innen aus"],
    "salinity-":    ["das Salz verschwindet aus dem Wasser"],
    "uv+":          ["die Strahlung der Sonne brennt ungefiltert", "Farbe wird zum Schutz, nicht zum Schmuck"],
    "uv-":          ["die Sonne wird wieder erträglich"],
    "pressure+":    ["die Tiefe drückt", "hier unten überlebt kein Bauplan, der auf Luft gebaut ist"],
    "pressure-":    ["der Druck lässt nach"],
    "aridity+":     ["die Dürre setzt ein", "von nun an ist jeder Tropfen im Körper ein Vorteil"],
    "aridity-":     ["die Dürre bricht"],
    "radiation+":   ["unsichtbare Strahlung zerlegt das Erbgut", "wer den Schaden repariert, gibt sein Erbe weiter"],
    "radiation-":   ["die Strahlung klingt ab"],
    "fire+":        ["Feuer gehört jetzt zur Welt", "es kommt wieder, und es fragt nicht nach der schönsten Form"],
    "fire-":        ["das Feuer bleibt aus"],
    "frost+":       ["der Frost greift bis ins Gewebe", "was gefriert, bekommt keine Nachkommen"],
    "frost-":       ["der Frost lässt nach"],
    "wind+":        ["der Wind steht jetzt dauerhaft", "hoch hinaus zu wachsen wird gefährlich"],
    "wind-":        ["der Wind legt sich"],
  };
  const WELT_ALLGEMEIN = [
    ["die Welt ist eine andere", ""],
    ["was jetzt zählt, ist ein anderes als vorhin", ""],
    ["was eben noch geholfen hat, hilft {demwesen} jetzt nicht mehr", ""],
    ["die Bedingungen haben sich verschoben", ""],
    ["du hast die Regeln geändert, unter denen {wesen} lebt", ""],
    ["{wesen} muss sich jetzt auf etwas anderes einstellen", ""],
  ];

  // --- druck: EIN Merkmal steht anhaltend unter Auslese --------------------
  // Pro Gen und Richtung mehrere Bilder. Das ist die dichteste Salienz-Quelle:
  // hier redet der Text über genau das Gen, das der Gradient gerade auslest.
  const DRUCK = {
    0:  { auf: ["dichteres Fell trägt sich hier", "die wärmer eingepackten Jungen überleben den Winter häufiger", "die Dämmung wächst mit jedem Nachwuchs"],
          ab:  ["die dünner Bedeckten kommen besser durch", "Dämmung wird zur Last", "das Fell wird lichter"] },
    1:  { auf: ["die größeren Nachkommen setzen sich durch", "Masse rechnet sich hier", "der Körper wächst über die Generationen"],
          ab:  ["große Körper kosten hier zu viel", "die Kleineren bleiben übrig", "die Linie schrumpft"] },
    2:  { auf: ["wer weiter reicht, frisst öfter", "die Gliedmaßen werden länger", "Reichweite zahlt sich aus"],
          ab:  ["lange Gliedmaßen tragen sich nicht mehr", "was nicht gebraucht wird, wird abgebaut", "der Bau wird gedrungener"] },
    3:  { auf: ["ein heißer Stoffwechsel setzt sich durch", "wer mehr verbrennt, wächst hier schneller heran", "der Umsatz steigt"],
          ab:  ["die Sparsamen bleiben übrig", "der Stoffwechsel fährt herunter", "das Leben wird langsamer und billiger"] },
    4:  { auf: ["Panzer zahlt sich aus", "was nicht durchdrungen wird, hinterlässt Nachkommen", "die Hülle wird härter"],
          ab:  ["ohne Jäger ist Panzer nur Gewicht", "die Leichteren haben mehr übrig", "der Panzer wird dünner"] },
    5:  { auf: ["Grün wird zum Vorteil", "{wesen} deckt einen Teil des Bedarfs jetzt selbst aus Licht", "die Photosynthese greift durch"],
          ab:  ["das Licht reicht nicht mehr aus", "die Photosynthese verblasst", "Grün bringt hier nichts mehr ein"] },
    6:  { auf: ["Bewegung lohnt sich", "wer weiter herumkommt, findet mehr", "die Beweglicheren geben es weiter"],
          ab:  ["Laufen kostet mehr, als es einbringt", "die Linie wird ruhiger", "Bewegung wird zum Luxus"] },
    7:  { auf: ["das Stützgewebe verholzt", "Höhe braucht ein Gerüst", "der Bau wird tragfähiger"],
          ab:  ["das Gerüst wird überflüssig", "Stützgewebe kostet, ohne zu tragen"] },
    8:  { auf: ["Fläche gegen die Luft zahlt sich aus", "die ersten Segler bleiben länger oben", "der Flügel wächst"],
          ab:  ["Flügel ohne Nutzen sind teure Fracht", "die Flugfläche bildet sich zurück"] },
    9:  { auf: ["eigenes Licht wird zum Werkzeug", "im Finstern lockt, wer leuchtet", "das Leuchten setzt sich durch"],
          ab:  ["Leuchten verrät mehr, als es einbringt", "das Licht im Körper erlischt"] },
    10: { auf: ["wer das Gift zerlegen kann, hat Nachkommen", "die Entgiftung setzt sich durch"],
          ab:  ["die teure Entgiftung wird abgebaut"] },
    11: { auf: ["die sparsamere Atmung setzt sich durch", "wer mit wenig Sauerstoff auskommt, bleibt übrig"],
          ab:  ["die teure Atem-Effizienz lohnt nicht mehr"] },
    12: { auf: ["das Salz-Gleichgewicht wird zur Überlebensfrage", "wer sein Inneres im Lot hält, bleibt"],
          ab:  ["die Osmoregulation wird billiger gefahren"] },
    13: { auf: ["unter der Erde ist es sicher", "wer gräbt, entkommt dem, was oben wartet"],
          ab:  ["der Grabtrieb bringt hier nichts mehr"] },
    14: { auf: ["Farbe wird zum Schutzschild", "dunkles Pigment fängt die Strahlung ab"],
          ab:  ["das Schutzpigment verliert seinen Wert"] },
    15: { auf: ["aus dem Wasser sieben ist hier ergiebiger als jagen", "wer aus dem Wasser siebt, spart den Weg"],
          ab:  ["der Filterapparat bringt hier nichts mehr ein"] },
    16: { auf: ["unsichtbar zu sein schlägt jeden Panzer", "Tarnung setzt sich durch"],
          ab:  ["ohne Jäger bringt Tarnung {demwesen} keinen Vorteil mehr"] },
    17: { auf: ["der Körper hält dem Gewicht des Wassers stand", "Druck-Toleranz entscheidet hier unten"],
          ab:  ["die Druck-Toleranz wird überflüssig"] },
    18: { auf: ["schärfere Sinne kaufen Sekunden", "wer früher merkt, lebt länger"],
          ab:  ["teure Sinne lohnen sich hier nicht"] },
    19: { auf: ["wer Wasser hält, bleibt im Rennen", "Austrocknen wird zur häufigsten Todesart"],
          ab:  ["die Austrocknungs-Toleranz wird billiger"] },
    20: { auf: ["wer den Strahlenschaden repariert, vererbt", "Reparatur schlägt Glück"],
          ab:  ["die Strahlungs-Reparatur wird zurückgefahren"] },
    21: { auf: ["Rinde und Knospen überstehen das Feuer", "Feuerresistenz zahlt sich aus"],
          ab:  ["Feuerschutz kostet, ohne zu schützen"] },
    22: { auf: ["Frostschutz sitzt unscheinbar im Gewebe", "wer nicht gefriert, hat Nachkommen"],
          ab:  ["der Frostschutz wird abgebaut"] },
    23: { auf: ["niedrig und zäh übersteht den Wind", "Windhärte entscheidet über Bruch oder Bestand"],
          ab:  ["Windhärte kostet mehr, als sie bringt"] },
    24: { auf: ["Stickstoff aus der Luft schlägt Stickstoff aus dem Boden", "die eigene Düngung setzt sich durch"],
          ab:  ["die teure Stickstoff-Fixierung wird aufgegeben"] },
  };
  // Rückfall für jedes Gen ohne eigenes Bild (Platzhalter aus dem Lexikon).
  const DRUCK_ALLGEMEIN = {
    auf: [["{merkmal} steigt, weil die Träger mehr Nachkommen hinterlassen", ""],
          ["bei {demwesen} nimmt {merkmal} zu", ""],
          ["du wirst sehen, wie {merkmal} bei {demwesen} weiter steigt", ""],
          ["diese Welt liest {merkmal} heraus", ""],
          ["der Vorteil von {merkmal} ist winzig, die Generationen sind viele", ""]],
    ab:  [["{merkmal} wird zurückgedrängt", ""],
          ["bei {demwesen} geht {merkmal} zurück", ""],
          ["{wesen} legt {merkmal} nach und nach ab", ""],
          ["{merkmal} kostet hier mehr, als es einbringt", ""],
          ["die Linie legt {merkmal} ab", ""]],
  };

  // --- wandel: die Form ist gekippt ---------------------------------------
  const WANDEL = {
    "Pflanze": ["die Linie hat das Suchen aufgegeben", "hier steht jetzt etwas still und lebt vom Licht", "aus Bewegtem wurde Verwurzeltes"],
    "Tier":    ["aus Verwurzeltem wird Bewegtes", "von hier an wird das Futter selbst geholt", "hier bewegt sich etwas aus eigener Kraft"],
    "Pilz":    ["ohne Licht und ohne Jagd bleibt {demwesen} nur das Zersetzen", "die Linie lebt jetzt von dem, was andere zurücklassen", "das Leben zieht sich in den Boden"],
    "Mikrobe": ["zurück ins Winzige", "wer fast nichts braucht, übersteht fast alles", "die Form fällt auf das Nötigste zusammen"],
    "Protist": ["schwimmen und zugleich vom Licht leben", "die Linie steht zwischen den Reichen", "{wesen} kann beides ein wenig und nichts davon ganz"],
    "intern":  ["derselbe Ast, ein anderer Zweig", "die Schwelle ist überschritten", "was eben noch {vorher} war, ist jetzt {form}"],
  };
  const WANDEL_ALLGEMEIN = [
    ["nicht ein Tier hat sich verwandelt — die ganze Linie hat sich verschoben", ""],
    ["was hier lebt, ist nicht mehr dasselbe wie vorher", ""],
    ["die Grenze zwischen zwei Bauplänen ist gefallen", ""],
  ];

  // --- reich ---------------------------------------------------------------
  const REICH = {
    "Mikrobe": ["das älteste Kapitel überhaupt schlägt sich auf", "Leben, das seit Milliarden Jahren mit fast nichts auskommt", "hier beginnt alles, immer wieder"],
    "Protist": ["ein Einzeller zwischen den Reichen", "hier hat das Leben den Zellkern erfunden", "eine Zelle, die schwimmt und zugleich grünt"],
    "Pflanze": ["zum ersten Mal wächst hier etwas aus Licht", "alles Grüne der Erde hat so angefangen", "Leben, das steht und trotzdem gewinnt"],
    "Pilz":    ["das Reich unter dem Boden meldet sich", "hier wird Ende wieder zu Anfang", "es zersetzt, verbindet und bleibt unsichtbar"],
    "Tier":    ["etwas bewegt sich aus eigener Kraft", "von nun an muss gefunden werden, was gebraucht wird", "das Reich der Sucher öffnet sich"],
    "alle":    ["fünf Reiche, ein Baum", "alles davon wuchs aus denselben Regeln, nur in anderen Welten"],
  };

  // --- fund ----------------------------------------------------------------
  const FUND = {
    "legendaer":   ["diese Form gewinnt fast nirgends", "dass {wesen} hier gelandet ist, war ein schmaler Zufall", "kaum eine Welt führt zu diesem Bauplan"],
    "sehr-selten": ["eine Form für eine sehr enge Nische", "sie passt in diese Welt und in fast keine andere", "nur wenige Umwelten bringen so etwas hervor"],
    "selten":      ["selten gesehen", "nur wenige Umgebungen führen überhaupt zu dieser Form"],
    "gelegentlich":["eine Form, die es in deinem Lebensbaum noch nicht gab", "neu in deiner Sammlung von Welten", "diesen Bauplan hattest du noch nicht"],
    "haeufig":     ["ein Bauplan, den viele Welten hervorbringen", "ein Bauplan, der oft gewinnt und selten auffällt", "hier taucht etwas zum ersten Mal auf"],
  };

  // --- ruhe / not / bluete -------------------------------------------------
  const RUHE = [
    ["nichts drängt mehr", ""],
    ["diese Form ist die Antwort auf diese Welt", ""],
    ["die Auslese ist satt", ""],
    ["jede Abweichung kostet jetzt mehr, als sie einbringt", ""],
    ["Mutation und Auslese heben sich auf", ""],
    ["die Linie steht, bis sich die Welt rührt", ""],
    ["hier ist nichts mehr zu holen und nichts mehr zu verlieren", ""],
    ["kaum ein Bauplan würde hier besser passen", "bluete"],
    ["Stillstand, aber kein Sieg", "not"],
    ["das Gleichgewicht ist erreicht, nicht das Optimum", ""],
    ["{wesen} hat gefunden, was in dieser Welt geht", ""],
    ["du kannst {demwesen} jetzt lange zusehen, ohne dass sich viel ändert", ""],
    ["so bleibt {wesen}, bis du etwas an der Welt änderst", ""],
    ["hier ist {wesen} angekommen", ""],
  ];
  const NOT = [
    ["die Welt verlangt mehr, als dieser Körper hergibt", ""],
    ["jede Generation verliert mehr, als sie gewinnt", ""],
    ["die Auslese greift jetzt hart durch", ""],
    ["der Bauplan passt nicht zu dem, was hier gilt", ""],
    ["es kommt nur ein Rest durch", ""],
    ["die Kälte nimmt mehr, als nachwächst", "kalt"],
    ["die Hitze verbrennt, was zu viel trägt", "heiss"],
    ["der Hunger ist der eigentliche Jäger dieser Welt", "hunger"],
    ["zu viele Jäger, zu wenig Deckung", "jagd"],
    ["dieses Milieu ist schneller als jede Anpassung", "extrem"],
    ["{wesen} kommt hier schlecht zurecht", ""],
    ["du siehst es an der Passung: viel fehlt", ""],
    ["so wie die Welt jetzt steht, hat {wesen} es schwer", ""],
    ["ein Regler in die richtige Richtung würde {demwesen} sehr helfen", ""],
  ];
  const BLUETE = [
    ["alles passt", ""],
    ["mehr Nachkommen als Verluste", ""],
    ["diese Welt und dieser Körper meinen dasselbe", ""],
    ["der Bauplan schöpft aus, was hier zu holen ist", ""],
    ["die Linie trägt", ""],
    ["hier wird nichts verschwendet", ""],
    ["das Grün deckt die ganze Rechnung", "k-pflanze"],
    ["die Jagd zahlt sich aus", "k-tier"],
    ["{wesen} ist hier goldrichtig", ""],
    ["besser könnte {wesen} diese Welt kaum treffen", ""],
    ["du hast {demwesen} eine Welt gebaut, die passt", ""],
  ];

  // --- zeit (Generationen-Marken) ------------------------------------------
  const MARK = {
    100:    ["hundert Generationen sind gefallen", "so lange braucht es in der Natur, bis Farbe oder Größe kippen"],
    500:    ["fünfhundert Generationen", "bei Mäusen wäre das ein Jahrhundert"],
    1000:   ["tausend Generationen", "vom ersten Vorfahren ist außer der Linie nichts übrig"],
    5000:   ["fünftausend Generationen ununterbrochener Vererbung", "keine einzige Generation davon ist ausgefallen"],
    10000:  ["zehntausend Generationen", "in dieser Spanne sind aus Wölfen Hunde geworden, mehrfach"],
    50000:  ["fünfzigtausend Generationen", "solche Ketten trennen ganze Arten voneinander"],
    100000: ["hunderttausend Generationen, eine ungebrochene Linie", "genau so alt ist jedes Lebewesen"],
  };

  // ==========================================================================
  // 4. SCHABLONEN — verbinden nur Hauptsätze, ändern keine Verbstellung.
  //    `min` = wie viele Bausteine mindestens gefüllt sein müssen.
  // ==========================================================================
  const SHAPES = [
    "#auftakt#. #kern#.",
    "#kern# — #ausklang#.",
    "#auftakt#: #kern#.",
    "#kern#. #ausklang#.",
    "#auftakt#, und #kern#.",
    "#kern#, #zeit#.",
    "#zeit#: #kern#.",
    "#kern#.",
    "#kern# — #ausklang#, #zeit#.",
    "#auftakt#. #kern# — #ausklang#.",
  ];

  // ==========================================================================
  // 5. MASCHINE — deterministische Auswahl, Anti-Wiederholung, Politur
  // ==========================================================================
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function prng(seed) {   // mulberry32 — dieselbe Familie wie die Engine
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Bedingung: "kalt,jagd" = alle nötig; "!hell" = verboten; "" = immer.
  function condOk(cond, tags) {
    if (!cond) return true;
    for (const raw of cond.split(",")) {
      const c = raw.trim(); if (!c) continue;
      if (c[0] === "!") { if (tags.has(c.slice(1))) return false; }
      else if (!tags.has(c)) return false;
    }
    return true;
  }
  // Pool -> gefilterte Kandidaten mit stabiler id (Slotname + Index).
  // Format je Eintrag: [Text, Bedingung, Gewicht?] — Gewicht < 1 macht einen
  // Baustein selten. Das brauchen die allgemeinen Rückfall-Sätze: sie dürfen nie
  // die konkrete Aussage verdrängen (sonst geht genau die Salienz verloren,
  // die den Unterschied zu Haferbrei ausmacht).
  function candidates(pool, name, tags) {
    const out = [];
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const text = Array.isArray(p) ? p[0] : p;
      const cond = Array.isArray(p) ? (p[1] || "") : "";
      const w = Array.isArray(p) && p[2] !== undefined ? p[2] : 1;
      if (condOk(cond, tags)) out.push({ id: name + ":" + i, t: text, w });
    }
    return out;
  }
  // Wahl: frisches vor kürzlich Gesagtem (perzeptive Neuheit schlägt Zufall),
  // innerhalb dessen gewichtet.
  function draw(cands, rnd, mem) {
    if (!cands.length) return null;
    const fresh = cands.filter(c => !mem.has(c.id));
    const pool = fresh.length ? fresh : cands;
    let total = 0; for (const c of pool) total += c.w;
    let r = rnd() * total;
    for (const c of pool) { r -= c.w; if (r <= 0) return c; }
    return pool[pool.length - 1];
  }
  function polish(s) {
    s = s.replace(/\s+/g, " ")
         .replace(/\s+([,.;:])/g, "$1")
         .replace(/([.:,])\1+/g, "$1")
         .replace(/\.\s*—/g, " —")
         .replace(/,\s*,/g, ",")
         .trim();
    s = s.replace(/(^|[.!?]\s)([a-zäöüß])/g, (m, p, c) => p + c.toUpperCase());
    if (!/[.!?…]$/.test(s)) s += ".";
    return s;
  }
  // Perzeptions-Prüfung: dasselbe auffällige Wort in ZWEI Bausteinen einer Zeile
  // liest sich sofort als Baukasten („Generation für Generation: die Dämmung
  // wächst mit jeder Generation"). Innerhalb EINES Fragments ist Wiederholung
  // dagegen Absicht des Autors und bleibt erlaubt. Verglichen wird auf einem
  // 6-Zeichen-Stamm, damit auch Beugungen greifen (Generation/Generationen).
  const STOP = new Set(["die","der","das","und","ein","eine","einer","eines","einem","einen","ist","sind","wird","werden","hier","sich","nicht","mehr","was","wer","als","aus","von","für","mit","auf","über","dem","den","des","noch","nur","dann","dass","sie","man","hat","jede","jeder","jedes","diese","dieser","dieses","kein","keine","schon","immer","schon","etwas","alles","nichts","wenig"]);
  function stems(s) {
    const out = new Set();
    for (const w of s.toLowerCase().match(/[a-zäöüß]{5,}/g) || []) {
      if (STOP.has(w)) continue;
      out.add(w.slice(0, 6));
    }
    return out;
  }
  function crossClash(fragments) {
    const sets = fragments.map(stems);
    for (let i = 0; i < sets.length; i++)
      for (let j = i + 1; j < sets.length; j++)
        for (const w of sets[i]) if (sets[j].has(w)) return true;
    return false;
  }
  // Der Name des Wesens macht den Unterschied zwischen „eine Linie" und „meine Linie".
  // Ohne Namen bleibt es beim schlichten „dein Wesen" — nie beim abstrakten „die Linie".
  const wesen  = ctx => (ctx.name && String(ctx.name).trim() ? String(ctx.name).trim() : "dein Wesen");
  const demWesen = ctx => (ctx.name && String(ctx.name).trim() ? String(ctx.name).trim() : "deinem Wesen");
  function fill(text, ctx) {
    return text
      .replace(/\{wesen\}/g, wesen(ctx))
      .replace(/\{demwesen\}/g, demWesen(ctx))
      .replace(/\{gen\}/g, ctx.gen == null ? "vielen" : Number(ctx.gen).toLocaleString("de-DE"))
      .replace(/\{merkmal\}/g, ctx.merkmal || "dieses Merkmal")
      .replace(/\{form\}/g, ctx.to || ctx.form || "diese Form")
      .replace(/\{vorher\}/g, ctx.vorher || ctx.from || "der Vorgänger")
      .replace(/\{reich\}/g, ctx.kingdom || "");
  }

  // Der KERN-Pool für die konkrete Lage. Hier steckt die Salienz: welcher Pool
  // gewählt wird, hängt ausschließlich am Simulationszustand.
  function kernPool(ctx) {
    const b = ctx.beat;
    const wrap = (arr, tag) => arr.map(x => (Array.isArray(x) ? x : [x, tag || ""]));
    // Rückfall-Sätze bewusst leicht machen: sie sollen einspringen, nicht führen.
    const dim = arr => arr.map(x => [Array.isArray(x) ? x[0] : x, Array.isArray(x) ? (x[1] || "") : "", .06]);
    if (b === "anfang") return ANFANG;
    if (b === "heimkehr") {
      const k = ((ctx.gens || 0) >= 60 ? "lang" : "kurz") + (ctx.changed ? "-wandel" : "-stabil");
      return HEIMKEHR[k] || HEIMKEHR["kurz-stabil"];
    }
    if (b === "welt") {
      const key = ctx.chg ? ctx.chg.key + (ctx.chg.dir > 0 ? "+" : "-") : null;
      const spec = key && WELT[key] ? wrap(WELT[key]) : [];
      return spec.concat(dim(WELT_ALLGEMEIN));
    }
    if (b === "druck") {
      const rec = DRUCK[ctx.gene], dir = ctx.dir === -1 ? "ab" : "auf";
      const spec = rec && rec[dir] ? wrap(rec[dir]) : [];
      return spec.concat(spec.length ? dim(DRUCK_ALLGEMEIN[dir]) : DRUCK_ALLGEMEIN[dir]);
    }
    if (b === "wandel") {
      const kd = ctx.toK && ctx.toK !== ctx.fromK ? ctx.toK : "intern";
      const spec = WANDEL[kd] ? wrap(WANDEL[kd]) : [];
      return spec.concat(dim(WANDEL_ALLGEMEIN));
    }
    if (b === "reich") {
      const spec = wrap(REICH[ctx.kingdom] || []);
      return (ctx.kingdomCount >= 5 ? wrap(REICH.alle).concat(spec) : spec).concat(dim([["ein ganzer Ast des Lebens erwacht", ""]]));
    }
    if (b === "fund") return wrap(FUND[ctx.rarity] || FUND.haeufig);
    if (b === "ruhe") return RUHE;
    if (b === "not") return NOT;
    if (b === "bluete") return BLUETE;
    if (b === "zeit") {
      const spec = wrap(MARK[ctx.mark] || []);
      return spec.concat(dim([["wieder eine Marke gefallen", ""], ["gezählt hast das nur du — {wesen} läuft einfach weiter", ""]]));
    }
    return [];
  }

  const SLOT_POOLS = { auftakt: AUFTAKT, ausklang: AUSKLANG, zeit: ZEIT };

  // --------------------------------------------------------------------------
  // pick(ctx, recent) -> { id, text, parts } | null
  //   ctx    = Simulationszustand (siehe tagsOf)
  //   recent = Array benutzter Baustein-ids; wird hier gepflegt (Ringpuffer).
  // Reine Funktion des Zustands: kein Math.random, keine Uhr.
  // --------------------------------------------------------------------------
  function pick(ctx, recent) {
    const tags = tagsOf(ctx);
    const kern = candidates(kernPool(ctx), "kern-" + ctx.beat, tags);
    if (!kern.length) return null;
    const list = Array.isArray(recent) ? recent : [];
    const mem = new Set(list);
    const base = [ctx.seed >>> 0, ctx.beat, ctx.key || "", ctx.form || "", ctx.gen || 0].join("|");

    for (let attempt = 0; attempt < TRIES; attempt++) {
      const rnd = prng(hash(base + "|" + attempt));
      const shape = SHAPES[Math.floor(rnd() * SHAPES.length) % SHAPES.length];
      const used = [], texts = [];
      let failed = false;
      const text = shape.replace(/#([a-z]+)#/g, (m, slot) => {
        if (failed) return "";
        const c = slot === "kern" ? draw(kern, rnd, mem)
                                  : draw(candidates(SLOT_POOLS[slot] || [], slot, tags), rnd, mem);
        if (!c) { failed = true; return ""; }
        used.push(c.id);
        const t = fill(c.t, ctx); texts.push(t);
        return t;
      });
      if (failed) continue;
      const line = polish(text);
      if (line.length > MAX_LEN) continue;
      if (crossClash(texts)) continue;
      // „…, und …" liest sich nur sauber, wenn keiner der Bausteine selbst ein
      // Komma trägt — sonst stolpert der Satz über drei Teilsätze.
      if (shape.includes(", und") && texts.some(t => t.includes(","))) continue;
      if (mem.has("L" + hash(line))) continue;   // diese Zeile stand kürzlich schon da
      remember(list, used, line);
      return { id: used[0] || "?", text: line, parts: used };
    }
    // Notausgang: nackter Kern (immer gültig, nie leer)
    const c = draw(kern, prng(hash(base + "|x")), mem) || kern[0];
    const line = polish(fill(c.t, ctx));
    remember(list, [c.id], line);
    return { id: c.id, text: line, parts: [c.id] };
  }
  // Ringpuffer mit zwei getrennten Kapazitäten (sonst verdrängen die vielen
  // Baustein-ids die Zeilen-Hashes und wörtliche Wiederholungen kommen zurück).
  function remember(list, ids, line) {
    for (const id of ids) list.push(id);
    list.push("L" + hash(line));
    const frags = [], lines = [];
    for (const x of list) (x[0] === "L" ? lines : frags).push(x);
    const keep = frags.slice(-MEM_FRAG).concat(lines.slice(-MEM_LINE));
    list.length = 0; for (const x of keep) list.push(x);
  }

  // --------------------------------------------------------------------------
  // Selbstprüfung der QUELLEN (die Stichproben-Prüfung der ERGEBNISSE macht
  // tools/story-check.mjs — bei einem Generator zählt die Ausgabe, nicht der
  // Quelltext).
  // --------------------------------------------------------------------------
  const FORBIDDEN = /\b(will|wollen|wollte|möchte|möchten|versucht|versuchen|beschließt|strebt|lernt|bemüht)\b/i;
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  function eachFragment(fn) {
    const walk = (pool, name) => {
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        fn(Array.isArray(p) ? p[0] : p, name + ":" + i, Array.isArray(p) ? (p[1] || "") : "");
      }
    };
    walk(AUFTAKT, "auftakt"); walk(AUSKLANG, "ausklang"); walk(ZEIT, "zeit");
    walk(ANFANG, "anfang"); walk(RUHE, "ruhe"); walk(NOT, "not"); walk(BLUETE, "bluete");
    walk(WELT_ALLGEMEIN, "welt-allg"); walk(WANDEL_ALLGEMEIN, "wandel-allg");
    for (const k in HEIMKEHR) walk(HEIMKEHR[k], "heimkehr-" + k);
    for (const k in WELT) walk(WELT[k], "welt-" + k);
    for (const k in WANDEL) walk(WANDEL[k], "wandel-" + k);
    for (const k in REICH) walk(REICH[k], "reich-" + k);
    for (const k in FUND) walk(FUND[k], "fund-" + k);
    for (const k in MARK) walk(MARK[k], "mark-" + k);
    for (const k in DRUCK) { walk(DRUCK[k].auf, "druck-" + k + "-auf"); walk(DRUCK[k].ab, "druck-" + k + "-ab"); }
    walk(DRUCK_ALLGEMEIN.auf, "druck-allg-auf"); walk(DRUCK_ALLGEMEIN.ab, "druck-allg-ab");
  }
  function lint() {
    const problems = [], seen = new Map();
    eachFragment((text, id) => {
      if (!text || !text.trim()) problems.push(`${id}: leer`);
      if (/[.!?]$/.test(text)) problems.push(`${id}: Fragment endet mit Satzzeichen (Schablonen setzen es)`);
      if (/^[A-ZÄÖÜ]/.test(text) && !/^[A-ZÄÖÜ][a-zäöüß]*\b/.test(text.split(" ")[0])) problems.push(`${id}: beginnt groß`);
      if (FORBIDDEN.test(text)) problems.push(`${id}: Absichts-Sprache — Auslese erzählen, nicht Wille`);
      if (EMOJI.test(text)) problems.push(`${id}: Emoji (Icon-Policy)`);
      if (/!/.test(text)) problems.push(`${id}: Ausrufezeichen (ruhiger Ton)`);
      const norm = text.toLowerCase().trim();
      if (seen.has(norm)) problems.push(`${id}: wortgleich mit ${seen.get(norm)}`);
      else seen.set(norm, id);
    });
    return problems;
  }
  function fragmentCount() { let n = 0; eachFragment(() => n++); return n; }

  root.EvolveStory = { VERSION, BEATS, pick, lint, tagsOf, eachFragment, fragmentCount,
    MAX_LEN, MEM_FRAG, MEM_LINE, SHAPES, pools: { AUFTAKT, AUSKLANG, ZEIT } };
})(typeof globalThis !== "undefined" ? globalThis : window);
