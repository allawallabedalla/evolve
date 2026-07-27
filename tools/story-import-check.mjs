// ============================================================================
// story-import-check — prüft eine AUSGELAGERTE Zulieferung von Erzähl-Bausteinen.
//
// Wie beim Faktoren-Paket ist der Übergabepunkt eine Datendatei mit hartem
// Vertrag. Der Unterschied: hier ist die Ware TEXT, und Text kann auf mehr
// Arten falsch sein als eine Zahl. Darum wird jedes zugelieferte Fragment
// nicht nur einzeln geprüft, sondern auf dem ECHTEN Pfad des Generators zu
// fertigen Sätzen zusammengebaut (Haken `ctx.__kern` in app/story.js) — mit
// allen Längen-, Wortdopplungs- und Wiederholungs-Schranken. Beurteilt wird
// also das, was im Spiel stünde, nicht der Rohtext.
//
// Geprüft wird:
//   1. Schlüssel   — Faktor-Namen exakt, Pool-Namen aus der erlaubten Liste.
//   2. Form        — klein beginnend, ohne Schlusspunkt, Länge, Platzhalter.
//   3. Leitplanken — keine Absichts-Sprache, kein Ausrufezeichen, kein Emoji.
//   4. Tags        — nur bekannte Bedingungs-Tags.
//   5. Dubletten   — weder untereinander noch gegen den bestehenden Katalog.
//   6. ZUSAMMENBAU — jedes Fragment wird in echte Sätze montiert und gelintet.
//   7. Tonfall     — Anteil persönlicher Sätze vs. Sentenz-Vokabular.
//
// Aufruf:  node tools/story-import-check.mjs <datei.json>
// ============================================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadInfluences } from "./lib/app-core.mjs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: node tools/story-import-check.mjs <datei.json>"); process.exit(2); }

const sandbox = {};
new Function("globalThis", "window", readFileSync(join(ROOT, "app", "story.js"), "utf-8"))
  .call(sandbox, sandbox, sandbox);
const S = sandbox.EvolveStory;

const { factors } = loadInfluences();
const active = new Map(factors.filter(f => !f.soon).map(f => [f.name, f]));

// Erlaubte Ziel-Pools für allgemeine Bausteine (alles außer den Faktor-Zeilen).
const POOLS = {
  "auftakt":  "Auftakt — verortet den Satz in der Welt",
  "ausklang": "Nachsatz — was das für dieses Wesen bedeutet",
  "ruhe": "Gleichgewicht", "not": "schlechte Passung", "bluete": "gute Passung",
  "anfang": "neues Leben", "wandel": "Formwechsel",
};
// Bedingungs-Tags, die tagsOf() erzeugen kann.
const TAGS = new Set(["kalt","mild","heiss","eis","glut","dunkel","daemmer","hell","finster",
  "trocken","feucht","nass","hunger","karg","fuelle","jagd","wachsam","sicher","hochnahrung","bodennah",
  "gift","hypoxie","salz","uv","tiefe","duerre","strahlung","feuer","frostnacht","sturm","extrem",
  "k-mikrobe","k-protist","k-pflanze","k-pilz","k-tier","gepanzert","gruen","mobil","hoch","fliegend",
  "leuchtend","winzig","mittelgross","riesig","sessil","not","bluete","auskommen","jung","gewachsen",
  "uralt","auf","ab",
  ...["anfang","heimkehr","welt","druck","wandel","reich","fund","ruhe","not","bluete","zeit"].map(b => "b-" + b)]);

const FORBIDDEN = /\b(will|wollen|wollte|möchte|möchten|versucht|versuchen|beschließt|strebt|lernt|bemüht)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
// Ohne /g — eine globale Regex merkt sich lastIndex und liefert bei wiederholtem
// .test() abwechselnd falsche Ergebnisse.
const PLACEHOLDER = /^\{(wesen|demwesen|gen|merkmal|form|vorher|reich)\}$/;

let data;
try { data = JSON.parse(readFileSync(file, "utf-8")); }
catch (e) { console.error("✗ Datei ist kein gültiges JSON: " + e.message); process.exit(1); }

const fail = [], warn = [];
// Bestehende Fragmente einsammeln (für den Dubletten-Test).
const existing = new Set();
S.eachFragment(t => existing.add(t.toLowerCase().trim()));

