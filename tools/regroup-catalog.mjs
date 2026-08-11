// KLADE-SCHRANKE FUER app/catalog.js — ohne Netz, ohne neue Ernte.
//
// WOZU. `tools/build-catalog.mjs` vergibt die Bauplan-Gruppe einer realen Art per
// GENOM-ABSTAND zum naechsten Prototyp, abgesichert nur durch einen REICH-Waechter
// (`ROOT_KINGDOM`). „Flatterer · Vogel" und „Generalisten-Tier" sind aber beide das
// Reich „Tier" — deshalb steht der Mantelbussard (ein Greifvogel) in einer Gruppe, die
// als vierbeiniges Saeugetier GEZEICHNET wird. Gemessen: 8.146 von 24.846 Tierarten
// (32,8 %) haben eine andere Beinzahl als die Zeichnung ihrer Gruppe; die Gruppe
// `generalist` ist zu 96 % mit Voegeln gefuellt (205 Eulen, 155 Greifvoegel).
// Belege: docs/darstellungs-audit.md, `npm run plausi-check` P8/P9.
//
// WARUM EIN EIGENES WERKZEUG STATT EINES NEUBAUS. Ein Neubau braucht
// `tools/.harvest-state.json` (gitignored) und damit eine neue Wikidata-Ernte. Alles,
// was die Schranke braucht, steht dagegen schon in `app/catalog.js`: `lineage` (die
// fehlenden Ebenen rekonstruiert tools/lib/clade-closure.mjs), `genome`, `habWater`.
//
// WARUM SCHRANKE UND NICHT NEUZUORDNUNG ALLER ARTEN. Gemessen: laesst man die
// UNVERAENDERTE Zuordnungslogik ueber die veroeffentlichten Genome laufen, reproduziert
// sie nur 71,8 % der gespeicherten Gruppen. Der Rest ist kein Fehler, sondern das
// Gruender-Los: `build-catalog.mjs` streut die Genome im Nullraum, NACHDEM die Gruppe
// feststeht (Kommentar dort: "sonst waere der Los-Wert selbst an der Zuordnung
// beteiligt"). Aus dem veroeffentlichten Genom laesst sich die urspruengliche
// Entscheidung also gar nicht exakt nachvollziehen. Wer trotzdem alles neu zuordnete,
// bewegte 28 % der Arten aus einem Grund, der mit der Klade nichts zu tun hat.
//
// Deshalb: Arten, deren Klade zu ihrer Gruppe PASST, bleiben unangetastet. Nur die
// Verstoesse ziehen um — und zwar zum naechsten Prototyp, der fuer ihre Klade zugelassen
// ist. Minimale Aenderung, maximal nachvollziehbar.
//
// NEBENBEI (A4): jeder Eintrag bekommt ein Feld `klade` (QID + Kurzname). Damit ist der
// blinde Fleck aus P10 geschlossen — `lineage` ist auf 12 Ebenen gekuerzt, bei 42 % der
// Tierarten faellt die Klassen-QID heraus, und jede spaetere Pruefung musste sie bisher
// rekonstruieren. Die Herkunft steht ausdruecklich dabei: REKONSTRUIERT, nicht geerntet.
//
// Aufruf:  node tools/regroup-catalog.mjs            (nur Bericht, schreibt nichts)
//          node tools/regroup-catalog.mjs --write    (app/catalog.js neu schreiben)

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppCore, ROOT } from "./lib/app-core.mjs";
import { cladeResolver } from "./lib/clade-closure.mjs";
import { BIOMES } from "./lib/impute.mjs";

const WRITE = process.argv.includes("--write");
const core = loadAppCore("regroup-catalog");
const { selectionWeights, CATALOG, ARCH } = core;
const RESOLVER = cladeResolver(CATALOG);

