# Arbeitsplan — „Umwelt-Einfluss auslösen" fertigstellen

**Auftrag (Nutzer, 2026-07-26):** Die Funktion „Umwelt-Einfluss auslösen" soll fertig werden.
Selbstständige Nachtarbeit in Stufen; nach jeder Stufe committen + pushen.

> **Diese Datei ist der Zustandsspeicher der Arbeit.** Nach jeder *tatsächlich* erledigten
> Stufe hier den Haken setzen und die **gemessenen** Befunde notieren — nie im Voraus.
> Arbeitszweig: `claude/storytelling-evolution-catalog-uibufo`.

## Ausgangslage (gemessen 2026-07-26)

`docs/faktoren-katalog.md` → `tools/build-influences.mjs` (EFFECTS) → `app/influences.js` → Modal.

| Sektion | aktiv / gesamt |
|---|---|
| 1 · Ort & Klima | 25 / 53 |
| 2 · Katastrophen & Welt-Ereignisse | 10 / 27 |
| 3 · Raum & Isolation | 0 / 44 |
| 4 · Leben mit anderen Arten | 0 / 47 |
| 5 · Körper & Gene | 0 / 12 |
| 6 · Fortpflanzung & Lebensweg | 0 / 31 |
| 7 · Wie Evolution läuft | 0 / 29 |
| 8 · Zufall & Schicksal | 0 / 9 |
| 9 · Große Muster der Vielfalt | 0 / 21 |
| 10 · Mensch & moderne Welt | 0 / 11 |
| **gesamt** | **35 / 284 (12 %)** |

## Was „fertig" heißt (Definition)

„Alle 284 Faktoren aktiv" ist das falsche Ziel: die Sektionen 3–9 sind **keine Umwelt-Einflüsse
auf eine einzelne Linie**, sondern brauchen andere Ebenen (Metapopulation `world/`,
Lebensgeschichte-Gene, Evolutions-Mechanik). Sie hier zu „aktivieren" hieße, Wirkung
vorzutäuschen — genau die Attrappe, die das Projekt sonst vermeidet.

**Fertig heißt darum:**

1. **Jeder Faktor, der wirklich ein Umwelt-Einfluss ist** (Sektionen 1, 2, 10 + Einzelfälle),
   hat einen echten, **gemessen wirksamen** Effekt auf die 16 Umwelt-Achsen.
2. **Jeder andere Faktor** ist nicht mehr vage „kommt bald", sondern trägt sichtbar die
   **zuständige Ebene** („gehört zur Lebenden Welt", „braucht ein Fortpflanzungs-Gen").
   Ehrlichkeit statt Versprechen.
3. **Kein Faktor ist eine Attrappe**: der Prüfstand weist für jeden aktiven Faktor nach, dass
   er die Selektion messbar verschiebt — und dass keine zwei Faktoren dasselbe tun.
4. **Das Modal ist zu Ende gebaut**: Suchen, Wirkungs-Vorschau, Zurücknehmen, sichtbarer
   Stapel aktiver Einflüsse.

## Stufen

- [x] **S0 · Prüfstand** `tools/influence-check.mjs` (`npm run influence-check`):
      Vollständigkeit (env/plain/desc/tone), **Wirksamkeit** (Konvergenz-Lauf: verschiebt der
      Faktor Genom/Archetyp messbar gegenüber dem Ausgangsmilieu?), **Redundanz**
      (keine zwei Faktoren mit fast gleichem Achsen-Fingerabdruck), Abdeckungs-Bericht.
- [x] **S1 · Sektion 1 + Räuberdruck** (28 offene Faktoren) — jeder mit Achsen-Mapping,
      Klartextnamen, Ton; danach `influence-check` grün.
- [x] **S2 · Sektion 2** (17 offene → 5 abbildbar) — Katastrophen/Zyklen/Massenaussterben,
      soweit als Umwelt-Zustand darstellbar.
- [x] **S3 · Sektion 10 anthropogen** (11 offene → 7 abbildbar) — Habitatverlust, Verschmutzung, Klimawandel,
      Lichtverschmutzung, Urbanisierung, Übernutzung …
- [x] **S4 · Ehrliche Einordnung der Rest-Sektionen** — `layer`-Feld statt `soon`:
      „Lebende Welt", „Fortpflanzung", „Evolutions-Mechanik", „Makro-Muster"; Modal zeigt es an.
- [x] **S5 · Modal fertig** — Suchfeld, Wirkungs-Vorschau (welche Achsen, vorher→nachher),
      „Einfluss zurücknehmen", sichtbarer Stapel aktiver Stressoren, a11y-Durchgang.
- [x] **S6 · Chronik-Anbindung** — faktor-spezifische Erzähl-Zeilen für die neuen Einflüsse.
- [ ] **S7 · Abschluss** — Doku, `BACKLOG.md`/`resume.md`, Browser-Test, PR nach `main`.

