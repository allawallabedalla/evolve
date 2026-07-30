// Orakel-Pruefstand auf VERTEILUNGS-Metrik (Migrations-Stufe 6, BACKLOG.md Punkt 2;
// docs/engine-forschungsergebnis.md Abschnitt 6.4, Stufe 6).
//
// ============================================================================
// WAS HIER GEMESSEN WIRD - UND WARUM ES NICHT MEHR DAS ALTE MASS IST
// ============================================================================
// Bis Migrations-Stufe 3 war das Python-Orakel das DESTILLATIONS-ZIEL: training/fit.ts
// suchte Engine-Parameter, deren Mittelwert-Trajektorie der Orakel-Mittelwert-Trajektorie
// moeglichst nahe kam (`validityTest` = Pro-Gen-MAE auf zurueckgehaltenen Szenarien).
// Seit Stufe 4 laeuft die Live-App auf einem echten Populations-Schwarm. Damit ist das
// Ziel eine multimodale VERTEILUNG und das alte Surrogat ein MITTELWERT-PUNKT - und eine
// multimodale Verteilung laesst sich nicht in ihren Mittelwert destillieren. `validityTest`
// misst seitdem nichts, was fuer das produktive System aussagekraeftig waere.
//
// Die neue Frage (Forschungsdokument, "Ist das Zwei-Motoren-Prinzip noch richtig?"):
//   Erzeugt der Browser-Schwarm mit N=200 dasselbe Arten-Frequenzspektrum
//   wie ein Orakel-Schwarm mit sehr grossem N?
// Das ist ein KONVERGENZ-IN-N-Test, kein Distillations-Test. Er kann zwei verschiedene
// Fehler finden: (a) N=200 ist zu klein - die endliche Population verzerrt das Spektrum
// systematisch; (b) eine der beiden Implementierungen (TypeScript world/population.ts vs.
// Python oracle/reference_model.py run_swarm_once) rechnet etwas anderes als die andere.
//
// Drei Kennzahlen, exakt die aus dem Forschungsdokument (Mathematik in tools/lib/spectrum.mjs):
//   1. Jensen-Shannon-Divergenz ueber die Formhaeufigkeiten  -> Zielkriterium < 0.15
//   2. Abweichung der mittleren Clusterzahl
//   3. Rangkorrelation der Raritaet (Spearman ueber die Formhaeufigkeiten)
//
// "Raritaet" ist hier die Haeufigkeit im Spektrum selbst — stimmen beide Seiten darin
// ueberein, WELCHE Formen haeufig und welche selten sind? BEWUSST NICHT die vorhandene
// Raritaets-Logik: world/rarity.ts misst etwas anderes (Anteil ZUFAELLIGER Umwelten, in
// denen eine Form entsteht) mit zwei Bestandteilen, die hier nicht passen — `formKey` aus
// world/describe.ts (die alte Kaskade von vor Stufe 2, nicht der kanonische Matcher) und
// eine Population OHNE Konkurrenz-Kernel. Fuer die Orakel-Seite waere ihr Sweep (140
// Umwelten) bei N=2000 ausserdem um Groessenordnungen zu teuer. docs/rarity.json ist ein
// eingefrorenes Mittelfeld-Gitter-Ergebnis fuers Genbuch-Unlock, ebenfalls kein Mass fuer
// diesen Vergleich.
//
// ============================================================================
// KEIN GATE - DIAGNOSE (Praezedenz: tools/ablation-check.mjs)
// ============================================================================
// Die Orakel-Seite ist teuer: der Konkurrenz-Kernel ist O(N^2) je Generation, in reinem
// Python (kein numpy in dieser Umgebung). GEMESSEN, nicht geschaetzt: 170-212 s je Lauf bei
// N=2000 x 250 Generationen, 55.8 min Wanduhr fuer 55 Laeufe auf 3 Prozessen, 23.3 MB
// Referenzdatei. Die Node-Seite braucht danach ~40 s (Browser-Schwarm) + ~3 min (Clustern
// und Klassifizieren der 110 000 Orakel-Individuen). Das ist kein CI-Gate; dieses Skript
// beendet sich immer mit 0 und druckt ein Urteil.
// Laufrhythmus: nach jeder Aenderung an der PopulationConfig der App (app/index.html SWARM),
// an world/population.ts, an physics.json oder an app/archetypes.js - also genau dann, wenn
// sich die Verteilung selbst aendern KANN. Nicht bei UI-/Text-Arbeit.
//
// Zwei Stufen, damit der haeufige Fall billig bleibt:
//   node tools/spectrum-check.mjs            -> nur Browser-Seite (~40 s), Orakel-Datei
//                                               wird gelesen falls vorhanden
//   node tools/spectrum-check.mjs --oracle    -> erzeugt die Orakel-Referenz neu (~56 min)
//   node tools/spectrum-check.mjs --nsweep    -> zusaetzlich N-Konvergenz INNERHALB der
//                                               TS-Implementierung (N=400/800, ~10 min)
// Optionen: --workers <n> (Python-Prozesse, Default 3), --oracle-file <pfad>
//
// Aufruf ueber npm:  npm run spectrum-check   /   npm run oracle-swarm
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";
import { clusters, selectionWeights } from "../dist/world/cluster.js";
// Zielschwelle und Score_C-Definition kommen aus der EINEN Stelle, an der sie
// begruendet sind (training/fidelity-config.ts) — nicht als zweite Kopie hier.
import { MIN_SCORE_C, TARGET_JSD, scoreCFromJsd } from "../dist/training/fidelity-config.js";
import { loadAppCore } from "./lib/app-core.mjs";
import {
  NOVEL_LABEL, clusterCountDelta, jsDivergence, mean, poolSpectra, spearman,
  spectrumOfRun, unionLabels,
} from "./lib/spectrum.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;

