# Backlog

**Stand:** 2026-07 · Live-App `app/index.html`, deployt via GitHub Pages von `main`.
Test-Validität **~85 %** (Ziel-Band 80–90 %), Parität exakt (~1e-16).
**43 benannte Lebensformen** über **5 Reiche** (Pflanzen/Tiere/Pilze/Mikroben/Protisten),
**9 Gene** (inkl. Flügelfläche / Flug, AXIS-1).

Zwei Validierungs-Ebenen (immer BEIDE prüfen):
- `npm run parity` — Engine ↔ Orakel (Dynamik-Treue).
- `npm run ecology` — Engine ↔ **Realität** (Struktur-Kriterien, `docs/biodiversity-reference.md`).

> ⚠️ Änderungen an `engine/fitness.ts` / `physics.json` verändern die Physik →
> **Orakel neu erzeugen + neu trainieren + `npm run parity` + `npm run ecology`** ist Pflicht,
> sonst bricht der Prüfstand. Alle drei Fitness-Kopien synchron halten (engine / oracle / app-inline).

---

## ✅ Erledigt

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

#### Offene Wünsche (Nutzer)
- **Wikipedia-Link spezifischer** *(Nutzer, 2026-07)* — das „≈ in echt"-Feature funktioniert
  gut; es soll aber möglichst **tief** verlinken (konkrete Art/Klade statt Oberbegriff),
  **so spezifisch wie für das Wesen sicher belegbar** — ohne Risiko von Falschanzeigen.
  D. h. nur weiter runter, wo die Zuordnung eindeutig ist; im Zweifel lieber die
  allgemeinere, sichere Ebene.

