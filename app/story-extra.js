// AUTO-GENERIERT aus auslagerung/S6-ausgabe.json (externe Zulieferung,
// geprüft mit tools/story-import-check.mjs). Nicht von Hand editieren — neue
// Zulieferungen mit tools/build-story-extra.mjs einspielen.
//
// `faktoren`: Kern-Zeilen je Umwelt-Einfluss. Sie greifen, wenn der Spieler genau
// diesen Einfluss auslöst — dadurch erzählt jeder Einfluss sich selbst, statt nur
// die Achse zu nennen, die sich bewegt hat.
// `pools`: zusätzliche Textur-Bausteine für die geteilten Pools.
window.EvolveStoryExtra = {
 "faktoren": {
  "Thermische Extreme (Hitze/Frost-Spitzen)": [
   "an manchen Tagen kippt die Temperatur weit über das, was Zellen aushalten",
   "ein einziger Hitzeschlag räumt weg, was sich bei {demwesen} zu spät versteckt",
   "wer die Spitzen übersteht, gibt seine Zähigkeit an den Nachwuchs weiter"
  ],
  "Geothermie / Mikroklima-Refugien": [
   "der Boden gibt hier eigene Wärme ab, unabhängig von der Sonne",
   "in den warmen Taschen findet {wesen} auch dann Halt, wenn es ringsum kalt wird",
   "die kleinen Zufluchten sammeln, was anderswo längst durchgefroren wäre"
  ],
  "Niederschlag / Feuchte": [
   "der Regen fällt hier verlässlich und tränkt jeden Winkel",
   "wo so viel Wasser steht, zählt eher, wer es loswird als wer es hält",
   "die feuchte Fülle trägt {wesen} durch fast jede Generation"
  ],
  "Bodenfeuchte / Wasserspeicher": [
   "der Moorboden hält das Wasser fest und gibt es nur langsam wieder her",
   "unter der nassen Decke wird {demwesen} die Luft im Boden knapp",
   "setzt {wesen} die Wurzeln zu tief, erstickt es sie im Staunassen"
  ],
  "Ariditäts-Index (Verdunstungs-Nachfrage)": [
   "die Luft zieht am Wüstenrand mehr Wasser heraus, als je nachkommt",
   "hier verdunstet jeder Tropfen, kaum dass er den Boden erreicht",
   "am Rand der Wüste kommt {wesen} nur mit hartem Sparen durch"
  ],
  "Nebel/Tau-Interzeption": [
   "der Nebel legt sich jede Nacht über alles und ist das einzige Wasser weit und breit",
   "sammelt {wesen} den Tau von der Haut, trinkt es; die anderen bleiben trocken",
   "in der Nebelwüste hängt {demwesen} das Leben an feuchter Luft"
  ],
  "Schneedecke / subnivaler Raum": [
   "unter dem Schnee bleibt es merklich wärmer als in der Luft darüber",
   "die Decke dämpft die Kälte und hält den Raum darunter offen",
   "zieht sich {wesen} in den Raum unter dem Schnee zurück, übersteht es den Frost"
  ],
  "Lichtintensität": [
   "das Sonnenlicht steht grell und ununterbrochen über dem Boden",
   "so viel Strahlung bleicht und brennt {wesen}, wenn es keinen Schutz trägt",
   "bringt {wesen} Pigment gegen das grelle Licht mit, hält es länger durch"
  ],
  "UV-Strahlung": [
   "die UV-Strahlung dringt ungefiltert bis in die Zellen",
   "jeder ungeschützte Kern nimmt hier Schaden, Tag für Tag",
   "wer dunkle Schutzpigmente trägt, gibt sie an den Nachwuchs weiter"
  ],
  "Spektralqualität (Lichtfarbe)": [
   "das Wasser schluckt das Rot und lässt nur Blaugrün nach unten",
   "trägt {wesen} das falsche Pigment, sieht es hier unten fast nichts vom Licht",
   "in der blaugrünen Tiefe zählt nur, was dieses Spektrum noch nutzt"
  ],
  "Photische vs. aphotische Zone": [
   "hier unten kommt kein Sonnenlicht mehr an, es ist dauerhaft finster",
   "wo nichts mehr leuchtet, nützen Augen weniger als ein feiner Tastsinn",
   "in der lichtlosen Tiefe wird jedes eigene Leuchten zum Vorteil"
  ],
  "Luftdruck / Höhe / Hypoxie": [
   "die Höhenluft ist so dünn, dass jeder Atemzug weniger einbringt",
   "bindet {wesen} den Sauerstoff nicht besser, bleibt es hier oben zurück",
   "in der dünnen Luft zahlt {wesen} für jede Bewegung mehr"
  ],
  "Wind (Exposition + Ausbreitungs-Vektor)": [
   "der Wind steht Tag und Nacht und lässt nichts hoch aufwachsen",
   "hält sich {wesen} flach, bietet es dem Dauerwind weniger Angriffsfläche",
   "der Sturm trägt hier Samen und Sporen weiter als jeder Schritt"
  ],
  "Salinität + Salz-Gradienten": [
   "das Wasser ist so salzig, dass es dem Körper Feuchtigkeit entzieht",
   "wer das Salz nicht aussperrt, trocknet mitten im Wasser aus",
   "die Osmose zieht hier ständig, und jede Zelle muss dagegenhalten"
  ],
  "pH / Säure": [
   "das Wasser ist sauer und greift alles an, was nicht abgedichtet ist",
   "trägt {wesen} keine widerstandsfähige Hülle, wird es hier langsam zersetzt",
   "im sauren Milieu übersteht nur, was sich chemisch abschottet"
  ],
  "Gelöster Sauerstoff": [
   "das warme, stehende Wasser hält kaum noch Sauerstoff",
   "atmet {wesen} viel, kommt es hier schneller an seine Grenze",
   "wer mit wenig Luft auskommt, hat im trägen Wasser die Nase vorn"
  ],
  "Tiefe / hydrostatischer Druck": [
   "in dieser Tiefe drückt das Wasser von allen Seiten auf den Körper",
   "trägt {wesen} Hohlräume mit Luft, wird es hier unten zusammengepresst",
   "der Druck lässt nur zu, was ohne Gasblasen und starre Form auskommt"
  ],
  "Strömung / Wellenenergie / Gezeiten": [
   "die Brandung wirft das Wasser im Takt der Gezeiten hin und her",
   "hält sich {wesen} nicht fest, wird es von der nächsten Welle mitgerissen",
   "zwischen Ebbe und Flut zählt, wer beide Zustände übersteht"
  ],
  "Trübung / Sediment": [
   "das Wasser trägt so viel Schlamm, dass kaum Licht hindurchkommt",
   "im trüben Wasser nützen Farben nichts, weil niemand sie erkennt",
   "hält {wesen} die Kiemen im Sediment frei, kommt es hier besser durch"
  ],
  "Nährstoffstatus (oligo→eutroph)": [
   "das Wasser ist dick von Nährstoffen und trägt reiche Algenteppiche",
   "wo so viel Nahrung treibt, wächst {wesen} schneller als anderswo",
   "die Fülle im Wasser lässt kaum eine Generation hungern"
  ],
  "Süß- vs. Meerwasser-Habitatklasse": [
   "im Ästuar mischt sich Süßwasser mit dem Salz der Flut",
   "regelt {wesen} den Salzgehalt nicht nach, hält es den Wechsel nicht aus",
   "das Brackwasser lässt nur zu, was zwischen zwei Welten bestehen kann"
  ],
  "Wasser-Permanenz (Hydroperiode)": [
   "der Tümpel schrumpft von Woche zu Woche und wird bald ganz verschwinden",
   "wer keine Dauerform überlässt, dessen Linie endet mit dem letzten Wasser",
   "hier gewinnt, wer die Trockenzeit als ruhendes Ei übersteht"
  ],
  "Bodentyp / Textur": [
   "der Sand lässt jedes Wasser sofort in die Tiefe versickern",
   "an der Oberfläche bleibt nichts, was die Wurzeln greifen könnten",
   "wer tief genug reicht, kommt an das Wasser, das dem Sand entkommt"
  ],
  "Boden-pH & -Chemie": [
   "der Heideboden ist sauer und gibt seine Nährstoffe nur zäh her",
   "wer die falsche Chemie mitbringt, findet hier kaum etwas Verwertbares",
   "im sauren Grund kommt {wesen} nur mit passender Wurzelchemie durch"
  ],
  "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)": [
   "der Boden ist so nährstoffarm, dass jedes Gramm zählt",
   "wo Stickstoff fehlt, wird {demwesen} selbst ein gefangenes Insekt zur Mahlzeit",
   "hier lohnt sich, wer mit dem Wenigen am sparsamsten umgeht"
  ],
  "Serpentin/Schwermetall-Toxizität": [
   "der Boden ist mit Schwermetall durchsetzt, das die meisten Zellen vergiftet",
   "schließt {wesen} das Metall nicht weg, reichert es an, bis es tötet",
   "auf dem giftigen Grund bleibt nur, was das Gift wegsperrt"
  ],
  "Fels/Sand/Karst als Substrat": [
   "der nackte Fels bietet kaum einen Halt und noch weniger Nahrung",
   "kann sich {wesen} nicht anklammern oder eingraben, findet es keinen Platz",
   "am kahlen Stein zählt jede Ritze, in der sich etwas festsetzt"
  ],
  "Boden-Sauerstoff (Staunässe/anoxisch)": [
   "der Sumpfboden ist so nass, dass keine Luft mehr in ihn eindringt",
   "hat {wesen} die Wurzeln nur unten, bekommt es hier keinen Sauerstoff",
   "wer Luft von oben in den Grund führt, übersteht die Staunässe"
  ],
  "Höhengradient": [
   "mit jedem Höhenmeter wird es kälter und die Klimabänder stapeln sich",
   "besteht {wesen} weiter oben, muss es Kälte und dünne Luft verkraften",
   "auf der Höhenlage entscheidet, wie hoch {wesen} noch bestehen kann"
  ],
  "Hangneigung & Exposition": [
   "der Nordhang bleibt im Schatten, kühl und länger feucht",
   "wo die Sonne selten hinreicht, bleibt es kühl und nass",
   "am Schatthang kommt eher zurecht, wer wenig Licht braucht"
  ],
  "Habitat-Struktur-Komplexität / Deckung": [
   "das Gestrüpp schichtet sich in viele Ebenen mit Deckung und Nahrung",
   "duckt sich {wesen} ins Dickicht, entgeht es dem, was von oben späht",
   "die vielen Verstecke geben {demwesen} in jeder Höhe eine Nische"
  ],
  "Höhlen / unterirdischer Raum": [
   "in der Höhle bleibt es dunkel und das Klima ändert sich kaum",
   "wo nie Licht fällt, kosten Augen und Farbe nur unnötig Kraft",
   "im Dunkeln zählt, wer mit Tasten und Riechen die Augen ersetzt"
  ],
  "Primärproduktivität / Ressourcen-Fülle": [
   "die Nahrung liegt hier im Überfluss und geht kaum je aus",
   "wo so viel zu holen ist, kann {wesen} in die Größe gehen",
   "die Fülle trägt Generation um Generation ohne Mangel"
  ],
  "Chemische Gradienten (Redox/Chemokline)": [
   "an der Grenzschicht kippt die Chemie des Wassers auf engem Raum",
   "wer den schmalen Streifen mit der richtigen Mischung trifft, lebt",
   "an der Grenzschicht zählt, wer den feinen Übergang genau nutzt"
  ],
  "Energiequelle: photo- vs. chemosynthetisch": [
   "an der heißen Quelle kommt die Energie aus der Chemie, nicht aus dem Licht",
   "verwertet {wesen} den Schwefel im Wasser, braucht es hier keine Sonne",
   "an der Quelle lebt reich, wer die Glut des Bodens in Nahrung umsetzt"
  ],
  "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)": [
   "das Wasser ist zugleich giftig, salzig und ätzend",
   "kaum eine Zelle in {demwesen} hält diese Chemie lange aus",
   "hier bleibt nur, wer gegen mehrere Gifte zugleich gewappnet ist"
  ],
  "Natürliche Toxine / ionisierende Strahlung": [
   "die Strahlung zerschlägt das Erbgut schneller, als es sich ordnen lässt",
   "flickt {wesen} den Schaden nicht sofort, gibt es kaputte Baupläne weiter",
   "unter der Strahlung übersteht nur, wer sein Erbgut zäh repariert"
  ],
  "Feuer-Regime (Häufigkeit/Intensität/Saison)": [
   "das Feuer kommt hier wieder und wieder und fragt nicht nach der Form",
   "schützt sich {wesen} bis zur Brandsaison nicht, verbrennt es mit dem Rest",
   "was nach dem Brand als Erstes wieder austreibt, hat gewonnen"
  ],
  "Störung (disturbance)": [
   "die Lücke im Bestand öffnet plötzlich Licht und freien Boden",
   "besetzt {wesen} die offene Fläche als Erstes, hält es sie eine Weile",
   "nach der Störung zählt, wer schnell ist, nicht wer groß ist"
  ],
  "Vulkanausbruch / Flutbasalt (LIP)": [
   "der Ausbruch legt alles unter frisches, glühendes Gestein",
   "was der Lava im Weg steht, ist mit einem Schlag verschwunden",
   "auf dem neuen Boden beginnt für {wesen} alles noch einmal von vorn"
  ],
  "Vulkanwinter / Aschefall": [
   "die Asche steht wochenlang in der Luft und nimmt dem Boden das Licht",
   "ohne Sonne bringt jedes grüne Blatt {demwesen} nichts mehr ein",
   "wer jetzt noch vom Licht lebt, lebt nicht mehr lange"
  ],
  "Erdbeben / Tsunami / Hangrutsch": [
   "die Flutwelle schiebt das Gelände in Sekunden zu etwas Neuem um",
   "wo eben noch Boden war, steht plötzlich Wasser oder Geröll",
   "nach dem Beben zählt, wer sich im Durcheinander am schnellsten neu einrichtet"
  ],
  "Waldbrand / Flut / Dürre / Sturm / Hitzewelle / Eissturm": [
   "der Eissturm treibt Frost und Wind zugleich über alles hinweg",
   "eine einzige solche Nacht räumt weg, was nicht tief genug geschützt ist",
   "wer den Eissturm übersteht, hat der nächsten Generation viel voraus"
  ],
  "Dürre als Selektions-Episode": [
   "die Dürre zieht sich hin, bis der Boden bricht und nichts mehr wächst",
   "braucht {wesen} jetzt zu viel Wasser, kommt es nicht bis zum Regen",
   "in der langen Trockenheit gewinnt, wer mit dem letzten Rest haushält"
  ],
  "Eiszeit / Interglazial / abrupter Klimawechsel": [
   "das Eis breitet sich aus und schiebt alles Lebendige vor sich her",
   "dämmt {wesen} die Kälte nicht, hält es den langen Winter nicht durch",
   "in der Eiszeit übersteht, wer Wärme speichert und wenig verheizt"
  ],
  "Hyperthermal (PETM) / Schneeball-Erde": [
   "die Warmzeit hält lange an und treibt Wachstum in jede Ecke",
   "in der gleichmäßigen Wärme findet {wesen} überall reichlich Nahrung",
   "die milde Fülle lässt kaum eine Generation zu kurz kommen"
  ],
  "Meeresspiegel-Änderung (Transgression/Regression)": [
   "das Wasser steigt und verwandelt trockenes Land in flaches Meer",
   "wo eben noch Küste war, reicht bald das Wasser über den Kopf",
   "der steigende Pegel gibt jenen Raum, die im Flachwasser bestehen"
  ],
  "Ozean-Anoxie / -Versauerung / Euxinie": [
   "dem Meer geht der Sauerstoff aus und der Schwefel steigt aus der Tiefe",
   "braucht {wesen} viel Luft aus dem Wasser, erstickt es im toten Meer",
   "im giftigen Wasser bleibt nur, wer fast ohne Sauerstoff auskommt"
  ],
  "Aridifizierung / Grasland-Ausbreitung": [
   "das Grasland breitet sich aus, wo der Wald zu trocken geworden ist",
   "in der offenen Weite findet {wesen} kaum noch Deckung vor Blicken",
   "auf der Steppe zählt, wer das zähe Gras verwertet und weit sieht"
  ],
  "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter": [
   "der Einschlag wirft so viel Staub auf, dass die Sonne verschwindet",
   "im langen Dunkel bricht die Nahrung von unten in der Kette weg",
   "nährt sich {wesen} von Resten und Aas, übersteht es das lange Dunkel eher"
  ],
  "Supernova / Gammablitz (hypothetisch)": [
   "der Gammablitz reißt die Ozonschicht auf und lässt die Strahlung durch",
   "ohne Schutz von oben verbrennt {demwesen} jede ungedeckte Oberfläche",
   "verkriecht sich {wesen} tief unter Wasser oder Fels, entgeht es dem Schlimmsten"
  ],
  "Sonnen-Variabilität / Weltraumwetter": [
   "die Sonne steht in einer schwachen Phase und wärmt weniger als sonst",
   "das gedämpfte Licht drückt langsam auf alles, was von ihm lebt",
   "in der kühleren Phase kommt eher durch, wer mit weniger Sonne auskommt"
  ],
  "Die „Big Five“": [
   "mehrere Katastrophen fallen zusammen und lassen kaum eine Nische heil",
   "wenn Hitze, Gift und Hunger zugleich drücken, fällt fast alles aus",
   "aus so einem Sterben kommt nur, was wirklich alles zugleich aushält"
  ],
  "Konkurrenz (–/–)": [
   "um jeden Bissen drängen sich hier zu viele auf einmal",
   "ist {wesen} beim Fressen nur einen Schritt langsamer, geht es leer aus",
   "im Gedränge gewinnt, wer eine Nische findet, die kein anderer nutzt"
  ],
  "Prädation / Herbivorie / Granivorie / Frugivorie (+/–)": [
   "die Räuber sind da und suchen den Bestand Stück für Stück ab",
   "fällt {wesen} auf oder ist es zu langsam, verschwindet es zuerst",
   "wer sich tarnt oder rechtzeitig flüchtet, gibt das an die Jungen weiter"
  ],
  "Nischen-Aufteilung / Charakter-Verschiebung / ökologische Freisetzung": [
   "die Nische liegt offen, ohne Rivalen und fast ohne Feinde",
   "wo niemand konkurriert, kann {wesen} sich in Ruhe ausbreiten",
   "ohne Druck von der Seite füllt sich der freie Raum rasch auf"
  ],
  "Trophische Kaskade (top-down) / Bottom-up-Kontrolle": [
   "die Räuber an der Spitze bestimmen, was weiter unten wachsen darf",
   "solange die Jäger da sind, hält sich die Pflanzendecke dicht",
   "wer unter starkem Räuberdruck besteht, formt damit die ganze Kette mit"
  ],
  "Keystone-Art / Ökosystem-Ingenieur / Foundation-Art": [
   "ein Baumeister hat das Wasser gestaut und die Welt darum umgebaut",
   "der neue Teich schafft Ufer und Ränder für viele auf einmal",
   "wo einer die Umgebung formt, findet {wesen} plötzlich neue Wege"
  ],
  "Mesopredator-Release / trophic downgrading": [
   "mit der Spitze verschwunden, schwärmen die kleinen Räuber ungebremst aus",
   "war {wesen} eben noch sicher, wird es jetzt von vielen Seiten gejagt",
   "wenn die mittlere Ebene überhandnimmt, verschiebt sich alles darunter"
  ],
  "Resistenz-Evolution (Echtzeit)": [
   "das Gift wird regelmäßig ausgebracht und trifft fast jeden",
   "wer die eine Schwäche gegen das Mittel trägt, fällt sofort aus",
   "die wenigen Unempfindlichen füllen danach den ganzen Raum"
  ],
  "Habitat-Zerstörung & -Fragmentierung / Korridore / Straßen als Barrieren": [
   "der Lebensraum zerfällt in kleine Reste, zwischen denen nichts mehr steht",
   "überbrückt {wesen} die Lücken nicht, bleibt es in seiner Insel gefangen",
   "in den Splittern reicht die Nahrung kaum für eine kleine Zahl"
  ],
  "Verschmutzung als Selektion": [
   "das Wasser ist überdüngt, trüb und mit Fremdstoffen durchsetzt",
   "verträgt {wesen} das Eingeleitete, findet es daneben reichlich Nahrung",
   "im belasteten Wasser setzt sich durch, wen das Gift am wenigsten stört"
  ],
  "Klimawandel (anthropogen)": [
   "es wird spürbar wärmer und die vertrauten Zeiten verschieben sich",
   "blüht {wesen} zur alten Jahreszeit, trifft es die neue Nahrung nicht mehr",
   "in der raschen Erwärmung kommt mit, wer sich zügig neu einstellt"
  ],
  "Invasive Arten / biotische Homogenisierung / Enemy-Release/EICA / Neuartige Ökosysteme": [
   "eine fremde Art ist eingewandert und kennt hier keine Grenzen",
   "gegen den neuen Rivalen fehlt jede alt erprobte Abwehr",
   "setzt {wesen} dem Zugezogenen etwas entgegen, hält es sich; andere weichen"
  ],
  "Urbanisierung / Urban-Evolution": [
   "die Stadt hält die Wärme fest und lässt es nachts nie ganz dunkel werden",
   "wer sich vom Menschen nicht scheuchen lässt, findet hier leichte Beute",
   "zwischen Beton und Nachtlicht kommt durch, wer sich schnell umstellt"
  ],
  "Defaunation / Trophic Downgrading / 6. Massenaussterben (HIREC)": [
   "die großen und langsamen Arten sind zuerst verschwunden",
   "wo die Spezialisten fehlen, bleibt das Feld den Anpassungsfähigen",
   "in der ausgedünnten Tierwelt kommt weiter, wer sich mit wenig behilft"
  ]
 },
 "pools": {
  "auftakt": [
   [
    "der Frost sitzt tief im Boden",
    "kalt"
   ],
   [
    "die Kälte kriecht langsam in jeden Winkel",
    "kalt"
   ],
   [
    "das Eis knackt in der Morgenstille",
    "eis"
   ],
   [
    "die Luft flimmert über dem heißen Grund",
    "heiss"
   ],
   [
    "die Hitze steht wie eine Wand über dem Boden",
    "glut"
   ],
   [
    "nichts hier drängt",
    "mild"
   ],
   [
    "der Tag zieht ruhig über das Land",
    ""
   ],
   [
    "die Sonne steht flach am Rand",
    "daemmer"
   ],
   [
    "das Licht liegt weich auf allem",
    "daemmer"
   ],
   [
    "die Sonne brennt gerade herunter",
    "hell"
   ],
   [
    "es bleibt dunkel, auch wenn es Tag sein müsste",
    "finster"
   ],
   [
    "der Staub liegt trocken auf jedem Halm",
    "trocken"
   ],
   [
    "der Boden ist rissig und staubtrocken",
    "duerre"
   ],
   [
    "das Wasser steht bis über die Knöchel",
    "nass"
   ],
   [
    "die Feuchte hängt schwer in der Luft",
    "feucht"
   ],
   [
    "der Nebel liegt tief zwischen den Halmen",
    "feucht"
   ],
   [
    "es riecht nach Regen und nassem Grund",
    "feucht"
   ],
   [
    "kaum etwas Essbares steht in Reichweite",
    "karg"
   ],
   [
    "der Boden gibt nur wenig her",
    "karg"
   ],
   [
    "überall liegt mehr Nahrung, als gebraucht wird",
    "fuelle"
   ],
   [
    "die Nahrung türmt sich in jeder Ecke",
    "fuelle"
   ],
   [
    "etwas beobachtet aus dem Dickicht",
    "jagd"
   ],
   [
    "die Ruhe trügt, irgendwo lauert ein Jäger",
    "jagd"
   ],
   [
    "nichts stellt hier nach",
    "sicher"
   ],
   [
    "kein Schatten fällt bedrohlich über den Weg",
    "sicher"
   ],
   [
    "der Wind fährt scharf über die Fläche",
    "sturm"
   ],
   [
    "das Salz knirscht auf allem",
    "salz"
   ],
   [
    "die Asche liegt fingerdick auf allem",
    "feuer"
   ],
   [
    "der Rauch hängt noch über dem Boden",
    "feuer"
   ],
   [
    "das Wasser drückt schwer aus der Tiefe",
    "tiefe"
   ],
   [
    "die Luft ist dünn und knapp",
    "hypoxie"
   ],
   [
    "die Strahlung liegt unsichtbar über allem",
    "strahlung"
   ],
   [
    "ein bitterer Beigeschmack liegt in allem",
    "gift"
   ],
   [
    "die Nacht war klirrend kalt",
    "frostnacht"
   ],
   [
    "nichts an diesem Ort ist gemäßigt",
    "extrem"
   ],
   [
    "der Boden liegt frisch und offen da",
    "b-welt"
   ],
   [
    "etwas hat sich gerade grundlegend verschoben",
    "b-welt"
   ],
   [
    "der Druck lässt für einen Moment nach",
    "b-ruhe"
   ],
   [
    "der Tag beginnt wie viele davor",
    ""
   ],
   [
    "das Land liegt weit und offen",
    ""
   ],
   [
    "hier wechselt wenig von Tag zu Tag",
    ""
   ],
   [
    "die Umgebung bleibt sich seit Langem gleich",
    ""
   ],
   [
    "das Wasser zieht träge vorbei",
    ""
   ],
   [
    "die Halme stehen still im schwachen Wind",
    "mild"
   ],
   [
    "über dem Boden liegt eine gedämpfte Helligkeit",
    "daemmer"
   ],
   [
    "die Wachsamkeit liegt wie ein Schleier über allem",
    "wachsam"
   ],
   [
    "etwas hält die Umgebung in Bewegung",
    ""
   ],
   [
    "der Morgen kommt grau und feucht herauf",
    "feucht"
   ],
   [
    "das Milieu drückt von mehreren Seiten",
    "b-druck"
   ],
   [
    "es steht wieder eine harte Zeit bevor",
    "b-druck"
   ]
  ],
  "ausklang": [
   [
    "{wesen} zahlt das an anderer Stelle wieder drauf",
    ""
   ],
   [
    "das kostet {wesen} mehr, als es auf den ersten Blick scheint",
    ""
   ],
   [
    "vor hundert Generationen sah das bei {demwesen} noch anders aus",
    ""
   ],
   [
    "davon hing zuletzt jede Generation ab",
    ""
   ],
   [
    "am Umriss von {demwesen} ist davon schon etwas zu erkennen",
    ""
   ],
   [
    "die dünner Bedeckten kommen damit besser durch",
    "mild"
   ],
   [
    "hält {wesen} das aus, gibt es das weiter",
    ""
   ],
   [
    "im Trockenen zählt für {wesen} jeder Tropfen doppelt",
    "trocken"
   ],
   [
    "in der Kälte spart das Kraft, die sonst verheizt wird",
    "kalt"
   ],
   [
    "in der Hitze entscheidet das über einen ganzen Tag",
    "heiss"
   ],
   [
    "das merkt {wesen} erst, wenn die Nahrung knapp wird",
    "karg"
   ],
   [
    "bei so viel Nahrung fällt das kaum ins Gewicht",
    "fuelle"
   ],
   [
    "unter Jägern wird daraus schnell eine Frage von Leben und Tod",
    "jagd"
   ],
   [
    "solange nichts nachstellt, ist das nur ein kleiner Vorteil",
    "sicher"
   ],
   [
    "davon hängt ab, wer die nächste Trockenzeit sieht",
    "duerre"
   ],
   [
    "bei {demwesen} schlägt das langsam auf den ganzen Körper durch",
    ""
   ],
   [
    "vor kurzem hätte das noch keine Rolle gespielt",
    ""
   ],
   [
    "es dauert Generationen, bis sich das bei {demwesen} zeigt",
    ""
   ],
   [
    "was jetzt zählt, zählte vor kurzem noch gar nicht",
    ""
   ],
   [
    "wo {wesen} es sich leisten kann, wächst es; die anderen bleiben klein",
    "fuelle"
   ],
   [
    "das verschiebt sich mit jeder Generation ein Stück",
    "b-welt"
   ],
   [
    "bei Frost wird daraus rasch der Unterschied",
    "kalt"
   ],
   [
    "darüber entscheidet sich, wer bis zum Regen durchhält",
    "trocken"
   ],
   [
    "es kostet {wesen} Kraft, die woanders dann fehlt",
    ""
   ],
   [
    "kalkuliert {wesen} knapp, kommt es weiter",
    ""
   ],
   [
    "am Ende zählt, wer mehr Junge durchbringt",
    ""
   ],
   [
    "das gibt {demwesen} einen kleinen Vorsprung",
    ""
   ],
   [
    "langsam verschiebt sich, was bei {demwesen} durchkommt",
    ""
   ],
   [
    "die nächste Generation trägt schon etwas davon",
    ""
   ],
   [
    "ohne das ist hier bald Schluss",
    "not"
   ],
   [
    "wo alles reicht, wird der Unterschied klein",
    "bluete"
   ],
   [
    "das war nicht immer so",
    ""
   ],
   [
    "es hängt daran, wie lange die Ruhe hält",
    "b-ruhe"
   ],
   [
    "bringt {wesen} das nicht mit, fällt es still aus der Reihe",
    ""
   ],
   [
    "in der Fülle darf {wesen} auch einmal verschwenden",
    "bluete"
   ],
   [
    "das setzt sich fort, solange der Druck bleibt",
    "b-druck"
   ],
   [
    "bei so wenig Luft entscheidet das rasch",
    "hypoxie"
   ],
   [
    "im Salz wird daraus eine Frage des Überlebens",
    "salz"
   ],
   [
    "kommt {wesen} hier besser zurecht, hinterlässt es mehr Junge",
    ""
   ],
   [
    "davon bleibt bei {demwesen} über die Generationen etwas hängen",
    ""
   ]
  ],
  "ruhe": [
   [
    "nichts bewegt sich mehr, das Gleichgewicht hält",
    ""
   ],
   [
    "die Form passt zum Ort, und beides bleibt, wie es ist",
    ""
   ],
   [
    "seit vielen Generationen ändert sich nichts mehr",
    "gewachsen"
   ],
   [
    "was passt, ist gefunden, und es hält",
    ""
   ],
   [
    "die Rechnung geht auf, ohne dass jemand nachbessern muss",
    "auskommen"
   ],
   [
    "hier ist erreicht, was zu erreichen war",
    "uralt"
   ],
   [
    "der Ort und {wesen} sind zur Ruhe gekommen",
    ""
   ],
   [
    "es steht still, und das ist kein schlechtes Zeichen",
    ""
   ]
  ],
  "not": [
   [
    "hier reicht es hinten und vorne nicht",
    ""
   ],
   [
    "die Passung steigt seit Langem nicht mehr",
    ""
   ],
   [
    "was auch kommt, es genügt dem Ort nicht",
    "not"
   ],
   [
    "{wesen} kommt hier seit Generationen schlecht zurecht",
    ""
   ],
   [
    "die harte Welt gibt kaum etwas her",
    "not"
   ],
   [
    "über Generationen hinweg bleibt es zu wenig",
    ""
   ],
   [
    "es fehlt an fast allem zugleich",
    "extrem"
   ],
   [
    "kaum etwas passt, und der Rest zehrt",
    ""
   ]
  ],
  "bluete": [
   [
    "es läuft seit Langem rund",
    ""
   ],
   [
    "die Passung hält sich seit Langem ganz oben",
    ""
   ],
   [
    "{wesen} gedeiht, Generation um Generation",
    "bluete"
   ],
   [
    "alles greift ineinander, wie es soll",
    ""
   ],
   [
    "hier hat {wesen} gefunden, was es braucht",
    ""
   ],
   [
    "die guten Zeiten halten schon lange an",
    "bluete"
   ],
   [
    "was hier lebt, lebt im Überfluss",
    "fuelle"
   ],
   [
    "es fügt sich seit vielen Generationen",
    "gewachsen"
   ]
  ]
 }
};
