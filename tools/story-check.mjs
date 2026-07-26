// ============================================================================
// story-check — Prüfstand für das Erzählwerk (app/story.js).
//
// Bei einem GENERATOR zählt nicht der Quelltext, sondern die AUSGABE. Darum
// prüft dieses Werkzeug nicht Sätze, sondern den Raum, den sie aufspannen —
// nach dem Muster der „Expressive Range Analysis" (Smith & Whitehead 2010):
// viele Artefakte erzeugen, mit Kennzahlen versehen, Löcher und Schlagseiten
// sichtbar machen.
//
// Sieben Prüfungen:
//   1. Quellen-Lint      — Leitplanken je Fragment (Ton, Form, Dopplung).
//   2. Determinismus     — gleiche Lage + gleiches Gedächtnis = gleicher Satz.
//   3. Ausgaben-Lint     — dieselben Leitplanken über N erzeugte Sätze
//                          (Property-Based Testing statt Handprobe).
//   4. Widerspruchs-Test — kein Hitze-Bild in der Eiswelt (Tag-Regression).
//   5. Tote Bausteine    — welche Fragmente tauchen in KEINER Lage auf.
//   6. Vielfalt          — beobachtete Sätze je Lage + Chao1-Schätzer für den
//                          wahren Vorrat + Geburtstags-Abstand bis zur ersten
//                          Wiederholung. Dazu das „schwächste Glied".
//   7. Haferbrei-Index   — gzip-Bytes je Satz (Rabii & Cook, FDG 2023:
//                          Komprimierbarkeit ~ gefühlte Gleichheit).
//
// Aufruf:  npm run story-check          (Prüfung + Bericht)
//          node tools/story-check.mjs --sample 12   (Kostproben je Beat)
// ============================================================================
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const src = readFileSync(new URL("../app/story.js", import.meta.url), "utf8");
const sandbox = {};
new Function("globalThis", "window", src).call(sandbox, sandbox, sandbox);
const S = sandbox.EvolveStory;

const fail = [];
const ok = m => console.log("  ✓ " + m);
const argSample = process.argv.includes("--sample")
  ? (+process.argv[process.argv.indexOf("--sample") + 1] || 8) : 0;

// ---------------------------------------------------------------------------
// Lagen-Suite: repräsentative Simulationszustände. Sie ist der „Messbereich" —
// alles, was das Spiel real erzeugen kann, soll hier vorkommen.
// ---------------------------------------------------------------------------
const baseEnv = { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2, light: .5, water: .6,
  toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };
const G = n => new Array(25).fill(.5).map((v, i) => (i === n ? .9 : v));
const ENVS = {
  mild:    baseEnv,
  feuer:   { ...baseEnv, fire: .7, aridity: .4 },
  eis:     { ...baseEnv, temperature: .06, light: .4 },
  glut:    { ...baseEnv, temperature: .94, water: .2 },
  finster: { ...baseEnv, light: .05, water: .8 },
  sonne:   { ...baseEnv, light: .95, foodAbundance: .2 },
  hunger:  { ...baseEnv, foodAbundance: .08 },
  fuelle:  { ...baseEnv, foodAbundance: .92 },
  jagd:    { ...baseEnv, predation: .9 },
  sicher:  { ...baseEnv, predation: .05 },
  tiefsee: { ...baseEnv, pressure: .8, light: .02, water: 1 },
  gift:    { ...baseEnv, toxicity: .7 },
  duerre:  { ...baseEnv, aridity: .8, water: .1 },
};
const KINGDOMS = ["Mikrobe", "Protist", "Pflanze", "Pilz", "Tier"];
const WELT_KEYS = ["temperature-", "temperature+", "predation+", "predation-", "foodAbundance-", "foodAbundance+",
  "foodHeight+", "foodHeight-", "light+", "light-", "water+", "water-", "toxicity+", "toxicity-", "oxygen-", "oxygen+",
  "salinity+", "salinity-", "uv+", "uv-", "pressure+", "pressure-", "aridity+", "aridity-", "radiation+", "radiation-",
  "fire+", "fire-", "frost+", "frost-", "wind+", "wind-"];

