// ============================================================================
// plain-import-check — prüft eine Zulieferung von Klartextnamen + Erklärungen
// für den Faktoren-Katalog (Paket P3).
//
// Diese Texte stehen dem Spieler direkt im Modal vor der Nase. Sie sind das
// Gesicht des Katalogs: der Fachbegriff bleibt als Untertitel stehen, aber die
// fette Zeile und der Erklärsatz müssen ohne Vorwissen verständlich sein.
//
// Geprüft wird:
//   1. Schlüssel   — Faktor-Namen exakt, alle 218, keine Dubletten, keine
//                    Umetikettierung eines bereits aktiven Faktors.
//   2. Klartextname— Länge, keine Schrägstrich-Listen, keine Klammer-Kaskaden,
//                    nicht bloß der Fachbegriff nochmal, unter sich eindeutig.
//   3. Erklärung   — Länge, ganzer Satz, kein Markdown, beginnt nicht mit dem
//                    Fachbegriff, wiederholt nicht nur den Namen.
//   4. UMLAUTE     — keine ASCII-Umschrift („braeuchte", „Groesse"). Das ist
//                    beim ersten Paket real passiert und musste nachträglich
//                    von Hand repariert werden.
//   5. Verständlichkeit — Anteil sehr langer Wörter und ungeklärter Fachbegriffe
//                    aus einer Sperrliste; beides sind Näherungen, aber sie
//                    fangen den Fall „Fachbegriff mit Fachbegriff erklärt".
//
// Aufruf:  node tools/plain-import-check.mjs <datei.json>
// ============================================================================
import { readFileSync } from "node:fs";
import { loadInfluences } from "./lib/app-core.mjs";
import { umschrift } from "./lib/umlaut-check.mjs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: node tools/plain-import-check.mjs <datei.json>"); process.exit(2); }

const { factors } = loadInfluences();
const byName = new Map(factors.map(f => [f.name, f]));
const inactive = factors.filter(f => f.soon);

let data;
try { data = JSON.parse(readFileSync(file, "utf-8")); }
catch (e) { console.error("✗ Datei ist kein gültiges JSON: " + e.message); process.exit(1); }
if (Array.isArray(data)) data = Object.fromEntries(data.map(e => [e.name, e]));

const fail = [], warn = [];
const keys = Object.keys(data);

// Fachbegriffe, die in einer Erklärung nicht ohne Umschreibung stehen sollten.
const JARGON = ["allopatrisch", "sympatrisch", "parapatrisch", "panmiktisch", "Panmixie", "Epistasie",
  "Pleiotropie", "Allel", "Allele", "Introgression", "Vagilität", "Propagul", "Ökoton", "Phänologie",
  "stochastisch", "Metapopulation", "Genotyp", "Phänotyp", "Fitnesslandschaft", "Adaptation",
  "Diversifikation", "Kladogenese", "Anagenese", "Heterozygotie", "Fixierung", "Drift"];

