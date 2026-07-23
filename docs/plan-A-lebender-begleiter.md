# Umsetzungs-Plan · Meilenstein A — „Der lebende Begleiter"

Geplant am 2026-07-23. Umsetzung startet ~4 h später (self-scheduled).
Ziel dieses Dokuments: Ich-in-4h kann direkt loslegen, ohne neu herzuleiten.

## Seele (warum, nicht nur was)

Der Anreiz des Spiels ist **Neugier + Bindung**, NICHT Vollständigkeit. Kern-Hook:
**„Was ist passiert, während ich weg war?"** — das lebende Wesen hat sich in echter
Zeit weiterentwickelt. Deshalb ist der **Rückkehr-Moment (Reveal)** das Herzstück von A,
nicht bloßes „Speichern". Das Genbuch ist die *Aufzeichnung* der Neugier (Landkarte
entdeckter Formen), keine abzuarbeitende Quote.

## Staging (in dieser Reihenfolge, jede Stufe testbar)

### A1 — Lokal (kein Backend). ZUERST. Beweist die Magie billig.
Alles im `mockup/visual.html` (bleibt eigenständig/Artifact-fähig).

1. **Persistenz** (`localStorage`, Key `evolve_save_v1`):
   speichere `{ genome, env, generation, lineageSeed, discovered[], ts:Date.now() }`.
   - Speicher-Kadenz: `setInterval(4000)` + `visibilitychange`(hidden) + `pagehide`.
   - Robuste Load: try/catch, Schema prüfen (`Array.isArray(genome)`), sonst `newLineage()`.
2. **Offline-Zeit-Nachsimulation** beim Laden:
   - `elapsed = Date.now() - saved.ts`.
   - `OFFLINE_MS_PER_GEN = 60000` (1 Gen/Min offline), `OFFLINE_CAP = 240`.
     → 1 h weg = 60 Gen (spürbar), ≥4 h = gedeckelt (adaptiert sich fertig, läuft nicht davon).
   - `offGens = clamp(floor(elapsed/OFFLINE_MS_PER_GEN), 0, OFFLINE_CAP)`.
   - rng aus `mulberry32((lineageSeed + generation) >>> 0)` rekonstruieren (Drift bleibt stochastisch).
   - `offGens`× `stepGeneration(genome, env, randn)`; `generation += offGens`.
3. **Reveal-Karte** („Willkommen zurück"): Overlay im Viewport, dismissbar.
   - Text: vergangene Zeit (h/min), Anzahl Generationen, Archetyp-Wechsel falls
     `before.name !== after.name` („Aus *X* wurde *Y*"), + Top-2/3 Gen-Deltas mit ↑/↓
     (Labels aus `GENE_LABELS`). Nur zeigen wenn `offGens > 0`.
4. **Genbuch-Grundstein**: `discovered = new Set()` (Spieler-Ebene, überlebt „Neues Leben").
   - In `updatePanels`: wenn `classify(genome).name` neu → hinzufügen, Zähler updaten, `saveState()`.
   - Kleiner Zähler in der Karte: „🧬 N Formen entdeckt". (Volle Genbuch-Ansicht = Meilenstein B.)
5. **Verdrahtung**: `newLineage()` behält `lineageSeed` global; `makeRandn()` faktorisieren
   (von newLineage UND restore genutzt). Boot-Reihenfolge: UI bauen → `maybeRestore()` →
   `updatePanels()` → Loop. „Neues Leben" speichert danach.

**A1-Abnahme (Playwright):**
- Laden, ein paar Sek spielen, `localStorage.evolve_save_v1` existiert & tickt.
- `ts` künstlich auf `now - 2h` setzen, reload → Reveal erscheint, Generation +~120,
  Genom hat sich bewegt, keine Konsolenfehler.
- „Neues Leben" → Generation 0, aber `discovered`-Zähler bleibt.

### A2 — Supabase (Account + geräteübergreifend). NACH A1.
- Supabase-Projekt: Auth (E-Mail-Magic-Link + optional Google/Apple).
- Tabelle `creatures`: user_id, genome, env, generation, lineage_seed, discovered,
  last_seen (timestamptz), name. RLS: nur eigener Nutzer.
- Client: bei Login Zustand laden → dieselbe Offline-Nachsimulation gegen `last_seen`.
- Konflikt/Multi-Device: „letzter Schreiber gewinnt" reicht für Single-Creature v1.
- **Entscheidung offen für später:** eigenständige App-Seite (Vite+TS) statt Single-File,
  sobald Auth dazukommt — der Single-File-Mockup bleibt die Sandbox ohne Login.

### A3 — Web-Push (optional, später). Nur wenn A1/A2 sitzen.
- PWA-Manifest + Service Worker; Benachrichtigung „deine Population steht unter Druck"
  / „eine neue Generationsschwelle erreicht". Als Feature, nie als Strafe.

## Bewusst NICHT in A
- Volle Genbuch-UI, Benennen, Ahnenlinien-Timeline, Herausforderungen → Meilenstein B.
- Neue Gene/Achsen (Flug/Aquatik…) → Meilenstein C.
- Art-Direction-Pass → Meilenstein D.

## Technische Notizen / Fallen
- Browser: `Date.now()` ist ok (nur in Workflow-Skripten verboten).
- rng-Kontinuität über Reload ist nicht kritisch (mittelwertfreie Drift) → Rekonstruktion
  aus `lineageSeed+generation` genügt; NICHT den rng-Zustand serialisieren.
- Reveal darf `updatePanels`/Loop nicht blockieren (reines Overlay).
- `visual.html` muss eigenständig bleiben (alles inline, CSP-fähig, Artifact-fähig).
- Nach A1: Playwright nur temporär installieren, danach wieder deinstallieren (Deps sauber).

## Definition of Done (A1)
Testbarer Artifact-Stand, in dem ein Wesen das Schließen/Neuladen überlebt, beim
Zurückkcommen die vergangene Zeit sichtbar nachsimuliert wird (Reveal), und entdeckte
Formen gezählt werden — committet, gepusht, Artifact aktualisiert (gleiche URL).