function situations() {
  const out = [];
  const push = (name, ctx) => out.push({ name, ctx: { form: "Bakterie", kingdom: "Mikrobe", genome: G(0), gen: 600, vit: .6, seed: 4711, ...ctx } });
  for (const [en, env] of Object.entries(ENVS)) {
    push(`anfang/${en}`,  { beat: "anfang", env, gen: 0, key: "start" });
    push(`ruhe/${en}`,    { beat: "ruhe", env, key: "ruhe" });
    push(`not/${en}`,     { beat: "not", env, vit: .2, key: "not" });
    push(`bluete/${en}`,  { beat: "bluete", env, vit: .9, key: "bluete" });
  }
  for (const k of WELT_KEYS) {
    const ax = k.slice(0, -1), dir = k.slice(-1) === "+" ? 1 : -1;
    const env = { ...baseEnv, [ax]: dir > 0 ? .85 : .1 };
    push(`welt/${k}`, { beat: "welt", env, chg: { key: ax, dir }, key: k });
  }
  for (let g = 0; g < 25; g++) for (const dir of [1, -1]) {
    push(`druck/${g}${dir > 0 ? "+" : "-"}`, { beat: "druck", env: baseEnv, gene: g, dir,
      merkmal: "Merkmal " + g, genome: G(g), key: g + ":" + dir });
  }
  for (const kd of KINGDOMS) {
    push(`wandel/->${kd}`, { beat: "wandel", env: baseEnv, from: "Bakterie", vorher: "Bakterie", to: "Hutpilz",
      fromK: "Mikrobe", toK: kd, kingdom: kd, key: "w" + kd });
    push(`reich/${kd}`, { beat: "reich", env: baseEnv, kingdom: kd, kingdomCount: 3, key: "k" + kd });
  }
  push("wandel/intern", { beat: "wandel", env: baseEnv, from: "Wurm", vorher: "Wurm", to: "Schnecke · Weichtier",
    fromK: "Tier", toK: "Tier", kingdom: "Tier", key: "wi" });
  push("reich/alle", { beat: "reich", env: baseEnv, kingdom: "Tier", kingdomCount: 5, key: "kall" });
  for (const r of ["haeufig", "gelegentlich", "selten", "sehr-selten", "legendaer"])
    push(`fund/${r}`, { beat: "fund", env: baseEnv, rarity: r, key: "f" + r });
  for (const gens of [10, 40, 120, 240]) for (const changed of [true, false])
    push(`heimkehr/${gens}${changed ? "-w" : "-s"}`, { beat: "heimkehr", env: baseEnv, gens, changed, key: "hk" + gens });
  for (const m of [100, 500, 1000, 5000, 10000, 50000, 100000])
    push(`zeit/${m}`, { beat: "zeit", env: baseEnv, mark: m, gen: m, key: "m" + m });
  return out;
}
const SIT = situations();

// Zieht `n` Sätze zu einer Lage. mem=true simuliert eine echte Sitzung
// (Anti-Wiederholung an), mem=false schätzt den rohen Vorrat.
function drawMany(ctx, n, mem) {
  const shared = [];
  const lines = [], ids = [];
  for (let i = 0; i < n; i++) {
    const c = { ...ctx, gen: (ctx.gen || 0) + i * 7 };
    const r = S.pick(c, mem ? shared : []);
    if (!r) return { lines: [], ids: [] };
    lines.push(r.text); ids.push(...r.parts);
  }
  return { lines, ids };
}

// ---------------------------------------------------------------------------
// 1. Quellen-Lint
// ---------------------------------------------------------------------------
const problems = S.lint();
if (problems.length) fail.push(...problems.map(p => "lint: " + p));
else ok(`Quellen sauber — ${S.fragmentCount()} Bausteine, ${S.SHAPES.length} Satz-Schablonen`);

// Kommentare abziehen — im Fließtext DARF „kein Math.random" stehen, im Code nicht.
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
for (const bad of ["Math.random", "Date.now", "new Date(", "performance.now"])
  if (code.includes(bad)) fail.push(`app/story.js enthält ${bad} — die Auswahl muss zustandsrein sein`);
ok("keine Zufalls-/Zeitquelle im Generator");

