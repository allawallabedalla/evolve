# Backlog

**Stand:** 2026-08-01 · Live-App `app/index.html`, deployt via GitHub Pages von `main`. Läuft
seit Migrations-Stufe 4 (Punkt 2) auf einem echten Populations-Schwarm (`world/population.ts`,
N=200), nicht mehr auf dem alten Mittelfeld-Gradientenaufstieg.
**Seit Punkt 12 (2026-08-01) trägt die App einen realen Artenkatalog** (`app/catalog.js`,
`stage:"full"`, 20.178 Wikidata-Arten): die 65 Baupläne unten bleiben die Schlüssel-Ebene
(Genbuch/Rarität/Icons/Chronik hängen daran), aber der ANGEZEIGTE Name ist jetzt oft eine
reale Art („Capybara" statt „Fell-Großtier") — Details, offene Punkte und Messwerte in
`docs/artenkatalog-plan.md`.
**Verteilungs-Treue (Schicht C seit Migrations-Stufe 6):** Jensen-Shannon-Divergenz
Browser-Schwarm (N=200) ↔ Orakel-Schwarm (N=2000) = **0.0218** (Ziel < 0.15, `npm run
spectrum-check`) — die alte "Test-Validität ~72%" (Mittelfeld-Distillation, `validityTest`)
bewertet seitdem nur noch den nicht mehr produktiven Mittelfeld-Pfad (Rückfall/CLI-Demo/
`ecology-check`), nicht das Spiel selbst. Parität Engine↔Orakel exakt (~1e-16), App-Inline-
Fitness gegen die Engine generiert (nicht mehr von Hand gepflegt, `npm run app-fitness-check`)
und exakt abgesichert (`npm run app-parity`, Abweichung 0).
**65 benannte Lebensformen** (44 + 21 aus Phase 1 „Lebendige Welt", Punkt 10 — 22 geplant,
Knöllchenbakterium gemessen und wegen Erreichbarkeits-Kollision mit Bakterie/Archaee wieder
entfernt, s. dort) über **5 Reiche** (Pflanzen/Tiere/Pilze/Mikroben/Protisten),
**26 Gene** (seit 2026-08-03, AXIS-25 „Krautiger Wuchs") — alle gen-abbildbaren
Einzel-Phänotyp-Achsen: Flug, Aquatik, Biolumineszenz, Grabtrieb, Tarnung, Sinne,
Filterapparat + N-Fixierung (Energiekanäle/Mechaniken), Gliedmaßen-Substrat-Traktion
(Insekten-Nische), Wiederaustrieb (krautige Regeneration nach Feuer/Frost) sowie
8 Extremnischen-Stressoren (Gift, Sauerstoff, Salz, UV, Druck, Austrocknung, Strahlung,
Feuer, Frost, Wind) + Kleibersche Allometrie.
Realitäts-Regel-Check (`npm run reality`): **21/21**.

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

- [~] **Migrations-Stufen (Modell: Opus für Stufe 2/4 — geschmacksintensive
  Architekturentscheidungen im laufenden Live-Code —, Sonnet für den Rest), jede Stufe
  einzeln lauffähig/messbar/committen, s. Dokument Abschnitt „6.4" für Details:**
  **Stufe 0-6 erledigt, Stufe 7 bewusst als offene Produkt-Entscheidung stehen gelassen
  (s. dort) — technisch abgeschlossen.**
  - [x] Stufe 0 (erledigt 2026-07-29) — Messskripte aus der Recherche als
    `tools/research/*.mjs` übernommen (ROOT-relative Pfade statt der Scratchpad-Absolutpfade
    des Forschungsagenten), alle sechs gegen die Original-Kennzahlen im Dokument
    nachgeprüft (u. a. Räuberland/Offenes Meer Fisch 100 %, Lichtlose Tiefsee Leuchtwesen
    100 %, A/B/C-Formenzahl 10/32/24, `fitness()` 339 ns/Aufruf) — alle reproduziert. Kein
    Gate (kein Pass/Fail), reine Referenzmessung für spätere Stufen.
  - [x] Stufe 1 (erledigt 2026-07-29) — `selectionWeights()` (neu in `world/cluster.ts`,
    |∂fitness/∂g| am Populations-Mittel, Boden 0.15) + optionaler `weights`-Parameter für
    `clusters()`/`dist()` (ohne `weights` exakt das alte Verhalten — `tools/research/*.mjs`
    bewusst unverändert, misst weiter den Ist-Zustand). `world/census.ts` nutzt die neue
    Metrik jetzt produktiv. Abnahme-Kriterium erreicht: **1.47 Cluster/Lauf** (vorher
    0.10–1.23) auf identischem Setup wie `tools/research/proto.mjs`. Nebenbefund: bei
    isolierten Orten OHNE Konkurrenz sinkt die gezählte Artenzahl leicht (5 statt 6) — das ist
    korrekt, nicht ein Rückschritt: die alte Metrik zählte dort reines Driftrauschen
    fälschlich als zweiten Cluster. `radius`/`minFraction` mussten nicht neu kalibriert werden
    (Gate blieb mit unveränderten Defaults grün). Alle 5 Kern-Gates + `census-check`/
    `phenomena-check`/`ablation-check`/`seed-check`/`rarity-check` weiterhin grün.
  - [x] **Stufe 2 (erledigt 2026-07-29, Opus) — Prototyp-Matcher ersetzt die `classify()`-
    Kaskade:** `app/archetypes.js` (44 Prototypen als reine Daten, `.js` statt `.json` — der
    App-Start braucht `classify()` synchron, `fetch()` hätte einen Umbau der Startsequenz
    gebraucht; `.js` via `<script src>` ist bereits das etablierte Muster für
    `influences.js`/`challenges.js`). `matchArchetype()` in `app/index.html` ersetzt die
    Kaskade, Rückgabeform `{k,n,e}` unverändert (erweitert um `conf`/`margin`/`novel`/…) —
    **kein Aufrufer musste angepasst werden**. Prototyp-Zahlen sind **gemessen, nicht
    geraten**: neues `tools/research/archetype-derive.mjs` leitet sie mechanisch aus der
    alten Kaskade ab (welche Gene: Streuung über 4 Mio. Zufallsgenome; welcher Wert: Mischung
    aus Schwellen-Fenstermitte und Mittel erreichbarer Genome) — die eingecheckte Bibliothek
    ist exakt reproduzierbar gegen dieses Skript geprüft.
    **Bug-Verifikation (Vorher/Nachher, mit Zahlen):** das gemeldete Testgenom
    (Isolation .82 + Biolum .60) ergibt jetzt in allen getesteten Umwelten „Fell-Großtier"/
    „Fell-Warmblüter" statt immer „Leuchtwesen · Tiefsee"; ein Größen-Sweep zeigt sanfte
    Übergänge mit Konfidenz-Anzeige statt einer harten Ein-Gen-Klippe. Regression: Insekt/
    Krebstier/6 von 7 Handgenomen weiterhin korrekt; unmögliche Chimäre → 0 % Konfidenz +
    generierter Name statt stillem Fehltreffer.
    **Getestet:** Syntax sauber, `app-parity`/`mf-fidelity` exakt/grün, `exemplar-check`/
    `story-check`/`influence-check` grün, Playwright 10 Prüfblöcke (Presets, Regler-Extreme,
    Genbuch-Zähler, alle 271 Herausforderungs-Ziele in der Bibliothek, Chronik, 0
    Konsolenfehler), `classify()` 28 µs/Aufruf im Browser. Zwei vorbestehende, unabhängig
    reproduzierte Fails (`ui-calm-check`, `app-world-smoke`) identisch auf Original-HEAD.
    **Ehrlich offengelegter Trade-off:** von 271 Herausforderungen bleiben 156 erreichbar, 96
    waren schon vorher unerreichbar, **11 verloren / 8 gewonnen → netto −3** (nach einer
    Nachschärfungs-Runde von ursprünglich −14 verbessert) — akzeptabler Preis für die Behebung
    eines echten, user-gemeldeten Bugs plus Wegfall der strukturellen Ein-Gen-Klippen-
    Fragilität. 9 von 12 Biom-Presets liefern identische Namen wie vorher, 3 wechseln
    (jeweils mit Begründung/Konfidenz nachvollziehbar). Schwache Archetypen (Übereinstimmung
    < 50 % auf erreichbaren Genomen) identifiziert: Sukkulente, Hefe, Kopffüßer, Koralle,
    Gepanzertes Beutetier — Kopffüßer/Koralle sind reale Grenzfälle, kein Fehler dieser
    Migration. **Hinweis für später:** die Prototyp-Werte enthalten zu 50 % die *heutige*
    Engine-Dynamik — nach Stufe 3/4 sollte `archetype-derive.mjs` erneut laufen.
  - [x] Stufe 3 (erledigt 2026-07-29) — `CompetitionConfig.axes: number[]` (mehrdimensional,
    `axes:[SIZE]` = exakter Spezialfall der alten Ein-Achsen-Form, `axis?` als deprecated
    Alias für unveränderte Alt-Aufrufer wie `world/phenomena.ts`/`tools/research/{bench,
    reach}.mjs`), `PopulationConfig.founderSpread: "uniform"|"gaussian"` (Default weiterhin
    `"gaussian"`, `seedFrom()` bleibt bewusst immer eng gaußsch). Kernel summiert jetzt über
    alle Achsen. Abnahme-Kriterium erreicht: **1.42 Cluster/Lauf, 23 Formen, 11/11 Biome mit
    Koexistenz** (mit dem Ressourcen-Term K faktisch neutralisiert) — übertrifft sogar
    `proto.mjs`s eigene Referenz (20 Formen).
    **Ehrlicher Fund dabei:** `proto.mjs` (der bisher als „verifiziert" geltende Prototyp)
    implementiert den K-Term aus dem eigenen Pseudocode gar nicht (Dichte-Division ohne
    K-Multiplikation). Die produktive `weights()`-Funktion hat den K-Term aus der
    Alt-Implementierung geerbt; mit dem im Dokument wörtlich vorgeschlagenen `σ_K=0.35`
    kollabiert die Vielfalt auf 8 Achsen (1.18/9 Formen/4 Biome), weil sich quadrierte
    Abweichungen über 8 Dimensionen summieren und ein 1D-plausibler `σ_K` in 8D zur scharfen
    Barriere wird. **Nicht durch eine neu erfundene Reskalierung „repariert"** — beide
    Varianten gemessen, dokumentiert, Entscheidung (K behalten+reskalieren vs. faktisch aus)
    bewusst an Stufe 4+ delegiert, wo der Nischen-Schwarm produktiv konfiguriert wird.
    Alle 5 Kern-Gates + `census-check`/`phenomena-check`/`ablation-check`/`seed-check`/
    `rarity-check`/`coevolution-check`/`distribution-check` weiterhin grün.
  - [x] **Stufe 3.5 (erledigt 2026-07-29, Sonnet) — Gliedmaßen-Substrat-Traktion (AXIS-20)
    für die Insekt-Nische:**
    Neuer eigener additiver Energiekanal `energyTraction` (nicht ein Multiplikator auf
    `energyForage` — das wurde gemessen und verworfen, weil es die Reich-Balance schon bei
    kleinen Werten sprengte). Formel: `insectShape = limb·(1−size)·(1−armor)·(1−insulation)`,
    QUADRIERT (schärft den Peak auf Baupläne, die alle vier Kriterien zugleich erfüllen),
    aktiv nur an Land, nur unter echten Schwellen `tractionHeatFloor`/`tractionScarcityCeiling`
    (Hitze UND Nahrungsknappheit — die reale Wüsten/Trockensavanne-Nische der
    Landgliederfüßer), nicht linear gekoppelt (linear hätte weder die Reich-Balance noch die
    Räuber-Beute-Koevolutions-Testumwelt sauber ausgeklammert). In `engine/fitness.ts`,
    `oracle/reference_model.py`, `app/index.html` UND `app/core/` (Bundle, war zwischenzeitlich
    veraltet — `npm run bundle-app` nachgeholt) synchron.
    `tractionYield = 2` (nicht der ökologische Grenzwert — der liegt bei `ecology-check`/C4
    erst bei ~7 —, sondern durch `world-check` bestimmt: die Hitze-Testumwelt liegt exakt in
    der Traction-Nische, bei Yield ≥~2.5 kippt die Homogenisierungs-Quote; das Verhalten ist
    dort nicht monoton, wegen Wright-Fisher-Drift-Chaosempfindlichkeit über 160 Generationen
    bei festem Seed. Yield=2 liegt mittig in einem verifiziert stabilen Band 1.8–2.3.
    **Ziel „Insekt ≥2 % im Zufalls-Sweep" erreicht, aber ehrlich pfadabhängig:**
    Mean-Field (`tools/research/optima.mjs`, 2200 Läufe, dieselbe Messmethode wie die
    historische 0.14%-Baseline): **0.59 %** — 4.2× Verbesserung, aber unter dem 2%-Ziel.
    Produktions-Schwarm-Pfad (identische Konfiguration zu `app/index.html`s SWARM-Objekt:
    N=200, 250 Gen, 8-Achsen-Kernel, sigmaK=50 [K faktisch neutral, wie live], founderSpread
    uniform): **~2.4 %** über 1100 Zufalls-Umwelten (zwei unabhängige Seeds: 2.17 %/600 und
    2.74 %/500) — **Ziel erreicht**. Da die Live-App seit Migrations-Stufe 4 auf dem
    Schwarm-Pfad läuft, ist das die spielrelevante Zahl; der stochastische Schwarm stolpert
    öfter in die schmale Nische, als der deterministische Gradientenaufstieg sie findet.
    Krebstier · Arthropode (ähnliches Gen-Profil) blieb bei 1.64 % (Mean-Field) bzw.
    0.69–0.85 % (Schwarm) unverändert, nicht verdrängt.
    Alle 5 Kern-Gates + `census-check`/`phenomena-check`(8/8)/`ablation-check`/`seed-check`/
    `rarity-check`/`coevolution-check`/`distribution-check`(4/4) grün — unabhängig
    gegengeprüft (eigener Gate-Lauf dieser Session, inkl. `world-check`, dem eigentlichen
    Grenzwert-Geber; eigener `optima.mjs`-Lauf bestätigt exakt 0.59 %/1.64 %).
    Ablauf-Hinweis: ein erster Agenten-Lauf wurde mitten in der Feinabstimmung unterbrochen
    und hinterließ einen inkonsistenten Zwischenstand (`tractionYield` zwischen den drei
    Physik-Quellen auseinandergelaufen, nur gegen `ecology-check` statt der vollen
    Gate-Suite kalibriert); ein zweiter Lauf hat das aufgeräumt, synchronisiert und den
    `world-check`-Regressionsfund nachgeliefert.
  - [x] **Stufe 4 (erledigt 2026-07-29, Opus) — Live-App läuft jetzt auf dem echten
    Nischen-Schwarm statt dem Mittelfeld-Punkt:**
    **Architektur:** dynamischer `import()` des bestehenden, bereits getesteten
    Bundles (`app/core/world/{population,cluster}.js`, via `npm run bundle-app`
    neu erzeugt für Stufe 1+3) statt einer vierten Hand-Physik-Kopie — begründet
    gegen einen Umbau auf `type="module"` (zu großer Blast-Radius für 3500 Zeilen
    Live-Code) abgewogen. Fällt bei Ladefehler graceful auf das alte Mittelfeld
    zurück (getestet: 404 auf die Bundle-Datei → App läuft weiter, nur `console.warn`).
    **"Dein Wesen"** = Zentroid des dominanten Clusters (`selectionWeights()` +
    gewichtetes `clusters()` aus Stufe 1), mit Klebrigkeit (bleibt bei der zuletzt
    gezeigten Linie, solange sie ≥60 % des größten Clusters hat) gegen Flackern bei
    knappen Mehrheiten. N=200 (Kompromiss aus Performance-Budget und Stufe-3-
    Vielfalts-Kriterium — N=150 unterschreitet ≥1.3 Cluster/Lauf bereits). `sigmaK`
    aus dem Stufe-3-K-Term-Befund faktisch neutral gesetzt (konsistent mit
    `world/phenomena.ts`s bestehender Wahl).
    **Performance real im Browser gemessen** (nicht geschätzt): ~1.8–2.2 ms/Tick bei
    N=200, Ziel <10 ms mit ~6× Reserve übertroffen. Zwei neue Takt-Regler
    (`simStepBudget`/Zensus-Zeitlimit) verhindern Generationsstau auf langsamen
    Geräten.
    **Alle bestehenden UI-Komponenten getestet und funktionsfähig** (Gen-Balken,
    Vitalität, Warum-Zeile, Chronik, Genbuch, Herausforderungen, Schnappschuss,
    Neu-beginnen, Umwelt-Einfluss, Neuladen-Kontinuität, Offline-Reveal,
    Lebende-Welt-Overlay) — 0 Konsolenfehler in allen Testpfaden.
    **Zwei ehrliche, gemessene Rekalibrierungen, die der Umbau erzwang:**
    (a) Vitalitäts-Skala neu verankert — der alte 100-%-Anker (Fitness 0.84) war
    der Endpunkt des drift-/mutationsfreien Bergsteigers, den eine echte Population
    nie erreicht (gemessen: Schwarm-Fitness ~0.26 vs. altes Surrogat ~0.46 in
    derselben Umwelt); neue Skala an den real gemessenen Schwarm-Wertebereich
    (0.10–0.62 über alle 13 Presets) verankert und in einer zentralen `vitality()`-
    Funktion gebündelt (vorher an 4 Stellen dupliziert). Ehrliche Folge: Passung
    liest sich in mittleren Welten jetzt ~1 Stufe niedriger als vorher.
    (b) Grenzfall-Zeilen-Schwelle (`settled`) angepasst — eine echte Population hält
    bedingte Kosten-Gene dauerhaft über ihrem Anker (Mutations-Selektions-
    Gleichgewicht, gemessen ~73 % im Mittel) statt sie wie der Bergsteiger bis auf
    99 % herunterzufahren; „Noch in Umstellung" verlangt jetzt `settled < 0.35`
    statt `< 0.75`, Prozentanzeige nutzt `margin` statt `conf` (unberührt von der
    Mutationslast). `matchArchetype()` selbst unangetastet.
    **"Test-Validität ~86 %"-Satz im Details-Panel ersetzt** durch eine Erklärung
    des tatsächlich laufenden Mechanismus (Population, Vererbung+Drift,
    Nischen-Konkurrenz, "dein Wesen" = häufigste Form) — der alte Prozentsatz maß
    nach diesem Umbau nichts mehr Sinnvolles. `APP_VERSION` v0.75.0 → v0.76.0.
    **Bewusst unvollständig gelassen, mit klarer Folgeschritt-Empfehlung:**
    Warum-Zeilen-Beträge nutzen weiterhin Mittelfeld-skalierte Schwellen (Richtung
    ist korrekt, nur die Größenordnung ist Erbe — echtes Selektionsdifferential
    kommt mit Stufe 5, zusammen mit einer Neukalibrierung von `ui-calm-check`s
    Hysterese-Schwellen); Aufspaltung nur minimal in der bestehenden Grenzfall-Zeile
    sichtbar gemacht, kein eigener Chronik-Beat (echte Story-Engine-Arbeit,
    außerhalb des Rahmens); Persistenz speichert weiterhin nur den Zentroid, nicht
    die volle Population (Varianz/Nebencluster überleben ein Neuladen nicht, klingt
    nach ~50 Generationen wieder ein — Supabase-Schema unverändert, bewusst keine
    Migration für etwas, das der Spieler nicht sieht); Biom-Empfehlungen (Punkt 8)
    bleiben Mittelfeld-basiert (Schwarm-Sweep wäre ~2s Blockade beim Öffnen des
    Presets-Panels); Prototyp-Bibliothek (Stufe 2) nicht neu abgeleitet (bekannter
    Folgeschritt aus Stufe 2 selbst); Cloud-Sync-Pfad nicht end-to-end mit echtem
    Konto getestet (Logik identisch zum lokalen Pfad, der getestet wurde).
    **Getestet:** alle 5 Kern-Gates + `census-check`/`phenomena-check`/
    `ablation-check`/`seed-check`/`rarity-check`/`coevolution-check`/
    `distribution-check`/`app-parity`/`mf-fidelity`/`exemplar-check`/`story-check`/
    `influence-check`/`ui-calm-check` grün, `app-world-smoke`-Selektor-Timeout
    vorbestehend (identisch auf Original-HEAD verifiziert). Unabhängig
    gegengeprüft (eigener Playwright-Lauf dieser Session): Schwarm nachweislich
    aktiv (`window.__evolvePerf()` → `schwarmAktiv:true`, ~2–4 ms/Generation),
    Formwechsel/Genbuch/Rendering visuell bestätigt, 0 Konsolenfehler.
  - [x] **Stufe 5 (erledigt 2026-07-29, Opus) — die Warum-Zeile misst jetzt das ECHTE
    Selektionsdifferential des Schwarms:**
    `app/index.html`, neue Funktion `swarmSelection()` + `updateWhy()`. Statt eines
    fiktiven Fitness-Gradienten am Zentroid × Mittelfeld-Konstanten läuft jetzt
    `S_i = cov(w_j, gen_j[i]) / mean(w_j)` (Robertson/Price) über alle N=200 Individuen
    der laufenden Population. Einheit: Gen-Einheiten je Generation, also wörtlich „um so
    viel verschiebt die Auslese den Durchschnitt dieses Merkmals in dieser Generation".
    **Gemessene Abweichung von der Aufgaben-Formel, bewusst und begründet:** `w` ist NICHT
    die rohe Fitness, sondern `pop.weights()` (Fitness^selPower / Nischen-Konkurrenzdichte
    × K) — genau die Größe, nach der `pop.step()` Eltern zieht. Mit roher Fitness sagt
    `S_i` die reale Bewegung des Populationsmittels NICHT vorher (Korrelation −0.38 /
    −0.35 / −0.45 in eingeschwungenen Populationen), weil die frequenzabhängige Konkurrenz
    die Kosten-Selektion auf den 8 Nischen-Achsen exakt aufhebt; mit den echten Gewichten
    +0.60 / +0.84 / +0.36 und direkt nach einem Reglerwechsel +0.91 statt +0.83.
    **`pull` ebenfalls gemessen statt geschätzt:** der Transmissions-Term der
    Price-Gleichung (erwarteter Versatz durch Mutation + Klemmung an [0,1], analytisch über
    Φ/φ, gewichtet mit `w`). `net = S + pull` reproduziert die real durchgerechnete
    Bewegung des Populationsmittels mit Korrelation **0.986 / 0.999 / 0.965** (40
    unabhängige Realisierungen je Messpunkt) und bleibt damit — wie vorher — das Kriterium
    „bewegt sich das Merkmal überhaupt?": ein Gen am mutationsbedingten Boden (Photosynthese
    bei 0.05 in einer dunklen Welt) hat großes |S|, aber net ≈ 0 und bekommt korrekt keinen
    Pfeil.
    **Der behobene Fehler war real und sichtbar:** die alte Zeile fror gemessen nach ~3 s
    dauerhaft auf „Panzerung ↓ · Biolumineszenz ↓ · Photosynthese ↓" ein — in JEDER Welt
    dasselbe, weil der Mittelfeld-Gradient am Zentroid von den Unterhaltskosten ungenutzter
    Gene dominiert wird. Das ist genau die BUG-2-Klasse (eine Erklärung, die etwas behauptet,
    was die Lage nicht hergibt), nur in der Live-App statt in `engine/explain.ts`.
    **Neukalibrierung aller fünf Bremsen (Struktur unangetastet):** `WHY_ENTER` 0.0022 →
    0.026, `WHY_LEAVE` 0.0010 → 0.012, net-Schwelle 0.0002 → `WHY_STILL` 0.0024 — die alten
    Werte × 12, mit unverändertem Verhältnis 2.2 (EIN/AUS) und 1/11 (STILL/EIN). `WHY_MS`
    (900 ms), `WHY_SMOOTH` (0.28), `WHY_STICKY` (1.35), `WHY_HOLD` (2) unverändert. Weg
    dorthin: Gitterlauf über einen 1:1-Nachbau der Zustandsmaschine (42 Messungen je
    Kandidat = 3 Tempi × 2 Einschwing-Zustände × 7 Seeds), dann im Browser gegengemessen.
    Faktor 12 gewann gegen 10 in BEIDEN Kriterien gleichzeitig (ruhiger *und*
    aussagekräftiger).
    **Eine strukturelle Ergänzung, gemessen erzwungen:** der Schwarm passt sich viel
    schneller an als der alte Bergsteiger — nach einem Umwelt-Wechsel fällt |S| des
    betroffenen Gens binnen ~7 Generationen von 1.7e-1 auf 2.4e-2 (Wärmedämmung bei
    Eiszeit, Mittelwert 0.31 → 0.78). Bei „normal" ist das EIN Takt; Trägheit + Haltezeit
    verschluckten den didaktisch wertvollsten Moment vollständig (gemessen: 0 von 12 Presets
    zeigten nach einem Biom-Wechsel überhaupt etwas). Bei einem echten Umwelt-SPRUNG
    (Summe der Änderungen über die 16 Umwelt-Achsen SEIT DEM LETZTEN BILD > `WHY_JUMP` =
    0.08) werden Trägheit und Haltezeit deshalb EINMAL übergangen. Bewusst je BILD statt je
    Takt gemessen: feines Regler-Ziehen bewegt ~0.01–0.04 je Bild und bleibt darunter, kann
    die Zeile also nicht über die alte Höchstrate treiben (im Browser gegengeprüft: 5 s
    langsames Ziehen → **0 Wechsel**).
    **Ruhe objektiv abgenommen.** `ui-calm-check` (das Abnahmekriterium): vorher 3/0/2,
    nachher **1/0/3** von erlaubten 6. Zusätzlich 7 eigene Browser-Szenarien, die
    `ui-calm-check` nicht abdeckt: frisch geladen 5, reif+unberührt 0, Preset Eiszeit 1,
    Tiefsee 3, Hitze-Dürre 2, langsames Ziehen 0, Tempo „schnell" + Preset 0 — alle unter 6,
    0 Konsolenfehler.
    **Inhalt gegengeprüft (12 Presets):** 12/12 nennen beim Umschalten plausible Merkmale
    (Eiszeit → „Wärmedämmung ↑ · Stoffwechsel ↑" — das Endothermie-Paar, Tiefsee →
    „Biolumineszenz ↑ · Filterapparat ↑", Hitze-Dürre → „Wärmedämmung ↓ · Stoffwechsel ↓",
    Räuberland → „Mobilität ↑ · Größe ↑"), 12/12 fallen eingeschwungen wieder auf
    „Angepasst" zurück. **Sichtbare Verhaltensänderung, ehrlich benannt:** „Angepasst an
    diese Umwelt — die Form steht" erscheint jetzt regelmäßig (vorher praktisch nie) —
    das ist der Zustand, für den die Zeile immer gedacht war.
    **Laufzeit real gemessen, nicht geschätzt** (neu in `__evolvePerf()`: `msProWarum`):
    2.3–2.7 ms je Takt, also alle 900 ms — ~0.3 % Rechenzeit. Kollidiert nicht mit
    `simStepBudget()` aus Stufe 4, das nur `pop.step()` misst.
    **Rückfall-Pfad unverändert lauffähig** (Bundle-Import per Playwright abgebrochen →
    `schwarmAktiv:false`): die Mittelfeld-Näherung bleibt Zeile für Zeile stehen, wird nur
    mit `WHY_MF_SCALE = 12` auf die neue Skala gebracht, damit dieselben Schwellen greifen
    (LEAVE/STILL exakt wie vor Stufe 5, ENTER 1.5 % empfindlicher). Gegengemessen: 7
    Wechsel/12 s im Rückfall — auf Original-HEAD im identischen Szenario 8, also keine
    Regression.
    `APP_VERSION` v0.76.0 → v0.77.0; „Über die Engine" und der `#whyLine`-Tooltip erklären
    jetzt die gemessene Größe (Tippfehler „ausleset" dabei behoben).
    **Bewusst NICHT gemacht:** `engine/explain.ts` unangetastet — es ist NICHT toter Code
    (`engine/report.ts` → `engine/index.ts` → `cli/demo.ts`, also `npm run demo`), liegt aber
    im Mittelfeld-CLI-Pfad und nicht in der Live-App; die konkrete BUG-2-Instanz dort ist
    laut Backlog längst behoben. Eine Umstellung auf Telemetrie wäre ein eigener Umbau des
    CLI-Berichts ohne Nutzen für die App und wurde nicht ohne Rückfrage begonnen.
    **Getestet:** `build` + `pop-check`/`branching-check`/`world-check`/`parity`/`ecology`/
    `app-parity`/`mf-fidelity`/`census-check`/`phenomena-check`/`ablation-check`/
    `seed-check`/`rarity-check`/`coevolution-check`/`distribution-check`/`exemplar-check`/
    `story-check`/`influence-check`/`ui-calm-check` alle grün; `app-world-smoke`-Selektor-
    Timeout vorbestehend (Ausgabe zeichenweise identisch auf Original-HEAD verifiziert).
  - [x] **Stufe 6 (erledigt 2026-07-30, Opus) — Orakel als statistischer Prüfstand auf
    Verteilungsmetrik statt Distillations-Ziel:**
    Neue, unabhängige zweite Implementierung des Nischen-Schwarms in Python
    (`oracle/reference_model.py`: `run_swarm_once`/`_swarm_weights`/`DEFAULT_SWARM`,
    neu `oracle/swarm_reference.py` als Multi-Prozess-Rechenknecht) — Zeile für Zeile
    dieselbe Vorschrift wie `Population.weights()` in `world/population.ts`
    (unabhängig gegengeprüft: `base·K/(dichte/N+1e-9)`, inkl. Selbst-Term, identisch),
    aber eigener RNG/eigene Sprache. Gibt bewusst die END-POPULATION zurück statt
    eines Mittelwerts (`run_oracle`/`run_oracle_once`, das alte Distillations-Orakel,
    bleibt Zeile für Zeile unangetastet — `npm run parity`/`npm run oracle` hängen
    daran). Klassifikation bleibt zentral in Node (`matchArchetype()`), damit keine
    dritte Formklassifikations-Kopie entsteht.
    Neue Mess-Pipeline `tools/spectrum-check.mjs` + `tools/lib/spectrum.mjs`: Browser-
    Produktionsschwarm (N=200) vs. Orakel-Schwarm (N=2000) über 11 Biom-Presets ×
    5 Läufe × 250 Generationen, Jensen-Shannon-Divergenz (Basis 2, damit ∈[0,1]) über
    die Formhäufigkeits-Spektren (Individuen-Ebene, nicht Cluster — sonst dominiert
    Zählrauschen bei ~80 Beobachtungen/20 Formen), plus mittlere Clusterzahl-Abweichung
    und Spearman-Rangkorrelation der Rarität.
    **Ergebnis: JSD = 0.0218 (Ziel < 0.15), ≈7× Reserve.** Score_C = 0.978. Auch die
    strengeren Lesarten bestehen (je Umwelt gemittelt statt gepoolt: 0.0800;
    schlechteste Einzelumwelt Lichtlose Tiefsee: 0.1486; Cluster-Zentroid-Spektren:
    0.1451). Damit ist N=200 als Produktionsgröße verteilungstreu — keine Nachjustierung
    der App-Konfiguration nötig. Rauschboden separat gemessen (disjunkte Seed-Hälften):
    0.0075 (Browser) / 0.0004 (Orakel) — die gemessene Divergenz ist echt, aber winzig.
    Rechenzeit: Orakel-Seite ~45 min (5 Kerne), daher `npm run spectrum-check` (nutzt
    das gecachte `.swarm-oracle.json`, gitignored, reproduzierbar) getrennt von
    `npm run oracle-swarm` (der teure Neu-Lauf) — Diagnose-Skript ohne `process.exit(1)`
    wie `tools/ablation-check.mjs`, kein reguläres CI-Gate.
    **Bewusste Abweichung vom Migrationsplan-Text ("fitted-params.json löschen"):**
    NICHT gelöscht — ist kein totes Gewicht, sondern aktiv gelesen von
    `tools/ecology-check.mjs` (ein Gate), `cli/demo.ts`, `mockup/index.html`,
    `tools/research/{biome,reach}.mjs`, und bleibt der dokumentierte Rückfallpfad der
    App bei fehlgeschlagenem Bundle-Import. `training/fit.ts`/`fitted-params.json`s
    Kommentare/Konsolentext ehrlich umformuliert (Geltungsbereich: kalibriert nur noch
    den Mittelfeld-Pfad, keine Aussage über die Live-App), `README.md` mit
    Stand-Hinweisen versehen statt die veraltete Prosa stillschweigend stehen zu lassen.
    **`training/fidelity-config.ts` Schicht C neu definiert:** `Score_C = 1 - JSD`
    (`scoreCFromJsd()`, monoton statt bei der Zielschwelle abgeschnitten — sonst kein
    Optimierungssignal oberhalb von 0.15), `MIN_SCORE_C = 1 - TARGET_JSD = 0.85`
    (ersetzt die vorläufige 0.80). `tools/fidelity-config-check.mjs` umgebaut: da der
    Ist-Stand jetzt (anders als vorher, Score_C~0.72) alle drei Schichten mit Reserve
    besteht, beweist das Skript "die Schwelle prüft etwas" jetzt über Gegentests statt
    über einen absichtlich knapp verfehlten Ist-Stand (jede Schicht kann einzeln rot
    werden; Goodhart-Schutz hält: Fidelity 0.80 bei kaputter Schicht C bleibt trotzdem
    rot) — unabhängig nachvollzogen, alle sechs Teilprüfungen OK.
    **Getestet:** alle 5 Kern-Gates + `census-check`/`phenomena-check`(8/8)/
    `ablation-check`/`seed-check`/`rarity-check`/`coevolution-check`/
    `distribution-check`(4/4)/`fidelity-config-check` grün — unabhängig gegengeprüft
    (eigener Gate-Lauf dieser Session inkl. `npm run build`).
    Ablauf-Hinweis: der erste Agenten-Lauf wurde nach Fertigstellung der eigentlichen
    Arbeit (Orakel-Lauf bereits durchgerechnet, alle Dateien geändert) unterbrochen,
    bevor der Abschlussbericht geschrieben wurde — der Code-Stand selbst war
    vollständig und konsistent; diese Prüfung hat ihn nachträglich verifiziert.
  - [x] **Stufe 7, Teil Koevolution (erledigt 2026-07-30, Opus) — Räuber-Beute-Wettrüsten
    ans Live-Spiel angeschlossen; Metapopulation bewusst weiter aus (Nutzer-Entscheidung
    2026-07-30):**
    `world/coevolution.ts`s `Ecosystem` selbst wird NICHT benutzt (bringt eine eigene
    Beute-Population ohne Nischen-Konkurrenz mit — die App hat ihre Beute schon). Genutzt
    wird stattdessen ein bereits vorhandener, bisher ungenutzter Haken:
    `Population.reproduceWith(w)` in `world/population.ts` nimmt seit Stufe 1 extern
    berechnete Gewichte entgegen. Neu: `weights(env, phys, envOf?)` — optionaler dritter
    Parameter für eine INDIVIDUELLE Umwelt je Individuum (ohne `envOf` bitgleich zu vorher,
    der Nischen-Konkurrenz-Kernel wird nicht dupliziert). Damit gilt in `app/index.html`
    Zeile für Zeile `Ecosystem`s Formel, nur mit der Nischen-Konkurrenz der App darin.
    `world/coevolution.ts` selbst unangetastet — `coevolution-check`/`phenomena-check` P5
    zeichenweise identisch verifiziert (gegen Original-`population.ts` gegengebaut).
    **Räuber-Population:** zweite, unsichtbare `Population` (N=60, ohne Nischen-Konkurrenz,
    analog `Ecosystem.predator`), N/Kernel-Breite/Kopplungsstärke einzeln durchgemessen
    (60 = 30 % der Beute wegen O(N_Beute·N_Räuber)-Kosten bei praktisch gleicher Wirkung
    ab N=30; Kernel-Breite 0.18 im Optimum; Kopplung k=6, stärkste Stufe, die die
    Größen-Streuung der Population noch nicht sichtbar einengt).
    **Kopplung an den Regler — Kernentscheidung:** Log-Odds statt additiv
    (`P_i = σ(logit(pred) + k·(m_i−m̄) + c)`, `c` je Generation per Newton so gewählt, dass
    `mean(P_i)` EXAKT dem Reglerwert entspricht). Begründet gemessen gegen die additive
    Variante aus `Ecosystem`: die klemmt bei hohem Regler massenhaft (gemessen: realer
    Druck bei Regler 0.90 sank auf 0.72–0.80 statt 0.90) und würde die Bedeutung des
    Reglers verfälschen. Mit Logit+Newton bleibt der Regler exakt das, was er war (0.30→
    0.300, 0.90→0.900 über 500 Generationen) — **keine Nachkalibrierung** von
    Vitalitäts-Skala/Presets/Herausforderungen/Biom-Empfehlungen nötig. Bei Regler=0 exakt
    kein Zusatzdruck (logit(0)=−∞), an beiden Reglerenden läuft exakt der Pfad von vor
    dieser Stufe.
    **UI:** kein zweites Wesen-Panel (Leitplanke „nie das Wesen steuern, nur die Welt") —
    stattdessen (a) `swarmSelection()` (Warum-Zeile, Stufe 5) rechnet jetzt mit denselben
    modulierten Gewichten, nach denen tatsächlich fortgepflanzt wird, (b) ein Chip
    „Wettrüsten mit Räubern" (ohne „✕", nichts zum Entfernen), der nur erscheint, wenn die
    Dynamik über zwei Kennzahlen (Streuung des endogenen Drucks + Bewegung der mittleren
    Räubergröße) messbar läuft — Schwellen über alle 12 Presets im Browser kalibriert,
    bewusst streng (locker: 9/13 Welten zeigten den Chip → Tapete; gewählt: 3/13).
    **Ehrlicher Befund, nicht wegretuschiert:** das Wettrüsten ist bei geringem/mittlerem
    Räuberdruck am stärksten (Standard-Regler 2.8× höhere zeitliche Größen-Streuung als
    ohne Räuber) und bleibt bei extremem Druck aus (Räuberland 0.8×) — dort entkommt die
    Population über Mobilität (0.78 statt 0.24) statt über Größe, eine andere Achse als
    die, auf der die Räuber suchen. Vielfalt unangetastet (mittlere Clusterzahl ohne/mit
    Räubern über 12 Presets 1.58/1.56).
    **Performance:** +0.35–0.38 ms/Generation (+19–21 %, real im Browser gemessen),
    10-ms-Budget weiter mit ≥4× Reserve gehalten, `simStepBudget()` fällt von 3 auf 2
    Generationen/Bild.
    **Eine echte Regression gefunden und behoben:** `ui-calm-check` fiel mit den
    Stufe-5-Bremsen 1 von 3 Läufen durch (6-8 Wechsel/12s statt ≤6) — die Bremsen waren
    gegen eine Welt kalibriert, die zur Ruhe kommt, was mit endogenen Räubern per
    Konstruktion nicht mehr gilt. `WHY_STICKY` 1.35→1.8, `WHY_HOLD` 2→4 (nur die
    Anzeige-Trägheit, nicht die Messgröße) — danach wieder 0/0/0 über 3 Läufe.
    **Getestet:** alle 5 Kern-Gates + `census-check`/`phenomena-check`(8/8)/
    `ablation-check`/`seed-check`/`rarity-check`/`coevolution-check`/`distribution-check`
    (4/4)/`exemplar-check`/`story-check`/`influence-check`/`ui-calm-check`/
    `app-fitness-check` grün — unabhängig gegengeprüft (eigener Gate-Lauf + eigener
    Playwright-Lauf dieser Session: Chip sichtbar bei Standard-Regler, `koevolutionLaeuft:
    true`, 0 Konsolenfehler).
    **Bewusst NICHT gemacht:** Metapopulation (vom Nutzer separat abgelehnt); kein
    zweites Wesen-Panel/keine Räuber-Darstellung (Leitplanke); Räuber-Population wird
    nicht persistiert (baut sich nach Neuladen in wenigen Generationen neu auf, unsichtbar
    für den Spieler, analog zur Beute); `matchAxis` bleibt SIZE (identisch zur geprüften
    Referenz, keine Neuerfindung); kein neues CI-Gate für die Live-Koevolution (nicht
    beauftragt, Messwerte stehen als Tabellen im Quelltext).
    `APP_VERSION` v0.77.0 → v0.78.0.

**Damit ist die Engine-Grundlagenforschung (Punkt 2) im technischen Kern abgeschlossen**
(Stufe 0-6 erledigt, Stufe 7 bewusst als Produkt-Entscheidung offen gelassen, nicht als
Technik-Aufgabe). Punkt 6 (Rest-Achsen) ist damit entsperrt — s. dort.

### 3 · Komplexitäts-Audit / Informationsarchitektur (2026-07-29)

**Modell:** Sonnet — Konzept + Priorisierung liegen bereits fertig abgestimmt vor
(`docs/komplexitaets-audit.md`), hier nur noch Ausführung nach Plan.

- [x] **„Das ganze Spiel wirkt extrem überladen und unübersichtlich" — vollständig umgesetzt
  (2026-07-30).** *(Nutzer)* Audit + abgestimmter Bauplan in
  **`docs/komplexitaets-audit.md`**, alle Empfehlungen P0-P2 umgesetzt bzw. begründet
  abgegrenzt (P1.5 JS-Teil, s. dort).
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
  - [x] **P1.5 — CSS-Teil erledigt (2026-07-30, Sonnet), JS-Teil bewusst nicht gemacht:**
    `<style>...</style>` (694 Zeilen) aus `app/index.html` nach `app/style.css` ausgelagert,
    per `<link rel="stylesheet">` eingebunden — wortwörtlicher Inhalt, keine Umformatierung.
    Keine Custom-Property-/JS-Schreibkopplung gefunden, die das hätte brechen können (nur
    lesende `var(--...)`-Nutzung in Inline-Styles/Template-Strings). Playwright bestätigt:
    `style.css` lädt mit 200, 0 Konsolenfehler/fehlgeschlagene Requests, `--abyss`-Variable
    korrekt aufgelöst, Screenshots (Hauptansicht + Presets-Panel) zeigen keine visuelle
    Abweichung. **Der JS-Teil ("JS in Module") wurde bewusst NICHT gemacht** — verletzt sonst
    eine bereits an genau dieser Datei getroffene Architektur-Entscheidung: Migrations-Stufe 4
    hat sich explizit GEGEN `type="module"` fürs ~4000-Zeilen-Hauptskript entschieden ("zu
    großer Blast-Radius"), und nur neue, unabhängige Features (das "Lebende Welt"-Overlay)
    bewusst ENTKOPPELT als eigenes Modul gebaut, gerade damit ein Ladefehler dort die App nicht
    mitreißt. Eine Umstellung des Hauptskripts würde diese Entkopplung wieder aufheben (globaler
    Skript-Kontext → viele Modul-Scopes mit strikten Export/Import-Grenzen) — ein Umbau mit
    hohem Risiko für eine Datei, die diese Session bereits mehrere fein kalibrierte Änderungen
    bekommen hat (Warum-Zeile-Hysterese aus Stufe 5, P2.6s Regex-Grenzen-empfindliche
    Fitness-Einbettung). Ohne einen echten spielerischen Nutzen überwiegt das Risiko den
    Infrastruktur-Gewinn — bleibt offen, bis ein konkreter Anlass (z. B. ein Build-Schritt, der
    mehrere Quelldateien wieder zu einer `index.html` zusammenführt, ohne den Laufzeit-Kontext
    zu ändern) das Risiko senkt.
    **Getestet:** `build`, `app-parity`(0), `app-fitness-check`, `pop-check`/
    `branching-check`/`world-check`/`parity`/`ecology`/`mf-fidelity`/`census-check`/
    `phenomena-check`(8/8)/`seed-check`/`rarity-check`/`coevolution-check`/
    `distribution-check`(4/4)/`exemplar-check`/`story-check`/`influence-check` alle grün —
    unabhängig gegengeprüft (eigener Gate-Lauf + eigener Playwright-Screenshot dieser Session).
    Damit ist Punkt 3 (Komplexitäts-Audit) inhaltlich abgeschlossen (P0-P2 umgesetzt bzw.
    begründet abgegrenzt).
  - [x] **P2.6 umgesetzt (2026-07-30, Sonnet) — Inline-Fitness-Kopie generiert statt von
    Hand gepflegt:** neues `tools/bundle-app-fitness.mjs` erzeugt `const PHYS = {...}` +
    `function fitness(t, e){...}` in `app/index.html` direkt aus `physics.json` (minus
    `_comment`/`traits`/`traitLabels`) und dem bereits von `tsc` kompilierten, von
    `parity`/`app-parity` geprüften `dist/engine/fitness.js` — **nicht neu abgetippt**,
    dasselbe Prinzip wie `tools/bundle-app-core.mjs`. `fitness(t,e)` bleibt für alle
    bestehenden Aufrufer unverändert (2-Argument-Signatur, `PHYS` implizit): der
    kompilierte Code wird umbenannt (`_engineFitness`) und in einem eigenen
    Function-Scope INNERHALB des dünnen `fitness(t,e){...return
    _engineFitness(t,e,PHYS);}`-Wrappers verschachtelt (vermeidet eine
    `const clamp01`-Neudeklarations-Kollision mit der Datei-weiten Kopie).
    **Bemerkenswertes Detail, das die Regex-Grenze schützt:** `tools/lib/app-core.mjs`/
    `tools/app-parity.mjs` finden den Block über
    `/function fitness\(t, e\)\{[\s\S]*?\n\}/` (stoppt an der ERSTEN bündigen `}`) — der
    verschachtelte `_engineFitness`-Körper wird deshalb komplett eingerückt, sodass seine
    eigene schließende Klammer nie bündig steht und die Regex ungestört bis zur äußeren
    Wrapper-Klammer läuft. Ohne diese Einrückung hätte die Regex nach `_engineFitness`
    abgeschnitten und `return _engineFitness(...)` verschluckt — exakt die stille
    NaN-Fehlerklasse, die dieses Sub-Ziel beheben soll. Eigener JS-Objektliteral-
    Serializer statt `JSON.stringify` für `PHYS` (unquoted keys), weil
    `tools/mf-fidelity.mjs` einzelne Werte per unquoted-key-Regex ausliest — mit
    gequoteten JSON-Schlüsseln wäre dieses bestehende Gate still gebrochen.
    Als echtes Gate verdrahtet (`npm run app-fitness-check`, prüft Drift zwischen
    generiertem und committetem Stand, `process.exit(1)` bei Abweichung — bewusst kein
    stilles Diagnose-Skript, weil der ganze Sinn ist, Vergessen strukturell
    unmöglich zu machen, nicht nur sichtbar zu machen), plus `npm run bundle-app`
    ruft es jetzt automatisch mit auf — genau der Schritt, den Migrations-Stufe 3.5
    vergessen hatte.
    `app-parity`: Max-Abweichung jetzt **exakt 0** (vorher numerisch ~0, jetzt identischer
    Code). Alle 15 angeforderten Gates + `app-fitness-check` grün, unabhängig
    gegengeprüft (eigener Gate-Lauf plus eigener Playwright-Aufruf dieser Session:
    `window.fitness(...)` direkt im Browser aufgerufen, endliches Ergebnis, 0
    Konsolenfehler, Schwarm lief weiter).
    **Bewusst nicht gemacht:** nicht zu einem `import()` aus `app/core/` umgebaut — bleibt
    zwingend synchroner Inline-Code, weil `fitness()` schon beim App-Boot für
    `classify()`/`matchArchetype()` gebraucht wird, bevor irgendein `import()` auflöst
    (Migrations-Stufe 2/4); nicht mit `bundle-app-core.mjs` zu einer Datei
    zusammengelegt (unterschiedliche Ziele — eigene Datei bündeln vs. `app/index.html`
    an Ort und Stelle ändern — getrennt einfacher zu diagnostizieren).

### 4 · Flacher Vektor-/Siebdruck-Stil (Redesign, 2026-07-29) — Phase 1+2 auf diesen Branch nachgezogen (2026-07-30)

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

**Nachtrag 2026-07-30 (Opus) — Phase 1+2 vom separaten Redesign-Branch
(`claude/flat-vector-simulation-ui-kttqxx`) auf diesen Branch nachgezogen** (Nutzer-
Entscheidung: Redesign hier statt auf dem separaten Branch weiterführen). **Kein
`git merge`** — der Redesign-Branch war vom 28.7., also vor der kompletten
Engine-Migration dieser Session; ein Merge hätte `app/index.html` massiv zerschossen.
Stattdessen die tatsächlichen Netto-Änderungen (484 + 29 Zeilen, deutlich weniger als
die 2881 Zeilen Rohdiff zwischen den Branch-Spitzen vermuten ließen) als eigenständige
Arbeit mit derselben Intention auf den aktuellen Stand übertragen; CSS landet jetzt in
`app/style.css` (existierte auf dem Redesign-Branch noch nicht, s. Punkt 3 P1.5).
**Sechs notwendige Korrekturen über die Vorlage hinaus gefunden und behoben:**
fehlendes `ctx.clearRect()` (Kreatur hätte sich Bild für Bild überlagert, da
`drawHabitat()` das Canvas nicht mehr flächig füllt), fehlendes `z-index` auf
Gen-Anzeige/Biom-Tag/Stress-Chips (verschwanden unter der neuen SVG-Bühne),
Schnappschuss-Teilen rasterisiert jetzt auch die SVG-Ebene (sonst nur Silhouette ohne
Welt), a11y-Label auf die neue Bühnen-Struktur verschoben, UV-Schleier zusätzlich zu
den neuen Lichtkeilen behalten (sonst verlorene Regler-Wirkung), Reveal-Schleier hell
statt dunkel (Kartentext ist dunkle Schrift, ein dunkler Schleier wäre unlesbar
gewesen), `--muted` von `#6a5a68` auf `#645463` nachjustiert (lag bei `#6a5a68` auf
`--bg-top` bei rasiermesserdünnen 4.50:1 AA-Kontrast, jetzt 5.05:1).
**Ein echter, unabhängig bestätigter Bug gefunden und behoben** (vordatiert auf HEAD,
nicht durch das Redesign verursacht): `.gene .fill`/`.vit-fill` waren `<span>`s mit
`display: inline` (Standard) innerhalb eines Grid-Containers — blieben dadurch 0×0 und
zeigten nur die Kontur-Hairline, keine Füllfarbe. Fix: `display: block` ergänzt (2
Zeilen, `app/style.css`), Gen-Balken und Passungs-Balken zeigen jetzt wieder ihre
Füllung.
**Bewusst nicht angefasst:** die "matschige" Mitteltemperatur-Mischfarbe
(`mix(kalt,warm,T)` bei T≈0.5 wirkt entsättigt) — das ist die wörtliche Vorlage des
Redesign-Branchs, keine Regression; eine dritte Farbstufe wäre eine eigene, nicht
beauftragte Geschmacks-Entscheidung und bleibt offen für eine spätere bewusste Wahl.
Getestet: alle 20 Gates grün (inkl. `ui-calm-check`, `app-parity` exakt 0), eigener
Playwright-Lauf mit WCAG-Kontrastmessung (alle Text/Fläche-Paare ≥4.5:1) und
Performance-Vergleich (SVG-Bühne + Papierkorn-Filter kosten nichts messbar) —
unabhängig gegengeprüft (eigener Gate-Lauf + eigener Screenshot-Vergleich diese
Session, dabei den `.gene .fill`-Bug selbst reproduziert und behoben).

- [x] **Phase 3 — Kreatur-Silhouetten — ALLE 6 REICHE auf SVG portiert (2026-07-31)** —
  **Modell: Opus**. Bewusst GESTAFFELT statt 800 Zeilen auf einen Schlag:
  `CREATURE_SVG` listete die jeweils portierten Reiche, alles andere zeichnete
  unverändert auf dem Canvas darunter weiter — jeder Zwischenstand war lauffähig und
  einzeln prüfbar. **Nachweis am Ende: das Canvas bleibt vollständig leer (0 Pixel),
  die Kreatur kommt komplett aus dem SVG.**
  **Fertig:**
  - Eigene SVG-Ebene `#creatureSvg` über der Bühne, gleiche 720×560-viewBox.
  - **Retained-Mode-Renderer** (`cEl`/`cAttr`/`cBegin`/`cEnd`): Elemente werden einmal
    angelegt, danach werden nur noch geänderte Attribute geschrieben — nötig, weil die
    Silhouetten pro Bild animiert sind (Pseudopodien morphen, Geißeln peitschen) und
    ein `innerHTML`-Neubau je Bild zu teuer wäre.
  - **Geometrisch verlustfreie Migration:** der Wurzel-Transform `scale(720/CW)` lässt
    die portierten Zeichner exakt dieselben Koordinaten benutzen wie der Canvas-Pfad
    (Canvas rechnet in CSS-Pixeln der Breite CW, die viewBox ist fest 720) — kein
    Nachjustieren von Radien, kein Größensprung. Bei Resize verifiziert.
  - **Zwei Stil-Brüche beseitigt**, die Canvas erzwungen hatte: `ctx.shadowBlur`
    (weicher Schlagschatten + Biolumineszenz-Schein) → gestufte Halo-Ringe bzw.
    Helligkeitsstufen (`flatStep`); `ctx.filter = "saturate(.68) brightness(1.08)"`
    → dieselbe Rechnung einmal pro Farbe (`flatCol`), also gleiches Bild ohne
    Filter-Ebene.
  - **Zwei feste Ebenen** (`#cGlowLayer`/`#cBodyLayer`) statt einer flachen Liste —
    sonst hinge die Z-Reihenfolge davon ab, wann ein Element zum ersten Mal entsteht,
    und ein später einsetzendes Leuchten läge vor dem Körper.
  - **Schnappschuss-Export** rasterisiert die neue Ebene mit (sonst wäre die Kreatur
    auf dem geteilten Bild unsichtbar) — verifiziert, 6.582 sichtbare Pixel.
  - Portiert: **Protist** (Euglenoid, Radiolarie), **Mikrobe** (Amöbe, Archaee,
    Bakterien-Kolonie), **Pilz** (Hutpilz, Baumpilz, Schimmel, Flechte, Hefe/Myzel),
    **Sessil** (Koralle, Schwamm), **Pflanze** (Baum, Kaktus, Strauch, Kraut, Nadelbaum,
    Blütenkraut, Grünalge, Moos, Farn, generisch) und **Tier** (Schnecke, Kopffüßer,
    Amphibie, Wurm, Fisch, Insekt, Krebstier, Fluginsekt, Vogel, Fledermaus + der
    Vierbeiner-Grundbauplan mit Schwanz-, Ohren-, Schnauzen-, Panzer- und
    Stachel-Varianten) — **42 geprüfte Formen, alle 6 Reiche**. Koralle/Schwamm sind
    Reich „Tier", werden aber bodenständig gezeichnet und hängen deshalb an der
    Pseudo-Kategorie „Sessil".
  - Neuer Helfer `arcPath()` für Teil-Bögen (Ersatz für `ctx.ellipse/arc` mit Start-/
    Endwinkel): bewusst **abgetastet** statt als SVG-`A`-Befehl — dessen
    large-arc/sweep-Flags sind bei übersteuerten oder negativen Winkeln fehleranfällig,
    das Abtasten ist bei diesen Größen visuell identisch und kann nicht „falsch herum"
    laufen.
  - **A/B gegen den Canvas-Original-Pfad gemessen** (`CREATURE_SVG` zur Laufzeit
    umschalten, beide Fassungen rastern, Bounding-Box der echten Pixel vergleichen):
    Abweichung 0–8 px über alle geprüften Formen, Koralle pixelgleich. Die verbleibende
    Differenz geht auf den entfernten Schlagschatten zurück, der die alphabasierte Box
    aufblähte. **Merke für den Rest der Migration:** `getBBox()` taugt dafür NICHT — es
    transformiert bei rotierten Kindern das Rechteck statt der Ellipse und meldete
    17–22 px Scheinabweichung für die zwei rotierten Formen; erst der Pixelvergleich
    zeigte, dass die Zeichnung stimmt.
  - **Die `rnd()`-Reihenfolge ist die eigentliche Fehlerquelle beim Portieren** — und der
    A/B-Test hat drei echte Fehler dieser Art gefunden (Baum, Flechte, Alge/Moos). Ursache:
    Objekt-Eigenschaften werden in Schreibreihenfolge ausgewertet, also zog ein
    `r: (…rnd()…)` vor dem `fill: flatCol(leafVar())` die Sequenz vor und vertauschte
    Größen mit Farben. Der Baum lag dadurch 14 px daneben, nach der Korrektur 6 px.
    **Regel: Werte, die `rnd()` verbrauchen, VOR dem Objektliteral in der Original-
    reihenfolge in Variablen berechnen — nie im Literal inline.**
  - **Zweiter Fehlertyp, ebenfalls vom A/B-Test gefunden: ein übersehener
    `return`-Zweig.** Der Vogel (🐦) hat im Original einen EIGENEN Bauplan mit frühem
    `return`; ich hatte ihn zunächst in den Vierbeiner-Zweig fallen lassen — 47 px
    daneben, nach dem Nachziehen 3 px. Dabei fiel auf, dass die vogelspezifischen Teile
    IM Vierbeiner-Zweig (Flügel, Schwanzfedern, `FORM["🐦"]`) im Original **toter Code**
    sind, weil sie nie erreicht werden; bewusst nicht mitportiert und im Code vermerkt.
  - **Abschluss-Prüfungen:** Canvas bleibt leer (0 Pixel), Schnappschuss zeigt die
    Kreatur (5.402 Pixel), 15 s freie Evolution über einen Reichswechsel hinweg ohne
    JS-Fehler und **ohne Element-Leck** (Pool-Größe = DOM-Kinder, alte Teile werden
    beim Formwechsel geräumt).
  - **Aufgeräumt (2026-07-31, eigener Schritt nach der Migration):** die sechs alten
    Canvas-Zeichner und das Canvas selbst sind entfernt — **−652 Zeilen, −39 KB**.
    Vorher belegt, dass der Pfad wirklich tot war: `classify()` liefert nur die fünf
    Reiche aus `archetypes.js`, erzeugte Namen erben `k` vom nächsten Verwandten, und
    Koralle/Schwamm hängen an der Emoji-Prüfung — alle in `CREATURE_SVG`. Mit entfernt:
    `<canvas id="habitat">`, `ctx`/`canvas`-Referenzen, `ctx.setTransform` in `resize()`,
    das `ctx.clearRect` der Bildschleife und die zugehörige CSS-Regel. `shareSnapshot()`
    nimmt die Bildgröße jetzt aus `CW/CH × DPR` statt aus dem Canvas-Element und rastert
    zwei SVG-Ebenen übereinander (verifiziert: 424×330, 7.282 sichtbare Pixel).
    Der leere `if(svgKingdom)`-Gegenzweig bleibt als stiller Schutz stehen (räumt die
    Ebene, falls je ein Reich ohne Zeichner dazukommt).
    **Beim Löschen selbst ein Fehler passiert und gefunden:** der zeilenbasierte
    Löschbereich riss `drawAnimalSvg` mit, das zwischen zwei alten Zeichnern lag — der
    Rendering-Test schlug sofort mit `drawAnimalSvg is not defined` an, die Funktion kam
    aus dem letzten Commit zurück. **Lehre: Blöcke nach Zeilennummern zu löschen ist bei
    verschachtelten Einfügungen unsicher; nach Funktionsnamen vorgehen und danach die
    erwartete Menge gegenprüfen** (genau das hat den Fehler hier aufgedeckt).
  - Gemessen: end-to-end 60 fps auf beiden Pfaden, **keine Regression**. (Ein
    Mikro-Benchmark zeigte scheinbar 41 ms/Bild für Canvas gegen 0,02 ms für SVG —
    das ist irreführend, weil SVG die Rasterung an den Compositor abgibt und die enge
    Messschleife die Canvas-Rasterung staut. Kein Performance-Gewinn behauptet.)
  - Gates: `ui-calm-check`, `app-parity` grün; Resize, `prefers-reduced-motion` und
    Reich-Wechsel (SVG↔Canvas, Reste werden geräumt) einzeln verifiziert.
  - **Akzentfarbe für das neu erworbene Modul — umgesetzt (2026-07-31).** Damit ist der
    Phase-3-Auftrag vollständig. Die Palette reservierte `--accent` (Ringelblume) von
    Anfang an für „neu erworbene Merkmale", eine Mechanik dafür gab es aber nie.
    **Wie es arbeitet:** am bestehenden Formkipp-Punkt (derselbe, der Chronik und
    Genbuch auslöst) wird verglichen, welches Gen seit der letzten committeten Form am
    stärksten gestiegen ist; das zugehörige Körperteil trägt den Akzent, bis die nächste
    Form steht. `MODULE_MAP` hält je Reich die Gen→Körperteil-Zuordnung
    (z. B. Tier: `armor`→Panzer/Ringe/Stacheln, `insul`→Fell, `limb`→Beine,
    `wing`→Flügel, `sense`→Fühler).
    **Zwei bewusste Entscheidungen:** (1) Nur Gene mit SICHTBAREM Modul kommen infrage —
    steigt etwa „Osmoregulation", gibt es dafür nichts zu zeigen, dann bleibt es beim
    normalen Farbschema. Lieber kein Akzent als ein gelogener (so verifiziert).
    (2) Umgesetzt als **CSS-Klasse**, nicht als Attribut: der Zeichner schreibt pro Bild
    seine eigene Farbe, ein Attribut-Akzent würde sich mit ihm jedes Bild gegenseitig
    überschreiben. Die Klasse wechselt nur beim Formkipp. Getrennt nach Fläche und
    Kontur, sonst würde eine gemeinsame Regel Strichformen (`fill="none"`) fluten.
    **Live verifiziert:** in einer kalten Umwelt entwickelte sich ein „Fell-Warmblüter",
    und der Akzent wählte das **Fell** — also genau das Merkmal, nach dem die Form
    benannt ist. Über 250 Generationen stabil, null Modulwechsel zwischen den Formkippen.
    **Bewusst KEIN Text-Label dazu:** Warum-Zeile und `#speciesEdge` erklären ohnehin
    schon, was sich gerade verändert; eine dritte Textstelle wäre Doppelung (und der
    Nutzer hat in dieser Sitzung bereits eine redundante Textzeile entfernen lassen).
  **Damit ist Punkt 4 (Redesign) bis auf Phase 5 (Audit) abgeschlossen.**
- [x] **Phase 4 — Restliche UI — geprüft, bereits erledigt (2026-07-31).** Vor dem
  Umsetzen gegengecheckt statt blind zu "übertragen": alle fünf genannten Bereiche
  hängen schon vollständig an den Klippenlicht-Tokens (`var(--chamber)`,
  `var(--shadow*)` = flache 1px-Hairline, kein Blur/Verlauf) — das ist bereits als
  Nebeneffekt von Phase 1s globaler `:root`-Umstellung passiert, nur der Haken hier
  fehlte noch. Per Screenshot verifiziert: Genom-/Vitalitätsbalken (Kreatur-Karte),
  Chronik (Details-Panel), Genbuch/Lebensbaum, Herausforderungen — alle flach,
  schattenfrei, auf Palette. Einzige gefundene hartkodierte Farben sind bewusste
  Ausnahmen mit Bestand (Rarität-Farbcode Blau/Lila in `.gb-tile.rar-*` UND im
  Dendrogramm-Code deckungsgleich, Stress-Chip-Farben je Achse) — keine Leichen,
  sondern ein bereits etabliertes Semantik-Farbsystem. Das Ähnlichkeits-Dendrogramm
  („Baum-des-Lebens-SVG") nutzt `var(--bio-dim)` für Linien/Labels, ist aber aktuell
  über keinen Button erreichbar (`openWorld()`-Bindung an `worldBtn` bewusst
  auskommentiert seit Umwelt-Einfluss den Button übernommen hat) — aufgefallen bei
  diesem Check, nicht Teil des Palette-Auftrags, hier nur vermerkt.
- [x] **Phase 5 — Audit — erledigt (2026-07-31), automatisiert statt durchgeklickt.**
  Als wiederholbares Skript gebaut, nicht von Hand abgehakt — so ist es nach jeder
  künftigen Design-Änderung erneut fahrbar.
  **1. WCAG-Kontrast:** alle Elemente mit eigenem Textinhalt in 6 Ansichten
  (Hauptbildschirm, Lebensbaum, Herausforderungen, Presets, Umwelt-Einfluss, Details)
  gegen ihren tatsächlich gerenderten Hintergrund gemessen — der Hintergrund wird dabei
  den DOM-Baum hochgesucht, bis eine deckende Fläche kommt, statt ihn zu raten. Groß-/
  Fettschrift bekommt korrekt die 3:1-Schwelle, alles andere 4,5:1.
  **Ein echter Fund:** der Zähler „x/15 extrem selten" im Lebensbaum stand in `--gold`
  (#b98a2e) und erreichte auf `--chamber` nur **2,8:1**. Behoben durch ein neues Token
  `--gold-ink` (#8a6416, 4,7:1) — dieselbe Trennung Fläche/Text, die die Palette bei
  `--bio`/`--bio-dim` schon macht: `--gold` bleibt für Ränder, Punkte und Glows, die
  Textrolle bekommt den dunkleren Ton. Alle vier Text-Verwendungen umgestellt (inkl.
  `RTONE` im JS und der Legende im Welt-Overlay). **Danach 0 Verstöße bei ~770
  geprüften Textelementen.**
  **2. Presets/Extremregler:** alle 12 Presets angeklickt und alle 6 Regler auf 0 und 1
  gefahren — jedes Mal wird gezeichnet, keine leere Bühne.
  **3. Mutationsfälle:** jedes der 25 Gene einzeln auf 0 und 1 (50 Fälle) durch
  `classify()` + Zeichner geschickt — alle 50 zeichnen, keine Ausnahme, kein Absturz.
  **4. `prefers-reduced-motion`:** eigener Browser-Kontext, Animationen aus
  (`animationName: none`), keine Fehler.
- [x] **Zwei kleine Politur-Punkte aus Phase 2 — erledigt (2026-07-31).** Helligkeitskurve
  in `drawHabitat()` von linear auf `Math.pow(L,0.6)`-Ease umgestellt (bright(0.5) jetzt
  ~0.83 statt 0.75, Enden L=0/1 unverändert). `groundPath()` von 10 auf 16 Stützpunkte,
  Sinus-Phase mitskaliert (Wellenform bleibt gleich, nur runder interpoliert),
  Kristall-Branch bewusst unverändert kantig gelassen (Formensprache, kein Bug).
  Playwright-geprüft (Welle + Kristall-Voreinstellung), keine JS-Fehler.

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

- [x] **V1-Ausbaustufen (erledigt 2026-07-30, Opus) — feste Startwelt, Bestenliste, „Welt der
  Woche":** Nutzer-Entscheidung „ja, starten". Alle drei Stufen hängen an EINEM Mechanismus,
  der festen Startwelt: eine Sandkasten-Herausforderung ist grundsätzlich nicht vergleichbar
  (jeder startet mit anderen Reglern/Genom/Seed).
  **1. Feste Startwelt** — für jede der 271 Herausforderungen aus ihren eigenen Daten
  abgeleitet: beschränkte Regler auf die Mitte ihres erlaubten Bereichs, unbeschränkte
  deterministisch aus dem Weltschlüssel-Seed (Korridor 0.15–0.85), Schwarm-Gründer aus
  demselben Seed. Die Welt erfüllt die Beschränkung damit per Konstruktion — die Uhr läuft
  ab Generation 0 statt erst nach Suchen im „warten"-Zustand — und existiert für alle 271
  ohne Pflegeaufwand. **Determinismus gemessen** (Chromium, zwei unabhängige Ladevorgänge):
  400 Generationen von Hand + 300 mit echter Zeitschleife → beide Male max|Δ| über alle 25
  Gene = 0, identische Form (der Schwarm ist ein reiner mulberry32-Prozess, nichts liest die
  Uhr). Erreichbar über eine leise Zweitaktion „gleiche Startwelt für alle ↗" auf jeder
  Herausforderungs-Karte — „annehmen" bleibt unverändert der unberührte Sandkasten-Pfad.
  **2. Bestenliste** — neue Supabase-Tabelle `challenge_results` (streng privat, RLS wie
  `creatures`) + anonymisierende View `challenge_board` (liefert nur Generationenzahl/Form/
  Reich/„das war ich", nie eine `user_id`) in `supabase/schema.sql`. Primärschlüssel
  (user_id, world_key, challenge_id) verhindert Fluten, `generations >= 5` spiegelt
  `CHAL_MIN_GENS`. Anti-Manipulation bewusst minimal (Client ist autoritativ, keine
  Server-Simulation, kein E-Sport-Titel) — explizit nicht gebaut: signierte Läufe,
  Nachsimulation, Replay-Prüfung.
  **3. Welt der Woche** — deterministisch aus der ISO-Kalenderwoche in UTC (kein Server-Cron,
  Wechsel für alle zur selben Sekunde), „schwer" ausgeschlossen (Einladung, keine Kür). Der
  Vergleich zeigt zuerst die **Vielfalt** der entstandenen Formen, danach erst die
  Generationenzahl — ohne Namen. Letzte 3 Wochen bleiben spielbar, kein Nachhol-Druck.
  Wohnort: oben im bestehenden „Herausforderungen ↗"-Modal, kein neuer Hauptbildschirm-Knopf
  (Komplexitäts-Audit hatte die Hauptansicht bewusst entlastet). V5 aus
  `docs/bindung-konzept.md` war inhaltsgleich mit „Welt der Woche" und damit miterledigt.
  **Alle Leitplanken aus `docs/bindung-konzept.md` gewahrt:** kein Streak/Login-Bonus, keine
  Frist, kein Verfall, verpasste Wochen bleiben spielbar, kein Vollständigkeits-Balken.
  **⚠️ Manuelle Aktion nötig:** `supabase/schema.sql`s neuer Block (`challenge_results` +
  `challenge_board`) ist NICHT automatisch auf der Live-Datenbank angewendet — das Skript
  muss einmal im Supabase-Dashboard (SQL Editor) ausgeführt werden. Bis dahin bleibt die
  Funktion lokal nutzbar (eigene Bestzeit in `localStorage`), der Cloud-Vergleich scheitert
  sauber und unauffällig (abgefangen, „Der gemeinsame Vergleichsraum ist gerade nicht
  erreichbar" statt Fehler).
  **Getestet:** alle 20 Gates grün (inkl. `ui-calm-check`, `app-parity` exakt 0) — unabhängig
  gegengeprüft (eigener Gate-Lauf + eigener Playwright-Lauf: feste Welt betreten, Regler/Seed/
  Generation-0-Reset/aktive-Herausforderungs-Karte alle korrekt bestätigt, 0 Konsolenfehler).
- [x] **V4 (erledigt 2026-07-30, Opus) — Wissen als Meta-Fortschritt:** ausschließlich im
  bestehenden Lebensbaum-Detail-Panel (Klick auf eine gefundene Form) — kein neues
  Hauptbildschirm-Element, kein Fortschrittsbalken, kein Erkenntnis-Zähler. Drei Blöcke pro
  Form: **(1) Bauplan** — die festgelegten Merkmale aus dem gemessenen Prototyp
  (`app/archetypes.js`), erstmals der Bauplan EINER FORM statt nur der Gen-Balken des eigenen
  Wesens. **(2) Kausalpfad** — GEMESSEN an derselben `fitness()`, die auch die Auslese
  treibt (relative Steigung d(Fitness)/d(Gen) an beiden Enden aller 16 Umwelt-Achsen; eine
  Aussage nur bei Vorzeichenwechsel + Mindesthebel 0.25), nicht behauptet. 107 Aussagen über
  42 von 44 Formen (Euglenoid/Plankton bekommen einen ehrlichen Ersatzsatz statt einer
  schwachen Behauptung). **(3) Dein Fundort** — die Welt des ersten Fundes (alle 16 Achsen,
  Generation, Wesensname, Biom), plus „diese Umwelt wiederherstellen ↗".
  **Bewusst verworfen (gemessen, nicht aus dem Bauch):** eine abgeleitete „hier wohnt sie"-
  Welt je Form — zwei Ableitungsverfahren gebaut und geprüft, trafen nur 4/44 Formen wirklich.
  Ein Knopf, der das verspricht und in 90% der Fälle etwas anderes liefert, wäre ein
  Farm-Werkzeug und schlechter als keiner.
  **Keine neue Umwelt-Achse als Dauerregler** (hätte Punkt 3 P1.3/1.4 widersprochen) —
  stattdessen holt „Fundort wiederherstellen" die 10 verborgenen Stressoren gezielt als die
  dafür vorgesehenen Wegwerf-Chips zurück, nie als neues Dauer-Bedienelement.
  **Rückwirkend:** Bauplan/Kausalpfad hängen nur am `discovered`-Set — für jeden bestehenden
  Spielstand sofort vollständig da; Fundort kann es für vor dieser Änderung entdeckte Formen
  naturgemäß nicht sein und sagt das offen, statt etwas zu erfinden.
  a11y: Detail-Panel wurde zum echten Dialog (Fokus-Falle + Fokus-Rückgabe), Escape-Kette
  entflochten (Form-Detail schließt zuerst, Lebensbaum bleibt offen — vorher schlossen beide
  auf einmal).
  **Getestet:** alle 20 Gates grün (`app-parity` exakt 0) — unabhängig gegengeprüft (eigener
  Gate-Lauf + eigener Playwright-Lauf: Bauplan-Balken/Kausalpfad-Sätze für „Leuchtwesen ·
  Tiefsee" mit vorab gesetztem `discovered`-Set visuell bestätigt, „Fundort nicht
  aufgezeichnet" korrekt für ungeloggte Altfunde, 0 Konsolenfehler außer dem erwarteten,
  abgefangenen Wikipedia-Sandbox-Block).
  Damit ist Backlog Punkt 5 (Nutzerbindung) inhaltlich abgeschlossen — V1/V4/V5 umgesetzt,
  V2/V3 bleiben bewusst offene Produktentscheidungen.
- [x] **V2 „Trägheit der Welt" — erledigt durch das Entwurfs-System, nicht separat gebaut
  (Nutzer-Entscheidung 2026-07-31).** V2 wollte laut `docs/bindung-konzept.md` erreichen,
  dass „man vorausdenken muss statt zu zappeln; jeder Eingriff bekommt Gewicht" — genau
  das leistet das in derselben Sitzung gebaute **Entwurfs-System** (Regler stellen →
  stille Vorschau → „Los" übernimmt), das auf dieselbe Nutzer-Beobachtung
  („fühlt sich zu volatil an") zurückgeht. Zusätzlich hätte V2s vorgeschlagene Umsetzung
  — „sichtbarer Fortschrittsbalken (‚Umstellung läuft, noch 40 Generationen')" — der am
  selben Tag getroffenen Entscheidung gegen Fortschrittsbalken widersprochen.
  **Kein zweiter Verzögerungs-Mechanismus obendrauf**, das wäre doppelte Bremse.
- [x] **V3 „Aussterben — aber nur unter deinen Augen" — umgesetzt (2026-07-31, Opus).**
  Nutzer-Entscheidung: bauen. Damit ist Punkt 5 vollständig.
  **Die Leitplanke ist strukturell erzwungen, nicht nur beabsichtigt:** die Uhr läuft in
  **beobachteten Sekunden** und wird ausschliesslich in der Bildschleife hochgezählt,
  nie in `simAdvance()`. Damit können die Offline-Nachsimulation (bis zu 240
  Generationen bei der Rückkehr), ein pausiertes Spiel und ein Hintergrund-Tab sie per
  Konstruktion nicht bewegen. **Gemessen:** 5.000 Generationen Offline-Nachholung in
  einer tödlichen Welt → Uhr bleibt bei 0, kein Tod.
  **Die Schwelle war der eigentliche Entwurfsfund.** Der naheliegende Weg — „Passung
  lange sehr niedrig" — wäre falsch gewesen: **drei der zwölf kuratierten Presets stehen
  dauerhaft bei 0 % Passung** (Urtümpel 0.000, Moderwald 0.004, Trüber See 0.008), weil
  `vitality()` erst ab Fitness 0.10 zu zählen beginnt. „Urtümpel" hätte jedes Mal
  getötet. Genommen wird deshalb die **rohe Fitness** mit gemessenem Abstand nach beiden
  Seiten: schlechtestes Preset 0.081 · Schwelle `PERIL_FIT` 0.040 · Boden der
  Fitness-Funktion (`phys.floor`) 0.020. Nur eine Welt, die die Fitness praktisch auf den
  Boden drückt — dort gibt es keine Auslese mehr —, kann töten; eine einzelne Katastrophe
  reicht nicht (nur Gift auf Maximum: 0.204). Alle 12 Presets über 1.300 Generationen
  gegengeprüft: keines gerät unter die Schwelle.
  **Ablauf:** 20 s Vorwarnung, 60 s bis zum Ende. Die Not wird **diegetisch** gezeigt —
  das Wesen verblasst sichtbar, je näher das Ende rückt; das ist die Uhr, ohne
  Stoppuhr-Ton, den dieses Spiel sonst nirgends hat. Dazu zwei Textstufen, die klar
  sagen, dass und wie es abzuwenden ist. Erholung läuft 3× so schnell zurück wie der
  Verfall — Welt heilen lässt die Warnung sofort verschwinden (verifiziert).
  **Beim Testen gefunden und entschärft:** nach dem Ende lief die Uhr in derselben
  unveränderten Welt sofort wieder los. Zweimal dasselbe zu verlieren lehrt nichts, es
  fühlt sich nur nach Strafe an. Jetzt ist die Uhr nach einem Aussterben **entschärft**,
  bis die neue Linie einmal wirklich lebensfähig war (`_perilArmed`) — wer die Welt
  heilt, schärft sie von selbst wieder; wer nichts tut, verliert auch nichts mehr.
  **Beim Ende:** Zeit hält an, die Linie zieht mit Name/Form/Generationenzahl in die
  Ahnenlinie, ein ruhiger Dialog verabschiedet sie, **entdeckte Formen bleiben im
  Lebensbaum** (verifiziert). Danach beginnt die nächste Linie.
  Gates: `design-audit` (beide Warnstufen einzeln auf AA geprüft), `ui-calm-check`,
  `app-parity` grün.

### 6 · Große Brocken — Rest-Achsen (Punkt 2 abgeschlossen, neu bewertet 2026-07-30 — s. u.)

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

- [x] **Rest von AXIS-3 · Aasfresser/Parasit — neu bewertet 2026-07-30, bewusst nicht
  gebaut:** Punkt 2 ist jetzt technisch abgeschlossen (Stufe 0-6), die Blockade ist
  entfallen — aber die zweite Bedingung aus dem ursprünglichen Eintrag ("nur falls ein
  konkreter Katalog-Faktor es rechtfertigt") ist geprüft und NICHT erfüllt. Es gibt
  keinen Katalog-Eintrag für „Aasfresser" (`grep` über `app/influences.js`: kein
  Treffer). Der einzige einschlägige Eintrag ist „Parasitismus (+/–)"
  (`app/influences.js` Z. ~1356) — der ist bereits mit `soon:true` markiert und explizit
  aus den aktiven Faktoren ausgeschlossen (`tools/influence-check.mjs`: `active =
  factors.filter(f => !f.soon)`), mit eigener Begründung im Datensatz selbst:
  `layerGrund: "Parasitismus braucht eine zweite Art als Gegenspieler, nicht nur ein
  Milieu."` Genau dieselbe Zwei-Arten-Anforderung ist es, weswegen Migrations-Stufe 7
  (Koevolution) gerade bewusst NICHT ohne Rückfrage eingeschaltet wurde (s. Punkt 2) —
  ein einzelnes `parasite`-Gen im Ein-Organismus-Fitness-Modell würde die Sache nicht
  wirklich abbilden (kein Wirt, keine Interaktion), sondern nur einen weiteren
  Kosten-Nutzen-Regler nach demselben Muster wie die 15 bestehenden Konditional-Gene
  hinzufügen — genau die im Ursprungseintrag selbst benannte Gefahr ("reine
  Muster-Wiederholung mit abnehmendem Grenznutzen"). Damit besteht keine der beiden
  Voraussetzungen für den Bau: kein aktiver Katalog-Faktor braucht es, und ein
  ehrlicher Bau bräuchte dieselbe Zwei-Populations-Mechanik, die Stufe 7 als
  Produkt-Entscheidung offen lässt.

### 7 · Live-App — Feinschliff & Aufräumen (kleinere Reste)

**Modell:** Sonnet — durchweg kleine, klar umrissene Fixes/Cleanups.

- [x] **CLS-4-Rest · schmale Größenfenster (erledigt 2026-07-30, Sonnet):** der Backlog-Eintrag
  maß mit dem falschen Werkzeug — `tools/research/optima.mjs` klassifiziert über die
  **veraltete** Kaskade (`tools/research/classify.mjs`), nicht über das seit Migrations-Stufe 2
  produktive `matchArchetype()`. Mit dem echten Matcher nachgemessen (11 Biome × 500 Starts,
  `tools/lib/app-core.mjs`, `fitness()` gegen `dist/engine/fitness.js` auf 0 Abweichung
  verifiziert): **Nadelbaum ist mit 4.13 % gar nicht selten** (Rang ~8 von ~100 Formen) — das
  war ein reines Messartefakt der Alt-Kaskade, keine echte Rarität. **Hutpilz** bestätigt
  unauffällig (1.35 %). Nur **Blütenkraut** blieb real selten (0.45 %) — Ursache gefunden:
  sein Prototyp in `app/archetypes.js` nannte nur 5 Gene (fehlendes `size`, dessen Streuung
  mit sd=0.244 hauchdünn über der automatischen Aufnahmeschwelle SD_MAX=0.235 aus
  `tools/research/archetype-derive.mjs` lag), während die direkten Nachbarn (Nadelbaum/Farn/
  Laubbaum/Strauch) alle 6 Gene nennen — `matchArchetype()`s Spezifitäts-Bonus
  (`specificityBonus=0.55`) bevorzugt bei Grenzfällen strukturell den vollständiger
  spezifizierten Prototyp. Behoben durch `size:.63` (Mittelwert über 8 Mio. Kraut-Genome im
  alten Blütenkraut-Zweig, dieselbe Geometrie-Methode wie Schritt 1 von
  `archetype-derive.mjs`, nur unterhalb dessen automatischer Schwelle) — kein neuer
  Physik-Term nötig, reine Matcher-Vervollständigung. **Ergebnis: Blütenkraut 0.45 % → 1.00 %
  (+122 %).** Ehrlich mitgemessene Nebenwirkung: Farn 1.05 % → 0.62 % (−41 % relativ) — Farn
  hatte bisher selbst vom unvollständigen Blütenkraut-Prototyp mitprofitiert (gewann dessen
  Grenzfälle strukturell, nicht weil es ihnen distanzmäßig näher lag); die Korrektur gleicht
  diese Asymmetrie aus, statt sie nur zu verschieben. Farn bleibt in ~8/11 Biomen sichtbar,
  weit über dem 0.14-%-Krisenbereich, der die Formen ursprünglich auffällig gemacht hatte —
  Trade-off geprüft und für tragbar befunden.
  Alle 17 Gates grün (inkl. `app-parity` 0, `app-fitness-check`), unabhängig gegengeprüft
  (eigener Gate-Lauf dieser Session).
- [x] **Lebensbaum-Lücke „Leuchtwesen · Tiefsee" (behoben 2026-07-29)** — echter `TREE`-Eintrag
  ergänzt (Reich Tier, `cl:"Ceratioidei"`, `era:"vor ~150 Mio. J."`, recherchiert: Davis/
  Sparks/Smith 2016, Biolumineszenz bei Strahlenflossern ab dem Jura, ≥27× unabhängig
  entstanden — deckt sich mit dem bereits vorhandenen Wikipedia-Ziel in `exemplar.js`).
  `FORM_KINGDOM`/`FORM_STORY` füllen sich automatisch aus `TREE`; der lokale
  `CHAL_KINGDOM_FALLBACK`-Workaround war dadurch komplett redundant und wurde entfernt.
  `app-parity`/`mf-fidelity` weiterhin grün.
- [x] **`docs/auslagerung/P5-ausgabe.json` aufräumen** (erledigt 2026-07-29) — Deletion
  hätte den historischen Kontext verloren, daher stattdessen `P5-aufgabe.md` mit einem
  klaren „ersetzt durch P8"-Hinweis versehen (JSON selbst unangetastet, bleibt als Archiv).
- [x] **P7 · Qualitäts-Audit (erledigt 2026-07-30, Sonnet):** Stichprobenbasiertes Audit, kein
  Massen-Rewrite. **Gen-Erklärungen** (`app/gene-explain.js`, alle 25 vollständig gelesen +
  Zeile für Zeile gegen `engine/fitness.ts` cross-geprüft): vier Einträge behaupteten einen
  Effekt, den die Fitness-Funktion tatsächlich nicht (oder anders) modelliert — Größe (fälschlich
  Kälteschutz behauptet, `thermal` nutzt nur `insulation`), Gliedmaßen (fälschlich generelle
  Baukosten behauptet, es gibt kein `m.limb` in `maintenance`, nur `aquaticLimbDrag`),
  Biolumineszenz (fälschlich "verrät die eigene Lage" behauptet, `biolumDefense` ist tatsächlich
  ein positiver Verteidigungsterm), Sinne (fälschlich frühere Gefahrenerkennung behauptet, `sense`
  wirkt nur über `senseBoost`/Beutefindung, nicht in `defenseScore`) — alle vier korrigiert.
  **Katalog-Faktoren** (`app/influences.js`, 63 gezielt gestreute Stichproben über alle 9
  `layer`-Kategorien + mechanischer Volltext-Duplikat-Scan über alle 284): zwei echte
  Daten-Lücken gefunden (`"desc": "."` — ein Platzhalter statt Erklärtext bei „Habitat-Zerstörung"
  und „Invasive Arten") und an der Quelle (`docs/faktoren-katalog.md`) behoben, dann neu generiert
  (`npm run build-influences` bzw. `tools/build-influences.mjs`). Keine Rechtschreib-/
  Grammatikfehler, keine biologisch falschen Aussagen, keine Redundanzen in der übrigen Stichprobe.
  **Chronik-Bausteine** (`app/story.js`/`app/story-extra.js`, 104 generierte Zeilen über eine
  Lagen-Suite + 54 stratifizierte `story-extra.js`-Zeilen): `story-extra.js` durchweg sauber; ein
  Ton-Ausreißer in `story.js` gefunden (BLUETE-Pool: "…meinen dasselbe" — personifizierende
  Intentions-Sprache, genau das Muster, das der bereits abgeschlossene "Chronik-Ton"-Beschluss
  abschaffen wollte) und ersetzt ("…passen zueinander", gleiche Kadenz, `story-check`-Kennzahlen
  unverändert 27 %/6 %).
  **Bewusst NICHT verändert:** die knappen, fachbegriff-dichten `desc`-Fragmente der 66 aktiven
  Faktoren (konsistentes systemweites Stilmuster, kein Einzelfehler); mehrere leicht-metaphorische
  Chronik-Fragmente außerhalb des BLUETE-Bannwort-Musters (akzeptierte Bildsprache, Geschmack
  statt Fehler).
  Getestet: `build`/`story-check`/`influence-check`/`exemplar-check` grün, unabhängig
  gegengeprüft (eigener Diff-Review + Gate-Lauf dieser Session).
  Damit ist Backlog Punkt 7 vollständig abgeschlossen.
- Optional: A4-Feinschliff (Ahnenlinie cloud-synchron via `ancestry`-Spalte — braucht
  Supabase-Schema; das In-App-Namensfeld ist bereits umgesetzt, kein `prompt()` mehr);
  B-Reste (Kontrast-Feintuning, autocomplete `new-password` bei Signup).
- [x] **`npm run seed-check` schlug fehl (behoben 2026-07-29)** — war tatsächlich eine zu eng
  kalibrierte Schwelle (0.12), aus der 9-dimensionalen Vor-Erweiterung übernommen. Hergeleitet
  statt geraten: acht frisch geseedete (monomorphe) Populationen liefern NN in [0.145, 0.152],
  eine echt diverse Population (uniforme Zufalls-Genome) liefert NN in [1.42, 1.47] — neue
  Schwelle 0.25 liegt sicher dazwischen. `tools/seed-check.mjs` jetzt grün, Herleitung im
  Code kommentiert.

### 8 · Gamification-Feinschliff

**Modell:** Sonnet — kleine UX-Politur, geringe Tragweite.

Rarität-Grundmechanik ist umgesetzt (s. „Erledigt" → „Rarität / Entdeckungs-Tiefe"). Offen
als Politur:
- [x] **Sanfte Biom-Empfehlungen (erledigt 2026-07-29)** — dezentes Sparkle-Badge an
  Preset-Buttons im neuen Presets-Panel, wenn der Mean-Field-Konvergenzpunkt dieses Bioms
  (dieselbe deterministische Regime-A-Logik wie `tools/research/biome.mjs`, lokal
  nachgebaut, einmalig memoiziert beim Öffnen des Panels — keine Pro-Frame-Berechnung) eine
  noch nicht entdeckte Form mit Rarität `selten`+ ergibt. Text: „In dieser Richtung wohnt
  vermutlich noch etwas Seltenes, das du noch nicht gesehen hast." — rein informativ, **kein
  Gate**, kein Preset gesperrt/deaktiviert. `app-parity`/`mf-fidelity` weiterhin grün.
  **Nebenbefund (kein Bug dieser Aufgabe):** `docs/rarity.json` hat noch keinen Eintrag für
  „Leuchtwesen · Tiefsee" (fällt auf `haeufig` zurück, bekommt daher nie ein Badge) — kleine
  Datenlücke, separat nachtragbar, nicht blockierend.
- [x] **Rarität in `tree-of-life.json` gespiegelt (erledigt 2026-07-29)** — jeder Knoten mit
  `ourForms` bekommt jetzt ein `formRarity`-Objekt (Name→Tier, aus `docs/rarity.json`, das
  bereits exakt dieselben Formnamen wie `TREE`/`ourForms` verwendet — keine Namens-Umrechnung
  nötig). Rein additiv, minimal-invasiv per gezielter Textersetzung eingefügt (kein
  Full-Reformat), Originalformatierung erhalten. Rein informativ, keine Spielfunktion liest
  diese Datei — reines Referenz-Dokument.

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
- [x] **Schritt 3 — Mechanismus-Ablationsstudie (erledigt, Checkbox-Nachtrag 2026-07-30 —
  Artefakte existierten bereits aus dieser Session, waren nur nicht abgehakt):**
  `tools/ablation-check.mjs` (Mechanismus × Phänomen-Matrix, Diagnose-Ausgabe ohne
  `process.exit(1)`, wie gefordert) + `docs/ablation-results.md` gebaut. Ergebnis
  (s. Zusammenfassung oben bei Schritt 2 sowie `docs/ablation-results.md` im Detail):
  Konkurrenz→nur P2, Migration→P1+P3 (gegensätzliche Vorzeichen), Koevolution→nur P5,
  Drift→alle sieben; der P4/Konkurrenz-Sonderfall (empirisch wirkungslos, 0.183 vs. 0.201)
  ehrlich dokumentiert statt die Schwelle zu verbiegen — dedizierte, im Code kommentierte
  Ablation (neutrale fitnessfreie Reproduktion, 0.183→0.653) gebaut.
- [x] **Schritt 4 — Schicht-B-Metriken (erledigt 2026-07-29):** `tools/distribution-check.mjs`
  gebaut, alle vier Prüfungen im Zielband (Score_B = 4/4): B1 Körpergrößen-Schiefe (May 1978,
  0.493 > 0.15), B2 SAD-Hollow-Curve (Fisher/Preston, Schiefe 1.089 + 81% unter Mittelwert),
  B3 SAR-Exponent (Arrhenius/Rosenzweig, z=0.357 im Band 0.15–0.4 — **methodische
  Ehrlichkeit**: bei der im Auftrag vorgeschlagenen kleinen Skala (1–8 Orte) misst das System
  robust z≈0.85, zu steil, weil der Artenpool bei so wenigen Orten nie sättigt; bewusst auf
  1–256 Orte erweitert, um in das Regime zu kommen, wo die Literatur-Zahl überhaupt gemessen
  wird — dokumentiert als Methodik-Entscheidung, nicht als aufgeweichte Schwelle, beide Werte
  werden ausgegeben), B4 Trophie-Näherung (Lindeman 1942, Räuber/Beute-Biomasse via Σsize³ als
  Proxy, da das Modell keine expliziten Trophiestufen/Masse-Zustände hat, 0.233 im großzügigen
  Band 0.03–0.3). Aggregation bewusst als transparenter Bestehens-Anteil statt einer
  gemeinsamen KS-/EMD-Distanz (die hätte eine gemeinsame Skala zwischen Schiefe/Anteil/
  Exponent/Verhältnis vorgetäuscht, die es nicht gibt). **P7 aus Schritt 2 verdrahtet**:
  `tools/phenomena-check.mjs` ruft jetzt `distribution-check.mjs`s Fit-Funktionen auf statt
  weiter zu warten — Gesamtergebnis jetzt 8/8 Phänomene. Alle 5 Kern-Gates + `phenomena-check`/
  `ablation-check` weiterhin grün. (Merkmals-Kovarianz/Kleiber-Abgleich war bereits als Punkt
  im Forschungsdokument genannt, aber bereits im Code als `kleiberDecades` validiert — hier
  nicht erneut aufgegriffen, kein offener Punkt.)
- [x] **Schritt 5 — Gewichte & Schwellen festlegen (erledigt 2026-07-29)** — **Modell: Sonnet** (begründete
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

  **✅ Erledigt (2026-07-29):** `training/fidelity-config.ts` — genau wie vorgeschlagen
  gleich gewichtet (1/3 je Schicht, keine belastbare Begründung für andere Gewichtung
  gefunden). Mindestschwellen: `MIN_SCORE_A = 7/8` und `MIN_SCORE_B = 3/4` (je ein
  Ausfall-Puffer bei aktuell 8/8 bzw. 4/4 — bestehen knapp, kippen aber nicht bei jedem
  erwarteten Grenzfall), `MIN_SCORE_C = 0.80` (übernimmt bewusst `TARGET_LOW` aus
  `training/fit.ts` statt eine neue Zahl zu erfinden — als **vorläufig markiert**, da Score_C
  gerade strukturell in Bewegung ist, s. Migrations-Stufe 6). `computeFidelity()` liefert
  `fidelity` + `passesThresholds` (hängt NUR an den Pro-Schicht-Schwellen, nicht an der
  gewichteten Summe — Goodhart-Schutz) + `failingLayers`. Verifiziert:
  `computeFidelity(1.0, 1.0, 0.72)` (heutiger Stand) → Fidelity 0.907, fällt knapp durch,
  ausschließlich wegen Schicht C — genau wie gefordert kein Grün-beim-ersten-Lauf.
- [ ] **Schritt 6 — `training/fit.ts` zum Drei-Schicht-Loop ausbauen** — **weiterhin bewusst
  nicht gebaut, jetzt aus einem anderen Grund (neu bewertet 2026-07-30, nach Abschluss
  Migrations-Stufe 6):** die ursprüngliche Pause-Begründung ("baut auf einer Komponente
  auf, die ersatzlos entfällt") ist überholt — `fitted-params.json` entfällt NICHT
  (Migrations-Stufe 6 hat das geprüft und bewusst anders entschieden, s. Punkt 2), und
  Score_C ist jetzt real definiert (`scoreCFromJsd()`, `training/fidelity-config.ts`).
  Ein Auto-Optimierungsloop wäre damit technisch nicht mehr widersprüchlich — aber
  **aktuell ohne Ziel**: alle drei Schichten bestehen bereits mit deutlicher Reserve
  (Score_A=1.0, Score_B=1.0, Score_C=0.978 bei Mindestschwelle 0.85 — kein Layer nah an
  seiner Schwelle, s. `tools/fidelity-config-check.mjs`). Ein elaborierter Sechs-Stationen-
  Optimierungsloop (Kandidat/Simulieren/Messen/Optimierer/Holdout-Selektion/Champion-
  Report) für einen Parameterraum zu bauen, der gerade nichts zu reparieren hat, wäre
  spekulative Infrastruktur ohne aktuellen Anlass — genau das Gegenteil von „kein
  Vollständigkeits-Zwang". **Auslöser, ab dem sich der Bau lohnt:** eine künftige
  Engine-/Physik-Änderung drückt eine der drei Schichten unter ihre Schwelle (oder nah
  genug heran, dass Handkalibrierung mühsam wird) — dann liefert genau diese Situation
  auch das Holdout-Portfolio zum Testen des Loops selbst. Bis dahin bleibt Handkalibrierung
  (wie bei Migrations-Stufe 3/3.5 praktiziert: gemessen, dokumentiert, an einer Stelle
  verankert) günstiger als die Wartungslast eines ungenutzten Optimierers.
  — **Modell: Opus** für
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

### 10 · Lebendige Welt — Roadmap (2026-07-30, Nutzerauftrag „groß denken")

Ausgangsfrage: kann der Lebensbaum mit einfachen Mitteln mehr Formen bekommen, die auch
im Spiel erreichbar sind? Antwort in zwei Schritten dokumentiert: **Bestand/Lücken**
(`docs/lebensbaum-luecken.md`, Sweep-Werkzeuge `tools/research/gap-sweep.mjs` +
`room-sweep.mjs`) und **Zielzustand/Roadmap** (`docs/roadmap-lebendige-welt.md`). Acht
Phasen, zunehmend tiefer in der Architektur (Präsentation → Physik → Population → Welt).
Erfindet keine neue Richtung — Phase 4/5/6/7 docken an bereits hier dokumentierte offene
Fronten an (P1 Radiation aus Punkt 9, Parasitismus-Rückstellung aus Punkt 6,
„zeitachse"-Layer aus `app/influences.js`, Populations-/Life-History-Ebene aus dem
Breiten-Feld-Fazit). Auftrag „lege los, keine Rückfragen" (2026-07-30) — Status je Phase
wird hier laufend nachgetragen, damit ein neuer Chat sofort weiß, wo er einsteigen kann.

- [x] **Phase 0 — Medium-Achse entwirren (Fundament) — erledigt (2026-07-30, Commit
  df4f279).** `water` NICHT in zwei Achsen gesplittet (das wäre der invasivere Weg
  gewesen) — stattdessen die eigentliche Ursache behoben: fünf Landpflanzen-Prototypen
  (Laubbaum, Strauch, Farn, Kraut, Blütenkraut) hatten kein `requires`-Fenster für
  `water` und konnten daher auch in fast vollständig untergetauchten Umwelten gewinnen
  (z. B. „Sonniges Flachmeer" → „Verholzter Strauch"). Fenster ergänzt + die 4
  namenswidersprüchlichen Presets korrigiert (Räuberland/Reiche Kronen/Dichter
  Wald/Sonniger Sumpf/Moderwald/Urtümpel). Alle 12 Presets konvergieren jetzt auf einen
  zu ihrem Namen passenden Bauplan (verifiziert). `sense`-Bugfix und
  `defenseFromBurrow`-Bugfix bewusst zurückgestellt (echte physics.json-Änderungen mit
  vollem Orakel-Regen/Retrain-Zyklus, kein Blocker für Phase 1–3 — s. Commit-Nachricht).
- [x] **Phase 1 — Pakete A/B/C sichtbar machen — erledigt (2026-07-30, Commit b367538),
  44 → 65 statt 66 Formen.** 9 Extremophile + 5 (statt geplanter 6) Nischen-Formen + 7
  Verfeinerungen — Details in `docs/lebensbaum-luecken.md` §6/§8. Regressionsmessung
  (neues Werkzeug `tools/research/archetype-transition-check.mjs`) fing eine geplante
  22. Form (Knöllchenbakterium, `nfix`-basiert) beim Drücken von Bakterie/Archaee auf
  0,3 %/0,9 % Erreichbarkeit (vorher 9,5 %/9,9 %) — entfernt statt live geschickt, s.
  Kommentar in `app/archetypes.js`. Alle Pflicht-Gates grün (app-parity exakt 0,
  ecology/reality/exemplar-check/rarity-check/distribution-check/story-check/
  influence-check).
- [x] **Phase 2 — Amphibisch als echte Nische — versucht, gemessen, zurückgenommen
  (2026-07-30).** Ein additiver Energiekanal `energyAmphibious` (Dreieck-Peak bei
  moderatem `limb`, aktiv in einem schmalen Wasser-Band um `aquaticWaterFloor`) machte
  Amphibie tatsächlich schwach über Selektion erreichbar (vorher nur Drift) — brach dabei
  aber `tools/coevolution-check.mjs` (Red-Queen-Koevolution, P5 aus Schritt 2 unten): die
  Testumwelt liegt bei `water=0.5`, exakt im Zentrum des neuen Kanals. Jeder getestete
  Ertrag (0,3/0,6/0,9/1,5) senkte das Koevolutions/Kontroll-Verhältnis von 6,6× auf
  1,4–2,1×, unter die 2,5×-Schwelle — der Kanal gab der Beute-Population einen Ausweg aus
  dem größenbasierten Rüstungswettlauf. Vollständig zurückgenommen (physics.json,
  engine/fitness.ts, engine/types.ts, oracle/reference_model.py), alle Gates wieder auf
  Baseline (coevolution 6.6×, pop-check 0.033, branching 2.43×). Details + Anschluss-Idee
  (Kanal-Zentrum bewusst nicht auf `aquaticWaterFloor`) in
  docs/roadmap-lebendige-welt.md Phase 2. **Nebenbefund dabei gefunden und behoben:**
  Seestern · Stachelhäuter (Phase 1) konkurrierte unabhängig vom Amphibisch-Versuch mit
  Euglenoid um den Urtümpel-Preset (water=0.65) — `requires` auf `water:[0.55,1.00]`
  geschärft (Seesterne sind marin) und Urtümpel-Preset auf water=0.78 verschoben.
  Dreiwertiger Medium-Toggle bleibt aus denselben Gründen wie ursprünglich zurückgestellt.
- [x] **Phase 3 — Habitat als Weltebene — Kernstück umgesetzt (2026-07-30).** Die 12
  bestehenden Biom-Presets sind bereits die Habitat-Ebene (`tools/research/room-sweep.mjs`
  zeigt: jedes hat ein eigenes Formprofil) — keine zusätzliche UI-Ebene nötig, das hätte
  gegen den Komplexitäts-Audit (Punkt 3, „6 Regler + Presets, nicht mehr") verstoßen.
  Stattdessen die vier eindeutigen Fälle umgesetzt, bei denen der Name des Ortes den
  Stressor bereits verspricht: `stress:{ax,v}` an `BIOMES` (app/index.html) —
  Eiszeit→Frost, Hitze-Dürre→Dürre, Offenes Meer→Salz, Lichtlose Tiefsee→Druck. Ein Klick
  setzt jetzt zusätzlich diesen Stressor (vorher: alle Presets „sauber", Stressoren nur
  über Zufalls-Karten). Macht 4 der 9 Paket-A-Extremophilen an einem festen ORT findbar
  statt nur per Zufall — im Browser verifiziert (Playwright: Klick auf „Lichtlose
  Tiefsee" → Stress-Chip „Tiefsee-Druck ✕" → Population konvergiert auf „Tiefsee-
  Amphipode · Druckfest", Screenshot geprüft). `biomeHintForms()` (die stille
  Empfehlungs-Vorschau) rechnet jetzt in derselben Welt inkl. Stressor, sonst hätte der
  Hint vom echten Ergebnis abgewichen. Wind/Frost gemeinsam für „Polar" geprüft und
  verworfen: Frost dominiert ohnehin, Wind haette nichts zusaetzlich sichtbar gemacht.
  Nachtrag geprüft und erledigt, ohne neuen Code: der hier offen notierte Punkt (Genbuch
  um räumliche Lesart ergänzen) existiert schon — app/index.html:2394-2405 dokumentiert,
  dass eine Vorhersage-Version bereits gebaut und mit nur 4/44 Trefferquote verworfen
  wurde; gebaut wurde stattdessen „Dein Fundort" (app/index.html:2491-2618): die
  tatsächlich aufgezeichnete Fund-Umwelt je Form inkl. Biom-Name und Wiederherstellen-
  Knopf. Kein zweiter Anlauf nötig — s. docs/roadmap-lebendige-welt.md Phase 3.
- [x] **Phase 4 — Speziation — Befund korrigiert (2026-07-30): Mechanik existiert
  bereits, 8/8 validiert.** `npm run phenomena-check` (`tools/phenomena-check.mjs`) lief
  bei der Bestandsaufnahme bereits grün für ALLE acht Phänomene inkl. P1 Adaptive
  Radiation und P2 Sympatrische Speziation/Branching, je mit bestandener Ablationsprobe.
  Der ursprüngliche Roadmap-Text („bricht die Grundannahme eine Form = ein Genom-Punkt")
  ging von einem falschen Stand aus — Schritt 2 aus diesem Punkt 9 war schon 2026-07-29
  erledigt, nur beim Roadmap-Entwurf nicht mit der Lebensbaum-Frage verknüpft worden.
  `world/population.ts` + `world/cluster.ts` + `world/census.ts` liefern Mehrgipfel-
  Erkennung + Pro-Cluster-Benennung bereits produktiv im „Lebende Welt"-Overlay. Die
  echte offene Frage ist keine Physik-, sondern eine UX-Frage: die Single-Habitat-
  Hauptansicht (`app/index.html`) zeigt bewusst nur EIN Wesen (Produkt-Pfeiler) — wie
  sich eine Aufspaltung dort andeuten liesse, ohne diese Praemisse zu brechen, braucht
  einen eigenen Design-Durchlauf mit dem Nutzer, s. docs/roadmap-lebendige-welt.md
  Phase 4. — **Modell: Opus** fuer diesen Design-Durchlauf, sobald angefordert.
- [x] **sense/defenseFromBurrow-Bugfix — nachgeholt aus Phase 0 (2026-07-30).** Zwei in
  Phase 0 bewusst zurückgestellte Physik-Bugs (Commit df4f279: „echte physics.json-
  Änderungen mit vollem Orakel-Regen/Retrain-Zyklus, kein Blocker für Phase 1–3").
  **sense** wirkte als Multiplikator (`1 + senseForage*sense*(1-foodAbundance)`) auf
  `energyForage`, das selbst LINEAR mit `foodAbundance` skaliert — bei echter Knappheit
  (wo der Bonus greifen soll) blieb selbst sense=1 ein Nettoverlust gegen
  `maintenance.sense` (gemessen; kein einziger der 65 Archetypen benannte `sense` im
  Prototyp — ein „totes" Gen ohne eigene Nische). Fix: `sense` hebt jetzt die
  WAHRGENOMMENE Nahrungsdichte an (`foodPerceived = foodAbundance +
  senseForage*sense*(1-foodAbundance)`), `energyForage` skaliert damit statt mit dem
  rohen `foodAbundance`. **defenseFromBurrow** wirkte auch für völlig sessile Baupläne
  (Bug — ein Pilz/Mikrobe ohne jede Mobilität bekam dieselbe „Flucht in den Bau" wie ein
  Wühler). Fix: mit `*mobility` skaliert. Der Burrow-Fix allein verschob die Reich-
  Balance messbar (Tier bis 67 % statt ≤55 % im `ecology`-Gitter, weil sessile Formen
  ihren einzigen Räuber-Fluchtweg verlieren) — kompensiert über drei kleine
  Nachjustierungen statt eines großen Hebels (ein einzelner starker `defenseFromCamo`-
  Ausschlag machte camo in der isolierten Räuberdruck-Regel selbst dominant und riss
  reality-checks Panzer-/Grabtrieb-Regeln; ein zu starker Eingriff an
  defenseFromArmor/-Mobility verschob wiederum B3/B4 aus distribution-check — beides
  gemessen und zurückgenommen): `defenseFromCamo` 0.3→0.5, `defenseFromMobility`
  0.35→0.18, `defenseFromArmor` 0.45→0.46. Volle Pipeline (Orakel-Regen, Retrain,
  PARAMS-Sync, Bundle) durchlaufen. Alle Pflicht-Gates grün: parity/app-parity/app-
  fitness-check exakt 0, ecology (Tier 51,9 %, Baseline war 52,1 %), reality (20/20),
  distribution-check (4/4, B1–B4 alle im Zielband), mf-fidelity, pop-check,
  coevolution-check (Red Queen 7,9×, Schwelle 2,5×), phenomena-check (8/8), exemplar-/
  rarity-/story-/influence-/branching-/world-check — sowie
  `archetype-transition-check.mjs` (4000 Umwelten): keine der 65 Formen verliert
  Erreichbarkeit.
- [x] **Zweiter Anlauf: Amphibische Nische ohne Koevolutions-Konflikt — erfolgreich
  (2026-07-30).** `energyAmphibious` (AXIS-21) neu gebaut, diesmal mit eigenem Zentrum
  `amphibiousWaterCenter=0.65` statt `aquaticWaterFloor=0.5` (dem Zentrum des ersten,
  zurückgenommenen Versuchs) + Bandbreite `amphibiousBandWidth=0.13`: bei `water=0.5`
  (coevolution-checks feste Testumwelt) ist der Kanal dadurch RECHNERISCH EXAKT null.
  Zweites Dreieck-Gate auf `limb` (Optimum 0,45) verhindert Missbrauch durch reine
  Land-/Wassertiere. `coevolution-check` unverändert bei 7,9× (identisch zum Wert ohne
  Kanal — der erste Anlauf hatte selbst beim niedrigsten Ertrag 1,4–2,1× erreicht).
  Amphibie · Lurch dadurch schwach über echte Selektion erreichbar (`gap-sweep`: 0/4000
  → 2/4000 — bewusst schwach, die Nische ist eng). Volle Pipeline durchlaufen (Orakel-
  Regen, GA-Retrain, PARAMS-Sync, Bundle). Alle Pflicht-Gates grün: parity/app-parity
  exakt 0, ecology, reality (20/20), distribution-check (4/4), mf-fidelity, pop-check,
  phenomena-check (8/8), coevolution-check (7,9×) — sowie `archetype-transition-check`
  (4000 Umwelten): keine der 65 Formen verliert Erreichbarkeit. Details in
  docs/roadmap-lebendige-welt.md Phase 2.
- [x] **Medium-Umschalter Land/Wasser (UI-Nachtrag, 2026-07-31).** Nutzer-Vorschlag von
  ganz zu Beginn dieser Sitzung, jetzt eingelöst (Vorbedingung — echte amphibische
  Nische statt Etikettenschwindel — war durch den Zweiten Anlauf oben erfüllt).
  Zweiwertiger Umschalter „Lebensraum: Land / Wasser" oberhalb der 6 Regler. Kein neues
  Gen, kein physics.json-Eingriff: `water` bleibt ein Regler, der Umschalter engt nur
  sein Band ein (Land 0,02–0,35 „Feuchte", Wasser 0,65–1,00 „Wassertiefe") und tauscht
  Beschriftung/Pole; die anderen fünf Regler bleiben in beiden Welten identisch. Nur bei
  manueller Bedienung wirksam — Presets/Einflüsse/Fundort setzen weiterhin eigene,
  kuratierte `water`-Werte (auch in der bewussten Lücke zwischen den Bändern, z. B.
  Moderwald 0,42) und werden dabei NICHT verzerrt (`syncLeverInputs()` setzt den Regler
  für diese Fälle auf volle Spanne zurück). Im Browser verifiziert (Playwright): Toggle
  engt Band korrekt ein, Presets bleiben unverzerrt, erneuter Toggle-Klick nach einem
  Preset funktioniert. `app-fitness-check` bestätigt: reine UI-Änderung, Physik-Bundle
  unverändert. Details in docs/roadmap-lebendige-welt.md Phase 2.
- [x] **Entwurf statt Sofort-Wirkung: Regler → Vorschau → „Los" (UI-Nachtrag,
  2026-07-31).** Nutzer-Feedback: freies Regler-Drehen fühlte sich zu volatil an, weil
  jeder Dreh sofort die laufende Welt änderte. Umgebaut auf zwei Phasen: Regler/Medium-
  Umschalter schreiben jetzt in `envDraft` statt `env` — das lebende Wesen entwickelt
  sich unter der ALTEN Welt unbeeinflusst weiter, während eine Leiste unter den Reglern
  eine ECHTE (gerechnete, nicht geratene) Vorschau zeigt: `stepGeneration()` (derselbe
  Mittelfeld-Pfad, den `biomeHintForms()` schon für Presets nutzt) ab dem *aktuellen*
  Genom, debounced (~220ms) nach der letzten Reglerbewegung. Text-Vorschau kombiniert
  eine Kurzbeschreibung der Welt (aus den vorhandenen LEVERS-Polwörtern, nichts neu
  erfunden) mit der wahrscheinlichen Zielform + deren realem Vorbild aus `exemplar.js`
  (`window.__archetypeWiki`) — bewusst NICHT rein aus der Reglerstellung geraten, das
  wurde in einer früheren Sitzung schon einmal versucht und mit nur 4/44–14/44
  Trefferquote verworfen. „Los" übernimmt `envDraft → env`, „Verwerfen" verwirft ihn;
  Presets/Umwelt-Einflüsse/Fundort-Wiederherstellung bleiben bewusst Sofort-Anwendung
  (kuratierte, bereits geprüfte Welten) und räumen einen offenen Entwurf automatisch weg
  (`syncLeverInputs()`). Bug gefunden und behoben: `.draftbar[hidden]` fehlte —
  `display: flex` aus der Klassen-Regel gewann sonst gegen die UA-Regel `[hidden]`
  (dasselbe Muster wie der frühere Komplexitäts-Audit-Fund P1.4). Im Browser verifiziert
  (Playwright): Generation-Zähler läuft während des Entwurfs unbeeinflusst weiter, Los/
  Verwerfen/Preset-Override funktionieren, keine JS-Fehler.
- [x] **Phase 5 — Symbiose/Parasitismus — umgesetzt (2026-07-30).** Neue Datei
  `world/symbiosis.ts` (Ergänzung neben `world/coevolution.ts`, kein Eingriff dort):
  zwei Populationen über denselben Merkmals-Passungs-Kernel gekoppelt wie beim
  Räuber-Beute-Modell, aber mit anderer Auszahlung — **Mutualismus** (beide Seiten
  gewinnen bei Passung, treibt Konvergenz) und **Parasitismus** (Parasit gewinnt, Wirt
  verliert an derselben Interaktion — kontinuierlicher Abzug statt Fang-Risiko). Kein
  neues Gen, keine physics.json-Änderung, berührt die Live-App nicht. Gemessen statt
  behauptet (`tools/symbiosis-check.mjs`, `npm run symbiosis-check`): Mutualismus
  konvergiert zwei absichtlich auseinanderliegende Populationen (Start 0,2/0,8) auf
  Abstand 0,007 vs. 0,033 ohne Kopplung, UND beide Seiten gewinnen am Endzustand
  messbar Fitness durch den Partner (+0,195/+0,194 — die eigentliche „wechselseitige
  Abhängigkeit", nicht nur Korrelation). Parasitismus zeigt die Gegen-Asymmetrie: Wirt
  verliert (−0,056), Parasit gewinnt (+0,071) an derselben Interaktion.
  `coevolution-check` bleibt unverändert bei 7,9× (keine Kollision). Die „Flechte" bleibt
  vorerst eine fest verdrahtete Kuration in `app/archetypes.js` — sie aus dieser Dynamik
  emergent entstehen zu lassen ist ein eigener UX-Schritt, s. docs/roadmap-lebendige-
  welt.md Phase 5.
- [x] **Phase 6 — Zeitachse — Kernstück umgesetzt (2026-07-30).** Neue Datei
  `world/seasonal.ts`: eine Umwelt-Achse oszilliert sinusförmig über Generationen statt
  einen festen Punktwert zu halten. Kein neues Gen, keine physics.json-Änderung, Live-App
  unberührt. Gemessen (`tools/seasonal-check.mjs`, `npm run seasonal-check`): (1)
  Kompromiss/Hedging — zyklische Temperatur (Amplitude 0,35) lässt Isolation auf ~0,74
  konvergieren, das flache Mittel derselben Umwelt nur auf ~0,48 (Δ≈0,26, nicht durch
  „Durchschnitt der Extreme" erklärbar). (2) Lag/Dämpfung — kurzer Zyklus (10 Gen/„Jahr")
  dämpft die Merkmals-Amplitude auf 28 % der Umwelt-Amplitude, langer Zyklus (150 Gen)
  folgt fast vollständig. Bewusst NICHT gebaut: echte Verhaltens-Plastizität (Winterschlaf,
  Fellwechsel) — braucht eine neue Genom-Semantik (Reaktionsnormen statt fester Werte),
  ein groesserer struktureller Eingriff als diese Sitzung. Details in
  docs/roadmap-lebendige-welt.md Phase 6.
- [x] **Phase 7 — Populations-/Life-History-Ebene — r/K-Selektion umgesetzt
  (2026-07-30).** Neue Datei `world/lifehistory.ts`: variable Populationsgröße
  (logistisches Wachstum zu einer Tragfähigkeit K) ergänzt neben `world/population.ts`
  (das selbst unangetastet bleibt — Null Risiko für bestehende Mechanismen). r-Anteil
  und Selektionsschärfe sind Populations-Parameter, keine Einzel-Gen-Phänotypen. Gemessen
  (`tools/lifehistory-check.mjs`, `npm run lifehistory-check`): r-parametrisierte Stämme
  erholen sich nach periodischen Engpässen in 3 statt 17 Generationen auf 90 % der
  Tragfähigkeit; K-parametrisierte Stämme erreichen im stabilen, überfüllten Regime eine
  um ~35 % höhere Gleichgewichts-Fitness — beide klassischen r/K-Vorhersagen (MacArthur &
  Wilson 1967) bestätigt. Dispersal/Sozialität aus demselben Punkt offen — brauchen einen
  Mehr-Orte-Kontext über eine einzelne Population hinaus, s. docs/roadmap-lebendige-
  welt.md Phase 7.

**Ab Phase 4 ist „Formenzahl" nicht mehr die richtige Metrik** — das System kippt von
„handkuratierte Blätter" zu „ein Baum, der selbst wächst" (Details in
`docs/roadmap-lebendige-welt.md`, Abschnitt „Größenordnung").

---

### 11 · Zeitgefühl & Vergleichsspiel-Recherche (2026-07-31, noch nicht umgesetzt)

Auslöser: Nutzer vermisste beim Betrachten einer kämpfenden Linie einen „zeitlichen
Bezug" und fragte, ob ein Fortschrittsbalken passen würde. Antwort **nein** — steht
explizit als Leitplanke in Punkt „🧭 Produkt-Pfeiler" (`kein Vollständigkeits-Balken`,
`kein Grind/Skinner-Loop`) — recherchiert stattdessen Muster aus Spielen, die bewusst
ohne Balken auskommen (Outer Wilds Ship Log, Dwarf Fortress/Crusader-Kings-Chronik,
Don't-Starve-Tagzähler, Animal-Crossing-Echtzeitkopplung) sowie allgemein
Vergleichsspiele zu Genetik/Bindung ohne Grind (Niche — Breed & Evolve, Creatures/
Norns, Pokémon-Snap-artige Naturfotografie-Spiele, thatgamecompany-Bindungsdesign).
Volle Recherche inkl. Quellen im Session-Verlauf, hier nur die daraus abgeleiteten,
noch offenen Ideen:

- [x] **Jahreszeiten in der Live-App — erledigt (2026-07-31).** Die seit Phase 6 dormante
  `world/seasonal.ts`-Oszillation ist jetzt verdrahtet. **Achse Temperatur**, Amplitude
  0.10, Periode 600 Generationen (≈75 s bei Standardtempo). Temperatur gewählt, weil sie
  als einzige Achse schon die Himmels-/Bodenfarbe trägt — die Jahreszeit wird damit ohne
  neues Widget sichtbar (Ziel: erlebter Rhythmus statt Zahl). Dazu eine leise
  „Jahr N · Jahreszeit"-Zeile im bestehenden Generations-Chip.
  **Architektur (analog env/envDraft):** `env` bleibt die NOMINALE Welt (Regler,
  Speicherstand, Presets, Herausforderungs-Grenzen, Entwurfs-Vorschau lesen nur diese),
  `envLive` = env + Versatz treibt Evolution, Selektions-Messung der Warum-Zeile, Passung
  und Bühne. Gemessen: `env.temperature` bleibt bei 0.50, während `envLive` über das Jahr
  0.40↔0.60 schwingt; Speicherstand enthält nur den Nominalwert.
  **Während einer Herausforderung steht die Jahreszeit still** — `challengeTick()` wertet
  jedes Verlassen von `ch.grenzen` sofort als Abbruch, eine schwankende Temperatur würde
  laufende Versuche zufällig zerstören und die Vergleichbarkeit brechen. Über ein ganzes
  Jahr verifiziert: `envLive` bleibt dann exakt nominal.
  **Verifiziert, dass „Angepasst — die Form steht" erreichbar bleibt** (die Sorge bei
  einer dauernd schwingenden Umwelt): Form setzt sich und hält über 190+ Generationen
  durch einen Jahreszeitwechsel; die Passung „atmet" dabei sanft mit (41–46 %).
- [x] **Alter/Stabilitäts-Text statt Zahl — erledigt (2026-07-31), mit nachgezogener
  Regressions-Korrektur.** „Angepasst — die Form steht" bekommt einen Zeitbezug („seit
  über N Generationen stabil"). `_why.stableSince` merkt sich die Generation, seit der
  die Form ununterbrochen steht, und wird zurückgesetzt, sobald die Umwelt wieder etwas
  formt.
  **⚠️ Lehre — der erste Anlauf (Commit 6e8b29e) war eine echte Regression.** Er zeigte
  die EXAKTE Generationszahl und umging dafür den sig-Kurzschluss der Warum-Zeile. Damit
  änderte sich die Zeile bei jedem WHY_MS-Takt: `npm run ui-calm-check` fiel von 3/2/3
  auf 26/106/52 Wechsel je 12 s (Richtwert 6) — genau das Zappeln, gegen das dieses Gate
  nach einer Nutzer-Beschwerde gebaut wurde. Ursache des Fehlers war NICHT die Idee,
  sondern das Vorgehen: es lief nur ein selbstgeschriebener Playwright-Check, der die
  FUNKTION bestätigte, aber nicht das Projekt-Gate, das genau diese Klasse von Schaden
  abdeckt. **Regel daraus: bei jeder Änderung an der Warum-Zeile/den Gen-Balken gehört
  `npm run ui-calm-check` zum Pflichtprogramm, nicht ein Eigenbau-Check.**
  **Korrektur:** die Zahl wird auf eine MULTIPLIKATIVE Leiter gerundet
  (`STABLE_STEPS` = 100/500/2.500/10.000/50.000/250.000, ×5 je Stufe) und der
  sig-Kurzschluss wieder genutzt (die Stufe ist Teil der Signatur). Eine lineare Leiter
  (50/100/250/500…) reichte NICHT: bei Tempo „schnell" rasen Tausende Generationen durch
  ein 12-s-Fenster und die Leiter allein brauchte schon 6 von 6 Wechseln auf
  (gemessen, isoliert mit Amplitude 0). Mit ×5-Stufen: **2/1/2 — ruhiger als die
  ursprüngliche Baseline.** Die Aussage („schon lange") bleibt vollständig erhalten.
- [x] **Onboarding-Selbstcheck — erledigt (2026-07-31).** Gegengeprüft: `#onboard`,
  Regler-Tooltips, Presets/Herausforderungen/Umwelt-Einfluss-Buttons hatten alle schon
  ein `title`. **Eine echte Lücke gefunden:** die neuen Land/Wasser-Medium-Buttons
  (diese Session, Punkt „Medium-Umschalter") hatten KEIN Tooltip — man konnte nur durch
  Ausprobieren herausfinden, dass sie den Wasser-Regler zwischen Feuchte- und
  Wassertiefe-Wertebereich umschalten. Genau die Art Lücke, an der laut Recherche
  Niche (Breed & Evolve) krankte. Behoben: Tooltips auf beiden Buttons + dem
  „Lebensraum"-Label.
- **Schnappschuss-Moment — verworfen (2026-07-31, Nutzer-Entscheidung).** Inspiriert
  von Naturfotografie-Spielen (Pokémon Snap/Bugsnax/Alba): ein internes Album mit
  Discovery-/Stabilisierungs-Momenten einer Linie. **Begründung:** deckt sich bereits
  mit dem Lebensbaum/Genbuch — ein zusätzliches internes Album wäre redundant zur
  bestehenden Entdeckungs-Übersicht.
- **Verletzlichkeit sichtbar lassen — bestätigt, kein Task.** Companion-Bindungs-
  Forschung (Yu-kai Chou u. a.) bestätigt: gezeigte Schwäche/Kampf („0 % Passung ·
  kämpft") ist Teil der emotionalen Bindung, kein Zustand, den man wegdesignen sollte.
- [x] **`npm run app-world-smoke` war rot — behoben (2026-07-31, Sonnet).** Ursache
  gefunden, kein Timing-Problem: `openInfl()` startet mit **eingeklappten Kategorien**
  (`setInflCatsExpanded(false)`) — die kuratierte Startansicht aus dem
  Komplexitäts-Audit P1.4 (Schnellzugriff-Chips statt vollem Katalog, `#inflCats`
  bleibt hidden bis „Alle Kategorien anzeigen ↗" geklickt wird). Der Smoke-Test wartete
  auf sichtbare `.infl-cat`-Elemente, die vor diesem Klick gar nicht sichtbar sein
  sollen — die App war korrekt, der Test kannte die spätere UX-Änderung nicht.
  **Fix:** Test klickt jetzt `#inflCatsToggle`, bevor er auf die Kategorien wartet —
  genau der Weg, den ein echter Nutzer zum vollen Katalog nimmt. Dreimal grün
  hintereinander laufen lassen, um einen Zufallstreffer auszuschließen.

### 12 · Realer Artenkatalog — der Katalog wird rückwärts aus Wikidata befüllt (2026-08-01)

**Modell:** je Schritt einzeln vermerkt — grob: **Sonnet** für Ernte/Format/Migration,
**Opus** für Matcher, Regelwerk, Abdeckung und Kontingenz.
**Voller Plan: `docs/artenkatalog-plan.md`** (maßgeblich; hier nur der Zeiger).

*(Nutzer, 2026-08-01)* Vision: „irgendwann sollen alle Lebewesen abgebildet und erreichbar
sein." Erste Idee war ein Zufallsfaktor kurz vor der Artauswahl. Die Analyse ergab: der
Zufall ist bereits da (Schwarm, N=200, Drift — `phenomena.ts` misst Kontingenz), er wird
nur vom `argmin` in `matchArchetype()` wieder weggerundet, und die eigentliche Grenze ist
die auf 70 handkuratierte Prototypen gedeckelte Benennung.

**Die Umkehrung (Nutzer):** den Katalog nicht vorwärts erzeugen, sondern **rückwärts aus
realen Lebewesen befüllen, die einen Wikipedia-Eintrag haben** — Beleg direkt in den
Daten. Damit ist der Zwei-Klassen-Katalog (90 % Einträge ohne Quelle/Icon/Text)
strukturell ausgeschlossen, und es fällt eine **Abdeckungs-Metrik** ab: welcher Anteil der
realen Formenvielfalt ist von der Engine überhaupt erreichbar, und wo sind die Lücken.

**Entschieden:** ~5.000–20.000 Arten · Platzierung im 25-D-Genraum **hybrid** (Merkmale +
Kladen-Regeln + hierarchische Imputation + Habitat-Rückwärtslauf) · der Katalog **ersetzt
die Benennung** · Wikidata (CC0) als Rückgrat, dewiki-Sitelink als Pflichtfilter.

**Tragende Architektur-Entscheidung — zweistufige Benennung.** Stufe 1 bleibt der heutige
Matcher und liefert die **Bauplan-Gruppe** als stabilen Schlüssel (`key` existiert in
`app/archetypes.js` bereits); Stufe 2 sucht die nächste reale Art *innerhalb* der Gruppe
und liefert den Anzeigenamen. Damit brechen `TREE`/`RARITY`/`FICON`/`challenges.js`/
`story.js` **nicht**, der Matcher bleibt bezahlbar (~1 % der naiven Suchkosten), und der
Zufallsfaktor bekommt zum ersten Mal eine sichtbare Wirkung — innerhalb einer Gruppe
entscheidet genau das, worauf die Selektion nicht schaut.

**Reihenfolge (nach Abhängigkeit UND Netzbedarf — Phase 0 braucht kein Netz):**
- [x] **0.1** Schlüssel-Ebene entkoppelt (2026-08-01) — `formKey()`/`formName()`, Gate `npm run key-check`.
- [x] **0.2** Katalog-Format + Bootstrap (2026-08-01) — `app/catalog.js`, 65 Einträge,
      **64 mit Wikidata-QID** (live aufgelöst), Gate `npm run catalog-check`.
- [x] **0.3** Zweistufiger Matcher (2026-08-01) — `nearestReal()`; gemessen 0,12 µs je
      Eintrag → 16.686 Einträge je Gruppe passen ins 2-ms-Budget. Benennung kippt
      datengesteuert (`stage: "full"`), nicht per Code-Änderung.
- [x] **1.1** Wikidata-Ernte (2026-08-01) — `tools/wikidata-harvest.mjs`, adaptiver
      Top-down-Ernter (schneller Pfad + Zerlegung bei Timeout). **20.178 Arten** über
      25 verifizierte Wurzel-Kladen, 100 % mit vollständiger Elterntaxon-Kette
      (`tools/wikidata-lineage.mjs`) und echtem dewiki-Artikeltitel
      (`tools/wikidata-sitelinks.mjs`). Restliche Warteschlange (2.268 Kladen) bewusst
      offen gelassen — im Zielband, weitere Läufe sind resumierbar.
- [x] **1.1b** Merkmalsquellen-Prototyp (2026-08-01) — PanTHERIA + EltonTraits
      (Säuger+Vögel) über den GitHub-Spiegel `RS-eco/traitdata`, 55–81 % Verknüpfungsquote.
      AmphiBIO/fishmorph/lizard_traits nicht angebunden (Nicht-UTF-8-Zitationsspalten,
      kein R-Interpreter in der Umgebung). Lizenz der Originaldaten nicht abschließend
      geklärt (Prototyp-Status, s. Kopfkommentar `tools/build-traits.mjs`).
- [x] **1.2** Kladen-Regelwerk (2026-08-01) — `tools/lib/clade-rules.mjs`, 163 Regeln über
      194 verifizierte QIDs, Konfidenz 2, kein Netz/LLM zur Laufzeit. 28/28 Stichproben,
      Spezifitäts-Ordnung gegen 135 echte Ketten geprüft. Vier QID-Funde dabei (Insecta
      hängt unter Crustacea, drei parallele Bedecktsamer-Items, falsche Konifer-QID,
      „Farne" war gar kein Taxon-Item).
- [x] **1.3** Imputation + Habitat-Rückwärtslauf (2026-08-01) — `tools/lib/impute.mjs`;
      vorab `tools/wikidata-lineage.mjs` (Elterntaxon-Ketten ebenenweise nachgeladen:
      **14.495 Arten in 4:02 min, 132 Abfragen**). Konfidenz über 200 Arten × 25 Gene:
      **0,3 % conf 3 · 46,7 % conf 2 · 16,4 % conf 1 · 36,6 % conf 0** — davon tragen
      87 % der conf-0-Werte die Aussage „Gen aus"; **kein Kern-Gen kommt aus Stufe (d)**.
      Gate `node tools/impute-check.mjs` (I1–I4, nicht in package.json — braucht die
      Ernte-Artefakte).
- [x] **1.4** Katalog-Erzeugung (2026-08-01) — `stage:"full"`, 20.178 Arten, 40/65
      Bauplan-Gruppen belegt (nach Reich-Wächter-Fix aus 2.1, s. u. — vorher 37 mit
      34% Reich-Fehlklassifikation). Im Browser verifiziert: Fell-Genom zeigt „Capybara"
      statt „Fell-Großtier". Gate `npm run catalog-check` (gzip-Budget, korrigiert von
      Rohbyte- auf Gzip-Maß). Zwei gemessene Funde für Abschnitt 8: 96,6% Genom-Zwillinge
      (Empfehlung: founderSpreads() aus 4.1 wiederverwenden) und synchrones Laden statt
      Sharding.
- [x] **2.1** Lebensbaum-Referenz (2026-08-01) — `docs/tree-of-life.json` mit echten
      QIDs/Artenzahlen/Gegenprobe. **Deckte einen ernsten 1.4-Fehler auf: 34% der Arten
      im falschen REICH** (Reich-Wächter behoben Reich-Fehlklassifikation auf 0,00%,
      Katalog neu erzeugt).
- [ ] **2.2** Rarität zweistufig — bewusst zurückgestellt (96,6% Genom-Zwillinge machen
      einen Rang je Art aktuell irreführend, s. 1.4/2.2 im Plan).
- [x] **2.3** Chronik/Herausforderungen — faktisch durch den Regressions-Fix erledigt
      (6 Stellen liefen auf `.n` statt `.key`/`.form`, s. u.).
- [x] **2.4** Spielstands-Migration — bereits durch Schritt 0.1 abgedeckt.
- [x] **Regressions-Fix nach 1.4** (2026-08-01) — Sicherheits-Audit fand 5 echte Bugs,
      ein 6. beim Nachprüfen: `STABLE_GENS`-Gate, `challengeTick()`, `renderSpeciesEdge()`,
      `storyTick()`, `wowMine`/`challenge_results`, Ahnenlinie. Alle liefen auf dem jetzt
      oft realen Anzeigenamen `.n` statt dem stabilen `.key`/`.form`. Schwerster Fund: das
      Stabilitäts-Gate hätte bei Beinah-Gleichstand zwischen zwei realen Arten
      `STABLE_GENS` nie erreichen können — Genbuch-Funde hätten komplett einfrieren
      können. Direkt am Katalog bestätigt: drei Arten mit byte-identischem Genom in
      derselben Gruppe.
- [x] **3.1** Abdeckungs-Metrik (2026-08-01) — `npm run coverage-check` (neu, registriert:
      läuft nur auf eingecheckten Dateien). Sweep aus drei Schichten mit vorhandener
      Technik: 5^6-Regler-Gitter (wie `docs/rarity.json`) + 66 Einfluss-Faktoren × 15 Biome
      (sonst wären die 15 bedingten Gene per Konstruktion unerreichbar) + 192 Schwarm-Läufe
      auf `world/population.ts` (Cluster-Zentroide, wie `readSwarm()`) = **16.754 Endpunkte**.
      **Drei Lesarten statt einer**, damit die Zwillings-Decke aus 1.4 nicht als Engine-Lücke
      gelesen wird: **96,2 %** der 20.178 Arten liegen in einer erreichten Bauplan-Gruppe,
      **28,9 % an einem erreichten Genom-Punkt (die Abdeckungszahl)**, 0,55 % werden strikt
      benannt (= 15,9 % der 692 unterscheidbaren Punkte — mehr ist mit 96,6 % Zwillingen
      arithmetisch unmöglich). 59/65 Baupläne erreicht; kein Endpunkt jenseits
      `novelThreshold`. **Kernbefund: es ist keine Wertebereichs-, sondern eine
      Kombinations-Lücke** — nur 327 Arten verlangen einen nie erreichten Genwert — und sie
      liegt zu **71,7 % bei der PLATZIERUNG, nicht bei der Engine**: so viel des Verlusts
      steht auf Genen mit Konfidenz 1 (Geschwister-Median aus Stufe c), nur 18,1 % auf einer
      Kladen-Regel. Der Median erbt von jedem Geschwister dessen Spezialisierung und baut
      eine Durchschnittspflanze, die es nicht gibt. Nebenbefund: `docs/rarity.json` ist in
      11 von 43 Formen überholt.
- [x] **3.2** Lückenreport → Achsen-Vorschläge (2026-08-01) — `docs/coverage-report.md`:
      **sieben Vorschläge, keiner umgesetzt** (Struktur-Wachstum nur auf Bestätigung,
      `engine/fitness.ts`/`physics.json` unberührt). Drei ohne neues Gen — **V0**
      Imputation der bedingten Gene auf Mehrheitsregel statt Median (der größte und
      billigste Hebel, s. 71,7 % oben), **V1** Standort-Grundlast statt Einzel-Ereignis
      (heute setzen 33 von 66 Faktoren gar keinen, 26 genau einen Stressor — mehrere milde
      Dauer-Toleranzen sind strukturell unerreichbar), **V2** Filterapparat kostet
      Stromlinienform (im `fisch`-Bauplan gewinnt ein Punkt mit `filter` 0.86 gegen 1.637
      reale Fische mit 0.03). Vier neue Achsen — **AXIS-22** Poikilohydrie (`revive`,
      Laubmoose 0 %), **AXIS-23** Kriechsohle (`creep`, Ringelwürmer 0 %, `wurm` ist eine
      tote Form), **AXIS-24** Ruhephase/Ektothermie (`dormancy`, Reptilien 4 %),
      **AXIS-25** krautiger Wuchs (`resprout`, Blütenkraut-Bauplan unerreichbar).
      Ausdrücklich **nicht** gestützt von der Messung: Fortpflanzung, Sozialität,
      Wirt-Parasit; die Protisten (0 %) brauchen mehr Baupläne, keine Gen-Achse.
- [x] **4.1** Gründer-Los im Nullraum (2026-08-01) — `world/founder.ts`, einmal je
      Gründung gezogen, Radius je Gen **gemessen** statt geraten: der
      Neutralitäts-Wächter kürzt 23 von 25 Genen ein, bis ±Radius unter 0.5 % Fitness
      kostet (rein gewichtsbasiert hätte er in COLD 4.4 % gekostet). Wirkung:
      Kontingenz bei Generation 20 **0.0504 → 0.5487 (10.9×)**.
- [x] **4.2** Sperrklinke/Kanalisierung (2026-08-01) — historisch modulierte
      Mutations-Schrittweite (`memory 0.05 / onset 0.8 / floor 0.15`). Dollo-Rückkehr
      eines gesättigten Gens **27.0 → 35.8 Generationen (+32 %)** bei **unveränderter
      Ruhelage** (0.149 → 0.156) — verlangsamt, überstimmt die Selektion nicht. Die
      gerichtete Bauform wurde gebaut und **verworfen**: kein Arbeitsfenster, sie kippt
      von wirkungslos direkt auf P6 = 2.13 > „gar keine Selektion" (2.083).
      *Gate:* `npm run founder-check` (F1/F2/F3/D3/N0).
      **Befund:** dieser Nullraum ist ein Zustand auf Zeit (~70 Generationen), kein
      dauerhafter Freiheitsgrad — 0.5 % Fitness sind bei N=300 ein *N·s ≈ 1.5* und damit
      nicht neutral. Deshalb bleibt P6 bewusst bit-identisch (0.01955) statt mit
      Schätzerrauschen „gehoben" zu werden; Details in `docs/artenkatalog-plan.md`
      Phase 4. **Beide Mechanismen sind opt-in und in der Live-App weiterhin aus** —
      1.4 hat sie NICHT eingeschaltet (das war nie Teil von 1.4s Umfang, s. dort).
      Das Einschalten ist ein eigener, noch nicht terminierter Folgeschritt und verlangt
      den Orakel-Spiegel nachzuziehen.
- [ ] **5** Gemeinschafts-Schicht über Supabase (optional, erzwingt bezahlten Plan).
- [x] **6** Fantasiemodus-Umschalter (2026-08-03) — Details-Panel, `#fantasyModeBtn`,
      `localStorage("evolveFantasyMode")`. Aus (Standard): unverändertes Verhalten,
      Wesen entwickeln sich zu echten, Wikipedia-dokumentierten Arten (`nearestReal()`).
      An: `nearestReal()` wird übersprungen, der Anzeigename kommt stattdessen aus
      `generateFantasyName()` — einem Buchstaben-4-Gramm-Modell, trainiert auf den
      echten deutschen Trivialnamen desselben Katalogs (`catalog.js` `de`-Feld).
      Gegen drei Alternativen verglichen (Tracery-Grammatik, wortbasierte Markov-Kette,
      Präfix/Suffix-Splicing mit Trigramm+Neuheits-Filter in einem Fitness-Feedback-Loop);
      die einfache 4-Gramm-Kette auf dem rohen Korpus (Leer-/Bindestrich als echte
      Übergänge mittrainiert) klang im direkten Hörvergleich am besten. Bauplan-Zuordnung
      (`key`/`form`/Icon) bleibt vom Umschalter unberührt — nur der Anzeigename wechselt;
      dadurch bleiben Genbuch, Chronik, Herausforderungen und das Stabilitäts-Gate
      unverändert korrekt. Name ist deterministisch aus dem Genom (`fnv1a32`-Seed), kein
      Zufall außerhalb des Genoms. `tools/lib/app-core.mjs` fest auf `FANTASY_MODE=false`
      gesetzt (Node-Tooling will immer die echte Klassifizierung).

**Jeder Schritt hat ein `npm run …-check`** — die Prüfstands-Kultur gilt unverändert.

**Umgebungs-Befund (2026-08-01, erledigt):** Wikidata/Wikipedia waren aus der
Claude-Code-Umgebung zunächst **nicht erreichbar** (Netzwerk-Policy ließ nur
GitHub/npm/PyPI durch). Der Nutzer hat `wikidata.org`, `query.wikidata.org` und
`*.wikipedia.org` freigeschaltet — Phase 1 lief danach vollständig gegen das echte
Netz (s. 1.1–1.4 oben). `raw.githubusercontent.com` (für 1.1b) war schon vorher als
Trusted-Default nutzbar, keine weitere Freischaltung nötig.

### 13 · Kreatur-Rendering — Weg zu bespoke-naher visueller Qualität (2026-08-04, Nutzerauftrag „nicht zu konservativ")

**Modell:** je Phase einzeln vermerkt — grob **Opus** für die geschmacks-/architekturintensiven
Phasen 1–3+5 (neue visuelle Subsysteme, keine engen Spezifikationen), **Sonnet** für Phase 0
(Setup) und Phase 4 (mechanische Politur auf bereits gesetzter Richtung).

**Auslöser:** Nutzer zeigte ein KI-generiertes Sticker-Bild (Gecko, painterly Schattierung,
Einzelzehen, Ink-Kontur) und fragte nach Machbarkeit dieser Qualität für die Live-App. Recherche
(öffentliche Repos + Forschung, s. Chat-Verlauf dieser Session) ergab vier Lösungsrichtungen:
feste Teile-Bibliothek + Textur-Layer (No Man's Sky/Spore-Vorbild), Genom-als-Bildfunktion
(CPPN/Picbreeder/Petalz), Neural-Cellular-Automata-Mikrotextur, KI-Bildgenerierung mit
Konsistenz-Constraints (CharacterFactory/ControlNet+IPAdapter).

**Entscheidung gegen die Teile-Bibliothek als Hauptweg:** No Man's Sky/Spore sind der
industrielle Standard, aber eine feste Template-Bibliothek kappt genau die Eigenschaft, die
Evolve laut README auszeichnet — Vielfalt aus einem **kontinuierlichen** 25-Gen-Genom statt aus
einem endlichen Asset-Pool (schon ein grober 4-Stufen-Grid-Scan ergibt ~2400 Bauplan-
Beschreibungen). Stattdessen: prozedural bleiben, aber die drei Ebenen nachrüsten, die aktuell
fehlen — Anatomie/Schattierung, eine genomgesteuerte Musterschicht, Mikrotextur. KI-
Bildgenerierung kommt erst zuletzt, entkoppelt von der Live-Simulation.

- [x] **Phase 0 — Fundament — erledigt (2026-08-04).** Erfolgsmaßstab: Vorher/Nachher-
      Screenshot-Vergleich per Playwright-Harness (`genome`/`displayGenome`/`committedArch` direkt
      setzen statt UI-Klicks — der laufende `requestAnimationFrame`-Loop zeichnet dann von selbst
      mit den erzwungenen Werten; ein einmaliger `drawCreature()`-Aufruf reicht NICHT, der Loop
      überschreibt ihn sofort wieder). Direkt in `app/index.html` gearbeitet statt in `spike/`
      (Iteration lief per lokalem Server + Screenshot-Diff, nicht per Deploy — dieselbe
      Absicherung wie geplant, nur ohne separate Kopie).
      **Wichtiger Fund, der Phase 1 korrigiert:** `app/index.html` trägt eine explizite,
      bewusste Stil-Regel (Kommentar vor den SVG-Zeichnern): „nur Flächenfarben, keine
      Verläufe, kein Blur, kein Filter — Tiefe durch Schichtung + `flatStep()`-Helligkeitsstufen".
      Gradients/weicher Schlagschatten (wie ursprünglich hier notiert) würden also die
      bereits getroffene „Feldpost"-Siebdruck-Entscheidung (s. `docs/design-konzepte-feldpost.md`)
      unterlaufen. Phase 1 unten ist entsprechend umformuliert: Tiefe/Detail durch mehr
      **geschichtete flache Formen**, nicht durch Verläufe.
      **Modell:** Sonnet — eng umrissenes Setup, keine offene Design-Entscheidung.

- [x] **Phase 1 — Anatomie & Schichtung (prozedural, Feldpost-Regel bewusst eingehalten) —
      erster Schnitt erledigt (2026-08-04), Vierbeiner-Bauplan.** Umgesetzt für den geteilten
      Vierbeiner-Zeichner (`drawAnimalSvg`, betrifft alle 9 Kinds, die ihn nutzen: 🦊🐒🐺🐭🐻🦥🦎🦏🐢):
      **Zehen/Pfoten** — jedes Bein endet jetzt in einer Pfotenfläche + 3 einzeln sichtbaren
      Zehen-Strichen (vorher: Bein-Strich endete ohne Fuß). **Zweistufige Schwanz-Verjüngung**
      (🐺/🦎) — dieselbe Kurve per De-Casteljau bei t=0,5 exakt geteilt (keine Knick-Naht),
      Basis-Hälfte dicker Strich, Spitze dünner — „gestaffelt" statt Verlauf, passend zu
      `flatStep()`. **Bauch/Rücken-Schichtung** — hellere Bauch- und dunklere Rücken-Fläche
      als zwei zusätzliche `flatStep()`-Ellipsen über dem Körper (vorher: ein einzelner
      Flächenton für den ganzen Körper). **Iris-Ring** am Auge (`flatStep(dark,1)` zwischen
      Pupille und Umgebung) statt nur Pupille + Glanzpunkt.
      Reine Code-/Art-Direction-Arbeit, kein ML-Modell nötig.
      **Checkpoint:** `design-audit` (0 Kontrastverstöße, alle 12 Presets + Extremregler +
      alle Gen-Mutationsfälle fehlerfrei gezeichnet), `ui-calm-check`, `app-parity` (Abweichung
      weiter 0, reine Zeichenlogik unberührt von der Fitness), `exemplar-check` — alle grün.
      Zusätzlich per Screenshot-Harness stichprobenartig gegen 🦎🐺🐢🐻🦏 geprüft (keine Fehler,
      keine NaN-Geometrie).
      **Noch offen (nicht Teil dieses Schnitts):** die übrigen ~10 Archetypen mit eigenen
      Zeichnern (🐌🐙🐸🪱🐟🐜🦀🦋🐦🦇 + alle Pflanzen/Pilze/Mikroben/Protisten) tragen dieselbe
      Schichtungs-Idee noch nicht — gleiches Muster (Pfoten/Anhänge, gestaffelte Verjüngung,
      Bauch/Rücken- bzw. Ober-/Unterseiten-Schichtung), aber jeweils eigene Geometrie pro
      Zeichner, deshalb als Fortsetzung und nicht in einem Rutsch mitgemacht.
      **Modell:** Opus — geschmacksintensiv (Proportionen/Licht „richtig" aussehen lassen), großer
      Ermessensspielraum, kein enges Ticket.

      **Nachtrag — Gecko-Feinschliff (2026-08-05), Methodik für die restlichen Archetypen
      festgehalten:** Nutzer hat 🦎 über ~10 Feedback-Runden gegen ein eigenes Referenzbild
      (Linienzeichnung) durchkorrigiert (`kind==="🦎"`-Zweige in der geteilten
      Vierbeiner-Funktion, andere 8 Kinds unverändert). Ergebnis + Prinzipien, die auf die
      restlichen Archetypen übertragen werden sollen:
      - **`bezierRibbon(x0,y0,x1,y1,x2,y2,w0,w1)`** (neu, neben `arcPath`): tastet eine
        quadratische Bezierkurve ab, versetzt senkrecht zur Tangente um eine interpolierte
        Halbbreite — ergibt ein GEFÜLLTES, verjüngtes Band statt eines Strichs fester Breite.
        Genutzt für Schwanz UND Beine (Echsen-Beine sind dick, kein dünner Strich).
      - **Kopf als EINE durchgehende Silhouette**, nicht zwei überlappende Ellipsen (Kopf +
        Schnauze) — Letzteres liest als „Erdnuss", weil jede Form ihre eigene Tinten-Kontur
        bekommt. Teardrop-Pfad: rund am Hinterkopf, per kleinem Bogen (nicht spitzem Punkt!)
        zur Nase verjüngt — ein echter Punkt sieht „wie eine Spitzmaus" aus.
      - **Anhänge (Schwanz, Gliedmaßen), die anatomisch „Teil des Körpers" sind, brauchen
        dieselbe Körperfarbe** (`flatCol(body)`, nicht den dunkleren `dark`-Ton) — sonst liest
        das Stück als angesetztes Fremdteil statt als Fortsatz.
      - **Echte Tiefenstaffelung statt Z-Order-Zufall:** ein Vierbeiner hat in Seitenansicht
        3 Ebenen — fernes Bein → Körper → nahes Bein. Das ferne Bein wird VOR der
        Rumpf-Ellipse gezeichnet (landet dahinter, gedämpfte Farbe, kein Zehen-Detail, nur
        Andeutung), das nahe Bein ERST NACH Rumpf + Bauch/Rücken-Schichtung (liegt sichtbar
        VOR dem Körper, eigener Umriss überlappt die Körperkante direkt — kein Wulst- oder
        Versteck-Trick nötig). Nicht: alle Anhänge einheitlich vor oder hinter dem Körper.
      - **Seitliches Ausstellen (Sprawl) lässt sich in reiner Profilansicht NICHT über
        Vorne/Hinten-Versatz (Kopf-Schwanz-Achse) darstellen** — das liest zwangsläufig als
        Frontalansicht (zwei Beine, die symmetrisch auseinanderklappen). Tiefe/Sprawl kommt
        stattdessen aus der Dicke (bezierRibbon) und der 3-Ebenen-Staffelung, nicht aus
        horizontaler Spreizung.
      - **Bein-Ansatzpunkte clustern** (Schulter-/Hüftbereich, deutliche Lücke dazwischen),
        nicht gleichmäßig über die Rumpflänge verteilt — sonst „Vielbeiner"-Eindruck.
      - **Test-Harness-Fallstricke:** `running=false` VOR jeder Genom-Erzwingung setzen (der
        laufende `requestAnimationFrame`-Loop überschreibt sonst den erzwungenen Zustand
        innerhalb von Millisekunden mit der frei laufenden Simulation — führte zu einem
        kompletten Fehl-Screenshot, siehe Session-Verlauf). `time=0` fest übergeben (sonst
        zufällige Blink-/Wag-Animationsphase im Screenshot, z. B. Pupille mitten im
        Lidschlag). Genom-Gene, die Schwellenwert-Effekte auslösen (z. B. Biolumineszenz-Glow
        ab 0,4), explizit auf 0 setzen, nicht auf dem 0,5-Default belassen.
      - **Selbstabgleich-Workflow (Nutzer-Wunsch, gilt fortan Standard):** vor jeder
        Rückfrage an den Nutzer erst selbst gegen ein Referenzbild (Wikidata-Foto oder
        Nutzer-Skizze) abgleichen, konkrete Abweichungen benennen, DANN präsentieren — nicht
        nur „sieht gut aus?" fragen.
      **Nutzer-Auftrag (2026-08-05):** „jetzt ist es super, merke dir die Logik, lass es
      erstmal so" — 🦎 gilt als Referenz-Vorlage, weiter mit dem nächsten Archetyp.

- [ ] **Phase 2 — CPPN-Musterschicht (Kernstück der Empfehlung).** Ergänzt die bestehende
      `mix()`-Farblogik um ein Pigment-/Musterfeld (Streifen, Flecken, Verlauf) als Funktion
      körperlokaler Koordinaten. Löst das Kontinuitäts-Problem strukturell: kleine
      Genom-Distanz → automatisch kleine visuelle Distanz, ohne Zusatzlogik.
      **Wichtige Abgrenzung zum bestehenden `fnv1a32`-Seeding** (Fantasiename-Generator, Punkt
      6): dort ist Diskontinuität gewollt (Namen dürfen springen), hier NICHT — die Netzgewichte
      müssen eine **stetige** Funktion der Genwerte sein (z. B. Gene direkt/glatt kombiniert als
      Gewichte), ein Hash würde die Kontinuitäts-Eigenschaft sofort zerstören.
      Neuer Check: Mutations-Kontinuität messen (kleine Genom-Distanz → kleine Pixel-Distanz
      zwischen zwei gerenderten Mustern), analog zum bestehenden Parity-/Divergenz-Denken
      (`spectrum-check`).
      **Modell (Technik):** kein vortrainiertes Netz — ein winziges, selbst gebautes CPPN in
      TypeScript, feste Topologie (kein NEAT-Strukturwachstum nötig, da der Bauplan schon aus
      `development.ts` kommt), 2–3 versteckte Schichten, gemischte Aktivierungen (`sin`,
      `gaussian`, `tanh`), Gewichte glatt aus den 26 Genen abgeleitet. Vorbild: Picbreeder/
      Petalz-CPPN-Encoding, aber ohne deren interaktive Evolution — hier ersetzt das vorhandene
      Genom die Notwendigkeit, das Netz selbst zu evolvieren.
      **Modell (Umsetzung):** Opus — neues Subsystem, Architekturentscheidung, kein enges Ticket.

- [ ] **Phase 3 — NCA-Mikrotextur.** Für Materialgefühl (Schuppen-Rauheit, Fell-Flaum,
      Chitin-Glanz) je Bedeckungsart aus `development.ts`. Läuft als kleine Canvas-Textur
      (z. B. 64×64), auf die Körperform gemappt.
      **Modell (Technik):** Neural Cellular Automata nach Mordvintsev et al. („Self-Organising
      Textures"/DyNCA-Formulierung) — offline in Python trainiert (ein Modell je Bedeckungsart:
      Schuppe/Fell/Chitin/Rinde/…), Gewichte extrem kompakt (Forschung zeigt 68–588 Byte pro
      Textur), als JSON exportiert. **Strukturparallele zum bestehenden Projekt:** genau das
      Python-trainiert-JS/TS-läuft-Muster, das `training/` bereits für die Engine-Kalibrierung
      nutzt (`fitted-params.json`) — hier `training/` für Texturen statt Fitness. Laufzeit-
      Interpreter in reinem JS/Canvas (kein TensorFlow.js nötig bei dieser Modellgröße — passt zur
      Zero-Heavy-Dependency-Linie der App).
      Checkpoint: Frame-Zeit-Budget messen, Echtzeitziel darf nicht kippen.
      **Modell (Umsetzung):** Opus — neue ML-Trainingspipeline + Integrationsarchitektur.

- [ ] **Phase 4 — Licht-Kohärenz.** Einheitliche Lichtquelle/Randlicht über alle Archetypen,
      Habitat-Ambientfarbe reflektiert auf die Kreatur (Ansatz existiert konzeptionell schon in
      `mockup/visual.html`, „Bio-Kammer"). Mechanische Politur, sobald Phase 1 die Richtung
      gesetzt hat.
      **Modell:** Sonnet — Umsetzung einer bereits getroffenen Design-Entscheidung.

- [ ] **Phase 5 — KI-Trophäen-Porträt (optional, entkoppelt, eigenes Kostenbudget).** Nur für
      Meilenstein-/Teilen-Momente: einmalig generiertes, gecachtes Einzelbild — bewusst NICHT
      Teil der Live-Simulation, daher keine Echtzeit-/Konsistenz-über-Generationen-Anforderung.
      Das prozedural gerenderte SVG dient als Struktur-Kontrolle (Canny-Kantenbild) für Formtreue
      zum tatsächlichen Genom.
      **Modell (Technik):** FLUX.1 [dev] oder SDXL als Basismodell + ControlNet-Canny (Struktur
      aus dem SVG-Silhouette-Rendering) + optional IP-Adapter für einen über eine Abstammungslinie
      konsistenten „Artstil"/Palette. Hosted Inference (z. B. fal.ai/Replicate-artige API) statt
      Selbst-Hosting empfohlen — passt zur seltenen, gecachten Nutzung, kein GPU-Infra-Aufwand.
      **Achtung:** einziger Punkt in dieser Roadmap mit laufenden externen Kosten pro Bild —
      braucht vor Umsetzung explizite Nutzer-Freigabe (Budget/Anbieter), nicht impliziert durch
      „lege los".
      **Modell (Umsetzung):** Opus — Produkt-/Architekturentscheidung (Anbieterwahl,
      Prompt-/Konsistenz-Design, Kostenmodell).

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

### AXIS-25 · Krautiger Wuchs / Wiederaustrieb — 26. Gen `resprout` (2026-08-03)

Umsetzung des in `docs/coverage-report.md` (Abschnitt 3.2) vorgeschlagenen Vorschlags, nach
expliziter Nutzer-Zustimmung (Struktur-Wachstum erfordert laut README „Autonomie" ausdrückliche
Freigabe). Schliesst die Luecke zwischen der Gruenalgen/Moos-Ecke (`structure` ~0.09) und den
verholzten Attraktoren Strauch/Laubbaum (0.83/0.89), in der Bluetenkraut, Farn, Suessgraeser und
Korbbluetler zuvor unerreichbar lagen.

- **Formel** (`engine/fitness.ts` + `oracle/reference_model.py`, bit-identisch, `npm run parity`
  bestaetigt): `disturbance = max(fire, frost)`; `lightAccess += resproutReach*resprout*
  disturbance*(1-size)`; `energy *= (1 - resproutCost*resprout*disturbance)`;
  `regrowthSurvival = 1 - disturbance*(1-max(fireres,resprout))*resproutSeverity` als eigener
  `Math.pow(..., wResprout)`-Faktor. Alle drei Wirkungen sind an `disturbance` gekoppelt — ohne
  wiederkehrendes Feuer/Frost gibt es nichts wiederherzustellen.
- **Zwei echte Regressionen gefunden und behoben** (nicht durch Lesen des Vorschlags, sondern
  durch Vorher/Nachher-Messung gegen die bestehende Gate-Suite):
  1. Der urspruengliche Vorschlag koppelte `disturbance` auch an `predation` — brach
     `distribution-check` B4 (Raeuber/Beute-Biomasse 0.24 → 2.37), weil `predation` in dieser
     Physik bereits durch den endogenen Raeuber-Beute-Mechanismus (`world/coevolution.ts`,
     Rote Koenigin) belegt ist. Behoben: `disturbance` nutzt nur noch `fire`/`frost`.
  2. Ein zunaechst unbedingter `lightAccess`-Bonus (nicht an Stoerung gekoppelt) zog selbst
     ungekoppelte Kontroll-Populationen in `symbiosis-check` (matchAxis=size) messbar
     zueinander — behoben durch die `*disturbance`-Kopplung oben.
- **Ecology-check-Nachspiel:** nach dem Neu-Training (26. Gen, jetzt 29-dimensionaler
  GA-Suchraum) landete `Tier` bei 56.1 % (> 55 %-Schwelle C4) — nachweislich reines
  GA-Optimierungsrauschen (`resprout` ist im ecology-check-Gitter beweisbar wirkungslos, das
  Gitter setzt nie `fire`/`frost`). Ein erster Fix ueber `defenseFromMobility` wurde
  zurueckgenommen (mehr Kollateralschaden im Pop-Kern als Nutzen); stattdessen
  `training/fit.ts` `POP`/`GENS` 160→176 (derselbe Hebel wie beim Sprung von 12 auf
  28 Trainings-Dimensionen).
- **Archetyp-Werte** (`app/archetypes.js`, bluetenkraut/farn): da es fuer `resprout` keinen
  alten Kaskaden-Zweig gibt, aus dessen Geometrie sich ein Wert ableiten liesse, wurden sie
  direkt gemessen (Hill-Climb nur auf `resprout`, uebrige Gene fix, gemittelt ueber
  Feuer-Stoerungsgrade 0.2–1.0). `kraut` (der generische Auffang-Zweig der Pflanzen) bekommt
  BEWUSST **keinen** `resprout`-Wert — ein erster Versuch riss ihn (937 Arten) aus der
  Erreichbarkeit, weil kraut anders als bluetenkraut/farn keine neu erschlossene
  Stoerungs-Nische ist, sondern schon vorher generisch erreichbar war (s. u.).
- **Kladen-Regeln** (`tools/lib/clade-rules.mjs`): Poaceae (Suessgraeser) und Asteraceae
  (Korbbluetler) — die im Bericht genannten Zielgruppen — bekommen einen `resprout`-Wert.
- **Alle Pflicht-Gates gruen:** parity/app-parity (exakt), ecology-check, reality-check
  (21/21), mf-fidelity, distribution-check (4/4 B1-B4), symbiosis-check, coevolution-check
  (Red Queen 6.5x), phenomena-check (8/8), catalog-check (0 Zwillinge). Volle
  Herleitung/Messreihe: `physics.json`-Kommentar „Version 9".
- **Ehrlicher Befund zu `npm run coverage-check`** (das Diagnose-Werkzeug selbst, KEIN
  Pass/Fail-Gate — `kein process.exit(1)`, s. Kopfkommentar des Tools): ein direkter
  Vorher/Nachher-Vergleich des vollen Sweeps gegen den Commit vor AXIS-25 zeigt ein
  **gemischtes, nicht rein positives Bild** — anders als ein erster, zu optimistischer Blick
  auf den schnellen (`--quick`, groeberes Gitter) Sweep nahelegte:
  - Verbessert: `farn` (16 Arten) und `moos` (935 Arten) sind neu erreichbar (waren zuvor
    `engineGapGroups`).
  - Verschlechtert: `kraut` (937 Arten) ist neu **unerreichbar** geworden (vorher erreicht);
    `schnecke`/`beutetier` (412+122 Arten) verlieren ihre Erreichbarkeit ueber die
    Schwarm-Zensus-Schicht (Schicht C). Gesamt: `reachedGroups` 59→56, `speciesInReachedGroups`
    19.411→17.785.
  - **Ursache:** nachweislich NICHT die konkreten `resprout`-Werte in `app/archetypes.js`
    (ein gezielter Fix an `kraut`s Prototyp aenderte am Ergebnis nichts) und NICHT
    `predation`/Fraas (der isolierte A+B-Vergleich ohne Schwarm-Schicht zeigt dasselbe Bild).
    Die wahrscheinlichste Erklaerung: das 26. Gen verschiebt die deterministischen
    Konvergenz-Pfade des 5^6-Gitters und der Schwarm-Dynamik geringfuegig, wodurch manche
    Umwelt-Kombinationen jetzt in einem ANDEREN Archetyp-Becken landen als vorher — derselbe
    Effekt, der schon `ecology-check`s Tier-Anteil und eine `reality-check`-Regel-Schwelle
    minimal verschoben hat (dort durch Trainings-/Testumwelt-Nachjustierung behoben, hier
    NICHT weiter verfolgt).
  - **Bewusst nicht weiter gejagt:** die bisherigen Korrektur-Versuche (defenseFromMobility,
    Trainings-Budget, Archetyp-Werte) zeigten wiederholt, dass ein Fix an einer Stelle
    Kollateralschaden an einer anderen erzeugt (Whack-a-Mole). Da `coverage-check`
    ausdruecklich ein Diagnose-Werkzeug ohne Gate-Charakter ist und ALLE echten Pflicht-Gates
    gruen sind, bleibt dieser Nebenbefund hier dokumentiert statt kaschiert oder durch
    weitere Parameter-Jagd „repariert". Ein spaeterer, eigener Anlauf koennte das Kraut-Gen-
    Zusammenspiel gezielt untersuchen, ohne den engen Rahmen dieser AXIS-25-Aenderung zu
    sprengen.

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
- Realer Artenkatalog (Punkt 12): `docs/artenkatalog-plan.md` (maßgeblicher Plan),
  `docs/coverage-report.md` (Abdeckungs-Messung + Achsen-Vorschläge).
