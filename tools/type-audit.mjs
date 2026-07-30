// ============================================================================
// type-audit — misst die TYPOGRAFIE der Live-Anzeige.
//
// Anlass (Nutzer, 2026-07): „die wirkt irgendwie nicht so cool." Ein Gefühl mit
// messbarer Ursache — nur nicht in der Farbe, sondern in der Schrift. Und wie bei
// ui-calm-check gilt: niemand merkt es beim Programmieren, weil jede einzelne
// font-size für sich plausibel ist. Erst die Summe ergibt 33 Größen ohne Skala.
//
// Darum werden die berechneten Stilwerte zur prüfbaren Größe: die Seite wird echt
// geladen, die Simulation läuft, dann liest getComputedStyle jedes SICHTBARE
// Text-Element aus. Gemessen wird, nicht geschätzt.
//
// Vier Messungen:
//   1. Größen-Streuung  — wie viele distinkte Größen, wie viel Text ist winzig
//   2. Schrift-Rollen   — wie stark dominiert Monospace
//   3. Formular-Schrift — welche Bedienelemente fallen auf die Browser-Schrift
//   4. Label-Überlauf   — welche Gen-Labels passen nicht in ihre Spalte
//
// Befunde und Empfehlungen: docs/typografie-audit.md
//
// Voraussetzung: playwright-core + Chromium unter /opt/pw-browsers (wie
// tools/ui-calm-check.mjs). Aufruf:  node tools/type-audit.mjs
// ============================================================================
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8131;

// Richtwerte. Kein harter Gate (noch nicht) — Stufe 2/3 des Audits muss zuerst
// laufen. Danach kann --strict eingeschaltet werden.
const MIN_PX = 12;        // kein sichtbarer Text darunter (iOS 11pt / Android 12sp)
const MAX_SIZES = 10;     // höchstens so viele distinkte Größen = eine echte Skala
const STRICT = process.argv.includes("--strict");

const pwDir = "/opt/pw-browsers";
const chromeDir = existsSync(pwDir) ? readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d)) : null;
const EXEC = chromeDir ? join(pwDir, chromeDir, "chrome-linux", "chrome") : null;
if (!EXEC || !existsSync(EXEC)) {
  console.log("type-audit: kein Chromium unter /opt/pw-browsers — übersprungen.");
  process.exit(0);
}
let chromium;
try { ({ chromium } = await import("playwright-core")); }
catch { console.log("type-audit: playwright-core nicht installiert (npm i --no-save playwright-core) — übersprungen."); process.exit(0); }

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
const errs = [];
page.on("pageerror", e => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
// Gen-Liste aufklappen, damit alle 25 Labels messbar sind
try { await page.click("text=Alle 25 Gene zeigen", { timeout: 2000 }); await page.waitForTimeout(600); } catch { /* schon offen */ }

const data = await page.evaluate(() => {
  const APP_FONTS = /^(ui-sans-serif|ui-monospace|Georgia|Fraunces|Space Grotesk|Space Mono)$/;
  const first = f => f.split(",")[0].replace(/"/g, "").trim();

  // --- 1./2. sichtbare Text-Elemente ---
  const rows = new Map();
  let visible = 0;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // nur Elemente mit eigenem Textknoten (sonst zählt jeder Container mit)
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    visible++;
    const px = Math.round(parseFloat(cs.fontSize) * 10) / 10;
    const key = `${px}|${first(cs.fontFamily)}|${cs.fontWeight}|${cs.fontStyle}|${cs.lineHeight}|${cs.letterSpacing}|${cs.textTransform}`;
    const rec = rows.get(key) || {
      px, fam: first(cs.fontFamily), w: cs.fontWeight, style: cs.fontStyle,
      lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, n: 0, sample: "",
    };
    rec.n++;
    if (!rec.sample) rec.sample = el.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
    rows.set(key, rec);
  }
  const list = [...rows.values()].sort((a, b) => a.px - b.px);
  const sizes = [...new Set(list.map(r => r.px))].sort((a, b) => a - b);
  const fams = {};
  for (const r of list) fams[r.fam] = (fams[r.fam] || 0) + r.n;

  // --- 3. Formular-Elemente ---
  const formBad = {};
  let formTotal = 0, formOk = 0;
  for (const el of document.querySelectorAll("button, input, select, textarea")) {
    formTotal++;
    const cs = getComputedStyle(el);
    const fam = first(cs.fontFamily);
    if (APP_FONTS.test(fam)) { formOk++; continue; }
    const k = `${fam} | .${String(el.className || el.type || el.tagName).split(" ")[0]}`;
    formBad[k] = (formBad[k] || 0) + 1;
  }

  // --- 4. Gen-Label-Überlauf ---
  const labels = [];
  for (const el of document.querySelectorAll(".gene .lbl")) {
    const box = el.getBoundingClientRect();
    const rng = document.createRange();
    rng.selectNodeContents(el);
    const textW = rng.getBoundingClientRect().width;
    labels.push({
      t: el.textContent.trim(),
      col: Math.round(box.width * 10) / 10,
      tw: Math.round(textW * 10) / 10,
      h: Math.round(box.height * 10) / 10,
    });
  }

  return { list, sizes, fams, visible, formTotal, formOk, formBad, labels };
});

const under = px => data.list.filter(r => r.px < px).reduce((s, r) => s + r.n, 0);
const pct = n => Math.round((100 * n) / data.visible);

console.log("=".repeat(78));
console.log("TYPOGRAFIE-AUDIT — app/index.html @ 1280px");
console.log("=".repeat(78));

console.log("\n[1] GRÖSSEN-STREUUNG");
console.log(`  sichtbare Text-Elemente   ${data.visible}`);
console.log(`  distinkte Typo-Kombis     ${data.list.length}`);
console.log(`  distinkte Größen          ${data.sizes.length}   (Richtwert ≤ ${MAX_SIZES})`);
console.log(`  Spanne                    ${data.sizes[0]}px … ${data.sizes.at(-1)}px  = ${(data.sizes.at(-1) / data.sizes[0]).toFixed(1)}:1 Kontrast`);
console.log(`  < ${MIN_PX}px                     ${under(MIN_PX)}/${data.visible}  (${pct(under(MIN_PX))}%)`);
console.log(`  < 11px                    ${under(11)}/${data.visible}  (${pct(under(11))}%)`);
console.log(`  > 16px                    ${data.list.filter(r => r.px > 16).reduce((s, r) => s + r.n, 0)}/${data.visible}`);
console.log(`  Werte: ${data.sizes.join(", ")}`);

console.log("\n[2] SCHRIFT-ROLLEN (Anteil sichtbarer Text-Elemente)");
for (const [f, n] of Object.entries(data.fams).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${pct(n).toString().padStart(3)}%  ${f}`);
}

console.log("\n[3] FORMULAR-ELEMENTE OHNE APP-SCHRIFT");
console.log(`  gesamt ${data.formTotal} · App-Schrift ${data.formOk} · Browser-Standard ${data.formTotal - data.formOk}`);
for (const [k, n] of Object.entries(data.formBad).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}x  ${k}`);
}
if (!Object.keys(data.formBad).length) console.log("  — keine (button, input { font: inherit } greift)");

