// Leitet die Prototyp-Zahlen von app/archetypes.js MECHANISCH aus der alten
// classify()-Kaskade ab (Backlog Punkt 2, Migrations-Stufe 2). Kein Gate — ein
// Herleitungs-/Nachrechen-Werkzeug: wer wissen will, WOHER eine Zahl im Prototyp kommt,
// oder wer die Bibliothek nach einer Physik-Aenderung neu ableiten will, ruft dieses
// Skript auf und vergleicht.
//
// Aufruf:  node tools/research/archetype-derive.mjs
// Stellschrauben ueber Umgebungsvariablen: SD_MAX, MIN_REACH, BLEND, ENVS.
//
// ZWEI SCHRITTE:
//
//  (1) WELCHE Gene gehoeren in einen Prototyp?  Aus der GEOMETRIE des Kaskaden-Zweigs:
//      Monte-Carlo gleichverteilt ueber den Merkmalswuerfel, je Form die Streuung pro Gen.
//      Kleine Streuung (sd < SD_MAX) = der Zweig legt das Gen fest -> es gehoert hinein;
//      grosse Streuung = der Zweig sagt nichts dazu -> es bleibt weg (Teil-Spezifikation).
//      Das erfasst automatisch auch alles, was sich erst aus der NEGATION frueherer
//      Zweige ergibt — eine Bedingung, die man von Hand leicht uebersieht.
//      (Referenz: Gleichverteilung auf [0,1] hat sd = 0.289.)
//
//  (2) WELCHEN Wert bekommt es?  Eine Mischung (BLEND) aus
//        - der geometrischen Mitte des Schwellen-Fensters („die Schwellen sind schon die
//          Information, sie wandern nur von Grenzen zu Zentren") und
//        - dem Mittelwert ueber ERREICHBARE Genome derselben Form, also ueber das, was die
//          App-Engine unter ENVS zufaelligen Umwelten wirklich hervorbringt.
//      Ohne den zweiten Teil stuende im Prototyp die Mitte eines Intervalls, das die
//      Evolution nie besucht (eine echte Bakterie hat Stoffwechsel 0.02, nicht 0.30 = die
//      Mitte von [0, 0.6]); ohne den ersten waere die Benennung an die heutige Dynamik
//      gefesselt. Formen mit weniger als MIN_REACH erreichbaren Beispielen behalten die
//      reine Geometrie.
//
// Die Fitness/Selektion kommt aus der App-Inline-Kopie (tools/lib/app-core.mjs), damit
// die Ableitung genau die Dynamik sieht, die der Spieler auch sieht.
import { classify as casc } from "./classify.mjs";
import { loadAppCore, BASE_ENV } from "../lib/app-core.mjs";

const { stepGeneration, NG } = loadAppCore("archetype-derive");
const T = ["insulation","size","limbLength","metabolism","armor","photosynthesis","mobility","structure",
           "wing","biolum","detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense",
           "desicc","radres","fireres","frostres","windres","nfix"];
const SD_MAX    = +(process.env.SD_MAX    || 0.235);
const MIN_REACH = +(process.env.MIN_REACH || 120);
const BLEND     = +(process.env.BLEND     ?? 0.5);    // 0 = reine Geometrie, 1 = rein erreichbar
const ENVS      = +(process.env.ENVS      || 9000);
const MC        = 4000000;

// ---- (1) Geometrie der Kaskaden-Zweige -------------------------------------
const geo = {};
let s1 = 987654321;
const r1 = () => { s1 ^= s1 << 13; s1 ^= s1 >>> 17; s1 ^= s1 << 5; s1 >>>= 0; return s1 / 4294967296; };
const probe = new Array(25).fill(0.15);
for (let i = 0; i < MC; i++) {
  for (let k = 0; k < 10; k++) probe[k] = r1();          // nur die 10 Kern-Gene: die
  const n = casc(probe).n;                                // Kaskade sieht die anderen 15 nie
  let a = geo[n]; if (!a) a = geo[n] = { n: 0, s: new Array(10).fill(0), q: new Array(10).fill(0) };
  a.n++;
  for (let k = 0; k < 10; k++) { a.s[k] += probe[k]; a.q[k] += probe[k] * probe[k]; }
}

// ---- (2) Erreichbare Genome ------------------------------------------------
const reach = {};
let s2 = 20260729;
const r2 = () => { s2 = (s2 * 1664525 + 1013904223) >>> 0; return s2 / 4294967296; };
const gauss = () => { const u = Math.max(r2(), 1e-9), v = r2(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const STRESSORS = ["toxicity","salinity","uv","pressure","aridity","radiation","fire","frost","wind"];
for (let e = 0; e < ENVS; e++) {
  const env = { ...BASE_ENV, temperature:r2(), predation:r2(), foodAbundance:r2(),
                foodHeight:r2(), light:r2(), water:r2() };
  if (r2() < 0.35) env[STRESSORS[Math.floor(r2()*STRESSORS.length)]] = r2();   // Extremnischen
  if (r2() < 0.10) env.oxygen = r2();
  let g = new Array(NG).fill(0.5);
  const drift = r2() < 0.5 ? gauss : null;
  for (let i = 0; i < 400; i++) {
    g = stepGeneration(g, env, drift);
    if (i >= 150 && i % 30 === 0) {          // spaete Momentaufnahmen: nahe am Attraktor
      const n = casc(g).n;
      let a = reach[n]; if (!a) a = reach[n] = { n: 0, s: new Array(10).fill(0) };
      a.n++; for (let k = 0; k < 10; k++) a.s[k] += g[k];
    }
  }
}

// ---- Ausgabe ---------------------------------------------------------------
console.log(`Geometrie: ${(MC/1e6).toFixed(1)} Mio Genome, Aufnahme bei sd < ${SD_MAX}`);
console.log(`Erreichbar: ${ENVS} Umwelten, Mischung ${(BLEND*100).toFixed(0)} % erreichbar / ${((1-BLEND)*100).toFixed(0)} % Geometrie\n`);
for (const [name, a] of Object.entries(geo).sort((x, y) => y[1].n - x[1].n)) {
  const rc = reach[name], useReach = rc && rc.n >= MIN_REACH;
  const parts = [];
  for (let k = 0; k < 10; k++) {
    const m = a.s[k] / a.n, sd = Math.sqrt(Math.max(0, a.q[k]/a.n - m*m));
    if (sd >= SD_MAX) continue;
    const v = useReach ? (1-BLEND)*m + BLEND*(rc.s[k]/rc.n) : m;
    parts.push(`${T[k]}:${Math.min(0.99, Math.max(0.01, v)).toFixed(2).replace(/^0/, "")}`);
  }
  console.log(`${(name + "  ").padEnd(28)} ${String((a.n/MC*100).toFixed(3)).padStart(7)} % des Wuerfels  ` +
              `{ ${parts.join(", ")} }   [erreichbar: ${rc ? rc.n : 0}${useReach ? "" : " -> nur Geometrie"}]`);
}
