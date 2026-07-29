// Ersetzt titel/beschreibung einer P8-Zulieferung durch selbst erzeugten, garantiert
// grammatisch korrekten Text. Grund: die Zulieferung (docs/auslagerung/P8-herausforderungen.json)
// hatte einen systematischen Grammatikfehler ("zu das Reich der Mikrobe" statt "zum Reich der
// Mikroben") in 226/271 Beschreibungen und nur 12 wiederverwendete Titel-Vorlagen für 271
// Einträge — das besteht die reinen Form-Prüfungen in challenge-import-check.mjs (die prüfen
// Länge/Ton/Umlaute, keine Grammatik), wäre aber im Spiel sichtbar kaputt/repetitiv.
//
// ziel/grenzen/generationen/schwierigkeit sind bereits simulations-verifiziert und bleiben
// unverändert — nur der Text wird neu (deterministisch, aus einem festen Wortschatz) gebaut.
//
// Aufruf: node tools/gen-challenge-text.mjs <eingabe.json> <ausgabe.json>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) { console.error("Aufruf: node tools/gen-challenge-text.mjs <eingabe.json> <ausgabe.json>"); process.exit(2); }

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function pick(seed, salt, arr) { return arr[fnv1a(seed + "|" + salt) % arr.length]; }

const REICH_PLURAL = { Mikrobe: "Mikroben", Protist: "Protisten", Pflanze: "Pflanzen", Pilz: "Pilze", Tier: "Tiere" };

// Feste, geprüft korrekte Zielphrasen — Akkusativ und Dativ-mit-"zu" (zu+die=zur, zu+das=zum).
// "die Form X" / "das Reich der Y" brauchen selbst kein Artikel-Geschlecht für X — X steht als
// Beifügung, das umgeht die Genus-Frage für alle 44 Formen sauber.
function zielPhrasen(ziel) {
  if (ziel.form) {
    return { akk: `die Form ${ziel.form}`, zuDat: `zur Form ${ziel.form}`, inAkk: `in die Form ${ziel.form}` };
  }
  const pl = REICH_PLURAL[ziel.reich];
  return { akk: `das Reich der ${pl}`, zuDat: `zum Reich der ${pl}`, inAkk: `in das Reich der ${pl}` };
}

// Je Achse: [tief, hoch] — mehrere idiomatische Varianten, damit dieselbe Achse nicht immer
// gleich klingt. Bewusst dieselbe Wortwahl wie die App selbst nutzt (LEVERS lo/hi-Begriffe).
// WICHTIG: jede Phrase muss wörtlich in "die Umgebung {phrase} bleibt" passen (Beschreibung)
// UND direkt hinter einem Verb wie "Leben"/"Standhalten" stehen können (Titel) — darum nur
// präpositionale/adjektivische Wendungen, keine "wo …"-Relativsätze (die brechen im ersten Fall:
// "die Umgebung wo alles gefriert bleibt" ist kein Satz).
const AXIS_PHRASE = {
  temperature: { low: ["in klirrender Kälte", "im Frost", "bei bitterer Kälte", "im ewigen Winter", "in eisiger Kühle"], high: ["in sengender Hitze", "bei großer Hitze", "in drückender Wärme", "in glühender Sonne", "in schwüler Hitze"] },
  predation: { low: ["in ungestörter Ruhe", "ohne Räuber in der Nähe", "fernab von Räubern", "in trügerischer Sicherheit", "in weitgehender Sicherheit"], high: ["unter ständigem Jagddruck", "in steter Gefahr", "mit Räubern auf der Lauer", "im Angesicht der Jäger", "unter wachsamen Räubern"] },
  foodAbundance: { low: ["bei knapper Nahrung", "trotz Nahrungsmangel", "am Rand des Hungers", "bei magerem Vorrat", "mit karger Kost"], high: ["im Nahrungsüberfluss", "bei üppiger Nahrung", "inmitten von Fülle", "im vollen Land", "bei reichlicher Kost"] },
  foodHeight: { low: ["am Boden", "tief unten im Bewuchs", "stets nah am Boden", "im Unterholz", "dicht über dem Grund"], high: ["hoch über dem Boden", "in luftiger Höhe", "weit oben im Geäst", "in den Kronen", "fernab vom Boden"] },
  light: { low: ["im Dunkeln", "im Schatten", "fernab vom Licht", "im Zwielicht", "in tiefer Dämmerung"], high: ["im vollen Licht", "in gleißender Helle", "bei starkem Sonnenlicht", "im offenen Tageslicht", "unter freiem Himmel"] },
  water: { low: ["auf trockenem Grund", "fernab vom Wasser", "in der Trockenheit", "auf staubigem Boden", "weit vom Ufer entfernt"], high: ["unter Wasser", "im Nassen", "mitten im Wasser", "in tiefer Flut", "vom Wasser umschlossen"] },
};
const AXIS_ORDER = ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"];

