// Schicht-A-Portfolio (Realitaetstreue-Loop, Backlog Punkt 9 Schritt 2): jedes der
// acht Evolutionstheorie-Phaenomene P1-P8 aus docs/evolution-fidelity-loop.md
// (Abschnitt "### 2. Die bekannten emergenten Phaenomene" + Tabelle "### Schicht A")
// als eigenstaendiges, deterministisches Szenario auf dem bestehenden
// Populations-Kern (population.ts/world.ts/coevolution.ts/cluster.ts/census.ts).
//
// Reine Szenario-/Metrik-LOGIK hier; Zielbaender, Ablations-Interpretation und
// Text-Ausgabe leben in tools/phenomena-check.mjs (Trennung wie
// world/cluster.ts <-> tools/branching-check.mjs).
//
// P2, P3, P5, P8-Einbruch sind WIEDERVERWENDUNG bestehender, produktiver Checks
// (branching-check.mjs, world-check.mjs, coevolution-check.mjs) — hier nur ins
// gemeinsame { mechanisms -> Metrik }-Format gebracht, keine neue Kern-Logik.
// P1, P4, P6 und die P8-ERHOLUNG sind net-neu.

import { Population, mulberry32, DEFAULT_CANALIZATION } from "./population.js";
import type { PopulationConfig, CompetitionConfig } from "./population.js";
import { founderSpreads, FOUNDER_LOTTERY_DEFAULTS } from "./founder.js";
import { World, meanDistance } from "./world.js";
import { Ecosystem, temporalSd } from "./coevolution.js";
import { modes1D } from "./cluster.js";
import { census } from "./census.js";
import type { Environment, Physics } from "../engine/types.js";

// ---------------------------------------------------------------------------
// Mechanismus-Schalter — von Anfang an so gebaut, dass Schritt 3
// (Mechanismus-Ablationsstudie) ihn direkt wiederverwenden kann, statt eine
// zweite Implementierung zu brauchen.
// ---------------------------------------------------------------------------

export interface Mechanisms {
  /** Frequenzabhaengige Konkurrenz (Dieckmann & Doebeli 1999). Treibt P2; als
   *  Ablation fuer P4 (stoert Konvergenz absichtlich). */
  competition: boolean;
  /** Genfluss zwischen Orten (World.connect/colonize). Treibt P1 (Kolonisation
   *  neuer Nischen); als Ablation fuer P3 (homogenisiert Isolation weg). */
  migration: boolean;
  /** Endogener Raeuber-Beute-Druck (world/coevolution.ts). Treibt P5. */
  coevolution: boolean;
  /** Stochastische Variationsquelle: Mutation + endliche Populationsgroesse
   *  (Wright-Fisher-Stichprobenrauschen). Treibt P6 (Kontingenz) und die
   *  Erholung in P8. */
  drift: boolean;
}

/** Alle Mechanismen aktiv — der "volle Realismus"-Zustand. */
export const MECH_ALL_ON: Mechanisms = { competition: true, migration: true, coevolution: true, drift: true };
/** Alle Mechanismen aus — Referenzpunkt fuer Schritt 3, hier nicht als Szenario genutzt. */
export const MECH_ALL_OFF: Mechanisms = { competition: false, migration: false, coevolution: false, drift: false };

/**
 * Drift hat in diesem Kern DREI Quellen: (1) Mutation, (2) die anfaengliche
 * Zufalls-Streuung der Startpopulation (`startSpread`) und (3) endliche
 * Stichprobenziehung beim Roulette-Wheel selbst (klassische Wright-Fisher-
 * Definition: Drift ~ 1/N). Um den Mechanismus fuer eine Ablation wirklich
 * stillzulegen, muessen ALLE DREI abgeschaltet werden: mutationSd=0 (keine
 * neue Variation), startSpread=0 (alle Seeds starten exakt IDENTISCH statt
 * nur "nahe" beieinander) UND eine stark vergroesserte Population (reduziert
 * die verbleibende Stichprobenvarianz einer endlichen Ziehung; 300->2500 ist
 * eine ~8x-Reduktion). Nur mutationSd=0 allein reicht NICHT: die zufaellige
 * Startpopulation selbst waere dann noch eine Kontingenz-Quelle (leicht
 * unterschiedliche Startpopulationen je Seed, unter Selektion leicht
 * unterschiedlich "beschnitten") -- das ist kein beliebiger Kniff, sondern die
 * direkte Umkehrung aller Quellen, aus denen Drift in diesem Kern entsteht.
 */
