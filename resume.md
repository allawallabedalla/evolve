# Evolve — Projekt-Resume (Übergabe für neuen Chat)

Stand: 2026-07-23. Diese Datei bündelt den Kontext, damit ein neuer Chat ohne
langes Nachlesen weiterarbeiten kann. Details im Code + `BACKLOG.md`.

## 1. Was ist das
Ein **evolutionäres Tamagotchi** als Web-Spiel. Kernidee: Der Spieler steuert
**nie das Wesen direkt**, nur seine **Umwelt** (6 Regler). Das Wesen evolviert in
**echter, kontinuierlicher Zeit** über Generationen — auch offline weiter. Beim
Zurückkommen: „**Was ist passiert, während ich weg war?**" (Offline-Reveal).
Anreiz = **Neugier + Bindung**, KEIN Vollständigkeits-Zwang. Prozedural einzigartig,
geräteübergreifend mit Account.

## 2. Live & Repo
- **Live-App:** https://allawallabedalla.github.io/evolve/  (GitHub Pages)
- **Repo:** `allawallabedalla/evolve` (öffentlich)
- **Arbeits-Branch:** `claude/evolutionary-tamagotchi-game-hmcpby` — HIER entwickeln.
- **Deploy-Flow:** Pages deployt den Ordner **`app/`** von **`main`** via
  `.github/workflows/deploy-pages.yml`. Um live zu gehen: auf dem Feature-Branch
  committen+pushen → **PR nach `main` öffnen + mergen** (per GitHub-MCP
  `create_pull_request` + `merge_pull_request`). Merge löst den Deploy aus.
