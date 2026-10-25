// Erzeugt esp32/include/gene_texts.h aus den Texten der Browser-App:
//   GENE_LABELS  aus app/index.html (Anzeigenamen mit Umlauten)
//   GENE_EXPLAIN aus app/gene-explain.js (geprüfte Erklärsätze, Nutzen + Kosten je Gen)
// Bricht ab, wenn die Anzahl nicht zu physics.json passt oder ein Zeichen außerhalb
// der Board-Schrift (Latin-1 + – …) liegt.
//
// Aufruf:  node esp32/tools/gen-texts.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ESP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(ESP, "..");
const NG = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8")).traits.length;

const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const m = html.match(/const GENE_LABELS = (\[[^\]]*\]);/);
if (!m) {
  console.error("gen-texts: GENE_LABELS nicht in app/index.html gefunden.");
  process.exit(1);
}
const labels = JSON.parse(m[1]);

const window = {};
// eslint-disable-next-line no-new-func
new Function("window", readFileSync(join(ROOT, "app", "gene-explain.js"), "utf-8"))(window);
const explain = window.GENE_EXPLAIN;

const fail = (msg) => {
  console.error("gen-texts: " + msg);
  process.exit(1);
};
if (labels.length !== NG) fail(`${labels.length} GENE_LABELS, physics.json hat ${NG} Gene`);
if (!Array.isArray(explain) || explain.length !== NG) fail(`GENE_EXPLAIN hat ${explain?.length} statt ${NG} Einträge`);
const inFont = (c) => c.charCodeAt(0) <= 0xff || c === "–" || c === "…";
for (const s of [...labels, ...explain]) {
  const bad = [...s].filter((c) => !inFont(c));
  if (bad.length) fail(`Zeichen außerhalb der Schrift: ${[...new Set(bad)].join(" ")} in „${s}“`);
}

const cstr = (s) => JSON.stringify(s);
const out = [
  "// AUTOMATISCH ERZEUGT von esp32/tools/gen-texts.mjs aus app/index.html (GENE_LABELS)",
  "// und app/gene-explain.js. Nicht von Hand ändern – Generator neu laufen lassen.",
  "#pragma once",
  '#include "physics.h"',
  "",
  "namespace texts {",
  "",
  "static const char *const GENE_LABEL[phys::NUM_GENES] = {",
  ...labels.map((s) => `    ${cstr(s)},`),
  "};",
  "",
  "static const char *const GENE_EXPLAIN[phys::NUM_GENES] = {",
  ...explain.map((s) => `    ${cstr(s)},`),
  "};",
  "",
  "}  // namespace texts",
  "",
].join("\n");
const file = join(ESP, "include", "gene_texts.h");
writeFileSync(file, out);
console.log(`gen-texts: ${NG} Gene -> ${relative(ROOT, file).replace(/\\/g, "/")}`);