// --- Einträge einsammeln ---------------------------------------------------
// Format: { "faktoren": { "<Katalogname>": ["...", ...] }, "pools": { "auftakt": [["...","tag"], ...] } }
const items = [];   // {quelle, text, cond}
for (const [name, arr] of Object.entries(data.faktoren || {})) {
  if (!active.has(name)) { fail.push(`unbekannter oder inaktiver Faktor „${name}"`); continue; }
  if (!Array.isArray(arr) || arr.length < 2) { fail.push(`„${name}": mindestens zwei Zeilen erwartet`); continue; }
  for (const t of arr) items.push({ quelle: "faktor:" + name, text: t, cond: "", faktor: name });
}
for (const [pool, arr] of Object.entries(data.pools || {})) {
  if (!POOLS[pool]) { fail.push(`unbekannter Pool „${pool}" (erlaubt: ${Object.keys(POOLS).join(", ")})`); continue; }
  if (!Array.isArray(arr)) { fail.push(`Pool „${pool}": Liste erwartet`); continue; }
  for (const e of arr) {
    const text = Array.isArray(e) ? e[0] : e;
    const cond = Array.isArray(e) ? (e[1] || "") : "";
    items.push({ quelle: "pool:" + pool, text, cond });
  }
}
if (!items.length) { console.error("✗ Keine verwertbaren Einträge gefunden (erwartet: faktoren / pools)."); process.exit(1); }

