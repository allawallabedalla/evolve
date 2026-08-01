// Eltern-Cache und Kettenaufloesung — gemeinsam genutzt von tools/wikidata-lineage.mjs
// (das den Cache fuellt) und tools/impute-check.mjs (das ihn liest).
//
// WARUM EIN EIGENES MODUL. tools/.harvest-state.json wird von der laufenden Ernte
// (tools/wikidata-harvest.mjs) aus deren Speicherabbild ueberschrieben — ein dort
// eingetragenes `lineage`-Feld kann also jederzeit wieder verschwinden, solange die
// Ernte laeuft. tools/.lineage-cache.json ist deshalb die QUELLE DER WAHRHEIT: aus ihm
// laesst sich jede Kette ohne Netz in Millisekunden neu aufloesen. Wer Ketten braucht,
// nimmt zuerst das Feld im Ernte-Zustand und faellt sonst auf diesen Cache zurueck.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CACHE_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", ".lineage-cache.json");

/** Schutz vor Zyklen in Wikidatas Taxonomie (P171 ist dort nicht garantiert azyklisch). */
export const MAX_DEPTH = 40;

/** { parent: {qid:[qid,...]}, rank: {qid:"species"} } — leer, wenn es die Datei nicht gibt. */
export function loadLineageCache(path = CACHE_PATH) {
  if (!existsSync(path)) return { parent: {}, rank: {} };
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Vorfahrenmenge eines Taxons in Breitensuch-Reihenfolge (naechster Vorfahr zuerst).
 *
 * KEINE einfache Kette, sondern eine MENGE: P171 ist in Wikidata nicht funktional,
 * manche Taxa haben zwei Elterntaxa (konkurrierende Backbones — z. B. die drei
 * parallelen Bedecktsamer-Items, s. tools/lib/clade-rules.mjs). Fuer die Konsumenten
 * ist das die richtige Form: applyCladeRules() fragt Mengenzugehoerigkeit ab, und die
 * hierarchische Imputation braucht nur „naeher zuerst“, nicht „genau ein Vorfahr“.
 */
export function chainOf(cache, qid) {
  const out = [], seen = new Set([qid]);
  let front = cache.parent[qid] || [];
  for (let d = 0; d < MAX_DEPTH && front.length; d++) {
    const next = [];
    for (const p of front) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(p);
      for (const g of cache.parent[p] || []) if (!seen.has(g)) next.push(g);
    }
    front = next;
  }
  return out;
}
