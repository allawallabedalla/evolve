# Backlog — aus Playtests

Konsolidiert aus 3 unabhängigen Spieltest-Personas (~95 Läufe zusammen):
neugieriger Laie, Ziel-Jäger, Grenzgänger. Rohberichte unter `playtest/`.
Priorität: **P0** = Korrektheit/Bug, **P1** = Kern-Erlebnis/Balance, **P2** = Ausbau.

> ⚠️ Querbezug Validität: Änderungen an `fitness.ts`/`physics.json` (z. B. BUG-1,
> BAL-1, BAL-2, BAL-3) verändern die Physik → **Orakel neu erzeugen + neu
> trainieren + `npm run parity`** ist Pflicht, sonst bricht der Prüfstand.

## ✅ Erledigt im Engine-Pass (nur Engine-Funde; UX bewusst offen)

- **BUG-1** Fell-Oszillation → thermal `1−d²` (glatt). *Nebeneffekt: Validität 80→84 %.*
- **BUG-3** Eingabe-Clamping/NaN-Schutz (freie Umwelt).
- **BAL-1** Pflanzen-Reich wiederhergestellt: Stützgewebe an vertikale Konkurrenz
  (`foodHeight`) gekoppelt + Pflanzengröße zahlt auf Photosynthese ein → **alle 5
  Pflanzen-Archetypen** wieder erreichbar (Kraut, Strauch, Baum, Kältepflanze, Kaktus).
- **BAL-2** tote Zone → `nutritionFloor` (Temperatur/Prädation wirken auch ohne Nahrung,
  ohne Gratis-Energie/Blob-Coasting).
- **BAL-3** Dominanz → steigende Grenzkosten für Stoffwechsel/Mobilität
  (90 %→33 % bzw. 95 %→62 %).
- **BAL-4** (teilweise) Knappheits-Mischotroph war eine *echte* Anpassung (Abstand 0.32
  vom Blob) → korrekt als **🫧 Zwerg-/Hungerform** benannt statt „Mischotroph".

Aktuelle Test-Validität **~82 %** (im Band), Parität exakt (~1e-16). **Offen:** BAL-5
(Verteilungsschiefe), tiefes BAL-4 (echte Mittel-Nische), alle AXIS-* und CLS-*, sowie
alle UX-Punkte (bewusst zurückgestellt).

## ✅ Erledigt im Spiel-Pass (Kern-Loop)

- **STOCH-1 "immer gleiches Ergebnis"** → kalibrierte stochastische Drift/Mutation pro
  Lebens-Seed (`stepGeneration`/`runSimulation(...,seed)`). Mittelwertfrei um das
  validierte Ergebnis (Determinismus ohne Seed bleibt → Validität unberührt). Starker
  Selektionsdruck hält den Grundtyp (lesbar), neutrale Merkmale + Kipppunkte variieren →
  jedes Wesen einzigartig, teils anderer Archetyp aus gleicher Umwelt.
- **TIME-1 kontinuierliche Zeit** → Mockup läuft jetzt als Dauer-Loop (`stepGeneration`
  pro Tick), Umwelt wird *live* zwischendurch verändert; das Wesen passt sich ab seinem
  aktuellen Zustand an (kein Neustart). Play/Pause, Tempo, „Neues Leben".

**Offen / gesammelt (neu):**
- **UX-PLANT** Pflanzen sind schwer zu finden — Rezept „viel Licht + Wasser + WENIG
  Nahrung" ist nicht ersichtlich. Später: sichtbare Hinweise / „Rezept"-Presets.
- **STOCH-2** Drift-Stärke als spürbaren „Mutationsraten"-Regler exponieren (optional).

## ✅ Erledigt: Meilenstein A1 (Lebender Begleiter — lokal)

Plan: `docs/plan-A-lebender-begleiter.md`. Alles in `mockup/visual.html`.
- **Persistenz** (`localStorage evolve_save_v1`): Genom/Umwelt/Generation/Seed/Genbuch +
  Zeitstempel. Kadenz 4 s + `visibilitychange` + `pagehide`.
- **Offline-Zeit-Nachsimulation**: beim Laden wird die vergangene reale Zeit simuliert
  (1 Gen/Min, Deckel 240) — das Wesen hat sich weiterentwickelt.
- **„Willkommen zurück"-Reveal**: zeigt vergangene Zeit, Generationen, Archetyp-Wechsel
  und Top-Gen-Deltas (↑/↓). Der Wiederkomm-Anreiz.
