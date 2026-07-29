# Arbeitspaket P8 — „Herausforderungen der Natur", Runde 2 (300 Stück)

**Für eine externe Bearbeitung ohne Zugriff auf das Repository.**
Umfang: **300 Herausforderungen**. Ersetzt/erweitert P5 — die erste Runde (28 Stück)
ist geprüft: 18 von 28 waren übernahmefähig, 10 sind an der echten Simulation
gescheitert. Der Grund war fast immer derselbe (siehe Abschnitt 1) — diesmal
bekommst du die Daten, die genau das verhindern.

⚠️ Wie beim ersten Paket gilt: **nur Inhalt.** Ob und wie Herausforderungen ins
Spiel eingebaut werden, ist eine separate, spätere Entscheidung.

---

## 1. Was beim ersten Anlauf schiefging — und was diesmal anders ist

Von 28 gelieferten Herausforderungen sind 10 daran gescheitert, dass das Ziel
in keiner der 24 Test-Umgebungen je erreicht wurde. Grund: Die Beschränkungen
(`grenzen`) wurden aus biologischer Intuition heraus gebaut („Nadelbaum
braucht es kalt") — aber die Simulation ist kein Biologie-Lehrbuch, sie hat
ihre eigene, empirisch andere Logik, welche Umgebung zu welcher Form führt.
Eine Achse, die nicht in `grenzen` steht, wird beim Prüfen **völlig frei**
zwischen 0 und 1 gewürfelt — wenn das Ziel aber nur in einem schmalen Fenster
dieser Achse erreichbar ist, verfehlen die meisten Stichproben es dann.

**Diesmal bekommst du in `P8-eingabe.json` zusätzlich `formEnvelopes` und
`reichEnvelopes`** — für jede der 39 (von 44) tatsächlich erreichbaren Formen
und alle 5 Reiche:

```json
"Nadelbaum": {
  "reich": "Pflanze",
  "treffer": 7,
  "envelope": {
    "temperature": {"min": 0.19, "max": 0.64},
    "predation":   {"min": 0.37, "max": 0.97},
    "foodAbundance": {"min": 0.09, "max": 0.42},
    "foodHeight":  {"min": 0.39, "max": 0.88},
    "light":       {"min": 0.85, "max": 0.99},
    "water":       {"min": 0.74, "max": 0.97}
  },
  "beispiele": [ {"temperature":0.26,"predation":0.8,"foodAbundance":0.42,"foodHeight":0.85,"light":0.94,"water":0.89}, ... ]
}
```

- **`treffer`** — wie oft dieses Ziel unter 45.000 rein zufälligen Umgebungen
  getroffen wurde. Ein direktes Seltenheits-Maß (nicht dasselbe wie
  `raritaet` aus der Formen-Liste, aber verwandt).
- **`envelope`** — für jede der 6 Regler-Achsen die tatsächlich gemessene
  Spanne unter den Treffern. Also: **so** sah jede Umgebung aus, die dieses
  Ziel wirklich erreicht hat.
- **`beispiele`** — konkrete, real erreichte Umgebungen (bis zu 8), zum
  direkten Nachbauen.

**Die zentrale Regel für diese Runde:**

> Für jede Achse, die du in `grenzen` einschränkst, muss dein Intervall die
> `envelope`-Spanne dieser Achse (bei diesem Ziel) enthalten oder großzügig
> überlappen. Für **jede Achse mit schmaler `envelope`-Spanne (max−min unter
> etwa 0,5), die du NICHT in `grenzen` aufnimmst**, ist das Risiko hoch, dass
> die Herausforderung durchfällt — weil sie beim Prüfen frei über [0,1]
> gewürfelt wird, aber nur in diesem schmalen Fenster überhaupt funktioniert.

**Wichtige Einschränkung bei sehr seltenen Zielen (`treffer` unter etwa 50):**
Bei so wenigen Treffern ist die `envelope`-Spanne pro Achse **irreführend
breit** — sie ist ja nur die Hüllkurve von ein paar verstreuten Einzelpunkten,
nicht der tatsächlich erreichbare Bereich. Getestet: Ein Nadelbaum-Versuch
(`treffer: 7`), der nur Licht und Wasser anhand der `envelope` einschränkte
und die übrigen 4 Achsen frei ließ, schlug in 24 Stichproben **0-mal** an.
Erst als alle 6 Achsen eng um **ein einzelnes** `beispiele`-Element herum
eingeschränkt wurden (jede Achse ± 0,1–0,15 um den Beispielwert, nicht um
die `envelope`), gelang es (8 % Trefferquote). **Faustregel:** je niedriger
`treffer`, desto mehr Achsen gehören in `grenzen` — und binde sie an EIN
konkretes `beispiele`-Element, nicht an die Hüllkurve über alle Beispiele
hinweg. Bei `treffer` über ein paar hundert reichen meist 1–3 Achsen, an der
`envelope` orientiert.

**5 Formen hatten in 45.000 Stichproben KEINEN Treffer** (stehen unter
`formenOhneTreffer` in der Eingabe: Blütenkraut, Schnecke · Weichtier,
Amphibie · Lurch, Schwamm, Zunderschwamm). Die bitte **nicht** als Ziel
verwenden — sie sind entweder extrem selten oder in der Simulation
schwerer erreichbar, als die 45.000 Stichproben zeigen konnten.

---

## 2. Was du bekommst

`P8-eingabe.json`: `achsen` (6 Regler), `reiche` (5), `formen` (44 mit
`raritaet`), `reichEnvelopes`, `formEnvelopes` (39 Formen, s. o.),
`formenOhneTreffer` (5 Formen, meiden).

---

## 3. Was eine Herausforderung braucht (unverändert zu Runde 1)

1. **Ein Ziel** — `ziel.reich` oder `ziel.form` (Formnamen exakt aus `formen`
   übernehmen, inkl. „·").
2. **Eine Beschränkung** (`grenzen`) — mind. eine der 6 Regler-Achsen mit
   `min`/`max`. Muss die `envelope`-Regel aus Abschnitt 1 einhalten.
3. **Ein Generationen-Budget** (`generationen`) — 300–3000, realistisch zum
   `treffer`-Wert: sehr seltene Ziele (treffer < 50) dürfen ruhig am oberen
   Ende liegen (1500–3000).
4. **Eine Schwierigkeit** (`leicht`/`mittel`/`schwer`) — Faustregel:
   `treffer` grob > 1000 → eher leicht/mittel möglich, `treffer` < 100 →
   eher schwer (die Seltenheit selbst ist dann schon die Herausforderung,
   siehe Vorschlag „Seltene Formen als Ziel" aus Runde 1).

---

## 4. Der Text (unverändert zu Runde 1)

**Titel:** ≤ 60 Zeichen, benennt das Bild, nicht die Mechanik.
**Beschreibung:** 30–220 Zeichen, ein bis zwei Sätze, normale Sprache, kein
Ausrufezeichen, keine Zwangssprache („muss …", „schaffe es …").
Umlaute korrekt (kein „waermedaemmung").

---

## 5. Umfang und Verteilung — 300 Stück

Damit die 300 nicht redundant wirken:

- **~200 Form-Ziele**, verteilt über die 39 erreichbaren Formen (im Schnitt
  5 pro Form, bei den häufigeren Formen ruhig mehr Varianten mit
  unterschiedlichen Achsen-Kombinationen und Schwierigkeitsgraden, bei sehr
  seltenen weniger).
- **~70 Reich-Ziele**, gestreut über alle 5 Reiche — für Einsteiger, mit
  lockereren Beschränkungen (die `reichEnvelopes` sind viel breiter als die
  Form-Envelopes, das macht Reich-Ziele deutlich robuster).
- **~30 Extra-schwere**, aus den seltensten Formen (`treffer` < 50: u. a.
  Fluginsekt · Segler, Farn, Moos, Wurm, Nadelbaum, Sukkulente · Kaktus,
  Kopffüßer · Tintenfisch, Grünalge, Gepanzerter Koloss) — hier reicht oft
  eine lockere oder gar keine zusätzliche Beschränkung, die Seltenheit ist
  schon die Aufgabe. Generationen-Budget hier großzügig wählen (2000+).

Streu außerdem bewusst, **welche** Achse(n) jeweils die Beschränkung bilden
— nicht immer Licht, auch Räuberdruck, Wasser, Temperatur, Nahrung,
Nahrungshöhe sollen als „Dreh- und Angelpunkt" vorkommen.

Du kannst die 300 in mehreren Dateien abliefern (z. B. 5 × 60), wenn das für
dich praktischer ist — jede Datei einzeln lauffähig mit demselben
Prüfbefehl. Nicht zwingend, nur eine Option.

---

## 6. Ausgabeformat (identisch zu Runde 1)

```json
[
  {
    "id": "nadelbaum-am-lichten-hang",
    "titel": "Grün im ewigen Winter",
    "beschreibung": "Erreiche den Nadelbaum: viel Licht, viel Wasser, mäßige Kälte, spürbarer Räuberdruck.",
    "ziel": { "form": "Nadelbaum" },
    "grenzen": {
      "temperature": { "min": 0.14, "max": 0.4 },
      "predation": { "min": 0.6, "max": 1 },
      "foodAbundance": { "min": 0.28, "max": 0.55 },
      "foodHeight": { "min": 0.65, "max": 1 },
      "light": { "min": 0.8, "max": 1 },
      "water": { "min": 0.7, "max": 1 }
    },
    "generationen": 2000,
    "schwierigkeit": "schwer"
  }
]
```

(dieses Beispiel steht geprüft auch in `P8-beispiel.json` — `node
tools/challenge-import-check.mjs docs/auslagerung/P8-beispiel.json` besteht.)

`id`: kurz, kleingeschrieben, Bindestriche, **eindeutig über alle 300**.

---

## 7. Wie geprüft wird

`node tools/challenge-import-check.mjs <datei.json>` — dieselbe Simulation
wie in Runde 1 (ein kleiner Fehler wurde seither behoben: die Achse
„Sauerstoff" wurde versehentlich mitgewürfelt statt neutral zu bleiben — war
für Runde 1 mitverantwortlich für ein paar der Fehlschläge, betrifft dich
aber nicht, du arbeitest ja nur mit den 6 genannten Reglern). Erwartung
diesmal: **deutlich weniger Fehlschläge**, weil `grenzen` direkt aus
gemessenen `envelope`-Daten statt aus Vermutung gebaut wird.
