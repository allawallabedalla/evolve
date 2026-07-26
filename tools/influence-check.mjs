// ============================================================================
// influence-check — Prüfstand für „Umwelt-Einfluss auslösen".
//
// Ein Einfluss, der die Umwelt-Regler verstellt, aber die SELEKTION nicht
// verschiebt, ist eine Attrappe: die Cinematik blitzt, der Toast erscheint,
// und das Wesen entwickelt sich exakt wie vorher. Genau das kann man messen —
// und genau das prüft dieses Werkzeug.
//
// Vorgehen: aus app/index.html werden PHYS, PARAMS, fitness(), stepGeneration()
// und classify() extrahiert (dieselbe Technik wie tools/app-parity.mjs; die App
// ist die maßgebliche Fassung). Dann läuft je Faktor eine deterministische
// Konvergenz (kein Rauschen) aus dem Ur-Genom, und das Ergebnis wird gegen den
// Lauf im NEUTRALEN Ausgangsmilieu gehalten.
//
// Prüfungen:
//   1. Form        — jeder aktive Faktor hat env, tone, Klartextnamen, Erklärsatz.
//   2. Gültigkeit  — nur bekannte Achsen, Werte in [0,1], kein NaN in der Fitness.
//   3. WIRKSAMKEIT — verschiebt der Faktor das Endgenom messbar (L1-Distanz)?
//   4. Redundanz   — zwei Faktoren mit fast gleichem Achsen-Fingerabdruck sind
//                    Schein-Vielfalt (dieselbe Lehre wie beim Erzählwerk).
//   5. Abdeckung   — welche Archetypen/Reiche erreichen die Faktoren zusammen,
//                    und welche Achsen bleiben ungenutzt.
//
// Aufruf:  npm run influence-check          (Prüfung + Bericht)
//          node tools/influence-check.mjs --list     (Tabelle aller Faktoren)
// ============================================================================
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");

// --- App-Inline-Kern rekonstruieren (App = maßgebliche Fassung) -------------
const grab = (re, what) => {
  const m = html.match(re);
  if (!m) { console.error(`influence-check: ${what} nicht in app/index.html gefunden.`); process.exit(1); }
  return m[0];
};
const physSrc   = grab(/const PHYS = \{[\s\S]*?\n\};/, "PHYS");
const paramsSrc = grab(/const PARAMS = \{[\s\S]*?\n\};/, "PARAMS");
const fitSrc    = grab(/function fitness\(t, e\)\{[\s\S]*?\n\}/, "fitness()");
const stepSrc   = grab(/function stepGeneration\(m, env, randn\)\{[\s\S]*?\n\}/, "stepGeneration()");
const classSrc  = grab(/function classify\(t\)\{[\s\S]*?\n\}/, "classify()");
const geneLabels = eval(grab(/const GENE_LABELS = \[[\s\S]*?\];/, "GENE_LABELS").replace(/^const GENE_LABELS = /, "").replace(/;$/, ""));

const sandbox = {};
new Function("box", `
  const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  ${physSrc}
  ${paramsSrc}
  const NG = ${geneLabels.length};
  const DRIFT_SCALE = 0;
  ${fitSrc}
  ${stepSrc}
  ${classSrc}
  box.fitness = fitness; box.stepGeneration = stepGeneration; box.classify = classify; box.NG = NG;
`)(sandbox);
const { fitness, stepGeneration, classify, NG } = sandbox;

// --- Katalog laden ---------------------------------------------------------
const infSrc = readFileSync(join(ROOT, "app", "influences.js"), "utf-8");
const win = {};
new Function("window", infSrc)(win);
const INFLUENCES = win.INFLUENCES;

// Die 16 Achsen der App + der Startzustand eines frischen Wesens.
const BASE_ENV = { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2, light: .5, water: .6,
  toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };
const AXES = Object.keys(BASE_ENV);
// Achsen, die ein Einfluss NICHT setzt, werden von applyInfluence() zurückgesetzt
// (Stressoren gelten nur, solange der auslösende Einfluss aktiv ist) — genau so
// baut auch dieser Prüfstand die Umwelt zusammen.
const STRESSORS = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];
function envOf(f) {
  const e = { ...BASE_ENV, ...f.env };
  for (const s of STRESSORS) if (f.env[s] === undefined) e[s] = 0;
  e.oxygen = f.env.oxygen === undefined ? 1 : f.env.oxygen;
  return e;
}

const GENS = 400;
function converge(env) {
  let g = new Array(NG).fill(.5);
  for (let i = 0; i < GENS; i++) g = stepGeneration(g, env, null);
  return g;
}
const l1 = (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0);

// --- Faktoren einsammeln ---------------------------------------------------
const factors = [];
for (const c of INFLUENCES)
  for (const g of c.groups)
    for (const f of g.factors)
      factors.push({ ...f, cat: c.plain || c.cat, sub: g.sub });
const active = factors.filter(f => !f.soon);

const fail = [], warn = [];
const ok = m => console.log("  ✓ " + m);

