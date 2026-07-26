# Von der Sandkiste zum Spiel — Konzept für Nutzerbindung

**Auftrag (Nutzer, 2026-07-26):** „Ich habe das Gefühl, durch das einfache Regler-Ändern kommen
zwar immer wieder neue Wesen, aber es hat keine wirkliche Verbindlichkeit oder Suchtfaktoren.
Das sollte sich ändern und mehr zu einem wirklichen Spiel werden. Recherchiere mal, wie moderne
Games das besser machen."

Dieses Dokument ist **Recherche + Diagnose + Vorschlagsliste**, keine beschlossene Umsetzung.
Am Ende steht eine Empfehlung, welcher Baustein zuerst gebaut werden sollte.

---

## 1. Diagnose: Warum es sich unverbindlich anfühlt

Das Gefühl des Nutzers ist keine Geschmacksfrage — es hat eine strukturelle Ursache. In der
Motivationsforschung ist der Standardrahmen die **Selbstbestimmungstheorie** (Autonomie,
Kompetenz, Verbundenheit); sie ist der am besten belegte Erklärungsrahmen für Spielbindung.
Evolve steht auf diesen drei Beinen extrem ungleich:

| Bedürfnis | Stand in Evolve | Befund |
|---|---|---|
| **Autonomie** (freie Wahl) | maximal | Alles ist sofort, kostenlos und **umkehrbar** einstellbar. |
| **Kompetenz** (Meisterschaft) | fast null | Man kann in Evolve nicht *besser werden*. Es gibt nichts zu lösen, nichts zu scheitern, kein Können, das sich auszahlt. |
| **Verbundenheit** (andere) | null | Einzelspieler; außer dem Schnappschuss gibt es keinen sozialen Anschluss. |

**Der Kern des Problems ist nicht zu wenig Inhalt, sondern zu wenig Widerstand.**

Ein Regler, der jederzeit gratis und rückgängig zu bewegen ist, macht jede Handlung
**folgenlos**. Daraus folgt alles Weitere:

- Keine Entscheidung ist eine Entscheidung, weil man sie sofort zurücknehmen kann.
- Kein Zustand ist kostbar, weil man ihn jederzeit wieder erreichen kann.
- Kein Plan ist nötig, weil es nichts einzuteilen gibt.
- Keine Geschichte baut sich auf, weil nichts auf dem Spiel steht.

Das ist die klassische Grenze zwischen **Spielzeug** und **Spiel**: ein Spielzeug bietet freie
Interaktion, ein Spiel bietet zusätzlich Ziele, Beschränkungen und Konsequenzen. Evolve ist
derzeit ein sehr gutes Spielzeug.

Zweiter Befund, aus der Idle-Game-Praxis: erfolgreiche Idle-/Begleiter-Spiele arbeiten mit einer
Dreiteilung — **Hook** (erste 30 Minuten), **Habit** (Tag 1–7), **Hobby** (Wochen bis Monate).
Evolve hat einen guten Hook (die erste Verwandlung ist beeindruckend), einen schwachen Habit
(es gibt keinen Grund, morgen wiederzukommen, außer Neugier) und kein Hobby (nichts wächst
über Wochen).

---

## 2. Was moderne Spiele tun — und was davon hier zulässig ist

Die Produkt-Pfeiler des Projekts schließen einen großen Teil des üblichen Werkzeugkastens aus:
**kein Streak-Zwang, kein Verfall-Schuldgefühl, kein Sammelzwang, keine kaufbare Währung.**
Das ist eine Stärke, keine Fessel — es zwingt zu den Mechaniken, die auf *intrinsische*
Motivation zielen. Die Forschung stützt das ausdrücklich: äußere Belohnungen können den
Einstieg erleichtern, untergraben aber bei Überdosierung genau die Freude, die sie erzeugen
sollen.

### Ausdrücklich ausgeschlossen (Dark Patterns)

