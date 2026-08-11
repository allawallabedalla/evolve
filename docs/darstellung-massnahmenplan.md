# Maßnahmenplan: Artname, Silhouette und Bauplan-Satz wieder zur Deckung bringen

**Grundlage:** `docs/darstellungs-audit.md` (Befunde P8–P10, N1–N8).

> ## Stand: Band A abgearbeitet, B1 angebunden
>
> | | vorher | jetzt |
> |---|---|---|
> | **P8** Beinzahl der benennbaren Art gegen die Zeichnung | 8.146/24.846 (32,8 %) | **609/24.846 (2,5 %)** |
> | **P9** Live-Stichprobe Name gegen Silhouette | 71/174 (40,8 %) | **1/142 (0,7 %)** |
> | **P10** fehlende Klassen-QID | 17.773/42.024 | **0** ✓ |
> | **P4** Tautologie im „≈"-Verweis | 12/12 (100 %) | **0** ✓ |
> | **P1b** Insekten mit falscher Beinzahl | 4.459/6.398 (70 %) | **0** ✓ (war Messfehler) |
> | **N3** Arten ausserhalb jedes Bauplans ihrer Klade | 34,7 % | **0** ✓ |
> | **N7** Anteil Rauschen im Artabstand | 46,5 % | **28,3 %** |
> | **P7b** hohes Flug-Gen ohne Flug im Satz | 17,0 % | **7,7 %** |
> | Eintraege ohne auflösbare Klade | 624 | **201** |
> | Bauplaene ohne realen Artnamen (P5) | 24 | **22** |
> | Gruppen unter 25 Arten (P5b) | 5 | **3** |
> | Arten mit gemessener Koerpermasse | 2.728 | **7.906** (wirkt beim naechsten Bau) |
>
> | **P6** Merkmal gezeichnet, im Text nicht genannt | 15/303 (4,95 %) | **0/7** ✓ |
> | **P7a** als Flieger beschrieben ohne Flug-Gen | 436 (4,6 %) | **0** ✓ |
>
> **P7a hat unterwegs zugenommen, bevor es auf 0 fiel** (47 → 436 → 0). Die alte Schwelle
> 0,3 lag auf dem 1. Perzentil: 46 der 47 Treffer waren Rundungsrauschen bei `wing` 0,298.
> Die abgeleitete Schwelle (0,40, Mitte der größten Lücke zwischen den Prototyp-Werten)
> fand dann 436 echte Fälle — flugunfähige Laufkäfer in „Fluginsekt · Segler" und
> Bodenvögel in „Flatterer · Vogel". Die **Flügel-Schranke** (s. u.) hat sie aufgelöst.
>
> Umgesetzt: **A0** · **A1** · **A2** · **A3** · **A4** · **B1** (Anbindung) · **C1**
> (als `npm run pdca`) · Odonata/Amoebozoa-Kladen · drei Prüfstand-Korrekturen.
> Offen: **B2** (gemessen blockiert) · **B3** · **C2**–**C4**.
> Der Mantelbussard steht jetzt in „Flatterer · Vogel".
>
> **Laufender Zyklus:** `npm run pdca` misst alle Prüfstände gegen
> `docs/pdca-stand.json` und bricht bei jeder Verschlechterung ab.

Jede Aufgabe nennt: was, wo, welchen Befund sie schließt, wie sie sich selbst prüft — und
**was danach unsicher bleibt.** Die Restunsicherheiten sind, wo möglich, gemessen und
nicht geschätzt; sie sind der eigentliche Zweck dieses Dokuments.

---

## Reihenfolge und Abhängigkeiten

```
A1 regroup ──┬─→ A2 conf-Gewicht ──→ A3 Anzeige-Auflösung      (ohne Netz machbar)
             └─→ A4 lineage/klade
B1 Elton-Masse ──→ B3 Prototypen nachziehen                    (braucht Netz)
B2 weitere Merkmalsquellen ──┘
C1–C4 unabhängig, jederzeit
```

**A2 darf nicht ohne A3 ausgeliefert werden** — Begründung unter A2, das ist der wichtigste
Befund dieses Plans.

---

## A · Ohne Netz sofort machbar

### A1 · `tools/regroup-catalog.mjs` — Klade-Schranke in die Daten

Neues Werkzeug. Liest `app/catalog.js`, rekonstruiert die Vorfahren-Hülle (Code steht in
`plausi-check.mjs`), vergibt `group` nach der Tabelle *Klade → erlaubte Baupläne* neu und
schreibt Datei plus `byGroup` zurück. Kein Netz, kein Harvest, deterministisch, diffbar.

