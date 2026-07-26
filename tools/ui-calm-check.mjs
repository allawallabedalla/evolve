// ============================================================================
// ui-calm-check — misst, wie HEKTISCH die Live-Anzeige ist.
//
// Anlass (Nutzer, 2026-07): „Diese Umwelt formt gerade …" und die Gen-Pfeile
// sprangen im Sekundenbruchteil. Eine Anzeige, die schneller wechselt, als man
// lesen kann, ist keine Information, sondern Unruhe — und niemand merkt es beim
// Programmieren, weil jede einzelne Aktualisierung für sich korrekt ist.
//
// Darum wird die WECHSELRATE zur prüfbaren Größe: die Seite wird echt geladen,
// die Simulation läuft, und über 12 Sekunden wird alle 100 ms abgetastet, wie
// oft sich (a) die Warum-Zeile und (b) die Richtungspfeile ändern.
//
// Richtwert: höchstens ~1 Wechsel alle 2 Sekunden (6 je 12 s). Alles darüber
// liest sich als Zappeln.
//
// Voraussetzung: playwright-core + Chromium unter /opt/pw-browsers (wie
// tools/app-world-smoke.mjs). Aufruf:  node tools/ui-calm-check.mjs
// ============================================================================
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8129;
const MAX_CHANGES = 6;        // je 12 s — darüber gilt die Anzeige als hektisch

const pwDir = "/opt/pw-browsers";
const chromeDir = existsSync(pwDir) ? readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d)) : null;
const EXEC = chromeDir ? join(pwDir, chromeDir, "chrome-linux", "chrome") : null;
if (!EXEC || !existsSync(EXEC)) {
  console.log("ui-calm-check: kein Chromium unter /opt/pw-browsers — übersprungen.");
  process.exit(0);
}
let chromium;
try { ({ chromium } = await import("playwright-core")); }
catch { console.log("ui-calm-check: playwright-core nicht installiert (npm i --no-save playwright-core) — übersprungen."); process.exit(0); }

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const results = [];
const errs = [];

async function measure(label, speedIdx, settleMs) {
  const p = await browser.newPage();
  p.on("pageerror", e => errs.push(`${label}: ${e.message}`));
  await p.goto(`http://localhost:${PORT}/index.html`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  await p.$$eval(".speed", (els, i) => els[i].click(), speedIdx);
  await p.$eval("#s-light", el => { el.value = 0.9; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.waitForTimeout(settleMs);
  const r = await p.evaluate(async () => {
    const texts = [], arrows = [];
    for (let i = 0; i < 120; i++) {
      texts.push(document.getElementById("whyLine").textContent.trim());
      arrows.push([...document.querySelectorAll('[id^="gd-"]')].map(e => e.textContent + (e.style.opacity || 0)).join(""));
      await new Promise(res => setTimeout(res, 100));
    }
    const count = a => { let n = 0; for (let i = 1; i < a.length; i++) if (a[i] !== a[i - 1]) n++; return n; };
    return { text: count(texts), arrows: count(arrows), last: texts[texts.length - 1] };
  });
  await p.close();
  results.push({ label, ...r });
}

await measure("normal · direkt nach Reglerwechsel", 1, 500);
await measure("normal · eingeschwungen", 1, 12000);
await measure("schnell · direkt nach Reglerwechsel", 2, 500);
await browser.close();
server.kill();

console.log("  Wechsel je 12 Sekunden (Richtwert: höchstens " + MAX_CHANGES + "):");
let bad = 0;
for (const r of results) {
  const flag = (r.text > MAX_CHANGES || r.arrows > MAX_CHANGES) ? "  ✗" : "  ✓";
  if (flag === "  ✗") bad++;
  console.log(`${flag} ${r.label.padEnd(38)} Zeile ${String(r.text).padStart(2)}×   Pfeile ${String(r.arrows).padStart(2)}×`);
}
if (errs.length) { console.error("\n✗ Seitenfehler:"); errs.forEach(e => console.error("   · " + e)); process.exit(1); }
if (bad) { console.error(`\n✗ ui-calm-check: ${bad} Messung(en) über dem Richtwert — die Anzeige zappelt.`); process.exit(1); }
console.log("\n✓ ui-calm-check bestanden");
