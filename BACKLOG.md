# Backlog

**Stand:** 2026-07 · Live-App `app/index.html`, deployt via GitHub Pages von `main`.
Test-Validität **~72 %** (Ziel-Band 80–90 %, seit der 25-Gene-Korrektur ehrlich über alle
Gene gemessen statt blind für 15 davon — s. Punkt 9 Schritt 1 Befund), Parität exakt (~1e-16).
**43 benannte Lebensformen** über **5 Reiche** (Pflanzen/Tiere/Pilze/Mikroben/Protisten),
**25 Gene** — alle gen-abbildbaren Einzel-Phänotyp-Achsen: Flug, Aquatik, Biolumineszenz,
Grabtrieb, Tarnung, Sinne, Filterapparat + N-Fixierung (Energiekanäle/Mechaniken) sowie 8
Extremnischen-Stressoren (Gift, Sauerstoff, Salz, UV, Druck, Austrocknung, Strahlung, Feuer,
Frost, Wind) + Kleibersche Allometrie. Realitäts-Regel-Check (`npm run reality`): **20/20**.
App-Inline-Fitness gegen die Engine abgesichert (`npm run app-parity`, exakt).

Zwei Validierungs-Ebenen (immer BEIDE prüfen):
- `npm run parity` — Engine ↔ Orakel (Dynamik-Treue).
- `npm run ecology` — Engine ↔ **Realität** (Struktur-Kriterien, `docs/biodiversity-reference.md`).

> ⚠️ Änderungen an `engine/fitness.ts` / `physics.json` verändern die Physik →
> **Orakel neu erzeugen + neu trainieren + `npm run parity` + `npm run ecology`** ist Pflicht,
> sonst bricht der Prüfstand. Alle drei Fitness-Kopien synchron halten (engine / oracle / app-inline).

---

## ⬜ Offen — konsolidierte, priorisierte Übersicht

Zusammengeführt aus mehreren parallel gewachsenen „Offen"-Abschnitten (2026-07-29) — Ziel:
**ein** Ort für alles Offene, damit nichts doppelt angefasst wird. Reihenfolge ≈
Bearbeitungsreihenfolge (Blocker/Meta zuerst). Beim Zusammenführen zwei stille Dopplungen
gefunden und aufgelöst: „AXIS-2 Graben" war bereits als AXIS-9 erledigt, „AXIS-3
Ernährungsmodus" im Filtrierer-Teil ebenfalls — siehe Punkt 6.

> **⚠️ Koordinations-Hinweis (Punkte 3+4):** beide laufen parallel und ändern
> `app/index.html`s Hauptbildschirm — Punkt 3 (Komplexitäts-Audit) die **Struktur/das Layout**,
> Punkt 4 (Redesign) nur die **Optik** (Farben/Formen). Empfohlene Reihenfolge bei Umsetzung:
> erst Layout (3), dann Politur obendrauf (4) — sonst überschreiben sich CSS-/Markup-Änderungen
> gegenseitig oder eine Session baut auf einer bald veralteten Struktur.

> **🤖 Modell-Empfehlung je Punkt** (2026-07-29, damit ein neuer Chat nicht neu abwägen muss):
> **Sonnet** für klar spezifizierte Umsetzung/Mechanik-Fixes/Recherche mit engem Suchraum,
> **Opus** für geschmacks-/abwägungsintensive Design- und Architekturentscheidungen mit großem
> Ermessensspielraum. Steht als `**Modell:**`-Zeile direkt unter jeder Überschrift/jedem
> Schritt. Faustregel bei mehrteiligen Punkten: wenn nicht anders vermerkt, gilt die Angabe an
> der Überschrift für alle Unterpunkte.

### 1 · ✅ GitHub „Unverified"-Commits — Audit abgeschlossen (2026-07-29): kein Rewrite, nicht user-fixbar

**Ursache geklärt:** jeder Claude-Code-Commit läuft unter `user.name=Claude`,
`user.email=noreply@anthropic.com`. GitHub ordnet diese E-Mail NICHT dem Repo-Account
(`allawallabedalla`) zu, sondern einem eigenständigen, geteilten GitHub-Account
**`github.com/claude`** (id 81847, ~147k Follower, Bio verlinkt „@anthropics" /
„anthropic.com/claude-code" — erkennbar die offizielle Anthropic/Claude-Code-Identität, an
die GitHub JEDEN Claude-Code-Commit über alle Repos/Nutzer/Sessions hinweg attribuiert).
Per `get_commit`-API bestätigt: sowohl der frische Commit dieser Session (`f7951a6`) als auch
ein Commit einer komplett anderen, laengst gemergten Session (`402d070`, 2026-07-28) zeigen
identisch `author.login: "claude", id: 81847` — das Muster ist also kein Repo- oder
Signatur-Problem, sondern eine Eigenschaft der Commit-Attribution selbst.

**Konsequenz — die im vorigen Audit offene Frage ist damit beantwortet:**
- Die eingebettete SSH-Signatur (`gpgsig`, ssh-ed25519, bestätigt vorhanden — s. vorheriger
  Befund) müsste als **Signing Key im GitHub-Account `github.com/claude`** hinterlegt sein,
  damit „Verified" erscheint — NICHT im Account `allawallabedalla` und in keinem
  Repo-/Organisations-Setting, das der Nutzer hier kontrolliert.
- **Das ist damit keine Aufgabe, die der Nutzer (oder diese Session) für DIESES Repo lösen
  kann.** Es ist eine plattformweite Anthropic-Konfigurationsfrage (Signing-Key-Registrierung
  auf dem geteilten `claude`-Account) — falls überhaupt gewünscht: möglich, dass jede
  Umgebung/Session ihren eigenen Schlüssel über `/tmp/code-sign` →
  `/opt/env-runner/environment-manager` erzeugt (die lokale
  `~/.ssh/commit_signing_key.pub`-Datei ist in dieser Session z. B. leer/0 Byte — die
  eigentliche Schlüsselverwaltung läuft nicht über diese Datei), was eine dauerhafte
  Registrierung ohnehin erschweren würde.
- **Kein `--amend`/`rebase`/Force-Push** — würde am Ergebnis nichts ändern (das Problem sitzt
  auf GitHub-Kontoebene, nicht in der Commit-Historie) und hätte das unter Punkt 1 schon
  vorher benannte Risiko, parallel laufende Sessions/Branches zu stören. Der Stop-Hook-Vorschlag
  bleibt also weiterhin zu Recht ignoriert.

**Für den Nutzer:** falls „Verified"-Häkchen bei Claude-Code-Commits gewünscht sind, wäre das
eine Anfrage an Anthropic (Claude Code Support), nicht ein Repo- oder GitHub-Account-Fix, den
`allawallabedalla` selbst vornehmen kann. Dieser Backlog-Punkt ist damit abgeschlossen —
nichts weiter zu tun am Repo.

*(Blockiert nichts anderes hier — reine Meta-Aufgabe, aber recht billig zu klären.)*

### 2 · Engine-Grundlagenforschung: Determinismus/Vielfalt — blockiert Punkt 6

**Modell:** Sonnet für die Divergenz-Phase (breite Ideensammlung ohne Denkverbote) → **Opus**
für die Konvergenz-/Spezifikationsphase (abwägungsintensiv, s. u.).

*(Nutzer, 2026-07-29)* „Die Engine wirkt sehr deterministisch" — konkret: Dunkelheit führt bei
Fellwesen im Spiel immer zu einem Leuchtorgan statt zu einem Fellwesen, und Fisch/
Insekten wurden trotz Existenz im Möglichkeitsraum praktisch nie beobachtet.

**Befund:** teils ein konkreter, noch offener Kaskaden-Bug (`classify()` in
`app/index.html` prüft Biolumineszenz vor Fell — ein Wesen mit hoher Isolation UND
hoher Biolumineszenz wird deshalb immer als „Leuchtwesen · Tiefsee" klassifiziert,
nie als Fellwesen), teils eine strukturelle Grenze der Architektur: AXIS-4 (Aquatik)
und AXIS-5 (Biolumineszenz) haben die Erreichbarkeit von Fisch/seltenen Nischen
bereits gezielt verbessert (Fisch 0 % → 3,8 %), aber die Werte bleiben niedrig, weil
die Produktions-Engine ein einziges Mittelwert-Genom per Gradientenaufstieg simuliert
— schmale Fitness-Nebengipfel (= seltene, aber biologisch plausible Formen) werden
dadurch grundsätzlich selten erreicht, egal wie viel an einzelnen Schwellen
nachjustiert wird.

**✅ Recherche abgeschlossen (2026-07-29):** 4 parallele Sonnet-Agenten (Divergenz, 12
Kandidaten) + 1 Opus-Agent (Konvergenz + Deliverable), alle Kernzahlen empirisch an diesem
Repo gemessen, nicht geschätzt. **Volles Ergebnis: `docs/engine-forschungsergebnis.md`.**

**Kernbefund:** die Recherche widerlegt Teile der ursprünglichen Annahme. Fisch ist längst
erreichbar (11.8 % über Zufallsumwelten) — das „nie gesehen"-Gefühl ist ein
Kalibrier-/Benennungsproblem (Presets fallen meist in die Mikroben-Region), nicht
Erreichbarkeit. Insekt ist dagegen wirklich strukturell unerreichbar (0.14 % über 2200
Läufe) — `engine/fitness.ts` hat schlicht keinen Fitness-Gipfel für „lange Gliedmaßen an
kleinem Körper", das braucht einen eigenen, kleinen Physik-Term (kein Architekturproblem).
Eine reine Agentenpopulation (`world/population.ts` pur) ist außerdem NICHT vielfältiger als
der Status quo (24 vs. 32 Formen) — Fishers Fundamentalsatz zehrt Varianz auf einer fixen
Landschaft auf, egal ob Mittelwert oder Population. Der eigentliche Vielfalts-Treiber ist
**Frequenzabhängigkeit** (Konkurrenz um Nischen), nicht Population an sich.

**Empfehlung:** Nischen-Schwarm (Populations-Kern `world/` + mehrdimensionaler
Konkurrenz-Kernel + gestreute Gründer-Genome) statt Mittelwert-Gradientenaufstieg, plus
Prototyp-Bibliothek + gewichtetes Ähnlichkeits-Matching statt der `classify()`-Kaskade.
`engine/fitness.ts`/`physics.json` bleiben zu 100 % erhalten (nur pro Individuum statt pro
Mittelwert aufgerufen) — `engine/simulate.ts`, `training/fit.ts`, `EngineParams`,
`fitted-params.json` fallen ersatzlos weg (löst den Kapazitätsgrenzen-Befund aus Punkt 9
Schritt 1 auf, statt ihn weiter zu kalibrieren). Performance gemessen: ~2 ms/Generation bei
N=200 in Node → geschätzt 3-6 ms im Browser, 15-30× Sicherheitsabstand zum 100ms-Ziel.

- [ ] **Migrations-Stufen (Modell: Opus für Stufe 2/4 — geschmacksintensive
  Architekturentscheidungen im laufenden Live-Code —, Sonnet für den Rest), jede Stufe
  einzeln lauffähig/messbar/committen, s. Dokument Abschnitt „6.4" für Details:**
  - [x] Stufe 0 (erledigt 2026-07-29) — Messskripte aus der Recherche als
    `tools/research/*.mjs` übernommen (ROOT-relative Pfade statt der Scratchpad-Absolutpfade
    des Forschungsagenten), alle sechs gegen die Original-Kennzahlen im Dokument
    nachgeprüft (u. a. Räuberland/Offenes Meer Fisch 100 %, Lichtlose Tiefsee Leuchtwesen
    100 %, A/B/C-Formenzahl 10/32/24, `fitness()` 339 ns/Aufruf) — alle reproduziert. Kein
    Gate (kein Pass/Fail), reine Referenzmessung für spätere Stufen.
  - [ ] Stufe 1 — Gewichtete Cluster-Metrik in `world/cluster.ts`/`census.ts` (Ziel: ≥1.3
    Cluster/Lauf, heute 0.10 bei 25 Genen — Cluster-Erkennung ist aktuell praktisch blind).
  - [ ] Stufe 2 — Prototyp-Matcher + `archetypes.json`; `classify()`-Kaskade in
    `app/index.html` ersetzen (behebt den gemeldeten Fell/Leuchtwesen-Kaskaden-Bug direkt).
  - [ ] Stufe 3 — Mehrdimensionaler Nischen-Kernel in `population.ts` + gestreute
    Gründer-Genome (Ziel: ≥18 Formen über 11 Biome, Koexistenz in ≥5 Biomen).
  - [ ] Stufe 3.5 — kleiner Physik-Term für Insekt-Nische (Gliedmaßen-Substrat-Traktion o.ä.,
    ~15 Zeilen analog bestehender AXIS-Achsen) — NACH Stufe 3, mit Multi-Start-Messung
    abgenommen (Ziel: Insekt ≥2 % im Zufalls-Sweep, heute 0.14 %).
  - [ ] Stufe 4 — Live-App auf `world/` umstellen, `simulate.ts` aus dem Produktionspfad
    (Ziel: Tick < 10 ms im Browser gemessen).
  - [ ] Stufe 5 — Telemetrie-Erklärung (echtes Selektionsdifferential aus dem Schwarm) statt
    `engine/explain.ts`s handgeschriebener `env`-Schwellen-Sätze (behebt nebenbei die im
    Code selbst dokumentierte BUG-2-Klasse).
  - [ ] Stufe 6 — Orakel-Prüfstand auf Verteilungsmetrik (Jensen-Shannon über Formhäufigkeiten)
    umstellen; `fitted-params.json`/`validityTest`-Prozentbalken fallen weg oder bekommen
    neue Bedeutung (Konvergenz-in-N statt Distillation).
  - [ ] Stufe 7 (optional) — Koevolution + Metapopulation einschalten (bereits vorhanden in
    `world/coevolution.ts`/`world/world.ts`, nur zuschalten).