## Regeln für diese Arbeit

- Engine/Physik/Validität bleiben **unberührt** (`physics.json`, `engine/fitness.ts`, Orakel).
  Alle Einflüsse arbeiten ausschließlich mit den bereits vorhandenen 16 Umwelt-Achsen.
- Quelle der Wahrheit bleibt `docs/faktoren-katalog.md`; Effekte in `tools/build-influences.mjs`
  pflegen und **neu generieren** (`npm run build-influences`) — `app/influences.js` nie von Hand.
- Nach jeder Stufe: `npm run influence-check` + `npm run story-check`, dann committen + pushen.
- Keine Attrappen: lieber ein Faktor weniger als ein Faktor ohne messbare Wirkung.
- **Nichts als erledigt eintragen, das nicht gelaufen ist.** Befunde nur aus echten Läufen.

## Fortschritts-Notizen

### 2026-07-26 · Auftakt
Ausgangslage vermessen (35/284 aktiv). Definition von „fertig" festgelegt (siehe oben), damit
die Arbeit nicht in 249 Schein-Aktivierungen läuft. Stufen S0–S7 stehen.

### S0 · Prüfstand — erledigt
`tools/influence-check.mjs` (`npm run influence-check`). Er extrahiert PHYS/PARAMS/fitness/
stepGeneration/classify aus `app/index.html` (App = maßgebliche Fassung, wie `app-parity`)
und lässt je Faktor eine deterministische Konvergenz über 400 Generationen laufen. Gemessen
wird die L1-Verschiebung des Endgenoms gegen das neutrale Ausgangsmilieu.

**Drei echte Befunde beim ersten Lauf:**
1. **Eine Attrappe:** „Grelles Sonnenlicht" (`light: 0.96` und sonst nichts) verschob die
   Evolution um **L1 0,07** — praktisch nicht messbar. Grund: im Ausgangsmilieu ist das Wesen
   ein Mixotroph, und Licht allein ändert die Rechnung nicht, solange Nahrung reichlich ist.
   Behoben, indem volle Sonne als ORT abgebildet wird (Hitze + Verdunstung + weniger Nahrung).
2. **Eine Dublette:** „Lichtlose Tiefe" und „Dunkle Höhle" lagen 0,05 auseinander — zwei Namen,
   ein Milieu. Getrennt in Wassersäule (Druck, nass, kalt) vs. Fels (nahrungsarm, schlecht
   belüftet, konstant).
3. **Eine echte Lücke:** die Achse **`predation` wird von KEINEM der 284 Faktoren benutzt.**
   Räuberdruck — einer der sechs Kern-Regler — ist über „Umwelt-Einfluss" gar nicht erreichbar,
   weil er in Sektion 4 (Leben mit anderen Arten) steckt, die komplett auf „kommt bald" steht.
   → In S1/S2 einplanen: mindestens ein paar Faktoren, die Räuberdruck real setzen
   (Raubtier-Einwanderung, Prädations-Freisetzung auf Inseln, Massenaussterben der Jäger).

**Weitere Messwerte des ersten Laufs (Ausgangspunkt für S1):**
- Ø L1-Verschiebung 2,79 über 35 Faktoren.
- Die 35 Faktoren erzeugen zusammen nur **11 verschiedene Formen**; „Fisch · Aalform" (9×),
  „Protist · Amöbe" (6×) und „Euglenoid" (6×) dominieren. Die Vielfalt der Einflüsse ist also
  deutlich kleiner, als die Faktor-Zahl suggeriert — dieselbe Lehre wie beim Erzählwerk.
- Mehrere Katastrophen enden bei 3–9 % Passung (Eiszeit, Dürre, Extremchemie). Das ist für
  Katastrophen plausibel, sollte aber in S1 im Blick bleiben: eine Welt, in der nichts mehr
  gedeiht, erzählt keine Geschichte.

### 2026-07-26 · Einschub — drei Nutzer-Rückmeldungen vorgezogen
Der Nutzer meldete während der Arbeit drei Punkte. Zwei betrafen bereits Ausgeliefertes und
gingen deshalb vor die Katalog-Arbeit:
1. **Zappelnde Warum-Zeile** → behoben (v0.70.1), Messwerkzeug `tools/ui-calm-check.mjs`.
   Zeile 19×/8 s → 4×/12 s, Pfeile 35×/12 s → 4×/12 s.
2. **Chronik-Ton zu lyrisch** → umgebaut (v0.70.2), Tonfall-Kennzahl im `story-check`:
   Bezug zum Wesen 13 % → 27 %, Sentenz-Vokabular 6 %.