- **Schließt:** P8 (32,8 %), P9 (40,8 %) — und zwar in den Daten, nicht nur in der Anzeige.
- **Prüft sich durch:** `npm run plausi-check` (P8/P9 müssen auf ~0 fallen),
  `catalog-check`, `key-check`, `coverage-check`.
- **Aufwand:** ~150 Zeilen + ein Lauf.

**Restunsicherheiten** *(gemessen — die Zahl sagt, was einer Gruppe an klade-passenden
Arten bliebe, ohne den Zustrom aus anderen Gruppen)*:

| Bauplan | jetzt | klade-passend | Risiko |
|---|---|---|---|
| Kleines flinkes Tier 🐭 | 3.987 | **0** | muss komplett aus dem Säuger-Pool neu gefüllt werden |
| Schwamm 🧽 | 54 | **0** | **unheilbar — siehe C2** |
| Chamäleon · Tarnjäger 👁️ | 1 | **0** | Bauplan ohne jede Art |
| Gepanzerter Koloss 🦏 | 41 | 11 | unter der P5b-Schwelle (25) |
| Aktiver Großjäger 🐺 | 78 | 22 | unter der P5b-Schwelle |
| Generalisten-Tier 🦥 | 623 | 25 | genau auf der Schwelle |

- **6 Baupläne fallen unter 25 Arten**, 3 auf null. Ob sie sich aus dem Zustrom wieder
  füllen, hängt davon ab, wie `nearestInKingdom()` die 4.923 Säuger auf die 12 Säuger-
  Baupläne verteilt — **das ist die Zahl, die dieser Plan nicht vorhersagen kann.**
  Erst der Lauf zeigt es. → Abbruchkriterium vorher festlegen: reißt P5b bei mehr als
  8 Gruppen, ist die Bauplan-Aufteilung selbst das Problem (dann B3/C1 vorziehen).
- Rarität, Lebensbaum und Abdeckungs-Metrik ändern sich mit — `docs/rarity.json`,
  `docs/tree-of-life.json` und `docs/coverage.json` müssen neu erzeugt werden.
  Ungewiss, ob dabei Herausforderungen aus `app/challenges.js` unerfüllbar werden.
- Die Tabelle *Klade → Bauplan* ist Handarbeit. 13 Zeilen liegen als `KLADEN_BEINE` /
  `DRAWN_LEGS` in `plausi-check.mjs`; die Aufteilung *innerhalb* der Säuger
  (12 Baupläne) ist damit **nicht** abgedeckt und bleibt Ermessen.

> **Ergebnis (umgesetzt).** 11.009 von 42.024 Arten umgezogen. P8 32,8 % → **2,5 %**,
> P9 40,8 % → **1,4 %**, N3 34,7 % → **0**.
>
> **Die Risikotabelle oben war zu pessimistisch, und zwar aus einem benennbaren Grund:**
> sie zählte nur, was einer Gruppe *bleibt*, nicht den Zustrom. Tatsächlich füllten sich
> sechs bis dahin leere Baupläne (Fluginsekt +2.816, Kraut +484, Nadelbaum +265, Wurm
> +137, Laufvogel +56, Polster-Kältepflanze +1). **Baupläne ohne Art: 24 → 21. Gruppen
> unter der P5b-Schwelle: 5 → 3.** Beides *besser* als vorher, nicht schlechter.
>
> „Kleines flinkes Tier" lief nicht leer, behielt aber 289 Arten **ohne auflösbare
> Klade** — nicht, weil dort Säuger stünden. Insgesamt 624 Einträge (1,5 %) bekommen
> keine Klade und bleiben deshalb unangetastet: ihre Ketten enden, bevor eine Zielklade
> erreichbar ist (Libellen, Meeresschildkröten). Das ist eine Lücke des rekonstruierten
> Elterngraphen, keine Entscheidung — und der Grund, warum P4 noch 1/10 meldet.
>
> Zwei Baupläne liefen wirklich leer, beide aus demselben Grund: **der Katalog enthält
> keine Grünalgen und keine Schwämme.** Die Gruppen hielten Moose bzw. Quallen. Erntelücke
> (C2), von der Schranke nur sichtbar gemacht.
>
> Die Schranke wurde bewusst als *Schranke* gebaut, nicht als Neuzuordnung: der eingebaute
> Reproduktions-Test zeigt, dass die unveränderte Logik über die veröffentlichten Genome
> nur **71,9 %** der gespeicherten Gruppen trifft — der Rest ist das Gründer-Los, das
> *nach* der Zuordnung aufgebracht wird. Eine Neuzuordnung hätte 28 % der Arten aus einem
> Grund bewegt, der mit der Klade nichts zu tun hat.