// --- 2./3./4./5. Form, Leitplanken, Tags, Dubletten -------------------------
const seen = new Map();
for (const it of items) {
  const id = `${it.quelle} „${String(it.text).slice(0, 46)}…"`;
  if (typeof it.text !== "string" || !it.text.trim()) { fail.push(`${id}: leerer Text`); continue; }
  const t = it.text;
  if (/^[A-ZÄÖÜ]/.test(t)) fail.push(`${id}: beginnt groß — Fragmente beginnen klein`);
  if (/[.!?;]$/.test(t)) fail.push(`${id}: endet mit Satzzeichen — das setzt die Schablone`);
  if (t.length > 95) fail.push(`${id}: zu lang (${t.length} > 95 Zeichen für einen Baustein)`);
  if (t.length < 12) warn.push(`${id}: sehr kurz (${t.length} Zeichen)`);
  if (FORBIDDEN.test(t)) fail.push(`${id}: Absichts-Sprache — erzählt wird Auslese, nicht Wille`);
  if (EMOJI.test(t)) fail.push(`${id}: Emoji (Icon-Policy)`);
  if (/!/.test(t)) fail.push(`${id}: Ausrufezeichen (ruhiger Ton)`);
  if (/[<>*_`#|]/.test(t)) fail.push(`${id}: Markdown-/HTML-Zeichen`);
  for (const m of t.matchAll(/\{[a-zA-Zäöü]+\}/g))
    if (!PLACEHOLDER.test(m[0])) fail.push(`${id}: unbekannter Platzhalter ${m[0]}`);
  for (const raw of String(it.cond).split(",")) {
    const c = raw.trim().replace(/^!/, "");
    if (c && !TAGS.has(c)) fail.push(`${id}: unbekannter Tag „${c}"`);
  }
  const key = t.toLowerCase().trim();
  if (existing.has(key)) fail.push(`${id}: steht wortgleich schon im Katalog`);
  if (seen.has(key)) fail.push(`${id}: doppelt in der Zulieferung`);
  seen.set(key, it.quelle);
}

// --- 6. Zusammenbau auf dem echten Pfad ------------------------------------
const BASE_ENV = { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2, light: .5, water: .6,
  toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0, radiation: 0, fire: 0, frost: 0, wind: 0 };

// Ein getaggter Baustein muss in einer Welt geprüft werden, die seinen Tag auch
// ERFÜLLT — sonst filtert ihn die eigene Bedingung heraus und jedes korrekt
// getaggte Fragment fiele durch. Diese Tabelle baut zu jeder Bedingung die
// passende Lage (Umwelt, Genom, Reich, Lage der Linie).
const ENV_FOR = { kalt:{temperature:.15}, eis:{temperature:.06}, heiss:{temperature:.85}, glut:{temperature:.95},
  mild:{temperature:.5}, dunkel:{light:.15}, finster:{light:.05}, hell:{light:.9}, daemmer:{light:.5},
  trocken:{water:.15}, nass:{water:.9}, feucht:{water:.6}, hunger:{foodAbundance:.1}, fuelle:{foodAbundance:.9},
  karg:{foodAbundance:.5}, jagd:{predation:.9}, sicher:{predation:.05}, wachsam:{predation:.3},
  hochnahrung:{foodHeight:.8}, bodennah:{foodHeight:.1}, gift:{toxicity:.7}, hypoxie:{oxygen:.3},
  salz:{salinity:.7}, uv:{uv:.7}, tiefe:{pressure:.7}, duerre:{aridity:.7}, strahlung:{radiation:.7},
  feuer:{fire:.7}, frostnacht:{frost:.7}, sturm:{wind:.7}, extrem:{toxicity:.7} };
const GEN_FOR = { gepanzert:[4,.9], gruen:[5,.9], mobil:[6,.9], hoch:[7,.9], fliegend:[8,.9], leuchtend:[9,.9],
  sessil:[6,.1], winzig:[1,.1], riesig:[1,.9], mittelgross:[1,.5] };
const KINGDOM_FOR = { "k-mikrobe":"Mikrobe", "k-protist":"Protist", "k-pflanze":"Pflanze", "k-pilz":"Pilz", "k-tier":"Tier" };
function lageFor(cond, baseEnv) {
  const env = { ...baseEnv }, genome = new Array(25).fill(.5);
  let kingdom = "Tier", vit = .55, gen = 300, dir = 0, beat = null;
  for (const raw of String(cond || "").split(",")) {
    const c = raw.trim();
    if (!c || c[0] === "!") continue;                       // Verbote brauchen keine Lage
    if (ENV_FOR[c]) Object.assign(env, ENV_FOR[c]);
    if (GEN_FOR[c]) genome[GEN_FOR[c][0]] = GEN_FOR[c][1];
    if (KINGDOM_FOR[c]) kingdom = KINGDOM_FOR[c];
    if (c === "not") vit = .2; if (c === "bluete") vit = .9; if (c === "auskommen") vit = .55;
    if (c === "jung") gen = 50; if (c === "uralt") gen = 9000; if (c === "gewachsen") gen = 1000;
    if (c === "auf") dir = 1; if (c === "ab") dir = -1;
    if (c.startsWith("b-")) beat = c.slice(2);
  }
  return { env, genome, kingdom, vit, gen, dir, beat };
}

const assembled = [];
{
  let bad = 0;
  for (const it of items) {
    if (typeof it.text !== "string" || !it.text.trim()) continue;
    const envBase = it.faktor ? { ...BASE_ENV, ...(active.get(it.faktor).env || {}) } : BASE_ENV;
    const lage = lageFor(it.cond, envBase);
    const env = lage.env;
    const beat = it.quelle.startsWith("faktor:") ? "welt"
      : (["ruhe", "not", "bluete", "anfang", "wandel"].includes(it.quelle.split(":")[1]) ? it.quelle.split(":")[1] : "ruhe");
    for (let k = 0; k < 4; k++) {
      const r = S.pick({ beat: lage.beat || beat, env, genome: lage.genome, form: "Fell-Warmblüter",
        kingdom: lage.kingdom, gen: lage.gen + k * 211, vit: lage.vit, dir: lage.dir || undefined,
        seed: 31 + k, name: "Nebel", key: it.quelle + k,
        __kern: [[it.text, it.cond]] }, []);
      if (!r) { fail.push(`${it.quelle}: lässt sich nicht zu einem Satz montieren (Bedingung zu eng?)`); bad++; break; }
      assembled.push(r.text);
      if (r.text.length > S.MAX_LEN) { fail.push(`${it.quelle}: montiert zu lang (${r.text.length})`); bad++; break; }
      if (/\{[a-z]+\}/.test(r.text)) { fail.push(`${it.quelle}: unersetzter Platzhalter im fertigen Satz`); bad++; break; }
      if (/\s{2}|\s[,.;:]|[,.;:]{2}/.test(r.text)) { fail.push(`${it.quelle}: Zeichensetzung im fertigen Satz`); bad++; break; }
    }
  }
  if (!bad) console.log(`  ✓ Zusammenbau: ${assembled.length} echte Sätze aus ${items.length} Bausteinen, alle sauber`);
}

// --- 7. Tonfall -------------------------------------------------------------
{
  const PERSON = /\b(dein|deinem|deine|du|dir|Nebel)\b/;
  const APHOR = /\b(die Auslese|Vererbung|die Physik|Buchhaltung|die Bilanz|niemand hier|kein Plan|die Spur|das Papier|Absichten)\b/i;
  const pers = assembled.filter(t => PERSON.test(t)).length / (assembled.length || 1);
  const aph = assembled.filter(t => APHOR.test(t)).length / (assembled.length || 1);
  console.log(`  Tonfall der Zulieferung: ${Math.round(pers * 100)} % mit Bezug zum Wesen · ${Math.round(aph * 100)} % Sentenz-Vokabular`);
  if (aph > 0.12) fail.push(`${Math.round(aph * 100)} % Sentenz-Vokabular — zu lyrisch (Höchstwert 12 %)`);
}

// --- 8. Satzbau-Einfalt -----------------------------------------------------
//     Grammatisch korrekte Bausteine können trotzdem ermüden, wenn sie alle
//     gleich GEBAUT sind. Der Spieler merkt das Muster, nicht die Wörter.
{
  const muster = new Map();
  const ART = new Set(["der","die","das","den","dem","des","ein","eine","einen","einem","einer",
    "es","er","sie","man","{wesen}","{demwesen}"]);
  for (const it of items) {
    if (typeof it.text !== "string") continue;
    const w = it.text.split(/\s+/);
    let key = "sonstiges";
    if (w.length > 1 && /^[a-zäöü]+(t|et|en)$/.test(w[0]) && ART.has(w[1].toLowerCase().replace(/,$/, "")))
      key = "Verb zuerst (uneingeleiteter Konditionalsatz)";
    else if (/^(wer|wo|was|wen|wem)\b/i.test(it.text)) key = "beginnt mit „wer/wo/was“";
    else if (/^(hier|dort|jetzt|ab|von|in|im|an|auf|unter|über|zwischen)\b/i.test(it.text)) key = "beginnt mit Ortsangabe";
    else if (ART.has(w[0].toLowerCase())) key = "beginnt mit Artikel/Pronomen";
    muster.set(key, (muster.get(key) || 0) + 1);
  }
  const tot = items.length;
  const zeilen = [...muster.entries()].sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k}: ${Math.round(n / tot * 100)} %`);
  console.log(`  Satzbau: ${zeilen.join(" · ")}`);
  // „beginnt mit Artikel/Pronomen" ist die natürliche deutsche Grundform — die zu
  // melden wäre Rauschen. Auffällig sind nur die MARKIERTEN Konstruktionen.
  const AUFFAELLIG = ["Verb zuerst (uneingeleiteter Konditionalsatz)", "beginnt mit „wer/wo/was“"];
  for (const [k, n] of muster)
    if (AUFFAELLIG.includes(k) && n / tot > 0.22)
      warn.push(`${Math.round(n / tot * 100)} % aller Bausteine sind gleich gebaut („${k}") — das Muster wird sichtbar`);
}

// --- Bericht ----------------------------------------------------------------
{
  const byFaktor = Object.keys(data.faktoren || {}).length;
  const missing = [...active.keys()].filter(n => !(data.faktoren || {})[n]);
  console.log(`\n  Umfang: ${items.length} Bausteine · ${byFaktor}/${active.size} Faktoren bedacht · ` +
    `${Object.values(data.pools || {}).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0)} Textur-Bausteine`);
  if (missing.length) warn.push(`${missing.length} aktive Faktoren ohne eigene Zeilen (z. B. „${missing.slice(0, 3).join('", "')}")`);
}
if (warn.length) {
  console.log(`\n  Hinweise (${warn.length}):`);
  warn.slice(0, 12).forEach(w => console.log("    · " + w));
  if (warn.length > 12) console.log(`    … und ${warn.length - 12} weitere`);
}
if (fail.length) {
  console.error(`\n✗ story-import-check: ${fail.length} Beanstandung(en) — nichts wurde übernommen:`);
  fail.slice(0, 30).forEach(f => console.error("   · " + f));
  if (fail.length > 30) console.error(`   … und ${fail.length - 30} weitere`);
  process.exit(1);
}
console.log("\n✓ story-import-check bestanden — Zulieferung ist übernahmefähig.");
