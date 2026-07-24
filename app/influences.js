// AUTO-GENERIERT von tools/build-influences.mjs aus docs/faktoren-katalog.md.
// Nicht von Hand editieren — Effekte in tools/build-influences.mjs (EFFECTS) pflegen,
// dann neu generieren: node tools/build-influences.mjs
// `env` = real umsetzbar (6 Kern-Dimensionen + toxicity). `soon` = im Katalog, aber als
// echte Selektionsachse/Ebene noch in Arbeit. `tone` = Effekt-Farbe (hit/shift/bio).
window.INFLUENCES = [
 {
  "cat": "Ort-Parameter",
  "icon": "mountain",
  "groups": [
   {
    "sub": "Temperatur & Thermik",
    "factors": [
     {
      "name": "Mitteltemperatur",
      "desc": "Basis-Wärme des Ortes.",
      "soon": true
     },
     {
      "name": "Temperatur-Spanne / Tag-Nacht-Schwankung",
      "desc": "selektiert Toleranz-Breite statt Optimum.",
      "soon": true
     },
     {
      "name": "Saisonalität (Jahreszeiten)",
      "desc": "zyklischer Temperaturgang → Dormanz, Wanderung, Fell-Wechsel.",
      "soon": true
     },
     {
      "name": "Thermische Extreme (Hitze/Frost-Spitzen)",
      "desc": "Letalgrenzen, seltene Killer-Events.",
      "env": {
       "temperature": 0.96,
       "foodAbundance": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Thermische Stabilität",
      "desc": "konstant (Tiefsee) vs. variabel → Spezialist vs. Generalist.",
      "soon": true
     },
     {
      "name": "Geothermie / Mikroklima-Refugien",
      "desc": "lokale Wärme-Taschen (Quellen, Höhlen).",
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
      "env": {
       "water": 0.92
      },
      "tone": "bio"
     },
     {
      "name": "Niederschlags-Saisonalität",
      "desc": "Regen-/Trockenzeit-Verteilung (Monsun, Mittelmeer).",
      "soon": true
     },
     {
      "name": "Bodenfeuchte / Wasserspeicher",
      "desc": "Sand (trocken) vs. Ton/Torf (nass).",
      "soon": true
     },
     {
      "name": "Ariditäts-Index (Verdunstungs-Nachfrage)",
      "desc": "Wüsten-Rand-Effekt.",
      "soon": true
     },
     {
      "name": "Nebel/Tau-Interzeption",
      "desc": "Wasser aus Luft (Küstennebel-Wüsten).",
      "soon": true
     },
     {
      "name": "Schneedecke / subnivaler Raum",
      "desc": "Isolation + Wasser-Speicher.",
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
      "env": {
       "light": 0.96
      },
      "tone": "bio"
     },
     {
      "name": "Photoperiode / Tageslänge",
      "desc": "Jahreszeiten-Signal (Blüte, Brut, Zug).",
      "soon": true
     },
     {
      "name": "UV-Strahlung",
      "desc": "DNA-Schaden → Schutzpigmente (Höhe, Ozonloch).",
      "env": {
       "uv": 0.9,
       "light": 0.92
      },
      "tone": "hit"
     },
     {
      "name": "Spektralqualität (Lichtfarbe)",
      "desc": "Tiefwasser filtert Rot → Blau-Grün-Pigmente.",
      "soon": true
     },
     {
      "name": "Photische vs. aphotische Zone",
      "desc": "Dunkelheit → Biolumineszenz/Blindheit.",
      "env": {
       "light": 0.02
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
      "desc": "historisch variabel; Karbon 35 % → Rieseninsekten.",
      "soon": true
     },
     {
      "name": "CO₂",
      "desc": "Treibhaus + Photosynthese-Substrat.",
      "soon": true
     },
     {
      "name": "Luftdruck / Höhe / Hypoxie",
      "desc": "Höhen-Anpassung (Hämoglobin).",
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
      "soon": true
     },
     {
      "name": "Wetter-Stochastik",
      "desc": "Unvorhersehbarkeit → opportunistische Strategien.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Aquatik (Wasser-Chemie & -Physik)",
    "factors": [
     {
      "name": "Salinität + Salz-Gradienten",
      "desc": "Süß/Brack/Meer/hypersalin; Osmoregulation.",
      "env": {
       "salinity": 0.85,
       "water": 0.9
      },
      "tone": "shift"
     },
     {
      "name": "pH / Säure",
      "desc": "saure Moore vs. alkalische Soda-Seen.",
      "env": {
       "toxicity": 0.7,
       "water": 0.85
      },
      "tone": "shift"
     },
     {
      "name": "Gelöster Sauerstoff",
      "desc": "kalt/schnell vs. warm/stehend.",
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
      "soon": true
     },
     {
      "name": "Trübung / Sediment",
      "desc": "Licht-Limit, Kiemen-Verstopfung; kann Artbildung *rückgängig* machen (Victoria-Cichliden).",
      "env": {
       "water": 0.8,
       "light": 0.15
      },
      "tone": "shift"
     },
     {
      "name": "Nährstoffstatus (oligo→eutroph)",
      "desc": "klare Alpenseen vs. Algen-Teiche.",
      "env": {
       "water": 0.85,
       "foodAbundance": 0.85
      },
      "tone": "bio"
     },
     {
      "name": "Süß- vs. Meerwasser-Habitatklasse",
      "desc": "fundamentale Barriere.",
      "soon": true
     },
     {
      "name": "Wasser-Permanenz (Hydroperiode)",
      "desc": "Tümpel trocknen aus → Dormanz-Eier.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Boden & Substrat (edaphisch)",
    "factors": [
     {
      "name": "Bodentyp / Textur",
      "desc": "Sand/Schluff/Ton → Drainage, Wurzelzugang.",
      "soon": true
     },
     {
      "name": "Boden-pH & -Chemie",
      "desc": "sauer (Heide) vs. alkalisch (Kalk).",
      "soon": true
     },
     {
      "name": "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)",
      "desc": "P-arme Böden → Karnivoren.",
      "env": {
       "foodAbundance": 0.2
      },
      "tone": "shift"
     },
     {
      "name": "Serpentin/Schwermetall-Toxizität",
      "desc": "Metallophyten-Endemiten.",
      "env": {
       "toxicity": 0.85,
       "foodAbundance": 0.3
      },
      "tone": "hit"
     },
     {
      "name": "Fels/Sand/Karst als Substrat",
      "desc": "Grab-, Kletter-, Haft-Baupläne.",
      "soon": true
     },
     {
      "name": "Boden-Sauerstoff (Staunässe/anoxisch)",
      "desc": "Mangroven-Atemwurzeln.",
      "env": {
       "oxygen": 0.18,
       "water": 0.95,
       "foodAbundance": 0.5
      },
      "tone": "shift"
     },
     {
      "name": "Substrat-Stabilität / Erosion",
      "desc": "Hangrutsch vs. stabiler Fels.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Terrain & 3D-Struktur",
    "factors": [
     {
      "name": "Höhengradient",
      "desc": "stapelt Klimabänder (Wald→Alpin→Schnee).",
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
      "soon": true
     },
     {
      "name": "Rauigkeit / topografische Komplexität",
      "desc": "mehr Nischen, mehr Endemismus.",
      "soon": true
     },
     {
      "name": "Habitat-Struktur-Komplexität / Deckung",
      "desc": "Riff, Kronendach, Felsspalten (vertikale Schichten).",
      "env": {
       "foodHeight": 0.9,
       "foodAbundance": 0.7
      },
      "tone": "bio"
     },
     {
      "name": "Höhlen / unterirdischer Raum",
      "desc": "dunkel, stabil → Troglobiten.",
      "env": {
       "light": 0.02,
       "temperature": 0.45,
       "water": 0.6
      },
      "tone": "shift"
     },
     {
      "name": "Küsten-/Ufergeometrie",
      "desc": "Tümpel, Ästuar, exponierte Kaps.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Energie, Ressourcen & Extrem-Chemie",
    "factors": [
     {
      "name": "Primärproduktivität / Ressourcen-Fülle",
      "desc": "Auftriebs-reiche vs. karge Zonen.",
      "env": {
       "foodAbundance": 0.95
      },
      "tone": "bio"
     },
     {
      "name": "Ressourcen-Patchiness / -Pulse",
      "desc": "Mast-Jahre, Lachszüge, Wüstenblüte.",
      "soon": true
     },
     {
      "name": "Chemische Gradienten (Redox/Chemokline)",
      "desc": "Mikroben-Grenzschichten.",
      "soon": true
     },
     {
      "name": "Energiequelle: photo- vs. chemosynthetisch",
      "desc": "Vent-/Seep-Ökosysteme.",
      "soon": true
     },
     {
      "name": "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)",
      "desc": "Extremophile.",
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
      "env": {
       "toxicity": 0.8
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
      "env": {
       "foodAbundance": 0.3,
       "temperature": 0.72
      },
      "tone": "hit"
     },
     {
      "name": "Gravitation / Auftrieb",
      "desc": "Größenlimit an Land vs. im Wasser (Blauwal).",
      "soon": true
     },
     {
      "name": "Magnetfeld",
      "desc": "Navigation (Magnetotaxis, Zugvögel).",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Welt-Events",
  "icon": "meteor",
  "groups": [
   {
    "sub": "Störungs-Grundbegriffe",
    "factors": [
     {
      "name": "Störung (disturbance)",
      "desc": "entfernt Biomasse, öffnet Nischen.",
      "soon": true
     },
     {
      "name": "Störungs-Regime",
      "desc": "Frequenz×Intensität×Größe×Timing.",
      "soon": true
     },
     {
      "name": "Intermediate-Disturbance-Hypothese",
      "desc": "Vielfalt maximal bei *mittlerer* Störung.",
      "soon": true
     },
     {
      "name": "Press vs. Pulse",
      "desc": "Dauer-Stress vs. kurzer Schock.",
      "soon": true
     },
     {
      "name": "Umwelt-Stochastik",
      "desc": "Zufalls-Schwankung → Populations-Fluktuation.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Geophysikalisch / tektonisch",
    "factors": [
     {
      "name": "Vulkanausbruch / Flutbasalt (LIP)",
      "desc": "zerstört + schafft Habitat; End-Perm-Auslöser.",
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
      "env": {
       "water": 0.75,
       "foodAbundance": 0.4
      },
      "tone": "hit"
     },
     {
      "name": "Tektonik / Kontinentaldrift / Hebung / Rifting",
      "desc": "*langsame* Barrieren + neue Habitate (Anden, Rift-Seen).",
      "soon": true
     },
     {
      "name": "Landbrücken / Meeresspiegel",
      "desc": "verbinden/trennen Landmassen (Beringia, Sundaland).",
      "soon": true
     }
    ]
   },
   {
    "sub": "Klima / Hydrologie (Puls)",
    "factors": [
     {
      "name": "Waldbrand / Flut / Dürre / Sturm / Hitzewelle / Eissturm",
      "desc": "akute Massen-Mortalität, Lücken.",
      "soon": true
     },
     {
      "name": "Dürre als Selektions-Episode",
      "desc": "Galápagos-Finken-Schnabel schwankt jahrweise.",
      "env": {
       "water": 0.1,
       "temperature": 0.82,
       "foodAbundance": 0.3
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
      "env": {
       "temperature": 0.06,
       "foodAbundance": 0.35,
       "water": 0.5
      },
      "tone": "shift"
     },
     {
      "name": "Hyperthermal (PETM) / Schneeball-Erde",
      "desc": "globale Warm-/Kälte-Extreme.",
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
      "env": {
       "water": 0.96,
       "foodHeight": 0.1
      },
      "tone": "shift"
     },
     {
      "name": "Ozean-Anoxie / -Versauerung / Euxinie",
      "desc": "marine Aussterbe-Treiber.",
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
      "desc": "O₂-Anstieg vergiftet Anaerobier.",
      "soon": true
     },
     {
      "name": "Aridifizierung / Grasland-Ausbreitung",
      "desc": "Miozän → Grasfresser, Hominiden.",
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
      "soon": true
     },
     {
      "name": "Sonnen-Variabilität / Weltraumwetter",
      "desc": "Langzeit-Klima-Forcing.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Zyklen",
    "factors": [
     {
      "name": "Tag-Nacht / Mond-Gezeiten / Jahreszeit",
      "desc": "biologische Rhythmen, synchrone Fortpflanzung.",
      "soon": true
     },
     {
      "name": "ENSO / NAO / dekadische Oszillationen",
      "desc": "mehrjährige Klima-Moden.",
      "soon": true
     },
     {
      "name": "Milankovitch-Zyklen",
      "desc": "Orbital-Taktung der Eiszeiten (→ „Arten-Pumpe\", s. 3.6).",
      "soon": true
     }
    ]
   },
   {
    "sub": "Massenaussterben (als Design-Regler)",
    "factors": [
     {
      "name": "Die „Big Five\"",
      "desc": "Ordovizium, Devon, Perm (Great Dying), Trias, Kreide.",
      "soon": true
     },
     {
      "name": "Auslöser-Bündel",
      "desc": "Vulkanismus+Warming+Anoxie+Versauerung; Impakt; Vereisung+Meeresspiegel.",
      "soon": true
     },
     {
      "name": "Freie Nischen → adaptive Radiation danach",
      "desc": "Säuger nach den Dinos. Der Diversitäts-Motor schlechthin.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Raum, Isolation & Biogeografie",
  "icon": "island",
  "groups": [
   {
    "sub": "Inselbiogeografie (MacArthur–Wilson)",
    "factors": [
     {
      "name": "Gleichgewichts-Theorie (Immigration = Extinktion)",
      "desc": "stabile Artenzahl mit Umschlag.",
      "soon": true
     },
     {
      "name": "Arten-Areal-Beziehung (S = cAᶻ)",
      "desc": "größere Orte → mehr Formen.",
      "soon": true
     },
     {
      "name": "Distanz-/Isolations-Effekt",
      "desc": "ferne Orte bekommen weniger Kolonisten.",
      "soon": true
     },
     {
      "name": "Rescue-Effekt / Target-Effekt",
      "desc": "nahe/große Orte werden „gerettet\"/besser getroffen.",
      "soon": true
     },
     {
      "name": "Relaxation / Extinktions-Schuld",
      "desc": "nach Isolation sinkt Artenzahl langsam.",
      "soon": true
     },
     {
      "name": "Insel-Ontogenie (GDM)",
      "desc": "Vielfalt peakt bei mittlerem Insel-Alter.",
      "soon": true
     },
     {
      "name": "Taxon-Zyklus",
      "desc": "Kolonist → Spezialist/Endemit → Relikt → Aussterben.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Metapopulations-Dynamik",
    "factors": [
     {
      "name": "Patch (Habitat-Fleck)",
      "desc": "diskreter Ort mit lokaler Population.",
      "soon": true
     },
     {
      "name": "Kolonisation–Extinktion-Umschlag (Levins)",
      "desc": "regionales Überleben trotz lokalem Aussterben.",
      "soon": true
     },
     {
      "name": "Quelle–Senke-Dynamik",
      "desc": "gute Orte subventionieren schlechte.",
      "soon": true
     },
     {
      "name": "Konnektivitäts-/Inzidenz-Funktion",
      "desc": "Besetzung ~ Größe + Isolation.",
      "soon": true
     },
     {
      "name": "Extinktions-Schwelle / Metapop-Kapazität",
      "desc": "unter X kollabiert alles.",
      "soon": true
     },
     {
      "name": "Synchronie vs. Portfolio-Effekt",
      "desc": "unkorrelierte Orte puffern das Ganze.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Ausbreitung & Genfluss",
    "factors": [
     {
      "name": "Ausbreitungs-Fähigkeit (Vagilität) als GEN",
      "desc": "geflügelt vs. flügellos.",
      "soon": true
     },
     {
      "name": "Ausbreitungs-Kern (dispersal kernel)",
      "desc": "meist nah, selten weit (fat tail).",
      "soon": true
     },
     {
      "name": "Genfluss / Migration zwischen Orten",
      "desc": "homogenisiert; der zentrale Isolations-Regler.",
      "soon": true
     },
     {
      "name": "Ausbreitungs-Syndrome",
      "desc": "Wind/Wasser/Tier/ballistisch (Frucht, Flughaar, Klette).",
      "soon": true
     },
     {
      "name": "Long-Distance / Sweepstakes / Rafting / Jump-Dispersal",
      "desc": "seltene Fern-Kolonisation.",
      "soon": true
     },
     {
      "name": "Trittstein-Konnektivität",
      "desc": "Insel-Hopping über Zwischen-Orte.",
      "soon": true
     },
     {
      "name": "Philopatrie / Sesshaftigkeit",
      "desc": "Heimkehr → lokale Anpassung (Lachs).",
      "soon": true
     },
     {
      "name": "Isolation-by-Distance / -Environment / -Resistance",
      "desc": "Differenzierung ~ Distanz/Umwelt.",
      "soon": true
     },
     {
      "name": "Spatial Sorting (Range-Edge)",
      "desc": "schnellste Ausbreiter sammeln sich an der Front (Aga-Kröten-Beine).",
      "soon": true
     },
     {
      "name": "Kompetition–Kolonisation-Trade-off",
      "desc": "guter Ausbreiter = schlechter Konkurrent → Koexistenz.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Isolation & physische Barrieren",
    "factors": [
     {
      "name": "Geografische Isolation",
      "desc": "Basis der allopatrischen Artbildung.",
      "soon": true
     },
     {
      "name": "Gebirge / Flüsse / Ozeane / Wüsten / Eisschilde als Barrieren",
      "desc": "teilen Areale.",
      "soon": true
     },
     {
      "name": "Vikarianz vs. Dispersal",
      "desc": "Barriere entsteht *durch* Areal vs. Überquerung.",
      "soon": true
     },
     {
      "name": "Landbrücken / Meeresspiegel / Orogenese / marine Barrieren",
      "desc": "verbinden/trennen.",
      "soon": true
     },
     {
      "name": "Edaphische Inseln (Serpentin, Karst)",
      "desc": "Substrat-Isolation → Endemiten.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Fragmentierung & Randeffekte",
    "factors": [
     {
      "name": "Habitat-Fragmentierung",
      "desc": "Zerstückelung → weniger Genfluss, mehr Inzucht.",
      "soon": true
     },
     {
      "name": "Randeffekt / Kern- vs. Rand-Arten",
      "desc": "Rand-Mikroklima; flächen-sensible Arten sterben zuerst.",
      "soon": true
     },
     {
      "name": "Extinktions-Schuld / Kolonisations-Kredit",
      "desc": "verzögerte Verluste/Gewinne.",
      "soon": true
     },
     {
      "name": "SLOSS-Debatte",
      "desc": "eine große vs. viele kleine Reserven.",
      "soon": true
     },
     {
      "name": "Matrix-Permeabilität / Korridore / Perkolations-Schwelle",
      "desc": "Bewegbarkeit dazwischen.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Gradienten, Range-Dynamik & Konnektivität",
    "factors": [
     {
      "name": "Cline / Ecotone / Umwelt-Gradient",
      "desc": "kontinuierlicher Merkmalswandel im Raum.",
      "soon": true
     },
     {
      "name": "Breiten-/Höhen-Diversitäts-Gradient",
      "desc": "Vielfalt peakt tropisch/mittel-elevation.",
      "soon": true
     },
     {
      "name": "Range-Expansion/-Kontraktion / -Limits / -Shift (Klima)",
      "desc": "Areale wandern (polwärts/aufwärts).",
      "soon": true
     },
     {
      "name": "Refugien (glazial/Mikro-)",
      "desc": "Überdauern + Wieder-Ausbreitung.",
      "soon": true
     },
     {
      "name": "Arten-Pumpe (glacial species pump)",
      "desc": "Zyklen aus Isolation+Reconnection erzeugen Arten.",
      "soon": true
     },
     {
      "name": "„Escalator to Extinction\"",
      "desc": "Berggipfel-Arten laufen oben aus dem Habitat.",
      "soon": true
     },
     {
      "name": "Landschafts-Konnektivität (strukturell vs. funktional)",
      "desc": "Least-Cost-Path, Circuit-Theory.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Realme, Endemismus, Neutraltheorie",
    "factors": [
     {
      "name": "Biogeografische Realme / Provinzialismus / Wallace-Linie",
      "desc": "tiefe Faunen-Grenzen.",
      "soon": true
     },
     {
      "name": "Endemismus (Paläo-/Neo-/kryptisch) / Hotspots",
      "desc": "regional einzigartige Formen.",
      "soon": true
     },
     {
      "name": "Neutraltheorie (Hubbell): Drift + Dispersal + Speziation",
      "desc": "Vielfalt ohne Nischen-Unterschiede.",
      "soon": true
     },
     {
      "name": "Distance-Decay / Nestedness / Checkerboard / Mid-Domain",
      "desc": "räumliche Verteilungs-Muster.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Biotische Interaktionen",
  "icon": "fang",
  "groups": [
   {
    "sub": "Interaktions-Matrix (Vorzeichen +/–/0)",
    "factors": [
     {
      "name": "Konkurrenz (–/–)",
      "desc": "intra-/interspezifisch, Ressourcen- vs. Interferenz, Scramble vs. Contest.",
      "soon": true
     },
     {
      "name": "Prädation / Herbivorie / Granivorie / Frugivorie (+/–)",
      "desc": "Konsum; frugivor↔Samenausbreitung.",
      "soon": true
     },
     {
      "name": "Parasitismus (+/–)",
      "desc": "Ekto-/Endo-, Mikro-/Makro-, Parasitoid, Brut-/Sozial-Parasit, Kastration.",
      "soon": true
     },
     {
      "name": "Mutualismus (+/+)",
      "desc": "obligat/fakultativ, Ressourcen-/Service-Tausch.",
      "soon": true
     },
     {
      "name": "Kommensalismus (+/0) / Amensalismus (–/0) / Neutralismus (0/0)",
      "desc": "Phoresie, Allelopathie.",
      "soon": true
     },
     {
      "name": "Apparente Konkurrenz",
      "desc": "indirekt über geteilten Räuber.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Symbiosen (Schlüssel-Innovationen)",
    "factors": [
     {
      "name": "Bestäubung / Samenausbreitung (Zoochorie)",
      "desc": "Ko-Diversifikations-Motor.",
      "soon": true
     },
     {
      "name": "Mykorrhiza / „Wood-Wide-Web\" / N-Fixierer",
      "desc": "Pflanzen-Pilz-/Bakterien-Tausch.",
      "soon": true
     },
     {
      "name": "Darm-Mikrobiom / Endosymbiose",
      "desc": "Verdauung; Ursprung von Mitochondrien/Chloroplasten.",
      "soon": true
     },
     {
      "name": "Koralle–Zooxanthellen / Flechte / Chemosynthese-Symbiose",
      "desc": "Photo/Chemo im Wirt.",
      "soon": true
     },
     {
      "name": "Reinigungs-Symbiose / Ameise–Pflanze / Pilz-Farming / Biolumineszenz-Symbiose",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Koevolution",
    "factors": [
     {
      "name": "Antagonistisch (Wettrüsten) / Red Queen",
      "desc": "Räuber-Beute, Wirt-Parasit; erhält Sex.",
      "soon": true
     },
     {
      "name": "Mutualistisch / diffus (Gilde) / Gen-für-Gen / geografisches Mosaik",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Escape-and-Radiate",
      "desc": "Abwehr-Innovation → Radiation (Pflanzen↔Schmetterlinge).",
      "soon": true
     },
     {
      "name": "Charakter-Verschiebung",
      "desc": "sympatrische Konkurrenten divergieren (Finken-Schnäbel).",
      "soon": true
     },
     {
      "name": "Kospeziation",
      "desc": "parallele Diversifikation von Partnern.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Nischen- & Konkurrenz-Theorie",
    "factors": [
     {
      "name": "Fundamentale vs. realisierte Nische",
      "desc": "Potenzial vs. nach Interaktion.",
      "soon": true
     },
     {
      "name": "Konkurrenz-Ausschluss (Gause) / Limiting Similarity",
      "desc": "max. Nischen-Überlappung.",
      "soon": true
     },
     {
      "name": "Nischen-Aufteilung / Charakter-Verschiebung / ökologische Freisetzung",
      "desc": "Koexistenz-Mechanik.",
      "soon": true
     },
     {
      "name": "Nischen-Konstruktion",
      "desc": "Organismen ändern ihre eigene Selektion (Biber, Korallen).",
      "soon": true
     },
     {
      "name": "R\\*-Theorie (Tilman) / Storage-Effekt / Neutraltheorie",
      "desc": "Koexistenz-Bedingungen.",
      "soon": true
     },
     {
      "name": "Frequenzabhängige Selektion (neg.)",
      "desc": "seltener Typ im Vorteil → Branching (s. Spike!).",
      "soon": true
     }
    ]
   },
   {
    "sub": "Community-Struktur & Nahrungsnetze",
    "factors": [
     {
      "name": "Nahrungsnetz / trophische Ebenen",
      "desc": "Produzent→Konsument→Zersetzer.",
      "soon": true
     },
     {
      "name": "Trophische Kaskade (top-down) / Bottom-up-Kontrolle",
      "desc": "Wolf→Elch→Weide.",
      "soon": true
     },
     {
      "name": "Keystone-Art / Ökosystem-Ingenieur / Foundation-Art",
      "desc": "überproportionaler Einfluss (Seeotter, Biber, Koralle).",
      "soon": true
     },
     {
      "name": "Janzen-Connell / Priority-Effekte / Nurse-Plants / Stress-Gradient",
      "desc": "Diversitäts-Erhalt.",
      "soon": true
     },
     {
      "name": "Mesopredator-Release / trophic downgrading",
      "desc": "Verlust der Spitze restrukturiert alles.",
      "soon": true
     },
     {
      "name": "Sukzession / Assembly-Rules / Metacommunity",
      "desc": "geordneter Community-Aufbau.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Populationsdynamik",
    "factors": [
     {
      "name": "Dichteabhängigkeit / Tragfähigkeit (K) / logistisches Wachstum",
      "desc": "Regulation.",
      "soon": true
     },
     {
      "name": "r/K-Selektion",
      "desc": "schnell-viel vs. langsam-konkurrenzstark.",
      "soon": true
     },
     {
      "name": "Allee-Effekt",
      "desc": "reduzierte Fitness bei geringer Dichte (Aussterbe-Beschleuniger).",
      "soon": true
     },
     {
      "name": "Räuber-Beute-Zyklen (Lotka-Volterra) / Funktionale Antwort (Typ I–III)",
      "desc": "Oszillationen.",
      "soon": true
     },
     {
      "name": "Boom-Bust / Paradox of Enrichment / Zeitverzögerungen",
      "desc": "Instabilität.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Verteidigungen & Mimikry",
    "factors": [
     {
      "name": "Tarnung (Crypsis/Hintergrund/disruptiv/Konterschattierung/Masquerade/Transparenz)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Aposematismus (Warnfarbe)",
      "desc": "signalisiert Wehrhaftigkeit.",
      "soon": true
     },
     {
      "name": "Mimikry (Batesian/Müllerian/Mertensian/aggressiv/Automimikry/Vavilov/Pouyann)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Physisch (Panzer/Stacheln/Schale/Dornen) / chemisch (Toxine/Sekundärmetabolite/Gift)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Toxin-Sequestrierung / induzierbare vs. konstitutive Abwehr / indirekte Abwehr (Enemy-Recruit)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Autotomie / Thanatose / Startle-Displays / Augenflecken",
      "desc": "Verhaltens-Abwehr.",
      "soon": true
     },
     {
      "name": "Gruppen-Abwehr: Prädator-Sättigung/Mast, Verdünnung, selfish herd, Confusion, Mobbing, Alarmruf",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Krankheit / Pathogen-Dynamik",
    "factors": [
     {
      "name": "Epidemien / SIR-Dynamik / R₀ / Herd-Immunität",
      "desc": "Ausbreitung durch Wirte.",
      "soon": true
     },
     {
      "name": "Virulenz-Evolution (Trade-off; Übertragungs-Modus)",
      "desc": "vertikal→mild, horizontal→virulent.",
      "soon": true
     },
     {
      "name": "Reproduktions-Parasiten (Wolbachia): CI / Male-Killing / Feminisierung / Parthenogenese",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Wirt-Manipulation (extended phenotype)",
      "desc": "„Zombie\"-Ameisen, Toxoplasma.",
      "soon": true
     },
     {
      "name": "MHC-Red-Queen / Verdünnungs-Effekt (Biodiversität↓Krankheit)",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Sexualselektions-Interaktionen (→ auch Ebene 6)",
    "factors": [
     {
      "name": "Intra- (Kampf) vs. inter-sexuell (Wahl)",
      "desc": "Waffen vs. Ornamente.",
      "soon": true
     },
     {
      "name": "Sexualkonflikt / Spermien-Konkurrenz / kryptische Weibchenwahl / Infantizid",
      "desc": ".",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Genom-Achsen",
  "icon": "dna",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Flügelfläche (Flug)",
      "desc": "✅ erledigt (AXIS-1).",
      "soon": true
     },
     {
      "name": "Aquatik / Stromlinie / Kiemen",
      "desc": "unterteilt Tiere in Land/Wasser; holt Fisch/Wal/Qualle. Empfohlen als Nächstes.",
      "soon": true
     },
     {
      "name": "Grabklauen (Graben)",
      "desc": "versucht, verworfen (orthogonal, s. Backlog).",
      "soon": true
     },
     {
      "name": "Thermische Toleranz-Breite",
      "desc": "Spezialist vs. Generalist (statt reinem Isolations-Optimum).",
      "soon": true
     },
     {
      "name": "Sinne (Sehen/Hören/Chemo/Elektro/Magneto)",
      "desc": "Sensorium; Basis für Tarnung/Signal.",
      "soon": true
     },
     {
      "name": "Färbung / Signal-Muster",
      "desc": "Tarnung ↔ Warnung ↔ Partnerwahl (ein „magic trait\").",
      "soon": true
     },
     {
      "name": "Toxin / Gift-Chemie",
      "desc": "Abwehr + Jagd; koppelt an Sequestrierung.",
      "soon": true
     },
     {
      "name": "Körper-Symmetrie / Bauplan-Achsen (Hox-artig)",
      "desc": "Segmentierung, Gliedmaßen-Zahl.",
      "soon": true
     },
     {
      "name": "Wärmeregulation (Endo-/Ektothermie)",
      "desc": "teuer, aber Aktivität bei Kälte.",
      "soon": true
     },
     {
      "name": "Fortpflanzungs-Modus als Gen",
      "desc": "sexuell/asexuell (s. Ebene 6).",
      "soon": true
     },
     {
      "name": "Ausbreitungs-Fähigkeit als Gen",
      "desc": "Vagilität (koppelt an Ebene 3.3).",
      "soon": true
     },
     {
      "name": "Sozialität / Koloniebildung",
      "desc": "Eusozialität, modulare Organismen.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Fortpflanzung & Lebensgeschichte",
  "icon": "egg",
  "groups": [
   {
    "sub": "Tempo & Zeitplan",
    "factors": [
     {
      "name": "r/K- bzw. schnell-langsam-Kontinuum",
      "desc": "Master-Slider (viele billige vs. wenige teure).",
      "soon": true
     },
     {
      "name": "Grimes C-S-R (Pflanzen)",
      "desc": "Konkurrent/Stress-Tolerator/Ruderal.",
      "soon": true
     },
     {
      "name": "Semelparie vs. Iteroparie",
      "desc": "ein Big-Bang vs. wiederholt.",
      "soon": true
     },
     {
      "name": "Generationszeit / Reifealter / reproduktive Seneszenz",
      "desc": "Lebens-Tempo.",
      "soon": true
     },
     {
      "name": "Kosten der Fortpflanzung / terminale Investition",
      "desc": "jetzt vs. später (disposable soma).",
      "soon": true
     },
     {
      "name": "Determiniertes vs. indeterminiertes Wachstum",
      "desc": "große alte Weibchen = fruchtbarer.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Nachkommen-Zahl, -Größe, -Pflege",
    "factors": [
     {
      "name": "Fekundität",
      "desc": "Sonnenfisch ~300 Mio. Eier vs. Hai wenige.",
      "soon": true
     },
     {
      "name": "Größe–Zahl-Trade-off (Smith-Fretwell) / Lack-Gelegegröße",
      "desc": "optimaler Wurf.",
      "soon": true
     },
     {
      "name": "Dotter-Provisionierung / Lecithotrophie vs. Matrotrophie (Plazenta)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Elterliche Investition (Trivers) / uni-/biparental / Allo-Parenting / kooperative Brut",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Vivipar/ovipar/ovovivipar / Brutparasitismus / Matriphagie",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Fortpflanzungs-Modi",
    "factors": [
     {
      "name": "Sexuell (Auskreuzung) vs. asexuell/klonal",
      "desc": "Rekombination vs. Kopie.",
      "soon": true
     },
     {
      "name": "Parthenogenese / Apomixis / Haplodiploidie / Gynogenese",
      "desc": "Sonder-Modi.",
      "soon": true
     },
     {
      "name": "Simultaner & sequenzieller Hermaphroditismus (Protandrie/-gynie)",
      "desc": "Sexwechsel.",
      "soon": true
     },
     {
      "name": "Selbstung / gemischte Paarung / Knospung/Fragmentierung / Polyembryonie",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Komplexe Lebenszyklen",
    "factors": [
     {
      "name": "Generationswechsel / Metagenese (Polyp↔Meduse)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Metamorphose (holo-/hemimetabol) / Larvenstadien",
      "desc": "Ausbreitungs-/Fress-Trennung.",
      "soon": true
     },
     {
      "name": "Mehrwirt-Parasiten-Zyklen",
      "desc": "Malaria: Mücke+Mensch.",
      "soon": true
     },
     {
      "name": "Paedomorphose/Neotenie / Progenese",
      "desc": "Jugendform bleibt (Axolotl).",
      "soon": true
     }
    ]
   },
   {
    "sub": "Dormanz & Bet-Hedging (Unsicherheits-Strategien)",
    "factors": [
     {
      "name": "Diapause / Quieszenz / Hibernation / Aestivation",
      "desc": "Ruhe-Zustände.",
      "soon": true
     },
     {
      "name": "Samen-/Ei-Banken (Dormanz-Propagulen)",
      "desc": "Zeit-Versicherung (Daphnien-Ephippien).",
      "soon": true
     },
     {
      "name": "Bet-Hedging (diversifiziert/konservativ)",
      "desc": "Fitness-Varianz senken (Wüsten-Keimung).",
      "soon": true
     },
     {
      "name": "Prädiktive vs. zufällige Plastizität",
      "desc": "Cue-gesteuert vs. Zufalls-Wette.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Ausbreitung & Bewegung (→ Ebene 3.3)",
    "factors": [
     {
      "name": "Ausbreitungs-Syndrom / Natal- vs. Brut-Dispersal / Philopatrie",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Migration (saisonal) / Nomadismus/Irruption / Diadromie / Teilzug",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Paarungssysteme & Sexualselektion (→ Ebene 4.9)",
    "factors": [
     {
      "name": "Monogamie / Polygynie (Ressourcen-/Harem-/Lek-) / Polyandrie / Promiskuität",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Anisogamie / Bateman / operationelles Geschlechterverhältnis",
      "desc": "Wurzel der Sex-Rollen.",
      "soon": true
     },
     {
      "name": "Ornamente (Wahl) vs. Waffen (Kampf) / Rensch-Regel / Nuptialgeschenke",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Wahl-Modelle: Fisher-Runaway, Good-Genes/Handicap, Sensory-Bias/-Drive, Hamilton-Zuk",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Sex-Determination (XY/ZW/Haplodiploid/TSD/ESD/sozial)",
      "desc": "inkl. Klimawandel-Skew.",
      "soon": true
     },
     {
      "name": "Fisher-1:1 / Local-Mate-Competition / Trivers-Willard",
      "desc": "Geschlechter-Allokation.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Evolutions-Mechanik",
  "icon": "tune",
  "groups": [
   {
    "sub": "Grundkräfte",
    "factors": [
     {
      "name": "Mutation (Quelle aller Variation)",
      "desc": "drin.",
      "soon": true
     },
     {
      "name": "Natürliche Selektion",
      "desc": "drin (Fitness-Gradient).",
      "soon": true
     },
     {
      "name": "Genetische Drift",
      "desc": "drin (Stochastik-Kanal); stark in kleinen Populationen.",
      "soon": true
     },
     {
      "name": "Genfluss / Migration",
      "desc": "zwischen Orten (Ebene 3.3).",
      "soon": true
     },
     {
      "name": "Rekombination (Sex) / nicht-zufällige Paarung",
      "desc": "mischt Allele.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Selektions-Typen (nach Wirkung)",
    "factors": [
     {
      "name": "Gerichtet / stabilisierend / disruptiv / Trunkierung",
      "desc": "Mittel verschieben/verengen/spalten.",
      "soon": true
     },
     {
      "name": "Purifizierend vs. positiv",
      "desc": "Konservierung vs. Ausbreitung.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Selektions-Typen (nach Kontext)",
    "factors": [
     {
      "name": "Balancierend / Heterozygoten-Vorteil",
      "desc": "erhält Polymorphismus (Sichelzelle).",
      "soon": true
     },
     {
      "name": "Frequenz-abhängig (neg./pos.) / dichte-abhängig",
      "desc": "→ Koexistenz/Branching.",
      "soon": true
     },
     {
      "name": "Fluktuierend (zeitlich) / räumlich variabel (lokale Anpassung)",
      "desc": "erhält Variation.",
      "soon": true
     },
     {
      "name": "Antagonistische Pleiotropie / sexuell antagonistisch",
      "desc": "Trade-off-getrieben.",
      "soon": true
     },
     {
      "name": "Sexuelle / Verwandten- (kin) / Gruppen- / künstliche Selektion",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Genetische Architektur",
    "factors": [
     {
      "name": "Dominanz / Über-/Unterdominanz / Pleiotropie / Epistasis (inkl. sign)",
      "desc": "Genotyp→Phänotyp.",
      "soon": true
     },
     {
      "name": "Polygenie / infinitesimal / G×E",
      "desc": "quantitative Merkmale, Umwelt-Interaktion.",
      "soon": true
     },
     {
      "name": "Kopplung / LD / Supergene / Modularität",
      "desc": "mit-vererbte Blöcke.",
      "soon": true
     },
     {
      "name": "Gen-Duplikation → Neo-/Subfunktionalisierung / Polyploidie / Inversionen",
      "desc": "Neuheits-Quelle, Pflanzen-Artbildung.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Vererbung jenseits der DNA",
    "factors": [
     {
      "name": "Epigenetik / Methylierung / transgenerational / Imprinting / Paramutation",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Maternale/zytoplasmatische Effekte / Prion-/Small-RNA-Vererbung",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Phänotypische Plastizität / Reaktionsnorm / Polyphänismus",
      "desc": "ein Genotyp, viele Phänotypen.",
      "soon": true
     },
     {
      "name": "Baldwin-Effekt / genetische Assimilation / Plasticity-first",
      "desc": "Lernen/Plastizität leitet Evolution.",
      "soon": true
     },
     {
      "name": "Nischen-Konstruktion / kulturelle / Holobiont-Vererbung",
      "desc": "nicht-genetische Kanäle.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Horizontaler Transfer & Fusionen",
    "factors": [
     {
      "name": "Horizontaler Gentransfer (HGT)",
      "desc": "Bakterien tauschen Gene (Resistenz-Plasmide).",
      "soon": true
     },
     {
      "name": "Introgression / adaptive Introgression",
      "desc": "Gene über Art-Grenzen (Neandertaler-EPAS1).",
      "soon": true
     },
     {
      "name": "Hybridisierung / Hybrid-Artbildung / Endosymbiose / Symbiogenese",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Selfish Genes & Kopplungs-Effekte",
    "factors": [
     {
      "name": "Transposons / meiotic drive / Segregations-Verzerrer / Gen-Drives / B-Chromosomen",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Hitchhiking/Sweeps (hart/weich) / Background-Selection / Hill-Robertson / clonal interference",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Muller's Ratchet / Y-Degeneration / Error-Catastrophe",
      "desc": "Verfall ohne Rekombination.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Robustheit & Evolvierbarkeit",
    "factors": [
     {
      "name": "Kanalisierung / kryptische Variation (Hsp90) / genetische Robustheit",
      "desc": "verborgenes Potenzial.",
      "soon": true
     },
     {
      "name": "Evolvierbarkeit / facilitated variation / neutrale Netze / effektive Populationsgröße (Nₑ)",
      "desc": ".",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Stochastik & Kontingenz",
  "icon": "waves",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Founder-Effekt",
      "desc": "wenige Kolonisten tragen unrepräsentative Gene.",
      "soon": true
     },
     {
      "name": "Flaschenhals (Bottleneck)",
      "desc": "Katastrophe → wenige Überlebende → Diversitäts-Verlust.",
      "soon": true
     },
     {
      "name": "Founder-Flush(-Takeover)-Speziation",
      "desc": "Bottleneck + Explosion → schnelle Divergenz (Hawaii-Drosophila).",
      "soon": true
     },
     {
      "name": "Serieller Founder-Effekt / Allele-Surfing",
      "desc": "Diversität sinkt entlang der Kolonisations-Route.",
      "soon": true
     },
     {
      "name": "Mutations-Ordnungs-Effekt",
      "desc": "gleiche Selektion, andere fixierte Mutation → Inkompatibilität.",
      "soon": true
     },
     {
      "name": "Historische Kontingenz / Potenzierung / Entrenchment",
      "desc": "„Band des Lebens neu abspielen\" (LTEE Cit⁺).",
      "soon": true
     },
     {
      "name": "Dollo-Irreversibilität",
      "desc": "komplexe verlorene Merkmale kehren nicht zurück.",
      "soon": true
     },
     {
      "name": "Evolutionäre Rettung (evolutionary rescue)",
      "desc": "schnelle Anpassung verhindert Aussterben.",
      "soon": true
     },
     {
      "name": "Genfluss-Swamping / Migrations-Last",
      "desc": "Zuwanderung überschwemmt lokale Anpassung → Range-Limit.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Makro-Muster",
  "icon": "globe",
  "groups": [
   {
    "sub": "Artbildungs-Modi (emergent aus Raum + Selektion)",
    "factors": [
     {
      "name": "Allopatrisch / peripatrisch / parapatrisch / sympatrisch / heteropatrisch",
      "desc": "je nach Isolations-Grad.",
      "soon": true
     },
     {
      "name": "Ökologische Speziation / „Magic-Trait\" / Sensory-Drive / Mutations-Ordnung",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Reproduktive Isolation (prä-: ökolog./zeitl./ethol./mechan./gametisch; post-: BDMI/Haldane/hybrid)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Reinforcement / Wallace-Effekt / Charakter-Verschiebung",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Hybridisierung: homoploid, allopolyploid, Introgression, Ringart, Hybridzone, Syngameon",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Despeziation / Speziations-Umkehr",
      "desc": "Isolation bricht zusammen (Victoria-Cichliden).",
      "soon": true
     }
    ]
   },
   {
    "sub": "Diversifikations- & Aussterbe-Muster",
    "factors": [
     {
      "name": "Adaptive vs. nicht-adaptive Radiation / ökologische Gelegenheit / Schlüssel-Innovation",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Ökologische Freisetzung / Insel-Syndrom (Zwerg-/Riesenwuchs, Flugverlust, Zahmheit)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Hintergrund- vs. Massen-Aussterben / Koaussterbe-Kaskade / Extinktions-Schuld",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Lilliput-/Lazarus-/Elvis-Taxon / Dead-Clade-Walking / Selektivität",
      "desc": "Aussterbe-Vokabular.",
      "soon": true
     }
    ]
   },
   {
    "sub": "Tempo, Trends & Konvergenz",
    "factors": [
     {
      "name": "Phyletischer Gradualismus vs. Punktualismus / Stasis / Quantum-Evolution",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Anagenese vs. Kladogenese / Mosaik-Evolution / Heterochronie / Rate-Variation",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Arten-Selektion / Court-Jester vs. Red-Queen / Turnover-Puls",
      "desc": "höhere Selektions-Ebenen.",
      "soon": true
     },
     {
      "name": "Cope-Regel / Dollo / Williston / evolutionäre Eskalation (Vermeij)",
      "desc": "Makro-Gesetze.",
      "soon": true
     },
     {
      "name": "Konvergenz / Parallelismus / Divergenz / iterative Evolution",
      "desc": "wiederholte Formen (Anolis-Ökomorphe).",
      "soon": true
     },
     {
      "name": "Lebende Fossilien / Stasis / evolutionäre Sackgassen (Überspezialisierung)",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Große Übergänge (Maynard Smith & Szathmáry)",
    "factors": [
     {
      "name": "Replikatoren→Chromosomen→DNA/Protein / Pro-→Eukaryot (Endosymbiose)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Ein- → Vielzeller / solitär → eusozial (Superorganismus) / Sprache/Kultur",
      "desc": ".",
      "soon": true
     }
    ]
   },
   {
    "sub": "Makroökologische Muster",
    "factors": [
     {
      "name": "Breiten-/Höhen-Diversitäts-Gradient (+ Hypothesen: Zeit-Areal/kinetisch/Out-of-Tropics)",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Arten-Areal / Rapoport / Bergmann / Allen",
      "desc": "geografische Regeln.",
      "soon": true
     },
     {
      "name": "Great American Interchange / Wallace-Linie",
      "desc": "biotischer Austausch.",
      "soon": true
     }
    ]
   }
  ]
 },
 {
  "cat": "Anthropogen / Moderne Ära",
  "icon": "flame",
  "groups": [
   {
    "sub": "",
    "factors": [
     {
      "name": "Domestikation / künstliche Zucht / Domestikations-Syndrom",
      "desc": "Zahmheit, Schlappohren (Belyaev-Füchse).",
      "soon": true
     },
     {
      "name": "Gentechnik / CRISPR / Gene-Drives / synthetische Biologie / De-Extinction",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Konservierung: genetische Rettung / assistierte Migration / assisted gene flow",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Ernte-induzierte Evolution",
      "desc": "Fischerei→kleiner/früher reif; Trophäenjagd→kleinere Waffen; Wilderei→Stoßzahn-Verlust.",
      "soon": true
     },
     {
      "name": "Resistenz-Evolution (Echtzeit)",
      "desc": "Antibiotika / Pestizide / Herbizide / Rodentizide / Impf-Druck.",
      "soon": true
     },
     {
      "name": "Habitat-Zerstörung & -Fragmentierung / Korridore / Straßen als Barrieren",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Verschmutzung als Selektion",
      "desc": "Industrie-Melanismus, Hormon-Disruptoren, Licht/Lärm/thermisch, Eutrophierung (→ Speziations-Umkehr).",
      "soon": true
     },
     {
      "name": "Klimawandel (anthropogen)",
      "desc": "Range-Shifts, phänologische Verschiebung/Mismatch, Hitze-Toleranz, TSD-Skew, Hybridisierung durch Range-Kollision (Pizzly-Bär).",
      "soon": true
     },
     {
      "name": "Invasive Arten / biotische Homogenisierung / Enemy-Release/EICA / Neuartige Ökosysteme",
      "desc": ".",
      "soon": true
     },
     {
      "name": "Urbanisierung / Urban-Evolution",
      "desc": "Hitzeinsel, Verhaltens-Zahmheit, U-Bahn-Mücke, weißer Klee ohne Cyanogenese.",
      "soon": true
     },
     {
      "name": "Defaunation / Trophic Downgrading / 6. Massenaussterben (HIREC)",
      "desc": "Extinktions-Filter (groß/langsam/spezialisiert zuerst).",
      "soon": true
     }
    ]
   }
  ]
 }
];