#### Bewusst zurückgestellt (Audit-Befunde, die eine gezielte Design-Runde brauchen)
- **Sympatrische Artbildung sichtbar machen:** empirisch geprüft — die aktuelle Dynamik
  erzeugt **unimodale** Innerorts-Populationen (bei Radius 0.18: 0 echte Sub-Cluster). Ein
  bloßes Absenken des Zensus-Radius zeigte nur Rauschen. Echte Aufspaltung bräuchte
  **stärkere disruptive Konkurrenz** — ein Dynamik-Umbau mit eigener pop-check-Wirkung
  (die „mittlere" Form wird bei Bimodalität bedeutungslos). Allopatrische Aufspaltung
  (Isolation → verschiedene Arten je Ort) funktioniert bereits und ist im Overlay sichtbar.
- **Kleiber-Allometrie (Stoffwechsel ∝ Masse^0.75):** geringe Anschaulichkeit für Laien,
  hohes Tuning-Risiko — später, wenn überhaupt.
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
  kaufbare Währung, kein Vollständigkeits-Zwang (Leitplanke gehalten).*

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

---

## ⬜ Offen — Live-App

Fast alle UX-/Gamification-Punkte **und** der Engine-Pass BAL-5 sind erledigt (s. „Erledigt").
Offen bleibt nur noch Feinschliff:

- **„Lebende Welt (Beta)"-Overlay — Nutzer-Feedback 2026-07 (Runde 1):**
  - [x] **Zappeln/Jitter**: das Modal sprang, weil (a) `place-items:center` + variable Kartenhöhe
    ständig neu zentrierte, (b) die Chronik jeden Step nach Häufigkeit umsortierte, (c) 9 Steps/s.
    → feste Kartenhöhe, stabile Chronik-Sortierung (nach Schlüssel), ruhiges Tempo (~2 Steps/s),
    interner Scroll statt Karten-Reflow.
  - [x] **Hintergrund-Zeit anhalten bei offenem Modal** (etabliertes Muster): Haupt-Sim pausiert,
    während das Welt-Overlay offen ist (`window.__mainSim.pause/resume`).
  - [x] **Bunte Emoji statt flacher Icons** (verstößt gegen die Icon-Policy, Zeile ~1968): alle
    Emoji im Overlay → flaches `ic()`-System (via `window.__ic`), inkl. neuer Icons globe/meteor/tune.
  - [x] **„verbinden/trennen" unverständlich**: erst entfernt, dann mit klarer Metapher zurück —
    „mit Nachbarn verbinden" / „als Insel abtrennen" je Ort, plus sichtbarer Zustand je Ort
    (⛰ Insel / 🔗 verbunden). Effekt (Angleichung vs. eigener Weg) ist jetzt live sichtbar.
  - [ ] **„→ in echt"-Link je Art (Wikipedia)** (Nutzer-Wunsch): zu jeder emergenten Art ein
    Link auf ein reales Vorbild, damit man sieht, wie so etwas in der Natur aussieht. Umsetzung:
    Mapping (Reich + dominantes Merkmal) → repräsentatives Vorbild + Wikipedia-URL; didaktischer
    Beistrich, nicht die Klassifikation selbst (Emergenz bleibt). Nächster Schritt nach der Politur.

- **CLS-4-Rest · schmale Größenfenster**: einige seltene Formen (Nadelbaum, Blütenkraut,
  Hutpilz) hängen weiter an engen Klassifikations-Fenstern. Kein Attraktor-Problem mehr
  (BAL-5 hat die Mitte entzerrt) — eher eine `classify()`-Grenz-Feinjustierung, geringe Priorität.
- Optional: A4-Feinschliff (Ahnenlinie cloud-synchron via `ancestry`-Spalte; Inline-Namensfeld
  statt `prompt()`); B-Reste (Kontrast-Feintuning, autocomplete `new-password` bei Signup).

---

## ⬜ Offen — Große Brocken (je: neues Gen + Orakel-Spiegelung + Re-Validierung)

Der Möglichkeitsraum stößt an fehlende Achsen (jede braucht ein neues Gen):
- ✅ **AXIS-1 · Flug/Gleiten** (Gen „Flügelfläche") — **erledigt** (s. o.).
- **AXIS-2 · Graben** (Gen „Grabklauen"): Flucht/Versteck bei Räuberdruck + Boden-Nahrung
  → Maulwurf, Wühlmaus.
- **AXIS-3 · Ernährungsmodus** (Filtrierer/Aasfresser/Parasit) statt binärer Photo-vs-Jagd-Gabel.
  *Teilweise angestoßen:* der Absorptions-Kanal + die sessilen Filtrierer (Koralle/Schwamm)
  decken „sessiles Fressen" konzeptionell ab — ein eigenes Gen dafür fehlt noch.
- [x] **AXIS-4 · Aquatik** — *erledigt (v0.9.0)*: vierter Energieweg „aquatische Jagd" in der
  Fitness (`physics.json` v5, gespiegelt in `engine/fitness.ts` + Orakel + App-Inline). Schwimmen
  belohnt Mobilität + Stromlinienform (Gliedmaßen/Panzer = Drag), nur in tiefem Wasser, heterotroph.
  Diagnose per `tools/divergence-audit.mjs`: vorher Fisch 0/500 (nur Drift), jetzt **Fisch 3,8 %**,
  aquatische Formen 12→32/500; Biom „Offenes Meer" liefert zuverlässig einen Fisch. `parity` exakt
  (1e-16), `ecology` C1–C6 grün. Kiemen/Biolumineszenz als eigene Gene bleiben offen (AXIS-5).
- [x] **AXIS-5 · Biolumineszenz** — *erledigt (v0.16.0)*: neues Gen `biolum` (10. Gen). Leuchten
  wirkt NUR im echten Dunkeln (`biolumDarkFloor` — unterhalb ~0,3 Licht): energyGlow (lockt Beute,
  wo Photosynthese tot ist) + Verteidigung (Gegenbeleuchtung), Kosten `maintenance.biolum`. Voller
  Pipeline-Durchlauf (physics.json v6 + engine + Orakel-`TRAITS` auf 10 + App-Inline + `responseRate[9]`),
  Form „Leuchtwesen · Tiefsee" (Anglerfisch/Qualle, jelly-Icon, Cyan-Glow in `drawCreature`), Biom
  „Leuchtende Tiefe". Validierung: `parity` exakt, `ecology` C1–C6 grün, `pop-check` 0,010; Sweep
  Leuchtwesen 14 % (nach Dark-Floor-Tuning von 43 %). Offen: Sinne/Tarnung/Gift als weitere Achsen.

---

## ⬜ Offen — nur Engine/CLI (Live-App nutzt eigenen Inline-Code, dort kein Problem)

- **BUG-2 ·** `explain.ts` `causeFor()` wählt Kausal-Texte an rohen Umwelt-Schwellen statt am
  echten Grund (Energie-Pfad-Verdrängung, realer `foodAbundance`/`water`) → widersprüchliche
  Erklärungen. Fix: Ursache aus `energyPhoto` vs. `energyForage` + realen Reglern ableiten.
- **BUG-4 ·** „asymmetrischsymmetrisch": `develop()` setzt `asymmetrisch`, `describeMorphology`
  hängt pauschal `symmetrisch` an. Quick-Win.
- **CLS-2 ·** Mischotroph-Bauplan zeigt keine Photosynthese-Flächen (altes `mockup/visual.html`).
- **mockup/ nachziehen**: Renderer/`classify` sind zwischen `app/` und `mockup/` dupliziert
  (live zählt `app/`) — nachziehen oder in eine geteilte Datei auslagern.

---

## 🧭 Produkt-Pfeiler (Leitplanken)

- **Neugier + Bindung, KEIN Vollständigkeits-Zwang** (Resume-Pfeiler).
- **Rarität = Entdeckungs-Tiefe**, keine kaufbare Währung / kein Grind (Skinner-Loop).
- **Wertschätzung für die Natur als positives Neben-Ziel** *(Nutzer, 2026-07)* — **implizit,
  nicht explizit**: über glaubwürdige Baupläne, echte Erdzeit-Reihenfolge (Hover „wann"),
  reale Klade-Namen und die Referenz-gestützte Ökologie soll ein Staunen über die Vielfalt
  des Lebens *mitschwingen* — ohne belehrenden Ton, ohne „Lern"-Overlay. Prüf-Frage für neue
  Features: *Weckt es Staunen, oder nur Sammel-Druck?* (Ersteres fördern, Letzteres meiden.)

## 💡 Gamification-Ideen (Diskussion)

### ✅ Entstehungswahrscheinlichkeit als Rarität — umgesetzt (s. „Erledigt")
Idee (Nutzer): seltene Arten spät, häufige früh. Umgesetzt als Entdeckungs-Tiefe über den
Ökologie-Sweep. Offen als Feinschliff: sanfte Biom-Empfehlungen („in diese Richtung wohnt
noch etwas Seltenes") statt harter Gates; Rarität optional auch in `tree-of-life.json` spiegeln.

---

## Referenzen

- Rohberichte Playtests: `playtest/` (3 Personas: neugieriger Laie, Ziel-Jäger, Grenzgänger).
- Plan Meilenstein A: `docs/plan-A-lebender-begleiter.md`.
- Projekt-Übergabe/Kontext: `resume.md`.
- Reale Vorlagen: `docs/biodiversity-reference.md`, `docs/tree-of-life-reference.md` + `.json`.