// --- 1./2. Form & Gültigkeit ----------------------------------------------
for (const f of active) {
  const id = `„${f.plain || f.name}"`;
  if (!f.env || !Object.keys(f.env).length) { fail.push(`${id}: kein env-Effekt`); continue; }
  if (!f.tone) fail.push(`${id}: kein tone (hit/shift/bio)`);
  if (!["hit", "shift", "bio"].includes(f.tone)) fail.push(`${id}: unbekannter tone „${f.tone}"`);
  if (!f.plain) warn.push(`${id}: kein Klartextname (Fachbegriff steht allein im Modal)`);
  if (!f.desc || f.desc === "—") warn.push(`${id}: kein Erklärsatz`);
  for (const [k, v] of Object.entries(f.env)) {
    if (!AXES.includes(k)) fail.push(`${id}: unbekannte Achse „${k}"`);
    if (typeof v !== "number" || v < 0 || v > 1) fail.push(`${id}: ${k}=${v} außerhalb [0,1]`);
  }
}
if (!fail.length) ok(`Form & Gültigkeit: ${active.length} aktive Faktoren, alle Achsen bekannt`);

// --- 3. Wirksamkeit --------------------------------------------------------
const baseG = converge(BASE_ENV);
const baseA = classify(baseG);
const MIN_SHIFT = 0.25;          // L1 über 25 Gene — darunter ist es kein Einfluss
const results = [];
for (const f of active) {
  const env = envOf(f);
  const fitBase = fitness(baseG, env);
  if (!Number.isFinite(fitBase)) { fail.push(`„${f.plain || f.name}": Fitness ist NaN/Infinity`); continue; }
  const g = converge(env);
  const a = classify(g);
  const shift = l1(g, baseG);
  results.push({ f, g, a, shift, vit: fitness(g, env) });
  if (shift < MIN_SHIFT)
    fail.push(`„${f.plain || f.name}": verschiebt die Evolution kaum (L1 ${shift.toFixed(2)} < ${MIN_SHIFT}) — Attrappe`);
}
if (results.length) {
  const avg = results.reduce((s, r) => s + r.shift, 0) / results.length;
  ok(`Wirksamkeit: Ø L1-Verschiebung ${avg.toFixed(2)} über ${results.length} Faktoren (Referenz: Ausgangsmilieu → ${baseA.n})`);
}

// --- 4. Redundanz ----------------------------------------------------------
{
  const dup = [];
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++) {
      const A = envOf(active[i]), B = envOf(active[j]);
      let d = 0; for (const k of AXES) d += Math.abs(A[k] - B[k]);
      if (d < 0.12) dup.push(`„${active[i].plain || active[i].name}" ≈ „${active[j].plain || active[j].name}" (Abstand ${d.toFixed(2)})`);
    }
  if (dup.length) { for (const d of dup) warn.push("Dublette: " + d); }
  else ok("Redundanz: kein Faktor-Paar mit fast gleichem Milieu");
}

// --- 5. Abdeckung ----------------------------------------------------------
{
  const forms = new Map(), kingdoms = new Map();
  for (const r of results) {
    forms.set(r.a.n, (forms.get(r.a.n) || 0) + 1);
    kingdoms.set(r.a.k, (kingdoms.get(r.a.k) || 0) + 1);
  }
  const usedAxes = new Set(active.flatMap(f => Object.keys(f.env)));
  const unused = AXES.filter(a => !usedAxes.has(a));
  console.log(`\n  Abdeckung:`);
  console.log(`    Sektionen: ` + INFLUENCES.map(c => {
    const all = c.groups.flatMap(g => g.factors);
    return `${(c.plain || c.cat).split(" ")[0]} ${all.filter(f => !f.soon).length}/${all.length}`;
  }).join(" · "));
  console.log(`    erreichte Reiche:     ${[...kingdoms.entries()].map(([k, n]) => k + " " + n).join(" · ") || "—"}`);
  console.log(`    erreichte Formen (${forms.size}): ${[...forms.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(" · ")}`);
  if (unused.length) warn.push(`ungenutzte Umwelt-Achsen: ${unused.join(", ")}`);
  const total = factors.length, act = active.length;
  console.log(`    Faktoren gesamt: ${act}/${total} aktiv (${Math.round(act / total * 100)} %)`);
}

// --- Tabelle (--list) ------------------------------------------------------
if (process.argv.includes("--list")) {
  console.log("\n  Faktor · Verschiebung · Ergebnis-Form · Passung");
  for (const r of results.sort((a, b) => b.shift - a.shift))
    console.log(`    ${(r.f.plain || r.f.name).slice(0, 38).padEnd(40)} L1 ${r.shift.toFixed(2).padStart(5)}  ${r.a.n.padEnd(26)} ${Math.round(r.vit * 100)}%`);
}

// --- Ergebnis --------------------------------------------------------------
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  for (const w of warn.slice(0, 25)) console.log("    · " + w);
  if (warn.length > 25) console.log(`    … und ${warn.length - 25} weitere`);
}
if (fail.length) {
  console.error("\n✗ influence-check fehlgeschlagen:");
  for (const f of fail.slice(0, 30)) console.error("   · " + f);
  if (fail.length > 30) console.error(`   … und ${fail.length - 30} weitere`);
  process.exit(1);
}
console.log("\n✓ influence-check bestanden");
