// PLAUSIBILITAETS-CHECK der ANZEIGE-Schicht (Name · Bauplan-Satz · Zeichnung).
//
// WARUM ES DIESEN CHECK BRAUCHT. Alle vorhandenen Pruefstaende messen den SIM-KERN:
// app-parity (Fitness-Kopie), reality/ecology (Regel-Treue der Landschaft),
// spectrum/distribution (Formhaeufigkeiten), catalog-check (Katalog-Daten). Die
// Schicht, die der Spieler tatsaechlich LIEST — der Artname aus nearestReal(), der
// Bauplan-Satz aus describe() und die Silhouette aus drawAnimalSvg() — hatte KEINE
// Abdeckung. Genau dort sind die drei Widersprueche entstanden, die dieser Check
// jetzt nachrechnet (Beispiel aus der Live-App: „Javanisches Pustelschwein —
// mittelgross, dichtes Fell, zahlreiche Beine (Vielfuesser), Leuchtorgan").
//
// GRUND-TRENNUNG, die der Check ueberall anlegt:
//   der NAME kommt aus dem KATALOG-Nachbarn (nearestReal, gewichteter Genom-Abstand),
//   der SATZ und die ZEICHNUNG kommen aus dem EIGENEN Genom.
// Diese beiden Quellen werden nirgends gegeneinander geprueft. Der Check tut genau das.
//
// Ground Truth ist NICHT geraten: sie ist (a) die Elterntaxon-Kette der 20.178 belegten
// Arten in app/catalog.js (P171 aus Wikidata) und (b) die Gen-Semantik, wie sie
// engine/fitness.ts und tools/lib/clade-rules.mjs festlegen.
//
// Aufruf:  npm run plausi-check          (nur Bericht)
//          npm run plausi-check -- --strict   (Exit 1, sobald eine Regel reisst)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, ROOT, BASE_ENV } from "./lib/app-core.mjs";

const STRICT = process.argv.includes("--strict");
const core = loadAppCore("plausi-check");
const { classify, describe, nearestReal, selectionWeights, stepGeneration, NG, ARCH, CATALOG } = core;
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "0.0") + " %";
const findings = [];
const report = (id, titel, verletzt, gesamt, detail) => {
  findings.push({ id, titel, verletzt, gesamt, detail });
  const flag = verletzt ? "✗" : "✓";
  console.log(`\n${flag} ${id}  ${titel}`);
  console.log(`   betroffen: ${verletzt} von ${gesamt}  (${pct(verletzt, gesamt)})`);
  for (const d of detail) console.log("   · " + d);
};

// ---------------------------------------------------------------------------
// Gen-Index + Kladen. Die QIDs sind dieselben, die tools/lib/clade-rules.mjs
// benutzt (dort gegen Wikidata geprueft, s. Kopfkommentar „HERKUNFT DER QIDs").
const G = { insulation:0, size:1, limbLength:2, metabolism:3, armor:4,
  photosynthesis:5, mobility:6, structure:7, wing:8, biolum:9 };
const CLADE = {
  saeuger:  { qid: "Q7377", de: "Saeugetiere" },
  voegel:   { qid: "Q5113", de: "Voegel" },
  insekten: { qid: "Q1390", de: "Insekten" },
  spinnen:  { qid: "Q1358", de: "Spinnentiere" },
};
const inClade = (e, key) => e.lineage.includes(CLADE[key].qid);
const artName = (e) => e.de || e.sci;
const gen = (e) => e.genome.map((v) => v / 255);

