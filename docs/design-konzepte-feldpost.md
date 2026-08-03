# Design v4 „Feldpost" — Entscheidung und Umsetzung

## Herkunft

Anlass war die Frage nach einem künstlerisch eigenständigeren Design für die App.
Recherchiert an aktuellen Auszeichnungen und Trendberichten (Apple Design Awards
2026, Awwwards Site of the Year 2025, IGF-Trendberichte, aktuelle UI-Trendanalysen
zu Editorial/Maximalismus/Neubrutalismus) wurden drei eigenständige Richtungen
gebaut und als Artifacts vorgelegt:

1. **Sammlungsschrank** — Naturkundemuseum, dunkles Schubladen-Holz, Messing-Ruler
   statt Fortschrittsbalken.
2. **Genom-Konsole** — Laborinstrument/Genom-Browser, Mono als Hauptschrift,
   25-Gen-Ring, Phosphor-Glühen.
3. **Feldpost** — Riso-Feldführer/Sticker-Album, dicke Tinten-Kontur, Stempel,
   plakative Großschrift.

Nutzer-Entscheidung: **Feldpost**. Passt am besten zur vorhandenen
„Schnappschuss teilen"-Funktion und ist am weitesten von der bisherigen
Zurückhaltung entfernt — bewusst gewählter Kontrast, kein Zufall.

## Umsetzung: Token-Kaskade statt Component-für-Component