// Schablonen referenzieren nur vorhandene Slots
for (const sh of S.SHAPES)
  for (const m of sh.matchAll(/#([a-z]+)#/g))
    if (!["kern", "auftakt", "ausklang", "zeit"].includes(m[1])) fail.push(`Schablone nutzt unbekannten Slot #${m[1]}#`);

// ---------------------------------------------------------------------------
// 2. Determinismus
// ---------------------------------------------------------------------------
{
  let bad = 0;
  for (const s of SIT) {
    const a = S.pick({ ...s.ctx }, []);
    if (!a) { fail.push(`Lage "${s.name}" liefert keinen Satz`); continue; }
    for (let i = 0; i < 4; i++) {
      const b = S.pick({ ...s.ctx }, []);
      if (!b || b.text !== a.text) { bad++; fail.push(`Lage "${s.name}" ist nicht deterministisch`); break; }
    }
  }
  if (!bad) ok(`Determinismus: ${SIT.length} Lagen, je 5× identisch reproduziert`);
}

// ---------------------------------------------------------------------------
// 3. Ausgaben-Lint (Property-Based über die ganze Suite)
// ---------------------------------------------------------------------------
const FORBIDDEN = /\b(will|wollen|wollte|möchte|möchten|versucht|versuchen|beschließt|strebt|lernt|bemüht)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const ALL = [];       // alle erzeugten Sätze (für Vielfalt + Haferbrei-Index)
const USED = new Set();
{
  let n = 0, bad = 0;
  for (const s of SIT) {
    const { lines, ids } = drawMany(s.ctx, 60, false);
    ids.forEach(i => USED.add(i));
    for (const t of lines) {
      n++; ALL.push(t);
      const say = m => { if (bad++ < 8) fail.push(`Ausgabe "${s.name}": ${m} — „${t}"`); };
      if (t.length > S.MAX_LEN) say(`zu lang (${t.length})`);
      if (FORBIDDEN.test(t)) say("Absichts-Sprache");
      if (EMOJI.test(t)) say("Emoji");
      if (/!/.test(t)) say("Ausrufezeichen");
      if (/\s{2}|\s[,.;:]|[,.;:]{2}/.test(t)) say("Zeichensetzung/Leerraum");
      if (!/^[A-ZÄÖÜ]/.test(t)) say("beginnt klein");
      if (!/[.…]$/.test(t)) say("endet ohne Punkt");
      if (/\{[a-z]+\}/.test(t)) say("unersetzter Platzhalter");
      if (/\.\s+[a-zäöüß]/.test(t)) say("Satzanfang klein nach Punkt");
    }
  }
  if (!bad) ok(`Ausgaben-Lint: ${n.toLocaleString("de-DE")} erzeugte Sätze, alle Leitplanken eingehalten`);
}

// ---------------------------------------------------------------------------
// 4. Widerspruchs-Test — Bilder dürfen der eingestellten Welt nicht widersprechen
// ---------------------------------------------------------------------------
const CONTRA = [
  ["eis",     /Hitze|Glut|glüh/i],
  ["glut",    /die Kälte|Frost|kühlt aus/i],
  ["finster", /offene Sonne|Licht liegt im Überfluss|Licht reicht bis auf den Grund|Das Licht bezahlt/i],
  ["sonne",   /Dunkelheit verschluckt|kaum ein Strahl/i],
  ["hunger",  /Überfluss|Tisch ist gedeckt|koste sie nichts/i],
  ["fuelle",  /Hunger ist der Normalzustand|zwischen den Mahlzeiten/i],
  ["duerre",  /trieft|Wasser steht bis/i],
];
{
  let bad = 0;
  for (const [envName, re] of CONTRA) {
    const env = ENVS[envName];
    for (const beat of ["anfang", "ruhe", "not", "bluete"]) {
      const { lines } = drawMany({ beat, env, form: "Bakterie", kingdom: "Mikrobe", genome: G(0), gen: 500, vit: .5, seed: 99, key: beat }, 120, false);
      for (const t of lines) if (re.test(t)) { if (bad++ < 6) fail.push(`Widerspruch in "${envName}": „${t}"`); }
    }
  }
  if (!bad) ok("Widerspruchs-Test: kein Hitze-Bild in Eiswelten (und umgekehrt)");
}

// ---------------------------------------------------------------------------
// 5. Tote Bausteine — was in KEINER Lage vorkommt, ist unsichtbarer Ballast
// ---------------------------------------------------------------------------
{
  const dead = [];
  S.eachFragment((text, id) => { /* id-Schema der Quellen != Slot-ids; s. u. */ });
  // Slot-ids entstehen zur Laufzeit (slotname:index). Wir prüfen die drei
  // geteilten Textur-Pools, weil dort tote Einträge am teuersten sind.
  for (const [name, pool] of Object.entries(S.pools))
    for (let i = 0; i < pool.length; i++) {
      const id = name.toLowerCase() + ":" + i;
      if (!USED.has(id)) dead.push(id + " = „" + pool[i][0] + "“");
    }
  if (dead.length) {
    console.log(`  · ${dead.length} Textur-Bausteine tauchten in der Suite nie auf (Tag zu eng?):`);
    dead.slice(0, 10).forEach(d => console.log("      " + d));
  } else ok("keine toten Textur-Bausteine");
}

// ---------------------------------------------------------------------------
// 6. Vielfalt — beobachtet, geschätzt (Chao1), schwächstes Glied, Geburtstag
// ---------------------------------------------------------------------------
function chao1(counts) {                       // Vorrats-Schätzer aus der Ökologie
  const f1 = counts.filter(c => c === 1).length, f2 = counts.filter(c => c === 2).length;
  const s = counts.length;
  return Math.round(f2 > 0 ? s + (f1 * f1) / (2 * f2) : s + (f1 * (f1 - 1)) / 2);
}
const report = [];
{
  const byBeat = new Map();
  for (const s of SIT) {
    const beat = s.ctx.beat;
    const { lines } = drawMany(s.ctx, 400, false);
    const freq = new Map();
    for (const t of lines) freq.set(t, (freq.get(t) || 0) + 1);
    const est = chao1([...freq.values()]);
    const e = byBeat.get(beat) || { lagen: 0, obs: 0, est: 0, min: Infinity, minName: "" };
    e.lagen++; e.obs += freq.size; e.est += est;
    if (est < e.min) { e.min = est; e.minName = s.name; }
    byBeat.set(beat, e);
  }
  console.log("\n  Vielfalt je Beat (400 Ziehungen je Lage, Anti-Wiederholung AUS):");
  console.log("    Beat        Lagen   beob.Ø   Vorrat(Chao1)Ø   schwächste Lage");
  let total = 0;
  for (const [beat, e] of byBeat) {
    const estAvg = Math.round(e.est / e.lagen);
    total += e.est;
    console.log(`    ${beat.padEnd(11)} ${String(e.lagen).padStart(4)}   ${String(Math.round(e.obs / e.lagen)).padStart(6)}   ${String(estAvg).padStart(14)}   ${e.minName} (${e.min})`);
    report.push({ beat, lagen: e.lagen, est: estAvg, min: e.min });
    if (e.min < 12) fail.push(`Lage "${e.minName}" hat nur ~${e.min} mögliche Sätze — dort wird Wiederholung spürbar`);
  }
  const P = Math.round(total);
  const birthday = Math.round(1.2533 * Math.sqrt(P));
  console.log(`\n    Gesamtvorrat über alle Lagen: ~${P.toLocaleString("de-DE")} verschiedene Sätze`);
  console.log(`    Geburtstags-Abstand: die erste Wiederholung ist im Mittel nach ~${birthday} Sätzen zu erwarten`);
  console.log(`    (bei blindem Ziehen; die Gedächtnisse (${S.MEM_FRAG} Bausteine, ${S.MEM_LINE} Zeilen) schiebt sie weiter hinaus)`);
  if (P < 20000) fail.push(`Gesamtvorrat ${P} < 20.000 — zu klein für ein „unendliches" Gefühl`);
}

// ---------------------------------------------------------------------------
// 7. Sitzungs-Simulation — DIE Spieler-Kennzahl. Nicht „wie groß ist der
//    Vorrat", sondern „wie lange spielt jemand, bevor es sich wiederholt".
//    Gemischte Beats wie im echten Spiel, Anti-Wiederholung AN.
// ---------------------------------------------------------------------------
{
  const worst = [];
  for (let seed = 1; seed <= 24; seed++) {
    const mem = [];
    const seenLine = new Map(), seenFrag = new Map();
    let firstLineRepeat = 0, firstFragRepeat = 0;
    const N = 120;                       // ~ mehrere Wochen Spielzeit
    for (let i = 0; i < N; i++) {
      const s = SIT[(seed * 37 + i * 11) % SIT.length];
      const r = S.pick({ ...s.ctx, seed, gen: 100 + i * 53 }, mem);
      if (!r) continue;
      if (seenLine.has(r.text) && !firstLineRepeat) firstLineRepeat = i + 1;
      seenLine.set(r.text, true);
      for (const p of r.parts) {
        if (seenFrag.has(p) && !firstFragRepeat) firstFragRepeat = i + 1;
        seenFrag.set(p, (seenFrag.get(p) || 0) + 1);
      }
    }
    worst.push({ line: firstLineRepeat || N, frag: firstFragRepeat || N, uniq: seenLine.size });
  }
  const avg = k => Math.round(worst.reduce((s, w) => s + w[k], 0) / worst.length);
  const minLine = Math.min(...worst.map(w => w.line));
  console.log(`\n  Sitzungs-Simulation (24 Linien × 120 Zeilen, gemischte Beats, Gedächtnis AN):`);
  console.log(`    erste WÖRTLICHE Wiederholung im Mittel nach ${avg("line")} Zeilen (schlechteste Linie: ${minLine})`);
  console.log(`    erster wiederkehrender BAUSTEIN im Mittel nach ${avg("frag")} Zeilen`);
  console.log(`    verschiedene Zeilen je Linie: ${avg("uniq")} von 120`);
  if (minLine < 60) fail.push(`Wörtliche Wiederholung schon nach ${minLine} Zeilen — zu früh`);
}

// ---------------------------------------------------------------------------
// 8. Haferbrei-Index — Komprimierbarkeit als Näherung an gefühlte Gleichheit.
//    Absolut ist die Zahl bedeutungslos; sie taugt als VERHÄLTNIS zum Boden
//    („immer derselbe Satz") und als Regressionswächter über die Zeit.
// ---------------------------------------------------------------------------
{
  const uniq = [...new Set(ALL)];
  const n = Math.min(uniq.length, 4000);
  const perLine = gzipSync(Buffer.from(uniq.slice(0, n).join("\n"), "utf8")).length / n;
  const flat = gzipSync(Buffer.from(new Array(n).fill(uniq[0]).join("\n"), "utf8")).length / n;
  const ratio = perLine / flat;
  console.log(`\n  Haferbrei-Index: ${perLine.toFixed(1)} gzip-Byte je Satz  ·  Boden (immer derselbe Satz): ${flat.toFixed(2)}  ·  Verhältnis ${ratio.toFixed(0)}×`);
  console.log(`    Rabii & Cook (FDG 2023): die Komplexität der Ausgabe ist durch das im Generator`);
  console.log(`    steckende Wissen begrenzt — mehr Würfel erhöhen sie nicht. Das Verhältnis zum`);
  console.log(`    Boden zeigt, wie weit die Ausgabe von „alles gleich" entfernt ist.`);
  if (ratio < 20) fail.push(`Haferbrei-Verhältnis nur ${ratio.toFixed(0)}× — die Sätze ähneln einander zu stark`);
}

// ---------------------------------------------------------------------------
// 9. Schlagseite der Schablonen (ERA: unerwartete Verzerrungen sichtbar machen)
// ---------------------------------------------------------------------------
{
  const bau = new Map();
  for (const s of SIT) {
    for (let i = 0; i < 40; i++) {
      const r = S.pick({ ...s.ctx, gen: (s.ctx.gen || 0) + i * 13 }, []);
      if (r) bau.set(r.parts.length, (bau.get(r.parts.length) || 0) + 1);
    }
  }
  const tot = [...bau.values()].reduce((a, b) => a + b, 0);
  const dist = [...bau.entries()].sort().map(([k, v]) => `${k} Bausteine: ${Math.round(v / tot * 100)}%`).join("  ·  ");
  console.log(`\n  Satzbau-Verteilung: ${dist}`);
  const oneOnly = (bau.get(1) || 0) / tot;
  if (oneOnly > .6) fail.push(`${Math.round(oneOnly * 100)}% aller Sätze bestehen nur aus dem Kern — die Textur greift nicht`);
}

// ---------------------------------------------------------------------------
// Kostproben (--sample N)
// ---------------------------------------------------------------------------
if (argSample) {
  console.log("\n  Kostproben:");
  const shown = new Set();
  for (const s of SIT) {
    if (shown.has(s.ctx.beat) && !/druck|welt/.test(s.ctx.beat)) continue;
    shown.add(s.ctx.beat);
    const { lines } = drawMany(s.ctx, argSample, true);
    console.log(`\n  [${s.name}]`);
    lines.forEach(l => console.log("    · " + l));
  }
}

// ---------------------------------------------------------------------------
if (fail.length) {
  console.error("\n✗ story-check fehlgeschlagen:");
  for (const f of fail.slice(0, 40)) console.error("   · " + f);
  if (fail.length > 40) console.error(`   … und ${fail.length - 40} weitere`);
  process.exit(1);
}
console.log("\n✓ story-check bestanden");