function axisDir(g) {
  const lo = g.min ?? 0, hi = g.max ?? 1;
  return (lo + hi) / 2 >= 0.5 ? "high" : "low";
}
function bedingungsPhrasen(id, grenzen) {
  return AXIS_ORDER.filter(ax => grenzen[ax]).map(ax => {
    const dir = axisDir(grenzen[ax]);
    return pick(id, "ax" + ax, AXIS_PHRASE[ax][dir]);
  });
}
// Für Titel: welche 1-2 Achsen im Titel auftauchen wird PRO id gemischt (nicht immer die
// ersten in AXIS_ORDER) — sonst würden alle "alle 6 Achsen eng"-Herausforderungen (die
// größte Gruppe, ~130/271) denselben ersten 1-2 Achsen-Text im Titel bekommen und massiv
// kollidieren, obwohl ihre Beschreibung (die ALLE Achsen nennt) das nicht tut.
function titelFlavors(id, grenzen) {
  const axes = AXIS_ORDER.filter(ax => grenzen[ax]);
  const shuffled = axes.map(ax => ({ ax, r: fnv1a(id + "|shuf|" + ax) })).sort((a, b) => a.r - b.r).map(x => x.ax);
  const n = Math.min(2, shuffled.length);
  return shuffled.slice(0, n).map(ax => pick(id, "tax" + ax, AXIS_PHRASE[ax][axisDir(grenzen[ax])]));
}
function joinDeutsch(arr) {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + " und " + arr[1];
  return arr.slice(0, -1).join(", ") + " und " + arr[arr.length - 1];
}

const CONNECTOR = ["während", "solange", "wenn", "wo"];

const BESCHREIBUNG_SHAPES = [
  (z, b, c) => `Erreiche ${z.akk}, ${c} die Umgebung ${b} bleibt.`,
  (z, b, c) => `Bring eine Linie ${z.zuDat}, ${c} die Umgebung ${b} bleibt.`,
  (z, b, c) => `Führe eine Linie ${z.inAkk}, ${c} die Umgebung ${b} bleibt.`,
  (z, b, c) => `Wandere ${z.zuDat}, ${c} die Umgebung ${b} bleibt.`,
  (z, b, c) => `Entwickle dich weiter ${z.zuDat}, ${c} die Umgebung ${b} bleibt.`,
  (z, b, c) => `Schaff den Sprung ${z.zuDat}, ${c} die Umgebung ${b} bleibt.`,
];