const plainSeen = new Map();
for (const k of keys) {
  const e = data[k] || {};
  const f = byName.get(k);
  if (!f) { fail.push(`unbekannter Faktor „${k}" — Name stimmt nicht exakt mit dem Katalog überein`); continue; }
  if (!f.soon) { fail.push(`„${k}" ist bereits aktiv und hat schon Namen und Text`); continue; }

  // --- 2. Klartextname ---
  const p = (e.klartext || "").trim();
  if (!p) { fail.push(`„${k}": kein Klartextname`); }
  else {
    if (p.length > 42) fail.push(`„${k}": Klartextname zu lang (${p.length} > 42 Zeichen, passt nicht ins Modal)`);
    if (p.length < 6) fail.push(`„${k}": Klartextname zu kurz (${p.length})`);
    if (!/^[A-ZÄÖÜ]/.test(p)) fail.push(`„${k}": Klartextname beginnt klein — das ist eine Überschrift`);
    if ((p.match(/\//g) || []).length > 0) fail.push(`„${k}": Klartextname enthält „/" — er soll EINE Sache benennen, keine Liste`);
    if ((p.match(/\(/g) || []).length > 1) fail.push(`„${k}": Klartextname mit mehreren Klammern`);
    if (p === k) fail.push(`„${k}": Klartextname ist der Fachbegriff selbst`);
    if (/[<>*_`#|]/.test(p)) fail.push(`„${k}": Markdown-/HTML-Zeichen im Klartextnamen`);
    if (umschrift(p).length) fail.push(`„${k}": ASCII-Umschrift statt Umlaut im Namen (${umschrift(p).join(", ")})`);
    const pk = p.toLowerCase();
    if (plainSeen.has(pk)) fail.push(`„${k}": Klartextname „${p}" schon vergeben an „${plainSeen.get(pk)}"`);
    else plainSeen.set(pk, k);
  }

  // --- 3. Erklärung ---
  const d = (e.erklaerung || "").trim();
  if (!d) { fail.push(`„${k}": keine Erklärung`); continue; }
  if (d.length < 40) fail.push(`„${k}": Erklärung zu kurz (${d.length} < 40 Zeichen)`);
  if (d.length > 200) fail.push(`„${k}": Erklärung zu lang (${d.length} > 200 Zeichen)`);
  if (!/[.!?]$/.test(d)) fail.push(`„${k}": Erklärung endet ohne Satzzeichen`);
  if (!/^[A-ZÄÖÜ]/.test(d)) fail.push(`„${k}": Erklärung beginnt klein`);
  if (/[<>*_`#|]/.test(d)) fail.push(`„${k}": Markdown-/HTML-Zeichen in der Erklärung`);
  if (umschrift(d).length) fail.push(`„${k}": ASCII-Umschrift statt Umlaut (${umschrift(d).slice(0, 3).join(", ")})`);
  if (p && d.toLowerCase().startsWith(p.toLowerCase())) warn.push(`„${k}": Erklärung wiederholt zuerst den Namen`);
  const lang = (d.match(/[A-Za-zÄÖÜäöüß]{16,}/g) || []);
  if (lang.length > 2) warn.push(`„${k}": ${lang.length} sehr lange Wörter (${lang.slice(0, 2).join(", ")}…)`);
  const jw = JARGON.filter(j => new RegExp("\\b" + j + "\\w*", "i").test(d));
  if (jw.length > 1) warn.push(`„${k}": mehrere ungeklärte Fachbegriffe (${jw.slice(0, 3).join(", ")})`);
}

// --- 1. Vollständigkeit ----------------------------------------------------
{
  const have = new Set(keys);
  const missing = inactive.filter(f => !have.has(f.name));
  if (missing.length) {
    fail.push(`${missing.length} von ${inactive.length} Faktoren fehlen in der Zulieferung`);
    missing.slice(0, 6).forEach(f => fail.push(`   fehlt: „${f.name}"`));
  }
}

// --- Bericht ---------------------------------------------------------------
{
  const plains = keys.map(k => (data[k] || {}).klartext).filter(Boolean);
  const erkl = keys.map(k => (data[k] || {}).erklaerung).filter(Boolean);
  const avg = a => Math.round(a.reduce((s, x) => s + x.length, 0) / (a.length || 1));
  console.log(`  Umfang: ${keys.length}/${inactive.length} Faktoren · Klartextnamen Ø ${avg(plains)} Zeichen · Erklärungen Ø ${avg(erkl)} Zeichen`);
  const woerter = erkl.join(" ").match(/[A-Za-zÄÖÜäöüß]+/g) || [];
  const langAnteil = woerter.filter(w => w.length >= 14).length / (woerter.length || 1);
  console.log(`  Verständlichkeit: ${(langAnteil * 100).toFixed(1)} % der Wörter sind 14+ Zeichen lang (Richtwert: unter 6 %)`);
  if (langAnteil > 0.06) warn.push(`${(langAnteil * 100).toFixed(1)} % sehr lange Wörter — die Erklärungen bleiben zu fachlich`);
}
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  warn.slice(0, 15).forEach(w => console.log("    · " + w));
  if (warn.length > 15) console.log(`    … und ${warn.length - 15} weitere`);
}
if (fail.length) {
  console.error(`\n✗ plain-import-check: ${fail.length} Beanstandung(en) — nichts wurde übernommen:`);
  fail.slice(0, 30).forEach(f => console.error("   · " + f));
  if (fail.length > 30) console.error(`   … und ${fail.length - 30} weitere`);
  process.exit(1);
}
console.log("\n✓ plain-import-check bestanden — Zulieferung ist übernahmefähig.");
