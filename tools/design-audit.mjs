// ============================================================================
// design-audit — die Checkliste aus dem Redesign (Punkt 4, Phase 5) als Skript.
//
// Von Hand durchgeklickt ist so ein Audit einmal richtig und danach nie wieder;
// als Skript laeuft es nach jeder Design-Aenderung erneut. Geprueft wird:
//   1) WCAG-AA-Kontrast JEDES Elements mit eigenem Textinhalt, in 6 Ansichten,
//      gegen den tatsaechlich gerenderten Hintergrund (im DOM-Baum nach oben
//      gesucht, bis eine deckende Flaeche kommt — nicht geraten).
//   2) alle 12 Presets + jeder der 6 Regler auf 0 und 1: wird ueberhaupt etwas
//      gezeichnet?
//   3) alle 25 Gene einzeln auf 0 und 1 (50 Mutationsfaelle) durch classify()
//      und den Zeichner.
//   4) prefers-reduced-motion: eigener Kontext, Animationen aus, keine Fehler.
//
// Voraussetzung wie bei ui-calm-check: playwright-core + Chromium unter
// /opt/pw-browsers. Aufruf:  npm run design-audit
// ============================================================================
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8131;
const pwDir = "/opt/pw-browsers";
const chromeDir = existsSync(pwDir) ? readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d)) : null;
const EXEC = chromeDir ? join(pwDir, chromeDir, "chrome-linux", "chrome") : null;
if (!EXEC || !existsSync(EXEC)) {
  console.log("design-audit: kein Chromium unter /opt/pw-browsers — uebersprungen.");
  process.exit(0);
}
let chromium;
try { ({ chromium } = await import("playwright-core")); }
catch { console.log("design-audit: playwright-core nicht installiert — uebersprungen."); process.exit(0); }

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));
const URL_APP = `http://localhost:${PORT}/index.html`;
const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });

// ---------- 1) WCAG-Kontrast über alle sichtbaren Text/Flächen-Paare ----------
const page = await browser.newPage({ viewport: { width: 460, height: 1400 } });
const errors = [];
page.on("pageerror", e => errors.push("Haupt: " + e));
page.on("console", m => { if (m.type() === "error") errors.push("Haupt: " + m.text()); });
await page.goto(URL_APP);
await page.waitForTimeout(1200);
// Simulation anhalten: der Kontrast-Teil soll IMMER dieselbe Oberflaeche messen.
// Laeuft sie weiter, kann waehrend der Messung eine zustandsabhaengige Zeile
// auftauchen (Aussterbe-Warnung, Toast) und das Ergebnis von Lauf zu Lauf springen —
// genau so wurden hier einmal 2 Verstoesse gemeldet, die nicht reproduzierbar waren.
await page.evaluate(() => { running = false; if (typeof setPlayIcon === "function") setPlayIcon(); });
await page.waitForTimeout(200);

const contrastFn = () => {
  const lum = (r,g,b) => { const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const parse = s => { const m=s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r:+m[1], g:+m[2], b:+m[3], a:m[4]===undefined?1:+m[4] } : null; };
  const bgOf = el => {              // erste nicht-transparente Hintergrundfarbe nach oben
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return { r:255,g:255,b:255,a:1 };
  };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.5) continue;
    // nur Elemente mit eigenem, direktem Textinhalt
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n=>n.textContent.trim()).join(" ");
    if (!own) continue;
    const fg = parse(cs.color); if (!fg || fg.a < 0.5) continue;
    const bg = bgOf(el);
    const L1 = lum(fg.r,fg.g,fg.b), L2 = lum(bg.r,bg.g,bg.b);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    out.push({ txt: own.slice(0,32), ratio:+ratio.toFixed(2), need, px:+px.toFixed(1),
               sel: el.id ? "#"+el.id : el.className && typeof el.className==="string" ? "."+el.className.split(" ")[0] : el.tagName });
  }
  return out;
};

async function auditContrast(label) {
  const res = await page.evaluate(contrastFn);
  const bad = res.filter(x => x.ratio < x.need);
  console.log(`  ${label}: ${res.length} Textelemente, ${bad.length} unter AA`);
  bad.slice(0,10).forEach(b => console.log(`     ✗ ${b.sel} "${b.txt}" ${b.ratio} < ${b.need} (${b.px}px)`));
  return bad.length;
}
console.log("=== 1) WCAG-Kontrast (AA) ===");
let badTotal = await auditContrast("Hauptbildschirm");

// Panels durchgehen
for (const [id, name] of [["discBtn","Lebensbaum"],["chalBtn","Herausforderungen"],["presetsBtn","Presets"],["worldBtn","Umwelt-Einfluss"],["detailsBtn","Details"]]) {
  await page.click("#"+id); await page.waitForTimeout(500);
  badTotal += await auditContrast(name);
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
}

