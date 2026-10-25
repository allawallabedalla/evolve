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

- **Mitte:** dein Wesen – die stärkste Art im Schwarm, gezeichnet aus ihren Genen,
  mit Licht und Schatten vor einem Lebensraum aus der aktuellen Welt (Himmel je nach
  Licht, unten Land oder Wasser). Es atmet, blinzelt, wippt (je beweglicher, desto
  mehr), Pflanzen wiegen sich, Leuchten pulsiert, Flügel schlagen.
  - **Darüber streichen:** streicheln – es schaut deinem Finger nach, lehnt sich
    hinein, schnurrt, lächelt; Herzen (Tiere) bzw. Funken steigen auf. Reine
    Zuneigung, die Gene bleiben unberührt.
  - **Lange drücken:** kurze Erklärung (was es ist, was es prägt, was an der Welt
    auffällt). Scrollen mit dem Finger, Tippen = zurück
  - **Antippen:** es hüpft, dann das Menü – Herausforderung, Chronik, Neues Leben
    (mit Rückfrage)
- **Rand:** sechs Bögen = Wärme, Licht, Wasser, Futter, Futterhöhe, Räuber; die
  Füllung zeigt, wie die Welt *gerade ist*
- Bogen antippen → Regler bearbeiten: Finger am Ring = Ziel der Welt, in der Mitte
  wischen = anderer Regler, Mitte tippen oder 6 s warten = zurück
- **Unten:** Name und Zustand („Ruri · gedeiht“) – oder das Ziel der laufenden
  Herausforderung, oder rot die Aussterbe-Warnung; darunter die Form

## Spielregeln

Vorbild ist die Browser-App, Leitplanken aus `docs/bindung-konzept.md`: kein Tod
durch Abwesenheit, keine Streaks, kein Sammelzwang.

- **Evolution als Moment:** eine neue Form zählt erst, wenn sie 15 Generationen
  hält. Dann „Evolution!“ mit vorher/nachher, das Wesen springt, der Ring leuchtet
  golden, und es kommt in die **Chronik** der Linie.
- **Trägheit der Welt:** ein Regler-Zug ist ein Klimawandel – die Welt schwingt
  höchstens 4 %-Punkte je Generation ein (`ENV_RATE` in `src/sim.cpp`, 1.0 = sofort).
- **Herausforderungen:** 65 aus der App (die mit einem Reich als Ziel), z. B.
  „Mach daraus einen Pilz – in höchstens 724 Generationen“ in einem Rahmen. Die Uhr
  läuft, sobald die Welt im Rahmen ist; der Regler zeigt gesperrte Bereiche dunkelrot
  und bleibt im Rahmen. Geschaffte bleiben markiert, auch über „Neues Leben“ hinweg.
- **Aussterben – nur unter deinen Augen:** bleibt die Fitness der eigenen Art bei
  ≤ 0,04, läuft eine Uhr: nach 20 s „Gefahr!“ und roter Ring, nach 60 s ist die Linie
  ausgestorben. Bei dunklem Bildschirm steht die Uhr. Gelingt nur in wirklich
  lebensfeindlichen Welten (z. B. eisig, tief, dunkel, viele Räuber).
- **Bildschirm-Schlaf + Rückblick:** nach 30 s ohne Berührung geht das Licht aus, die
  Simulation läuft weiter. Die erste Berührung weckt nur und zeigt „Willkommen
  zurück!“ mit allem, was in der Chronik dazugekommen ist.

Ein Generationsschritt pro Sekunde. Gespeichert wird alle 60 s und kurz nach jeder
Regler-Änderung oder jedem Spielereignis (NVS); nach dem Einschalten geht es dort weiter.

## Serielle Befehle

| Befehl | Wirkung |
|---|---|
| `env` | aktuelle Umwelt ausgeben |
| `env <feld> <0..1>` | z. B. `env temperature 0.9` (`temperature predation foodAbundance foodHeight light water`) |
| `forget` | Speicherstand löschen, Neustart mit frischer Welt |
| `info` | Erklärtext zum aktuellen Wesen ausgeben (wie beim Antippen) |
| `bench` | Erklärung 4 s automatisch scrollen und Renderzeit je Bild messen (`bench r` = neu zeichnen ohne Scrollen, `bench e` = ohne Text) |
| `new` | neue Linie (wie „Neues Leben“) |
| `ch <nr>` | Herausforderung annehmen (0–64) |
| `chron` | Chronik ausgeben |
| `sleep` / `wake` | Bildschirm schlafen legen / wecken |
| `pose <nr>` / `pose off` | Beispiel-Wesen zeigen (0 Kraut … 9 Leuchtpilz) / zurück zum echten |
| `pet` | Streicheln vorführen |
| `shot` | Bildschirm als Bild schicken – besser über `tools/shot.py` |

### Bildschirmfotos

```bash
python esp32/tools/shot.py COM7 bild.png               # aktueller Bildschirm
python esp32/tools/shot.py COM7 bogen.png --poses 0-9  # Kontaktbogen aller Beispiel-Wesen
```

So lassen sich Änderungen an der Wesen-Zeichnung prüfen, ohne aufs Display zu schauen.

Serielle Befehle zählen als Aktivität (der Bildschirm bleibt an).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `lib/evolve_core/` | Port von `engine/fitness.ts`, `world/population.ts`, `world/describe.ts`, `world/cluster.ts` (Arten-Zählung) |
| `include/physics.h` | erzeugt von `tools/gen-physics.mjs` aus `physics.json` – nicht von Hand ändern |
| `include/challenges.h` | erzeugt von `tools/gen-challenges.mjs` aus `app/challenges.js` |
| `src/game.*` | Spielregeln: Linie, Formwechsel, Chronik, Aussterbe-Uhr, Herausforderungen |
| `src/sim.*` | Sim-Task, Trägheit der Welt, Schnappschuss/Ereignisse für die Oberfläche, Speichern/Laden |
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