- **Deploy prüfen:** Aus der Sandbox ist `github.io` NICHT erreichbar (Proxy 000/403).
  Deploy-Erfolg über GitHub-MCP `actions_get`/`actions_list` (Workflow „Deploy App to
  GitHub Pages", Lauf auf `main` = success) verifizieren.

## 3. Architektur — „Zwei Motoren"
- **Schlanke Engine** (Produkt, TS in `engine/`): fitness, simulate (stepGeneration +
  runSimulation), classify (Archetyp), develop (Bauplan), report. Läuft im Browser.
- **Referenz-Orakel** (`oracle/`, Python): agentenbasiertes Populationsmodell = Ground
  Truth. Erzeugt Benchmark-Trajektorien. **WICHTIG:** Das Orakel teilt die *identische*
  Fitness-Funktion mit der Engine (nur die *Dynamik* unterscheidet sich). Die Validität misst
  also Dynamik-Treue, NICHT ob die Biologie stimmt — dafür braucht es einen separaten
  ökologischen Plausibilitäts-Check (siehe unten).
- **Trainings-Schleife** (`training/fit.ts`): genetischer Algorithmus fittet die Engine
  ans Orakel (Model Distillation). **Test-Validität ~86 %** (Ziel-Band 80–90 %,
  bewusst nicht 100 %). Auf zurückgehaltenen Szenarien gemessen (kein Overfitting).
- **Geteilte Physik:** `physics.json` (einzige Quelle der Wahrheit, von Engine UND
  Orakel gelesen). **Parität** TS↔Python exakt (`npm run parity`, ~1e-16).
- **Szenarien:** `scenarios.json` (train/test-Split).

### Modell
- **9 Gene:** insulation, size, limbLength, metabolism, armor, photosynthesis, mobility, structure,
  **wing** (Flügelfläche, AXIS-1). App genom-längen-robust (`NG`+`padGenome`, alte 8-Gen-Saves aufgefüllt).
- **6 Umwelt-Regler:** temperature, predation, foodAbundance, foodHeight, light, water.
- **Baum des Lebens — 5 Reiche** emergent aus den zwei Achsen Photosynthese × Mobilität
  (`exclusion`-Term erzwingt Spezialisierung):
  - autotroph+sessil → **Pflanzen** (Alge, Moos, Farn, Kraut, Blüte, Strauch, Laub-/Nadelbaum, Kaktus, Polster)
  - heterotroph+mobil → **Tiere** (Wurm, Fisch, Insekt, Krebs, Reptil, Vogel, Fell-/Großtiere, Koloss, Schildkröte …)
  - heterotroph+sessil → **Pilze** (Hutpilz, Baumpilz, Schimmel, Flechte, Hefe, Myzel, Zunderschwamm) — jetzt echter Fitness-Gipfel (Absorptions-Kanal, s.u.)
  - winzig+heterotroph → **Mikroben** (Bakterie, Archaee, Protist/Amöbe)
  - schwimmt+Photosynthese → **Protisten** (Euglenoid, Plankton)
  `classify()` in `app/index.html` mappt ~36 benannte Formen; jede hat eine eigene Silhouette
  (`drawPlant/drawAnimal/drawFungus/drawMicrobe/drawProtist`). **Erreichbarkeit verifiziert**:
  Sweep über 2000 Zufallsumwelten → Konvergenz erzeugt alle 5 Reiche + 28/36 Formen spontan
  (Rest über gezielte Biome/Regler). Reine Interpretation+Renderer → **Engine/Validität unberührt**.
- **DREI Energie-/Ernährungs-Kanäle** (physics.json v3):
  1. `energyPhoto` — Photosynthese (autotroph, sessil): braucht Licht+Wasser.
  2. `energyForage` — Nahrungssuche (heterotroph, mobil): ∝ Mobilität, braucht Futter.
  3. `energyAbsorb` — **Absorption/Zersetzung (heterotroph, SESSIL)** — NEU: belohnt niedrige
     Mobilität + Stoffwechsel (Enzyme) + Feuchte (`water`) + Substrat (`foodAbundance`),
     schließt Photo UND Mobilität aus. Params: `absorbYield 1.3, absorbBase 0.4,
     absorbMetabolism 0.85, absorbWaterFloor 0.3`; dazu `maintenanceQuad.mobility 0.20→0.25`
     (ungenutzte Mobilität wird teurer). **Warum:** vorher war JEDE Nahrung an Mobilität
     gekoppelt → sessile Heterotrophe (Pilze) hatten null Einkommen, obwohl real hoch erfolgreich.
- **BAL-5 · Panzer-Grenzkosten** (physics.json v3→v3.1): `maintenanceQuad.armor 0.15`. Zuvor
  war „gepanzert + mobil" ein fast universeller Gewinner — die drei Panzer-Formen = ~30 % aller
  Umwelten (derselbe Attraktor, nur nach Größe/Gliedmaßen getrennt). Mit Panzer-Grenzkosten
  maximiert sich Panzer nicht mehr gratis → Verteilung entzerrt (Formen-Gini 0,61→0,50, Panzer-Trio
  30 %→12 %), mittlere Umwelten bringen wieder Vielfalt; Reptil · Echse wieder Attraktor.
  Re-Validierung: Parität exakt, Validität 86,0 %, Ökologie C1–C6 ✓.
- **Pflanzen-Rezept:** viel Licht + viel Wasser + WENIG Nahrung; foodHeight steuert
  Kraut→Strauch→Baum.
- **Ökologischer Plausibilitäts-Check (NEUE Validierungs-Ebene, neben der Orakel-Validität):**
  Phänotyp-Fitness je Nische (`scratchpad/landscape.mjs`-Muster) — Pilz gewinnt die
  feucht/dunkel/sicher/nahrungsreiche Nische (0,83 > Tier 0,81), Pflanze die hell/mager-Nische,
  Tier die Räuber-Nische. Reich-Bilanz über 4096-Gitter: Tier 32 %, Mikrobe 39 %, Pilz 16 %,
  Protist 7 %, Pflanze 5 %; unter hohem Räuberdruck werden 45 % Tiere. So testen wir, ob das
  Modell mit der REALITÄT stimmt — nicht nur mit dem (gleich-fehlerhaften) Orakel.
- **Stochastik (Spiel-Modus):** `stepGeneration(..., randn)` mit `DRIFT_SCALE=0.03` →
  jedes Leben einzigartig, mittelwertfrei (ohne Seed deterministisch → Validität unberührt).

## 4. Zwei Deployables (WICHTIG: aktuell dupliziert)
- **`mockup/visual.html`** — Single-File-Artifact (nur localStorage, KEIN Supabase;
  Artifact-CSP blockt externe Aufrufe). War als claude.ai-Artifact veröffentlicht.
- **`app/index.html`** — die ECHTE App (Supabase-Auth + Cloud-Sync), deployt auf Pages.
  Enthält Engine+Renderer+A1-Logik inline (aus dem Mockup kopiert) PLUS Auth.
- ⚠️ **Beide teilen Engine/Renderer-Code als Kopie** → Änderungen am Renderer/Spiel
  müssen (falls beide aktuell bleiben sollen) in beiden gepflegt werden. **Live zählt
  `app/index.html`.** (Backlog: vereinheitlichen.)

## 5. Supabase
- **URL:** https://fysktruunypngghqdezy.supabase.co
- **Publishable Key (öffentlich, im Client ok):** `sb_publishable_ISQaEhpmcMGsfyABDWQMFA_thXfYlbf`
  (NIE service_role/DB-Passwort in Client/Repo.)
- **Schema:** `supabase/schema.sql` (Tabelle `creatures`, ein Wesen pro Nutzer, RLS:
  jeder nur sein eigenes; `last_seen` für Offline-Zeit). Wurde im SQL-Editor ausgeführt.
- **Auth:** E-Mail + Passwort (signUp/signInWithPassword). **Status: funktioniert** ✅
  (Login getestet, geräteübergreifend). Voraussetzung: **„Confirm email" = OFF**
  (Authentication → Providers → Email) — ist gesetzt. Passwort-Reset via
  `resetPasswordForEmail` eingebaut (braucht E-Mail-Zustellung — auf Gratis-Tarif
  unzuverlässig; später echter SMTP/Resend).
- **Falls je „Invalid login credentials":** Konto/Passwort matcht nicht oder Confirm-
  email wurde wieder aktiviert → „Konto erstellen" statt „Einloggen", oder frische E-Mail.

## 6. Erledigte Meilensteine
- Engine + Orakel + Training validiert (~86 %), Parität exakt.
- Reich-Gabelung, Archetypen, Bauplan-Schicht.
- Engine-Optimierungs-Pass (Thermal glatt `1-d²`, Pflanzen-Reich, Dominanz, tote Zone via `nutritionFloor`).
- Stochastische Individualität + kontinuierliche Zeit.
- Visueller Renderer (Canvas, prozedural).
- **A1** (lokal): Persistenz + Offline-Zeit-Reveal + Genbuch-Zähler.
- **A2** (Cloud): Supabase-Auth (E-Mail+Passwort) + Cloud-Persistenz + geräteübergreifend, auf Pages deployt.
- **Anzeige-Glättung** (gleitender Mittelwert `displayGenome`, kein Zappeln).
- **UX/Gamification-Audit** durchgeführt (Ergebnisse in `BACKLOG.md`), Quick-Wins live:
  Entdeckungs-Toast, lo/hi-Regler-Labels, „Neues Leben"-Rückfrage, Passwort-Reset, Auto-Login-Fallback.
- **Baum des Lebens (optische + taxonomische Vielfalt)** — `classify()` von ~14 auf ~36
  benannte Formen über **5 Reiche** erweitert (Pflanzen/Tiere/Pilze/Mikroben/Protisten);
  je eigene Silhouette (`drawPlant/drawAnimal/drawFungus/drawMicrobe/drawProtist`), stabile
  Individual-Färbung pro Leben (aus `lineageSeed`, kein Flackern). 3 neue Biome
  (🍄 Moderwald → Pilze, 🧫 Urtümpel → Mikroben, 🌊 Plankton-See → Protisten). Erreichbarkeit
  aller Reiche per Sweep verifiziert. **Nur in `app/index.html`** (mockup/ noch nicht nachgezogen).

   Vierbeiner-Silhouetten differenziert (`FORM`-Tabelle: bw/bh/legL je Archetyp — langer Wolf,
   flaches Reptil, aufrechter Vogel mit Flügel+Schwanzfedern, hoher Kletterer, bulliger Bär);
   4 Reich-Biome auf bestätigte Fitness-Attraktoren getunt (Moderwald→Pilz, Urtümpel→Bakterie,
   Plankton-See→Euglenoid, Algen-Riff→Grünalge).
- **Engine geschärft — Absorptions-Kanal (physics.json v2→v3, Meilenstein).** Diagnose: (1) Das
  Orakel ist KEIN unabhängiger Realitäts-Check — es teilt die identische Fitness mit der Engine,
  die 82 % maßen nur Dynamik-Treue. (2) Biologie-Fehler: `energyForage ∝ mobility` → sessile
  Heterotrophe (Pilze) hatten null Nahrungsenergie, obwohl real hoch erfolgreich → „wenn Mobilität
  immer zahlt, gäbe es keine Pilze". Fix: dritter Energiekanal `energyAbsorb` (Osmotrophie, sessil)
  in alle 3 Fitness-Kopien (engine/oracle/app) + physics.json. **Ergebnis:** Pilze sind jetzt echte
  Attraktoren (Landschaft: Pilz schlägt Tier in feucht/sicher/nahrungsreicher Nische), Validität
  82 %→86 %, Parität weiter exakt. Neue Validierungs-Ebene „ökologische Plausibilität" eingeführt
  (`scratchpad`-Probes: landscape/eco/balance). Übrige seltene Zwischennischen (Fisch, Wurm, Moos,
  Farn, Schimmel) bleiben Drift-Fänge fürs Genbuch.
- **Biodiversitäts-Referenz + Ökologie-Abgleich (Meilenstein).** Recherche „was hat die meisten
  Arten hervorgebracht?" → `docs/biodiversity-reference.md` (Käfer/Coleoptera artenreichste Gruppe;
  Tiere artenreichstes Reich nach *beschriebenen*, Pilze evtl. nach *geschätzten* Arten; Quellen).
  **Kernpunkt:** Artenzahl ≠ Biomasse ≠ Nischen-Besetzung — unsere Engine misst Nischen-Besetzung
  (~Ubiquität), NICHT Artenzahl (kein Speziations-Mechanismus). Daraus 6 falsifizierbare Kriterien
  (C1–C6) in `tools/ecology-check.mjs` (`npm run ecology`, auch Teil von `npm run all`). Aktueller
  Stand: alle 6 ✓ (Tier 38 %, Mikrobe 29 %, Pilz 22 %, Pflanze 7 %, Protist 4 %).