### A2 · `nearestReal()` zusätzlich mit `e.conf` gewichten

`w[g] * (e.conf[g] / 3)` — Gene, deren Katalogwert nie erhoben wurde, zählen null statt
30 %. Eine Zeile in `app/index.html`.

- **Schließt:** N7 (46,5 % des Artabstands sind Rauschen aus dem Gründer-Los).
- **Prüft sich durch:** `npm run naming-audit` (N7 muss unter 25 fallen).
- **Aufwand:** eine Zeile + `bundle-app`-Lauf.

**Restunsicherheit — und sie ist größer als die Maßnahme** *(gemessen an 59 Karten)*:

| | vorher | mit `conf`-Gewicht |
|---|---|---|
| Median-Vorsprung vor dem Zweiten | 0,58 % | **0,32 %** |
| Median Arten im Gleichstand (≤1 %) | 2 | **3** |
| Angezeigter Name ändert sich | — | **in 81 % der Fälle** |

> **Die Gewichtung macht die Artwahl nicht sicherer, sondern beliebiger.** Das ist kein
> Fehler der Maßnahme, sondern ihr Beweis: nimmt man das Rauschen heraus, bleibt bei
> 99,1 % Kladen-Werten nichts übrig, was zwei Arten derselben Klade noch unterscheiden
> könnte. Der Vorsprung sinkt, weil er vorher aus dem Rauschen kam.

Folgen daraus:
- **A2 ohne A3 auszuliefern wäre eine Verschlechterung** — der Name würde häufiger
  wechseln und wäre noch weniger begründet. Die beiden gehören in einen Release.
- 81 % Namensänderung heißt: jeder Spielstand zeigt nach dem Update andere Arten.
  Chronik-Einträge (`app/story.js`) und Genbuch-Funde beziehen sich auf Namen — ob sie
  das überstehen, ist ungeprüft.

> **Ergebnis (umgesetzt).** N7 46,5 % → **29,3 %** (Schwelle 25 — weiter gerissen: die
> conf-2-Werte der bedingten Gene zählen zu Recht weiter mit, sie *sind* Information auf
> Kladen-Ebene). Die Vorhersage hielt: der Median-Vorsprung liegt weiter bei **0,5 %**.
>
> **Nicht vorhergesehen — eine echte Regression:** die zusätzliche Multiplikation je Gen
> riss das 3-ms-Budget aus `catalog-check` C8 (3,20 ms). Behoben, indem die Konfidenz je
> Eintrag einmal vorbereitet wird (`confPrep`) und Gene mit conf 0 ganz übersprungen
> werden — da 41,5 % aller Genwerte auf conf 0 stehen, läuft die Suche danach über
> *weniger* Gene als vorher. Jetzt 2,83 ms.
>
> **Zweite Lehre:** `naming-audit` maß nach der Änderung zunächst weiter die alte Formel
> und meldete N7 fälschlich als *gestiegen*. Ein Prüfstand, der seine eigene Annahme statt
> der App misst, ist kein Prüfstand. N6/N7 erkennen jetzt am Quelltext, ob das
> conf-Gewicht aktiv ist; P4 liest die Kladen-Tabelle aus `app/index.html`.

### A3 · Anzeige auf die Auflösung zurücknehmen, die die Daten hergeben

Überschrift zeigt die **Klade** („ein Greifvogel"), die Art nur als Beispiel darunter —
oder die Art bleibt und der „≈ in echt"-Verweis zeigt die Klade („≈ Greifvögel ↗").

- **Schließt:** P4 (12 von 12, die Tautologie im Screenshot), entschärft N1/N6.
- **Prüft sich durch:** `plausi-check` P4 muss auf 0.
- **Aufwand:** `updateSpeciesWiki()` + die Titelzeile; die Klade steht nach A4 im Eintrag.

**Restunsicherheiten:**
- **Produktentscheidung, keine technische.** „Mantelbussard" ist konkreter und schöner
  als „ein Greifvogel" — der Verlust an Charme ist real und nicht messbar. Braucht deine
  Entscheidung, nicht meine.
- Welche Kladen-Ebene? „Greifvögel" (Familie) trägt mehr als „Vögel" (Klasse), aber die
  Ebene ist je Ast verschieden tief. Eine Regel dafür gibt es noch nicht.
- Die Namen sind Schlüssel für Lebensbaum, Rarität und Herausforderungen — eine zweite
  Namensebene darf diese Schlüssel nicht anfassen.

