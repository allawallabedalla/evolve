// Merkmalsquellen anbinden (BACKLOG Punkt 12, Schritt 1.1b — docs/artenkatalog-plan.md).
//
// Wikidata traegt fast keine Merkmale (gemessen, Plan Abschnitt 5a: Masse bei Saeugern
// 6%, bei Voegeln 36%). Dieses Skript verknuepft zwei OFFENE, individuell zitierbare
// Fachdatensaetze ueber den binomischen Namen (Gattung+Art) mit den geernteten Taxa:
//
//   PanTHERIA      Jones et al. 2009, Ecology 90:2648 (doi 10.1890/08-1494.1)
//                  5510 Saeugetier-Arten, unter anderem AdultBodyMass_g.
//   EltonTraits    Wilman et al. 2014, Ecology 95:2027 (doi 10.1890/13-1917.1)
//                  5494 Saeugetier- + 10009 Vogel-Arten, Ernaehrungs-/Aktivitaetsprofil.
//
// Bezug: GitHub-Spiegel `RS-eco/traitdata` (github.com/RS-eco/traitdata) — die
// Originalquellen (Figshare/Dryad) sind aus dieser Umgebung nicht erreichbar (nur
// Wikidata/Wikipedia wurden freigeschaltet, s. Plan Abschnitt 8). raw.githubusercontent.com
// ist Teil der Standard-Trusted-Liste, also OHNE weitere Freischaltung nutzbar.
//
// LIZENZ-HINWEIS (ehrlich, nicht abschliessend geklärt): das R-Paket selbst steht unter
// GPL-3 — irrelevant, wir nutzen keine Paket-Code, nur die Rohdaten. Die zugrunde
// liegenden Datenpapiere (PanTHERIA in Ecological Archives, EltonTraits in Ecology)
// unterliegen der Datenveroeffentlichungs-Policy ihrer Journale (i.d.R. freie
// Wiederverwendung mit Zitierpflicht). VOR einem Produktions-Einsatz: pro Datensatz die
// Lizenz am Originalort (Ecological Archives / Figshare-Datensatzseite) einzeln
// bestaetigen — das ist hier NICHT geschehen, weil diese Seiten aus der Umgebung nicht
// erreichbar waren (s. o.). Dieses Skript ist ein Prototyp, kein produktionsreifer Import.
//
// NICHT angebunden (gemessen, nicht geraten): AmphiBIO, fishmorph, lizard_traits liegen
// im selben Spiegel vor, aber ihre .rda-Dateien enthalten Freitext-Zitationsspalten mit
// Nicht-UTF-8-Bytes (Windows-1252 Sonderzeichen in Autorennamen), an denen sowohl
// `pyreadr` als auch `rdata` (Python) scheitern — kein R-Interpreter in dieser Umgebung
// verfuegbar, um die Original-RDS-Serialisierung sauber zu lesen. Offener Rest fuer eine
// Umgebung mit R oder eine gezielte Spalten-Vorfilterung auf Byte-Ebene.
//
// Aufruf:  node tools/build-traits.mjs
//   Erwartet vorbereitete CSV-Exporte in tools/.traits-cache/ (s. build-traits-fetch.py) —
//   die eigentliche .rda->CSV-Konvertierung laeuft in Python (pyreadr), dieses Skript
//   macht nur die Verknuepfung + den Bericht (damit die Kette bis hierhin in Node bleibt,
//   analog zu build-catalog.mjs).

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, "tools", ".traits-cache");
const HARVEST = join(ROOT, "tools", ".harvest-state.json");

function parseCsv(path) {
  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    // Einfache CSV-Zerlegung (keine eingebetteten Kommas in Anfuehrungszeichen in den
    // hier genutzten Spalten) — ausreichend fuer die numerischen/binomischen Felder.
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => (row[h.trim()] = cells[i]?.trim()));
    return row;
  });
}

const key = (genus, species) => `${genus} ${species}`.toLowerCase().trim();

