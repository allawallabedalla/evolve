# Lebensbaum: Bestand, Lücken und was mit einfachen Mitteln dazukommen kann

Stand: 2026-07-30. Messgrundlage: `node tools/research/gap-sweep.mjs 3000` (3000
Zufalls-Umwelten, 6 Regler frei gezogen, in der Hälfte der Fälle zusätzlich ein
Stressor aktiv, wie ihn eine Einfluss-Karte setzt; Mean-Field-Konvergenz vom Ur-Genom
über 300 Generationen, deterministisch, ohne Drift). Ergänzt
`docs/tree-of-life-reference.md` (reales Gerüst) und `docs/rarity.json` (Häufigkeit).

---

## 1. Bestand: 44 Formen in 5 Reichen

| Reich | Formen | davon entstehen von selbst | nur über Drift |
|---|---|---|---|
| Mikrobe | 3 | 3 | — |
| Protist | 2 | 1 | Plankton |
| Pflanze | 10 | 6 | Moos, Farn, Kraut, Blütenkraut |
| Pilz | 7 | 6 | Schimmel |
| Tier | 22 | 17 | Fluginsekt, Schnecke, Wurm, Amphibie, Schwamm |
| **Summe** | **44** | **33** | **11** |

„Nur über Drift" heißt: kein stabiler Fitness-Gipfel — der Spieler kann die Form
antreffen, aber nicht gezielt ansteuern. Das ist so gewollt (die „legendären Fänge"),
betrifft aber mit 11 von 44 ein Viertel des Baums.

## 2. Der eigentliche Befund: 15 der 25 Gene benennen gar nichts

Die Prototyp-Bibliothek (`app/archetypes.js`) beschreibt Formen ausschließlich über die
10 Kern-Gene. Die 15 bedingten Gene tauchen in **keinem** Prototyp auf — sie werden von
der Selektion aber sehr wohl hochgezogen:

| Gen | läuft hoch (>0.6) in | von Formen benannt |
|---|---|---|
| burrow (Grabtrieb) | 26,7 % | 0 |
| nfix (Stickstoff-Fixierung) | 21,8 % | 0 |
| filter (Filterapparat) | 18,0 % | 0 |
| baro, fireres, detox, osmo, desicc, pigment, radres, frostres, windres | je 4–5 % | 0 |
| camo, oxyEff | je ~3 % | 0 |
| sense (Sinne) | 0,0 % | 0 |
| biolum | 15,7 % | 2 |
| wing | 1,8 % | 3 |

Ein Stressor greift dabei zuverlässig auf sein Gen durch (Mittelwerte bei aktivem
Stressor: detox 0.91, osmo 0.94, pigment 0.92, baro 0.94, desicc 0.94, radres 0.90,
fireres 0.93, frostres 0.91, windres 0.92). Ein Wesen mit Entgiftung 0.91 heißt heute
trotzdem „Fisch · Aalform" wie jeder andere Fisch — die Anpassung ist **erreichbar,
aber unsichtbar**. Genau hier liegt der billigste Zuwachs an Formen: die Physik ist
fertig, es fehlt nur der Name.

Zwei Sonderfälle:
- **`sense` ist ein totes Gen** — in 3000 Umwelten nie über 0.5. `senseForage` (0.3)
  trägt seine Unterhaltskosten (`maintenance.sense` 0.12) nicht. Eine „Sinnesjäger"-Form
  wäre nicht erreichbar, ohne vorher die Physik zu korrigieren.
- **`burrow` wirkt auch in sessilen Organismen** (`defenseFromBurrow` fragt die
  Mobilität nicht ab) — ein grabender Baumpilz ist biologisch schief. Vor einer
  Gräber-Form sollte der Verteidigungsterm an Mobilität gekoppelt werden.

## 3. Kandidaten: was die Engine schon hervorbringt, aber nicht benennt

Anteil = wie oft die Nische im Sweep besetzt wurde (= Erreichbarkeit). „heute" = wie
das Wesen derzeit heißt.

### 3a. Sofort machbar — nur ein Prototyp fehlt

| Anteil | Neue Form | Reales Vorbild | heißt heute |
|---|---|---|---|
| 18,8 % | Grabtier · Wühler | Maulwurf, Nacktmull | Fell-Warmblüter / Insekt / Reptil |
| 18,3 % | Stickstoff-Mikrobe | Knöllchenbakterie, Cyanobakterie | Bakterie / Archaee |
| 9,6 % | Filtrierschwimmer | Bartenwal, Riesenhai, Manta | Fisch · Aalform |
| 7,3 % | Sessiler Filtrierer · Muschel | Muschel, Seepocke | Baumpilz · Porling |
| 7,1 % | Meeressäuger | Wal, Robbe, Delfin | Fisch · Aalform |
| 5,0 % | Giftzehrer · Chemotroph | Schwefelbakterie, Aasfresser | quer durch alle Reiche |
| 5,0 % | Salzwesen · Halophil | Salinenkrebs, *Halobacterium* | quer durch alle Reiche |
| 4,7 % | Sonnenpigment-Wesen | Hochgebirgsflechte, UV-harte Alge | quer durch alle Reiche |
| 4,6 % | Strahlenfestes Wesen | *Deinococcus radiodurans* | quer durch alle Reiche |
| 4,3 % | Frostwesen | Eisfisch, Frostspanner | quer durch alle Reiche |
| 3,7 % | Filtrierendes Kleinstwesen | Krill, Rädertierchen | Bakterie / Archaee / Amöbe |
| 3,4 % | Leuchtpilz · Foxfire | Hallimasch | Myzel / Bakterie |
| 2,8 % | Stachelhäuter | Seestern, Seeigel | Koralle · Riffbildner |
| 2,8 % | Anaerobier | Methanogene, Tiefsee-Archaeen | Fell-Warmblüter / Fisch |
| 2,7 % | Feuerfestes Tier | Feuerkäfer, Pyrophile Insekten | Fisch / Fell-Warmblüter |
| 2,6 % | Laufvogel · flugloser Läufer | Strauß, Emu | Aktiver Großjäger |
| 2,6 % | Tiefsee-Druckwesen | Grönlandhai, Amphipoden | Archaee / Leuchtwesen |
| 2,3 % | Knöllchen-Pflanze | Leguminose, Erle | Laubbaum / Strauch |
| 2,2 % | Dürrewesen · Anhydrobiont | Bärtierchen, Rose von Jericho | Archaee / Bakterie |

**19 neue Formen, alle ≥ 2 % erreichbar** — das ist mehr, als heute in Pflanze + Pilz
zusammen stehen. Keine davon braucht eine Physik-Änderung.

### 3b. Erreichbar, aber dünn (< 1 %) — als seltene Fänge sinnvoll

Riesenpflanze · Mammutbaum (0,8 %, heute zu 100 % „Laubbaum"), Tarnjäger · Lauerer
(0,7 %), Zwergstrauch (0,7 %), Windflüchter · Krummholz (0,6 %), Salzpflanze · Mangrove
(0,4 %), Feuerpflanze · Pyrophyt (0,3 %). Die drei letzten sind reale, sehr
charakteristische Baupläne — sie wären genau die Art „legendärer Fang", die der Baum
heute mit Moos und Farn belegt.

### 3c. Nicht erreichbar — braucht erst Physik, nicht nur einen Namen

| Fehlende Gruppe | Warum unerreichbar |
|---|---|
| Schlange (beinloses Landtier) | 0 Treffer: Gliedmaßenlosigkeit zahlt sich nur im Wasser aus (`aquaticLimbDrag`); an Land gibt es keinen Vorteil für „ohne Beine" |
| Seegras / Wasserpflanze | 0 Treffer: Photosynthese im tiefen Wasser verliert immer gegen aquatische Jagd; es fehlt ein Licht-im-Wasser-Term |
| Kieselalge / Panzeralge | 0 Treffer: Panzerung bei Kleinstgrößen hat keinen Nutzen (Räuberdruck skaliert nicht mit Größe) |
| Sinneswesen / Nachtjäger | `sense` ist tot (s. §2) |
| Spinnentiere, Tausendfüßer | Vom „Insekt"-Bauplan gen-technisch nicht unterscheidbar — bräuchte eine Achse „Beinzahl/Körpersegmente" |
| Quallen (freischwimmende Nesseltiere) | 3 Treffer: „weich + groß + träge + mobil" ist fast nie optimal; bräuchte Drift/Strömung als Fortbewegungsart |
| Parasiten (real ~40 % aller Arten!) | Kein Wirt-Mechanismus |
| Mykorrhiza, Endophyten, echte Symbiosen | Koevolution ist im Weltmodell, aber nicht im Genom eines Einzelwesens |
| Speziation / Radiation (Käfer!) | Bewusst nicht modelliert (s. `tree-of-life-reference.md`) |

## 4. Taxonomische Lücken gegenüber dem realen Baum

Über die Nischen-Sicht hinaus fehlen im Gerüst (`docs/tree-of-life.json`) ganze
Hauptäste. Sortiert danach, ob 3a/3b sie schließen würde:

- **Schließbar mit den Kandidaten oben:** Bivalvia (Muscheln ~20k Arten),
  Echinodermata (Stachelhäuter ~7k), Cetacea/Pinnipedia (Meeressäuger), Cyanobacteria
  (die Gruppe, die die Sauerstoff-Atmosphäre gemacht hat), Palaeognathae (Laufvögel),
  extremophile Archaeen als eigene Blätter statt einer Sammelform.
- **Nicht schließbar ohne neue Achse:** Arachnida (~110k Arten — die größte einzelne
  Lücke), Myriapoda, Chondrichthyes (Haie/Rochen, heute mit Knochenfischen in einer
  Form), Poaceae (Gräser — prägen ganze Biome, stecken in „Kraut"), Monokotyledonen
  allgemein, karnivore Pflanzen, Epiphyten/Lianen, Schleimpilze, Viren.

## 5. Aufwand pro neuer Form

Eine Form anzulegen berührt sechs Stellen, davon fünf mechanisch:

1. `app/archetypes.js` — Prototyp (Gene + optional `requires`). Zahlen nicht raten,
   sondern aus dem Sweep mitteln (dieselbe Methode wie `archetype-derive.mjs` Schritt 2).
2. `app/index.html` `TREE` — Blatt mit Klade, Erdzeitalter, Evolutions-Satz.
3. `app/index.html` `ICONS` + `FICON` — ein SVG-Pfad. **Der einzige echte Handarbeits-Posten.**
4. `docs/rarity.json` + `RARITY` — gemessen, nicht gesetzt (`npm run rarity-check`).
5. `app/exemplar.js` `ARCH_WIKI` — Wikipedia-Verweis „≈ in echt".
6. `docs/tree-of-life.json` — Knoten/`ourForms`-Zuordnung.

Herausforderungen (`app/challenges.js`) und Story-Texte werden von
`tools/build-challenges.mjs` / `build-story-extra.mjs` neu erzeugt und brauchen keine
Handarbeit.

**Die einzige inhaltliche Gefahr:** Prototypen konkurrieren. Eine neue Form zieht
Grenzfälle von ihren Nachbarn ab (der Spezifitäts-Bonus bevorzugt Prototypen, die zu
mehr Genen etwas sagen). Nach jedem Paket muss deshalb der Sweep neu laufen und
geprüft werden, dass keine Bestandsform unter ihre bisherige Erreichbarkeit fällt.

## 6. Empfehlung: drei Pakete

- **Paket A — Extremophile (9 Formen).** Je eine Form pro Stressor-Gen (detox, osmo,
  pigment, baro, desicc, radres, fireres, frostres, windres). Macht 9 tote Gene
  sichtbar und die Einfluss-Karten zu echten Freischalt-Pfaden: „Karte spielen →
  neue Form". Erreichbarkeit je 4–5 %, zusammen ~40 % aller Umwelten mit Stressor.
- **Paket B — Nischen-Gene (6 Formen).** Grabtier, Stickstoff-Mikrobe,
  Filtrierschwimmer, sessiler Filtrierer, Krill-Filtrierer, Leuchtpilz. Die höchsten
  Einzelanteile im ganzen Sweep (7–19 %). Vorher `defenseFromBurrow` an Mobilität
  koppeln (§2).
- **Paket C — Bauplan-Verfeinerung (7 Formen).** Meeressäuger, Stachelhäuter,
  Laufvogel, Anaerobier, Knöllchen-Pflanze, Riesenpflanze, Tiefsee-Druckwesen.
  Teilt bestehende, gut besetzte Regionen feiner auf — hier ist die
  Nachbar-Konkurrenz am größten, also zuletzt und mit Nachmessung.

Das wären **44 → 66 Formen** ohne eine einzige neue Engine-Mechanik. Alles darüber
(Spinnentiere, Gräser, Parasiten, Speziation) braucht neue Achsen und gehört in den
Backlog, nicht in dieses Paket.
