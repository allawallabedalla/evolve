// coverage-check — Schritt 3.1 des Artenkatalog-Plans (docs/artenkatalog-plan.md,
// Phase 3 · BACKLOG Punkt 12).
//
// ============================================================================
// DIE FRAGE
// ============================================================================
// Der Katalog (1.4) legt 20.178 reale Arten in den 25-D-Genraum. Damit ist zum
// ersten Mal messbar, was die Vision aus Punkt 12 behauptet: „alle Lebewesen sollen
// abgebildet und ERREICHBAR sein". Erreichbar heisst hier genau eine Sache:
//
//   Gibt es eine Umwelt, in der die EVOLUTIONS-ENGINE ein Genom hervorbringt, dessen
//   `nearestReal()` diese Art als naechste Art ausweist?
//
// Das ist NICHT dieselbe Frage wie „wo liegt die Art im Genraum" (das beantwortet die
// Platzierungs-Pipeline aus 1.2/1.3) und NICHT dieselbe wie „ist die Art von ihren
// Nachbarn unterscheidbar" (das ist der Zwillings-Befund aus 1.4). Diese drei Fragen
// werden hier bewusst getrennt gehalten und getrennt berichtet.
//
// ============================================================================
// DIE DECKE, DIE NICHT DIE ENGINE ZU VERANTWORTEN HAT
// ============================================================================
// `nearestReal()` sucht das Minimum ueber die Eintraege einer Bauplan-Gruppe und
// vergleicht mit `<` (strikt). Unter Arten mit BITGLEICH demselben Genom kann deshalb
// immer nur die ERSTE in Sortier-Reihenfolge gewinnen — egal, welches Genom die Engine
// erzeugt. Der Zwillings-Befund aus 1.4 (96,6 % der Arten haben einen genom-identischen
// Zwilling, nur 692 unterscheidbare Punkte) ist damit eine harte Obergrenze fuer jede
// namensbasierte Abdeckungszahl: hoechstens 692 der 20.178 Arten (3,4 %) koennen ueber-
// haupt jemals angezeigt werden. Diese Decke ist eine Folge der duennen Merkmalslage
// (Plan 5a), nicht der Engine — sie wird hier gemessen und ausgewiesen, aber sie darf
// nicht als „Lueckenreport der Engine" gelesen werden.
//
// Deshalb berichtet dieses Werkzeug DREI ineinander liegende Zahlen statt einer:
//
//   (1) Arten in erreichten BAUPLAN-GRUPPEN   — schwaechste Lesart: die Engine kommt in
//       die Nachbarschaft dieser Art (ihre Gruppe entsteht), aber vielleicht nicht an
//       ihren Punkt.
//   (2) Arten an erreichten GENOM-PUNKTEN     — die eigentliche Abdeckungszahl: ein von
//       der Engine erreichtes Genom laesst genau diesen Katalog-Punkt gewinnen. Alle
//       Arten, die sich diesen Punkt teilen, liegen damit in Reichweite; welche von
//       ihnen den Namen bekommt, entscheidet die Sortier-Reihenfolge (s. o.).
//   (3) Tatsaechlich BENANNTE Arten           — strikte Lesart, an der Zwillings-Decke
//       von 692 gedeckelt.
//
// ============================================================================
// DER SWEEP — drei Schichten, keine neue Technik
// ============================================================================
// A) REGLER-GITTER. 5 Stufen auf jeder der 6 Kern-Achsen (5^6 = 15.625 Umwelten),
//    deterministische Konvergenz aus dem Ur-Genom ohne Drift. Das ist Zeichen fuer
//    Zeichen die Technik, mit der docs/rarity.json entstanden ist („Anteil der Umwelten
//    (5^6-Gitter, deterministische Konvergenz ohne Drift)") und die tools/influence-check
//    je Faktor benutzt (`converge()` aus tools/lib/app-core.mjs). Damit ist die hier
//    gemessene Gruppen-Erreichbarkeit direkt mit docs/rarity.json vergleichbar — der
//    Vergleich wird unten gedruckt, denn rarity.json kennt erst 43 der heute 65 Formen.
// B) STRESSOR-SCHICHT. Das Regler-Gitter laesst die 15 bedingten Gene (Index 10-24)
//    kalt: Stressoren kommen in der App NUR ueber Umwelt-Einfluesse (app/influences.js).
//    Ohne diese Schicht waere jede Art mit Entgiftung/Osmoregulation/Druck-Toleranz
//    per Konstruktion „unerreichbar", und der Lueckenreport waere eine Selbsttaeuschung.
//    Gemessen wird deshalb jeder aktive Einfluss-Faktor auf jedem der 15 kalibrierten
//    Biome der App (BIOMES aus app/index.html, ueber tools/lib/impute.mjs gelesen —
//    keine zweite Kopie), mit derselben Stressor-Ruecksetzung wie applyInfluence().
// C) SCHWARM. Die Schichten A und B messen ATTRAKTOREN. Was der Spieler sieht, ist der
//    Zensus des Schwarms: `clusters()` ueber N=200 Individuen, und benannt wird der
//    ZENTROID jedes Clusters (readSwarm() in app/index.html). Der Schwarm erreicht per
//    Drift und frequenzabhaengiger Konkurrenz Punkte, die kein Attraktor ist — genau die
//    „nur ueber Drift"-Formen, die docs/rarity.json mit 0 % ausweist. Diese Schicht laeuft
//    auf der produktiven world/population.ts mit der Live-Konfiguration SWARM, die aus
//    app/index.html gelesen wird (keine zweite Kopie — anders als tools/spectrum-check.mjs,
//    das sie bewusst dupliziert, weil sie dort der PRUEFLING ist; hier ist sie Werkzeug).
//
// Bewusst NICHT im Sweep: das Gruender-Los und die Sperrklinke aus Phase 4. Beide sind
// opt-in und in der Live-App aus (Plan 4.1/4.2, Pruefung N0 in founder-check) — sie
// wuerden eine Reichweite messen, die heute niemand spielt.
//
// ============================================================================
// KEIN GATE — DIAGNOSE (Praezedenz: tools/ablation-check.mjs, tools/spectrum-check.mjs)
// ============================================================================
// Es gibt keine begruendbare Schwelle fuer „genug Abdeckung": 3,4 % ist die heutige
// Zwillings-Decke, und ob die Engine 30 % oder 60 % der erreichbaren Punkte trifft, ist
// eine Forschungs-, keine Regressionsfrage. Das Skript beendet sich immer mit 0 und
// druckt einen Bericht. Es faellt nur aus, wenn eine EINGABE fehlt (dann laut, s. u.).
//
// IN package.json REGISTRIERT — anders als tools/impute-check.mjs und tools/build-traits.mjs,
// weil dieses Werkzeug ausschliesslich auf EINGECHECKTEN Dateien laeuft (app/catalog.js,
// app/archetypes.js, app/index.html, app/influences.js, physics.json, docs/rarity.json,
// docs/tree-of-life.json, dist/ aus `npm run build`). Der einzige optionale Zusatz ist
// tools/.harvest-state.json fuer die Kladen-Aufschluesselung; fehlt sie, entfaellt dieser
// eine Abschnitt mit klarer Meldung, statt dass das Werkzeug rot leuchtet.
//
// Laufzeit gemessen: ~6 min (231 s Schicht A + 104 s Schicht C + Auswertung).
//
// Aufruf:  npm run coverage-check
//          node tools/coverage-check.mjs --quick     (3^6-Gitter + weniger Schwarm-Laeufe, ~1 min)
//          node tools/coverage-check.mjs --no-swarm  (nur Schicht A+B)
//          node tools/coverage-check.mjs --json=<pfad>  (Rohzahlen fuer den Lueckenreport)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../dist/world/population.js";
import { clusters, selectionWeights as popWeights } from "../dist/world/cluster.js";
import { loadAppCore, loadInfluences, BASE_ENV, STRESSORS } from "./lib/app-core.mjs";
import { BIOMES } from "./lib/impute.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d;
const QUICK = flag("--quick");

