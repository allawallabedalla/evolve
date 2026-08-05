// ============================================================================
// creature-shot — wiederverwendbares Screenshot-Werkzeug fuer einzelne Archetypen,
// ausserhalb der Simulation (fuer Anatomie-Feinschliff, s. BACKLOG Punkt 13 Phase 1).
//
// Ersetzt die vorher pro Runde neu geschriebenen tools/_tmp_*.mjs-Wegwerfskripte.
// Kapselt drei Fallstricke, die beim Gecko-Feinschliff (2026-08-05) real Fehl-
// Screenshots verursacht haben (s. BACKLOG-Nachtrag):
//   1. running=false MUSS gesetzt werden, BEVOR das Genom erzwungen wird — sonst
//      ueberschreibt der laufende requestAnimationFrame-Loop den erzwungenen Zustand
//      innerhalb weniger Frames mit der frei laufenden Simulation.
//   2. time=0 fest uebergeben — ein zufaelliger Zeitstempel kann mitten in einer
//      Blink-/Wag-Animationsphase landen (z. B. Pupille fast unsichtbar).
//   3. Biolumineszenz-Gen (Index 9) explizit auf 0 — der 0,5-Default ueberschreitet
//      den Glow-Schwellenwert (0,4) und erzeugt einen ungewollten Leuchtring.
//
// Aufruf:
//   node tools/creature-shot.mjs <emoji> <outPath> [--genes '{"insulation":.14,...}']
//
// Nicht genannte Gene bleiben auf 0,5 (Default), ausser biolum (fest 0, s. o.) — per
// --genes ueberschreibbar. Gen-Namen statt Indizes, damit das Skript nicht bei einer
// Gen-Reihenfolge-Aenderung in app/catalog.js stillschweigend falsche Werte setzt
// (Namen werden LIVE aus app/catalog.js gelesen, s. u.).
// ============================================================================
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , emoji, outPath, flag, genesJson] = process.argv;
if (!emoji || !outPath) {
  console.error("Aufruf: node tools/creature-shot.mjs <emoji> <outPath> [--genes '{\"insulation\":.2,...}']");
  process.exit(1);
}
const overrides = (flag === "--genes" && genesJson) ? JSON.parse(genesJson) : {};

// Gen-Namen live aus catalog.js lesen (nicht hart kodieren — s. Kommentar oben).
const catalogSrc = readFileSync(join(ROOT, "app", "catalog.js"), "utf-8");
const m = catalogSrc.match(/genes:\s*\[([^\]]+)\]/);
if (!m) { console.error("Konnte 'genes:[...]' nicht in app/catalog.js finden."); process.exit(1); }
const geneNames = m[1].split(",").map(s => s.trim().replace(/^"|"$/g, ""));

const PORT = 8000 + Math.floor(Math.random() * 1000);
const pwDir = "/opt/pw-browsers";
const chromeDir = readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d));
if (!chromeDir) { console.error("Kein Chromium unter /opt/pw-browsers gefunden."); process.exit(1); }
const EXEC = join(pwDir, chromeDir, "chrome-linux", "chrome");
// Reich (k) je Emoji aus archetypes.js lesen — drawCreature dispatcht darauf. Vorher war
// k hart auf "Tier" gesetzt, wodurch Pflanzen/Pilze vom falschen Zeichner gerendert wurden.
const _archSrc = readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8");
const kindOf = Object.fromEntries([..._archSrc.matchAll(/k:"([^"]+)",\s*n:"[^"]*",\s*e:"([^"]+)"/g)].map(m => [m[2], m[1]]));

const { chromium } = await import("playwright-core");

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(1000);
// Fallstrick 1: Sim anhalten VOR jeder Genom-Erzwingung.
await page.evaluate(() => { running = false; });
await page.waitForTimeout(200);

const info = await page.evaluate(({ emoji, overrides, geneNames, kindOf }) => {
  const g = new Array(NG).fill(0.5);
  g[geneNames.indexOf("biolum")] = 0; // Fallstrick 3: Default 0.5 ueberschreitet den Glow-Schwellenwert.
  for (const [name, val] of Object.entries(overrides)) {
    const idx = geneNames.indexOf(name);
    if (idx < 0) throw new Error(`Unbekanntes Gen "${name}" — bekannt: ${geneNames.join(", ")}`);
    g[idx] = val;
  }
  genome = g; displayGenome = g.slice();
  const real = classify(g);
  committedArch = Object.assign({}, real, { e: emoji, k: (kindOf[emoji] || "Tier") });
  candArch = null; candCount = 0;
  drawCreature(displayGenome, 0, committedArch); // Fallstrick 2: time=0 fest.
  return { e: committedArch.e, realKey: real.key, realE: real.e };
}, { emoji, overrides, geneNames, kindOf });

await page.waitForTimeout(300);
await (await page.$("#creatureSvg")).screenshot({ path: outPath });
await browser.close();
server.kill();

if (errors.length) console.log("JS-Fehler waehrend des Renderns:", errors);
console.log(`archetype: ${info.e} (klassifiziert als ${info.realE}/${info.realKey}) -> ${outPath}`);