| Mechanik | Warum nicht |
|---|---|
| Tages-Streaks, Login-Boni | Bestraft Abwesenheit, erzeugt Pflichtgefühl statt Neugier. |
| Verfall/Vernachlässigung (Tamagotchi-Tod, während man weg ist) | Verwandelt Bindung in Schuld. Widerspricht dem Offline-Reveal-Versprechen. |
| Energie-/Wartezeit-Schranken | Sperrt Spaß ab, um Rückkehr zu erzwingen. |
| Lootboxen, Rarität als Währung | Der Pfeiler sagt: Rarität = Entdeckungstiefe, kein Grind. |
| Vollständigkeits-Balken („43/43") | Erzeugt Sammel-Druck statt Staunen. |

### Zulässig und wirksam

1. **Beschränkung erzeugt Bedeutung.** Nicht weniger Freiheit im *Spielen*, sondern Gewicht im
   *Eingreifen*. Wenn ein Eingriff etwas kostet oder Zeit braucht, wird er zur Entscheidung.
2. **Ziele mit Scheitern-Möglichkeit** (Kompetenz). Erst wenn man verlieren kann, kann man
   gewinnen — und erst dann zahlt sich Verstehen aus.
3. **Einsatz und Unumkehrbarkeit** (Verlustaversion, aber fair): Was verloren gehen kann, wird
   wertvoll. Permadeath-Systeme erzeugen nachweislich starke Bindung — **aber** nur, wenn der
   Verlust aus eigener Entscheidung folgt, nie aus Abwesenheit.
4. **Meta-Fortschritt über Läufe hinweg** (Hobby-Ebene): etwas, das bleibt, wenn ein Wesen geht.
5. **Verbundenheit**: derselbe Startzustand für alle, Vergleich der Ergebnisse.

---

## 3. Vorschläge, nach Wirkung sortiert

### V1 · Herausforderungen der Natur — „schaffst du das?" ⭐ Empfehlung

Ein optionaler Modus: eine Aufgabe mit **Beschränkung**, z. B.

> „Bring eine Linie ins Reich der Pilze — **ohne** das Licht je über 0,3 zu heben.
> Du hast 500 Generationen."

Warum das der beste erste Baustein ist:

- Es erzeugt **Kompetenz** — das fehlende Bein. Man kann scheitern, wieder ansetzen, besser
  werden; und was man dabei lernt (welcher Regler welche Achse auslest), ist genau das, was das
  Spiel ohnehin lehren will. Ziel und Lehrinhalt fallen zusammen.
- Es braucht **keine neue Simulation** — nur Zielprüfung + Beschränkungsprüfung auf dem, was
  schon läuft.
- Es ist **additiv**: die freie Sandkiste bleibt unangetastet. Wer nur zusehen will, merkt nichts.
- Es liefert nebenbei die fehlende **Habit-Ebene**: eine Herausforderung pro Tag/Woche, ohne
  Streak-Zwang (verpasste bleiben verfügbar).

Ausbaustufen: feste Startwelt (alle bekommen dieselbe) → Bestenliste nach *Generationenzahl*
statt nach Wiederholung → „Welt der Woche" mit Vergleich der Ergebnisse (Verbundenheit).

### V2 · Trägheit der Welt — Eingriffe brauchen Zeit

Statt sofortiger Regler-Wirkung: eine Änderung ist ein **Klimawandel**, der über N Generationen
einschwingt und währenddessen nicht erneut gestellt werden kann. Effekt: man muss *vorausdenken*
statt zu zappeln; jeder Eingriff bekommt Gewicht.

Das ist die **billigste Verbindlichkeit** überhaupt — keine neue Ressource, keine Strafe, nur
Trägheit. Risiko: kann sich bevormundend anfühlen; deshalb mit sichtbarem Fortschrittsbalken
(„Umstellung läuft, noch 40 Generationen") und im Sandkasten-Modus abschaltbar.

### V3 · Aussterben — aber nur unter deinen Augen

Eine Linie kann tatsächlich **aussterben**, wenn die Passung lange sehr niedrig bleibt. Damit
wird die Ahnenlinie zur echten Überlebensgeschichte und „Neu beginnen" zu einer Entscheidung.

**Ethische Leitplanke, nicht verhandelbar:** Aussterben passiert **nie offline**. Wer zurückkommt,
findet nie ein totes Wesen vor — das wäre das Verfall-Schuldgefühl, das der Pfeiler ausschließt.
Es passiert nur, während man zusieht, mit deutlicher Vorwarnung („Nebel kämpft — noch 30
Generationen").

### V4 · Wissen als Meta-Fortschritt

Was bleibt, wenn ein Wesen geht: nicht Macht, sondern **Verständnis**. Jede entdeckte Form
schaltet eine Erkenntnis frei (z. B. die reale Klade, den Kausalpfad, eine neue Umwelt-Achse
zum Spielen). Das ist die Hobby-Ebene ohne Sammelzwang — der Baum des Lebens wird zum
Fortschrittsbaum, ohne ein Fortschrittsbalken zu sein.

### V5 · Verbundenheit — dieselbe Welt für alle

Ein wöchentlicher fester Startzustand (Seed). Alle spielen dieselbe Welt; am Ende sieht man,
welche Formen andere hervorgebracht haben. Supabase steht bereits. Kein Wettbewerb um Punkte,
sondern um **Vielfalt** — „drei Spieler haben aus dieser Welt einen Pilz gemacht, du einen Fisch".

---

## 4. Empfehlung

**Zuerst V1 (Herausforderungen), danach V4 (Wissen als Meta-Fortschritt).**

Begründung: V1 schließt die größte Lücke (Kompetenz), ist additiv, gefährdet keinen Pfeiler und
braucht keine Engine-Änderung. V4 verwandelt den bereits gebauten Lebensbaum in die fehlende
Langzeit-Ebene. V2 und V3 sind stärkere Eingriffe in das Grundgefühl und sollten erst danach
entschieden werden — beide verändern, wie sich das Spielzeug anfühlt, und das ist eine
Produktentscheidung, keine technische.

**Was gemessen werden sollte** (sonst ist „mehr Bindung" nicht überprüfbar):
Wiederkehr am Tag 2 und 7 · Anzahl Sitzungen je Woche · wie viele Spieler eine Herausforderung
zu Ende spielen · wie viele nach einem Fehlschlag noch einmal ansetzen.

---

## Quellen

- Self-Determination Theory in Spielen (Autonomie/Kompetenz/Verbundenheit):
  <https://www.gamedeveloper.com/design/a-quick-breakdown-of-self-determination-theory> ·
  <https://digitalthrivingplaybook.org/big-idea/self-determination-theory-for-multiplayer-games/>
- Idle-/Incremental-Design, Hook–Habit–Hobby, Prestige-Schleifen:
  <https://machinations.io/articles/idle-games-and-how-to-design-them> ·
  <https://gridinc.co.za/blog/idle-games-best-practices>
- Bindung an Figuren, Einsatz und Permadeath:
  <https://medium.com/@jaygaracini/the-psychology-of-character-attachment-5481caaf5372> ·
  <https://grokipedia.com/page/Permadeath>
- Dark Patterns und ethische Alternativen:
  <https://dl.acm.org/doi/fullHtml/10.1145/3491101.3519837> ·
  <https://www.gamedesignknowledge.com/blog-post/the-ethics-of-dark-patterns-in-game-design>