3. **Nutzerbindung** → Recherche + Konzept in `docs/bindung-konzept.md`; Empfehlung V1
   („Herausforderungen"). Umsetzung bewusst NICHT eigenmächtig — Produktentscheidung.
Danach zurück zu S1.

### S1 · Sektion 1 + Räuberdruck — erledigt
**19 neue Faktoren, alle beim ersten Prüflauf wirksam und nicht redundant.** Aktiv: 35 → **54**.

**Sektion 1 (13 neu, jetzt 38/53):** Moorboden · Wüstenrand · Nebelwüste · blaugrünes
Tiefwasser-Licht · Brandungszone · Brackwasser-Ästuar · austrocknender Tümpel · Sandboden ·
saurer Heideboden · nackter Fels · schattiger Nordhang · chemische Grenzschicht ·
heiße Tiefsee-Quelle.

**Die restlichen 15 aus Sektion 1 wurden bewusst NICHT aktiviert**, weil sie sich nicht
ehrlich als Umwelt-Zustand abbilden lassen. Vier Gründe, die in S4 als Etikett sichtbar werden:
- **braucht eine Zeitachse/Zyklen** (Tag-Nacht-Spanne, Saisonalität, thermische Stabilität,
  Niederschlags-Saisonalität, Photoperiode, Wetter-Stochastik, Ressourcen-Pulse) — ein
  schwankender Zustand ist etwas anderes als ein hoher oder tiefer Zustand.
- **braucht eine Achse, die es nicht gibt** (O₂ über Normalniveau wie im Karbon, CO₂,
  Gravitation, Magnetfeld).
- **gehört in die Lebende Welt** (topografische Komplexität, Küstengeometrie — beides
  sind Eigenschaften einer Ortschaft, nicht eines Milieus).
- **ist schon ein Regler** (Mitteltemperatur).

**Räuberdruck-Lücke geschlossen (6 neu aus Sektion 4):** Räuber tauchen auf · Konkurrenz um
Nahrung · freie Nische · Kleinräuber-Schwemme · Top-down-Kontrolle · Ökosystem-Ingenieur.
Begründung: die Engine modelliert Prädation ohnehin als **Umweltdruck auf die eigene Linie**
(Achse `predation`), nicht als zweite Population — diese sechs sind also keine Attrappen.
Alles, was echte Nachbar-Arten braucht (Koevolution, Symbiose, Epidemien), bleibt offen.

**Messwerte danach:** Ø L1-Verschiebung 2,91 · erreichte Formen 11 → **13** ·
**keine ungenutzte Umwelt-Achse mehr** (vorher fehlte `predation` komplett).

### S2 · Sektion 2 — erledigt
**5 neue Faktoren** (aktiv 54 → **59**, Sektion 2 jetzt 15/27), alle beim ersten Lauf wirksam
und nicht redundant: Lücke im Bestand (Störung) · Eissturm (Frost & Sturm) · Gammablitz
(Ozonschicht weg) · Schwache Sonnenphase · Das Große Sterben (Perm).

Bewusst gewählt wurden **neue Achsen-Kombinationen**, keine Varianten des Vorhandenen:
Frost × Sturm gab es noch nicht, UV × ionisierende Strahlung ohne Gift auch nicht, und die
Bestandslücke (wenig Nahrung bei *viel* Bodenlicht) ist ein eigener Zustand, kein Nahrungsmangel.

**Die übrigen 12 bleiben aus vier Gründen inaktiv** (Etikett folgt in S4):
- **Zeitachse/Zyklen:** Störungs-Regime, Umwelt-Stochastik, Tag-Nacht/Gezeiten/Jahreszeit,
  ENSO/NAO, Milanković-Zyklen.
- **Lebende Welt:** Tektonik/Rifting, Landbrücken (beides Ortschafts-Eigenschaften).
- **fehlende Achse:** Große Sauerstoff-Krise (GOE) — unsere `oxygen`-Achse endet bei „normal",
  eine O₂-Vergiftung von Anaerobiern ist damit nicht darstellbar.
- **schon abgedeckt:** Press vs. Pulse (Begriffspaar, kein Zustand), Auslöser-Bündel und
  Intermediate-Disturbance (beides Zusammenfassungen vorhandener Einzel-Faktoren), „freie
  Nischen nach dem Aussterben" (deckt sich mit dem Faktor „Freie Nische" aus S1b —
  der Redundanz-Test hätte es sonst gefangen).

**Nebenbefund — Fehler in der Quelle:** Der Katalog-Eintrag `Die „Big Five"` schloss das
typografische `„` mit einem **ASCII-`"`**. Das ist genau die in `resume.md` dokumentierte
Falle und hat den Generator mit `SyntaxError: Unexpected string` abbrechen lassen. In
`docs/faktoren-katalog.md` korrigiert (Schlusszeichen `“`), im Generator zusätzlich auf
einfache Anführungszeichen umgestellt.

