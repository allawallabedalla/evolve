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

// ---------------------------------------------------------------------------
// VORFAHREN-HUELLE — und warum dieser Check sie selbst berechnen muss.
//
// `entry.lineage` ist in app/catalog.js auf 12 Eintraege GEKUERZT
// (tools/build-catalog.mjs: `p.v.lineage.slice(0, 12)`, begruendet mit CORPUS_DEPTH).
// Bei tief verschachtelten Taxa faellt die KLASSEN-QID damit aus dem Feld heraus: eine
// Muecke traegt Q1390 (Insecta) 15 Ebenen ueber sich, im gespeicherten Feld steht sie
// nicht mehr. Ein direktes `lineage.includes(qid)` misst deshalb nur einen Bruchteil der
// gemeinten Menge (gemessen in P10 unten: bei Insekten 3 %). Genau daran haben P1 und P7
// bisher vorbeigemessen.
//
// Die fehlenden Ebenen lassen sich OHNE Netz rekonstruieren: jede der 42.648 Ketten ist
// ein Stueck desselben Baums, und flacher verschachtelte Arten enthalten genau die
// Knoten, die den tieferen abgeschnitten wurden. Die Vereinigung aller Ketten ergibt
// einen Elterngraphen, dessen transitive Huelle die vollstaendige Vorfahrenmenge liefert.
const _parent = new Map();
for (const e of CATALOG.entries) {
  const L = e.lineage || [];
  for (let i = 0; i < L.length - 1; i++) {
    if (!_parent.has(L[i])) _parent.set(L[i], new Set());
    _parent.get(L[i]).add(L[i + 1]);
  }
}
const _ancMemo = new Map();
const ancestorsOf = (qid) => {
  if (_ancMemo.has(qid)) return _ancMemo.get(qid);
  const out = new Set(), stack = [qid];
  while (stack.length) {
    const x = stack.pop();
    for (const p of (_parent.get(x) || [])) if (!out.has(p)) { out.add(p); stack.push(p); }
  }
  _ancMemo.set(qid, out);
  return out;
};
const _closMemo = new Map();
const cladeClosure = (e) => {
  if (_closMemo.has(e)) return _closMemo.get(e);
  const S = new Set(e.lineage || []);
  for (const q of (e.lineage || [])) for (const a of ancestorsOf(q)) S.add(a);
  _closMemo.set(e, S);
  return S;
};
const inClade = (e, key) => cladeClosure(e).has(CLADE[key].qid);
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
  // Seit dem #30-Fix leitet drawAnimalSvg() die Beinzahl NICHT mehr aus `limb` ab,
  // sondern setzt sie fest je Kind (Vierbeiner-Grundbauplan = immer vier). Genau das
  // war der Befund, den dieser Check aufgedeckt hat. Die Formel wird weiterhin GELESEN
  // statt abgeschrieben — nur ist sie jetzt eine Konstante.
  const m = html.match(/const legs = kind==="🐦" \? 2 : (\d+);/);
  if (!m) { console.error("plausi-check: Bein-Formel in drawAnimalSvg() nicht gefunden."); process.exit(1); }
  const drawnLegs = new Function("limb", `return ${m[1]};`);
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
     `Zeichnung: feste Beinzahl je Kind (Vierbeiner-Grundbauplan = 4) · Text: ebenfalls je Kind`,
     "Seit dem #30-Fix leiten beide die ZAHL aus dem Kind ab statt unabhaengig aus Gen 2; limb steuert nur noch die Beinlaenge."]);
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
      draw: zahl(/if\(insul>([0-9.]+) && !sprawl\)\{ let f="";/, "Fell-Zeichnung") },
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
// P8 — DIE BAUPLAN-GRUPPE HAELT ARTEN AUS EINER ANDEREN GROSSKLADE.
//
// Anlass: Screenshot aus der Live-App — „Mantelbussard" (Pseudastur polionotus, ein
// Greifvogel) auf der Silhouette eines vierbeinigen Saeugers, mit dem Bauplan-Satz
// „vier kraeftige Beine, Greifwerkzeuge, Leuchtorgan".
//
// Das ist KEIN Fehler von nearestReal(): der Bussard steht wirklich in der Gruppe, in
// der gesucht wurde. Er ist dort gelandet, weil tools/build-catalog.mjs die Gruppe eines
// Katalog-Eintrags per GENOM-ABSTAND zum naechsten Prototyp vergibt (nearestInKingdom),
// abgesichert nur durch einen REICH-Waechter — „Vogel" und „Generalisten-Tier" sind aber
// beide das Reich „Tier". Fuer die Anzeige entscheidet der Genom-Abstand damit ueber
// etwas, das er nicht entscheiden kann: welchen KOERPERBAU der Spieler zu sehen bekommt.
//
// Gemessen wird gegen die einzige Behauptung, die die Zeichnung eindeutig aufstellt —
// die BEINZAHL. Sie ist in drawAnimalSvg() pro Bauplan-Gruppe fest verdrahtet (seit dem
// #30-Fix, s. P2), und sie steht fuer jede Grossklade biologisch fest.
const DRAWN_LEGS = {
  // eigene Zeichen-Zweige in drawAnimalSvg()
  vogel: 2, laufvogel: 2, insekt: 6, feuerkaefer: 6, fluginsekt: 6, frostspanner: 6,
  baertierchen: 8, krebstier: 10, krill: 10, salinenkrebs: 10, tiefseeamphipode: 10,
  wurm: 0, schnecke: 0, kopffuesser: 0, leuchtwesen: 0, muschel: 0, seestern: 0,
  fisch: 0, bartenwal: 0, robbe: 0, koralle: 0, schwamm: 0,
  // Vierbeiner-Grundbauplan (Fallback der Zeichnung) + die Zweige, die ihn nur schmuecken
  fledermaus: 4, koloss: 4, beutetier: 4, grossjaeger: 4, fellgrosstier: 4, fellwarm: 4,
  kletterer: 4, flink: 4, amphibie: 4, reptil: 4, generalist: 4, wuehler: 4, chamaeleon: 4,
};
// Beinzahl je Grossklade — dieselbe Ground Truth wie in P1 (dort nur fuer Tetrapoden und
// Insekten), hier auf alle Tierstaemme des Katalogs ausgedehnt. -1 = keine Tierklade.
const KLADEN_BEINE = [
  ["Q5113", "Voegel", 2], ["Q7377", "Saeuger", 4], ["Q10811", "Reptilien", 4],
  ["Q10908", "Amphibien", 4], ["Q127282", "Knochenfische", 0], ["Q1390", "Insekten", 6],
  ["Q1358", "Spinnentiere", 8], ["Q25364", "Krebse", 10], ["Q25326", "Weichtiere", 0],
  ["Q25522", "Ringelwuermer", 0], ["Q44631", "Stachelhaeuter", 0], ["Q25441", "Nesseltiere", 0],
  ["Q18960", "Schwaemme", 0],
];
const kladeVon = (e) => {
  const S = cladeClosure(e);
  for (const [q, n, beine] of KLADEN_BEINE) if (S.has(q)) return { name: n, beine };
  return null;
};
{
  let gesamt = 0, falsch = 0;
  const proGruppe = [];
  for (const f of ARCH.forms) {
    const idx = CATALOG.byGroup[f.key] || [];
    const gez = DRAWN_LEGS[f.key];
    if (!idx.length || gez === undefined) continue;
    let n = 0; const kladen = {};
    for (const i of idx) {
      const k = kladeVon(CATALOG.entries[i]);
      if (!k) continue;
      gesamt++; kladen[k.name] = (kladen[k.name] || 0) + 1;
      if (k.beine !== gez) { n++; falsch++; }
    }
    if (n) proGruppe.push({ f, gez, n, tot: idx.length,
      kladen: Object.entries(kladen).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([k, v]) => `${k} ${((100 * v) / idx.length).toFixed(0)} %`).join(", ") });
  }
  proGruppe.sort((a, b) => b.n / b.tot - a.n / a.tot);
  report("P8", "Benennbare Art hat eine andere Beinzahl als die Zeichnung ihrer Gruppe",
    falsch, gesamt,
    [...proGruppe.slice(0, 8).map((x) =>
      `${x.f.n}: ${((100 * x.n) / x.tot).toFixed(0)} % von ${x.tot} — gezeichnet ${x.gez} Beine, im Katalog ${x.kladen}`),
     "Ursache: build-catalog.mjs vergibt die Gruppe per Genom-Abstand, abgesichert nur durch den REICH-Waechter.",
     "Eine Klade-Schranke (Vogel bleibt bei Vogel-Bauplaenen) gibt es nicht."]);
}

