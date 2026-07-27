// Generiert app/influences.js aus docs/faktoren-katalog.md — der Katalog bleibt die
// EINZIGE Quelle der Wahrheit. Jeder Faktor kommt mit seinem Erklärsatz in den
// geschachtelten Browser (Sektion -> Untergruppe -> Faktor). Die real umsetzbaren
// (Umwelt-)Faktoren bekommen aus EFFECTS einen echten Effekt auf die 6 Kern-Dimensionen
// (+ toxicity); alles andere ist ehrlich als „kommt bald" markiert (künftige Achsen/Ebenen).
//
// Aufruf:  node tools/build-influences.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(ROOT, "docs", "faktoren-katalog.md"), "utf-8");

// Geprüfte externe Zulieferungen (S4: Ebenen-Etikett statt vagem "kommt bald";
// P3: Klartextname + Erklärung für dieselben 218 inaktiven Faktoren). Beide sind
// mit tools/layer-import-check.mjs bzw. tools/plain-import-check.mjs abgesichert,
// bevor sie hier ankommen — falls eine Datei fehlt, läuft der Build unverändert
// weiter (Faktor bleibt bei "soon" ohne Ebene/Klartext, wie bisher).
function loadJsonIfExists(path) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return {}; }
}
const LAYERS = loadJsonIfExists(join(ROOT, "docs", "auslagerung", "S4-ausgabe.json"));
const PLAIN_INACTIVE = loadJsonIfExists(join(ROOT, "docs", "auslagerung", "P3-ausgabe.json"));

// Icon je Sektion (Nummer -> flaches Icon aus dem App-Icon-Set).
const SEC_ICON = {
  "1": "mountain", "2": "meteor", "3": "island", "4": "fang", "5": "dna",
  "6": "egg", "7": "tune", "8": "waves", "9": "globe", "10": "flame",
};