- **Genbuch begehbar — „Lebensbaum" (erledigt).** Zähler öffnet ein Overlay (`#genbook`),
  das die ~36 Formen nach Reich gruppiert zeigt: entdeckt = Emoji+Name+reale Klade leuchten,
  unentdeckt = „???" + reale Klade als lehrreicher Hinweis (Chlorophyta, Angiospermen, …).
  Pro-Reich-Fortschritt (z. B. Pilz 2/7), Neugier statt 100 %-Balken. Daten inline (`TREE`,
  Namen exakt = `classify().n`, gespiegelt aus `docs/tree-of-life.json`). Nur `app/index.html`.
- **Stabilität (erledigt).** (1) Unlock nur bei STABIL erreichter Art: `committedArch` mit
  Hysterese (`STABLE_GENS=15`) — Art/Zeichnung/Genbuch wechseln erst nach 15 stabilen
  Generationen (vorher unlockte jede kurz überstreifte Form). (2) Kein Flackern: Anzeige +
  Zeichnung nutzen `committedArch` statt `classify()` pro Frame; Form-Details aus `lineageSeed`
  (nicht driftendes Genom); framerate-unabhängiges Glätten (τ≈0,6 s); `DRIFT_SCALE` 0,03→0,02.
  Merksatz: Mitteln glättet die *Gene*, nicht die *Kategorie* — harte `classify()`-Schwellen
  brauchen Hysterese.