// ---------------------------------------------------------------------------
// KLADE -> ZUGELASSENE BAUPLAN-GRUPPEN.
//
// Kuratiert wie `FICON` und die `requires`-Fenster — und wie diese an genau einer Stelle,
// damit sie pruefbar bleibt. Massstab ist NICHT die Systematik, sondern die ZEICHNUNG:
// zugelassen ist ein Bauplan, dessen Silhouette eine Art dieser Klade haben KANN.
// Deshalb steht „Robbe" bei den Saeugern und nicht bei den Fischen, obwohl beide
// Flossen zeigen — und deshalb duerfen Bedecktsamer nicht in die Moos-Gruppe.
const ERLAUBT = {
  // --- Tiere ---
  Q5113:   ["vogel", "laufvogel"],                                  // Voegel
  Q7377:   ["fellwarm", "fellgrosstier", "grossjaeger", "kletterer", "flink", "koloss",
            "fledermaus", "robbe", "bartenwal", "wuehler", "generalist", "beutetier"],  // Saeuger
  Q10811:  ["reptil", "beutetier", "chamaeleon", "wuehler"],        // Reptilien
  Q10908:  ["amphibie"],                                            // Amphibien
  Q127282: ["fisch", "leuchtwesen"],                                // Knochenfische
  Q129026: ["fisch"],                                               // Knorpelfische
  Q1390:   ["insekt", "fluginsekt", "feuerkaefer", "frostspanner"], // Insekten
  // Spinnentiere haben KEINEN eigenen Bauplan (offener Rest, s. docs/darstellungs-audit.md
  // Abschnitt 7). „Krebstier · Arthropode" ist die naechste ehrliche Naeherung — der Name
  // sagt Arthropode, die Zeichnung zeigt einen Panzer mit Gliedmassen. Bewusst KEIN
  // „insekt": dessen Zeichnung hat sechs Beine, eine Spinne hat acht.
  Q1358:   ["krebstier"],                                           // Spinnentiere
  Q25364:  ["krebstier", "krill", "salinenkrebs", "tiefseeamphipode"], // Krebse
  Q5194:   ["baertierchen"],                                        // Baertierchen
  Q25326:  ["schnecke", "kopffuesser", "muschel"],                  // Weichtiere
  Q25522:  ["wurm"],                                                // Ringelwuermer
  Q44631:  ["seestern"],                                            // Stachelhaeuter
  Q25441:  ["koralle", "leuchtwesen"],                              // Nesseltiere (Qualle = leuchtwesen)
  Q18960:  ["schwamm"],                                             // Schwaemme
  // --- Pflanzen ---
  Q25314:  ["laubbaum", "strauch", "bluetenkraut", "kraut", "sukkulente", "erle",
            "polsterpflanze", "krummholz"],                         // Bedecktsamer
  Q133712: ["nadelbaum", "mammutbaum", "krummholz", "strauch"],     // Nacktsamer
  Q373615: ["farn"],                                                // Farne
  Q25347:  ["moos"],                                                // Moose
  Q756:    ["gruenalge", "schneealge", "moos", "farn", "laubbaum", "strauch", "bluetenkraut",
            "kraut", "sukkulente", "erle", "polsterpflanze", "krummholz", "nadelbaum",
            "mammutbaum"],                                          // Pflanzen (Rueckfall)
  // --- Pilze ---
  Q174726: ["schimmel", "hefe", "flechte", "myzel", "hutpilz"],     // Schlauchpilze
  Q174698: ["hutpilz", "porling", "zunderschwamm", "myzel", "hallimasch", "schimmel"], // Staenderpilze
  Q764:    ["schimmel", "hefe", "flechte", "myzel", "hutpilz", "porling", "zunderschwamm",
            "hallimasch"],                                          // Pilze (Rueckfall)
  // --- Mikroben ---
  Q10876:  ["bakterie", "schwefelbakterie", "deinococcus"],         // Bakterien
  Q10872:  ["archaee", "methanogen"],                               // Archaeen
};
// Kladen ohne Eintrag hier (z. B. Protisten) haben keine Schranke — ihre Arten bleiben,
// wo sie sind. Lieber keine Regel als eine geratene.

