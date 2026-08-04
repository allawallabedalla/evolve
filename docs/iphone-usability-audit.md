# iPhone-Usability-Audit — Live-App (`app/`)

**Auftrag (Nutzer, 2026-08-04):** „Mach mal eine Usability-Analyse am iPhone." Getestet wurde
die deployte Live-App (`app/index.html` + `app/style.css`), nicht der archivierte `mockup/`.

> **Update (2026-08-04, selber Tag):** alle 5 Befunde unten wurden auf diesem Branch angefasst —
> Details je Befund als „**Status:**"-Zeile direkt unter der jeweiligen Überschrift. Kurzfassung:
> Befunde 2–5 sind behoben und per Playwright + `npm run design-audit`/`ui-calm-check`
> re-verifiziert (0 Kontrastverstöße, keine JS-Fehler). Befund 1 ist **entschärft, nicht
> vollständig gelöst** — eine echte Lösung (Reihenfolge der Blöcke ändern) hätte das Karten-Markup
> quer über Mobil/Desktop umgebaut und wäre ein eigener, riskanterer Schritt gewesen; s. Status-
> Zeile dort für die Zahlen und die offene Restarbeit.

Ziel dieses Dokuments ist eine **Bestandsaufnahme**, keine beschlossene Umsetzung — analog zu
`komplexitaets-audit.md` und `typografie-audit.md`. Ein Teil der iPhone-Grundlagen ist bereits
sauber gelöst (s. „Was schon funktioniert" unten); dieser Bericht sammelt den Rest.

---

## Methodik

Getestet mit `playwright-core` (bereits Dev-Dependency, s. `tools/design-audit.mjs`) gegen
Chromium unter `/opt/pw-browsers`, mit dessen **Mobil-Geräte-Emulation** (Touch, User-Agent,
Device-Pixel-Ratio, Viewport):

- **iPhone 14 Pro**, Hochformat, **393×660** — das ist die reale Nutzfläche *mit* eingeblendeter
  Safari-Symbolleiste (Playwrights Preset zieht die UI-Chrome-Höhe bereits vom vollen
  852px-Bildschirm ab). Das ist der Normalfall beim Öffnen eines Links, nicht die
  Ausnahme — darum als Hauptszenario gewählt statt der vollen 852px.
- **iPhone SE (3. Gen.) / iPhone 13 Mini**, **375×667** — schmalster aktuell verkaufter/
  unterstützter iPhone-Formfaktor.
- **iPhone SE (1. Gen., 2016)**, **320×568** — nur zur Gegenprobe, ob sich ein Befund bei 375px
  schon bei 320px ankündigt; als aktuelles Zielgerät nicht mehr relevant (seit 2018 nicht mehr
  verkauft).
- Quer-Format SE 667×375, als engster Kombinationsfall.

Geprüft wurden u. a.: `getBoundingClientRect()` aller sichtbaren interaktiven Elemente gegen die
44×44px-Touch-Ziel-Empfehlung (Apple HIG), horizontaler Overflow (`document.documentElement.
scrollWidth` vs. `clientWidth`), `matchMedia("(pointer: coarse)")`, Eingabefeld-Schriftgrößen
(iOS zoomt bei Fokus auf `<16px` automatisch in die Seite hinein), `env(safe-area-inset-*)`-
Nutzung im Stylesheet, sowie reale Touch-Drag-Interaktion auf einem Regler und Screenshots durch
alle Haupt-Modale (Presets, Lebensbaum, Details, Herausforderungen).

**Einschränkung:** Emuliert wurde Touch/Viewport/UA auf der **Chromium**-Engine, nicht echtes
WebKit/Safari. Layout, Overflow, Treffer-Flächen und Media-Queries sind damit verlässlich
geprüft; rein WebKit-spezifisches Verhalten (Gummiband-Overscroll, das echte Auto-Zoom-Verhalten
bei Fokus, tatsächliches Rendering von `env(safe-area-inset-*)`) ließ sich nur indirekt über
CSS/DOM-Inspektion einschätzen, nicht in echtem Safari beobachten.

---

## Befunde

### 1. Die Kernbedienung steht beim ersten Bildschirm nicht im Bild (hoch)

**Status: entschärft, nicht vollständig gelöst (2026-08-04).** Habitat-Bild auf Mobil per
`#habitatSvg { height: 190px }` gecroppt (statt der vollen ~278px, `preserveAspectRatio="…
slice"` erlaubt das verzerrungsfrei), 2×2-Raster kompakter (kleineres Icon, knapperes Polster),
`.stage`-Zeilenabstand auf Mobil 28px→16px. Gemessen (iPhone 14 Pro, 393×660): die Konsolen-
Überschrift „UMWELT FORMEN" + vollständiger Untertitel + Framing-Absatz sind jetzt komplett
sichtbar, ohne zu scrollen (vorher war nur ein abgeschnittenes Wort der Überschrift zu sehen).
Der Lebensraum-Umschalter und der erste Regler selbst liegen mit den gewählten, noch
maßvollen Werten weiterhin unterhalb von 660px — sie vollständig above-the-fold zu bekommen,
hätte entweder das Bild deutlich aggressiver croppen oder die Blockreihenfolge selbst ändern
müssen (Konsole vor das 2×2-Raster statt danach). Letzteres braucht eine eigene
Markup-Umstrukturierung (Schnell-Einstiege aus der Bild-Karte lösen, damit sie als eigenes
Grid-Item auf Mobil hinter die Konsole rutschen können) — das war als Teil dieses Durchgangs zu
riskant für eine unbeaufsichtigte Umsetzung und bleibt offen.

`app/index.html:97–116` — die Konsole „Umwelt formen" mit den 6 Reglern ist laut eigenem
HTML-Kommentar (`app/index.html:97`) *„auf Mobil direkt unter dem Bild, vor der Detail-Karte"*
platziert, und die 6 Regler sind laut Stylesheet-Kommentar (`app/style.css:80–82`) *„die
einzige immer sichtbare Kernbedienung"*. Auf dem reale Viewport mit sichtbarer Safari-Leiste
(393×660) stimmt das nicht: Habitat-Bild + der 2×2-Schnelleinstiege-Raster
(Lebensbaum/Presets/Umwelt-Einfluss/Herausforderungen, `app/index.html:76–86`) füllen den
gesamten ersten Bildschirm. Von „UMWELT FORMEN" ist nur die Kopfzeile sichtbar, kein einziger
Regler. Wer die App zum ersten Mal öffnet, muss erst scrollen, um überhaupt die namensgebende
Handlung — einen Regler bewegen — zu entdecken.

Das ist kein Overflow-Bug, sondern eine Ranking-Frage: Bild + 4 Kacheln wiegen auf dem
schmaleren iPhone-Viewport schwerer, als die eigene Absicht des Layouts vorsieht.

### 2. Chip-Überlappung oben im Habitat-Fenster auf schmalen iPhones (hoch)

**Status: behoben (2026-08-04).** Beide Chips teilen sich jetzt eine Flex-Zeile
(`.viewport-top-row`, `justify-content: space-between`); der Biom-Tag behält seine volle Breite
(`flex-shrink: 0`), der Generation-Chip weicht zuerst zurück und schneidet seinen Text nur noch
per Ellipse ab. Re-gemessen bei 320/375/393px mit voll ausgeschriebener Jahreszeit
(„Generation N · Jahr 1 · Frühling"): durchgehend **8px Abstand statt Überlappung**
(vorher −109px bei 375px). Screenshot bestätigt sauberen Abschluss mit „…".

`app/style.css:257–270` positioniert zwei Chips absolut übereinander im selben Eck-Paar:
`.gen-readout` (`top:12px; left:14px`, Inhalt „Generation N · Jahr Y · <Jahreszeit>") und
`.biome-tag` (`top:12px; right:14px`, Inhalt z. B. „freie Umwelt"). Beide sind breitenmäßig nur
durch ihren eigenen Inhalt begrenzt — es gibt keine `max-width`, kein Umbruch-Fallback, keinen
gemeinsamen Container, der beide auf Kollisionskurs prüft.

Sobald eine Jahreszeit im Chip erscheint (z. B. „Generation 138 · Jahr 1 · Frühling" — Chips
bleiben bis dahin kürzer, weil `seasonReadout` erst nach einigen Generationen befüllt wird),
wird der linke Chip auf 375px-Breite (iPhone SE 3. Gen./13 Mini) **so breit, dass er den rechten
Chip unterläuft**:

```
genReadout:  left=32   right=357   (Breite 325px)
biomeTag:    left=248  right=343
→ Überlappung: 109px
```

Bestätigt sowohl per `getBoundingClientRect()` als auch im Screenshot. Da `.biome-tag` später im
DOM steht, liegt es visuell über dem `.gen-readout`-Hintergrund — der Zahnrad-Chip wird also
nicht als Textsalat sichtbar, sondern sein rechtes Drittel verschwindet unter dem
Biom-Tag-Chip, inklusive dem Teil des Season-Tooltips/Textes, der dort läge. Bei 320px
(altes SE) ist es strukturell derselbe Fall (Text ist gleich lang, Viewport nur noch schmaler).
Bei 393px (14 Pro) tritt es **nicht** auf — der Bug ist spezifisch für die schmaleren, aber
weiterhin unterstützten iPhone-Breiten.

### 3. Touch-Ziele unter 44×44px, die die vorhandene Coarse-Pointer-Regel nicht erfasst (mittel)

**Status: behoben (2026-08-04)**, mit einer bewussten Ausnahme. `.medium`, `.gene-nums-toggle`,
`.cshare` der `(pointer: coarse)`-Liste hinzugefügt; `.link` dort von `min-height:40px` auf
`44px` gehoben. `#detailsBtn` brauchte einen eigenen, spezifischeren Selektor
(`.details-btn.link`) — die unconditional `.details-btn`-Regel weiter unten im Stylesheet
(`padding: 6px`, gleiche Spezifität wie `.link`) gewann bisher gegen die Coarse-Pointer-Regel
rein durch Reihenfolge im Stylesheet, nicht durch Design-Absicht; das war die eigentliche
Fundstelle des 33×40px-Befunds. `.species-wiki` bewusst **kein** 44px-Kasten (bliebe als reiner
Fließtext-Link neben dem Artnamen fehl am Platz) — stattdessen Innenpolster + kompensierender
Negativ-Rand, Trefferfläche 112×14 → 120×34px, ohne dass sich Optik oder Zeilenhöhe ändern. Alle
Werte per `getBoundingClientRect()` nachgemessen (iPhone 14 Pro): nur noch die Regler-Tracks
selbst (native `<input type=range>`-Box, visueller Griff bleibt bei 26×26px) und der bewusst
belassene `.species-wiki`-Link liegen noch unter 44px.

`app/style.css:489–497` vergrößert unter `@media (pointer: coarse)` bereits gezielt
`.biome, .ctrl, .speed, .disc, .infl-cat, .infl-factor, .infl-quick-chip, .infl-search-result,
.infl-search` auf `min-height: 44px` (Kommentar „B10: größere Touch-Ziele auf Touch-Geräten") —
das Muster ist im Projekt also bekannt und an anderer Stelle schon umgesetzt. Per
`getBoundingClientRect()` gemessen (Chromium-Touch-Emulation, `pointer:coarse` greift
nachweislich) bleiben mehrere interaktive Elemente **außerhalb** dieser Liste und unter der
Schwelle:

| Element | Fundstelle | Gemessene Größe |
|---|---|---|
| `#detailsBtn` (Zahnrad, Header) | `index.html:30` | 33×40px |
| `.medium` „Land"/„Wasser" (Lebensraum-Umschalter) | `index.html:103`, Klasse in `style.css:508` | 55×34 / 74×34px |
| `#geneFilterBtn` „Alle 25 Gene zeigen" | `index.html:136`, Klasse `.gene-nums-toggle` in `style.css:427` | 115×24px |
| `#shareBtn` „Schnappschuss teilen ↗" | `index.html:138`, Klasse `.cshare` in `style.css:430` | 199×40px (knapp, 4px zu niedrig) |
| `#speciesWiki` Wikipedia-Link | `index.html:122`, Klasse `.species-wiki` in `style.css:310` | 112×14px (reiner Inline-Textlink) |

Am spürbarsten dürften die ersten beiden sein: der Zahnrad-Button ist der einzige Zugang zu
Umbenennen/Fantasiemodus/Konto/Neu-beginnen, und die Land/Wasser-Umschalter sitzen direkt über
den Reglern, werden also potenziell oft angetippt.

### 4. Kein `env(safe-area-inset-*)` in `app/style.css` (niedrig–mittel)

**Status: behoben (2026-08-04).** Ein gemeinsamer Selektor für alle sechs Vollbild-Modale
(`.genbook, .dlg, .infl, .world, .login, .dpanel`) trägt jetzt
`padding: max(14px, env(safe-area-inset-*))` auf allen vier Seiten — schrumpft die Box, GEGEN
die `place-items:center` zentriert, statt jede Karte einzeln anzufassen. `max(14px, …)` hält auf
Geräten ohne Safe-Area-Zonen (env() fällt dann auf 0 zurück) den bisherigen Mindestabstand.

Das Stylesheet referenziert an keiner Stelle `env(safe-area-inset-*)` (per Volltextsuche
geprüft). Alle Vollbild-Modale (`.dpanel`, `.genbook`, `.infl`, `.world`, `.login`, `.dlg` — je
`position: fixed; inset: 0`) legen ihre Karte per `place-items: center` in die Mitte des vollen
Viewports, ohne Rücksicht auf die vom System reservierten Zonen (Dynamic Island/Notch oben, der
Home-Indicator-Balken unten, im Querformat zusätzlich die abgerundeten/eingebuchteten
Seitenränder). Bei den hier verwendeten, zentrierten Karten mit Innenabstand ist das Risiko
eines echten Verdeckens gering (die Karten reichen selten bis exakt an den Bildschirmrand) —
spürbar wird es am ehesten im Querformat oder auf iPhones mit größerem Home-Indicator-Bereich.
Da keine der Karten heute bewusst mit dem System-Rand plant, ist das aktuell eher eine
Lücke als ein akutes Symptom; nicht geprüft werden konnte das echte Rendering, da nur
Chromium-Emulation zur Verfügung stand (s. Einschränkung oben).

### 5. Presets-Liste: Scroll funktioniert, aber ohne Hinweis (niedrig)

**Status: behoben (2026-08-04).** Reiner CSS-Scroll-Schatten (Lea Verous Klassiker: zwei
`background-attachment:local`-Verlaufsebenen decken den Schatten an den echten Kartenenden ab,
zwei `scroll`-Ebenen zeigen ihn, solange noch Inhalt fehlt) auf `.dpanel-card` **und** `.gb-card`
(Lebensbaum/Herausforderungen/Weltkarten-Ergebnisse teilen sich dieselbe Klasse und damit
denselben Befund). Kein JS, kein Scroll-Listener — verschwindet von selbst an Anfang und Ende,
per Test bestätigt (`scrollTop` bewegt sich programmatisch + letzte Zeile wird beim Scrollen
vollständig sichtbar).

`.dpanel-card` (`style.css:1039`, `max-height: 84vh; overflow-y: auto`) — programmatisch
bestätigt: die Karte scrollt intern korrekt (`scrollHeight` 598px vs. `clientHeight` 550px bei
12 Presets, Scroll-Test per Wheel-Event verschiebt `scrollTop` sichtbar). Im Screenshot wirkt
die Liste dennoch wie abgeschnitten — der letzte sichtbare Preset-Chip („Lichtlose Tiefsee")
sitzt exakt an der Kartenunterkante, ohne Fade/Schatten oder sonstigen Hinweis, dass darunter
noch mehr Presets folgen. Funktional kein Bug, aber ein leicht zu übersehendes Signal.

---

## Was schon funktioniert (zur Einordnung)

Damit der Bericht nicht einseitig wirkt — mehrere iPhone-relevante Punkte sind bereits sauber
gelöst und wurden im Test bestätigt:

- **Kein Auto-Zoom-Risiko:** alle `<input>`-Feldgrößen (Regler, Login, Suche, Namens-Dialog)
  rendern mit `font-size: 16px` — iOS Safari zoomt beim Fokussieren nur unter 16px automatisch
  in die Seite, das greift hier nirgends.
- **Viewport-Meta korrekt:** `width=device-width, initial-scale=1` (`index.html:5`) — kein
  `maximum-scale`/`user-scalable=no`, Pinch-Zoom bleibt für alle Nutzer möglich.
- **`(pointer: coarse)` feuert zuverlässig** und vergrößert u. a. den Regler-Griff korrekt auf
  26×26px (`style.css:493–494`) — das Grundmuster ist richtig, es fehlt nur die vollständige
  Elementliste (s. Befund 3).
- **Kein horizontaler Dokument-Overflow** bei keiner getesteten Breite (320–667px):
  `scrollWidth === clientWidth` durchgehend — die Chip-Überlappung aus Befund 2 ist ein
  Stapel-/Kollisionsproblem einzelner Elemente, kein Layout-Overflow der ganzen Seite.
- Die mobile Umsortierung der drei Hauptkästen (Bild → Konsole → Karte statt Bild+Karte
  nebeneinander, `style.css:192–193`, `@media (max-width: 820px)`) greift korrekt.

---

## Empfohlene Fixes (nach Priorität der Befunde oben) — Stand vor der Umsetzung, s. Status-Zeilen oben

1. Chip-Kollision (Befund 2): `.gen-readout` eine `max-width` setzen, die auf 375px-Breite
   sicher unter der `.biome-tag`-Startposition bleibt (rechnerisch bei `right:14px` + Tag-Breite
   ~95px + Sicherheitsabstand → `.gen-readout` auf ca. `max-width: calc(100% - 130px)` mit
   `overflow: hidden; text-overflow: ellipsis` begrenzen), oder die Jahreszeit als eigene Zeile
   unter statt neben „Generation N" umbrechen lassen.
2. Erstbildschirm-Gewichtung (Befund 1): entweder das Habitat-Bild auf Mobil kompakter fassen
   (kleinere `max-height` unter `@media (max-width: 820px)`) oder mindestens einen Regler
   „above the fold" anteasern (z. B. Konsole vor dem 2×2-Raster, nicht danach) — beides ändert
   nur Reihenfolge/Höhen, keine Funktionalität.
3. Touch-Ziele (Befund 3): die fünf genannten Selektoren der `(pointer: coarse)`-Regel in
   `style.css:490` hinzufügen (für `.gene-nums-toggle` und `.cshare` reicht `min-height: 44px`;
   `#detailsBtn` und `.medium` brauchen zusätzlich mehr Padding, da ihr Inhalt schon nah an der
   Boxgröße ist; `.species-wiki` bleibt am ehesten ein reiner Textlink — hier eher zusätzliches
   Innenpolster als eine harte 44px-Box).
4. Safe-Area (Befund 4): auf den fixen Modal-Containern `padding-bottom: env(safe-area-inset-
   bottom)` (und ggf. `-left`/`-right` fürs Querformat) ergänzen — reine Ergänzung, keine
   Breaking Change, da `env()` in nicht unterstützenden Browsern auf 0 fällt.
5. Presets-Scroll-Hinweis (Befund 5): optional ein dezenter unterer Fade/Schlagschatten auf
   `.dpanel-card`, sobald sie nicht bis zum Ende gescrollt ist — niedrigste Priorität der Liste.

---

*Getestet am 2026-08-04 gegen den aktuellen Stand von `app/` auf Branch
`claude/iphone-usability-analysis-cbgkwk`.*
