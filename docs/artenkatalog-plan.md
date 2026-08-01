# Realer Artenkatalog — Umsetzungsplan

**Stand:** 2026-08-01 · Auftrag aus der Sitzung „Zufallsfaktor / alle Lebewesen abbilden".
Gehört zu `BACKLOG.md` Punkt 12. Dieses Dokument ist der maßgebliche Plan; der
Backlog-Eintrag ist nur der Zeiger darauf.

---

## 1 · Die Umkehrung — worum es geht

Bisher entsteht ein Artname **vorwärts**: die Engine erzeugt ein Genom, und der Matcher
sucht den nächsten von 70 handkuratierten Prototypen (`app/archetypes.js`,
`matchArchetype()` in `app/index.html:1352`). Der Katalog ist damit gedeckelt bei dem, was
von Hand gepflegt wurde — jede neue Form kostet Name, Emoji, Prototyp-Zahlen, `FICON`,
`RARITY`, `TREE`-Ast und Wikipedia-Verweis in `app/exemplar.js`.

Der Katalog wird **rückwärts** befüllt: Ausgangspunkt sind reale Lebewesen, die einen
deutschen Wikipedia-Artikel haben. Jedes bekommt eine Position im 25-D-Genraum. Die
Benennung ist dann eine Nachbarschaftssuche in einer Menge belegter Organismen statt in
einer Liste erfundener Archetypen.

Drei Dinge fallen dadurch von selbst an:

1. **Kein Zwei-Klassen-Katalog.** Jeder Eintrag hat eine Quelle. Die Alternative
   (vorwärts erzeugte Cluster mit generierten Namen) hätte zwangsläufig 90 % Einträge
   ohne Beleg, ohne Icon, ohne Text produziert.