**Blockiert weiterhin:** Punkt 6 (Rest-Achsen) — der Umbau ändert, WIE Achsen wirken (Kern
vs. Konkurrenz-Kernel), also erst nach mindestens Stufe 3 neu bewerten, ob/wie Punkt 6 noch
sinnvoll ist.

### 3 · Komplexitäts-Audit / Informationsarchitektur (2026-07-29)

**Modell:** Sonnet — Konzept + Priorisierung liegen bereits fertig abgestimmt vor
(`docs/komplexitaets-audit.md`), hier nur noch Ausführung nach Plan.

- [~] **„Das ganze Spiel wirkt extrem überladen und unübersichtlich" — Konzept liegt vor,
  Umsetzung offen.** *(Nutzer)* Audit + abgestimmter Bauplan in
  **`docs/komplexitaets-audit.md`**.
  **Befund:** die Hauptansicht zeigt ~49 gleichzeitig aktive UI-Elemente, bevor überhaupt ein
  Modal geöffnet wird — 25 Gen-Balken permanent (auch die im Milieu irrelevanten), 12
  gleichrangige Biom-Buttons neben 6 Reglern, zwei inkonsistente Umwelt-Bedienmuster (Regler
  vs. Einfluss-Chips) und vier Modale mit je eigener Navigationslogik. Ursache ist kein
  Einzelfehler, sondern ein Muster: die letzten Audit-Runden haben fast nur hinzugefügt und
  erklärt, kaum je etwas entfernt oder gruppiert.
  **Fitness-Physik/Achsen bleiben unangetastet** (Validität ~85 %, Parität ~1e-16, Reality
  20/20) — das Problem sitzt in der Präsentation, nicht im Modell.
  **Abgestimmte Informationsarchitektur** nach Zugriffshäufigkeit statt Feature-Vollständigkeit
  (Details siehe Doc):
  - **Prio 1** (immer sofort da): 6 Regler, Play/Pause/Tempo, Lebensbaum-Zähler als stiller
    Fortschritts-Motivator.
  - **Prio 2** (ein Klick, aber beworben): Biome als kompakter „Presets ↗" statt 12
    Einzel-Buttons, Umwelt-Einfluss, Herausforderungen (Startansicht kuratiert statt 271
    Einträge), Teilen als kleiner Ghost-Button.
  - **Prio 3** (Submodal/Settings, bewusst vergraben): Weltkarte-Details, „So funktioniert's",
    Engine-Info, Zahlen-Toggle, Login, Name bearbeiten, **Neu beginnen** (destruktiv, gehört
    weg von der Kernbedienung).
  Reduziert die Dauersicht im Kern auf 6 Regler + Zeitkontrolle + Zähler + 4 klar
  sekundäre Buttons; sieben Nebenfunktionen wandern in ein „⋯ Details"-Aufklapp.
  Statisches Vorher/Nachher-Layout-Mockup wurde gebaut und abgenommen (nicht im Repo, nur zur
  Abstimmung). **Empfohlene Umsetzungsreihenfolge:** P0.1 Gene progressiv einblenden → Biome→
  Presets-Umstellung → Prio-3-Nebenfunktionen ins Details-Panel bündeln → (P2) Inline-Fitness-
  Kopie in `index.html` durch generierte Version ersetzen (schließt die Fehlerklasse des
  10-Versionen-NaN-Bugs, s. „Erledigt").

  - [x] **P0.1 + P0.2 umgesetzt (2026-07-29):** Gen-Zeilen progressiv eingeblendet
    (`computeRelevantGenes`/`applyGeneFilter` — relevant = |Wert−Mutations-Anker| > 0.15 ODER
    Teil des aktiven Selektions-Theaters; mind. 6 Gene bleiben immer sichtbar; „Alle 25 Gene
    zeigen"-Umschalter mit `localStorage`, analog zum bestehenden Zahlen-Toggle). Die sieben
    Prio-3-Nebenfunktionen (Name, „So funktioniert's", Chronik, Zahlen-Toggle, Engine-Info,
    Login, Neu beginnen) in ein neues „⋯ Details"-Panel gebündelt (Fokus-Falle,
    Escape-Handling inkl. verschachtelter Dialoge korrekt einzeln schließbar). Nur
    `app/index.html` geändert, reine Anzeige-Filterung (alle 25 Werte weiter berechnet).
    Getestet: Syntax-Check sauber, Playwright-Browser-Test (Gen-Filter + Aufklappen,
    Details-Panel + Fokus-Falle, verschachtelte Dialoge, Kernschleife unverändert),
    `app-parity`/`mf-fidelity` weiterhin grün.
  - [x] **P1.3 + P1.4 umgesetzt (2026-07-29):** Die zwei Umwelt-Klassen-Trennung (10
    Stress-Achsen nur über Biome/Ereignisse, nie als freie Regler) war bereits konsequent —
    als bewusste, abgeschlossene Entscheidung im Code kommentiert. 12 Biom-Buttons →
    kompakter „Presets ↗"-Button + Modal (aktives Biom weiterhin markiert, Klick übernimmt
    UND schließt das Panel, analog zum bestehenden Herausforderungen-Muster). Herausforderungen-
    und Einfluss-Kataloge starten jetzt kuratiert (5 gemischte Einträge nach Reich/Schwierigkeit
    bzw. die bestehende „naheliegend"-Sortierung) mit einem „Alle 271/10 anzeigen"-Link zur
    vollen, unveränderten Such-/Filter-Ansicht. Nebenbefund behoben: `[hidden]` wurde durch
    gleich-spezifische `display`-Deklarationen dreier Klassen (`.infl-quick`/`.infl-cats`/neu
    `.catalog-showall`) unterlaufen — vorbestehender Bug (auch schon bei der alten
    Einfluss-Suche), jetzt mit expliziten `[hidden]`-Overrides gefixt. Getestet: Playwright
    (Presets/Fokus-Falle/Escape, beide Kataloge kuratiert→voll, Suche weiterhin funktionsfähig,
    Kernschleife unverändert), `app-parity`/`mf-fidelity` grün, `ui-calm-check`-Fail als
    vorbestehend/unabhängig verifiziert (identisch auf unverändertem HEAD reproduziert).
    **Noch offen aus P1-P2:** Datei-Aufsplittung (P1.5, reine Infrastruktur ohne
    Spieler-Sichtbarkeit — niedrigere Priorität als P1.3/1.4), Inline-Fitness-Kopie
    eliminieren (P2.6).

### 4 · Flacher Vektor-/Siebdruck-Stil (Redesign, 2026-07-29) — eigener Branch, läuft parallel

Nutzer-Auftrag: die gesamte Oberfläche auf flachen Vektor-Illustrationsstil mit
Siebdruck-Anmutung umstellen (Referenz: Two Dots, Mid-Century-Wissenschaftsposter) —
nur Flächenfarben, kein Verlauf/Schatten, max. 5 Farben je Ansicht, Umgebungsvariablen
als Farbsystem (Temperatur → Hintergrundton, Sauerstoff/Nährstoffe → Partikeldichte,
Feuchtigkeit → Formensprache Welle↔Kristall, Strahlung/Druck → Lichtkeile), Lebewesen
als reine modulare Silhouette mit einer Akzentfarbe für neu erworbene Merkmale.
Konzept-Vorschau (Palettenvergleich + Live-Demo) vorab als Artifact abgestimmt,
Palette **„Klippenlicht"** (Aubergine-Ink + dusty Lilac + Ringelblume-Akzent) gewählt.
Branch `claude/flat-vector-simulation-ui-kttqxx`.

**Modell:** je Phase unterschiedlich — s. Tags unten (Phase 3 Opus, Rest Sonnet).

- [x] **Phase 1 — Design-Tokens**: `:root`-Palette auf Klippenlicht umgestellt,
  Neomorph-Schatten (`--shadow*`) durch flache Hairline-Konturen ersetzt, alle
  `linear-/radial-gradient`-Stellen (Body-BG, Gen-/Vitalitätsbalken, Login-Card,
  Flash-Effekte, Rarity-/Toast-Glows) geflacht, `backdrop-filter`-Blur aus allen
  Modal-Scrims entfernt, Kontrastfixes für helle Schrift auf Akzentflächen,
  Papierkorn-Overlay als globaler SVG-Filter (`feTurbulence`).
- [x] **Phase 2 — Habitat-Renderer Canvas→SVG**: `drawHabitat()`/`drawMotes()`
  laufen jetzt als echtes SVG-DOM statt Canvas-2D. Temperatur → Hintergrundfarbe,
  Feuchtigkeit → Bodenform (weiche Welle ↔ harte Kristallkante), Strahlung/Druck
  (UV+Strahlung+Tiefsee-Druck) → diagonale Lichtkeile, Sauerstoff+Nahrungsfülle →
  Partikeldichte/-deckkraft. Alle bestehenden Regler/Stress-Chips (Gift, Hypoxie,
  Salz, Schnee, Wasserstand) bleiben erhalten, jetzt flach statt Verlauf. Die
  Kreatur selbst läuft vorerst weiter auf einem transparenten Canvas-Overlay über
  der SVG-Bühne (Übergangslösung bis Phase 3).
- [x] **Icon-Konsistenz-Audit**: 8 reine Strich-Icons (`snow`, `waves`, `dna`,
  `globe`, `wind`, `mineral`, `link`, `fern` + `moss`/`mold`/`mycelium`) brachen
  mit dem „kein Outline-Stil"-Prinzip → auf flache Silhouetten/kräftigere Striche
  umgestellt. Letzte rohe Emoji (☁️ Cloud-Sync-Status, 👋 Onboarding-Hinweis)
  durch flaches Icon ersetzt bzw. entfernt — der Rest der App nutzt bereits
  durchgängig `ic()`/`formIcon()`.
- [ ] **Phase 3 — Kreatur-Silhouetten (offen, größter Rest-Brocken)** — **Modell: Opus**
  (geschmacksintensivster Teil, Sonnet bleibt Orchestrator/Integration):
  `drawAnimal/drawPlant/drawFungus/drawMicrobe/drawProtist/drawSessile`
  (~800 Zeilen biologischer Sonderfälle: Biolumineszenz, Tarnung, Flugbauplan …)
  von Canvas-2D auf modulares SVG umbauen — Körperkern + austauschbare Anbauteile
  (Flossen, Membranen, Panzerplatten, Fühler) als eigene Elemente, Tiefe über
  Layering + Helligkeitsstufen statt Schlagschatten, EINE Akzentfarbe für das
  jeweils neu erworbene Modul (braucht neue Erkennungslogik: welches Modul ist
  seit der letzten committeten Form neu — baut auf der bestehenden Formkipp-
  Erkennung für die Chronik auf).
- [ ] **Phase 4 — Restliche UI** — **Modell: Sonnet** (Palette/Regeln bereits definiert, nur
  Übertragung): Genom-Balken, Vitalitätsanzeige, Chronik,
  Genbook, Baum-des-Lebens-SVG, Challenge-Liste auf dieselbe Palette + die
  Hell/Dunkel-Hierarchieregel übertragen (Werte/Regler/Buttons bleiben die
  einzigen hellen, hochkontrastigen Elemente).
- [ ] **Phase 5 — Audit** — **Modell: Sonnet** (Checkliste abarbeiten): WCAG-Kontrast erneut
  prüfen, `prefers-reduced-motion` erhalten, alle Biome/Extremregler/Mutationsfälle
  durchklicken.
- [ ] **Zwei kleine Politur-Punkte aus Phase 2** — **Modell: Sonnet**: Himmel wirkt bei
  mittlerem Licht etwas zu dunkel (Helligkeits-Kurve in `drawHabitat()` nachjustieren);
  die Wellenlinie am Boden (`groundPath()`) könnte mit mehr Stützpunkten runder
  werden.

Betrifft nur die Präsentationsschicht — `engine/`, `physics.json` und die
Fitness-Validierung (`npm run parity`) sind unangetastet.

### 5 · Nutzerbindung / Spieltiefe — V1 „Herausforderungen der Natur" live, Ausbaustufen offen

*(Nutzer, 2026-07-26)* Ursprünglicher Befund: „Durch das einfache Regler-Ändern kommen zwar
immer wieder neue Wesen, aber es hat keine Verbindlichkeit." Diagnose + Recherche in
**`docs/bindung-konzept.md`**: gemessen an der Selbstbestimmungstheorie stand Evolve extrem
ungleich (Autonomie maximal, Kompetenz fast null, Verbundenheit null) — ein Regler ohne
Kosten macht jede Handlung folgenlos, das ist die Grenze zwischen Spielzeug und Spiel.

**Die Empfehlung daraus — V1 „Herausforderungen der Natur" — ist inzwischen umgesetzt**
(v0.71.0–v0.75.0, voller Verlauf in `docs/influence-plan.md` S0–S8): 271
simulations-verifizierte Herausforderungen spielbar (Button „Herausforderungen ↗",
Suche/Filter, HUD), schließt genau die Kompetenz-Lücke aus der Diagnose. **Damit ist dieser
Punkt kein offenes Konzept mehr** — nur die Ausbaustufen sind noch unentschieden:

- [ ] **V1-Ausbaustufen** — **Modell: Opus** (Spieldesign-/Architektur-Abwägungen mit viel
  Ermessen — erst nach Produktentscheidung des Nutzers starten) — feste Startwelt für alle,
  Bestenliste nach Generationenzahl, „Welt der Woche" mit Ergebnis-Vergleich. Brauchen einen
  Server/Vergleichsraum (Supabase steht bereits) — bewusst nicht Teil der Erstversion.
- [ ] **V2–V5** (`docs/bindung-konzept.md`) — **Modell: Opus** (aus demselben Grund wie oben;
  ebenfalls erst nach Produktentscheidung) — Trägheit der Welt, Aussterben nur unter
  Beobachtung, Wissen als Meta-Fortschritt, Verbundenheit über einen wöchentlichen festen
  Seed. Nur recherchiert/vorgeschlagen, keine Umsetzung — nächste Empfehlung wäre V4 (Wissen
  als Meta-Fortschritt). **Start ist Produktentscheidung des Nutzers**, nicht eigenmächtig
  umsetzen.

### 6 · Große Brocken — Rest-Achsen (wartet auf Punkt 2)

Von den ursprünglich geplanten Achsen sind AXIS-1 (Flug), AXIS-4 (Aquatik) und AXIS-5
(Biolumineszenz) erledigt (s. „Erledigt").

**Beim Durchsortieren gefunden (2026-07-29) — zwei Punkte standen fälschlich noch als offen:**
- **AXIS-2 „Graben"** (Gen „Grabklauen", Ziel: Maulwurf/Wühlmaus-Nische über
  Räuberdruck-Flucht) ist **bereits erledigt** — unter der Bezeichnung **AXIS-9 Graben**
  (`burrow`) im „Breiten-Ausbau"-Batch, identisches Ziel und identische Nische erreicht.
  **Nicht erneut bauen.**
- **AXIS-3 „Ernährungsmodus"** ist im Filtrierer-Teil ebenfalls **bereits erledigt** (eigenes
  Gen `filter`, neuer Energiekanal, s. „Erledigt"). Offen bleibt nur der ursprünglich
  mitgemeinte Aasfresser-/Parasit-Teil, den es nie als eigenes Gen gab.

- [ ] **Rest von AXIS-3 · Aasfresser/Parasit** — **Modell: Sonnet** — kein eigenes Gen bisher, geringe Priorität,
  nur falls ein konkreter Katalog-Faktor es rechtfertigt (Gefahr sonst: reine
  Muster-Wiederholung mit abnehmendem Grenznutzen, wie im Breiten-Ausbau dokumentiert).
  **Nicht anfassen, bevor Punkt 2 (Engine-Grundlagenforschung) abgeschlossen ist** — die
  hält `engine/fitness.ts`/`physics.json` bis dahin bewusst unverändert.

### 7 · Live-App — Feinschliff & Aufräumen (kleinere Reste)

**Modell:** Sonnet — durchweg kleine, klar umrissene Fixes/Cleanups.

- [ ] **CLS-4-Rest · schmale Größenfenster** — einige seltene Formen (Nadelbaum, Blütenkraut,
  Hutpilz) hängen weiter an engen Klassifikations-Fenstern. Kein Attraktor-Problem mehr
  (BAL-5 hat die Mitte entzerrt) — eher eine `classify()`-Grenz-Feinjustierung, geringe
  Priorität.
- [ ] **Lebensbaum-Lücke „Leuchtwesen · Tiefsee"** — die Form ist über `classify()` real
  erreichbar (Reich Tier) und wird von den Herausforderungen genutzt, fehlt aber im `TREE`
  (Genbuch) selbst, dadurch auch in `FORM_KINGDOM`. Für den Herausforderungen-Reich-Filter
  lokal in `app/index.html` überbrückt (`CHAL_KINGDOM_FALLBACK`); der eigentliche
  Lebensbaum-Eintrag (Ära/Evo-Notiz) fehlt weiterhin.
- [x] **`docs/auslagerung/P5-ausgabe.json` aufräumen** (erledigt 2026-07-29) — Deletion
  hätte den historischen Kontext verloren, daher stattdessen `P5-aufgabe.md` mit einem
  klaren „ersetzt durch P8"-Hinweis versehen (JSON selbst unangetastet, bleibt als Archiv).
- [ ] **P7 · Qualitäts-Audit** — zweiter Blick auf die bereits übernommenen P3-Erklärungen und
  S6-Erzähl-Bausteine (nur als Idee notiert, nie als Paket beauftragt oder gebaut).
- Optional: A4-Feinschliff (Ahnenlinie cloud-synchron via `ancestry`-Spalte — braucht
  Supabase-Schema; das In-App-Namensfeld ist bereits umgesetzt, kein `prompt()` mehr);
  B-Reste (Kontrast-Feintuning, autocomplete `new-password` bei Signup).
- [ ] **`npm run seed-check` schlägt fehl** (Befund 2026-07-29, beim Prüfen von Punkt 9
  entdeckt) — „Monomorpher Start (NN klein)" FAIL, NN=0.149 gegen Schwelle 0.12.
  **Vorbestehend, nicht durch Punkt 9 verursacht** (auch mit dem alten `numGenes:9`-Default
  bereits FAIL, per `git stash` gegengeprüft). Vermutlich eine zu eng kalibrierte Schwelle
  in `tools/seed-check.mjs` für die inzwischen 25-dimensionale Nächste-Nachbar-Distanz — nicht
  näher untersucht, geringe Priorität (betrifft nur die „Lebende Welt (Beta)"-Overlay-Startlogik).

### 8 · Gamification-Feinschliff

**Modell:** Sonnet — kleine UX-Politur, geringe Tragweite.

Rarität-Grundmechanik ist umgesetzt (s. „Erledigt" → „Rarität / Entdeckungs-Tiefe"). Offen
als Politur:
- [ ] Sanfte Biom-Empfehlungen („in diese Richtung wohnt noch etwas Seltenes") statt harter
  Gates.
- [ ] Rarität optional auch in `tree-of-life.json` spiegeln.

### 9 · Realitätstreue-Loop (Forschungsarbeit 2026-07-28)

Forschungsauftrag: wissenschaftlich fundiertestes Evolutionsmodell + ein automatischer
Kreislauf, der seine Treue zur biologischen Realität selbst misst und maximiert.
**Volles Dokument:** `docs/evolution-fidelity-loop.md`.

Kern-Idee: Realitätstreue ist keine einzelne Zahl, sondern drei unabhängige Schichten mit
je eigener Mindestschwelle (keine Schicht darf die andere „erkaufen"): **A** Evolutionstheorie-
Phänomene (P1–P8: Radiation, Branching, Allopatrie, Konvergenz, Red Queen, Kontingenz,
Verteilungsgesetze, Aussterben/Erholung), **B** reale Biodiversitäts-Verteilungen (SAD/SAR/
Größenspektrum gegen publizierte Referenzformen), **C** Distillation der Browser-Engine gegen
ein reicheres Offline-Referenzmodell (Orakel). Ein äußerer Optimierungs-Loop (Kandidat →
simulieren → messen → Regressionsschutz per Holdout → Champion persistieren) sucht Engine-
Parameter automatisch; Strukturänderungen (Genom-Topologie/GRN) bleiben bewusst außerhalb der
Auto-Schleife, um Overfitting an die eigene Messlatte zu vermeiden.

Repo-Abgleich (Teil VI des Dokuments) zeigt: Populations-Kern, Ko-Evolution, Metapopulation,
Cluster-basierte Arten und ein erster GA-Loop (`training/fit.ts`) existieren bereits und decken
strukturell Schicht C ab — Schicht A und B fehlen als Portfolio/Metriken noch komplett.

> **Korrigiert (2026-07-29):** Der ursprüngliche Befund „`world/population.ts` (`numGenes: 9`)
> vs. 25 Gene" trifft **nicht** den echten Engpass — `numGenes: 9` ist dort nur ein toter
> Default; jeder tatsächliche Aufrufer (`world/world.ts`, `world/coevolution.ts`, alle
> `*-check.mjs`-Gates, `cli/world-demo.ts`) übergibt bereits explizit `numGenes: 25`
> (`phys.traits.length`). Eine Änderung an dieser einen Zeile wäre wirkungslos.
>
> Die reale Genom-Breiten-Lücke sitzt in **`training/fit.ts`**: `NUM_GENES = 9` ist dort hart
> codiert und bestimmt die Länge von `EngineParams.responseRate`, das der GA fittet und in
> `fitted-params.json` schreibt. `engine/simulate.ts` läuft aber inzwischen über alle 25 Gene
> (`TRAITS.length`) — mit nur 9 `responseRate`-Werten wird `params.responseRate[g]` für die
> Gene 10–24 `undefined`, wodurch diese Gene ab Generation 1 zu `NaN` werden. Bleibt bisher
> unbemerkt, weil `tools/ecology-check.mjs` (eines der 5 Validierungs-Gates, nutzt
> `fitted-params.json`) für seine Reich-Klassifikation nur die ersten Gen-Indizes (Größe,
> Photosynthese, Mobilität, Struktur) liest — die NaN-Gene fließen nie in die Prüfung ein.
> Genau das „ein spätere Loop misst ein verkürztes Modell"-Risiko aus dem Forschungsdokument,
> nur eine Ebene tiefer als ursprünglich vermutet. (`engine/types.ts`s `DEFAULT_ENGINE_PARAMS`
> hat denselben 9-Gene-Rest, wird aber nur vom archivierten `mockup/` + `cli/demo.ts` genutzt —
> niedrige Priorität.)

- [x] **Schritt 1 — `training/fit.ts` auf 25 Gene bringen (erledigt 2026-07-29, mit
  strukturellem Restbefund):**
  **Tieferer Befund beim Umsetzen:** die Lücke saß nicht nur in `training/fit.ts` — die
  wirklich bindende Quelle war `engine/types.ts`s `TRAITS`-Konstante, die trotz `physics.json`s
  25 Traits (und `fitness.ts`s Indizes bis 24) noch immer nur **10** Gene listete.
  `engine/simulate.ts`s `runSimulation`/`stepGeneration` nutzen `TRAITS.length` als Vektorlänge
  → die 15 bedingten Kosten-Gene waren in der Mittelfeld-Engine strukturell gar nicht Teil des
  Zustandsvektors (nicht bloß `NaN`, wie zunächst vermutet: `fitness.ts`s `traits[g] ?? 0`
  hielt sie hart bei 0). Nur `app/index.html`s Hand-Kopie hatte das mit einem GESCHÄTZTEN
  Platzhalter (`responseRate` 0.27 für Index 10–24, nie GA-gefittet) umschifft.
  **Fix:** `TRAITS` in `engine/types.ts` auf alle 25 Gene erweitert (Reihenfolge = `physics.json`),
  `DEFAULT_ENGINE_PARAMS` inkl. `mutationAnchor` (Kern 0–9 → 0.5, bedingte Kosten-Gene 10–24 →
  0.12) mitgezogen; `training/fit.ts`s `NUM_GENES` liest jetzt dynamisch aus
  `phys.traits.length`, hängt denselben `mutationAnchor` fix an (kein GA-Parameter), GA-Budget
  an die gewachsene Dimension angepasst (POP 72→160, GENS 140→160); `world/population.ts`s
  `numGenes`-Default 9→25 (Hygiene, kein funktionaler Effekt, alle echten Aufrufer übergaben
  ohnehin schon 25). GA zweimal neu trainiert (`npm run train`, zweiter Lauf zusätzlich mit
  Zufalls-Immigranten gegen vorzeitige Plateaubildung) — beide Läufe konvergierten
  unabhängig auf fast denselben Wert. `app/index.html`s `PARAMS.responseRate`/`mutationRate`/
  `selectionStrength` mit dem ehrlich gefitteten Ergebnis synchronisiert (ersetzt den alten
  Platzhalter). Alle Gates gegengeprüft: `pop-check`, `branching-check`, `world-check`,
  `parity`, `ecology`, `ecology-full`, `reality` (20/20), `app-parity` (exakt), `mf-fidelity`
  — alle grün (`mf-fidelity` sogar verbessert: reale statt geschätzte Stressor-Antworten).
  `seed-check`-FAIL ist der bereits unter Punkt 7 dokumentierte, unabhängige Vorbefund.
  **Ausstiegsregel griff (Identifizierbarkeit, Forschungsdokument Teil V Punkt 3):**
  `validityTest` blieb nach der Erweiterung UND nach dem zweiten (Immigranten-)Lauf bei
  ~71–72 % — deutlich unter dem 80–90 %-Band, keine Verbesserung durch mehr Suchbudget
  (Trainingskurve flachte beide Male um Generation 60–80 vollständig ab: echte Konvergenz,
  kein Budget-Mangel). Eine Per-Gen-Fehleranalyse (MAE Engine↔Orakel je Gen) zeigt: die
  Verschlechterung verteilt sich über FAST ALLE 25 Gene (auch die ursprünglichen 9 Kern-Gene
  liegen jetzt schlechter als die alte ~85 %-Zahl vermuten liess, z. B. armor 0.099, mobility
  0.096, wing 0.091), nicht isoliert auf die neuen 15 — Ursache ist strukturell: `mutationRate`/
  `selectionStrength`/`varianceWeight` sind EINE globale Zahl für alle 25 Gene gleichzeitig
  (nur `responseRate` ist pro Gen), das reicht nicht mehr, um 25 Orakel-Trajektorien gemeinsam
  zu treffen, sobald man sie ehrlich (nicht mehr blind für 15 von 25) misst. Auffälligster
  Einzelfall: `nfix` (MAE 0.103, schlechtester Wert) — das Orakel lässt Stickstoff-Fixierung in
  manchen benignen Szenarien (z. B. „Eiszeit", mobility niedrig) auf ~0.83 statt der als
  „bedingtes Kosten-Gen" angenommenen Nähe zu 0.12 laufen; anders als die zehn reinen
  Stressor-Resistenz-Gene ist `nfix` (wie `filter`) ein ALTERNATIVER Energiepfad, der auch ohne
  einen benannten Extrem-Stressor eine eigene Nische tragen kann — der binäre Kern/Kosten-Anker
  ist dafür zu grob. Das ist genau das im Forschungsdokument vorhergesehene Signal: **kein
  Kalibrierungsproblem mehr, sondern eine Strukturgrenze der Mittelfeld-Engine.**
  **Konsequenz:** Schritt 6/7 (Drei-Schicht-Optimierungsloop) bleiben pausiert, bis diese
  Strukturfrage separat geklärt ist (z. B. per-Gen-Mutationsrate/-Selektionsstärke statt
  globaler Skalare, oder eine feinere Anker-Kategorisierung, die `nfix`/`filter`/`burrow`/
  `camo`/`sense` von den zehn reinen Stressor-Resistenz-Genen unterscheidet) — **absichtlich
  nicht eigenmächtig umgesetzt**, da das laut Autonomie-Regel in `training/fit.ts` eine
  bewusste Struktur-, keine Parameter-Entscheidung ist. Kopfzeile dieser Datei entsprechend auf
  ~72 % korrigiert (ehrlicher Wert statt der alten, für 15 Gene blinden ~85 %-Zahl).

**Ab hier zwei unabhängige Spuren, die parallel begonnen werden können** (Schritt 2–3
betreffen den Populations-Kern `world/`, Schritt 6–7 die Mittelfeld-Engine aus Schritt 1 —
verschiedene Code-Pfade, keine gegenseitige Abhängigkeit außer der angegebenen):

- [x] **Schritt 2 — Schicht-A-Portfolio (erledigt 2026-07-29)** (P1–P8) — als neues Gate
  `tools/phenomena-check.mjs`
  (+ ggf. `world/phenomena.ts` für die Szenario-/Metrik-Logik, analog zum Aufbau von
  `world/cluster.ts`/`tools/branching-check.mjs`). Zielband + Szenario-Beschreibung je
  Phänomen stehen in `docs/evolution-fidelity-loop.md`, Abschnitt **„### Schicht A —
  Evolutionstheorie-Phänomene"** (Tabelle) und **„### 2. Die bekannten emergenten
  Phänomene"**. Wichtig, um Doppelarbeit zu vermeiden — **vier der acht Phänomene haben
  bereits eine funktionierende Referenz-Implementierung, die nur noch ins Portfolio-Format
  gebracht werden muss**, statt neu gebaut zu werden:
  - **P2 Branching** → `tools/branching-check.mjs` (σC<σK, ≥2 Cluster).
  - **P3 Allopatrie** → `tools/world-check.mjs` (isolierte Orte divergieren).
  - **P5 Red Queen** → `tools/coevolution-check.mjs` (anhaltende Merkmalsoszillation).
  - **P8 Aussterben** → `tools/world-check.mjs` (Katastrophe senkt Diversität) — hier fehlt
    noch die **Erholung** danach (world-check prüft nur den Einbruch); im Portfolio um
    „Diversität steigt in den N Generationen nach der Katastrophe wieder" ergänzen.
  Net-neu zu bauen: **P1 Radiation** (Nischen in einer Metapopulation öffnen, Δ Artenzahl
  über `world/census.ts` messen), **P4 Konvergenz** (gleiche Umwelt, verschiedene
  Start-Seeds → End-Distanz sollte klein sein), **P6 Kontingenz** (gleiche Umwelt, viele
  Seeds → Varianz der Endzustände: muss > 0 UND unter einer plausiblen Obergrenze liegen —
  Band selbst begründen und im Code kommentieren, keine Zahl ohne Begründung).
  **P7 Verteilungsgesetze NICHT hier separat implementieren** — ruft stattdessen die
  Fit-Funktion aus Schritt 4 (Schicht B) auf und prüft nur „Distanz unter Schwelle"; sonst
  entsteht doppelte, potenziell widersprüchliche Logik.
  **Pro Szenario zwingend:** ein Ablations-Lauf (die für dieses Phänomen ursächliche Kraft
  abschalten) muss das Zielband **verfehlen** — sonst ist der Test kein Beweis für
  Emergenz (Validierungsplan Teil V Punkt 1).
  **Baue den Portfolio-Runner von Anfang an mit einem `disabledMechanisms`-Parameter**
  (z. B. `{ competition: false, migration: false, coevolution: false, drift: false }`) —
  das macht Schritt 3 zu einer reinen Wiederverwendung statt einer zweiten Implementierung.
  **Ergebnis:** `world/phenomena.ts` + `tools/phenomena-check.mjs` gebaut, `Mechanisms`-
  Interface (`competition`/`migration`/`coevolution`/`drift`) + `popConfigFor()` als
  wiederverwendbarer Ablations-Baustein für Schritt 3. 7/8 Phänomene im Zielband (P7 korrekt
  als „wartet auf Schritt 4" markiert, kein FAIL), alle 7 Ablationen verfehlen ihr Zielband
  wie gefordert. Ehrlicher Einzelfall dokumentiert: bei P4 (Konvergenz) war die naheliegende
  Ablation „Konkurrenz einschalten" empirisch wirkungslos (0.183 vs. 0.201 — kaum
  Unterschied) — statt die Schwelle zu verbiegen, wurde eine dedizierte, im Code explizit
  dokumentierte Ablation gebaut (neutrale, fitnessfreie Reproduktion, 0.183→0.653). Alle 5
  Kern-Gates weiterhin grün, `package.json` nur um ein Script ergänzt.
- [ ] **Schritt 3 — Mechanismus-Ablationsstudie** — **Modell: Sonnet** (Diagnose-Ausgabe, kein
  Gate, mechanisch) (Validierungsplan Teil V Punkt 2): den
  Schritt-2-Portfolio-Runner einmal je Mechanismus mit `disabledMechanisms` auf „aus"
  laufen lassen (Konkurrenz/Migration/Ko-Evolution/Drift einzeln), Matrix „Mechanismus ×
  welches P-Ergebnis kippt" ausgeben (z. B. `tools/ablation-check.mjs`, druckt eine Tabelle,
  kein hartes Pass/Fail nötig — das ist eine Diagnose-/Doku-Ausgabe, kein Gate). Bindet
  Mechanismus kausal an Phänomen; Ergebnis kurz in diesem Backlog-Punkt oder einer neuen
  Datei `docs/ablation-results.md` festhalten.
- [ ] **Schritt 4 — Schicht-B-Metriken** — **Modell: Sonnet** (Umsetzung), aber bei der
  Quellen-/Bandwahl unter Unsicherheit sorgfältig gegen die Literatur abwägen (Belegprinzip,
  s. u. — bei ernsthaftem Zweifel eher Rücksprache/Opus für die Bewertung als eine erfundene
  Zahl): Referenzverteilungen mit Quelle (Anhang „Belegprinzip"
  in `docs/evolution-fidelity-loop.md` beachten — **keine erfundenen Zahlen**, wo Unsicherheit
  besteht ein Band statt eines Punktwerts) für Körpergrößen-Verteilung (log-normal), SAD
  (Fisher 1943 log-series bzw. Preston 1948 log-normal), SAR (S≈c·Aᶻ, z≈0.2–0.35,
  Arrhenius/Rosenzweig), trophische Pyramide (~10× Biomasse-Abnahme je Trophiestufe),
  Merkmals-Kovarianz (Kleiber 1932 — bereits im Code als `kleiberDecades` in
  `physics.json`/`engine/fitness.ts` vorhanden, hier nur der Realitäts-Abgleich). Score_B =
  1 − normierte KS-/Earth-Mover-Distanz. `docs/biodiversity-reference.md` hat bereits die
  Reich-Anteil-Kriterien C1–C6 (Schicht-A/Kingdom-Ebene, von `ecology-check.mjs` genutzt) —
  das ist NICHT dasselbe wie Schicht B (Verteilungs-*Form*, nicht Reich-*Anteil*); als
  Vorbild für den Belegprinzip-Stil trotzdem lesenswert. Neues Gate z. B.
  `tools/distribution-check.mjs`.
- [ ] **Schritt 5 — Gewichte & Schwellen festlegen** — **Modell: Sonnet** (begründete
  Default-Wahl + Dokumentation, kein tiefes Ermessen nötig) (Forschungsdokument „### Aggregat"):
  `Fidelity = w_A·Score_A + w_B·Score_B + w_C·Score_C` mit Pro-Schicht-Mindestschwellen.
  **Ausdrücklich KEINE Rückfrage nötig** — das ist laut Dokument eine bewusste, aber vom
  Optimierer entkoppelte technische Entscheidung (Goodhart-Schutz), keine Produktentscheidung
  des Nutzers; frühere Kalibrierungs-Entscheidungen in diesem Repo (z. B. BAL-5
  Panzer-Grenzkosten, Kleiber-Rabatt, `mutationAnchor`-Werte) wurden genauso autonom
  getroffen und dokumentiert. Anforderung: **als benannte, an einer Stelle zentrierte
  Konstante ablegen** (z. B. `training/fidelity-config.ts`), NICHT über den Code verstreut,
  mit einem Satz Begründung je Wert im Kommentar — damit spätere Korrektur billig bleibt.
  Sinnvoller Startpunkt, falls keine bessere Begründung gefunden wird: gleich gewichtet
  (w_A=w_B=w_C=1/3), Mindestschwelle je Schicht so, dass der aktuelle Stand (nach Schritt
  2+4) knapp durchfällt statt knapp besteht — ein Prüfstand, der beim ersten Lauf grün ist,
  prüft nichts.
- [ ] **Schritt 6 — `training/fit.ts` zum Drei-Schicht-Loop ausbauen** — **Modell: Opus** für
  den Loop-/Gate-Architekturentwurf (Overfitting-Vermeidung ist konzeptionell heikel),
  **Sonnet** für die Implementierung danach (Forschungsdokument
  Teil IV, „### 4.2 Die sechs Stationen im Detail" — Kandidat, Simulieren, Messen,
  Optimierer, Selektion mit Holdout, Champion+Report). Baut auf Schritt 1 (25-Gene-Fitting)
  UND Schritt 5 (Gewichte/Schwellen) auf; Schritt 2–4 liefern die Score_A/B/C-Messfunktionen,
  die hier als Blackbox-Fitness des Optimierers eingehängt werden. Kandidat-Parameterraum
  bleibt **ausschließlich kontinuierlich** (Mutationsrate, Selektionsschärfe, σ_C/σ_K, N,
  responseRate, `mutationAnchor`) — **keine Struktur-Parameter** (s. Schritt 7). Champion +
  vollständiger Metrik-Vektor versioniert speichern (z. B. `fidelity-champion.json`,
  Zeitstempel + Seed, analog zu `fitted-params.json`), Report zeigt Trend über Iterationen
  + welche Schicht limitiert. Holdout-Portfolio (Szenarien, die der Optimierer nicht sieht)
  gegen Overfitting — Train/Test-Split wie in `training/fit.ts` bereits vorhanden, hier auf
  alle drei Schichten ausweiten.
- **Schritt 7 — bewusst NICHT bauen (Strukturentscheidung, Forschungsdokument § 4.2 [1]):**
  eine nichtlineare Genotyp→Phänotyp-Abbildung (GRN/Epistase) bliebe der größte verbleibende
  Realismus-Hebel, gehört aber laut Dokument ausdrücklich außerhalb der Auto-Schleife (sonst
  überfittet der Optimierer die Struktur an seine eigene Messlatte). Falls der Fidelity-Loop
  aus Schritt 6 dauerhaft bei Score_A hängen bleibt, obwohl Parameter längst ausgereizt sind,
  ist DAS das Signal, dass dieser Punkt fällig wird — dann als neuer, eigener Backlog-Punkt
  aufnehmen, nicht in Schritt 6 hineinquetschen.

**Sicherheitshinweis für Schritt 2–7:** nichts davon berührt `app/index.html` direkt —
Schritt 6 schreibt nur `fitted-params.json`/`fidelity-champion.json` (gelesen von
`tools/ecology-check.mjs`/`cli/demo.ts`, NICHT von der Live-App), Schritt 2–4 sind neue,
eigenständige `world/`+`tools/`-Dateien. **Ausnahme Schritt 1** (s. o., bereits erledigt):
dort WURDE `app/index.html`s `PARAMS`-Kopie bewusst synchronisiert (ersetzt einen nie
gefitteten Platzhalter durch den echten GA-Wert) — die „Live-App bleibt unangetastet"-
Leitplanke aus `docs/rebuild-roadmap.md` gilt also ab Schritt 2, nicht rückwirkend für
Schritt 1. Jeder Schritt einzeln committen, nach jedem Schritt die 5 Kern-Gates
(`pop-check`, `branching-check`, `world-check`, `parity`, `ecology`) plus alle neu
hinzugekommenen Gates grün — genau wie im Rest des Repos üblich.

Wird sukzessive abgearbeitet (kein automatischer Trigger mehr aktiv — Start ab
Mi 2026-07-29).

---

## 🧭 Produkt-Pfeiler (Leitplanken)

- **Neugier + Bindung, KEIN Vollständigkeits-Zwang** (Resume-Pfeiler).
- **Rarität = Entdeckungs-Tiefe**, keine kaufbare Währung / kein Grind (Skinner-Loop).
- **Wertschätzung für die Natur als positives Neben-Ziel** *(Nutzer, 2026-07)* — **implizit,
  nicht explizit**: über glaubwürdige Baupläne, echte Erdzeit-Reihenfolge (Hover „wann"),
  reale Klade-Namen und die Referenz-gestützte Ökologie soll ein Staunen über die Vielfalt
  des Lebens *mitschwingen* — ohne belehrenden Ton, ohne „Lern"-Overlay. Prüf-Frage für neue
  Features: *Weckt es Staunen, oder nur Sammel-Druck?* (Ersteres fördern, Letzteres meiden.)

---

## ✅ Erledigt (Archiv)

### Spiel-Motivation & Klarheit — Batch (2026-07, v0.64–v0.66)
Nach dem Evolutions-Audit: Fokus-Wechsel von Simulations-**Breite** zu spürbarer **Klarheit &
Bindung** (gesunder Suchtfaktor über Neugier/Meisterschaft/Bindung/Überraschung — keine Dark
Patterns: kein Streak-Zwang, kein Verfall-Schuldgefühl, kein Sammelzwang):
- ✅ **Selektions-Theater (v0.64.0):** die Gen-Balken zeigen live, welches Merkmal die aktuelle
  Umwelt gerade auslest (↑ gefördert / ↓ zurückgedrängt, Intensität ~ Selektionsstärke) — aus
  demselben Gradienten ∂Fitness/∂Gen, der die Zahlen bewegt. Macht die bisher unsichtbare
  Evolution zum sichtbaren Drama (adressiert die Audit-Selbstkritik „Tiefe, die niemand sieht").
- ✅ **Comeback-Moment (v0.65.0):** der „Willkommen zurück"-Reveal zeigt jetzt die **Passung
  vorher → nachher** (unter der aktuellen Welt gemessen) mit ermutigendem Schluss — beantwortet
  die Kern-Bindungsfrage „gedeiht mein Wesen?". Nur bei echter Fitness-Änderung (≥2 %), belohnt
  Wiederkommen ohne Weggehen zu bestrafen.
- ✅ **Katalog-Kuratierung (v0.66.0):** die vielen „kommt bald"-Faktoren im Einfluss-Sub-Modal
  klappen hinter einen Aufklapper („▸ N weitere aus dem Katalog · in Arbeit") — die aktiven
  Faktoren stehen sofort und ungestört da (statt „Museum mit 88 % geschlossenen Räumen").

- ✅ **Sanfte Ziele — Reich-Meilensteine (v0.67.0):** das erste Wesen jedes der 5 großen Reiche
  löst einen warmen Staunens-Moment aus („Ein neues Reich: Tier … 3 der 5 großen Reiche erwacht")
  statt des normalen Fund-Toasts. Kein Sammelzähler, kein „X fehlt"-Nag; aus dem discovered-Set
  abgeleitet → keine rückwirkende Flut für Bestandsspieler.
- ✅ **Sanfte Ziele — Neugier-Anstöße (v0.68.0):** im „fertig angepasst"-Moment lädt die Warum-Zeile
  leise zum Weiterspielen ein und lehrt Ursache→Wirkung („Probier: mach es kälter — dann lohnt sich
  Wärmedämmung"). **Dabei Korrektur-Upgrade:** Warum-Zeile + Selektions-Theater lesen jetzt die
  NETTO-Änderung pro Generation (Selektion + Mutations-Rücktrieb, geklemmt) statt des rohen
  Gradienten — am Attraktor steht das Gen wirklich still („Angepasst — die Form steht"), Pfeile
  zeigen nur noch, was sich echt bewegt.

- ✅ **Teilbarer Schnappschuss (v0.69.0):** Knopf „Schnappschuss teilen ↗" in der Wesen-Karte
  rendert offline ein PNG (Habitat-Bild + Name + Reich·Form + Evo-Ministory aus dem Lebensbaum +
  „Evolve · Generation N"). Geteilt über die Web-Share-API (Mobil: native Auswahl), Download-
  Fallback (Desktop). Selbst-enthalten, kein Backend — soziale Verbreitung als gesunde Motivation.

**Damit ist der Motivations-Strang vollständig** (Selektions-Theater, Comeback-Moment, Katalog-
Kuratierung, Reich-Meilensteine, Neugier-Anstöße, Schnappschuss).

### Erzählwerk — Chronik-Stimme mit „unendlichem" Satzvorrat (2026-07, v0.70.0)

Nutzer-Wunsch: kurze Phrasen begleiten die Evolution an sinnvollen Stellen, deterministisch
aus einem Katalog. Nachgeschärfte Frage: **wie erzeugt man das Gefühl eines UNENDLICHEN
Vorrats ohne externe LLM-Werkzeuge?**

- ✅ **Recherche + Architektur-Entscheidung** (`docs/storytelling.md`): fester Phrasen-Katalog
  scheitert an Erschöpfung, wortweiser Baukasten an deutscher Kongruenz, reiner Zufall am
  „10.000 Schüsseln Haferbrei"-Problem (Compton). Rabii & Cook (FDG 2023): die Komplexität
  der Ausgabe ist durch das **im Generator kodierte Wissen** begrenzt — mehr Würfel helfen
  nicht. Emily Shorts Antwort für Text: **Salienz** (wie viel Weltmodell steckt im Satz).
  → **Unser Wissen ist die Simulation** (25 Gene, 16 Umwelt-Achsen, 43 Formen, 5 Reiche,
  Fitness, Selektionsgradient). Bauform nach Bruno Dias' „Improv": Modell → Tags → Grammatik.
- ✅ **`app/story.js`** — 444 Bausteine, 10 Satz-Schablonen, Tag-Filter, gewichtete
  deterministische Auswahl, Zwei-Ebenen-Gedächtnis (90 Bausteine / 160 Zeilen, überlebt
  Neuladen und „Neues Leben"). Deutsche Grammatik-Falle umgangen durch **Kombination auf
  SATZEBENE** (jedes Fragment = vollständiger Hauptsatz in V2-Stellung) — kein
  Morphologie-Modul nötig.
- ✅ **11 Beats** verdrahtet: anfang · heimkehr (Offline-Reveal) · welt (Regler/Biom/Einfluss,
  entprellt) · druck (60 Gen. gleicher Selektionsdruck) · wandel · reich · fund · ruhe
  (Attraktor) · not · bluete · zeit (Generationen-Marken). Schwellen zählen in
  **Generationen**, nicht Sekunden → Tempo „schnell" erzählt nicht häufiger.
- ✅ **UI:** ruhige Serifen-Zeile unter der Art + aufklappbares Archiv „Chronik dieses Lebens".
  Getrennte Stimmen: die Chronik **erzählt**, die Warum-Zeile **erklärt**.
- ✅ **`npm run story-check`** — Prüfstand nach dem Muster der Expressive Range Analysis
  (Smith & Whitehead 2010): 166 Lagen, ~10.000 erzeugte Sätze, 9 Prüfungen inkl.
  Widerspruchs-Test, tote Bausteine, Chao1-Vorratsschätzer, **Sitzungs-Simulation** und
  Haferbrei-Index (gzip). `--sample N` als Autoren-Schleife.
- **Messstand:** ~142.000 verschiedene Sätze aus 444 Bausteinen (Hebel ×320); in der
  Sitzungs-Simulation 120/120 Zeilen verschieden; Haferbrei-Index 34× über dem Boden.
- **Vom Prüfstand gefundene Fehler** (alle behoben, in den Docs dokumentiert): schwächstes
  Glied lag in *milden* Welten (Auftakt-Pool 40→6); eigener Dopplungs-Filter tötete
  „Generation für Generation"; allgemeine Rückfall-Sätze verdrängten die spezifischen
  (Salienz-Verlust); Zeitangaben widersprachen dem Anlass.
- **Leitplanken maschinell erzwungen:** keine Absichts-Sprache („will/versucht/lernt") —
  erzählt wird Auslese; kein Ausrufezeichen, kein Emoji, max. 120 Zeichen, kein Sammel-Nag.

### Evolutions-Validitäts-Audit + Mittelfeld-Fidelity-Fix (2026-07, v0.63.0)
Prüfauftrag: „stimmt die Evolution — Abgleich mit Referenz UND anderen Algorithmen?"
- **Mechanik bestätigt:** die Kern-Schleife deckt sich mit **fünf** Standard-Frameworks — Orakel =
  Wright-Fisher / genetischer Algorithmus (fitness²-proportionale Reproduktion + Rekombination +
  Gauß-Mutation, endliches N→Drift); App/Engine-Mittelfeld = **Lande-/Breeder-Gleichung**
  (`Δz̄ = G·β`, `G ≈ z̄(1−z̄)`); der `z̄(1−z̄)`-Term = **Replikator-Dynamik**; `world/population.ts`
  Konkurrenz-Kern = **Dieckmann & Doebeli 1999** (evolutionäres Branching). Zwei unabhängige
  Implementierungen, gegeneinander validiert. Alle Gates grün (parity 1e-17, ecology + ecology-full
  C1–C6, reality 20/20, pop-check 0.034, branching 2 Cluster), Referenz-Verteilung passt.
- **Ein echter Befund (unabhängiger Cross-Check):** das App-**Mittelfeld** (was der Nutzer sieht)
  warf die Wartungslast der 15 bedingten Kosten-Gene (Stressor-Resistenzen + Nischen-Mechaniken)
  in **gutartigen, produktiven** Biomen NICHT ab — sie hingen bei ~0.5 statt ~0.15. Die summierte
  Phantom-Last drückte das Wesen in die flache (nahrungs-boden-gedeckelte) Region der Landschaft;
  kein Einzel-Gen-Gradient kam heraus → angezeigte Vitalität auf bis zu **1/5** des Populations-
  Attraktors (Warm-üppig 0.11 statt 0.51). Kern-Gene / Reich waren korrekt (Swap-Test lokalisierte
  den Effekt vollständig auf Gene 10–24). Bisher **ungedeckt**, weil die Öko-Gates den agenten-
  basierten Kern prüfen, nicht das Mittelfeld.
- **Fix:** gen-spezifischer Mutations-Anker (`mutationAnchor`). Kern-Gene 0–9 ankern neutral bei
  0.5; die 15 bedingten Kosten-Gene ankern niedrig (0.12) — „standardmäßig aus", ohne ihren
  Stressor abgeworfen, unter ihm voll wieder auftauchend. Vitalität in reichen Biomen wieder
  realistisch (Warm-üppig 0.11→0.63), jede Stressor-Anpassung emergiert weiter.
- **Neues Gate `npm run mf-fidelity`:** rechnet die echte 25-Gen-App-Bahn (PARAMS aus `index.html`,
  app-parity-gleiche Fitness) und prüft (A) bedingte Gene in benignen Biomen abgeworfen, (B) jede
  Resistenz taucht unter ihrem Stressor auf. In `app-world-smoke` eingehängt — schließt den blinden
  Fleck dauerhaft. Fitness unberührt (parity/app-parity exakt); Engine-Änderung abwärtskompatibel.

### Usability-Audit (3 Agenten, 2026-07) — Onboarding · Interaktion · Barrierefreiheit
Drei Fachagenten prüften die Live-App heuristisch; die wertvollsten Befunde wurden in zwei
Batches behoben (v0.44.0 + v0.45.0), je mit headless-Probe + Smoke:
- **Verborgene Stressoren sichtbar** (P1, Kern-Loop): `toxicity/oxygen/salinity` (AXIS-6..8) haben
  keinen Regler → ein Wesen hing unerklärt bei ~2 % Passung. Jetzt Chips „giftig/sauerstoffarm/
  salzig ✕" neben dem Biom-Tag, per Klick entfernbar (= der fehlende Umwelt-Reset). Reset auch in
  `newLineage()` + beim State-Laden.
- **„Auslösen" bei pausierter Zeit** setzt die Sim automatisch fort (vorher nur Cinematik, keine
  Anpassung — Wirkung vorgetäuscht) + Info-Toast als Bestätigung (v. a. reduced-motion).
- **Sackgassen-Kategorien**: „nur kommt bald"-Kategorien deaktiviert, mit „bald"-Pille markiert,
  nach unten sortiert.
- **Veraltete „Lebende Welt"-Fußnote** entschärft (Feature nicht mehr erreichbar).
- **WCAG-AA**: `--muted` (#6b5836→#5c4a2c) + `--bio-dim` (#3d6b57→#356152) auch auf `--abyss`/bei
  kleinem Text; Prox-Badges + aktiver Speed-Toggle auf AA; Canvas `role=img`+aria-label; Gen-Balken
  `role=meter`+aria-valuenow; **Fokus-Falle** in allen Modalen (Tab bleibt im Dialog, 14/14 Probe);
  Marke → `<h1>`; sichtbare Fokus-Ringe; größerer Regler-Griff auf Touch; Touch-Ziele ≥44 px.
- **Klarheit**: „Naheliegend jetzt" → „Kleine Wechsel von hier aus"; Erklärzeile im Sub-Modal;
  „Photosynth." ausgeschrieben.

**Offene Audit-Folgepunkte — alle erledigt (v0.60–v0.62):**
- ✅ Klartext-Anzeigenamen für den Faktoren-Katalog (v0.61.0): 35 aktive Faktoren + 10 Kategorien
  haben jetzt Klartext-Namen (`PLAIN`/`CAT_PLAIN` in `tools/build-influences.mjs` → `.plain`-Feld
  in `influences.js`); die App zeigt sie in Kategorie-Kacheln, Schnell-Chips, Sub-Modal-Titel,
  Biom-Tag & Toast, mit dem wiss. Katalog-Namen als kleinem Untertitel (`.fsci`) je Faktor.
- ✅ Live-„Warum"-Zeile während des Spiels (v0.60.0): `#whyLine` zeigt live den Selektionsgradient
  („Diese Umwelt fördert: Wärmedämmung ↑ · …") bzw. „Im Gleichgewicht … die Form ist angepasst".
- ✅ Framing-Zeile (v0.62.0): „**Biome** setzen eine fertige Welt · **Regler** justieren sie fein ·
  **Umwelt-Einfluss ↗** löst ein einzelnes Ereignis aus" unter der Konsolen-Überschrift; Onboarding-
  Hinweis nennt jetzt zusätzlich den Einfluss-Knopf.
- ✅ Dialog-Titel als echte Überschriften (v0.62.0): Genbuch/Einfluss/Sub-Modal-Titel sind `<h2>`
  mit `aria-labelledby` (statt `aria-label`). reduced-motion: die rAF-Schleife hält nach Konvergenz
  bei pausierter Zeit an (kein Dauer-Repaint) und wird von jeder Interaktion wieder geweckt (`wake()`,
  Probe: 0 Frames im eingeschwungenen Zustand, Wake nach Eingabe). Modal-Pause bewusst als
  Auto-Resume-bei-Auslösen gelöst.

### Umwelt-Einfluss-Modal + AXIS-6 Toxin-Toleranz (2026-07)
- **Umwelt-Einfluss-Modal** (Nutzer-Vision statt Metapopulations-Vorschau): geschachteltes
  Modal (Kategorie → Faktor + Erklärsatz → Auslösen/Abbrechen) über `docs/faktoren-katalog.md`
  (Sektion 1+2), das die Umwelt DES AKTUELLEN WESENS ändert (Cinematik + Anpassungs-Schub).
  `app/influences.js`, 11 Kategorien. „Lebende Welt"-Overlay zurückgezogen (Code bleibt).
- **AXIS-6 Toxin-Toleranz** — neues Gen `detox` + Umwelt-Dimension `toxicity`, die **nicht**
  über die 6 Regler kommt, sondern über Umwelt-Einflüsse. `toxSurvival = 1 - toxicity·(1-detox)·
  toxLethality`; detox kostet Unterhalt → in sauberen Milieus wegselektiert, in giftigen
  (Serpentin/Schwermetall, Schwefel/Säure, saures Wasser) entsteht der Extremophil/Metallophyt.
  Erste „kommt bald"-Einflüsse damit **echt** (nicht mehr kosmetisch). Voll re-validiert:
  parity exakt (toxicity im Generator geprüft), Ökologie C1–C6 unverändert (detox neutral bei
  toxicity 0), pop-check 0.010, Probe: detox 0→1 unter Gift. Toxischer Habitat-Schleier.
- **Nebenbefund behoben:** APP_VERSION-Anzeige hing seit v0.29.0 fest (ein `pkill`-Exit-Code
  hatte ein `sed` verschluckt; Folge-Bumps fanden den String nicht mehr) → auf echte Version
  gesetzt; Fußnote „8 Gene/6 Regler" → „11 Gene & Umwelt-Einflüsse".

### 5-Agenten-Audit-Rollout (2026-07) — Usability / Design / Biologie / Evolution / Didaktik
Fünf Fachagenten haben die Live-App geprüft; Befunde nach P0→P1→P2 abgearbeitet und
jeweils einzeln nach `main` gemerged (Auto-Deploy):
- **P0a (v0.20):** Fehlvorstellungs-Sprache (Selektion statt Umbau), „Baum" ehrlich als
  Ähnlichkeits-Gruppierung (keine rekonstruierte Abstammung), Fitness als „Passung".
- **P0b (v0.21):** WCAG-Kontrast (K2) — `--muted`/`--bio-dim` dunkler (AA auf Ocker),
  ausgeblendete Gene `.32→.55` lesbar.
- **P0c (v0.22):** Genbuch entgamifiziert (K3) — Rarität = **ökologische Häufigkeit**, kein
  Sammel-Rang; „legendär"→„extrem selten"; Anti-Scala-Naturae-Hinweis (Reiche gruppiert,
  nicht gereiht); Rarität-Chips AA-lesbar; Tooltip-Dunkeltheme-Bug behoben.
- **P1a (v0.23):** Neon-Cyan-Reste raus (Augen-Glanzlichter/UI-Glows → warm/salbei),
  Habitat-Helligkeitsboden 0.16→0.42 (dunkle Szenen bleiben pastellig), Regler-Label
  „Nahrungshöhe", natives `confirm/prompt` → In-App-Dialog (Neomorph + Fokus).
- **P1b (v0.24):** Layout in Grid-Bereiche (view/console/card) — Schnell-Einstiege unter dem
  Bild „above the fold"; Mobil: Bild→Regler→Detailkarte; **aktives Biom markiert** (K5);
  Fokus-Verwaltung für Genbuch-/Welt-Modal.
- **P2a/b (v0.25):** **Endothermie-Kopplung** — Kälte-Anpassung braucht Isolation UND
  Stoffwechsel (Warmblüter). Voll re-validiert (parity 1.1e-16, Ökologie C1–C6, pop-check
  0.010, frisches Orakel). „Über die Engine" benennt Hauptansicht ehrlich als
  Mittelfeld-Anpassungsbahn (echte Populationen → Lebende Welt).
- **P2c (v0.26):** **Photosynthese-Temperatur-Abhängigkeit** — mildes Optimum (`photoTempOpt`
  0.6, Strength 0.6); Kälte/Hitze senken die Enzym-Leistung (Tundra trägt weniger Pflanzen).
  Voll re-validiert (Pflanzen-Anteil 4.0 %, > 2 %-Boden).

#### Offene Wünsche (Nutzer) — Stand des Backlog-Durchlaufs 2026-07
- ✅ **Lebensbaum: Beschreibung bei Klick** — Klick auf entdeckte Form öffnet Detail-Panel
  mit Ära/Evo-Notiz + **Wikipedia-Kurzbeschreibung** (REST-Summary-API, mit Fallback) + Link.
- ✅ **Wikipedia-Link spezifischer** — Spezifitäts-Prinzip dokumentiert; „Aalform" → Aal
  (statt generisch „Fische"). Generische Archetypen bleiben bewusst auf sicherer Ebene.
- ✅ **`Isolation`-Genlabel** → „Wärmedämmung" (eindeutig, nicht mehr als „Einsamkeit" lesbar).
- ✅ **Rohzahlen-Progressive-Disclosure** — Gen-Zahlen standardmäßig aus, Toggle „Zahlen
  zeigen" (Zustand in localStorage). Balken zeigen die Ausprägung; Lab-Tiefe auf Wunsch.
- ↩︎ **Fisch-vs-Aal-Benennung:** als *erledigt-wie-ist* eingestuft — die emergente Aquatik-
  Form ist per Selektion flossenlos (aquaticLimbDrag), „Aalform" ist also korrekt; eine
  eigene Flossen-Fisch-Form wäre im Modell suboptimal/selten -> kein neuer Ripple nötig.
- ↩︎ **Übergangszonen-Sumpfflieger** (~2 %): niedriger Wert, biologisch vertretbar; eine
  eigene steilere Flug-Gate wäre eine Engine-Änderung mit Re-Validierung für Randfälle -> nein.

#### 🐛 Kritischer Fix + Absicherung (2026-07)
- **App-Fitness war NaN seit v0.42.0** (`PHYS.kleiberDecades` fehlte im App-Inline-PHYS →
  `Math.pow(10, -0.25·undefined·size)` = NaN → Evolution eingefroren, jedes Wesen der
  generische Euglenoid mit „NaN %"). 10 Versionen live kaputt. parity/ecology fingen es NICHT,
  weil sie die Engine/Orakel-Kopie testen, nicht die hand-gepflegte App-Inline-Kopie.
- **Fix + Netz:** kleiberDecades im App-PHYS ergänzt (App-Fitness == Orakel, exakt). Neuer
  `npm run app-parity` (tools/app-parity.mjs): App-Inline-fitness vs. Engine über 3000
  Stichproben + NaN/Infinity-Wächter + „fehlende PHYS-Konstante"-Wächter. In `app-world-smoke`
  eingehängt → läuft bei jeder Achse mit. Zusätzlich Smoke-Guard „Vitalität endlich". Die
  App-Kopie ist damit erstmals so abgesichert wie Engine und Orakel.

#### 🧭 Breiten-Feld — Stand: die DISTINKTEN Phänotyp-Achsen sind ausgeschöpft
20 Gene decken jetzt die abgrenzbaren Einzel-Gen-Selektionsachsen ab, die das Fitness-Modell
trägt: Thermoregulation; **6 Energiekanäle** (Photosynthese, Landjagd, Absorption, Aquatik,
Biolumineszenz, Filtrieren) + Sinnes-Effizienz; **8 Verteidigungs-Beiträge** (Panzer, Stützgewebe,
Größe, Mobilität, Flug, Gegenlicht, Graben, Tarnung); **6 Extremnischen-Stressoren** (Gift,
Sauerstoff, Salz, UV, Druck, Austrocknung); Kleiber-Allometrie. Jede mit Reality-Regel (15/15).
Was im Katalog bleibt, ist bewusst KEIN weiteres Phänotyp-Gen:
- **Populations-/Life-History-Ebene** (r/K, Iteroparie, Dispersal, Sozialität, Generationszeit) —
  keine Einzel-Gen-Phänotypen; gehören in den Populations-/Welt-Kern, nicht die Fitness.
- **Inter-Organismus** (Symbiose, Parasitismus, Mutualismus, Räuber-Beute-Dynamik) — bereits im
  Koevolutions-/Welt-Layer (Red Queen), nicht als Einzel-Gen abbildbar.
- **Reine Stressor-Wiederholungen** (z. B. ionisierende Strahlung ≈ Gift+UV, Feuer ≈ episodische
  Hitze): würden das Muster nur duplizieren und je einen Katalog-Faktor „echt" machen — auf
  Wunsch pro benanntem Faktor nachrüstbar, aber ohne neue Mechanik.
→ Die genuin neuen Achsen sind erledigt; Weiteres wäre Duplikation oder außerhalb des Modells.

**✅ Konsolidierung erledigt (v0.59.0):** genetische Last der 10 Extremnischen-Stressor-Gene
gesenkt (Wartung 0.11→0.07) → Voll-Gen-Modell wieder C1–C6-konform (Pflanze 0.5→3.0 %, Protist
39→13 %), Reality 20/20 & App-Narrativ unverändert. Neues Gate `npm run ecology-full` testet
künftige Änderungen gegen die REALE 25-Gen-Verteilung. Außerdem: Bauplan-Text archetyp-getrieben
(Fledermaus-„7-Beine"-Widerspruch behoben). — Ursprünglicher Befund unten dokumentiert.

**Belegter Kostenpunkt (jetzt gelöst):** Bei 25 Genen war die *committed*-Pflanzen-
Nische enger geworden — in klar pflanzen-günstigen Umwelten entstehen weiter robuste Bäume
(photo 0.91), aber in Grenzfällen gewinnt jetzt öfter ein Mixotroph-Protist. Ursache: jedes
zusätzliche (auch neutrale) Gen trägt etwas Rest-Wartungslast (genetische Last), die die knapp
kalkulierende Autotrophie zuerst trifft. Der offizielle 10-Gen-`npm run ecology` besteht weiter
(Pflanze 4.5 %), aber die stärkere Voll-Gen-Probe zeigt die Drift. **Empfehlung statt eines 26.
Gens:** genetische Last neutralisieren (z. B. Maintenance-Skalierung so, dass die Summe vieler
schwach-selektierter Gene die Energie-Bilanz nicht drückt) ODER `ecology` auf den Voll-Gen-Kern
umstellen, damit künftige Achsen gegen die REALE Verteilung getestet werden — nicht nur die
10-Gen-Näherung.

Vollständige Achsen-Liste dieses Durchlaufs (12): AXIS-9 Graben, 10 UV, 3 Filtrierer, 11 Tarnung,
12 Druck, 13 Sinne, 14 Austrocknung, 15 Strahlung, 16 Feuer, 17 Frost, 18 Wind, 19 N-Fixierung.
Dazu: kritischer NaN-Fix (App-Fitness, seit v0.42.0) + `app-parity`-Netz. Aktive Katalog-Faktoren
27 → 35.

#### Breiten-Ausbau: neue Mechanik- & Stressor-Achsen (2026-07, Batch AXIS-9..14)
Volle Liste dieses Durchlaufs (je Two-Engines + Voll-Validierung + Reality-Regel):
AXIS-9 Graben (burrow), AXIS-10 UV (pigment), AXIS-3 Filtrierer (filter, neuer Energiekanal),
AXIS-11 Tarnung (camo), AXIS-12 Druck (baro), AXIS-13 Sinne (sense), AXIS-14 Austrocknung (desicc).

#### Breiten-Ausbau: neue Mechanik- & Stressor-Achsen (2026-07, Batch AXIS-9..10-ALT)
Nutzer: „start with the biggest bucket" (Breite). Zwei weitere echte Achsen, voll validiert:
- ✅ **AXIS-9 Graben** (`burrow`) — NEUE Mechanik (kein Stressor): fossoriale Räuber-Flucht,
  wirkt nur an Land (landFactor), billige Verteidigung ohne Panzer-Drag → Maulwurf/Wühlmaus-
  Nische. Nutzt bestehende Regler (predation+water), sofort im Spiel erlebbar. Reality-Regel
  „Räuberdruck an Land → Grabtrieb". Tier-Anteil unverändert (45.4 %). *(→ deckt sich mit der
  ursprünglich als „AXIS-2 Graben" geplanten Achse — dasselbe Ziel, hier unter neuer Nummer
  umgesetzt.)*
- ✅ **AXIS-10 UV-Strahlung** (`pigment` / `uv`) — Stressor: UV schädigt DNA ohne Schutzpigment.
  Aktiviert Katalog-Faktor „UV-Strahlung"; violetter UV-Schleier + Stress-Chip. Reality-Regel
  „UV → Schutzpigment".

**Nächste Breiten-Kandidaten (höherer Aufwand/Risiko):**
- **AXIS-3 Ernährungsmodus / Filtrierer** (neuer ENERGIE-Kanal, nicht nur Survival-Term) — der
  riskanteste, weil er die fein austarierte Ökologie-Verteilung verschieben kann; braucht eine
  eigene Tuning-Runde gegen C1–C6. Höchster Einzel-Mehrwert der offenen Achsen. *(→ der
  Filtrierer-Teil ist inzwischen umgesetzt, s. „Breiten-Ausbau AXIS-9..14" oben; nur der
  Aasfresser/Parasit-Teil bleibt offen, s. „Offen" Punkt 6.)*
- Weitere Stressor-Paare (Druck/Tiefsee, Wind/Strömung) — je ein Gen; geringeres Risiko, aber
  abnehmender Grenznutzen (Muster-Wiederholung). Nur wenn ein konkreter Katalog-Faktor es lohnt.

#### Neue Selektionsachsen aus dem Faktoren-Katalog (2026-07, Batch AXIS-6..8)
Die 257 „kommt bald"-Faktoren werden schrittweise zu ECHTEN Selektionsachsen (nicht kosmetisch).
Jede spiegelt sich synchron in engine/oracle/app + volle Re-Validierung. Muster: neues Gen +
neue Umwelt-Dimension (kommt NUR über Umwelt-Einflüsse, nicht über die 6 Regler) + multiplikativer
Survival-Term; das Gen kostet Unterhalt → in benignen Milieus wegselektiert, nur in der Extremnische
selektiert. Die Achsen sind **orthogonal** (Probe: Salz+giftig → osmo 0.90 UND detox 0.88 zugleich).
- ✅ **AXIS-6 Entgiftung** (`detox` / `toxicity`) — Serpentin/Schwermetall, Schwefel/Säure.
- ✅ **AXIS-7 Sauerstoff-Effizienz** (`oxyEff` / `oxygen`) — dünne Höhenluft/Hypoxie, gelöster O₂,
  Boden-Anoxie, Ozean-Anoxie/Euxinie (koppelt mit AXIS-6). Fahler Höhenluft-Schleier im Habitat.
- ✅ **AXIS-8 Osmoregulation** (`osmo` / `salinity`) — Salinität/Salz-Gradienten, hypersaline
  Extrem-Chemie. Milchiger Salzschimmer im Habitat. Echte Faktoren im Modal: 27 → 32.

#### ✅ Kleibersche Allometrie (#7) — erledigt (v0.42.0)
Massenspezifische Stoffwechselkosten skalieren jetzt mit Masse^-0.25 (Gesamt-Stoffwechsel ∝
Masse^0.75). Rabatt nur auf die Stoffwechsel-Kosten (`kleiberDecades` 0.6). Effekt (Probe, karge
Nahrung): optimaler Stoffwechsel steigt mit Körpergröße (0.38 → 0.49 → 0.62 statt konstant 0.36).
Ökologie C1–C6 blieb grün (Tier 43.9 → 45.4 %). Das anfängliche „hohe Tuning-Risiko" ließ sich mit
mildem Exponenten kontrolliert landen.

#### ✅ Sympatrische Artbildung — im Populations-Kern vorhanden & validiert (dokumentiert)
`npm run branching-check` bestätigt: mit frequenzabhängiger Konkurrenz (σC<σK) spaltet EINE
Population auf der Größen-Achse in **2 Cluster** (Modi [2,2,2,2,2]), disruptive Varianz **2.21×**;
Kontrolle bleibt unimodal — Lehrbuch-Dieckmann/Doebeli. Der Mechanismus existiert also im Kern.
Bewusst **nicht** in die Einzel-Wesen-Hauptansicht gehoben: der Nutzer hat die Populations-/
Metapopulations-Ansicht („Lebende Welt") explizit zugunsten des Einzel-Wesen-Fokus verworfen;
eine Bimodalität sichtbar zu machen bräuchte genau diese Verteilungs-Ansicht. → resolved-as-documented.

#### Bewusst zurückgestellt
- **Fisch-vs-Aal-Benennung (Flossen vs. flossenlos):** würde eine neue Form + Ripple durch
  Rarität/Tree/Wiki/Icons erfordern; Nuance rechtfertigt den Aufwand (noch) nicht.

### Baum-des-Lebens- & Engine-Session (2026-07)
- **Engine geschärft — Absorptions-Kanal (`physics.json` v2→v3):** dritter Ernährungsmodus
  `energyAbsorb` (sessile Heterotrophie/Osmotrophie). Diagnose: das Orakel teilt die
  *identische* Fitness mit der Engine → kein unabhängiger Realitäts-Check; und
  `energyForage ∝ mobility` ließ sessile Heterotrophe (Pilze) verhungern. Fix in alle drei
  Fitness-Kopien. **Pilze sind jetzt echte Attraktoren**, Validität **82→86 %**, Parität exakt.
- **Baum des Lebens:** `classify()` von ~14 auf **41 Formen** über 5 Reiche; eigene Silhouette
  je Form; stabile Individual-Färbung. **Lücken geschlossen:** Weichtiere (Schnecke/Kopffüßer),
  Amphibie, sessile Tiere (Koralle/Schwamm).
- **Ökologie-Check** (`npm run ecology`, neue Validierungs-Ebene Modell↔Realität) +
  Biodiversitäts- & Lebensbaum-Referenz (`docs/biodiversity-reference.md`, `docs/tree-of-life.*`).
- **Genbuch begehbar** („Lebensbaum"-Overlay): entdeckte Formen leuchten, Rest „???",
  Pro-Reich-Fortschritt; **Hover-Info** (wann & wie jede Art entstand — `era`/`evo` in `TREE`).
- **Stabilität:** committed Archetyp mit Hysterese (`STABLE_GENS`) → **Unlock nur bei stabil
  erreichter Art**, kein Flackern/Umschalten mehr (löst den alten JITTER-Fund endgültig).
- **Flaches monochromes Icon-System:** alle bunten Emoji → Inline-SVG (`currentColor`).

### Engine-Pass (Balance / Bugs)
- **BUG-1** Fell-Oszillation → thermal `1−d²` (glatt, kein Knick).
- **BUG-3** Eingabe-Clamping / NaN-Schutz (Regler 0..1) — in der Live-App.
- **BAL-1** Pflanzen-Reich wiederhergestellt (alle Pflanzen-Archetypen erreichbar).
- **BAL-2** tote Zone → `nutritionFloor`.
- **BAL-3** Dominanz Mobilität/Stoffwechsel → steigende Grenzkosten.
- **BAL-4** (weitgehend) echte Mittel-Nischen: Absorptions-Kanal + Euglenoid-Mixotroph.
- **CLS-1** Fell-Riese → eigener Ast **🐻 Fell-Großtier** (`insul>0.6 & size>0.52`).

### Spiel-Loop & Meilensteine A1/A2
- **STOCH-1** kalibrierte stochastische Drift pro Lebens-Seed (jedes Wesen einzigartig).
- **TIME-1** kontinuierliche Zeit (Dauer-Loop, Live-Umweltänderung ohne Neustart).
- **A1** (lokal): Persistenz + Offline-Zeit-Reveal + Genbuch-Zähler.
- **A2** (Cloud): Supabase-Auth (E-Mail+Passwort) + Cloud-Persistenz + geräteübergreifend.
- **A1 Genbuch begehbar** (Galerie aller 41 Formen) — s. o.
- **Renderer-Vielfalt** (früher „VARIETY"): differenzierte Silhouetten je Archetyp.
- UX-Quick-Wins: Entdeckungs-Toast, lo/hi-Regler-Labels, „Neues Leben"-Rückfrage,
  Passwort-Reset, Auto-Login-Fallback.

### AXIS-1 Flug — neues Gen „Flügelfläche" (Session 2026-07)
- **Erste neue Gen-Achse:** `wing` (Index 8) als 9. Gen. Flug = `wing · (1−size·flightSizePenalty)
  · Stoffwechsel-Anteil` → nur leichte, aktive Körper fliegen. Zwei Auszahlungen: (1) erschließt
  **hohe Nahrung/Licht** ohne Reichweiten-Strafe (`flightReach`), (2) modeste Flucht (`defenseFromFlight`).
  Diagnose beim ersten Tuning: Flug wurde als *universelle* Verteidigung selektiert (49 % aller
  Umwelten) → entschärft, jetzt klar an **hohe `foodHeight`** gebunden (echte Luft-/Kronen-Nische).
- **3 neue Flug-Formen** (41→43): **Fluginsekt · Segler** 🦋, **Flatterer · Vogel** 🐦 (neu Flug-gated),
  **Flugsäuger · Fledermaus** 🦇 — je eigene Silhouette (flatternde Flügel) + flaches Icon.
- **App genom-längen-robust** gemacht (`NG`-Konstante + `padGenome`): alte Spielstände (8 Gene)
  werden beim Laden mit 0.5 aufgefüllt. Fundament für alle weiteren Achsen.
- **Re-Validierung:** Parität exakt (1,1e-16), Validität **85,3 %** (im Band), Ökologie C1–C6 ✓.
  Rarität neu erzeugt. *Nebeneffekt:* der 9-Gen-Retrain (schärferer Mutations-Rücktrieb) schiebt
  mehrere **extreme** Formen (Koloss, Großjäger, Reptil, Fell-Großtier) sowie die Wasser-Formen
  (Fisch/Schnecke/Kopffüßer/Amphibie) auf drift-only → 14 legendäre „Fänge". Die Wasser-Formen
  holt **AXIS-4 (Aquatik)** zurück (dann sind sie in Wasser-Umwelten echte Attraktoren).

### Engine-Pass BAL-5 — Verteilung entzerrt (Session 2026-07)
- **BAL-5 / CLS-4 · Panzer-Grenzkosten** (`physics.json` v3→v3.1): neuer Term
  `maintenanceQuad.armor = 0.15` (steigende Grenzkosten der Panzerung, analog zu
  Stoffwechsel/Mobilität). **Diagnose:** „gepanzert + mobil" war ein fast universeller
  Gewinner — die **drei Panzer-Formen** (Gepanzertes Beutetier 13,7 % + Krebstier 11,5 %
  + Koloss 5,2 %) = **~30 % aller Umwelten**, derselbe Attraktor nur nach Größe/Gliedmaßen
  getrennt. **Fix:** Panzer maximiert sich nicht mehr gratis → mittlere Umwelten bringen
  wieder vielfältige Baupläne (Kleines flinkes Tier, Fell-Warmblüter, Generalist …).
  Gini der Formen-Verteilung **0,61 → 0,50**, Panzer-Trio **30 % → 12 %**, alle Formen
  erhalten; **Reptil · Echse** wieder als Attraktor erreichbar. In alle drei Fitness-Kopien
  gespiegelt. **Re-Validierung:** Parität exakt (1,1e-16), Validität **86,0 %** (im Band),
  Ökologie C1–C6 ✓. `docs/rarity.json` + App-`RARITY` neu erzeugt (jetzt 8 legendäre Formen).

### Rarität / Entdeckungs-Tiefe (Session 2026-07)
- **Rarität-Unlock** umgesetzt: je Form ein Seltenheits-Rang aus dem deterministischen
  Ökologie-Sweep (`docs/rarity.json`, 5⁶-Gitter → Konvergenz-Anteil). 5 Ränge
  (häufig→legendär); 7 legendäre „Fänge" nur über Drift erreichbar. **Genbuch:**
  Raritäts-Badge + Farb-Ramp pro Kachel, seltene entdeckte Formen leuchten (Glow),
  Legende, „x/7 legendär"-Zähler, Hover zeigt Rang. **Toast:** seltene/legendäre Funde
  besonders hervorgehoben (Text + Gold-Glow, längere Standzeit). *Sanfte Anreize, keine
  kaufbare Währung, kein Vollständigkeits-Zwang (Leitplanke gehalten).* Ursprünglich vom
  Nutzer vorgeschlagene Idee („seltene Arten spät, häufige früh") 1:1 in der Sweep-Logik
  umgesetzt.

### UX-Feinschliff (Session 2026-07)
- **A3 · Live-Vitalitätsanzeige** aus `fitness(genome, env)` — Balken + Wort (kämpft/…/blüht auf);
  reagiert sofort auf Regler (Nahrung→0 = 0 %). Macht Ursache→Wirkung spürbar.
- **A4 · Bindung**: Wesen benennen (persistiert, Cloud-`name`-Spalte + lokal), „Neues Leben"
  als Nachkomme (Ahnenlinie überlebt), Ahnen-Breadcrumb in der Karte. *(deckt UX-3)*
- **A5 · Onboarding**: Erstbesucher-Hinweis + pulsierender Biom-Chip, weg bei 1. Interaktion.
- **A6 · Reveal-Silhouette**: prominente Vorher→Nachher-Silhouetten im „Willkommen zurück". *(UX-4)*
- **B4 · a11y**: `role="dialog"`+aria an Overlays, aria-Labels, `aria-live`-Toast, Escape schließt.
- **B5 ·** `prefers-reduced-motion` beruhigt den Canvas (kein Atem/Partikel).
- **B6 · Fußzeile** entschlackt; Jargon hinter „ⓘ Über die Engine". *(deckt UX-2)*
- **B7 · Sync-Status** im Header (Biom-Tag zeigt wieder die echte Umwelt).
- **B9–B14**: Play-Label dynamisch, Touch-Ziele ≥44 px (coarse pointer), Login-Disabled-State,
  Copy „Höhe (Nahrung/Licht)".
- **CLS-3 · Gen-Balken** je Reich kontextabhängig gedimmt.

### Nutzer-Feedback-Fixes (2026-07-26)
- ✅ **Zappelnde Anzeige — behoben (v0.70.1).** „Diese Umwelt formt gerade …" und die
  Gen-Pfeile wechselten im Sekundenbruchteil („das geht so nicht"). Ursachen waren vier,
  alle gemessen statt geraten (`tools/ui-calm-check.mjs`, neu):
  1. **Takt:** die Zeile wurde im Bildtakt (60/s) neu gerechnet → jetzt höchstens alle 900 ms.
  2. **Begriffsfehler:** gezeigt wurde die NETTO-Bewegung, also Selektion **plus** den
     Mutations-Rücktrieb zum Ruhewert. 15 der 25 Gene ankern bei 0,12 und rutschten deshalb
     dauernd mit fast gleich großen Minibeträgen — daraus entstand das Ranking-Geflacker.
     Die Zeile zeigt jetzt nur noch die **Selektion** („was diese Umwelt auswählt").
  3. **Ranking-Rauschen:** klebrige Auswahl — ein Merkmal verdrängt ein angezeigtes erst,
     wenn es 1,35× stärker ist; dazu Hysterese + Haltezeit von zwei Takten.
  4. **DOM:** jede Neuberechnung schrieb in alle 25 Zeilen (gemessen ~37 Änderungen/s).
     Jetzt wird je Element verglichen, die Intensitäts-Abstufung der Pfeile ist entfallen,
     und markiert werden nur noch die **drei Merkmale, die auch in der Zeile stehen**.
  **Messung:** Zeile 19×/8 s → 4×/12 s, Pfeile 35×/12 s → 4×/12 s (≈10× ruhiger).
  `npm run ui-calm-check` hält das fest (Richtwert: höchstens 6 Wechsel je 12 s).
- ✅ **Chronik-Ton: weniger lyrisch, mehr prosaisch — umgesetzt (v0.70.2).** *(Nutzer)* Der
  generierte Text soll eine **persönliche Beziehung zum Wesen** ermöglichen — „kein Gedicht".
  Umbau: konkrete, nüchterne Sätze; Name und Form des Wesens benennen; beobachtbare Tatsachen
  statt Sentenzen; Vergleich mit dem früheren Zustand. Der ganze `AUSKLANG`-Pool (48 Aphorismen)
  ist durch 39 konkrete Nachsätze ersetzt; **Name des Wesens** als Platzhalter (`{wesen}`,
  `{demwesen}`). 24 weitere sentenzhafte Bausteine in Auftakt/Kern konkretisiert, 23 persönliche
  ergänzt. **Messbar gemacht:** `story-check` prüft den Tonfall über die ganze Lagen-Suite —
  Anteil Sätze mit Bezug zum Wesen **13 % → 27 %** (Mindestwert 20 %), Sentenz-Vokabular
  **6 %** (Höchstwert 12 %). Vorrat dabei von ~142.000 auf ~150.000 Sätze gewachsen.
  → `docs/storytelling.md` (Abschnitt „Wie man den Vorrat erweitert") gilt weiter.

### „Umwelt-Einfluss auslösen" fertiggestellt + V1 „Herausforderungen" umgesetzt (v0.71.0–v0.75.0)
Vollständiger Verlauf inkl. gemessener Befunde in `docs/influence-plan.md` (Stufen S0–S8),
Nutzerbindungs-Konzept in `docs/bindung-konzept.md`. Kurzfassung:
- ✅ **S4 Ehrliche Einordnung** — die 218 inaktiven Katalog-Faktoren tragen jetzt ein `layer`-
  Etikett (welche Ebene fehlt) statt vage „kommt bald".
- ✅ **S5 Modal fertig** — Suchfeld über den ganzen Katalog, Wirkungs-Vorschau (welche Achsen
  ändern sich, vorher→nachher), „Einfluss zurücknehmen", sichtbarer Stressor-Stapel.
- ✅ **S6 Chronik-Anbindung** — faktor-spezifische Erzähl-Zeilen für neu aktivierte Einflüsse.
- ✅ **P3/P6** — Klartextnamen + Erklärungen für 218 Katalog-Faktoren bzw. alle 25 Gene, extern
  zugeliefert und geprüft (`plain-import-check.mjs`/`gene-import-check.mjs`).
- ✅ **S8 · Herausforderungen der Natur (V1)** — 271 simulations-verifizierte Herausforderungen
  (Paket P8) spielbar: neuer Button „Herausforderungen ↗", Suche/Filter, HUD. Zwei echte
  Logikfehler beim Verdrahten gefunden und behoben (Browser-Test, Playwright): Beschränkung
  wird erst ab dem Moment gewertet, in dem die Umwelt sie tatsächlich erfüllt (Zustand
  „warten" vor „läuft" — sonst sofortiges Scheitern), und ein Sofort-Gewinn für Protist-Ziele
  (unbeeinflusstes Start-Genom klassifiziert von sich aus schon als Protist) ist durch eine
  Mindest-Generationenzahl ausgeschlossen.

*(Offene Nachträge aus diesem Strang stehen jetzt in „Offen" Punkte 5 und 7.)*

### „Lebende Welt (Beta)"-Overlay — Nutzer-Feedback 2026-07 (Runde 1)
- ✅ **Zappeln/Jitter**: das Modal sprang, weil (a) `place-items:center` + variable Kartenhöhe
  ständig neu zentrierte, (b) die Chronik jeden Step nach Häufigkeit umsortierte, (c) 9 Steps/s.
  → feste Kartenhöhe, stabile Chronik-Sortierung (nach Schlüssel), ruhiges Tempo (~2 Steps/s),
  interner Scroll statt Karten-Reflow.
- ✅ **Hintergrund-Zeit anhalten bei offenem Modal** (etabliertes Muster): Haupt-Sim pausiert,
  während das Welt-Overlay offen ist (`window.__mainSim.pause/resume`).
- ✅ **Bunte Emoji statt flacher Icons** (verstößt gegen die Icon-Policy): alle Emoji im
  Overlay → flaches `ic()`-System (via `window.__ic`), inkl. neuer Icons globe/meteor/tune.
- ✅ **„verbinden/trennen" unverständlich**: erst entfernt, dann mit klarer Metapher zurück —
  „mit Nachbarn verbinden" / „als Insel abtrennen" je Ort, plus sichtbarer Zustand je Ort
  (⛰ Insel / 🔗 verbunden). Effekt (Angleichung vs. eigener Weg) ist jetzt live sichtbar.
- ✅ **„→ in echt"-Link je Art (Wikipedia)** (Nutzer-Wunsch) — geprüft: `app/exemplar.js`
  deckt alle 44 `classify()`-Archetypen ab (`ARCH_WIKI`, Hauptansicht) UND alle 5 Reiche der
  emergenten Lebenden Welt (`realExample()`, trait-basiert mit Fallback). Kein offener Rest.

### Engine/CLI (Live-App nutzt eigenen Inline-Code, dort kein Problem)
- ✅ **BUG-2 ·** `explain.ts` `causeFor()` wählte Kausal-Texte an rohen Umwelt-Schwellen statt am
  echten Grund → widersprüchliche Erklärungen. **Behoben:** Ursache aus dem emergenten Archetyp
  (`classify()` aufs Endgenom) + realen `env`-Werten abgeleitet — Photosynthese-↑ behauptet keine
  Nahrungsknappheit mehr bei reichlichem Futter; Mobilität-↓ nennt die Photosynthese-Verdrängung
  nur, wenn das Ergebnis wirklich eine Pflanze ist.
- ✅ **BUG-4 ·** „asymmetrischsymmetrisch": `describeMorphology` hängte pauschal `symmetrisch` an.
  **Behoben:** jede Achse aufs korrekte Fachwort abgebildet (asymmetrisch bleibt; radiär/bilateral
  bekommen das Suffix).
- ↩︎ **CLS-2 + mockup/ nachziehen** — *resolved-as-documented*: `mockup/` ist ein archivierter
  Single-File-Snapshot, von `app/` (der Live-App) abgelöst. Renderer/`classify` in einen toten
  Zweitzweig nachzuziehen würde genau die Mehrfach-Kopien-Drift schaffen, die das Projekt sonst
  bekämpft. **`app/` ist die einzige maßgebliche Fassung**; `mockup/` bleibt als Artefakt-Snapshot
  bestehen, wird aber nicht mehr gepflegt (README/resume entsprechend klargestellt, `npm run serve`
  zeigt jetzt auf `/app/`). Damit ist auch CLS-2 (fehlende Photosynthese-Flächen im alten Mockup)
  gegenstandslos für das gepflegte Produkt.

---

## Referenzen

- Rohberichte Playtests: `playtest/` (3 Personas: neugieriger Laie, Ziel-Jäger, Grenzgänger).
- Plan Meilenstein A: `docs/plan-A-lebender-begleiter.md`.
- Projekt-Übergabe/Kontext: `resume.md`.
- Reale Vorlagen: `docs/biodiversity-reference.md`, `docs/tree-of-life-reference.md` + `.json`.
