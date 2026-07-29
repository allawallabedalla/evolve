# Mechanismus-Ablationsstudie (Backlog Punkt 9, Schritt 3)

Diagnose-/Dokumentationsausgabe von `tools/ablation-check.mjs` (kein Gate, kein
`process.exit(1)`). Testet alle vier Mechanismen aus `world/phenomena.ts`s
`Mechanisms`-Interface (Konkurrenz, Migration, Ko-Evolution, Drift) einzeln
(nie kombiniert) gegen alle sieben implementierten Schicht-A-Phänomene
(P1–P6, P8; P7 wartet auf Schritt 4) und zeigt, welches Phänomen-Ergebnis
kippt, wenn genau dieser eine Mechanismus ausgeschaltet wird.

Lauf: `npm run ablation-check` (baut zuerst, dann `node tools/ablation-check.mjs`).

## Matrix

| Mechanismus   | P1 Radiation | P2 Branching | P3 Allopatrie | P4 Konvergenz | P5 Red Queen | P6 Kontingenz | P8 Aussterben&Erholung |
|---------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Konkurrenz    | –   | **KIPPT** | – | n/a¹ | – | – | – |
| Migration     | **KIPPT** | – | **KIPPT**² | – | – | – | – |
| Ko-Evolution  | –   | – | – | – | **KIPPT** | – | – |
| Drift         | **KIPPT** | **KIPPT** | **KIPPT** | **KIPPT** | **KIPPT** | **KIPPT** | **KIPPT** |

`KIPPT` = Baseline im Zielband, Ausschalten des Mechanismus verfehlt es → kausal
gebunden. `–` = kein messbarer Effekt auf dieses Zielband. `n/a` = dedizierte
Ausnahme (s. Fußnote).

¹ P4/Konkurrenz: bereits in Schritt 2 empirisch geprüft und als wirkungslos
dokumentiert (0.183 vs. 0.201 End-Distanz über 250 Generationen — Konkurrenz auf
der Größen-Achse verschiebt den Konvergenzpunkt kaum). Die echte Ablation für P4
ist `ph.convergenceNoSelection` (Selektion direkt abgeschaltet), kein
Mechanismus-Schalter. Zelle bewusst als „n/a", nicht als „–", damit nicht
fälschlich suggeriert wird, Konkurrenz sei geprüft und wirkungslos — sie ist
für dieses Phänomen schlicht nicht die richtige Ablationsachse.

² P3/Migration: die Baseline für Allopatrie ist bereits `migration: false`
(zwei isolierte Orte — das IST der Normalfall dieses Szenarios, s.
`world/phenomena.ts`). „Umschalten" bedeutet hier folgerichtig Migration
**anschalten** (Genfluss 0.30 zwischen den Orten), nicht ausschalten — exakt
Schritt 2s eigener Ablationsfall für P3. Die Matrixzelle zeigt trotzdem
korrekt „KIPPT", weil Migration hier ursächlich ist, nur mit umgekehrtem
Vorzeichen als bei P1.

## Interpretation je Zeile

**Konkurrenz** trägt kausal nur P2 (Branching): ohne frequenzabhängige
Konkurrenz auf der Größen-Achse fällt die disruptive Aufspaltung in zwei
Cluster auf einen einzigen Modus zusammen (Ø 2,0 → Ø 1,0 Modi, SD 0,385 →
0,158). Bei allen anderen Phänomenen bleibt sie wirkungslos, weil
`popConfigFor()` den Konkurrenz-Schalter nur dann in die Populations-Konfiguration
übernimmt, wenn explizit eine `CompetitionConfig` übergeben wird — das tut im
Portfolio ausschließlich `branching()`.

**Migration** trägt P1 (Radiation) und P3 (Allopatrie) — mit entgegengesetztem
Vorzeichen. Ohne Migration bleiben neue Nischen in P1 unerreichbar (Kolonisations-
Verhältnis 3,5x → 1,0x); in P3 hält gerade die ABWESENHEIT von Migration die
Isolation aufrecht, und Zuschalten von Genfluss homogenisiert die Divergenz weg
(1,062 → 0,409). Beide Phänomene nutzen denselben Code-Pfad
(`World.connect`/`World.colonize`), nur mit gegensätzlicher Erwünschtheit. Auf
P2, P4, P5, P6, P8 hat Migration keinen Effekt — keines dieser Szenarien
verbindet oder kolonisiert je einen zweiten Ort.

**Ko-Evolution** trägt ausschließlich P5 (Rote Königin): ohne Räuberdruck über
`Ecosystem.step(false)` bricht die anhaltende Größenoszillation zusammen (SD
0,164 → 0,019) und der mittlere Räuberdruck fällt auf 0. Der Schalter wird
sonst nirgends im Portfolio gelesen (kein anderes Szenario instanziiert ein
`Ecosystem`), entsprechend „–" überall sonst.

**Drift** kippt alle sieben geprüften Phänomene — das ist kein Artefakt,
sondern zeigt eine echte, andere Rolle als die anderen drei Mechanismen: Drift
ist hier nicht „ein weiterer Baustein neben den anderen", sondern die
gemeinsame Rohstoff-Quelle (Mutation + Startstreuung + endliche
Stichprobenziehung), von der Selektion, Kolonisation UND Koevolution
überhaupt erst etwas zu formen haben. Die Ablation ist zudem strukturell die
größte Intervention im Portfolio (`popConfigFor`: `mutationSd=0`,
`startSpread=0`, Populationsgröße 300→2500) und wirkt sich deshalb notwendig
breiter aus als das gezielte Aus-/Einschalten eines einzelnen Schalters. Zwei
Fälle verdienen besondere Erwähnung: P4 (Konvergenz) verfehlt das Zielband in
die GEGENTEILIGE Richtung wie erwartet (Distanz steigt von 0,183 auf 2,000,
statt zu sinken) — ohne Mutation und mit `startSpread=0` verharren die fünf
Startpunkte praktisch bei ihren extrem unterschiedlichen Ausgangswerten
(0,1…0,9), weil es keine Variationsquelle gibt, auf die Selektion wirken
könnte; P6 (Kontingenz) kollabiert erwartungsgemäß auf Varianz 0 (keine
Zufallsquelle mehr, per Definition keine Kontingenz). Kurz: Drift zu entfernen
demonstriert nicht „Drift ist überall die Ursache" im engen Sinn, sondern
„Drift ist überall Voraussetzung" — ein Befund, der zur Bedeutung von
Wright-Fisher-Rauschen als evolutionärem Grundmechanismus passt (s.
`world/phenomena.ts`-Kommentar zu `popConfigFor`).

## Bekannte Grenzen dieser Studie

- Nur EIN Seed/Parametersatz je Phänomen (identisch zu Schritt 2) — keine
  Sensitivitätsanalyse über Stärke des jeweiligen Mechanismus, nur binäres
  An/Aus.
- P7 (Verteilungsgesetze) fehlt, weil das Phänomen selbst erst in Schritt 4
  gebaut wird.
- Die Matrix testet nur EINEN Mechanismus zur Zeit (wie von Schritt 3
  gefordert) — Interaktionseffekte zwischen zwei gleichzeitig ausgeschalteten
  Mechanismen sind nicht Teil dieser Studie.