// --- Eingaben --------------------------------------------------------------
const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const ARCH = archWin.ARCHETYPES;

const catPath = join(ROOT, "app", "catalog.js");
if (!existsSync(catPath)) {
  console.error("coverage-check: app/catalog.js fehlt — erst `npm run build-catalog` laufen lassen.");
  process.exit(1);
}
const catWin = {};
new Function("window", readFileSync(catPath, "utf-8"))(catWin);
const CAT = catWin.CATALOG;
if (CAT.stage !== "full") {
  console.error(`coverage-check: app/catalog.js steht auf stage "${CAT.stage}". Die Abdeckungs-Frage`);
  console.error("  ist erst ab stage \"full\" sinnvoll (im Bootstrap hat jede Gruppe genau einen Eintrag).");
  process.exit(1);
}

const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const grab = (re, what) => {
  const m = html.match(re);
  if (!m) { console.error(`coverage-check: ${what} nicht in app/index.html gefunden.`); process.exit(1); }
  return m[0];
};
const GENE_LABELS = new Function(`${grab(/const GENE_LABELS = \[[\s\S]*?\];/, "GENE_LABELS")}; return GENE_LABELS;`)();
// Live-Schwarm-Konfiguration aus der App lesen statt kopieren (s. Kopfkommentar).
const SWARM = new Function(`${grab(/const SWARM = \{[\s\S]*?\n\};/, "SWARM")}; return SWARM;`)();
const SWARM_GENS = 250;  // wie tools/spectrum-check.mjs: die Zahl, gegen die N=200 abgenommen wurde

const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = ARCH.genes.length;
const core = loadAppCore("coverage-check");
const { factors } = loadInfluences();
const ACTIVE = factors.filter((f) => !f.soon && f.env && Object.keys(f.env).length);

// Optional: die Wurzel-Klade je Art aus der Ernte. tools/.harvest-state.json ist ein
// ARTEFAKT (in .gitignore), kein eingecheckter Stand — der Kladen-Abschnitt entfaellt
// ohne sie, alles andere laeuft unveraendert weiter. Dieselbe Haltung wie in
// tools/impute-check.mjs, nur ohne Abbruch: hier ist die Datei kein Muss.
const HARVEST = join(ROOT, "tools", ".harvest-state.json");
let rootOf = null;
if (existsSync(HARVEST)) {
  rootOf = new Map();
  const st = JSON.parse(readFileSync(HARVEST, "utf-8"));
  for (const [qid, v] of Object.entries(st.species)) if (v.root) rootOf.set(qid, v.root);
}

// --- Katalog-Punkte (Zwillings-Klassen) -------------------------------------
// Eine KLASSE = (Bauplan-Gruppe, bitgleiches Genom). Nur der erste Eintrag einer Klasse
// kann von nearestReal() jemals zurueckgegeben werden (strikter `<`-Vergleich), alle
// weiteren sind namenlose Mitbewohner desselben Punktes.
const classOfQid = new Map();
const classes = [];
{
  const byKey = new Map();
  CAT.entries.forEach((e) => {
    const key = e.group + "|" + e.genome.join(",");
    let c = byKey.get(key);
    if (!c) {
      c = { id: classes.length, group: e.group, genome: e.genome.map((x) => x / 255), members: [], rep: e };
      byKey.set(key, c); classes.push(c);
    }
    c.members.push(e);
    classOfQid.set(e.qid, c.id);
  });
}
const kingdomOfGroup = Object.fromEntries(ARCH.forms.map((f) => [f.key, f.k]));
const nameOfGroup = Object.fromEntries(ARCH.forms.map((f) => [f.key, f.n]));
const groupSize = Object.fromEntries(Object.entries(CAT.byGroup).map(([g, a]) => [g, a.length]));

console.log("=".repeat(78));
console.log("  coverage-check — Schritt 3.1: welcher Anteil der realen Arten ist erreichbar?");
console.log("=".repeat(78));
console.log(`Katalog:   ${CAT.entries.length} Arten · ${Object.keys(CAT.byGroup).length}/${ARCH.forms.length} Bauplan-Gruppen belegt`);
console.log(`           ${classes.length} unterscheidbare Genom-Punkte (Zwillings-Decke: hoechstens ` +
  `${(100 * classes.length / CAT.entries.length).toFixed(1)} % der Arten koennen JEMALS benannt werden)`);

// ---------------------------------------------------------------------------
// SWEEP
// ---------------------------------------------------------------------------
/** Ein Einfluss-Faktor auf einem Biom — dieselbe Semantik wie applyInfluence() in der
 *  App: Stressor-Achsen, die der Faktor NICHT nennt, fallen auf 0 zurueck (Stressoren
 *  gelten nur, solange der ausloesende Einfluss anliegt). */