console.log("\n[4] GEN-LABELS (Spalte vs. Textbreite)");
if (!data.labels.length) {
  console.log("  — keine Labels gefunden (Gen-Liste nicht aufgeklappt?)");
} else {
  const over = data.labels.filter(l => l.tw - l.col > 0.5);
  const multi = data.labels.filter(l => l.h > 20);
  console.log(`  geprüft ${data.labels.length} · Spaltenbreite ${data.labels[0].col}px`);
  console.log(`  Überlauf (${over.length}):`);
  for (const l of over) console.log(`    +${(l.tw - l.col).toFixed(1)}px  "${l.t}"  (Text ${l.tw}px)`);
  if (!over.length) console.log("    — keiner");
  console.log(`  zweizeilig → ungleiche Zeilenhöhe (${multi.length}):`);
  for (const l of multi) console.log(`    ${l.h}px  "${l.t}"`);
  if (!multi.length) console.log("    — keiner");
}

console.log("\n[5] TABELLE ALLER KOMBINATIONEN");
console.log("  px    Schrift        Gew. Stil   Zeilenh. Laufw.  Versal   n   Beispiel");
for (const r of data.list) {
  console.log(
    `  ${r.px.toFixed(1).padEnd(5)} ${r.fam.slice(0, 14).padEnd(14)} ${r.w.padEnd(4)} ` +
    `${r.style.slice(0, 6).padEnd(6)} ${r.lh.padEnd(8)} ${r.ls.slice(0, 7).padEnd(7)} ` +
    `${r.tt.slice(0, 8).padEnd(8)} ${String(r.n).padStart(3)} ${r.sample}`
  );
}

if (errs.length) console.log(`\nSeitenfehler: ${errs.length}\n  ${errs.slice(0, 3).join("\n  ")}`);

// --- Bewertung ---
const fails = [];
if (under(MIN_PX) > 0) fails.push(`${under(MIN_PX)} Elemente unter ${MIN_PX}px`);
if (data.sizes.length > MAX_SIZES) fails.push(`${data.sizes.length} distinkte Größen (max ${MAX_SIZES})`);
if (data.formTotal - data.formOk > 0) fails.push(`${data.formTotal - data.formOk} Bedienelemente auf Browser-Schrift`);
if (data.labels.some(l => l.tw - l.col > 0.5)) fails.push("Gen-Label läuft über seine Spalte");

console.log("\n" + "=".repeat(78));
if (fails.length) {
  console.log("BEFUND: " + fails.length + " offene Punkte");
  for (const f of fails) console.log("  · " + f);
  console.log("Details & Empfehlungen: docs/typografie-audit.md");
} else {
  console.log("BEFUND: Skala, Schriftrollen und Bedienelemente sind konsistent.");
}
console.log("=".repeat(78));

await browser.close();
server.kill();
process.exit(STRICT && fails.length ? 1 : 0);
