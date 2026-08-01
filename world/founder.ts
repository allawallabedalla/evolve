// GRUENDER-LOS IM NULLRAUM DER SELEKTION (Artenkatalog-Plan Phase 4, Schritt 4.1).
//
// ---------------------------------------------------------------------------
// WARUM ES DAS BRAUCHT
// ---------------------------------------------------------------------------
// Zufall (Drift) gibt es im Populations-Kern laengst: endliche Population N,
// gausssche Mutation, Wright-Fisher-Stichprobenrauschen (s. world/phenomena.ts,
// Kommentar zu DRIFT_OFF_SIZE). In der Praxis erzeugt er aber kaum dauerhaft
// VERSCHIEDENE Linien, und zwar aus einem strukturellen Grund:
//
//   Reine Drift ist SELBSTKORRIGIEREND. Auf einer fixen Fitness-Landschaft
//   zieht die Selektion jede zufaellig abgewichene Linie zum selben Attraktor
//   zurueck (Fishers Fundamentalsatz zehrt die Varianz auf, die die Mutation
//   nachliefert). Ergebnis: Streuung UM denselben Punkt, keine verschiedenen
//   Arten.
//
// Es gibt aber Richtungen, in denen die Landschaft FLACH ist — Gene, auf die
// die Selektion in DIESER Umwelt nicht schaut (die 15 bedingten Stressor-Gene
// ohne ihren Stressor sind der Regelfall, s. docs/engine-forschungsergebnis.md
// Messung 1: ~64 % des rohen 25-D-Abstands sind Rauschen dieser Gene). Dort gibt
// es nichts, was zurueckzieht. Ein Zufall, der EINMAL beim Gruenden einer Linie
// gezogen wird und die ganze Gruender-Kohorte gemeinsam verschiebt, bleibt dort
// stehen — das ist der klassische Gruendereffekt (Mayr 1942).
//
// ---------------------------------------------------------------------------
// DIE ZWEI ENTSCHEIDUNGEN, DIE DIESES MODUL TRIFFT
// ---------------------------------------------------------------------------
// (1) WO ist der Nullraum? Nicht geraten, sondern gemessen — mit derselben
//     Groesse, die auch die Selektion treibt: |dFitness/dGen| am Genom selbst,
//     ueber `selectionWeights()` aus world/cluster.ts. KEINE zweite Kopie der
//     Ableitungslogik; dieses Modul ruft die vorhandene auf.
//
// (2) WIE WEIT darf gelost werden? Ein linear aus dem Gewicht abgeleiteter
//     Streuungsradius reicht NICHT: `selectionWeights` normiert auf das
//     staerkste Gen, also bekommt in einer Umwelt mit EINEM dominanten Gen
//     (z. B. Kaelte -> Daemmung) auch ein durchaus folgenreiches Gen ein kleines
//     Gewicht. Gemessen (physics.json, 25 Gene): mit einem rein gewichts-
//     basierten Radius verschoebe das Los in COLD_ENV den Stoffwechsel um
//     +-0.14 und kostete damit 4.4 % Fitness — das waere kein Nullraum mehr,
//     sondern eine verdeckte Selektions-Umgehung.
//     Deshalb ist der NEUTRALITAETS-WAECHTER hier nicht ein nachtraeglicher Test,
//     sondern die Konstruktion selbst: der gewichts-basierte Radius ist nur der
//     VORSCHLAG, und er wird per Bisektion so weit eingeschrumpft, bis die
//     gemessene relative Fitness-Aenderung an beiden Raendern unter
//     `budget` (0.5 %) liegt. Dieselbe Idee wie `unusedBurden()` in
//     app/index.html: nicht behaupten, dass etwas folgenlos ist, sondern
//     nachrechnen, was es kostet.
//
// ---------------------------------------------------------------------------
// EINE GLEICHVERTEILUNG, KEINE GAUSSVERTEILUNG
// ---------------------------------------------------------------------------
// Das Los wird als U(-spread, +spread) gezogen, nicht gaussisch. Grund: der
// Waechter garantiert die Neutralitaet AM RAND +-spread. Bei einer Gaussschen
// Ziehung mit SD = spread laege rund ein Drittel der Ziehungen ausserhalb dieses
// geprueften Bereichs — die Zusage waere dann nur im Mittel wahr. Bei der
// Gleichverteilung deckt der geprueft neutrale Bereich den GANZEN Traeger ab.
//
// Verwendung: `founderSpreads()` liefert den Vektor, der als
// `PopulationConfig.founderLottery.spread` in world/population.ts geht. Dort
// wird EINMAL je Population (= je Gruendungs-Ereignis) gezogen, nie je
// Generation neu.
//
// Prueffstand: `npm run founder-check`.

