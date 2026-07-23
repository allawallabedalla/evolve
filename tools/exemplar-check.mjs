// Test des „≈ in echt"-Mappings (app/exemplar.js): jede emergente Art bekommt ein
// reales Vorbild + eine valide deutsche Wikipedia-URL. Deckt alle Reiche ab und prüft,
// dass Merkmale die Wahl sinnvoll steuern (geflügeltes Tier -> Fledermaus/Schmetterling).
import { realExample, archetypeWiki } from "../app/exemplar.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Alle Icon-Schlüssel aus dem App-Icon-Set einlesen (ICONS = { key:`svg`, ... }),
// damit kein realExample.icon auf einen nicht existierenden Schlüssel zeigt.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const iconsStart = html.indexOf("const ICONS = {");
const iconsBlock = html.slice(iconsStart, html.indexOf("\n};", iconsStart));
const iconKeys = new Set([...iconsBlock.matchAll(/^\s*([a-z][a-zA-Z0-9]*)\s*:\s*`/gm)].map((m) => m[1]));

const cases = [
  ["Tier · groß, geflügelt", "Fledermaus"],
  ["Tier · geflügelt", "Schmetterling"],
  ["Tier · gepanzert, groß", "Schildkröte"],
  ["Tier · winzig, träge", "Milbe"],
  ["Pflanze · groß, verholzt", "Baum"],
  ["Pilz · groß, verholzt, hochaktiv", "Baumpilz"],
  ["Mikrobe · winzig, träge", "Bakterie"],
  ["Protist · geflügelt", "Strahlentierchen"],
];

let ok = true;
console.log("Mapping „in echt\u201c (app/exemplar.js)\n");
let iconsOk = true;
for (const [name, expect] of cases) {
  const ex = realExample(name);
  const validUrl = /^https:\/\/de\.wikipedia\.org\/wiki\/\S+$/.test(ex.wiki);
  const match = ex.name === expect;
  const iconExists = iconKeys.has(ex.icon);
  if (!validUrl || !match) ok = false;
  if (!iconExists) iconsOk = false;
  console.log(`  ${match ? "OK  " : "FAIL"} ${name.padEnd(34)} -> ${ex.name.padEnd(16)} [${ex.icon}]${iconExists ? "" : " ‹FEHLT!›"} ${validUrl ? "" : "(BAD URL)"}`);
}

// Alle Reiche liefern etwas Sinnvolles (kein leerer Fallback-Absturz)
const kingdoms = ["Tier", "Pflanze", "Pilz", "Mikrobe", "Protist", "Unbekannt"];
const allKingdoms = kingdoms.every((k) => {
  const ex = realExample(k + " · generalistisch");
  return ex && ex.name && /wikipedia\.org/.test(ex.wiki) && iconKeys.has(ex.icon);
});
console.log(`\n  ${iconKeys.size} Icon-Schlüssel im App-Set gefunden.`);
console.log(`  Alle Vorbild-Icons existieren:    ${iconsOk ? "OK" : "FAIL"}`);
console.log(`  Alle Reiche liefern ein Vorbild:  ${allKingdoms ? "OK" : "FAIL"}`);

// Jeder App-Archetyp (classify().n = FICON-Schlüssel) braucht ein Wikipedia-Vorbild
// für den „≈ in echt"-Link neben dem Namen in der Hauptansicht.
const ficonStart = html.indexOf("const FICON = {");
const ficonBlock = html.slice(ficonStart, html.indexOf("\n};", ficonStart));
const archNames = [...ficonBlock.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]);
const missing = archNames.filter((n) => !archetypeWiki(n));
console.log(`\n  ${archNames.length} App-Archetypen; ohne Wikipedia-Vorbild: ${missing.length}`);
if (missing.length) console.log("    FEHLT: " + missing.join(", "));
const archOk = missing.length === 0 && archNames.length > 30;

if (ok && iconsOk && allKingdoms && archOk) console.log("\nStatus: OK — Welt-Formen UND App-Archetypen haben Vorbild + Wikipedia + Icon.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