// Real umsetzbare Umwelt-Effekte, gekeyed nach dem EXAKTEN Faktor-Namen im Katalog.
// tone: "hit" (Katastrophe), "shift" (Klima/Milieu), "bio" (mild/günstig).
const EFFECTS = {
  // 1.1 Temperatur
  "Thermische Extreme (Hitze/Frost-Spitzen)": { tone: "hit", env: { temperature: 0.96, foodAbundance: 0.3 } },
  "Geothermie / Mikroklima-Refugien": { tone: "bio", env: { temperature: 0.62, water: 0.75, light: 0.2 } },
  // 1.2 Wasser
  "Niederschlag / Feuchte": { tone: "bio", env: { water: 0.92 } },
  "Schneedecke / subnivaler Raum": { tone: "shift", env: { temperature: 0.12, water: 0.5, light: 0.4 } },
  // 1.3 Licht
  "Lichtintensität": { tone: "shift", env: { light: 0.97, temperature: 0.74, water: 0.38, foodAbundance: 0.3, aridity: 0.3 } },   // volle Sonne = auch Hitze + Verdunstung; Licht allein verschiebt nichts (influence-check)
  "Photische vs. aphotische Zone": { tone: "shift", env: { light: 0.02, water: 0.98, pressure: 0.45, temperature: 0.3, foodAbundance: 0.35 } },   // lichtlose Wassersäule (nicht Höhle — influence-check fand die Dublette)
  // 1.4 Atmosphäre — AXIS-7 Hypoxie (dünne Höhenluft): oxygen<1 stresst hohen Stoffwechsel
  "Luftdruck / Höhe / Hypoxie": { tone: "shift", env: { oxygen: 0.12, temperature: 0.28, light: 0.8, foodAbundance: 0.45, water: 0.4 } },
  "UV-Strahlung": { tone: "hit", env: { uv: 0.9, light: 0.92 } },   // AXIS-10: DNA-Schaden -> Schutzpigment
  "Tiefe / hydrostatischer Druck": { tone: "shift", env: { pressure: 0.9, water: 0.98, light: 0.02, temperature: 0.28 } },   // AXIS-12: Tiefsee -> Druck-Toleranz
  // 1.5 Aquatik
  "pH / Säure": { tone: "shift", env: { toxicity: 0.7, water: 0.85 } },
  "Trübung / Sediment": { tone: "shift", env: { water: 0.8, light: 0.15 } },
  "Nährstoffstatus (oligo→eutroph)": { tone: "bio", env: { water: 0.85, foodAbundance: 0.85 } },
  "Gelöster Sauerstoff": { tone: "shift", env: { oxygen: 0.2, water: 0.92, temperature: 0.7 } },   // warmes, stehendes Wasser = O2-arm
  "Salinität + Salz-Gradienten": { tone: "shift", env: { salinity: 0.85, water: 0.9 } },   // AXIS-8: Salzsee/Brine/Ästuar -> Osmoregulation
  // 1.6 Boden
  "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)": { tone: "shift", env: { foodAbundance: 0.12 } },   // AXIS-19: karg -> N-Fixierung lohnt
  "Serpentin/Schwermetall-Toxizität": { tone: "hit", env: { toxicity: 0.85, foodAbundance: 0.3 } },
  "Boden-Sauerstoff (Staunässe/anoxisch)": { tone: "shift", env: { oxygen: 0.18, water: 0.95, foodAbundance: 0.5 } },   // Staunässe/Sumpf: anoxischer Boden
  // 1.7 Terrain
  "Höhengradient": { tone: "shift", env: { temperature: 0.2, foodHeight: 0.15, light: 0.72, water: 0.4 } },
  "Wind (Exposition + Ausbreitungs-Vektor)": { tone: "shift", env: { wind: 0.9, water: 0.35, temperature: 0.35 } },   // AXIS-18: Windhärte
  "Habitat-Struktur-Komplexität / Deckung": { tone: "bio", env: { foodHeight: 0.9, foodAbundance: 0.7 } },
  "Höhlen / unterirdischer Raum": { tone: "shift", env: { light: 0.02, temperature: 0.46, water: 0.55, foodAbundance: 0.22, oxygen: 0.82 } },   // Fels statt Wassersäule: konstant, nahrungsarm, schlecht belüftet
  // 1.8 Energie & Extrem-Chemie
  "Primärproduktivität / Ressourcen-Fülle": { tone: "bio", env: { foodAbundance: 0.95 } },
  "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)": { tone: "hit", env: { toxicity: 0.92, salinity: 0.7, water: 0.6, light: 0.3 } },
  "Natürliche Toxine / ionisierende Strahlung": { tone: "hit", env: { toxicity: 0.55, radiation: 0.9 } },   // AXIS-15: Radon/Uran-Boden -> Strahlungsresistenz
  // 1.9 Feuer
  "Feuer-Regime (Häufigkeit/Intensität/Saison)": { tone: "hit", env: { foodAbundance: 0.3, temperature: 0.72, fire: 0.9 } },   // AXIS-16: Pyrophyt
  // ---- S1: Sektion 1 vervollständigt (2026-07) ----------------------------
  // Nur Faktoren, die sich als echter UMWELT-ZUSTAND auf den 16 Achsen abbilden
  // lassen. Was Zyklen, eine fehlende Achse oder die Metapopulation braucht,
  // bekommt in S4 ein ehrliches Ebenen-Etikett statt eines Schein-Effekts.
  // 1.2 Wasser & Feuchte
  "Bodenfeuchte / Wasserspeicher": { tone: "shift", env: { water: 0.9, toxicity: 0.25, foodAbundance: 0.3, oxygen: 0.5, temperature: 0.42 } },   // Torf/Moor: hält Wasser, sauer, sauerstoffarm
  "Ariditäts-Index (Verdunstungs-Nachfrage)": { tone: "shift", env: { aridity: 0.7, water: 0.22, temperature: 0.68, foodAbundance: 0.42, light: 0.85 } },   // Wüstenrand: dauerhaft trocken (nicht die Dürre-Episode)
  "Nebel/Tau-Interzeption": { tone: "bio", env: { water: 0.72, aridity: 0.45, light: 0.35, temperature: 0.44, foodAbundance: 0.4 } },   // Küstennebel-Wüste: Wasser aus der Luft, wenig Licht
  // 1.3 Licht & Strahlung
  "Spektralqualität (Lichtfarbe)": { tone: "shift", env: { light: 0.33, water: 0.95, pressure: 0.22, temperature: 0.38, foodAbundance: 0.45 } },   // Tiefwasser filtert Rot -> blaugrünes Restlicht
  // 1.5 Aquatik
  "Strömung / Wellenenergie / Gezeiten": { tone: "shift", env: { water: 0.95, wind: 0.85, foodAbundance: 0.62, light: 0.72, temperature: 0.45 } },   // Brandungszone: nass UND mechanisch hart
  "Süß- vs. Meerwasser-Habitatklasse": { tone: "shift", env: { salinity: 0.45, water: 0.92, foodAbundance: 0.7, light: 0.55 } },   // Ästuar: Brackwasser, nährstoffreich
  "Wasser-Permanenz (Hydroperiode)": { tone: "hit", env: { water: 0.42, aridity: 0.62, temperature: 0.72, foodAbundance: 0.5 } },   // austrocknender Tümpel
  // 1.6 Boden & Substrat
  "Bodentyp / Textur": { tone: "shift", env: { water: 0.2, foodAbundance: 0.32, light: 0.8, temperature: 0.6, aridity: 0.35 } },   // Sandboden: Wasser versickert sofort
  "Boden-pH & -Chemie": { tone: "shift", env: { toxicity: 0.4, foodAbundance: 0.28, water: 0.55, light: 0.7 } },   // saurer Heide-/Moorboden: Nährstoffe schlecht verfügbar
  "Fels/Sand/Karst als Substrat": { tone: "shift", env: { foodAbundance: 0.1, water: 0.25, light: 0.88, temperature: 0.55, wind: 0.4 } },   // nackter Fels: die Flechten-Nische
  // 1.7 Terrain
  "Hangneigung & Exposition": { tone: "shift", env: { light: 0.25, temperature: 0.32, water: 0.78, foodAbundance: 0.5 } },   // Schatt-Nordhang: kühl, feucht, dämmrig
  // 1.8 Energie & Extrem-Chemie
  "Chemische Gradienten (Redox/Chemokline)": { tone: "shift", env: { oxygen: 0.35, toxicity: 0.35, water: 0.9, light: 0.45, foodAbundance: 0.62 } },   // Grenzschicht: halb sauerstofffrei, chemisch reich
  "Energiequelle: photo- vs. chemosynthetisch": { tone: "shift", env: { light: 0, toxicity: 0.6, pressure: 0.85, temperature: 0.78, water: 1, foodAbundance: 0.55 } },   // Hydrothermalquelle: heiß, finster, giftig, tief
  // ---- S1b: Räuberdruck erreichbar machen (2026-07) -----------------------
  // Der Prüfstand meldete: die Achse `predation` — einer der sechs Kern-Regler —
  // wurde von KEINEM der 284 Faktoren benutzt, weil Räuberdruck in Sektion 4 steckt.
  // Diese sechs sind ehrlich abbildbar: die Engine modelliert Prädation ohnehin als
  // UMWELTDRUCK auf die eigene Linie, nicht als zweite Population (das ist die
  // Lebende Welt). Alles, was echte Nachbar-Arten braucht, bleibt ausdrücklich offen.
  "Prädation / Herbivorie / Granivorie / Frugivorie (+/–)": { tone: "hit", env: {"predation": 0.92, "foodAbundance": 0.55} },
  "Konkurrenz (–/–)": { tone: "shift", env: {"foodAbundance": 0.16, "predation": 0.35, "foodHeight": 0.45} },
  "Nischen-Aufteilung / Charakter-Verschiebung / ökologische Freisetzung": { tone: "bio", env: {"foodAbundance": 0.88, "predation": 0.04, "foodHeight": 0.35} },
  "Mesopredator-Release / trophic downgrading": { tone: "hit", env: {"predation": 0.76, "foodAbundance": 0.62, "foodHeight": 0.3} },
  "Trophische Kaskade (top-down) / Bottom-up-Kontrolle": { tone: "shift", env: {"predation": 0.85, "foodAbundance": 0.8, "light": 0.6} },
  "Keystone-Art / Ökosystem-Ingenieur / Foundation-Art": { tone: "bio", env: {"water": 0.9, "foodAbundance": 0.72, "foodHeight": 0.15, "light": 0.55} },
  // ---- S2: Sektion 2, soweit als Umwelt-ZUSTAND darstellbar (2026-07) -----
  // Von 17 offenen sind fünf ehrlich abbildbar. Der Rest braucht eine Zeitachse
  // (Zyklen, Störungs-Regime, Stochastik), gehört in die Lebende Welt (Tektonik,
  // Landbrücken) oder ist schon durch Einzel-Faktoren abgedeckt (Auslöser-Bündel,
  // freie Nischen nach dem Aussterben). Etikett dafür in S4.
  "Störung (disturbance)": { tone: "shift", env: {"foodAbundance": 0.3, "light": 0.88, "foodHeight": 0.12, "predation": 0.12, "water": 0.5} },
  "Waldbrand / Flut / Dürre / Sturm / Hitzewelle / Eissturm": { tone: "hit", env: {"temperature": 0.08, "frost": 0.85, "wind": 0.9, "foodAbundance": 0.2, "water": 0.4} },
  "Supernova / Gammablitz (hypothetisch)": { tone: "hit", env: {"uv": 0.95, "radiation": 0.7, "light": 0.8, "foodAbundance": 0.35, "temperature": 0.45} },
  "Sonnen-Variabilität / Weltraumwetter": { tone: "shift", env: {"light": 0.38, "temperature": 0.26, "water": 0.55, "foodAbundance": 0.4} },
  'Die „Big Five“': { tone: "hit", env: {"temperature": 0.93, "aridity": 0.55, "foodAbundance": 0.1, "oxygen": 0.3, "toxicity": 0.45, "light": 0.4, "water": 0.25} },
  // ---- S3: Sektion 10, Mensch & moderne Welt (2026-07) --------------------
  // Sieben von elf sind echte Umwelt-ZUSTÄNDE. Nicht abbildbar bleiben:
  // Domestikation (braucht Zuchtwahl statt Umweltdruck), Gentechnik (greift ins
  // Genom, nicht in die Umwelt), genetische Rettung (Genfluss = Lebende Welt) und
  // ernte-induzierte Evolution (bräuchte GRÖSSENSELEKTIVE Prädation — unsere
  // predation-Achse trifft alle gleich). Etikett dafür in S4.
  "Resistenz-Evolution (Echtzeit)": { tone: "hit", env: {"toxicity": 0.75, "foodAbundance": 0.75, "light": 0.72, "water": 0.5, "predation": 0.1} },
  "Habitat-Zerstörung & -Fragmentierung / Korridore / Straßen als Barrieren": { tone: "hit", env: {"foodAbundance": 0.15, "foodHeight": 0.05, "light": 0.9, "water": 0.3, "predation": 0.55, "temperature": 0.62} },
  "Verschmutzung als Selektion": { tone: "shift", env: {"toxicity": 0.45, "oxygen": 0.35, "water": 0.85, "foodAbundance": 0.85, "light": 0.4} },
  "Klimawandel (anthropogen)": { tone: "shift", env: {"temperature": 0.82, "water": 0.45, "aridity": 0.4, "foodAbundance": 0.5, "light": 0.7} },
  "Invasive Arten / biotische Homogenisierung / Enemy-Release/EICA / Neuartige Ökosysteme": { tone: "hit", env: {"predation": 0.8, "foodAbundance": 0.3, "foodHeight": 0.4, "light": 0.6} },
  "Urbanisierung / Urban-Evolution": { tone: "shift", env: {"temperature": 0.72, "light": 0.75, "foodAbundance": 0.65, "water": 0.3, "predation": 0.12, "toxicity": 0.3, "wind": 0.3} },
  "Defaunation / Trophic Downgrading / 6. Massenaussterben (HIREC)": { tone: "shift", env: {"predation": 0.05, "foodAbundance": 0.4, "foodHeight": 0.5, "light": 0.6, "water": 0.55} },
  // 2.2 Geophysikalisch
  "Vulkanausbruch / Flutbasalt (LIP)": { tone: "hit", env: { temperature: 0.8, light: 0.25, foodAbundance: 0.3 } },
  "Vulkanwinter / Aschefall": { tone: "hit", env: { light: 0.15, temperature: 0.25, foodAbundance: 0.35 } },
  "Erdbeben / Tsunami / Hangrutsch": { tone: "hit", env: { water: 0.75, foodAbundance: 0.4 } },
  // 2.3 Klima-Puls
  "Dürre als Selektions-Episode": { tone: "hit", env: { water: 0.1, temperature: 0.82, foodAbundance: 0.3, aridity: 0.9 } },   // AXIS-14: Austrocknung
  // 2.4 Langzeit-Klima
  "Eiszeit / Interglazial / abrupter Klimawechsel": { tone: "shift", env: { temperature: 0.06, foodAbundance: 0.35, water: 0.5, frost: 0.9 } },   // AXIS-17: Frost -> Kryoprotektion
  "Hyperthermal (PETM) / Schneeball-Erde": { tone: "bio", env: { temperature: 0.88, foodAbundance: 0.8, water: 0.7 } },
  "Meeresspiegel-Änderung (Transgression/Regression)": { tone: "shift", env: { water: 0.96, foodHeight: 0.1 } },
  "Aridifizierung / Grasland-Ausbreitung": { tone: "shift", env: { water: 0.35, foodHeight: 0.3, foodAbundance: 0.55, light: 0.78 } },
  "Ozean-Anoxie / -Versauerung / Euxinie": { tone: "hit", env: { oxygen: 0.08, toxicity: 0.6, water: 0.98, light: 0.25 } },   // AXIS-7×6: anoxisch + H2S-giftig
  // 2.5 Kosmisch
  "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter": { tone: "hit", env: { light: 0.1, temperature: 0.25, foodAbundance: 0.2 } },
};

