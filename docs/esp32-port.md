# Auftrag: Evolve auf ESP32-2424S012C (rundes 1,28"-Display)

Anleitung für eine **lokale Claude-Code-Session**. Repo: <https://github.com/allawallabedalla/evolve>.
Ziel: eine eigenständige Firmware unter `esp32/`, die den Simulationskern von Evolve
auf dem Board laufen lässt und auf dem runden Display zeigt. Die Browser-App (`app/`)
bleibt unangetastet.

## 0. Vorbereitung (Mensch, ca. 15 min)

1. Repo klonen, Branch anlegen: `git checkout -b esp32-port`
2. PlatformIO installieren (VS-Code-Extension oder `pip install platformio`)
3. Board per USB-C anschließen, Port prüfen: `pio device list`
4. Claude Code im Repo-Root starten und auf diese Datei verweisen:
   `Lies docs/esp32-port.md und arbeite Phase 1 ab.`

## 1. Hardware (vor Phase 1 verifizieren!)

| Teil | Wert | Status |
|---|---|---|
| MCU | ESP32-C3-MINI-1U, 4 MB Flash, **kein PSRAM**, ~400 KB RAM | gesichert |
| Display | GC9A01, 240×240 rund, SPI: SCLK 6, MOSI 7, DC 2, CS 10, BL 3, RST = EN | gesichert (mehrere Quellen) |
| Touch | CST816D, I2C: SDA 4, SCL 5, INT 0, RST 1 | **unbestätigt** – gegen Schaltplan/Board-Definition prüfen |
| Suffix `_i` | unbekannt | Händlerseite/Platinenaufdruck prüfen |

Quellen:
- <https://www.espboards.dev/esp32/cyd-esp32-2424s012/>
- <https://github.com/rzeldent/platformio-espressif32-sunton> (Board-Definition `esp32-2424S012C`, enthält Pins – **Touch-Pins dort nachlesen**)
- <https://forum.lvgl.io/t/implement-squareline-lvgl-project-to-esp32-2424s012-module-ga9a01-cst816d-drivers/13150>

Strapping-Pins GPIO2/8/9 nicht anderweitig belegen.

## 2. Was portiert wird (und was nicht)

**Portieren (TypeScript → C++):**
- `engine/fitness.ts` – Fitness-Funktion (Kern)
- `engine/types.ts` – nur die Typen, die `fitness` braucht (`Environment`, `Physics`)
- `world/population.ts` – Klasse `Population` inkl. `mulberry32`, `weights`, Generationsschritt
- `world/describe.ts` – Kurzbeschreibung des Wesens (für Textzeile auf dem Display)
- Parameter aus `app/core/physics-v2.json` (≈26 Gene/Traits, viele Konstanten)
  → per Skript in einen C++-Header `esp32/include/physics.h` generieren, **nicht** von Hand abtippen

**Nicht portieren:** Story, Katalog, Challenges, Orakel (`oracle/`), Training, Supabase, Koevolution/Symbiose (erst später, falls RAM reicht).

**Speicher-Budget:** Population als flaches `float`-Array `[N * numGenes]`, kein `std::vector<std::vector>`.
Start mit N = 100, numGenes aus physics-v2. 100 × 26 × 4 Byte ≈ 10 KB – unkritisch.
`double` → `float` ist erlaubt, aber Abweichung in Phase 2 messen.

## 3. Phasen (jede Phase = ein Commit, danach stoppen und Mensch testen lassen)

### Phase 1 – Board läuft (ca. 60–90 min)
- `esp32/platformio.ini`: Plattform espressif32, Framework arduino, Board aus rzeldent-Definition
  (oder `esp32-c3-devkitm-1` + eigene Pin-Defines), USB-CDC an.
- Libraries: `lvgl` (v8.3 oder v9, eine Version fest pinnen), Display-Treiber
  (`LovyanGFX` empfohlen, kennt GC9A01) und CST816-Treiber.
- LVGL-Buffer: 240 × 24 Zeilen, einfach gepuffert (kein PSRAM!).
- Testbild: Kreis + Text „Evolve“, Touch-Koordinaten über Serial ausgeben.
- **Done:** Bild sichtbar, Touch liefert plausible Koordinaten in allen vier Quadranten.

### Phase 2 – Simulationskern in C++ (ca. 240–360 min)
- `esp32/lib/evolve_core/` mit `fitness.cpp`, `population.cpp`, `rng.h` (mulberry32 bit-exakt, `uint32_t`).
- Generator-Skript `esp32/tools/gen-physics.mjs`: liest `app/core/physics-v2.json`, schreibt `physics.h`.
- **Paritätstest am PC** (wichtig, bevor irgendwas aufs Board geht):
  - Core zusätzlich als natives PlatformIO-Env (`[env:native]`) bauen.
  - Node-Skript `esp32/tools/parity.mjs`: ruft TS-Version (`npm run build`, dann `dist/…`) und
    C++-Binary mit identischem Seed + Umwelt auf, vergleicht Mittelwert-Genom nach 50 Generationen.
  - Vorlage für das Vorgehen: `tools/app-parity.mjs`.
- **Done:** RNG-Folge identisch; Fitness-Abweichung < 1e-4 je Genom; Mittelwert-Genom nach 50 Gen. Abweichung < 0.02.

### Phase 3 – Simulation auf dem Board (ca. 60 min)
- Ein Generationsschritt pro Sekunde in eigenem Task/Timer, LVGL im Loop.
- Serial-Log: Generation, mittlere Fitness, Laufzeit pro Schritt.
- **Done:** Schritt < 200 ms bei N = 100; Heap stabil über 10 min (`ESP.getFreeHeap()` loggen).

### Phase 4 – Runde Oberfläche (ca. 180–300 min)
- Mitte: Wesen als einfache Vektorform aus den Genen (Größe, Gliedmaßen, Panzer, Farbe).
  Orientierung an `world/describe.ts` / `engine/development.ts`, aber stark vereinfacht.
- Außenring: Umwelt-Regler als Bögen (`lv_arc`), Wischen am Rand = Regler wählen, Drehen = Wert.
- Unten kleine Textzeile: Generation + Kurzbeschreibung.
- Touch-Ziele ≥ 40 px; Display ist rund – nichts in die Ecken legen.
- **Done:** alle Regler per Touch bedienbar, Wesen ändert sich sichtbar binnen ~30 Generationen.

### Phase 5 – Speichern (ca. 45 min)
- Genom-Mittelwert, Umwelt, Generation alle 60 s in `Preferences` (NVS) sichern, beim Start laden.
- **Done:** Stromlos machen → Wesen und Regler sind nach Neustart wieder da.

## 4. Regeln für die Session

- Nur unter `esp32/` arbeiten. Bestehende Dateien nicht ändern (Ausnahme: dieser Doc-Link in `README.md`).
- Quelle der Wahrheit für Formeln ist der TS-Code, nicht `README.md` (Gen-Anzahlen dort sind veraltet).
- Nach jeder Phase: committen, kurz berichten, auf Bestätigung warten.
- Bei unklaren Pins: nicht raten, Mensch fragen bzw. Testsketch zum Scannen bauen (I2C-Scanner).
- Flashen: `pio run -d esp32 -t upload && pio device monitor -d esp32`.
