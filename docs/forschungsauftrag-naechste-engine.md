# Forschungsauftrag: die nächste Engine-Generation (Determinismus/Vielfalt)

**Stand:** 2026-07-29 · Status: **noch nicht gestartet** — dieser Auftrag ist zum
Kopieren in einen neutralen Chat gedacht (Recherche-Aufwand egal, darf über Nacht
laufen), das Ergebnis kommt danach zurück in dieses Repo zur Umsetzung.

## Warum dieser Auftrag existiert

Nutzer-Feedback (2026-07-29): die Engine wirkt zu deterministisch — Beispiel „Dunkelheit
führt bei Fellwesen immer zu einem Leuchtorgan", und Fisch/Insekten wurden im Spiel noch
nie beobachtet, obwohl das in der echten Natur die Hauptlebewesen sind.

**Befund der Code-Analyse (2026-07-29, gegen den damaligen Stand geprüft):**
- Die Namensvergabe (`classify()` in `app/index.html`) ist eine starre if/else-Kaskade,
  erster Treffer gewinnt. Der Biolumineszenz-Check steht vor dem Fell-Check — ein Wesen
  mit hoher Isolation **und** hoher Biolumineszenz (typisch für kalte, dunkle, nasse
  Biome, wo Isolation unter Wasser fast wirkungslos ist) wird deshalb **immer** als
  „Leuchtwesen · Tiefsee" klassifiziert, nie als Fellwesen — reine Kaskaden-Reihenfolge,
  kein gewolltes Verhalten. Dieser konkrete Fall steht noch offen.
- Fisch/Insekten sind nicht vergessen — es gibt bereits **AXIS-4 (Aquatik, v0.9.0)** und
  **AXIS-5 (Biolumineszenz, v0.16.0)**, die die Erreichbarkeit gezielt verbessert haben
  (Fisch 0 % → 3,8 %, Leuchtwesen von 43 % auf 14 % runterkalibriert). Die Werte sind
  aber weiterhin sehr niedrig — die zugrunde liegende Ursache bleibt strukturell: die
  Produktions-Engine läuft **ein einziges Mittelwert-Genom** per Gradientenaufstieg von
  einem festen Startpunkt zum nächsten lokalen Fitness-Optimum. Schmale Nebengipfel
  (seltene Nischen, echte Artenvielfalt) werden dadurch grundsätzlich selten erreicht,
  egal wie viel an einzelnen Achsen und Schwellen nachjustiert wird.
- Das ist kein Bug im engen Sinn, sondern eine Konsequenz der Architektur-Entscheidung
  „schlanke, deterministische Surrogat-Engine statt Populationsmodell" (bewusst so
  gebaut, s. `README.md`, Ziel-Band 80–90 % Übereinstimmung mit dem Referenz-Orakel).
  Bisherige Fixes (AXIS-4/5, `classify()`-Schwellenjustierungen) sind Politur an dieser
  Architektur, keine Lösung der Grundursache.

**Deshalb dieser Auftrag:** statt weiterer Einzelfixes an Schwellenwerten/Reihenfolge
soll grundsätzlich erforscht werden, ob es ein strukturell besseres Modell gibt — eines,
das natürliche Vielfalt (inkl. seltener Nischen) **systematisch**, nicht nur durch
Nachjustierung einzelner Zahlen, erzeugt.

## Was zu tun ist

**Dieser Auftrag soll noch ausgeführt werden.** Öffne einen neuen, neutralen Chat und
gib ihm den folgenden Forschungsauftrag komplett (der Abschnitt zwischen den
Trennlinien) — bewusst mit einer offenen Divergenz-Phase, damit nicht vorschnell nur am
Status quo herumgefeilt wird. Modellwahl siehe unten.

---