// ---------------------------------------------------------------------------
// P1 — BEINZAHL IM TEXT gegen die BIOLOGIE der benannten Art.
//
// describe() liest `limbLength` als BEINZAHL:
//     < 0.18 „kaum Gliedmassen" · < 0.50 „vier …" · < 0.78 „sechs gegliederte Beine"
//     sonst „zahlreiche Beine (Vielfuesser)"
// engine/fitness.ts und clade-rules.mjs definieren dasselbe Gen aber als GLIEDMASSEN-
// LAENGE („Reichweite NUR an Land; im Wasser reiner Widerstand"). Ein langbeiniges
// Landtier bekommt dadurch zwangslaeufig zu viele Beine. Gemessen wird das an den
// Arten, deren Beinzahl aus der Klade FESTSTEHT: Tetrapoden = 4, Insekten = 6.
const legPhrase = (d) =>
  /zahlreiche Beine/.test(d) ? "viele" :
  /sechs gegliederte Beine/.test(d) ? "sechs" :
  /vier (kraeftige|kurze|kräftige) Beine/.test(d) ? "vier" :
  /kaum Gliedmaßen/.test(d) ? "keine" : null;

{
  const vierbeiner = CATALOG.entries.filter((e) => inClade(e, "saeuger") || inClade(e, "voegel"));
  const bad = [];
  for (const e of vierbeiner) {
    const p = legPhrase(describe(gen(e)));
    if (p === "sechs" || p === "viele") bad.push(e);
  }
  const beispiele = bad.slice(0, 5).map((e) =>
    `${artName(e)} (limbLength ${(e.genome[2] / 255).toFixed(2)}) -> „${legPhrase(describe(gen(e)))}"`);
  report("P1a", "Tetrapode (Saeuger/Vogel) im Text mit 6+ Beinen",
    bad.length, vierbeiner.length,
    [...beispiele,
     "Ursache: describe() liest Gen 2 als BEINZAHL, fitness.ts/clade-rules.mjs definieren es als GLIEDMASSEN-LAENGE."]);

  const insekten = CATALOG.entries.filter((e) => inClade(e, "insekten"));
  const badI = insekten.filter((e) => {
    const p = legPhrase(describe(gen(e)));
    return p !== null && p !== "sechs";
  });
  report("P1b", "Insekt im Text NICHT mit sechs Beinen",
    badI.length, insekten.length,
    badI.slice(0, 5).map((e) => `${artName(e)} (limbLength ${(e.genome[2] / 255).toFixed(2)}) -> „${legPhrase(describe(gen(e)))}"`));
}

// ---------------------------------------------------------------------------
// P2 — TEXT gegen ZEICHNUNG. drawAnimalSvg() leitet die gezeichnete Beinzahl aus
// DEMSELBEN Gen ab, aber mit einer ANDEREN Formel als der Text. Der Kommentar ueber
// describe() behauptet „deckt sich mit der Zeichnung" — hier wird das nachgerechnet.
// Die Formel wird aus app/index.html GELESEN, nicht abgeschrieben (sonst prueft der
// Check seine eigene Kopie).
{
  const m = html.match(/const legs = kind===[^;]*?2 \+ Math\.round\(\(([^)]*)\)\*(\d+)\);/);
  if (!m) { console.error("plausi-check: Bein-Formel in drawAnimalSvg() nicht gefunden."); process.exit(1); }
  const drawnLegs = new Function("limb", `return 2 + Math.round((${m[1]})*${m[2]});`);
  const erwartet = { keine: 0, vier: 4, sechs: 6, viele: 8 };
  let mismatch = 0, total = 0;
  const spanne = {};
  for (let i = 0; i <= 100; i++) {
    const limb = i / 100;
    const t = new Array(NG).fill(0.12);
    // Landtier-Zweig von describe() erzwingen: Tier, kein Flieger/Schwimmer/Sessiler.
    t[G.size] = 0.5; t[G.mobility] = 0.8; t[G.metabolism] = 0.6; t[G.photosynthesis] = 0.02;
    t[G.insulation] = 0.7; t[G.limbLength] = limb;
    const p = legPhrase(describe(t));
    if (!p) continue;
    total++;
    const gezeichnet = drawnLegs(limb);
    const passt = p === "viele" ? gezeichnet >= 7 : gezeichnet === erwartet[p];
    if (!passt) { mismatch++; (spanne[`Text „${p}" · gezeichnet ${gezeichnet}`] ??= []).push(limb.toFixed(2)); }
  }
  const detail = Object.entries(spanne).slice(0, 6)
    .map(([k, v]) => `${k}  (limbLength ${v[0]}–${v[v.length - 1]})`);
  report("P2", "Bauplan-SATZ und ZEICHNUNG nennen verschiedene Beinzahlen",
    mismatch, total,
    [...detail,
     `Text-Schwellen: 0.18/0.50/0.78 · Zeichnung: legs = 2 + round((0.3+0.7·limb)·5)`,
     "Beide leiten aus Gen 2 ab, aber mit unabhaengigen Formeln — sie koennen gar nicht uebereinstimmen."]);
}