### S3 · Sektion 10 (Mensch & moderne Welt) — erledigt
**7 neue Faktoren** (aktiv 59 → **66**, Sektion 10 jetzt 7/11), alle beim ersten Lauf wirksam
und nicht redundant: Pestizid-Einsatz (Resistenz-Druck) · Lebensraum-Verlust ·
Verschmutzung & Überdüngung · Menschgemachte Erwärmung · Eingeschleppte Art (neuer Rivale) ·
Stadt (Hitzeinsel & Nachtlicht) · Entleerte Tierwelt.

**Vier bleiben inaktiv, mit je konkretem Grund:**
- **Domestikation / künstliche Zucht** — hier wählt ein *Züchter* Merkmale aus, nicht die
  Umwelt. Man könnte den Stall als Milieu abbilden (keine Räuber, Futter im Überfluss), aber
  das Kernphänomen (Zahmheit, Domestikations-Syndrom) käme dabei nicht heraus. Das wäre
  ein Faktor, der etwas anderes tut, als sein Name verspricht.
- **Gentechnik / CRISPR / Gene-Drives** — greift ins Genom ein, nicht in die Umwelt.
- **Genetische Rettung / assistierte Migration** — Genfluss zwischen Orten = Lebende Welt.
- **Ernte-induzierte Evolution** (Fischerei → kleiner/früher reif) — bräuchte **größenselektive**
  Prädation; unsere `predation`-Achse trifft alle Größen gleich. Ein reiner Räuberdruck-Faktor
  würde das Gegenteil bewirken (Selektion auf GRÖSSE statt gegen sie).

**Messwerte danach:** Ø L1-Verschiebung 2,92 · erreichte Formen weiterhin 13 · Reiche-Bilanz
Tier 28 · Mikrobe 15 · Protist 15 · Pilz 8.

### 2026-07-27 · S4 als Arbeitspaket ausgelagert
Der Nutzer hat eine lokale KI und fragte, ob sich Arbeit ohne Integrationsrisiko abgeben lässt.
Antwort: **ja für S4 und S6, nein für S5** — das Kriterium ist nicht die Qualität der KI,
sondern die **Form der Schnittstelle**. Was als Datendatei mit maschinell prüfbarem Vertrag
übergeben werden kann, ist sicher; was Eingriffe in `app/index.html` verlangt, ist es nicht.

Vorbereitet:
- `docs/auslagerung/S4-eingabe.json` — alle 218 inaktiven Faktoren (Name, Sektion, Gruppe,
  Beschreibung), 42 KB, ohne Repo-Kontext bearbeitbar.
- `docs/auslagerung/S4-aufgabe.md` — vollständige Auftragsbeschreibung: die 16 Achsen, neun
  erlaubte Ebenen, Ausgabeformat, Regeln, acht bereits entschiedene Beispiele als Maßstab.
- `docs/auslagerung/S4-beispiel.json` — Muster-Zulieferung.
- `tools/layer-import-check.mjs` (`npm run layer-import-check <datei>`) — prüft Namens-Treue,
  Vollständigkeit, Wertebereich, keine Umetikettierung aktiver Faktoren und **unterwirft jeden
  `env`-Vorschlag sofort demselben Wirksamkeits- und Dubletten-Test wie einen echten Faktor**.
  Eine fehlerhafte Zulieferung kann damit nichts kaputt machen — sie kommt gar nicht erst in
  den Generator.
- Nebenbei: der App-Kern-Zugriff liegt jetzt in `tools/lib/app-core.mjs` statt doppelt
  (`influence-check` danach unverändert grün, 66 Faktoren).

