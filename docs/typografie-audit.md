# Typografie-Audit — Blick moderner Game-Apps

> ## Status: umgesetzt
>
> Die Empfehlungen aus Abschnitt 5 sind eingebaut. Auf Wunsch des Nutzers **nicht**
> mit einer organischen Display-Serif (der erste Vorschlag war Fraunces), sondern mit
> einer geometrischen Grotesk: **Archivo** (variabel, `wght` + `wdth`) trägt Display
> *und* UI, **JetBrains Mono** nur noch die Ziffern-Readouts. Beide selbst gehostet
> unter `app/fonts/` (120 KB zusammen, latin-Subset, kein CDN).
>
> | Messung | vorher | nachher |
> | --- | --- | --- |
> | sichtbarer Text < 12 px | 65–68 % | **0 %** |
> | sichtbarer Text < 11 px | 42–48 % | **0 %** |
> | kleinster Grad | 9,9 px | **12 px** |
> | distinkte Größen (sichtbar) | 15 | **8** |
> | distinkte Typo-Kombinationen | 30–34 | **22** |
> | Monospace-Anteil | 47 % | **9 %** |
> | `var(--mono)`-Regeln | 37 | **8** |
> | Bedienelemente auf Browser-Schrift | 28 / 71 | **0 / 71** |
> | Gen-Labels mit Überlauf | 1 (+32,7 px) | **0** |
> | Gen-Labels zweizeilig | 3 | **0** |
> | Passungs-Zahl | 11,2 px | **38 px** |
> | Skalen-Kontrast | 3,0 : 1 | **3,7 : 1** |
>
> Nachprüfbar mit `npm run type-audit`; `npm run type-check` ist dasselbe als Gate
> (Exit 1 bei Text < 12 px, > 10 Größen, Bedienelement auf Browser-Schrift oder
> Label-Überlauf). `npm run ui-calm-check` läuft weiterhin durch.
>
> **Ehrlich bleiben bei zwei Punkten:**
> 1. Der Skalen-Kontrast liegt bei 3,7 : 1 und damit noch unter den 5–8 : 1 aus
>    Abschnitt 3.3. Das ist teilweise Arithmetik: die Untergrenze von 9,9 auf 12 px zu
>    heben *staucht* das Verhältnis zwangsläufig. Der Boden war das wichtigere Problem;
>    ein größerer Kontrast wäre nur über eine noch größere Display-Stufe zu holen und
>    das sollte eine gestalterische Entscheidung sein, keine Kennzahl-Kosmetik.
> 2. `Austrocknungs-Tol.` und `Stickstoff-Fix.` sind in den Daten **weiterhin
>    abgekürzt**. Abschnitt 4.1 kritisiert das, aber ausgeschrieben passen sie auch in
>    der proportionalen Grotesk nicht einzeilig in die 118-px-Spalte — sie
>    auszuschreiben würde die zweizeiligen Zeilen wieder einführen, die gerade
>    beseitigt wurden. Offen, bewusst.

**Anlass** (Nutzer, 2026-07): *„die wirkt irgendwie nicht so cool."*

Das ist ein präzises Gefühl mit einer messbaren Ursache. Die Palette („Klippenlicht",
warmes Papier + Aubergine) ist bewusst gesetzt und gut. Was die App wie ein
**Museums-Schild oder ein Laborprotokoll** aussehen lässt und nicht wie ein Spiel,
ist die *typografische Stimme* — nicht die Farbe, nicht das Layout.

Dieses Dokument belegt das in Zahlen, benennt die Defekte und schlägt ein System vor.

---

## 1. Methode

Alle Zahlen sind **gemessen, nicht geschätzt**: die App wird geladen, die Simulation
läuft, dann werden die *berechneten* Stilwerte (`getComputedStyle`) jedes sichtbaren
Text-Elements ausgelesen. Reproduzierbar mit:

```
npm i --no-save playwright-core
node tools/type-audit.mjs
```

Basis: `app/style.css` (166 `font-size`-Deklarationen), `app/index.html`
(0 Inline-Typografie — die gesamte Typografie liegt sauber in einer Datei, das ist
die gute Nachricht). Gemessen bei 1280 px und 390 px Breite.