// ---------------------------------------------------------------------------
// P9 — DIESELBE FRAGE AUF DEM LIVE-PFAD, als Stichprobe.
//
// P8 zaehlt, was im Katalog STEHT. Diese Regel zaehlt, was ein Spieler tatsaechlich zu
// SEHEN bekommt: zufaellige Umwelten (die 6 Kern-Regler frei, in der Haelfte der Faelle
// zusaetzlich ein Stressor wie bei einer Einfluss-Karte), auskonvergiert, dann die
// fertige Karte pruefen — Name gegen gezeichneten Koerperbau.
{
  const N = 600;
  let seed = 20260811 >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const converge2 = (env, gens = 300) => {
    let g = new Array(NG).fill(0.5);
    for (let i = 0; i < gens; i++) g = stepGeneration(g, env, null);
    return g;
  };
  const STRESS = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];
  let benannt = 0, widerspruch = 0;
  const beispiele = [], proForm = {};
  for (let k = 0; k < N; k++) {
    const env = { ...BASE_ENV };
    for (const ax of ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"]) env[ax] = rnd();
    for (const s of STRESS) env[s] = 0;
    if (k % 2 === 0) env[STRESS[Math.floor(rnd() * STRESS.length)]] = 0.3 + rnd() * 0.6;
    env.oxygen = 1;
    const t = converge2(env);
    const a = classify(t, env);
    if (!a.real) continue;
    const gez = DRAWN_LEGS[a.key], k2 = kladeVon(a.real.e);
    if (gez === undefined || !k2) continue;
    benannt++;
    if (k2.beine !== gez) {
      widerspruch++;
      proForm[a.form] = (proForm[a.form] || 0) + 1;
      if (beispiele.length < 6)
        beispiele.push(`„${a.n}" (${k2.name}, real ${k2.beine} Beine) auf „${a.form}" — gezeichnet ${gez}`);
    }
  }
  report("P9", "Live-Stichprobe: gezeigter Artname widerspricht der gezeigten Silhouette",
    widerspruch, benannt,
    [...beispiele,
     "je Bauplan: " + Object.entries(proForm).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · "),
     `${N} zufaellige Umwelten, deterministisch auskonvergiert (300 Generationen, kein Rauschen).`]);
}

