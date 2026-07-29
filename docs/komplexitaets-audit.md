# Komplexitäts-Audit — Hauptbildschirm-Informationsarchitektur

**Auftrag (Nutzer, 2026-07-29):** „mir erscheint das ganze Spiel extrem überladen und
unübersichtlich" — Ziel: Komplexität reduzieren.

Dieses Dokument ist **Bestandsaufnahme + abgestimmter Bauplan**, keine beschlossene
Umsetzung. Es ändert nichts an der Fitness-Physik oder den vorhandenen Achsen — die
Simulation selbst ist sauber validiert (~85 % Test-Validität, Parität ~1e-16, Reality-Check
20/20). Das Problem sitzt in der **Präsentation**: zu viele gleichrangige Bedienelemente
gleichzeitig auf dem Bildschirm, nicht zu viel Inhalt an sich.

---

## Bestandsaufnahme — was gleichzeitig sichtbar ist

| Element | Anzahl | Immer sichtbar? |
|---|---|---|
| Gen-Balken in der Wesen-Karte | **25** | Ja, alle 25, ungefiltert |
| Umwelt-Regler (Slider) | 6 | Ja |
| „Versteckte" Umwelt-Achsen (nur über Einfluss-Modal/Chips) | 10 | Nur als Chip, wenn aktiv |
| Biom-Schnellwahl-Knöpfe | 12 | Ja |
| Modale mit eigener Sub-Navigation | 4 (Lebensbaum, Einfluss-Katalog, Herausforderungen, Weltkarte) | Bei Bedarf |
| Herausforderungen im Katalog | 271 | Als Liste + 2 Filter |
| Einfluss-Faktoren / Kategorien | 35 / 11 | Als Kachel-Raster + Suche |
| Entdeckbare Lebensformen / Reiche | 43 / 5 | Im Lebensbaum |
| Sekundär-Controls auf der Hauptseite (Name, Teilen, „So funktioniert's", Chronik, Engine-Info, Zahlen-Toggle) | 6 | Ja, permanent |

Kern des Befunds: **eine einzige Ansicht** (Wesen-Karte + Konsole) zeigt
25 + 6 + 12 + 6 = **49 gleichzeitig aktive UI-Elemente**, bevor überhaupt ein Modal
geöffnet wird.

---

## Die drei Haupttreiber

### 1. Alle 25 Gene, immer, ungefiltert — der größte Hebel

`app/index.html:1888` rendert **jedes** der 25 `GENE_LABELS` als eigenen Balken, unabhängig
davon, ob es im aktuellen Milieu überhaupt eine Rolle spielt. Ein Wesen in der Eiszeit zeigt
also *auch* Balken für Filterapparat, Flügelfläche, Grabtrieb, Druck-Toleranz,
Biolumineszenz — alles Merkmale, die dort nahe am neutralen Anker liegen und nichts zur
aktuellen Geschichte beitragen. Die einzige bestehende Reduktion ist „Zahlen zeigen/
verstecken" (v0.61) — das versteckt Nachkommastellen, nicht Zeilen.

### 2. Zwei Klassen von Umwelt — inkonsistentes Mentalmodell

6 Achsen sind Regler, 10 weitere Achsen (Gift, Sauerstoff, Salz, UV, Druck, Austrocknung,
Strahlung, Feuer, Frost, Wind) existieren in derselben Fitness-Funktion, sind aber nur über
das „Umwelt-Einfluss ↗"-Modal erreichbar und tauchen dann als Wegwerf-Chips
(„giftig ✕") neben dem Biom-Tag auf. Zwei völlig verschiedene Bedienmuster für strukturell
gleichartige Größen kosten spürbar Übersicht.

### 3. Vier Modale, vier verschiedene Navigationsparadigmen

Lebensbaum (Liste/Baum-Toggle), Herausforderungen (271 Einträge, 2 Filter), Umwelt-Einfluss
(Kategorie → Faktor → Erklärsatz → Suche), Weltkarte (Kacheln, Reroll, Katastrophen-Buttons,
Chronik als Liste **oder** Baum). Jedes einzeln poliert, aber in Summe vier unterschiedliche
Bedienlogiken für ein Spiel, dessen Kernschleife eigentlich sehr einfach ist.

### Muster dahinter: additive Audit-Historie

Mindestens sieben abgeschlossene Audit-/Polish-Runden im Backlog sind fast durchgehend
**Zusätze** (neues Gen, neue Kategorie, neuer Tooltip, neue Erklärzeile). Kürzungen sind
selten (z. B. v0.66 „Katalog-Kuratierung"). Das erklärt, warum der Gesamteindruck trotz
vieler guter Einzel-Audits „überladen" bleibt: Komplexität wurde bisher fast nie aktiv
abgebaut, nur einzeln erklärt.

---

## Technische Seite (Wartungsrisiko, nicht direkt spielerspürbar)

- **Fitness-Physik existiert dreifach**: `engine/fitness.ts` (TS, kanonisch), `oracle/`
  (Python, Referenz) und eine **von Hand gepflegte** Kopie in `app/index.html:895–1116`
  (~220 Zeilen `PARAMS`/`PHYS`/`fitness()`). Nur `npm run app-parity` hält diese dritte
  Kopie synchron — genau diese Kopie schickte die App laut Backlog über **10 Versionen mit
  `NaN`-Fitness live**, weil `parity`/`ecology` nur die ersten beiden Kopien prüfen.
- `app/index.html` ist **4074 Zeilen** CSS+HTML+JS in einer Datei, inklusive der kompletten
  Physik-Kopie. `world/world.ts` & Co. werden immerhin automatisch nach
  `app/core/world/*.js` gebündelt (`tools/bundle-app-core.mjs`) — die Inline-Physik in
  `index.html` nicht.
- `app/challenges.js` ist **8304 Zeilen** Auto-generierte Daten (271 Herausforderungen).
- **25 npm-Skripte**, davon 15+ eigenständige `*-check.mjs`-Gates — jede neue Achse bringt
  strukturell einen weiteren Prüfstand mit.

---

## Empfehlungen, priorisiert

**P0 — größter Hebel, geringes Risiko:**
1. Gene progressiv einblenden statt alle 25 permanent (nur sichtbar abweichende/selektierte
   Gene, Rest hinter „Alle 25 zeigen"). Reine Anzeige-Änderung, keine Physik-Änderung.
2. Sekundär-Controls in der Wesen-Karte bündeln (Name-Edit, „So funktioniert's",
   Chronik-Log, Engine-Info, Teilen — ein „⋯ Details"-Aufklapp-Panel statt sechs
   Einzelelemente).

**P1 — spürbar, etwas mehr Aufwand:**
3. Die zwei Umwelt-Klassen vereinheitlichen (entweder alle 16 Achsen gleich zugänglich
   machen, oder bewusst gegenteilig: die 10 Stress-Achsen konsequent nur an
   Biome/Ereignisse koppeln, nie als freie Regler zeigen).
4. Herausforderungen/Einfluss-Kataloge kuratiert statt vollständig zeigen (Start = kleine
   Auswahl statt 271 Einträgen; „Alle anzeigen" bleibt einen Klick entfernt).
5. `app/index.html` in Dateien aufteilen (CSS raus, JS in Module) — keine
   spielersichtbare Änderung, senkt aber die Hürde für P0/P1.

**P2 — schließt das Wartungsrisiko, das Komplexität erzeugt:**
6. Inline-Fitness-Kopie in `index.html` eliminieren — analog zu `bundle-app-core.mjs` aus
   `engine/fitness.ts` generieren statt von Hand parallel pflegen. Beseitigt die
   Fehlerklasse des 10-Versionen-NaN-Bugs dauerhaft.
7. Content-Redundanz prüfen statt neue Achsen (Backlog nennt selbst Kandidaten:
   Strahlung ≈ Gift+UV, Feuer ≈ episodische Hitze) — Zusammenlegung statt Zuwachs.

**Was in Ruhe lassen:** die 25 Gene sind inhaltlich sauber begründet (Reality-Check 20/20),
die Fitness-Physik ist validiert, bisherige Usability-Audits haben echte Barrieren behoben
(Kontrast, Fokus-Fallen, Klartext-Namen). Das Problem ist nicht „zu viel Simulation",
sondern „zu viel davon auf einmal auf dem Bildschirm" — die Empfehlungen zielen fast alle
auf **Progressive Disclosure**, nicht auf Streichung von Inhalt.

---

## Informationsarchitektur — Bedienelemente nach Häufigkeit statt nach Feature-Vollständigkeit

Statt Komplexität nur nach „was kann raus" zu sortieren: **wie oft will eine Person eine
Bedienung wirklich anfassen?** Aktuell stehen fast alle Elemente auf derselben visuellen
Stufe — das ist der eigentliche Grund für den überladenen Eindruck, unabhängig von der
reinen Elementanzahl.

Drei Stufen nach Zugriffs-Tiefe:

- **Prio 1 — immer sofort klickbar** (Hauptbildschirm, kein Modal dazwischen)
- **Prio 2 — einen Klick entfernt** (hinter einem Modal, vom Hauptbildschirm beworben)
- **Prio 3 — einen weiteren Klick entfernt** (Submodal/Settings, bewusst vergraben)

### Finale Einteilung (mit dem Nutzer abgestimmt, 2026-07-29)

**Prio 1 — immer sofort da:**
- Die 6 Umwelt-Regler (Kernmechanik — das Spiel selbst)
- Play/Pause + Tempo (Zeitkontrolle)
- Lebensbaum-Zähler als stiller Fortschritts-Motivator
  („N Formen entdeckt · Lebensbaum ↗") — bleibt dauerhaft sichtbar, der Klick selbst führt
  aber in ein Modal (Inhalt = Prio 2)

**Prio 2 — ein Klick entfernt, aber vom Hauptbildschirm beworben:**
- **Biome** — werden von 12 gleichrangigen Buttons zu einem kompakten „Presets ↗", damit
  die 6 Regler eindeutig die Hauptbedienung bleiben (Biome sind im Kern nur vorgefertigte
  Regler-Kombinationen)
- Umwelt-Einfluss auslösen (spannend, aber kein Dauer-Reflex)
- Herausforderungen — Button bleibt sichtbar beworben, Startansicht aber kuratiert
  (kleine Auswahl statt aller 271 Einträge auf einmal, siehe Empfehlung P1.4)
- Schnappschuss teilen — bleibt auf der Hauptseite, aber visuell klar zweitrangig
  (kleiner Ghost-Button statt gleichrangig mit Presets/Einfluss/Herausforderungen)
- Der eigentliche Lebensbaum-Inhalt (Baum/Liste-Ansicht, Artdetails, Wikipedia-Links) —
  liegt hinter dem immer sichtbaren Zähler-Button

**Prio 3 — bewusst vergraben (Submodal/Settings):**
- Weltkarte-Details (Reroll, Katastrophen-Buttons, Chronik als Baum)
- „So funktioniert's"-Erklärtext
- „Über die Engine"-Info (Modell-Güte, Validität)
- „Zahlen zeigen"-Toggle
- Login / Cloud-Sync
- Namen bearbeiten
- **Neu beginnen** — destruktive, seltene Aktion; gehört bewusst *nicht* neben die
  Kernbedienung, sondern in die Details/Settings, wo ein Fehlklick unwahrscheinlicher ist

### Konsequenz für das Hauptbildschirm-Layout

Mit dieser Einteilung reduziert sich die Dauersicht von aktuell ~49 gleichzeitig aktiven
Elementen auf im Kern: 6 Regler + Play/Pause/Tempo + 1 Fortschritts-Zähler + eine kleine
Reihe von 3 klar sekundär gestalteten Einstiegs-Buttons (Presets, Einfluss,
Herausforderungen) + 1 kleiner Teilen-Button. Die sieben aktuell permanent sichtbaren
Nebenfunktionen (Name-Edit, „So funktioniert's", Chronik-Log, Engine-Info, Zahlen-Toggle,
Login, Neu beginnen) wandern komplett aus der Dauersicht in ein Details-/Settings-Aufklapp.

Ein Layout-Mockup (Vorher/Nachher, statisch, mit Platzhalterwerten) wurde als Vorschau
gebaut und mit dem Nutzer abgestimmt — noch nicht im Code umgesetzt.

**Empfohlene Reihenfolge bei Umsetzung:** zuerst P0.1 (Gene progressiv), dann die
Biome→Presets-Umstellung, dann das Bündeln der Prio-3-Nebenfunktionen in ein
Details-Panel.

**Stand:** Konzept + Layout-Vorschau abgestimmt. Umsetzung im Code steht noch aus —
**Produktentscheidung des Nutzers**, wann das begonnen wird.
