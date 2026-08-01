// Imputation + Habitat-Rueckwaertslauf — Stufen (c) und (d) der Platzierungs-Methode
// (BACKLOG Punkt 12, Schritt 1.3 · docs/artenkatalog-plan.md Abschnitt 5).
//
// AUFGABE. Ein Genom, das nach Stufe (a) [gemessene Merkmale] und Stufe (b)
// [tools/lib/clade-rules.mjs] noch Luecken hat, vollstaendig befuellen — und zu JEDEM
// der 25 Gene sagen, woher der Wert kommt. Am Ende ist kein Gen mehr `null`, und jedes
// traegt eine Konfidenz 0-3 (Plan Abschnitt 4):
//
//   3  direkt gemessen (Merkmalsquelle dieser Art)          <- Stufe (a), hier nur durchgereicht
//   2  aus der Klade abgeleitet                             <- Stufe (b), hier nur durchgereicht
//   1  hierarchisch imputiert (Median der Geschwister)      <- Stufe (c), DIESE DATEI
//   0  aus dem Habitat-Rueckwaertslauf geschaetzt           <- Stufe (d), DIESE DATEI
//
// -----------------------------------------------------------------------------
// DIE HARTE REGEL
//
// (c) und (d) duerfen NIEMALS ein Gen ueberschreiben, das (a) oder (b) belegt hat.
// Das ist keine Stil-Frage, sondern die Bedingung, unter der der Plan Stufe (d)
// ueberhaupt zulaesst (Abschnitt 5, „Wichtige Grenze“): viele Arten teilen dasselbe
// Habitat und fielen sonst auf denselben Punkt — der Katalog waere eine Wolke von
// Duplikaten. Umgesetzt ist die Regel STRUKTURELL, nicht durch Disziplin: `fill()`
// unten ist die einzige Schreibstelle und schreibt ausschliesslich in Positionen, die
// `null` sind. tools/impute-check.mjs (Pruefung I1) rechnet das an echten Arten nach.
//
// -----------------------------------------------------------------------------
// STUFE (c) — HIERARCHISCHE IMPUTATION
//
// Standardverfahren der Merkmalsoekologie: fehlt einem Taxon ein Merkmal, nimm den
// Median der naechsten Taxonomie-Ebene, die genug belegte Geschwister hat. Hier laeuft
// das ueber die Elterntaxon-Kette (tools/wikidata-lineage.mjs): die Kette ist nach
// Naehe sortiert (naechster Vorfahr zuerst), also ist „von vorne durchgehen“ genau
// „Gattung, sonst Familie, sonst Ordnung“ — ohne dass die Rangstufen benannt werden
// muessten, was in Wikidatas Baum ohnehin unzuverlaessig waere (s. clade-rules.mjs).
//
// WO DIESE STUFE TRAEGT — GEMESSEN, NICHT VERMUTET. Die Erwartung beim Bauen war, dass
// Stufe (c) fast nichts beitraegt: Stufe (b) vergibt PRO KLADE identische Werte, der
// Median der Geschwister muesste also entweder redundant (alle gleich) oder leer (alle
// null) sein. Der Pruefstand widerlegt das teilweise — gemessen ueber 200 Arten traegt
// Stufe (c) 11,0 % aller Gene. Der Grund ist der Aufbau des Regelwerks selbst: unter
// einem Vorfahren haengen Untergruppen mit UNTERSCHIEDLICH tiefen Regeln, und nur
// manche davon sprechen zu `osmo`, `camo` oder `burrow`. Ein Vielborster ohne eigene
// Aussage zu `burrow` erbt den Median seiner Geschwister, die eine haben.
//   Die Kehrseite, ebenfalls gemessen: fuer die ZEHN Kern-Gene traegt (c) so gut wie
// nichts bei (0,45 % der Faelle, ausschliesslich `armor`) — dort ist (b) praktisch
// lueckenlos und laesst gar keinen Platz. Die Gene aus Stufe (a) erreicht (c) aus
// demselben Grund nicht: `size` ist bei jeder Klade schon belegt. Die Imputation
// arbeitet damit fast ausschliesslich im Block der bedingten Stressor-Gene 10-24.
//
// -----------------------------------------------------------------------------
// STUFE (d) — HABITAT-RUECKWAERTSLAUF
//
// Was danach noch `null` ist, sind fast nur die 15 bedingten Stressor-Gene (Index
// 10-24): zu Entgiftung, Frostschutz oder Druck-Toleranz sagt weder eine Klade noch
// eine Merkmalsdatenbank etwas. Statt sie zu raten, wird die Umwelt der Art geschaetzt
// und die ENGINE dort konvergieren gelassen — das Ergebnis ist per Konstruktion im
// erreichbaren Raum und braucht keine Zusatzannahme (Plan Abschnitt 5).
//
// DREI ENTSCHEIDUNGEN, DIE HIER GETROFFEN WURDEN:
//
//  1. DIE UMWELTEN SIND NICHT ERFUNDEN. Als Habitat-Vokabular dienen die zwoelf
//     kalibrierten Biome aus app/index.html (`BIOMES`) — dieselben, gegen die die
//     Physik in ecology-check/reality-check geprueft ist. Sie werden zur Laufzeit aus
//     app/index.html gelesen (dieselbe Technik wie tools/lib/app-core.mjs), damit hier
//     keine zweite, driftende Kopie entsteht. Der Rueckfall ohne Habitat-Hinweis ist
//     BASE_ENV, die neutrale Startwelt der App — kein erfundener Mittelwert.
//  2. DIE FITNESS KOMMT AUS engine/fitness.ts (ueber dist/), NICHT aus der
//     App-Inline-Kopie. Beide sind per npm run app-parity bitgleich, aber die Engine
//     ist die massgebliche Fassung; sie wird hier ausschliesslich GELESEN.
//  3. FESTE GENE BLEIBEN FEST. Der Rueckwaertslauf laesst nur die offenen Gene
//     klettern, mit den belegten als unveraendertem Kontext. Damit ist die harte Regel
//     auch waehrend der Konvergenz eingehalten und nicht erst danach repariert — und
//     das Ergebnis ist die beste Ergaenzung ZU DIESEM Bauplan, nicht ein generisches
//     Optimum des Habitats.
//
// Der Konvergenz-Mechanismus selbst ist der aus tools/lib/app-core.mjs (`converge`):
// deterministischer Gradientenaufstieg mit PARAMS aus app/index.html, kein Rauschen.
// Zweimal aufgerufen -> bitgleiches Ergebnis.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { GENES, GENE_INDEX, RESTING } from "./clade-rules.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NG = GENES.length;

