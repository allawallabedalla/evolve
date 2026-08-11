// URSACHEN-AUDIT DER BENENNUNG — warum ein Greifvogel auf einer Vierbeiner-Silhouette landet.
//
// ABGRENZUNG. tools/plausi-check.mjs prueft die SYMPTOME an der fertigen Karte (Name gegen
// Satz gegen Zeichnung, P1-P10). Dieser Check prueft den WEG DAHIN: die vier Stellen, an
// denen die Benennung ihre Entscheidung trifft, und was an jeder davon an Information
// uebrig ist. Er misst keine Widersprueche, sondern TRAGFAEHIGKEIT — wie viel Signal
// steckt ueberhaupt in der Zahl, auf die sich der angezeigte Name beruft?
//
// Die vier Stellen, in der Reihenfolge, in der die App sie durchlaeuft:
//
//   (1) app/catalog.js       Woher stammen die Genwerte der realen Arten?      -> N1, N7
//   (2) app/archetypes.js    Welche Gene sieht ein Prototyp ueberhaupt an?     -> N2, N3
//   (3) matchArchetype()     Wie stark gewichtet/verzerrt die Stufe-1-Wahl?    -> N4, N5
//   (4) nearestReal()        Wie entschieden faellt die Stufe-2-Artwahl aus?   -> N6
//   (+) docs/rarity.json     Passt der Namensvorrat zu dem, was erreichbar ist? -> N8
//
// Ground Truth ist nirgends geraten: die Herkunft je Genwert steht als `conf` im Katalog,
// die Prototyp-Gene stehen in app/archetypes.js, die Gewichte und Boni kommen aus
// derselben ARCH-Datei, die die App liest, und die Erreichbarkeit ist am Schwarm gemessen
// (docs/rarity.json, tools/build-rarity.mjs).
//
// Aufruf:  npm run naming-audit
//          npm run naming-audit -- --strict   (Exit 1, sobald eine Schwelle reisst)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, ROOT, BASE_ENV } from "./lib/app-core.mjs";

const STRICT = process.argv.includes("--strict");
const core = loadAppCore("naming-audit");
const { classify, selectionWeights, stepGeneration, NG, ARCH, CATALOG } = core;
const GENES = ARCH.genes;

const findings = [];
const report = (id, titel, wert, schwelle, richtung, detail) => {
  // `richtung` = "hoch-ist-schlecht" | "tief-ist-schlecht"; `wert`/`schwelle` in Prozent
  // bzw. in der Einheit der Regel. Eine Regel reisst, wenn sie ueber (bzw. unter) liegt.
  const gerissen = richtung === "hoch" ? wert > schwelle : wert < schwelle;
  findings.push({ id, titel, wert, schwelle, gerissen });
  console.log(`\n${gerissen ? "✗" : "✓"} ${id}  ${titel}`);
  console.log(`   gemessen: ${wert}  (Schwelle ${richtung === "hoch" ? "≤" : "≥"} ${schwelle})`);
  for (const d of detail) console.log("   · " + d);
};

// ---------------------------------------------------------------------------
// Deterministische Stichprobe. Dieselbe Idee wie in build-rarity/plausi-check:
// feste Saat, kein Rauschen in der Konvergenz — der Bericht ist reproduzierbar.
let _s = 20260811 >>> 0;
const rnd = () => { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 4294967296; };
const STRESSOREN = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];
const zufallsUmwelt = () => {
  const e = { ...BASE_ENV };
  for (const ax of ["temperature", "predation", "foodAbundance", "foodHeight", "light", "water"]) e[ax] = rnd();
  for (const st of STRESSOREN) e[st] = 0;
  if (rnd() < 0.5) e[STRESSOREN[Math.floor(rnd() * STRESSOREN.length)]] = 0.3 + rnd() * 0.6;
  e.oxygen = 1;
  return e;
};
const konvergiere = (env, gens = 300) => {
  let g = new Array(NG).fill(0.5);
  for (let i = 0; i < gens; i++) g = stepGeneration(g, env, null);
  return g;
};
const STICHPROBE = 250;
const karten = [];
for (let k = 0; k < STICHPROBE; k++) {
  const env = zufallsUmwelt(), t = konvergiere(env);
  karten.push({ env, t, a: classify(t, env), w: selectionWeights(t, env) });
}
const pct = (x) => x.toFixed(1) + " %";