> **Ergebnis (umgesetzt) — die kleinere der beiden Varianten.** Die Überschrift bleibt der
> Artname, der „≈"-Verweis nennt die **Klade**: „Mantelbussard ≈ Vögel ↗". P4 12/12 →
> **1/10** (der Rest ist ein Eintrag ohne `klade`-Feld). `nearestReal()` liefert dazu
> `tie` (Arten praktisch gleichauf) und `margin`; beides steht im **Tooltip**, nicht in
> neuer sichtbarer Kopie — die Karte wird nicht unruhiger, aber wer nachsieht, erfährt es.
>
> **Die größere Variante bleibt offen und ist deine Entscheidung:** Klade als Überschrift,
> Art nur als Beispiel. Ebenso offen die Frage der Kladen-Ebene — die Tabelle nennt
> heute die Klasse („Vögel"), nicht die Familie („Greifvögel"), weil nur die Klasse aus
> dem Feld `klade` sicher ableitbar ist.

### A4 · `lineage` nicht mehr kürzen, `klade` mitschreiben

`build-catalog.mjs`: statt `slice(0, 12)` die Klassen-QID sichern, besser gleich ein Feld
`klade` (und `beine`) je Eintrag, beim Bau einmal aufgelöst.

- **Schließt:** P10 (bei 66,5 % der Tierarten fehlt die Klassen-QID) dauerhaft.
- **Prüft sich durch:** `plausi-check` P10 muss auf 0; die Hülle-Rekonstruktion kann raus.
- **Aufwand:** klein — aber siehe unten.

**Restunsicherheiten:**
- Braucht denselben Lauf wie A1. Ob das in `regroup-catalog.mjs` mitgeht (Hülle ist ja
  rekonstruierbar) oder erst bei der nächsten Ernte, ist eine Frage der Sauberkeit:
  eine rekonstruierte Hülle als „gemessene" Klade zu speichern, verwischt die Herkunft.
- `app/catalog.js` wächst (42.648 × 2 Felder). Die Datei ist heute 269 KB im Auslieferpfad.

> **Ergebnis (umgesetzt), mit Abstrich.** `regroup-catalog.mjs` schreibt `klade` (nur die
> QID) für 42.024 von 42.648 Einträgen; **P10 fällt auf 0**. `lineage` bleibt vorerst
> gekürzt — das zu ändern braucht den Katalog-Neubau. Die Herkunft steht ausdrücklich im
> Dateikopf: **rekonstruiert, nicht geerntet.** Die Datei wächst von 19,6 auf 20,3 MB
> (+3,7 %; die „269 KB" oben waren falsch — sie stammten aus einer verwechselten
> Dateigröße).

---

## B · Braucht Netz — schließt die eigentliche Datenlücke

### B1 · Körpermasse und Flugverhalten aus EltonTraits abbilden

`tools/lib/impute.mjs` bildet heute **genau ein** Merkmal ab (`massG → size`), und
`build-traits.mjs` liest aus `elton_birds.csv` nur `Diet.*`/`ForStrat.*` — die
Masse-Spalte derselben Datei bleibt liegen. Zusätzlich abbilden:
`BodyMass → size` (≈10.000 Vögel + 5.494 Säuger), `ForStrat.aerial → wing`,
`ForStrat.watbelowsurf → mobility`, `Diet.* → photosynthesis/metabolism`,
`Activity.Nocturnal → sense`.

- **Schließt:** N3 direkt (`size` ist das Gen, an dem der Bussard scheitert), N2 teilweise
  (`wing` bekäme erstmals gemessene Werte), N1 teilweise.
- **Prüft sich durch:** `naming-audit` N1/N3, `coverage-check`.

**Restunsicherheiten:**
- **Die Spaltennamen sind ungeprüft.** Der Traits-Cache ist gitignored und lag hier nicht
  vor; dass EltonTraits Körpermasse führt, ist Literaturwissen, nicht gemessen. Erster
  Schritt ist ein Blick in die CSV, nicht Code.
- **Lizenz ist offen** — der Kopf von `build-traits.mjs` sagt das selbst: „Dieses Skript
  ist ein Prototyp, kein produktionsreifer Import." Vor Auslieferung je Datensatz die
  Lizenz am Originalort bestätigen. Das ist ein Blocker, kein Detail.
- Die Abbildung *Merkmal → Gen* ist Modellierung, keine Messung: `ForStrat.aerial` ist
  ein Anteil (0–100), `wing` eine Flügelfläche. Die Umrechnung ist eine Annahme und
  gehört als solche dokumentiert (wie `sizeFromMassG()`).
