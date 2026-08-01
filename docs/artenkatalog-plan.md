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

**(a) Direkte Merkmale.** Wikidata-Eigenschaften auf Gene abbilden — Masse (P2067) auf
`size`, Habitat (P2974) auf `aquatic`-nahe Gene und `light`, und so weiter.

> ⚠️ **Gemessen 2026-08-01 (s. Abschnitt 5a): Wikidata trägt diese Stufe NICHT.** Die
> Merkmalsbelegung liegt im einstelligen Prozentbereich. Stufe (a) bleibt im Plan, ist
> aber ein Zusatz, keine Grundlage — die Last liegt bei (b) und (c), und für die
> Vertebraten kommt eine zweite Quelle dazu (s. 5a).

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

## 5a · Messung der Datenlage (2026-08-01, Vorgriff auf Schritt 1.1)

Stichprobe von je 400 Arten mit deutschem Wikipedia-Artikel, Merkmale über die
Action-API geholt (`wbgetentities`, volle Claim-Liste — misst also *alle* Eigenschaften,
nicht nur die vorab geratenen). Belegung in Prozent:

| Eigenschaft | Säuger | Vögel | Amphibien | Bakterien |
|---|---:|---:|---:|---:|
| **P171 Elterntaxon** | 100 | 100 | 100 | 100 |
| **P225 Taxonname / P105 Rang** | 100 | 100 | 100 | 100 |
| **P846 GBIF-ID** | 100 | 99 | 100 | 94 |
| **P815 ITIS-ID** | 97 | 94 | 98 | 88 |
| **P685 NCBI-ID** | 84 | 89 | 86 | 94 |
| **P1843 Trivialname (de)** | 94 | 98 | 78 | 12 |
| **P141 IUCN-Status** | 95 | 94 | 94 | 0 |
| P2067 Masse | **6** | **36** | 0 | 0 |
| P2050 Spannweite | 9 | 5 | 0 | 0 |
| P2974 Habitat | 8 | 2 | 0 | 0 |
| P1034 Nahrung | 1 | 1 | 0 | 1 |
| P2043 Länge / P2048 Höhe | 0 | 0 | 0 | 0 |