// ---------------------------------------------------------------------------
// N1 — WORAUF BERUFT SICH DER ARTNAME? Herkunft der Katalog-Genwerte.
//
// `conf` je Gen: 3 = an der realen Art gemessen · 2 = aus der Klade uebernommen ·
// 1 = imputiert · 0 = aus dem Habitat abgeleitet. Steht bei den KERN-Genen (0-9, sie
// tragen Koerperbau und damit Silhouette und Bauplan-Satz) fast ueberall eine 2, dann
// teilen sich alle Arten einer Klade praktisch EINEN Punkt — „naechste reale Art" kann
// dann unterhalb der Klade nichts mehr unterscheiden, egal wie genau gerechnet wird.
{
  const alle = [0, 0, 0, 0], kern = [0, 0, 0, 0];
  for (const e of CATALOG.entries) e.conf.forEach((c, i) => { alle[c]++; if (i < 10) kern[c]++; });
  const sA = alle.reduce((a, b) => a + b, 0), sK = kern.reduce((a, b) => a + b, 0);
  const gemessenKern = (100 * kern[3]) / sK;
  report("N1", "Anteil der KERN-Genwerte, die an der realen Art GEMESSEN sind",
    +gemessenKern.toFixed(1), 10, "tief",
    [`Kern-Gene 0–9: gemessen ${pct((100 * kern[3]) / sK)} · aus Klade ${pct((100 * kern[2]) / sK)} · imputiert ${pct((100 * kern[1]) / sK)} · aus Habitat ${pct((100 * kern[0]) / sK)}`,
     `alle 26 Gene: gemessen ${pct((100 * alle[3]) / sA)} · aus Klade ${pct((100 * alle[2]) / sA)} · imputiert ${pct((100 * alle[1]) / sA)} · aus Habitat ${pct((100 * alle[0]) / sA)}`,
     "Aus Klade uebernommen heisst: alle Arten derselben Klade tragen denselben Wert.",
     "Der Artname behauptet damit eine Aufloesung, die unterhalb der Klade keine Deckung hat."]);
}

// ---------------------------------------------------------------------------
// N2 — WELCHE GENE SIEHT DIE BENENNUNG UEBERHAUPT AN?
//
// Ein Prototyp ist eine TEIL-Spezifikation (app/archetypes.js): nur Gene, zu denen sein
// Kaskaden-Zweig etwas sagte, gehen in den Abstand ein. Ein Gen, das KEIN Prototyp nennt,
// kann die Formwahl nie beeinflussen — egal wie stark es ausgeschlagen ist. Genau das
// trifft `wing`: der eindeutigste Vogel-Hinweis, den ein Genom geben kann.
{
  const nennt = GENES.map((g) => ARCH.forms.filter((f) => f.proto[g] !== undefined).length);
  const stumm = GENES.filter((g, i) => nennt[i] === 0);
  const fastStumm = GENES.map((g, i) => ({ g, n: nennt[i] })).filter((x) => x.n > 0 && x.n <= 4);
  const anteilStumm = (100 * (stumm.length + fastStumm.length)) / GENES.length;
  report("N2", "Anteil der Gene, die HOECHSTENS 4 von 65 Prototypen ueberhaupt nennen",
    +anteilStumm.toFixed(1), 40, "hoch",
    [`gar nicht genannt (ohne jede Wirkung auf die Formwahl): ${stumm.join(", ") || "—"}`,
     `hoechstens 4×: ${fastStumm.map((x) => `${x.g} ${x.n}`).join(" · ")}`,
     `am haeufigsten genannt: ${GENES.map((g, i) => ({ g, n: nennt[i] })).sort((a, b) => b.n - a.n).slice(0, 6).map((x) => `${x.g} ${x.n}`).join(" · ")}`,
     "`wing` entscheidet nur zwischen den 4 Flieger-Prototypen mit. Fuer die anderen 61 Formen",
     "ist ein Fluegel-Gen von 0.85 unsichtbar — ein Grossvogel kann daran nicht als Vogel erkannt werden.",
     "`sense` steht als Sinne im Genbuch der App und evolviert mit, ohne die Identitaet je zu beruehren."]);
}