const DRIFT_OFF_SIZE = 2500;

/** Populations-Konfiguration aus den Mechanismus-Schaltern ableiten. */
export function popConfigFor(
  mechanisms: Mechanisms,
  opts: { competitionConfig?: CompetitionConfig | null } = {},
): Partial<PopulationConfig> {
  const cfg: Partial<PopulationConfig> = {};
  if (mechanisms.competition && opts.competitionConfig) cfg.competition = opts.competitionConfig;
  if (!mechanisms.drift) {
    cfg.mutationSd = 0;
    cfg.startSpread = 0;
    cfg.size = DRIFT_OFF_SIZE;
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Gemeinsame Umwelt-Konstanten (identisch zu branching-check/world-check/
// coevolution-check, damit die wiederverwendeten Phaenomene bit-identische
// Szenarien bleiben).
// ---------------------------------------------------------------------------

export const MID_ENV: Environment = { temperature: 0.5, predation: 0.4, foodAbundance: 0.7, foodHeight: 0.35, light: 0.45, water: 0.5 };
export const COLD_ENV: Environment = { temperature: 0.08, predation: 0.15, foodAbundance: 0.55, foodHeight: 0.15, light: 0.4, water: 0.5 };
export const HOT_ENV: Environment = { temperature: 0.92, predation: 0.10, foodAbundance: 0.30, foodHeight: 0.10, light: 0.9, water: 0.15 };
/** Groessen-Achse als Ressourcen-/Nischenachse — wie in branching-check.mjs. */
export const SIZE_AXIS = 1;
export const COMPETITION_CONFIG: CompetitionConfig = { axis: SIZE_AXIS, sigmaC: 0.35, sigmaK: 9, kCenter: 0.5 };

function meanOf(xs: number[]): number {
  return xs.reduce((a, c) => a + c, 0) / xs.length;
}

// ---------------------------------------------------------------------------
// P1 — Adaptive Radiation: Nischen oeffnen -> Artenzahl steigt ueberproportional.
// ---------------------------------------------------------------------------
//
// Baseline: eine Population lebt WARMUP+EXTRA Generationen lang allein in
// "Heimat" (keine neuen Nischen) -> ueber census() ~1 Art (unimodal ohne
// Konkurrenzachse).
// Treatment: nach WARMUP Generationen "oeffnen" sich neue Nischen (zusaetzliche
// Orte mit abweichender Umwelt); die Stammlinie besiedelt sie per
// Gruender-Kolonisation (World.colonize, das GENAU der Migrations-Mechanismus
// ist) und passt sich dort EXTRA weitere Generationen an -> mehrere neue,
// genomisch unterscheidbare Arten (census ueber alle Orte).
//
// Ablation (mechanisms.migration=false): ohne Ausbreitung bleiben die neuen
// Nischen unerreichbar -> Treatment reduziert sich auf die Baseline (keine
// Kolonisation stattfindet) -> Artenzahl-Verhaeltnis kollabiert auf ~1.

export interface RadiationResult {
  baselineSpecies: number;
  treatmentSpecies: number;
  ratio: number;
}

const RADIATION_NICHES: [string, Environment][] = [
  ["Kaelte", COLD_ENV],
  ["Wueste", HOT_ENV],
  ["Tiefsee", { temperature: 0.35, predation: 0.5, foodAbundance: 0.2, foodHeight: 0.05, light: 0.05, water: 1.0 }],
];

export function radiation(phys: Physics, mechanisms: Mechanisms, seed = 21): RadiationResult {
  const NG = phys.traits.length;
  const WARMUP = 150;
  const EXTRA = 150;
  const popCfg = popConfigFor(mechanisms);

  // Baseline: nur "Heimat", keine Nischen-Oeffnung, WARMUP+EXTRA Generationen.
  const base = new World({ phys, popConfig: { numGenes: NG, ...popCfg }, seed });
  base.addPlace("Heimat", MID_ENV);
  for (let i = 0; i < WARMUP + EXTRA; i++) base.step();
  const baselineSpecies = census(base).length;

  // Treatment: identischer Aufbau/Seed -> nach WARMUP bit-identisch zur Baseline
  // (deterministisches RNG), dann (falls migration aktiv) Nischen oeffnen.
  const treat = new World({ phys, popConfig: { numGenes: NG, ...popCfg }, seed });
  treat.addPlace("Heimat", MID_ENV);
  for (let i = 0; i < WARMUP; i++) treat.step();
  if (mechanisms.migration) {
    for (const [name, env] of RADIATION_NICHES) {
      treat.addPlace(name, env);
      treat.colonize(0, treat.places.length - 1, 6);
    }
  }
  for (let i = 0; i < EXTRA; i++) treat.step();
  const treatmentSpecies = census(treat).length;

  return { baselineSpecies, treatmentSpecies, ratio: treatmentSpecies / Math.max(1, baselineSpecies) };
}

// ---------------------------------------------------------------------------
// P2 — Sympatrische Speziation / Branching (Wiederverwendung von
// tools/branching-check.mjs; Logik 1:1 uebernommen, nur parametrisiert ueber
// mechanisms.competition statt eines festen Kontroll-/Behandlungs-Paars).
// ---------------------------------------------------------------------------

export interface BranchingResult {
  modes: number[];
  sd: number;
}

export function branching(phys: Physics, mechanisms: Mechanisms, seeds = [1, 2, 3, 4, 5]): BranchingResult {
  const NG = phys.traits.length;
  const popCfg = popConfigFor(mechanisms, { competitionConfig: COMPETITION_CONFIG });
  const modes: number[] = [];
  let sdSum = 0;
  for (const seed of seeds) {
    const pop = new Population({ numGenes: NG, ...popCfg }, seed);
    for (let i = 0; i < 600; i++) pop.step(MID_ENV, phys);
    const sz = pop.axisValues(SIZE_AXIS);
    const mean = meanOf(sz);
    const sd = Math.sqrt(meanOf(sz.map((v) => (v - mean) ** 2)));
    modes.push(modes1D(sz, { bandwidth: 0.05 }).count);
    sdSum += sd;
  }
  return { modes, sd: sdSum / seeds.length };
}

// ---------------------------------------------------------------------------
// P3 — Allopatrische Speziation (Wiederverwendung von tools/world-check.mjs,
// oberer Teil: zwei isolierte Orte divergieren). mechanisms.migration steuert,
// ob die Orte verbunden werden -- die Ablation IST world-check.mjs' eigener
// "verbunden"-Kontrollfall.
// ---------------------------------------------------------------------------

export interface AllopatryResult {
  divergence: number;
}

export function allopatry(phys: Physics, mechanisms: Mechanisms, seed = 42): AllopatryResult {
  const NG = phys.traits.length;
  const popCfg = popConfigFor(mechanisms);
  const w = new World({ phys, popConfig: { numGenes: NG, ...popCfg }, seed });
  w.addPlace("Kaelte", COLD_ENV);
  w.addPlace("Hitze", HOT_ENV);
  if (mechanisms.migration) w.connect(0, 1, 0.30); // Ablation: starker Genfluss homogenisiert
  for (let i = 0; i < 160; i++) w.step();
  return { divergence: meanDistance(w.mean(0), w.mean(1)) };
}

// ---------------------------------------------------------------------------
// P4 — Konvergente Evolution: gleiche Umwelt, verschiedene Startpunkte ->
// End-Distanz sollte klein sein.
// ---------------------------------------------------------------------------
//
// Fuenf Populationen starten MONOMORPH bei stark unterschiedlichen Werten
// (0.1..0.9) und je eigenem Seed, evolvieren aber alle unter DERSELBEN Umwelt.
// Wenn eine gemeinsame Fitness-Landschaft der eigentliche Treiber ist (nicht
// Zufall), sollten sie trotz verschiedenster Startpunkte im selben Genom-Areal
// landen (kleine paarweise End-Distanz).
//
// Ablation — HIER passt keiner der vier Schritt-3-Mechanismen (Konkurrenz/
// Migration/Koevolution/Drift) wirklich als ursaechliche Kraft: empirisch
// getestet (s. Bericht) aendert das Ein-/Ausschalten von Konkurrenz auf der
// Groessen-Achse den End-Abstand kaum (0.183 vs. 0.201 ueber 250 Generationen
// — die Konkurrenz-Aufspaltung landet unabhaengig vom Startpunkt praktisch
// immer an denselben zwei Stellen, weil sigmaK sehr breit/kCenter fix ist).
// Die tatsaechliche Ursache von Konvergenz ist die gemeinsame SELEKTION unter
// derselben Umwelt -- das ist in diesem Kern kein Schalter, sondern die
// Fitness-Funktion selbst. Die ehrliche Ablation schaltet daher Selektion
// direkt ab (neutrale Reproduktion, gleichgewichtete Zufallsziehung ueber
// `Population.reproduceWith` statt `Population.step`) statt einen der vier
// Mechanismen zu missbrauchen, der den Effekt in der Praxis nicht zeigt.
// `mechanisms` bleibt Teil der Signatur fuer Portfolio-/Schritt-3-Konsistenz
// (Drift wirkt hier ganz normal mit hinein), ist aber NICHT die Quelle der
// Ablation fuer dieses eine Phaenomen -- s. `convergenceNoSelection`.

export interface ConvergenceResult {
  meanPairwiseDistance: number;
  finals: number[][];
}

const CONVERGENCE_STARTS: { start: number; seed: number }[] = [
  { start: 0.1, seed: 11 },
  { start: 0.3, seed: 12 },
  { start: 0.5, seed: 13 },
  { start: 0.7, seed: 14 },
  { start: 0.9, seed: 15 },
];

function pairwiseMeanDistance(finals: number[][]): number {
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < finals.length; i++) {
    for (let j = i + 1; j < finals.length; j++) {
      sum += meanDistance(finals[i], finals[j]);
      cnt++;
    }
  }
  return sum / cnt;
}

export function convergence(phys: Physics, mechanisms: Mechanisms): ConvergenceResult {
  const NG = phys.traits.length;
  const GENS = 250;
  const popCfg = popConfigFor(mechanisms);
  const finals = CONVERGENCE_STARTS.map(({ start, seed }) => {
    const pop = new Population({ numGenes: NG, ...popCfg }, seed, start);
    for (let i = 0; i < GENS; i++) pop.step(MID_ENV, phys);
    return pop.mean();
  });
  return { meanPairwiseDistance: pairwiseMeanDistance(finals), finals };
}

/**
 * P4-Ablation: Selektion direkt abschalten (neutrale Reproduktion — jedes
 * Individuum reproduziert mit gleichem Gewicht, unabhaengig von seiner
 * Fitness). Ohne einen gemeinsamen Selektionsdruck sollte derselbe Startpunkt-
 * Fächer NICHT mehr im selben Genom-Areal landen -> grosse End-Distanz.
 */
export function convergenceNoSelection(phys: Physics): ConvergenceResult {
  const NG = phys.traits.length;
  const GENS = 250;
  const finals = CONVERGENCE_STARTS.map(({ start, seed }) => {
    const pop = new Population({ numGenes: NG }, seed, start);
    const uniform = new Array<number>(pop.size).fill(1);
    for (let i = 0; i < GENS; i++) pop.reproduceWith(uniform);
    return pop.mean();
  });
  return { meanPairwiseDistance: pairwiseMeanDistance(finals), finals };
}

// ---------------------------------------------------------------------------
// P5 — Rote Koenigin (Wiederverwendung von tools/coevolution-check.mjs;
// Logik 1:1 uebernommen, mechanisms.coevolution ersetzt den festen
// withPredators-Schalter).
// ---------------------------------------------------------------------------

export interface RedQueenResult {
  sd: number;
  meanPredation: number;
}

export function redQueen(phys: Physics, mechanisms: Mechanisms, seeds = [1, 2, 3]): RedQueenResult {
  const NG = phys.traits.length;
  const env: Environment = { ...MID_ENV, predation: 0.2 };
  const GENS = 500;
  const LAST = 150;
  const popCfg = popConfigFor(mechanisms);
  const results = seeds.map((seed) => {
    const eco = new Ecosystem(env, phys, { numGenes: NG, ...popCfg }, {}, seed);
    for (let i = 0; i < GENS; i++) eco.step(mechanisms.coevolution);
    const preyMeans = eco.history.map((h) => h.preyMean);
    const preds = eco.history.slice(-LAST).map((h) => h.predation);
    return { sd: temporalSd(preyMeans, LAST), meanPredation: meanOf(preds) };
  });
  return {
    sd: meanOf(results.map((r) => r.sd)),
    meanPredation: meanOf(results.map((r) => r.meanPredation)),
  };
}

// ---------------------------------------------------------------------------
// P6 — Kontingenz: gleiche Anfangsbedingung + andere Zufallssaat -> Varianz
// der Endzustaende muss > 0 sein UND unter einer plausiblen Obergrenze liegen.
// ---------------------------------------------------------------------------
//
// Anders als P4 (verschiedene STARTPUNKTE, gleicher Erwartungswert der
// Fitness-Landschaft) startet hier JEDER Seed vom SELBEN Startwert (0.5) --
// jede beobachtete Differenz zwischen den Endzustaenden kommt also NUR aus
// dem Zufallspfad (Mutation + endliche Stichprobenziehung), nicht aus
// unterschiedlichen Anfangsbedingungen. Das ist die Definition von Kontingenz
// (Gould 1989): derselbe Ausgangspunkt kann zu verschiedenen, aber je
// plausiblen Endzustaenden fuehren.
//
// Metrik: mittlere quadrierte Distanz jedes Endzustands zum Centroid ueber
// alle Seeds (= Summe der Pro-Gen-Varianzen, Multi-Gen-Analogon der Varianz).
//
// Begruendung des Zielbands (Anforderung: keine Zahl ohne Begruendung):
//   - UNTERGRENZE (> 0, mit kleinem Numerik-Schwellenwert statt exakt 0, da
//     Fliesskomma-Rauschen niemals exakt 0 ist): jede messbare Streuung zeigt,
//     dass der Ausgang nicht deterministisch ist -- das ist die ganze Aussage
//     von P6, jede noch so kleine positive Zahl erfuellt sie.
//   - OBERGRENZE: was waere "unplausibel hoch"? Der denkbar groesste
//     Referenzpunkt ist eine Population, die GAR NICHT selektiert wird --
//     ihre Endzustaende waeren nur noch durch die anfaengliche Gleichverteilung
//     bestimmt. Da jedes Gen bei Initialisierung auf [0,1] clamped, gauss-verteilt
//     um den Startwert liegt, waere die "voellig unselektierte" Referenzvarianz
//     (Grenzfall: Genwerte am Ende so verteilt wie eine Uniform(0,1)-Zufallszahl,
//     Varianz einer Uniform(0,1)-Verteilung = 1/12) durch NG=25 Gene summiert
//     also NG/12 ~= 2.08. Eine unter REALER Selektion (gleiche Umwelt fuer alle
//     Seeds, derselbe Fitness-Gradient zieht alle in dieselbe Richtung)
//     evolvierte Population, die trotzdem an diesen Referenzwert heranreicht,
//     waere kein Kontingenz-Befund mehr, sondern ein Zeichen, dass Selektion
//     GAR NICHT wirkt (Implementierungsfehler o.ae.). Als Sicherheitsmarge wird
//     ein Zehntel dieser Referenz als Obergrenze verwendet (0.1 * NG/12 ~= 0.208)
//     -- deutlich ueber jeder erwarteten "gesunden" Kontingenz-Streuung (die
//     empirisch, s. tools/phenomena-check.mjs, bei ~1e-3..1e-2 liegt), aber
//     deutlich unter dem "keine Selektion greift"-Fall. Das Band ist also durch
//     zwei begruendete Ankerpunkte definiert (Numerik-Null unten, Zufalls-
//     Referenz/10 oben), nicht frei erfunden.
//
// Ablation (mechanisms.drift=false): ohne Mutation UND mit stark vergroesserter
// Population (s. popConfigFor) sollte die Varianz auf (nahe) 0 kollabieren --
// das Zielband ">0" wird dann (knapp) verfehlt.

export interface ContingencyResult {
  variance: number;
  finals: number[][];
}

export function contingency(phys: Physics, mechanisms: Mechanisms, seeds = [1, 2, 3, 4, 5, 6, 7, 8]): ContingencyResult {
  const NG = phys.traits.length;
  const GENS = 300;
  const popCfg = popConfigFor(mechanisms);
  const finals = seeds.map((seed) => {
    const pop = new Population({ numGenes: NG, ...popCfg }, seed, 0.5);
    for (let i = 0; i < GENS; i++) pop.step(MID_ENV, phys);
    return pop.mean();
  });
  const centroid = new Array<number>(NG).fill(0);
  for (const f of finals) for (let g = 0; g < NG; g++) centroid[g] += f[g] / finals.length;
  let variance = 0;
  for (const f of finals) {
    let d = 0;
    for (let g = 0; g < NG; g++) d += (f[g] - centroid[g]) ** 2;
    variance += d / finals.length;
  }
  return { variance, finals };
}

/** Referenzwert fuer die P6-Obergrenze — s. Begruendung oben. */
export function contingencyRandomReference(numGenes: number): number {
  return numGenes / 12;
}

// ---------------------------------------------------------------------------
// P8 — Aussterben & Erholung (Einbruch = Wiederverwendung des unteren Teils
// von tools/world-check.mjs; die ERHOLUNG danach ist net-neu).
// ---------------------------------------------------------------------------
//
// Ablation (mechanisms.drift=false): die Katastrophe reduziert die Population
// auf wenige Ueberlebende-Klone; ohne Mutation gibt es KEINE Quelle fuer neue
// Varianten -- Rekombination kann nur bestehende Allele der ueberlebenden
// Klone neu mischen, keine neuen Werte erzeugen. Diversitaet sollte nach der
// Katastrophe also flach bleiben statt sich zu erholen.

export interface ExtinctionResult {
  before: number;
  trough: number;
  after: number;
}

export function extinctionRecovery(phys: Physics, mechanisms: Mechanisms, seed = 7): ExtinctionResult {
  const NG = phys.traits.length;
  const WARMUP = 120;
  const RECOVERY = 200;
  const popCfg = popConfigFor(mechanisms);
  const w = new World({ phys, popConfig: { numGenes: NG, ...popCfg }, seed });
  w.addPlace("Quelle", MID_ENV);
  for (let i = 0; i < WARMUP; i++) w.step();
  const before = w.diversityNN(0);
  w.catastrophe(0, 0.05);
  const trough = w.diversityNN(0);
  for (let i = 0; i < RECOVERY; i++) w.step();
  const after = w.diversityNN(0);
  return { before, trough, after };
}

// ---------------------------------------------------------------------------
// P7 — Verteilungsgesetze: bewusst NICHT hier implementiert (auch nicht nach
// Schritt 4). tools/phenomena-check.mjs ruft direkt die vier Fit-Funktionen
// aus tools/distribution-check.mjs (Schritt 4, Schicht B) auf und prueft nur
// "alle vier Bandwerte getroffen" -- keine eigene Verteilungs-Fit-Logik hier,
// sonst entstuende doppelte, potenziell widerspruechliche Logik (s. Backlog
// Punkt 9 Schritt 2).
// ---------------------------------------------------------------------------

// ===========================================================================
// PHASE 4 (docs/artenkatalog-plan.md) — Kontingenz mit Wirkung.
// Szenario-Logik fuer `npm run founder-check`; Zielbaender und Ausgabe liegen
// wie ueberall in tools/ (hier: tools/founder-check.mjs).
// ===========================================================================
//
// WARUM DAS NICHT IN contingency() (P6) EINGEBAUT IST — der wichtigste Befund
// dieses Schritts, deshalb hier und nicht in einer Randnotiz:
//
// P6 misst die Streuung der Endzustaende NACH 300 GENERATIONEN. Gemessen (48
// Seeds statt der ueblichen 8, damit der Schaetzer nicht selbst das Ergebnis
// ist): das Gruender-Los ist zu diesem Zeitpunkt SPURLOS verschwunden.
//   Startvarianz mit Los          0.696   (ohne Los: 0.0001)
//   nach  20 Generationen         0.549   (ohne Los: 0.049)
//   nach  70 Generationen         0.041   (ohne Los: 0.022)
//   nach 300 Generationen         0.018-0.020 fuer JEDE gepruefte Losstaerke,
//                                 ununterscheidbar von 0.0197 ohne Los.
// Die Ursache ist nachgewiesen, nicht vermutet: laesst man dieselbe Population
// OHNE Selektion laufen (gleichgewichtete Reproduktion), bleibt die Varianz bei
// 0.212 statt auf 0.019 zu fallen. Es ist also die Selektion, die das Los
// aufzehrt — und zwar deshalb, weil ein Budget von 0.5 % Fitness bei N=300
// einem Selektionskoeffizienten mit N*s ~ 1.5 entspricht. Das ist im
// populationsgenetischen Sinn NICHT neutral: ueber 300 Generationen gewinnt die
// Selektion sicher. Der Nullraum dieser Landschaft ist ein Zustand auf Zeit
// (~70 Generationen), kein dauerhafter Freiheitsgrad — jedes der 25 Gene traegt
// eine Unterhaltslast und hat damit genau EINEN Attraktor.
//
// Haette man Phase 4 trotzdem in contingency() eingeschaltet, waere die von
// phenomena-check gedruckte P6-Zahl je nach Parametrierung zwischen 0.014 und
// 0.022 gesprungen — reines Schaetzerrauschen bei acht Seeds, das wie ein
// Ergebnis ausgesehen haette. P6 bleibt deshalb BIT-IDENTISCH (0.01955), und
// die Wirkung von Phase 4 wird dort gemessen, wo sie real ist: an ihrem
// Zeitverlauf.

/** Kontingenz-Varianz einer Seed-Schar zu mehreren Zeitpunkten. */
export interface FounderCurveResult {
  gens: number[];
  /** Varianz der Mittel-Genome ueber die Seeds, je Zeitpunkt. */
  variance: number[];
}

function centroidVariance(finals: number[][]): number {
  const NG = finals[0].length;
  const c = new Array<number>(NG).fill(0);
  for (const f of finals) for (let g = 0; g < NG; g++) c[g] += f[g] / finals.length;
  let v = 0;
  for (const f of finals) {
    let d = 0;
    for (let g = 0; g < NG; g++) d += (f[g] - c[g]) ** 2;
    v += d / finals.length;
  }
  return v;
}

/**
 * Zeitverlauf der Kontingenz: gleiche Anfangsbedingung (alle Gene 0.5), gleiche
 * Umwelt, nur andere Zufallssaat — genau der P6-Aufbau, aber MEHRFACH abgelesen
 * statt nur am Ende, und wahlweise mit Gruender-Los (Schritt 4.1) und
 * Sperrklinke (Schritt 4.2).
 */
export function founderCurve(
  phys: Physics,
  opts: {
    lottery?: boolean;
    canalization?: boolean;
    seeds?: number[];
    gens?: number[];
    env?: Environment;
  } = {},
): FounderCurveResult {
  const NG = phys.traits.length;
  const env = opts.env ?? MID_ENV;
  const seeds = opts.seeds ?? Array.from({ length: 24 }, (_, i) => i + 1);
  const gens = opts.gens ?? [0, 20, 70, 300];
  const cfg: Partial<PopulationConfig> = { numGenes: NG };
  if (opts.lottery) {
    cfg.founderLottery = { spread: founderSpreads(new Array<number>(NG).fill(0.5), env, phys) };
  }
  if (opts.canalization) cfg.canalization = DEFAULT_CANALIZATION;
  const pops = seeds.map((s) => new Population(cfg, s, 0.5));
  const variance: number[] = [];
  let t = 0;
  for (const g of gens) {
    while (t < g) {
      for (const p of pops) p.step(env, phys);
      t++;
    }
    variance.push(centroidVariance(pops.map((p) => p.mean())));
  }
  return { gens, variance };
}

// ---------------------------------------------------------------------------
// Dollo-Probe fuer die Sperrklinke (Schritt 4.2).
// ---------------------------------------------------------------------------
//
// Aufbau: eine Population lebt STRESS_GENS Generationen in einer giftigen Welt
// (MID_ENV + toxicity=1). Die Entgiftung (Gen `detox`, Index 10) wird dort
// selektiert und saettigt bei ~0.93. Dann verschwindet das Gift schlagartig, und
// gemessen wird, WIE LANGE die Linie braucht, um das erworbene Merkmal wieder
// abzulegen (bis der Mittelwert unter `threshold` faellt) und WO sie danach zur
// Ruhe kommt.
//
// Das ist die saubere Probe fuer eine Sperrklinke, weil sie beide Haelften der
// Behauptung trennt:
//   - Rueckkehr-DAUER: mit Klinke laenger  -> die Verriegelung wirkt.
//   - Ruhe-LAGE danach: unveraendert       -> sie ueberstimmt die Selektion nicht.
// Ein Mechanismus, der nur das Erste zeigt, koennte auch ein verstecktes
// Fitness-Argument sein; erst das Zweite belegt, dass es reine Drift-Mechanik ist.

export interface DolloResult {
  /** Mittelwert des Gens am Ende der Stress-Phase (erworbener Zustand). */
  peak: number;
  /** Generationen bis der Mittelwert unter `threshold` faellt (-1 = nie). */
  returnGens: number;
  /** Mittelwert nach der vollen Entspannungsphase (die Ruhelage). */
  settled: number;
  /** Verriegelungsgrad des Gens am Ende der Stress-Phase (0..1). */
  lock: number;
}

/** Entgiftung — das Gen, das die giftige Welt selektiert. */
export const DETOX_GENE = 10;

export function dolloReturn(
  phys: Physics,
  opts: {
    canalization?: boolean;
    seeds?: number[];
    gene?: number;
    stressGens?: number;
    relaxGens?: number;
    threshold?: number;
  } = {},
): DolloResult {
  const NG = phys.traits.length;
  const gene = opts.gene ?? DETOX_GENE;
  const seeds = opts.seeds ?? [1, 2, 3, 4, 5, 6, 7, 8];
  const stressGens = opts.stressGens ?? 250;
  const relaxGens = opts.relaxGens ?? 400;
  const threshold = opts.threshold ?? 0.5;
  const stressEnv: Environment = { ...MID_ENV, toxicity: 1 };
  const cfg: Partial<PopulationConfig> = { numGenes: NG };
  if (opts.canalization) cfg.canalization = DEFAULT_CANALIZATION;
  const acc = { peak: 0, returnGens: 0, settled: 0, lock: 0 };
  for (const seed of seeds) {
    const pop = new Population(cfg, seed, 0.5);
    for (let i = 0; i < stressGens; i++) pop.step(stressEnv, phys);
    acc.peak += pop.mean()[gene] / seeds.length;
    acc.lock += pop.canalLock()[gene] / seeds.length;
    let back = -1;
    for (let i = 0; i < relaxGens; i++) {
      pop.step(MID_ENV, phys);
      if (back < 0 && pop.mean()[gene] < threshold) back = i + 1;
    }
    acc.returnGens += (back < 0 ? relaxGens : back) / seeds.length;
    acc.settled += pop.mean()[gene] / seeds.length;
  }
  return acc;
}
