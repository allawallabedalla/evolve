// Aktualisiert docs/tree-of-life.json mit ECHTEN Daten (BACKLOG Punkt 12, Schritt 2.1
// — docs/artenkatalog-plan.md Abschnitt 1, Punkt 3 "Der echte Lebensbaum").
//
// Die Datei war bisher komplett handkuratiert ("gefetcht via WebSearch, OTOL/GBIF-API
// im Sandbox-Netz geblockt", s. `_comment`) — Artenzahlen aus der Literatur geschaetzt,
// Klade-Namen ohne QID. Jetzt liegt vor: eine echte Wikidata-Ernte (1.1, 20.178 Arten
// mit vollstaendiger Elterntaxon-Kette) und ein verifiziertes Kladen-Regelwerk (1.2,
// 194 gegen echte Ketten gepruefte QIDs). Dieses Skript ergaenzt JEDEN Knoten um:
//
//   qid              Wikidata-ID (verifiziert per wbsearchentities/SPARQL-Label,
//                     s. Kommentare unten — keine geratenen IDs).
//   harvestedSpecies  Arten in UNSERER dewiki-gefilterten Ernte, deren Elternkette
//                     dieses QID enthaelt (bzw. deren `root`, fuer die 25 Wurzel-
//                     Kladen des Harvesters) — ein GEMESSENER, exakt reproduzierbarer
//                     Wert, klar getrennt von der LITERATUR-Schaetzung `describedSpecies`
//                     (die bleibt stehen: sie beschreibt die reale Welt, nicht unsere
//                     dewiki-Stichprobe, und ist deshalb keine Konkurrenz-Zahl).
//   observedForms     Welche Bauplan-Gruppen tatsaechlich aus Arten unter diesem QID
//                     entstehen (matchArchetype() auf dem echten Katalog, Schritt 1.4) —
//                     Gegenprobe zum handkuratierten `ourForms`.
//
// FUND BEIM AUFBAUEN (clade-rules.mjs, Schritt 1.2): zwei der bisherigen Klade-Zuordnungen
// waren auf Wikidata-Ebene schlicht falsch bzw. nicht auflösbar:
//   - "Farne" zeigte gedanklich auf Q80005 — das ist KEIN Taxon-Item (kein P225, kein
//     P171). Korrigiert auf Q373615 (Polypodiopsida, verifiziert).
//   - "Gymnospermae" lief nur ueber Q133712 — Koniferen haengen in Wikidata aber NICHT
//     darunter, sondern ueber Q132825. clade-rules.mjs traegt seither BEIDE QIDs; dieses
//     Skript uebernimmt dieselbe Korrektur.
//
// Aufruf: node tools/build-tree-reference.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TREE_PATH = join(ROOT, "docs", "tree-of-life.json");
const HARVEST_PATH = join(ROOT, "tools", ".harvest-state.json");

// node-id -> QID(s). Herkunft je Eintrag kommentiert. "root:X" heisst: identisch zu
// einer der 25 Wurzel-Kladen aus tools/wikidata-harvest.mjs (dort schon per
// wbsearchentities verifiziert) — Zaehlung ueber das `root`-Feld der Ernte, nicht
// ueber Lineage-Scan (schneller UND exakt, weil root pro Art eindeutig ist).
const NODE_QID = {
  bacteria: { qid: ["Q10876"], root: "Bakterien" },
  archaea: { qid: ["Q10872"], root: "Archaeen" },
  amoebozoa: { qid: ["Q473809"], root: "Amoebozoa" },
  discoba: { qid: ["Q499086"], root: "Euglenozoa" },
  rhizaria: { qid: ["Q855740"] }, // verifiziert per wbsearchentities (2026-08-01), kein Ernte-Root -> Lineage-Scan
  chlorophyta: {}, // keine eigene Wurzel-Klade geerntet, Unterast von Bedecktsamer-Nachbarn -> ausgelassen (s. u.)
  bryophyta: { qid: ["Q25347"], root: "Laubmoose" },
  polypodiopsida: { qid: ["Q373615"] }, // KORRIGIERT — Q80005 ist kein Taxon-Item (s. Kopfkommentar)
  gymnospermae: { qid: ["Q133712", "Q132825"] }, // KORRIGIERT — zwei QIDs, s. Kopfkommentar
  angiospermae: { qid: ["Q25314"], root: "Bedecktsamer" },
  ascomycota: { qid: ["Q174726"], root: "Ascomycota" },
  basidiomycota: { qid: ["Q174698"], root: "Basidiomycota" },
  annelida: { qid: ["Q25522"] }, // verifiziert, kein Ernte-Root
  insecta: { qid: ["Q1390"], root: "Insekten" },
  crustacea: { qid: ["Q25364"], root: "Krebstiere" },
  actinopterygii: { qid: ["Q127282"], root: "Strahlenflosser" },
  amphibia: { qid: ["Q10908"], root: "Amphibien" },
  reptilia: { qid: ["Q10811"], root: "Reptilien" },
  aves: { qid: ["Q5113"], root: "Voegel" },
  mammalia: { qid: ["Q7377"], root: "Saeugetiere" },
  mollusca: { qid: ["Q25326"], root: "Weichtiere" },
  cephalopoda: { qid: ["Q128257"] }, // verifiziert, Unterast von Weichtiere
  cnidaria: { qid: ["Q25441"], root: "Nesseltiere" },
  porifera: { qid: ["Q18960"] }, // verifiziert
  sulfobacteria: { qid: ["Q134239"] }, // verifiziert (Chromatiales, naechstliegendes Wikidata-Taxon)
  deinococcus_thermus: { qid: ["Q134886"] }, // verifiziert
  euryarchaeota: { qid: ["Q204219"] }, // verifiziert
  cupressaceae: { qid: ["Q146037"] }, // verifiziert
  tardigrada: { qid: ["Q5194"] }, // verifiziert
  echinodermata: { qid: ["Q44631"], root: "Stachelhaeuter" },
};