- **Flaches monochromes Icon-System (erledigt).** Alle bunten Emoji durch Inline-SVG ersetzt
  (`ICONS`-Dict + `ic()`/`formIcon()`, erben `currentColor`): 6 Regler, 10 Biome, Steuerung
  (Play/Pause/Ei/DNA), alle 36 Archetyp-Symbole (`FICON`-Map). Karte/Toast/Reveal/Genbuch
  nutzen `formIcon(name)`. Die `e:`-Emoji in `classify()`/`TREE` sind nur noch interne
  Dispatch-/Datenschlüssel (nicht sichtbar). Nur `app/index.html`.
- **Abdeckungs-Lücken geschlossen (erledigt).** 5 neue Formen → jetzt **41 Formen**: 🐌 Schnecke +
  🐙 Kopffüßer (Weichtiere), 🐸 Amphibie (Lurch), 🪸 Koralle + 🧽 Schwamm (SESSILE Tiere — tierisches
  Pendant zu Flechte/Pilz im heterotroph-sessilen Quadranten; `drawSessile` zeichnet sie am Boden).
  `classify()`, Renderer, Icons, `TREE`, `tree-of-life.json` erweitert. Sessile Tiere sind `k:"Tier"`,
  liegen aber im Pilz-Quadranten (Grenze: Koralle=Symbiose-Photo+Hartskelett, Schwamm=weich+groß+niedriger Metab).
