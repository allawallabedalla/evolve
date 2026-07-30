// Lebensraum-Messung: Trägt eine grobe Raum-Ebene über den 6 Reglern (unter Wasser /
// an Land / …)? Drei Messungen, kein Gate:
//   1) Formprofil je Raum — hat ein Raum ein eigenes Gesicht?
//   2) Abdeckung — wie viel des freien Regler-Würfels entspricht überhaupt einem
//      realen Lebensraum, und kostet eine Raum-Ebene erreichbare Formen?
//   3) Die 12 Presets — konvergiert jedes Biom auf etwas, das zu seinem Namen passt?
//
// Die Raum-Boxen unten sind ein VORSCHLAG (hand-gezogen aus realen Habitat-Spannen),
// keine eingecheckte Spielmechanik. Sie sind das Messobjekt, nicht das Ergebnis.
// Aufruf: node tools/research/room-sweep.mjs [Stichproben pro Raum=400]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, BASE_ENV, ROOT } from "../lib/app-core.mjs";

const core = loadAppCore("room-sweep");
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const rng = mulberry32(2026);
const U = (lo, hi) => lo + (hi - lo) * rng();

// Ein Raum = Spannen auf den 6 Reglern + die Stressoren, die real dazugehören
// (Tiefsee bringt Druck mit, Wüste Austrocknung, Polar Frost+Wind — heute kommen die
// ausschließlich über Einfluss-Karten).
const ROOMS = {
  "Offenes Meer":        () => ({ temperature:U(.2,.7),  predation:U(.2,.9), foodAbundance:U(.2,.9),  foodHeight:U(.05,.5), light:U(.3,.9),  water:U(.8,1),    salinity:U(.5,.9) }),
  "Tiefsee":             () => ({ temperature:U(.05,.35),predation:U(.3,.8), foodAbundance:U(.05,.5), foodHeight:U(.02,.2), light:U(0,.08),  water:U(.9,1),    salinity:U(.5,.9), pressure:U(.6,1) }),
  "Flachmeer / Riff":    () => ({ temperature:U(.4,.8),  predation:U(.1,.7), foodAbundance:U(.05,.6), foodHeight:U(.02,.3), light:U(.7,1),   water:U(.7,.95),  salinity:U(.4,.8) }),
  "Süßwasser / Tümpel":  () => ({ temperature:U(.2,.7),  predation:U(.05,.6),foodAbundance:U(.05,.6), foodHeight:U(.02,.3), light:U(.15,.9), water:U(.5,.8) }),
  "Sumpf / Ufer":        () => ({ temperature:U(.35,.8), predation:U(.1,.6), foodAbundance:U(.1,.7),  foodHeight:U(.05,.6), light:U(.4,1),   water:U(.45,.7) }),
  "Wald":                () => ({ temperature:U(.3,.7),  predation:U(.1,.6), foodAbundance:U(.2,.9),  foodHeight:U(.4,1),   light:U(.2,.9),  water:U(.25,.5) }),
  "Offenland / Steppe":  () => ({ temperature:U(.4,.8),  predation:U(.2,.9), foodAbundance:U(.15,.8), foodHeight:U(0,.3),   light:U(.6,1),   water:U(.15,.4) }),
  "Wüste":               () => ({ temperature:U(.7,1),   predation:U(.02,.4),foodAbundance:U(.02,.35),foodHeight:U(0,.25),  light:U(.8,1),   water:U(0,.2),    aridity:U(.5,1) }),
  "Polar / Hochgebirge": () => ({ temperature:U(0,.2),   predation:U(.05,.5),foodAbundance:U(.05,.6), foodHeight:U(0,.35),  light:U(.3,.9),  water:U(.15,.55), frost:U(.4,1), wind:U(.3,.9) }),
  "Boden / Höhle":       () => ({ temperature:U(.25,.6), predation:U(.1,.6), foodAbundance:U(.02,.5), foodHeight:U(0,.12),  light:U(0,.06),  water:U(.2,.55) }),
};
const CLEAN = { toxicity:0, oxygen:1, salinity:0, uv:0, pressure:0, aridity:0, radiation:0, fire:0, frost:0, wind:0 };
const converge = (partial) => {
  const env = { ...BASE_ENV, ...CLEAN, ...partial };
  let g = new Array(core.NG).fill(0.5);
  for (let i = 0; i < 300; i++) g = core.stepGeneration(g, env, null);
  return core.classify(g, env);
};