// ---------------------------------------------------------------------------
// DIE TESTUMWELTEN
// ---------------------------------------------------------------------------
// Die 11 Biom-Presets der Stufe-1/3-Abnahme (tools/research/{proto,niche-swarm-check}.mjs).
// BEGRUENDUNG gegen die offiziellen scenarios.json-Testszenarien (die andere naheliegende
// Wahl - sie werden schon von Python UND Node gelesen, waeren also billiger):
//  (a) Nischen-Abdeckung. scenarios.json hat kein tiefes Wasser (max water 0.95 bei
//      "Sonniger Sumpf", "Dunkle Tiefe" 0.8) und wurde fuer die MITTELWERT-Trajektorie
//      gebaut. Damit fehlen genau die Achsen, auf denen der Schwarm seine Vielfalt
//      entfaltet: aquatische Jagd (aquaticWaterFloor), Filtrieren, Biolumineszenz im
//      Dunkeln. Ein Spektrum-Vergleich, der die halbe Formen-Bibliothek nie erreicht,
//      prueft die Verteilung nicht.
//  (b) Vergleichbarkeit. N=200 wurde in Stufe 4 GEGEN DIESE 11 Biome gewaehlt (damals
//      1.42 Cluster/Lauf, 23 Formen, Koexistenz in 11/11 - N=150 fiel hier durch). Die
//      Frage "ist N=200 gross genug?" gehoert auf denselben Pruefstand, auf dem die
//      Antwort "N=200" entstanden ist.
//      NEBENBEFUND dieser Stufe, hier festgehalten damit die Zahl nicht falsch zitiert
//      wird: dieselbe Messung liefert heute 1.35 Cluster/Lauf, 23 Formen, Koexistenz in
//      10/11 (das unveraenderte tools/research/niche-swarm-check.mjs reproduziert das).
//      Ursache ist NICHT diese Stufe, sondern der Gliedmassen-Traktions-Term aus Stufe 3.5
//      (AXIS-20), der nach der Stufe-4-Messung dazukam: mit `tractionYield: 0` in einer
//      Kopie von physics.json kommen exakt die alten 1.42 / 23 / 11 zurueck (gemessen).
//      Verlorene Koexistenz-Umwelt ist "Hitze-Duerre" - genau die Ziel-Nische des Terms,
//      wo er jetzt einen klaren Sieger erzeugt. Das Stufe-3-Kriterium (>= 1.3 Cluster/Lauf,
//      Koexistenz in >= 5 Biomen) bleibt damit erfuellt.
// Die Liste steht bewusst NUR HIER: das Python-Skript bekommt sie in der Auftragsdatei
// gereicht (oracle/swarm_reference.py ist ein reiner Rechenknecht) - so gibt es keine
// zweite, driftende Kopie in einer anderen Sprache. Die inline-Kopien in
// tools/research/proto.mjs und niche-swarm-check.mjs bleiben unangetastet: das sind
// abgenommene Messskripte mit veroeffentlichten Zahlen, die nicht nachtraeglich an eine
// gemeinsame Quelle gehaengt werden sollten.
const BIOMES = [
  ["Eiszeit", { temperature: .08, predation: .15, foodAbundance: .55, foodHeight: .15, light: .4, water: .5 }],
  ["Räuberland", { temperature: .5, predation: .9, foodAbundance: .8, foodHeight: .15, light: .5, water: .6 }],
  ["Reiche Kronen", { temperature: .5, predation: .1, foodAbundance: .9, foodHeight: .85, light: .5, water: .7 }],
  ["Hitze-Dürre", { temperature: .92, predation: .1, foodAbundance: .3, foodHeight: .1, light: .9, water: .15 }],
  ["Sonniger Sumpf", { temperature: .55, predation: .1, foodAbundance: .18, foodHeight: .1, light: .95, water: .95 }],
  ["Dichter Wald", { temperature: .5, predation: .2, foodAbundance: .2, foodHeight: .7, light: .9, water: .85 }],
  ["Moderwald", { temperature: .5, predation: .5, foodAbundance: .05, foodHeight: .05, light: .05, water: .12 }],
  ["Trüber See", { temperature: .55, predation: .55, foodAbundance: .28, foodHeight: .05, light: .1, water: .6 }],
  ["Offenes Meer", { temperature: .5, predation: .5, foodAbundance: .65, foodHeight: .3, light: .5, water: .98 }],
  ["Lichtlose Tiefsee", { temperature: .3, predation: .5, foodAbundance: .55, foodHeight: .1, light: .03, water: .95 }],
  ["Default-Regler", { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2, light: .5, water: .6 }],
];