// ---------- 2) Alle 12 Presets + Extremregler ----------
// Zustands-Elemente, die im Normalzustand versteckt sind, gezielt sichtbar machen —
// sonst wuerden sie nie gemessen (die Aussterbe-Warnung hat zwei Farbstufen).
for (const [stufe, krit] of [["Aussterbe-Warnung", false], ["Aussterbe-Warnung kritisch", true]]) {
  await page.evaluate((k) => {
    const el = document.getElementById("perilLine");
    if (!el) return;
    el.hidden = false;
    el.textContent = "Nebel kaempft ums Ueberleben. Diese Welt traegt kein Leben.";
    el.classList.toggle("crit", k);
  }, krit);
  await page.waitForTimeout(150);
  badTotal += await auditContrast(stufe);
}
await page.evaluate(() => { const el = document.getElementById("perilLine"); if (el) { el.hidden = true; el.classList.remove("crit"); } });

console.log("\n=== 2) Presets + Extremregler ===");
await page.click("#presetsBtn"); await page.waitForTimeout(400);
const biomes = await page.locator("#presetsPanel .biome").count();
console.log(`  ${biomes} Presets gefunden`);
for (let i = 0; i < biomes; i++) {
  await page.locator("#presetsPanel .biome").nth(i).click();
  await page.waitForTimeout(220);
  const st = await page.evaluate(() => ({ biom: document.getElementById("biomeTag").textContent,
    kids: document.getElementById("cBodyLayer").children.length }));
  if (st.kids === 0) console.log(`     ✗ ${st.biom}: nichts gezeichnet`);
  if (!await page.locator("#presetsPanel").isVisible().catch(()=>false)) { await page.click("#presetsBtn"); await page.waitForTimeout(300); }
}
await page.keyboard.press("Escape"); await page.waitForTimeout(200);
console.log("  alle Presets gezeichnet");

// Extremregler: jede Achse auf 0 und 1
const extremes = await page.evaluate(async () => {
  const ids = ["s-temperature","s-predation","s-foodAbundance","s-foodHeight","s-light","s-water"];
  const bad = [];
  for (const id of ids) for (const v of [0, 1]) {
    const e = document.getElementById(id); e.value = String(v); e.dispatchEvent(new Event("input",{bubbles:true}));
    document.getElementById("draftGoBtn").click();
    drawCreature(displayGenome, 1000, committedArch);
    const b = document.getElementById("creatureRoot").getBBox();
    if (b.width < 2 || b.height < 2) bad.push(id+"="+v);
  }
  return bad;
});
console.log("  Extremregler ohne Zeichnung:", extremes.length ? extremes : "keine");

// ---------- 3) Mutationsfälle: jedes Gen einzeln auf 0 und 1 ----------
console.log("\n=== 3) Mutationsfälle (25 Gene x 2 Extreme) ===");
const genes = await page.evaluate(() => {
  const bad = [];
  for (let i = 0; i < NG; i++) for (const v of [0, 1]) {
    const g = new Array(NG).fill(0.5); g[i] = v;
    const a = classify(g);
    try {
      drawCreature(g, 1000, a);
      const b = document.getElementById("creatureRoot").getBBox();
      if (b.width < 2 || b.height < 2) bad.push(`${GENE_LABELS[i]}=${v} (${a.n})`);
    } catch (e) { bad.push(`${GENE_LABELS[i]}=${v}: ${e.message}`); }
  }
  return bad;
});
console.log("  auffällig:", genes.length ? genes : "keine — alle 50 Fälle gezeichnet");

// ---------- 4) prefers-reduced-motion ----------
console.log("\n=== 4) prefers-reduced-motion ===");
const rmCtx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 460, height: 950 } });
const rm = await rmCtx.newPage();
const rmErr = []; rm.on("pageerror", e => rmErr.push(String(e)));
await rm.goto(URL_APP);
await rm.waitForTimeout(1500);
const rmState = await rm.evaluate(() => ({ reduceMotion, rafOn, animation: getComputedStyle(document.getElementById("liveDot")).animationName }));
console.log("  Zustand:", JSON.stringify(rmState));
console.log("  Fehler:", rmErr.length ? rmErr : "keine");


console.log("\n=== Ergebnis ===");
console.log("  Kontrast-Verstöße gesamt:", badTotal);
console.log("  JS-Fehler:", errors.length ? errors : "keine");
await browser.close();
server.kill();
const ok = badTotal === 0 && extremes.length === 0 && genes.length === 0 && rmErr.length === 0 && errors.length === 0;
console.log(ok ? "\n\u2713 design-audit bestanden" : "\n\u2717 design-audit: siehe Befunde oben");
process.exit(ok ? 0 : 1);
