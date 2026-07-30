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
// dagegen eine kontinuierliche Verteilungs-Naehe (Jensen-Shannon-Divergenz,
// s. scoreCFromJsd() unten) — das begruendet, warum die drei Schwellen nach
// unterschiedlicher Logik gewaehlt sind, statt einer einzigen Formel.
//
// SCHICHT C HAT SEIT MIGRATIONS-STUFE 6 (Punkt 2) EINE ANDERE MESSGRUNDLAGE.
// Vorher: Distillations-Guete `validityTest/100` aus training/fit.ts (Pro-Gen-MAE
// zwischen der Mittelfeld-Engine und einer gemittelten Orakel-Trajektorie).
// Seit Stufe 4 laeuft die Live-App auf einem echten Populations-Schwarm; das Ziel
// ist damit eine multimodale VERTEILUNG und das alte Surrogat ein MITTELWERT-Punkt.
// Eine multimodale Verteilung laesst sich nicht in ihren Mittelwert destillieren —
// `validityTest` misst seitdem nichts, was fuer das produktive System aussagt
// (docs/engine-forschungsergebnis.md, "Ist das Zwei-Motoren-Prinzip noch richtig?").
// Nachfolger ist ein KONVERGENZ-IN-N-Test: erzeugt der Browser-Schwarm (N=200)
// dasselbe Arten-Frequenzspektrum wie ein Orakel-Schwarm mit sehr grossem N
// (N=2000, unabhaengige zweite Implementierung in Python)? Gemessen von
// tools/spectrum-check.mjs, Mathematik in tools/lib/spectrum.mjs.

/** Gewichte. Gleich gewichtet (1/3 je Schicht): es gibt aktuell keine
 *  belastbare Begruendung, eine der drei Ground-Truth-Quellen (Theorie-
 *  Phaenomene / reale Verteilungsformen / Orakel-Pruefstand) hoeher zu
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

/** Zielschwelle der Verteilungs-Konvergenz: Jensen-Shannon-Divergenz (Basis 2)
 *  zwischen dem Formhaeufigkeits-Spektrum des Browser-Schwarms (N=200) und dem
 *  des Orakel-Schwarms (grosses N). Direkt uebernommen aus dem Abnahmekriterium
 *  der Migrationsplan-Tabelle (docs/engine-forschungsergebnis.md Abschnitt 6.4,
 *  Stufe 6): "JS-Divergenz Browser-N=200 <-> Orakel-N=2000 < 0.15". Steht HIER,
 *  damit die Zahl genau einmal im Repo existiert (tools/spectrum-check.mjs liest
 *  sie von hier). */
export const TARGET_JSD = 0.15;

/**
 * Score_C aus der gemessenen JS-Divergenz.
 *
 * Definition: Score_C = clamp01(1 - JSD).
 *
 * Warum diese Form und nicht `1 - JSD/TARGET_JSD` (die andere naheliegende
 * Normierung): letztere faellt bei JSD >= 0.15 auf 0 und bleibt dort. Schicht C
 * waere oberhalb der Schwelle FLACH — der Optimierungsloop (Punkt 9 Schritt 6)
 * bekaeme kein Signal, in welche Richtung eine kaputte Verteilung zu reparieren
 * ist, und die Trend-Kennzahl `fidelity` koennte einen sich weiter
 * verschlechternden Schwarm nicht mehr von einem knapp verfehlten unterscheiden.
 * `1 - JSD` ist auf dem ganzen Wertebereich streng monoton in der Metrik und
 * braucht kein Abschneiden: Basis-2-JSD liegt per Konstruktion in [0,1]
 * (0 = identische Verteilungen, 1 = disjunkte Traeger), ist also bereits ein
 * 0..1-Score in der richtigen Richtung. Genau deshalb rechnet
 * tools/lib/spectrum.mjs die Divergenz in Basis 2 und nicht in nats.
 *
 * WELCHE der gemessenen Divergenzen hier eingesetzt wird — gemessen entschieden:
 * tools/spectrum-check.mjs berichtet zwei Lesarten. (a) die JS-Divergenz der ueber
 * ALLE Testumwelten GEPOOLTEN Spektren und (b) die je Testumwelt einzeln
 * gerechnete, dann gemittelte Divergenz. (b) ist die strengere Lesart (Biom-weise
 * Abweichungen koennen sich im Pool teilweise aufheben) und entspricht dem
 * Wortlaut von docs/evolution-fidelity-loop.md ("MITTLERE Verteilungsdistanz ...
 * ueber ein Szenario-Portfolio"). Score_C nutzt trotzdem (a), aus einem
 * gemessenen Grund: der RAUSCHBODEN (JSD zwischen disjunkten Seed-Haelften
 * DERSELBEN Seite, also der Anteil, der reine Stichprobenstreuung ist) macht bei
 * (b) rund die HAELFTE des Messwerts aus — 0.0373 von 0.0800 —, bei (a) rund ein
 * Drittel und in absoluten Zahlen fuenfmal weniger: 0.0075 von 0.0218 (Orakel-Seite
 * jeweils 0.0039 bzw. 0.0004). (b) rechnet je Umwelt aus nur 5 Laeufen, sein Wert
 * haengt also merklich am Seed-Budget; (a) poolt 55 Laeufe je Seite. Eine
 * Gate-Konstante auf einer Zahl zu verankern, die sich mit der Stichprobengroesse
 * verschiebt, waere schlecht verankert. (b) und die schlechteste Einzelumwelt
 * werden deshalb weiter BERICHTET (und liegen ebenfalls unter der Zielschwelle:
 * 0.0800 bzw. 0.1486), aber nicht in die Schwellen-Entscheidung gehaengt.
 *
 * Nebenbei ist das jetzt NAEHER an der Spezifikation als der Vorgaenger: docs/
 * evolution-fidelity-loop.md, Teil II, Schicht C fordert wortwoertlich
 * "Score_C = 1 - mittlere Verteilungsdistanz Engine<->Orakel ueber ein
 * Szenario-Portfolio" und ausdruecklich "nicht Punkt-fuer-Punkt, sondern als
 * Verteilung". Der alte `validityTest` war genau das Gegenteil (Punkt-fuer-Punkt-
 * MAE auf einer Mittelwert-Trajektorie) und nur ein Notbehelf, solange es keine
 * Verteilung zu vergleichen gab. Statt der dort genannten Wasserstein/KS-Distanz
 * steht hier die Jensen-Shannon-Divergenz, weil das Formhaeufigkeits-Spektrum
 * KATEGORIAL ist (Formnamen ohne Ordnung) — Wasserstein und KS brauchen einen
 * geordneten Traeger und sind darauf nicht definiert; JS ist das kategoriale
 * Gegenstueck und ist die im Migrationsplan (Abschnitt 6.4) genannte Metrik.
 */