// ---------------------------------------------------------------------------
// DIE ZU PRUEFENDE KONFIGURATION
// ---------------------------------------------------------------------------
// Zeichen fuer Zeichen die Live-Konfiguration aus app/index.html (SWARM-Objekt, seit
// Migrations-Stufe 4 von echten Spielern erlebt). Diese Seite wird NICHT kalibriert -
// sie ist der Prueflings-Zustand. Kalibriert werden darf, wenn das Kriterium reisst, nur
// die ORAKEL-Seite (ORACLE.size usw.).
const SWARM = {
  N: 200, gens: 250, mutationSd: 0.05, selPower: 2.0, recombProb: 0.5,
  niche: [1, 2, 5, 6, 4, 8, 9, 15], sigmaC: 0.22, sigmaK: 50, kCenter: 0.5,
  radius: 0.35, minFraction: 0.08,
};
// Orakel-Seite: identische Dynamik, nur gross. N=2000 ist der Wert aus der
// Migrationsplan-Tabelle - hier NICHT uebernommen, weil er dort steht, sondern weil die
// Rechenzeit gemessen dafuer reicht (s. Kopf) UND die TS-interne N-Konvergenz zeigt, dass
// das Spektrum oberhalb weniger hundert Individuen praktisch stillsteht (--nsweep).
const ORACLE = { size: 2000, seeds: 5 };
const SEEDS_PER_BIOME = 5;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const ORACLE_FILE = join(ROOT, opt("--oracle-file", ".swarm-oracle.json"));
const JOB_FILE = join(ROOT, ".swarm-oracle-job.json");

const core = loadAppCore("spectrum-check");

/** Ein Browser-Lauf: produktive Population-Klasse, exakt SWARM-Konfiguration. */
function browserRun(env, seed, size) {
  const pop = new Population({
    size, numGenes: NG, mutationSd: SWARM.mutationSd, selPower: SWARM.selPower,
    recombProb: SWARM.recombProb, founderSpread: "uniform",
    competition: { axes: SWARM.niche, sigmaC: SWARM.sigmaC, sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter },
  }, seed);
  for (let g = 0; g < SWARM.gens; g++) pop.step(env, phys);
  return pop.genomes;
}

/**
 * Auswertung EINER End-Population: Individuen-Spektrum + Cluster-Spektrum.
 * Beide Messketten sind die produktiven: `clusters()` + `selectionWeights()` aus
 * world/cluster.ts (Stufe 1) und `classify()`/`matchArchetype()` aus app/index.html
 * (Stufe 2, ueber tools/lib/app-core.mjs geladen - dieselbe Technik wie app-parity).
 * KEINE dritte Kopie einer Formklassifikation (tools/research/classify.mjs ist die ALTE
 * Kaskade von vor Stufe 2 und waere fuer diesen Vergleich der falsche Klassifikator).
 */