```
# Forschungsauftrag: Radikal neu denken — das bestmögliche Simulationsmodell
  für ein Evolutions-"Tamagotchi"

## Kontext (nur als Ausgangspunkt, nicht als Käfig)

Ich baue ein Spiel: Der Spieler steuert nie das Tier direkt, nur seine Umwelt
(Temperatur, Prädationsdruck, Nahrungsfülle, Nahrungshöhe, Licht, Wasser). Ein Genom
aus Merkmalen (Isolation, Größe, Gliedmaßenlänge, Stoffwechsel, Panzerung,
Photosynthese, Mobilität, Stützgewebe, ...) mutiert, wird selektiert, vererbt sich.

Die aktuelle Umsetzung: ein Referenz-Orakel (langsames, agentenbasiertes
Populationsmodell, Wright-Fisher-artig) + eine schlanke Produktions-Engine
(TypeScript, Browser-tauglich), die das Orakel durch EINEN Mittelwert-Genom-Vektor +
Gradientenaufstieg approximiert ("Model Distillation", ~80-90% Übereinstimmung).
Ergebnis: zu deterministisch, manche biologisch plausible Formen (Fisch, Insekten)
sind trotz gezielter Einzel-Fixes weiterhin nur mit wenigen Prozent Wahrscheinlichkeit
erreichbar, die Namensgebung hängt zusätzlich von einer starren if/else-Kaskade ab.

**Das ist NUR der Ist-Zustand, keine Vorgabe für die Lösung.** Ignoriere ihn bewusst
in Phase 1. Er dient nur dazu, dass du am Ende beurteilen kannst, was ein radikaler
Ansatz gegenüber dem Status quo gewinnt.

## Phase 1 — Divergenz: Denkverbote aufheben

Bevor irgendetwas auf Machbarkeit, Performance oder "passt zur bestehenden Engine"
geprüft wird: Generiere eine breite, bewusst unbequeme Bandbreite an radikal
unterschiedlichen Modell-Paradigmen für "wie aus Umwelt + Zeit glaubwürdige,
überraschende, vielfältige Lebensformen entstehen". Regeln für diese Phase:

- Keine Lösung darf vorschnell verworfen werden, weil sie "zu aufwändig",
  "nicht Browser-tauglich" oder "nicht deterministisch genug" wirkt — das kommt erst
  in Phase 2.
- Denke über Populationsgenetik hinaus. Ziehe explizit auch in Betracht:
  - Evo-Devo / Morphogenese: Körperform entsteht nicht aus einem Merkmalsvektor,
    sondern aus einem generativen Entwicklungsprozess (Gen-Regulationsnetzwerke,
    Reaktions-Diffusions-Systeme, L-Systeme, zellauläre Automaten), der bei leicht
    unterschiedlichen Startbedingungen ganz andere Formen erzeugt.
  - Artificial Chemistry / Open-Ended Evolution (Lenia, Geb, Chromaria-artige Systeme):
    Was macht Evolution in diesen Systemen tatsächlich "open-ended" statt konvergent?
  - Nischenkonstruktion & Ko-Evolution: Organismen verändern ihre Umwelt, wodurch neue
    Nischen selbst erst entstehen (statt dass die Umwelt fix vorgegeben ist).
  - Multi-Agenten-Ökosystem-Simulation: viele Arten/Linien konkurrieren/koexistieren
    gleichzeitig statt eine einzelne Linie zu optimieren — Vielfalt als
    Systemeigenschaft, nicht als Zufallsartefakt einer Linie.
  - Generative/kombinatorische Ansätze mit LLM- oder Grammatik-Unterstützung:
    Körperpläne als generierte, komponierbare "Bauteile" statt feste Kaskade.
  - Narrative-first-Ansätze: Was, wenn das Modell primär dafür optimiert wäre,
    dass jede Linie eine erzählbare, einzigartige Geschichte hat — und Fitness/Physik
    dem untergeordnet wird statt umgekehrt?
  - Hybride aus Kunst/Prozeduralgenerierung (No Man's Sky, Spore, Thrive, Species:
    ALRE, Biogenesis) — aber frag auch: was haben DIE falsch gemacht, was du besser
    lösen kannst, statt sie nur zu kopieren?
  - Auch offensichtlich "verrückte" Kandidaten sind erwünscht: z. B. Quanten-/
    Zufalls-inspirierte Superposition mehrerer möglicher Formen bis zur "Beobachtung"
    durch den Spieler; Evolution als Verhandlung zwischen konkurrierenden
    KI-Agenten; fraktale/rekursive Artbildung; Systeme, die bewusst gegen
    biologischen Realismus optimieren, wenn das mehr Spielspaß/Emergenz erzeugt.
- Formuliere für jeden Kandidaten explizit: Was ist die Kernidee in 2-3 Sätzen? Was
  würde dieses Modell einzigartig gut können, was kein anderes hier kann? Was ist der
  größte Bruch mit dem Status quo?

Ziel dieser Phase: mindestens 8-12 wirklich unterschiedliche Kandidaten, nicht
8-12 Varianten derselben Grundidee.

## Phase 2 — Konvergenz: an der Realität messen

Erst jetzt einführen: Browser-Echtzeitfähigkeit (reines JS/TS, Ziel deutlich unter
100ms pro Simulationsschritt, keine GPU/WASM-Pflicht), Erklärbarkeit für den Spieler
(er soll nachvollziehen können, warum seine Umwelt-Entscheidungen zu diesem Ergebnis
führten), echte Trade-off-Tiefe der Merkmale, und dass am Ende ALLE biologisch
plausiblen Grundformen (inkl. Fisch, Insekten, seltene Nischen) mit plausiblen,
nicht-uniformen, aber nicht verschwindenden Wahrscheinlichkeiten erreichbar sein müssen.

Bewerte jeden Phase-1-Kandidaten ehrlich gegen diese Kriterien — auch wenn das heißt,
dass die aufregendste Idee rausfällt. Sei aber offen für Hybride: oft gewinnt nicht der
"sicherste" Kandidat, sondern eine Kombination aus einer radikalen Kernidee (z. B.
Multi-Agenten-Ökosystem oder generative Morphogenese) mit einem pragmatischen
Performance-Trick (z. B. kleine Populationsgröße, approximierte Entwicklungsfunktion).

Prüfe explizit auch: Ist das bestehende Zwei-Motoren-Prinzip (schnelles Surrogat +
langsames Referenzmodell, per Distillation abgeglichen) überhaupt noch der richtige
Rahmen für deinen Gewinner-Kandidaten, oder verlangt er eine grundsätzlich andere
Systemarchitektur?

## Deliverable

1. Die vollständige Kandidatenliste aus Phase 1 (kurz, ungefiltert) — damit sichtbar
   bleibt, was verworfen wurde und warum, statt dass die Konvergenz wie
   selbstverständlich wirkt.
2. Klare Empfehlung: EIN Zielmodell (ggf. als Hybrid benannt), mit Begründung, warum
   es unter den Phase-2-Kriterien gewinnt UND warum es gegenüber dem Status quo
   tatsächlich einen Sprung darstellt, nicht nur eine Politur.
3. Algorithmus in Pseudocode: Ablauf einer Simulationsrunde (Initialisierung, Selektion/
   Entwicklung, Terminierung, Ergebnis-Extraktion).
4. Konkreter Ersatz für die starre Genom→Archetyp-Namenskaskade.
5. Performance-Abschätzung (erwartete Operationen/Schritt, geschätzte ms im Browser).
6. Migrationsplan: was von der bestehenden Fitness-Funktion/Physik-Parametern
   wiederverwendbar ist, was ersetzt werden muss, was ersatzlos wegfällt.
7. Eine explizite Sektion "Was wir uns getraut haben zu verwerfen" — die 2-3
   interessantesten Kandidaten, die es NICHT ins Zielmodell geschafft haben, mit
   ehrlicher Begründung warum.

Schreib alles so, dass ich es direkt einem Coding-Agenten übergeben kann, der damit
eine bestehende TypeScript-Engine umbaut — präzise genug zum Implementieren, aber
ohne dass du das echte Repo brauchst.
```

