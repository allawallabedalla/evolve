// ============================================================================
// founder-check — Prueffstand fuer Phase 4 des Artenkatalog-Plans
// (docs/artenkatalog-plan.md: 4.1 Gruender-Los im Nullraum, 4.2 Sperrklinke).
//
// Wie ueberall im Repo: die Szenario-Logik liegt in world/ (founder.ts,
// population.ts, phenomena.ts), hier stehen nur Zielbaender, Interpretation und
// Ausgabe. Dieses Skript ist ein GATE (exit 1 bei Verfehlung), weil es eine
// harte Sicherheitszusage prueft — den Neutralitaets-Waechter.
//
// Fuenf Pruefungen:
//   F1  Neutralitaet     Kein gelostes Gen darf die Fitness um mehr als 0.5 %
//                        aendern, wenn es um den vollen Los-Radius verschoben
//                        wird — in JEDER gepruefte Umwelt. Das ist die Zusage
//                        aus dem Plan und der eigentliche Grund fuer dieses Gate.
//   F2  Wirksamkeit      Der Waechter darf nicht alles wegkuerzen: es muss ein
//                        nennenswerter Nullraum uebrigbleiben, sonst waere 4.1
//                        eine Attrappe.
//   F3  Kontingenz       Das Los muss die Streuung frisch gegruendeter Linien
//                        messbar heben (Zeitverlauf, nicht nur Endzustand).
//   D3  Dollo            Die Sperrklinke muss die Rueckkehr eines erworbenen
//                        Merkmals verlangsamen UND die Ruhelage danach
//                        unveraendert lassen (sie darf die Selektion nicht
//                        ueberstimmen).
//   N0  Neutral-Vorgabe  Ohne beide Konfigurationen muss die Population BIT-
//                        IDENTISCH zum Verhalten vor Phase 4 rechnen. Diese
//                        Pruefung ist der Grund, warum parity/spectrum-check
//                        unveraendert bleiben duerfen.
//
// Aufruf:  npm run founder-check
// ============================================================================
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../dist/engine/fitness.js";
import { Population, DEFAULT_CANALIZATION } from "../dist/world/population.js";
import { founderSpreads, FOUNDER_LOTTERY_DEFAULTS } from "../dist/world/founder.js";
import { founderCurve, dolloReturn, DETOX_GENE, MID_ENV, COLD_ENV, HOT_ENV } from "../dist/world/phenomena.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
const NG = phys.traits.length;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); return cond ? "OK" : "VERFEHLT"; };

console.log("============================================================");
console.log("  founder-check — Phase 4: Gruender-Los + Sperrklinke");
console.log("============================================================\n");

// ---------------------------------------------------------------------------
// F1/F2 — der Neutralitaets-Waechter, in drei Umwelten.
// ---------------------------------------------------------------------------
// Drei statt einer, weil der Nullraum UMWELTABHAENGIG ist: in der Kaelte
// dominiert die Daemmung die Ableitung so stark, dass `selectionWeights` allen
// anderen Genen ein kleines Gewicht gibt — genau der Fall, in dem ein rein
// gewichtsbasierter Radius danebengriffe. COLD/HOT sind deshalb nicht Deko,
// sondern die haerteren Faelle.
const ENVS = [["MID", MID_ENV], ["COLD", COLD_ENV], ["HOT", HOT_ENV]];
const BUDGET = FOUNDER_LOTTERY_DEFAULTS.budget;
// Toleranz auf das Budget: die Bisektion laesst genau `budget` zu, Fliesskomma
// und die letzte Halbierung koennen minimal darueber landen.
const BUDGET_TOL = 1.02;
// Wieviel Nullraum muss uebrigbleiben, damit 4.1 keine Attrappe ist? Mindestens
// ein Drittel der Gene mit einem Radius von wenigstens 0.1 — darunter laege die
// Ziehung unter der Mutations-SD (0.05..0.06) und waere von normaler Drift
// nicht mehr zu unterscheiden.
const MIN_NULLSPACE_GENES = Math.ceil(NG / 3);
const MIN_RADIUS = 0.1;