- **Genbuch-Hover-Info (erledigt).** Jede Kachel: Tooltip mit `era` (Erdzeitalter „wann") + `evo`
  („wie entstanden"), Daten in `TREE`. Unentdeckt zeigt era+Teaser, entdeckt die volle Evo-Story
  (Discovery-Reward). Schwebender `#gbTip` (fixed, folgt Cursor) + `title`-Fallback (Touch/a11y).
- **Rarität / Entdeckungs-Tiefe (erledigt).** Je Form ein Seltenheits-Rang aus dem
  deterministischen Ökologie-Sweep (`docs/rarity.json`, 5⁶-Gitter, Konvergenz-Anteil →
  `haeufig/gelegentlich/selten/sehr-selten/legendaer`). 7 legendäre „Fänge" nur über Drift.
  App-inline: `RARITY`-Map + `RARITY_META` (Label/Farbe/Rang). Genbuch zeigt Badge + Farb-Ramp,
  seltene entdeckte Formen leuchten (Glow), Legende, „x/7 legendär"-Zähler, Hover-Rang; Toast
  hebt seltene/legendäre Funde hervor. **Leitplanke gehalten:** Rarität = Entdeckungs-Tiefe,
  keine Währung/kein Grind.
- **UX-Feinschliff-Bündel (erledigt).** Fast alle offenen Live-App-Backlog-Punkte abgearbeitet:
  A3 Vitalitätsanzeige (`fitness(g,env)`, live), A4 Bindung (Name + Ahnenlinie + Nachkomme),
  A5 Onboarding, A6 Reveal-Silhouette, B4 a11y (aria/Escape), B5 reduced-motion (Canvas),
  B6 Fußzeilen-Jargon → „ⓘ Über die Engine", B7 Sync-Status im Header, B9–B14 (Play-Label,
  Touch-Ziele, Login-Disabled, Copy), CLS-3 (Gen-Balken je Reich gedimmt). Backlog aktualisiert.
- **Engine-Pass BAL-5 (erledigt).** Panzer-Grenzkosten (`maintenanceQuad.armor`) entzerren die
  Formen-Verteilung: die drei Panzer-Formen von ~30 % → 12 % aller Umwelten, Mitte wieder vielfältig.
  Parität exakt, Validität 86,0 %, Ökologie C1–C6 ✓; `docs/rarity.json`+App-`RARITY` neu erzeugt.
- **AXIS-1 Flug (erledigt).** Neues Gen `wing` (9. Gen). Flug nur für leichte, aktive Körper;
  erschließt hohe Nahrung (`flightReach`) + modeste Flucht. 3 neue Formen (Fluginsekt 🦋, Vogel 🐦
  neu Flug-gated, Fledermaus 🦇) mit eigenen Silhouetten. Parität exakt, Validität 85,3 %, C1–C6 ✓.
  Muster für weitere Achsen: Gen in **alle 3 Fitness-Kopien** + physics.json + types.ts + fit.ts
  (NUM_GENES) + app (PHYS/PARAMS/classify/TREE/FICON/ICONS/mutedGenes/drawAnimal) → `npm run all`
  → parity → App-PARAMS syncen → Rarität neu → testen. *Nebeneffekt:* 14 legendäre Formen (extreme
  + Wasser-Formen); AXIS-4 (Aquatik) holt die Wasser-Formen als Attraktoren zurück.

## 6a. Produkt-Pfeiler (Leitplanken)
- **Neugier + Bindung, KEIN Vollständigkeits-Zwang.**
- **Rarität = Entdeckungs-Tiefe**, keine kaufbare Währung / kein Grind.
- **Wertschätzung für die Natur als positives Neben-Ziel** *(Nutzer, 2026-07)* — **implizit**:
  über glaubwürdige Baupläne, echte Erdzeit-Reihenfolge, reale Klade-Namen soll Staunen über
  die Vielfalt des Lebens mitschwingen, ohne belehrenden Ton. Prüf-Frage für neue Features:
  *Weckt es Staunen, oder nur Sammel-Druck?*

## 6b. v2-Umbau — lebende Metapopulation (Fundament steht, headless)

Großer Umbau Richtung **emergente Vielfalt** (Vision: viele Orte, Isolation +
Katastrophen als Regler, Baum des Lebens entsteht von selbst). Kern-Prinzip:
**Emergenz statt Autorenschaft** — Arten = Cluster in einer Population, nicht
`classify()`-Schwellen. Beweis: `spike/FINDINGS.md`. Plan: `docs/rebuild-roadmap.md`
+ `docs/architecture-v2.md`. Faktoren-Katalog: `docs/faktoren-katalog.md`. IA:
„Veränderung"-Knopf (Zustand-Regler vs. Ereignis; Tun/Beobachten/Welt-Gesetze getrennt).

**Fundament fertig (Stufen 1–4), rein headless in `world/` — Live-App UNBERÜHRT:**
- `world/population.ts` — agentenbasierte Population (Orakel-Port). `npm run pop-check` (|TS−Orakel|=0,013).
- `world/cluster.ts` — emergente Arten (modes1D/clusters). `npm run branching-check` (Frequenzabh.→Branching).
- `world/world.ts` — Metapopulation: Orte, Migration, Founder, Katastrophe, `triggerEvent`. `npm run world-check`.
- `world/describe.ts` — prozedurale (emergente) Art-Benennung aus dem Genom.
- `cli/world-demo.ts` — `npm run world-demo`. `tools/world-ecology-check.mjs` — Makro-Realitäts-Check (Arten-Areal etc.).

**Stufen 5–7 (Prototyp) fertig, weiterhin headless:** 5 Räuber-Beute-Koevolution
(`world/coevolution.ts`, Red Queen, `npm run coevolution-check`) · 6 Arten-Zensus
(`world/census.ts`, prozedural benannt, `npm run census-check`) + emergente Rarität
(`world/rarity.ts`, Seltenheit als Landschafts-Eigenschaft, `npm run rarity-check`) ·
7 Standalone-Viewer (`world/viewer.html`). Getunte v2-Landschaft `world/physics-v2.json`
(Größen-Kosten 0,14 → reichere Formen; Live-`physics.json` unberührt).

**Pfad A Schritt 1 — JETZT LIVE (Beta):** Der v2-Kern läuft additiv IN der
ausgelieferten App als Overlay „🌍 Lebende Welt (Beta)" (Knopf neben Genbuch):
rauszoomen = Baum des Lebens (Orte, Chronik + Rarität, Veränderung-Hebel),
reinzoomen = das bestehende Einzel-Wesen (byte-identisch unberührt). Kern gebündelt
unter `app/core/` (`npm run bundle-app`; Pages liefert nur `app/`). Eigenes
`<script type=module>`, per try/catch entkoppelt. `npm run app-world-smoke` (Playwright).
**Pfad A ausgebaut (v0.8–v0.14, alle LIVE) + AXIS-4 Engine-Fix (v0.9):**
- **AXIS-4 Aquatik (v0.9, physics.json v5):** vierter Energieweg „aquatische Jagd"
  (schwimmende Heterotrophie: braucht keine Reichweite, belohnt Mobilität + Stromlinien-
  form, nur in tiefem Wasser). Behebt „nie einen Fisch" (Audit: Fisch 0→3,8 %). Gespiegelt
  in engine/fitness.ts + Orakel + App-Inline; `parity` exakt, `ecology` C1–C6 grün. Neues
  App-Biom „Offenes Meer". Diagnose-Tool: `tools/divergence-audit.mjs`.
- **Lebende Welt (Overlay) ist jetzt reich:** dein Wesen = Ort 0 („Dein Wesen", DU-Badge,
  aus echtem Genom, `Population.seedFrom`/`seed-check`) · flache Creature-Silhouetten je Ort
  + Wikipedia-„≈ in echt"-Links (auch neben dem Namen in der Hauptansicht; `app/exemplar.js`,
  `exemplar-check`) · **autonome Ereignisse** (Vulkan/Meteor/Dürre/Flut/Kälte/Blüte) mit
  Ereignis-Ticker + Aufblitzen · **prozedurale Orte** (Geografie×Klima×Isolation, „neue Welt"
  würfelbar) · **mehrstufige Veränderung** (Knöpfe + aufklappbare Detail-Regler) · Raum-Hebel
  „Insel/verbunden" mit sichtbarem Zustand · **echter Zoom** Pet↔Welt (Auf-/Zuzoomen) ·
  Aufwärm-Lauf (öffnet vielfältig). Habitat wird auf dem Hauptbild schematisch gezeichnet
  (Sonne/Wasser/Vegetation/Schnee). **Versionsnummer** im Footer (`APP_VERSION`, aktuell v0.14.0).
