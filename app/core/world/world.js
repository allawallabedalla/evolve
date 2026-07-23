// AUTO-GENERIERT von tools/bundle-app-core.mjs — nicht von Hand editieren.
// Quelle: world/*.ts + engine/fitness.ts (via tsc). Neu bündeln: npm run bundle-app
// Metapopulation (v2, Umbau — Stufe 3).
//
// Mehrere Orte (Place), jeder mit eigener Umwelt und eigener Population. Zwischen
// Orten fliesst — je nach Isolations-/Verbindungs-Matrix — Genmaterial (Migration).
// So entsteht Vielfalt aus dem RAUM: isolierte Orte divergieren, verbundene
// homogenisieren; Katastrophe + Wieder-Besiedlung erzeugt Founder-Effekte.
//
// Das ist der leichtere, in der Natur dominierende Weg zur Vielfalt (allopatrische
// Artbildung / Inselbiogeografie): jeder Ort darf eine eigene Linie sein — kein
// Populations-internes Branching noetig (das liefert Stufe 2 zusaetzlich).
//
// Beruehrt die Live-App NICHT.
import { Population, mulberry32 } from "./population.js";
export class World {
    phys;
    places = [];
    /** migration[i][j] = Anteil der Population j, der pro Schritt aus i einwandert. */
    migration = [];
    popConfig;
    rng;
    seedCounter;
    constructor(cfg) {
        this.phys = cfg.phys;
        this.popConfig = cfg.popConfig ?? {};
        this.seedCounter = (cfg.seed ?? 1) >>> 0;
        this.rng = mulberry32(this.seedCounter * 2654435761);
    }
    nextSeed() {
        return (this.seedCounter = (this.seedCounter * 1103515245 + 12345) >>> 0);
    }
    /** Neuen Ort anlegen (eigene Population, startet monomorph nahe `start`). */
    addPlace(name, env, start = 0.5) {
        const pop = new Population(this.popConfig, this.nextSeed(), start);
        const place = { name, env, pop };
        this.places.push(place);
        // Migrations-Matrix auf neue Groesse erweitern (Default: isoliert)
        const n = this.places.length;
        this.migration = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => this.migration[i]?.[j] ?? 0));
        return place;
    }
    /** Symmetrische Verbindung (Migrations-Rate in beide Richtungen). */
    connect(i, j, rate) {
        this.migration[i][j] = rate;
        this.migration[j][i] = rate;
    }
    /** Verbindung kappen (Isolation). */
    isolate(i, j) {
        this.migration[i][j] = 0;
        this.migration[j][i] = 0;
    }
    /** „Zustand ändern" — Umwelt-Regler eines Orts anpassen (provozieren). */
    setEnv(i, partial) {
        this.places[i].env = { ...this.places[i].env, ...partial };
    }
    /**
     * „Ereignis auslösen" — der eine Backend-Einstiegspunkt fürs spätere
     * Veränderung-UI (Ereignis-Knopf). Dispatcht auf die konkreten Aktionen.
     */
    triggerEvent(placeIdx, ev) {
        switch (ev.type) {
            case "catastrophe":
                this.catastrophe(placeIdx, ev.survivorFraction ?? 0.05);
                break;
            case "colonize":
                this.colonize(ev.from, placeIdx, ev.founders ?? 5);
                break;
            case "climateShift":
                this.setEnv(placeIdx, ev.to);
                break;
        }
    }
    /** Ein Welt-Schritt: lokale Evolution, dann Migration. */
    step() {
        for (const p of this.places)
            p.pop.step(p.env, this.phys);
        this.migrate();
    }
    migrate() {
        const n = this.places.length;
        // Schnappschuss vor dem Austausch (symmetrischer, gleichzeitiger Fluss)
        const snap = this.places.map((p) => p.pop.genomes.map((g) => g.slice()));
        for (let j = 0; j < n; j++) {
            const N = this.places[j].pop.size;
            for (let i = 0; i < n; i++) {
                if (i === j)
                    continue;
                const rate = this.migration[i][j];
                if (rate <= 0)
                    continue;
                const count = Math.round(rate * N);
                const srcN = snap[i].length;
                for (let k = 0; k < count; k++) {
                    const src = snap[i][(this.rng() * srcN) | 0];
                    const dst = (this.rng() * N) | 0;
                    this.places[j].pop.genomes[dst] = src.slice();
                }
            }
        }
    }
    /**
     * „Ereignis" — Founder-Kolonisation: Ort `to` wird von wenigen Individuen aus
     * `from` neu besiedelt (Genpool = nur diese n → starker Diversitäts-Verlust).
     */
    colonize(from, to, founders = 5) {
        const src = this.places[from].pop.genomes;
        const N = this.places[to].pop.size;
        const seeds = [];
        for (let k = 0; k < founders; k++)
            seeds.push(src[(this.rng() * src.length) | 0].slice());
        const next = new Array(N);
        for (let k = 0; k < N; k++)
            next[k] = seeds[(this.rng() * founders) | 0].slice();
        this.places[to].pop.genomes = next;
    }
    /**
     * „Ereignis" — Katastrophe: nur `survivorFraction` überlebt; der Rest wird aus
     * den Überlebenden neu befüllt (Flaschenhals → Diversitäts-Verlust + Drift).
     */
    catastrophe(i, survivorFraction = 0.05) {
        const pop = this.places[i].pop;
        const N = pop.size;
        const s = Math.max(1, Math.round(survivorFraction * N));
        const survivors = [];
        for (let k = 0; k < s; k++)
            survivors.push(pop.genomes[(this.rng() * N) | 0].slice());
        const next = new Array(N);
        for (let k = 0; k < N; k++)
            next[k] = survivors[(this.rng() * s) | 0].slice();
        pop.genomes = next;
    }
    /** Mittlere paarweise Genom-Distanz einer Population (Diversitäts-Mass). */
    diversity(i) {
        const g = this.places[i].pop.genomes;
        const N = g.length;
        const G = g[0].length;
        // Stichprobe fuer O(1)-ish: bis 120 Paare
        let sum = 0, cnt = 0;
        const step = Math.max(1, Math.floor(N / 40));
        for (let a = 0; a < N; a += step) {
            for (let b = a + step; b < N; b += step) {
                let d = 0;
                for (let k = 0; k < G; k++) {
                    const dd = g[a][k] - g[b][k];
                    d += dd * dd;
                }
                sum += Math.sqrt(d);
                cnt++;
            }
        }
        return cnt ? sum / cnt : 0;
    }
    /**
     * Nächster-Nachbar-Diversität: mittlerer Abstand jedes Individuums zu seinem
     * nächsten Nachbarn. Fällt scharf, wenn wenige Linien existieren (Founder/
     * Flaschenhals → viele Duplikate) — anders als die mittlere paarweise Distanz,
     * die eine Zufalls-Stichprobe nicht ändert. Das richtige Redundanz-Mass.
     */
    diversityNN(i, sample = 80) {
        const g = this.places[i].pop.genomes;
        const N = g.length;
        const G = g[0].length;
        const step = Math.max(1, Math.floor(N / sample));
        const idx = [];
        for (let a = 0; a < N; a += step)
            idx.push(a);
        let sum = 0;
        for (const a of idx) {
            let best = Infinity;
            for (const b of idx) {
                if (a === b)
                    continue;
                let d = 0;
                for (let k = 0; k < G; k++) {
                    const dd = g[a][k] - g[b][k];
                    d += dd * dd;
                }
                if (d < best)
                    best = d;
            }
            sum += Math.sqrt(best);
        }
        return sum / idx.length;
    }
    /** Mittleres Genom eines Orts. */
    mean(i) {
        return this.places[i].pop.mean();
    }
}
/** Genom-Distanz zwischen zwei Orts-Mittelwerten (fuer Divergenz-Messung). */
export function meanDistance(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++)
        s += (a[i] - b[i]) ** 2;
    return Math.sqrt(s);
}