function evaluate(genomes, env) {
  const w = selectionWeights(meanOf(genomes), env, phys);
  const cl = clusters(genomes, { radius: SWARM.radius, minFraction: SWARM.minFraction, weights: w });
  const clusterSpec = new Map();
  let denom = 0;
  for (const c of cl) denom += c.fraction;
  for (const c of cl) {
    const a = core.classify(c.centroid, env);
    const label = a.novel ? NOVEL_LABEL : a.n;
    clusterSpec.set(label, (clusterSpec.get(label) ?? 0) + c.fraction / (denom || 1));
  }
  return { spec: spectrumOfRun(genomes, env, core.classify), clusterSpec, nClusters: cl.length };
}

function meanOf(genomes) {
  const G = genomes[0].length;
  const m = new Array(G).fill(0);
  for (const g of genomes) for (let i = 0; i < G; i++) m[i] += g[i];
  return m.map((s) => s / genomes.length);
}

/** Rauschboden: dieselbe Seite, disjunkte Seed-Haelften. Sagt, wie viel der gemessenen
 *  Divergenz reine Stichprobenstreuung ist - ohne diese Zahl ist jedes JSD unlesbar. */
function noiseFloor(runs) {
  const a = poolSpectra(runs.filter((r) => r.seedIndex % 2 === 0).map((r) => r.spec));
  const b = poolSpectra(runs.filter((r) => r.seedIndex % 2 === 1).map((r) => r.spec));
  return a.size && b.size ? jsDivergence(a, b) : NaN;
}

// ---------------------------------------------------------------------------
// 1) Browser-Seite
// ---------------------------------------------------------------------------
console.log("=".repeat(78));
console.log("Migrations-Stufe 6 — Orakel-Pruefstand: Verteilungs-Konvergenz in N");
console.log("=".repeat(78));
console.log(`Testumwelten:   ${BIOMES.length} Biom-Presets x ${SEEDS_PER_BIOME} Laeufe, ${SWARM.gens} Generationen`);
console.log(`Browser-Seite:  world/population.ts, N=${SWARM.N} (app/index.html SWARM, unveraendert)`);
console.log(`Orakel-Seite:   oracle/reference_model.py run_swarm_once, N=${ORACLE.size}`);
console.log(`Klassifikator:  matchArchetype() aus app/index.html + app/archetypes.js (kanonisch seit Stufe 2)`);
console.log(`Kernel:         axes=${JSON.stringify(SWARM.niche)} sigmaC=${SWARM.sigmaC} sigmaK=${SWARM.sigmaK} kCenter=${SWARM.kCenter}, founderSpread=uniform\n`);

function runBrowserSide(size) {
  const t0 = performance.now();
  const runs = [];
  for (const [name, env] of BIOMES) {
    for (let r = 0; r < SEEDS_PER_BIOME; r++) {
      // Seed-Formel der Stufe-3-Abnahme (tools/research/niche-swarm-check.mjs), bewusst
      // uebernommen — dieselben Seeds, also dieselben Zahlen wie dort. Sie haengt NUR am
      // Lauf-Index: alle 11 Biome starten je Lauf von denselben Gruender-Genomen. Die
      // Orakel-Seite streut ueber Umwelt UND Lauf (oracle/swarm_reference.py). Diese
      // Asymmetrie ist harmlos, weil hier keine gepaarte Statistik gerechnet wird: beide
      // Seiten liefern je Biom eine Stichprobe von Endzustaenden, und wie viel Streuung in
      // der jeweiligen Stichprobe steckt, wird mit dem Rauschboden BEIDER Seiten getrennt
      // gemessen und berichtet (s. noiseFloor()). Die RNG-Stroeme sind zwischen TypeScript
      // (mulberry32) und Python (Mersenne-Twister) ohnehin unvergleichbar.
      const seed = ((r + 1) * 2654435761) >>> 0;
      runs.push({ name, env, seedIndex: r, ...evaluate(browserRun(env, seed, size), env) });
    }
  }
  return { runs, seconds: (performance.now() - t0) / 1000 };
}