---

## 2. Befund in Zahlen

> Zur Streuung: die Simulation läuft während der Messung, darum ist bei jedem Lauf
> ein anderes Wesen und ein anderer Satz Panels sichtbar. Die **CSS-Werte** (166
> Deklarationen, 33 Größen, 37 Mono-Regeln) sind stabil; die **Sicht-Anteile**
> schwanken um wenige Prozentpunkte. Unten stehen die Spannen aus mehreren Läufen.

| Messung | Wert | Bewertung |
| --- | --- | --- |
| `font-size`-Deklarationen in `style.css` | 166 | |
| **distinkte** Größenwerte im Stylesheet | **33** | keine Skala, sondern Einzelfallentscheidungen |
| distinkte Größen *gleichzeitig sichtbar* | 15 | in einem einzigen Screen |
| distinkte Typo-Kombinationen sichtbar | 30–34 (bei 84–87 Text-Elementen) | fast jedes Element ein Sonderfall |
| Sichtbarer Text **< 12 px** | **65–68 %** | |
| Sichtbarer Text **< 11 px** | **42–48 %** | unter jedem Mobil-Richtwert (iOS 11 pt / Android 12 sp) |
| Kleinster sichtbarer Text | **9,9 px** (`kalt`, `heiß`, Regler-Enden) | |
| Größter sichtbarer Text | 29,4 px (Wortmarke) | |
| Skalen-Kontrast größte : kleinste | **3,0 : 1** | Game-Apps liegen bei 5–8 : 1 |
| Elemente über 16 px | **3–4** | es gibt keine visuelle Spitze |
| `font-family: var(--mono)` | **37 Regeln** | |
| `font-family: var(--sans)` | 6 Regeln | |
| `font-family: var(--serif)` | 9 Regeln | |
| distinkte `line-height`-Werte | 11 | |
| distinkte `letter-spacing`-Werte | **14** (−.01em … .2em) | kein Tracking-System |
| `text-transform`-Regeln | 22 | Versalien ohne einheitliche Laufweite |
| `font-variant-numeric: tabular-nums` | **2** | bei einer App, die permanent Zahlen aktualisiert |
| Formular-Elemente ohne App-Schrift | **28 / 71 = 39 %** | fallen auf die Browser-Standardschrift zurück |

---

## 3. Warum es nicht „cool" wirkt — acht Punkte gegen moderne Game-Apps

### 3.1 Monospace ist die *Hauptstimme*, nicht das Gewürz

`--mono` in **37 Regeln**, `--sans` in **6**. Am gerenderten Bild gemessen laufen
**47 % aller sichtbaren Text-Elemente in Monospace** (gegen 46 % Grotesk). Die
Gen-Labels, die Regler-Werte, die Buttons, die Brotkrumen, die Chronik-Marker —
alles Monospace.

In Spiel-UIs signalisiert Monospace „Terminal / Sci-Fi-Readout / Debug-Ausgabe" und
wird für ~5 % des Textes eingesetzt. Hier trägt sie die Mehrheit. **Das ist der
größte Einzelgrund, warum die Oberfläche wie ein Laborprotokoll liest und nicht wie
ein Spiel.** Ein Button mit der Aufschrift `Umwelt-Einfluss auslösen ↗` in
Monospace liest sich wie ein Konsolenbefehl, nicht wie eine Handlung.

Erschwerend: **Monospace ist für Deutsch die schlechteste Wahl.** Komposita werden
gnadenlos breit — siehe Defekt 4.1.

### 3.2 Georgia Italic ist keine Entscheidung, sie ist der Rückfallwert

```css
--serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
```