export const PHYS = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));

/** Die 16 Umwelt-Achsen und die neutrale Startwelt — identisch zu tools/lib/app-core.mjs. */
export const BASE_ENV = { temperature: .5, predation: .3, foodAbundance: .5, foodHeight: .2,
  light: .5, water: .6, toxicity: 0, oxygen: 1, salinity: 0, uv: 0, pressure: 0, aridity: 0,
  radiation: 0, fire: 0, frost: 0, wind: 0 };
const STRESSORS = ["toxicity", "salinity", "uv", "pressure", "aridity", "radiation", "fire", "frost", "wind"];

// ---------------------------------------------------------------------------
// PARAMS und BIOMES aus app/index.html — eine Quelle, keine Kopie.

function grab(html, re, what) {
  const m = html.match(re);
  if (!m) throw new Error(`impute: ${what} nicht in app/index.html gefunden.`);
  return m[0];
}

const APP_HTML = readFileSync(join(ROOT, "app", "index.html"), "utf-8");

/** PARAMS.responseRate / mutationAnchor / mutationRate / selectionStrength / varianceWeight. */
export const PARAMS = (() => {
  const src = grab(APP_HTML, /const PARAMS = \{[\s\S]*?\n\};/, "PARAMS");
  const box = {};
  new Function("box", `${src}; box.p = PARAMS;`)(box);
  return box.p;
})();

/** Die zwoelf kalibrierten Biome der App, als vollstaendige Umwelten (16 Achsen). */
export const BIOMES = (() => {
  const src = grab(APP_HTML, /const BIOMES = \[[\s\S]*?\n\];/, "BIOMES");
  const box = {};
  new Function("box", `${src}; box.b = BIOMES;`)(box);
  const out = new Map();
  for (const b of box.b) {
    const e = { ...BASE_ENV, ...b.env };
    for (const s of STRESSORS) e[s] = 0;
    e.oxygen = b.env.oxygen === undefined ? 1 : b.env.oxygen;
    if (b.stress) e[b.stress.ax] = b.stress.v;
    out.set(b.n, e);
  }
  // Zwei zusaetzliche, ebenfalls NICHT erfundene Umwelten: die App laesst den Spieler
  // ueber `MEDIUM_BANDS` zwischen Land und Wasser umschalten und setzt dabei `water`
  // auf die Bandmitte (s. app/index.html, "neuer Entwurf: Band-Mitte als Startpunkt").
  // Genau diese beiden Bandmitten sind hier die generische Land- bzw. Wasserwelt —
  // noetig, weil BASE_ENV mit water 0.6 ueber aquaticWaterFloor (0.5) liegt und einem
  // Landtier sonst einen kleinen Aquatik-Kanal schenken wuerde.
  const bandsSrc = grab(APP_HTML, /const MEDIUM_BANDS = \{[\s\S]*?\n\};/, "MEDIUM_BANDS");
  const bbox = {};
  new Function("box", `${bandsSrc}; box.b = MEDIUM_BANDS;`)(bbox);
  out.set("Land (neutral)", { ...BASE_ENV, water: (bbox.b.land.lo + bbox.b.land.hi) / 2 });
  out.set("Wasser (neutral)", { ...BASE_ENV, water: (bbox.b.wasser.lo + bbox.b.wasser.hi) / 2 });
  out.set("Neutral", { ...BASE_ENV });   // letzter Rueckfall: die Startwelt der App
  return out;
})();