2. **Eine Abdeckungs-Metrik.** Sobald reale Arten im Genraum liegen, ist messbar, welcher
   Anteil von der Engine überhaupt erreicht wird. Aus `exemplar.js` („≈ in echt") wird
   eine Zahl in der Sprache, die dieses Projekt sonst überall spricht — und der
   Lückenreport ist die Forschungsagenda für neue Gen-Achsen.
3. **Der echte Lebensbaum.** `docs/tree-of-life.json` ist heute von Hand zusammengesucht
   (der Kommentar dort vermerkt: „gefetcht via WebSearch, OTOL/GBIF-API im Sandbox-Netz
   geblockt"). Wikidata liefert die Elterntaxon-Kette (P171) als echte Hierarchie.

---

## 2 · Getroffene Entscheidungen

### Vom Nutzer entschieden (2026-08-01)

| Frage | Entscheidung |
|---|---|
| Umfang | **~5.000–20.000 Arten** — alle Taxa mit deutschem Wikipedia-Artikel und brauchbaren Merkmalsdaten |
| Platzierung im Genraum | **Hybrid** — Merkmale legen die selektionsrelevanten Gene fest, Habitat-Rückwärtslauf füllt den Rest |
| Rolle im Spiel | **Der Katalog ersetzt die Benennung** — das Wesen heißt nach der nächsten realen Art |
| Netzzugang | Wikidata/Wikipedia werden für die Entwicklungsumgebung freigeschaltet |

### Von mir getroffen (Annahmen — begründet, revidierbar)

- **Wikidata als Rückgrat, nicht Wikipedia.** Wikidata ist CC0 (keine Lizenzlast),
  strukturiert und per SPARQL abfragbar. Der Pflichtfilter „hat einen deutschen
  Wikipedia-Artikel" wird über den `dewiki`-Sitelink gesetzt. Wikipedia selbst wird nur
  für den Anzeige-Link benutzt, nicht als Datenquelle.
- **Keine Bilder.** Wikimedia-Bilder haben heterogene Lizenzen mit Namensnennungspflicht
  und kosten Bandbreite. Die eigenen Silhouetten bleiben die Darstellung.
- **Kein LLM in der Datenpipeline.** Nicht reproduzierbar, nicht gatebar, kostet Geld —
  drei Widersprüche zur Prüfstands-Kultur des Repos. Die Abbildung ist ein dokumentiertes
  Regelwerk, das man nachrechnen kann.
- **Der Katalog ist ein in CI erzeugtes, statisch ausgeliefertes Artefakt**, keine
  Live-Abfrage. Damit bleibt die App offline-first (Meilenstein A1) und der Katalog bleibt
  deterministisch prüfbar. Supabase kommt erst in Phase 5 dazu, und nur für Spielerdaten.
- **Erstentdeckung bleibt privat** (falls Phase 5 kommt): kein Personenbezug, keine
  öffentliche Bestenliste über Arten. Das hält die Zusage aus `supabase/schema.sql`
  („KEINE personenbezogenen Daten") und die Leitplanke „kein Vollständigkeits-Zwang".
- **Anzeige:** deutscher Trivialname wenn vorhanden, wissenschaftlicher Name als
  Unterzeile. Nie nur der wissenschaftliche Name allein.
- **Genome ohne reale Entsprechung:** der vorhandene, kalibrierte `novelThreshold`
  (0.15) bleibt die Grenze. Jenseits davon wird **keine** reale Art behauptet, sondern der
  beschreibende Name aus `generateFormName()` gezeigt, ausdrücklich markiert als „keine
  bekannte Entsprechung". Ehrlichkeit vor Vollständigkeit.

---

## 3 · Architektur: Schlüssel-Ebene und Anzeige-Ebene trennen

Das ist der Kern, an dem entschieden wird, ob „Katalog ersetzt die Benennung" eine
Migration durch die halbe App wird oder ein überschaubarer Eingriff.

Heute schlüsseln fünf Subsysteme auf dem **Namen** einer Form: `TREE` (Lebensbaum),
`RARITY` (Seltenheit), `FICON` (Icons), `app/challenges.js`, `app/story.js` — dazu
`app/exemplar.js` und die Spalte `discovered text[]` in Supabase. Würde der Anzeigename
frei aus 20.000 realen Arten kommen, bräche alles davon.

**Lösung — zweistufige Benennung:**

```
Stufe 1  Bauplan-Gruppe    matchArchetype() wie heute, ~70 Prototypen
         -> stabiler Schluessel (key: "fellwarm", "laubbaum", ...)
         -> traegt Icon, Raritaet, Lebensbaum-Ast, Herausforderungen, Chronik-Tags

Stufe 2  Reale Art         naechster Nachbar INNERHALB der Bauplan-Gruppe
         -> Anzeigename ("Polarfuchs"), Wikipedia-Link, Taxonomie
```

Drei Gewinne auf einmal:

- **Nichts bricht.** Die Schlüssel-Ebene bleibt exakt die heutige. `app/archetypes.js`
  hat das `key`-Feld bereits (`"gruenalge"`, `"moos"`, …) — es wird von den Konsumenten
  bloß noch nicht benutzt, die hängen am Namen. Das ist eine mechanische Umstellung.
- **Der Matcher bleibt bezahlbar.** Naive Suche über 20.000 Arten × 25 Gene wären 500k
  Rechenoperationen pro `classify()`-Aufruf — und der läuft pro Generation. Zweistufig
  sind es 70 Prototypen plus ~300 Arten der Gruppe, also gut 1 % davon.
- **Der Zufallsfaktor bekommt endlich Wirkung.** Innerhalb einer Bauplan-Gruppe liegen
  Dutzende reale Arten dicht beieinander; welche getroffen wird, hängt genau an den
  Genen, auf die die Selektion nicht schaut. Das ist die Stelle, an der das Gründer-Los
  aus Phase 4 sichtbar wird — vorher war es kosmetisch.

---

## 4 · Datenmodell

Ein Katalog-Eintrag:

```jsonc
{
  "qid":    "Q26843",              // Wikidata-Item (stabiler Schluessel)
  "de":     "Polarfuchs",          // Trivialname (P1843, de) oder null
  "sci":    "Vulpes lagopus",      // wissenschaftlicher Name (P225)
  "wiki":   "Polarfuchs",          // dewiki-Titel fuer den Link
  "group":  "fellwarm",            // Bauplan-Gruppe (Stufe-1-Schluessel)
  "genome": [230, 96, 120, ...],   // 25x uint8, Gen*255 quantisiert
  "conf":   [3, 3, 2, 1, ...],     // Herkunft je Gen, s. u.
  "lineage":"Q729/Q25314/Q25324",  // Elterntaxon-Kette (P171) fuer den Lebensbaum
  "rank":   "species"              // P105
}
```

**Quantisierung auf uint8** ist bewusst: Auflösung 1/255 ≈ 0.004 liegt weit unter dem
`novelThreshold` von 0.15 und unter der Mutations-SD (0.06). 20.000 Arten × 25 Byte = 500 KB
Genom-Block plus ~2 MB Metadaten — geshardet nach Bauplan-Gruppe lädt der Client nur, was
er braucht.

**Konfidenz je Gen** (`conf`, 0–3) ist der ehrliche Teil und wird nirgends versteckt:

| Wert | Bedeutung |
|---|---|
| 3 | direkt gemessen (Wikidata-Merkmal dieser Art) |
| 2 | aus der Klade abgeleitet (dokumentierte Regel, z. B. „Säugetier ⇒ Isolation hoch") |
| 1 | hierarchisch imputiert (Median der Gattung/Familie, s. Abschnitt 5) |
| 0 | aus dem Habitat-Rückwärtslauf geschätzt |

Die mittlere Konfidenz einer Art entscheidet mit darüber, ob sie überhaupt in den
ausgelieferten Katalog kommt (Schwelle wird in Schritt 1.4 kalibriert, nicht geraten).

---

## 5 · Die Platzierungs-Methode (hybrid)

Der wissenschaftliche Kern. Vier Stufen, in dieser Reihenfolge, jede füllt nur, was die
vorige offen gelassen hat:

**(a) Direkte Merkmale.** Wikidata-Eigenschaften auf Gene abbilden — Masse (P2067) und
Länge/Höhe (P2043/P2048) auf `size`, Habitat (P2974) auf `aquatic`-nahe Gene und `light`,
und so weiter. *Offen und in Schritt 1.1 zu verifizieren:* welche Eigenschaften wie dicht
belegt sind. Erfahrungsgemäß hat nur ein kleiner Teil der Taxa eine Masse — deshalb ist
(c) keine Kür, sondern tragende Struktur.

**(b) Kladen-Regeln.** Aus der Elterntaxon-Kette: Säugetier ⇒ Isolation hoch, Endothermie;
Gefäßpflanze ⇒ Photosynthese hoch, Mobilität 0, Stützgewebe nach Wuchsform; Pilz ⇒
Absorption; und so fort. Ein dokumentiertes Regelwerk pro Reich, nachvollziehbar und
testbar. Das ist die abwägungsintensivste Einzelarbeit des ganzen Plans.

**(c) Hierarchische Imputation.** Fehlt ein Gen, wird der Median der nächsten
Taxonomie-Ebene genommen, die genug belegte Geschwister hat — Gattung, sonst Familie,
sonst Ordnung. Die Tiefe, aus der imputiert wurde, ist die Konfidenz. Das ist Standard in
der Merkmalsökologie und macht die Lückenhaftigkeit von Wikidata beherrschbar, statt sie
zu verschweigen.

**(d) Habitat-Rückwärtslauf.** Für Gene, zu denen weder Merkmale noch Kladen etwas sagen
— in der Praxis vor allem die 15 bedingten Stressor-Gene (Index 10–24) — wird die Umwelt
der Art geschätzt und die Engine dort konvergieren gelassen. Das Ergebnis ist per
Konstruktion im erreichbaren Raum und braucht keine Zusatzannahme: ein Tier aus einem
salzarmen Süßwasser-Habitat bekommt genau die Osmoregulation, die die Engine dort
selektiert.

**Wichtige Grenze:** (d) allein ist zu grob, weil viele Arten dasselbe Habitat teilen und
auf denselben Punkt fielen. (d) darf deshalb nur Gene füllen, die (a)–(c) offen gelassen
haben, nie überschreiben. Das ist im Prüfstand als harte Bedingung zu verankern.

---

## 6 · Phasenplan

Reihenfolge nach Abhängigkeit **und** nach Netzbedarf: Phase 0 ist vollständig ohne
Netzzugang machbar und liefert schon ein lauffähiges Ende-zu-Ende-System. Erst Phase 1
braucht Wikidata.

### Phase 0 — Fundament (kein Netz nötig)

**0.1 · Schlüssel-Ebene entkoppeln**
*Modell: Sonnet* (mechanisch, eng spezifiziert) · *Netz: nein* · *blockiert alles Weitere*

Alle Konsumenten von Form-Namen auf den bereits vorhandenen `key` umstellen: `TREE`,
`RARITY`, `FICON`, `app/challenges.js`, `app/story.js`, `app/exemplar.js`, `discovered`
in Supabase. Anzeigename wird zur Variablen, Schlüssel wird konstant.

*Gate:* alle vorhandenen Prüfstände unverändert grün, plus ein neuer
`npm run key-consistency-check` (jeder Schlüssel in jedem Subsystem existiert in
`app/archetypes.js`, keine verwaisten Namens-Referenzen mehr).
*Nebenaufgabe:* Migration bestehender Spielstände (`discovered` enthält heute Namen,
künftig Schlüssel) — Zuordnungstabelle einmalig, alte Namen bleiben lesbar.

**0.2 · Katalog-Format + Bootstrap-Katalog**
*Modell: Sonnet* · *Netz: nein*

Das Format aus Abschnitt 4 festschreiben, Lade-/Shard-Logik bauen, und als ersten
Datensatz die **65 vorhandenen Zuordnungen aus `app/exemplar.js`** einlesen (Name →
Wikipedia-Artikel ist dort bereits handkuratiert). Damit ist die gesamte Kette
Ende-zu-Ende lauffähig und prüfbar, bevor eine Zeile Wikidata-Code existiert.

*Gate:* `npm run catalog-check` — Format, Schlüssel-Integrität, Shard-Vollständigkeit,
Ladezeit-Budget.

**0.3 · Zweistufiger Matcher**
*Modell: Opus* (Abwägung: Abstandsmaß, Schwellen, Umgang mit leeren Gruppen) · *Netz: nein*

Stufe 2 in `matchArchetype()` einziehen: nach der Bauplan-Gruppe die nächste reale Art
innerhalb der Gruppe suchen, gewichtet mit denselben Selektionsgewichten. Anzeige:
Trivialname + wissenschaftlicher Name + Wikipedia-Link + Abstandsangabe. Jenseits von
`novelThreshold` keine reale Art behaupten.

*Gate:* `npm run app-world-smoke` grün, Rechenzeit pro `classify()` unter Budget,
`ui-calm-check` grün (die neue Zeile darf die Ruhe nicht brechen).

### Phase 1 — Datenpipeline (Netz nötig)

**1.1 · Wikidata-Ernte**
*Modell: Sonnet* · *Netz: ja*

SPARQL-Abfrage über Taxa (P31/Q16521) mit `dewiki`-Sitelink, Elterntaxon-Kette (P171),
Rang (P105), Namen (P225/P1843) und allen Merkmals-Eigenschaften. Paginiert, gecacht,
als GitHub Action mit Artefakt. **Erste Aufgabe: den tatsächlichen Belegungsgrad je
Eigenschaft messen und berichten** — davon hängt die Kalibrierung der Stufen (a)–(d) ab.
Die im Plan genannten Property-IDs sind aus dem Gedächtnis und müssen gegen den Endpunkt
verifiziert werden.

*Gate:* `npm run wikidata-harvest -- --report` gibt Belegungstabelle aus; Abfrage
respektiert die Nutzungsbedingungen (User-Agent, Rate-Limit).

**1.2 · Merkmals- und Kladen-Regelwerk**
*Modell: Opus* (die abwägungsintensivste Arbeit des Plans) · *Netz: ja*

Stufen (a) und (b) aus Abschnitt 5. Pro Reich ein dokumentiertes Regelwerk mit Begründung
je Regel. Kalibrierung der Masse→`size`-Abbildung gegen die vorhandene Semantik
(`sizeClassOf()` in `engine/development.ts`) — `kleiberDecades` (0.6) ist ein
Kosten-Tuning-Parameter und **nicht** die Massenskala, das ist eine eigene Kalibrierung.

*Gate:* `npm run placement-check` — Stichprobe bekannter Arten gegen erwartete Genwerte
(Eisbär muss isoliert und groß herauskommen, Löwenzahn photosynthetisch und niedrig);
Regelwerk-Abdeckung je Reich; keine Regel ohne Begründungskommentar.

**1.3 · Imputation + Habitat-Rückwärtslauf**
*Modell: Opus* · *Netz: ja*

Stufen (c) und (d). Harte Bedingung: (d) überschreibt nie (a)–(c).

*Gate:* Konfidenz-Verteilung je Gen und Reich wird berichtet; Anteil `conf=0` je Gen unter
Schwelle; Ablations-Prüfung (ohne Imputation muss die Abdeckung messbar schlechter sein).

**1.4 · Katalog-Erzeugung**
*Modell: Sonnet* · *Netz: ja*

Zusammenbau, Quantisierung, Sharding, Aufnahmeschwelle kalibrieren, Kollisionsprüfung
(zwei Arten auf demselben Punkt), nächtlicher Actions-Lauf.

*Gate:* `npm run catalog-check` auf dem echten Katalog; Größen- und Ladezeit-Budget;
Reproduzierbarkeit (zweimal erzeugen ⇒ bitgleich).

### Phase 2 — Integration

**2.1 · Lebensbaum auf echte Taxonomie** — *Sonnet* · Elterntaxon-Ketten ersetzen
`docs/tree-of-life.json`; Genbuch zeigt die reale Hierarchie.
**2.2 · Rarität zweistufig** — *Sonnet* · Rang je Bauplan-Gruppe bleibt; neu ein Rang je
Art aus dem Abdeckungs-Sweep.
**2.3 · Chronik und Herausforderungen nachziehen** — *Sonnet* · Tags hängen an der
Bauplan-Gruppe, Texte dürfen den realen Artnamen einsetzen.
**2.4 · Spielstands-Migration abschließen** — *Sonnet* · lokal und Supabase.

### Phase 3 — Abdeckung messen

**3.1 · `npm run coverage-check`** — *Opus* · Welcher Anteil der realen Arten liegt in
Reichweite der Engine? Lückenreport nach Reich, Klade und Gen-Achse. Das ist die Zahl,
die die Vision überhaupt erst messbar macht.
**3.2 · Lückenreport in Achsen-Vorschläge übersetzen** — *Opus* · Fortpflanzung,
Sozialität, Lebenszyklus, Wirt-Parasit. Nur Vorschlag, Bestätigung von Hand — wie bei
jedem Struktur-Wachstumsschritt in diesem Repo.

### Phase 4 — Kontingenz (der ursprüngliche Faden, jetzt mit Wirkung)

**4.1 · Gründer-Los im Nullraum der Selektion** — *Opus* · Zufall nur dort, wo
`selectionWeights()` flach ist, mit Neutralitäts-Wächter (`|Δf|/f < 0.5 %`).
*Gate:* `parity` unverändert, `spectrum-check` nicht schlechter.
**4.2 · Sperrklinke (Kanalisierung)** — *Opus* · historisch modulierte Mutations-Schrittweite,
damit Kontingenz sich verriegelt statt zurückzudriften.
*Gate:* `phenomena-check` P6 hoch, P4 im Band.

### Phase 5 — Gemeinschaft (optional, später)

Beobachtungen sammeln, private Erstentdeckung, `pg_cron`-Weltschritt. Erst sinnvoll, wenn
Phase 0–3 stehen. Erzwingt einen bezahlten Supabase-Plan.

---

## 7 · Risiken und was dagegen gebaut wird

| Risiko | Gegenmaßnahme | Wo verankert |
|---|---|---|
| Wikidata-Merkmale zu lückenhaft | hierarchische Imputation + Konfidenz je Gen, Aufnahmeschwelle | 1.3, 1.4 |
| Platzierung ist Handarbeit im Gewand von Automatik | jede Regel mit Begründung, Stichproben-Gate gegen bekannte Arten | 1.2 |
| Namensbasierte Schlüssel brechen | Schlüssel-Ebene wird zuerst entkoppelt, bevor irgendetwas Neues kommt | 0.1 |
| Matcher wird zu langsam | zweistufig; Budget im Gate | 0.3 |
| App verliert Offline-Fähigkeit | Katalog ist statisches Artefakt, kein Live-Dienst | Abschnitt 2 |
| Prüfstands-Kultur erodiert | jeder Schritt hat ein `npm run …-check` | ganzer Plan |
| Personenbezug / DSGVO | Erstentdeckung privat, keine öffentliche Artenliste | Abschnitt 2, Phase 5 |
| Sammelspiel-Kipppunkt | keine öffentliche Rangliste über Arten; Leitplanken gelten weiter | Phase 5 |

## 8 · Bewusst offen

- Ob der `novelThreshold` von 0.15 nach dem Umbau noch stimmt — er wurde gegen 70
  Prototypen kalibriert, nicht gegen 20.000 Arten. Neu zu messen in 0.3.
- Ob Bauplan-Gruppen mit sehr wenigen realen Arten sinnvoll bleiben oder zusammengelegt
  werden. Entscheidung nach der Belegungsmessung in 1.1.
- Ob Wikidata allein reicht oder eine zweite Merkmalsquelle (GBIF, FishBase, TRY) nötig
  wird. Entscheidung nach 1.1, nicht vorher.