Die Wortmarke, der Artname („*Flechte · Symbiose*"), das Zitat, die Chronik: alles
Georgia kursiv. Georgia ist die Schrift, die man bekommt, wenn man keine gewählt hat
— sie sagt „Zeitungsartikel, 2004". Moderne Game-Apps haben eine **Display-Schrift
mit Charakter**; das Gesicht *ist* die Identität (Mini Metro, Monument Valley,
Dorfromantik, Balatro). Kursive Transitional-Serif sagt „Fachaufsatz".

### 3.3 Kein Skalen-Kontrast — alles liegt im 10–13-px-Brei

Rund zwei Drittel des Textes unter 12 px, nur 3–4 Elemente über 16 px. Bei einem
Kontrast von **3,0 : 1** zwischen größtem und kleinstem Grad ist die Seite
typografisch fast eintönig. Spiel-Oberflächen leben von
**Sprüngen**: der Zustand ist riesig, das Chrome winzig. Hier ist alles ungefähr
gleich klein, weshalb das Auge keinen Einstieg findet und die Seite „flach" und
„zaghaft" wirkt.

### 3.4 Die Spielzahlen sind der *kleinste* Text auf der Seite

Das ist der eigentliche Skandal für eine Game-App:

| Wert | ist gerade | sollte sein |
| --- | --- | --- |
| Passung `3 %` — die zentrale Fitness-Aussage | **11,2 px** Mono | Held der Karte, ~40 px |
| `Generation 25` | 11,8 px Mono | prominent, tabellarisch |
| Gen-Werte `0.50` | 11,5 px Mono | 14 px, tabellarisch |

In einem Spiel sind Score, Level und Prozent die typografischen Protagonisten. Hier
sind sie Fußnoten. **Die App verschweigt flüsternd genau das, worum es geht.**

### 3.5 Zahlen zittern, weil `tabular-nums` fehlt

Nur **2** Regeln setzen `font-variant-numeric`. Die App aktualisiert permanent
Zahlen (Regler-Werte, Passung, Generation). Ohne Tabellenziffern ändert sich mit
jeder Ziffer die Breite, und die Zeile ruckelt.

Das ist genau das Problem, für das dieses Repo `tools/ui-calm-check.mjs` gebaut hat
(„eine Anzeige, die schneller wechselt, als man lesen kann, ist keine Information,
sondern Unruhe") — nur in seiner *typografischen* Form. Die Wechselrate ist
gezähmt, die Ziffernbreite nicht.

### 3.6 Die Hierarchie ist an einer Stelle invertiert

Im „Umwelt formen"-Panel:

| Element | Größe |
| --- | --- |
| Panel-Titel `UMWELT FORMEN` | 11,5 px |
| Beschreibung darunter | 12,5 px |
| Regler-Label `Temperatur` | **13,1 px** |

Der Titel ist das **kleinste** Element seines eigenen Panels. Er trägt nur durch
Versalien und Fettung, nicht durch Größe — das ist zu wenig, um als Überschrift zu
lesen.

### 3.7 `line-height: 1.5` gilt auch für Display-Größen

`body` setzt `1.5`, und die Wortmarke erbt es: 25,6 px Schrift mit **38,4 px**
Zeilenabstand, die 29,4-px-Marke mit 44,2 px. Display-Typografie braucht
1,0–1,15 — sonst wirkt der Titel schlaff und ungestaltet. 11 verschiedene
`line-height`-Werte im Rest der Datei zeigen, dass hier nach Gefühl korrigiert
wurde, statt Rollen zu definieren.

### 3.8 Versalien ohne System

**14** verschiedene `letter-spacing`-Werte (−.01em, .01, .02, .03, .04, .05, .08,
.09, .1, .12, .16, .18, .2em, 0) über **22** `text-transform`-Regeln. Gesperrte
Versalien sind ein starkes Game-UI-Mittel — aber nur, wenn *eine* Laufweite
konsequent benutzt wird. 14 Werte lesen sich als Zufall, nicht als Handwerk.

### 3.9 Nachtrag: die Wortmarke kollidiert mit sich selbst

```css
.brand   { font-family: var(--serif); font-style: italic; font-size: 1.6rem; }
.brand b { font-family: var(--sans); font-weight: 900; font-size: 1.15em; }
```

„**Evolve**" in ultrafetter System-Grotesk (29,4 px) direkt neben „*· Bio-Kammer*"
in kursiver Georgia (25,6 px) — zwei Schriften mit unvereinbarem Ton, fast gleich
groß, also ohne klare Über-/Unterordnung. Dazu: **`font-weight: 900` auf
`system-ui` ist plattformabhängig.** Segoe UI (Windows) hat kein 900 und fällt auf
Bold zurück; macOS liefert Black. Die Wortmarke — das eine Element, das überall
identisch aussehen muss — sieht auf jedem Betriebssystem anders aus.

---

## 4. Konkrete Defekte (keine Geschmacksfrage)

### 4.1 Gen-Label wird abgeschnitten — verursacht durch Monospace

```css
.gene     { grid-template-columns: 92px 1fr 14px 30px; }
.gene .lbl{ font-family: var(--mono); font-size: .66rem; }
```

Gemessen, bei aufgeklappter Gen-Liste:

```
UEBERLAEUFT die Spalte (1):
  + 32.7px  "Strahlungsresistenz"  (Text 124.7px in 92px Spalte)

Bricht auf 2 Zeilen -> ungleiche Zeilenhoehe (3):
  31.7px hoch  "Sauerstoff-Effizienz"
  31.7px hoch  "Austrocknungs-Tol."
  31.7px hoch  "Stickstoff-Fix."
```

`Strahlungsresistenz` braucht 124,7 px in einer **fixen 92-px-Spalte** und läuft
sichtbar in den Balken. Drei weitere Labels brechen zweizeilig und machen die
Zeilenhöhen ungleich. Ursache ist die Monospace-Laufweite (~0,6 em pro Zeichen);
eine proportionale Grotesk setzt dasselbe Wort bei 13 px in ~108 px.

Dass `Austrocknungs-Tol.` und `Stickstoff-Fix.` in den Daten schon *abgekürzt*
sind, zeigt: hier wurde bereits am Inhalt herumgeschnitten, um ein
Typografie-Problem zu umgehen.

### 4.2 39 % aller Bedienelemente benutzen die Browser-Schrift

Es gibt **keinen** `button, input { font: inherit }`-Reset. Formular-Elemente erben
`font-family` nicht — gemessen:

```
Formular-Elemente gesamt: 71
mit App-Schrift:          43
mit BROWSER-Standard:     28

   12x  Arial | biome      (alle Preset-Buttons: „Eiszeit", „Räuberland", …)
    6x  Arial | submit
    3x  Arial | speed      („langsam" / „normal" / „schnell")
    6x  Arial | range
    1x  Arial | wl-chron-toggle
```

Die zwölf Biom-Presets, die drei Geschwindigkeits-Pillen und sechs Absende-Buttons
laufen in Arial (Linux) bzw. Helvetica/Segoe je nach System — bei 13,33 px
UA-Standard, also in einer Größe, die in *keiner* Regel steht. **Ein einziger
CSS-Block behebt alle 28.**

### 4.3 Keine fluide Typografie

Null `clamp()` in der Datei. Mobil (390 px Breite) ist jede Größe identisch zum
Desktop — die 9,9-px-Reglerenden und die 10,6-px-Gen-Labels treffen auf dem Handy
denselben Wert, wo sie am wenigsten funktionieren. Gleichzeitig hat die Wortmarke
auf dem Handy dieselben 29,4 px wie auf 1280 px, obwohl dort Platz für eine echte
Titelgröße wäre.

### 4.4 Kursive Serif für Fließtext

`.hint` und `.chron-log .ct` setzen mehrzeilige Sätze in kursive Georgia. Kursiv ist
eine **Auszeichnung**, kein Textstil; über mehrere Zeilen sinkt die Lesegeschwindigkeit
messbar. Die Chronik ist eine Leseliste — sie ist der falsche Ort dafür.

---

## 5. Empfehlung: ein Typo-System

Die Palette bleibt. Nur die Stimme wird ersetzt.

### 5.1 Schriftwahl — drei Rollen, klar getrennt

Alle drei sind OFL-lizenziert, als variable `woff2` selbst hostbar (kein CDN, passt
zum offline-fähigen Aufbau der App):

Der erste Vorschlag war eine organische Display-Serif (Fraunces). Der Nutzer wollte
es **weniger organisch** — umgesetzt ist daher die geometrische Variante:

| Rolle | Umgesetzt | Warum |
| --- | --- | --- |
| **Display** — Wortmarke, Artname, Panel-Titel | **Archivo**, `wdth` 112 %, `wght` 700–800 | geometrische Grotesk, flach und graphisch — passt genau zur Siebdruck-Richtung; leicht expandiert + schwer liest „modernes Spiel", ohne Ornament oder Eigenwilligkeit |
| **UI / Text** — Labels, Buttons, Fließtext | **Archivo**, `wdth` 100 %, `wght` 400–700 | dieselbe Datei: die Display-Stimme entsteht aus der **Breitenachse**, nicht aus einer zweiten Familie. Eine Schrift, zwei Stimmen, ~90 KB |
| **Daten** — nur Ziffern-Readouts | **JetBrains Mono** | echte Tabellenziffern, sachlich statt retro-verspielt (darum nicht Space Mono); als *Gewürz* auf 9 % des Textes reduziert |

Der Trick ist die `wdth`-Achse: sie liefert den Display-Kontrast, ohne eine zweite
Schriftfamilie einzuführen — daher nur **zwei** Dateien für drei Stimmen.

> Wichtig: Der Effekt kommt zu ~70 % aus **Punkt 5.2/5.3 (Skala, Rollen,
> Mono-Rückbau)**, nicht aus der Schriftdatei. Wer keine Webfonts einbinden will,
> gewinnt schon sehr viel, indem nur Skala und Mono-Anteil saniert werden.

### 5.2 Skala — 33 Werte auf 8 Stufen

Verhältnis ≈ 1,2, **Untergrenze 12 px**. Die Zuordnung deckt alle 166 heutigen
Deklarationen ab:

```css
:root {
  --fs-meta:    0.75rem;                        /* 12px — nur gesperrte Versalien   (heute 22 Regeln, .56–.64rem) */
  --fs-xs:      0.8125rem;                      /* 13px — Gen-Labels, Chips         (heute 43 Regeln, .66–.71rem) */
  --fs-sm:      0.875rem;                       /* 14px — Standard-Label, Werte     (heute 46 Regeln, .72–.78rem) */
  --fs-base:    1rem;                           /* 16px — Fließtext                 (heute 31 Regeln, .8–.88rem)  */
  --fs-md:      1.0625rem;                      /* 17px                             (heute 10 Regeln, .9–.96rem)  */
  --fs-lg:      1.25rem;                        /* 20px                             (heute  4 Regeln, 1–1.05rem)  */
  --fs-xl:      clamp(1.5rem, 3vw, 1.875rem);   /* Panel-Titel                      (heute  5 Regeln, 1.15–1.4rem)*/
  --fs-display: clamp(2rem, 5vw, 2.75rem);      /* Wortmarke, Artname               (heute  4 Regeln, 1.5–1.6rem) */

  --fs-num-hero: clamp(2rem, 6vw, 3rem);        /* NEU: die Passungs-Zahl */
}
```

### 5.3 Rollen-Tokens statt Einzelfälle

```css
:root {
  /* Zeilenabstand nach Rolle — ersetzt 11 Streuwerte */
  --lh-display: 1.05;   /* Wortmarke, Artname */
  --lh-snug:    1.25;   /* Titel, Buttons */
  --lh-body:    1.55;   /* Fließtext, Chronik */
  --lh-data:    1;      /* Ziffern-Readouts */

  /* Laufweite nach Rolle — ersetzt 14 Streuwerte */
  --tr-display: -0.02em;
  --tr-tight:   -0.01em;
  --tr-normal:  0;
  --tr-caps:     0.09em;   /* EINE Laufweite für ALLE 22 Versal-Regeln */

  /* Gewichte — 900 und 600 entfallen (600 vs. 700 ist bei 11px nicht unterscheidbar) */
  --w-regular: 400;
  --w-medium:  500;
  --w-bold:    700;
  --w-black:   800;
}
```

### 5.4 Vier Eingriffe mit dem besten Verhältnis von Aufwand zu Wirkung

**a) Der Ein-Zeilen-Fix für 28 Bedienelemente**

```css
button, input, select, textarea { font: inherit; letter-spacing: inherit; }
```

**b) Zahlen ruhigstellen — global statt an 2 Stellen**