**Befund — Wikidata ist ein Namens- und Verweis-Register, keine Merkmalsdatenbank.**
Taxonomie, Namen und Fremdschlüssel sind praktisch lückenlos; messbare Merkmale sind
fast nicht vorhanden. Die offene Frage aus Abschnitt 8 („reicht Wikidata allein?") ist
damit **beantwortet: nein.**

**Konsequenz für die Architektur — Rollenteilung statt einer Quelle:**

- **Wikidata = Rückgrat.** dewiki-Filter, Elterntaxon-Kette (Lebensbaum), Namen,
  IUCN — und vor allem die **Fremdschlüssel**, die zu 94–100 % da sind. Genau die sind
  die Tür zu den Merkmalen.
- **Merkmale = zweite Quelle, über die Fremdschlüssel angebunden.** Zu prüfen in 1.1b,
  in dieser Reihenfolge: **AVONET** (Vögel, ~11.000 Arten, Masse + Flügel + Tarsus —
  außergewöhnlich vollständig), **PanTHERIA** und **EltonTraits** (Säuger: Masse,
  Ernährungsweise), **AmphiBIO** (Amphibien), **FishBase** (Fische, offene API).
  Alles publizierte, offen herunterladbare Datensätze — für einen CI-Lauf besser
  geeignet als eine API mit Ratenbegrenzung.
- **Wirbellose, Pflanzen, Pilze, Mikroben** bleiben ohne Merkmalsquelle. Dort tragen
  Kladen-Regeln (b) und Habitat-Rückwärtslauf (d) allein — mit entsprechend
  niedriger Konfidenz, die im Katalog ausgewiesen wird. Das ist kein Mangel der
  Umsetzung, sondern der Stand der offenen Daten, und muss so berichtet werden.

**Zweiter Messbefund — die Ernte muss anders geschnitten werden.** Abfragen mit der
Pfad-Eigenschaft `wdt:P171*` laufen bei großen Kladen in den 60-Sekunden-Timeout des
Endpunkts (Fische, Insekten, Weichtiere, Bedecktsamer, Pilze fielen alle aus; Säuger,
Vögel, Amphibien, Bakterien liefen durch). Aggregate über *alle* Taxa scheitern
grundsätzlich (502 nach ~35 s), begrenzte Abfragen sind dagegen schnell (200 Arten in
0,7 s). Schritt 1.1 erntet deshalb **top-down über direkte `P171`-Kanten Ebene für
Ebene** statt über Pfad-Ausdrücke — das ist billig, parallelisierbar und läuft nie in
den Timeout.

*Rohdaten und Skript: nicht eingecheckt (Messung, kein Artefakt). Reproduzierbar über
die in 1.1 zu bauende Ernte mit `--report`.*

---

## 6 · Phasenplan

Reihenfolge nach Abhängigkeit **und** nach Netzbedarf: Phase 0 ist vollständig ohne
Netzzugang machbar und liefert schon ein lauffähiges Ende-zu-Ende-System. Erst Phase 1
braucht Wikidata.

### Phase 0 — Fundament (kein Netz nötig)

**0.1 · Schlüssel-Ebene entkoppeln — ✅ erledigt 2026-08-01**
*Modell: Sonnet* (mechanisch, eng spezifiziert) · *Netz: nein* · *blockiert alles Weitere*

`formKey()`/`formName()` als Übersetzungsschicht über dem bereits vorhandenen `key` aus
`app/archetypes.js`; `formIcon()`, `rarityOf()` und `kingdomOf()` nehmen jetzt Schlüssel
**oder** Namen (idempotent). `FORM_KINGDOM`/`FORM_STORY` werden ohnehin aus `TREE`
abgeleitet und stehen seither direkt unter dem Schlüssel; `TREE` bekommt seinen
Schlüssel in einer Zeile abgeleitet statt in 65 Einträgen von Hand. `discovered` und
`discoveryLog` speichern Schlüssel, alte Spielstände werden beim Laden durch `formKey()`
migriert. Neu: `archIcon(a)` als einzige Stelle, die den Sonderfall erzeugter Formen
(kein echter Schlüssel) behandelt.

*Kleiner als geplant:* der Zugriff lief schon fast vollständig über zwei Akzessoren
(`formIcon`, `rarityOf`) — keine Migration durch die halbe App, sondern drei Akzessoren,
zwei abgeleitete Tabellen und die Spielstands-Migration. Die Tabellen selbst bleiben
namensindiziert (Daten unverändert, minimaler Diff).

*Gate:* `npm run key-check` (neu, 5 Prüfungen K1–K5: Schlüssel eindeutig, keine
verwaisten Tabellen-Einträge, jeder Lebensbaum-Ast löst auf, jede Form hat ein Icon,
kein Name doppelt im Baum) — 65 Formen, 65 Äste, grün. Dazu unverändert grün:
`app-parity`, `mf-fidelity`, `app-world-smoke` (Browser), `exemplar-check`,
`story-check`, `influence-check`, `ui-calm-check`.

**0.2 · Katalog-Format + Bootstrap-Katalog — ✅ erledigt 2026-08-01**
*Modell: Opus (zusammen mit 0.3 gebaut)* · *Netz: ja (besser als geplant)*

`tools/build-catalog.mjs` erzeugt `app/catalog.js` im Format aus Abschnitt 4. Datenquelle
sind die 65 kuratierten „≈ in echt"-Zuordnungen aus `app/exemplar.js` — **aber QID,
wissenschaftlicher Name, Rang und Elterntaxon-Kette werden live gegen Wikidata
aufgelöst**, da der Netzzugang schon stand. Der Bootstrap hat damit bereits die
Datenqualität des späteren Katalogs; nur die Genom-Positionen sind noch Bauplan-Prototypen
(deshalb trägt jedes Gen Konfidenz 2, keines Konfidenz 3).

Ergebnis: 65 Einträge, **64 mit Wikidata-QID**, 44 mit wissenschaftlichem Namen, 30,5 KB.

*Drei Funde beim Bauen:*
1. Nodes eingebautes `fetch()` liest `HTTPS_PROXY` nicht — 403 „Host not in allowlist",
   obwohl der Host erlaubt ist. Das npm-Script setzt deshalb `NODE_USE_ENV_PROXY=1`.
2. Ohne Drosselung läuft der Lauf zuverlässig in ein 429 (die Elterntaxon-Ketten machen
   bis zu 30 Anfragen je Art). Jetzt 120 ms Mindestabstand plus exponentielles Zurückziehen.
3. `wbgetentities&sites=dewiki` folgt **keinen Weiterleitungen** — 12 von 65 kuratierten
   Titeln blieben so ohne QID. Auflösung läuft jetzt über die Wikipedia-API mit
   `redirects=1`; das hebt die Quote von 53 auf 64. **Für Schritt 1.1 relevant:** dort ist
   die Richtung umgekehrt (Wikidata → dewiki-Sitelink), das Problem entfällt.

*Ehrlicher Stand:* die kuratierten Vorbilder sind grob — nur 3 Einträge haben Artrang, der
Rest ist Klasse/Ordnung/Familie oder gar kein Taxon („Kräuter", „Strauch", „Plankton",
„Würmer"). Genau das behebt die Ernte in 1.x.

*Gate:* `npm run catalog-check` (C1–C8: Kopf + Gen-Liste, Eintrags-Form, Bauplan-Schlüssel,
byGroup-Index, Sortier-Invariante fürs Sharding, keine Art doppelt, Größenbudget,
Rechenzeit-Budget) — grün.

**0.3 · Zweistufiger Matcher — ✅ erledigt 2026-08-01**
*Modell: Opus* · *Netz: nein*

`nearestReal(t, groupKey, w)` in `app/index.html`: nach der Bauplan-Gruppe die nächste
reale Art *innerhalb* der Gruppe, mit denselben Selektionsgewichten wie Stufe 1. Ergebnis
hängt als `real: {e, dist}` am `classify()`-Rückgabewert; der Bauplan-Name bleibt als
`form` immer erreichbar (Chronik, Genbuch und Erklärtexte sprechen über den Bauplan, nicht
über die Art). Der „≈ in echt"-Verweis in der Wesen-Karte kommt jetzt aus dem Katalog über
den **gemessenen Genom-Abstand** statt aus der statischen Name→Name-Tabelle, die zu jedem
Bauplan immer dasselbe Vorbild zeigte.

**Wann kippt die Benennung?** Die Bedingung steht in den Daten, nicht im Code:
`CATALOG_NAMES = CAT.stage === "full"`. In der Bootstrap-Stufe hat jede Gruppe genau
*einen* Eintrag — Stufe 2 hätte keine echte Wahl, und der grobe Vorbild-Name („Säugetier")
wäre ein Rückschritt gegenüber dem Bauplan-Namen („Fell-Warmblüter"). Sobald Schritt 1.4
`stage: "full"` liefert, kippt die Benennung ohne Code-Änderung auf die reale Art.

**Bewusst offen gelassen:** die Konfidenz je Gen geht noch *nicht* in den Abstand ein. Ein
aus dem Familien-Median imputierter Wert sollte weniger zählen als ein gemessener — aber im
Bootstrap tragen alle Einträge Konfidenz 2, eine Gewichtungskurve wäre hier nicht prüfbar.
Kalibrierung in 1.4 an echter Konfidenz-Streuung, statt jetzt eine Zahl zu erfinden.

*Gemessen:* 0,12 µs je Katalog-Eintrag → **16.686 Einträge je Bauplan-Gruppe passen ins
2-ms-Budget** (unterhalb eines 60-Hz-Bildschritts). Die Zweistufigkeit trägt den Zielumfang
damit mit großem Abstand.

*Im Browser verifiziert* (Playwright, echte Seite): Fell-Genom → Bauplan „Fell-Großtier",
reale Art „Bär (Ursidae)", Abstand 0,136. Pflanzen-Genom → „Strauch", 0,151. Aal-Genom →
„Aal (Anguillidae)", 0,164.

*Gate:* `app-world-smoke` (Browser), `app-parity`, `mf-fidelity`, `key-check`,
`catalog-check`, `exemplar-check`, `story-check`, `influence-check`, `ui-calm-check` — alle
grün. `tools/lib/app-core.mjs` musste um Stufe 2 erweitert werden, sonst brach der
Node-seitige Kern-Extraktor (von `influence-check` gefunden).

### Phase 1 — Datenpipeline (Netz nötig)

**1.1 · Wikidata-Ernte (Rückgrat) — ⚙️ läuft (2026-08-01)**
*Modell: Sonnet* · *Netz: ja*

`tools/wikidata-harvest.mjs`: adaptiver Top-down-Ernter. **Zwei Strategien**, je Klade
gewählt: schneller Pfad (`P171*` + `LIMIT/OFFSET`, funktioniert direkt für mittelgroße
Kladen) oder — schlägt die erste Seite fehl — **Zerlegung** in direkte Kinder (`P171`
einzelner Hop, immer schnell) und rekursive Verarbeitung jedes Teils. Nie gemischt (sonst
Doppelzählung). Resumierbar über `tools/.harvest-state.json`.

25 verifizierte Wurzel-Kladen (Tier/Pflanze/Pilz/Mikrobe/Protist-Gruppen — Liste in der
Datei) — **verifiziert per `wbsearchentities`**, nicht aus dem Gedächtnis geraten: der
erste Versuch mit geratenen QIDs traf u. a. „Ilona Koutny" und „Taylor Dayne" statt
Kladen, s. Commit-Historie.

**Zwei Funde beim Bauen:**
1. **Client-Timeout nötig:** der Server braucht bis zu 40-55s, um eine zu große Klade
   mit 502/504 abzulehnen. Ein 20s-Client-Timeout löst dieselbe (sichere) Zerlegung
   deutlich schneller aus.
2. **`?tLabel` ist der deutsche Anzeigename, nicht der wissenschaftliche Name** — bei
   bekannten Arten z. B. „Eisbär" statt „Ursus maritimus". Für Schritt 1.1b (Verknüpfung
   über Gattung+Art) und das Katalog-Feld `sci` unbrauchbar. Fix: `P225` explizit
   mitgezogen (`?sci`), Ernte dafür einmal neu gestartet (kostete den bis dahin
   gesammelten Stand, ~1.750 Arten — bewusst in Kauf genommen, da sonst die
   Merkmals-Verknüpfung in 1.1b auf falscher Grundlage gelaufen wäre).

*Gate:* `npm run wikidata-harvest -- --report` gibt den Ernte-Stand aus (Artenzahl,
Warteschlange, fertige/zerlegte/fehlgeschlagene Kladen).

**1.1b · Merkmalsquellen anbinden — ⚙️ Prototyp steht (2026-08-01)**
*Modell: Sonnet* · *Netz: ja (github.com/raw.githubusercontent.com — bereits Trusted-Default)*

**Messbefund vorab (5a):** die ursprünglich genannten Quellen (AVONET, PanTHERIA,
EltonTraits, AmphiBIO, FishBase) liegen bei Figshare/Dryad/FishBase — diese Hosts sind
aus der Umgebung **nicht erreichbar** (nur `wikidata.org`/`*.wikipedia.org` wurden
freigeschaltet). Gefunden: der GitHub-Spiegel **`RS-eco/traitdata`** (R-Paket, 32
gebündelte Fachdatensätze) liegt auf `raw.githubusercontent.com` — das ist bereits Teil
der Standard-Trusted-Liste, keine weitere Freischaltung nötig.

**Format-Hürde:** die Dateien sind `.rda` (R-Serialisierung). Kein R-Interpreter in der
Umgebung. Mit `pyreadr` (Python) laufen **PanTHERIA** (5510 Arten, u. a. Körpermasse) und
**EltonTraits Säuger+Vögel** (5494 + 10009 Arten, Ernährungs-/Aktivitätsprofil) sauber
durch. **AmphiBIO, fishmorph, lizard_traits scheitern** — ihre Freitext-Zitationsspalten
enthalten Windows-1252-Bytes, an denen sowohl `pyreadr` als auch die Alternative `rdata`
scheitern (letztere wirft nach etlichen Dekodier-Warnungen einen `AssertionError`). Offener
Rest für eine Umgebung mit echtem R oder eine gezielte Byte-Vorfilterung.

**Verknüpfungsquote** (`tools/build-traits.mjs`, gegen die bis dahin geernteten Arten,
klade-gefiltert — eine Quelle nur an der Klade zu messen, zu der sie etwas sagt):
vorläufig mit dem Label statt des wissenschaftlichen Namens gemessen (11-15 % Säuger, 0 %
Vögel — s. o., Bug), **wird nach der 1.1-Korrektur (P225) neu gemessen**, sobald die
Ernte genug Vögel gesammelt hat.

**Lizenz — ehrlich offen:** das R-Paket ist GPL-3 (irrelevant, wir nutzen keinen
Paket-Code). Die zugrunde liegenden Datenpapiere (Ecology/Ecological Archives) haben
eigene, in dieser Umgebung nicht direkt nachprüfbare Lizenzbedingungen (Figshare/Dryad
blockiert) — vor einem produktiven Einsatz einzeln zu bestätigen. `tools/build-traits.mjs`
trägt diesen Hinweis explizit im Kopfkommentar; das Skript ist als **Prototyp** markiert.

*Gate:* `node tools/build-traits.mjs` berichtet Verknüpfungsquote je Quelle und Klade
(kein npm-Script — hängt an einer optionalen Python-Abhängigkeit, `pip install -r
tools/requirements-traits.txt`, bewusst nicht Teil des normalen Gate-Zyklus).

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