import { fitness } from "../engine/fitness.js";
import { selectionWeights } from "./cluster.js";
import type { Environment, Physics } from "../engine/types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export interface FounderLotteryOptions {
  /** Groesster ueberhaupt zugelassener Los-Radius (fuer ein voellig flaches Gen). */
  strength?: number;
  /**
   * Schaerfe der Neutralitaets-Kurve. `nu = ((1-w)/(1-floor))^power` — mit
   * power>1 bekommen nur wirklich flache Gene nennenswerten Radius. Der
   * Waechter korrigiert ohnehin nach unten; der Exponent spart ihm nur Arbeit
   * (und damit fitness()-Aufrufe) und haelt den Vorschlag von vornherein nah
   * an der Wahrheit.
   */
  power?: number;
  /**
   * Neutralitaets-Budget: hoechstens so viel relative Fitness darf die
   * Verschiebung um den vollen Radius kosten. 0.005 = 0.5 % (Vorgabe aus
   * docs/artenkatalog-plan.md Phase 4).
   */
  budget?: number;
  /**
   * Untergrenze der Gewichts-Skala von `selectionWeights()`. world/cluster.ts
   * normiert auf 0.15..1 — steht hier als Parameter, damit ein Aufrufer mit
   * anderer Skala (app/index.html: ARCH.weightFloor = 0.30) denselben Code
   * benutzen kann, statt eine zweite Variante zu bauen.
   */
  floor?: number;
  /** Bisektions-Schritte des Waechters (2 fitness()-Aufrufe je Schritt). */
  steps?: number;
}

/** Begruendete Vorgaben — s. Kopf und `npm run founder-check`. */
export const FOUNDER_LOTTERY_DEFAULTS: Required<FounderLotteryOptions> = {
  strength: 0.5,
  power: 2,
  budget: 0.005,
  floor: 0.15,
  steps: 14,
};

/**
 * Zulaessiger Gruender-Los-Radius JE GEN, gemessen an der echten Landschaft.
 *
 * @param base  Genom, um das gegruendet wird (der Gruender-Mittelpunkt).
 * @param env   Umwelt, in der gegruendet wird — der Nullraum ist umweltabhaengig.
 * @returns     Vektor gleicher Laenge wie `base`; 0 bedeutet "kein Los".
 */
export function founderSpreads(
  base: number[],
  env: Environment,
  phys: Physics,
  opts: FounderLotteryOptions = {},
): number[] {
  const { strength, power, budget, floor, steps } = { ...FOUNDER_LOTTERY_DEFAULTS, ...opts };
  const G = base.length;
  const out = new Array<number>(G).fill(0);
  const f0 = fitness(base, env, phys);
  // Eine Linie ohne Lebensfaehigkeit hat keinen messbaren Nullraum — dann lieber
  // gar kein Los als eines auf einer Division durch ~0.
  if (!(f0 > 0)) return out;
  const w = selectionWeights(base, env, phys);

  /** Relative Fitness-Aenderung, wenn Gen g um +-s verschoben wird (schlechterer Rand). */
  const cost = (g: number, s: number): number => {
    const up = base.slice();
    up[g] = clamp01(base[g] + s);
    const dn = base.slice();
    dn[g] = clamp01(base[g] - s);
    return (
      Math.max(Math.abs(fitness(up, env, phys) - f0), Math.abs(fitness(dn, env, phys) - f0)) / f0
    );
  };

  for (let g = 0; g < G; g++) {
    const nu = Math.pow(clamp01((1 - w[g]) / (1 - floor)), power);
    let hi = strength * nu;
    if (!(hi > 0)) continue;
    if (cost(g, hi) <= budget) {
      out[g] = hi; // Vorschlag ist schon neutral genug
      continue;
    }
    // Waechter: den groessten Radius suchen, der das Budget noch haelt.
    // Bisektion statt Formel, weil die Landschaft gekruemmt ist (die lokale
    // Ableitung sagt ueber eine Verschiebung von 0.4 nichts Verlaessliches).
    let lo = 0;
    for (let it = 0; it < steps; it++) {
      const mid = (lo + hi) / 2;
      if (cost(g, mid) <= budget) lo = mid;
      else hi = mid;
    }
    out[g] = lo;
  }
  return out;
}