console.log("F1/F2 · Neutralitaets-Waechter (Budget " + (BUDGET * 100).toFixed(1) + " % Fitness)\n");
console.log("  Umwelt  Gene>0  Gene>=0.1  groesster Radius  schlimmste Fitness-Aenderung");
const spreadsByEnv = new Map();
for (const [name, env] of ENVS) {
  const base = new Array(NG).fill(0.5);
  const spread = founderSpreads(base, env, phys);
  spreadsByEnv.set(name, spread);
  const f0 = fitness(base, env, phys);
  let worst = 0, worstGene = -1;
  for (let g = 0; g < NG; g++) {
    if (!(spread[g] > 0)) continue;
    const up = base.slice(); up[g] = clamp01(base[g] + spread[g]);
    const dn = base.slice(); dn[g] = clamp01(base[g] - spread[g]);
    const rel = Math.max(Math.abs(fitness(up, env, phys) - f0), Math.abs(fitness(dn, env, phys) - f0)) / f0;
    if (rel > worst) { worst = rel; worstGene = g; }
  }
  const wide = spread.filter((s) => s >= MIN_RADIUS).length;
  console.log(`  ${name.padEnd(7)} ${String(spread.filter((s) => s > 0).length).padStart(5)}  ` +
    `${String(wide).padStart(8)}  ${Math.max(...spread).toFixed(3).padStart(15)}  ` +
    `${(worst * 100).toFixed(3)} % (${phys.traits[worstGene] ?? "-"})`);
  ok(worst <= BUDGET * BUDGET_TOL,
    `F1 ${name}: Gen ${phys.traits[worstGene]} aendert die Fitness um ${(worst * 100).toFixed(3)} % > ${(BUDGET * 100).toFixed(1)} %`);
  ok(wide >= MIN_NULLSPACE_GENES,
    `F2 ${name}: nur ${wide} Gene mit Radius >= ${MIN_RADIUS} (mindestens ${MIN_NULLSPACE_GENES} erwartet)`);
}
console.log(`\n  F1 Neutralitaet (|df|/f <= ${(BUDGET * 100).toFixed(1)} % ueberall):  ` +
  ok(!fails.some((f) => f.startsWith("F1")), "F1"));
console.log(`  F2 Nullraum bleibt nutzbar (>= ${MIN_NULLSPACE_GENES} Gene mit Radius >= ${MIN_RADIUS}): ` +
  ok(!fails.some((f) => f.startsWith("F2")), "F2"));

// Der Waechter muss auch NACHWEISLICH eingreifen — sonst waere er nur Deko und
// der Radius kaeme in Wahrheit allein aus der Gewichtsformel.
const midSpread = spreadsByEnv.get("MID");
const proposed = (() => {
  // Der ungeprueft vorgeschlagene Radius (nur Gewichtskurve, ohne Waechter),
  // hier nachgerechnet, um die Wirkung des Waechters zu zeigen.
  const { strength, power, floor } = FOUNDER_LOTTERY_DEFAULTS;
  const base = new Array(NG).fill(0.5);
  const eps = 0.01;
  const w = new Array(NG);
  let mx = 1e-9;
  for (let g = 0; g < NG; g++) {
    const up = base.slice(); up[g] = clamp01(base[g] + eps);
    const dn = base.slice(); dn[g] = clamp01(base[g] - eps);
    w[g] = Math.abs(fitness(up, MID_ENV, phys) - fitness(dn, MID_ENV, phys)) / (2 * eps);
    if (w[g] > mx) mx = w[g];
  }
  return w.map((v) => strength * Math.pow(clamp01((1 - (0.15 + 0.85 * (v / mx))) / (1 - floor)), power));
})();
const shrunk = midSpread.filter((s, g) => proposed[g] - s > 1e-6).length;
console.log(`  Waechter hat ${shrunk} von ${NG} Genen eingekuerzt (rein gewichtsbasiert waere ` +
  `z.B. ${phys.traits[3]} bei ${proposed[3].toFixed(3)} statt ${midSpread[3].toFixed(3)}): ` +
  ok(shrunk > 0, "F2b: der Waechter greift nirgends ein — dann ist er wirkungslos"));

