# Evolve auf dem ESP32-2424S012C

Eigenständige Firmware für das runde 1,28"-Display (ESP32-C3, GC9A01, CST816D):
der Populations-Kern von Evolve läuft auf dem Board, du drehst an der Umwelt,
das Wesen evolviert. Plan und Phasen: [`docs/esp32-port.md`](../docs/esp32-port.md).

## Bauen und flashen

```bash
pio run -d esp32 -t upload && pio device monitor -d esp32
```

(`pio` = PlatformIO; ohne PATH-Eintrag `python -m platformio …`.)

## Bedienung

- **Mitte:** das Wesen, gezeichnet aus dem Mittelwert-Genom. Antippen → kurze
  Erklärung: was für ein Lebewesen, welche Merkmale es prägen (Nutzen und Kosten)
  und was an der eingestellten Welt auffällt. Scrollen mit dem Finger, Tippen = zurück
- **Rand:** sechs Bögen = Wärme, Licht, Wasser, Futter, Futterhöhe, Räuber
- Bogen antippen → Regler bearbeiten: Finger am Ring = Wert,
  in der Mitte wischen = anderer Regler, Mitte tippen oder 6 s warten = zurück
- **Unten:** Generation und Kurzbeschreibung

Ein Generationsschritt pro Sekunde. Gespeichert wird alle 60 s und 5 s nach
einer Regler-Änderung (NVS); nach dem Einschalten geht es dort weiter.

## Serielle Befehle

| Befehl | Wirkung |
|---|---|
| `env` | aktuelle Umwelt ausgeben |
| `env <feld> <0..1>` | z. B. `env temperature 0.9` (`temperature predation foodAbundance foodHeight light water`) |
| `forget` | Speicherstand löschen, Neustart mit frischer Welt |
| `info` | Erklärtext zum aktuellen Wesen ausgeben (wie beim Antippen) |
| `bench` | Erklärung 4 s automatisch scrollen und Renderzeit je Bild messen (`bench r` = neu zeichnen ohne Scrollen, `bench e` = ohne Text) |

## Aufbau

| Pfad | Inhalt |
|---|---|
| `lib/evolve_core/` | Port von `engine/fitness.ts`, `world/population.ts`, `world/describe.ts` |
| `include/physics.h` | erzeugt von `tools/gen-physics.mjs` aus `physics.json` – nicht von Hand ändern |
| `src/sim.*` | Sim-Task, Schnappschuss für die Oberfläche, Speichern/Laden |
| `src/ui.*`, `src/creature.*` | runde Oberfläche, Wesen-Zeichnung |
| `src/explain.*` | Lern-Text zum Wesen |
| `include/gene_texts.h` | erzeugt von `tools/gen-texts.mjs` aus `app/index.html` (Gen-Namen) und `app/gene-explain.js` (Erklärsätze) |
| `src/fonts/` | Montserrat mit Umlauten (lv_font_conv) |
| `tools/parity.mjs` | Paritätstest C++ ↔ TS |

Physik-Quelle ist `physics.json` (wie das Haustier der Live-App), nicht
`app/core/physics-v2.json` – der fehlen Konstanten, `fitness()` gäbe NaN.

## Paritätstest

```bash
npm run build && node esp32/tools/parity.mjs
```

Braucht `g++` im PATH (unter Windows z. B. WinLibs). Prüft RNG, Fitness und
Populationslauf bit-nah gegen die TS-Engine (`native` = double, `native_float`)
und den schnelleren Ganzzahl-Kernel des Boards (`native_fast`) statistisch –
der C3 hat keine FPU, der exakte Kernel bräuchte 550 statt 180 ms je Generation.