const browser = runBrowserSide(SWARM.N);
const bSpec = poolSpectra(browser.runs.map((r) => r.spec));
const bClusterSpec = poolSpectra(browser.runs.map((r) => r.clusterSpec));
const bCl = browser.runs.map((r) => r.nClusters);
console.log(`Browser-Schwarm: ${browser.runs.length} Laeufe in ${browser.seconds.toFixed(0)} s, ` +
  `${bSpec.size} Formen, ${mean(bCl).toFixed(2)} Cluster/Lauf`);

// ---------------------------------------------------------------------------
// 2) Orakel-Seite (teuer, optional neu erzeugt)
// ---------------------------------------------------------------------------
if (flag("--oracle")) {
  const job = {
    _comment: "Auftragsdatei fuer oracle/swarm_reference.py, erzeugt von tools/spectrum-check.mjs.",
    generations: SWARM.gens,
    seeds: ORACLE.seeds,
    baseSeed: 12345,
    config: {
      size: ORACLE.size, mutationSd: SWARM.mutationSd, selPower: SWARM.selPower,
      recombProb: SWARM.recombProb, niche: SWARM.niche, sigmaC: SWARM.sigmaC,
      sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter, founderSpread: "uniform",
    },
    envs: BIOMES.map(([name, env]) => ({ name, env })),
  };
  writeFileSync(JOB_FILE, JSON.stringify(job, null, 1), "utf-8");
  console.log(`\nOrakel-Lauf startet (das dauert; gemessen ~56 min bei N=${ORACLE.size} auf 3 Prozessen) ...`);
  execFileSync("python3", [join(ROOT, "oracle", "swarm_reference.py"), JOB_FILE, ORACLE_FILE,
    "--workers", String(opt("--workers", "3"))], { stdio: "inherit" });
}

if (!existsSync(ORACLE_FILE)) {
  console.log(`\nKeine Orakel-Referenz gefunden (${ORACLE_FILE}).`);
  console.log("Browser-Seite allein gemessen; fuer den eigentlichen Vergleich:");
  console.log("   npm run oracle-swarm        (erzeugt die Referenz, ~56 min)\n");
  console.log("### Browser-Spektrum (Anteil der Individuen)");
  for (const [k, v] of [...bSpec].sort((a, b) => b[1] - a[1]))
    console.log(`   ${(100 * v).toFixed(2).padStart(6)}%  ${k}`);
  process.exit(0);
}

const ref = JSON.parse(readFileSync(ORACLE_FILE, "utf-8"));
const envByName = new Map(BIOMES);
const oRuns = ref.runs.map((r) => {
  const env = envByName.get(r.name);
  if (!env) throw new Error(`Orakel-Referenz enthaelt unbekannte Umwelt "${r.name}" — Referenz veraltet?`);
  return { name: r.name, env, seedIndex: r.seedIndex, ...evaluate(r.genomes, env) };
});
const oSpec = poolSpectra(oRuns.map((r) => r.spec));
const oClusterSpec = poolSpectra(oRuns.map((r) => r.clusterSpec));
const oCl = oRuns.map((r) => r.nClusters);
console.log(`Orakel-Schwarm:  ${oRuns.length} Laeufe (N=${ref.config.size}, erzeugt ${ref.generatedAt}, ` +
  `${ref.wallClockMinutes} min), ${oSpec.size} Formen, ${mean(oCl).toFixed(2)} Cluster/Lauf`);

// Konfigurations-Abgleich: eine veraltete Referenz wuerde stillschweigend etwas anderes
// vergleichen als die heutige App. Lieber laut werden als falsch messen.
const mism = [];
for (const [k, v] of Object.entries({
  mutationSd: SWARM.mutationSd, selPower: SWARM.selPower, recombProb: SWARM.recombProb,
  sigmaC: SWARM.sigmaC, sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter,
})) if (ref.config[k] !== v) mism.push(`${k}: Orakel ${ref.config[k]} vs. App ${v}`);
if (JSON.stringify(ref.config.niche) !== JSON.stringify(SWARM.niche)) mism.push("niche-Achsen weichen ab");
if (ref.generations !== SWARM.gens) mism.push(`generations: Orakel ${ref.generations} vs. App ${SWARM.gens}`);
// Abdeckung: eine Referenz, die nur einen Teil der Testumwelten enthaelt, liefert ein
// still falsches Gesamt-JSD (die fehlenden Biome zaehlen mit maximaler Divergenz 0.5).
for (const [name] of BIOMES) {
  const n = oRuns.filter((r) => r.name === name).length;
  if (n !== ORACLE.seeds) mism.push(`Umwelt "${name}": ${n} Orakel-Laeufe statt ${ORACLE.seeds}`);
}
if (mism.length) {
  console.log("\nWARNUNG: Orakel-Referenz passt NICHT zur heutigen Konfiguration:");
  for (const m of mism) console.log(`   - ${m}`);
  console.log("   -> npm run oracle-swarm neu laufen lassen, sonst ist der Vergleich wertlos.");
}

