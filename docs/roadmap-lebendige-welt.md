# Roadmap: vom Regler-Panel zur lebendigen Welt

Stand: 2026-07-30. Antwort auf „wie sähe der Zielzustand aus?" — Fortsetzung von
`docs/lebensbaum-luecken.md` (Formen-Lücken) und der water-Achsen-Analyse dort in §7.
Verankert in Entscheidungen, die im Projekt schon getroffen sind (BACKLOG.md „Breiten-Feld:
Phänotyp-Achsen ausgeschöpft", `docs/evolution-fidelity-loop.md` Schicht A/P1–P8) — diese
Roadmap erfindet keine neue Richtung, sie verbindet die Lebensbaum-Vollständigkeit mit dem,
was dort bereits als offene Front markiert ist.

## Zielzustand in einem Satz

Der Spieler wählt einen echten Ort (Medium + Habitat), die Welt trägt Zeit und mehrere
Arten gleichzeitig, und **jedes Gen, das die Selektion je hochziehen kann, hat einen Namen,
eine Herkunftsgeschichte und einen Weg dorthin** — ohne dass irgendetwas davon zur Pflicht
wird (Pfeiler: Neugier + Bindung, kein Vollständigkeits-Zwang, keine Gates).

Drei Dinge unterscheiden diesen Zielzustand vom heutigen Stand:
1. **Ein Ort ist ein Ort**, nicht sechs unabhängige Zahlen — Medium ehrlich getrennt, Habitat
   als Rahmen, der färbt statt sperrt.
2. **Eine Welt zeigt mehrere Arten gleichzeitig**, weil eine Population unter Druck in echte
   Nischen zerfällt — nicht weil ein Preset zufällig einen zweiten Slot hat.
3. **Formen entstehen aus Beziehungen**, nicht nur aus einem einzelnen Genom gegen ein
   Milieu — Wirt/Parasit, Symbiose, echter Jahreszeiten-Rhythmus.

## Die vier Ebenen des heutigen Systems (Referenzrahmen für die Phasen)

| Ebene | heute | Beispieldatei |
|---|---|---|
| **Physik** | Ein Genom gegen ein Milieu — Fitness-Formel | `physics.json`, `engine/fitness.ts` |
| **Population** | Viele Genome, Konkurrenz-Kernel, Cluster | `world/population.ts`, `world/cluster.ts` |
| **Welt** | Mehrere Orte, Koevolution, Katastrophen | `world/world.ts`, `world/coevolution.ts` |
| **Präsentation** | Benennung, Baum, Rarität, Geschichte | `app/archetypes.js`, `app/index.html` TREE |

Die bisherige Lücken-Analyse (Paket A/B/C) spielt komplett auf der **Präsentations-Ebene**:
Physik und Population bringen die Baupläne längst hervor, es fehlt nur der Name. Die vier
großen Phasen unten bewegen sich zunehmend nach links — jede bewegt echte neue Mechanik.

---

## Phase 0 — Fundament: die Medium-Achse entwirren

**Warum zuerst:** blockiert Phase 2 und 3 inhaltlich (ein ehrlicher Amphibien-Übergang und
ein Habitat-System brauchen eine widerspruchsfreie Achse darunter). Reine Physik-Korrektur,
kein neues Gen — verletzt die „Achsen ausgeschöpft"-Entscheidung nicht.

- `water` in **Medium** (diskret: Land / Wasser) + **Feuchte bzw. Tiefe** (stetig, innerhalb
  des Mediums) trennen. Renderer-Schwellen (0.34/0.6) und Physik-Schwellen
  (`aquaticWaterFloor` 0.5, `absorbWaterFloor` 0.3) synchronisieren.
- Bugfix `sense` (totes Gen — `senseForage` trägt die Wartungskosten nicht, s.
  `docs/lebensbaum-luecken.md` §2).
- Bugfix `defenseFromBurrow` (wirkt auch in sessilen Organismen — vor der Grabtier-Form
  aus Paket B fällig).
- Die 12 Presets gegen die neue Achse nachrechnen — 4 von 12 widersprechen heute ihrem
  eigenen Namen (Räuberland→Fisch, Reiche Kronen→Amöbe, s. §7).

## Phase 1 — Sichtbar machen, was schon da ist (Pakete A/B/C)

**Reine Präsentations-Arbeit, kein Physik-Risiko.** Aus `docs/lebensbaum-luecken.md` §6:
9 Extremophile (ein Stressor-Gen je Form) + 6 Nischen-Formen (Grabtier, Stickstoff-Mikrobe,
Filtrierschwimmer, sessiler Filtrierer, Krill, Leuchtpilz) + 7 Verfeinerungen. **44 → 66
Formen.** Macht die zehn Stressor-Achsen aus den Einfluss-Karten zum ersten Mal zu einem
sichtbaren Freischalt-Pfad statt einem Rausch-Nebeneffekt.

## Phase 2 — Der ehrliche Übergang: Amphibisch als echte Nische

**Neue, aber kleine Mechanik** (kein neues Gen — ein Interaktionsterm zwischen
bestehenden Kanälen). Heute gewinnt an der Land/Wasser-Grenze meist ein liegengebliebenes
Landtier (Fell-Warmblüter 23 % exakt am Umschlagpunkt), weil Landjagd und aquatische Jagd
hart gegeneinander konkurrieren statt sich zu ergänzen. Ein Fitness-Bonus für „kann beides
mäßig gut" im Übergangsband (analog zu den sechs bestehenden Energiekanälen, siehe
BACKLOG.md „6 Energiekanäle") macht Amphibie vom Drift-Zufall zu einer echten, ansteuerbaren
Form — **erst danach** ist ein dreiwertiger Medium-Toggle (Land/Amphibisch/Wasser) im UI
ehrlich.

## Phase 3 — Habitat als Weltebene

Voraussetzung: Phase 0 (Medium sauber) + idealerweise Phase 1 (genug Formen, dass ein
Habitat nicht nach drei Bakterien-Treffern leer wirkt). Aus der Raum-Messung
(`tools/research/room-sweep.mjs`, §7): 10 Habitate haben je ein eigenes Gesicht
(Tiefsee→Leuchtwesen 25 %, Wüste→Insekt 47 %, Steppe→flinkes Tier 42 %), machen aber nichts
zusätzlich erreichbar — sie ordnen.

- Habitat als Rahmen über Medium + Reglern, **färbt, sperrt nicht** (Pfeiler).
- Die zehn Stressor-Achsen an Habitate binden statt nur an Zufalls-Karten: Druck→Tiefsee,
  Salz→Meer, Frost+Wind→Polar, Austrocknung→Wüste. Damit werden die 9 Extremophilen aus
  Phase 1 an einem **Ort** findbar, nicht nur per Ereignis-Glück.
- Genbuch/Karte bekommt eine räumliche Lesart: „diese Form lebt HIER", nicht nur „bei diesen
  Werten".

## Phase 4 — Speziation: eine Welt zeigt mehrere Arten

**Die größte einzelne Mechanik in dieser Roadmap — bereits als „P1 Radiation" in
`docs/evolution-fidelity-loop.md` als net-neu zu bauen vorgesehen**, hier nur mit der
Lebensbaum-Perspektive verbunden. Der reale Baum ist so ungleich (1,3 Mio. Gliederfüßer
gegen 6,4k Säuger), weil eine erfolgreiche Bauform sich in viele Feinnischen aufspaltet
(Käfer!). Unsere Engine kennt bewusst keine Artbildung — ein „Insekt" bleibt für immer EIN
Insekt, egal wie lange die Welt läuft.

Zielbild: eine konvergierte Population unter anhaltendem, disruptivem Druck (zwei
Sub-Optima nah beieinander) zerfällt in zwei koexistierende Linien, die beide im selben
Habitat sichtbar bleiben (Zensus zeigt zwei Arten statt einer). Das ist der einzige Hebel,
der ein Habitat wirklich nach „Ökosystem" statt „ein Wesen mit Hintergrundbild" aussehen
lässt — und der einzige Weg, wie z. B. „Insekt" sich später in mehrere eigenständige
Formen auffächern könnte, ohne dass wir jede von Hand vorgeben.

## Phase 5 — Beziehungen: Symbiose, Parasitismus

**Bereits bewusst zurückgestellt** (BACKLOG.md: „Parasitismus braucht eine zweite Art als
Gegenspieler, nicht nur ein Milieu"), hier als Fortsetzung von Phase 4 eingeordnet, weil
beide dieselbe Grundvoraussetzung brauchen: mehr als ein Genom gleichzeitig in Beziehung.
Erweitert `world/coevolution.ts` (heute: Räuber-Beute-Wettrüsten) um echte wechselseitige
Abhängigkeit — Wirt/Parasit (~40 % aller realen Arten!), Mutualismus (Bestäuber↔Blüte,
Pilz↔Wurzel). Die „Flechte" ist heute schon eine Pilz+Alge-Symbiose, aber fest verdrahtet,
nicht emergent — Phase 5 würde solche Paare aus der Dynamik selbst entstehen lassen.

## Phase 6 — Zeit: Jahreszeiten, Tag/Nacht

**Bereits als „zeitachse"-Layer in `app/influences.js` markiert**, dort explizit als
strukturell anders begründet: „ein zyklischer Jahresgang ist etwas anderes als ein hoher
oder tiefer Wert; die Engine kennt nur Momentaufnahmen." Öffnet eine ganze Klasse realer
Anpassungen, die heute unmöglich sind: Winterschlaf, Zug, Laubfall, Fellwechsel,
Saison-Tarnung — alles Verhalten über Zeit, nicht Zustand an einem Punkt.

## Phase 7 — Populations-/Life-History-Ebene

**Bereits explizit als legitime, noch nicht gebaute Erweiterung benannt** (BACKLOG.md
„Breiten-Feld"): r/K-Strategie, Dispersal, Sozialität, Generationszeit. Keine
Einzel-Gen-Phänotypen mehr, sondern Eigenschaften der Population/Welt — der Unterschied
zwischen „ein Schwarm kleiner, schnell reifender Insekten" und „ein K-Stratege mit langer
Jugend" wird heute nirgends abgebildet, obwohl er real einer der größten Bauplan-Unterschiede
ist.

---

## Woher kommt „groß genug"? Größenordnung

| Phase | Formen danach (grob) | Art der Arbeit |
|---|---|---|
| heute | 44 | — |
| 1 | ~66 | Daten/Präsentation |
| 2 | ~68 | kleiner Fitness-Term |
| 3 | ~68 (gleich, aber geordnet) | Präsentation + Weltstruktur |
| 4 | offen (emergent, kein Fixwert) | neue Engine-Mechanik |
| 5 | +einige feste Paare, Rest emergent | neue Engine-Mechanik |
| 6 | +einige zeitgebundene Formen | neue Engine-Mechanik |
| 7 | Formenzahl unverändert, aber realistischer | Weltebene, keine Formen |

Ab Phase 4 ist „Formenzahl" nicht mehr die richtige Metrik — das System wechselt von
„handkuratierte Blätter am Baum" zu „ein Baum, der selbst wächst". Das ist der eigentliche
Sprung im Zielzustand: nicht mehr 44 vs. 66 vs. 100 Namen, sondern ob der Baum irgendwann
Äste treibt, die niemand vorher benannt hat.

## Reihenfolge-Empfehlung

Phase 0 und 1 sind unabhängig vom Rest und sollten zuerst kommen (niedrigstes Risiko,
höchster sofortiger Effekt, blockieren nichts). Phase 2 und 3 hängen an Phase 0 und
gehören zusammen (Medium-Fix ist ohne Habitat-Ebene halbe Arbeit). Phase 4–7 sind die
eigentliche „großes Denken"-Antwort auf deine Frage — voneinander unabhängig, aber alle
deutlich größere Eingriffe in `world/`, nicht mehr in `physics.json`/`app/archetypes.js`.
Von diesen vieren hat **Phase 4 (Speziation)** den größten Hebel auf „realistische
Abbildung der Welt", weil sie die Grundannahme „eine Form = ein Genom-Punkt" aufbricht,
die der ganzen heutigen Lebensbaum-Betrachtung zugrunde liegt.
