// AUTO-GENERIERT von tools/build-influences.mjs aus docs/faktoren-katalog.md.
// Nicht von Hand editieren — Effekte in tools/build-influences.mjs (EFFECTS) pflegen,
// dann neu generieren: node tools/build-influences.mjs
// `env` = real umsetzbar (6 Kern-Dimensionen + toxicity). `soon` = im Katalog, aber als
// echte Selektionsachse/Ebene noch in Arbeit. `tone` = Effekt-Farbe (hit/shift/bio).
window.INFLUENCES = [
 {
  "cat": "Ort-Parameter",
  "plain": "Ort & Klima",
  "icon": "mountain",
  "groups": [
   {
    "sub": "Temperatur & Thermik",
    "factors": [
     {
      "name": "Mitteltemperatur",
      "desc": "Die durchschnittliche Wärme eines Ortes. Sie bestimmt, welche Lebewesen dort überhaupt gedeihen und sich fortpflanzen können.",
      "soon": true,
      "layer": "schon-regler",
      "layerGrund": "Deckt sich vollständig mit dem Temperatur-Regler in der Konsole.",
      "plain": "Wie warm es im Schnitt ist"
     },
     {
      "name": "Temperatur-Spanne / Tag-Nacht-Schwankung",
      "desc": "Wie stark die Temperatur zwischen heißem Tag und kühler Nacht schwankt. Große Sprünge zwingen Tiere, mit beiden Extremen zurechtzukommen.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Eine Schwankungsbreite über Tag und Nacht ist ein Verlauf; die Engine kennt nur einen Momentwert.",
      "plain": "Unterschied zwischen Tag und Nacht"
     },
     {
      "name": "Saisonalität (Jahreszeiten)",
      "desc": "Der jährliche Wechsel von warmen und kalten Zeiten. Er treibt Winterschlaf, Wanderung und den Wechsel des Fells an.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Ein zyklischer Jahresgang ist etwas anderes als ein hoher oder tiefer Wert; die Engine kennt nur Momentaufnahmen.",
      "plain": "Der Wechsel der Jahreszeiten"
     },
     {
      "name": "Thermische Extreme (Hitze/Frost-Spitzen)",
      "desc": "Letalgrenzen, seltene Killer-Events.",
      "plain": "Hitze- & Frost-Spitzen",
      "env": {
       "temperature": 0.96,
       "foodAbundance": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Thermische Stabilität",
      "desc": "Ob die Temperatur stets gleich bleibt oder stark schwankt. Gleichbleibende Wärme belohnt Spezialisten, Wechsel belohnt Allrounder.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Konstant gegen variabel ist eine Aussage über den Verlauf, nicht über einen einzelnen Zustand.",
      "plain": "Immer gleich warm oder wechselhaft"
     },
     {
      "name": "Geothermie / Mikroklima-Refugien",
      "desc": "lokale Wärme-Taschen (Quellen, Höhlen).",
      "plain": "Warme Erdwärme-Zuflucht",
      "env": {
       "temperature": 0.62,
       "water": 0.75,
       "light": 0.2
      },
      "tone": "bio"
     }
    ]
   },
   {
    "sub": "Wasser & Feuchte",
    "factors": [
     {
      "name": "Niederschlag / Feuchte",
      "desc": "Wassermenge; Basis für Pflanzen.",
      "plain": "Viel Regen & Feuchte",
      "env": {
       "water": 0.92
      },
      "tone": "bio"
     },
     {
      "name": "Niederschlags-Saisonalität",
      "desc": "Wie sich Regen über das Jahr verteilt, etwa in Regen- und Trockenzeiten. Der Wechsel formt den Rhythmus von Wachstum und Fortpflanzung.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Die Verteilung von Regen- und Trockenzeit ist ein saisonaler Verlauf, kein statischer Feuchtewert.",
      "plain": "Regenzeit und Trockenzeit"
     },
     {
      "name": "Bodenfeuchte / Wasserspeicher",
      "desc": "Sand (trocken) vs. Ton/Torf (nass).",
      "plain": "Moorboden (hält Wasser)",
      "env": {
       "water": 0.9,
       "toxicity": 0.25,
       "foodAbundance": 0.3,
       "oxygen": 0.5,
       "temperature": 0.42
      },
      "tone": "shift"
     },
     {
      "name": "Ariditäts-Index (Verdunstungs-Nachfrage)",
      "desc": "Wüsten-Rand-Effekt.",
      "plain": "Wüstenrand (dauerhaft trocken)",
      "env": {
       "aridity": 0.7,
       "water": 0.22,
       "temperature": 0.68,
       "foodAbundance": 0.42,
       "light": 0.85
      },
      "tone": "shift"
     },
     {
      "name": "Nebel/Tau-Interzeption",
      "desc": "Wasser aus Luft (Küstennebel-Wüsten).",
      "plain": "Nebelwüste (Wasser aus der Luft)",
      "env": {
       "water": 0.72,
       "aridity": 0.45,
       "light": 0.35,
       "temperature": 0.44,
       "foodAbundance": 0.4
      },
      "tone": "bio"
     },
     {
      "name": "Schneedecke / subnivaler Raum",
      "desc": "Isolation + Wasser-Speicher.",
      "plain": "Schnee & Leben darunter",
      "env": {
       "temperature": 0.12,
       "water": 0.5,
       "light": 0.4
      },
      "tone": "shift"
     }
    ]
   },
   {
    "sub": "Licht & Strahlung",
    "factors": [
     {
      "name": "Lichtintensität",
      "desc": "Photosynthese-Basis (schon drin).",
      "plain": "Grelles Sonnenlicht",
      "env": {
       "light": 0.97,
       "temperature": 0.74,
       "water": 0.38,
       "foodAbundance": 0.3,
       "aridity": 0.3
      },
      "tone": "shift"
     },
     {
      "name": "Photoperiode / Tageslänge",
      "desc": "Die Länge des Tageslichts im Lauf des Jahres. Sie dient vielen Arten als Signal für Blüte, Brut und den Aufbruch zur Wanderung.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Tageslänge ist ein zyklisches Jahreszeiten-Signal, kein einstellbarer Momentzustand.",
      "plain": "Wie lang die Tage sind"
     },
     {
      "name": "UV-Strahlung",
      "desc": "DNA-Schaden → Schutzpigmente (Höhe, Ozonloch).",
      "plain": "Starke UV-Strahlung",
      "env": {
       "uv": 0.9,
       "light": 0.92
      },
      "tone": "hit"
     },
     {
      "name": "Spektralqualität (Lichtfarbe)",
      "desc": "Tiefwasser filtert Rot → Blau-Grün-Pigmente.",
      "plain": "Blaugrünes Tiefwasser-Licht",
      "env": {
       "light": 0.33,
       "water": 0.95,
       "pressure": 0.22,
       "temperature": 0.38,
       "foodAbundance": 0.45
      },
      "tone": "shift"
     },
     {
      "name": "Photische vs. aphotische Zone",
      "desc": "Dunkelheit → Biolumineszenz/Blindheit.",
      "plain": "Lichtlose Tiefe (Dunkelheit)",
      "env": {
       "light": 0.02,
       "water": 0.98,
       "pressure": 0.45,
       "temperature": 0.3,
       "foodAbundance": 0.35
      },
      "tone": "shift"
     }
    ]
   },
   {
    "sub": "Atmosphäre & Luft",
    "factors": [
     {
      "name": "Sauerstoff (O₂)",
      "desc": "Der Anteil an Sauerstoff in der Luft. In sauerstoffreichen Zeiten konnten sogar riesige Insekten heranwachsen.",
      "soon": true,
      "layer": "neue-achse",
      "layerGrund": "Unsere oxygen-Achse endet bei normal; ein Überschuss wie im Karbon bräuchte eine Achse über Normalniveau.",
      "plain": "Wenn die Luft sehr sauerstoffreich ist"
     },
     {
      "name": "CO₂",
      "desc": "Das Gas, aus dem Pflanzen ihre Nahrung bauen und das die Luft aufheizt. Mehr davon verändert Wachstum und Klima zugleich.",
      "soon": true,
      "layer": "neue-achse",
      "layerGrund": "Bräuchte eine eigene Achse als Photosynthese-Substrat und Treibhausgas; es gibt keine.",
      "plain": "Kohlendioxid in der Luft"
     },
     {
      "name": "Luftdruck / Höhe / Hypoxie",
      "desc": "Höhen-Anpassung (Hämoglobin).",
      "plain": "Dünne Höhenluft",
      "env": {
       "oxygen": 0.12,
       "temperature": 0.28,
       "light": 0.8,
       "foodAbundance": 0.45,
       "water": 0.4
      },
      "tone": "shift"
     },
     {
      "name": "Wind (Exposition + Ausbreitungs-Vektor)",
      "desc": "Krüppelwuchs; trägt Pollen/Samen.",
      "plain": "Dauerwind & Sturm",
      "env": {
       "wind": 0.9,
       "water": 0.35,
       "temperature": 0.35
      },
      "tone": "shift"
     },
     {
      "name": "Wetter-Stochastik",
      "desc": "Wie unvorhersehbar das Wetter von Jahr zu Jahr ausfällt. Wo nichts sicher ist, gewinnen flexible Lebewesen, die alle Chancen nutzen.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Unvorhersehbarkeit ist eine Eigenschaft des Verlaufs, kein Zustand auf einer Achse.",
      "plain": "Wenn das Wetter unberechenbar wird"
     }
    ]
   },
   {
    "sub": "Aquatik (Wasser-Chemie & -Physik)",
    "factors": [
     {
      "name": "Salinität + Salz-Gradienten",
      "desc": "Süß/Brack/Meer/hypersalin; Osmoregulation.",
      "plain": "Salziges Wasser",
      "env": {
       "salinity": 0.85,
       "water": 0.9
      },
      "tone": "shift"
     },
     {
      "name": "pH / Säure",
      "desc": "saure Moore vs. alkalische Soda-Seen.",
      "plain": "Saures Wasser",
      "env": {
       "toxicity": 0.7,
       "water": 0.85
      },
      "tone": "shift"
     },
     {
      "name": "Gelöster Sauerstoff",
      "desc": "kalt/schnell vs. warm/stehend.",
      "plain": "Sauerstoffarmes Wasser",
      "env": {
       "oxygen": 0.2,
       "water": 0.92,
       "temperature": 0.7
      },
      "tone": "shift"
     },
     {
      "name": "Tiefe / hydrostatischer Druck",
      "desc": "Tiefsee-Anpassung.",
      "plain": "Tiefsee-Druck",
      "env": {
       "pressure": 0.9,
       "water": 0.98,
       "light": 0.02,
       "temperature": 0.28
      },
      "tone": "shift"
     },
     {
      "name": "Strömung / Wellenenergie / Gezeiten",
      "desc": "Stromlinie, Haftorgane, Intertidal-Zonierung.",
      "plain": "Brandungszone (Wellen & Gezeiten)",
      "env": {
       "water": 0.95,
       "wind": 0.85,
       "foodAbundance": 0.62,
       "light": 0.72,
       "temperature": 0.45
      },
      "tone": "shift"
     },
     {
      "name": "Trübung / Sediment",
      "desc": "Licht-Limit, Kiemen-Verstopfung; kann Artbildung *rückgängig* machen (Victoria-Cichliden).",
      "plain": "Trübes, schlammiges Wasser",
      "env": {
       "water": 0.8,
       "light": 0.15
      },
      "tone": "shift"
     },
     {
      "name": "Nährstoffstatus (oligo→eutroph)",
      "desc": "klare Alpenseen vs. Algen-Teiche.",
      "plain": "Nährstoffreiches Wasser",
      "env": {
       "water": 0.85,
       "foodAbundance": 0.85
      },
      "tone": "bio"
     },
     {
      "name": "Süß- vs. Meerwasser-Habitatklasse",
      "desc": "fundamentale Barriere.",
      "plain": "Brackwasser-Ästuar",
      "env": {
       "salinity": 0.45,
       "water": 0.92,
       "foodAbundance": 0.7,
       "light": 0.55
      },
      "tone": "shift"
     },
     {
      "name": "Wasser-Permanenz (Hydroperiode)",
      "desc": "Tümpel trocknen aus → Dormanz-Eier.",
      "plain": "Austrocknender Tümpel",
      "env": {
       "water": 0.42,
       "aridity": 0.62,
       "temperature": 0.72,
       "foodAbundance": 0.5
      },
      "tone": "hit"
     }
    ]
   },
   {
    "sub": "Boden & Substrat (edaphisch)",
    "factors": [
     {
      "name": "Bodentyp / Textur",
      "desc": "Sand/Schluff/Ton → Drainage, Wurzelzugang.",
      "plain": "Sandboden (Wasser versickert)",
      "env": {
       "water": 0.2,
       "foodAbundance": 0.32,
       "light": 0.8,
       "temperature": 0.6,
       "aridity": 0.35
      },
      "tone": "shift"
     },
     {
      "name": "Boden-pH & -Chemie",
      "desc": "sauer (Heide) vs. alkalisch (Kalk).",
      "plain": "Saurer Heideboden",
      "env": {
       "toxicity": 0.4,
       "foodAbundance": 0.28,
       "water": 0.55,
       "light": 0.7
      },
      "tone": "shift"
     },
     {
      "name": "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)",
      "desc": "P-arme Böden → Karnivoren.",
      "plain": "Karger, nährstoffarmer Boden",
      "env": {
       "foodAbundance": 0.12
      },
      "tone": "shift"
     },
     {
      "name": "Serpentin/Schwermetall-Toxizität",
      "desc": "Metallophyten-Endemiten.",
      "plain": "Giftiger Schwermetall-Boden",
      "env": {
       "toxicity": 0.85,
       "foodAbundance": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Fels/Sand/Karst als Substrat",
      "desc": "Grab-, Kletter-, Haft-Baupläne.",
      "plain": "Nackter Fels",
      "env": {
       "foodAbundance": 0.1,
       "water": 0.25,
       "light": 0.88,
       "temperature": 0.55,
       "wind": 0.4
      },
      "tone": "shift"
     },
     {
      "name": "Boden-Sauerstoff (Staunässe/anoxisch)",
      "desc": "Mangroven-Atemwurzeln.",
      "plain": "Staunässe / Sumpfboden",
      "env": {
       "oxygen": 0.18,
       "water": 0.95,
       "foodAbundance": 0.5
      },
      "tone": "shift"
     },
     {
      "name": "Substrat-Stabilität / Erosion",
      "desc": "Wie stabil der Untergrund ist und wie oft er abrutscht. Ständige Bewegung stört Wurzeln und Bauten und zwingt zu ständigem Neuanfang.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Erosion und Hangrutsch sind ein Störungs-Verlauf über Zeit, kein statischer Bodenzustand.",
      "plain": "Fester Fels oder rutschender Hang"
     }
    ]
   },
   {
    "sub": "Terrain & 3D-Struktur",
    "factors": [
     {
      "name": "Höhengradient",
      "desc": "stapelt Klimabänder (Wald→Alpin→Schnee).",
      "plain": "Gebirgs-Höhenlage",
      "env": {
       "temperature": 0.2,
       "foodHeight": 0.15,
       "light": 0.72,
       "water": 0.4
      },
      "tone": "shift"
     },
     {
      "name": "Hangneigung & Exposition",
      "desc": "Sonn-/Schatthang.",
      "plain": "Schattiger Nordhang",
      "env": {
       "light": 0.25,
       "temperature": 0.32,
       "water": 0.78,
       "foodAbundance": 0.5
      },
      "tone": "shift"
     },
     {
      "name": "Rauigkeit / topografische Komplexität",
      "desc": "Wie stark ein Gebiet aus Bergen, Tälern und Spalten zerfurcht ist. Viele Winkel schaffen viele Lebensräume und dadurch mehr Artenvielfalt.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Mehr Nischen und Endemismus entstehen erst mit mehreren Orten und Populationen.",
      "plain": "Ein zerklüftetes Gelände"
     },
     {
      "name": "Habitat-Struktur-Komplexität / Deckung",
      "desc": "Riff, Kronendach, Felsspalten (vertikale Schichten).",
      "plain": "Dichtes Versteck-Gestrüpp",
      "env": {
       "foodHeight": 0.9,
       "foodAbundance": 0.7
      },
      "tone": "bio"
     },
     {
      "name": "Höhlen / unterirdischer Raum",
      "desc": "dunkel, stabil → Troglobiten.",
      "plain": "Dunkle Höhle",
      "env": {
       "light": 0.02,
       "temperature": 0.46,
       "water": 0.55,
       "foodAbundance": 0.22,
       "oxygen": 0.82
      },
      "tone": "shift"
     },
     {
      "name": "Küsten-/Ufergeometrie",
      "desc": "Wie das Ufer geformt ist, ob Tümpel, Flussmündung oder felsiges Kap. Die Form entscheidet, wie viele Lebensräume am Wasser entstehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ufergeometrie definiert Zahl und Lage von Habitaten, also eine Eigenschaft der Metapopulation.",
      "plain": "Die Form der Küstenlinie"
     }
    ]
   },
   {
    "sub": "Energie, Ressourcen & Extrem-Chemie",
    "factors": [
     {
      "name": "Primärproduktivität / Ressourcen-Fülle",
      "desc": "Auftriebs-reiche vs. karge Zonen.",
      "plain": "Nahrungs-Überfluss",
      "env": {
       "foodAbundance": 0.95
      },
      "tone": "bio"
     },
     {
      "name": "Ressourcen-Patchiness / -Pulse",
      "desc": "Nahrung, die nicht gleichmäßig fließt, sondern in Schüben auftritt wie Mastjahre oder Lachszüge. Wer den Schub nutzt, hat den Vorteil.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Mast-Jahre und Pulse sind zeitliche Schübe der Nahrung, kein konstanter Fülle-Wert.",
      "plain": "Wenn Nahrung in Schüben kommt"
     },
     {
      "name": "Chemische Gradienten (Redox/Chemokline)",
      "desc": "Mikroben-Grenzschichten.",
      "plain": "Chemische Grenzschicht",
      "env": {
       "oxygen": 0.35,
       "toxicity": 0.35,
       "water": 0.9,
       "light": 0.45,
       "foodAbundance": 0.62
      },
      "tone": "shift"
     },
     {
      "name": "Energiequelle: photo- vs. chemosynthetisch",
      "desc": "Vent-/Seep-Ökosysteme.",
      "plain": "Heiße Tiefsee-Quelle",
      "env": {
       "light": 0,
       "toxicity": 0.6,
       "pressure": 0.85,
       "temperature": 0.78,
       "water": 1,
       "foodAbundance": 0.55
      },
      "tone": "shift"
     },
     {
      "name": "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)",
      "desc": "Extremophile.",
      "plain": "Extremchemie (Schwefel, Salz, Säure)",
      "env": {
       "toxicity": 0.92,
       "salinity": 0.7,
       "water": 0.6,
       "light": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Natürliche Toxine / ionisierende Strahlung",
      "desc": "Selen/Arsen-Böden, Radon.",
      "plain": "Gift & radioaktive Strahlung",
      "env": {
       "toxicity": 0.55,
       "radiation": 0.9
      },
      "tone": "hit"
     }
    ]
   },
   {
    "sub": "Feuer & Planetares",
    "factors": [
     {
      "name": "Feuer-Regime (Häufigkeit/Intensität/Saison)",
      "desc": "Serotinie, Rinde, Wiederaustrieb, Pyrodiversität.",
      "plain": "Häufige Brände",
      "env": {
       "foodAbundance": 0.3,
       "temperature": 0.72,
       "fire": 0.9
      },
      "tone": "hit"
     },
     {
      "name": "Gravitation / Auftrieb",
      "desc": "Wie stark die Schwerkraft am Körper zieht und wie sehr das Wasser trägt. Sie setzt die Grenze, wie groß ein Lebewesen werden kann.",
      "soon": true,
      "layer": "neue-achse",
      "layerGrund": "Bräuchte eine Gravitations-Achse als Größenlimit; die 16 Achsen enthalten keine.",
      "plain": "Wie schwer der Körper wiegt"
     },
     {
      "name": "Magnetfeld",
      "desc": "Das unsichtbare Magnetfeld des Planeten. Manche Tiere spüren es und finden damit auf langen Wanderungen ihren Weg über weite Strecken.",
      "soon": true,
      "layer": "neue-achse",
      "layerGrund": "Magnetfeld-Navigation bräuchte eine eigene Achse; es gibt keine.",
      "plain": "Der Kompass der Erde"
     }
    ]
   }
  ]
 },
 {
  "cat": "Welt-Events",
  "plain": "Katastrophen & Welt-Ereignisse",
  "icon": "meteor",
  "groups": [
   {
    "sub": "Störungs-Grundbegriffe",
    "factors": [
     {
      "name": "Störung (disturbance)",
      "desc": "entfernt Biomasse, öffnet Nischen.",
      "plain": "Lücke im Bestand (Störung)",
      "env": {
       "foodAbundance": 0.3,
       "light": 0.88,
       "foodHeight": 0.12,
       "predation": 0.12,
       "water": 0.5
      },
      "tone": "shift"
     },
     {
      "name": "Störungs-Regime",
      "desc": "Das Muster aus Häufigkeit, Wucht und Zeitpunkt von Störungen. Es entscheidet, ob eine Lebensgemeinschaft zur Ruhe kommt oder ständig umbaut.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Frequenz mal Intensität mal Timing beschreibt einen Störungs-Verlauf, keinen Momentzustand.",
      "plain": "Wie oft und heftig Störungen kommen"
     },
     {
      "name": "Intermediate-Disturbance-Hypothese",
      "desc": "Die Beobachtung, dass die Artenvielfalt am größten ist, wenn Störungen weder zu selten noch zu heftig auftreten, sondern mittelstark bleiben.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Eine Beobachtung, dass Vielfalt bei mittlerer Störung maximal wird, nichts zum Einstellen.",
      "plain": "Warum mittlere Störung Vielfalt bringt"
     },
     {
      "name": "Press vs. Pulse",
      "desc": "Der Unterschied zwischen lang anhaltendem Stress und einem kurzen heftigen Schlag. Beide fordern Lebewesen auf ganz verschiedene Weise heraus.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Dauerstress gegen kurzen Schock ist eine Unterscheidung von Verläufen.",
      "plain": "Dauerdruck oder kurzer Schock"
     },
     {
      "name": "Umwelt-Stochastik",
      "desc": "Zufällige Schwankungen der Umwelt, die Bestände wachsen oder schrumpfen lassen. Sie können selbst gut angepasste Gruppen unerwartet treffen.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Zufalls-Schwankung ist ein Verlauf über Zeit, kein einstellbarer Zustand.",
      "plain": "Der reine Zufall der Umwelt"
     }
    ]
   },
   {
    "sub": "Geophysikalisch / tektonisch",
    "factors": [
     {
      "name": "Vulkanausbruch / Flutbasalt (LIP)",
      "desc": "zerstört + schafft Habitat; End-Perm-Auslöser.",
      "plain": "Vulkanausbruch",
      "env": {
       "temperature": 0.8,
       "light": 0.25,
       "foodAbundance": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Vulkanwinter / Aschefall",
      "desc": "Sonnenlicht-Blockade, Abkühlung (Toba).",
      "plain": "Vulkanwinter (Aschehimmel)",
      "env": {
       "light": 0.15,
       "temperature": 0.25,
       "foodAbundance": 0.35
      },
      "tone": "hit"
     },
     {
      "name": "Erdbeben / Tsunami / Hangrutsch",
      "desc": "Terrain-Reset, Sekundär-Gefahren.",
      "plain": "Erdbeben & Flutwelle",
      "env": {
       "water": 0.75,
       "foodAbundance": 0.4
      },
      "tone": "hit"
     },
     {
      "name": "Tektonik / Kontinentaldrift / Hebung / Rifting",
      "desc": "Das langsame Wandern und Auffalten der Erdkruste über Jahrmillionen. Es hebt Gebirge, reißt Land auf und trennt oder schafft Lebensräume.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Langsame Barrieren und neue Habitate betreffen Anordnung und Trennung von Orten.",
      "plain": "Wenn Kontinente wandern"
     },
     {
      "name": "Landbrücken / Meeresspiegel",
      "desc": "Wenn ein sinkender Meeresspiegel Landmassen verbindet oder ein steigender sie trennt. So mischen sich Tierwelten oder werden voneinander isoliert.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Verbindet oder trennt Landmassen; das ist Sache der Metapopulation, nicht des Milieus einer Linie.",
      "plain": "Brücken zwischen den Landmassen"
     }
    ]
   },
   {
    "sub": "Klima / Hydrologie (Puls)",
    "factors": [
     {
      "name": "Waldbrand / Flut / Dürre / Sturm / Hitzewelle / Eissturm",
      "desc": "akute Massen-Mortalität, Lücken.",
      "plain": "Eissturm (Frost & Sturm)",
      "env": {
       "temperature": 0.08,
       "frost": 0.85,
       "wind": 0.9,
       "foodAbundance": 0.2,
       "water": 0.4
      },
      "tone": "hit"
     },
     {
      "name": "Dürre als Selektions-Episode",
      "desc": "Galápagos-Finken-Schnabel schwankt jahrweise.",
      "plain": "Lange Dürre",
      "env": {
       "water": 0.1,
       "temperature": 0.82,
       "foodAbundance": 0.3,
       "aridity": 0.9
      },
      "tone": "hit"
     }
    ]
   },
   {
    "sub": "Langzeit-Klima & Erdsystem",
    "factors": [
     {
      "name": "Eiszeit / Interglazial / abrupter Klimawechsel",
      "desc": "reorganisiert Biota (Pleistozän-Zyklen).",
      "plain": "Eiszeit",
      "env": {
       "temperature": 0.06,
       "foodAbundance": 0.35,
       "water": 0.5,
       "frost": 0.9
      },
      "tone": "shift"
     },
     {
      "name": "Hyperthermal (PETM) / Schneeball-Erde",
      "desc": "globale Warm-/Kälte-Extreme.",
      "plain": "Extreme Warmzeit",
      "env": {
       "temperature": 0.88,
       "foodAbundance": 0.8,
       "water": 0.7
      },
      "tone": "bio"
     },
     {
      "name": "Meeresspiegel-Änderung (Transgression/Regression)",
      "desc": "Schelf-Habitat + Konnektivität.",
      "plain": "Steigender Meeresspiegel",
      "env": {
       "water": 0.96,
       "foodHeight": 0.1
      },
      "tone": "shift"
     },
     {
      "name": "Ozean-Anoxie / -Versauerung / Euxinie",
      "desc": "marine Aussterbe-Treiber.",
      "plain": "Sauerstofftotes, giftiges Meer",
      "env": {
       "oxygen": 0.08,
       "toxicity": 0.6,
       "water": 0.98,
       "light": 0.25
      },
      "tone": "hit"
     },
     {
      "name": "Große Sauerstoff-Krise (GOE)",
      "desc": "Der erste große Anstieg des Sauerstoffs in der Frühzeit der Erde. Für die damaligen Lebewesen ohne Luftatmung wirkte er wie ein tödliches Gift.",
      "soon": true,
      "layer": "neue-achse",
      "layerGrund": "Eine O2-Vergiftung von Anaerobiern liegt jenseits der oxygen-Achse, die bei normal endet.",
      "plain": "Als der Sauerstoff zum Gift wurde"
     },
     {
      "name": "Aridifizierung / Grasland-Ausbreitung",
      "desc": "Miozän → Grasfresser, Hominiden.",
      "plain": "Versteppung (Grasland breitet sich aus)",
      "env": {
       "water": 0.35,
       "foodHeight": 0.3,
       "foodAbundance": 0.55,
       "light": 0.78
      },
      "tone": "shift"
     }
    ]
   },
   {
    "sub": "Kosmisch",
    "factors": [
     {
      "name": "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter",
      "desc": "Chicxulub → K-Pg.",
      "plain": "Asteroiden-Einschlag",
      "env": {
       "light": 0.1,
       "temperature": 0.25,
       "foodAbundance": 0.2
      },
      "tone": "hit"
     },
     {
      "name": "Supernova / Gammablitz (hypothetisch)",
      "desc": "Ozon-Strippen (Ordovizium?).",
      "plain": "Gammablitz (Ozonschicht weg)",
      "env": {
       "uv": 0.95,
       "radiation": 0.7,
       "light": 0.8,
       "foodAbundance": 0.35,
       "temperature": 0.45
      },
      "tone": "hit"
     },
     {
      "name": "Sonnen-Variabilität / Weltraumwetter",
      "desc": "Langzeit-Klima-Forcing.",
      "plain": "Schwache Sonnenphase",
      "env": {
       "light": 0.38,
       "temperature": 0.26,
       "water": 0.55,
       "foodAbundance": 0.4
      },
      "tone": "shift"
     }
    ]
   },
   {
    "sub": "Zyklen",
    "factors": [
     {
      "name": "Tag-Nacht / Mond-Gezeiten / Jahreszeit",
      "desc": "Die natürlichen Takte aus Tag und Nacht, Gezeiten und Jahreszeiten. Nach ihnen richten Lebewesen ihre inneren Uhren und ihre Fortpflanzung aus.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Biologische Rhythmen und synchrone Fortpflanzung brauchen einen Takt über Zeit.",
      "plain": "Die Takte der Natur"
     },
     {
      "name": "ENSO / NAO / dekadische Oszillationen",
      "desc": "Große Klimamuster, die über mehrere Jahre kommen und gehen. Sie bringen mal warme, mal kalte Phasen und prägen Nahrung und Wetter langfristig.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Mehrjährige Klima-Moden sind Oszillationen, also ein Verlauf statt eines Zustands.",
      "plain": "Klima, das über Jahre schwankt"
     },
     {
      "name": "Milankovitch-Zyklen",
      "desc": "Langsame Änderungen der Erdbahn um die Sonne über Zehntausende Jahre. Sie takten den Wechsel von Eiszeiten und Warmzeiten über riesige Zeiträume.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Orbitale Taktung der Eiszeiten ist ein langfristiger Zyklus, kein Momentwert.",
      "plain": "Warum Eiszeiten wiederkehren"
     }
    ]
   },
   {
    "sub": "Massenaussterben (als Design-Regler)",
    "factors": [
     {
      "name": "Die „Big Five“",
      "desc": "Ordovizium, Devon, Perm (Great Dying), Trias, Kreide.",
      "plain": "Das Große Sterben (Perm)",
      "env": {
       "temperature": 0.93,
       "aridity": 0.55,
       "foodAbundance": 0.1,
       "oxygen": 0.3,
       "toxicity": 0.45,
       "light": 0.4,
       "water": 0.25
      },
      "tone": "hit"
     },
     {
      "name": "Auslöser-Bündel",
      "desc": "Ein Zusammenspiel mehrerer Katastrophen wie Vulkanausbrüche, Sauerstoffmangel und Einschläge. Gemeinsam lösen sie ein großes Aussterben aus.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Fasst Vulkanismus, Anoxie und Impakt zusammen, die einzeln bereits umgesetzt sind.",
      "plain": "Wenn mehrere Katastrophen zusammenkommen"
     },
     {
      "name": "Freie Nischen → adaptive Radiation danach",
      "desc": "Wenn ein Aussterben Platz schafft, füllen die Überlebenden rasch die leeren Rollen. So wurden die Säugetiere nach den Dinosauriern groß und vielfältig.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Deckt sich mit dem bereits umgesetzten Faktor Freie Nische.",
      "plain": "Nach dem Aussterben blüht das Leben auf"
     }
    ]
   }
  ]
 },
 {
  "cat": "Raum, Isolation & Biogeografie",
  "plain": "Raum & Isolation",
  "icon": "island",
  "groups": [
   {
    "sub": "Inselbiogeografie (MacArthur–Wilson)",
    "factors": [
     {
      "name": "Gleichgewichts-Theorie (Immigration = Extinktion)",
      "desc": "Auf einer Insel pendelt sich die Zahl der Arten ein, wenn ebenso viele neu ankommen wie verschwinden. Die Arten selbst wechseln dabei ständig.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein Gleichgewicht aus Immigration und Extinktion setzt mehrere Orte mit Umschlag voraus.",
      "plain": "Wenn Zuzug und Aussterben sich ausgleichen"
     },
     {
      "name": "Arten-Areal-Beziehung (S = cAᶻ)",
      "desc": "Je größer ein Lebensraum ist, desto mehr verschiedene Arten leben darin. Mehr Platz bietet mehr Nischen, in denen sich Leben aufspalten kann.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Die Beziehung von Fläche und Artenzahl ist ein Muster an Ergebnissen, nichts zum Einstellen.",
      "plain": "Größere Flächen tragen mehr Arten"
     },
     {
      "name": "Distanz-/Isolations-Effekt",
      "desc": "Weit abgelegene Orte werden von wenigen Zuwanderern erreicht. Diese Abgeschiedenheit lässt Bewohner eigene Wege gehen und sich getrennt entwickeln.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wie viele Kolonisten einen fernen Ort erreichen, ist eine Frage der räumlichen Anordnung.",
      "plain": "Wie weit ist die Insel entfernt?"
     },
     {
      "name": "Rescue-Effekt / Target-Effekt",
      "desc": "Nahe oder große Orte bekommen laufend Zuzug von Nachbarn. Dieser Nachschub bewahrt eine schwächelnde Gruppe vor dem Aussterben.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Rettung durch nahe Populationen setzt mehrere verbundene Orte voraus.",
      "plain": "Nachschub von nahen Nachbarn"
     },
     {
      "name": "Relaxation / Extinktions-Schuld",
      "desc": "Wird ein Gebiet abgeschnitten, sinkt die Artenzahl erst langsam über lange Zeit. Manche Arten verschwinden erst spät, obwohl ihr Ende schon feststeht.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Langsam sinkende Artenzahl nach Isolation ist ein Metapopulations-Prozess.",
      "plain": "Verspätetes Artensterben nach Abtrennung"
     },
     {
      "name": "Insel-Ontogenie (GDM)",
      "desc": "Junge Vulkaninseln wachsen, altern und versinken wieder. Die größte Artenvielfalt trägt eine Insel im mittleren Lebensalter, danach nimmt sie ab.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der Vielfalts-Peak über das Insel-Alter betrifft ganze Inselbiotas, nicht eine Linie.",
      "plain": "Vielfalt folgt dem Alter der Insel"
     },
     {
      "name": "Taxon-Zyklus",
      "desc": "Eine eingewanderte Art breitet sich aus, wird zum eng spezialisierten Bewohner, schrumpft zum Rest und stirbt aus. Dieser Kreislauf formt Inselleben.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der Weg vom Kolonisten zum Relikt ist ein Zyklus in der Metapopulation.",
      "plain": "Vom Neuankömmling zum Relikt"
     }
    ]
   },
   {
    "sub": "Metapopulations-Dynamik",
    "factors": [
     {
      "name": "Patch (Habitat-Fleck)",
      "desc": "Ein abgegrenzter Ort mit eigener kleiner Bewohnergruppe. Solche Flecken sind die Bausteine, aus denen ein Netz verstreuter Populationen besteht.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein diskreter Habitat-Fleck mit eigener Population ist die Grundeinheit der Metapopulation.",
      "plain": "Einzelner Lebensraum-Flecken"
     },
     {
      "name": "Kolonisation–Extinktion-Umschlag (Levins)",
      "desc": "Einzelne Flecken sterben aus und werden neu besiedelt. Weil nie alle gleichzeitig leer sind, überdauert die Art in der ganzen Region.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Regionales Überleben trotz lokalem Aussterben braucht viele Orte mit Umschlag.",
      "plain": "Region überlebt trotz lokalem Sterben"
     },
     {
      "name": "Quelle–Senke-Dynamik",
      "desc": "In manchen Flecken gedeiht eine Art und liefert Überschuss, in anderen stirbt sie ohne Nachschub. Der Austausch hält auch die schlechten Orte besiedelt.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Gute Orte subventionieren schlechte; das setzt Genfluss zwischen Orten voraus.",
      "plain": "Gute Orte versorgen schlechte Orte"
     },
     {
      "name": "Konnektivitäts-/Inzidenz-Funktion",
      "desc": "Wie wahrscheinlich ein Ort bewohnt ist, hängt von seiner Größe und seiner Abgeschiedenheit ab. Kleine, abgelegene Flecken bleiben oft leer.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Besetzung als Funktion von Größe und Isolation ist eine Metapopulations-Größe.",
      "plain": "Chance auf Besiedlung eines Flecks"
     },
     {
      "name": "Extinktions-Schwelle / Metapop-Kapazität",
      "desc": "Fällt die Zahl bewohnbarer Orte unter eine kritische Grenze, bricht das gesamte Netz zusammen. Darunter kann sich die Art nirgends mehr halten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Eine Schwelle, unter der alles kollabiert, ergibt sich erst aus dem Netz von Orten.",
      "plain": "Kipppunkt zum Totalzusammenbruch"
     },
     {
      "name": "Synchronie vs. Portfolio-Effekt",
      "desc": "Wenn Orte unabhängig voneinander schwanken, gleicht sich Gutes und Schlechtes aus. Das schützt das Ganze so, wie viele Anlagen ein Vermögen sichern.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ob unkorrelierte Orte das Ganze puffern, ist eine Frage mehrerer Populationen.",
      "plain": "Streuung auf viele Orte puffert Risiko"
     }
    ]
   },
   {
    "sub": "Ausbreitung & Genfluss",
    "factors": [
     {
      "name": "Ausbreitungs-Fähigkeit (Vagilität) als GEN",
      "desc": "Manche Lebewesen tragen ererbte Merkmale, mit denen sie weite Strecken zurücklegen können, etwa Flügel. Das verändert, wie sich Arten verbreiten.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ausbreitungs-Fähigkeit als vererbtes Merkmal bräuchte ein neues Gen im Genom.",
      "plain": "Angeborenes Talent zum Wandern"
     },
     {
      "name": "Ausbreitungs-Kern (dispersal kernel)",
      "desc": "Nachkommen landen fast immer in der Nähe, ganz selten aber sehr weit weg. Diese seltenen Weitwürfe entscheiden über das Besiedeln ferner Orte.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein Ausbreitungs-Kern beschreibt Bewegung zwischen Orten im Raum.",
      "plain": "Meist nah, selten weit verstreut"
     },
     {
      "name": "Genfluss / Migration zwischen Orten",
      "desc": "Wandernde Lebewesen bringen ihr Erbgut in fremde Gruppen ein. Dieser Austausch gleicht Unterschiede aus und bremst die Aufspaltung in eigene Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Genfluss zwischen Orten ist der zentrale Isolations-Regler der Metapopulation.",
      "plain": "Erbgut-Austausch zwischen Orten"
     },
     {
      "name": "Ausbreitungs-Syndrome",
      "desc": "Manches verbreitet sich durch Wind, Wasser oder Tiere, anderes schleudert sich selbst fort. Der Reiseweg bestimmt, welche Orte erreicht werden.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wind, Wasser oder Tier als Ausbreitungsweg betreffen den Transfer zwischen Orten.",
      "plain": "Wie Samen und Tiere reisen"
     },
     {
      "name": "Long-Distance / Sweepstakes / Rafting / Jump-Dispersal",
      "desc": "Ganz selten überquert ein Lebewesen riesige Distanzen, etwa treibend auf einem Pflanzenfloß. Solche Zufälle besiedeln völlig abgelegene Orte.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Seltene Fern-Kolonisation ist ein räumlicher Ausbreitungs-Prozess.",
      "plain": "Seltener Glückstreffer in die Ferne"
     },
     {
      "name": "Trittstein-Konnektivität",
      "desc": "Zwischengelegene kleine Orte dienen als Sprungbretter. Über sie erreicht Leben ferne Ziele, die im einen Sprung unerreichbar wären.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Insel-Hopping über Zwischenorte ist reine Metapopulations-Konnektivität.",
      "plain": "Von Insel zu Insel weiterhüpfen"
     },
     {
      "name": "Philopatrie / Sesshaftigkeit",
      "desc": "Manche Tiere kehren zum eigenen Geburtsort zurück, wie Lachse zum Fluss. Diese Treue trennt Gruppen und lässt sie sich an ihren Ort anpassen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Heimkehr und lokale Anpassung setzen mehrere Orte mit begrenztem Austausch voraus.",
      "plain": "Rückkehr zum Geburtsort"
     },
     {
      "name": "Isolation-by-Distance / -Environment / -Resistance",
      "desc": "Je weiter Populationen auseinanderliegen oder je verschiedener ihre Umwelt, desto stärker weichen sie voneinander ab. Räumliche Distanz treibt sie auseinander.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Differenzierung mit der Distanz ergibt sich erst aus räumlich verteilten Populationen.",
      "plain": "Ferne Gruppen werden unterschiedlich"
     },
     {
      "name": "Spatial Sorting (Range-Edge)",
      "desc": "An der vordersten Ausbreitungslinie häufen sich die besten Wanderer, weil nur sie dort ankommen. So sortiert der Raum ihre Merkmale zusammen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Sortierung an der Ausbreitungsfront ist ein räumlicher Prozess über Orte hinweg.",
      "plain": "Schnellste sammeln sich an der Front"
     },
     {
      "name": "Kompetition–Kolonisation-Trade-off",
      "desc": "Wer sich gut ausbreitet, ist meist ein schwacher Konkurrent, und umgekehrt. Dieser Zielkonflikt lässt beide Typen im Raum nebeneinander bestehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der Trade-off zwischen Ausbreitung und Konkurrenz stiftet Koexistenz im Raum.",
      "plain": "Schnell siedeln oder stark kämpfen"
     }
    ]
   },
   {
    "sub": "Isolation & physische Barrieren",
    "factors": [
     {
      "name": "Geografische Isolation",
      "desc": "Zwei Gruppen einer Art leben so weit auseinander, dass sie sich nicht mehr treffen. Getrennt entwickeln sie sich zu eigenen Arten weiter.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Geografische Isolation ist die Basis allopatrischer Artbildung, also Sache mehrerer Orte.",
      "plain": "Getrennt durch Entfernung"
     },
     {
      "name": "Gebirge / Flüsse / Ozeane / Wüsten / Eisschilde als Barrieren",
      "desc": "Berge, Flüsse, Meere oder Wüsten zerschneiden ein Verbreitungsgebiet. Die getrennten Teile entwickeln sich fortan unabhängig voneinander.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Barrieren teilen Areale; das betrifft die Anordnung von Orten, nicht ein Milieu.",
      "plain": "Natürliche Hindernisse im Weg"
     },
     {
      "name": "Vikarianz vs. Dispersal",
      "desc": "Zwei Populationen sind getrennt: entweder weil eine neue Barriere durch ihr Gebiet wuchs oder weil ein Teil sie überquerte und auswanderte.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Barriere durch Areal gegen Überquerung ist eine biogeografische Unterscheidung.",
      "plain": "Barriere kam oder Art wanderte?"
     },
     {
      "name": "Landbrücken / Meeresspiegel / Orogenese / marine Barrieren",
      "desc": "Sinkende Meere legen Landbrücken frei, steigende trennen wieder. So verschmelzen und spalten sich Lebensräume über lange Zeit.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Verbinden und Trennen von Landmassen ist ein Metapopulations-Vorgang.",
      "plain": "Land verbindet und trennt sich"
     },
     {
      "name": "Edaphische Inseln (Serpentin, Karst)",
      "desc": "Seltene Bodenarten bilden Flecken inmitten anderer Landschaft. Nur angepasste Arten überleben dort und werden mit der Zeit ganz eigen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Substrat-Inseln erzeugen Endemiten erst durch Isolation mehrerer Orte.",
      "plain": "Besondere Böden als Inseln"
     }
    ]
   },
   {
    "sub": "Fragmentierung & Randeffekte",
    "factors": [
     {
      "name": "Habitat-Fragmentierung",
      "desc": "Ein zusammenhängender Lebensraum wird in kleine Inseln zerschnitten. Weniger Austausch führt zu mehr Inzucht in den einzelnen Resten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Zerstückelung mit weniger Genfluss betrifft die räumliche Struktur der Population.",
      "plain": "Lebensraum zerfällt in Stücke"
     },
     {
      "name": "Randeffekt / Kern- vs. Rand-Arten",
      "desc": "Am Rand eines Lebensraums herrscht anderes Klima als im Kern. Arten, die viel Fläche brauchen, verschwinden dort zuerst.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Kern gegen Rand und flächen-sensible Arten sind Muster fragmentierter Landschaften.",
      "plain": "Ränder anders als die Mitte"
     },
     {
      "name": "Extinktions-Schuld / Kolonisations-Kredit",
      "desc": "Nach einer Veränderung folgen Aussterben und Neuansiedlung erst mit Verzögerung. Das wahre Ergebnis zeigt sich erst nach langer Zeit.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Verzögerte Verluste und Gewinne sind Metapopulations-Dynamik über viele Orte.",
      "plain": "Verspätete Verluste und Gewinne"
     },
     {
      "name": "SLOSS-Debatte",
      "desc": "Bewahrt ein einziges großes Schutzgebiet mehr Arten oder viele kleine verstreute? Die Anordnung entscheidet über das Überleben.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Eine grosse gegen viele kleine Reserven ist eine Frage der Habitat-Anordnung.",
      "plain": "Ein großes oder viele kleine?"
     },
     {
      "name": "Matrix-Permeabilität / Korridore / Perkolations-Schwelle",
      "desc": "Zwischen Lebensraum-Inseln liegt fremdes Gelände. Ob Tiere es durchqueren können, entscheidet über den Austausch zwischen den Orten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Durchlässigkeit der Matrix und Korridore betreffen Bewegung zwischen Orten.",
      "plain": "Wie durchlässig ist die Landschaft?"
     }
    ]
   },
   {
    "sub": "Gradienten, Range-Dynamik & Konnektivität",
    "factors": [
     {
      "name": "Cline / Ecotone / Umwelt-Gradient",
      "desc": "Von Ort zu Ort verändern sich Merkmale langsam entlang einer Umweltstufe. So entsteht eine durchgehende Kette leicht verschiedener Formen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein kontinuierlicher Merkmalswandel im Raum braucht eine Kette von Populationen.",
      "plain": "Allmählicher Wandel im Raum"
     },
     {
      "name": "Breiten-/Höhen-Diversitäts-Gradient",
      "desc": "Die Artenzahl steigt zum Äquator hin und fällt zu den Polen. Ein weltweites Muster, das man an vielen Orten wiederfindet.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Der Diversitäts-Gipfel entlang Breite oder Höhe ist ein Muster an Ergebnissen.",
      "plain": "Mehr Vielfalt in den Tropen"
     },
     {
      "name": "Range-Expansion/-Kontraktion / -Limits / -Shift (Klima)",
      "desc": "Wird das Klima wärmer, verschieben sich Verbreitungsgebiete polwärts oder bergauf. Arten folgen ihren passenden Bedingungen im Raum.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wandernde Areale betreffen Verschiebung von Populationen im Raum.",
      "plain": "Verbreitungsgebiet wandert"
     },
     {
      "name": "Refugien (glazial/Mikro-)",
      "desc": "In Eiszeiten überdauern Arten in geschützten Nischen. Von dort breiten sie sich später wieder über das Land aus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Überdauern und Wieder-Ausbreitung aus Refugien ist ein räumlicher Prozess.",
      "plain": "Rückzugsorte in harten Zeiten"
     },
     {
      "name": "Arten-Pumpe (glacial species pump)",
      "desc": "Wiederkehrende Zyklen aus Trennung und Wiedervereinigung spalten Gruppen immer neu. So entstehen über die Zeit viele neue Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Zyklen aus Isolation und Reconnection erzeugen Arten über viele Orte.",
      "plain": "Eiszeiten als Artenfabrik"
     },
     {
      "name": "„Escalator to Extinction\"",
      "desc": "Bei Erwärmung ziehen Gipfelarten immer höher. Am Berggipfel angekommen bleibt kein Lebensraum mehr übrig, und sie sterben aus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wenn Gipfelarten oben aus dem Habitat laufen, ist das ein räumlicher Range-Prozess.",
      "plain": "Kein Berg mehr zum Fliehen"
     },
     {
      "name": "Landschafts-Konnektivität (strukturell vs. funktional)",
      "desc": "Nicht nur sichtbare Verbindungen zählen, sondern ob Tiere sie tatsächlich nutzen können. Das steuert den Austausch zwischen den Orten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Struktureller gegen funktionaler Zusammenhang der Landschaft ist Metapopulations-Konnektivität.",
      "plain": "Wie gut hängt Landschaft zusammen?"
     }
    ]
   },
   {
    "sub": "Realme, Endemismus, Neutraltheorie",
    "factors": [
     {
      "name": "Biogeografische Realme / Provinzialismus / Wallace-Linie",
      "desc": "Manche Gebiete tragen völlig verschiedene Tierwelten mit einer scharfen Grenze dazwischen. Sie stammt aus der Geschichte der Kontinente.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Tiefe Faunen-Grenzen ergeben sich aus der historischen Anordnung von Landmassen.",
      "plain": "Scharfe Grenzen der Tierwelt"
     },
     {
      "name": "Endemismus (Paläo-/Neo-/kryptisch) / Hotspots",
      "desc": "Manche Arten leben ausschließlich in einer einzigen Region. Lange Isolation ließ dort einzigartige Formen entstehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Regional einzigartige Formen entstehen durch Isolation vieler Orte.",
      "plain": "Nur hier und sonst nirgends"
     },
     {
      "name": "Neutraltheorie (Hubbell): Drift + Dispersal + Speziation",
      "desc": "Selbst wenn alle Arten gleich gut wären, entstünde Vielfalt allein durch Zufall, Ausbreitung und neue Arten. Auswahl ist nicht immer nötig.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Vielfalt aus Drift, Dispersal und Speziation ohne Nischen betrifft den Selektions-Mechanismus.",
      "plain": "Vielfalt auch ohne Vorteil"
     },
     {
      "name": "Distance-Decay / Nestedness / Checkerboard / Mid-Domain",
      "desc": "Ferne Orte teilen weniger Arten, arme Inseln enthalten Teilmengen reicher. Solche räumlichen Muster tauchen überall wieder auf.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Nestedness und Checkerboard sind räumliche Verteilungs-Muster, nichts zum Einstellen.",
      "plain": "Muster im Artenteppich"
     }
    ]
   }
  ]
 },
 {
  "cat": "Biotische Interaktionen",
  "plain": "Leben mit anderen Arten",
  "icon": "fang",
  "groups": [
   {
    "sub": "Interaktions-Matrix (Vorzeichen +/–/0)",
    "factors": [
     {
      "name": "Konkurrenz (–/–)",
      "desc": "intra-/interspezifisch, Ressourcen- vs. Interferenz, Scramble vs. Contest.",
      "plain": "Konkurrenz um Nahrung",
      "env": {
       "foodAbundance": 0.16,
       "predation": 0.35,
       "foodHeight": 0.45
      },
      "tone": "shift"
     },
     {
      "name": "Prädation / Herbivorie / Granivorie / Frugivorie (+/–)",
      "desc": "Konsum; frugivor↔Samenausbreitung.",
      "plain": "Räuber tauchen auf",
      "env": {
       "predation": 0.92,
       "foodAbundance": 0.55
      },
      "tone": "hit"
     },
     {
      "name": "Parasitismus (+/–)",
      "desc": "Eine Art lebt auf oder in einer anderen und schädigt sie, ohne sie sofort zu töten. Der Wirt entwickelt Abwehr, der Schmarotzer neue Tricks.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Parasitismus braucht eine zweite Art als Gegenspieler, nicht nur ein Milieu.",
      "plain": "Schmarotzen auf Kosten anderer"
     },
     {
      "name": "Mutualismus (+/+)",
      "desc": "Zwei Arten helfen sich gegenseitig, etwa Blüte und Biene. Weil beide profitieren, formen sie sich mit der Zeit aufeinander um.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Mutualismus setzt eine Partnerart voraus, die es in der Engine nicht gibt.",
      "plain": "Zusammenarbeit mit Gewinn für beide"
     },
     {
      "name": "Kommensalismus (+/0) / Amensalismus (–/0) / Neutralismus (0/0)",
      "desc": "Bei diesen Beziehungen gewinnt oder verliert höchstens eine Seite, die andere spürt nichts. Auch solches Zusammenleben lenkt die Auslese leicht mit.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Diese Vorzeichen-Beziehungen beschreiben Interaktionen zwischen zwei Arten.",
      "plain": "Nebeneinander ohne echten Austausch"
     },
     {
      "name": "Apparente Konkurrenz",
      "desc": "Zwei Beutearten schaden sich, weil sie denselben Räuber ernähren und so seine Zahl steigern. Das braucht mehrere Arten in einem Netz.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Konkurrenz über einen geteilten Räuber braucht mehrere Arten in einem Netz.",
      "plain": "Streit über den gemeinsamen Feind"
     }
    ]
   },
   {
    "sub": "Symbiosen (Schlüssel-Innovationen)",
    "factors": [
     {
      "name": "Bestäubung / Samenausbreitung (Zoochorie)",
      "desc": "Tiere bringen Blütenstaub oder Samen von Ort zu Ort und werden dafür belohnt. Pflanze und Träger passen sich über lange Zeit aneinander an.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Bestäubung und Zoochorie sind Ko-Diversifikation mit einer Partnerart.",
      "plain": "Tiere tragen Pollen und Samen"
     },
     {
      "name": "Mykorrhiza / „Wood-Wide-Web\" / N-Fixierer",
      "desc": "Pflanzenwurzeln tauschen Zucker gegen Nährstoffe von Pilzen oder Bakterien im Boden. Dieser Handel setzt eine passende Partnerart voraus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Pflanze-Pilz-Tausch braucht eine symbiotische Partnerart.",
      "plain": "Wurzeln handeln mit Pilzen"
     },
     {
      "name": "Darm-Mikrobiom / Endosymbiose",
      "desc": "Winzige Mitbewohner im Darm oder in Zellen helfen bei Verdauung und Stoffwechsel. Wirt und Untermieter entwickeln sich als Gespann weiter.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein Mikrobiom ist eine Gemeinschaft anderer Organismen im Wirt.",
      "plain": "Helfer-Kleinstleben im Körper"
     },
     {
      "name": "Koralle–Zooxanthellen / Flechte / Chemosynthese-Symbiose",
      "desc": "Ein Lebewesen beherbergt Algen oder Bakterien, die im Inneren Nahrung erzeugen. Ohne die zweite Art gäbe es diese Lebensform nicht.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Photo- und Chemo-Symbiose im Wirt setzen eine zweite Art voraus.",
      "plain": "Untermieter liefern die Nahrung"
     },
     {
      "name": "Reinigungs-Symbiose / Ameise–Pflanze / Pilz-Farming / Biolumineszenz-Symbiose",
      "desc": "Eine Art putzt, schützt, füttert oder leuchtet für eine andere und erhält Gegenleistung. Solche Abmachungen brauchen immer zwei Partner.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Reinigung, Ameise-Pflanze und Pilz-Farming sind allesamt Zwei-Arten-Beziehungen.",
      "plain": "Dienst gegen Dienst zwischen Arten"
     }
    ]
   },
   {
    "sub": "Koevolution",
    "factors": [
     {
      "name": "Antagonistisch (Wettrüsten) / Red Queen",
      "desc": "Räuber und Beute oder Wirt und Parasit rüsten sich gegenseitig immer weiter auf. Jeder Fortschritt der einen Seite zwingt die andere nachzuziehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein Wettrüsten mit Beute oder Wirt braucht die Gegenart als bewegliches Ziel.",
      "plain": "Endloses Wettrüsten zweier Arten"
     },
     {
      "name": "Mutualistisch / diffus (Gilde) / Gen-für-Gen / geografisches Mosaik",
      "desc": "Hier passen sich mehrere Arten gleichzeitig aneinander an, oft je nach Ort verschieden. Das gemeinsame Umformen braucht mehrere Partner.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Diese Koevolutions-Formen setzen eine oder mehrere Partnerarten voraus.",
      "plain": "Gemeinsames Formen über viele Arten"
     },
     {
      "name": "Escape-and-Radiate",
      "desc": "Erfindet eine Art eine Abwehr, entkommt sie ihren Feinden und fächert sich in viele Formen auf. Der Gegenspieler löst diese Vielfalt aus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Abwehr-Innovation und Radiation gegen eine Gegenart ist Koevolution.",
      "plain": "Neue Abwehr eröffnet neue Wege"
     },
     {
      "name": "Charakter-Verschiebung",
      "desc": "Wo zwei ähnliche Arten am selben Ort leben, driften ihre Merkmale auseinander. Erst der Konkurrent treibt diese Verschiebung an.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Divergenz sympatrischer Konkurrenten braucht die andere Art als Auslöser.",
      "plain": "Konkurrenten werden unähnlicher"
     },
     {
      "name": "Kospeziation",
      "desc": "Eng verbundene Partner spalten sich parallel in neue Arten auf, ihre Stammbäume gleichen sich. Das setzt zwei mitentwickelnde Linien voraus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Parallele Diversifikation von Partnern setzt zwei koevolvierende Linien voraus.",
      "plain": "Zwei Arten spalten sich im Gleichschritt"
     }
    ]
   },
   {
    "sub": "Nischen- & Konkurrenz-Theorie",
    "factors": [
     {
      "name": "Fundamentale vs. realisierte Nische",
      "desc": "Eine Art könnte vieles besiedeln, doch andere Arten drängen sie auf einen kleineren Teil zurück. Der echte Platz entsteht erst im Miteinander.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Die realisierte Nische ergibt sich erst nach Interaktion mit anderen Arten.",
      "plain": "Möglicher gegen tatsächlichen Lebensraum"
     },
     {
      "name": "Konkurrenz-Ausschluss (Gause) / Limiting Similarity",
      "desc": "Zwei Arten mit gleichem Bedarf können nicht dauerhaft koexistieren, eine verdrängt die andere. Das braucht mindestens zwei um dasselbe ringende Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Konkurrenz-Ausschluss braucht mindestens zwei um dieselbe Ressource konkurrierende Arten.",
      "plain": "Zu ähnlich, um nebeneinander zu bestehen"
     },
     {
      "name": "Nischen-Aufteilung / Charakter-Verschiebung / ökologische Freisetzung",
      "desc": "Koexistenz-Mechanik.",
      "plain": "Freie Nische (keine Rivalen)",
      "env": {
       "foodAbundance": 0.88,
       "predation": 0.04,
       "foodHeight": 0.35
      },
      "tone": "bio"
     },
     {
      "name": "Nischen-Konstruktion",
      "desc": "Organismen verändern ihre Umwelt so stark, dass sie den Druck auf sich selbst neu setzen. Damit greifen sie in die Auslese direkt ein.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Wenn Organismen ihre eigene Selektion ändern, betrifft das den Selektions-Mechanismus.",
      "plain": "Lebewesen bauen ihre eigene Auslese um"
     },
     {
      "name": "R\\*-Theorie (Tilman) / Storage-Effekt / Neutraltheorie",
      "desc": "Diese Regeln erklären, wie mehrere konkurrierende Arten sich denselben Raum teilen können. Sie gelten nur für ganze Artengemeinschaften.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Koexistenz-Bedingungen gelten für mehrere konkurrierende Arten zugleich.",
      "plain": "Wann viele Arten nebeneinander bestehen"
     },
     {
      "name": "Frequenzabhängige Selektion (neg.)",
      "desc": "Wer zu einem seltenen Typ gehört, hat einen Vorteil, sobald er häufig wird schwindet er wieder. So hängt der Erfolg von der Häufigkeit ab.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Wenn der seltene Typ im Vorteil ist, hängt die Fitness von der Population ab; das ist Selektions-Mechanik.",
      "plain": "Selten sein zahlt sich aus"
     }
    ]
   },
   {
    "sub": "Community-Struktur & Nahrungsnetze",
    "factors": [
     {
      "name": "Nahrungsnetz / trophische Ebenen",
      "desc": "Vom Pflanzenfresser bis zum Zersetzer sind alle über Fressbeziehungen verknüpft. Solche Ebenen zeigen sich erst in einer ganzen Gemeinschaft.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Trophische Ebenen ergeben sich erst aus einer Gemeinschaft mehrerer Arten.",
      "plain": "Wer frisst wen im Geflecht"
     },
     {
      "name": "Trophische Kaskade (top-down) / Bottom-up-Kontrolle",
      "desc": "Wolf→Elch→Weide.",
      "plain": "Räuber steuern alles (Top-down)",
      "env": {
       "predation": 0.85,
       "foodAbundance": 0.8,
       "light": 0.6
      },
      "tone": "shift"
     },
     {
      "name": "Keystone-Art / Ökosystem-Ingenieur / Foundation-Art",
      "desc": "überproportionaler Einfluss (Seeotter, Biber, Koralle).",
      "plain": "Ökosystem-Ingenieur (Biber staut)",
      "env": {
       "water": 0.9,
       "foodAbundance": 0.72,
       "foodHeight": 0.15,
       "light": 0.55
      },
      "tone": "bio"
     },
     {
      "name": "Janzen-Connell / Priority-Effekte / Nurse-Plants / Stress-Gradient",
      "desc": "Wer zuerst da ist, wer wen beschützt und wo Feinde lauern, entscheidet über den Artenreichtum. Diese Regeln wirken nur in einer Gemeinschaft vieler Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Diese Mechanismen erhalten Vielfalt in einer Gemeinschaft mehrerer Arten.",
      "plain": "Warum Vielfalt sich hält"
     },
     {
      "name": "Mesopredator-Release / trophic downgrading",
      "desc": "Verlust der Spitze restrukturiert alles.",
      "plain": "Kleinräuber-Schwemme",
      "env": {
       "predation": 0.76,
       "foodAbundance": 0.62,
       "foodHeight": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Sukzession / Assembly-Rules / Metacommunity",
      "desc": "In einem neuen Lebensraum siedeln sich Arten in geregelter Reihenfolge an, bis ein reifes Gefüge entsteht. Weil jede Art die Bedingungen für die nächste verändert, formt dies die Auslese vieler Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der geordnete Aufbau einer Gemeinschaft braucht viele interagierende Arten.",
      "plain": "Wie sich eine Lebensgemeinschaft aufbaut"
     }
    ]
   },
   {
    "sub": "Populationsdynamik",
    "factors": [
     {
      "name": "Dichteabhängigkeit / Tragfähigkeit (K) / logistisches Wachstum",
      "desc": "Je dichter eine Population wird, desto knapper werden Nahrung und Platz, bis das Wachstum stoppt. Diese Rückkopplung koppelt den Fortpflanzungserfolg an die Zahl der Artgenossen und lenkt die Auslese.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Dichteabhängige Regulation koppelt Fitness an die Populationsgröße; das ist Selektions-Mechanik.",
      "plain": "Bremse bei zu vielen Individuen"
     },
     {
      "name": "r/K-Selektion",
      "desc": "Ein neues Merkmal legt fest, ob ein Lebewesen viele Nachkommen ohne Fürsorge oder wenige gut versorgte hervorbringt. Diese Strategie entscheidet, welcher Weg sich in welcher Umwelt bewährt.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Viele billige gegen wenige teure Nachkommen bräuchte eine Fortpflanzungs-Strategie im Genom.",
      "plain": "Viele billige oder wenige teure Junge"
     },
     {
      "name": "Allee-Effekt",
      "desc": "Sinkt eine Population unter eine kritische Größe, finden sich kaum noch Partner und der Nachwuchs bricht ein. Diese Regel kann eine kleine Gruppe bis zum Aussterben treiben.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Reduzierte Fitness bei geringer Dichte ist eine dichteabhängige Regel der Populationsdynamik.",
      "plain": "Zu wenige sind auch schlecht"
     },
     {
      "name": "Räuber-Beute-Zyklen (Lotka-Volterra) / Funktionale Antwort (Typ I–III)",
      "desc": "Steigt die Beutezahl, wächst auch die Jägerzahl, die dann die Beute dezimiert und selbst wieder schrumpft. Diese gekoppelten Schwankungen zweier Arten treiben beide Seiten zu ständiger Anpassung.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Räuber-Beute-Oszillationen brauchen beide Arten als koppelnde Populationen.",
      "plain": "Auf und Ab von Jäger und Beute"
     },
     {
      "name": "Boom-Bust / Paradox of Enrichment / Zeitverzögerungen",
      "desc": "Reiches Nahrungsangebot und verzögerte Reaktionen lassen Populationen erst überschießen und dann einbrechen. Diese Instabilität entsteht aus der zeitlichen Kopplung zweier Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Diese Instabilitäten entstehen aus der Kopplung zweier Populationen über Zeit.",
      "plain": "Wenn zu viel Futter das System kippt"
     }
    ]
   },
   {
    "sub": "Verteidigungen & Mimikry",
    "factors": [
     {
      "name": "Tarnung (Crypsis/Hintergrund/disruptiv/Konterschattierung/Masquerade/Transparenz)",
      "desc": "Ein Färbungs-Merkmal lässt ein Lebewesen so aussehen wie sein Umfeld, sodass Jäger es übersehen. Wer besser verborgen bleibt, überlebt eher und gibt die tarnenden Muster weiter.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Tarnungs-Muster bräuchten ein Färbungs-Merkmal im Genom, das mit dem Hintergrund interagiert.",
      "plain": "Mit dem Hintergrund verschmelzen"
     },
     {
      "name": "Aposematismus (Warnfarbe)",
      "desc": "Ein auffälliges Signal-Merkmal zeigt Jägern an, dass ein Tier giftig oder wehrhaft ist. Weil Räuber solche Farben meiden, verschafft die Warnung dem Träger einen Überlebensvorteil.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Eine Warnfarbe bräuchte ein Signal-Merkmal im Genom, gekoppelt an Wehrhaftigkeit.",
      "plain": "Grelle Farbe als Warnung"
     },
     {
      "name": "Mimikry (Batesian/Müllerian/Mertensian/aggressiv/Automimikry/Vavilov/Pouyann)",
      "desc": "Eine Art übernimmt Aussehen oder Signale einer anderen, um wehrhaft zu wirken oder Beute anzulocken. Weil die Täuschung nur mit einem lebenden Vorbild wirkt, verknüpft sie beide Arten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Mimikry ahmt eine Modell-Art nach und braucht diese als Bezugsart.",
      "plain": "Eine andere Art nachahmen"
     },
     {
      "name": "Physisch (Panzer/Stacheln/Schale/Dornen) / chemisch (Toxine/Sekundärmetabolite/Gift)",
      "desc": "Neue Merkmale wie harte Schalen, spitze Dornen oder giftige Stoffe schützen ein Lebewesen vor Angreifern. Wer solche Abwehr trägt, überlebt Attacken häufiger und vererbt den Schutz.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Panzer, Stacheln oder Toxine bräuchten eigene Abwehr-Merkmale im Genom.",
      "plain": "Panzer, Stacheln oder Gift"
     },
     {
      "name": "Toxin-Sequestrierung / induzierbare vs. konstitutive Abwehr / indirekte Abwehr (Enemy-Recruit)",
      "desc": "Neue Merkmale erlauben es, fremde Gifte einzulagern oder die Abwehr erst bei Angriff hochzufahren. Solche flexiblen Schutzstrategien senken die Kosten und erhöhen die Überlebenschance.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Sequestrierung und induzierbare Abwehr bräuchten neue Merkmale im Genom.",
      "plain": "Gift speichern und Abwehr steuern"
     },
     {
      "name": "Autotomie / Thanatose / Startle-Displays / Augenflecken",
      "desc": "Verhaltens-Merkmale wie das Abwerfen eines Körperteils oder plötzliches Erschrecken bringen einen Angreifer aus dem Konzept. Wer so entkommt, überlebt und gibt das Verhalten weiter.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Autotomie und Startle-Displays sind Verhaltens-Merkmale, die das Genom nicht kennt.",
      "plain": "Schwanz abwerfen oder totstellen"
     },
     {
      "name": "Gruppen-Abwehr: Prädator-Sättigung/Mast, Verdünnung, selfish herd, Confusion, Mobbing, Alarmruf",
      "desc": "Ein Sozial-Merkmal lässt Tiere sich in großen Gruppen schützen, indem sie Jäger überfluten, verwirren oder gemeinsam vertreiben. Für den Einzelnen sinkt so das Risiko, gefressen zu werden.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Gruppen-Abwehr wie selfish herd bräuchte ein Sozial-Merkmal im Genom.",
      "plain": "Sicherheit durch die Menge"
     }
    ]
   },
   {
    "sub": "Krankheit / Pathogen-Dynamik",
    "factors": [
     {
      "name": "Epidemien / SIR-Dynamik / R₀ / Herd-Immunität",
      "desc": "Ein Erreger springt von Wirt zu Wirt, bis genug Individuen immun sind und die Welle abebbt. Weil Krankheit und Wirtspopulation aufeinander wirken, formt die Seuche beide Seiten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "SIR-Dynamik braucht ein Pathogen und eine Wirtspopulation als eigene Akteure.",
      "plain": "Wie sich Seuchen ausbreiten"
     },
     {
      "name": "Virulenz-Evolution (Trade-off; Übertragungs-Modus)",
      "desc": "Ein Erreger, der sich leicht überträgt, kann härter zuschlagen, während einer, der einen lebenden Wirt braucht, milder bleibt. Der Übertragungsweg entscheidet über seine Aggressivität.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Virulenz-Evolution spielt sich in der Pathogen-Population am Wirt ab.",
      "plain": "Wird der Erreger mild oder tödlich?"
     },
     {
      "name": "Reproduktions-Parasiten (Wolbachia): CI / Male-Killing / Feminisierung / Parthenogenese",
      "desc": "Manche Bakterien nisten sich in Wirten ein und manipulieren deren Vermehrung, indem sie Männchen töten oder Weibchen begünstigen. So verbreiten sie sich auf Kosten des Wirts.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Reproduktions-Parasiten manipulieren einen Wirt und brauchen diesen als zweite Art.",
      "plain": "Parasiten kapern die Fortpflanzung"
     },
     {
      "name": "Wirt-Manipulation (extended phenotype)",
      "desc": "Ein Parasit verändert das Verhalten seines Wirtes so, dass es dem Erreger nützt, etwa indem befallene Tiere sich Räubern ausliefern. Dieser Zwang prägt Parasit und Wirt zugleich.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wirt-Manipulation als erweiterter Phänotyp setzt Parasit und Wirt voraus.",
      "plain": "Parasit steuert seinen Wirt"
     },
     {
      "name": "MHC-Red-Queen / Verdünnungs-Effekt (Biodiversität↓Krankheit)",
      "desc": "Wirte entwickeln ständig neue Immunvarianten, während Erreger sie ebenso ständig umgehen, sodass keine Seite je gewinnt. Eine vielfältige Artengemeinschaft bremst dabei Krankheiten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "MHC-Red-Queen koppelt Wirt und Erreger und braucht beide als Populationen.",
      "plain": "Wettlauf zwischen Wirt und Erreger"
     }
    ]
   },
   {
    "sub": "Sexualselektions-Interaktionen (→ auch Ebene 6)",
    "factors": [
     {
      "name": "Intra- (Kampf) vs. inter-sexuell (Wahl)",
      "desc": "Ein neues Merkmal entscheidet, ob ein Geschlecht mit Waffen um Partner kämpft oder mit Schmuck umworben wird. Das lenkt, welche Eigenschaften sich im Wettbewerb um Nachwuchs durchsetzen.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Kampf gegen Wahl bräuchte ein Paarungssystem-Merkmal im Genom.",
      "plain": "Um Partner kämpfen oder gewählt werden"
     },
     {
      "name": "Sexualkonflikt / Spermien-Konkurrenz / kryptische Weibchenwahl / Infantizid",
      "desc": "Weil Männchen und Weibchen unterschiedliche Interessen bei der Fortpflanzung haben, entstehen Merkmale, die den eigenen Vorteil sichern. Dieser Konflikt treibt beide Seiten zu immer neuen Anpassungen.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Sexualkonflikt und Spermien-Konkurrenz bräuchten Fortpflanzungs-Merkmale im Genom.",
      "plain": "Streit der Geschlechter um Nachwuchs"
     }
    ]
   }
  ]
 },
 {
  "cat": "Genom-Achsen",
  "plain": "Körper & Gene",
  "icon": "dna",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Flügelfläche (Flug)",
      "desc": "Die Größe der Flügel bestimmt, wie gut ein Tier fliegen kann. Das ist im Spiel bereits als eigenes Merkmal umgesetzt.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Ist als AXIS-1 bereits umgesetzt und darf nicht neu etikettiert werden.",
      "plain": "Flügel zum Fliegen"
     },
     {
      "name": "Aquatik / Stromlinie / Kiemen",
      "desc": "Ein Körper mit Stromlinienform und Kiemen erlaubt das Leben unter Wasser statt an Land. Dafür braucht es ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Land gegen Wasser bräuchte ein Aquatik-Merkmal im Genom, keinen Umweltzustand.",
      "plain": "Leben im Wasser"
     },
     {
      "name": "Grabklauen (Graben)",
      "desc": "Kräftige Grabklauen lassen ein Tier sich in den Boden wühlen und dort Schutz oder Nahrung finden. Das wäre ein neues Körpermerkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Grabklauen wären ein neues Körpermerkmal; bereits als orthogonal verworfen.",
      "plain": "Klauen zum Graben"
     },
     {
      "name": "Thermische Toleranz-Breite",
      "desc": "Manche Tiere kommen nur mit einer engen Temperatur klar, andere mit vielen. Diese Bandbreite wäre ein eigenes neues Erbmerkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Toleranz-Breite gegen Optimum bräuchte ein eigenes Genom-Merkmal.",
      "plain": "Wie viele Temperaturen ein Tier erträgt"
     },
     {
      "name": "Sinne (Sehen/Hören/Chemo/Elektro/Magneto)",
      "desc": "Sehen, Hören, Riechen oder das Spüren elektrischer und magnetischer Felder helfen beim Finden von Beute und Partnern. Jeder Sinn wäre ein neues Merkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ein Sensorium wie Elektro- oder Magneto-Wahrnehmung bräuchte neue Merkmale im Genom.",
      "plain": "Die Sinne eines Tieres"
     },
     {
      "name": "Färbung / Signal-Muster",
      "desc": "Farben können tarnen, vor Gift warnen oder Partner anlocken. Solch ein sichtbares Signal wäre ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Färbung als magic trait bräuchte ein Signal-Merkmal im Genom.",
      "plain": "Farben und Muster der Haut"
     },
     {
      "name": "Toxin / Gift-Chemie",
      "desc": "Ein giftiges Tier kann sich besser wehren und leichter Beute machen. Diese Giftchemie wäre ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Gift-Chemie für Abwehr und Jagd bräuchte ein Toxin-Merkmal im Genom.",
      "plain": "Gift zum Angreifen und Verteidigen"
     },
     {
      "name": "Körper-Symmetrie / Bauplan-Achsen (Hox-artig)",
      "desc": "Der Bauplan legt fest, wie ein Körper in Abschnitte gegliedert ist und wie viele Gliedmaßen er hat. Das wäre ein neues Erbmerkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Bauplan-Achsen und Gliedmassenzahl sind Genom-Merkmale, kein Umweltzustand.",
      "plain": "Grundbauplan des Körpers"
     },
     {
      "name": "Wärmeregulation (Endo-/Ektothermie)",
      "desc": "Manche Tiere heizen sich selbst, andere hängen von der Umgebung ab. Wer selbst heizt, bleibt in Kälte aktiv. Das wäre ein neues Merkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Endo- gegen Ektothermie wäre ein Stoffwechsel-Merkmal im Genom.",
      "plain": "Eigene Körperwärme erzeugen"
     },
     {
      "name": "Fortpflanzungs-Modus als Gen",
      "desc": "Ein Tier kann sich mit einem Partner oder allein vermehren. Diese Wahl der Fortpflanzung wäre ein eigenes neues Erbmerkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Sexuell gegen asexuell bräuchte ein Fortpflanzungs-Merkmal im Genom.",
      "plain": "Art der Fortpflanzung"
     },
     {
      "name": "Ausbreitungs-Fähigkeit als Gen",
      "desc": "Manche Arten bleiben am Ort, andere breiten sich weit aus und besiedeln neue Gebiete. Diese Wanderlust wäre ein neues Erbmerkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Vagilität als Merkmal bräuchte ein neues Gen im Genom.",
      "plain": "Wie weit ein Tier wandert"
     },
     {
      "name": "Sozialität / Koloniebildung",
      "desc": "Manche Tiere leben allein, andere bilden Kolonien oder Staaten wie Ameisen. Dieses Zusammenleben wäre ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Eusozialität und Koloniebildung bräuchten ein Sozial-Merkmal im Genom.",
      "plain": "In Gruppen zusammenleben"
     }
    ]
   }
  ]
 },
 {
  "cat": "Fortpflanzung & Lebensgeschichte",
  "plain": "Fortpflanzung & Lebensweg",
  "icon": "egg",
  "groups": [
   {
    "sub": "Tempo & Zeitplan",
    "factors": [
     {
      "name": "r/K- bzw. schnell-langsam-Kontinuum",
      "desc": "Ein Lebewesen liegt irgendwo zwischen kurzem, schnellem Leben mit vielen Jungen und langem Leben mit wenigen. Dieser Grundplan bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Der Master-Slider viele-billige gegen wenige-teure bräuchte eine Fortpflanzungs-Strategie im Genom.",
      "plain": "Ganze Skala von schnell bis langsam"
     },
     {
      "name": "Grimes C-S-R (Pflanzen)",
      "desc": "Drei Lebensweisen von Pflanzen: andere verdrängen, harte Zeiten aushalten oder freie Flächen blitzschnell besetzen. Diese Grundausrichtung bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Das C-S-R-Schema bräuchte ein Lebensstrategie-Merkmal im Genom.",
      "plain": "Kämpfer, Aussitzer oder Schnellstarter"
     },
     {
      "name": "Semelparie vs. Iteroparie",
      "desc": "Ob sich ein Lebewesen nur einmal im Leben mit vollem Einsatz fortpflanzt oder immer wieder in kleineren Schüben. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ein Big-Bang gegen wiederholte Fortpflanzung bräuchte ein Lebenszyklus-Merkmal im Genom.",
      "plain": "Einmal alles oder öfter ein wenig"
     },
     {
      "name": "Generationszeit / Reifealter / reproduktive Seneszenz",
      "desc": "Wie früh ein Lebewesen sich fortpflanzen kann und wann diese Fähigkeit im Alter nachlässt. Dieses Lebenstempo bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Reifealter und Seneszenz bräuchten ein Lebensdauer-Merkmal im Genom.",
      "plain": "Wie schnell erwachsen und fruchtbar"
     },
     {
      "name": "Kosten der Fortpflanzung / terminale Investition",
      "desc": "Ob ein Lebewesen seine Energie sofort in Nachwuchs steckt oder sich für später schont. Diese Aufteilung bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Jetzt gegen später investieren bräuchte eine Allokations-Strategie im Genom.",
      "plain": "Jetzt Kraft geben oder aufsparen"
     },
     {
      "name": "Determiniertes vs. indeterminiertes Wachstum",
      "desc": "Ob ein Lebewesen ab einer Größe aufhört zu wachsen oder das ganze Leben lang wächst und dabei fruchtbarer wird. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Determiniertes gegen indeterminiertes Wachstum bräuchte ein Wachstums-Merkmal im Genom.",
      "plain": "Ausgewachsen oder lebenslang größer"
     }
    ]
   },
   {
    "sub": "Nachkommen-Zahl, -Größe, -Pflege",
    "factors": [
     {
      "name": "Fekundität",
      "desc": "Die Zahl der Eier oder Jungen, die ein Lebewesen pro Fortpflanzung hervorbringt, von wenigen bis zu Millionen. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Fekundität als Zahl der Nachkommen bräuchte ein Fortpflanzungs-Merkmal im Genom.",
      "plain": "Wie viele Nachkommen pro Runde"
     },
     {
      "name": "Größe–Zahl-Trade-off (Smith-Fretwell) / Lack-Gelegegröße",
      "desc": "Der Zwiespalt, seine Kraft auf viele kleine Nachkommen zu verteilen oder in wenige große zu stecken. Diese Wahl bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Der Größe-Zahl-Trade-off bräuchte ein Investitions-Merkmal im Genom.",
      "plain": "Viele kleine oder wenige große Junge"
     },
     {
      "name": "Dotter-Provisionierung / Lecithotrophie vs. Matrotrophie (Plazenta)",
      "desc": "Ob der Nachwuchs sich aus einem mitgegebenen Dottervorrat ernährt oder direkt vom Körper der Mutter versorgt wird. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Dotter gegen Plazenta bräuchte ein Brutpflege-Merkmal im Genom.",
      "plain": "Nahrung im Ei oder aus dem Mutterleib"
     },
     {
      "name": "Elterliche Investition (Trivers) / uni-/biparental / Allo-Parenting / kooperative Brut",
      "desc": "Ob ein Elternteil, beide oder sogar Helfer aus der Gruppe die Jungen aufziehen. Diese Aufgabenteilung bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Elterliche Investition und kooperative Brut bräuchten ein Brutpflege-Merkmal im Genom.",
      "plain": "Wer kümmert sich um den Nachwuchs"
     },
     {
      "name": "Vivipar/ovipar/ovovivipar / Brutparasitismus / Matriphagie",
      "desc": "Ob ein Lebewesen Eier ablegt, die Jungen lebend zur Welt bringt oder seine Brut anderen unterschiebt. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Vivipar gegen ovipar bräuchte ein Fortpflanzungs-Merkmal im Genom.",
      "plain": "Eier legen oder lebend gebären"
     }
    ]
   },
   {
    "sub": "Fortpflanzungs-Modi",
    "factors": [
     {
      "name": "Sexuell (Auskreuzung) vs. asexuell/klonal",
      "desc": "Ob sich ein Lebewesen mit einem Partner fortpflanzt und dabei Erbgut mischt oder allein Kopien von sich erzeugt. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Auskreuzung gegen klonal bräuchte ein Fortpflanzungs-Merkmal im Genom.",
      "plain": "Mit Partner oder als Kopie vermehren"
     },
     {
      "name": "Parthenogenese / Apomixis / Haplodiploidie / Gynogenese",
      "desc": "Sonderwege der Vermehrung, bei denen Weibchen auch ohne befruchtetes Ei Nachkommen bekommen. Diese Sondermodi bräuchten ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Parthenogenese und Haplodiploidie bräuchten Sonder-Modi als Genom-Merkmal.",
      "plain": "Nachwuchs ganz ohne Befruchtung"
     },
     {
      "name": "Simultaner & sequenzieller Hermaphroditismus (Protandrie/-gynie)",
      "desc": "Ob ein Lebewesen zugleich männlich und weiblich ist oder im Laufe des Lebens das Geschlecht wechselt. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Sexwechsel bräuchte ein Geschlechts-Merkmal im Genom.",
      "plain": "Beide Geschlechter oder Geschlechtswechsel"
     },
     {
      "name": "Selbstung / gemischte Paarung / Knospung/Fragmentierung / Polyembryonie",
      "desc": "Vermehrung durch Befruchtung mit sich selbst oder durch Abspalten von Körperteilen, die zu neuen Lebewesen werden. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Selbstung und Knospung bräuchten ein Fortpflanzungs-Merkmal im Genom.",
      "plain": "Selbstbefruchtung oder Abspalten"
     }
    ]
   },
   {
    "sub": "Komplexe Lebenszyklen",
    "factors": [
     {
      "name": "Generationswechsel / Metagenese (Polyp↔Meduse)",
      "desc": "Wenn sich zwei ganz verschiedene Körperformen im Lebenslauf abwechseln, etwa festsitzender Polyp und frei schwimmende Qualle. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ein Generationswechsel Polyp-Meduse bräuchte ein Lebenszyklus-Merkmal im Genom.",
      "plain": "Wechsel zwischen zwei Lebensformen"
     },
     {
      "name": "Metamorphose (holo-/hemimetabol) / Larvenstadien",
      "desc": "Ein völliger Körperumbau während der Entwicklung, etwa von der Raupe zum Schmetterling. Diese Verwandlung bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Metamorphose mit Larvenstadien bräuchte ein Lebenszyklus-Merkmal im Genom.",
      "plain": "Umbau vom Larven- zum Erwachsenenkörper"
     },
     {
      "name": "Mehrwirt-Parasiten-Zyklen",
      "desc": "Ein Lebenslauf, in dem ein Schmarotzer nacheinander verschiedene Wirtsarten braucht, wie Malaria Mücke und Mensch. Dafür müssen mehrere Arten mit ihren Beständen in der Welt vorhanden sein.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Ein Mehrwirt-Zyklus braucht mehrere Wirtsarten und deren Populationen.",
      "plain": "Parasit mit mehreren Wirtstieren"
     },
     {
      "name": "Paedomorphose/Neotenie / Progenese",
      "desc": "Wenn ein Lebewesen geschlechtsreif wird, aber seine jugendliche Körperform behält, wie beim Axolotl. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Neotenie, das Bleiben der Jugendform, bräuchte ein Entwicklungs-Merkmal im Genom.",
      "plain": "Jugendform bleibt ein Leben lang"
     }
    ]
   },
   {
    "sub": "Dormanz & Bet-Hedging (Unsicherheits-Strategien)",
    "factors": [
     {
      "name": "Diapause / Quieszenz / Hibernation / Aestivation",
      "desc": "Fähigkeit, in Kälte, Hitze oder Trockenheit in einen Ruhezustand zu fallen und den Stoffwechsel herunterzufahren. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ruhezustände wie Diapause bräuchten ein Dormanz-Merkmal im Genom.",
      "plain": "Ruhephasen in harten Zeiten"
     },
     {
      "name": "Samen-/Ei-Banken (Dormanz-Propagulen)",
      "desc": "Ruhende Samen oder Eier, die jahrelang im Boden warten und erst bei guten Bedingungen erwachen. Diese Reserve fürs Überleben bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Samen- und Ei-Banken als Zeit-Versicherung bräuchten ein Dormanz-Merkmal im Genom.",
      "plain": "Samen und Eier als Zeitreserve"
     },
     {
      "name": "Bet-Hedging (diversifiziert/konservativ)",
      "desc": "Eine vorsichtige Strategie, das Risiko in unsicheren Umwelten zu streuen statt alles auf eine Möglichkeit zu setzen. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Fitness-Varianz senken durch Bet-Hedging bräuchte eine Strategie im Genom.",
      "plain": "Nicht alles auf eine Karte setzen"
     },
     {
      "name": "Prädiktive vs. zufällige Plastizität",
      "desc": "Ob ein Lebewesen sich nach Vorzeichen aus der Umwelt richtet oder seine Nachkommen einfach zufällig verschieden ausfallen lässt. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Cue-gesteuerte gegen zufällige Plastizität bräuchte ein Reaktionsnorm-Merkmal im Genom.",
      "plain": "Auf Signale reagieren oder blind würfeln"
     }
    ]
   },
   {
    "sub": "Ausbreitung & Bewegung (→ Ebene 3.3)",
    "factors": [
     {
      "name": "Ausbreitungs-Syndrom / Natal- vs. Brut-Dispersal / Philopatrie",
      "desc": "Ob Junge ihren Geburtsort verlassen und sich anderswo niederlassen oder in der Nähe der Eltern bleiben. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Natal- gegen Brut-Dispersal bräuchte ein Ausbreitungs-Merkmal im Genom.",
      "plain": "Abwandern oder in der Heimat bleiben"
     },
     {
      "name": "Migration (saisonal) / Nomadismus/Irruption / Diadromie / Teilzug",
      "desc": "Wiederkehrende Wanderungen zwischen Gebieten, die dem Wechsel der Jahreszeiten folgen. Das ist kein Momentzustand, sondern braucht einen Ablauf über die Zeit.",
      "soon": true,
      "layer": "zeitachse",
      "layerGrund": "Saisonale Migration und Teilzug sind zeitlich getaktete Verläufe, kein Momentzustand.",
      "plain": "Regelmäßige Wanderungen im Jahreslauf"
     }
    ]
   },
   {
    "sub": "Paarungssysteme & Sexualselektion (→ Ebene 4.9)",
    "factors": [
     {
      "name": "Monogamie / Polygynie (Ressourcen-/Harem-/Lek-) / Polyandrie / Promiskuität",
      "desc": "Ob sich ein Lebewesen an einen Partner bindet oder sich mit mehreren paart. Dieses Paarungssystem bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Monogamie gegen Polygynie bräuchte ein Paarungssystem-Merkmal im Genom.",
      "plain": "Ein Partner oder viele Partner"
     },
     {
      "name": "Anisogamie / Bateman / operationelles Geschlechterverhältnis",
      "desc": "Der Unterschied zwischen wenigen großen Eizellen und vielen kleinen Samenzellen, aus dem die verschiedenen Rollen der Geschlechter entstehen. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Anisogamie als Wurzel der Sex-Rollen bräuchte ein Geschlechts-Merkmal im Genom.",
      "plain": "Große Eizelle, kleine Samenzelle"
     },
     {
      "name": "Ornamente (Wahl) vs. Waffen (Kampf) / Rensch-Regel / Nuptialgeschenke",
      "desc": "Ob Tiere mit prächtigem Schmuck um Partner werben oder mit Waffen um sie kämpfen. Diese Merkmale der Partnerwahl bräuchten ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Ornamente gegen Waffen bräuchten Sexualselektions-Merkmale im Genom.",
      "plain": "Schmuck zum Werben oder Waffen zum Kampf"
     },
     {
      "name": "Wahl-Modelle: Fisher-Runaway, Good-Genes/Handicap, Sensory-Bias/-Drive, Hamilton-Zuk",
      "desc": "Verschiedene Gründe, warum ein Geschlecht bestimmte Merkmale des anderen bevorzugt, etwa als Zeichen guter Gene. Solch eine Vorliebe bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Wahl-Modelle wie Fisher-Runaway bräuchten ein Präferenz-Merkmal im Genom.",
      "plain": "Wonach die Partnerwahl sich richtet"
     },
     {
      "name": "Sex-Determination (XY/ZW/Haplodiploid/TSD/ESD/sozial)",
      "desc": "Ob das Geschlecht der Nachkommen durch Erbgut, Bruttemperatur oder die Umgebung bestimmt wird. Das bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Geschlechts-Bestimmung wie TSD bräuchte ein Determinations-Merkmal im Genom.",
      "plain": "Was das Geschlecht festlegt"
     },
     {
      "name": "Fisher-1:1 / Local-Mate-Competition / Trivers-Willard",
      "desc": "Ob eine Art gleich viele Söhne und Töchter zeugt oder das Verhältnis je nach Lage verschiebt. Diese Aufteilung bräuchte ein neues Merkmal im Erbgut.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Geschlechter-Allokation bräuchte ein Verhältnis-Merkmal im Genom.",
      "plain": "Wie viele Söhne oder Töchter"
     }
    ]
   }
  ]
 },
 {
  "cat": "Evolutions-Mechanik",
  "plain": "Wie Evolution läuft",
  "icon": "tune",
  "groups": [
   {
    "sub": "Grundkräfte",
    "factors": [
     {
      "name": "Mutation (Quelle aller Variation)",
      "desc": "Das Erbgut kopiert sich nie ganz fehlerfrei; dabei entstehen zufällige Änderungen. Sie sind der Rohstoff, aus dem Neues in der Evolution überhaupt erst entsteht.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Mutation ist bereits als Quelle der Variation umgesetzt.",
      "plain": "Zufällige Erbgut-Änderung"
     },
     {
      "name": "Natürliche Selektion",
      "desc": "Wer besser zur Umgebung passt, bekommt im Schnitt mehr Nachkommen. So setzen sich vorteilhafte Merkmale über die Generationen durch.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Natürliche Selektion ist als Fitness-Gradient bereits umgesetzt.",
      "plain": "Überleben der Passenden"
     },
     {
      "name": "Genetische Drift",
      "desc": "In kleinen Gruppen entscheidet oft reiner Zufall, welche Erbanlagen weitergegeben werden. Merkmale können so verschwinden oder sich durchsetzen, ganz ohne Vorteil.",
      "soon": true,
      "layer": "schon-abgedeckt",
      "layerGrund": "Genetische Drift ist als Stochastik-Kanal bereits umgesetzt.",
      "plain": "Zufall bei kleinen Gruppen"
     },
     {
      "name": "Genfluss / Migration",
      "desc": "Wenn Tiere oder Pflanzen von einem Ort zum anderen wechseln und sich dort fortpflanzen, bringen sie neue Erbanlagen mit. Das gleicht Unterschiede zwischen Gruppen aus.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Genfluss zwischen Orten setzt eine Metapopulation aus mehreren Orten voraus.",
      "plain": "Zuwanderung neuer Erbanlagen"
     },
     {
      "name": "Rekombination (Sex) / nicht-zufällige Paarung",
      "desc": "Bei sexueller Fortpflanzung werden die Erbanlagen der Eltern neu gemischt. Wer sich mit wem paart, ist dabei oft nicht rein zufällig und verschiebt so das Ergebnis.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Rekombination und nicht-zufällige Paarung betreffen den Vererbungs-Mechanismus.",
      "plain": "Neu-Mischen bei der Fortpflanzung"
     }
    ]
   },
   {
    "sub": "Selektions-Typen (nach Wirkung)",
    "factors": [
     {
      "name": "Gerichtet / stabilisierend / disruptiv / Trunkierung",
      "desc": "Die Auslese kann ein Merkmal in eine Richtung verschieben, den Durchschnitt bevorzugen oder gerade die Extreme fördern. Je nachdem verändert sich die Gruppe unterschiedlich.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Gerichtet, stabilisierend oder disruptiv sind Selektions-Arten, also Teil der Mechanik.",
      "plain": "Wohin die Selektion drückt"
     },
     {
      "name": "Purifizierend vs. positiv",
      "desc": "Auslese kann Bewährtes schützen, indem sie schädliche Änderungen aussortiert, oder eine neue vorteilhafte Anlage aktiv verbreiten. Beides formt das Erbgut gegensätzlich.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Purifizierend gegen positiv beschreibt die Wirkungsweise der Selektion.",
      "plain": "Bewahren oder Ausbreiten"
     }
    ]
   },
   {
    "sub": "Selektions-Typen (nach Kontext)",
    "factors": [
     {
      "name": "Balancierend / Heterozygoten-Vorteil",
      "desc": "Manchmal ist wer von einer Anlage zwei verschiedene Varianten trägt am besten dran. Dadurch bleiben mehrere Varianten dauerhaft in der Gruppe erhalten.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Heterozygoten-Vorteil erhält Polymorphismus über den Vererbungs-Mechanismus.",
      "plain": "Mischform im Vorteil"
     },
     {
      "name": "Frequenz-abhängig (neg./pos.) / dichte-abhängig",
      "desc": "Wie günstig ein Merkmal ist, hängt davon ab, wie viele andere es schon haben oder wie dicht die Gruppe lebt. Seltenes kann so plötzlich im Vorteil sein.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Frequenz- und dichteabhängige Selektion koppeln Fitness an die Population; das ist Mechanik.",
      "plain": "Vorteil hängt von der Häufigkeit ab"
     },
     {
      "name": "Fluktuierend (zeitlich) / räumlich variabel (lokale Anpassung)",
      "desc": "Weil sich die Umwelt über Zeit und Ort ändert, ist mal das eine, mal das andere Merkmal günstig. So bleiben mehrere Varianten nebeneinander bestehen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Fluktuierende und räumlich variable Selektion sind Selektions-Arten der Mechanik.",
      "plain": "Wechselnde Bedingungen"
     },
     {
      "name": "Antagonistische Pleiotropie / sexuell antagonistisch",
      "desc": "Dieselbe Erbanlage kann an einer Stelle nützen und an anderer schaden, etwa gut für die Jugend, schlecht fürs Alter. Solche Zwickmühlen bremsen die Auslese.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Antagonistische Pleiotropie ist Trade-off-getrieben und Teil der genetischen Architektur.",
      "plain": "Ein Gen mit Vor- und Nachteil"
     },
     {
      "name": "Sexuelle / Verwandten- (kin) / Gruppen- / künstliche Selektion",
      "desc": "Auslese wirkt nicht nur übers reine Überleben, sondern auch über Partnerwahl, über den Nutzen für Verwandte oder durch gezielte Zucht des Menschen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Verwandten- und Gruppen-Selektion sind alternative Selektions-Ebenen der Mechanik.",
      "plain": "Weitere Formen der Auslese"
     }
    ]
   },
   {
    "sub": "Genetische Architektur",
    "factors": [
     {
      "name": "Dominanz / Über-/Unterdominanz / Pleiotropie / Epistasis (inkl. sign)",
      "desc": "Erbanlagen setzen sich unterschiedlich durch und wirken zusammen: manche überdecken andere, eine Anlage beeinflusst mehrere Merkmale. Das entscheidet, was am Ende sichtbar wird.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Dominanz, Pleiotropie und Epistasis regeln die Abbildung Genotyp auf Phänotyp.",
      "plain": "Wie Gene das Aussehen prägen"
     },
     {
      "name": "Polygenie / infinitesimal / G×E",
      "desc": "Merkmale wie Körpergröße entstehen aus vielen kleinen Erbanlagen zusammen und werden zusätzlich von der Umwelt geprägt. Deshalb verläuft die Anpassung fein abgestuft.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Polygenie und G-mal-E betreffen die genetische Architektur quantitativer Merkmale.",
      "plain": "Viele Gene plus Umwelt"
     },
     {
      "name": "Kopplung / LD / Supergene / Modularität",
      "desc": "Erbanlagen, die im Erbgut nah beieinander liegen, werden oft als Block zusammen vererbt. So werden auch benachbarte Anlagen mitgezogen, ob nützlich oder nicht.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Kopplung und Supergene sind mit-vererbte Blöcke im Vererbungs-Mechanismus.",
      "plain": "Gemeinsam vererbte Genblöcke"
     },
     {
      "name": "Gen-Duplikation → Neo-/Subfunktionalisierung / Polyploidie / Inversionen",
      "desc": "Wird eine Erbanlage verdoppelt, kann die Kopie eine neue Aufgabe übernehmen, während das Original weiterläuft. So entsteht Raum für echte Neuerungen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Gen-Duplikation und Polyploidie sind Neuheits-Quellen im Vererbungs-Mechanismus.",
      "plain": "Kopien schaffen neue Funktionen"
     }
    ]
   },
   {
    "sub": "Vererbung jenseits der DNA",
    "factors": [
     {
      "name": "Epigenetik / Methylierung / transgenerational / Imprinting / Paramutation",
      "desc": "Neben dem Erbgut selbst werden auch Schalter weitergegeben, die Gene an- oder abstellen, ohne den Text zu ändern. Auch das kann an Nachkommen übergehen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Epigenetische und transgenerationale Vererbung ist ein zusätzlicher Vererbungs-Kanal.",
      "plain": "Vererbte An-Aus-Schalter"
     },
     {
      "name": "Maternale/zytoplasmatische Effekte / Prion-/Small-RNA-Vererbung",
      "desc": "Nicht nur Gene werden vererbt: Die Mutter gibt mit der Eizelle auch Stoffe und Bausteine mit, die den Start der Nachkommen prägen. Auch das wirkt über Generationen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Maternale und zytoplasmatische Effekte sind nicht-DNA-Vererbungs-Kanäle der Mechanik.",
      "plain": "Mitgabe der Mutter"
     },
     {
      "name": "Phänotypische Plastizität / Reaktionsnorm / Polyphänismus",
      "desc": "Ein und dasselbe Erbgut kann je nach Umwelt sehr verschieden ausfallen, etwa größer bei viel Futter. So passt sich ein Lebewesen an, ohne dass sich Gene ändern.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Ein Genotyp mit vielen Phänotypen betrifft die Genotyp-Phänotyp-Abbildung.",
      "plain": "Gleiches Erbgut, andere Form"
     },
     {
      "name": "Baldwin-Effekt / genetische Assimilation / Plasticity-first",
      "desc": "Zuerst passt sich ein Lebewesen durch Lernen oder Flexibilität an. Bewährt sich das, kann die Auslese die Anpassung später fest im Erbgut verankern.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Der Baldwin-Effekt und genetische Assimilation ändern, wie Selektion greift.",
      "plain": "Erst lernen, dann vererben"
     },
     {
      "name": "Nischen-Konstruktion / kulturelle / Holobiont-Vererbung",
      "desc": "Lebewesen verändern ihren Lebensraum und geben Gewohnheiten oder Mikroben weiter. Diese Nicht-Gen-Erbschaft prägt mit, worauf die Auslese dann wirkt.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Nischen-Konstruktion und kulturelle Vererbung sind nicht-genetische Kanäle der Mechanik.",
      "plain": "Umgebung und Wissen weitergeben"
     }
    ]
   },
   {
    "sub": "Horizontaler Transfer & Fusionen",
    "factors": [
     {
      "name": "Horizontaler Gentransfer (HGT)",
      "desc": "Vor allem Bakterien reichen Erbanlagen seitwärts an andere weiter, nicht nur an Nachkommen. So verbreitet sich zum Beispiel Antibiotika-Widerstand rasant.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Horizontaler Gentransfer ist ein zusätzlicher Vererbungs-Weg neben der Deszendenz.",
      "plain": "Gene direkt austauschen"
     },
     {
      "name": "Introgression / adaptive Introgression",
      "desc": "Durch seltene Kreuzung mit einer verwandten Art sickern deren Erbanlagen dauerhaft ein. Manchmal ist genau das ein Gewinn, wie ein Höhen-Gen vom Neandertaler.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Introgression trägt Gene über Art-Grenzen und braucht eine zweite Linie.",
      "plain": "Gene aus einer anderen Art"
     },
     {
      "name": "Hybridisierung / Hybrid-Artbildung / Endosymbiose / Symbiogenese",
      "desc": "Zwei Arten kreuzen sich, oder zwei Lebewesen verschmelzen dauerhaft zu einem. So können ganz neue Arten oder sogar neue Zelltypen entstehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Hybridisierung setzt zwei sich kreuzende Arten voraus.",
      "plain": "Verschmelzen zweier Linien"
     }
    ]
   },
   {
    "sub": "Selfish Genes & Kopplungs-Effekte",
    "factors": [
     {
      "name": "Transposons / meiotic drive / Segregations-Verzerrer / Gen-Drives / B-Chromosomen",
      "desc": "Manche Erbstücke sorgen nur dafür, sich selbst überdurchschnittlich oft weiterzugeben, auch ohne Nutzen fürs Lebewesen. Sie verzerren die faire Vererbung.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Transposons und meiotic drive sind selbstsüchtige Elemente im Vererbungs-Mechanismus.",
      "plain": "Egoistische Erbstücke"
     },
     {
      "name": "Hitchhiking/Sweeps (hart/weich) / Background-Selection / Hill-Robertson / clonal interference",
      "desc": "Setzt sich eine vorteilhafte Anlage durch, werden ihre Nachbar-Anlagen einfach mitgerissen. Dadurch geht drumherum viel Vielfalt verloren.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Sweeps und Hill-Robertson sind Kopplungs-Effekte im Selektions-Mechanismus.",
      "plain": "Trittbrettfahrer im Erbgut"
     },
     {
      "name": "Muller's Ratchet / Y-Degeneration / Error-Catastrophe",
      "desc": "Ohne das Neu-Mischen bei der Fortpflanzung häufen sich schädliche Fehler immer weiter an und lassen sich nicht mehr loswerden. Das Erbgut verfällt Stück für Stück.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Mullers Ratchet beschreibt Verfall ohne Rekombination, also Vererbungs-Mechanik.",
      "plain": "Verfall ohne Neu-Mischen"
     }
    ]
   },
   {
    "sub": "Robustheit & Evolvierbarkeit",
    "factors": [
     {
      "name": "Kanalisierung / kryptische Variation (Hsp90) / genetische Robustheit",
      "desc": "Lebewesen puffern kleine Erbgut-Unterschiede ab, sodass sie unsichtbar bleiben. Unter Stress kann dieser versteckte Vorrat plötzlich zum Vorschein kommen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Kanalisierung und kryptische Variation betreffen die Robustheit der Architektur.",
      "plain": "Verstecktes Erb-Potenzial"
     },
     {
      "name": "Evolvierbarkeit / facilitated variation / neutrale Netze / effektive Populationsgröße (Nₑ)",
      "desc": "Manche Bauweisen des Erbguts erzeugen leichter brauchbare Neuerungen als andere. Wie schnell eine Gruppe sich anpassen kann, hängt auch von ihrer Größe ab.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Evolvierbarkeit und effektive Populationsgröße sind Eigenschaften des Mechanismus.",
      "plain": "Wie gut sich etwas entwickeln kann"
     }
    ]
   }
  ]
 },
 {
  "cat": "Stochastik & Kontingenz",
  "plain": "Zufall & Schicksal",
  "icon": "waves",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Founder-Effekt",
      "desc": "Nur wenige Individuen besiedeln einen neuen Ort und tragen zufällig nicht die typische Genmischung ihrer Herkunft. Dadurch startet die neue Population verschoben und schlägt einen eigenen Weg ein.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der Founder-Effekt entsteht bei Kolonisation eines neuen Ortes durch wenige Gründer.",
      "plain": "Gründung durch wenige"
     },
     {
      "name": "Flaschenhals (Bottleneck)",
      "desc": "Eine Katastrophe lässt nur wenige Überlebende zurück, sodass viel genetische Vielfalt verloren geht. Der Zufall entscheidet dann stärker mit, welche Merkmale erhalten bleiben.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Ein Flaschenhals verstärkt die Drift; das ist ein Mechanismus der Populationsgenetik.",
      "plain": "Wenige Überlebende nach Katastrophe"
     },
     {
      "name": "Founder-Flush(-Takeover)-Speziation",
      "desc": "Wenige Gründer vermehren sich am neuen Ort explosionsartig und weichen dabei rasch von der Ausgangsform ab. So kann in kurzer Zeit eine eigene Art entstehen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Founder-Flush-Speziation braucht Kolonisation und Divergenz an einem neuen Ort.",
      "plain": "Neubesiedlung mit schnellem Aufblühen"
     },
     {
      "name": "Serieller Founder-Effekt / Allele-Surfing",
      "desc": "Bei einer langen Kette von Neubesiedlungen nimmt die genetische Vielfalt mit jedem Schritt ab, weil immer nur ein Ausschnitt weiterzieht. Am Ende der Route sind Populationen am ärmsten an Varianten.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Sinkende Diversität entlang der Kolonisations-Route ist ein räumlicher Prozess.",
      "plain": "Vielfalt schwindet auf der Wanderroute"
     },
     {
      "name": "Mutations-Ordnungs-Effekt",
      "desc": "Bei gleichem Druck setzen sich in getrennten Gruppen unterschiedliche Mutationen in anderer Reihenfolge durch. Das führt zu verschiedenen Lösungen, die untereinander nicht mehr zusammenpassen.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Der Mutations-Ordnungs-Effekt betrifft die Reihenfolge fixierter Mutationen; das ist Mechanik.",
      "plain": "Reihenfolge der Mutationen zählt"
     },
     {
      "name": "Historische Kontingenz / Potenzierung / Entrenchment",
      "desc": "Was früh geschieht, öffnet oder verschließt spätere Möglichkeiten und verankert sich mit der Zeit immer fester. Würde man die Geschichte neu abspielen, käme oft ein anderes Ergebnis heraus.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Historische Kontingenz und Potenzierung betreffen die Pfadabhängigkeit der Evolution.",
      "plain": "Frühe Zufälle prägen den Weg"
     },
     {
      "name": "Dollo-Irreversibilität",
      "desc": "Ist ein komplexes Merkmal einmal verloren gegangen, entsteht es in genau derselben Form so gut wie nie wieder. Die Evolution findet höchstens einen neuen, anderen Weg zum Ziel.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Dollo-Irreversibilität ist eine Regel darüber, was der Mechanismus zulässt.",
      "plain": "Verlorenes kehrt kaum zurück"
     },
     {
      "name": "Evolutionäre Rettung (evolutionary rescue)",
      "desc": "Eine bedrohte Population überlebt, wenn sie sich schnell genug an neue Bedingungen anpasst, bevor sie ausstirbt. Ob das gelingt, ist ein Wettlauf zwischen Anpassungstempo und Risiko.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "Evolutionäre Rettung koppelt Anpassungs-Tempo an das Aussterbe-Risiko im Mechanismus.",
      "plain": "Anpassung schneller als der Untergang"
     },
     {
      "name": "Genfluss-Swamping / Migrations-Last",
      "desc": "Ständige Zuwanderung von außen bringt immer wieder ortsfremde Gene ein und verhindert, dass sich eine Randgruppe an ihre eigenen Bedingungen anpasst. Das kann die Ausbreitung einer Art begrenzen.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Wenn Zuwanderung lokale Anpassung überschwemmt, setzt das mehrere Orte voraus.",
      "plain": "Zuwanderung überschwemmt lokale Anpassung"
     }
    ]
   }
  ]
 },
 {
  "cat": "Makro-Muster",
  "plain": "Große Muster der Vielfalt",
  "icon": "globe",
  "groups": [
   {
    "sub": "Artbildungs-Modi (emergent aus Raum + Selektion)",
    "factors": [
     {
      "name": "Allopatrisch / peripatrisch / parapatrisch / sympatrisch / heteropatrisch",
      "desc": "Neue Arten entstehen je nachdem, wie räumlich getrennt die Gruppen sind, von völlig isoliert bis am selben Ort lebend. Der Grad der Trennung prägt, auf welchem Weg sich die Aufspaltung vollzieht.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Die Artbildungs-Modi sind emergente Ergebnisse aus Raum und Selektion, nichts zum Einstellen.",
      "plain": "Wie stark Populationen getrennt sind"
     },
     {
      "name": "Ökologische Speziation / „Magic-Trait\" / Sensory-Drive / Mutations-Ordnung",
      "desc": "Unterschiedliche Lebensweisen und Vorlieben bei der Partnerwahl treiben Gruppen auseinander, bis eigene Arten entstehen. Manchmal steuert ein einziges Merkmal Anpassung und Trennung zugleich.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Ökologische Speziation ist ein emergentes Ergebnis, keine einstellbare Größe.",
      "plain": "Artbildung durch Umwelt und Wahl"
     },
     {
      "name": "Reproduktive Isolation (prä-: ökolog./zeitl./ethol./mechan./gametisch; post-: BDMI/Haldane/hybrid)",
      "desc": "Zwischen Arten wirken viele Schranken: Sie treffen sich nicht, paaren sich nicht oder bekommen keinen fruchtbaren Nachwuchs. Solche Barrieren halten die getrennten Linien dauerhaft auseinander.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Reproduktive Isolation ist ein emergentes Ergebnis der Artbildung.",
      "plain": "Warum Arten sich nicht mehr mischen"
     },
     {
      "name": "Reinforcement / Wallace-Effekt / Charakter-Verschiebung",
      "desc": "Wo sich zwei junge Arten begegnen, werden Unterschiede in Aussehen und Partnerwahl oft geschärft, weil Mischlinge im Nachteil sind. So festigt sich die Trennung mit der Zeit von selbst.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Reinforcement und Wallace-Effekt sind beobachtete Artbildungs-Muster.",
      "plain": "Trennung, die sich selbst verstärkt"
     },
     {
      "name": "Hybridisierung: homoploid, allopolyploid, Introgression, Ringart, Hybridzone, Syngameon",
      "desc": "Verwandte Arten kreuzen sich in Grenzzonen, tauschen Gene aus oder verschmelzen sogar zu etwas Neuem. Solche Vermischungen zeigen, dass Artgrenzen oft durchlässiger sind als gedacht.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Hybridzonen und Ringarten sind emergente Muster, kein Regler.",
      "plain": "Wenn Arten sich doch vermischen"
     },
     {
      "name": "Despeziation / Speziations-Umkehr",
      "desc": "Bricht die Trennung zwischen zwei jungen Arten zusammen, vermischen sie sich wieder zu einer einzigen. Eine begonnene Aufspaltung wird so rückgängig gemacht.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Speziations-Umkehr ist ein beobachtetes Ergebnis am Ende eines Artbildungs-Prozesses.",
      "plain": "Wenn getrennte Arten wieder verschmelzen"
     }
    ]
   },
   {
    "sub": "Diversifikations- & Aussterbe-Muster",
    "factors": [
     {
      "name": "Adaptive vs. nicht-adaptive Radiation / ökologische Gelegenheit / Schlüssel-Innovation",
      "desc": "Aus einer Linie entsteht rasch eine Fülle von Arten, oft weil neue Lebensräume frei sind oder eine entscheidende Neuerung gelingt. Manchmal ist die Vielfalt an Nischen geknüpft, manchmal nicht.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Adaptive Radiation ist ein Diversifikations-Muster an fertigen Ergebnissen.",
      "plain": "Aufblühen vieler Arten aus einer"
     },
     {
      "name": "Ökologische Freisetzung / Insel-Syndrom (Zwerg-/Riesenwuchs, Flugverlust, Zahmheit)",
      "desc": "Auf Inseln verändern sich Arten immer wieder auf ähnliche Weise: Große werden klein, Kleine groß, Vögel verlieren die Flugfähigkeit und die Scheu. Fehlende Feinde und Konkurrenz formen dieses Muster.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Das Insel-Syndrom ist ein wiederkehrendes Ergebnis-Muster, kein einstellbarer Zustand.",
      "plain": "Was Inseln aus Tieren machen"
     },
     {
      "name": "Hintergrund- vs. Massen-Aussterben / Koaussterbe-Kaskade / Extinktions-Schuld",
      "desc": "Meist sterben Arten vereinzelt aus, doch selten reißt ein Massensterben viele auf einmal mit sich. Verschwindet eine Art, zieht sie manchmal abhängige Arten verzögert hinterher.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Hintergrund- gegen Massen-Aussterben ist ein Muster im Aussterbe-Verlauf.",
      "plain": "Aussterben im Alltag und in Wellen"
     },
     {
      "name": "Lilliput-/Lazarus-/Elvis-Taxon / Dead-Clade-Walking / Selektivität",
      "desc": "Nach Massensterben zeigen sich wiederkehrende Bilder: Überlebende schrumpfen, verschollene Formen tauchen wieder auf und manche Gruppen siechen noch lange dahin. Wer stirbt, ist selten reiner Zufall.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Lazarus- und Elvis-Taxa sind ein Vokabular für beobachtete Aussterbe-Muster.",
      "plain": "Muster nach dem großen Sterben"
     }
    ]
   },
   {
    "sub": "Tempo, Trends & Konvergenz",
    "factors": [
     {
      "name": "Phyletischer Gradualismus vs. Punktualismus / Stasis / Quantum-Evolution",
      "desc": "Manche Linien verändern sich langsam und stetig, andere bleiben lange gleich und springen dann in kurzen Schüben. Das Tempo der Evolution folgt keinem einheitlichen Takt.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Gradualismus gegen Punktualismus ist ein Muster im Tempo der Evolution.",
      "plain": "Wandel: gemächlich oder in Schüben"
     },
     {
      "name": "Anagenese vs. Kladogenese / Mosaik-Evolution / Heterochronie / Rate-Variation",
      "desc": "Eine Linie kann sich allmählich in etwas Neues verwandeln oder sich in mehrere Äste aufspalten. Dabei verändern sich einzelne Merkmale oft unterschiedlich schnell und unabhängig voneinander.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Anagenese gegen Kladogenese ist ein beobachtetes Muster der Stammesgeschichte.",
      "plain": "Umwandeln oder Aufspalten"
     },
     {
      "name": "Arten-Selektion / Court-Jester vs. Red-Queen / Turnover-Puls",
      "desc": "Nicht nur Individuen, auch ganze Arten überdauern oder verschwinden je nach ihren Eigenschaften. Ob eher die Umwelt oder das Wettrüsten unter Arten den Wandel treibt, ist ein wiederkehrendes Muster.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Arten-Selektion und Court-Jester sind Muster auf höheren Selektions-Ebenen.",
      "plain": "Auslese auch zwischen ganzen Arten"
     },
     {
      "name": "Cope-Regel / Dollo / Williston / evolutionäre Eskalation (Vermeij)",
      "desc": "Über lange Zeiträume zeigen sich Neigungen: Körper werden oft größer, Teile spezialisieren sich, Jäger und Beute rüsten gegenseitig auf. Solche Trends tauchen in ganz verschiedenen Gruppen auf.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Cope-Regel und Eskalation sind Makro-Gesetze, also beobachtete Trends.",
      "plain": "Wiederkehrende Trends im großen Bogen"
     },
     {
      "name": "Konvergenz / Parallelismus / Divergenz / iterative Evolution",
      "desc": "Nicht verwandte Arten entwickeln unter ähnlichem Druck immer wieder verblüffend ähnliche Formen. Umgekehrt treiben nahe Verwandte auseinander, wenn ihre Bedingungen sich unterscheiden.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Konvergenz und Parallelismus sind Muster wiederholter Formen an Ergebnissen.",
      "plain": "Ähnliche Formen entstehen mehrfach"
     },
     {
      "name": "Lebende Fossilien / Stasis / evolutionäre Sackgassen (Überspezialisierung)",
      "desc": "Manche Arten sehen seit Jahrmillionen fast unverändert aus, weil ihre Lebensweise stabil bleibt. Starke Spezialisierung kann eine Linie zugleich in eine Sackgasse führen.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Lebende Fossilien und Sackgassen sind beobachtete Ergebnis-Muster.",
      "plain": "Formen, die kaum noch verändern"
     }
    ]
   },
   {
    "sub": "Große Übergänge (Maynard Smith & Szathmáry)",
    "factors": [
     {
      "name": "Replikatoren→Chromosomen→DNA/Protein / Pro-→Eukaryot (Endosymbiose)",
      "desc": "Früh schlossen sich einfache Erbmoleküle zu größeren Einheiten zusammen, und aus verschmolzenen Zellen entstanden komplexe Zellen. Solche Zusammenschlüsse hoben das Leben auf neue Stufen.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Die grossen Übergänge sind ein historisches Makro-Muster, nichts zum Einstellen.",
      "plain": "Bausteine des Lebens verschmelzen"
     },
     {
      "name": "Ein- → Vielzeller / solitär → eusozial (Superorganismus) / Sprache/Kultur",
      "desc": "Immer wieder schlossen sich Einheiten zu größeren Ganzen zusammen: Zellen zu Vielzellern, Einzeltiere zu Staaten, Menschen zu Kulturen. Aus vielen Teilen wurde jeweils ein neuer handelnder Verbund.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Ein- zu Vielzeller und der Weg zur Eusozialität sind grosse Übergangs-Muster.",
      "plain": "Vom Einzelnen zur Gemeinschaft"
     }
    ]
   },
   {
    "sub": "Makroökologische Muster",
    "factors": [
     {
      "name": "Breiten-/Höhen-Diversitäts-Gradient (+ Hypothesen: Zeit-Areal/kinetisch/Out-of-Tropics)",
      "desc": "Zu den Tropen und in tieferen Lagen hin nimmt die Artenzahl meist deutlich zu. Warum das so ist, erklären mehrere Vorschläge, etwa längere Zeit, größere Flächen oder wärmeres Klima.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Der Diversitäts-Gradient samt Hypothesen ist ein makroökologisches Muster.",
      "plain": "Mehr Arten in den Tropen"
     },
     {
      "name": "Arten-Areal / Rapoport / Bergmann / Allen",
      "desc": "In der Natur zeigen sich Faustregeln: Größere Flächen beherbergen mehr Arten, und in kälteren Gebieten sind Tiere oft größer und kompakter gebaut. Solche Muster wiederholen sich rund um die Welt.",
      "soon": true,
      "layer": "makro-muster",
      "layerGrund": "Rapoport, Bergmann und Allen sind geografische Regeln an fertigen Ergebnissen.",
      "plain": "Geografische Regeln der Vielfalt"
     },
     {
      "name": "Great American Interchange / Wallace-Linie",
      "desc": "Als sich Nord- und Südamerika verbanden, wanderten Tiere in beide Richtungen und mischten die Tierwelten neu. An anderen Grenzen dagegen halten Meeresstraßen die Faunen bis heute getrennt.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Der Grosse Amerikanische Faunenaustausch ist ein biotischer Austausch zwischen Landmassen.",
      "plain": "Faunenaustausch zwischen Landmassen"
     }
    ]
   }
  ]
 },
 {
  "cat": "Anthropogen / Moderne Ära",
  "plain": "Mensch & moderne Welt",
  "icon": "flame",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Domestikation / künstliche Zucht / Domestikations-Syndrom",
      "desc": "Der Mensch züchtet Tiere gezielt auf Zahmheit, wodurch oft auch Schlappohren und neue Farben entstehen. Zahmheit wäre ein neues Merkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Bei Domestikation wählt ein Züchter Merkmale aus; Zahmheit ist kein Umweltzustand.",
      "plain": "Zähmung durch den Menschen"
     },
     {
      "name": "Gentechnik / CRISPR / Gene-Drives / synthetische Biologie / De-Extinction",
      "desc": "Mit Gentechnik greift der Mensch direkt ins Erbgut ein und kann es umschreiben. Das verändert die Vererbung selbst, nicht nur einzelne Tiere.",
      "soon": true,
      "layer": "mechanik",
      "layerGrund": "CRISPR und Gene-Drives greifen direkt in den Vererbungs-Mechanismus ein.",
      "plain": "Erbgut künstlich verändern"
     },
     {
      "name": "Konservierung: genetische Rettung / assistierte Migration / assisted gene flow",
      "desc": "Menschen bringen Tiere in neue Gebiete oder mischen Populationen, um bedrohte Arten zu retten. Das braucht mehrere Orte und Gruppen zugleich.",
      "soon": true,
      "layer": "lebende-welt",
      "layerGrund": "Assistierte Migration und Gen-Fluss setzen mehrere Orte und Populationen voraus.",
      "plain": "Bedrohte Arten aktiv retten"
     },
     {
      "name": "Ernte-induzierte Evolution",
      "desc": "Wenn nur große Tiere gejagt werden, überleben die kleinen und die Art schrumpft mit der Zeit. Dafür braucht es ein eigenes Größen-Merkmal.",
      "soon": true,
      "layer": "neues-gen",
      "layerGrund": "Größenselektive Ernte bräuchte ein Größen-Merkmal; unsere predation trifft alle Größen gleich.",
      "plain": "Wandel durch Jagd und Fischerei"
     },
     {
      "name": "Resistenz-Evolution (Echtzeit)",
      "desc": "Antibiotika / Pestizide / Herbizide / Rodentizide / Impf-Druck.",
      "plain": "Pestizid-Einsatz (Resistenz-Druck)",
      "env": {
       "toxicity": 0.75,
       "foodAbundance": 0.75,
       "light": 0.72,
       "water": 0.5,
       "predation": 0.1
      },
      "tone": "hit"
     },
     {
      "name": "Habitat-Zerstörung & -Fragmentierung / Korridore / Straßen als Barrieren",
      "desc": ".",
      "plain": "Lebensraum-Verlust",
      "env": {
       "foodAbundance": 0.15,
       "foodHeight": 0.05,
       "light": 0.9,
       "water": 0.3,
       "predation": 0.55,
       "temperature": 0.62
      },
      "tone": "hit"
     },
     {
      "name": "Verschmutzung als Selektion",
      "desc": "Industrie-Melanismus, Hormon-Disruptoren, Licht/Lärm/thermisch, Eutrophierung (→ Speziations-Umkehr).",
      "plain": "Verschmutzung & Überdüngung",
      "env": {
       "toxicity": 0.45,
       "oxygen": 0.35,
       "water": 0.85,
       "foodAbundance": 0.85,
       "light": 0.4
      },
      "tone": "shift"
     },
     {
      "name": "Klimawandel (anthropogen)",
      "desc": "Range-Shifts, phänologische Verschiebung/Mismatch, Hitze-Toleranz, TSD-Skew, Hybridisierung durch Range-Kollision (Pizzly-Bär).",
      "plain": "Menschgemachte Erwärmung",
      "env": {
       "temperature": 0.82,
       "water": 0.45,
       "aridity": 0.4,
       "foodAbundance": 0.5,
       "light": 0.7
      },
      "tone": "shift"
     },
     {
      "name": "Invasive Arten / biotische Homogenisierung / Enemy-Release/EICA / Neuartige Ökosysteme",
      "desc": ".",
      "plain": "Eingeschleppte Art (neuer Rivale)",
      "env": {
       "predation": 0.8,
       "foodAbundance": 0.3,
       "foodHeight": 0.4,
       "light": 0.6
      },
      "tone": "hit"
     },
     {
      "name": "Urbanisierung / Urban-Evolution",
      "desc": "Hitzeinsel, Verhaltens-Zahmheit, U-Bahn-Mücke, weißer Klee ohne Cyanogenese.",
      "plain": "Stadt (Hitzeinsel & Nachtlicht)",
      "env": {
       "temperature": 0.72,
       "light": 0.75,
       "foodAbundance": 0.65,
       "water": 0.3,
       "predation": 0.12,
       "toxicity": 0.3,
       "wind": 0.3
      },
      "tone": "shift"
     },
     {
      "name": "Defaunation / Trophic Downgrading / 6. Massenaussterben (HIREC)",
      "desc": "Extinktions-Filter (groß/langsam/spezialisiert zuerst).",
      "plain": "Entleerte Tierwelt",
      "env": {
       "predation": 0.05,
       "foodAbundance": 0.4,
       "foodHeight": 0.5,
       "light": 0.6,
       "water": 0.55
      },
      "tone": "shift"
     }
    ]
   }
  ]
 }
];