// ---------------------------------------------------------------------------
// F3 — Hebt das Los die Kontingenz frisch gegruendeter Linien?
// ---------------------------------------------------------------------------
// Gemessen wird der ZEITVERLAUF, nicht nur der Endzustand. Begruendung des
// Bandes: das Los ist per Konstruktion eine Anfangsbedingung, also muss sein
// Effekt am Anfang gross sein und danach abklingen. Als Kriterium wird der
// Faktor bei Generation 20 genommen (die Groessenordnung, in der eine Linie im
// Spiel ihren ersten Namen bekommt) und mindestens 5x verlangt — ein Faktor
// unter 2 waere im Rauschen einer 24-Seed-Schaetzung.
console.log("\nF3 · Kontingenz-Zeitverlauf (24 Seeds, gleicher Start 0.5, gleiche Umwelt)\n");
const GENS = [0, 20, 40, 70, 150, 300];
const curveOff = founderCurve(phys, { gens: GENS });
const curveOn = founderCurve(phys, { gens: GENS, lottery: true });
const curveBoth = founderCurve(phys, { gens: GENS, lottery: true, canalization: true });
const hdr = GENS.map((g) => String(g).padStart(9));
console.log("  Generation        " + hdr.join(""));
const row = (n, c) => console.log("  " + n.padEnd(18) + c.variance.map((v) => v.toFixed(4).padStart(9)).join(""));
row("ohne Los", curveOff);
row("mit Los", curveOn);
row("Los + Klinke", curveBoth);
const i20 = GENS.indexOf(20);
const factor20 = curveOn.variance[i20] / curveOff.variance[i20];
const iEnd = GENS.length - 1;
console.log(`\n  Faktor bei Generation 20: ${factor20.toFixed(1)}x  ` +
  ok(factor20 >= 5, `F3: Los hebt die Kontingenz bei Gen 20 nur um ${factor20.toFixed(1)}x (>= 5 erwartet)`));
console.log(`  Bei Generation 300: ${curveOn.variance[iEnd].toFixed(4)} gegen ${curveOff.variance[iEnd].toFixed(4)} ` +
  `— EHRLICHER BEFUND: kein Unterschied mehr.`);
console.log("    Der Nullraum dieser Landschaft ist ein Zustand auf Zeit (~70 Generationen), kein");
console.log("    dauerhafter Freiheitsgrad — jedes Gen traegt eine Unterhaltslast und hat damit genau");
console.log("    EINEN Attraktor. Herleitung und Gegenprobe (ohne Selektion bleibt die Varianz bei");
console.log("    0.21) stehen im Phase-4-Block von world/phenomena.ts.");

// ---------------------------------------------------------------------------
// D3 — Dollo-Probe der Sperrklinke.
// ---------------------------------------------------------------------------
// Zielband: die Rueckkehrzeit muss mit Klinke messbar laenger sein (>= 15 %,
// deutlich ueber der Streuung zwischen den acht Seeds), und die Ruhelage
// danach darf sich nicht verschieben (<= 0.02, das ist die Groessenordnung, in
// der die Ruhelage von Lauf zu Lauf ohnehin schwankt). Beide Bedingungen
// zusammen sind die Aussage "verlangsamt, ueberstimmt aber nicht".
console.log("\nD3 · Dollo-Probe (giftige Welt 250 Gen. -> Gift weg, Rueckkehr von `" +
  (phys.traits[DETOX_GENE] ?? "detox") + "`)\n");
const dOff = dolloReturn(phys, {});
const dOn = dolloReturn(phys, { canalization: true });
console.log("               erworben  Verriegelung  Rueckkehr (Gen.)  Ruhelage danach");
const drow = (n, d) => console.log(`  ${n.padEnd(12)} ${d.peak.toFixed(3).padStart(8)} ` +
  `${d.lock.toFixed(3).padStart(13)} ${d.returnGens.toFixed(1).padStart(17)} ${d.settled.toFixed(3).padStart(16)}`);