- Selbst mit voller Elton-Abdeckung bleiben 8 der 10 Kern-Gene auf Kladen-Werten.
  **N1 wird gelindert, nicht geschlossen.**

> **Ergebnis (angebunden, wirkt beim nächsten Bau).** Die Spaltennamen stimmten:
> `BodyMass.Value` steht in beiden Elton-Dateien. Arten mit gemessener Körpermasse
> **2.728 → 7.906** (Vögel 64 %, Säuger 78 %).
>
> **Wie viel das ändert (gemessen):** die echte Masse weicht vom heute gespeicherten
> Kladen-Mittelwert bei Vögeln im Mittel um **0,169** ab (Median über alle 0,134, Maximum
> 0,435) — **43 % liegen über `novelThreshold` (0,15).** Der Kladen-Mittelwert trägt bei
> Vögeln also kaum Information über die Größe. Genau daran fielen große Vögel aus ihrem
> Bauplan.
>
> **Bewusst nicht von Hand in `app/catalog.js` gepatcht:** `size` geht in den
> Imputations-Korpus ein, aus dem die übrigen Gene abgeleitet werden — ein Teil-Update
> stellte gespeicherte Werte gegen den Korpus, aus dem sie stammen. Wirksam wird es bei
> einem Neubau (braucht `tools/.harvest-state.json`).
>
> **`ForStrat.aerial → wing` wurde nach Prüfung verworfen.** Die Spalte sagt, welcher
> *Anteil* der Nahrungssuche in der Luft stattfindet, nicht wie groß die Flügelfläche ist.
> Ein Buchfink sucht am Boden und hat trotzdem Flügel — die Abbildung gäbe den meisten
> Vögeln `wing` ≈ 0 und führte einen neuen Fehler ein, statt N2 zu beheben. Braucht eine
> eigene Eichung (Spannweite/Fläche), die diese Quelle nicht hergibt.

### B2 · AmphiBIO, fishmorph, lizard_traits entsperren

Liegen im selben Spiegel, scheitern nur an Nicht-UTF-8-Bytes in Zitationsspalten.
Byte-weise Spalten-Vorfilterung oder eine Umgebung mit R-Interpreter.

- **Schließt:** N1 für Amphibien, Fische und Reptilien — heute drei komplett ungemessene
  Kladen.
- **Restunsicherheit:** ob die Vorfilterung reicht, ist unbekannt; `pyreadr` *und* `rdata`
  sind beide daran gescheitert. Zeitaufwand schwer schätzbar, Ausgang offen.

### B3 · Prototyp-Zahlen aus dem Katalog nachziehen

Statt „halb Kaskaden-Geometrie, halb erreichbare Genome" (Methode 2 in
`archetypes.js`) der Median der realen Arten, die nach A1 zu dieser Form gehören.
Namen, Emojis, `FICON`, `TREE`, Herausforderungen bleiben unverändert — nur die
Koordinaten wandern. „Flatterer · Vogel" bekäme die echte Größenspanne der Vögel statt
`size` 0.10.

- **Schließt:** N3 strukturell.
- **Restunsicherheiten:**
  - **Zirkelschluss-Gefahr:** die Gruppen aus A1 bestimmen die Prototypen, die Prototypen
    bestimmen die Gruppen. Braucht entweder eine feste Kladen-Zuordnung als Anker (dann
    ist es kein Zirkel) oder eine deklarierte Iterationszahl.
  - Verschiebt die **Erreichbarkeit** aller Formen — `rarity.json` muss neu, und
    Herausforderungen, die auf seltene Formen zielen, können unerfüllbar oder trivial
    werden.
  - Nach B1 ausführen, sonst zieht man auf Kladen-Mittelwerte nach.

---

## C · Unabhängig, jederzeit

### C1 · Erreichbarkeit als Dauer-Regel

N8 steht schon im `naming-audit`; als Gate in den Build-Zyklus aufnehmen. Reißt sie, ist
das ein **Engine**-Befund: „Flatterer · Vogel" ist zu 0,33 % erreichbar und hält 4.868
Namen. Zu prüfen wäre, ob `fitness()` Flügelfläche bei `size > 0.3` überhaupt je belohnt.
- **Restunsicherheit:** wenn nein, ist der fehlende Großvogel ein Physik-Parameter — ein
  Eingriff in `physics.json`, der die gesamte Ökologie verschiebt. Deutlich größer, als
  er von außen aussieht.

### C2 · Datenlücken der Ernte schließen