function applyFactor(base, f) {
  const e = { ...base };
  for (const s of STRESSORS) if (f.env[s] === undefined) e[s] = 0;
  for (const [k, v] of Object.entries(f.env)) e[k] = v;
  return e;
}

const LEVELS = QUICK ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
const SLIDERS = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];

const envs = [];          // { env, layer }
const seenEnv = new Set();
const addEnv = (env, layer) => {
  const sig = JSON.stringify(env);
  if (seenEnv.has(sig)) return;
  seenEnv.add(sig); envs.push({ env, layer });
};
// A — Regler-Gitter
(function grid(i, acc) {
  if (i === SLIDERS.length) return addEnv({ ...BASE_ENV, ...acc }, "A");
  for (const v of LEVELS) grid(i + 1, { ...acc, [SLIDERS[i]]: v });
})(0, {});
const nGrid = envs.length;
// B — Stressor-Schicht: jeder aktive Faktor auf jedem kalibrierten Biom
for (const f of ACTIVE) for (const [, base] of BIOMES) addEnv(applyFactor(base, f), "B");
const nStress = envs.length - nGrid;

console.log(`\nSweep A (Regler-Gitter):   ${nGrid} Umwelten (${LEVELS.length}^${SLIDERS.length}, deterministische Konvergenz)`);
console.log(`Sweep B (Stressor-Schicht): ${nStress} Umwelten (${ACTIVE.length} aktive Einfluss-Faktoren x ${BIOMES.size} Biome)`);

const endpoints = [];     // { t, env, layer }
{
  const t0 = Date.now();
  let done = 0;
  for (const { env, layer } of envs) {
    endpoints.push({ t: core.converge(env), env, layer });
    if (++done % 500 === 0)
      process.stdout.write(`\r  ${done}/${envs.length} Umwelten konvergiert (${((Date.now() - t0) / 1000).toFixed(0)} s) …`);
  }
  process.stdout.write(`\r  ${envs.length}/${envs.length} Umwelten konvergiert (${((Date.now() - t0) / 1000).toFixed(0)} s).      \n`);
}

// C — Schwarm: was der Spieler wirklich benannt bekommt (Cluster-Zentroide)
let swarmRuns = 0;
if (!flag("--no-swarm")) {
  const seedsPerBiome = QUICK ? 1 : 4;
  const seedsPerFactor = QUICK ? 0 : 2;
  const jobs = [];
  for (const [name, env] of BIOMES) for (let r = 0; r < seedsPerBiome; r++) jobs.push({ name, env, r });
  for (const f of ACTIVE) for (let r = 0; r < seedsPerFactor; r++)
    jobs.push({ name: f.plain || f.name, env: applyFactor(BASE_ENV, f), r });
  console.log(`Sweep C (Schwarm):          ${jobs.length} Laeufe (world/population.ts, N=${SWARM.N}, ${SWARM_GENS} Generationen)`);
  const t0 = Date.now();
  let done = 0;
  for (const j of jobs) {
    const pop = new Population({
      size: SWARM.N, numGenes: NG, mutationSd: SWARM.mutationSd, selPower: SWARM.selPower,
      recombProb: SWARM.recombProb, founderSpread: "uniform",
      competition: { axes: SWARM.niche, sigmaC: SWARM.sigmaC, sigmaK: SWARM.sigmaK, kCenter: SWARM.kCenter },
    }, ((j.r + 1) * 2654435761) >>> 0);
    for (let g = 0; g < SWARM_GENS; g++) pop.step(j.env, phys);
    // Benannt wird, was readSwarm() benennt: die ZENTROIDE der selektions-gewichteten
    // Cluster (nicht die Einzel-Individuen — die sieht der Spieler nie einzeln).
    const w = popWeights(pop.mean(), j.env, phys);
    const cl = clusters(pop.genomes, { radius: SWARM.radius, minFraction: SWARM.minFraction, weights: w });
    const pts = cl.length ? cl.map((c) => c.centroid) : [pop.mean()];
    for (const t of pts) endpoints.push({ t, env: j.env, layer: "C" });
    swarmRuns++;
    if (++done % 20 === 0)
      process.stdout.write(`\r  ${done}/${jobs.length} Schwarm-Laeufe (${((Date.now() - t0) / 1000).toFixed(0)} s) …`);
  }
  process.stdout.write(`\r  ${jobs.length}/${jobs.length} Schwarm-Laeufe (${((Date.now() - t0) / 1000).toFixed(0)} s).      \n`);
}

// ---------------------------------------------------------------------------
// AUSWERTUNG — je Endpunkt: welche Bauplan-Gruppe, welche reale Art?
// ---------------------------------------------------------------------------
const reachedGroups = new Map();     // key -> Anzahl Endpunkte
const reachedClasses = new Map();    // classId -> Anzahl Endpunkte
const reachedByLayer = { A: new Set(), B: new Set(), C: new Set() };
const groupByLayer = { A: new Set(), B: new Set(), C: new Set() };
const runnerUp = new Map();          // Gruppe -> wie oft Zweitplatzierter, und gegen wen
const keyOfFormName = Object.fromEntries(ARCH.forms.map((f) => [f.n, f.key]));
let novelCount = 0, noRealCount = 0;
const reachedPoints = [];            // alle Endpunkt-Genome (fuer das Reichweiten-Fenster)
const namedEps = [];                 // { t, w, key } je Endpunkt, der eine Gruppe getroffen hat
{
  const t0 = Date.now();
  let done = 0;
  for (const ep of endpoints) {
    if (++done % 2000 === 0)
      process.stdout.write(`\r  ${done}/${endpoints.length} Endpunkte benannt (${((Date.now() - t0) / 1000).toFixed(0)} s) …`);
    const a = core.classify(ep.t, ep.env);
    reachedPoints.push(ep.t);
    if (a.novel) { novelCount++; continue; }   // jenseits novelThreshold: keine Art behauptet
    reachedGroups.set(a.key, (reachedGroups.get(a.key) || 0) + 1);
    groupByLayer[ep.layer].add(a.key);
    // Zweitplatzierter: matchArchetype() liefert ihn ohnehin (`alt`, der naechste ANDERE
    // Bauplan). Damit laesst sich fuer eine nie gewinnende Gruppe unterscheiden, ob sie
    // knapp verliert (staendig Zweiter) oder gar nicht erst in der Naehe ist — ohne eine
    // zweite Kopie der Distanzformel hier.
    if (a.alt) {
      const k = keyOfFormName[a.alt];
      if (k) {
        const row = runnerUp.get(k) || { n: 0, lostTo: new Map() };
        row.n++; row.lostTo.set(a.key, (row.lostTo.get(a.key) || 0) + 1);
        runnerUp.set(k, row);
      }
    }
    // Dieselben Gewichte, mit denen nearestReal() drinnen gerechnet hat (matchArchetype
    // bildet sie intern; hier einmal nachgerechnet, damit der Lueckenreport unten in
    // DERSELBEN Metrik argumentiert wie die Benennung — nicht in einer eigenen).
    const nep = { t: ep.t, w: core.selectionWeights(ep.t, ep.env), key: a.key, win: null };
    namedEps.push(nep);
    if (!a.real) { noRealCount++; continue; }  // Gruppe ohne reale Art (bleibt beim Bauplan-Namen)
    const cid = classOfQid.get(a.real.e.qid);
    nep.win = cid;                             // welcher Katalog-Punkt hier gewonnen hat
    reachedClasses.set(cid, (reachedClasses.get(cid) || 0) + 1);
    reachedByLayer[ep.layer].add(cid);
  }
  process.stdout.write(`\r  ${endpoints.length} Endpunkte benannt (${((Date.now() - t0) / 1000).toFixed(0)} s).      \n`);
}

