// Erzeugt docs/rarity.json + die RARITY-Tabelle fuer app/index.html.
//
// WARUM ES DIESES WERKZEUG GIBT: docs/rarity.json trug bis 2026-08-10 den Vermerk
// "Quelle: scratchpad/rarity2.mjs" - ein Wegwerf-Skript, das nicht eingecheckt war und
// nicht mehr existiert. Die Datei war damit weder reproduzierbar noch nachfuehrbar, und
// sie ist entsprechend veraltet: gemessen (tools/research/random-diversity-sweep.mjs)
// standen 10 Formen auf "legendaer" (0 %), die im echten Schwarm 15-222x vorkamen
// (u. a. Hutpilz 7.4 %), waehrend 9 neuere Formen ueberhaupt nicht gelistet waren und
// still auf "haeufig" zurueckfielen. Jede Physik-Aenderung macht sie zusaetzlich schief.
//
// METHODIK-WECHSEL (2026-08-10): gemessen wird jetzt auf dem SCHWARM
// (world/population.ts, dieselbe SWARM-Konfiguration wie die Live-App), NICHT mehr auf
// der Mittelfeld-Konvergenz. Grund: die App laeuft seit Migrations-Stufe 4 (2026-07-29)
// auf dem Schwarm; docs/rarity.json ist dem nie gefolgt und mass weiterhin einen Motor,
// den das Spiel nicht mehr benutzt. Das ist kein Feinheits-Unterschied - Beispiel
// Hutpilz: Mittelfeld 0.06 % (waere "sehr selten"), echter Schwarm 7.4 % (einer der
// haeufigsten Funde ueberhaupt). Eine Raritaets-Anzeige, die dem Spieler "extrem selten"
// sagt, waehrend er die Form staendig findet, misst das Falsche.
//
// ZWEI SCHICHTEN (strukturell noetig, keine Doppelung):
//   A) 6 Kern-Regler frei gezogen, kein Stressor - was der Spieler ueber die Regler
//      allein erreicht.
//   B) wie A, aber IMMER mit EINEM aktiven Stressor (wie eine Einfluss-Karte ihn setzt,
//      Methodik aus tools/research/gap-sweep.mjs). Nur diese Schicht kann stressor-
//      gebundene Formen (Paket A: Salinenkrebs, Deinococcus, ...) ueberhaupt sehen -
//      in Schicht A waeren sie strukturell immer 0 % und faelschlich "extrem selten".
// Gewertet wird der BESSERE der beiden Wege: erreichbar ist erreichbar.
//
// Benannt wird wie im Spiel: die Cluster-Zentroide der selektionsgewichteten Population
// (readSwarm()-Technik), nicht ein Mittelwert-Punkt.
//
// Aufruf:  node tools/build-rarity.mjs [--samples=1500] [--write]
//   ohne --write nur Bericht + Diff gegen den Ist-Stand (Trockenlauf).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, BASE_ENV, STRESSORS, ROOT } from "./lib/app-core.mjs";
import { Population } from "../dist/world/population.js";
import { clusters, selectionWeights as popWeights } from "../dist/world/cluster.js";

const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split("=")[1] : d; };
const WRITE = argv.includes("--write");
const SAMPLES = +opt("samples", 1500);
const GENS = 300;

const core = loadAppCore("build-rarity");
const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const FORMS = archWin.ARCHETYPES.forms;

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// Dieselben Schwellen wie world/rarity.ts rarityTier(), nur mit den App-Schluesseln
// (app/index.html RARITY_META) statt der Anzeige-Labels.
const TIERS = [
  [0.15, "haeufig"], [0.05, "gelegentlich"], [0.02, "selten"], [0, "sehr-selten"],
];
const tierOf = (f) => { for (const [lo, t] of TIERS) if (f > lo || (lo === 0 && f > 0)) return t; return "legendaer"; };

// ---- Schwarm-Setup: exakt die Live-Konfiguration aus app/index.html --------
const html0 = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const SWARM = new Function(`${html0.match(/const SWARM = \{[\s\S]*?\n\};/)[0]}; return SWARM;`)();
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const SWARM_GENS = 250;   // wie tools/spectrum-check.mjs / coverage-check Schicht C
const LEVERS = ["temperature","predation","foodAbundance","foodHeight","light","water"];

/** Ein Schwarm-Lauf -> die Formen seiner Cluster-Zentroide (wie readSwarm() im Spiel). */
function formsOf(env, seed) {
  const pop = new Population({
    size: SWARM.N, numGenes: core.NG, mutationSd: SWARM.mutationSd, selPower: SWARM.selPower,
    recombProb: SWARM.recombProb, founderSpread: "uniform",
    competition: { axes: SWARM.niche, sigmaC: SWARM.sigmaC, sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter },
  }, seed >>> 0);
  for (let g = 0; g < SWARM_GENS; g++) pop.step(env, phys);
  const w = popWeights(pop.mean(), env, phys);
  const cl = clusters(pop.genomes, { radius: SWARM.radius, minFraction: SWARM.minFraction, weights: w });
  const pts = cl.length ? cl.map((c) => c.centroid) : [pop.mean()];
  const out = new Set();
  for (const t of pts) { const a = core.classify(t, env); if (!a.novel) out.add(a.form); }
  return out;
}

