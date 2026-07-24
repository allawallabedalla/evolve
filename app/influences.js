// Umwelt-Einflüsse — kuratiert aus docs/faktoren-katalog.md (Sektion 1 Ort-Parameter
// + Sektion 2 Welt-Events). Jeder Einfluss ändert die Umwelt DEINES aktuellen Wesens.
//
// `env`  → real umsetzbar mit der heutigen 6-Dimensionen-Engine (Temperatur, Räuber,
//          Nahrungsmenge, Höhe des Futters, Licht, Wasser). Die genannten Dimensionen
//          werden auf die Zielwerte (0..1) gesetzt, der Rest bleibt.
// `soon` → im Katalog vorhanden, aber jenseits der 6 Kern-Dimensionen (Wind, Druck, O₂,
//          Boden-Chemie …). Als „echte" neue Selektionsachse geplant (wie Flug/Aquatik),
//          heute noch nicht wirksam → im Browser sichtbar, aber „kommt bald".
// `tone` → Farbe des visuellen Effekts: "hit" (Katastrophe), "shift" (Klima), "bio" (mild).
window.INFLUENCES = [
  { cat: "Temperatur & Thermik", icon: "temp", factors: [
    { name: "Tropenhitze", desc: "Dauerhafte Wärme — Kälteschutz wird überflüssig, Überhitzung zur Gefahr.", tone: "shift", env: { temperature: 0.9 } },
    { name: "Polare Kälte", desc: "Dauerfrost — nur dichte Isolation UND hoher Stoffwechsel (Warmblüter) halten mit.", tone: "shift", env: { temperature: 0.06 } },
    { name: "Thermische Extreme", desc: "Hitze- und Frostspitzen: Letalgrenzen, seltene Killer-Events.", tone: "hit", env: { temperature: 0.96, foodAbundance: 0.3 } },
    { name: "Geothermie-Refugium", desc: "Lokale Wärmetasche (Quelle/Höhle) inmitten kalter Umgebung.", tone: "bio", env: { temperature: 0.62, water: 0.75, light: 0.2 } },
    { name: "Starke Tag-Nacht-Schwankung", desc: "Selektiert Toleranz-Breite statt eines festen Optimums.", soon: true },
    { name: "Saisonalität (Jahreszeiten)", desc: "Zyklischer Temperaturgang → Dormanz, Wanderung, Fellwechsel.", soon: true },
  ]},
  { cat: "Wasser & Feuchte", icon: "drop", factors: [
    { name: "Dauerregen & Feuchte", desc: "Reichlich Wasser — Grundlage für üppiges Pflanzenwachstum.", tone: "bio", env: { water: 0.92 } },
    { name: "Dürre", desc: "Das Wasser bricht weg — nur Sparsame und Speicher überstehen die Trockenheit.", tone: "hit", env: { water: 0.1, temperature: 0.82, foodAbundance: 0.3 } },
    { name: "Schneedecke", desc: "Kälte plus isolierender, wasserspeichernder subnivaler Raum.", tone: "shift", env: { temperature: 0.12, water: 0.5, light: 0.4 } },
    { name: "Monsun-Saisonalität", desc: "Regen- und Trockenzeit im Wechsel (Monsun, Mittelmeer-Klima).", soon: true },
    { name: "Küstennebel (Tau-Wasser)", desc: "Wasser aus der Luft statt aus Regen (Nebelwüsten).", soon: true },
  ]},
  { cat: "Licht & Strahlung", icon: "sun", factors: [
    { name: "Grelles Sonnenlicht", desc: "Volle Sonne — Photosynthese-Paradies, aber auch UV-Stress.", tone: "bio", env: { light: 0.96 } },
    { name: "Ewige Dunkelheit", desc: "Aphotisch (Tiefsee/Höhle): Photosynthese ist tot → Leuchten oder Blindheit.", tone: "shift", env: { light: 0.02 } },
    { name: "Photoperiode / Tageslänge", desc: "Jahreszeiten-Signal für Blüte, Brut und Vogelzug.", soon: true },
    { name: "Hohe UV-Strahlung", desc: "DNA-Schaden → Schutzpigmente (Hochgebirge, Ozonloch).", soon: true },
    { name: "Blaues Tiefwasser-Licht", desc: "Wasser filtert Rot heraus → Blau-Grün-Sehpigmente.", soon: true },
  ]},
  { cat: "Atmosphäre & Luft", icon: "wind", factors: [
    { name: "Sauerstoffreiche Luft (O₂)", desc: "Wie im Karbon (35 % O₂) → Rieseninsekten möglich.", soon: true },
    { name: "CO₂-Treibhaus", desc: "Treibhauswärme plus Photosynthese-Substrat.", soon: true },
    { name: "Dünne Höhenluft (Hypoxie)", desc: "Niedriger Luftdruck → Höhen-Anpassung (mehr Hämoglobin).", soon: true },
    { name: "Starker Wind", desc: "Krüppelwuchs am Boden; trägt Pollen und Samen weit.", soon: true },
    { name: "Wetter-Chaos", desc: "Unvorhersehbarkeit → opportunistische Strategien.", soon: true },
  ]},
  { cat: "Aquatik-Chemie & -Physik", icon: "waves", factors: [
    { name: "Trübes Wasser", desc: "Sediment schluckt das Licht — kann Artbildung sogar rückgängig machen.", tone: "shift", env: { water: 0.8, light: 0.15 } },
    { name: "Nährstoffreiches Wasser", desc: "Eutroph: Algenteich-Fülle statt klarem Karg-See.", tone: "bio", env: { water: 0.85, foodAbundance: 0.85 } },
    { name: "Salinität (Salzgehalt)", desc: "Süß, Brack, Meer oder hypersalin → Osmoregulation.", soon: true },
    { name: "Saures Wasser (pH)", desc: "Saure Moore oder alkalische Soda-Seen → chemischer Stress.", tone: "shift", env: { toxicity: 0.7, water: 0.85 } },
    { name: "Hoher Wasserdruck (Tiefsee)", desc: "Hydrostatischer Druck der Tiefe → Tiefsee-Anpassung.", soon: true },
    { name: "Starke Strömung & Gezeiten", desc: "Wellenenergie → Stromlinie, Haftorgane, Zonierung.", soon: true },
  ]},
  { cat: "Boden & Minerale", icon: "mineral", factors: [
    { name: "Nährstoffarmer Boden", desc: "P-arme Böden → magere Kost, fleischfressende Pflanzen.", tone: "shift", env: { foodAbundance: 0.2 } },
    { name: "Sand- & Lehmboden", desc: "Textur bestimmt Drainage und Wurzelzugang.", soon: true },
    { name: "Saurer oder Kalk-Boden (pH)", desc: "Sauer (Heide) gegenüber alkalisch (Kalk).", soon: true },
    { name: "Serpentin / Schwermetall", desc: "Giftige Metalle im Boden → nur Spezialisten mit Entgiftung überleben.", tone: "hit", env: { toxicity: 0.85, foodAbundance: 0.3 } },
    { name: "Fels & Karst", desc: "Hartes Substrat → Grab-, Kletter- und Haft-Baupläne.", soon: true },
    { name: "Staunässe (anoxisch)", desc: "Sauerstoffarmer Boden → Atemwurzeln (Mangrove).", soon: true },
  ]},
  { cat: "Terrain & Topologie", icon: "mountain", factors: [
    { name: "Hochgebirge", desc: "Gestapelte Klimabänder: kalt, karg, hell, dünne Luft.", tone: "shift", env: { temperature: 0.2, foodHeight: 0.15, light: 0.72, water: 0.4 } },
    { name: "Hohes Kronendach", desc: "Futter und Licht weit oben → Reichweite, Klettern, Flug.", tone: "bio", env: { foodHeight: 0.9, foodAbundance: 0.7 } },
    { name: "Höhlensystem", desc: "Dunkel und stabil → Troglobiten (Leuchten oder Blindheit).", tone: "shift", env: { light: 0.02, temperature: 0.45, water: 0.6 } },
    { name: "Raue, zerklüftete Landschaft", desc: "Mehr Nischen auf engem Raum → mehr Endemismus.", soon: true },
    { name: "Steilhang & Exposition", desc: "Sonnenhang gegenüber Schatthang.", soon: true },
  ]},
  { cat: "Energie & Extrem-Chemie", icon: "cell", factors: [
    { name: "Auftriebs-Reichtum", desc: "Nährstoffreiche Zone — Futter im Überfluss.", tone: "bio", env: { foodAbundance: 0.95 } },
    { name: "Karge Ödnis", desc: "Kaum Ressourcen — nur Sparsame halten durch.", tone: "hit", env: { foodAbundance: 0.12, water: 0.15 } },
    { name: "Ressourcen-Pulse (Mastjahre)", desc: "Feast-or-Famine → opportunistische Strategien.", soon: true },
    { name: "Chemosynthese-Quelle (Vent)", desc: "Energie aus Chemie statt Licht (Schwarze Raucher).", soon: true },
    { name: "Schwefel- & Säure-Extrem", desc: "H₂S, Säure oder Lauge → nur Extremophile mit Entgiftung.", tone: "hit", env: { toxicity: 0.92, water: 0.6, light: 0.3 } },
  ]},
  { cat: "Feuer & Planetares", icon: "flame", factors: [
    { name: "Feuer-Regime", desc: "Regelmäßige Brände → Rinde, Wiederaustrieb, Feuer-Keimer.", tone: "hit", env: { foodAbundance: 0.3, temperature: 0.72 } },
    { name: "Schwere Gravitation", desc: "Größenlimit an Land (im Wasser trägt der Auftrieb).", soon: true },
    { name: "Magnetfeld-Anomalie", desc: "Navigation über Magnetsinn (Magnetotaxis, Zugvögel).", soon: true },
  ]},
  { cat: "Katastrophen", icon: "meteor", factors: [
    { name: "Vulkanausbruch", desc: "Zerstört und schafft Habitat; Aschefall verdunkelt und kühlt.", tone: "hit", env: { temperature: 0.8, light: 0.25, foodAbundance: 0.3 } },
    { name: "Meteoriteneinschlag", desc: "Impakt-Winter: Sonne verdunkelt, Kälte, Hunger (K-Pg-Grenze).", tone: "hit", env: { light: 0.1, temperature: 0.25, foodAbundance: 0.2 } },
    { name: "Erdbeben & Tsunami", desc: "Terrain-Reset mit Flutwelle als Sekundär-Gefahr.", tone: "hit", env: { water: 0.75, foodAbundance: 0.4 } },
    { name: "Großbrand", desc: "Akute Massen-Mortalität; danach offene Lücken.", tone: "hit", env: { foodAbundance: 0.15, temperature: 0.78 } },
  ]},
  { cat: "Klima & Tiefzeit", icon: "snow", factors: [
    { name: "Eiszeit", desc: "Vereisung reorganisiert alles Leben (Pleistozän-Zyklen).", tone: "shift", env: { temperature: 0.06, foodAbundance: 0.35, water: 0.5 } },
    { name: "Warmzeit / Hyperthermal", desc: "Globale Wärme: Blüte und neue Lebensräume (PETM).", tone: "bio", env: { temperature: 0.88, foodAbundance: 0.8, water: 0.7 } },
    { name: "Große Flut (Meeresspiegel)", desc: "Land ertrinkt — aquatische Baupläne gewinnen.", tone: "shift", env: { water: 0.96, foodHeight: 0.1 } },
    { name: "Aridifizierung (Grasland)", desc: "Wälder weichen Grasland → Grasfresser, aufrechter Gang.", tone: "shift", env: { water: 0.35, foodHeight: 0.3, foodAbundance: 0.55, light: 0.78 } },
    { name: "Ozean-Anoxie", desc: "Marines Massensterben durch Sauerstoff-Kollaps.", soon: true },
  ]},
];
