// Migrations-Stufe 3 (Punkt 2, BACKLOG.md/docs/engine-forschungsergebnis.md Abschnitt 6.4):
// Abnahme-Diagnose fuer den mehrdimensionalen Konkurrenz-Kernel + gestreute Gruender-Genome
// in world/population.ts — mit der PRODUKTIVEN Klasse (Population/CompetitionConfig,
// founderSpread:"uniform"), nicht der separaten Implementierung aus tools/research/proto.mjs.
// Misst dieselben Kennzahlen wie proto.mjs (Cluster/Lauf, Formenvielfalt, Koexistenz) auf
// denselben 11 Biom-Presets, mit derselben Cluster-Erkennung (jetzt produktiv aus
// world/cluster.ts: clusters() + selectionWeights(), Stufe 1) statt der proto.mjs-eigenen
// wclusters()/relevance()-Kopie.
//
// Kein Gate (kein process.exit(1)) — reine Referenzmessung nach dem Muster von
// tools/research/proto.mjs, s. README.md in diesem Ordner.
//
// Aufruf: npm run build && node tools/research/niche-swarm-check.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Population } from "../../dist/world/population.js";
import { clusters, selectionWeights } from "../../dist/world/cluster.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const NG = phys.traits.length;

// Identische 11 Biom-Presets wie tools/research/proto.mjs (fuer direkte Vergleichbarkeit).
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
// Nischen-Achsen: dieselben 8 wie proto.mjs — size, limb, photo, mobility, armor, wing, biolum, filter.
const NICHE = [1, 2, 5, 6, 4, 8, 9, 15];
const N = 200;
const GENS = 250;
const SEEDS_PER_BIOME = 5;
// proto.mjs' eigene wclusters()-Aufrufparameter (radius/minFrac) — fuer 1:1 Vergleichbarkeit
// mit der Stufe-1-Abnahme (1.47 Cluster/Lauf) bewusst identisch uebernommen.
const RADIUS = 0.35;
const MIN_FRACTION = 0.08;

/**
 * Zwei Kernel-Varianten, weil proto.mjs (bereits verifiziert: 1.47 Cluster/Lauf) den
 * Ressourcen-Term K(x) NICHT implementiert (nur Dichte-Teilung), waehrend
 * docs/engine-forschungsergebnis.md Abschnitt 3 (Pseudocode B2) UND die produktive
 * world/population.ts K(x) als festen Bestandteil des Kernels fuehren (schon in der
 * bestehenden Ein-Achsen-Konkurrenz seit Stufe 0). Damit ist "K faktisch aus" (sigmaK
 * sehr gross, K~1 fuer alle Individuen) die dynamik-genaue Reproduktion von proto.mjs;
 * "K aktiv" (sigmaK=0.35, wie im dokumentierten SwarmConfig) ist die volle,
 * dokumentierte Rezeptur. Beide werden gemessen und berichtet — s. README/Abnahmebericht.
 */
const VARIANTS = [
  { label: "K faktisch aus (sigmaK=50, reproduziert proto.mjs-Dynamik)", sigmaK: 50 },
  { label: "K aktiv (sigmaK=0.35, volles SwarmConfig aus Abschnitt 3)", sigmaK: 0.35 },
];