```css
:root { font-variant-numeric: tabular-nums; }
```

**c) Mono zurückbauen: 37 → ~6 Regeln.** Monospace nur noch für reine
Ziffern-Readouts (`.gene .num`, `.lever .val`, `.gen-readout`, `%`-Werte) und die
Versionszeile. Alles Sprachliche — Gen-Labels, Buttons, Brotkrumen, Chronik-Marker,
Chips — auf `--sans` mit `--w-medium`. Das behebt gleichzeitig Defekt 4.1 und ist
der Eingriff, der den „Laborprotokoll"-Eindruck kippt.

Für die Gen-Labels zusätzlich:

```css
.gene     { grid-template-columns: 112px 1fr 14px 34px; }
.gene .lbl{ font-family: var(--sans); font-size: var(--fs-xs); font-weight: var(--w-medium);
            hyphens: auto; }
```
… und `lang="de"` am `<html>`, damit die Silbentrennung überhaupt greift. Danach
können `Austrocknungs-Tol.` und `Stickstoff-Fix.` in den Daten wieder ausgeschrieben
werden.

**d) Die Passungs-Zahl zum Helden machen.** `3 %` von 11,2 px Mono auf
`--fs-num-hero` mit `--lh-data` und Tabellenziffern. Das ist der einzelne Eingriff,
der am stärksten „Spiel" statt „Datenblatt" sagt — die Karte bekommt endlich eine
Spitze.