### 2026-07-27 · S4-Zulieferung angenommen, S6 als Paket ausgelagert
**S4-Zulieferung geprüft und angenommen.** `layer-import-check` bestanden: alle 218 inaktiven
Faktoren, Namen exakt, Ebenen gültig, keine Dubletten, kein aktiver Faktor umetikettiert.
Inhaltlich stimmig — die Sektions-Verteilung zeigt echtes Verständnis statt Raten:
Raum & Isolation 39/44 `lebende-welt`, Fortpflanzung 29/31 `neues-gen`, Wie Evolution läuft
23/29 `mechanik`, Große Muster 20/21 `makro-muster`, Körper & Gene 11/12 `neues-gen`.
Null `umsetzbar` — konservativ, aber plausibel, weil die abbildbaren Faktoren in S1–S3 schon
geerntet wurden.
**Ein Defekt behoben:** die Begründungen kamen in ASCII-Umschrift („braeuchte", „vollstaendig",
„Groesse"). Da der Text im Spiel-UI erscheint, wortweise korrigiert (128 Begründungen) — mit
Ausnahmeliste für echte Wörter wie Quelle, Frequenz, Koevolution, Koexistenz, Sequestrierung.
Datei liegt als `docs/auslagerung/S4-ausgabe.json`; **der Einbau in den Generator steht noch aus
(= S4).**

**S6 als zweites Auslagerungs-Paket vorbereitet** (Umfang ~200–350 Bausteine, deutlich größer
als S4):
- `docs/auslagerung/S6-eingabe.json` — die 66 aktiven Einflüsse mit Anzeigename, Ton,
  Beschreibung, den real bewegten **Achsen** und dem **Konvergenz-Ergebnis** (Form, Reich,
  Passung). Damit kann extern über das geschrieben werden, was wirklich passiert.
- `docs/auslagerung/S6-aufgabe.md` — Auftrag: wie ein Satz montiert wird, die
  Verbzweitstellungs-Regel, der geänderte Ton (prosaisch statt lyrisch, mit `{wesen}`),
  Teil A (3 Zeilen je Einfluss) und Teil B (Textur-Pools mit Tag-Liste), inklusive der Warnung,
  die Mitte nicht zu vergessen (früherer Befund: Auftakt-Pool schrumpfte in milden Welten von
  40 auf 6).
- `tools/story-import-check.mjs` (`npm run story-import-check <datei>`) — prüft Schlüssel,
  Form, Leitplanken, Tags, Dubletten gegen die bestehenden 460 Bausteine, **montiert jedes
  Fragment auf dem echten Generator-Pfad zu vier fertigen Sätzen** (Haken `ctx.__kern` in
  `app/story.js`) und misst den Tonfall. Gegenprobe mit absichtlich schlechter Datei: alle
  sieben Fehlerarten gefangen, inklusive wortgleich abgeschriebener Sentenz.
- Beim Bauen zwei eigene Fehler gefunden und behoben: eine globale Regex in `.test()`
  (zustandsbehaftet) und — gravierender — getaggte Bausteine wurden in einer Welt geprüft, die
  den Tag gar nicht erfüllt; dadurch wäre **jedes korrekt getaggte Fragment** durchgefallen.
  Die Testwelt wird jetzt aus den Tags des Bausteins gebaut.

### S6 · Chronik-Anbindung — erledigt (externe Zulieferung, v0.72.0)
**312 Bausteine angenommen und eingebaut:** 198 Faktor-Zeilen (alle 66 Einflüsse × 3) und
114 Textur-Bausteine. `story-import-check` bestanden — 1248 montierte Sätze, alle sauber;
Tonfall 33 % Bezug zum Wesen, 3 % Sentenz-Vokabular; Umlaute diesmal korrekt.

**Einbau:** `app/story-extra.js` (auto-generiert, `npm run build-story-extra`) hält die
Zulieferung getrennt vom hand-gepflegten Katalog. `app/story.js` mischt die Textur-Bausteine
in die Pools und bevorzugt im `welt`-Beat die Zeilen des **ausgelösten Einflusses** — dadurch
erzählt jeder Einfluss sich selbst, statt nur die bewegte Achse zu nennen. Die App reicht dazu
den Faktornamen durch (`_lastFaktor` → `ctx.faktor`).

**Zwei Fehler, die erst die Zulieferung sichtbar gemacht hat:**
1. **Kennungs-Kollision im Gedächtnis (echter Generator-Fehler).** Baustein-Kennungen waren
   positionsbasiert (`kern-welt:0`), also hieß die erste Zeile JEDES Einflusses gleich. Das
   Anti-Wiederholungs-Gedächtnis unterdrückte dadurch die Zeilen eines Einflusses, weil ein
   ganz anderer Einfluss dieselbe Position schon benutzt hatte — sichtbar als „Stadt" ohne eine
   einzige eigene Zeile. Dasselbe galt latent für jedes Gen im `druck`-Beat. Die Kennung
   enthält jetzt die Lage (`kern-<beat>|<faktor oder key>`).
2. **Satzbau-Einfalt.** 28 Faktor-Zeilen nutzen dieselbe Konstruktion (uneingeleiteter
   Konditionalsatz, „Setzt {wesen} die Wurzeln zu tief, erstickt es sie"). Grammatisch korrekt,
   aber als Muster erkennbar. Nicht zurückgewiesen (10 % der Bausteine), dafür misst
   `story-import-check` jetzt die Satzbau-Verteilung und warnt ab 22 % bei markierten
   Konstruktionen.

### 2026-07-27 · Paket P3 vorbereitet (Klartext für den Katalog)
Nach S6 das bisher größte Auslagerungs-Paket: **436 Texte** — für jeden der 218 inaktiven
Faktoren ein **Klartextname** und eine **Erklärung**.

**Warum das die größte Lücke ist (gemessen):** 218 Faktoren zeigen im Modal ausschließlich
den Fachbegriff („R*-Theorie (Tilman) / Storage-Effekt / Neutraltheorie"), **42 haben gar
keine Beschreibung** (im Modal steht ein nackter Punkt), weitere 56 nur eine Wortgruppe.
Der Katalog ist damit ein Museum mit 218 unbeschrifteten Vitrinen.

- `docs/auslagerung/P3-eingabe.json` — die 218 Faktoren mit Sektion, Gruppe, bisheriger
  Kurznotiz **und der Ebene + Begründung aus S4**. Letzteres steuert den Ton: ein Faktor der
  Ebene `lebende-welt` darf nicht klingen, als ließe er sich am Regler einstellen.
- `docs/auslagerung/P3-aufgabe.md` — Auftrag mit Positiv-/Negativ-Beispielen, Längenregeln,
  der ausdrücklichen Umlaut-Vorgabe (Lehre aus S4) und der Regel „kein Fachbegriff zur
  Erklärung eines Fachbegriffs".
- `tools/plain-import-check.mjs` (`npm run plain-import-check <datei>`) — prüft Schlüssel,
  Namenslänge/-form (kein `/`, eindeutig, nicht der Fachbegriff selbst), Erklärungslänge und
  Satzform, **ASCII-Umschrift** und zwei Verständlichkeits-Näherungen: Anteil Wörter ab 14
  Zeichen (Richtwert unter 6 %) und ungeklärte Fachbegriffe aus einer Sperrliste.
  Gegenprobe mit absichtlich schlechter Datei: alle Fehlerarten gefangen.
- Beim Bauen fiel auf, dass mein eigenes Beispiel „Mesopredator-Release" verwendete — ein
  Faktor, den ich in S1b aktiviert habe und der damit gar nicht mehr zur Aufgabe gehört.
  Korrigiert; der Prüfstand hatte es selbst gemeldet.

### S4 · Ehrliche Einordnung — erledigt (externe Zulieferung P3, v0.73.0)

**Zwei zugelieferte Pakete zusammengeführt und eingebaut:**
- **S4-ausgabe.json** (Ebenen-Etikett, bereits angenommen) — 218/218, `layer-import-check` grün.
- **P3-ausgabe.json** (Klartextname + Erklärung, neu geprüft) — 218/218, `plain-import-check` grün.
  Beide Zulieferungen decken exakt dieselben 218 Faktoren ab (geprüft: Namensmengen identisch).

**Wichtiger Zwischenfall — der Prüfstand selbst war fehlerhaft, nicht die Zulieferung.**
`plain-import-check` meldete beim ersten Lauf 41 „ASCII-Umschrift"-Fehler. Bei genauer Prüfung
war **jede einzelne Meldung ein Fehlalarm**: die Regel testete naiv auf die Buchstabenfolge
„ue"/„ae"/„oe" irgendwo im Wort — das trifft zwangsläufig auch echtes Deutsch mit „au"+e
(*bauen*, *Sauerstoff* → „aue"), „eu"+e (*Neue*, *steuert* → „eue") oder zufälligem „ue"/„oe"
in der Wortmitte (*zuerst*, *koexistieren*, *sexuell*). Die Prüfung wurde neu gebaut: statt
eines Substring-Tests prüft sie jetzt gezielt auf typische Nachfolge-Muster einer
Umlaut-Transliteration (z. B. „ae"+„hnlich/nder/hlt/rt/ter", „ue"+„berzeug/chte/llig/ndig",
„oe"+„glich/rper/n"). Gegengetestet an 31 echten Wörtern (0 Fehlalarme) und 27 echten Fehlern
(24 erkannt) — deutlich strenger, ohne die Zulieferung mehr fälschlich zu beanstanden.

**Einbau in den Generator** (`tools/build-influences.mjs`): lädt beide Zulieferungen, setzt für
jeden inaktiven Faktor `f.layer` + `f.layerGrund` (aus S4) sowie `f.plain` + `f.desc` (aus P3).
Aktive Faktoren bleiben unberührt (66/284 unverändert, `influence-check` weiter grün).

**Modal zeigt es jetzt an** (Definition von S4 verlangte das ausdrücklich): das pauschale
„kommt bald"-Abzeichen ist einer ehrlichen Kurzform gewichen — „lebende Welt",
„neues Merkmal nötig", „Evolutions-Mechanik", „nur Beobachtung" usw. (`LAYER_LABEL`-Tabelle),
mit der Begründung als Tooltip. Browser-Test: 5 Stichproben aus „Leben mit anderen Arten"
zeigen korrekt Klartext, Erklärung, Etikett und Tooltip; keine Konsolen-/Seitenfehler.

Damit ist **S0–S4 vollständig abgeschlossen**. Offen: S5 (Modal-Feinschliff: Suche,
Wirkungs-Vorschau, Zurücknehmen — bewusst NICHT ausgelagert, da Chirurgie in `app/index.html`),
S6 ist bereits erledigt, S7 (Abschluss/PR nach main).

### 2026-07-27 · Drei weitere Auslagerungs-Pakete (P5, P6, P7)

Auf Nutzer-Frage „was ließe sich noch auslagern" systematisch durchgesehen (nicht geraten):
- **Korrektur eines falschen ersten Befunds:** `exemplar.js` schien unvollständig (Grep auf
  „wiki:" fand nur 27 Treffer), tatsächlich sind alle **44 Archetypen** abgedeckt (anderes
  Datenformat). Falsche Fährte sofort richtiggestellt; das BACKLOG-Häkchen für den zugehörigen
  Nutzerwunsch war nur nicht gesetzt — nachgetragen.
- **25 Gene ohne jede Erklärung im Spiel** (nur der Name steht am Balken) — echte, gemessene
  Lücke. → **Paket P6**, kleinstes der Pakete.
- **„Herausforderungen der Natur"** aus `docs/bindung-konzept.md` (die eigene Empfehlung V1)
  — größtes Paket, aber eine Produktentscheidung. Nutzer hat auf Rückfrage zugestimmt, den
  **Inhalt** vorzubereiten; die Verdrahtung ins Spiel bleibt bewusst außen vor (Chirurgie in
  `app/index.html`, wie S5).

**P6 · Gen-Erklärungen** (`docs/auslagerung/P6-*`, `npm run gene-import-check`): 25 Tooltip-
Texte, Kontext aus den bereits vorhandenen Chronik-Fragmenten (`story.js` DRUCK-Tabelle, alle
25 Gene bereits mit Auf/Ab-Text) und `PARAMS.mutationAnchor` (Kern- vs. bedingte Stressor-Gene).

**P5 · Herausforderungen der Natur** (`docs/auslagerung/P5-*`, `npm run challenge-import-check`):
Ziel (Reich/Form) + Beschränkung (Regler-Grenzen) + Generationen-Budget + Text. Der Prüfstand
geht über Formatprüfung hinaus — er **simuliert**: 24 Stichproben-Umwelten je Herausforderung
laufen über das angegebene Budget (dieselbe `converge()`-Technik wie `influence-check`), geprüft
wird (1) Erreichbarkeit — wird das Ziel überhaupt je erreicht, (2) ob die Beschränkung ECHT
etwas testet (Erfolgsquote mit vs. ohne Beschränkung verglichen — sonst ist sie Dekoration),
(3) Schwierigkeits-Plausibilität (gemessene Erfolgsquote gegen die angegebene Stufe).
Gegengetestet an drei Fällen: eine unerreichbare Herausforderung wurde korrekt zurückgewiesen,
eine zu leicht als „leicht" markierte korrekt bemängelt.

**P7 · Qualitäts-Audit** — bewusst kein neues Datenpaket, sondern ein Prüfauftrag auf bereits
Verbautem: die 218 P3-Erklärungen (`app/influences.js`) und 312 S6-Chronik-Zeilen
(`app/story-extra.js`) sollen von einer frischen KI kritisch gegengelesen werden (schwache
Stellen markieren, keine Textersetzung). Kein eigener Prüfstand nötig — die Existenz-/Form-Prüfer
(`plain-import-check`, `story-import-check`) laufen weiter über jedes Ergebnis.

**Gemeinsame Bereinigung:** die Umlaut-Heuristik (aus dem P3-Vorfall) ist jetzt in
`tools/lib/umlaut-check.mjs` zentralisiert statt in `plain-import-check.mjs` dupliziert.

### S5 · Modal fertig — erledigt (v0.74.0)
Vier geforderte Teile ergänzt, Browser-getestet, keine Fehler:
- **Suchfeld** über den GESAMTEN Katalog (284 Faktoren, alle Sektionen) — vorher nur Blättern
  Kategorie für Kategorie. Treffer über Klartext, Fachbegriff und Erklärung; ein Treffer
  öffnet direkt die richtige Sektion mit dem Faktor vorausgewählt (bestehender
  `preselectName`-Mechanismus wiederverwendet).
- **Wirkungs-Vorschau** — welche der 16 Achsen sich verschieben würden, vorher→nachher.
  Dafür `applyInfluence()` in eine reine Funktion `influenceResultEnv(f)` zerlegt, die
  sowohl die Vorschau als auch die echte Anwendung speist — Vorschau kann nie von der
  tatsächlichen Wirkung abweichen, weil es dieselbe Berechnung ist.
- **„Einfluss zurücknehmen"** — Ein-Schritt-Undo (kein voller Verlauf): Milieu-Schnappschuss
  unmittelbar vor `applyInfluence()`, ein Knopf stellt ihn wieder her (inkl. Biom-Tag,
  Regler-UI, Stress-Chips, Chronik-Reaktion).
- **a11y-Fund + Fix:** Escape schloss das Einfluss-Modal bisher gar nicht — obwohl der
  Handler schon für Genbuch/Login/Reveal existierte, fehlte der Fall komplett. Ergänzt
  (Sub-Modal offen → wie „Abbrechen"; sonst ganz schließen). Neue Elemente (Suche,
  Suchergebnisse) liegen innerhalb des bestehenden Tab-Trap-Dialogs, keine Zusatzarbeit nötig.
  `.infl-search`/`.infl-search-result` zur 44px-Touchziel-Regel ergänzt, `.sr-only`-Klasse
  ergänzt (fehlte bisher im Stylesheet) für das Suchfeld-Label.

**Damit ist S0–S6 vollständig.** Nur noch S7 (Abschluss/PR) offen.

### P6 · Gen-Erklärungen — angenommen und eingebaut (v0.74.0)
Externe Zulieferung (`docs/auslagerung/P6-ausgabe.json`) geprüft: `gene-import-check`
bestanden, 25/25, nur 5 milde Stilhinweise (Gen-Name in der Erklärung genannt — bei Prüfung
der Texte alle im Kontext natürlich, keine Überarbeitung nötig). Alle 25 Gene haben jetzt
zum ersten Mal eine Erklärung im Spiel (Tooltip am Gen-Balken) — vorher stand dort nur der
Name. Eingebaut wie S4/S6: `app/gene-explain.js` (auto-generiert, `npm run build-gene-explain`),
`window.GENE_EXPLAIN[i]` als `title`-Attribut am Gen-Element.

### Rückfrage zu P5 beantwortet
Die lokale KI wartete auf Engine-Zugriff, um Simulations-Erreichbarkeit selbst zu prüfen —
klargestellt: das übernimmt `challenge-import-check.mjs` bereits auf unserer Seite.
`P5-eingabe.json` zusätzlich um 12 `biomeBeispiele` ergänzt (alle Spiel-Biome mit ihrem
ECHTEN, in der Engine gemessenen Konvergenz-Ergebnis über 800 Generationen) als Ausgangspunkt
für plausiblere Vorschläge.

### 2026-07-27 · P5-Zulieferung geprüft, echter Prüfstand-Bug gefunden, P8 als Nachfolgepaket (300 Stück)
`P5-ausgabe.json` (28 Herausforderungen) geprüft: erst 14/28 durchgefallen ("nie erreichbar").
Beim Nachforschen zwei getrennte Ursachen gefunden:
1. **Echter Bug in `challenge-import-check.mjs`**: `sampleEnv()` hat die `STRESSORS`-Liste aus
   `tools/lib/app-core.mjs` zweckfremd wiederverwendet, um zu entscheiden, welche Achsen ohne
   `grenzen`-Eintrag unverändert bleiben. `oxygen` steht dort bewusst NICHT drin (die Liste dient
   anderswo einem Reset-auf-0-Muster, oxygen resettet aber auf 1) — Folge: `oxygen` wurde bei
   JEDER Stichprobe zufällig zwischen 0 und 1 gewürfelt statt beim zugesicherten neutralen Wert 1
   zu bleiben. Behoben (Commit `1eaa20f`): 14 → 10 Fehlschläge.
2. **Echtes Inhalts-Problem** (verbleibende 10): Ziele wie Nadelbaum, Sukkulente, Koralle wurden
   aus biologischer Intuition heraus mit Beschränkungen versehen, die mit der tatsächlichen
   Simulations-Logik nichts zu tun haben — Tiefen-Stichprobe (1500 statt 24 pro Fall) bestätigte:
   6 der 10 sind bei 0/1500 echte Sackgassen, der Rest im Promille-Bereich.

Daraus **P8** gebaut: 45.000-Stichproben-Simulationslauf über die 6 Regler ergab für 39 von 44
Formen und alle 5 Reiche echte, gemessene "Envelopes" (Wertespannen + Beispiel-Umgebungen, die
das Ziel nachweislich erreichen) plus Seltenheits-Zahl (`treffer`). `docs/auslagerung/P8-*`
liefert diese Daten der externen KI mit, mit der Regel: jede eingeschränkte Achse muss die
gemessene Spanne abdecken; bei sehr seltenen Zielen (`treffer` < ~50) reicht die grobe Envelope
NICHT — dort muss eng um EIN konkretes Beispiel herum eingeschränkt werden (getestet an
Nadelbaum: lockere Envelope-Beschränkung auf 2 Achsen → 0/24, enge 6-Achsen-Bindung an ein
Beispiel → 8 % Trefferquote). `P8-beispiel.json` geprüft, besteht. Umfang diesmal: 300
Herausforderungen. P5 selbst bleibt vorerst offen/unintegriert — P8 ist der vorgesehene
Ersatz/die Erweiterung dafür.