- **Genbuch-Grundstein**: entdeckte Formen werden gezählt (überlebt „Neues Leben").
- Bugfix: `.reveal[hidden]` (CSS `display:grid` schlug sonst das `hidden`-Attribut).
- Im echten Chromium getestet (frisch: kein Reveal; Rückkehr nach 2 h: Reveal + 120 Gen
  nachsimuliert; keine Konsolenfehler).

**Offen für A2/A3:** Supabase-Account + geräteübergreifend (A2), Web-Push (A3),
volle Genbuch-Ansicht + Benennen + Ahnenlinie (Meilenstein B).

---

## P0 — Bugs (Korrektheit)

### BUG-1 · Fell/Isolation oszilliert bei gemäßigter Temperatur (numerisch)
Bei `temperature ≈ 0.5` konvergiert Isolation nie, sondern pendelt dauerhaft
(~0.35 ↔ 0.61). End­wert, Ursache-Text **und** sichtbarer Bauplan (Fell vs. nackte
Haut) kippen mit der **Parität der Generationszahl**.
Repro: `demo.js "" 0.5 0 0.8 0 0.3 0.3 80` → Fell 0.55; `…81` → Fell 0.36.
Ursache: `thermal = 1 - |insulation - (1-temp)|` hat einen scharfen V-Peak; bei
temp≈0.5 liegt er mittig, die Schrittweite (~0.21) überschießt ihn jede Generation.
Die Varianz-Dämpfung ist bei x=0.5 maximal wirkungslos (`4·0.5·0.5 = 1`).
**Fix-Optionen:** `thermal` glätten (quadratisch `1-(insulation-ideal)²` → kein Knick)
*oder* Schrittweite nahe dem Peak adaptiv dämpfen *oder* `responseRate[insulation]`
senken. Danach Re-Validierung (Physik-Änderung!).
*Quelle: Grenzgänger.*

### BUG-2 · Kausal-Erklärungen widersprechen der Realität (ganze Klasse)
`causeFor()` in `explain.ts` wählt Texte an rohen Umwelt-Schwellen statt am
tatsächlichen Grund (Energie-Pfad-Verdrängung, realer `foodAbundance`/`water`).
Belegte Widersprüche:
- „reichliche Nahrung" als Grund bei **Hungersnot** (food 0.22).
- „bei knappem Futter" / „Nahrungsknappheit" bei **Überfluss** (food 1.0).
- „Photosynthese verdrängt Mobilität", obwohl Photosynthese mangels Wasser selbst
  kollabiert (`mobility`-Zweig ignoriert `water`).
- Wolf zeigt gleichzeitig „schwer erreichbar" (Gliedmaßen) und „erreichbar" (Mobilität).
**Fix:** Ursache aus `energyPhoto` vs. `energyForage` + realen Reglern ableiten
statt aus Textbausteinen. Behebt alle Fälle auf einen Schlag.
*Quelle: Grenzgänger (W1–W5), Laie.* (Teilweise schon angegangen, aber unvollständig.)

### BUG-3 · Keine Eingabe-Validierung (NaN / kein Clamping)
Ungültige Regler-Eingaben werden nicht geprüft: `Number("x")=NaN` propagiert →
„NaN Koerpersegment(e)"; Werte außerhalb 0..1 werden roh angezeigt („Temp 5.00",
„Temp -1.00" → trotzdem „kalt") statt geklemmt.
**Fix:** die 6 Umwelt-Regler auf 0..1 clampen, NaN abfangen, `gens` als Integer ≥ 0
prüfen — mit Hinweis statt stummer Verarbeitung.
*Quelle: Grenzgänger (BUG 2), Laie.*

### BUG-4 · „asymmetrischsymmetrisch" (String-Fehler)
`develop()` setzt für die Übergangsform `symmetry = "asymmetrisch"`,
`describeMorphology` hängt aber pauschal `"symmetrisch"` an. **Quick-Win.**
*Quelle: Grenzgänger (BUG 3), Laie.*

---

## P1 — Kern-Erlebnis & Balance

### BAL-1 · Pflanzen-Reich kollabiert auf einen Archetyp (höchste Design-Priorität)
Von 5 Pflanzen-Archetypen ist real nur **einer** erreichbar (🪴 Strauch). Ursachen:
- **Struktur an Lichtausbeute gekoppelt** (`lightAccess = 0.4 + 0.6·structure`) →
  Struktur saturiert *immer* >0.6, sobald Photosynthese lohnt (sogar bei Räuber 0).
  Kraut ☘️, Kältepflanze 🌿, Kaktus 🌵 (brauchen `structure<0.6`) sind eine
  übersprungene Messerschneide.
