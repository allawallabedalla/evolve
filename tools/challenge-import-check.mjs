// ============================================================================
// challenge-import-check — prüft eine Zulieferung von „Herausforderungen der
// Natur" (Paket P5, Inhalts-Teil des Bindungs-Konzepts docs/bindung-konzept.md).
//
// Eine Herausforderung ist ein Ziel + eine Beschränkung + ein Generationen-
// Budget, z. B.: „Bring eine Linie ins Pilzreich, ohne das Licht über 0,3 zu
// heben — 500 Generationen." Genau wie bei den Umwelt-Einflüssen gilt: eine
// Herausforderung, die nicht im Budget erreichbar ist, ist eine Attrappe. Das
// wird hier nicht behauptet, sondern durch echte Konvergenz-Läufe gemessen.
//
// WICHTIG: dieses Paket liefert nur den INHALT (Zieldefinitionen + Text). Die
// Verdrahtung ins Spiel (neuer UI-Zustand, Fortschrittsanzeige, Sieg-Erkennung)
// ist bewusst NICHT Teil davon — das bleibt Handarbeit im Hauptrepo, nachdem
// der Inhalt geprüft und durchgesehen ist.
//
// Geprüft wird:
//   1. Form         — Pflichtfelder, Wertebereiche, bekannte Achsen/Reiche/Formen.
//   2. Text         — Länge, Ton (kein Zwang, kein Ausrufezeichen), Umlaute.
//   3. ERREICHBARKEIT — Stichproben-Konvergenz: wird das Ziel innerhalb des
//      Generationen-Budgets erreicht, wenn die Beschränkung eingehalten wird?
//   4. ECHTE BESCHRÄNKUNG — verschwindet die Erreichbarkeit, wenn man die
//      Beschränkung ignoriert? Wenn nicht, testet die Herausforderung nichts.
//   5. Schwierigkeits-Plausibilität — grober Abgleich der angegebenen
//      Schwierigkeit gegen die gemessene Erfolgsquote (Hinweis, kein Fail).
//
// Aufruf:  node tools/challenge-import-check.mjs <datei.json>
// ============================================================================
import { readFileSync } from "node:fs";
import { loadAppCore, BASE_ENV, AXES, STRESSORS } from "./lib/app-core.mjs";
import { umschrift } from "./lib/umlaut-check.mjs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: node tools/challenge-import-check.mjs <datei.json>"); process.exit(2); }

const { classify, converge } = loadAppCore("challenge-import-check");
const KINGDOMS = ["Mikrobe", "Protist", "Pflanze", "Pilz", "Tier"];

let data;
try { data = JSON.parse(readFileSync(file, "utf-8")); }
catch (e) { console.error("✗ Datei ist kein gültiges JSON: " + e.message); process.exit(1); }
const list = Array.isArray(data) ? data : (data.herausforderungen || []);
if (!list.length) { console.error("✗ Keine Herausforderungen gefunden (erwartet: Liste oder {herausforderungen:[...]})."); process.exit(1); }

const fail = [], warn = [];
const ids = new Set();

// Deterministischer PRNG (mulberry32, dieselbe Familie wie die Engine) für
// reproduzierbare Stichproben — derselbe Lauf meldet immer dasselbe Ergebnis.
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function sampleEnv(rnd, grenzen, ignoreGrenzen) {
  const e = { ...BASE_ENV };
  for (const s of STRESSORS) e[s] = 0;
  e.oxygen = 1;
  for (const ax of AXES) {
    const g = grenzen[ax];
    let lo = 0, hi = 1;
    if (g && !ignoreGrenzen) { if (g.min != null) lo = g.min; if (g.max != null) hi = g.max; }
    // Achsen ohne Beschränkung bleiben frei wählbar (Spielraum des Spielers) —
    // aber nur, wenn sie zum Spiel gehören; Stressoren starten bei 0/1 (s. o.)
    // und werden nur bewegt, wenn die Herausforderung sie ausdrücklich einschränkt.
    // oxygen ist in tools/lib/app-core.mjs::STRESSORS bewusst NICHT enthalten (die
    // Liste wird anderswo für ein "Reset auf 0"-Muster genutzt, oxygen resettet
    // aber auf 1) — hier braucht es dieselbe Behandlung wie ein echter Stressor.
    if (!g && (STRESSORS.includes(ax) || ax === "oxygen")) continue;
    e[ax] = lo + rnd() * (hi - lo);
  }
  return e;
}

const SAMPLES = 24;
const results = [];

