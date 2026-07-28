// Erzeugt app/challenges.js aus einer geprüften Zulieferung (Paket P8).
// Ablauf:  node tools/challenge-import-check.mjs <datei>   (muss bestehen)
//     dann node tools/build-challenges.mjs <datei>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/app-core.mjs";

const src = process.argv[2] || join(ROOT, "docs", "auslagerung", "P8-ausgabe.json");
const data = JSON.parse(readFileSync(src, "utf-8"));
const list = Array.isArray(data) ? data : (data.herausforderungen || []);
if (!list.length) { console.error("build-challenges: keine Herausforderungen in " + src); process.exit(1); }

const ids = new Set();
for (const ch of list) {
  if (ids.has(ch.id)) { console.error(`build-challenges: doppelte id „${ch.id}" — nichts geschrieben.`); process.exit(1); }
  ids.add(ch.id);
}

const out = list.map(ch => ({
  id: ch.id, titel: ch.titel, beschreibung: ch.beschreibung,
  ziel: ch.ziel, grenzen: ch.grenzen, generationen: ch.generationen, schwierigkeit: ch.schwierigkeit,
}));

const body = `// AUTO-GENERIERT aus ${src.split("/").slice(-2).join("/")} (externe Zulieferung,
// geprüft mit tools/challenge-import-check.mjs). Nicht von Hand editieren.
window.EVOLVE_CHALLENGES = ${JSON.stringify(out, null, 1)};
`;
writeFileSync(join(ROOT, "app", "challenges.js"), body);
console.log(`challenges.js: ${out.length} Herausforderungen geschrieben.`);