// ---------------------------------------------------------------------------
// 3) Die drei Kennzahlen
// ---------------------------------------------------------------------------
const jsd = jsDivergence(bSpec, oSpec);
const jsdCluster = jsDivergence(bClusterSpec, oClusterSpec);
const rho = spearman(bSpec, oSpec);
const dCl = clusterCountDelta(bCl, oCl);
const bNoise = noiseFloor(browser.runs);
const oNoise = noiseFloor(oRuns);

console.log("\n### Formhaeufigkeits-Spektrum (Anteil der Individuen der End-Population)");
console.log(`   ${"Form".padEnd(34)}${"Browser".padStart(9)}${"Orakel".padStart(9)}${"Delta".padStart(9)}`);
const labels = unionLabels(bSpec, oSpec);
for (const l of labels.slice(0, 20)) {
  const b = 100 * (bSpec.get(l) ?? 0), o = 100 * (oSpec.get(l) ?? 0);
  console.log(`   ${l.padEnd(34)}${b.toFixed(2).padStart(8)}%${o.toFixed(2).padStart(8)}%${(o - b).toFixed(2).padStart(9)}`);
}
if (labels.length > 20) {
  let restB = 0, restO = 0;
  for (const l of labels.slice(20)) { restB += bSpec.get(l) ?? 0; restO += oSpec.get(l) ?? 0; }
  console.log(`   ${`(${labels.length - 20} weitere Formen)`.padEnd(34)}${(100 * restB).toFixed(2).padStart(8)}%${(100 * restO).toFixed(2).padStart(8)}%`);
}

console.log("\n### Pro Biom (JSD der Individuen-Spektren)");
const perBiome = [];
for (const [name] of BIOMES) {
  const bRuns = browser.runs.filter((r) => r.name === name);
  const oRunsB = oRuns.filter((r) => r.name === name);
  const j = jsDivergence(poolSpectra(bRuns.map((r) => r.spec)), poolSpectra(oRunsB.map((r) => r.spec)));
  // Rauschboden derselben Umwelt: disjunkte Seed-Haelften JE SEITE. Muss dieselbe
  // Rechenweise sein wie die Zahl, die er einordnen soll — sonst vergleicht man Aepfel
  // mit Birnen (der gepoolte Rauschboden weiter unten hat 11x so viele Laeufe).
  const nfB = noiseFloor(bRuns);
  const nfO = noiseFloor(oRunsB);
  perBiome.push({ name, j, nfB, nfO });
  console.log(`   ${name.padEnd(20)} JSD ${j.toFixed(4)}   (Rauschboden ${nfB.toFixed(4)} / ${nfO.toFixed(4)})` +
    `   Cluster/Lauf ${mean(bRuns.map((r) => r.nClusters)).toFixed(2)} vs ${mean(oRunsB.map((r) => r.nClusters)).toFixed(2)}`);
}
const perBiomeMean = mean(perBiome.map((p) => p.j));
const worst = perBiome.reduce((a, c) => (c.j > a.j ? c : a));

if (flag("--nsweep")) {
  console.log("\n### N-Konvergenz INNERHALB der TS-Implementierung (Kontrolle)");
  for (const n of [400, 800]) {
    const s = runBrowserSide(n);
    const sp = poolSpectra(s.runs.map((r) => r.spec));
    console.log(`   N=${String(n).padStart(4)}: JSD(N=200, N=${n}) = ${jsDivergence(bSpec, sp).toFixed(4)}` +
      `   Cluster/Lauf ${mean(s.runs.map((r) => r.nClusters)).toFixed(2)}   (${s.seconds.toFixed(0)} s)`);
  }
}

