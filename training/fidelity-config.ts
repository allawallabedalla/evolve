// Realitaetstreue-Loop (BACKLOG.md Punkt 9, Schritt 5) — zentrale Gewichte +
// Mindestschwellen fuer das Drei-Schichten-Aggregat aus
// docs/evolution-fidelity-loop.md, Teil II, Abschnitt "### Aggregat":
//
//   Fidelity = w_A*Score_A + w_B*Score_B + w_C*Score_C
//
// mit einer Mindestschwelle PRO Schicht — keine Schicht darf eine andere
// "erkaufen" (Goodhart-Schutz, s. docs Teil II + Teil IV §10). Das ist laut
// Backlog-Text ausdruecklich eine bewusste, aber vom Optimierer ENTKOPPELTE
// technische Entscheidung (keine Produktentscheidung) — Schritt 6 (der
// eigentliche Optimierungsloop) liest diese Konstanten nur, veraendert sie
// aber nie selbst. Genau wie mutationAnchor in engine/types.ts oder die
// Referenzformen in tools/distribution-check.mjs sind das per-Hand gesetzte,
// begruendete Werte an EINER Stelle, nicht ueber den Code verstreut.
//
// Score_A / Score_B sind reine Anteile (Anzahl bestandener Teilpruefungen /
// Gesamtzahl) und daher NUR auf einem diskreten Raster erreichbar
// (Score_A in {0, 1/8, ..., 8/8}, Score_B in {0, 1/4, ..., 4/4} — s.
// tools/phenomena-check.mjs bzw. tools/distribution-check.mjs). Score_C ist
// dagegen eine kontinuierliche Distillations-Guete (training/fit.ts,
// validityTest/100) und aktuell strukturell in Bewegung (s. Kommentar bei
// MIN_SCORE_C unten) — das begruendet, warum die drei Schwellen nach
// unterschiedlicher Logik gewaehlt sind, statt einer einzigen Formel.

/** Gewichte. Gleich gewichtet (1/3 je Schicht): es gibt aktuell keine
 *  belastbare Begruendung, eine der drei Ground-Truth-Quellen (Theorie-
 *  Phaenomene / reale Verteilungsformen / Orakel-Distillation) hoeher zu
 *  gewichten als die anderen — sie pruefen unabhaengige Arten von "falsch"
 *  (docs Teil II, Einleitung). Das ist der im Backlog-Text selbst genannte
 *  "sinnvolle Startpunkt, falls keine bessere Begruendung gefunden wird".
 *  Muss in Summe 1 ergeben. */
export const WEIGHT_A = 1 / 3;
export const WEIGHT_B = 1 / 3;
export const WEIGHT_C = 1 / 3;

/** Mindestschwelle Schicht A (Evolutionstheorie-Phaenomene, P1-P8).
 *  7/8 = 0.875: erlaubt genau EINEN Phaenomen-Ausfall, bevor das Gate rot
 *  wird. Bei aktuell 8/8 (Stand nach Schritt 2+4, s. BACKLOG.md) bedeutet
 *  das: die Schicht besteht knapp (kein Puffer fuer einen zweiten Ausfall),
 *  statt trivial JEDEN Wert durchzuwinken (0.0 waere ein Pruefstand, der nie
 *  rot werden kann — genau das "prueft nichts" aus dem Backlog-Text). Ein
 *  Schwellenwert exakt bei 1.0 waere andererseits so zerbrechlich, dass ein
 *  einzelner ohnehin erwarteter Rand-Fall (z. B. P6 Kontingenz, das ein
 *  Varianz-BAND prueft und daher stichprobenbedingt leicht schwanken kann)
 *  das Gate ohne echten Regressionsgrund rot faerben wuerde. */
export const MIN_SCORE_A = 7 / 8;

/** Mindestschwelle Schicht B (reale Verteilungsformen: Body-Size-Skew, SAD,
 *  SAR, Trophie-Naeherung). 3/4 = 0.75, aus demselben Grund wie MIN_SCORE_A:
 *  genau eine der vier Verteilungspruefungen darf ausfallen, bevor das Gate
 *  rot wird. Bei aktuell 4/4 besteht die Schicht damit knapp (kein
 *  Zwei-Fehler-Puffer), ist aber nicht so scharf kalibriert, dass eine
 *  einzelne, in tools/distribution-check.mjs bereits als "methodische
 *  Ehrlichkeit" dokumentierte Grenzfall-Metrik (z. B. B3 SAR-Exponent) das
 *  Gesamt-Gate faelschlich kippt. */
