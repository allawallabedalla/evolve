// ============================================================================
// creature-contact-sheet — rendert VIELE Archetypen in EIN Rasterbild, damit sich der
// gesamte Bestand auf einen Blick pruefen laesst (statt jeden einzeln, s. BACKLOG Punkt 13:
// die Selbstkorrektur wirkte bisher nur im Einzel-Review — ein Kontaktbogen macht Ausreisser
// im Gesamtbild sichtbar). Baut auf denselben drei Test-Harness-Regeln wie creature-shot.mjs
// (running=false zuerst, time=0, biolum=0).
//
// Aufruf:  node tools/creature-contact-sheet.mjs <outPath> [emoji1 emoji2 ...]
// Ohne Emoji-Liste werden alle Tier-Archetypen aus app/archetypes.js genommen.
// ============================================================================
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = process.argv[2] || join(ROOT, "contact-sheet.png");
let emojis = process.argv.slice(3);
if (!emojis.length) {
  const arch = readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8");
  emojis = [...new Set([...arch.matchAll(/k:"Tier",\s*n:"[^"]*",\s*e:"([^"]+)"/g)].map(m => m[1]))];
}

const PORT = 8000 + Math.floor(Math.random() * 1000);
const pwDir = "/opt/pw-browsers";
const chromeDir = readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d));
const EXEC = join(pwDir, chromeDir, "chrome-linux", "chrome");
// Reich (k) je Emoji aus archetypes.js lesen — drawCreature dispatcht darauf. Vorher war
// k hart auf "Tier" gesetzt, wodurch Pflanzen/Pilze vom falschen Zeichner gerendert wurden.
const _archSrc = readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8");
const kindOf = Object.fromEntries([..._archSrc.matchAll(/k:"([^"]+)",\s*n:"[^"]*",\s*e:"([^"]+)"/g)].map(m => [m[2], m[1]]));

const { chromium } = await import("playwright-core");

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 360, height: 360 }, deviceScaleFactor: 1.4 });
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(1000);
await page.evaluate(() => { running = false; });
await page.waitForTimeout(150);

// Repraesentatives Genom je Archetyp — grob passend, damit der jeweilige kind-Zweig
// sinnvolle Groessen bekommt. Nicht kritisch: committedArch.e wird direkt gesetzt.
const geneHint = {
  "🐋": { size: .85, mobility: .95 }, "🦭": { size: .7, insulation: .9 },
  "🦎": { size: .5, limbLength: .55, mobility: .84, structure: .44 },
  "🐢": { size: .55, armor: .75 }, "🐸": { size: .55, mobility: .7 },
  "🐟": { size: .5, armor: .5 }, "🦋": { size: .3, wing: .8 }, "🐦": { size: .4, wing: .7 },
  "🦇": { size: .35, wing: .75 }, "🦀": { size: .5, armor: .7 }, "🐜": { size: .3 },
  "🐌": { size: .4, armor: .5 }, "🐙": { size: .5 }, "🐺": { size: .6, mobility: .8 },
  "🦊": { size: .45 }, "🐒": { size: .45, limbLength: .75 }, "🐭": { size: .2 },
  "🐻": { size: .8 }, "🦥": { size: .55 }, "🦏": { size: .85, armor: .6 },
  "⭐": { size: .4 }, "🦪": { size: .4 }, "🪼": { size: .4, biolum: .6 },
};

const geneNamesM = readFileSync(join(ROOT, "app", "catalog.js"), "utf-8").match(/genes:\s*\[([^\]]+)\]/);
const geneNames = geneNamesM[1].split(",").map(s => s.trim().replace(/^"|"$/g, ""));

const tiles = [];
for (const emoji of emojis) {
  const hint = geneHint[emoji] || { size: .5 };
  await page.evaluate(({ emoji, hint, geneNames, kindOf }) => {
    const g = new Array(NG).fill(0.5);
    g[geneNames.indexOf("biolum")] = 0;
    for (const [k, v] of Object.entries(hint)) { const i = geneNames.indexOf(k); if (i >= 0) g[i] = v; }
    genome = g; displayGenome = g.slice();
    const real = classify(g);
    committedArch = Object.assign({}, real, { e: emoji, k: (kindOf[emoji] || "Tier") });
    candArch = null; candCount = 0;
    drawCreature(displayGenome, 0, committedArch);
  }, { emoji, hint, geneNames, kindOf });
  await page.waitForTimeout(120);
  const buf = await (await page.$("#creatureSvg")).screenshot();
  tiles.push({ emoji, data: buf.toString("base64") });
}

// Raster-Seite bauen und als Ganzes screenshoten (kein Image-Lib noetig).
const cols = 4;
const grid = tiles.map(t => `<figure><img src="data:image/png;base64,${t.data}"><figcaption>${t.emoji}</figcaption></figure>`).join("");
const gridPage = await browser.newPage({ viewport: { width: cols * 250, height: Math.ceil(tiles.length / cols) * 250 }, deviceScaleFactor: 1 });
await gridPage.setContent(`<style>
  body{margin:0;background:#3a352f;font-family:sans-serif;display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px}
  figure{margin:0;position:relative;background:#2c2823}
  img{width:100%;display:block}
  figcaption{position:absolute;top:4px;left:6px;font-size:22px}
</style>${grid}`);
await gridPage.waitForTimeout(200);
await gridPage.screenshot({ path: outPath, fullPage: true });

await browser.close();
server.kill();
console.log(`Kontaktbogen: ${tiles.length} Archetypen -> ${outPath}`);