/** Eine Mess-Schicht: `withStressor` schaltet immer EINEN Stressor zu (Einfluss-Karte). */
function sweep(label, withStressor, samples, seed0) {
  const count = new Map();
  const rng = mulberry32(seed0);
  const t0 = Date.now();
  for (let s = 0; s < samples; s++) {
    const env = { ...BASE_ENV, toxicity:0, oxygen:1, salinity:0, uv:0, pressure:0,
      aridity:0, radiation:0, fire:0, frost:0, wind:0 };
    for (const l of LEVERS) env[l] = rng();
    if (withStressor) {
      const pool = [...STRESSORS, "oxygen"];
      const st = pool[Math.floor(rng() * pool.length)];
      if (st === "oxygen") env.oxygen = 0.1 + 0.4 * rng();
      else env[st] = 0.5 + 0.5 * rng();
    }
    for (const form of formsOf(env, (s + 1) * 2654435761 + seed0)) count.set(form, (count.get(form) || 0) + 1);
    if ((s + 1) % 100 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  ${label}: ${s+1}/${samples} (${el.toFixed(0)}s, ETA ${(el/(s+1)*(samples-s-1)).toFixed(0)}s) …   `);
    }
  }
  process.stdout.write(`\r  ${label}: ${samples} Schwarm-Laeufe fertig (${((Date.now()-t0)/1000).toFixed(0)}s).            \n`);
  return count;
}

const countA = sweep("Schicht A (nur Regler)", false, SAMPLES, 1);
const nA = SAMPLES;
const countB = sweep("Schicht B (mit Stressor)", true, SAMPLES, 777);

// ---- Zusammenfuehren: der bessere der beiden Wege zaehlt --------------------
const rows = FORMS.map((f) => {
  const fa = (countA.get(f.n) || 0) / nA;
  const fb = (countB.get(f.n) || 0) / SAMPLES;
  const frac = Math.max(fa, fb);
  return { name: f.n, kingdom: f.k, leverPct: +(fa*100).toFixed(3), stressPct: +(fb*100).toFixed(3),
           convergencePct: +(frac*100).toFixed(3), tier: tierOf(frac) };
}).sort((a,b) => b.convergencePct - a.convergencePct);

// ---- Bericht + Diff gegen den Ist-Stand in app/index.html ------------------
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const cur = {};
{
  const m = html.match(/const RARITY = \{[\s\S]*?\n\};/);
  for (const mm of m[0].matchAll(/"([^"]+)"\s*:\s*"([a-z-]+)"/g)) cur[mm[1]] = mm[2];
}
console.log(`\n${rows.length} Formen gemessen (je Schicht ${SAMPLES} Schwarm-Laeufe, N=${SWARM.N}, ${SWARM_GENS} Gen.).\n`);
let changed = 0, missing = 0;
console.log("Form                                 Regler%  Stress%   -> Stufe        (bisher)");
for (const r of rows) {
  const was = cur[r.name];
  const mark = was === undefined ? "  NEU (fehlte)" : (was !== r.tier ? `  <- war ${was}` : "");
  if (was === undefined) missing++; else if (was !== r.tier) changed++;
  if (mark) console.log(`${r.name.padEnd(36)} ${String(r.leverPct).padStart(6)}  ${String(r.stressPct).padStart(6)}   ${r.tier.padEnd(13)}${mark}`);
}
console.log(`\n  ${changed} Formen aendern ihre Stufe, ${missing} waren gar nicht gelistet.`);

if (WRITE) {
  const out = {
    _comment: "Raritaet je Form = Anteil der Umwelten, in denen der SCHWARM diese Form hervorbringt (world/population.ts, Live-SWARM-Konfiguration, Cluster-Zentroide wie readSwarm() im Spiel). METHODIK-WECHSEL 2026-08-10: vorher Mittelfeld-Konvergenz - die App laeuft aber seit Migrations-Stufe 4 auf dem Schwarm, die alte Zahl mass einen Motor, den das Spiel nicht mehr benutzt (Beispiel Hutpilz: Mittelfeld 0.06 %, Schwarm 7.4 %). ZWEI Schichten, s. tools/build-rarity.mjs: (A) nur die 6 Kern-Regler; (B) zusaetzlich immer EIN aktiver Stressor, wie ihn eine Einfluss-Karte setzt - nur so sind stressor-gebundene Formen ueberhaupt sichtbar. Gewertet wird der bessere der beiden Wege. 0 % = im Sweep nie aufgetreten (extrem selten). Erzeugt mit: node tools/build-rarity.mjs --write",
    generatedAt: new Date().toISOString().slice(0, 10),
    samplesPerLayer: SAMPLES, swarmN: SWARM.N, gens: SWARM_GENS,
    forms: rows,
  };
  writeFileSync(join(ROOT, "docs", "rarity.json"), JSON.stringify(out, null, 1) + "\n");
  console.log("\ndocs/rarity.json geschrieben.");

  // RARITY-Tabelle fuer app/index.html neu setzen (nur der Objekt-Rumpf).
  const byTier = {};
  for (const r of rows) (byTier[r.tier] ||= []).push(r.name);
  const order = ["haeufig","gelegentlich","selten","sehr-selten","legendaer"];
  const body = order.filter(t => byTier[t]).map(t =>
    "  " + byTier[t].map(n => `${JSON.stringify(n)}:${JSON.stringify(t)}`).join(",")
  ).join(",\n");
  const block = `const RARITY = {\n${body},\n};`;
  const html2 = html.replace(/const RARITY = \{[\s\S]*?\n\};/, block);
  writeFileSync(join(ROOT, "app", "index.html"), html2);
  console.log("app/index.html: RARITY-Tabelle aktualisiert.");
}
