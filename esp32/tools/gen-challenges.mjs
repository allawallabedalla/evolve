// Erzeugt esp32/include/challenges.h aus app/challenges.js.
//
// Übernommen werden nur Herausforderungen mit einem REICH als Ziel (ziel.reich). Die
// übrigen zielen auf einen Bauplan-Namen aus der Archetyp-Bibliothek (app/archetypes.js,
// classify()) – die gibt es auf dem Board nicht.
//
// Grenzen in der Reihenfolge der Board-Regler (src/ui.cpp REGLER): Wärme, Licht, Wasser,
// Futter, Futterhöhe, Räuber. Ohne Grenze: 0..1.
//
// Aufruf:  node esp32/tools/gen-challenges.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ESP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(ESP, "..");
const window = {};
// eslint-disable-next-line no-new-func
new Function("window", readFileSync(join(ROOT, "app", "challenges.js"), "utf-8"))(window);
const all = window.EVOLVE_CHALLENGES;

const FIELDS = ["temperature", "light", "water", "foodAbundance", "foodHeight", "predation"];
const KINGDOMS = ["Pflanze", "Tier", "Pilz", "Mikrobe", "Protist"]; // = enum Kingdom in describe.h
const DIFF = ["leicht", "mittel", "schwer"];

const fail = (m) => {
  console.error("gen-challenges: " + m);
  process.exit(1);
};
// „—“ (U+2014) fehlt in der Board-Schrift -> „–“; alles andere muss passen
const fix = (s) => s.replace(/—/g, "–");
const inFont = (c) => c.charCodeAt(0) <= 0xff || c === "–" || c === "…";

const list = all.filter((c) => c.ziel?.reich && !c.ziel.form);
const rows = list.map((c) => {
  const k = KINGDOMS.indexOf(c.ziel.reich);
  if (k < 0) fail(`unbekanntes Reich ${c.ziel.reich} (${c.id})`);
  const d = DIFF.indexOf(c.schwierigkeit);
  if (d < 0) fail(`unbekannte Schwierigkeit ${c.schwierigkeit} (${c.id})`);
  for (const key of Object.keys(c.grenzen)) if (!FIELDS.includes(key)) fail(`unbekannte Grenze ${key} (${c.id})`);
  const lo = FIELDS.map((f) => c.grenzen[f]?.min ?? 0);
  const hi = FIELDS.map((f) => c.grenzen[f]?.max ?? 1);
  const title = fix(c.titel), desc = fix(c.beschreibung);
  for (const s of [title, desc]) {
    const bad = [...s].filter((ch) => !inFont(ch));
    if (bad.length) fail(`Zeichen außerhalb der Schrift: ${[...new Set(bad)].join(" ")} (${c.id})`);
  }
  const num = (v) => (Number.isInteger(v) ? v.toFixed(1) : String(v)) + "f";
  return `    {${JSON.stringify(c.id)}, ${JSON.stringify(title)}, ${JSON.stringify(desc)}, ${k}, ${d}, ${c.generationen}, ` +
    `{${lo.map(num).join(", ")}}, {${hi.map(num).join(", ")}}},`;
});

const out = [
  "// AUTOMATISCH ERZEUGT von esp32/tools/gen-challenges.mjs aus app/challenges.js.",
  "// Nicht von Hand ändern – Generator neu laufen lassen.",
  "#pragma once",
  "#include <stdint.h>",
  "",
  "struct Challenge {",
  "  const char *id;",
  "  const char *title;",
  "  const char *desc;",
  "  uint8_t kingdom;     // enum Kingdom (describe.h)",
  "  uint8_t difficulty;  // 0 leicht, 1 mittel, 2 schwer",
  "  uint16_t generations;  // Budget",
  "  float lo[6], hi[6];  // Wärme, Licht, Wasser, Futter, Futterhöhe, Räuber",
  "};",
  "",
  `constexpr int NUM_CHALLENGES = ${rows.length};`,
  "",
  "static const Challenge CHALLENGES[NUM_CHALLENGES] = {",
  ...rows,
  "};",
  "",
].join("\n");
const file = join(ESP, "include", "challenges.h");
writeFileSync(file, out);
console.log(`gen-challenges: ${rows.length} von ${all.length} (Reich-Ziele) -> ${relative(ROOT, file).replace(/\\/g, "/")}`);