- Gemessen & verworfen: „Hysterese/Einrasten" beim Biom-Wechsel ist KEIN echtes Problem
  (Tier→Grünalge 12/12 bei genug Zeit) — nur langsame Umwandlung + Namens-Commit-Lag.

Offen (substanziell): genom-genaues Canvas-Rendering je Ort (statt flachem Icon — größerer
`drawCreature`-Umbau); tiefere Faktoren (über die 6 Umwelt-Regler hinaus, Richtung Katalog);
langfristig die inline-v1-Mean-Field-Engine durch den Populations-Kern ablösen.

## 7. Nächste Schritte (Priorität)
1. **AXIS-2..5** — weitere Gen-Achsen (Graben, Aquatik/Habitat, Ernährungsmodus, Sinne/Tarnung);
   je: neues Gen + Orakel-Spiegelung + Re-Validierung. **AXIS-1 (Flug) erledigt.** AXIS-4 (Aquatik)
   holt die Wasser-Formen (Fisch/Schnecke/Kopffüßer/Amphibie) aus drift-only zurück.
2. **`mockup/visual.html` nachziehen** (Renderer/classify dupliziert; live zählt `app/`) —
   oder Renderer/Taxonomie in eine geteilte Datei auslagern.
3. Reste: A4-Feinschliff (Ahnenlinie cloud-sync, Inline-Namensfeld), CLI-Bugs BUG-2/BUG-4/CLS-2.
   Volle Liste: `BACKLOG.md`.

