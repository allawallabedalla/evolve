// ============================================================================
// layer-import-check — prüft eine AUSGELAGERTE Zulieferung (Stufe S4).
//
// Zweck: Die Einordnung der 218 inaktiven Katalog-Faktoren ist Fleißarbeit und
// lässt sich an eine andere KI (oder einen Menschen) abgeben. Damit daraus kein
// Integrationsrisiko wird, ist der Übergabepunkt eine **Datendatei mit hartem
// Vertrag** — kein Patch in gewachsenem Quelltext. Dieses Werkzeug prüft die
// Zulieferung, BEVOR irgendetwas in den Generator übernommen wird.
//
// Geprüft wird:
//   1. Namens-Treue   — jeder Schlüssel muss EXAKT einem Katalog-Faktor
//                       entsprechen (Tippfehler, erfundene Einträge, falsche
//                       Anführungszeichen fallen sofort auf).
//   2. Vollständigkeit— jeder inaktive Faktor kommt genau einmal vor.
//   3. Wertebereich   — `layer` aus der erlaubten Liste, `grund` vorhanden und
//                       kurz, keine Markdown-/HTML-Reste.
//   4. Keine Übergriffe — bereits AKTIVE Faktoren dürfen nicht umetikettiert
//                       werden (die sind gemessen, nicht Meinung).
//   5. WIRKSAMKEIT der Vorschläge — Einträge mit layer "umsetzbar" müssen ein
//                       `env` mitliefern; das wird sofort demselben Konvergenz-
//                       Test unterworfen wie jeder echte Faktor. Ein Vorschlag,
//                       der die Selektion nicht verschiebt, wird abgelehnt.
//
// Aufruf:  node tools/layer-import-check.mjs <datei.json>
// ============================================================================
import { readFileSync } from "node:fs";
import { loadAppCore, loadInfluences, BASE_ENV, AXES } from "./lib/app-core.mjs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: node tools/layer-import-check.mjs <datei.json>"); process.exit(2); }

// Erlaubte Ebenen — jede sagt, WER zuständig ist, statt „kommt bald" zu versprechen.
export const LAYERS = {
  "umsetzbar":      "doch als Umwelt-Zustand abbildbar (dann mit env-Vorschlag)",
  "zeitachse":      "braucht Zyklen/Zeitverlauf (Saisonalität, Schwankung, Puls)",
  "lebende-welt":   "braucht die Metapopulation (Orte, Isolation, Genfluss, Nachbararten)",
  "neue-achse":     "bräuchte eine Umwelt-Achse, die es nicht gibt (CO₂, Gravitation, Magnetfeld …)",
  "neues-gen":      "bräuchte ein neues Gen oder Lebensgeschichte-Merkmal",
  "mechanik":       "betrifft die Evolutions-Mechanik selbst (Drift, Vererbung, Kopplung)",
  "makro-muster":   "emergente Beobachtung, nichts zum Einstellen",
  "schon-regler":   "ist bereits ein Regler in der Konsole",
  "schon-abgedeckt":"deckt sich mit einem bereits aktiven Faktor",
};

const { fitness, classify, converge, envOf, l1 } = loadAppCore("layer-import-check");
const { factors } = loadInfluences();
const byName = new Map(factors.map(f => [f.name, f]));
const inactive = factors.filter(f => f.soon);

let data;
try { data = JSON.parse(readFileSync(file, "utf-8")); }
catch (e) { console.error("✗ Datei ist kein gültiges JSON: " + e.message); process.exit(1); }
if (Array.isArray(data)) data = Object.fromEntries(data.map(e => [e.name, e]));
if (!data || typeof data !== "object") { console.error("✗ Erwartet: Objekt {\"Faktorname\": {...}} oder Liste mit name-Feld."); process.exit(1); }

const fail = [], warn = [];
const keys = Object.keys(data);