/**
 * Der Endpunkt, an dem ein Katalog-Punkt dem Gewinnen am naechsten kommt — in der
 * METRIK DER BENENNUNG: nur Endpunkte, die in derselben Bauplan-Gruppe gelandet sind
 * (nur dort schaut nearestReal() ueberhaupt hin), Abstand mit den Selektionsgewichten
 * DIESES Endpunkts, exakt wie in nearestReal().
 *
 * WARUM NICHT einfach der euklidisch naechste Endpunkt ueber alle 25 Gene: die
 * deterministische Konvergenz laesst ein Gen, auf das die Selektion nicht schaut, beim
 * Startwert 0.5 stehen (in der App wandert es stattdessen per Drift). Ein ungewichteter
 * Vergleich wuerde daraus einen „Abstand" machen, den die Benennung gar nicht sieht —
 * genau die Art von Artefakt, die einen Lueckenreport wertlos macht. Die Gewichte
 * (weightFloor 0.30) daempfen das auf das Mass, das auch der Matcher anlegt.
 */
function bestEndpointIn(genome, keep) {
  let best = null, dBest = Infinity;
  for (const ep of namedEps) {
    if (!keep(ep)) continue;
    let s = 0, z = 0;
    for (let g = 0; g < NG; g++) { const d = (ep.t[g] - genome[g]) * ep.w[g]; s += d * d; z += ep.w[g] * ep.w[g]; }
    const dist = Math.sqrt(s / Math.max(z, 1e-9));
    if (dist < dBest) { dBest = dist; best = ep; }
  }
  return best ? { ep: best, dist: dBest } : null;
}
const bestEndpointFor = (c) => bestEndpointIn(c.genome, (ep) => ep.key === c.group);
// Einmal fuer jeden Katalog-Punkt rechnen — die Auswertung unten braucht es mehrfach.
const bestFor = new Map();
for (const c of classes) bestFor.set(c.id, bestEndpointFor(c));

/**
 * WARUM gewinnt ein Katalog-Punkt nie? — nicht gegen die Engine gerechnet, sondern
 * gegen den Punkt, der an seiner besten Stelle STATTDESSEN gewinnt.
 *
 * Das ist der entscheidende Unterschied zu einem naiven „Abstand zum Endpunkt": ein
 * Gen, in dem ALLE Katalog-Punkte der Gruppe gleich weit vom Engine-Wert weg liegen
 * (typisch fuer den Block der 15 bedingten Gene — die Kladen-Regeln setzen dort einen
 * Klade-Wert, die deterministische Konvergenz laesst ihn beim Startwert stehen), traegt
 * zwar viel Abstand, entscheidet aber NICHTS. Verglichen werden deshalb die beiden
 * Katalog-Punkte miteinander, in den Gewichten der Stelle: positiver Beitrag = hier
 * verliert der Punkt gegen den Gewinner.
 */
function lossPerGene(c) {
  const b = bestFor.get(c.id);
  if (!b || b.ep.win == null) return null;
  const v = classes[b.ep.win], t = b.ep.t, w = b.ep.w;
  const per = [];
  for (let g = 0; g < NG; g++)
    per.push({ g, loss: (Math.abs(c.genome[g] - t[g]) - Math.abs(v.genome[g] - t[g])) * w[g],
               mine: c.genome[g], theirs: v.genome[g] });
  return { winner: v, dist: b.dist, per };
}
function whyString(c, n = 3) {
  const l = lossPerGene(c);
  if (!l) return "(Bauplan-Gruppe wird nie erreicht)";
  return l.per.filter((r) => r.loss > 0).sort((a, b2) => b2.loss - a.loss).slice(0, n)
    .map((r) => `${GENE_LABELS[r.g]} ${r.mine.toFixed(2)} statt ${r.theirs.toFixed(2)}`).join(" · ");
}
/**
 * Fuer Gruppen, die die Engine NIE erreicht, gibt es keinen Gewinner innerhalb der
 * Gruppe. Dort ist die Frage eine Ebene hoeher: warum wird der BAUPLAN nie gewaehlt?
 * Verglichen wird deshalb der Prototyp der Gruppe — und zwar nur in den Genen, die er
 * ueberhaupt nennt (matchArchetype() misst nur diese; ein Prototyp ist eine
 * TEIL-Spezifikation, s. Kopfkommentar app/archetypes.js) — gegen den naechsten
 * erreichten Endpunkt desselben Reichs.
 */
