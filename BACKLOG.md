# Backlog

**Stand:** 2026-07 · Live-App `app/index.html`, deployt via GitHub Pages von `main`.
Test-Validität **~85 %** (Ziel-Band 80–90 %), Parität exakt (~1e-16).
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

### 1 · 🔴 GitHub „Unverified"-Commits — Audit nötig, VOR jedem History-Rewrite

**Befund (2026-07-29), noch ungeklärt, absichtlich nicht eigenmächtig „gefixt":** der lokale
Stop-Hook (`~/.claude/stop-hook-git-check.sh`) meldet bei praktisch jeder Session-Aktivität
Commits als „GitHub wird das als Unverified zeigen" und schlägt automatisch
`commit --amend --reset-author` + `rebase` + Force-Push vor.

**Was bereits geprüft ist:**
- Die betroffenen Commits **haben** tatsächlich eine eingebettete SSH-Signatur
  (`git cat-file commit <hash>` zeigt einen vollständigen `gpgsig`-Block mit demselben
  Schlüssel wie `user.signingkey` in `~/.gitconfig`).
- `git log --format=%G?` zeigt trotzdem `N` — das liegt an einem lokal fehlenden
  `gpg.ssh.allowedSignersFile`; Git kann hier also gar nicht selbst verifizieren. Das `N`
  ist **kein Beweis dafür, dass die Signatur fehlt oder ungültig ist.**
- Das Muster ist **projektweit und sessionübergreifend**: Stichproben über die gesamte
  bisherige Historie (auch längst gemergte Commits verschiedenster früherer Sessions, z. B.
  `402d070`, `6b6173b`, `7b1f76e`) zeigen exakt dasselbe `N`. Es ist also kein Fehler dieser
  einen Session, sondern ein Bestandsproblem seit Projektbeginn.

**Warum hier NICHT einfach dem Hook-Vorschlag gefolgt wurde:**
1. Ein Fix betrifft zwangsläufig Commits anderer, teils parallel laufender Sessions
   (z. B. Redesign-Branch `claude/flat-vector-simulation-ui-kttqxx`) — Rewrite + Force-Push
   auf `main` würde deren Historie unter den Füßen verändern.
2. Da die Signaturen objektiv vorhanden sind, ist unklar, ob ein Amend das GitHub-Ergebnis
   überhaupt ändert — wahrscheinlicher liegt die Ursache **nicht** in Git selbst, sondern
   darin, dass der verwendete SSH-Signing-Key bei GitHub nicht (oder nicht für das richtige
   Konto) als Signing-Key hinterlegt ist. Falls das so ist, würde ein reines
   Kontoeinstellungs-Fix bei GitHub **rückwirkend alle** vorhandenen (bereits korrekt
   signierten) Commits als „Verified" zeigen lassen — **ohne jeden History-Rewrite und ohne
   Risiko.** Das wäre dem destruktiven Rebase-Weg klar vorzuziehen.
3. Ein Fix nur für die paar Commits der aktuellen Session würde das Problem ohnehin nicht
   lösen — die gesamte restliche Historie bliebe „Unverified".

**Nächster Schritt (gründlicher Audit, bevor irgendwas an Git-History angefasst wird):**
- Klären, welchem GitHub-Konto/-Signing-Key-Eintrag `user.signingkey`
  (`/home/claude/.ssh/commit_signing_key.pub`) zugeordnet sein soll, und ob dieser Key dort
  tatsächlich als SSH-Signing-Key hinterlegt ist (**Nutzer-/Admin-Aufgabe**, keine
  Git-Operation).
- Erst wenn das geklärt ist, entscheiden: entweder löst sich „Unverified" von selbst
  (Konto-Fix), oder es ist tatsächlich ein Rewrite nötig — dann aber koordiniert (alle
  laufenden Sessions/Branches informiert) statt spontan per Force-Push über `main`.
- Bis dahin: **kein `--amend`/`rebase`/Force-Push** wegen dieser Meldung, auch wenn der
  Stop-Hook das bei jeder Aktion erneut vorschlägt.

*(Blockiert nichts anderes hier — reine Meta-Aufgabe, aber recht billig zu klären.)*