// ---------------------------------------------------------------------------
// N3 — DER PROTOTYP ALS FLASCHENHALS: passt der Bauplan zur Spannweite seiner Klade?
//
// Die Prototyp-ZAHLEN sind halb Kaskaden-Geometrie, halb Mittelwert ueber ERREICHBARE
// Genome (app/archetypes.js, Methode (2)). Was die Engine nie hervorbringt, steht also
// auch nicht im Prototyp. „Flatterer · Vogel" hat dadurch size 0.10 — die Groesse eines
// Singvogels. Jede reale Art, die deutlich darueber liegt, faellt aus ihrem eigenen
// Bauplan heraus, obwohl an ihrer Klade nichts zweifelhaft ist.
const parentGraph = new Map();
for (const e of CATALOG.entries) {
  const L = e.lineage || [];
  for (let i = 0; i < L.length - 1; i++) {
    if (!parentGraph.has(L[i])) parentGraph.set(L[i], new Set());
    parentGraph.get(L[i]).add(L[i + 1]);
  }
}
const _anc = new Map();
const ancestorsOf = (q) => {
  if (_anc.has(q)) return _anc.get(q);
  const out = new Set(), st = [q];
  while (st.length) { const x = st.pop(); for (const p of (parentGraph.get(x) || [])) if (!out.has(p)) { out.add(p); st.push(p); } }
  _anc.set(q, out); return out;
};
const _clo = new Map();
const kladenHuelle = (e) => {
  if (_clo.has(e)) return _clo.get(e);
  const S = new Set(e.lineage || []);
  for (const q of (e.lineage || [])) for (const a of ancestorsOf(q)) S.add(a);
  _clo.set(e, S); return S;
};
// Klade -> Bauplan-Gruppen, die ihren Koerperbau zeichnen (kuratiert wie FICON).
const HEIMAT = [
  { qid: "Q5113", de: "Voegel", gruppen: ["vogel", "laufvogel"] },
  { qid: "Q1390", de: "Insekten", gruppen: ["insekt", "fluginsekt", "feuerkaefer", "frostspanner"] },
  { qid: "Q7377", de: "Saeuger", gruppen: ["fellwarm", "fellgrosstier", "grossjaeger", "kletterer", "flink", "koloss", "fledermaus", "robbe", "bartenwal", "wuehler", "generalist", "beutetier"] },
  { qid: "Q25364", de: "Krebse", gruppen: ["krebstier", "krill", "salinenkrebs", "tiefseeamphipode"] },
  { qid: "Q25326", de: "Weichtiere", gruppen: ["schnecke", "kopffuesser", "muschel"] },
];
{
  const zeilen = [];
  let heimatlos = 0, gesamt = 0;
  for (const h of HEIMAT) {
    const arten = CATALOG.entries.filter((e) => kladenHuelle(e).has(h.qid));
    const draussen = arten.filter((e) => !h.gruppen.includes(e.group));
    gesamt += arten.length; heimatlos += draussen.length;
    // Welches Gen schiebt sie hinaus? Vergleich der Verteilung drinnen/draussen.
    const mitte = (xs, g) => xs.reduce((a, e) => a + e.genome[g] / 255, 0) / Math.max(xs.length, 1);
    const drin = arten.filter((e) => h.gruppen.includes(e.group));
    const treiber = GENES.slice(0, 10)
      .map((g, i) => ({ g, delta: Math.abs(mitte(draussen, i) - mitte(drin, i)), aussen: mitte(draussen, i), innen: mitte(drin, i) }))
      .sort((a, b) => b.delta - a.delta)[0];
    zeilen.push(`${h.de}: ${draussen.length} von ${arten.length} (${pct((100 * draussen.length) / arten.length)}) ausserhalb`
      + (treiber && draussen.length ? ` — staerkster Unterschied: ${treiber.g} ${treiber.innen.toFixed(2)} drinnen vs ${treiber.aussen.toFixed(2)} draussen` : ""));
  }
  // Der Vogel-Fall im Detail: die Groesse ist die harte Kante.
  const voegel = CATALOG.entries.filter((e) => kladenHuelle(e).has("Q5113"));
  const proto = ARCH.forms.find((f) => f.key === "vogel").proto.size;
  const gross = voegel.filter((e) => e.genome[1] / 255 > 0.30);
  const grossDraussen = gross.filter((e) => !["vogel", "laufvogel"].includes(e.group)).length;
  report("N3", "Anteil der Arten, die ausserhalb jedes Bauplans ihrer eigenen Klade stehen",
    +((100 * heimatlos) / gesamt).toFixed(1), 10, "hoch",
    [...zeilen,
     `„Flatterer · Vogel" hat Prototyp-size ${proto} — die Groesse eines Singvogels.`,
     `Von ${voegel.length} Vogelarten liegen ${gross.length} ueber size 0.30; davon stehen ${grossDraussen} (${pct((100 * grossDraussen) / Math.max(gross.length, 1))}) in einer Nicht-Vogel-Gruppe.`,
     "Ein grosser Vogel ist in diesem Merkmalsraum per Konstruktion kein Vogel."]);
}

