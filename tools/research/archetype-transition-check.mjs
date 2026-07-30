// Regressions-Wächter für app/archetypes.js: vergleicht die klassifizierten Namen VOR und
// NACH einer Änderung auf DENSELBEN Umwelten (gleiche RNG-Sequenz) und zeigt, welche
// Bestandsformen wie viel an welche neuen/geänderten Formen verlieren. Ein Sweep auf der
// isolierten Nischen-Bedingung einer neuen Form (wie in gap-sweep.mjs) sagt nur ihre
// NISCHEN-GRÖSSE voraus, nicht ihre Erreichbarkeit NACH Konkurrenz mit allen anderen
// Prototypen — das misst dieses Werkzeug. Kein Gate (kein process.exit(1)), Referenzmessung.
//
// Aufruf: node tools/research/archetype-transition-check.mjs [git-ref=HEAD] [Stichproben=4000]
// Vergleicht den aktuellen Arbeitsstand von app/archetypes.js gegen die Fassung aus
// `git show <ref>:app/archetypes.js`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE_ENV, STRESSORS, ROOT } from "../lib/app-core.mjs";

const REF = process.argv[2] || "HEAD";
const N = +(process.argv[3] || 4000);

const tmp = mkdtempSync(join(tmpdir(), "arch-transition-"));
const oldPath = join(tmp, "archetypes-old.js");
try {
  const oldSrc = execFileSync("git", ["show", `${REF}:app/archetypes.js`], { cwd: ROOT, encoding: "utf-8" });
  writeFileSync(oldPath, oldSrc);
} catch (e) {
  console.error(`Konnte app/archetypes.js aus ${REF} nicht laden: ${e.message}`);
  process.exit(1);
}

function loadWith(archPath) {
  const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
  const grab = (re) => html.match(re)[0];
  const physSrc = grab(/const PHYS = \{[\s\S]*?\n\};/), paramsSrc = grab(/const PARAMS = \{[\s\S]*?\n\};/),
    ficonSrc = grab(/const FICON = \{[\s\S]*?\n\};/), fitSrc = grab(/function fitness\(t, e\)\{[\s\S]*?\n\}/),
    stepSrc = grab(/function stepGeneration\(m, env, randn\)\{[\s\S]*?\n\}/), libSrc = grab(/function archLib\(\)\{[\s\S]*?\n\}/),
    weightSrc = grab(/function selectionWeights\(t, e\)\{[\s\S]*?\n\}/), burdenSrc = grab(/function unusedBurden\(t, e\)\{[\s\S]*?\n\}/),
    envFitSrc = grab(/function envFits\(e, req\)\{[\s\S]*?\n\}/), nounSrc = grab(/function bodyPlanNoun\(t, e\)\{[\s\S]*?\n\}/),
    genSrc = grab(/function generateFormName\(t, e, w, near\)\{[\s\S]*?\n\}/), matchSrc = grab(/function matchArchetype\(t, e\)\{[\s\S]*?\n\}/),
    classSrc = grab(/function classify\(t, envIn\)\{[\s\S]*?\n\}/);
  const geneLabels = eval(grab(/const GENE_LABELS = \[[\s\S]*?\];/).replace(/^const GENE_LABELS = /, "").replace(/;$/, ""));
  const archWin = {};
  new Function("window", readFileSync(archPath, "utf-8"))(archWin);
  const box = {};
  new Function("box", "ARCH", `
    const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
    const sigmoid = x => 1 / (1 + Math.exp(-x));
    ${physSrc} ${paramsSrc} ${ficonSrc}
    const NG = ${geneLabels.length}; const DRIFT_SCALE = 0;
    ${fitSrc} ${stepSrc}
    let _archLib = null, _archNamedMax = 1; const _archDist = []; const NOVEL_DEV_MIN = 0.18;
    ${libSrc} ${weightSrc} ${burdenSrc} ${envFitSrc} ${nounSrc} ${genSrc} ${matchSrc} ${classSrc}
    box.stepGeneration = stepGeneration; box.classify = classify; box.NG = NG;
  `)(box, archWin.ARCHETYPES);
  return box;
}

const OLD = loadWith(oldPath);
const NEW = loadWith(join(ROOT, "app", "archetypes.js"));
rmSync(tmp, { recursive: true, force: true });

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry32(31337);
const CLEAN = { toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };

const trans = new Map();
const before = new Map(), after = new Map();
for (let s = 0; s < N; s++) {
  const env = { ...BASE_ENV, ...CLEAN, temperature: rng(), predation: rng(), foodAbundance: rng(), foodHeight: rng(), light: rng(), water: rng() };
  if (rng() < 0.5) {
    const pool = [...STRESSORS, "oxygen"], st = pool[Math.floor(rng() * pool.length)];
    if (st === "oxygen") env.oxygen = 0.1 + 0.4 * rng(); else env[st] = 0.5 + 0.5 * rng();
  }
  let g = new Array(OLD.NG).fill(0.5);
  for (let i = 0; i < 300; i++) g = OLD.stepGeneration(g, env, null);
  const oldName = OLD.classify(g, env).n;
  let g2 = new Array(NEW.NG).fill(0.5);
  for (let i = 0; i < 300; i++) g2 = NEW.stepGeneration(g2, env, null);
  const newName = NEW.classify(g2, env).n;
  before.set(oldName, (before.get(oldName) ?? 0) + 1);
  after.set(newName, (after.get(newName) ?? 0) + 1);
  if (oldName !== newName) { const key = `${oldName} -> ${newName}`; trans.set(key, (trans.get(key) ?? 0) + 1); }
}

console.log(`\n${N} Umwelten, ${REF} vs. Arbeitsstand, dieselbe RNG-Sequenz.\n`);
console.log("=== Formen, die Erreichbarkeit VERLIEREN (vorher -> nachher) ===");
const rows = [...before.keys()].map((n) => ({ n, b: before.get(n) ?? 0, a: after.get(n) ?? 0 }))
  .filter((r) => r.a < r.b).sort((x, y) => (y.b - y.a) - (x.b - x.a));
for (const r of rows.slice(0, 20)) {
  const relLoss = 100 * (r.b - r.a) / r.b;
  const flag = relLoss > 50 && r.b / N > 0.02 ? "  <-- PRÜFEN (>50% Verlust, war >2% haeufig)" : "";
  console.log(`  ${(100*r.b/N).toFixed(1).padStart(5)}% -> ${(100*r.a/N).toFixed(1).padStart(5)}%  ${r.n}${flag}`);
}
console.log("\n=== Häufigste Einzel-Übergänge ===");
for (const [k, c] of [...trans].sort((a, b) => b[1] - a[1]).slice(0, 20))
  console.log(`  ${String(c).padStart(4)}  ${k}`);
