// AUTO-GENERIERT von tools/bundle-app-core.mjs — nicht von Hand editieren.
// Quelle: world/*.ts + engine/fitness.ts (via tsc). Neu bündeln: npm run bundle-app
// Populations-Kern (v2, Umbau — Stufe 1+2).
//
// Eine agentenbasierte Population, die auf der VALIDIERTEN Fitness-Landschaft
// (engine/fitness.ts, physics.json) evolviert — NICHT der Mean-Field-Mittelwert
// der Live-App, sondern der Schwarm selbst. Damit werden Koexistenz und
// evolutionaeres Branching darstellbar (der Mittelwert eines gespaltenen
// Schwarms laege im leeren Tal; siehe spike/FINDINGS.md).
//
// Dynamik = Spiegel des Python-Orakels (oracle/reference_model.py):
// fitness-proportionale Fortpflanzung + Rekombination + gaussche Mutation +
// endliche Population -> Drift. Optional frequenzabhaengige Konkurrenz.
//
// WICHTIG: Beruehrt die Live-App NICHT. Reines headless-Fundament.
import { fitness } from "../engine/fitness.js";
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Seedbarer RNG (mulberry32) — identisch zu Engine/Orakel, fuer Reproduzierbarkeit. */
export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Gauss-Zufall (Box-Muller) aus einem uniformen RNG. */
function makeRandn(rng) {
    return () => {
        const u = Math.max(rng(), 1e-9);
        const v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
}
/** Defaults spiegeln das Orakel (ORACLE_POP/MUT_SD/SEL_POWER/RECOMB_PROB). */
export const DEFAULT_POP_CONFIG = {
    size: 300,
    numGenes: 9,
    mutationSd: 0.06,
    selPower: 2.0,
    recombProb: 0.5,
    startSpread: 0.03,
    competition: null,
};
export class Population {
    cfg;
    genomes;
    rng;
    randn;
    constructor(cfg, seed, start = 0.5) {
        this.cfg = { ...DEFAULT_POP_CONFIG, ...cfg };
        this.rng = mulberry32(seed);
        this.randn = makeRandn(this.rng);
        const { size, numGenes, startSpread } = this.cfg;
        this.genomes = Array.from({ length: size }, () => Array.from({ length: numGenes }, () => clamp01(start + this.randn() * startSpread)));
    }
    get size() {
        return this.genomes.length;
    }
    /** Reproduktions-Gewichte je Individuum (Fitness^selPower, optional /Konkurrenz). */
    weights(env, phys) {
        const { selPower, competition } = this.cfg;
        const base = this.genomes.map((g) => Math.pow(fitness(g, env, phys), selPower));
        if (!competition)
            return base;
        const { axis, sigmaC, sigmaK, kCenter } = competition;
        const x = this.genomes.map((g) => g[axis]);
        const inv2c2 = 1 / (2 * sigmaC * sigmaC);
        const inv2k2 = 1 / (2 * sigmaK * sigmaK);
        const N = this.size;
        const w = new Array(N);
        for (let i = 0; i < N; i++) {
            let n = 0;
            for (let j = 0; j < N; j++) {
                const d = x[i] - x[j];
                n += Math.exp(-d * d * inv2c2);
            }
            n /= N; // mittlere Konkurrenz-Dichte (0..1)
            const dk = x[i] - kCenter;
            const K = Math.exp(-dk * dk * inv2k2);
            w[i] = (base[i] * K) / (n + 1e-9);
        }
        return w;
    }
    /** Ein Individuum fitness-proportional ziehen (Roulette ueber kumulierte Gewichte). */
    pick(cum, total) {
        const r = this.rng() * total;
        // binaere Suche
        let lo = 0;
        let hi = cum.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] < r)
                lo = mid + 1;
            else
                hi = mid;
        }
        return this.genomes[lo];
    }
    /** Eine Generation weiter: Selektion + Rekombination + Mutation. */
    step(env, phys) {
        this.reproduceWith(this.weights(env, phys));
    }
    /**
     * Reproduktion mit EXTERN berechneten Gewichten — erlaubt biotische
     * Interaktionen (Praedation, Konkurrenz zwischen Populationen), deren Fitness
     * nicht allein aus der fixen Landschaft kommt (Stufe 5, world/coevolution.ts).
     */
    reproduceWith(w) {
        const N = this.size;
        // kumulierte Gewichte
        const cum = new Array(N);
        let total = 0;
        for (let i = 0; i < N; i++) {
            total += w[i];
            cum[i] = total;
        }
        const next = new Array(N);
        const { numGenes, recombProb, mutationSd } = this.cfg;
        for (let k = 0; k < N; k++) {
            const pa = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
            const pb = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
            const child = new Array(numGenes);
            for (let g = 0; g < numGenes; g++) {
                const base = this.rng() < recombProb ? pb[g] : pa[g];
                child[g] = clamp01(base + this.randn() * mutationSd);
            }
            next[k] = child;
        }
        this.genomes = next;
    }
    /** Mittleres Genom (nur sinnvoll bei unimodaler Population). */
    mean() {
        const N = this.size;
        const G = this.cfg.numGenes;
        const m = new Array(G).fill(0);
        for (const ind of this.genomes)
            for (let g = 0; g < G; g++)
                m[g] += ind[g];
        return m.map((s) => s / N);
    }
    /** Werte einer Achse (fuer Cluster-Analyse). */
    axisValues(axis) {
        return this.genomes.map((g) => g[axis]);
    }
}
