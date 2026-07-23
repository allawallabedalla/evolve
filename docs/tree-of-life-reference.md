# Lebensbaum-Referenz (Hauptäste) — Gerüst fürs Genbuch/Unlock

Stand: 2026-07. Begleittext zu **`docs/tree-of-life.json`** (die maschinen­lesbare
Datenquelle). Gefetcht via WebSearch — die OTOL-/GBIF-APIs sind im Sandbox-Netz
per Policy geblockt (403), also aus autoritativen Quellen zusammengetragen und
verifiziert. Ergänzt `docs/biodiversity-reference.md`.

## Wofür

Das reale Baum-Gerüst (Domäne → Reich → Stamm/Klasse) als **Rückgrat für die
Gamification**: Der Spieler schaltet beim Beobachten Äste frei, unsere ~36 Formen
hängen als Blätter am echten Baum. `tree-of-life.json` mappt jede Klade → unser
Reich, unsere Form(en), Artenzahl und Erreichbarkeit.

## Design-Leitplanken (wichtig, sonst Konflikt mit dem Pfeiler)

Der Ansatz „Lebensbaum freischalten" trägt — **aber**:
1. **Baum der Baupläne, keine Arten-Phylogenie.** Die Engine modelliert
   Nischen-Besetzung, nicht Speziation → wir schalten Formen frei, nicht Arten.
   Der Baum endet bei unseren ~36 Formen am realen Gerüst.
2. **Entdeckungs-Karte statt 100 %-Zwang** (Resume-Pfeiler: „Neugier + Bindung,
   KEIN Vollständigkeits-Zwang"). Unentdeckte Äste als „???" andeuten; die 8
   seltenen Drift-Formen sind besondere Fänge, keine Pflicht.

## Die Hauptäste (Kurzfassung; Zahlen = beschriebene Arten)

```
Leben
├─ Bacteria (Domäne)         ~15-20k benannt   → [Mikrobe] Bakterie          ★ real: Ubiquitäts-Sieger
├─ Archaea (Domäne)          ~1-2k             → [Mikrobe] Archaee
└─ Eukaryota
   ├─ Amoebozoa              ~2,4k             → [Mikrobe] Protist/Amöbe
   ├─ Discoba/Euglenozoa     ~2k               → [Protist] Euglenoid
   ├─ Rhizaria (Radiolaria)  ~10k              → [Protist] Plankton
   ├─ Plantae                ~350-390k
   │  ├─ Chlorophyta (Grünalgen) ~7k           → [Pflanze] Grünalge
   │  ├─ Bryophyta (Moose)       ~20k          → [Pflanze] Moos (drift)
   │  ├─ Farne                   ~12k          → [Pflanze] Farn (drift)
   │  ├─ Gymnospermae            ~1k           → [Pflanze] Nadelbaum
   │  └─ Angiospermae            ~300k         → [Pflanze] Kraut, Blüte, Strauch, Laubbaum, Kaktus, Polster
   ├─ Fungi                  ~150k besch. / 2,2-3,8 Mio geschätzt
   │  ├─ Ascomycota  ~90k                      → [Pilz] Hefe, Schimmel, Flechte
   │  └─ Basidiomycota ~50k                    → [Pilz] Hutpilz, Baumpilz, Zunderschwamm, Myzel
   └─ Animalia               ~1,0-1,5 Mio      ★ real: Arten-Sieger (beschrieben)
      ├─ Annelida            ~22k              → [Tier] Wurm (drift)
      ├─ Arthropoda          ~1,3 Mio (größter Stamm; Käfer ~380-400k = artenreichste Gruppe)
      │  ├─ Insecta          ~1 Mio            → [Tier] Insekt
      │  └─ Crustacea        ~67k              → [Tier] Krebstier
      └─ Chordata            ~60k
         ├─ Fische (Actinopterygii) >30k       → [Tier] Fisch (drift)
         ├─ Amphibia         ~9k               → (Lücke — keine Form)
         ├─ Reptilia         ~12k              → [Tier] Reptil, Schildkröte
         ├─ Aves             ~11k              → [Tier] Vogel
         └─ Mammalia         ~6,4k             → [Tier] Fell-Warmblüter, Fell-Großtier, Großjäger, Koloss, Kletterer, Maus
```

`reachable`-Feld in der JSON: **attractor** = stabiler Fitness-Gipfel (entsteht von
selbst), **drift** = nur über stochastische Drift transient (seltener Fang),
**none** = noch keine Form (Abdeckungs-Lücke).

## Abdeckungs-Lücken (Kandidaten für neue Formen)

- **Amphibien** (Wasser↔Land-Übergang) — kein eigener Bauplan.
- **Weichtiere** (Mollusca ~85k: Schnecken, Kopffüßer) — fehlt ganz.
- **Nesseltiere/Schwämme** (sessile Tiere) — fehlt; interessant, weil „sessiles Tier"
  eine eigene Nische ist (könnte den Absorptions-Kanal biologisch weiter schärfen).
- **Speziation/Radiation** — die reale Arten-Explosion (Käfer!) bräuchte einen
  Nischen-Unterteilungs-Mechanismus; aktuell bewusst nicht modelliert.

## Quellen

Siehe `docs/biodiversity-reference.md` §5 sowie: Reptile Database (2023, ~12k
Reptilien), Amphibian Species of the World (~9k), IOC/PLOS (Vögel ~11k),
Mammal Diversity Database (~6,4k Säuger), diverse Stamm-Übersichten
(Arthropoda ~1,3 Mio, Mollusca ~85k, Annelida ~22k, Chordata ~60k).
