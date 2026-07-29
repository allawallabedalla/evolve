// Emergente Arten = Cluster im Genom-Raum einer Population.
//
// Kern-Idee des Umbaus: KEINE handgeschriebene classify()-Kaskade mehr. Eine
// "Art" ist eine Haeufung von Individuen — sie entsteht aus der Dynamik
// (Selektion, Konkurrenz, Isolation) und wird hier nur GEMESSEN.
//
// Drei Werkzeuge:
//  - modes1D: zaehlt Gipfel entlang EINER Achse (Branching-Detektor, spike-Stil).
//  - selectionWeights: Selektions-Relevanz je Gen (behebt Messung 1 aus
//    docs/engine-forschungsergebnis.md — 15 von 25 Genen driften ohne ihren
//    Stressor fast neutral und ertrinken eine ungewichtete Distanz in Rauschen).
//  - clusters: greedy Dichte-Clustering im vollen Genom-Raum (allgemeine Arten),
//    optional mit `weights` aus selectionWeights() fuer eine selektions-
//    gewichtete Metrik statt des rohen 25-D-Euklid-Abstands.

import { fitness } from "../engine/fitness.js";
import type { Environment, Physics } from "../engine/types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Kernel-Dichte auf [0,1] + Zaehlung klar getrennter Gipfel (Multimodalitaet). */
export function modes1D(
  values: number[],
  opts: { bins?: number; bandwidth?: number; valleyRatio?: number; minMass?: number } = {},
): { count: number; peaks: number[] } {
  const bins = opts.bins ?? 64;
  const h = opts.bandwidth ?? 0.05;
  const valleyRatio = opts.valleyRatio ?? 0.6; // Tal muss unter 60% des kleineren Nachbar-Gipfels
  const minMass = opts.minMass ?? 0.05; // Gipfel muss >=5% der Dichte-Masse tragen
  const N = values.length;
  const inv2h2 = 1 / (2 * h * h);
  const dens = new Array<number>(bins).fill(0);
  for (let b = 0; b < bins; b++) {
    const x = (b + 0.5) / bins;
    let s = 0;
    for (let i = 0; i < N; i++) {
      const d = x - values[i];
      s += Math.exp(-d * d * inv2h2);
    }
    dens[b] = s / N;
  }
  const totalMass = dens.reduce((a, c) => a + c, 0);
  // lokale Maxima
  const maxima: number[] = [];
  for (let b = 0; b < bins; b++) {
    const l = b > 0 ? dens[b - 1] : -1;
    const r = b < bins - 1 ? dens[b + 1] : -1;
    if (dens[b] >= l && dens[b] >= r && dens[b] > 0) maxima.push(b);
  }
  // benachbarte Gipfel nur zaehlen, wenn ein echtes Tal dazwischen liegt
  const peaks: number[] = [];
  let lastKept = -1;
  for (const m of maxima) {
    if (lastKept < 0) {
      peaks.push(m);
      lastKept = m;
      continue;
    }
    let valley = Infinity;
    for (let b = lastKept; b <= m; b++) valley = Math.min(valley, dens[b]);
    const smaller = Math.min(dens[lastKept], dens[m]);
    if (valley < valleyRatio * smaller) {
      peaks.push(m);
      lastKept = m;
    } else if (dens[m] > dens[lastKept]) {
      peaks[peaks.length - 1] = m; // gleicher Modus, hoeheren Gipfel behalten
      lastKept = m;
    }
  }
  // Gipfel mit vernachlaessigbarer Masse verwerfen (Fenster um den Gipfel)
  const kept = peaks.filter((b) => {
    let mass = 0;
    const w = Math.max(1, Math.round(h * bins));
    for (let k = -w; k <= w; k++) {
      const idx = b + k;
      if (idx >= 0 && idx < bins) mass += dens[idx];
    }
    return mass / totalMass >= minMass;
  });
  return { count: Math.max(1, kept.length), peaks: kept.map((b) => (b + 0.5) / bins) };
}