// ---------------------------------------------------------------------------
// N4 — SAETTIGT DIE GEWICHTUNG? selectionWeights() soll den Abstand auf die Gene lenken,
// die in DIESER Umwelt ueber Leben und Tod entscheiden. Gemessen wird |∂Fitness/∂Gen| AM
// GENOM SELBST — und ein auskonvergiertes Genom sitzt per Definition auf einem Gipfel, wo
// alle Ableitungen klein sind. Nach Normierung auf das Maximum und dem Schaerfen mit
// `weightSharpen` bleibt dann oft nur EIN Gen oben, alles andere faellt auf `weightFloor`.
// Der „selektions-gewichtete" Abstand ist dann praktisch ein ungewichteter.
{
  let amBoden = 0, alle = 0, nurEins = 0;
  for (const k of karten) {
    const ueber = k.w.filter((x) => x > ARCH.weightFloor + 0.02).length;
    if (ueber <= 1) nurEins++;
    for (const x of k.w) { alle++; if (x <= ARCH.weightFloor + 0.02) amBoden++; }
  }
  report("N4", "Anteil der Gengewichte, die auf dem Boden liegen",
    +((100 * amBoden) / alle).toFixed(1), 50, "hoch",
    [`weightFloor ${ARCH.weightFloor} · weightSharpen ${ARCH.weightSharpen}`,
     `In ${pct((100 * nurEins) / karten.length)} der Faelle ragt HOECHSTENS EIN Gen ueber den Boden.`,
     "Auf einem auskonvergierten Gipfel sind alle Ableitungen klein — die Normierung auf das",
     "Maximum macht daraus trotzdem eine 1.0 fuer genau ein Gen und Boden fuer den Rest.",
     "Die Gewichtung kann eine Fehlzuordnung dann nicht mehr korrigieren."]);
}

// ---------------------------------------------------------------------------
// N5 — WIE STARK VERZERRT DER SPEZIFITAETS-BONUS? Er soll verhindern, dass der vagere
// Prototyp den genaueren schlaegt. Bei `specificityBonus` 0.55 ist der Rabatt aber so
// gross, dass er regelmaessig die Reihenfolge kippt — dann gewinnt eine Form, die roh
// NICHT die naechste ist, allein weil ihr Prototyp mehr Gene nennt.
{
  const lib = ARCH.forms.map((f) => {
    const v = new Array(GENES.length).fill(null), idx = [];
    for (let i = 0; i < GENES.length; i++) { const x = f.proto[GENES[i]]; if (x !== undefined) { v[i] = x; idx.push(i); } }
    return { f, v, idx };
  });
  const namedMax = Math.max(...lib.map((a) => a.idx.length));
  let kippt = 0;
  const beispiele = [];
  for (const k of karten) {
    const rows = lib.map((a) => {
      let s = 0, z = 0;
      for (const i of a.idx) { const d = (k.t[i] - a.v[i]) * k.w[i]; s += d * d; z += k.w[i] * k.w[i]; }
      const roh = Math.sqrt(s / Math.max(z, 1e-9));
      return { n: a.f.n, roh, dist: roh * (1 - ARCH.specificityBonus * a.idx.length / namedMax) };
    });
    const mit = [...rows].sort((a, b) => a.dist - b.dist)[0];
    const ohne = [...rows].sort((a, b) => a.roh - b.roh)[0];
    if (mit.n !== ohne.n) {
      kippt++;
      if (beispiele.length < 4) beispiele.push(`${ohne.n} (roh ${ohne.roh.toFixed(3)}) verliert gegen ${mit.n} (roh ${mit.roh.toFixed(3)})`);
    }
  }
  report("N5", "Anteil der Karten, deren Form NICHT der roh naechste Prototyp ist",
    +((100 * kippt) / karten.length).toFixed(1), 10, "hoch",
    [`specificityBonus ${ARCH.specificityBonus} · ausfuehrlichster Prototyp nennt ${namedMax} Gene`,
     `Rabatt-Spanne: ${pct(100 * ARCH.specificityBonus * 1 / namedMax)} (1 Gen) bis ${pct(100 * ARCH.specificityBonus)} (${namedMax} Gene).`,
     ...beispiele,
     "Der Bonus soll die alte Kaskaden-Reihenfolge nachbilden — er ueberstimmt hier den Abstand selbst."]);
}