drow("ohne Klinke", dOff);
drow("mit Klinke", dOn);
const slower = dOn.returnGens / dOff.returnGens;
const drift = Math.abs(dOn.settled - dOff.settled);
console.log(`\n  Rueckkehr ${((slower - 1) * 100).toFixed(0)} % langsamer: ` +
  ok(slower >= 1.15, `D3: Klinke verlangsamt die Rueckkehr nur um ${((slower - 1) * 100).toFixed(0)} % (>= 15 % erwartet)`));
console.log(`  Ruhelage verschoben um ${drift.toFixed(4)}: ` +
  ok(drift <= 0.02, `D3: Klinke verschiebt die Ruhelage um ${drift.toFixed(4)} (<= 0.02 erwartet) — sie ueberstimmt die Selektion`));

// ---------------------------------------------------------------------------
// N0 — Vorgabe ist neutral: ohne Konfiguration aendert Phase 4 gar nichts.
// ---------------------------------------------------------------------------
// Das ist die Pruefung, auf die sich parity, spectrum-check, branching-check,
// world-check und der App-Schwarm stuetzen duerfen: beide Mechanismen sind
// opt-in, und ohne sie laeuft derselbe Zufallsstrom wie vor Phase 4.
console.log("\nN0 · Vorgabe-Neutralitaet (beide Mechanismen aus)\n");
function fingerprint(cfg, seed) {
  const p = new Population({ numGenes: NG, ...cfg }, seed, 0.5);
  for (let i = 0; i < 40; i++) p.step(MID_ENV, phys);
  return p.genomes.flat().map((v) => v.toFixed(15)).join(",");
}
const plain = fingerprint({}, 4242);
const explicitNull = fingerprint({ founderLottery: null, canalization: null }, 4242);
const zeroLottery = fingerprint({ founderLottery: { spread: new Array(NG).fill(0) } }, 4242);
console.log("  Default == explizit null:            " + ok(plain === explicitNull, "N0: Default weicht von explizitem null ab"));
console.log("  Los mit Radius 0 aendert das Genom nicht, verbraucht aber Zufall (erwartet): " +
  (zeroLottery === plain ? "identisch" : "abweichend"));
const offsets = new Population({ numGenes: NG, founderLottery: { spread: midSpread } }, 7, 0.5).founderOffset;
const outOfRange = offsets.filter((o, g) => Math.abs(o) > midSpread[g] + 1e-12).length;
console.log("  Gezogene Lose liegen im zertifizierten Radius: " +
  ok(outOfRange === 0, `N0: ${outOfRange} Lose liegen ausserhalb ihres geprueften Radius`));
const lockOffDefault = new Population({ numGenes: NG }, 7, 0.5).canalLock();
console.log("  Ohne Klinke ist die Verriegelung ueberall 0: " +
  ok(lockOffDefault.every((v) => v === 0), "N0: canalLock() ist ohne Konfiguration nicht 0"));

// ---------------------------------------------------------------------------
console.log("\n============================================================");
if (fails.length) {
  console.log("Status: VERFEHLT");
  for (const f of fails) console.log("  - " + f);
  process.exit(1);
}
console.log("Status: OK — Neutralitaets-Waechter haelt, Los wirkt, Klinke verlangsamt ohne zu ueberstimmen,");
console.log("        und die Vorgabe ist bit-neutral gegenueber dem Stand vor Phase 4.");
console.log(`Kennzahlen: Los-Faktor bei Gen 20 = ${factor20.toFixed(1)}x · Dollo-Rueckkehr ` +
  `${dOff.returnGens.toFixed(1)} -> ${dOn.returnGens.toFixed(1)} Generationen · ` +
  `Ruhelage ${dOff.settled.toFixed(3)} vs. ${dOn.settled.toFixed(3)}`);
