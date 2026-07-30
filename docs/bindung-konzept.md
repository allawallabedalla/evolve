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

**Status (2026-07-27): umgesetzt, v0.75.0.** 271 Herausforderungen (Paket P8, extern
zugeliefert und simulations-verifiziert — Details in `docs/influence-plan.md`) sind ins Spiel
verdrahtet: neuer Button „Herausforderungen ↗", durchsuchbare/filterbare Liste (Reich,
Schwierigkeit), Annehmen ohne jede Sperre. Wichtige Korrektur beim Verdrahten: eine
Herausforderung startet im Zustand **„warten"** — die Uhr läuft erst los, sobald die Umwelt
tatsächlich in der Beschränkung ist (sonst wäre „annehmen" oft eine Sofort-Pleite, weil die
aktuellen Regler die oft eng gefasste Beschränkung fast nie schon zufällig erfüllen). Ebenso
gefunden und behoben: das unbeeinflusste Start-Genom klassifiziert schon als „Protist ·
Euglenoid · Mixotroph" — ohne Mindest-Generationenzahl (`CHAL_MIN_GENS`) wäre jede
Protist-Herausforderung ein Sofort-Gewinn ganz ohne Zutun gewesen. Fortschritt (welche
Herausforderung geschafft ist) übersteht „Neues Leben" (eigener localStorage-Schlüssel).
Abbrechen/erneut versuchen jederzeit möglich, keine Strafe.

**Ausbaustufen (2026-07-30): umgesetzt.** Alle drei hängen an EINEM Mechanismus — der
**festen Startwelt**. Eine Sandkasten-Herausforderung ist grundsätzlich nicht vergleichbar
(jeder startet mit anderen Reglern, anderem Genom, anderem Seed), eine Generationenzahl daraus
sagt über Können nichts. Deshalb:

1. **Feste Startwelt.** Jede der 271 Herausforderungen hat eine aus ihren eigenen Daten
   abgeleitete Startwelt: je *beschränkter* Regler steht auf der **Mitte seines erlaubten
   Bereichs**, unbeschränkte Regler kommen deterministisch aus dem Weltschlüssel-Seed
   (Korridor 0,15–0,85), der Schwarm startet mit gestreuten Gründern aus demselben Seed.
   Drei Vorteile gegenüber einer handkuratierten Liste: die Startwelt erfüllt die
   Beschränkung per Konstruktion (die Uhr läuft ab Generation 0 statt erst nach Suchen im
   „warten"-Zustand), sie existiert für alle 271 ohne Pflegeaufwand, und sie ist aus den
   Daten nachrechenbar. Erreichbar über eine bewusst leise Zweitaktion auf jeder Karte
   („gleiche Startwelt für alle ↗"); „annehmen" bleibt unverändert der Sandkasten-Pfad.
   **Determinismus gemessen** (Chromium, je zwei unabhängige Ladevorgänge derselben Welt):
   400 Generationen von Hand gerechnet → max|Δ| über alle 25 Gene **= 0**; 300 Generationen
   mit der echten Zeitschleife (Frame-Timing, Zensus an der Wanduhr) → ebenfalls **0**,
   gleiche Form. Der Schwarm ist ein reiner mulberry32-Prozess; nichts im Simulationspfad
   liest die Uhr. Verbleibende Zeitabhängigkeit nur im **Ablesen** (Zensus-Takt entscheidet
   bei gespaltenem Schwarm einen Takt früher/später, welcher Cluster „dein Wesen" ist) —
   bewusst nicht wegprogrammiert, weil ein fester Zensus-Takt die Anzeige auf schwachen
   Geräten einfrieren ließe.
2. **Bestenliste nach Generationenzahl.** Neue Supabase-Tabelle `challenge_results` plus
   anonymisierende View `challenge_board` (`supabase/schema.sql`). Anti-Manipulation bewusst
   minimal — der Client ist autoritativ, es gibt keine Server-Simulation und das hier ist
   kein E-Sport-Titel: Schreiben nur angemeldet und nur die eigene Zeile (RLS), genau **ein**
   Eintrag je Spieler und Welt (Primärschlüssel, kein Fluten), `generations >= 5` spiegelt
   `CHAL_MIN_GENS`. Ausdrücklich *nicht* gebaut: signierte Läufe, Nachsimulation, Replay.
3. **„Welt der Woche".** Deterministisch aus der **ISO-Kalenderwoche in UTC** abgeleitet
   (`2026-W31` → Herausforderung + Startwelt), rein clientseitig — kein Server-Cron, nichts,
   das ausfallen kann; UTC, damit die Welt für alle zur selben Sekunde wechselt. Der
   Ergebnis-Vergleich zeigt **zuerst die Vielfalt** („6 Spieler haben aus derselben Startwelt
   4 verschiedene Formen hervorgebracht", Formhäufigkeit als Balken) und erst danach die
   Generationenzahl — ohne Namen, weil es um die Welt geht und nicht um Personen. Die letzten
   Wochen bleiben spielbar und stehen als ruhige Liste in der Karte: kein Nachhol-Druck, keine
   Frist, kein Verfall. Wohnort: oben im bestehenden Modal „Herausforderungen ↗" statt als
   neuer Knopf im Hauptbildschirm (der Komplexitäts-Audit hat die Hauptansicht entlastet).

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

**Status (2026-07-30): umgesetzt als dritte V1-Ausbaustufe** (Details oben unter V1) — V5 war
inhaltsgleich mit „Welt der Woche" und wird nicht zusätzlich gebaut.

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