### 2 · Engine-Grundlagenforschung: Determinismus/Vielfalt — blockiert Punkt 6

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

**→ Diese Recherche soll noch durchgeführt werden:**
**`docs/forschungsauftrag-naechste-engine.md`** enthält einen vollständigen, sofort
kopierbaren Forschungsauftrag für einen neutralen Chat (Divergenz-Phase ohne
Denkverbote → radikal unterschiedliche Modell-Paradigmen jenseits von
Populationsgenetik, dann Konvergenz an Browser-Performance/Erklärbarkeit/Erreichbarkeit
aller Archetypen), inkl. Modellwahl-Empfehlung (Opus 5 für die abwägungsintensive
Konvergenz- und Spezifikationsphase, Sonnet 5 reicht für die breite Ideensammlung in
der Divergenz-Phase). Ergebnis kommt danach zur Umsetzung zurück in dieses Repo — bis
dahin bleiben `engine/fitness.ts`, `physics.json` und `classify()` unverändert.

**Blockiert:** Punkt 6 (Rest-Achsen) — dort keine neuen Gene/Physik-Änderungen bauen, bevor
dieses Ergebnis vorliegt.

### 3 · Komplexitäts-Audit / Informationsarchitektur (2026-07-29)

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
  10-Versionen-NaN-Bugs, s. „Erledigt"). **Noch nicht umgesetzt** — Start ist
  Produktentscheidung des Nutzers.

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
- [ ] **Phase 3 — Kreatur-Silhouetten (offen, größter Rest-Brocken)**:
  `drawAnimal/drawPlant/drawFungus/drawMicrobe/drawProtist/drawSessile`
  (~800 Zeilen biologischer Sonderfälle: Biolumineszenz, Tarnung, Flugbauplan …)
  von Canvas-2D auf modulares SVG umbauen — Körperkern + austauschbare Anbauteile
  (Flossen, Membranen, Panzerplatten, Fühler) als eigene Elemente, Tiefe über
  Layering + Helligkeitsstufen statt Schlagschatten, EINE Akzentfarbe für das
  jeweils neu erworbene Modul (braucht neue Erkennungslogik: welches Modul ist
  seit der letzten committeten Form neu — baut auf der bestehenden Formkipp-
  Erkennung für die Chronik auf). Geplant: an einen Opus-Subagenten delegiert
  (geschmacksintensivster Teil), Sonnet bleibt Orchestrator/Integration.
- [ ] **Phase 4 — Restliche UI**: Genom-Balken, Vitalitätsanzeige, Chronik,
  Genbook, Baum-des-Lebens-SVG, Challenge-Liste auf dieselbe Palette + die
  Hell/Dunkel-Hierarchieregel übertragen (Werte/Regler/Buttons bleiben die
  einzigen hellen, hochkontrastigen Elemente).
- [ ] **Phase 5 — Audit**: WCAG-Kontrast erneut prüfen, `prefers-reduced-motion`
  erhalten, alle Biome/Extremregler/Mutationsfälle durchklicken.
- [ ] **Zwei kleine Politur-Punkte aus Phase 2**: Himmel wirkt bei mittlerem
  Licht etwas zu dunkel (Helligkeits-Kurve in `drawHabitat()` nachjustieren);
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

- [ ] **V1-Ausbaustufen** — feste Startwelt für alle, Bestenliste nach Generationenzahl,
  „Welt der Woche" mit Ergebnis-Vergleich. Brauchen einen Server/Vergleichsraum (Supabase
  steht bereits) — bewusst nicht Teil der Erstversion.
- [ ] **V2–V5** (`docs/bindung-konzept.md`) — Trägheit der Welt, Aussterben nur unter
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

- [ ] **Rest von AXIS-3 · Aasfresser/Parasit** — kein eigenes Gen bisher, geringe Priorität,
  nur falls ein konkreter Katalog-Faktor es rechtfertigt (Gefahr sonst: reine
  Muster-Wiederholung mit abnehmendem Grenznutzen, wie im Breiten-Ausbau dokumentiert).
  **Nicht anfassen, bevor Punkt 2 (Engine-Grundlagenforschung) abgeschlossen ist** — die
  hält `engine/fitness.ts`/`physics.json` bis dahin bewusst unverändert.

