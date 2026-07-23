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
  Truth. Erzeugt Benchmark-Trajektorien.
- **Trainings-Schleife** (`training/fit.ts`): genetischer Algorithmus fittet die Engine
  ans Orakel (Model Distillation). **Test-Validität ~82 %** (Ziel-Band 80–90 %,
  bewusst nicht 100 %). Auf zurückgehaltenen Szenarien gemessen (kein Overfitting).
- **Geteilte Physik:** `physics.json` (einzige Quelle der Wahrheit, von Engine UND
  Orakel gelesen). **Parität** TS↔Python exakt (`npm run parity`, ~1e-16).
- **Szenarien:** `scenarios.json` (train/test-Split).

### Modell
- **8 Gene:** insulation, size, limbLength, metabolism, armor, photosynthesis, mobility, structure.
- **6 Umwelt-Regler:** temperature, predation, foodAbundance, foodHeight, light, water.
- **Baum des Lebens — 5 Reiche** emergent aus den zwei Achsen Photosynthese × Mobilität
  (`exclusion`-Term erzwingt Spezialisierung):
  - autotroph+sessil → **Pflanzen** (Alge, Moos, Farn, Kraut, Blüte, Strauch, Laub-/Nadelbaum, Kaktus, Polster)
  - heterotroph+mobil → **Tiere** (Wurm, Fisch, Insekt, Krebs, Reptil, Vogel, Fell-/Großtiere, Koloss, Schildkröte …)
  - heterotroph+sessil → **Pilze** (Hutpilz, Baumpilz, Schimmel, Flechte, Hefe, Myzel, Zunderschwamm) — der vorher ungenutzte Quadrant
  - winzig+heterotroph → **Mikroben** (Bakterie, Archaee, Protist/Amöbe)
  - schwimmt+Photosynthese → **Protisten** (Euglenoid, Plankton)
  `classify()` in `app/index.html` mappt ~36 benannte Formen; jede hat eine eigene Silhouette
  (`drawPlant/drawAnimal/drawFungus/drawMicrobe/drawProtist`). **Erreichbarkeit verifiziert**:
  Sweep über 2000 Zufallsumwelten → Konvergenz erzeugt alle 5 Reiche + 28/36 Formen spontan
  (Rest über gezielte Biome/Regler). Reine Interpretation+Renderer → **Engine/Validität unberührt**.
- **Pflanzen-Rezept:** viel Licht + viel Wasser + WENIG Nahrung; foodHeight steuert
  Kraut→Strauch→Baum.
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
- Engine + Orakel + Training validiert (~82 %), Parität exakt.
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
- **Modell-Erkenntnis:** 28 der 36 Formen sind stabile Fitness-Attraktoren; die 8 Zwischennischen
  (Fisch, Wurm, Hutpilz, Baumpilz, Schimmel, Hefe, Moos, Farn) haben KEINEN festen Gipfel, werden
  aber im Spiel-Modus durch die stochastische Drift (`randn`) transient erreicht → Genbuch-Fänge.
  Ursache: `energyForage ∝ mobility` → Heterotrophe steigern Mobilität immer, außer Nahrung ist knapp
  (dann Pilz/sessil). Große Pilze bräuchten viel Nahrung UND wenig Nahrung → Widerspruch.

## 7. Nächste Schritte (Priorität)
1. **`mockup/visual.html` nachziehen** (Renderer/classify dupliziert; live zählt `app/`) —
   oder Renderer/Taxonomie in eine geteilte Datei auslagern (Backlog: vereinheitlichen).
2. **A1 Genbuch begehbar** (Kachel-Galerie aller ~36 Formen, entdeckt/„???"; die 8 seltenen
   Zwischennischen als besondere „Fänge" hervorheben).
3. **A3 Vitalitäts-Anzeige** (aus `fitness(genome,env)`) → Ursache→Wirkung sofort spürbar.
4. **A4 Bindung** (Name, Ahnenlinie/Historie; „Neues Leben" als Nachkomme).
5. Weitere Audit-Punkte (a11y B4, reduced-motion Canvas B5, Fußzeilen-Copy B6, Sync-Tag B7).
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
- **Pipeline:** `npm run all` (build+oracle+train), `npm run parity`, `npm run demo`, `npm run serve`.

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