const bNovel = bSpec.get(NOVEL_LABEL) ?? 0;
const oNovel = oSpec.get(NOVEL_LABEL) ?? 0;

console.log("\n### Kennzahlen");
console.log(`   1) Jensen-Shannon-Divergenz (Basis 2, Individuen)`);
console.log(`      a) gepoolt ueber alle Testumwelten (Score_C-Grundlage): ${jsd.toFixed(4)}   [Ziel < ${TARGET_JSD}]`);
console.log(`         Rauschboden Browser (disjunkte Seed-Haelften):       ${bNoise.toFixed(4)}`);
console.log(`         Rauschboden Orakel  (disjunkte Seed-Haelften):       ${oNoise.toFixed(4)}`);
console.log(`      b) je Testumwelt gemittelt (strengere Lesart):          ${perBiomeMean.toFixed(4)}`);
console.log(`         Rauschboden dieser Lesart (Browser/Orakel):          ` +
  `${mean(perBiome.map((p) => p.nfB)).toFixed(4)} / ${mean(perBiome.map((p) => p.nfO)).toFixed(4)}`);
console.log(`      c) schlechteste Einzelumwelt: ${worst.j.toFixed(4)} (${worst.name})`);
console.log(`      d) Cluster-Zentroid-Spektren statt Individuen:          ${jsdCluster.toFixed(4)}`);
console.log(`   2) Mittlere Clusterzahl:  Browser ${mean(bCl).toFixed(2)}  Orakel ${mean(oCl).toFixed(2)}  Abweichung ${dCl.toFixed(2)}`);
console.log(`   3) Rangkorrelation der Raritaet (Spearman):          ${rho.toFixed(3)}`);
console.log(`      Neuform-Anteil (unbenannt):  Browser ${(100 * bNovel).toFixed(2)} %  Orakel ${(100 * oNovel).toFixed(2)} %`);

// Score_C fuer den Realitaetstreue-Loop (training/fidelity-config.ts, Backlog Punkt 9).
const scoreC = scoreCFromJsd(jsd);
console.log("\n### Schicht C des Realitaetstreue-Loops (training/fidelity-config.ts)");
console.log(`   Score_C = clamp01(1 - JSD_gepoolt) = ${scoreC.toFixed(4)}   [Mindestschwelle ${MIN_SCORE_C.toFixed(2)} = 1 - ${TARGET_JSD}]`);
console.log(`   (Grundlage ist 1a, nicht 1b: Begruendung in training/fidelity-config.ts bei scoreCFromJsd.)`);
console.log(`   Schicht C ${scoreC >= MIN_SCORE_C ? "besteht" : "reisst die Schwelle"}.` +
  " Diese Zahl gehoert nach tools/fidelity-config-check.mjs (CURRENT_JSD).");

console.log("\n### Urteil");
const pass = jsd < TARGET_JSD;
console.log(`   ${pass ? "OK" : "VERFEHLT"} — JS-Divergenz Browser-N=${SWARM.N} <-> Orakel-N=${ref.config.size} = ${jsd.toFixed(4)} ` +
  `(Ziel < ${TARGET_JSD})`);
if (pass) {
  console.log(`   Damit ist N=${SWARM.N} als Produktionsgroesse verteilungs-treu: der Browser-Schwarm`);
  console.log(`   trifft das Arten-Frequenzspektrum der Gross-N-Grenze, in einer zweiten,`);
  console.log(`   unabhaengigen Implementierung nachgerechnet.`);
  const strictOk = perBiomeMean < TARGET_JSD && worst.j < TARGET_JSD;
  console.log(`   Auch in den strengeren Lesarten erfuellt: ${strictOk ? "ja" : "NEIN"} — je Umwelt gemittelt ` +
    `${perBiomeMean.toFixed(4)}, schlechteste Einzelumwelt ${worst.j.toFixed(4)}.`);
} else {
  console.log(`   Kalibriert werden darf NUR die Orakel-Seite (ORACLE.size) bzw. muss der Befund`);
  console.log(`   ehrlich dokumentiert werden — die Browser-Konfiguration ist seit Stufe 3/3.5/4`);
  console.log(`   verankert und von Spielern erlebt.`);
}
console.log("\nHinweis: Diagnose, kein Pass/Fail-Gate (kein process.exit(1)) — Praezedenz");
console.log("tools/ablation-check.mjs. Laufrhythmus s. Kopfkommentar dieser Datei.");