**Gemessen: 0 Schwämme (Porifera) im ganzen Katalog.** Die Gruppe „Schwamm" 🧽 hält
stattdessen Quallen — `Chiropsella bart` ist eine Würfelqualle. Das ist keine
Fehlgruppierung, sondern eine fehlende Ernte; A1 kann es nicht heilen, es macht die
Gruppe nur leer.
- Ebenso dünn: Archaeen 34, Farne 128, Nadelbäume 289.
- **Restunsicherheit:** braucht eine gezielte Nachernte je Klade. Ob die dewiki-Abdeckung
  dafür überhaupt reicht, ist ungeprüft.

### C3 · `weightFloor` / `weightSharpen` neu kalibrieren

78,4 % der Gewichte liegen auf dem Boden, weil der Gradient **am Optimum** gemessen wird.
Statt der Ableitung die Fitness-Kosten einer **endlichen** Auslenkung messen — das tun
`unusedBurden()` und `founderSpreads()` im selben Repo bereits.
- **Restunsicherheit:** ändert die Formwahl global. Kein Befund sagt, dass das *besser*
  wird — nur, dass die heutige Gewichtung nichts tut. Braucht einen A/B-Lauf gegen
  `spectrum-check` und `distribution-check`, bevor man es glaubt.

### C4 · `specificityBonus` 0.55 senken oder ersetzen

Kippt in 13,6 % der Fälle die Reihenfolge. Sauberer: Abstand über *alle* Gene mitteln und
ungenannte Gene mit einem Ruhewert behandeln — dann braucht es gar keinen Ausgleich.
- **Restunsicherheit:** der Bonus bildet die Reihenfolge der alten Kaskade nach. Ihn zu
  entfernen heißt, diese Reihenfolge aufzugeben — mit unbekannter Wirkung auf die
  Formverteilung. Nur zusammen mit C3 und einem Vorher/Nachher-Lauf sinnvoll.

---

## PDCA-Runden — was der laufende Zyklus gefunden hat

### Runde 3 · `world/physics-v2.json` — der Welt-Kern rechnete mit NaN

Kam nicht aus einer Regel, sondern aus einer Notiz einer früheren Sitzung: „`census-check`
fällt vorbestehend aus (fehlende Schlüssel in `world/physics-v2.json`)". Nachgeprüft —
und der Befund war größer als die Notiz:

```
fitness(0.5er-Genom, world/physics-v2.json) = NaN
```

**Zehn Schlüssel fehlten** (`photoYield`, `photoWaterSat`, `landDesiccation`,
`disturbStructureLoss`, `fireresWoodCost`, fünf `amphibious*`), und alle zehn werden in
`engine/fitness.ts` dereferenziert. `undefined · x = NaN`, und NaN pflanzt sich durch die
ganze Bewertung fort. Der Welt-Kern lief **ohne wirksame Selektion**: die Gene drifteten
zur Mitte (Photosynthese-Mittel 0,35–0,60 statt 0,06–0,11 mit echter Fitness).

**Drei von vier Prüfständen meldeten dabei OK.** `rarity-check`, `seed-check` und
`world-ecology-check` liefen grün auf einer Welt, die gar nicht rechnete —
`world-ecology-check` gab „Protist · gepanzert, geflügelt, leuchtend" aus, ein reines
Drift-Artefakt. Nur `census-check` fiel auf (0 Arten).

#### Warum Vollabgleich und nicht nur die zehn Schlüssel

Die Dateien wichen zusätzlich in **vier Werten** ab — drei skalar, einer verschachtelt
(`maintenance.size` 0,14 statt 0,22; den hatte meine erste Analyse übersehen, der Check
fand ihn):

```
defenseFromArmor     0,45 vs 0,46
defenseFromMobility  0,35 vs 0,18     ← Faktor 2
defenseFromCamo      0,30 vs 0,50
maintenance.size     0,14 vs 0,22
```

Entscheidend war nicht die Prüfstands-Lage — beide Reparatur-Varianten machen alle vier
Checks grün — sondern **dass die App beide Dateien gleichzeitig lädt**:

```
app/index.html:473    const PHYS = { … }                    ← physics.json
app/index.html:8797   PHYS2 = fetch("./core/physics-v2.json")
```

Dieselbe Kreatur wird von der Kreatur-Simulation nach der einen und vom Welt-Kern nach
der anderen Physik bewertet. Über 4.000 Zufallsproben:

| | mittlere Abweichung | Maximum |
|---|---|---|
| nur die 10 Schlüssel ergänzen | **2,25 %** | 6,3 % (0,2989 gegen 0,3620) |
| voll abgleichen | **0,00 %** | **0,000e+0** |