const TITLE_SHAPES_1 = [
  f => `Leben ${f}`, f => `Zuflucht ${f}`, f => `Wachstum ${f}`, f => `Bestehen ${f}`,
  f => `Gedeihen ${f}`, f => `Der Weg ${f}`, f => `Ein Zuhause ${f}`, f => `Standhalten ${f}`,
  f => `Verwurzelt ${f}`, f => `Angekommen ${f}`, f => `Ausharren ${f}`, f => `Weiterleben ${f}`,
  f => `Ein Platz ${f}`, f => `Durchkommen ${f}`, f => `Behaupten ${f}`, f => `Der stille Weg ${f}`,
];
const TITLE_SHAPES_2 = [
  (f1, f2) => `Zwischen zwei Grenzen: ${f1}, ${f2}`,
  (f1, f2) => `Leben ${f1} und ${f2}`,
  (f1, f2) => `Bestehen ${f1}, ${f2}`,
  (f1, f2) => `Der schmale Pfad — ${f1}, ${f2}`,
  (f1, f2) => `Gedeihen ${f1}, ${f2}`,
  (f1, f2) => `Zuflucht ${f1} und ${f2}`,
  (f1, f2) => `Ein Gleichgewicht: ${f1}, ${f2}`,
  (f1, f2) => `Standhalten ${f1} und ${f2}`,
  (f1, f2) => `Der enge Grat — ${f1}, ${f2}`,
  (f1, f2) => `Verwurzelt ${f1}, ${f2}`,
  (f1, f2) => `Ankommen ${f1} und ${f2}`,
  (f1, f2) => `Ausharren ${f1}, ${f2}`,
];
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function buildText(ch) {
  const z = zielPhrasen(ch.ziel);
  const flavors = bedingungsPhrasen(ch.id, ch.grenzen);
  const bedingung = joinDeutsch(flavors);
  const connector = pick(ch.id, "conn", CONNECTOR);
  const shape = pick(ch.id, "shape", BESCHREIBUNG_SHAPES);
  const beschreibung = cap(shape(z, bedingung, connector));

  const tf = titelFlavors(ch.id, ch.grenzen);
  // Länge zählt mehr als die "schönste" Variante: zu lange Titel werden nicht abgeschnitten
  // (kappt mitten im Wort), sondern durch eine kürzere Form ersetzt — erst dieselbe Achse
  // in TITLE_SHAPES_1 statt _2, sonst die kürzeste verfügbare Formulierung dieser Achse.
  let titel;
  if (tf.length <= 1) {
    titel = cap(pick(ch.id, "t1", TITLE_SHAPES_1)(tf[0] || "im offenen Land"));
  } else {
    titel = cap(pick(ch.id, "t2", TITLE_SHAPES_2)(tf[0], tf[1]));
    if (titel.length > 60) titel = cap(pick(ch.id, "t1", TITLE_SHAPES_1)(tf[0]));
  }
  if (titel.length > 60) {
    const shortest = TITLE_SHAPES_1.map(f => cap(f(tf[0] || "im offenen Land"))).sort((a, b) => a.length - b.length)[0];
    titel = shortest.length <= 60 ? shortest : shortest.slice(0, 57) + "...";
  }

  return { titel, beschreibung };
}

const data = JSON.parse(readFileSync(inFile, "utf-8"));
const list = Array.isArray(data) ? data : (data.herausforderungen || []);
const out = list.map(ch => {
  const { titel, beschreibung } = buildText(ch);
  return { id: ch.id, titel, beschreibung, ziel: ch.ziel, grenzen: ch.grenzen, generationen: ch.generationen, schwierigkeit: ch.schwierigkeit };
});

// Eindeutigkeit prüfen (deterministische Erzeugung könnte theoretisch kollidieren).
const titelSeen = new Map(), beschrSeen = new Map();
let dupT = 0, dupB = 0;
for (const c of out) {
  if (titelSeen.has(c.titel)) dupT++; else titelSeen.set(c.titel, c.id);
  if (beschrSeen.has(c.beschreibung)) dupB++; else beschrSeen.set(c.beschreibung, c.id);
}
console.log(`${out.length} Texte erzeugt. Doppelte Titel: ${dupT}, doppelte Beschreibungen: ${dupB}.`);

writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log("geschrieben:", outFile);
