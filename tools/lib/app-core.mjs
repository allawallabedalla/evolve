// Gemeinsamer Zugriff auf den App-Inline-Kern (app/index.html ist die maßgebliche
// Fassung — dieselbe Technik wie tools/app-parity.mjs). Wird von influence-check
// und layer-import-check genutzt, damit es davon nur EINE Kopie gibt.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Die 16 Achsen der App + der Startzustand eines frischen Wesens.
export const BASE_ENV = { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2, light: .5, water: .6,
  toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };
export const AXES = Object.keys(BASE_ENV);
// Achsen, die ein Einfluss NICHT setzt, werden von applyInfluence() zurückgesetzt
// (Stressoren gelten nur, solange der auslösende Einfluss aktiv ist).
export const STRESSORS = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];

export function loadAppCore(toolName = "app-core") {
  const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
  const grab = (re, what) => {
    const m = html.match(re);
    if (!m) { console.error(`${toolName}: ${what} nicht in app/index.html gefunden.`); process.exit(1); }
    return m[0];
  };
  const physSrc   = grab(/const PHYS = \{[\s\S]*?\n\};/, "PHYS");
  const paramsSrc = grab(/const PARAMS = \{[\s\S]*?\n\};/, "PARAMS");
  const ficonSrc  = grab(/const FICON = \{[\s\S]*?\n\};/, "FICON");
  const fitSrc    = grab(/function fitness\(t, e\)\{[\s\S]*?\n\}/, "fitness()");
  const stepSrc   = grab(/function stepGeneration\(m, env, randn\)\{[\s\S]*?\n\}/, "stepGeneration()");
  // Prototyp-Matcher (Migrations-Stufe 2) — loest die alte classify()-Kaskade ab.
  // Die Formen selbst sind Daten (app/archetypes.js), hier nur der Rechenweg.
  const libSrc    = grab(/function archLib\(\)\{[\s\S]*?\n\}/, "archLib()");
  const weightSrc = grab(/function selectionWeights\(t, e\)\{[\s\S]*?\n\}/, "selectionWeights()");
  const burdenSrc = grab(/function unusedBurden\(t, e\)\{[\s\S]*?\n\}/, "unusedBurden()");
  const envFitSrc = grab(/function envFits\(e, req\)\{[\s\S]*?\n\}/, "envFits()");
  const nounSrc   = grab(/function bodyPlanNoun\(t, e\)\{[\s\S]*?\n\}/, "bodyPlanNoun()");
  const genSrc    = grab(/function generateFormName\(t, e, w, near\)\{[\s\S]*?\n\}/, "generateFormName()");
  const matchSrc  = grab(/function matchArchetype\(t, e\)\{[\s\S]*?\n\}/, "matchArchetype()");
  const classSrc  = grab(/function classify\(t, envIn\)\{[\s\S]*?\n\}/, "classify()");
  const geneLabels = eval(grab(/const GENE_LABELS = \[[\s\S]*?\];/, "GENE_LABELS")
    .replace(/^const GENE_LABELS = /, "").replace(/;$/, ""));
  const archWin = {};
  new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);

  const box = {};
  new Function("box", "ARCH", `
    const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
    const sigmoid = x => 1 / (1 + Math.exp(-x));
    ${physSrc}
    ${paramsSrc}
    ${ficonSrc}
    const NG = ${geneLabels.length};
    const DRIFT_SCALE = 0;
    ${fitSrc}
    ${stepSrc}
    let _archLib = null, _archNamedMax = 1;
    const _archDist = [];
    const NOVEL_DEV_MIN = 0.18;
    ${libSrc}
    ${weightSrc}
    ${burdenSrc}
    ${envFitSrc}
    ${nounSrc}
    ${genSrc}
    ${matchSrc}
    ${classSrc}
    box.fitness = fitness; box.stepGeneration = stepGeneration; box.classify = classify;
    box.matchArchetype = matchArchetype; box.selectionWeights = selectionWeights; box.NG = NG;
  `)(box, archWin.ARCHETYPES);

  // Deterministische Konvergenz aus dem Ur-Genom (kein Rauschen) — das Maß dafür,
  // ob ein Einfluss die Selektion wirklich verschiebt.
  const converge = (env, gens = 400) => {
    let g = new Array(box.NG).fill(.5);
    for (let i = 0; i < gens; i++) g = box.stepGeneration(g, env, null);
    return g;
  };
  const envOf = (f) => {
    const e = { ...BASE_ENV, ...f.env };
    for (const s of STRESSORS) if (f.env[s] === undefined) e[s] = 0;
    e.oxygen = f.env.oxygen === undefined ? 1 : f.env.oxygen;
    return e;
  };
  return { ...box, converge, envOf, l1: (a, b) => a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) };
}

export function loadInfluences() {
  const win = {};
  new Function("window", readFileSync(join(ROOT, "app", "influences.js"), "utf-8"))(win);
  const factors = [];
  for (const c of win.INFLUENCES)
    for (const g of c.groups)
      for (const f of g.factors) factors.push({ ...f, cat: c.plain || c.cat, sub: g.sub });
  return { INFLUENCES: win.INFLUENCES, factors };
}