// ===========================================================================
// STUFE (a) — die eine Merkmals-Abbildung, die geeicht werden konnte
// ===========================================================================
//
// Der Kopfkommentar von clade-rules.mjs vermerkt ausdruecklich, dass die Abbildung
// Masse -> `size` dort NICHT enthalten ist, weil sie eine eigene Eichung braucht. Hier
// ist sie, und zwar geeicht an den GEMESSENEN Prototyp-Zahlen aus app/archetypes.js
// (denselben Ankern, an denen das Kladen-Regelwerk haengt), nicht an einer frei
// gewaehlten Formel:
//
//   Bakterie      ~1e-12 g  -> 0.05     Laufvogel (Strauss)  ~1e5 g   -> 0.55
//   Insekt        ~0.05 g   -> 0.15     Koloss (Elefant)     ~5e6 g   -> 0.68
//   Kleinsaeuger  ~20 g     -> 0.26     Blauwal              ~1.5e8 g -> 0.85
//
// Die Beziehung ist in log10(Masse) STUECKWEISE LINEAR und ausdruecklich NICHT eine
// Gerade: zwischen Bakterie und Insekt liegen elf Zehnerpotenzen und nur 0.10 in `size`,
// zwischen Kleinsaeuger und Blauwal sieben Zehnerpotenzen und 0.59. Eine einzelne
// Gerade durch alle Anker wuerde jeden Saeuger unter 1 kg auf denselben Wert quetschen.
// `kleiberDecades` (0.6 in physics.json) ist NICHT diese Skala — das ist ein
// Kosten-Tuning-Parameter der Allometrie, s. Plan Schritt 1.2.
const MASS_ANCHORS = [
  [-12, 0.05], [-1.3, 0.15], [1.3, 0.26], [5.0, 0.55], [6.7, 0.68], [8.2, 0.85],
];