// Selbsttest der Tabelle: jeder genannte Schluessel muss ein echter Bauplan sein.
{
  const bekannt = new Set(ARCH.forms.map((f) => f.key));
  const unbekannt = [...new Set(Object.values(ERLAUBT).flat())].filter((k) => !bekannt.has(k));
  if (unbekannt.length) {
    console.error(`regroup-catalog: unbekannte Bauplan-Schluessel in ERLAUBT: ${unbekannt.join(", ")}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Die Bau-Umwelt je Art zurueckgewinnen. `habWater` ist die quantisierte water-Achse der
// Umwelt, die habitatOf() beim Bau geliefert hat — und sie identifiziert das Biom
// eindeutig (gemessen: nur 153 ist doppelt belegt, „Trueber See" und „Neutral").
// Das ist genauer als habitatOf() neu auszufuehren: dafuer braeuchte es die VOLLE
// Elternkette, die im Katalog gar nicht mehr steht (P10).
const BIOM_NACH_WATER = new Map();
for (const [name, env] of BIOMES) {
  const k = Math.round(env.water * 255);
  if (!BIOM_NACH_WATER.has(k)) BIOM_NACH_WATER.set(k, { name, env });
}

const ARCH_NAMED_MAX = Math.max(1, ...ARCH.forms.map((f) => Object.keys(f.proto).length));
const envFits = (e, req) => {
  for (const ax in req) {
    const v = e[ax] == null ? 0 : e[ax];
    if (v < req[ax][0] || v > req[ax][1]) return false;
  }
  return true;
};
/** Dieselbe Distanzformel wie nearestInKingdom() in build-catalog.mjs — nur ueber einen
 *  anderen Kandidatenkreis. Bewusst nachgebaut statt importiert: build-catalog.mjs laesst
 *  sich ohne Ernte nicht laden. Die Formel wird unten gegen die Wirklichkeit geprueft
 *  (Reproduktionsrate), damit die Kopie nicht still auseinanderlaeuft. */
function naechsterPrototyp(t, env, w, pool) {
  let best = null, dBest = Infinity;
  for (const f of pool) {
    const idx = Object.keys(f.proto).map((k) => ARCH.genes.indexOf(k)).filter((i) => i >= 0);
    let s = 0, z = 0;
    for (const i of idx) { const d = (t[i] - f.proto[ARCH.genes[i]]) * w[i]; s += d * d; z += w[i] * w[i]; }
    let dist = Math.sqrt(s / Math.max(z, 1e-9)) * (1 - ARCH.specificityBonus * idx.length / ARCH_NAMED_MAX);
    if (f.requires && !envFits(env, f.requires)) dist *= ARCH.requiresPenalty;
    if (dist < dBest) { dBest = dist; best = f; }
  }
  return best;
}

const FORM = {};
for (const f of ARCH.forms) FORM[f.key] = f;

// ---------------------------------------------------------------------------
// 1 · REPRODUKTIONS-TEST — laeuft die nachgebaute Formel noch wie das Original?
//
// Ohne diesen Test waere jede Umgruppierung blind: eine abgedriftete Kopie der
// Distanzformel wuerde Arten aus einem Grund verschieben, der nichts mit der Klade zu
// tun hat. Erwartet wird KEINE 100 % (s. Kopfkommentar, Gruender-Los), aber ein Wert,
// der sich nicht ploetzlich aendert.
const REPRO_MIN = 0.65;
{
  const N = 4000;
  let treffer = 0, n = 0;
  for (let i = 0; i < N; i++) {
    const e = CATALOG.entries[Math.floor((i * CATALOG.entries.length) / N)];
    const b = BIOM_NACH_WATER.get(e.habWater);
    if (!b) continue;
    const t = e.genome.map((v) => v / 255);
    const w = selectionWeights(t, b.env);
    const reich = FORM[e.group]?.k;
    const best = naechsterPrototyp(t, b.env, w, ARCH.forms.filter((f) => f.k === reich));
    n++;
    if (best.key === e.group) treffer++;
  }
  const rate = treffer / n;
  console.log(`Reproduktions-Test: ${treffer}/${n} (${(100 * rate).toFixed(1)} %) der bestehenden Zuordnungen`);
  console.log(`  Rest = Gruender-Los (nach der Zuordnung aufgebracht, s. Kopfkommentar) — erwartet.`);
  if (rate < REPRO_MIN) {
    console.error(`  ✗ unter ${(100 * REPRO_MIN).toFixed(0)} %: die Distanzformel hier weicht vom Original ab. Abbruch.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 2 · SCHRANKE ANWENDEN
const vorher = {};
for (const e of CATALOG.entries) vorher[e.group] = (vorher[e.group] || 0) + 1;

let geprueft = 0, verstoss = 0, ohneKlade = 0, ohneBiom = 0;
const umzug = {};
const neueKlade = new Map();
for (const e of CATALOG.entries) {
  const k = RESOLVER.klasseVon(e);
  if (k) neueKlade.set(e, k);
  const erlaubt = k ? ERLAUBT[k.qid] : null;
  if (!erlaubt) { ohneKlade++; continue; }
  geprueft++;
  if (erlaubt.includes(e.group)) continue;         // passt — bleibt unangetastet
  const b = BIOM_NACH_WATER.get(e.habWater);
  if (!b) { ohneBiom++; continue; }
  const t = e.genome.map((v) => v / 255);
  const w = selectionWeights(t, b.env);
  const pool = erlaubt.map((key) => FORM[key]).filter(Boolean);
  const best = naechsterPrototyp(t, b.env, w, pool);
  if (!best) continue;
  verstoss++;
  const schluessel = `${e.group} -> ${best.key}`;
  umzug[schluessel] = (umzug[schluessel] || 0) + 1;
  e.group = best.key;
}

const nachher = {};
for (const e of CATALOG.entries) nachher[e.group] = (nachher[e.group] || 0) + 1;

console.log(`\nKlade-Schranke: ${geprueft} Arten mit Kladen-Regel · ${verstoss} Verstoesse umgezogen`);
console.log(`  ohne Kladen-Regel (bleiben unberuehrt): ${ohneKlade} · ohne Biom: ${ohneBiom}`);
console.log("\ngroesste Umzuege:");
for (const [k, v] of Object.entries(umzug).sort((a, b) => b[1] - a[1]).slice(0, 12))
  console.log(`  ${String(v).padStart(5)}  ${k}`);

console.log("\nGruppengroessen vorher -> nachher (nur Aenderungen):");
const alleKeys = [...new Set([...Object.keys(vorher), ...Object.keys(nachher)])];
const zeilen = alleKeys
  .map((g) => ({ g, v: vorher[g] || 0, n: nachher[g] || 0 }))
  .filter((x) => x.v !== x.n)
  .sort((a, b) => (b.n - b.v) - (a.n - a.v));
for (const z of zeilen)
  console.log(`  ${(FORM[z.g]?.n || z.g).padEnd(36)} ${String(z.v).padStart(5)} -> ${String(z.n).padStart(5)}  (${z.n - z.v >= 0 ? "+" : ""}${z.n - z.v})`);

const leer = ARCH.forms.filter((f) => !nachher[f.key]);
const duenn = ARCH.forms.filter((f) => nachher[f.key] && nachher[f.key] < 25);
const leerVorher = ARCH.forms.filter((f) => !vorher[f.key]).length;
console.log(`\nBauplaene ohne jede Art: ${leerVorher} -> ${leer.length}`);
if (leer.length > leerVorher)
  console.log(`  neu leer: ${leer.filter((f) => vorher[f.key]).map((f) => f.n).join(" · ")}`);
console.log(`Bauplaene unter 25 Arten (P5b): ${duenn.length}`);
if (duenn.length) console.log(`  ${duenn.map((f) => `${f.n} ${nachher[f.key]}`).join(" · ")}`);

// Abbruchkriterium aus docs/darstellung-massnahmenplan.md A1: reisst P5b bei mehr als
// 8 Gruppen, ist die Bauplan-Aufteilung selbst das Problem und nicht die Schranke.
const P5B_MAX = 8;
if (duenn.length > P5B_MAX)
  console.log(`\n⚠ mehr als ${P5B_MAX} Gruppen unter der P5b-Schwelle — s. Massnahmenplan A1, Abbruchkriterium.`);

// ---------------------------------------------------------------------------
// 3 · SCHREIBEN
if (!WRITE) {
  console.log("\n(Trockenlauf — mit --write wird app/catalog.js neu geschrieben.)");
  process.exit(0);
}

// `klade` je Eintrag (A4). Nur QID + Kurzname; die Herkunft steht im Dateikopf.
let mitKlade = 0;
for (const e of CATALOG.entries) {
  const k = neueKlade.get(e);
  if (!k) continue;
  e.klade = k.qid;
  mitKlade++;
}

// Feldreihenfolge stabil halten, damit der Diff lesbar bleibt.
const REIHENFOLGE = ["qid", "de", "sci", "wiki", "group", "klade", "rank", "lineage",
  "genome", "conf", "habWater", "src"];
const sortiert = CATALOG.entries.map((e) => {
  const out = {};
  for (const f of REIHENFOLGE) if (e[f] !== undefined) out[f] = e[f];
  for (const f of Object.keys(e)) if (out[f] === undefined) out[f] = e[f];
  return out;
});
sortiert.sort((a, b) => a.group.localeCompare(b.group) || (a.de || "").localeCompare(b.de || ""));
const byGroup = {};
for (let i = 0; i < sortiert.length; i++) (byGroup[sortiert[i].group] ||= []).push(i);

const alt = readFileSync(join(ROOT, "app", "catalog.js"), "utf-8");
const kopfEnde = alt.indexOf("window.CATALOG = {");
const kopf = alt.slice(0, kopfEnde);
const zusatz = `//
// NACHBEARBEITET von tools/regroup-catalog.mjs (Klade-Schranke, s. dortiger
// Kopfkommentar und docs/darstellungs-audit.md):
//   · \`group\` wurde fuer ${verstoss} Arten korrigiert, deren Klade den gezeichneten
//     Bauplan ihrer bisherigen Gruppe ausschloss (Beispiel: Greifvoegel in
//     „Generalisten-Tier", das als vierbeiniges Saeugetier gezeichnet wird).
//     Arten, deren Klade zu ihrer Gruppe passte, sind UNVERAENDERT.
//   · \`klade\` = QID der naechsten Grossklade. REKONSTRUIERT aus den gespeicherten
//     Ketten (tools/lib/clade-closure.mjs), NICHT geerntet — \`lineage\` ist auf 12
//     Ebenen gekuerzt und traegt die Klassen-QID bei 42 % der Tierarten nicht mehr.
// Ein Neubau mit tools/build-catalog.mjs ueberschreibt beides und muss die Schranke
// selbst mitbringen (s. Massnahmenplan A1/A9).
`;

const out = kopf + zusatz + `window.CATALOG = {
  version: 1,
  stage: ${JSON.stringify(CATALOG.stage)},
  genes: ${JSON.stringify(CATALOG.genes)},
  // Index der Eintraege je Bauplan-Gruppe — Stufe 2 durchsucht nur diese Teilmenge.
  byGroup: ${JSON.stringify(byGroup)},
  entries: [
${sortiert.map((e) => "    " + JSON.stringify(e)).join(",\n")}
  ],
};
`;
writeFileSync(join(ROOT, "app", "catalog.js"), out);
console.log(`\napp/catalog.js geschrieben — ${sortiert.length} Eintraege, ${Object.keys(byGroup).length} Gruppen, ${mitKlade} mit \`klade\`.`);
console.log("Naechster Schritt: npm run plausi-check (P8/P9/P10) und npm run catalog-check.");
