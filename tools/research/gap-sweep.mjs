// Lebensbaum-Lückenmessung: Welche Formen erreicht die Evolution im SPIELRAUM
// (6 Regler + die Stressor-Achsen, die Einfluss-Karten setzen)? Welche Gene laufen
// dabei hoch, ohne dass irgendein Prototyp sie benennt? Und wie stark besetzt die
// Selektion konkrete Nischen, die heute keinen eigenen Namen tragen?
//
// Kein Gate (kein process.exit(1)) — Referenzmessung hinter docs/lebensbaum-luecken.md.
// Regime: Mean-Field-Gradientenaufstieg vom Ur-Genom (0.5), deterministisch, ohne Drift
// — dieselbe Rechnung wie die Biom-Empfehlung in der App und wie reach.mjs Regime A.
// Deterministisch heißt hier: was von SELBST entsteht. Formen, die nur über Drift
// erreichbar sind, tauchen bewusst nicht auf (das ist die Aussage, nicht der Fehler).
//
// Aufruf: node tools/research/gap-sweep.mjs [Stichproben=3000]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, BASE_ENV, STRESSORS, ROOT } from "../lib/app-core.mjs";

const core = loadAppCore("gap-sweep");
const NG = core.NG;
const GENES = ["insulation","size","limbLength","metabolism","armor","photosynthesis","mobility","structure",
  "wing","biolum","detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense",
  "desicc","radres","fireres","frostres","windres","nfix"];
const G = {}; GENES.forEach((n, i) => (G[n] = i));

const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const FORMS = archWin.ARCHETYPES.forms;

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

const SAMPLES = +(process.argv[2] || 3000);
const GENS = 300;
const rng = mulberry32(31337);

// Eine Umwelt = die 6 Regler frei gezogen; in der Hälfte der Fälle zusätzlich EIN
// Stressor aktiv, so wie ihn eine Einfluss-Karte setzt (app/influences.js schaltet
// toxicity/salinity/uv/pressure/aridity/radiation/fire/frost/wind/oxygen).
const res = [];
for (let s = 0; s < SAMPLES; s++) {
  const env = { ...BASE_ENV,
    temperature: rng(), predation: rng(), foodAbundance: rng(),
    foodHeight: rng(), light: rng(), water: rng(),
    toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0,
    radiation: 0, fire: 0, frost: 0, wind: 0 };
  let stressor = "-";
  if (rng() < 0.5) {
    const pool = [...STRESSORS, "oxygen"];
    stressor = pool[Math.floor(rng() * pool.length)];
    if (stressor === "oxygen") env.oxygen = 0.1 + 0.4 * rng();
    else env[stressor] = 0.5 + 0.5 * rng();
  }
  let g = new Array(NG).fill(0.5);
  for (let i = 0; i < GENS; i++) g = core.stepGeneration(g, env, null);
  res.push({ env, stressor, g, name: core.classify(g, env).n });
}
const t = (r, k) => r.g[G[k]];

// ---- 1) Welche Formen entstehen von selbst, welche nicht? -------------------
const byName = new Map();
for (const r of res) byName.set(r.name, (byName.get(r.name) ?? 0) + 1);
console.log(`\n=== 1) Formverteilung (${SAMPLES} Umwelten, deterministisch) ===`);
for (const [n, c] of [...byName].sort((a, b) => b[1] - a[1]))
  console.log(`  ${(100*c/SAMPLES).toFixed(1).padStart(5)}%  ${String(c).padStart(4)}  ${n}`);
console.log(`\n  ${byName.size} von ${FORMS.length} Archetypen erreicht. NICHT erreicht (nur über Drift):`);
for (const f of FORMS) if (!byName.has(f.n)) console.log(`     ${f.k.padEnd(8)} ${f.n}`);

// ---- 2) Sichtbarkeit der Gene ----------------------------------------------
// „hoch" = > 0.6 im konvergierten Genom. „benannt von" = wie viele Prototypen das Gen
// überhaupt erwähnen. 0 = das Gen kann keine Form von einer anderen unterscheiden.
console.log(`\n=== 2) Gen-Sichtbarkeit: läuft hoch vs. wird benannt ===`);
for (let i = 0; i < GENES.length; i++) {
  const hi = res.filter((r) => r.g[i] > 0.6).length;
  const nf = FORMS.filter((f) => f.proto[GENES[i]] !== undefined).length;
  console.log(`  ${GENES[i].padEnd(15)} hoch in ${(100*hi/SAMPLES).toFixed(1).padStart(5)}%  | benannt von ${String(nf).padStart(2)} Formen${nf === 0 ? "   <-- UNSICHTBAR" : ""}`);
}