function protoWhy(f, n = 3) {
  const idx = Object.keys(f.proto).map((k) => ARCH.genes.indexOf(k)).filter((i) => i >= 0);
  let best = null, dBest = Infinity;
  for (const ep of namedEps) {
    if (kingdomOfGroup[ep.key] !== f.k) continue;
    let s = 0, z = 0;
    for (const i of idx) { const d = (ep.t[i] - f.proto[ARCH.genes[i]]) * ep.w[i]; s += d * d; z += ep.w[i] * ep.w[i]; }
    const dist = Math.sqrt(s / Math.max(z, 1e-9));
    if (dist < dBest) { dBest = dist; best = ep; }
  }
  if (!best) return "(kein Endpunkt in diesem Reich)";
  return idx.map((i) => ({ i, d: f.proto[ARCH.genes[i]] - best.t[i], c: Math.abs(f.proto[ARCH.genes[i]] - best.t[i]) * best.w[i] }))
    .sort((a, b2) => b2.c - a.c).slice(0, n)
    .map((r) => `${GENE_LABELS[r.i]} ${f.proto[ARCH.genes[r.i]].toFixed(2)}${r.d > 0 ? "↑" : "↓"} Engine ${best.t[r.i].toFixed(2)}`)
    .join(" · ");
}

// --- Die drei Abdeckungszahlen ---------------------------------------------
const speciesInReachedGroups = [...reachedGroups.keys()].reduce((s, g) => s + (groupSize[g] || 0), 0);
const speciesAtReachedPoints = [...reachedClasses.keys()].reduce((s, c) => s + classes[c].members.length, 0);
const namedSpecies = reachedClasses.size;
const pc = (x, n) => `${((100 * x) / n).toFixed(2).padStart(6)} %`;

console.log("\n" + "-".repeat(78));
console.log("1 · ABDECKUNG — drei ineinander liegende Lesarten");
console.log("-".repeat(78));
console.log(`  Endpunkte gesamt:                       ${endpoints.length}`);
console.log(`    davon jenseits novelThreshold:        ${novelCount} (${(100 * novelCount / endpoints.length).toFixed(1)} % — keine reale Art behauptet)`);
console.log(`    davon in Gruppen ohne reale Art:      ${noRealCount} (bleibt beim Bauplan-Namen)`);
console.log("");
console.log(`  (1) Arten in erreichten Bauplan-Gruppen: ${String(speciesInReachedGroups).padStart(6)} / ${CAT.entries.length}  ${pc(speciesInReachedGroups, CAT.entries.length)}`);
console.log(`  (2) Arten an erreichten Genom-Punkten:   ${String(speciesAtReachedPoints).padStart(6)} / ${CAT.entries.length}  ${pc(speciesAtReachedPoints, CAT.entries.length)}   <- die Abdeckungszahl`);
console.log(`  (3) tatsaechlich benannte Arten:         ${String(namedSpecies).padStart(6)} / ${CAT.entries.length}  ${pc(namedSpecies, CAT.entries.length)}`);
console.log(`      … gegen die Zwillings-Decke:        ${String(namedSpecies).padStart(6)} / ${classes.length}  ${pc(namedSpecies, classes.length)}   (Decke aus 1.4, nicht aus der Engine)`);
console.log("");
console.log(`  Erreichte Genom-Punkte:                 ${reachedClasses.size} / ${classes.length}  ${pc(reachedClasses.size, classes.length)}`);
console.log(`  Erreichte Bauplan-Gruppen:              ${reachedGroups.size} / ${ARCH.forms.length}` +
  `   (davon mit realen Arten: ${[...reachedGroups.keys()].filter((g) => groupSize[g]).length} / ${Object.keys(CAT.byGroup).length})`);
console.log(`  Beitrag der Schichten (Genom-Punkte):   A ${reachedByLayer.A.size} · B ${reachedByLayer.B.size} · C ${reachedByLayer.C.size}` +
  `   (Bauplan-Gruppen: A ${groupByLayer.A.size} · B ${groupByLayer.B.size} · C ${groupByLayer.C.size})`);
{
  const onlyC = [...reachedByLayer.C].filter((c) => !reachedByLayer.A.has(c) && !reachedByLayer.B.has(c));
  const onlyB = [...reachedByLayer.B].filter((c) => !reachedByLayer.A.has(c));
  console.log(`    nur ueber die Stressor-Schicht:       ${onlyB.length} Punkte  ` +
    `(ohne sie waeren ${onlyB.reduce((s, c) => s + classes[c].members.length, 0)} Arten scheinbar unerreichbar)`);
  console.log(`    nur ueber den Schwarm (Drift):        ${onlyC.length} Punkte  ` +
    `(${onlyC.reduce((s, c) => s + classes[c].members.length, 0)} Arten)`);
}

// ---------------------------------------------------------------------------
// 2 · LUECKENREPORT NACH BAUPLAN-GRUPPE (die Kreuztabelle)
// ---------------------------------------------------------------------------
console.log("\n" + "-".repeat(78));
console.log("2 · LUECKENREPORT nach Bauplan-Gruppe — vier Quadranten");
console.log("-".repeat(78));
const quad = { ok: [], catalogGap: [], engineGap: [], dead: [] };
for (const f of ARCH.forms) {
  const hasSpecies = (groupSize[f.key] || 0) > 0;
  const reached = reachedGroups.has(f.key);
  const bucket = reached ? (hasSpecies ? "ok" : "catalogGap") : (hasSpecies ? "engineGap" : "dead");
  quad[bucket].push(f);
}
const gsum = (list) => list.reduce((s, f) => s + (groupSize[f.key] || 0), 0);
console.log(`  erreichbar + reale Arten (funktioniert):  ${String(quad.ok.length).padStart(2)} Gruppen, ${gsum(quad.ok)} Arten`);
console.log(`  erreichbar, KEINE reale Art (Katalog-Lue.): ${String(quad.catalogGap.length).padStart(2)} Gruppen — ${quad.catalogGap.map((f) => f.key).join(", ") || "—"}`);
console.log(`  reale Arten, NICHT erreichbar (Engine-Lue.): ${String(quad.engineGap.length).padStart(2)} Gruppen, ${gsum(quad.engineGap)} Arten`);
console.log(`  weder noch (tote Form):                    ${String(quad.dead.length).padStart(2)} Gruppen — ${quad.dead.map((f) => f.key).join(", ") || "—"}`);

