// Emergente Arten = Cluster im Genom-Raum einer Population.
//
// Kern-Idee des Umbaus: KEINE handgeschriebene classify()-Kaskade mehr. Eine
// "Art" ist eine Haeufung von Individuen — sie entsteht aus der Dynamik
// (Selektion, Konkurrenz, Isolation) und wird hier nur GEMESSEN.
//
// Zwei Werkzeuge:
//  - modes1D: zaehlt Gipfel entlang EINER Achse (Branching-Detektor, spike-Stil).
//  - clusters: greedy Dichte-Clustering im vollen Genom-Raum (allgemeine Arten).

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

/** Euklidischer Genom-Abstand. */
function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
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
 */
export function clusters(
  genomes: number[][],
  opts: { radius?: number; minFraction?: number } = {},
): Cluster[] {
  const radius = opts.radius ?? 0.18;
  const minFraction = opts.minFraction ?? 0.04;
  const N = genomes.length;
  if (N === 0) return [];
  // Dichte je Punkt = Anzahl Nachbarn im Radius
  const density = new Array<number>(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (dist(genomes[i], genomes[j]) <= radius) {
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
      if (!assigned[j] && dist(genomes[seed], genomes[j]) <= radius) {
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
