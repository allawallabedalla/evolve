// Test des „≈ in echt"-Mappings (app/exemplar.js): jede emergente Art bekommt ein
// reales Vorbild + eine valide deutsche Wikipedia-URL. Deckt alle Reiche ab und prüft,
// dass Merkmale die Wahl sinnvoll steuern (geflügeltes Tier -> Fledermaus/Schmetterling).
import { realExample } from "../app/exemplar.js";

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
for (const [name, expect] of cases) {
  const ex = realExample(name);
  const validUrl = /^https:\/\/de\.wikipedia\.org\/wiki\/\S+$/.test(ex.wiki);
  const match = ex.name === expect;
  if (!validUrl || !match) ok = false;
  console.log(`  ${match ? "OK  " : "FAIL"} ${name.padEnd(34)} -> ${ex.name.padEnd(16)} ${validUrl ? "" : "(BAD URL)"}`);
}

// Alle Reiche liefern etwas Sinnvolles (kein leerer Fallback-Absturz)
const kingdoms = ["Tier", "Pflanze", "Pilz", "Mikrobe", "Protist", "Unbekannt"];
const allKingdoms = kingdoms.every((k) => {
  const ex = realExample(k + " · generalistisch");
  return ex && ex.name && /wikipedia\.org/.test(ex.wiki);
});
console.log(`\n  Alle Reiche liefern ein Vorbild:  ${allKingdoms ? "OK" : "FAIL"}`);

if (ok && allKingdoms) console.log("\nStatus: OK — jede Art hat ein reales Vorbild + valide Wikipedia-URL.");
else { console.log("\nStatus: FAIL."); process.exit(1); }