if (quad.engineGap.length) {
  console.log("\n  ENGINE-LUECKEN im Detail (reale Arten katalogisiert, aber kein Sweep-Endpunkt landet dort).");
  console.log("  „Zweiter“ = in wie vielen Umwelten der Bauplan der naechste ANDERE war (matchArchetype()s");
  console.log("  `alt`): oft Zweiter = knapp verloren, nie Zweiter = gar nicht in der Naehe.");
  console.log(`    ${"Gruppe".padEnd(16)}${"Reich".padEnd(9)}${"Arten".padStart(6)}${"Punkte".padStart(7)}${"Zweiter".padStart(9)}   verliert gegen`);
  for (const f of quad.engineGap.sort((a, b) => (groupSize[b.key] || 0) - (groupSize[a.key] || 0))) {
    const cls = classes.filter((c) => c.group === f.key);
    const ru = runnerUp.get(f.key);
    const foes = ru ? [...ru.lostTo].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k} (${n})`).join(", ") : "—";
    console.log(`    ${f.key.padEnd(16)}${kingdomOfGroup[f.key].padEnd(9)}${String(groupSize[f.key]).padStart(6)}` +
      `${String(cls.length).padStart(7)}${String(ru ? ru.n : 0).padStart(9)}   ${foes}`);
  }
  console.log("\n  Dieselben Gruppen auf Bauplan-Ebene: die vom Prototyp GENANNTEN Gene gegen den");
  console.log("  naechsten erreichten Endpunkt desselben Reichs — das ist die Grenze, an der der");
  console.log("  Bauplan verliert (nur genannte Gene, weil matchArchetype() nur diese misst):");
  for (const f of quad.engineGap.sort((a, b) => (groupSize[b.key] || 0) - (groupSize[a.key] || 0)))
    console.log(`    ${f.key.padEnd(16)}${protoWhy(f, 4)}`);
}

// Innerhalb ERREICHTER Gruppen: wie viel des Katalogs wird dort wirklich abgedeckt?
console.log("\n  Abdeckung INNERHALB der erreichten Gruppen (Punkte getroffen / Punkte vorhanden):");
console.log(`    ${"Gruppe".padEnd(16)}${"Arten".padStart(6)}${"Punkte".padStart(8)}${"getroffen".padStart(11)}${"Arten in Reichw.".padStart(18)}`);
const reachedGroupRows = [...reachedGroups.keys()].filter((g) => groupSize[g])
  .map((g) => {
    const cls = classes.filter((c) => c.group === g);
    const hit = cls.filter((c) => reachedClasses.has(c.id));
    return { g, species: groupSize[g], nCls: cls.length, hit: hit.length,
             inReach: hit.reduce((s, c) => s + c.members.length, 0) };
  }).sort((a, b) => b.species - a.species);
for (const r of reachedGroupRows)
  console.log(`    ${r.g.padEnd(16)}${String(r.species).padStart(6)}${String(r.nCls).padStart(8)}${`${r.hit}`.padStart(11)}` +
    `${`${r.inReach} (${(100 * r.inReach / r.species).toFixed(0)} %)`.padStart(18)}`);

// ---------------------------------------------------------------------------
// 3 · LUECKENREPORT NACH REICH UND KLADE
// ---------------------------------------------------------------------------
console.log("\n" + "-".repeat(78));
console.log("3 · LUECKENREPORT nach Reich und Klade");
console.log("-".repeat(78));
/** Arten-Buchhaltung je Schluessel: gesamt / in erreichter Gruppe / an erreichtem Punkt. */
function tally(keyOf) {
  const m = new Map();
  for (const c of classes) {
    const inGroup = reachedGroups.has(c.group);
    const inPoint = reachedClasses.has(c.id);
    for (const e of c.members) {
      const k = keyOf(e);
      if (k == null) continue;
      const row = m.get(k) || { total: 0, group: 0, point: 0 };
      row.total++; if (inGroup) row.group++; if (inPoint) row.point++;
      m.set(k, row);
    }
  }
  return m;
}
const printTally = (m, head) => {
  console.log(`    ${head.padEnd(20)}${"Arten".padStart(7)}${"in Gruppe".padStart(12)}${"an Punkt".padStart(12)}`);
  for (const [k, r] of [...m].sort((a, b) => b[1].total - a[1].total))
    console.log(`    ${String(k).padEnd(20)}${String(r.total).padStart(7)}` +
      `${`${(100 * r.group / r.total).toFixed(0)} %`.padStart(12)}${`${(100 * r.point / r.total).toFixed(0)} %`.padStart(12)}`);
};
printTally(tally((e) => kingdomOfGroup[e.group]), "Reich");
if (rootOf) {
  console.log("");
  printTally(tally((e) => rootOf.get(e.qid) || null), "Wurzel-Klade");
} else {
  console.log("\n    (Kladen-Aufschluesselung uebersprungen: tools/.harvest-state.json fehlt —");
  console.log("     das ist ein Ernte-Artefakt, kein eingecheckter Stand.)");
}

// ---------------------------------------------------------------------------
// 4 · LUECKENREPORT NACH GEN-ACHSE — die Vorlage fuer Schritt 3.2
// ---------------------------------------------------------------------------
console.log("\n" + "-".repeat(78));
console.log("4 · LUECKENREPORT nach Gen-Achse");
console.log("-".repeat(78));
// (a) Reichweiten-Fenster: welchen Wertebereich erreicht die Engine je Gen ueberhaupt?
//     Perzentile statt Min/Max, damit ein einzelner Ausreisser kein Fenster oeffnet,
//     das faktisch nie besucht wird.
const pctl = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(p * (arr.length - 1))))];
const reachedLo = [], reachedHi = [], reachedMax = [];
for (let g = 0; g < NG; g++) {
  const col = reachedPoints.map((t) => t[g]).sort((a, b) => a - b);
  reachedLo.push(pctl(col, 0.01)); reachedHi.push(pctl(col, 0.99)); reachedMax.push(col[col.length - 1]);
}
// (b) Wie viele Arten liegen je Gen AUSSERHALB dieses Fensters? Gezaehlt werden nur
//     Arten, die nicht ohnehin schon an einem erreichten Punkt liegen — die Frage ist,
//     WAS den unerreichten Arten fehlt.
const missOut = new Array(NG).fill(0), missDelta = new Array(NG).fill(0), missHard = new Array(NG).fill(0);
let unreachedSpecies = 0;
for (const c of classes) {
  if (reachedClasses.has(c.id)) continue;
  unreachedSpecies += c.members.length;
  for (let g = 0; g < NG; g++) {
    const v = c.genome[g];
    const d = v < reachedLo[g] ? reachedLo[g] - v : v > reachedHi[g] ? v - reachedHi[g] : 0;
    if (d > 0.02) { missOut[g] += c.members.length; missDelta[g] += d * c.members.length; }
    if (v > reachedMax[g] + 0.02) missHard[g] += c.members.length;
  }
}
console.log(`  (a) Reichweiten-Fenster der Engine gegen die ${unreachedSpecies} Arten, die NICHT an einem`);
console.log(`      erreichten Punkt liegen. „typisch" = 1.–99. Perzentil ueber ${reachedPoints.length} Endpunkte,`);
console.log(`      „max" = hoechster ueberhaupt erreichter Wert. Der Unterschied ist die eigentliche`);
console.log(`      Auskunft: bei den 15 bedingten Genen liegt das 99er-Fenster nahe null, weil 93 % der`);
console.log(`      Umwelten gar keinen Stressor tragen — erreichbar ist der hohe Wert trotzdem, aber nur`);
console.log(`      in der schmalen Ecke, in der genau dieser Stressor anliegt.\n`);
console.log(`    ${"Gen".padEnd(22)}${"typisch".padStart(12)}${"max".padStart(6)}${"Katalog".padStart(12)}` +
  `${"Arten > typisch".padStart(17)}${"> max".padStart(9)}`);
const geneRows = [];
for (let g = 0; g < NG; g++) {
  const col = classes.map((c) => c.genome[g]).sort((a, b) => a - b);
  geneRows.push({ g, out: missOut[g], hard: missHard[g], mean: missOut[g] ? missDelta[g] / missOut[g] : 0,
                  cLo: pctl(col, 0.01), cHi: pctl(col, 0.99) });
}
for (const r of geneRows.sort((a, b) => b.out - a.out))
  console.log(`    ${GENE_LABELS[r.g].padEnd(22)}${`${reachedLo[r.g].toFixed(2)}–${reachedHi[r.g].toFixed(2)}`.padStart(12)}` +
    `${reachedMax[r.g].toFixed(2).padStart(6)}${`${r.cLo.toFixed(2)}–${r.cHi.toFixed(2)}`.padStart(12)}` +
    `${(r.out ? `${r.out} (${(100 * r.out / unreachedSpecies).toFixed(0)} %)` : "—").padStart(17)}` +
    `${(r.hard ? String(r.hard) : "—").padStart(9)}`);

// (b) Wie WEIT ausser Reichweite? Abstand jedes unerreichten Punktes zum besten
//     Endpunkt seiner eigenen Gruppe, in der Metrik der Benennung. Das trennt „knapp
//     verfehlt" (eine feinere Platzierung wuerde reichen) von „strukturell draussen"
//     (dort fehlt der Engine eine Achse) — die Kernfrage fuer Schritt 3.2.
const BUCKETS = [0.05, 0.10, 0.20, 0.30, Infinity];
const hist = new Array(BUCKETS.length + 1).fill(0);   // letzter Eimer: Gruppe unerreichbar
const contrib = new Array(NG).fill(0);
const lossByConf = [0, 0, 0, 0];   // Herkunft der entscheidenden Gene (Katalog-Konfidenz)
let inGroupWeighted = 0;
for (const c of classes) {
  if (reachedClasses.has(c.id)) continue;
  const b = bestFor.get(c.id);
  if (!b) { hist[hist.length - 1] += c.members.length; continue; }
  hist[BUCKETS.findIndex((x) => b.dist <= x)] += c.members.length;
  const l = lossPerGene(c);
  if (!l) continue;
  inGroupWeighted += c.members.length;
  for (const r of l.per) if (r.loss > 0) {
    contrib[r.g] += r.loss * c.members.length;
    lossByConf[c.rep.conf[r.g]] += r.loss * c.members.length;
  }
}
console.log(`\n  (b) Wie weit ausser Reichweite? Abstand zum besten Endpunkt der eigenen Gruppe`);
console.log(`      (Metrik von nearestReal(); novelThreshold = ${ARCH.novelThreshold} als Groessenordnung):\n`);
const bLabels = ["≤ 0.05", "≤ 0.10", "≤ 0.20", "≤ 0.30", "> 0.30"];
for (let i = 0; i < bLabels.length; i++)
  console.log(`    ${bLabels[i].padEnd(10)}${String(hist[i]).padStart(7)} Arten  ${(100 * hist[i] / unreachedSpecies).toFixed(1).padStart(5)} %`);
console.log(`    ${"Gruppe nie".padEnd(10)}${String(hist[hist.length - 1]).padStart(7)} Arten  ` +
  `${(100 * hist[hist.length - 1] / unreachedSpecies).toFixed(1).padStart(5)} %   (Bauplan-Gruppe selbst unerreichbar)`);
if (inGroupWeighted) {
  console.log(`\n      Woran es bei diesen ${inGroupWeighted} Arten liegt: in welchem Gen sie gegen den`);
  console.log(`      Katalog-Punkt verlieren, der an ihrer besten Stelle gewinnt (gewichtet, Ø je Art):\n`);
  const rows = contrib.map((v, g) => ({ g, v: v / inGroupWeighted })).sort((a, b2) => b2.v - a.v).slice(0, 10);
  for (const r of rows) console.log(`      ${GENE_LABELS[r.g].padEnd(22)}${r.v.toFixed(3).padStart(8)}`);
  // WOHER stammen die entscheidenden Gene? Das trennt „der Engine fehlt eine Achse" von
  // „die Platzierung behauptet einen Wert, den sie nicht gemessen hat". Ein Gen mit
  // Konfidenz 1 (Geschwister-Median) ist ein Schaetzwert; wenn der Lueckenreport
  // ueberwiegend auf solchen Genen beruht, ist die erste Konsequenz eine bessere
  // Imputation und NICHT eine neue Gen-Achse.
  const lcSum = lossByConf.reduce((a, b2) => a + b2, 0) || 1;
  console.log(`\n      Herkunft genau dieser Gene im Katalog (Anteil am Verlust):`);
  const CONF_LABEL = ["0 Habitat-Rueckwaertslauf", "1 hierarchisch imputiert", "2 aus der Klade", "3 direkt gemessen"];
  for (let i = 3; i >= 0; i--)
    console.log(`      ${CONF_LABEL[i].padEnd(28)}${(100 * lossByConf[i] / lcSum).toFixed(1).padStart(6)} %`);
}

// (c) Die artenreichsten unerreichten Punkte — die konkrete Vorlage fuer 3.2.
const topGaps = classes.filter((c) => !reachedClasses.has(c.id))
  .sort((a, b) => b.members.length - a.members.length).slice(0, 15);
console.log(`\n  (c) Die 15 artenreichsten unerreichten Katalog-Punkte:\n`);
console.log(`    ${"Arten".padStart(6)}  ${"Gruppe".padEnd(15)}${"Beispielart".padEnd(24)}${"Abst.".padStart(6)}  verliert in (Gen: dieser Punkt statt Gewinner)`);
for (const c of topGaps) {
  const ex = c.rep.de || c.rep.sci || c.rep.wiki || "?";
  const b = bestFor.get(c.id);
  console.log(`    ${String(c.members.length).padStart(6)}  ${c.group.padEnd(15)}${ex.slice(0, 23).padEnd(24)}` +
    `${(b ? b.dist.toFixed(3) : "—").padStart(6)}  ${whyString(c)}`);
}

// ---------------------------------------------------------------------------
// 5 · GEGENPROBEN: docs/rarity.json und docs/tree-of-life.json
// ---------------------------------------------------------------------------
console.log("\n" + "-".repeat(78));
console.log("5 · Gegenproben gegen die vorhandenen Messungen");
console.log("-".repeat(78));
{
  const rar = JSON.parse(readFileSync(join(ROOT, "docs", "rarity.json"), "utf-8"));
  const keyOfName = Object.fromEntries(ARCH.forms.map((f) => [f.n, f.key]));
  let agree = 0, disagree = [];
  for (const f of rar.forms) {
    const k = keyOfName[f.name];
    if (!k) continue;
    const rarReach = f.convergencePct > 0;
    const ourReach = groupByLayer.A.has(k);          // Schicht A = dieselbe Technik wie rarity.json
    if (rarReach === ourReach) agree++;
    else disagree.push(`${k} (rarity.json ${f.convergencePct} % / hier ${ourReach ? "erreicht" : "nicht erreicht"})`);
  }
  console.log(`  docs/rarity.json (${rar.forms.length} von heute ${ARCH.forms.length} Formen, ${rar.grid}er-Gitter):`);
  console.log(`    Schicht A stimmt bei ${agree}/${rar.forms.length} Formen im Ja/Nein ueberein.`);
  if (disagree.length) console.log(`    Abweichungen: ${disagree.join(" · ")}`);
  console.log(`    (rarity.json ist ein eingefrorener Stand von 2026-07-29 und kennt ${ARCH.forms.length - rar.forms.length} heutige Formen nicht.)`);
}
{
  const tol = JSON.parse(readFileSync(join(ROOT, "docs", "tree-of-life.json"), "utf-8"));
  const dead = [];
  for (const n of tol.nodes) {
    if (!n.observedForms) continue;
    const forms = Object.entries(n.observedForms);
    const reach = forms.filter(([g]) => reachedGroups.has(g));
    const spec = forms.reduce((s, [, v]) => s + v, 0);
    if (!spec) continue;   // Knoten ohne geerntete Art sagt nichts ueber Erreichbarkeit
    const specReach = reach.reduce((s, [, v]) => s + v, 0);
    if (specReach / Math.max(spec, 1) < 0.5) dead.push({ n, spec, specReach, forms });
  }
  console.log(`\n  docs/tree-of-life.json — Kladen, deren beobachtete Baupläne mehrheitlich unerreichbar sind:`);
  if (!dead.length) console.log("    (keine)");
  for (const d of dead.sort((a, b) => b.spec - a.spec))
    console.log(`    ${(d.n.name || d.n.id).padEnd(20)}${String(d.spec).padStart(6)} Arten, ` +
      `${(100 * d.specReach / d.spec).toFixed(0)} % in erreichbaren Bauplänen — ` +
      d.forms.map(([g, v]) => `${g}:${v}${reachedGroups.has(g) ? "" : "*"}`).join(" "));
  console.log("    (* = Bauplan von der Engine im Sweep nicht erreicht)");
}

// --- Rohzahlen fuer Schritt 3.2 --------------------------------------------
const jsonPath = opt("json", null);
if (jsonPath) {
  const out = {
    _comment: "Rohzahlen von tools/coverage-check.mjs (Schritt 3.1). Grundlage fuer docs/coverage-report.md.",
    generatedAt: new Date().toISOString().slice(0, 10),
    sweep: { grid: nGrid, stress: nStress, swarmRuns, endpoints: endpoints.length },
    catalog: { species: CAT.entries.length, points: classes.length, groups: Object.keys(CAT.byGroup).length },
    coverage: { speciesInReachedGroups, speciesAtReachedPoints, namedSpecies,
                reachedPoints: reachedClasses.size, reachedGroups: reachedGroups.size },
    quadrants: Object.fromEntries(Object.entries(quad).map(([k, v]) => [k, v.map((f) => f.key)])),
    engineGapGroups: quad.engineGap.map((f) => ({ key: f.key, kingdom: kingdomOfGroup[f.key], name: f.n,
      species: groupSize[f.key], points: classes.filter((c) => c.group === f.key).length })),
    perGroup: reachedGroupRows,
    geneWindow: GENE_LABELS.map((l, g) => ({ gene: ARCH.genes[g], label: l, lo: +reachedLo[g].toFixed(3),
      hi: +reachedHi[g].toFixed(3), max: +reachedMax[g].toFixed(3), speciesOutside: missOut[g],
      speciesBeyondMax: missHard[g] })),
    lossByGene: contrib.map((v, g) => ({ gene: ARCH.genes[g], loss: +(v / Math.max(inGroupWeighted, 1)).toFixed(4) }))
      .sort((a, b) => b.loss - a.loss).slice(0, 12),
    lossByConfidence: lossByConf.map((v) => +(v / (lossByConf.reduce((a, b) => a + b, 0) || 1)).toFixed(4)),
    distanceHistogram: { buckets: ["<=0.05", "<=0.10", "<=0.20", "<=0.30", ">0.30", "groupUnreachable"], species: hist },
    kingdoms: Object.fromEntries(tally((e) => kingdomOfGroup[e.group])),
    clades: rootOf ? Object.fromEntries(tally((e) => rootOf.get(e.qid) || null)) : null,
  };
  writeFileSync(join(ROOT, jsonPath), JSON.stringify(out, null, 1));
  console.log(`\nRohzahlen geschrieben: ${jsonPath}`);
}

console.log("\nDiagnose, kein Pass/Fail-Gate (kein process.exit(1)) — Begruendung im Kopfkommentar.");
console.log(`Naechster Schritt: docs/coverage-report.md (3.2) uebersetzt diese Luecken in Achsen-Vorschlaege.`);