---

## Modellwahl für die Recherche ("so komplex wie nötig", nicht pauschal maximal)

Die beiden Phasen stellen unterschiedliche Anforderungen — die Modellwahl sollte das
widerspiegeln, statt überall das teuerste Modell zu nehmen:

- **Phase 1 (Divergenz/Ideation):** profitiert von Breite mehr als von Tiefe. Wenn das
  Recherche-Tool mehrere parallele Anfragen/Agenten erlaubt, reicht hier ein mittleres
  Modell (z. B. **Sonnet 5**, `claude-sonnet-5`) pro Einzel-Kandidat — Kreativität und
  Fachwissen zu z. B. Evo-Devo oder Artificial-Life-Systemen sind nicht in erster Linie
  eine Frage der Modellgröße, sondern der Recherche-Breite (viele unabhängige Anläufe
  statt ein einzelner sehr teurer).
- **Phase 2 (Konvergenz) + finale Spezifikation:** hier zählt tiefes, konsistentes
  Abwägen über viele konkurrierende Kriterien hinweg (Performance vs. Erklärbarkeit vs.
  biologische Erreichbarkeit vs. Implementierungsaufwand) und die Pseudocode-/
  Architektur-Ausarbeitung — das verträgt keine oberflächlichen Kompromisse. Dafür
  **Opus 5** (`claude-opus-5`) verwenden, mit möglichst hoher Denk-/Reasoning-Stufe
  (falls das Tool „extended thinking"/„effort" einstellbar macht: hoch bis maximal).
- Falls das Recherche-Tool nur ein einziges Modell für den ganzen Auftrag erlaubt:
  dann **Opus 5** durchgängig — die Kosten eines zu schwachen Modells (eine plausibel
  klingende, aber am Ende doch nur inkrementelle Empfehlung) wiegen hier schwerer als
  die Rechenkosten, weil das Ergebnis direkt in eine Engine-Neuentwicklung münden soll.
- **Nicht sinnvoll:** ein kleines/schnelles Modell (z. B. Haiku) für irgendeinen Teil
  dieses Auftrags — das Thema ist zu offen und zu abwägungsintensiv dafür.

## Rückführung ins Repo

Das Ergebnis des Recherche-Chats (Kandidatenliste + Empfehlung + Pseudocode + Migrations-
plan) soll danach hier im Repo landen — als Grundlage für eine Umsetzung, die die
akuten Einzelprobleme (Kaskaden-Reihenfolge Fell/Biolumineszenz, niedrige Fisch-/
Insekten-Quote) nicht nur nachjustiert, sondern strukturell auflöst. Bis dahin bleiben
`engine/fitness.ts`, `physics.json` und `classify()` unverändert (kein Vorgriff auf ein
Ergebnis, das noch nicht vorliegt).