- **Baum 🌳 mathematisch unerreichbar:** Pflanzen-Größe bringt keinen Energievorteil,
  kostet aber am meisten Unterhalt → deckelt bei ~0.42 unter der 0.45-Schwelle.
- **Kaktus 🌵 blockiert:** Struktur ist der billigere Pflanzen-Verteidigungsweg, Panzer
  wird nie gewählt.
**Fix-Ideen:** Struktur von Lichtausbeute entkoppeln (separater Höhen-/Konkurrenz-
Beitrag); Pflanzen-Größe an einen Vorteil koppeln (Wasserspeicher/Blattfläche) oder
Baum-Schwelle senken; Trockenheits-Sukkulenz als eigener Kaktus-Anreiz.
*Quelle: Ziel-Jäger (Hauptbefund).*

### BAL-2 · Tote Zone: ohne Nahrung wirken 4 von 6 Reglern nicht
Ist `food+light+water` niedrig, kollabiert `nutrition` auf `floor` → flache
Landschaft → Temperatur & Prädation bewegen **nichts**. Ein heißer, räuberreicher,
nahrungsloser Planet entwickelt buchstäblich nichts. Nahrung/Licht/Wasser sind ein
„Master-Schalter"; die vier anderen Regler wirken ohne ihn kaputt.
**Fix-Idee:** Verhungern selbst als sichtbaren Druck modellieren, oder Restgradienten
erhalten (Thermal/Prädation auch bei niedriger Nutrition wirksam machen).
*Quelle: Grenzgänger (D1).*

### BAL-3 · Dominante Strategie: Mobilität & Stoffwechsel maxen fast immer
81er-Grid: Mobilität >0.85 in 93 %, Stoffwechsel >0.85 in 91 % der Läufe. Zwei der
acht Gene tragen kaum Variationsinformation.
**Fix-Idee:** Mobilität/Stoffwechsel entkoppeln oder mit steigenden Grenzkosten
versehen, damit sie nicht immer gemeinsam an die Decke laufen.
*Quelle: Grenzgänger (D2).*

### BAL-4 · Nur zwei echte Attraktoren; „Mischotroph" = „kein Druck"
`exclusion = 0.8` erzwingt eine scharfe Tier↔Pflanze-Gabelung. Die Übergangsform
erscheint praktisch nur ohne jeden Druck (0.5-Blob) — nie als *angepasste* Nische.
„Mischotroph" ist de facto Synonym für „untrainiert".
**Fix-Idee:** `exclusion` < 1 oder eine mittlere Mischnische aktiv belohnen
(z. B. Euglena-artiger Halbschatten-Mixotroph).
*Quelle: Grenzgänger (D3), Ziel-Jäger.*

### BAL-5 · Schiefe Verteilung & schmale Fenster
🐢 „Gepanzertes Beutetier" dominiert die mittleren Einstellungen stark; 🦎/🐒/🐭
hängen an messerscharfen Größenfenstern (Höhe 0.62→🐒 vs. 0.68→🦎). Gezieltes
Ansteuern fühlt sich nach Glück an.
**Fix-Idee:** weichere Übergänge / mehr Zwischen-Archetypen; Verteilung entzerren.
*Quelle: Laie, Ziel-Jäger.*

---

## P1 — Spielgefühl & Onboarding (macht es vom Werkzeug zum Spiel)