// ---------------------------------------------------------------------------
// P10 — BLINDER FLECK DIESES CHECKS SELBST.
//
// P1 und P7 fragen die Klade ueber `entry.lineage`. Das Feld ist in app/catalog.js auf
// 12 Ebenen gekuerzt — bei tief verschachtelten Taxa fehlt die Klassen-QID darin. Bis zu
// dieser Erweiterung hat der Check deshalb einen Bruchteil seiner eigenen Pruefmenge
// gesehen und „0 Verstoesse" gemeldet, wo er schlicht nicht hingeschaut hat. Die Zahl
// steht hier, damit der blinde Fleck nicht wieder unbemerkt zurueckkommt.
{
  let verloren = 0, mitKlasse = 0;
  for (const e of CATALOG.entries) {
    const direkt = new Set(e.lineage || []);
    const voll = cladeClosure(e);
    const hatVoll = KLADEN_BEINE.some(([q]) => voll.has(q));
    if (!hatVoll) continue;
    mitKlasse++;
    if (!KLADEN_BEINE.some(([q]) => direkt.has(q))) verloren++;
  }
  const abdeckung = Object.values(CLADE).map((c) => {
    const direkt = CATALOG.entries.filter((e) => (e.lineage || []).includes(c.qid)).length;
    const voll = CATALOG.entries.filter((e) => cladeClosure(e).has(c.qid)).length;
    return `${c.de}: ${direkt} von ${voll} (${voll ? ((100 * direkt) / voll).toFixed(0) : 0} %)`;
  });
  report("P10", "Klassen-QID faellt aus `lineage` heraus (slice(0,12) in build-catalog.mjs)",
    verloren, mitKlasse,
    [...abdeckung,
     "So viel sah ein direktes `lineage.includes(qid)` — der Rest der Kette ist im Katalog nicht gespeichert.",
     "Behoben durch die Vorfahren-Huelle oben (aus allen 42.648 Ketten rekonstruiert, ohne Netz)."]);
}

// ---------------------------------------------------------------------------
console.log("\n" + "─".repeat(72));
const gerissen = findings.filter((f) => f.verletzt > 0);
console.log(`plausi-check: ${gerissen.length} von ${findings.length} Regeln verletzt.`);
for (const f of gerissen) console.log(`  ✗ ${f.id}  ${f.titel} — ${f.verletzt}/${f.gesamt}`);
if (STRICT && gerissen.length) process.exit(1);
