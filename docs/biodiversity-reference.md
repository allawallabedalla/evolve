# Biodiversitäts-Referenz — „Was hat die meisten Arten hervorgebracht?"

Stand der Recherche: 2026-07. Diese Datei ist die **reale Ziel-Vorlage**, gegen
die wir die Evolutions-Engine regelmäßig abgleichen (`npm run ecology`, Skript
`tools/ecology-check.mjs`). Sie hält fest, was die Erdgeschichte real
hervorgebracht hat — UND die wichtige Einschränkung, *welche* dieser Zahlen
unsere Engine überhaupt abbilden kann.

## 1. Die kurze Antwort

- **Einzelne artenreichste Gruppe der Erde:** **Käfer (Coleoptera)** — rund
  **380 000–400 000 beschriebene Arten**, ~25 % aller bekannten Tierarten
  („jede vierte beschriebene Tierart ist ein Käfer"), ~40 % aller Insekten.
- **Artenreichstes Reich nach BESCHRIEBENEN Arten:** **Tiere (Animalia)** —
  getrieben von Insekten (~1 Mio beschrieben, geschätzt >5 Mio).
- **Möglicherweise artenreichstes Reich nach GESCHÄTZTER Gesamtzahl:** **Pilze**
  — 2,2–3,8 Mio Arten geschätzt, davon >92 % unbeschrieben
  (Hawksworth & Lücking 2017).

Merksatz (Haldane zugeschrieben): *„An inordinate fondness for beetles."*

## 2. Zahlen nach Reich

| Reich | Beschriebene Arten (grob) | Geschätzte Gesamtzahl |
|---|---|---|
| **Tiere** (Animalia) | ~1,0–1,5 Mio (Insekten ~1 Mio, davon Käfer ~380–400k) | ~7,8 Mio (Mora 2011) |
| **Pflanzen** (Plantae) | ~350 000–390 000 | ~300 000–400 000 |
| **Pilze** (Fungi) | ~150 000 | **2,2–3,8 Mio** (>92 % unbekannt) |
| **Protisten** | ~60 000–80 000 | einige 100 000 |
| **Bakterien + Archaeen** | ~15 000–20 000 gültig benannt | Millionen–? (Artbegriff unklar) |

Mora et al. (2011): ~8,7 Mio eukaryotische Arten (±1,3 Mio), davon zum
Zeitpunkt nur ~1,2 Mio katalogisiert. Prokaryoten wurden dort mit nur ~10 000
angesetzt — hoch umstritten, weil „Art" bei Bakterien schlecht definiert ist
(nach genetischer Vielfalt / Zellzahl wären Prokaryoten überwältigend).

## 3. WICHTIG: Drei verschiedene Maße — „deckt sich das mit der Engine?"

Kurz: **teils ja, aber nicht buchstäblich.** „Die meisten Arten" ist NICHT
dasselbe wie das, was unsere Engine ausgibt. Drei Achsen, drei Sieger:

| Maß | Realer Sieger | Bildet unsere Engine das ab? |
|---|---|---|
| **Artenzahl** (Speziation) | Tiere/Insekten (Käfer) | **Nein.** Kein Speziations-Mechanismus. |
| **Biomasse** | Pflanzen (~80 % an Land) | Teilweise (Photo-Nische). |
| **Individuen-/Zellzahl (Ubiquität)** | Bakterien (überwältigend) | **Ja** — das ist am nächsten dran. |

Unsere Engine misst **Nischen-Besetzung**: „Welche Umwelt → welcher gewinnende
Phänotyp?" (deterministisches `runSimulation`, Endzustand). Das ist am ehesten
das dritte Maß (**wo kann Leben bestehen / Ubiquität**), NICHT die Artenzahl.

**Warum die Engine die Artenzahl NICHT reproduziert:** Insekten haben so viele
Arten, weil sie Nischen extrem fein **unterteilen** (kleine Körper, kurze
Generationen, Wirtsspezifität, Koevolution mit Blütenpflanzen) — 8 Gene und
*eine* Linie pro Umwelt modellieren keine Aufspaltung in Arten. Die Engine sagt
also: „In Umwelt X gewinnt ein Tier-Bauplan" — nicht „…und daraus werden
400 000 Käferarten." Das wäre eine eigene, künftige Mechanik (adaptive
Radiation / Nischen-Unterteilung).

## 4. Ableitung: Woran wir die Engine WIRKLICH messen können

Nicht an exakten Artenzahlen, sondern an robusten, *falsifizierbaren* Struktur-
Aussagen, die aus der Realität folgen. `tools/ecology-check.mjs` prüft die
Reich-Anteile aus einem Umwelt-Sweep gegen diese Kriterien:

| # | Kriterium | Reale Begründung |
|---|---|---|
| C1 | **Alle 5 Reiche** kommen vor (Anteil > 0) | Alle existieren real. |
| C2 | **Heterotrophe** (Tier+Pilz+Mikrobe) ≥ 60 % | Die meisten Arten sind Heterotrophe; Autotrophe (Pflanzen) sind die Minderheit. |
| C3 | **Tiere** ≥ 15 % und unter den Top-2 Makro-Reichen (Tier/Pflanze/Pilz) | Tiere sind das artenreichste Reich (beschrieben). |
| C4 | **Kein Reich > 55 %** | Keine Monokultur — reale Vielfalt. |
| C5 | **Pilze** ≥ 5 % | Pilze sind ein riesiges, eigenständiges Reich (der Absorptions-Fix muss halten). |
| C6 | **Pflanzen** vorhanden, aber Minderheit (2–35 %) | Pflanzen ~18–22 % der beschriebenen Arten; wenige, aber reale Nischen. |

**Bewusste Abweichung (WARN, kein FAIL):** Nach *Artenzahl* müssten Tiere klar
führen. In der Engine liegen oft Mikroben vorn — das spiegelt **Ubiquität**
(Bakterien sind real allgegenwärtig), nicht Artenzahl. Solange Tiere Top-2 sind
(C3), ist das akzeptabel und ehrlich dokumentiert. Echte Arten-Dominanz der
Tiere bräuchte einen Speziations-/Radiations-Mechanismus (Backlog).

## 5. Quellen

- Hawksworth & Lücking (2017), *Fungal Diversity Revisited: 2.2 to 3.8 Million
  Species*, Microbiology Spectrum. https://journals.asm.org/doi/10.1128/microbiolspec.funk-0052-2016
- Mora et al. (2011), *How Many Species Are There on Earth and in the Ocean?*,
  PLOS Biology. https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1001127
- Stork (2018) / PNAS, *New approaches narrow global species estimates for
  beetles, insects, and terrestrial arthropods*. https://www.pnas.org/doi/10.1073/pnas.1502408112
- „Which group of animals has the most species?", Live Science.
  https://www.livescience.com/animals/which-group-of-animals-has-the-most-species
- BioNumbers BNID 113121, *Number of described species of beetles (Coleoptera,
  the most species-rich group of organisms on Earth)*.
  https://bionumbers.hms.harvard.edu/bionumber.aspx?id=113121
- „How many species are there on Earth? Progress and problems" (2023), PLOS
  Biology. https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3002388
