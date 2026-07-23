# Backlog

**Stand:** 2026-07 · Live-App `app/index.html`, deployt via GitHub Pages von `main`.
Test-Validität **~86 %** (Ziel-Band 80–90 %), Parität exakt (~1e-16).
**41 benannte Lebensformen** über **5 Reiche** (Pflanzen/Tiere/Pilze/Mikroben/Protisten).

Zwei Validierungs-Ebenen (immer BEIDE prüfen):
- `npm run parity` — Engine ↔ Orakel (Dynamik-Treue).
- `npm run ecology` — Engine ↔ **Realität** (Struktur-Kriterien, `docs/biodiversity-reference.md`).

> ⚠️ Änderungen an `engine/fitness.ts` / `physics.json` verändern die Physik →
> **Orakel neu erzeugen + neu trainieren + `npm run parity` + `npm run ecology`** ist Pflicht,
> sonst bricht der Prüfstand. Alle drei Fitness-Kopien synchron halten (engine / oracle / app-inline).

---

## ✅ Erledigt

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

- **CLS-4-Rest · schmale Größenfenster**: einige seltene Formen (Nadelbaum, Blütenkraut,
  Hutpilz) hängen weiter an engen Klassifikations-Fenstern. Kein Attraktor-Problem mehr
  (BAL-5 hat die Mitte entzerrt) — eher eine `classify()`-Grenz-Feinjustierung, geringe Priorität.
- Optional: A4-Feinschliff (Ahnenlinie cloud-synchron via `ancestry`-Spalte; Inline-Namensfeld
  statt `prompt()`); B-Reste (Kontrast-Feintuning, autocomplete `new-password` bei Signup).

---

## ⬜ Offen — Große Brocken (je: neues Gen + Orakel-Spiegelung + Re-Validierung)

Der Möglichkeitsraum stößt an fehlende Achsen (jede braucht ein neues Gen):
- **AXIS-1 · Flug/Gleiten** (Gen „Flügelfläche"): belohnt bei hoher `foodHeight` + kleiner Größe
  → echter 3D-Nahrungsraum, Insektenflug, Segler.
- **AXIS-2 · Graben** (Gen „Grabklauen"): Flucht/Versteck bei Räuberdruck + Boden-Nahrung
  → Maulwurf, Wühlmaus.
- **AXIS-3 · Ernährungsmodus** (Filtrierer/Aasfresser/Parasit) statt binärer Photo-vs-Jagd-Gabel.
  *Teilweise angestoßen:* der Absorptions-Kanal + die sessilen Filtrierer (Koralle/Schwamm)
  decken „sessiles Fressen" konzeptionell ab — ein eigenes Gen dafür fehlt noch.
- **AXIS-4 · Aquatik/Habitat** (Land/Wasser/Tiefsee): Schwimmen, Stromlinienform, Kiemen,
  Biolumineszenz bei Licht 0 → Fisch/Wal/Qualle als echte Habitat-Nische (heute nur interpretiert).
- **AXIS-5 · Sinne/Tarnung/Gift/Biolumineszenz** — keine dieser Achsen existiert; „Tiefsee-Wesen"
  bleibt sonst ein generischer Klumpen.

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
