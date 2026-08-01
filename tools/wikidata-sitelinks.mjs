// dewiki-Artikeltitel nachladen (BACKLOG Punkt 12, Schritt 1.4 — Vorbedingung).
//
// WARUM DIESES SKRIPT EXISTIERT. tools/wikidata-harvest.mjs filtert auf Arten MIT
// deutschem Wikipedia-Artikel (`?a schema:about ?t ; schema:isPartOf <dewiki>`),
// selektiert aber nie `?a` selbst — der Ernte-Zustand weiss also, DASS ein Artikel
// existiert, nicht WIE er heisst. Fuer bekannte Arten ist der Artikeltitel der
// deutsche Trivialname ("Eisbär"), nicht der wissenschaftliche Name ("Ursus
// maritimus") — ein Katalog-Link auf `sci` waere für genau die Arten falsch, die am
// meisten gelesen werden. Dieses Skript schliesst die Luecke.
//
// VERFAHREN. Batches von 50 QIDs (wbgetentities-Limit) gegen die Action-API, Feld
// `sitelinks.dewiki.title`. Deutlich billiger als die Ernte selbst: keine
// Kladen-Traversierung, nur ein Nachschlagen pro Art -> ~20.000/50 = 404 Anfragen.
//
// Aufruf: node tools/wikidata-sitelinks.mjs   (ergaenzt `wiki` in .harvest-state.json)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HARVEST = join(ROOT, "tools", ".harvest-state.json");
const UA = "evolve-artenkatalog/0.1 (https://github.com/allawallabedalla/evolve)";
const BATCH = 50;
const PAUSE = 150;
let lastCall = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, attempt = 0) {
  const wait = lastCall + PAUSE - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
  if (r.status === 429 && attempt < 4) { await sleep(1000 * 2 ** attempt); return api(url, attempt + 1); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const harvest = JSON.parse(readFileSync(HARVEST, "utf-8"));
const qids = Object.keys(harvest.species).filter((q) => !harvest.species[q].wiki);
console.log(`${qids.length} von ${Object.keys(harvest.species).length} Arten ohne Artikeltitel.`);

let done = 0, missing = 0;
for (let i = 0; i < qids.length; i += BATCH) {
  const batch = qids.slice(i, i + BATCH);
  let d;
  try {
    d = await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join("|")}`
      + "&props=sitelinks&sitefilter=dewiki&format=json");
  } catch (err) {
    console.error(`  ! Batch @${i}: ${err.message} — übersprungen, nächster Lauf holt nach.`);
    continue;
  }
  for (const qid of batch) {
    const title = d.entities?.[qid]?.sitelinks?.dewiki?.title;
    if (title) harvest.species[qid].wiki = title; else missing++;
  }
  done += batch.length;
  if (done % 500 < BATCH) process.stdout.write(`\r  ${done}/${qids.length} …`);
  // Zwischenspeichern alle ~20 Batches — bei einem Abbruch geht nicht der ganze Lauf verloren.
  if ((i / BATCH) % 20 === 0) writeFileSync(HARVEST, JSON.stringify(harvest));
}
process.stdout.write("\n");
writeFileSync(HARVEST, JSON.stringify(harvest));
console.log(`Fertig. ${missing} Arten ohne dewiki-Sitelink trotz Ernte-Filter (vermutlich seither gelöschter/verschobener Artikel).`);