// ---------------------------------------------------------------------------
// P3 — NAME gegen SATZ im LIVE-PFAD.
//
// Der Name kommt aus dem naechsten KATALOG-Nachbarn, der Satz aus dem EIGENEN Genom.
// Fuer die Gene, die in DIESER Umwelt keine Fitness-Wirkung haben, drueckt
// selectionWeights() das Gewicht auf ARCH.weightFloor — sie entscheiden also fast
// nicht mit, welcher Art das Wesen den Namen abnimmt. Ein Leuchtorgan in einer HELLEN
// Welt ist genau so ein Gen: es kostet nur, ist fuer den Namen aber fast unsichtbar.
// Deshalb kann ein Wesen „Javanisches Pustelschwein" heissen UND ein Leuchtorgan tragen.
//
// Gemessen an evolvierten Genomen aus den 12 Presets der App, jeweils mit einem
// Ausschlag im irrelevanten Gen — so, wie er in der lebenden Population durch
// Mutations-Selektions-Gleichgewicht real vorkommt.
const BIOMES = (() => {
  const src = html.match(/const BIOMES = \[[\s\S]*?\n\];/);
  return eval(src[0].replace(/^const BIOMES = /, "").replace(/;$/, ""));
})();
const envOfBiome = (b) => {
  const e = { ...BASE_ENV, ...b.env };
  if (b.stress) e[b.stress.ax] = b.stress.v;
  return e;
};
const converge = (env, gens = 400) => {
  let g = new Array(NG).fill(0.5);
  for (let i = 0; i < gens; i++) g = stepGeneration(g, env, null);
  return g;
};

{
  let cases = 0, widerspruch = 0, tautologie = 0, namen = 0;
  const beispiele = [];
  for (const b of BIOMES) {
    const env = envOfBiome(b);
    const base = converge(env);
    // Zwei Stoerungen, beide in Genen, die describe() SICHTBAR macht:
    // biolum (-> „Leuchtorgan") und wing (-> Flieger-Zweig).
    for (const [gene, wert, merkmal] of [[G.biolum, 0.6, "Leuchtorgan"], [G.wing, 0.6, "Flug"]]) {
      const t = base.slice(); t[gene] = wert;
      const a = classify(t, env);
      cases++;
      if (a.real) {
        namen++;
        // Tautologie: Ueberschrift und „≈ in echt"-Chip zeigen DENSELBEN Namen.
        // updateSpeciesWiki() nimmt bei vorhandenem arch.real dieselbe Quelle wie
        // die Ueberschrift (app/index.html, „label = e.de || e.sci").
        if ((a.real.e.de || a.real.e.sci) === a.n) tautologie++;
        const eigen = t[gene], benannt = a.real.e.genome[gene] / 255;
        const zeigtMerkmal = merkmal === "Leuchtorgan"
          ? /Leuchtorgan/.test(describe(t, a))
          : eigen > 0.45;
        if (zeigtMerkmal && benannt < 0.45) {
          widerspruch++;
          if (beispiele.length < 6)
            beispiele.push(`„${a.n}" traegt ${merkmal} (Gen ${eigen.toFixed(2)}), die benannte Art hat ${benannt.toFixed(2)}  [${b.n}]`);
        }
      }
    }
  }
  report("P3", "Artname und beschriebener Koerper widersprechen sich",
    widerspruch, cases,
    [...beispiele,
     `Gewichtsboden ARCH.weightFloor = ${ARCH.weightFloor} — ein folgenloses Gen zaehlt fuer die Namenswahl nur noch mit diesem Anteil.`,
     "Der Name kommt aus nearestReal() (Katalog-Nachbar), der Satz aus dem eigenen Genom. Nichts gleicht beide ab."]);

  report("P4", '„≈ in echt"-Verweis wiederholt nur den Artnamen (Tautologie)',
    tautologie, namen,
    ['updateSpeciesWiki() nimmt bei vorhandenem arch.real „e.de || e.sci" — dieselbe Quelle wie die Ueberschrift.',
     'Der Verweis sollte die REALE Klade zeigen ("≈ Schweine"), nicht denselben Namen noch einmal.']);
}