// ---- 3) Kandidaten-Nischen ohne eigenen Namen -------------------------------
// Jede Zeile = ein Bauplan, den es real gibt und den unsere Physik auch hervorbringt.
// Der Anteil ist die Erreichbarkeit; „heute" zeigt, wie er derzeit heißt.
const CANDIDATES = [
  ["Grabtier · Maulwurf",            (r) => t(r,"burrow")>.6 && t(r,"mobility")>.45 && t(r,"photosynthesis")<.4 && t(r,"size")<.55],
  ["Stickstoff-Mikrobe · Knöllchen", (r) => t(r,"nfix")>.6 && t(r,"size")<.2],
  ["Filtrierschwimmer · Bartenwal",  (r) => t(r,"filter")>.6 && t(r,"mobility")>.6 && r.env.water>.5 && t(r,"size")>.5],
  ["Filtrierer sessil · Muschel",    (r) => t(r,"filter")>.6 && t(r,"mobility")<.45 && r.env.water>.5],
  ["Meeressäuger · Wal/Robbe",       (r) => r.env.water>.6 && t(r,"insulation")>.6 && t(r,"size")>.55 && t(r,"limbLength")<.35 && t(r,"mobility")>.6],
  ["Frostwesen",                     (r) => t(r,"frostres")>.7],
  ["Sonnenpigment-Wesen (UV)",       (r) => t(r,"pigment")>.7],
  ["Giftzehrer · Chemotroph",        (r) => t(r,"detox")>.7],
  ["Strahlenfestes Wesen",           (r) => t(r,"radres")>.7],
  ["Salzwesen · Halophil",           (r) => t(r,"osmo")>.7],
  ["Leuchtpilz · Foxfire",           (r) => t(r,"biolum")>.6 && t(r,"mobility")<.4 && t(r,"photosynthesis")<.35],
  ["Filtrierendes Kleinstwesen · Krill", (r) => t(r,"filter")>.6 && t(r,"size")<.3 && r.env.water>.5],
  ["Laufvogel · flugloser Läufer",   (r) => t(r,"wing")<.2 && t(r,"limbLength")>.6 && t(r,"size")>.45 && t(r,"mobility")>.7],
  ["Tiefsee-Druckwesen",             (r) => t(r,"baro")>.6 && r.env.water>.5],
  ["Stachelhäuter · Seestern",       (r) => t(r,"armor")>.55 && t(r,"limbLength")>.5 && t(r,"mobility")<.5 && r.env.water>.5],
  ["Dürrewesen · Anhydrobiont",      (r) => t(r,"desicc")>.7 && t(r,"size")<.3],
  ["Feuerfestes Tier",               (r) => t(r,"fireres")>.7 && t(r,"mobility")>.5],
  ["Anaerobier",                     (r) => t(r,"oxyEff")>.6],
  ["Riesenpflanze · Mammutbaum",     (r) => t(r,"structure")>.75 && t(r,"size")>.8 && t(r,"photosynthesis")>.6],
  ["Tarnjäger · Lauerer",            (r) => t(r,"camo")>.6 && t(r,"mobility")>.45],
  ["Zwergstrauch",                   (r) => t(r,"size")<.25 && t(r,"photosynthesis")>.45 && t(r,"structure")>.7],
  ["Windflüchter · Krummholz",       (r) => t(r,"windres")>.7 && t(r,"photosynthesis")>.45],
  ["Knöllchen-Pflanze · Leguminose", (r) => t(r,"nfix")>.6 && t(r,"photosynthesis")>.45],
  ["Feuerpflanze · Pyrophyt",        (r) => t(r,"fireres")>.7 && t(r,"photosynthesis")>.45],
  ["Salzpflanze · Mangrove",         (r) => t(r,"osmo")>.7 && t(r,"photosynthesis")>.45],
  // --- unbesetzt: braucht neue Physik, nicht nur einen Prototyp ---
  ["Schlange · beinloses Landtier",  (r) => r.env.water<.4 && t(r,"limbLength")<.3 && t(r,"mobility")>.6 && t(r,"size")>.3],
  ["Seegras · Wasserpflanze",        (r) => r.env.water>.7 && t(r,"photosynthesis")>.5 && t(r,"mobility")<.4 && t(r,"structure")<.4 && t(r,"size")>.3],
  ["Kieselalge",                     (r) => t(r,"size")<.25 && t(r,"armor")>.45 && t(r,"photosynthesis")>.4],
  ["Sinneswesen",                    (r) => t(r,"sense")>.5],
];
console.log(`\n=== 3) Besetzung von Kandidaten-Nischen ohne eigenen Namen ===`);
for (const [n, f] of CANDIDATES) {
  const a = res.filter(f);
  const m = new Map();
  for (const r of a) m.set(r.name, (m.get(r.name) ?? 0) + 1);
  const top = [...m].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, c]) => `${k} ${Math.round(100*c/a.length)}%`);
  console.log(`  ${(100*a.length/SAMPLES).toFixed(1).padStart(5)}%  ${String(a.length).padStart(4)}  ${n.padEnd(36)} heute: ${a.length ? top.join(", ") : "—"}`);
}

// ---- 4) Greift ein Stressor wirklich auf sein Gen durch? --------------------
console.log(`\n=== 4) Stressor -> Mittelwert des zugehörigen Resistenz-Gens ===`);
const GENE_OF = { toxicity:"detox", salinity:"osmo", uv:"pigment", pressure:"baro", aridity:"desicc",
  radiation:"radres", fire:"fireres", frost:"frostres", wind:"windres", oxygen:"oxyEff" };
for (const [st, gname] of Object.entries(GENE_OF)) {
  const a = res.filter((r) => r.stressor === st);
  if (!a.length) continue;
  const m = a.reduce((s, r) => s + r.g[G[gname]], 0) / a.length;
  console.log(`  ${st.padEnd(10)} -> ${gname.padEnd(9)} Mittel ${m.toFixed(2)}  (n=${a.length})`);
}