### 7 · Live-App — Feinschliff & Aufräumen (kleinere Reste)

- [ ] **CLS-4-Rest · schmale Größenfenster** — einige seltene Formen (Nadelbaum, Blütenkraut,
  Hutpilz) hängen weiter an engen Klassifikations-Fenstern. Kein Attraktor-Problem mehr
  (BAL-5 hat die Mitte entzerrt) — eher eine `classify()`-Grenz-Feinjustierung, geringe
  Priorität.
- [ ] **Lebensbaum-Lücke „Leuchtwesen · Tiefsee"** — die Form ist über `classify()` real
  erreichbar (Reich Tier) und wird von den Herausforderungen genutzt, fehlt aber im `TREE`
  (Genbuch) selbst, dadurch auch in `FORM_KINGDOM`. Für den Herausforderungen-Reich-Filter
  lokal in `app/index.html` überbrückt (`CHAL_KINGDOM_FALLBACK`); der eigentliche
  Lebensbaum-Eintrag (Ära/Evo-Notiz) fehlt weiterhin.
- [ ] **`docs/auslagerung/P5-ausgabe.json` aufräumen** — die ursprüngliche 28er-Lieferung (10
  davon nicht erreichbar) liegt noch auf `main`, ist durch P8 (271 Stück) ersetzt und nie ins
  Spiel verdrahtet worden. Sollte entfernt oder klar als „ersetzt durch P8" markiert werden.
- [ ] **P7 · Qualitäts-Audit** — zweiter Blick auf die bereits übernommenen P3-Erklärungen und
  S6-Erzähl-Bausteine (nur als Idee notiert, nie als Paket beauftragt oder gebaut).
- Optional: A4-Feinschliff (Ahnenlinie cloud-synchron via `ancestry`-Spalte — braucht
  Supabase-Schema; das In-App-Namensfeld ist bereits umgesetzt, kein `prompt()` mehr);
  B-Reste (Kontrast-Feintuning, autocomplete `new-password` bei Signup).

### 8 · Gamification-Feinschliff

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

- [ ] **Schritt 1 — `training/fit.ts` auf 25 Gene bringen**: `NUM_GENES` von `training/fit.ts`
  dynamisch aus `phys.traits.length` lesen (statt hart 9), `BOUNDS`/`responseRate` entsprechend
  auf 25 Einträge erweitern. Für die 15 bedingten Kosten-Gene (Stressor-Resistenzen/Nischen-
  Mechaniken) den bereits im Live-App-Mittelfeld validierten `mutationAnchor` (Kern-Gene 0–9
  neutral 0.5, restliche 15 niedrig 0.12 — s. „Mittelfeld-Fidelity-Fix v0.63.0" im Archiv) mit
  ausgeben, statt ihn ungeankert zu lassen. GA neu laufen lassen (`npm run train`),
  `fitted-params.json` neu erzeugen, alle 5 Gates (`pop-check`, `branching-check`,
  `world-check`, `parity`, `ecology`) + `ecology-full`/`reality`/`app-parity`/`mf-fidelity`
  gegenprüfen — `validityTest` sollte im 80–90 %-Band bleiben, sonst nachkalibrieren.
  `world/population.ts`s `numGenes: 9`-Default kann bei Gelegenheit trotzdem auf 25 gesetzt
  werden (Hygiene, kein funktionaler Effekt).
- [ ] **Schritt 2 — Schicht-A-Portfolio** bauen: die 8 Phänomen-Szenarien (P1–P8) als
  eigenständige, deterministische Tests mit Zielband — je Szenario mit einer Ablation, die
  beweisen muss, dass das Phänomen bei abgeschalteter Kraft verschwindet (emergent, nicht
  hineinprogrammiert).
- [ ] **Schritt 3** — Schicht B (Verteilungs-Fits) + Ausbau von `training/fit.ts` zum
  Drei-Schicht-Loop mit Champion-Persistenz + Multi-Schicht-Report + Regressions-Gate.

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
