// AUTO-GENERIERT von tools/bundle-app-core.mjs — nicht von Hand editieren.
// Quelle: world/*.ts + engine/fitness.ts (via tsc). Neu bündeln: npm run bundle-app
// Emergente Arten-Erfassung (v2, Umbau — Stufe 6): der „Chronik / Baum des
// Lebens"-Backend. Sammelt die Arten einer Welt als CLUSTER — prozedural benannt
// (world/describe.ts), über Orte aggregiert. Keine handgeschriebene classify()-
// Kaskade: eine Art ist eine Häufung, ihr Name kommt aus ihrem Genom.
//
// Das ist die „Beobachten"-Ebene der Veränderung-IA (nicht schalten, nur ansehen).
import { clusters } from "./cluster.js";
import { describe, formKey, kingdomOf } from "./describe.js";
import { rarityOf } from "./rarity.js";
/** Arten-Zensus über alle Orte: Cluster je Ort → prozedural benannt → nach Identität aggregiert. */
export function census(world, opts = {}) {
    const radius = opts.radius ?? 0.7;
    const minFraction = opts.minFraction ?? 0.06;
    const byKey = new Map();
    const nPlaces = world.places.length;
    for (let i = 0; i < nPlaces; i++) {
        const place = world.places[i];
        const cl = clusters(place.pop.genomes, { radius, minFraction });
        for (const c of cl) {
            const key = formKey(c.centroid);
            let sp = byKey.get(key);
            if (!sp) {
                sp = {
                    key,
                    name: describe(c.centroid),
                    kingdom: kingdomOf(c.centroid),
                    centroid: c.centroid,
                    places: [],
                    abundance: 0,
                };
                if (opts.rarityMap) {
                    const r = rarityOf(key, opts.rarityMap);
                    sp.rarity = r.tier;
                    sp.rarityFraction = r.fraction;
                }
                byKey.set(key, sp);
            }
            if (!sp.places.includes(place.name))
                sp.places.push(place.name);
            sp.abundance += c.fraction / nPlaces; // Ortsanteil, welt-normiert
        }
    }
    return [...byKey.values()].sort((a, b) => b.abundance - a.abundance);
}
/** Kompakte Zeile je Art (für Chronik-Ausgabe / Debug). */
export function formatSpecies(s) {
    const pct = (s.abundance * 100).toFixed(0);
    const rar = s.rarity ? `  ·  ${s.rarity}` : "";
    return `${s.name}  ·  ${pct}%  ·  [${s.places.join(", ")}]${rar}`;
}