// Klartext-Anzeigenamen (Usability-Audit): der Fachbegriff bleibt als Untertitel,
// aber der fette Titel ist laienverständlich. Nur für die AKTIVEN Faktoren nötig —
// die grauen „kommt bald" behalten den Katalognamen.
const PLAIN = {
  "Thermische Extreme (Hitze/Frost-Spitzen)": "Hitze- & Frost-Spitzen",
  "Geothermie / Mikroklima-Refugien": "Warme Erdwärme-Zuflucht",
  "Niederschlag / Feuchte": "Viel Regen & Feuchte",
  "Schneedecke / subnivaler Raum": "Schnee & Leben darunter",
  "Lichtintensität": "Grelles Sonnenlicht",
  "Photische vs. aphotische Zone": "Lichtlose Tiefe (Dunkelheit)",
  "Luftdruck / Höhe / Hypoxie": "Dünne Höhenluft",
  "UV-Strahlung": "Starke UV-Strahlung",
  "pH / Säure": "Saures Wasser",
  "Trübung / Sediment": "Trübes, schlammiges Wasser",
  "Nährstoffstatus (oligo→eutroph)": "Nährstoffreiches Wasser",
  "Gelöster Sauerstoff": "Sauerstoffarmes Wasser",
  "Salinität + Salz-Gradienten": "Salziges Wasser",
  "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)": "Karger, nährstoffarmer Boden",
  "Serpentin/Schwermetall-Toxizität": "Giftiger Schwermetall-Boden",
  "Boden-Sauerstoff (Staunässe/anoxisch)": "Staunässe / Sumpfboden",
  "Höhengradient": "Gebirgs-Höhenlage",
  "Wind (Exposition + Ausbreitungs-Vektor)": "Dauerwind & Sturm",
  "Habitat-Struktur-Komplexität / Deckung": "Dichtes Versteck-Gestrüpp",
  "Höhlen / unterirdischer Raum": "Dunkle Höhle",
  "Primärproduktivität / Ressourcen-Fülle": "Nahrungs-Überfluss",
  "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)": "Extremchemie (Schwefel, Salz, Säure)",
  "Natürliche Toxine / ionisierende Strahlung": "Gift & radioaktive Strahlung",
  "Feuer-Regime (Häufigkeit/Intensität/Saison)": "Häufige Brände",
  "Bodenfeuchte / Wasserspeicher": "Moorboden (hält Wasser)",
  "Ariditäts-Index (Verdunstungs-Nachfrage)": "Wüstenrand (dauerhaft trocken)",
  "Nebel/Tau-Interzeption": "Nebelwüste (Wasser aus der Luft)",
  "Spektralqualität (Lichtfarbe)": "Blaugrünes Tiefwasser-Licht",
  "Strömung / Wellenenergie / Gezeiten": "Brandungszone (Wellen & Gezeiten)",
  "Süß- vs. Meerwasser-Habitatklasse": "Brackwasser-Ästuar",
  "Wasser-Permanenz (Hydroperiode)": "Austrocknender Tümpel",
  "Bodentyp / Textur": "Sandboden (Wasser versickert)",
  "Boden-pH & -Chemie": "Saurer Heideboden",
  "Fels/Sand/Karst als Substrat": "Nackter Fels",
  "Hangneigung & Exposition": "Schattiger Nordhang",
  "Chemische Gradienten (Redox/Chemokline)": "Chemische Grenzschicht",
  "Energiequelle: photo- vs. chemosynthetisch": "Heiße Tiefsee-Quelle",
  "Prädation / Herbivorie / Granivorie / Frugivorie (+/–)": "Räuber tauchen auf",
  "Konkurrenz (–/–)": "Konkurrenz um Nahrung",
  "Nischen-Aufteilung / Charakter-Verschiebung / ökologische Freisetzung": "Freie Nische (keine Rivalen)",
  "Mesopredator-Release / trophic downgrading": "Kleinräuber-Schwemme",
  "Trophische Kaskade (top-down) / Bottom-up-Kontrolle": "Räuber steuern alles (Top-down)",
  "Keystone-Art / Ökosystem-Ingenieur / Foundation-Art": "Ökosystem-Ingenieur (Biber staut)",
  "Störung (disturbance)": "Lücke im Bestand (Störung)",
  "Waldbrand / Flut / Dürre / Sturm / Hitzewelle / Eissturm": "Eissturm (Frost & Sturm)",
  "Supernova / Gammablitz (hypothetisch)": "Gammablitz (Ozonschicht weg)",
  "Sonnen-Variabilität / Weltraumwetter": "Schwache Sonnenphase",
  'Die „Big Five“': "Das Große Sterben (Perm)",
  "Resistenz-Evolution (Echtzeit)": "Pestizid-Einsatz (Resistenz-Druck)",
  "Habitat-Zerstörung & -Fragmentierung / Korridore / Straßen als Barrieren": "Lebensraum-Verlust",
  "Verschmutzung als Selektion": "Verschmutzung & Überdüngung",
  "Klimawandel (anthropogen)": "Menschgemachte Erwärmung",
  "Invasive Arten / biotische Homogenisierung / Enemy-Release/EICA / Neuartige Ökosysteme": "Eingeschleppte Art (neuer Rivale)",
  "Urbanisierung / Urban-Evolution": "Stadt (Hitzeinsel & Nachtlicht)",
  "Defaunation / Trophic Downgrading / 6. Massenaussterben (HIREC)": "Entleerte Tierwelt",
  "Vulkanausbruch / Flutbasalt (LIP)": "Vulkanausbruch",
  "Vulkanwinter / Aschefall": "Vulkanwinter (Aschehimmel)",
  "Erdbeben / Tsunami / Hangrutsch": "Erdbeben & Flutwelle",
  "Dürre als Selektions-Episode": "Lange Dürre",
  "Eiszeit / Interglazial / abrupter Klimawechsel": "Eiszeit",
  "Hyperthermal (PETM) / Schneeball-Erde": "Extreme Warmzeit",
  "Meeresspiegel-Änderung (Transgression/Regression)": "Steigender Meeresspiegel",
  "Aridifizierung / Grasland-Ausbreitung": "Versteppung (Grasland breitet sich aus)",
  "Tiefe / hydrostatischer Druck": "Tiefsee-Druck",
  "Ozean-Anoxie / -Versauerung / Euxinie": "Sauerstofftotes, giftiges Meer",
  "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter": "Asteroiden-Einschlag",
};
// Klartext-Kategorienamen (Schlüssel = Title-Case-Ergebnis des Parsers).
const CAT_PLAIN = {
  "Ort-Parameter": "Ort & Klima",
  "Welt-Events": "Katastrophen & Welt-Ereignisse",
  "Raum, Isolation & Biogeografie": "Raum & Isolation",
  "Biotische Interaktionen": "Leben mit anderen Arten",
  "Genom-Achsen": "Körper & Gene",
  "Fortpflanzung & Lebensgeschichte": "Fortpflanzung & Lebensweg",
  "Evolutions-Mechanik": "Wie Evolution läuft",
  "Stochastik & Kontingenz": "Zufall & Schicksal",
  "Makro-Muster": "Große Muster der Vielfalt",
  "Anthropogen / Moderne Ära": "Mensch & moderne Welt",
};

