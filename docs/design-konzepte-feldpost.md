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

## Nachtrag: die beiden offenen Stellen geschlossen

Auf Nutzer-Wunsch („alles konsistent auf Feldpost") zwei weitere Runden:

### Rarität

`RARITY_META` (`app/index.html`) und die dazu parallel gepflegte `RTONE`-Tabelle
(Welt-Chronik, andere Schlüsselform „sehr selten" statt „sehr-selten" — historisch
getrennt, jetzt farblich synchron) trugen ein eigenständiges Lila/Blau/Grün/Braun-
Schema, unabhängig von den CSS-Tokens. Umgestellt auf dieselbe Feldpost-Ramp,
STEIGENDE Sättigung mit steigender Seltenheit:

| Stufe | vorher | jetzt | Kontrast gemessen |
|---|---|---|---|
| Häufig | `#6b5836` | `#5a4e32` (= `--muted`) | 5,9–7,5:1 |
| Gelegentlich | `#3d7d64` | `#0b4540` (= `--bio-dim`) | 7,8–9,9:1 |
| Selten | `#2f86ad` (Blau) | `#6e4e0c` (= `--gold-ink`) | 5,5–6,9:1 |
| Sehr selten | `#7d55c4` (Lila) | `#9a331c` (dunkle Koralle, neu) | 5,3–6,7:1 |
| Extrem selten | `#b07d1f` | `#5c1f42` (Pflaume, neu) | 8,7–11,1:1 |

Zwei neue Einzelfarben (dunkle Koralle, Pflaume) — bewusst NICHT als CSS-Token
eingeführt: `RARITY_META` war schon vor v4 eine eigene, von den Tokens getrennte
JS-Tabelle (Architektur-Entscheidung von vor dieser Umstellung, nicht angetastet).
Die drei „seltenen" Ränge im Lebensbaum (`.gb-tile.rar-*`, `style.css`) folgen
derselben Ramp, Ring 1px→2px, aber bewusst **ohne** eigenen Schlagschatten — im
dichten Kachel-Raster (bis zu 6 Kacheln je Reich) würde die volle Karten-Wucht
jeder Zeile zu Rauschen statt Auszeichnung.

### Generative Kreatur-Zeichnung

`drawAnimalSvg`/`drawPlantSvg`/`drawFungusSvg`/`drawMicrobeSvg`/`drawProtistSvg`
(~2500 Zeilen, alle fünf Reiche) bleiben inhaltlich unverändert — ihre
`mix()`-Berechnungen (Fell-, Blatt-, Panzerfarben aus Genom + Umwelt) sind
naturalistisch gemeint und sollen es bleiben: ein Fuchs soll braun bleiben, kein
Koralle-Ton. Was fehlte, war die Bildsprache, nicht die Farbe — eine dünne
Tinten-Kontur um jede gefüllte Fläche, dieselbe Sticker-Sprache wie das Chrome.

Statt ~150 Aufrufstellen einzeln zu ändern, EINE CSS-Regel:

```css
#creatureSvg :is(ellipse, path, polygon, circle, rect):not([fill="none"]) {
  stroke: var(--ink); stroke-width: 1.1; stroke-linejoin: round;
}
```

`:not([fill="none"])` lässt reine Linien-Pfade (Beine, Fühler, Spiralen — schon
mit eigener Stroke-Farbe gezeichnet) unberührt; CSS gewinnt sonst gegen
SVG-Präsentationsattribute und hätte deren Farbe überschrieben. Geprüft an 7
Bauplänen quer durch alle Reiche (Vierbeiner/Panzertier, Insekt, Vogel, Fisch,
Baum, Pilz-Kluster, Mikrobe/Radiolarie) per Playwright-Screenshot — trägt überall,
kein Reich fällt heraus.

Kompletter Prüfstand nach diesem Nachtrag erneut grün: `design-audit` (0
Verstöße, alle 12 Presets + 50 Gen-Mutationsfälle weiter fehlerfrei gezeichnet —
die neue Kontur-Regel ändert keine `getBBox()`-Maße), `ui-calm-check`,
`type-audit -- --strict`, `app-parity` (weiter `0.000e+0`), `key-check` (65
Formen/65 Äste/5 Reiche, alle Schlüssel lösen auf), `exemplar-check` (65
Archetypen, alle mit Wikipedia-Vorbild + Icon).

### Zusätzlich gefunden: zwei Kontur-Stufen

Beim Durchgehen fiel auf, dass ~18 VERSCHACHTELTE Elemente (Einfluss-Faktoren,
Welt-Orte, Genbuch-Kacheln, Herausforderungs-Zeilen, Login-Karte …) `border: 1px
solid var(--line[-soft])` direkt setzen, nicht über `--shadow*`. Sie erben die neue
Tinte-Farbe automatisch, aber nicht das dickere Gewicht. Bewusst NICHT auf die
volle Karten-Kontur gehoben (das würde in dichten Listen/Rastern zu Rauschen
werden), aber von 1px auf 2px verstärkt — zwei Stufen mit Absicht:
Karten/Buttons volle Tinten-Kontur + Schlagschatten, verschachtelter Inhalt nur
dickere Tinte-Linie. Kommentar dazu im Datei-Kopf von `style.css`.

## Was weiterhin bewusst nicht angefasst wurde

- **Schriften**: kein Futura verfügbar (nur Archivo variabel + JetBrains Mono
  selbst gehostet, kein CDN). Die „Plakat"-Wirkung kommt aus Archivos `wght`/`wdth`-
  Achsen (`--w-black`, `--wd-display`), nicht aus einer neuen Schriftfamilie —
  bewusste Anpassung des Mockup-Konzepts an die bestehende Font-Pipeline.

## Nachschlagen

Die drei ursprünglichen Artifact-Mockups (Sammlungsschrank/Genom-Konsole/Feldpost
im Vergleich, plus das systemweite Feldpost-Mockup mit Reglern/Presets) sind nicht
Teil des Repos — sie waren Entscheidungshilfen, kein Bauplan. Maßgeblich für den
tatsächlichen Stand ist `app/style.css` selbst.