const N = +(process.argv[2] || 400);

// ---- 1) Formprofil je Raum --------------------------------------------------
console.log(`\n=== 1) Formprofil je Raum (${N} Umwelten pro Raum) ===`);
const inRooms = new Set();
for (const [name, gen] of Object.entries(ROOMS)) {
  const m = new Map();
  for (let i = 0; i < N; i++) { const n = converge(gen()).n; m.set(n, (m.get(n) ?? 0) + 1); inRooms.add(n); }
  const rows = [...m].sort((a, b) => b[1] - a[1]);
  console.log(`\n  ${name}  —  ${rows.length} Formen`);
  console.log("    " + rows.slice(0, 6).map(([n, c]) => `${n} ${Math.round(100*c/N)}%`).join(" · "));
}

// ---- 2) Abdeckung: was liegt in KEINEM Raum? --------------------------------
const BOX = {
  "Offenes Meer":       { temperature:[.2,.7],  foodHeight:[.05,.5], light:[.3,.9],  water:[.8,1] },
  "Tiefsee":            { temperature:[.05,.35],foodHeight:[.02,.2], light:[0,.08],  water:[.9,1] },
  "Flachmeer / Riff":   { temperature:[.4,.8],  foodHeight:[.02,.3], light:[.7,1],   water:[.7,.95] },
  "Süßwasser / Tümpel": { temperature:[.2,.7],  foodHeight:[.02,.3], light:[.15,.9], water:[.5,.8] },
  "Sumpf / Ufer":       { temperature:[.35,.8], foodHeight:[.05,.6], light:[.4,1],   water:[.45,.7] },
  "Wald":               { temperature:[.3,.7],  foodHeight:[.4,1],   light:[.2,.9],  water:[.25,.5] },
  "Offenland / Steppe": { temperature:[.4,.8],  foodHeight:[0,.3],   light:[.6,1],   water:[.15,.4] },
  "Wüste":              { temperature:[.7,1],   foodHeight:[0,.25],  light:[.8,1],   water:[0,.2] },
  "Polar / Hochgebirge":{ temperature:[0,.2],   foodHeight:[0,.35],  light:[.3,.9],  water:[.15,.55] },
  "Boden / Höhle":      { temperature:[.25,.6], foodHeight:[0,.12],  light:[0,.06],  water:[.2,.55] },
};
const inBox = (e, b) => Object.entries(b).every(([k, [lo, hi]]) => e[k] >= lo && e[k] <= hi);
const M = 6000, drin = [], drauss = [];
for (let i = 0; i < M; i++) {
  const e = { temperature:rng(), predation:rng(), foodAbundance:rng(), foodHeight:rng(), light:rng(), water:rng() };
  (Object.values(BOX).some((b) => inBox(e, b)) ? drin : drauss).push(e);
}
const formsOf = (arr, lim) => { const s = new Set(); for (const e of arr.slice(0, lim)) s.add(converge(e).n); return s; };
const A = formsOf(drin, 900), B = formsOf(drauss, 900);
console.log(`\n=== 2) Abdeckung des freien Regler-Würfels ===`);
console.log(`  in mindestens einem Raum: ${(100*drin.length/M).toFixed(1)} %   in KEINEM Raum: ${(100*drauss.length/M).toFixed(1)} %`);
console.log(`  Formen innerhalb: ${A.size}   ausserhalb: ${B.size}`);
console.log(`  nur ausserhalb erreichbar: ${[...B].filter((x) => !A.has(x)).join(", ") || "—"}`);
console.log(`  nur innerhalb erreichbar:  ${[...A].filter((x) => !B.has(x)).join(", ") || "—"}`);

// ---- 3) Passt jedes Preset zu seinem eigenen Namen? -------------------------
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const BIOMES = eval(html.match(/const BIOMES = \[[\s\S]*?\n\];/)[0].replace("const BIOMES = ", "").replace(/;$/, ""));
console.log(`\n=== 3) Die ${BIOMES.length} Presets: worauf konvergiert ein neutrales Genom? ===`);
for (const b of BIOMES) {
  const c = converge(b.env);
  console.log(`  ${b.n.padEnd(22)} (water ${b.env.water.toFixed(2)}) -> ${c.k.padEnd(8)} ${c.n}`);
}
