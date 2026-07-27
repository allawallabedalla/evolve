// ============================================================================
// gene-import-check — prüft eine Zulieferung von Gen-Erklärungen (Paket P6).
//
// Die 25 Gene der Engine haben bisher KEINE Erklärung im Spiel — nur den Namen
// am Balken. Diese Texte werden als Tooltip (title-Attribut) angezeigt, wenn
// der Spieler über ein Gen fährt.
//
// Geprüft wird:
//   1. Vollständigkeit — alle 25 Gene, per Index, keine Dubletten.
//   2. Form            — Länge, ganzer Satz, kein Markdown.
//   3. Umlaute         — ASCII-Umschrift (gemeinsame Prüfung, siehe lib/umlaut-check).
//   4. Eindeutigkeit    — keine zwei Gene mit (fast) demselben Text.
//   5. Ton              — keine Absichts-Sprache (dieselbe Leitplanke wie die Chronik:
//                         ein Gen "hat einen Nutzen", es "will" nichts).
//
// Aufruf:  node tools/gene-import-check.mjs <datei.json>
// ============================================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/app-core.mjs";
import { umschrift } from "./lib/umlaut-check.mjs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: node tools/gene-import-check.mjs <datei.json>"); process.exit(2); }

const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const GENE_LABELS = eval(html.match(/const GENE_LABELS = \[.*?\];/)[0].replace("const GENE_LABELS = ", "").replace(/;$/, ""));

let data;
try { data = JSON.parse(readFileSync(file, "utf-8")); }
catch (e) { console.error("✗ Datei ist kein gültiges JSON: " + e.message); process.exit(1); }
if (Array.isArray(data)) data = Object.fromEntries(data.map(e => [e.index != null ? e.index : e.label, e]));

const fail = [], warn = [];
const FORBIDDEN = /\b(will|wollen|wollte|möchte|möchten|versucht|versuchen|beschließt|strebt|lernt|bemüht)\b/i;
const seen = new Map();

for (let i = 0; i < GENE_LABELS.length; i++) {
  const label = GENE_LABELS[i];
  const e = data[i] ?? data[label];
  if (!e) { fail.push(`Gen ${i} „${label}": fehlt in der Zulieferung`); continue; }
  const d = (e.erklaerung || "").trim();
  if (!d) { fail.push(`Gen ${i} „${label}": keine Erklärung`); continue; }
  if (d.length < 40) fail.push(`„${label}": zu kurz (${d.length} < 40 Zeichen)`);
  if (d.length > 160) fail.push(`„${label}": zu lang (${d.length} > 160 Zeichen — das ist ein Tooltip, kein Absatz)`);
  if (!/[.!?]$/.test(d)) fail.push(`„${label}": endet ohne Satzzeichen`);
  if (!/^[A-ZÄÖÜ]/.test(d)) fail.push(`„${label}": beginnt klein`);
  if (/[<>*_`#|]/.test(d)) fail.push(`„${label}": Markdown-/HTML-Zeichen`);
  if (/!/.test(d)) fail.push(`„${label}": Ausrufezeichen (ruhiger Ton)`);
  if (FORBIDDEN.test(d)) fail.push(`„${label}": Absichts-Sprache — ein Gen hat einen Nutzen, es „will" nichts`);
  if (umschrift(d).length) fail.push(`„${label}": ASCII-Umschrift statt Umlaut (${umschrift(d).slice(0, 3).join(", ")})`);
  if (d.toLowerCase().includes(label.toLowerCase())) warn.push(`„${label}": Erklärung nennt den Gen-Namen selbst — meist überflüssig im Tooltip`);
  const key = d.toLowerCase().replace(/\s+/g, " ").trim();
  if (seen.has(key)) fail.push(`„${label}": Text fast identisch mit „${seen.get(key)}"`);
  else seen.set(key, label);
}

console.log(`  Umfang: ${GENE_LABELS.length} Gene erwartet`);
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  warn.forEach(w => console.log("    · " + w));
}
if (fail.length) {
  console.error(`\n✗ gene-import-check: ${fail.length} Beanstandung(en) — nichts wurde übernommen:`);
  fail.slice(0, 30).forEach(f => console.error("   · " + f));
  process.exit(1);
}
console.log("\n✓ gene-import-check bestanden — Zulieferung ist übernahmefähig.");