`app/style.css` war bereits (Design v3 „Klippenlicht") vollständig auf CSS-Custom-
Properties aufgebaut — Farbe, Schatten UND der „Rahmen" jeder Karte/jedes Buttons
liefen schon über `var(--shadow)`/`var(--shadow-sm)`/`var(--shadow-inset)`
(`box-shadow: 0 0 0 1px var(--line)` als Hairline-Ersatz für `border`). Das war der
Hebel: die Token-NAMEN blieben unverändert (hunderte Aufrufstellen), nur die WERTE
wechselten —

```css
--shadow:        0 0 0 1px var(--line)      →  0 0 0 3px var(--ink), 5px 5px 0 var(--ink)
--shadow-sm:      0 0 0 1px var(--line-soft) →  0 0 0 2px var(--ink), 3px 3px 0 var(--ink)
--shadow-inset:   inset 0 0 0 1px var(--line-soft) → inset 0 0 0 2px var(--ink), inset 0 2px 4px rgba(33,30,25,.3)
```

— und jede Karte, jeder Regler, jeder Preset-Button, jede Chip bekam die dicke
Tinten-Kontur + den versetzten Schlagschatten **ohne eigene Änderung**. Dazu die
Palette (Aubergine/Lila → Kraftpapier/Koralle/Petrol/Ocker, gleiche Rollen-Namen)
und vier gezielte Einzeländerungen:

- `.kingdom`: Text → gefüllte Briefmarke (Petrol-Fläche, helle Schrift)
- `.species`: `--w-bold` → `--w-black` (Plakat-Gewicht)
- `.vit-fill`: `--bio-dim` → `--accent` (Ocker) — die Passung ist die
  Erfolgs-Kennzahl der Karte, verdient die Akzentfarbe
- `.gen-readout`/`.biome-tag`: Hairline-Border → `var(--shadow-sm)` (dieselbe
  Sticker-Sprache wie alle anderen Chips)
- `.panel`: 20px → 14px Radius (knapper, damit die Kontur wie ein Aufkleber-Rand
  liest, nicht wie ein Neomorph-Polster)

## Palette (gemessen, nicht geraten)

Kontrast mit derselben Formel wie `tools/design-audit.mjs` nachgerechnet, bevor der
Check lief — jede Text-Rolle mit Sicherheitsabstand über AA (4,5:1 normal, 3:1 groß):

| Token | Wert | Rolle | Kontrast gemessen |
|---|---|---|---|
| `--text` | `#211e19` | Fließtext | 15,1:1 auf `--chamber` |
| `--muted` | `#5a4e32` | gedämpfter Text | 5,9:1 auf `--bg-top` · 7,4:1 auf `--chamber` |
| `--bio-dim` | `#0b4540` | Petrol, Text-Rolle | 9,9:1 auf `--chamber` · 9,8:1 als Fläche unter `#fbf3dd` |
| `--gold-ink` | `#6e4e0c` | Rarität, Text-Rolle | 6,9:1 auf `--chamber` · 5,5:1 auf `--bg-top` |
| `--warn` | `#7a5013` | Warnung, Text-Rolle | 5,0:1 auf `--bg-top` |
| `--danger` | `#8c2a1c` | Gefahr, Text- UND Flächen-Rolle | 7,8:1 auf `--chamber` · 7,7:1 als Fläche unter `#fbf3dd` |
| `--ember`, `--accent`, `--gold`, `--bio` | Koralle/Ocker/Petrol | **nur** Flächen/Rand/Fill — keine Aufrufstelle nutzt sie als Schriftfarbe, daher kein AA-Zwang |

Ein Fund unterwegs: `.kingdom` sollte ursprünglich `--bio` (helle Petrol-Fläche) mit
heller Schrift tragen — `design-audit` fing das sofort (3,75:1, zu hell). Korrigiert
auf `--bio-dim` (9,8:1). Genau der Fall, für den der Check existiert.

## Geprüft, bevor es eingebaut wurde

- **Kontrast:** `npm run design-audit` — 8 Ansichten (Hauptbildschirm, Lebensbaum,
  Herausforderungen, Presets, Umwelt-Einfluss, Details, Aussterbe-Warnung ×2),
  0 Verstöße (vorher ebenfalls 0 — kein Rückschritt).
- **Zeichnung:** alle 12 Presets + 6 Extremregler + 25 Gene × 2 Extremwerte
  zeichnen weiter fehlerfrei (dieselbe `design-audit`-Stufe 2/3).
- **Ruhe der Anzeige:** `npm run ui-calm-check` — Wechselrate unverändert im
  Richtwert (≤ 6 Wechsel/12 s).
- **Typografie-Skala:** `npm run type-audit -- --strict` — Skala, Schriftrollen,
  Gen-Label-Spaltenbreite weiter konsistent, kein Überlauf.
- **Fitness-Kopie unberührt:** `node tools/app-parity.mjs` — max Abweichung
  App↔Engine weiterhin `0.000e+0` (reiner CSS-Eingriff, keine Logik angefasst).
- **Lange Artnamen:** gegen die 8 längsten echten Katalog-Namen geprüft (bis 49
  Zeichen, z. B. „Roseinatronobacter bogoriensis subsp. bogoriensis") in einer
  isolierten Fixture mit dem echten `app/style.css` — `text-wrap: balance` fängt
  sie in 2–3 Zeilen ab, kein Overflow, auch mit dem neuen `--w-black`.
- **Alle fünf Reiche visuell durchgeklickt** (Screenshots, Playwright/Chromium
  headless): Protist, Pflanze, plus die bestehenden Presets/Lebensbaum/
  Herausforderungen/Umwelt-Einfluss-Modals — Palette und Kontur tragen konsistent
  durch, keine Bildschirm-eigene Ausnahme gefunden.

## Was bewusst NICHT angefasst wurde

- **Die generative Kreatur-Zeichnung** (`drawAnimalSvg`/`drawPlantSvg`/… in
  `app/index.html`) bleibt unverändert — sie nutzt schon reine Flächenfarben ohne
  Verlauf/Blur, was zur Feldpost-Idee passt, aber ihre eigenen `mix()`-Berechnungen
  (Habitat-/Fell-/Blattfarben) sind ein eigenes System, keine CSS-Tokens. Das ist
  ein separates Vorhaben.
- **Die Rarität-Farben** (`RARITY_META` in `app/index.html`, plus
  `.gb-tile.rar-*` in `style.css`) sind ein **eigenständiges, hart codiertes**
  Farbschema (Lila/Blau/Grün/Braun) — nicht über die neuen Tokens erreichbar, beim
  Lebensbaum-Screenshot sichtbar geblieben. Trägt noch die alte Farbwelt. Eigener
  Umbau nötig, wenn das auch auf Feldpost soll.
- **Schriften**: kein Futura verfügbar (nur Archivo variabel + JetBrains Mono
  selbst gehostet, kein CDN). Die „Plakat"-Wirkung kommt aus Archivos `wght`/`wdth`-
  Achsen (`--w-black`, `--wd-display`), nicht aus einer neuen Schriftfamilie —
  bewusste Anpassung des Mockup-Konzepts an die bestehende Font-Pipeline.

## Nachschlagen

Die drei ursprünglichen Artifact-Mockups (Sammlungsschrank/Genom-Konsole/Feldpost
im Vergleich, plus das systemweite Feldpost-Mockup mit Reglern/Presets) sind nicht
Teil des Repos — sie waren Entscheidungshilfen, kein Bauplan. Maßgeblich für den
tatsächlichen Stand ist `app/style.css` selbst.