// ---------------------------------------------------------------------------
// P6 — WEITERE MERKMALE: TEXT-Schwelle gegen ZEICHNUNGS-Schwelle.
//
// Fell, Panzer und Leuchten stehen im Satz UND in der Silhouette — jedes mit einer
// EIGENEN, von Hand gesetzten Schwelle. Wo die beiden Zahlen auseinanderliegen, gibt
// es ein Genom-Band, in dem der Spieler etwas SIEHT, was der Text leugnet (oder
// umgekehrt). Die Zeichnungs-Schwellen werden aus app/index.html gelesen.
{
  const zahl = (re, was) => {
    const m = html.match(re);
    if (!m) { console.error(`plausi-check: Schwelle „${was}" nicht gefunden.`); process.exit(1); }
    return parseFloat(m[1]);
  };
  const MERKMALE = [
    { name: "Fell / Isolationsschicht", gene: G.insulation, text: /dichtes Fell/,
      draw: zahl(/if\(insul>([0-9.]+)\)\{ let f="";/, "Fell-Zeichnung") },
    { name: "Panzerplatten", gene: G.armor, text: /Panzerplatten/,
      draw: zahl(/if\(armor>([0-9.]+)\)\{\n    cAttr\(shellEl,/, "Panzer-Zeichnung") },
    { name: "Leuchtorgan", gene: G.biolum, text: /Leuchtorgan/,
      draw: zahl(/const bl = g\[9\]\|\|0;\n  if\(bl <= ([0-9.]+)\) return;/, "Leucht-Zeichnung") },
  ];
  let band = 0, schritte = 0;
  const detail = [];
  for (const mk of MERKMALE) {
    let n = 0; const grenzen = [];
    for (let i = 0; i <= 100; i++) {
      const v = i / 100;
      const t = new Array(NG).fill(0.12);
      t[G.size] = 0.5; t[G.mobility] = 0.8; t[G.metabolism] = 0.6; t[G.photosynthesis] = 0.02;
      t[G.limbLength] = 0.3; t[mk.gene] = v;
      const imText = mk.text.test(describe(t));
      const gezeichnet = v > mk.draw;
      schritte++;
      if (imText !== gezeichnet) { n++; band++; grenzen.push(v.toFixed(2)); }
    }
    detail.push(n
      ? `${mk.name}: Zeichnung ab ${mk.draw}, Text ab anderem Wert — Widerspruch bei Gen ${grenzen[0]}–${grenzen[grenzen.length - 1]}`
      : `${mk.name}: Schwellen decken sich (${mk.draw})`);
  }
  report("P6", "Merkmal ist gezeichnet, aber im Text nicht genannt (oder umgekehrt)",
    band, schritte, detail);
}

// ---------------------------------------------------------------------------
// P7 — FLUG kommt NICHT aus dem Flug-Gen. describe() entscheidet ueber
//     `const flyer = a.e==="🦋"||a.e==="🐦"||a.e==="🦇"` — also aus der ZUGEORDNETEN
// Bauplan-Gruppe, nicht aus Gen 8. Zwei Folgen, beide hier gemessen:
//   (a) eine Art in einer Flieger-Gruppe wird als Flieger beschrieben, auch wenn ihr
//       eigenes wing-Gen bei ~0 steht (Strausse, fluegellose Insekten, Pinguine),
//   (b) ein hohes wing-Gen ausserhalb dieser Gruppen taucht im Satz gar nicht auf.
{
  const flieger = new Set(["fledermaus", "vogel", "fluginsekt"]);
  const inFlieger = CATALOG.entries.filter((e) => flieger.has(e.group));
  const ohneFluegel = inFlieger.filter((e) => e.genome[G.wing] / 255 < 0.3);
  report("P7a", "Als Flieger beschrieben, obwohl das eigene Flug-Gen bei ~0 liegt",
    ohneFluegel.length, inFlieger.length,
    [...ohneFluegel.slice(0, 5).map((e) => `${artName(e)} (wing ${(e.genome[G.wing] / 255).toFixed(2)}, Gruppe ${e.group})`),
     'describe() liest `a.e` (Bauplan-Gruppe) statt Gen 8 — der Satz kann dem Genom deshalb nicht folgen.']);

  const draussen = CATALOG.entries.filter((e) => !flieger.has(e.group) && e.genome[G.wing] / 255 > 0.45);
  const proGruppe = {};
  for (const e of draussen) proGruppe[e.group] = (proGruppe[e.group] || 0) + 1;
  // Q28425 Chiroptera — gegen Wikidata geprueft wie die QIDs in tools/lib/clade-rules.mjs.
  const fledertiere = draussen.filter((e) => e.lineage.includes("Q28425")).length;
  report("P7b", "Hohes Flug-Gen, das im Bauplan-Satz nirgends vorkommt",
    draussen.length, CATALOG.entries.length - inFlieger.length,
    [...draussen.slice(0, 3).map((e) => `${artName(e)} (wing ${(e.genome[G.wing] / 255).toFixed(2)}, Gruppe ${e.group})`),
     "verteilt auf: " + Object.entries(proGruppe).map(([k, v]) => `${k} ${v}`).join(" · "),
     `davon ${fledertiere} echte Fledertiere (Q28425) — die Gruppe „fledermaus" haelt nur ${(CATALOG.byGroup.fledermaus || []).length}.`,
     "Diese Arten werden als LAUFENDE Vierbeiner beschrieben UND gezeichnet."]);
}

// ---------------------------------------------------------------------------
// P5 — NAMENSSCHICHT UNEINHEITLICH. CATALOG_NAMES kippt die Benennung global auf
// „naechste reale Art". Fuer Bauplan-Gruppen OHNE Katalog-Eintrag faellt sie still
// auf den Archetyp-Namen zurueck — der Spieler sieht mal „Javanisches Pustelschwein",
// mal „Erle · Knoellchen-Pflanze", ohne dass die Regel dahinter erkennbar waere.
{
  const leer = ARCH.forms.filter((f) => !(CATALOG.byGroup[f.key] || []).length);
  report("P5", "Bauplan-Gruppen, die NIE einen realen Artnamen bekommen koennen",
    leer.length, ARCH.forms.length,
    [leer.slice(0, 12).map((f) => f.n).join(" · ") + (leer.length > 12 ? " …" : ""),
     "Sie zeigen weiter den Archetyp-Namen — dieselbe Zeile der Oberflaeche, zwei verschiedene Namensarten."]);

  // Zusatz: extrem ungleich gefuellte Gruppen verzerren Stufe 2 (die Suche laeuft NUR
  // innerhalb der Gruppe — eine Gruppe mit 1 Eintrag hat keine Wahl).
  const duenn = ARCH.forms
    .map((f) => ({ f, n: (CATALOG.byGroup[f.key] || []).length }))
    .filter((x) => x.n > 0 && x.n < 25);
  report("P5b", "Gruppen mit unter 25 Katalog-Eintraegen (Stufe 2 hat kaum Auswahl)",
    duenn.length, ARCH.forms.length,
    duenn.map((x) => `${x.f.n}: ${x.n}`));
}

// ---------------------------------------------------------------------------
console.log("\n" + "─".repeat(72));
const gerissen = findings.filter((f) => f.verletzt > 0);
console.log(`plausi-check: ${gerissen.length} von ${findings.length} Regeln verletzt.`);
for (const f of gerissen) console.log(`  ✗ ${f.id}  ${f.titel} — ${f.verletzt}/${f.gesamt}`);
if (STRICT && gerissen.length) process.exit(1);