---

## 6. Umsetzung in Stufen

Jede Stufe ist eigenständig auslieferbar und sichtbar besser als die vorige.

| Stufe | Inhalt | Risiko |
| --- | --- | --- |
| **1** | `font: inherit`-Reset (4.2) · `tabular-nums` global (3.5) · `line-height` für Display (3.7) | minimal, rein additiv |
| **2** | Skalen- und Rollen-Tokens einführen, 166 Deklarationen darauf mappen · eine Versal-Laufweite | mittel, mechanisch |
| **3** | Mono-Rückbau 37 → 6 · Gen-Label-Spalte + Silbentrennung (4.1) · Passungs-Zahl als Held (5.4d) | mittel, hier kippt der Eindruck |
| **4** | Webfonts selbst hosten (Fraunces + Space Grotesk + Space Mono), Wortmarke neu setzen (3.9) | höher: Ladeverhalten, `font-display: swap`, Laufweiten neu justieren |
| **5** | Fluide Größen mobil verifizieren (4.3) | klein |

Sinnvolle Absicherung im Stil dieses Repos: `tools/type-audit.mjs` als Gate
erweitern — **kein sichtbarer Text unter 12 px, höchstens 10 distinkte
Größenwerte, kein Formular-Element auf Browser-Schrift.** Dann kann die Skala nicht
wieder auseinanderlaufen, so wie `ui-calm-check` die Wechselrate festhält.

---

## 7. Was ausdrücklich *nicht* geändert werden sollte

- **Die Palette.** Warmes Papier + Aubergine + Ringelblumen-Akzent ist eigenständig
  und trägt. Der AA-Kontrast ist in `:root` dokumentiert nachgerechnet — beim
  Vergrößern der Schriften wird er nur besser.
- **Der Ein-Akzent-Grundsatz** (`--accent` nur für neu erworbene Merkmale). Das ist
  Disziplin, die viele Game-UIs vermissen lassen.
- **Die flache Siebdruck-Richtung** (keine Verläufe, 1px-Konturen). Sie ist
  aktueller als jede Neomorph-Tiefe.
- **Dass die gesamte Typografie in einer Datei liegt.** 0 Inline-Styles in
  364 KB `index.html` ist der Grund, warum dieses Audit überhaupt in wenigen
  Stunden umsetzbar ist.

Das Problem ist nicht, dass die App schlecht gestaltet wäre. Sie ist als
**Naturkunde-Dokument** gestaltet — sorgfältig und konsequent. Sie soll aber ein
**Spiel** sein. Das ist ein Wechsel der typografischen Stimme, nicht ein Redesign.
