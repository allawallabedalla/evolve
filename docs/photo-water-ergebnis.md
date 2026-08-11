# Ergebnis — Photosynthese-Wasserkopplung (BACKLOG Punkt 14, Stufen 1–5)

**Stand:** 2026-08-10. Vorher-Werte durchgehend aus `docs/photo-water-baseline.md`
(Stufe 0), Nachher-Werte mit **identischen Seeds** gemessen. Nichts geschätzt.

## 1 · Was gebaut wurde

Drei Physik-Parameter und ein Klassifikator-Parameter, **alle vier mit neutralem
Default**, der den Vorzustand bit-identisch reproduziert:

| Parameter | Wert | Wirkung |
|---|---|---|
| `photoWaterSat` | 0.35 | Sättigung statt linearem `env.water` in `energyPhoto` |
| `photoYield` | 1.0 (neutral) | Ertragsregler; **nicht gebraucht**, s. u. |
| `disturbStructureLoss` | 0.7 | Feuer/Frost entwertet den Lichtvorteil von `structure` |
| `fireresWoodCost` | 4.0 | Rinden-Unterhalt teurer für unverholzte Baupläne |
| `requiresPenalty` | 1.30 → 3.00 | Habitat-Fenster greifen (Klassifikator, keine Physik) |

Der Gegentest ist zweimal gelaufen (nach Stufe 1 und nach Stufe 3a), je **200.000
Zufalls-Stichproben über Genom × Umwelt, 0 bitweise Abweichungen**.

## 2 · Das Ziel: die Land/Wasser-Asymmetrie

Das war der eigentliche Auftrag — und er ist erreicht:

| `tools/research/plant-gap.mjs` (300 Umwelten, Seed 1) | vorher | nachher |
|---|---|---|
| Pflanzen-Strategie gewinnt insgesamt | 4,7 % | **13,0 %** |
| … im **Land**-Band (water 0.02–0.35) | **3 %** | **10 %** |
| … im **Wasser**-Band (water 0.65–1.00) | 11 % | 9 % |

**Die Asymmetrie ist verschwunden** (3 % vs 11 % → 10 % vs 9 %). Land ist für
Photosynthese nicht mehr strukturell feindlich, und tiefes Wasser gibt keinen
unverdienten Bonus mehr.

## 3 · Reich-Verteilung

| | Baseline | nur Stufe 1 | final |
|---|---|---|---|
| **`ecology`** Pflanze | 3,3 % | 12,8 % | **12,1 %** |
| Tier | 52,9 % | 51,6 % | 45,2 % |
| Pilz | 21,0 % | 11,6 % | 21,2 % |
| Mikrobe | 14,3 % | 23,0 % | 15,6 % |
| Protist | 8,5 % | **1,0 %** | 6,0 % |
| **`ecology-full`** Pflanze | 3,2 % | — | **9,5 %** |
| **Schwarm-Sweep** Pflanze | 5,0 % | 10,8 % | **10,3 %** |

Die Spalte „nur Stufe 1" ist bewusst mit drin: dort war der Protisten-Anteil auf 1,0 %
eingebrochen. Die Stufe-3-Terme haben das mit repariert — die finale Verteilung ist
**ausgewogener als die Baseline**, nicht nur als der Zwischenstand.

## 4 · Gate-Bilanz

| Gate | Baseline | nur Stufe 1 | final |
|---|---|---|---|
| `reality` | 21/21 | **20/21** ❌ | **21/21** ✅ |
| `distribution` B3 (SAR) | z = 0.390 | **0.407** ❌ | **0.390** ✅ |
| `phenomena` | 8/8 | 7/8 | **8/8** ✅ |
| `coevolution` (Red Queen) | 6.5× | 8.1× | **7.6×** ✅ |
| `spectrum` JSD | 0.0960 | (ungültig) | **0.1071** ✅ (Ziel < 0.15) |
| `parity` | exakt | exakt | **1.388e-17** ✅ |
| übrige 13 Gates | grün | grün | **grün** |

## 5 · Der eigentliche Fund: eine vorbestehende Schwäche in AXIS-25

Stufe 1 allein kippte die AXIS-25-Regel „Wiederkehrendes Feuer → Wiederaustrieb"
(+0.12 → −0.38, Vorzeichenwechsel). Die Ursachensuche ergab, dass das **kein Schaden der
Photosynthese-Änderung** war, sondern eine Schwäche, die sie nur freigelegt hat:

`regrowthSurvival` nutzt `max(fireres, resprout)` — beide sind **perfekte Substitute**,
und Rinde ist mit Unterhalt 0.07 für jeden Bauplan billig. `resprout` ist damit
strukturell redundant. Messbar als **Fitness-Tal**, das Selektion nicht überqueren kann:

```
resprout = 0.0 → 0.23049      resprout = 0.5 → 0.22803  (Tal)
resprout = 1.0 → 0.23214      Optimum, aber nur +0.7 % über 0
```

Gegenprobe: mit `fireres` künstlich auf 0 steigt `resprout` sauber monoton
(0.033 → 0.051 → 0.069). Der Mechanismus funktioniert — er wird nur immer unterboten.

**Zwei Hypothesen wurden gemessen und verworfen**, bevor die dritte griff:
1. Größenkopplung `(1-size)` entfernen → **−0.33, reichte nicht**
2. Nur Stützgewebe entwerten → **−0.08, reichte auch nicht**
3. **Beide Terme zusammen** → **+0.13** ✅