// --- 1./3./4. Schlüssel und Werte ------------------------------------------
for (const k of keys) {
  const e = data[k] || {};
  const f = byName.get(k);
  if (!f) { fail.push(`unbekannter Faktor „${k}" — Name stimmt nicht exakt mit dem Katalog überein`); continue; }
  if (!f.soon) { fail.push(`„${k}" ist bereits AKTIV und gemessen — darf nicht umetikettiert werden`); continue; }
  if (!e.layer) { fail.push(`„${k}": kein layer angegeben`); continue; }
  if (!LAYERS[e.layer]) { fail.push(`„${k}": unbekannte Ebene „${e.layer}" (erlaubt: ${Object.keys(LAYERS).join(", ")})`); continue; }
  const g = (e.grund || "").trim();
  if (!g) fail.push(`„${k}": kein Grund angegeben`);
  else {
    if (g.length > 160) fail.push(`„${k}": Grund zu lang (${g.length} > 160 Zeichen)`);
    if (/[<>*_`#|]/.test(g)) fail.push(`„${k}": Grund enthält Markdown-/HTML-Zeichen`);
    if (/^[A-ZÄÖÜ]?\s*$/.test(g)) fail.push(`„${k}": Grund ist leer/inhaltslos`);
  }
}

// --- 2. Vollständigkeit ----------------------------------------------------
{
  const have = new Set(keys);
  const missing = inactive.filter(f => !have.has(f.name));
  if (missing.length) {
    fail.push(`${missing.length} inaktive Faktoren fehlen in der Zulieferung`);
    missing.slice(0, 8).forEach(f => fail.push(`   fehlt: „${f.name}"`));
  }
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) fail.push(`doppelte Schlüssel: ${[...new Set(dupes)].join(", ")}`);
}

// --- 5. Wirksamkeit der „umsetzbar"-Vorschläge -----------------------------
const MIN_SHIFT = 0.25;
const proposals = keys.filter(k => data[k] && data[k].layer === "umsetzbar" && byName.has(k));
let accepted = 0;
if (proposals.length) {
  const baseG = converge(BASE_ENV);
  console.log(`\n  Vorschläge mit env (werden wie echte Faktoren gemessen): ${proposals.length}`);
  for (const k of proposals) {
    const e = data[k];
    if (!e.env || typeof e.env !== "object" || !Object.keys(e.env).length) {
      fail.push(`„${k}": layer „umsetzbar", aber kein env-Vorschlag mitgeliefert`); continue;
    }
    let bad = false;
    for (const [ax, v] of Object.entries(e.env)) {
      if (!AXES.includes(ax)) { fail.push(`„${k}": unbekannte Achse „${ax}"`); bad = true; }
      else if (typeof v !== "number" || v < 0 || v > 1) { fail.push(`„${k}": ${ax}=${v} außerhalb [0,1]`); bad = true; }
    }
    if (bad) continue;
    if (e.tone && !["hit", "shift", "bio"].includes(e.tone)) fail.push(`„${k}": unbekannter tone „${e.tone}"`);
    const env = envOf({ env: e.env });
    const g = converge(env);
    const shift = l1(g, baseG);
    const form = classify(g, env);
    const vit = fitness(g, env);
    const okShift = shift >= MIN_SHIFT && Number.isFinite(vit);
    if (!okShift) fail.push(`„${k}": Vorschlag verschiebt die Selektion kaum (L1 ${shift.toFixed(2)}) — Attrappe, abgelehnt`);
    else accepted++;
    console.log(`    ${okShift ? "✓" : "✗"} ${k.slice(0, 46).padEnd(48)} L1 ${shift.toFixed(2).padStart(5)}  → ${form.n} (${Math.round(vit * 100)} %)`);
  }
  // Dubletten gegen bereits aktive Faktoren
  const active = factors.filter(f => !f.soon);
  for (const k of proposals) {
    const e = data[k]; if (!e.env) continue;
    const A = envOf({ env: e.env });
    for (const f of active) {
      const B = envOf(f);
      let d = 0; for (const ax of AXES) d += Math.abs(A[ax] - B[ax]);
      if (d < 0.12) warn.push(`Vorschlag „${k}" ≈ bestehender Faktor „${f.plain || f.name}" (Abstand ${d.toFixed(2)})`);
    }
  }
}

// --- Bericht ---------------------------------------------------------------
{
  const counts = {};
  for (const k of keys) { const l = (data[k] || {}).layer; if (l) counts[l] = (counts[l] || 0) + 1; }
  console.log(`\n  Verteilung über die Ebenen (${keys.length} Einträge, erwartet ${inactive.length}):`);
  for (const [l, beschreibung] of Object.entries(LAYERS))
    console.log(`    ${String(counts[l] || 0).padStart(4)}  ${l.padEnd(16)} ${beschreibung}`);
}
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  warn.slice(0, 15).forEach(w => console.log("    · " + w));
}
if (fail.length) {
  console.error(`\n✗ layer-import-check: ${fail.length} Beanstandung(en) — nichts wurde übernommen:`);
  fail.slice(0, 30).forEach(f => console.error("   · " + f));
  if (fail.length > 30) console.error(`   … und ${fail.length - 30} weitere`);
  process.exit(1);
}
console.log(`\n✓ layer-import-check bestanden — Zulieferung ist übernahmefähig${proposals.length ? ` (${accepted} von ${proposals.length} env-Vorschlägen bestanden den Wirksamkeits-Test)` : ""}.`);
