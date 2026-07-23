# Spike: Emergente Vielfalt durch frequenzabhängige Selektion

**Status:** Proof-of-Concept (NICHT Teil des Builds/Deploys). Beantwortet *eine*
Frage, bevor über einen Engine-Umbau entschieden wird:

> Erzeugt frequenzabhängige Selektion in **unserem** Rahmen echtes
> evolutionäres Branching / Koexistenz — also Vielfalt, die das aktuelle
> Modell (fixe Landschaft, ein Gewinner pro Umwelt) prinzipiell nicht kann?

**Antwort: Ja.** Der Mechanismus funktioniert, mit unserer echten Fitness und
ohne handgeschriebene Formen. Er verlangt aber (a) einen Konkurrenz-Term im
Orakel und (b) eine **Populations-Darstellung statt eines Mittelwerts**.

## Warum das aktuelle Modell keine Vielfalt „vertieft"

- Orakel (`reference_model.py`) = agentenbasierter GA auf **fixer** Landschaft.
  `fitness(individuum, umwelt)` hängt NICHT von der übrigen Population ab.
- Fishers Fundamentalsatz: Selektion auf fixer Landschaft zehrt Varianz auf →
  Konvergenz auf **einen** Gipfel. Kontrolle unten bestätigt das jedes Mal.
- Etablierte Theorie (Adaptive Dynamics, Dieckmann & Doebeli 1999; MacArthur
  Ressourcen-Konkurrenz): Koexistenz & Artbildung entstehen aus **frequenz-/
  dichteabhängiger** Selektion — Fitness, die davon abhängt, was sonst da ist.

## Methode

Reproduktions-Gewicht pro Individuum:

```
w_i = f_i^s · K(size_i) / n_i
n_i = (1/N) · Σ_j exp( −(size_i − size_j)² / (2·σ_c²) )
```

- `f_i` = unsere **echte** Fitness (`oracle/reference_model.py`, fixe Landschaft).
- `K(x)` = Ressourcenverteilung entlang der Körpergröße (Gauss um 0.5, σ_K) —
  steht für „welche Beute-/Nahrungsgröße wie häufig ist"; neutralisiert die
  Rand-Artefakte eines beschränkten Merkmalsraums.
- `n_i` = effektive Dichte ähnlich großer Konkurrenten (Konkurrenz-Kernel σ_c).
- Sonst identische Orakel-Dynamik (Roulette-Selektion, Rekombination, Mutation).

Merkmalsachse = **Körpergröße** (klassisches Character-Displacement, z. B.
Darwinfinken-Schnabelgröße). Skripte: `branching.py` (Kontrollen), `branching3.py`
(sauberer Nachweis mit K(x)).

## Ergebnisse

Umwelt: `pred .4, food .7, foodHeight .35, light .45, water .5`; σ_K = 0.25.

| Lauf | size-Verteilung | Deutung |
|---|---|---|
| **ohne Konkurrenz** | ein Cluster bei 0.5 (mid 0.93) | ein Gewinner (Fisher) — wie heute |
| **σ_c = 0.4** (breiter als σ_K) | ein Cluster bei 0.5 (mid 0.93) | Generalist — Theorie: kein Branching ✓ |
| **σ_c = 0.1** (schmaler als σ_K) | Mitte bricht auf, Masse in beide Flanken (mid 0.93→0.54) | disruptive Selektion / Branching ✓ |

Zusatzlauf mit monotoner Landschaft (`branching.py`): Konkurrenz hält einen
**zweiten Cluster** dort, wo die Basis-Fitness *schlechter* ist — reine Selektion
löscht ihn (Kontrolle), nur Konkurrenz-Ausweichen erhält ihn. → Koexistenz, die
ohne Frequenzabhängigkeit unmöglich ist.

Der Übergang folgt der Vorhersage der Adaptive Dynamics (Branching wenn
σ_c < σ_K). Die genaue Form (sauberer Doppelgipfel vs. breiter Fächer) hängt von
σ_c, Konkurrenz-Intensität, Mutation und Laufzeit ab — hier nicht ausgereizt.

## Was das für das Produkt heißt

1. **Der Mechanismus ist real und steuerbar** in unserem Rahmen. „Mehr Vielfalt
   ohne Handarbeit" ist **erreichbar** — aber über Frequenzabhängigkeit, nicht
   über mehr Gene (mehr Gene = breitere Einzelgewinner-Karte, nicht tiefere Koexistenz).
2. **Es ist ein Umbau, kein Patch:**
   - Orakel-Fitness um einen Konkurrenz-Kernel erweitern (frequenzabhängig).
   - Statt *ein* mittleres Genom eine **Populations-Verteilung** darstellen — die
     Mean-Field-Engine kann einen gespaltenen Schwarm nicht abbilden (der
     Mittelwert läge im leeren Tal). Damit fällt auch das „Engine ≈ Orakel /
     Validität %"-Gerüst in seiner heutigen Form.
   - Arten = **Cluster** in der evolvierten Population → `classify()`-Kaskade und
     handbenannte Formen werden überflüssig (Formen emergieren).
3. **Produkt-Gabel:** Das ist nicht mehr „ein Tamagotchi-Pet", sondern ein
   **Ökosystem/Population**. Bewusste Entscheidung nötig.

## Empfehlung

- **Nächster kleiner Schritt (falls Richtung (ii)):** dasselbe im *vollen* Genom
  (nicht nur size) mit einem generischen Nischen-Kernel über mehrere Merkmale +
  längeren Läufen, und eine minimale **Cluster-Erkennung** (Arten zählen) — als
  zweiter Spike, immer noch ohne Produktions-Umbau.
- **Falls Richtung (i)** (Einzel-Linie bleibt): diesen Befund als Beleg ablegen,
  warum das aktuelle Modell bewusst *Nischen-Besetzung* (nicht Biodiversität)
  zeigt, und das Produkt ehrlich so positionieren.

## Quellen

- Dieckmann & Doebeli (1999), *On the origin of species by sympatric speciation*, Nature.
- Geritz, Kisdi, Meszéna, Metz (1998), *Evolutionarily singular strategies* (Adaptive Dynamics).
- MacArthur & Levins (1967), *Limiting similarity*.
- Fisher (1930), *Fundamental Theorem of Natural Selection*.
