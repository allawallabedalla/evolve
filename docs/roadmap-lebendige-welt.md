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

**Versucht, gemessen, wieder zurückgenommen (2026-07-30).** Ein neuer additiver
Energiekanal `energyAmphibious` (Dreieck-Peak bei moderatem `limb`, aktiv nur in einem
schmalen Wasser-Band um `aquaticWaterFloor`) machte Amphibie tatsächlich schwach über
Selektion erreichbar (vorher nur über Drift). Er brach dabei aber ein bereits
validiertes, für das Projekt zentrales Phänomen: die Räuber-Beute-Koevolution
(„Red Queen", P5 in der Schicht-A-Phänomen-Portfolio aus BACKLOG.md Punkt 9,
geprüft von `tools/coevolution-check.mjs`). Die Testumwelt dafür liegt exakt bei
`water=0.5` — dem Zentrum des neuen Kanals. Jeder getestete Ertragswert (0,3 / 0,6 /
0,9 / 1,5) senkte das Koevolutions/Kontroll-Verhältnis von der Baseline 6,6× auf
1,4–2,1×, unter die geforderte 2,5×-Schwelle: der Kanal gab der Beute-Population einen
Ausweg aus dem größenbasierten Rüstungswettlauf, wo eigentlich Panzer/Größe/Mobilität
gegeneinander antreten sollen. Vollständig zurückgenommen (physics.json,
engine/fitness.ts, engine/types.ts, oracle/reference_model.py) statt live geschickt —
Befund in den jeweiligen Dateien dokumentiert.

**Für einen zweiten Anlauf:** das Zentrum des Kanals müsste bewusst NICHT auf
`aquaticWaterFloor` fallen (der Koevolutions-Test sitzt genau dort), oder der Bonus
müsste an eine Bedingung gekoppelt werden, die die reine Größen-Verteidigungs-Nische der
Koevolutions-Testumwelt (Räuberdruck ohne Wasser-Kontext) nicht berührt. Amphibie bleibt
bis dahin ein „legendärer" Drift-Fang wie Moos oder Farn — kein Rückschritt gegenüber dem
Ausgangszustand, nur kein Fortschritt. Ein dreiwertiger Medium-Toggle (Land/Amphibisch/
Wasser) im UI bleibt aus denselben Gründen wie ursprünglich zurückgestellt: ohne echte
Amphibien-Nische wäre er ein Etikettenschwindel.

## Phase 3 — Habitat als Weltebene

**Kernstück umgesetzt (2026-07-30).** Aus der Raum-Messung (`tools/research/room-sweep.mjs`,
§7): 10 Habitate haben je ein eigenes Gesicht (Tiefsee→Leuchtwesen 25 %, Wüste→Insekt 47 %,
Steppe→flinkes Tier 42 %), machen aber nichts zusätzlich erreichbar — sie ordnen. Die 12
bestehenden Biom-Presets SIND diese Habitat-Ebene bereits; eine separate neue UI-Schicht
hätte den Komplexitäts-Audit (Punkt 3) verletzt. Stattdessen die vier eindeutigen Fälle
umgesetzt, wo der Ortsname den Stressor schon verspricht: `stress:{ax,v}` an `BIOMES`
(app/index.html) — Eiszeit→Frost, Hitze-Dürre→Dürre, Offenes Meer→Salz, Lichtlose
Tiefsee→Druck. Macht 4 der 9 Paket-A-Extremophilen an einem festen Ort statt nur per
Zufalls-Karte findbar. Wind+Frost gemeinsam für Eiszeit geprüft (`node
scratchpad/eiszeit-frostwind.mjs`) und verworfen: Frost dominiert ohnehin, Wind hätte
nichts zusätzlich sichtbar gemacht — kein eigener „Polar"-Fall im heutigen Preset-Satz.
Im Browser verifiziert (Playwright + Screenshot): Klick auf „Lichtlose Tiefsee" → Chip
„Tiefsee-Druck ✕" → Population konvergiert auf „Tiefsee-Amphipode · Druckfest".

Offen (kleinerer Nachtrag, kein Blocker für den Rest der Roadmap): Genbuch/Karte um eine
räumliche Lesart ergänzen („diese Form lebt HIER", nicht nur „bei diesen Werten").

## Phase 4 — Speziation: eine Welt zeigt mehrere Arten

**KORRIGIERT (2026-07-30): der Mechanismus existiert bereits und ist validiert — die
Annahme „unsere Engine kennt bewusst keine Artbildung" (ursprüngliche Fassung dieses
Abschnitts) war falsch.** `npm run phenomena-check` (`tools/phenomena-check.mjs`, deckt
sich mit dem in BACKLOG.md Punkt 9 als „net-neu zu bauen" markierten P1) läuft **8/8**:
P1 Adaptive Radiation, P2 Sympatrische Speziation/Branching, P3 Allopatrische Speziation,
P4 Konvergente Evolution, P5 Rote-Königin-Dynamik, P6 Kontingenz, P8 Aussterben &
Erholung, P7 Verteilungsgesetze — jedes mit Ablationsprobe (der treibende Mechanismus
abgeschaltet verfehlt das Zielband nachweislich, kein Zufallstreffer). Die Bausteine
dafür sind fertig: `world/population.ts` (Wright-Fisher-Schwarm, frequenzabhängige
Konkurrenz), `world/cluster.ts` (Mehrgipfel-Erkennung, disruptive Selektion spaltet
eine Population nachweislich in ≥2 Cluster, `branching-check.mjs`), `world/census.ts`
(jeder Cluster wird EINZELN über `describe()` benannt und über Orte aggregiert — „eine
Art ist eine Häufung, ihr Name kommt aus ihrem Genom", nicht aus einer Kaskade).

**Was tatsächlich fehlt, ist keine Mechanik, sondern eine Spieler-Ebene:** die
Single-Habitat-Hauptansicht (`app/index.html`, Umgebung von `classify()`) zeigt nur
EIN Wesen mit EINEM Namen. Die Aufspaltungs-/Zensus-Logik lebt im `world/`-Layer und
ist heute nur über das separate „Lebende Welt (Beta)"-Overlay (Mehr-Orte-Ansicht)
sichtbar. Die eigentliche offene Frage für einen Anschluss ist eine
UX-/Architektur-Entscheidung, keine Physik-Frage: wie zeigt die Hauptansicht — deren
ganze Prämisse „DEIN eines Wesen" ist (s. Produkt-Pfeiler) — dass sich die Population
dahinter in zwei Linien gespalten hat, ohne diese Prämisse zu brechen? Mögliche
Ansätze (nicht bewertet, nur skizziert): ein sanfter Hinweis „deine Linie steht an
einer Weggabelung" (existiert in Ansätzen schon über `alt`/`margin` in
`matchArchetype()`, s. `app/archetypes.js`); ein zweiter, kleinerer „Zweig" neben dem
Hauptwesen; oder die Aufspaltung bewusst nur in der Lebende-Welt-Ansicht zeigen und die
Hauptansicht einsträngig lassen (aktueller Zustand, aber dann bleibt das
Lebensbaum-Wachstum auf die Beta-Ansicht beschränkt). Das ist ein eigener
Design-Durchlauf mit dem Nutzer, kein Implementierungs-Task.

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