### UX-1 · Kein Einstieg
Ohne Argumente, bei `help` und sogar bei Tippfehler-Szenarien (`"Eiszet"`) startet
stumm immer „Eiszeit". Ein Laie erfährt nie, dass er selbst Regler eingeben darf.
**Fix:** Menü/Hilfe bei fehlenden Args (Szenarienliste + freie Syntax + Beispiel);
unbekannte Namen abfangen („Meintest du 'Eiszeit'?").
*Quelle: Laie.*

### UX-2 · Validitäts-Balken verwirrt (steht immer auf 80.0 %)
Alle drei Tester unabhängig: Der statische 80.0 %-Balken wird als **Bewertung des
eigenen Tieres** gelesen, das man nie verbessern kann — ist aber eine globale
Modell-Qualitätsnote aus `fitted-params.json`.
**Fix:** aus der Spieleransicht entfernen bzw. nur unter `--debug`; klar als globalen
Trainingswert labeln, nicht pro Lauf.
*Quelle: Laie, Grenzgänger (D4) — doppelt bestätigt.*

### UX-3 · Keine Bindung übers Wesen hinaus
Kein Name, keine Historie, kein Behalten/Vergleichen. „Ich mochte meinen Wolf — im
nächsten Befehl war er weg."
**Fix:** Wesen benennen, 2 Läufe nebeneinander vergleichen, Ahnenlinie speichern
(→ knüpft an die früher geplante Genbuch-/Bindungs-Mechanik an).
*Quelle: Laie.*

### UX-4 · Kipppunkte unsichtbar
Nahrung 0.55→🐭 vs. 0.60→🐢 kippt das ganze Wesen — ein toller Moment, über den man
nur zufällig stolpert.
**Fix:** nach dem Lauf einen Hinweis zeigen („Schon bei Nahrung 0.60 wäre es eine
Schildkröte geworden").
*Quelle: Laie.*

### UX-5 · Wort-Skala passt nicht zur Zahl
„Hitze" schon bei temp 0.6; „gemäßigt" trotz gegenteiliger Fell-Begründung.
**Fix:** Wortstufen an Schwellen koppeln (heiß erst ab ~0.75).
*Quelle: Laie, Grenzgänger (W5).*

### UX-6 · „Kaum Veränderung" ist ein Sackgassen-Ergebnis
Der 0.5-Blob wirkt wie ein kaputter Lauf.
**Fix:** Tipp statt Leere („Diese Umwelt ist zu ausgeglichen — dreh einen Regler
stärker auf").
*Quelle: Laie.*

### UX-7 · Regler schwer zu merken
Sieben Zahlen + Reihenfolge (Temp, Räuber, Nahrung, Höhe, Licht, Wasser, Gen) muss
man sich selbst merken.
**Fix:** benannte Flags oder eine Kurz-Legende vor jedem Lauf.
*Quelle: Laie.*

---

## P2 — Möglichkeitsraum erweitern (Vision „fast alles")

Der Ziel-Jäger konnte alle **7 Tier-Archetypen** treffen, stieß aber an fehlende
Achsen. Jede davon braucht ein neues Gen + Orakel-Spiegelung + Re-Validierung.

- **AXIS-1 · Flug/Gleiten** (Gen „Flügelfläche"): belohnt bei hoher `foodHeight` +
  geringer Größe → Vögel, Insektenflug, echte 3D-Nahrungsachse.
- **AXIS-2 · Graben** (Gen „Grabklauen"): Flucht/Versteck bei Räuberdruck +
  Boden-Nahrung → Maulwurf, Wühlmaus.
- **AXIS-3 · Ernährungsmodus** (Filtrierer/Aasfresser/Parasit) statt binärer
  Photo-vs-Jagd-Gabel; erlaubt echte **fleischfressende Pflanze**, wenn `exclusion`
  situativ (Nährstoffmangel) aufgehoben wird.
- **AXIS-4 · Aquatik/Habitat** (Land/Wasser/Tiefsee) mit Schwimmen, Stromlinienform,
  Kiemen, Biolumineszenz bei Licht 0 → Fisch, Wal, Qualle.
- **AXIS-5 · Sinne / Tarnung / Gift / Biolumineszenz** — heute gibt es keine dieser
  Achsen; das „Tiefsee-Wesen" wird nur ein generischer kleiner Fellklumpen.

---

## P2 — Klassifikation & Bauplan

- **CLS-1 · Fell-Riese/Eisbär-Ast:** riesige Fell-Tiere entstehen als *Bauplan*
  korrekt, bekommen aber immer das Label „Grossjäger/Koloss". Eigenen Ast
  `insul>0.6 & size>0.6` → „Fell-Riese". *(Ziel-Jäger)*
- **CLS-2 · Mischotroph-Bauplan:** zeigt nie Photosynthese-Flächen, obwohl „Energie:
  Mischotroph (beides)". Bei `photo>0.4` Blätter darstellen. *(Grenzgänger)*
- **CLS-3 · Pflanze zeigt irrelevanten Gliedmaßen-Balken** prominent (bedeutungslos
  für Sessile). Balken kontextabhängig filtern. *(Grenzgänger)*
- **CLS-4 · Größenfenster glätten** (siehe BAL-5). *(Ziel-Jäger)*

---

## Quick-Wins (klein, sofort, geringes Risiko)
BUG-4 (asymmetrischsymmetrisch), BUG-3 (Clamping/NaN), UX-1 (Hilfe/Menü),
UX-6 (Tipp statt Leere), CLS-3 (Balken filtern), CLS-1 (Fell-Riese-Ast).

## Größere Brocken (Physik + Re-Validierung nötig)
BUG-1 (Thermal glätten), BAL-1 (Pflanzen-Reich), BAL-2 (tote Zone),
BAL-3 (Mobilität/Stoffwechsel), BAL-4 (Mischnische), alle AXIS-*.