for (const ch of list) {
  const id = ch.id || "(ohne id)";
  if (ids.has(id)) fail.push(`„${id}": doppelte id`);
  ids.add(id);

  // --- 1. Form ---
  const titel = (ch.titel || "").trim(), besch = (ch.beschreibung || "").trim();
  if (!titel) fail.push(`„${id}": kein Titel`);
  else if (titel.length > 60) fail.push(`„${id}": Titel zu lang (${titel.length} > 60)`);
  if (!besch) { fail.push(`„${id}": keine Beschreibung`); continue; }
  if (besch.length < 30 || besch.length > 220) fail.push(`„${id}": Beschreibung ${besch.length} Zeichen (erwartet 30–220)`);
  if (/!/.test(besch)) fail.push(`„${id}": Ausrufezeichen (kein Zwangston — Leitplanke „kein Sammelzwang")`);
  if (/[<>*_`#|]/.test(besch)) fail.push(`„${id}": Markdown-/HTML-Zeichen`);
  if (umschrift(titel).concat(umschrift(besch)).length) fail.push(`„${id}": ASCII-Umschrift statt Umlaut`);
  const forbidden = /\bmuss(t)?\b|\bmüssen\b|\bschaffe es\b/i;
  if (forbidden.test(besch)) warn.push(`„${id}": Formulierung klingt nach Pflicht statt Einladung („muss …") — Leitplanke „kein Sammelzwang"`);

  const ziel = ch.ziel || {};
  if (!ziel.reich && !ziel.form) { fail.push(`„${id}": kein ziel.reich oder ziel.form`); continue; }
  if (ziel.reich && !KINGDOMS.includes(ziel.reich)) fail.push(`„${id}": unbekanntes Reich „${ziel.reich}"`);

  const grenzen = ch.grenzen || {};
  if (!Object.keys(grenzen).length) fail.push(`„${id}": keine grenzen — ohne Beschränkung ist es keine Herausforderung`);
  let badGrenzen = false;
  for (const [ax, g] of Object.entries(grenzen)) {
    if (!AXES.includes(ax)) { fail.push(`„${id}": unbekannte Achse „${ax}" in grenzen`); badGrenzen = true; continue; }
    if (g.min == null && g.max == null) fail.push(`„${id}": grenzen.${ax} ohne min/max`);
    if (g.min != null && (g.min < 0 || g.min > 1)) fail.push(`„${id}": grenzen.${ax}.min außerhalb [0,1]`);
    if (g.max != null && (g.max < 0 || g.max > 1)) fail.push(`„${id}": grenzen.${ax}.max außerhalb [0,1]`);
  }
  const gens = ch.generationen;
  if (!Number.isFinite(gens) || gens < 20 || gens > 20000) fail.push(`„${id}": generationen fehlt oder unplausibel (${gens})`);
  if (!["leicht", "mittel", "schwer"].includes(ch.schwierigkeit)) fail.push(`„${id}": schwierigkeit fehlt oder ungültig (leicht/mittel/schwer)`);
  if (badGrenzen || !Number.isFinite(gens)) continue;

  // --- 3./4. Erreichbarkeit + echte Beschränkung ---
  const matches = a => (ziel.form ? a.n === ziel.form : a.k === ziel.reich);
  const rndA = mulberry32(2166136261 ^ id.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0));
  const rndB = mulberry32(0x9e3779b9 ^ id.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0));
  let hitWith = 0, hitWithout = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const envWith = sampleEnv(rndA, grenzen, false);
    if (matches(classify(converge(envWith, Math.min(gens, 1200)), envWith))) hitWith++;
    const envWithout = sampleEnv(rndB, grenzen, true);
    if (matches(classify(converge(envWithout, Math.min(gens, 1200)), envWithout))) hitWithout++;
  }
  const rateWith = hitWith / SAMPLES, rateWithout = hitWithout / SAMPLES;
  results.push({ id, titel, rateWith, rateWithout, gens });
  if (rateWith === 0) fail.push(`„${id}": Ziel wird in ${SAMPLES} Stichproben nie erreicht — im Budget von ${gens} Generationen nicht erreichbar (Attrappe)`);
  if (rateWith > 0 && rateWithout > 0 && Math.abs(rateWith - rateWithout) < 0.15)
    warn.push(`„${id}": Erfolgsquote mit (${Math.round(rateWith*100)}%) und ohne (${Math.round(rateWithout*100)}%) Beschränkung fast gleich — die Beschränkung testet kaum etwas`);

  // --- 5. Schwierigkeit ---
  if (rateWith > 0) {
    const band = { leicht: [0.4, 1.01], mittel: [0.12, 0.65], schwer: [0, 0.25] }[ch.schwierigkeit];
    if (band && (rateWith < band[0] || rateWith > band[1]))
      warn.push(`„${id}": als „${ch.schwierigkeit}" markiert, aber gemessene Erfolgsquote ${Math.round(rateWith*100)}% passt nicht ins erwartete Band`);
  }
}

console.log(`  Umfang: ${list.length} Herausforderungen geprüft (je ${SAMPLES} Stichproben mit/ohne Beschränkung)`);
if (results.length) {
  console.log("\n  Erreichbarkeit:");
  for (const r of results.sort((a, b) => a.rateWith - b.rateWith))
    console.log(`    ${r.id.padEnd(28)} mit Beschränkung ${String(Math.round(r.rateWith*100)).padStart(3)}%   ohne ${String(Math.round(r.rateWithout*100)).padStart(3)}%   (${r.gens} Gen.)`);
}
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  warn.slice(0, 20).forEach(w => console.log("    · " + w));
}
if (fail.length) {
  console.error(`\n✗ challenge-import-check: ${fail.length} Beanstandung(en) — nichts wurde übernommen:`);
  fail.slice(0, 30).forEach(f => console.error("   · " + f));
  process.exit(1);
}
console.log("\n✓ challenge-import-check bestanden — Inhalt ist übernahmefähig (Verdrahtung ins Spiel folgt separat).");