Die Kausalkette ist biologisch stimmig: Feuer entwertet dauerhaftes Holz → die Pflanze
wird krautig → Rinde ist für Krautiges nicht bezahlbar → Wiederaustrieb wird der einzige
leistbare Überlebensweg. Gemessen bestätigt: unter Feuer fällt `structure` von 0.90 auf
0.17 und `size` von 0.71 auf 0.12 — die Pflanze wird morphologisch zum Wiederaustreiber.

## 6 · Ehrlich: was schlechter oder unverändert ist

- **Ein Bauplan weniger im Zufalls-Sweep** (47 → 46 von 65). Verloren: Flatterer·Vogel,
  Moos, Kraut, Plankton, Bartenwal. Neu dazu: Farn, Wurm, Wühler, Fluginsekt. Alle
  betroffenen lagen bei 1–2 Treffern — Rauschen am Verteilungsrand, kein
  Erreichbarkeits-Verlust (per Cross-Seed-Prüfung bestätigt: kein Bauplan mit ≥3 Treffern
  fiel in zwei unabhängigen Seeds unter die Hälfte).
- **Artnamen-Streuung leicht gesunken** (296 → 289). Konzentrationseffekt: mehr Endpunkte
  landen auf den jetzt starken Landpflanzen (Strauch 20 → 57, Erle 8 → 44).
- **Sukkulente · Kaktus 9 → 1.** Echter Verdrängungseffekt — Strauch/Erle/Laubbaum
  konkurrieren jetzt bis in den mäßig trockenen Bereich hinein. Nicht nachjustiert.
- **`spectrum` JSD 0.0960 → 0.1071.** Etwas schlechter, besteht klar (Ziel < 0.15). Die
  mittlere Clusterzahl trifft dafür jetzt exakt (Browser 1.45 vs Orakel 1.45,
  Abweichung 0.00 gegen vorher 0.29).
- **Ursache (A) unangetastet.** `foodAbundance` bleibt ein Gratis-Buffet für Heterotrophe:
  Pflanzen-Fitness ist weiterhin flach über die Nahrungsmenge (0.286–0.327), heterotrophe
  Fitness skaliert 0.367 → 0.814. Das war als Stufe 6 bewusst ausgeklammert und ist
  weiterhin eine eigene Entscheidung.
- **`census-check` fällt weiter aus** — vorbestehend und unabhängig (fehlende Schlüssel in
  `world/physics-v2.json`, s. Baseline Abschnitt 3). Nicht angefasst.

## 7 · Zwei Werkzeug-Befunde nebenbei

- **`spectrum-check` erkennt veraltete Orakel-Referenzen nur halb.** Seine
  Staleness-Prüfung vergleicht die Schwarm-Konfiguration (N, Kernel, Generationen), **nicht
  die Physik**. Nach einer Physik-Änderung liefert er stillschweigend einen Wert, der
  „neue Physik gegen alte Physik" misst statt N=200 gegen N=2000 — hier konkret 0.1145
  statt der korrekten 0.1071. Nur durch den Zeitstempel-Abgleich aufgefallen.
- **`docs/rarity.json` maß den falschen Motor.** Sie rechnete per Mittelfeld-Konvergenz,
  während die App seit Migrations-Stufe 4 auf dem Schwarm läuft. Beispiel Hutpilz:
  Mittelfeld 0,06 % (Anzeige „extrem selten"), echter Schwarm 6,4 %. Neu erzeugt mit dem
  erstmals eingecheckten `tools/build-rarity.mjs` (vorher nur ein verlorenes
  Wegwerf-Skript); 38 von 65 Formen änderten ihre Stufe.

## 8 · Stufe 4b: die Antwort war das Gegenteil der Frage

Geprüft werden sollte, ob die `requires`-Fenster der Landpflanzen jetzt zu eng sind.
Gemessen (300 aquatische Umwelten, echter Schwarm): sie greifen zu **schwach**.
Landpflanzen gewannen dort schon vor diesem Backlog-Punkt 4,6 % der Endpunkte — das
Phase-0-Symptom, das die Fenster abstellen sollten. Die Photosynthese-Änderung verdoppelte
es auf 8,8 %, weil Landpflanzen im Wasser physikalisch nicht mehr benachteiligt sind.
`requiresPenalty` 1.30 → 3.00 bringt es auf **4,0 %** — unter den Vorzustand, ohne den
Landpflanzen-Gewinn zu kosten (Land-Band 10,4 % → 10,7 %) und ohne Formverluste (43 → 45).

## 9 · Stufe 4c: Prototypen bewusst NICHT neu abgeleitet

`tools/research/archetype-derive.mjs` gegen die heutige Bibliothek verglichen: von 44
Formen weichen nur **2** um mehr als 0.15 in irgendeinem Gen ab — **Blütenkraut `size`**
(D=0.63) und **Farn `resprout`** (D=0.62). Beide sind absichtliche, dokumentierte
Handkorrekturen (CLS-4-Fix bzw. AXIS-25), die das Werkzeug **strukturell nicht erzeugen
kann**: es leitet aus der alten `classify()`-Kaskade ab, und die kennt weder den
Blütenkraut-Größenwert noch überhaupt ein `resprout`. Ein Neu-Ableiten würde genau diese
zwei Fixes zerstören. Deshalb unverändert gelassen.