/**
 * Selektions-Relevanz je Gen am Populations-Mittelwert (docs/engine-forschungsergebnis.md,
 * Abschnitt 3, Schritt E1). Schaetzt |∂fitness/∂g| per finiter Differenz, normiert auf das
 * Maximum und hebt mit einem Boden von 0.15 an — ein Gen zaehlt fuer die Cluster-Metrik nie
 * ganz null, selbst wenn es in der aktuellen Umwelt (fast) neutral ist. Referenzimplementierung:
 * tools/research/proto.mjs `relevance()`.
 */
export function selectionWeights(mean: number[], env: Environment, phys: Physics): number[] {
  const eps = 0.01;
  const G = mean.length;
  const w = new Array<number>(G);
  for (let g = 0; g < G; g++) {
    const up = mean.slice();
    up[g] = clamp01(up[g] + eps);
    const dn = mean.slice();
    dn[g] = clamp01(dn[g] - eps);
    w[g] = Math.abs(fitness(up, env, phys) - fitness(dn, env, phys)) / (2 * eps);
  }
  const mx = Math.max(...w, 1e-9);
  return w.map((v) => 0.15 + 0.85 * (v / mx));
}

/** Euklidischer Genom-Abstand, optional gen-gewichtet (selektions-gewichtete Metrik). */
function dist(a: number[], b: number[], weights?: number[]): number {
  let s = 0;
  if (weights) {
    for (let i = 0; i < a.length; i++) {
      const d = (a[i] - b[i]) * weights[i];
      s += d * d;
    }
  } else {
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
  }
  return Math.sqrt(s);
}

export interface Cluster {
  centroid: number[];
  size: number;
  fraction: number;
  members: number[]; // Indizes in die Genom-Liste
}

/**
 * Greedy Dichte-Clustering ("leader" mit Dichte-Reihenfolge): findet Haeufungen
 * im vollen Genom-Raum. radius = maximaler Abstand innerhalb einer Art.
 * O(N^2) — fuer N~300..500 unkritisch. minFraction verwirft Mini-Cluster (Rauschen).
 *
 * `weights` (optional, s. selectionWeights()): gewichtet jede Gen-Differenz vor dem
 * Quadrieren (selektions-gewichtete Metrik, Messung 1). Ohne `weights` bleibt das
 * Verhalten EXAKT wie zuvor — der rohe, ungewichtete 25-D-Euklid-Abstand — fuer
 * bestehende Aufrufer (tools/research/*.mjs), die bewusst den Ist-Zustand messen.
 */
export function clusters(
  genomes: number[][],
  opts: { radius?: number; minFraction?: number; weights?: number[] } = {},
): Cluster[] {
  const radius = opts.radius ?? 0.18;
  const minFraction = opts.minFraction ?? 0.04;
  const weights = opts.weights;
  const N = genomes.length;
  if (N === 0) return [];
  // Dichte je Punkt = Anzahl Nachbarn im Radius
  const density = new Array<number>(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (dist(genomes[i], genomes[j], weights) <= radius) {
        density[i]++;
        density[j]++;
      }
    }
  }
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => density[b] - density[a]);
  const assigned = new Array<boolean>(N).fill(false);
  const out: Cluster[] = [];
  for (const seed of order) {
    if (assigned[seed]) continue;
    const members: number[] = [];
    for (let j = 0; j < N; j++) {
      if (!assigned[j] && dist(genomes[seed], genomes[j], weights) <= radius) {
        assigned[j] = true;
        members.push(j);
      }
    }
    const G = genomes[0].length;
    const centroid = new Array<number>(G).fill(0);
    for (const m of members) for (let g = 0; g < G; g++) centroid[g] += genomes[m][g] / members.length;
    out.push({ centroid, size: members.length, fraction: members.length / N, members });
  }
  return out.filter((c) => c.fraction >= minFraction).sort((a, b) => b.size - a.size);
}
