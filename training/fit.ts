// Trainings-Schleife: kalibriert die MITTELFELD-Engine gegen das Referenz-Orakel.
//
// Methode: genetischer Algorithmus (passenderweise!) sucht die Engine-Parameter,
// die die Orakel-Trajektorien der TRAININGS-Szenarien am besten nachbilden.
// Danach wird die Validitaet auf ZURUECKGEHALTENEN Test-Szenarien gemessen
// (Overfitting-Schutz).
//
// ===========================================================================
// GELTUNGSBEREICH — WICHTIG SEIT MIGRATIONS-STUFE 4 (BACKLOG.md Punkt 2)
// ===========================================================================
// Was hier gefittet wird, ist der MITTELFELD-PFAD: engine/simulate.ts
// (`runSimulation`/`stepGeneration`), ein Gradientenaufstieg auf EINEM
// Merkmals-Mittelwert. Dieser Pfad ist NICHT mehr das produktive System. Die
// Live-App laeuft seit Migrations-Stufe 4 auf einem echten Populations-Schwarm
// (world/population.ts, N=200) und benutzt weder `EngineParams` noch
// fitted-params.json.
//
// `validityTrain`/`validityTest`/`trainMAE`/`testMAE` sind deshalb KEIN Mass fuer
// die Realitaetstreue des Spiels. Sie messen genau eine Sache: wie gut die
// Mittelfeld-Naeherung die (gemittelte) Orakel-Trajektorie nachzeichnet. Ein
// Mittelwert kann eine multimodale Verteilung prinzipiell nicht abbilden — der
// Mittelwert eines gespaltenen Schwarms liegt im leeren Tal dazwischen
// (spike/FINDINGS.md); die verbleibende Luecke zum Ziel-Band ist zum Teil genau
// diese strukturelle Grenze, nicht ein Kalibrierungsmangel.
//
// Die Guete des PRODUKTIVEN Systems misst seit Migrations-Stufe 6 ein anderer,
// verteilungsbasierter Pruefstand: tools/spectrum-check.mjs (Jensen-Shannon-
// Divergenz der Formhaeufigkeiten, Browser-N=200 gegen Orakel-N=2000). Das ist
// auch die Quelle von Score_C im Realitaetstreue-Loop
// (training/fidelity-config.ts) — nicht mehr `validityTest`.
//
// WARUM DAS TROTZDEM BLEIBT (statt geloescht zu werden, wie
// docs/engine-forschungsergebnis.md Abschnitt 6.3 vorschlug): fitted-params.json
// ist kein totes Gewicht. Es wird aktiv gelesen von tools/ecology-check.mjs
// (`npm run ecology`, ein Gate), cli/demo.ts (`npm run demo`),
// mockup/index.html sowie tools/research/{biome,reach}.mjs. Der Mittelfeld-Pfad
// selbst ist ausserdem der dokumentierte Rueckfallpfad der App, wenn der
// dynamische Import des Populations-Bundles fehlschlaegt (app/index.html, Stufe
// 4/5). Solange diese Nutzer existieren, braucht der Pfad kalibrierte
// Parameter — und die kommen von hier.
//
// Autonomie-Regel (mit dir abgestimmt): hier werden NUR kontinuierliche
// Parameter automatisch gefittet. Struktur (neue Gene/Mechaniken) bleibt eine
// bewusste, bestaetigte Entscheidung und passiert NICHT hier.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runSimulation } from "../engine/index.js";
import type { EngineParams, Environment, Physics, TraitVector } from "../engine/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", ".."); // dist/training -> repo root

// ---- Ziel-Band (mit dir abgestimmt) ----
// Gilt fuer den Mittelfeld-Pfad, s. GELTUNGSBEREICH oben — NICHT fuer die Live-App.
const TARGET_LOW = 80;
const TARGET_HIGH = 90;
// Skala fuer die Validitaets-Umrechnung: MAE 0 -> 100%, MAE >= 0.25 -> 0%.
const VALIDITY_SCALE = 0.25;

// ---- Genbreite ----
// Bindend aus physics.json (== engine/types.ts TRAITS, s. Kommentar dort) gelesen,
// NICHT hartcodiert - sonst fittet der GA nur einen Praefix der Gene und die
// restlichen bleiben aus dem Vektor draussen (Befund 2026-07-29, s. BACKLOG.md Punkt 9).
const physForBounds: Physics = JSON.parse(
  readFileSync(join(ROOT, "physics.json"), "utf-8"),
);
const NUM_GENES = physForBounds.traits.length;
// Erste 10 Gene = universelle Kern-Gene (Bau/Energie/Verteidigung), Rest = bedingte
// Kosten-Gene (Stressor-Resistenzen/Nischen-Mechaniken) - dieselbe Konvention wie
// mutationAnchor (s. engine/types.ts DEFAULT_ENGINE_PARAMS, app/index.html PARAMS).
const KERN_GENE_COUNT = 10;
const MUTATION_ANCHOR = Array.from({ length: NUM_GENES }, (_, i) =>
  i < KERN_GENE_COUNT ? 0.5 : 0.12,
);

