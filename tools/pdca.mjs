// PDCA-ZYKLUS ALS EIN BEFEHL — messen, gegen den letzten Stand halten, Regression melden.
//
// WOZU. Die Audits (plausi-check P1–P10, naming-audit N1–N8, catalog-check C1–C8 …)
// liefern jeder fuer sich eine Momentaufnahme. Was fehlte, war die ZWEITE Haelfte des
// Zyklus: hat sich seit dem letzten Mal etwas VERBESSERT oder VERSCHLECHTERT? Ohne die
// muss ein Mensch die Zahlen im Kopf behalten und selbst vergleichen — genau das soll
// dieses Werkzeug abnehmen.
//
// WAS ES TUT
//   1  fuehrt alle Pruefstaende aus (die beiden Audits maschinenlesbar mit --json)
//   2  vergleicht jede Regel mit dem festgehaltenen Stand in docs/pdca-stand.json
//   3  meldet Δ je Regel: besser / schlechter / unveraendert / neu / entfallen
//   4  Exit 1, sobald sich EINE Regel verschlechtert hat — das ist das Tor
//   5  --write schreibt den neuen Stand fest (nur bewusst, nie nebenbei)
//
// WAS ES NICHT TUT — und warum das so bleibt. Es behebt nichts von selbst. Die Befunde
// zerfallen in zwei Klassen, und nur eine davon ist automatisierbar:
//
//   MECHANISCH  eine verifizierbare Tatsache fehlt (eine Klade-QID, eine Schwelle ohne
//               Herkunft, ein Pruefstand, der seine eigene Kopie misst). Solche Punkte
//               kann man ohne Ermessen abarbeiten — man muss sie nur FINDEN, und dafuer
//               ist die Δ-Liste unten da.
//   URTEIL      „Soll die Ueberschrift die Art oder die Klade nennen?" (A3),
//               „specificityBonus senken?" (C4) — hier sagt KEIN Befund, was besser ist.
//               Ein Werkzeug, das das selbst entscheidet, wuerde eine Begruendung
//               erfinden. Diese Punkte gehoeren in den Bericht, nicht in eine Automatik.
//
// Aufruf:  npm run pdca            (messen + vergleichen, Exit 1 bei Regression)
//          npm run pdca -- --write (Stand festschreiben)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STAND_PATH = join(ROOT, "docs", "pdca-stand.json");
const WRITE = process.argv.includes("--write");

