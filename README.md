# 🧬 Evolve — Sim-Labor

Ein evolutionäres „Tamagotchi": Du steuerst nie das Tier direkt, nur seine **Umwelt**
(Milieu, Prädatoren, Futter, Umwelteinflüsse). Das Wesen antwortet mit **echter
Evolution** — ein Genom aus Merkmalen mutiert, wird selektiert und vererbt sich über
Generationen.

Dies ist **Schritt 1**: das *Sim-Labor*. Noch keine Grafik, keine Accounts — nur der
wissenschaftliche Kern als Text-Demo, plus die Werkzeuge, um seine Glaubwürdigkeit zu
messen. Wenn dieser Kern überzeugt, trägt er das ganze Spiel.

## Die Grundidee: Zwei Motoren

| Motor | Rolle | Sprache | Ort |
|---|---|---|---|
| **Schlanke Engine** (Surrogat) | Das *Produkt*. Schnell, deterministisch, lesbar. Läuft später im Browser. | TypeScript | `engine/` |
| **Referenz-Orakel** | Die *Ground Truth*. Agentenbasiertes Populationsmodell, wissenschaftlich glaubwürdig, aber schwer/langsam. | Python | `oracle/` |

Die **Trainings-Schleife** (`training/`) kalibriert die schlanke Engine so, dass sie die
Ergebnisse des Orakels nachbildet — *Model Distillation*. Ein **Validitäts-Prozentwert**
zeigt, wie nah wir schon dran sind.

### Warum nicht direkt das Orakel spielen?

Das Orakel ist zu langsam für Echtzeit und seine Ergebnisse sind für Spieler unlesbar.
Die schlanke Engine ist schnell und erklärbar — aber sie muss *glaubwürdig* bleiben.
Das Orakel ist der Prüfstein dafür.

## Die Trainings-Mechanik (abgestimmt)

- **Geteilte Physik** (`physics.json`): Engine und Orakel lesen dieselbe Fitness-Landschaft.
  Fair vergleichbar, eine einzige Quelle der Wahrheit.
- **Autonomie:** kontinuierliche Parameter werden **automatisch** gefittet (genetischer
  Algorithmus). **Struktur-Wachstum** (neue Gene/Mechaniken) wird nur *vorgeschlagen* und
  **von Hand bestätigt** — schützt die Lesbarkeit.
- **Ziel-Band ~80–90%**, bewusst **nicht 100%**: bei 100% hätten wir das schwere Modell
  nachgebaut und Schlankheit + Lesbarkeit verloren. Die Rest-Abweichung ist Design-Freiraum.
- **Overfitting-Schutz:** Der Prozentwert wird auf **zurückgehaltenen Test-Szenarien**
  gemessen, die das Training nie gesehen hat.

## Die Merkmale & Regler (Strohmann, wächst später)

**4 Umwelt-Regler** (der Spieler): Temperatur · Prädationsdruck · Nahrungsfülle · Nahrungshöhe

**5 Gene** (mit Nutzen *und* Preis): Isolation · Größe · Gliedmaßenlänge · Stoffwechsel · Panzerung

Die Tiefe kommt aus **Trade-offs**: Fell schützt vor Kälte, kostet aber bei Hitze und im
Stoffwechsel; Größe schützt vor Räubern, kostet aber Nahrung; usw.

## Ausprobieren

```bash
npm install
npm run all        # build + Orakel-Benchmark erzeugen + Engine trainieren
npm run demo       # Text-Demo im Terminal (Standard: Eiszeit)
npm run demo all   # alle Szenarien
npm run demo "Raeuberland"
npm run serve      # dann http://localhost:8000/mockup/ im Browser öffnen
```

Freie Umwelt im Terminal (`temp pred food height gens`):

```bash
node dist/cli/demo.js "" 0.1 0.8 0.6 0.2 60
```

## Aufbau

```
physics.json          geteilte Fitness-Landschaft (Engine + Orakel)
scenarios.json        Benchmark-Szenarien (train/test-Split)
fitted-params.json    Ergebnis des Trainings (Parameter + Validität) — vom Mockup gelesen
engine/               schlanke Engine (TS): fitness, simulate, explain, report
oracle/               Referenz-Orakel (Python) + benchmark/ (erzeugte Ground Truth)
training/             genetischer Algorithmus, der die Engine ans Orakel anpasst
cli/                  Terminal-Text-Demo
mockup/               Browser-Mockup (Text-I/O + Validitäts-Balken)
```

## Aktueller Stand der Validität

Nach dem ersten Training liegt die **Test-Validität bei ~74%** — knapp unter dem Ziel-Band.
Bemerkenswert: der **Endzustand** der Evolution trifft das Orakel schon sehr genau
(z. B. Eiszeit: Isolation 0.89 vs. 0.89). Die Rest-Lücke stammt vor allem aus:

1. **Anpassungs-Geschwindigkeit** — die *Form* der Kurve über die Generationen weicht ab.
2. **Neutrale Drift** — Merkmale ohne Selektionsdruck (z. B. Gliedmaßenlänge ohne
   Höhenbedarf) wandern im Orakel, die Engine hält sie fest.

Beides sind **Struktur-Themen** → nächster Wachstumsschritt, der bewusst bestätigt wird
(siehe Autonomie-Regel), nicht automatisch passiert.