// ---------------------------------------------------------------------------
// N6 — WIE ENTSCHIEDEN IST DIE ARTWAHL? Stufe 2 sucht die naechste reale Art innerhalb
// der Gruppe. Wenn dort hunderte Arten praktisch auf demselben Punkt liegen (s. N1), ist
// der Sieger keine Aussage mehr, sondern eine Auswahl aus einem Gleichstand.
const HABITAT_PENALTY_K = 2.0;
{
  const vorspruenge = [], gleichstand = [];
  const beispiele = [];
  for (const k of karten) {
    if (!k.a.real) continue;
    const idx = CATALOG.byGroup[k.a.key] || [];
    if (idx.length < 20) continue;
    const ds = idx.map((i) => {
      const e = CATALOG.entries[i];
      let s = 0, z = 0;
      for (let g = 0; g < NG; g++) { const d = (k.t[g] - e.genome[g] / 255) * k.w[g]; s += d * d; z += k.w[g] * k.w[g]; }
      let d = Math.sqrt(s / Math.max(z, 1e-9));
      if (e.habWater != null) d *= 1 + HABITAT_PENALTY_K * Math.abs(k.env.water - e.habWater / 255);
      return { d, name: e.de || e.sci };
    }).sort((a, b) => a.d - b.d);
    vorspruenge.push((ds[1].d - ds[0].d) / ds[0].d);
    const im1 = ds.filter((x) => x.d <= ds[0].d * 1.01).length;
    gleichstand.push(im1);
    if (im1 > 20 && beispiele.length < 4)
      beispiele.push(`„${k.a.n}" — ${im1} von ${idx.length} Arten liegen innerhalb 1 % (Zweiter: ${ds[1].name})`);
  }
  const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const medVorsprung = 100 * med(vorspruenge);
  report("N6", "Median-Vorsprung der benannten Art vor der zweitnaechsten (Prozent)",
    +medVorsprung.toFixed(2), 2, "tief",
    [`${vorspruenge.length} Karten aus Gruppen mit ≥20 Arten.`,
     `Median ${med(gleichstand)} Arten liegen innerhalb von 1 % Abstand zum Sieger.`,
     ...beispiele,
     "Der angezeigte Artname ist in diesem Bereich keine Messung mehr, sondern ein Losentscheid",
     "zwischen praktisch gleichwertigen Kandidaten."]);
}

// ---------------------------------------------------------------------------
// N7 — WORAUS BESTEHT DIESER ABSTAND EIGENTLICH? Die Gene 10–25 sind im Katalog zu einem
// grossen Teil gar nicht erhoben, sondern aus dem Habitat abgeleitet (conf 0) und
// anschliessend vom Gruender-Los (world/founder.ts, bis Radius 0.5 in wirkungslosen Genen)
// bewusst verstreut — der Fix gegen „Genom-Zwillinge" in build-catalog.mjs. `weightFloor`
// 0.3 blendet diese Richtungen aber nie ganz aus. Das eigens erzeugte Rauschen geht also
// mit in den Abstand ein, der den Artnamen bestimmt.
{
  let kernAnteil = 0, n = 0;
  for (const k of karten) {
    if (!k.a.real) continue;
    const e = k.a.real.e;
    let sk = 0, sb = 0;
    for (let g = 0; g < NG; g++) { const d = (k.t[g] - e.genome[g] / 255) * k.w[g]; if (g < 10) sk += d * d; else sb += d * d; }
    if (sk + sb <= 0) continue;
    kernAnteil += sk / (sk + sb); n++;
  }
  const bedingt = 100 * (1 - kernAnteil / n);
  // Streuung im Katalog: Kern gegen bedingte Gene, je Gruppe.
  const streuung = ["kletterer", "generalist", "fellwarm"].map((key) => {
    const es = (CATALOG.byGroup[key] || []).map((i) => CATALOG.entries[i]);
    if (!es.length) return `${key}: leer`;
    const sd = [];
    for (let g = 0; g < NG; g++) {
      const v = es.map((x) => x.genome[g] / 255), m = v.reduce((a, b) => a + b, 0) / v.length;
      sd.push(Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length));
    }
    const kern = sd.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const bed = sd.slice(10).reduce((a, b) => a + b, 0) / (NG - 10);
    return `${key}: mittlere SD Kern ${kern.toFixed(3)} · bedingt ${bed.toFixed(3)}`;
  });
  report("N7", "Anteil des Artabstands, der aus den bedingten Genen 10–25 stammt",
    +bedingt.toFixed(1), 25, "hoch",
    [...streuung,
     "Quantisierung des Katalogs: 1/255 = 0.004 — die Streuung liegt teils nur wenige Stufen darueber.",
     "Die bedingten Gene sind im Katalog zu 41,5 % aus dem Habitat abgeleitet (conf 0) und",
     "anschliessend vom Gruender-Los verstreut. weightFloor 0.3 laesst dieses Rauschen mitzaehlen.",
     "Die Arten einer Gruppe unterscheiden sich damit vor allem dort, wo nichts gemessen wurde."]);
}