function loadTraitSource(file, genusCol, speciesCol, fields) {
  const p = join(CACHE, file);
  if (!existsSync(p)) return null;
  const rows = parseCsv(p);
  const byKey = {};
  for (const r of rows) {
    const g = r[genusCol], s = r[speciesCol];
    if (!g || !s || g === "NA" || s === "NA") continue;
    const rec = {};
    for (const [col, name] of Object.entries(fields)) {
      const v = r[col];
      if (v !== undefined && v !== "NA" && v !== "") rec[name] = v;
    }
    if (Object.keys(rec).length) byKey[key(g, s)] = rec;
  }
  return byKey;
}

const pantheria = loadTraitSource("pantheria.csv", "Genus", "Species",
  { AdultBodyMass_g: "massG" });
const eltonMammals = loadTraitSource("elton_mammals.csv", "Genus", "Species",
  { "Diet.Vend": "dietVertEndo", "Diet.Vect": "dietVertEcto", "Diet.Inv": "dietInvert",
    "Diet.PlantO": "dietPlant", "Activity.Nocturnal": "nocturnal" });
const eltonBirds = loadTraitSource("elton_birds.csv", "Genus", "Species",
  { "Diet.Inv": "dietInvert", "Diet.Vend": "dietVertEndo", "Diet.PlantO": "dietPlant",
    "ForStrat.watbelowsurf": "diving", "ForStrat.aerial": "aerial" });

if (!pantheria && !eltonMammals && !eltonBirds) {
  console.error("Keine Merkmalsquellen in tools/.traits-cache/ gefunden.");
  console.error("Vorbereiten mit: python3 tools/build-traits-fetch.py");
  process.exit(1);
}

// Gegen die bisher geernteten Arten messen, WIEVIEL davon ueberhaupt anbindbar ist —
// keine Zahl ohne Beleg, auch nicht in der Zwischenstufe.
const harvest = existsSync(HARVEST) ? JSON.parse(readFileSync(HARVEST, "utf-8")) : { species: {} };
const species = Object.values(harvest.species || {});

// WICHTIG: nur gegen die ROOT-Klade messen, zu der die Quelle ueberhaupt etwas sagen
// KANN — sonst verduennt sich die Quote mit allen anderen Reichen/Kladen und behauptet
// eine schlechtere Anbindung, als die Quelle tatsaechlich leistet.
function coverage(name, table, rootFilter) {
  if (!table) { console.log(`${name}: keine Datei — uebersprungen.`); return; }
  const pool = species.filter((s) => rootFilter.includes(s.root));
  // Nur ueber den WISSENSCHAFTLICHEN Namen (P225) matchen — die Ernte liefert seit dem
  // Fund von Schritt 1.1 auch `sci`; der frueher genutzte Anzeigename (`label`) ist bei
  // bekannten Arten oft der deutsche Trivialname ("Eisbär" statt "Ursus maritimus") und
  // liefert dort FALSCH-NEGATIVE Nichttreffer.
  let hit = 0, withSci = 0;
  for (const s of pool) {
    if (!s.sci) continue;
    withSci++;
    const parts = s.sci.split(" ");
    if (parts.length >= 2 && table[key(parts[0], parts[1])]) hit++;
  }
  const pct = withSci ? (100 * hit / withSci).toFixed(1) : "0";
  console.log(`${name}: ${Object.keys(table).length} Arten in der Quelle, `
    + `${hit}/${withSci} (${pct}%) der Arten dieser Klade(n) MIT wiss. Namen treffen darauf `
    + `(von insgesamt ${pool.length} geernteten, ${pool.length - withSci} ohne P225).`);
}

coverage("PanTHERIA (Saeugetiere, Masse)", pantheria, ["Saeugetiere"]);
coverage("EltonTraits Saeugetiere (Diaet)", eltonMammals, ["Saeugetiere"]);
coverage("EltonTraits Voegel (Diaet)", eltonBirds, ["Voegel"]);

// Ergebnis als Zwischenformat sichern (Schluessel = "genus species" klein) — Schritt 1.4
// liest das beim Zusammenbau, GENAU wie catalog-check spaeter die Konfidenz prueft.
const out = { pantheria: pantheria || {}, eltonMammals: eltonMammals || {}, eltonBirds: eltonBirds || {} };
writeFileSync(join(ROOT, "tools", ".traits-linked.json"), JSON.stringify(out));
console.log("tools/.traits-linked.json geschrieben.");
