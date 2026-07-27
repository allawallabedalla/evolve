// Erzeugt app/story-extra.js aus einer geprüften Zulieferung.
// Ablauf:  node tools/story-import-check.mjs <datei>   (muss bestehen)
//     dann node tools/build-story-extra.mjs <datei>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/app-core.mjs";
const src = process.argv[2] || join(ROOT, "docs", "auslagerung", "S6-ausgabe.json");
const d = JSON.parse(readFileSync(src, "utf8"));
const head = `// AUTO-GENERIERT aus ${src.split("/").slice(-2).join("/")} (externe Zulieferung,
// geprüft mit tools/story-import-check.mjs). Nicht von Hand editieren — neue
// Zulieferungen mit tools/build-story-extra.mjs einspielen.
//
// \`faktoren\`: Kern-Zeilen je Umwelt-Einfluss. Sie greifen, wenn der Spieler genau
// diesen Einfluss auslöst — dadurch erzählt jeder Einfluss sich selbst, statt nur
// die Achse zu nennen, die sich bewegt hat.
// \`pools\`: zusätzliche Textur-Bausteine für die geteilten Pools.
window.EvolveStoryExtra = `;
writeFileSync(join(ROOT, "app", "story-extra.js"), head + JSON.stringify(d, null, 1) + ";\n");
const nf = Object.values(d.faktoren || {}).reduce((s, a) => s + a.length, 0);
const np = Object.values(d.pools || {}).reduce((s, a) => s + a.length, 0);
console.log(`story-extra.js: ${nf} Faktor-Zeilen (${Object.keys(d.faktoren || {}).length} Einflüsse) + ${np} Textur-Bausteine`);