Dazu kommt: `physics.json` ist die Datei, gegen die **23 der 27 Prüfstände** validieren
(`reality` 21/21, `distribution` B3 auf dem Baseline-Wert, Orakel-Parität 1,388e-17).
`physics-v2.json` wurde von nichts validiert — seine vier Konsumenten liefen auf NaN. Die
vier abweichenden Werte tragen keinen Kalibrier-Beleg: `fitted-params.json` enthält keinen
davon, `Stufe 3b` hat sie nicht angefasst.

#### Ergebnis

| | vorher | jetzt |
|---|---|---|
| `census-check` | **FAIL**, 0 Arten | **OK**, 5 isoliert / 2 verbunden |
| `rarity-check` Formen im Sweep | 46 | **61** |
| max \|Δfitness\| zwischen beiden Physiken | NaN | **0,000e+0** |

`world/physics-v2.json` wird jetzt von `tools/physics-sync.mjs` **erzeugt statt gepflegt**.
Zwei neue Regeln im PDCA-Umfang: **PHY** (beide Physiken bitweise gleich) und **CEN**
(`census-check`). Gegenprobe: mit dem alten Stand melden beide Regression und der Lauf
endet mit Exit 1 — das Tor hätte den Fehler gefangen.

**Einschränkung, die ich nicht messen kann:** `defenseFromMobility` halbiert sich von 0,35
auf 0,18. Es gibt keinen „vorherigen guten Zustand" zum Vergleich, weil vorher NaN gerechnet
wurde. Dass die validierte Datei die bessere Wette ist, bleibt ein Argument, keine Messung.


`npm run pdca` misst alle Prüfstände gegen `docs/pdca-stand.json` und bricht bei jeder
Verschlechterung ab. Was die Runden bisher ergaben:

### Runde 1 · P6 — ein Wert je Merkmal statt zweier handgesetzter Zahlen

Fell, Panzer und Leuchten standen mit **zwei Zahlen an zwei Stellen**: die Zeichnung
zeigte Fell ab 0,4, der Satz nannte es erst ab 0,5; beim Leuchten 0,4 gegen 0,45.
Dazwischen ein Genom-Band, in dem der Spieler etwas *sieht*, was der Text leugnet.

`app/index.html` führt jetzt `SICHTBAR_AB` — ein Wert je Merkmal, gelesen von der
Beschreibung und allen sieben Zeichen-Zweigen. Die Werte wurden nicht neu gewählt,
sondern nach einer Regel angeglichen: **der Text darf nicht leugnen, was gezeichnet ist**
— also gilt die niedrigere der beiden Zahlen, in beiden Fällen die der Zeichnung.
P6 prüft seither nicht mehr „sind zwei Zahlen gleich", sondern „lesen alle Stellen
dieselbe Konstante". **15/303 → 0/7.**

### Runde 2 · Flügel-Schranke — dieselbe Regel, zweites Merkmal

Die Klade-Schranke (A1) verhindert, dass ein Vogel auf einer Vierbeiner-Silhouette
landet. Für das zweite, was die Zeichnung unmissverständlich behauptet — **Flügel** —
gab es kein Gegenstück. Gemessen: 436 Arten in einem Bauplan, der Flügel zeichnet,
obwohl ihr eigenes Flügel-Gen dagegen spricht.

Der Grund lag nicht am Flügel-Gen: bei *Badister bullatus* (wing 0,32) gewann
„Fluginsekt" mit 0,1235 gegen „Insekt · Gliederfüßer" mit 0,1257 — **1,8 % Vorsprung**,
ein Münzwurf, entschieden durch `limbLength`. Die Flügelfrage entschied gar nicht mit,
obwohl sie das Einzige ist, was man auf der Zeichnung sofort sieht.

Die Schwelle ist **abgeleitet, nicht gesetzt**: vier Prototypen nennen `wing` — drei
Flieger bei 0,75–0,77 und „Laufvogel · Strauß" bei 0,05. Die Mitte der größten Lücke
(0,40) trennt „fliegt" von „fliegt nicht" und wandert mit, wenn die Prototypen sich
ändern.

| Umzug | Anzahl | wer |
|---|---|---|
| `vogel` → `laufvogel` | 247 | Frankoline, Chachalacas, Guane, Raufuß- und Großfußhühner |
| `fluginsekt` → `insekt` | 189 | Laufkäfer (*Carabus*, *Badister*, *Demetrias*) |