// ---------------------------------------------------------------------------
// 1 · MESSEN
//
// Die beiden Audits liefern --json. Die uebrigen Pruefstaende haben kein maschinelles
// Format; von ihnen wird nur der Ausgang (bestanden/gerissen) uebernommen — das reicht,
// um eine Regression zu erkennen, und erfindet keine Genauigkeit, die es nicht gibt.
const lauf = (datei, args = []) => {
  try {
    return { ok: true, out: execFileSync("node", [join(ROOT, "tools", datei), ...args],
      { encoding: "utf-8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (err) {
    return { ok: false, out: (err.stdout || "") + (err.stderr || "") };
  }
};

const regeln = new Map();   // id -> {pruefstand, titel, wert, einheit, gerissen}
const fehler = [];

for (const datei of ["plausi-check.mjs", "naming-audit.mjs"]) {
  const r = lauf(datei, ["--json"]);
  let daten = null;
  try { daten = JSON.parse(r.out.slice(r.out.indexOf("{"))); } catch { /* unten gemeldet */ }
  if (!daten) { fehler.push(`${datei}: keine JSON-Ausgabe (${r.out.trim().split("\n").pop() || "leer"})`); continue; }
  for (const g of daten.regeln)
    regeln.set(g.id, { pruefstand: daten.pruefstand, titel: g.titel, wert: g.wert, einheit: "%", gerissen: g.gerissen });
}

// Pruefstaende ohne JSON: nur Ausgang. `wert` 0 = bestanden, 1 = gerissen.
const BINAER = [
  { datei: "catalog-check.mjs", id: "CAT", titel: "Katalog-Format, Schluessel, Budget" },
  { datei: "key-check.mjs", id: "KEY", titel: "Alle Form-Schluessel loesen auf" },
  { datei: "exemplar-check.mjs", id: "EXE", titel: "Jeder Archetyp hat Vorbild + Icon" },
  { datei: "app-parity.mjs", id: "PAR", titel: "App-Inline-fitness deckt sich mit der Engine" },
  { datei: "bundle-app-fitness.mjs", id: "BND", titel: "app/index.html auf dem generierten Stand", args: ["--check"] },
];
for (const b of BINAER) {
  const r = lauf(b.datei, b.args || []);
  const gerissen = !r.ok || /Problem\(e\)|✗|FEHLER/.test(r.out);
  regeln.set(b.id, { pruefstand: b.datei.replace(".mjs", ""), titel: b.titel, wert: gerissen ? 1 : 0, einheit: "", gerissen });
}

// ---------------------------------------------------------------------------
// 2 · VERGLEICHEN
const alt = existsSync(STAND_PATH) ? JSON.parse(readFileSync(STAND_PATH, "utf-8")) : null;
const altRegeln = new Map(Object.entries(alt?.regeln || {}));

// Bei jeder Regel gilt: KLEINER IST BESSER. Bei naming-audit gibt es Regeln, deren
// Schwelle ein Mindestwert ist (N1 „Anteil gemessener Werte", N6 „Vorsprung") — dort ist
// GROESSER besser. Die Richtung steht in der JSON-Ausgabe des Audits; hier wird sie an
// der Regel-ID festgemacht, damit der Vergleich nicht von der Prosa abhaengt.
const GROESSER_IST_BESSER = new Set(["N1", "N6"]);
const besser = (id, neu, vorher) =>
  GROESSER_IST_BESSER.has(id) ? neu > vorher : neu < vorher;

const zeilen = [];
let regressionen = 0, verbesserungen = 0, neu = 0;
for (const [id, g] of [...regeln].sort()) {
  const v = altRegeln.get(id);
  if (!v) { zeilen.push({ id, art: "neu", text: `${id}  ${g.titel}: ${g.wert}${g.einheit} (neu)` }); neu++; continue; }
  if (g.wert === v.wert) continue;
  const b = besser(id, g.wert, v.wert);
  if (b) verbesserungen++; else regressionen++;
  zeilen.push({ id, art: b ? "besser" : "schlechter",
    text: `${id}  ${g.titel}: ${v.wert}${g.einheit} → ${g.wert}${g.einheit}` });
}
const entfallen = [...altRegeln.keys()].filter((id) => !regeln.has(id));

// ---------------------------------------------------------------------------
// 3 · BERICHT
console.log("PDCA — Stand gegen " + (alt ? `${STAND_PATH.replace(ROOT + "/", "")} (${alt.gemessenAm})` : "nichts (erster Lauf)"));
console.log("─".repeat(72));
for (const f of fehler) console.log(`⚠ ${f}`);

const zeig = (art, zeichen) => {
  const l = zeilen.filter((z) => z.art === art);
  for (const z of l) console.log(`${zeichen} ${z.text}`);
};
zeig("schlechter", "✗");
zeig("besser", "✓");
zeig("neu", "+");
for (const id of entfallen) console.log(`- ${id}  entfallen (Regel gibt es nicht mehr)`);
if (!zeilen.length && !entfallen.length) console.log("keine Aenderung gegenueber dem festgehaltenen Stand.");

const offen = [...regeln].filter(([, g]) => g.gerissen);
console.log("─".repeat(72));
console.log(`${offen.length} von ${regeln.size} Regeln gerissen · ${verbesserungen} besser · ${regressionen} schlechter · ${neu} neu`);
if (offen.length) {
  console.log("\noffen (nach Wert absteigend):");
  for (const [id, g] of offen.sort((a, b) => b[1].wert - a[1].wert))
    console.log(`  ${id.padEnd(5)} ${String(g.wert).padStart(6)}${g.einheit}  ${g.titel}`);
}

// ---------------------------------------------------------------------------
// 4 · STAND FESTSCHREIBEN
if (WRITE) {
  const out = {
    _kommentar: "Festgehaltener Regelstand fuer tools/pdca.mjs. Wird NUR mit --write "
      + "erneuert, damit eine Verschlechterung nicht still zum neuen Normal wird. "
      + "Werte in Prozent (Anteil betroffener Faelle) bzw. 0/1 bei Pruefstaenden ohne "
      + "maschinelles Format. Bei N1/N6 ist GROESSER besser, sonst kleiner.",
    gemessenAm: new Date().toISOString().slice(0, 10),
    regeln: Object.fromEntries([...regeln].sort().map(([id, g]) => [id, {
      pruefstand: g.pruefstand, titel: g.titel, wert: g.wert, gerissen: g.gerissen,
    }])),
  };
  writeFileSync(STAND_PATH, JSON.stringify(out, null, 1) + "\n");
  console.log(`\n${STAND_PATH.replace(ROOT + "/", "")} geschrieben.`);
  process.exit(0);
}

if (fehler.length) process.exit(2);
process.exit(regressionen ? 1 : 0);