export const MIN_SCORE_B = 3 / 4;

/** Mindestschwelle Schicht C (Orakel-Distillation, training/fit.ts
 *  `validityTest`, hier auf 0..1 normiert = validityTest/100).
 *  0.80 uebernimmt bewusst die UNTERE Grenze des bereits an anderer Stelle
 *  abgestimmten Ziel-Bands (`TARGET_LOW = 80` in training/fit.ts) statt eine
 *  neue Zahl zu erfinden — dieselbe 80%-Schwelle, die schon den Prozentbalken
 *  der Trainings-Schleife definiert. Der aktuelle Stand nach Schritt 1
 *  (~71-72%, strukturelle Kapazitaetsgrenze der Mittelfeld-Engine, s.
 *  BACKLOG.md Punkt 9 Schritt 1) faellt damit ABSICHTLICH knapp durch das
 *  Gate — das ist der Beweis, dass diese Schwelle etwas prueft, statt beim
 *  ersten Lauf grün zu sein.
 *
 *  VORLAEUFIG / MUSS UEBERPRUEFT WERDEN: Score_C ist gerade strukturell in
 *  Bewegung. `docs/engine-forschungsergebnis.md` beschreibt eine laufende
 *  Architektur-Migration (Stufen 0-7, Stufe 0-2 bereits erledigt), die laut
 *  dortigem Abschnitt "Ist das Zwei-Motoren-Prinzip noch richtig?" das
 *  Distillations-Konzept (Mittelfeld-Engine gegen Orakel) selbst ersetzen
 *  koennte. Migrations-Stufe 6 definiert Score_C nach heutigem Kenntnisstand
 *  ohnehin neu (andere Messgrundlage als der heutige `validityTest`) — DANN
 *  muss dieser Wert erneut bewertet werden, nicht vorher automatisch vom
 *  Optimierer verschoben werden. Bis dahin ist 0.80 der beste verfuegbare,
 *  extern schon abgestimmte Anker. */
export const MIN_SCORE_C = 0.8;

/** Ergebnis einer Fidelity-Berechnung: die gewichtete Aggregat-Zahl, ob ALLE
 *  drei Pro-Schicht-Mindestschwellen erfuellt sind (nicht nur die gewichtete
 *  Summe — genau das ist der Goodhart-Schutz aus docs "### Aggregat"), und
 *  welche Schichten (falls welche) die Schwelle gerissen haben. */
export interface FidelityResult {
  fidelity: number;
  passesThresholds: boolean;
  failingLayers: string[];
}

/**
 * Wendet die Gewichte + Pro-Schicht-Mindestschwellen oben auf drei
 * Schicht-Scores an. `scoreA`/`scoreB`/`scoreC` werden jeweils in 0..1
 * erwartet (Anteil bzw. normierte Guete, s. Kommentare oben).
 *
 * WICHTIG: `passesThresholds` haengt NICHT an der gewichteten Summe
 * `fidelity` — eine hohe gewichtete Summe darf eine einzelne kaputte Schicht
 * nicht "erkaufen" (docs Teil II, "### Aggregat": "eine Schicht darf nicht
 * durch die anderen erkauft werden"). `fidelity` wird trotzdem immer
 * mitgeliefert, weil sie als TREND-Kennzahl fuer Schritt 6 (Optimierungsloop-
 * Report: "Trend ueber Iterationen") nuetzlich ist, auch wenn ein einzelner
 * Lauf am Pro-Schicht-Gate scheitert.
 */
export function computeFidelity(
  scoreA: number,
  scoreB: number,
  scoreC: number,
): FidelityResult {
  const fidelity = WEIGHT_A * scoreA + WEIGHT_B * scoreB + WEIGHT_C * scoreC;

  const failingLayers: string[] = [];
  if (scoreA < MIN_SCORE_A) failingLayers.push("A");
  if (scoreB < MIN_SCORE_B) failingLayers.push("B");
  if (scoreC < MIN_SCORE_C) failingLayers.push("C");

  return {
    fidelity,
    passesThresholds: failingLayers.length === 0,
    failingLayers,
  };
}