// ---- Parser ----
const SKIP_HEAD = /^(Wie man liest|Priorisierung|Quellen)/;
const sections = [];
let sec = null, group = null;

const stripInline = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").trim();

for (const raw of md.split("\n")) {
  const line = raw.replace(/\s+$/, "");
  let m;
  if ((m = line.match(/^##\s+(\d+)\.\s+\S*\s*(.+)$/))) {
    // Sektion: "## 1. 🏝️ ORT-PARAMETER — ..."
    const num = m[1];
    const raw = m[2].replace(/\s+—.*$/, "").trim();
    // ALL-CAPS-Titel des Katalogs in lesbares Title-Case wandeln.
    const title = raw.toLowerCase().replace(/(^|[\s\-,&/])([a-zäöü])/g, (_, p, c) => p + c.toUpperCase());
    sec = { cat: title, plain: CAT_PLAIN[title] || title, icon: SEC_ICON[num] || "globe", groups: [] };
    sections.push(sec);
    group = { sub: "", factors: [] };
    sec.groups.push(group);
    continue;
  }
  if (/^##\s/.test(line)) { if (SKIP_HEAD.test(line.replace(/^##\s+/, ""))) sec = null; continue; }
  if (!sec) continue;
  if ((m = line.match(/^###\s+[\d.]+\s+(.+)$/))) {
    group = { sub: stripInline(m[1]), factors: [] };
    sec.groups.push(group);
    continue;
  }
  if ((m = line.match(/^-\s+\*\*(.+?)\*\*(.*)$/))) {
    const name = stripInline(m[1]);
    let rest = m[2].replace(/^\s*[—-]\s*/, "").trim();
    const tag = (rest.match(/\[([HZP][^\]]*)\]\s*$/) || [])[1] || "";
    rest = rest.replace(/\s*\[[HZP][^\]]*\]\s*$/, "").trim();
    const desc = stripInline(rest) || "—";
    const eff = EFFECTS[name];
    const f = { name, desc };
    if (PLAIN[name]) f.plain = PLAIN[name];
    if (eff) {
      f.env = eff.env; f.tone = eff.tone;
    } else {
      f.soon = true;
      // Ehrliche Einordnung statt vagem "kommt bald": WER ist zuständig, und warum.
      const layer = LAYERS[name];
      if (layer && layer.layer) { f.layer = layer.layer; f.layerGrund = layer.grund; }
      // Klartextname + verständliche Erklärung, auch für inaktive Faktoren — sonst
      // zeigt das Modal 218× nur den nackten Fachbegriff.
      const plain = PLAIN_INACTIVE[name];
      if (plain && plain.klartext) { f.plain = plain.klartext; f.desc = plain.erklaerung || desc; }
    }
    group.factors.push(f);
  }
}

// Leere Default-Gruppen (ohne Faktoren) verwerfen; Sektionen ohne Faktoren droppen.
for (const s of sections) s.groups = s.groups.filter((g) => g.factors.length);
const out = sections.filter((s) => s.groups.length);

const realCount = out.flatMap((s) => s.groups).flatMap((g) => g.factors).filter((f) => !f.soon).length;
const total = out.flatMap((s) => s.groups).flatMap((g) => g.factors).length;

const body =
  "// AUTO-GENERIERT von tools/build-influences.mjs aus docs/faktoren-katalog.md.\n" +
  "// Nicht von Hand editieren — Effekte in tools/build-influences.mjs (EFFECTS) pflegen,\n" +
  "// dann neu generieren: node tools/build-influences.mjs\n" +
  "// `env` = real umsetzbar (6 Kern-Dimensionen + toxicity). `soon` = im Katalog, aber als\n" +
  "// echte Selektionsachse/Ebene noch in Arbeit. `tone` = Effekt-Farbe (hit/shift/bio).\n" +
  "window.INFLUENCES = " + JSON.stringify(out, null, 1) + ";\n";
writeFileSync(join(ROOT, "app", "influences.js"), body);

// Report: welche EFFECTS-Keys nicht im Katalog gefunden wurden (Tippfehler-Schutz).
const names = new Set(out.flatMap((s) => s.groups).flatMap((g) => g.factors).map((f) => f.name));
const unmatched = Object.keys(EFFECTS).filter((k) => !names.has(k));
console.log(`influences.js: ${out.length} Sektionen, ${total} Faktoren (${realCount} real, ${total - realCount} kommt-bald).`);
if (unmatched.length) console.log("  ⚠ EFFECTS ohne Katalog-Treffer:\n   - " + unmatched.join("\n   - "));

const inactive = out.flatMap((s) => s.groups).flatMap((g) => g.factors).filter((f) => f.soon);
const withLayer = inactive.filter((f) => f.layer).length;
const withPlain = inactive.filter((f) => f.plain).length;
console.log(`  Ehrliche Einordnung: ${withLayer}/${inactive.length} mit Ebenen-Etikett, ${withPlain}/${inactive.length} mit Klartextname.`);
const layerNamesFound = new Set(Object.keys(LAYERS));
const plainNamesFound = new Set(Object.keys(PLAIN_INACTIVE));
const unmatchedLayer = [...layerNamesFound].filter((k) => !names.has(k));
const unmatchedPlain = [...plainNamesFound].filter((k) => !names.has(k));
if (unmatchedLayer.length) console.log("  ⚠ S4-ausgabe.json ohne Katalog-Treffer:\n   - " + unmatchedLayer.join("\n   - "));
if (unmatchedPlain.length) console.log("  ⚠ P3-ausgabe.json ohne Katalog-Treffer:\n   - " + unmatchedPlain.join("\n   - "));