const tree = JSON.parse(readFileSync(TREE_PATH, "utf-8"));
const harvest = JSON.parse(readFileSync(HARVEST_PATH, "utf-8"));
// QID ist der Objekt-SCHLUESSEL in harvest.species, kein Feld im Wert — muss explizit
// mitgefuehrt werden, sonst verliert jede Art ihre Identitaet fuer den Katalog-Join.
const species = Object.entries(harvest.species).map(([qid, v]) => ({ qid, ...v }));

// Katalog fuer die Gegenprobe "welche Bauplan-Gruppe entsteht wirklich" — optional,
// nur wenn app/catalog.js schon im FULL-Modus vorliegt (Schritt 1.4).
let catalogByQid = null;
try {
  const catWin = {};
  new Function("window", readFileSync(join(ROOT, "app", "catalog.js"), "utf-8"))(catWin);
  if (catWin.CATALOG?.stage === "full") {
    catalogByQid = new Map(catWin.CATALOG.entries.map((e) => [e.qid, e.group]));
  }
} catch { /* Katalog fehlt oder ist Bootstrap — Gegenprobe entfaellt, kein Fehler */ }

function countByRoot(root) {
  return species.filter((s) => s.root === root).length;
}
function countByLineage(qids) {
  const set = new Set(qids);
  return species.filter((s) => (s.lineage || []).some((q) => set.has(q))).length;
}

let updated = 0, corrected = 0;
for (const node of tree.nodes) {
  const info = NODE_QID[node.id];
  if (!info || !info.qid) continue;
  const prevQid = node.qid;
  node.qid = info.qid.length === 1 ? info.qid[0] : info.qid;
  if (JSON.stringify(prevQid) !== JSON.stringify(node.qid)) corrected++;
  node.harvestedSpecies = info.root ? countByRoot(info.root) : countByLineage(info.qid);
  node.harvestedSpeciesNote = "gemessen in unserer dewiki-gefilterten Ernte (tools/wikidata-harvest.mjs, Stand 2026-08-01) — kein Ersatz fuer describedSpecies (Literatur-Schaetzung der REALEN Welt), sondern eine zweite, exakt reproduzierbare Zahl.";
  updated++;
}

// Gegenprobe "beobachtete Bauplan-Gruppen" ueber den echten Katalog (Schritt 1.4).
if (catalogByQid) {
  const byQidSet = {};
  for (const [id, info] of Object.entries(NODE_QID)) if (info.qid) byQidSet[id] = new Set(info.qid);
  for (const node of tree.nodes) {
    const qidSet = byQidSet[node.id];
    if (!qidSet) continue;
    const groups = new Map();
    for (const s of species) {
      if (!(s.lineage || []).some((q) => qidSet.has(q))) continue;
      const grp = catalogByQid.get(s.qid);
      if (grp) groups.set(grp, (groups.get(grp) || 0) + 1);
    }
    node.observedForms = Object.fromEntries([...groups.entries()].sort((a, b) => b[1] - a[1]));
  }
}

// Idempotent: nur einmal anhaengen, ein zweiter Lauf soll dieselbe Datei erzeugen
// (Reproduzierbarkeit ist hier genauso Pflicht wie bei den anderen Erzeugern im Repo).
const ADDENDUM_MARK = "NEU (Schritt 2.1)";
if (!tree._comment.includes(ADDENDUM_MARK)) {
  tree._comment += ` ${ADDENDUM_MARK}: \`qid\` (verifizierte Wikidata-ID), `
    + "`harvestedSpecies` (gemessen in unserer Ernte) und `observedForms` (welche Bauplan-"
    + "Gruppen echte Arten unter diesem QID im vollen Katalog tatsaechlich treffen) "
    + "ergaenzt einige Knoten — `describedSpecies`/`estimatedSpecies` (Literatur) bleiben "
    + "unveraendert stehen, sie beschreiben eine andere Frage (die reale Welt, nicht "
    + "unsere dewiki-Stichprobe).";
}
tree.generatedAt = "2026-08 (harvestedSpecies/observedForms ergänzt, s. tools/build-tree-reference.mjs)";

writeFileSync(TREE_PATH, JSON.stringify(tree, null, 2) + "\n");
console.log(`${updated} von ${tree.nodes.length} Knoten mit QID/harvestedSpecies ergänzt (${corrected} QID-Korrekturen).`);
if (!catalogByQid) console.log("Hinweis: app/catalog.js nicht im FULL-Modus — observedForms übersprungen.");