// ---- Parameter-Grenzen fuer den GA ----
// Reihenfolge: responseRate[0..NUM_GENES-1], mutationRate, selectionStrength, varianceWeight.
// mutationAnchor ist KEIN GA-Parameter - er ist a-priori aus der Kern/Kosten-Konvention
// abgeleitet (s. oben) und wird in vecToParams() fix angehaengt.
// responseRate/selectionStrength weiter gefasst, weil die Varianz-Daempfung die
// effektiven Schritte verkleinert - schnelle Szenarien brauchen mehr Spielraum.
const BOUNDS: [number, number][] = [
  ...Array.from({ length: NUM_GENES }, () => [0.005, 0.8] as [number, number]),
  [0.0, 0.12], // mutationRate
  [0.3, 6.0], // selectionStrength
  [0.0, 1.0], // varianceWeight
];
const DIM = BOUNDS.length;

// ---- Seedbarer RNG (mulberry32) fuer reproduzierbares Training ----
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240607);
function randn(): number {
  // Box-Muller
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

interface Scenario {
  name: string;
  split: "train" | "test";
  generations: number;
  env: Environment;
}
interface Benchmark {
  name: string;
  trajectory: TraitVector[];
}

function vecToParams(v: number[]): EngineParams {
  return {
    responseRate: v.slice(0, NUM_GENES),
    mutationRate: v[NUM_GENES],
    selectionStrength: v[NUM_GENES + 1],
    varianceWeight: v[NUM_GENES + 2],
    mutationAnchor: MUTATION_ANCHOR,
  };
}

/** Mittlerer absoluter Fehler zwischen Engine- und Orakel-Trajektorie. */
function trajectoryMAE(a: TraitVector[], b: TraitVector[]): number {
  const len = Math.min(a.length, b.length);
  const dim = a[0].length;
  let sum = 0;
  let count = 0;
  for (let t = 0; t < len; t++) {
    for (let g = 0; g < dim; g++) {
      sum += Math.abs(a[t][g] - b[t][g]);
      count++;
    }
  }
  return sum / count;
}

function meanMAEover(
  scenarios: Scenario[],
  benchmarks: Map<string, Benchmark>,
  params: EngineParams,
  phys: Physics,
): number {
  let sum = 0;
  for (const sc of scenarios) {
    const bench = benchmarks.get(sc.name);
    if (!bench) continue;
    const result = runSimulation(sc.env, sc.generations, phys, params);
    sum += trajectoryMAE(result.trajectory, bench.trajectory);
  }
  return sum / scenarios.length;
}

function clampToBounds(v: number[]): number[] {
  return v.map((x, i) => {
    const [lo, hi] = BOUNDS[i];
    return x < lo ? lo : x > hi ? hi : x;
  });
}

function randomVector(): number[] {
  return BOUNDS.map(([lo, hi]) => lo + rng() * (hi - lo));
}

function maeToValidity(mae: number): number {
  const v = 100 * (1 - mae / VALIDITY_SCALE);
  return v < 0 ? 0 : v > 100 ? 100 : v;
}

function main() {
  const phys: Physics = physForBounds;
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(ROOT, "scenarios.json"), "utf-8"),
  ).scenarios;

  // Orakel-Benchmarks laden
  const benchIndex: { name: string; file: string }[] = JSON.parse(
    readFileSync(join(ROOT, "oracle", "benchmark", "index.json"), "utf-8"),
  );
  const benchmarks = new Map<string, Benchmark>();
  for (const entry of benchIndex) {
    const b: Benchmark = JSON.parse(
      readFileSync(join(ROOT, "oracle", "benchmark", entry.file), "utf-8"),
    );
    benchmarks.set(b.name, b);
  }

  const trainSet = scenarios.filter((s) => s.split === "train");
  const testSet = scenarios.filter((s) => s.split === "test");
  console.log(
    `Training an ${trainSet.length} Szenarien, Validierung an ${testSet.length} zurueckgehaltenen.`,
  );

  // ---- Genetischer Algorithmus ----
  // Budget skaliert mit der Parameterzahl (DIM Dim bei NUM_GENES Genen, seit der
  // 25-Gene-Erweiterung 28 statt vorher 12 - POP entsprechend angehoben).
  const POP = 160;
  const GENS = 160;
  const ELITE = 3;
  const TOURN = 3;

  let population = Array.from({ length: POP }, randomVector);
  const evalLoss = (v: number[]) =>
    meanMAEover(trainSet, benchmarks, vecToParams(clampToBounds(v)), phys);
  let scored = population.map((v) => ({ v, loss: evalLoss(v) }));
  scored.sort((a, b) => a.loss - b.loss);

  // Zufalls-Immigranten je Generation (staendige Frischluft gegen vorzeitige
  // Plateaubildung in dem seit der 25-Gen-Erweiterung deutlich groesseren Suchraum).
  const IMMIGRANTS = Math.round(POP * 0.08);

  for (let gen = 0; gen < GENS; gen++) {
    const next: number[][] = scored.slice(0, ELITE).map((s) => s.v.slice());
    for (let i = 0; i < IMMIGRANTS; i++) next.push(randomVector());
    while (next.length < POP) {
      // Turnierselektion
      const pick = () => {
        let best = scored[Math.floor(rng() * scored.length)];
        for (let i = 1; i < TOURN; i++) {
          const c = scored[Math.floor(rng() * scored.length)];
          if (c.loss < best.loss) best = c;
        }
        return best.v;
      };
      const pa = pick();
      const pb = pick();
      // Uniforme Rekombination + gausssche Mutation
      const child = pa.map((_, i) => {
        let g = rng() < 0.5 ? pa[i] : pb[i];
        const [lo, hi] = BOUNDS[i];
        const sd = (hi - lo) * 0.08;
        if (rng() < 0.3) g += randn() * sd;
        return g;
      });
      next.push(clampToBounds(child));
    }
    population = next;
    scored = population.map((v) => ({ v, loss: evalLoss(v) }));
    scored.sort((a, b) => a.loss - b.loss);

    if (gen % 10 === 0 || gen === GENS - 1) {
      const best = scored[0];
      console.log(
        `  Gen ${String(gen).padStart(3)}: Train-MAE ${best.loss.toFixed(4)}  ` +
          `(~${maeToValidity(best.loss).toFixed(1)}% Train-Validitaet)`,
      );
    }
  }

  const bestVec = clampToBounds(scored[0].v);
  const bestParams = vecToParams(bestVec);

  const trainMAE = meanMAEover(trainSet, benchmarks, bestParams, phys);
  const testMAE = meanMAEover(testSet, benchmarks, bestParams, phys);
  const validityTrain = maeToValidity(trainMAE);
  const validityTest = maeToValidity(testMAE);

  const output = {
    _comment:
      "Automatisch von training/fit.ts erzeugt. Gelesen von tools/ecology-check.mjs, " +
      "cli/demo.ts, mockup/index.html und tools/research/{biome,reach}.mjs. " +
      "GELTUNGSBEREICH: 'params' kalibriert AUSSCHLIESSLICH den Mittelfeld-Pfad " +
      "(engine/simulate.ts). 'validityTest' ist die Distillations-Guete DIESES Pfads " +
      "gegen das Orakel - NICHT die Realitaetstreue der Live-App: die laeuft seit " +
      "Migrations-Stufe 4 auf dem Populations-Schwarm (world/population.ts) und liest " +
      "diese Datei nicht. Guete des produktiven Systems: tools/spectrum-check.mjs " +
      "(Jensen-Shannon-Divergenz der Formhaeufigkeiten).",
    params: bestParams,
    validityTrain,
    validityTest,
    trainMAE,
    testMAE,
    targetLow: TARGET_LOW,
    targetHigh: TARGET_HIGH,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(ROOT, "fitted-params.json"), JSON.stringify(output, null, 2), "utf-8");

  console.log("\n=== Trainingsergebnis (Mittelfeld-Pfad, NICHT die Live-App) ===");
  console.log(`Train-Validitaet: ${validityTrain.toFixed(1)}%`);
  console.log(
    `Test-Validitaet (zurueckgehalten): ${validityTest.toFixed(1)}%  <- Distillations-Guete des Mittelfeld-Pfads`,
  );
  console.log(`Ziel-Band: ${TARGET_LOW}-${TARGET_HIGH}%`);
  // Rundungskonsistent zum angezeigten Wert (1 Nachkommastelle).
  const shown = Math.round(validityTest * 10) / 10;
  const inBand = shown >= TARGET_LOW && shown <= TARGET_HIGH;
  const status = inBand
    ? shown < TARGET_LOW + 1
      ? `im Ziel-Band (unteres Ende; roh ${validityTest.toFixed(2)}%).`
      : "im Ziel-Band."
    : shown > TARGET_HIGH
      ? "ueber dem Band - Mittelfeld-Naeherung evtl. zu nah am schweren Modell."
      : "unter dem Band - die Mittelfeld-NAEHERUNG bildet die Orakel-Trajektorie " +
        "unvollstaendig ab (zum Teil strukturell, s. GELTUNGSBEREICH oben). KEINE " +
        "Aussage ueber die Live-App.";
  console.log(`Status: ${status}`);
  console.log("Gespeichert: fitted-params.json");
  console.log(
    "Hinweis: diese Zahl bewertet den Mittelfeld-Pfad. Die Verteilungs-Treue des\n" +
      "produktiven Schwarms misst 'npm run spectrum-check' (Migrations-Stufe 6).",
  );
}

main();