function runVariant(sigmaK) {
  console.log(`\n### Nischen-Schwarm (produktive Population-Klasse): ${SEEDS_PER_BIOME} Läufe je Biom, N=${N}, ${GENS} Gen`);
  console.log(`    Kernel: axes=${JSON.stringify(NICHE)} sigmaC=0.22 sigmaK=${sigmaK} kCenter=0.5, founderSpread=uniform\n`);

  const all = new Map(); // Formname -> aufsummierter Anteil (welt-normiert)
  let totCl = 0, runs = 0;
  const coexistBiomes = [];
  const t0 = performance.now();

  for (const [name, env] of BIOMES) {
    const seen = new Map(); // Formname -> gemittelter Anteil ueber die 5 Laeufe dieses Bioms
    let biomeClusterCount = 0;
    for (let r = 0; r < SEEDS_PER_BIOME; r++) {
      const seed = ((r + 1) * 2654435761) >>> 0;
      const pop = new Population(
        {
          size: N,
          numGenes: NG,
          mutationSd: 0.05,
          selPower: 2.0,
          recombProb: 0.5,
          founderSpread: "uniform",
          competition: { axes: NICHE, sigmaC: 0.22, sigmaK, kCenter: 0.5 },
        },
        seed,
      );
      for (let g = 0; g < GENS; g++) pop.step(env, phys);

      // Produktive Messkette aus Stufe 1: selektions-gewichtete Metrik + clusters().
      const w = selectionWeights(pop.mean(), env, phys);
      const cl = clusters(pop.genomes, { radius: RADIUS, minFraction: MIN_FRACTION, weights: w });
      totCl += cl.length;
      runs++;
      biomeClusterCount += cl.length;
      for (const c of cl) {
        const n = classify(c.centroid).n;
        seen.set(n, (seen.get(n) ?? 0) + c.fraction / SEEDS_PER_BIOME);
        all.set(n, (all.get(n) ?? 0) + c.fraction);
      }
    }
    if (seen.size >= 2) coexistBiomes.push(name);
    const s = [...seen].sort((a, b) => b[1] - a[1]).map(([n, f]) => `${n} ${(100 * f).toFixed(0)}%`).join(", ");
    console.log(`${name.padEnd(20)}| ${s}  (${(biomeClusterCount / SEEDS_PER_BIOME).toFixed(2)} Cluster/Lauf)`);
  }

  const dur = performance.now() - t0;
  console.log(`\nDauer: ${dur.toFixed(0)}ms für ${runs} Läufe (${(dur / runs).toFixed(1)} ms/Lauf à ${GENS} Gen)`);
  const clusterPerRun = totCl / runs;
  console.log(`Mittlere Cluster/Lauf: ${clusterPerRun.toFixed(2)}`);
  const denom = [...all.values()].reduce((a, c) => a + c, 0);
  console.log(`\n### Gesamtverteilung (${all.size} verschiedene Formen über ${BIOMES.length} Biome)`);
  for (const [n, f] of [...all].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${(100 * f / denom).toFixed(2).padStart(6)}%  ${n}`);
  }
  console.log(`\nKoexistenz (>=2 Formen im selben Biom): ${coexistBiomes.length} von ${BIOMES.length} Biome  [${coexistBiomes.join(", ")}]`);
  return { clusterPerRun, formCount: all.size, coexistCount: coexistBiomes.length };
}

console.log("=".repeat(78));
console.log("Migrations-Stufe 3 — Abnahme-Diagnose: mehrdimensionaler Konkurrenz-Kernel");
console.log("+ gestreute Gruender-Genome, produktive Population-Klasse (world/population.ts)");
console.log("=".repeat(78));

const results = VARIANTS.map((v) => {
  console.log(`\n${"-".repeat(78)}\nVariante: ${v.label}\n${"-".repeat(78)}`);
  return { ...v, ...runVariant(v.sigmaK) };
});

console.log(`\n${"=".repeat(78)}`);
console.log("### Zusammenfassung gegen die Abnahme-Kriterien\n");
console.log("Referenz tools/research/proto.mjs (eigene, separate Implementierung): 1.47 Cluster/Lauf, 20 Formen, 11 Biome.");
console.log("BACKLOG.md Stufe-3-Kriterium (docs/engine-forschungsergebnis.md Abschnitt 6.4): >= 18 Formen über 11 Biome, Koexistenz in >= 5 Biomen.\n");
for (const r of results) {
  const clOk = r.clusterPerRun >= 1.3;
  const formOk = r.formCount >= 18;
  const coexOk = r.coexistCount >= 5;
  console.log(`${r.label}`);
  console.log(`  Cluster/Lauf:        ${r.clusterPerRun.toFixed(2)}  (Ziel >= 1.3:  ${clOk ? "OK" : "FAIL"})`);
  console.log(`  Formenvielfalt:      ${r.formCount}  (Ziel >= 18: ${formOk ? "OK" : "FAIL"})`);
  console.log(`  Koexistenz-Biome:    ${r.coexistCount} von ${BIOMES.length}  (Ziel >= 5: ${coexOk ? "OK" : "FAIL"})`);
  console.log("");
}