Gegenprobe: die echten Flieger bleiben (Enten bei 0,67–0,73). Kein Bauplan läuft leer,
P5b unverändert. **P7a 4,6 % → 0, P7b 7,67 % → 7,57 %.**

---

## A0 · Nachträglich dazugekommen: die Kladen-Auflösung war selbst kaputt

Nicht geplant, beim Bau von A1 gefunden. Die Vorfahren-Hülle aus dem Audit sammelte
**alle** Vorfahren transitiv ein — und fing sich damit Wikidatas Querverbindungen ein
(P171 ist nicht funktional; `clade-rules.mjs` vermerkt selbst, dass Q1390 Insecta dort
*unter* Q25364 Crustacea hängt). Gemessen: **8.140 Einträge (19 %)** landeten unter zwei
einander ausschließenden Klassen — sämtliche Insekten, Weichtiere und Spinnentiere
zusätzlich unter Q25522 (Annelida).

Ersetzt durch **Nächster-Vorfahr-Suche mit Spezifitäts-Rang** in
`tools/lib/clade-closure.mjs`: der echte Vorfahr steht näher als die Querverbindung;
Verschachtelung (Farne *in* Pflanzen) gewinnt die speziellere Klade. Ergebnis: **0
Konflikte**, Annelida fällt von 8.140 auf die 137 echten Ringelwürmer.

**Die Audit-Zahlen waren davon unberührt** (P8 8.146, P9 71/174, N3 34,7 % — alle
unverändert): Annelida stand in jeder Prioritätsliste hinter den Klassen, die tatsächlich
trafen. Der Konflikt-Zähler läuft jetzt als Selbsttest in P10 mit, damit so etwas nicht
wieder unbemerkt bleibt.

---

## Was am Ende unsicher bleibt — auch wenn alles umgesetzt ist

0. **Was jetzt noch reißt und warum** *(Stand nach Band A)*:
   `P8`/`P9` — ausschließlich **Skorpione** im Bauplan „Krebstier · Arthropode"
   (gezeichnet 10 Beine, real 8). Spinnentiere haben keinen eigenen Bauplan; das ist die
   nächste ehrliche Näherung, kein übersehener Fall.
   `P7a` reißt **neu** (47/9.452): in den Flieger-Gruppen stehen jetzt Arten mit Flug-Gen
   ≈ 0. Der Befund war vorher von der Fehlgruppierung verdeckt — die Regel wurde nicht
   schlechter, sie sieht jetzt hin.
   `P4` 1/10 — der Rest sind die 624 Einträge ohne auflösbare Klade.
   `N2`/`N4`/`N5`/`N8` unverändert: sie hängen an den Prototypen und der Gewichtung, also
   an B3 und C3/C4.
1. **N1 schließt nie ganz.** Selbst mit EltonTraits, AmphiBIO, fishmorph und
   lizard_traits bleiben die meisten der 10 Kern-Gene Kladen-Werte. „Die nächste reale
   Art" bleibt unterhalb der Klade eine Auswahl aus einem Gleichstand — sauber gerechnet,
   aber ohne Information. **Das ist eine Eigenschaft des Vorhabens, kein Bug.** Die
   ehrliche Konsequenz ist A3, nicht mehr Daten.
2. **A2 verschlechtert die Kennzahl, die es verbessern soll** (Vorsprung 0,58 % → 0,32 %).
   Gemessen, nicht vermutet. Wer nur `naming-audit` liest, wird das für einen Rückschritt
   halten — die Regel N6 braucht dann eine andere Formulierung, sonst misst sie das
   Falsche.
3. **A1 kann Baupläne leeren.** 3 fallen sicher auf null, 6 unter die P5b-Schwelle. Ob
   der Zustrom sie wieder füllt, weiß erst der Lauf.
4. **Kein Befund sagt, was *richtig* ist.** Die Audits messen Widersprüche und
   Tragfähigkeit; sie messen nicht, ob die neue Zuordnung *schöner* spielt. Für A3, C1,
   C3 und C4 gibt es keine Zahl, die die Entscheidung abnimmt.
5. **Alle Zahlen in diesem Plan stammen aus der Mittelfeld-Konvergenz**, die App läuft
   auf dem Schwarm (`world/population.ts`). Die Größenordnungen decken sich mit
   `rarity.json`, die Einzelwerte können abweichen.

---

## Reproduktion

```bash
npm run plausi-check     # Symptome an der Karte, 13 Regeln (P8/P9/P10 neu)
npm run naming-audit     # Ursachenkette, 8 Regeln (N1–N8)
```

Ausgangslage vor der ersten Maßnahme: **10 von 13** bzw. **8 von 8** Regeln gerissen.
