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

## Die Merkmale & Regler

**6 Umwelt-Regler** (der Spieler): Temperatur · Prädationsdruck · Nahrungsfülle ·
Nahrungshöhe · **Licht** · **Wasser**

**8 Gene** (mit Nutzen *und* Preis): Isolation · Größe · Gliedmaßenlänge · Stoffwechsel ·
Panzerung · **Photosynthese** · **Mobilität** · **Stützgewebe**

Die Tiefe kommt aus **Trade-offs**: Fell schützt vor Kälte, kostet aber bei Hitze; Größe
schützt vor Räubern, kostet aber Nahrung; usw.

### Reich-Gabelung Pflanze ↔ Tier (emergent)

Energie kommt aus zwei **sich gegenseitig ausschließenden** Strategien:

- **Photosynthese** (sessil, braucht Licht + Wasser) → Pflanzen-Pfad
- **Nahrungssuche** (mobil, braucht Futter) → Tier-Pfad

Ein `exclusion`-Term macht beide unvereinbar (ein Blatt kann nicht jagen). Dieselbe Engine
wird dadurch unter *viel Licht + wenig Futter* zur **Pflanze** (🌳 verholzt, hoch wachsend
ums Licht) und unter *Dunkelheit + Beute* zum **Tier** (mobil, gepanzert) — je nach Umwelt,
ohne dass es irgendwo fest verdrahtet ist. Ein **Archetyp-Klassifizierer** benennt das
Ergebnis (Basis fürs spätere Genbuch).

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

**Test-Validität ~80%, Training ~81% — im Ziel-Band (80–90%).** Train ≈ Test heißt: kein
Overfitting, die Engine generalisiert ehrlich. Mit der Reich-Gabelung (8 Gene) ist die
Aufgabe schwerer geworden, wir liegen am unteren Band-Rand.

### Anatomie der fehlenden ~20% (Weg statt Ziel)

Die **Endzustände** treffen das Orakel sehr genau (z. B. Eiszeit Stoffwechsel 0.91 vs. 0.92).
Die Lücke steckt fast nur im *Verlauf*, in drei Töpfen:

1. **Dormanz-Timing** (der reparierbare Rest): in Knappheits-Szenarien schaltet die
   stochastische Orakel-Population *scharf* in einen Ruhezustand, die glatte Engine gleitet
   sanfter. Eingriffe hier sind heikel (Kipppunkte — ein Gliedmaßen-Kostentest brach ein
   Szenario und wurde verworfen).
2. **Neutrale Drift** (*bewusst offen gelassen*): selektionsfreie Merkmale wandern im Orakel
   durch Zufall; die deterministische Engine hält sie fest. Das zu treffen hieße, Rauschen
   einzubauen — Gegenteil von Lesbarkeit.
3. **S-Kurven-Anlauf**: kurzer Beschleunigungs-Versatz am Anfang, selbstheilend.

Der *sinnvoll* schließbare Anteil ist also kleiner als 20% — ein guter Teil ist absichtlich
freigelassener Design-Raum. Genau darum war das Ziel ein Band bei 80–90%, nicht 100%.

### Frühere Version (V1, nur Tiere)

Der V1-Kern (5 Gene, 4 Regler) erreichte ~88%. Der Sprung von ~74% auf ~88% kam über einen
bestätigten Struktur-Schritt (genetische Varianz `x·(1−x)`, Wright-Fisher). Details unten.

### Weg dorthin (dokumentiert als Beispiel der Wachstums-Mechanik)

Das erste Training kam nur auf ~74%. Die Diagnose (Engine- vs. Orakel-Trajektorien
Generation für Generation) zeigte drei strukturelle Ursachen:

1. **Übersteuern** — stark selektierte Gene schossen über das Orakel-Gleichgewicht
   hinaus (Panzer 0.99 statt 0.89).
2. **Geschwindigkeit** — manche Anpassungen liefen zu langsam (Gliedmaßen).
3. **Neutrale Drift** — selektionsfreie Merkmale wanderten im Orakel (Seed-Rauschen).

Der bestätigte **Struktur-Wachstumsschritt**:

- **Genetische Varianz `x·(1−x)`** in die Engine-Dynamik (Wright-Fisher): Anpassung
  verlangsamt sich nahe der Fixierung, weil weniger Variation zum Selektieren bleibt.
  Behebt Übersteuern *und* Kurvenform. Der GA gewichtete diesen Term mit **1.0** —
  er hat ihn voll übernommen.
- **Mehr Orakel-Seeds (6 → 24)**: mittelt die neutrale Drift heraus, bessere Ground Truth.

Das ist die Mechanik in Aktion: Parameter automatisch gefittet, der *strukturelle*
Schritt bewusst bestätigt — und die Physik blieb dabei unangetastet.

### Verbleibende Rest-Lücke (bewusster Design-Freiraum)

Kleinere Abweichungen bleiben (z. B. Größe vs. Panzer teilen sich die Verteidigung leicht
anders auf). Das ist gewollt: bei 100% hätten wir das schwere Modell nachgebaut. ~88%
heißt *glaubwürdig und schlank*.