## 8. Konventionen & Fallen (unbedingt beachten)
- **Nur auf dem Feature-Branch entwickeln**, Deploy via PR→merge nach `main`.
- **`app/index.html` braucht `<meta charset="utf-8">`** (sonst Mojibake beim Servieren).
- **Keine ASCII-`"` in JS-Strings mit typografischen „…"** — hat zweimal Syntaxfehler
  verursacht. Im Zweifel Anführungszeichen im String vermeiden.
- **Testen:** (a) Syntax des Inline-Skripts via `node -e "new Function(...)"`; (b) Browser
  via Playwright — Chromium unter `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
  `npm i playwright-core` temporär, danach wieder deinstallieren (Deps sauber halten).
  HTTP-Server: `python3 -m http.server PORT --directory app`.
- **Commits:** enden mit `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` und
  `Claude-Session: …`. Push mit Retry/Backoff.
- **Pipeline:** `npm run all` (build+oracle+train+**ecology**), `npm run parity`, `npm run ecology`,
  `npm run demo`, `npm run serve`. **Zwei Validierungs-Ebenen:** (1) `parity`+Orakel-Validität =
  Dynamik-Treue Engine↔Orakel; (2) `ecology` = Struktur-Treue Engine↔REALITÄT
  (`tools/ecology-check.mjs` vs `docs/biodiversity-reference.md`). Immer BEIDE prüfen — sonst
  optimiert man gegen ein Orakel, das denselben Biologie-Fehler teilt.

## 9. Dateibaum (Kurz)
```
physics.json, scenarios.json, fitted-params.json   # geteilte Physik/Szenarien/gefittete Params
engine/           schlanke Engine (TS)
oracle/           Orakel (Python) + benchmark/ + check_parity.py
training/fit.ts   GA-Training
cli/, tools/      Terminal-Demo, parity.mjs
mockup/visual.html   Artifact-Version (localStorage)
app/index.html       LIVE-App (Supabase) + app/vendor/supabase.js
supabase/schema.sql  DB-Schema
.github/workflows/deploy-pages.yml   Pages-Deploy
BACKLOG.md, docs/plan-A-lebender-begleiter.md
```