/** Koerpermasse (Gramm) -> `size`-Gen. null bei unbrauchbarer Eingabe. */
export function sizeFromMassG(massG) {
  const m = Number(massG);
  if (!Number.isFinite(m) || m <= 0) return null;
  const x = Math.log10(m);
  if (x <= MASS_ANCHORS[0][0]) return MASS_ANCHORS[0][1];
  for (let i = 1; i < MASS_ANCHORS.length; i++) {
    const [x0, y0] = MASS_ANCHORS[i - 1], [x1, y1] = MASS_ANCHORS[i];
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  // Ueber dem groessten Anker (Mammutbaum 0.97 als Deckel, s. clade-rules.mjs).
  return Math.min(0.97, MASS_ANCHORS[MASS_ANCHORS.length - 1][1]
    + 0.06 * (x - MASS_ANCHORS[MASS_ANCHORS.length - 1][0]));
}

/**
 * Stufe (a): gemessene Merkmale einer Art -> Gen-Werte (Konfidenz 3).
 *
 * BEWUSST NUR EIN MERKMAL. Die einzige Groesse in den angebundenen Quellen
 * (PanTHERIA/EltonTraits, s. tools/build-traits.mjs), die sich ohne Zwischenannahme
 * auf eine Genachse abbilden laesst, ist die Koerpermasse. Die Diaet-Anteile aus
 * EltonTraits waeren verlockend (Diet.Vend -> `sense`?), aber jede solche Abbildung
 * braucht einen Umrechnungsfaktor, den nichts eicht — und sie traege dann KONFIDENZ 3
 * und wuerde damit die begruendeten Kladen-Werte verdraengen. Ein geratener Wert mit
 * hoher Konfidenz ist schlechter als gar keiner: er ist derselbe Fehler, nur unsichtbar.
 * Offen fuer Schritt 1.4, falls eine Quelle mit direkt messbaren Achsen dazukommt.
 *
 * @param {{massG?:number|string}|null} traits
 * @returns {Record<string, number>} Gen-Name -> Wert (leer, wenn nichts messbar war)
 */
export function traitsToGenes(traits) {
  const out = {};
  if (!traits) return out;
  const size = sizeFromMassG(traits.massG);
  if (size !== null) out.size = size;
  return out;
}

// ===========================================================================
// STUFE (c) — hierarchische Imputation
// ===========================================================================

/** Mindestzahl belegter Geschwister, damit eine Ebene als Grundlage taugt.
 *  5 ist die uebliche Untergrenze in der Merkmalsoekologie: darunter ist der Median
 *  von einem einzelnen Ausreisser dominiert und behauptet eine Genauigkeit, die die
 *  Stichprobe nicht hergibt. Ueberschreibbar (buildCorpus/imputeGene), damit
 *  tools/impute-check.mjs die Empfindlichkeit messen kann statt sie zu glauben. */
export const MIN_SIBLINGS = 5;

/** Wie tief in die Kette der Korpus hineinreicht. Die ersten zwoelf Vorfahren decken
 *  Gattung bis Klasse ab; alles darueber ist als „Geschwisterschaft“ bedeutungslos
 *  (der Median aller Tiere sagt nichts ueber eine Art) und kostet nur Speicher. */
const CORPUS_DEPTH = 12;

function median(xs) {
  const a = xs.slice().sort((p, q) => p - q);
  const n = a.length;
  return n % 2 ? a[n >> 1] : (a[n / 2 - 1] + a[n / 2]) / 2;
}

/**
 * Korpus fuer Stufe (c): sammelt je Vorfahr-QID und Gen die Werte aller Arten, die
 * ihn in ihrer Kette tragen.
 *
 * @param {{lineage:string[], genome:(number|null)[]}[]} entries
 *        Die (a)+(b)-Genome ALLER geernteten Arten. Genau das ist die Aussage aus dem
 *        Plan („arbeite mit dem, was aus (a)+(b) bereits berechenbar ist“): der Korpus
 *        entsteht aus derselben Datenlage, die er dann fuellt — keine Fremdquelle.
 * @returns {Map<string, (number[]|null)[]>} QID -> je Gen die Liste der Werte
 */
export function buildCorpus(entries) {
  const corpus = new Map();
  for (const e of entries) {
    const lin = (e.lineage || []).slice(0, CORPUS_DEPTH);
    if (!lin.length) continue;
    for (const anc of lin) {
      let slot = corpus.get(anc);
      if (!slot) { slot = new Array(NG).fill(null); corpus.set(anc, slot); }
      for (let g = 0; g < NG; g++) {
        const v = e.genome[g];
        if (v === null || v === undefined) continue;
        (slot[g] || (slot[g] = [])).push(v);
      }
    }
  }
  return corpus;
}

/**
 * Stufe (c) fuer EIN Gen: naechste Ebene der Kette mit genug belegten Geschwistern.
 * @returns {{value:number, qid:string, depth:number, n:number}|null}
 *          `depth` = Position in der Kette (0 = naechster Vorfahr, also Gattung).
 */
export function imputeGene(corpus, lineage, gene, minSiblings = MIN_SIBLINGS) {
  const gi = typeof gene === "number" ? gene : GENE_INDEX[gene];
  const lin = (lineage || []).slice(0, CORPUS_DEPTH);
  for (let d = 0; d < lin.length; d++) {
    const slot = corpus.get(lin[d]);
    const vals = slot && slot[gi];
    if (!vals || vals.length < minSiblings) continue;
    return { value: median(vals), qid: lin[d], depth: d, n: vals.length };
  }
  return null;
}

// ===========================================================================
// STUFE (d) — Habitat-Rueckwaertslauf
// ===========================================================================
//
// HABITAT-REGELN. Dieselbe Mechanik wie das Kladen-Regelwerk: Zugehoerigkeit zur Kette
// entscheidet, hoeherer `level` gewinnt. Und dieselbe Disziplin: JEDE QID hier steht
// bereits in tools/lib/clade-rules.mjs und ist dort gegen Wikidata geprueft — es wird
// hier KEINE neue, ungeprueft geratene QID eingefuehrt. Das Zielvokabular sind die
// zwoelf kalibrierten Biome (s. o.), nicht frei gedrehte Regler.
//
// Warum so wenige Regeln? Weil eine Klade nur dann ein Habitat vorgibt, wenn sie es
// AUSNAHMSLOS teilt. „Ueberwiegend marine“ reicht nicht — der Rueckfall auf die
// neutrale Startwelt ist dann die ehrlichere Aussage als ein Mehrheitsvotum, das jede
// Ausnahme still falsch platziert.
export const HABITAT_RULES = [
  // -- Tiefsee: Dunkelheit UND Druck; die beiden einzigen Kladen im Regelwerk, die
  //    per Definition mesopelagisch/bathypelagisch sind.
  { qid: ["Q657570", "Q206948"], biome: "Lichtlose Tiefsee", level: 5,
    reason: "Maulstachler sind rein mesopelagisch, Armflosser ueberwiegend bathypelagisch — Biolumineszenz und Druck-Toleranz stehen in den Kladen-Regeln schon, hier kommt der Rest der Tiefsee-Ausstattung aus der Umwelt statt aus einer Behauptung." },

  // -- Vollmarin: Kladen ohne einen einzigen Suesswasser-Vertreter.
  { qid: ["Q160", "Q168366", "Q144144", "Q30263", "Q25587", "Q26700", "Q2292156", "Q25431",
          "Q12198609", "Q21685", "Q219329", "Q25371", "Q194257", "Q796580"],
    biome: "Offenes Meer", level: 5,
    reason: "Meeressaeuger, Meeresvoegel, Meeresschildkroeten und Knorpelfische: Salzgehalt ist fuer sie kein gelegentlicher Stressor, sondern Dauerzustand — genau die Umwelt, in der die Physik Osmoregulation ueberhaupt belohnt." },
  { qid: ["Q44631", "Q25349", "Q83483", "Q127470", "Q33666", "Q128257", "Q25441", "Q28524",
          "Q195605", "Q147256", "Q272388", "Q181989", "Q18952", "Q220457", "Q29498",
          "Q189973", "Q107027", "Q25368"],
    biome: "Offenes Meer", level: 4,
    reason: "Wirbellose Meeresgruppen. Stachelhaeuter und Kopffuesser haben keinen einzigen Suesswasser-Vertreter (in clade-rules.mjs als hart begruendet vermerkt); Nesseltiere, Vielborster, Rankenfusskrebse, Krill, Ruderfusskrebse und Foraminiferen sind bis auf wenige Ausnahmen marin. Muscheln (Q25368) stehen mit hier, obwohl es Suesswassermuscheln gibt — das ist die eine bewusste Mehrheitsentscheidung dieser Tabelle und als solche vermerkt. Schnecken (Q4867740) stehen ausdruecklich NICHT hier: Land-, Suesswasser- und Meeresschnecken sind zu gleichmaessig verteilt, sie fallen auf die neutrale Welt zurueck." },
  { qid: ["Q1054206", "Q15715526", "Q134772"], biome: "Offenes Meer", level: 7,
    reason: "Halobakterien und Salinenkrebse leben in HYPERSALINEN Gewaessern — noch salziger als das offene Meer, aber unter den zwoelf kalibrierten Biomen ist es das einzige mit einem Salz-Stressor; die Uebertreibung waere schlimmer als die Untertreibung." },

  // -- Flaches, lichtdurchflutetes Meer: die marinen Photoautotrophen.
  { qid: ["Q21037", "Q9642991", "Q162678", "Q25577567", "Q93315", "Q18575364"],
    biome: "Sonniges Flachmeer", level: 4,
    reason: "Seegraeser, Kieselalgen und Cyanobakterien betreiben Photosynthese IM Wasser — sie brauchen Licht und Wasser gleichzeitig, was unter den kalibrierten Biomen nur das Flachmeer bietet." },

  // -- Suesswasser.
  { qid: ["Q188360", "Q853383", "Q43012", "Q7175204", "Q1128633", "Q161429", "Q148650",
          "Q174273", "Q25375"],
    biome: "Trüber See", level: 5,
    reason: "Kiemenfusskrebse, Egel, Wasserfarne, Wasserlinsen, Seerosen, Eintagsfliegen und Libellen (Larvalphase) sind Suesswasser-Organismen — Wasser ohne Salz-Stressor ist genau der Unterschied zum marinen Fall." },
  { qid: "Q127282", biome: "Trüber See", level: 4,
    reason: "Strahlenflosser sind die einzige grosse Wirbeltier-Klade, deren Arten sich etwa haelftig auf Suess- und Salzwasser verteilen. Der Suesswasser-Fall ist hier gewaehlt, weil die Kladen-Regel bereits einen mittleren Osmo-Wert als Klassenmittel setzt (Konfidenz 2, hier unantastbar) — die Umwelt darf ihn also gar nicht mehr verschieben und soll stattdessen den REST plausibel machen." },

  // -- Mikrobenwelt: nass, dunkel, nahrungsarm.
  { qid: ["Q10876", "Q10872", "Q473809", "Q106345", "Q499086", "Q25834462"],
    biome: "Urtümpel", level: 1,
    reason: "Bakterien, Archaeen und die heterotrophen Protisten-Gruppen: mikrobielles Leben im Wasserfilm, ohne Lichtabhaengigkeit und bei sehr geringer Nahrungsdichte — das Biom, gegen das der Prototyp „Bakterie“ selbst kalibriert ist." },

  // -- Feuchtes Land / Uferzone.
  { qid: ["Q10908", "Q53636", "Q53663", "Q25978", "Q21651", "Q1422487", "Q25347",
          "Q189808", "Q1272901", "Q191156"],
    biome: "Sonniger Sumpf", level: 4,
    reason: "Amphibien und Watvoegel leben definitionsgemaess am Wasserrand; Torf-, Laub- und Lebermoose brauchen fuer die Befruchtung freies Wasser und trocknen sonst aus. Die Physik fuehrt diese Zone als eigenen Kanal (amphibiousWaterCenter 0.65)." },

  // -- Wald: die Landpflanzen und was im Kronendach lebt.
  { qid: ["Q27133", "Q2997417", "Q25314", "Q14562931", "Q14832431", "Q133712", "Q132825",
          "Q373615", "Q178249", "Q80005", "Q1147601", "Q21881", "Q145977", "Q158487",
          "Q101680", "Q146037", "Q5605610", "Q157114", "Q10788836", "Q43238", "Q25400",
          "Q44448", "Q25308", "Q156192"],
    biome: "Dichter Wald", level: 3,
    reason: "Gefaesspflanzen konkurrieren um Licht in der Vertikalen — genau der Fall, in dem `structure` in dieser Physik ueberhaupt auf den Lichtzugang einzahlt (structureLightFloor). Ein Biom mit hohem Licht UND hoher Futterhoehe ist die einzige Umwelt, die das abbildet." },
  { qid: ["Q7380", "Q28425", "Q5113", "Q25341", "Q28319"], biome: "Reiche Kronen", level: 4,
    reason: "Primaten, Fledertiere, Voegel und Schmetterlinge nutzen den Luft-/Kronenraum: hohe, aber schwer erreichbare Nahrung ist genau die Nische, die Fluegel und lange Greifextremitaeten bezahlt macht (reachFromLimb, flightSizePenalty)." },

  // -- Zersetzer und Bodenleben: dunkel, nahrungsarm, feucht.
  { qid: ["Q764", "Q174698", "Q27720", "Q221448", "Q1343309", "Q174726", "Q508019",
          "Q132180", "Q843232", "Q133651", "Q1204312", "Q839350", "Q4758", "Q104825",
          "Q750383"],
    biome: "Moderwald", level: 3,
    reason: "Pilze, Regenwuermer, Schleichenlurche und Grabsaeuger leben im oder auf dem Zersetzungshorizont: kein Licht, wenig frei verfuegbare Nahrung, dauerfeucht. Das ist die Umwelt, in der Osmotrophie und Grabtrieb ueberhaupt tragen." },

  // -- Der breite Landfall. Level 2, also von JEDER spezifischeren Regel geschlagen.
  { qid: ["Q7377", "Q10811", "Q122422", "Q1390", "Q22708", "Q1358"],
    biome: "Land (neutral)", level: 2,
    reason: "Saeugetiere, Reptilien, Insekten und Spinnentiere sind als Gruppe landlebend, teilen aber KEIN gemeinsames Biom — Wueste, Tundra und Regenwald liegen alle darin. Deshalb hier ausdruecklich nur die Aussage „an Land“: die neutrale Startwelt mit `water` auf der Landband-Mitte der App. Ohne diese Regel fielen Landtiere auf BASE_ENV (water 0.6) zurueck und bekaemen einen kleinen, sachlich falschen Aquatik-Kanal geschenkt. Marine und grabende Untergruppen tragen eigene Regeln mit hoeherem Level und werden davon nicht beruehrt." },

  // -- Trocken und heiss.
  { qid: ["Q14560", "Q155938", "Q156219", "Q19125", "Q15962941", "Q159525"],
    biome: "Hitze-Dürre", level: 6,
    reason: "Kakteen, Dickblattgewaechse, Skorpione und Queller sind Trockenspezialisten (der Queller auf Salzboeden, die physiologisch ebenfalls trocken sind) — Austrocknung ist hier der bestimmende Stressor, und nur dieses Biom schaltet ihn ein." },
];

const HABITAT_BY_QID = new Map();
for (const r of HABITAT_RULES) {
  // Frueh und laut scheitern statt still eine undefinierte Umwelt weiterzureichen: ein
  // Tippfehler im Biom-Namen (die App schreibt "Trüber See" mit Umlaut) wuerde sonst
  // erst tief in der Fitness-Funktion als "cannot read properties of undefined" auffallen.
  if (!BIOMES.has(r.biome)) throw new Error(`impute: Habitat-Regel nennt unbekanntes Biom "${r.biome}".`);
  for (const q of Array.isArray(r.qid) ? r.qid : [r.qid]) {
    if (!HABITAT_BY_QID.has(q)) HABITAT_BY_QID.set(q, []);
    HABITAT_BY_QID.get(q).push(r);
  }
}

/**
 * Habitat einer Art schaetzen. Reihenfolge der Zustaendigkeit:
 *   1. expliziter Hinweis (Biom-Name oder fertige Umwelt) — z. B. aus Wikidata P2974,
 *      falls die Art einen Habitat-Eintrag hat (8 % der Saeuger, s. Plan 5a);
 *   2. spezifischste Habitat-Regel entlang der Kette;
 *   3. neutrale Startwelt der App.
 * @returns {{name:string, env:object, level:number|null}}
 */
export function habitatOf(lineage, habitatHint = null) {
  if (habitatHint && typeof habitatHint === "object")
    return { name: habitatHint.name || "Hinweis", env: { ...BASE_ENV, ...habitatHint.env || habitatHint }, level: null };
  if (typeof habitatHint === "string" && BIOMES.has(habitatHint))
    return { name: habitatHint, env: BIOMES.get(habitatHint), level: null };
  let best = null;
  for (const q of lineage || [])
    for (const r of HABITAT_BY_QID.get(q) || [])
      if (!best || r.level > best.level) best = r;
  if (!best) return { name: "Neutral", env: BIOMES.get("Neutral"), level: null };
  return { name: best.biome, env: BIOMES.get(best.biome), level: best.level };
}

/** Wie viele Generationen der Rueckwaertslauf rechnet. 400 wie `converge()` in
 *  tools/lib/app-core.mjs — dort als die Zahl belegt, ab der sich das Genom im
 *  rauschfreien Lauf nicht mehr sichtbar bewegt. */
export const CONVERGE_GENS = 400;

/**
 * Stufe (d): deterministischer Rueckwaertslauf in einer Umwelt.
 *
 * @param {object} env      vollstaendige Umwelt (16 Achsen)
 * @param {(number|null)[]} genome  belegte Gene = FEST, `null` = frei
 * @returns {number[]} vollstaendiges Genom; die festen Positionen bitgleich zur Eingabe
 *
 * Mechanik wie stepGeneration() in app/index.html, aber (i) mit der Engine-Fitness aus
 * dist/engine/fitness.js statt der Inline-Kopie, (ii) ohne Drift (rauschfrei -> zweimal
 * aufgerufen bitgleich) und (iii) nur auf den freien Genen. Punkt (iii) ist die harte
 * Regel in Code: ein festes Gen wird nicht einmal probeweise verschoben.
 */
export function backfillByHabitat(env, genome) {
  const eps = PHYS.eps;
  const free = [];
  const g = new Array(NG);
  for (let i = 0; i < NG; i++) {
    const v = genome[i];
    if (v === null || v === undefined) { g[i] = PARAMS.mutationAnchor[i] ?? RESTING[i]; free.push(i); }
    else g[i] = v;
  }
  if (!free.length) return g;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  for (let step = 0; step < CONVERGE_GENS; step++) {
    const next = g.slice();
    for (const i of free) {
      const up = g.slice(); up[i] = clamp01(up[i] + eps);
      const dn = g.slice(); dn[i] = clamp01(dn[i] - eps);
      const grad = (fitness(up, env, PHYS) - fitness(dn, env, PHYS)) / (2 * eps);
      const varFactor = 4 * next[i] * (1 - next[i]);
      const speedMod = PARAMS.varianceWeight * varFactor + (1 - PARAMS.varianceWeight);
      next[i] += PARAMS.responseRate[i] * PARAMS.selectionStrength * grad * speedMod;
      next[i] += PARAMS.mutationRate * ((PARAMS.mutationAnchor[i] ?? 0.5) - next[i]);
      next[i] = clamp01(next[i]);
    }
    for (const i of free) g[i] = next[i];
  }
  return g;
}

/** Ergebnis-Cache fuer den Rueckwaertslauf. Sehr viele Arten teilen Klade UND Habitat
 *  und liefern damit dieselbe Aufgabe; ohne Cache rechnet ein Katalog-Lauf dieselbe
 *  Konvergenz tausendfach. Schluessel ist die Umwelt plus das feste Genom auf vier
 *  Nachkommastellen — feiner als die spaetere uint8-Quantisierung (1/255), der Cache
 *  kann das Ergebnis also nicht sichtbar veraendern. */
const backfillCache = new Map();
function backfillCached(hab, genome) {
  const key = hab.name + "|" + genome.map((v) => (v === null || v === undefined ? "-" : v.toFixed(4))).join(",");
  let hit = backfillCache.get(key);
  if (!hit) { hit = backfillByHabitat(hab.env, genome); backfillCache.set(key, hit); }
  return hit;
}
export const backfillCacheStats = () => ({ size: backfillCache.size });

// ===========================================================================
// DIE HAUPTFUNKTION
// ===========================================================================

/**
 * Vollstaendige Platzierung einer Art im 25-D-Genraum.
 *
 * @param {Record<string,number>|null} traitValues
 *        Stufe (a): gemessene Gen-Werte, Gen-Name -> Wert (aus traitsToGenes()).
 *        Konfidenz 3.
 * @param {object|null} cladeResult
 *        Stufe (b): Rueckgabe von applyCladeRules(). Konfidenz 2.
 * @param {string|object|null} habitatHint
 *        Biom-Name, fertige Umwelt oder null (dann aus der Kette abgeleitet).
 * @param {object} [opts]
 * @param {string[]} [opts.lineage]  Elterntaxon-Kette (fuer (c) und (d) noetig)
 * @param {Map}      [opts.corpus]   Korpus aus buildCorpus() — fehlt er, entfaellt (c)
 * @param {number}   [opts.minSiblings]
 * @returns {{genome:number[], conf:number[], stages:{a:number,b:number,c:number,d:number},
 *            habitat:string, detail:object[]}}
 *          `genome` hat 25 Werte, KEINEN `null`; `conf` je Gen 0-3.
 */
export function placeSpecies(traitValues, cladeResult, habitatHint = null, opts = {}) {
  const lineage = opts.lineage || [];
  const genome = new Array(NG).fill(null);
  const conf = new Array(NG).fill(null);
  const detail = new Array(NG).fill(null);

  // EINZIGE SCHREIBSTELLE. Sie schreibt nur in `null`-Positionen — damit ist die harte
  // Regel („(c) und (d) ueberschreiben nie (a)/(b)“) strukturell erzwungen und nicht
  // von der Aufrufreihenfolge abhaengig.
  const fill = (i, value, confidence, why) => {
    if (genome[i] !== null) return false;
    genome[i] = value; conf[i] = confidence; detail[i] = why;
    return true;
  };

  // -- Stufe (a) ------------------------------------------------------------
  for (const [gene, value] of Object.entries(traitValues || {})) {
    const i = GENE_INDEX[gene];
    if (i === undefined || !Number.isFinite(value)) continue;
    fill(i, Math.max(0, Math.min(1, value)), 3, { stage: "a", gene });
  }

  // -- Stufe (b) ------------------------------------------------------------
  if (cladeResult && cladeResult.genome)
    for (let i = 0; i < NG; i++) {
      const v = cladeResult.genome[i];
      if (v !== null && v !== undefined) fill(i, v, 2, { stage: "b", qid: cladeResult.source?.[GENES[i]] || null });
    }

  // -- Stufe (c) ------------------------------------------------------------
  if (opts.corpus && lineage.length)
    for (let i = 0; i < NG; i++) {
      if (genome[i] !== null) continue;
      const hit = imputeGene(opts.corpus, lineage, i, opts.minSiblings ?? MIN_SIBLINGS);
      if (hit) fill(i, hit.value, 1, { stage: "c", qid: hit.qid, depth: hit.depth, n: hit.n });
    }

  // -- Stufe (d) ------------------------------------------------------------
  const hab = habitatOf(lineage, habitatHint);
  const open = [];
  for (let i = 0; i < NG; i++) if (genome[i] === null) open.push(i);
  if (open.length) {
    const converged = backfillCached(hab, genome);
    for (const i of open) fill(i, converged[i], 0, { stage: "d", biome: hab.name });
  }

  const stages = { a: 0, b: 0, c: 0, d: 0 };
  for (let i = 0; i < NG; i++) stages[["d", "c", "b", "a"][conf[i]]]++;
  return { genome, conf, stages, habitat: hab.name, detail };
}
