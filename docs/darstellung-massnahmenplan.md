# Maßnahmenplan: Artname, Silhouette und Bauplan-Satz wieder zur Deckung bringen

**Grundlage:** `docs/darstellungs-audit.md` (Befunde P8–P10, N1–N8).
**Stand:** noch nichts davon umgesetzt — die Audits sind Diagnose, dieser Plan ist die
Therapie.

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

## Was am Ende unsicher bleibt — auch wenn alles umgesetzt ist

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