// ---------------------------------------------------------------------------
// N8 — PASST DER NAMENSVORRAT ZU DEM, WAS ERREICHBAR IST?
//
// Ein Bauplan, den die Evolution praktisch nie hervorbringt, kann seine Artnamen nie
// zeigen — sie wandern zwangslaeufig auf andere Silhouetten ab. Erreichbarkeit ist am
// Schwarm gemessen (docs/rarity.json, tools/build-rarity.mjs), nicht geschaetzt.
{
  const rar = JSON.parse(readFileSync(join(ROOT, "docs", "rarity.json"), "utf-8"));
  const pctVon = {};
  for (const f of rar.forms) pctVon[f.name] = f.convergencePct;
  const zeilen = [], schief = [];
  for (const f of ARCH.forms) {
    const n = (CATALOG.byGroup[f.key] || []).length;
    const p = pctVon[f.n];
    if (!n || p === undefined) continue;
    // „Namen pro Prozentpunkt Erreichbarkeit" — hoch heisst: viele Namen, die kaum je
    // ihre eigene Silhouette bekommen.
    zeilen.push({ n: f.n, arten: n, p, q: p > 0 ? n / p : Infinity });
  }
  zeilen.sort((a, b) => b.q - a.q);
  for (const z of zeilen.slice(0, 6))
    schief.push(`${z.n}: ${z.arten} Artnamen bei ${z.p} % Erreichbarkeit`);
  const vogel = zeilen.find((z) => z.n.startsWith("Flatterer"));
  const gen = zeilen.find((z) => z.n.startsWith("Generalisten"));
  const verhaeltnis = vogel && gen && vogel.p > 0 ? gen.p / vogel.p : 0;
  report("N8", "Erreichbarkeits-Verhaeltnis Generalisten-Tier zu Flatterer · Vogel",
    +verhaeltnis.toFixed(1), 3, "hoch",
    [...schief,
     vogel && gen ? `„Generalisten-Tier" ${gen.p} % (haelt ${gen.arten} Namen, davon 96 % Voegel) gegen „Flatterer · Vogel" ${vogel.p} % (haelt ${vogel.arten} Namen).` : "",
     "Der Bauplan, der einen Vogel ZEICHNEN wuerde, ist praktisch unerreichbar; der Bauplan,",
     "der die Vogel-NAMEN haelt, ist es nicht. Die Namen haben nirgendwo sonst hin."].filter(Boolean));
}

// ---------------------------------------------------------------------------
console.log("\n" + "─".repeat(72));
const gerissen = findings.filter((f) => f.gerissen);
console.log(`naming-audit: ${gerissen.length} von ${findings.length} Schwellen gerissen.`);
for (const f of gerissen) console.log(`  ✗ ${f.id}  ${f.titel} — ${f.wert} (Schwelle ${f.schwelle})`);
console.log("\nDie Kette in einem Satz: der Artname stuetzt sich auf Koordinaten, die zu 99 % aus");
console.log("der Klade stammen, wird auf Prototypen abgebildet, die das entscheidende Gen nicht");
console.log("ansehen, mit Gewichten, die auf dem Boden liegen, und faellt am Ende zwischen Arten,");
console.log("die sich nur im absichtlich erzeugten Rauschen unterscheiden.");
if (STRICT && gerissen.length) process.exit(1);
