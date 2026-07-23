# Architektur v2 — Population-first, Emergenz-abgeleitet

Begleitdokument zu `docs/rebuild-roadmap.md`. Beschreibt das Ziel-Datenmodell des
Umbaus und wie es zur heutigen Engine steht.

## Heute (v1) vs. Ziel (v2)

| | v1 (live) | v2 (Umbau) |
|---|---|---|
| Zustand | **ein** mittleres Genom pro Wesen | **Population** von N Genomen pro Ort |
| Dynamik | Gradienten-Aufstieg (Mean-Field) | Selektion+Rekombination+Mutation+Drift (agentenbasiert) |
| „Art" | `classify()`-Schwellen (handgeschrieben) | **Cluster** in der Population (emergent) |
| Vielfalt | Karte der Einzelgewinner über Umwelten | Koexistenz + Artbildung *innerhalb* & *zwischen* Orten |
| Räuberdruck | Regler | (später) evolvierende Gegenspieler-Population |

**Wichtig:** v1 ist die *Mean-Field-Näherung* von v2. Das Python-Orakel
(`oracle/reference_model.py`) IST bereits eine Population — v2 hebt dieses Modell
in die TS-Laufzeit und macht es zum Kern. Kein Rewrite von null, sondern
Schwerpunkt-Verlagerung.

## Datenmodell (Ziel)

```
World
 ├─ places: Place[]
 │    ├─ env: Environment          (die "Zustand"-Regler eines Orts)
 │    └─ pop: Population
 │         └─ genomes: number[][]  (N Agenten, je ein Merkmalsvektor)
 ├─ migration: number[][]          (Isolations-/Verbindungs-Matrix)
 └─ (Chronik: Ereignis-Log, emergente Arten über Zeit)
```

- **Emergente Art** = ein Cluster im Genom-Raum einer Population (räumlich/zeitlich verfolgt).
- **Bindung/Pet** = eine markierte Linie/ein Cluster, den der Spieler benennt und verfolgt
  (Zoom-in). Bleibt erhalten — das Pet ist *eine Linie in der lebenden Welt*.

## Ableitungen (alles emergent, nichts handgeschrieben)

- **Name/Beschreibung** einer Art → prozedural aus dem Cluster-Mittel-Genom (Ebene 6, später).
- **Rarität** → wie oft/leicht ein Cluster über Welten/Umwelten entsteht (statt Sweep-Tabelle).
- **Darstellung** → Silhouette aus dem Genom geseedet (schon heute so; bleibt).

## Was die validierte Physik liefert

`engine/fitness.ts` (identisch zum Orakel, `physics.json`) bleibt **unverändert** die
Fitness-Landschaft. v2 ändert nur, *wie* darauf evolviert wird (Population statt Mittelwert)
und fügt **frequenzabhängige Konkurrenz** hinzu (der eine neue Term, der Koexistenz/
Branching freischaltet — `spike/FINDINGS.md`).

## Test-Strategie (das Gewissen)

1. **Dynamik-Treue:** TS-Population ohne Konkurrenz ≈ Orakel/Mean-Field-Attraktor.
2. **Emergenz:** mit Konkurrenz (σ_c < σ_K) spaltet eine Population auf (Branching).
3. **Raum:** isolierte Orte divergieren, verbundene homogenisieren.
4. **Realitäts-Treue v2:** emergente Makro-Muster plausibel (Arten-Areal,
   Radiation nach Katastrophe).