export function scoreCFromJsd(jsd: number): number {
  return jsd < 0 ? 1 : jsd > 1 ? 0 : 1 - jsd;
}

/** Mindestschwelle Schicht C (Orakel-PRUEFSTAND: Verteilungs-Konvergenz in N,
 *  gemessen von tools/spectrum-check.mjs, Score_C = scoreCFromJsd(JSD)).
 *
 *  0.85 ist KEINE neu erfundene Zahl, sondern `1 - TARGET_JSD`, also exakt das
 *  bereits abgestimmte Stufe-6-Abnahmekriterium in Score-Richtung ausgedrueckt.
 *  Dieselbe Logik wie beim Vorgaengerwert (der 0.80 aus `TARGET_LOW` in
 *  training/fit.ts uebernahm): eine anderswo begruendete Grenze uebersetzen,
 *  statt eine zweite zu erfinden.
 *
 *  ANDERS ALS VORHER BESTEHT SCHICHT C JETZT — und das ist kein Aufweichen der
 *  Schwelle, sondern das Ergebnis: gemessen JSD = 0.0218 ueber 11 Biom-Presets
 *  x 5 Laeufe (Browser N=200 gegen Orakel N=2000, je 250 Generationen, 11 000
 *  bzw. 110 000 klassifizierte Individuen), also Score_C = 0.978 — knapp das
 *  7-Fache der Schwellen-Reserve. Rauschboden 0.0075 (Browser) / 0.0004
 *  (Orakel), gerechnet zwischen disjunkten Seed-Haelften derselben Seite; die
 *  gemessene Divergenz ist also echt, aber winzig. Auch die strengeren Lesarten
 *  bestehen: je Umwelt gemittelt 0.0800, schlechteste Einzelumwelt 0.1486
 *  (Lichtlose Tiefsee), Cluster-Zentroid-Spektren 0.1451.
 *  Der alte Wert ~0.72 war die strukturelle Kapazitaetsgrenze eines Surrogats,
 *  das es nicht mehr gibt; die neue Frage ("ist N=200 gross genug?") hat eine
 *  andere, gemessene Antwort: ja.
 *
 *  Folge fuer den Loop (Punkt 9 Schritt 6): Schicht C ist damit vom
 *  Verbesserungs-Ziel zum REGRESSIONS-WAECHTER geworden. Sie kann weiterhin rot
 *  werden — jede Aenderung an `PopulationConfig` der App (app/index.html SWARM),
 *  an world/population.ts, an physics.json oder an app/archetypes.js verschiebt
 *  das Spektrum und kann die Divergenz treiben; ein zu klein gewaehltes N faellt
 *  hier auf. Dass eine Schicht beim ersten Lauf gruen ist, macht sie nur dann zu
 *  einem Pruefstand, der nichts prueft, wenn sie NICHT rot werden KANN —
 *  tools/fidelity-config-check.mjs belegt das Gegenteil mit einem
 *  Gegentest-Szenario statt mit einem absichtlich verfehlten Ist-Stand. */
export const MIN_SCORE_C = 1 - TARGET_JSD;

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
