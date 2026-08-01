// Schluessel-Konsistenz (BACKLOG Punkt 12, Schritt 0.1 — docs/artenkatalog-plan.md).
//
// Ab Schritt 0.1 ist der stabile `key` aus app/archetypes.js die Schluessel-Ebene; der
// Anzeigename ist reine Ausgabe. FICON/RARITY/TREE bleiben namensindiziert (Daten
// unveraendert) und werden zur Laufzeit uebersetzt; FORM_KINGDOM/FORM_STORY werden aus
// TREE abgeleitet und stehen seither direkt unter dem Schluessel.
//
// Diese Uebersetzung ist still: ein Tippfehler im Namen faellt einfach auf "dot" /
// "haeufig" / null zurueck, ohne Fehler. Genau das prueft dieser Prüfstand — und
// zugleich, dass die Uebersetzung fuer JEDE Form ueberhaupt aufgeht.
//
// Geprueft wird:
//   K1  Schluessel in app/archetypes.js sind eindeutig.
//   K2  Jeder Name, unter dem eine Tabelle etwas ablegt, ist ein echter Formname
//       (keine verwaisten Eintraege durch Umbenennung/Tippfehler).
//   K3  Jeder Ast des Lebensbaums (TREE) loest auf einen echten Schluessel auf —
//       sonst zaehlte das Genbuch eine Form, die es im Katalog nicht gibt.
//   K4  Jede Form hat ein Icon (FICON) — der Rueckfall "dot" ist ein Fehler, kein Default.
//   K5  Kein Formname steht zweimal im Lebensbaum (sonst zaehlte TREE_TOTAL doppelt,
//       und die Schluessel-Ableitung ueberschriebe sich gegenseitig).
//
// FORM_KINGDOM/FORM_STORY werden zur Laufzeit AUS TREE abgeleitet (und seit Schritt 0.1
// direkt nach Schluessel indiziert) — sie brauchen deshalb keine eigene Pruefung, K3
// deckt sie mit ab.
//
// Bewusst NICHT geprueft: dass jede Form einen RARITY-Rang hat — "haeufig" ist dort
// ein echter, gewollter Default (docs/rarity.json listet nur Abweichungen davon).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");

function grab(re, what) {
  const m = html.match(re);
  if (!m) { console.error(`key-check: ${what} nicht in app/index.html gefunden.`); process.exit(1); }
  return m[0];
}

// Archetyp-Bibliothek laden (dieselbe Technik wie tools/lib/app-core.mjs).
const archWin = {};
new Function("window", readFileSync(join(ROOT, "app", "archetypes.js"), "utf-8"))(archWin);
const forms = archWin.ARCHETYPES.forms;

// Die namensindizierten Tabellen aus dem Inline-Kern holen.
const evalConst = (name, re) => {
  const src = grab(re, name);
  return new Function(`${src}; return ${name};`)();
};
const FICON = evalConst("FICON", /const FICON = \{[\s\S]*?\n\};/);
const RARITY = evalConst("RARITY", /const RARITY = \{[\s\S]*?\n\};/);
const TREE = evalConst("TREE", /const TREE = \[[\s\S]*?\n\];/);

const nameSet = new Set(forms.map((f) => f.n));
const problems = [];
const note = (code, msg) => problems.push(`${code}  ${msg}`);

// K1 — Schluessel eindeutig
const seen = new Map();
for (const f of forms) {
  if (seen.has(f.key)) note("K1", `Schluessel doppelt: "${f.key}" (${seen.get(f.key)} und ${f.n})`);
  else seen.set(f.key, f.n);
}

// K2 — keine verwaisten Tabellen-Eintraege
for (const [label, table] of [["FICON", FICON], ["RARITY", RARITY]]) {
  for (const key of Object.keys(table)) {
    if (!nameSet.has(key)) note("K2", `${label} kennt "${key}", app/archetypes.js aber nicht.`);
  }
}

// K3 — jeder Lebensbaum-Ast loest auf
const treeForms = TREE.flatMap((g) => g.forms.map((f) => ({ ...f, kingdom: g.k })));
for (const f of treeForms) {
  if (!nameSet.has(f.n)) note("K3", `TREE-Ast "${f.n}" hat keine Form in app/archetypes.js.`);
}

// K4 — jede Form hat ein Icon
for (const f of forms) {
  if (!FICON[f.n]) note("K4", `Form "${f.n}" (${f.key}) hat keinen FICON-Eintrag -> stiller Rueckfall auf "dot".`);
}

// K5 — kein Formname doppelt im Baum
const treeSeen = new Set();
for (const f of treeForms) {
  if (treeSeen.has(f.n)) note("K5", `TREE fuehrt "${f.n}" mehrfach — Schluessel-Ableitung ueberschreibt sich.`);
  treeSeen.add(f.n);
}

const kingdoms = [...new Set(treeForms.map((f) => f.kingdom))].sort();
console.log(`key-check — ${forms.length} Formen, ${treeForms.length} Lebensbaum-Aeste, ${kingdoms.length} Reiche (${kingdoms.join(", ")})`);
console.log(`  FICON ${Object.keys(FICON).length} · RARITY ${Object.keys(RARITY).length}`);

if (problems.length) {
  console.error(`\n${problems.length} Problem(e):`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("  alle Schluessel loesen auf ✓");
