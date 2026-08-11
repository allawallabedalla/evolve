# Darstellungs-Audit: „Sieht das aus wie ein Bussard?"

**Anlass:** ein Screenshot aus der Live-App.

> **TIER · 🐄 Mantelbussard** ≈ Mantelbussard ↗
> Grenzfall · **18 %** eindeutig — nahe an **Behänder Kletterer**.
> *mittelgroß, nackte Haut. vier kräftige Beine, Greifwerkzeuge, Leuchtorgan.
> Energie: Jäger/Sammler. Fortbewegung: Läufer.*

**Kurze Antwort: nein.** Der *Mantelbussard* (`Pseudastur polionotus`) ist ein
Greifvogel — zwei Beine, Federn, Flügel, Schnabel. Die Karte zeigt einen nackthäutigen
Vierbeiner mit Greifwerkzeugen und Leuchtorgan, gezeichnet über dem Vierbeiner-Icon
`quadruped`. Der Name ist das Einzige an dieser Karte, das von einem Vogel stammt.

**Nachrechenbar gemacht durch:**
`npm run plausi-check` — drei neue Regeln (**P8**, **P9**, **P10**) in
`tools/plausi-check.mjs`, die das *Symptom* an der fertigen Karte messen; und
`npm run naming-audit` — acht neue Regeln (**N1**–**N8**) in `tools/naming-audit.mjs`,
die die *Ursachenkette* messen. Alle Zahlen sind gemessen, nicht geschätzt.

Dieses Dokument ergänzt `docs/plausibilitaets-audit.md` (Runde 1, Befunde P1–P7). Der
dort beschriebene Riss geht tiefer als angenommen: Runde 1 hat die *Merkmale* einer Karte
gegeneinander geprüft, nicht die *Klade* des Namens.

**Aufbau.** Abschnitte 1–2 zeigen den Fall, Abschnitt 3 die naheliegende Wurzel (eine
fehlende Schranke), **Abschnitt 3b die eigentliche Ursachenkette** (sechs Stellen, an
denen die Benennung ihr Signal verliert), 4–6 die Verbreitung, 7 die Konsequenzen.

**Wenn nur eine Zahl hängen bleiben soll:** **0,6 %** der Kern-Genwerte im Artenkatalog
sind an der realen Art gemessen. Die übrigen 99,4 % sind Kladen-Mittelwerte, aus dem
Habitat abgeleitete Werte und ein absichtlich eingestreutes Zufallslos. Der Artname unter
der Bühne beruft sich auf eine Genauigkeit, die es in den Daten nicht gibt.

---

## 1. Vier Quellen, eine Karte

Die Karte unter der Bühne trägt vier Angaben aus vier Quellen, die einander nicht kennen:

| Zeile im Screenshot | Quelle | Herkunft |
|---|---|---|
| `TIER` (Reich-Chip) | Archetyp | `best.f.k` |
| Icon 🐄 + Silhouette | Archetyp | `FICON[form]` → `quadruped` · `drawAnimalSvg(a.e)` |
| **„Mantelbussard"** | **Artenkatalog** | `nearestReal()` — nächster Genom-Nachbar |
| Bauplan-Satz | **eigenes Genom** | `describe(t, a)` |

Nur der *Name* folgt dem Katalog. Silhouette und Reich folgen dem Archetyp, der Satz dem
Genom. Drei der vier Zeilen wissen also gar nicht, dass ein Vogel angekündigt wurde.

---

## 2. Der konkrete Fall: die Gruppe `generalist`

`nearestReal()` sucht die nächste reale Art **nur innerhalb der Bauplan-Gruppe**, die
Stufe 1 gewählt hat. Für diese Karte war das `generalist` — Archetyp **„Generalisten-Tier"**,
Emoji 🦥, Icon `quadruped`, gezeichnet als Vierbeiner mit Kopf und Schnauze.

Was in dieser Gruppe steht:

| Gruppe `generalist` | Anzahl |
|---|---|
| Einträge gesamt | **623** |
| davon Vögel | **598 (96 %)** |
| — davon Eulen (`Strix`, `Tyto`, `Otus`, `Bubo`, `Ninox`, `Glaucidium` …) | 205 |
| — davon Greifvögel (`Buteo`, `Accipiter`, `Aquila`, `Circus`, `Pseudastur` …) | 155 |
| — Rest: Sturmvögel, Albatrosse, Sturmtaucher | 238 |
| davon Säuger (Paviane, Tapire, Equiden) | 25 (4 %) |

Die Bauplan-Gruppe, die als **vierbeiniges Säugetier gezeichnet** wird, ist zu 96 % mit
**Vögeln** gefüllt. Ein Wesen, das hier landet, *kann* praktisch keinen anderen Namen
bekommen als den eines Vogels. „Mantelbussard" war kein Ausrutscher, sondern der
Normalfall dieser Gruppe.

Gegenprobe aus dem Sweep (1.500 Zufallsumwelten, deterministisch auskonvergiert): jede
einzelne Karte, die auf `generalist` fiel, trug einen Vogelnamen —
*Oceanodroma hubbsi* (Sturmschwalbe), *Fregetta maoriana* (Sturmschwalbe),
*Tydea septentrionalis*. Der Bauplan-Satz dazu lautete jedes Mal
„mittelgroß … flossenartige Fortsätze … Fortbewegung: Schwimmer" — eine Sturmschwalbe,
beschrieben als Flossenschwimmer, gezeichnet als Vierbeiner.

### Reproduktion mit den Reglern aus dem Screenshot

Temperatur .47 · Räuber .72 · Nahrung 1.00 · Futterhöhe .43 · Licht .20 · Wasser .28:

```
Gen  50: Argyresthia fundella  [Kleines flinkes Tier] — klein, dichtes Fell.
         vier kräftige Beine, Leuchtorgan.            → eine MOTTE
Gen 200: Temminck-Zwergmaus    [Fell-Warmblüter]      → passt
Gen 600: Straußwachtel         [Fell-Warmblüter] — winzig, dichtes Fell.
         vier kräftige Beine, Greifwerkzeuge, Leuchtorgan.  → ein VOGEL
```

Dieselbe „nahe an **Behänder Kletterer**"-Zeile wie im Screenshot, derselbe Satzbau.
Die Live-App läuft auf dem Schwarm statt auf der Mittelfeld-Konvergenz, deshalb fällt der
Artname anders aus — der Mechanismus ist identisch.

---

## 3. Die Wurzel — erste Schicht

`tools/build-catalog.mjs`, Zeile ~313:

```js
const kingdom = ROOT_KINGDOM[p.v.root] || null;
const w = core.selectionWeights(t, habEnv);
const match = nearestInKingdom(t, habEnv, w, kingdom);
const group = match.key;                    // ← Bauplan-Gruppe der Art
```

Die Gruppe einer realen Art wird über den **Genom-Abstand zum nächsten Prototyp**
vergeben. Abgesichert ist das durch genau einen Wächter: das **Reich**. Der wurde
eingebaut, weil ohne ihn 34 % der Arten im falschen Reich landeten (Kommentar an
derselben Stelle). Er hilft hier aber nicht — „Flatterer · Vogel" und
„Generalisten-Tier" sind **beide** das Reich `Tier`.

Zwischen Reich und Prototyp fehlt eine Schranke. Ein Bussard, dessen 25 imputierte Gene
zufällig näher am Generalisten-Punkt liegen als am Vogel-Punkt, wird zum Generalisten —
und erbt dessen Silhouette. Der Abstand entscheidet damit über etwas, das er nicht
entscheiden kann: **welchen Körperbau der Spieler zu sehen bekommt.**

Dass das nicht auffiel, hat einen zweiten Grund — s. Abschnitt 5.

Aber die fehlende Klade-Schranke ist nur die äußerste Schicht. Sie erklärt, *dass* ein
Bussard in der Generalisten-Gruppe stehen darf — nicht, *warum* sein Genom dort
überhaupt landet. Das ist Abschnitt 3b.

---

## 3b. Die Ursachenkette — sechs Stellen, an denen Information verloren geht

`npm run naming-audit` misst nicht Widersprüche, sondern **Tragfähigkeit**: wie viel
Signal steckt an jeder Station der Benennung noch in der Zahl, auf die sich der
angezeigte Name beruft? **Alle acht Schwellen reißen.**

### N1 · Die Koordinaten sind gar keine Artdaten (0,6 % gemessen)

Jeder Katalog-Eintrag trägt neben dem Genom ein Feld `conf` — die Herkunft je Gen
(3 = an der Art gemessen, 2 = aus der Klade, 1 = imputiert, 0 = aus dem Habitat).
Für die **Kern-Gene 0–9**, die den Körperbau tragen:

| Herkunft | Kern-Gene 0–9 | alle 26 Gene |
|---|---|---|
| **gemessen (3)** | **0,6 %** | 0,2 % |
| aus Klade (2) | **99,1 %** | 46,0 % |
| imputiert (1) | 0,3 % | 12,3 % |
| aus Habitat (0) | 0,0 % | 41,5 % |

Der Mantelbussard trägt `conf` = `2222222222 0010011020 000000` — **kein einziger
gemessener Wert.** Sein Genom ist der Mittelwert seiner Klade. Damit teilen sich alle
Greifvögel praktisch **einen Punkt** im Merkmalsraum. Ein Verfahren, das „die nächste
reale Art" sucht, kann unterhalb der Klade nichts mehr unterscheiden — egal wie genau
gerechnet wird.

### N2 · Das entscheidende Gen ist für 61 von 65 Formen unsichtbar

Ein Prototyp ist eine **Teil**-Spezifikation: nur Gene, zu denen sein Kaskaden-Zweig
etwas sagte, gehen in den Abstand ein. Wie oft wird jedes Gen genannt?

```
mobility 52 · size 48 · photosynthesis 47 · armor 41 · structure 22 · insulation 20
limbLength 17 · metabolism 14 · … · wing 4 · biolum 3 · sense 0
```

- **`wing`: 4 von 65.** Das Flügel-Gen entscheidet nur zwischen den vier Flieger-Formen
  mit. Der Mantelbussard hat **wing = 0,85** — der eindeutigste Vogel-Hinweis, den ein
  Genom überhaupt geben kann. Für „Generalisten-Tier", „Fell-Warmblüter", „Fisch ·
  Aalform" und 58 weitere Formen existiert dieser Wert schlicht nicht.
- **`sense`: 0 von 65.** Das Gen steht als „Sinne" im Genbuch, evolviert mit, kostet
  Unterhalt — und berührt die Identität des Wesens nie.
- 18 der 26 Gene (69 %) werden von höchstens 4 Prototypen genannt.

Die Formwahl läuft effektiv auf **sechs Genen**: Mobilität, Größe, Photosynthese,
Panzerung, Stützgewebe, Wärmedämmung.

### N3 · Der Vogel-Prototyp ist ein Singvogel — größere Vögel fallen heraus

Die Prototyp-Zahlen sind zur Hälfte Mittelwert über *erreichbare* Genome
(`app/archetypes.js`, Methode 2). Was die Engine nie hervorbringt, steht auch nicht im
Prototyp. Ergebnis:

```
Flatterer · Vogel   size 0.10   ← die Größe eines Singvogels
Generalisten-Tier   size 0.51
Mantelbussard       size 0.45
```

Der Bussard liegt in `size` **3,5-mal näher am Generalisten als am Vogel**. Der einzige
Wert, der ihn zurückholen könnte, ist `wing` — und den sieht der Generalisten-Prototyp
nicht (N2). Gemessen:

> Von 6.371 Vogelarten liegen 1.090 über `size` 0.30. Davon stehen **1.090 — also
> ausnahmslos alle — in einer Nicht-Vogel-Gruppe.**

**Ein großer Vogel ist in diesem Merkmalsraum per Konstruktion kein Vogel.**

Dasselbe Muster in anderen Kladen (Anteil außerhalb jedes Bauplans der eigenen Klade,
gesamt 34,7 %):

| Klade | außerhalb | Gen, das sie hinausdrückt |
|---|---|---|
| Insekten | 4.525 von 6.398 (71 %) | `limbLength` 0.69 drinnen vs. 0.50 draußen |
| Weichtiere | 719 von 1.133 (64 %) | `mobility` 0.40 drinnen vs. 0.20 draußen |
| **Vögel** | **1.505 von 6.371 (24 %)** | **`size` 0.13 drinnen vs. 0.33 draußen** |
| Säuger | 57 von 4.923 (1 %) | `size` 0.32 drinnen vs. 0.67 draußen |
| Krebse | 7 von 828 (1 %) | `armor` 0.73 drinnen vs. 0.13 draußen |

Es ist jedes Mal **ein einzelnes Gen**, an dem der Prototyp zu eng steht.

### N4 · Die Gewichtung, die das retten sollte, liegt auf dem Boden

`selectionWeights()` soll den Abstand auf die Gene lenken, die in *dieser* Umwelt über
Leben und Tod entscheiden. Gemessen wird `|∂Fitness/∂Gen|` **am Genom selbst** — und ein
auskonvergiertes Genom sitzt per Definition auf einem Gipfel, wo alle Ableitungen klein
sind. Nach Normierung auf das Maximum und dem Schärfen mit `weightSharpen` 2.5 bleibt:

> **78,4 % aller Gengewichte liegen auf dem Boden** (`weightFloor` 0.3).
> In 9,6 % der Fälle ragt **höchstens ein einziges Gen** darüber.

Beim Mantelbussard in der Screenshot-Umwelt sieht das so aus:

```
photosynthesis  1.000   ← das einzige Gen mit Gradient
insulation      0.300   size 0.302   limbLength 0.300   metabolism 0.363
armor           0.300   mobility 0.306   structure 0.300   wing 0.303   biolum 0.302
```

Ein Landtier wird also fast ausschließlich danach gewichtet, wie wenig es
Photosynthese betreibt. Der „selektions-gewichtete Abstand" ist in der Praxis ein
**ungewichteter** Abstand — er kann eine Fehlzuordnung nicht mehr korrigieren.

### N5 · Der Spezifitäts-Bonus überstimmt den Abstand selbst

`specificityBonus` = **0.55**. Ein Prototyp, der alle 8 Gene nennt, bekommt **55 %
Rabatt** auf seinen Abstand; einer mit 1 Gen nur 6,9 %. Der Bonus soll die Reihenfolge
der alten Kaskade nachbilden — gemessen kippt er sie:

> In **13,6 %** der Karten gewinnt eine Form, die **roh nicht die nächste** ist.
> `Krill (roh 0.070)` verliert gegen `Fledermaus (roh 0.097)` ·
> `Fisch · Aalform (roh 0.090)` verliert gegen `Bartenwal (roh 0.103)`

### N6 · Die Artwahl ist ein Losentscheid

Stufe 2 sucht die nächste reale Art *innerhalb* der Gruppe. Wenn dort hunderte Arten
auf demselben Punkt liegen (N1), ist der Sieger keine Aussage mehr:

> **Median-Vorsprung des Siegers vor dem Zweiten: 0,44 %.**
> Median liegen **3 Arten innerhalb von 1 %** Abstand — im Extremfall
> **369 von 3.987** („Monopis obviella", zweiter Platz „Catopsilia pyranthe").

### N7 · Fast die Hälfte des Abstands ist absichtlich erzeugtes Rauschen

Woraus besteht der Abstand, den `nearestReal()` misst?

> **46,5 %** stammen aus den Genen 10–25 — jenen, die im Katalog zu 41,5 % gar nicht
> erhoben, sondern aus dem Habitat abgeleitet sind (`conf` 0).

Und genau diese Gene hat `build-catalog.mjs` anschließend **bewusst verstreut**: das
Gründer-Los (`world/founder.ts`, Radius bis 0.5 in Genen ohne Fitness-Wirkung, Budget
0,5 % Fitness-Kosten) war der Fix gegen die „Genom-Zwillinge" — 96,6 % der Arten teilten
sich vorher einen. Der Effekt ist im Katalog messbar:

| Gruppe | mittlere SD Kern-Gene | mittlere SD bedingte Gene |
|---|---|---|
| kletterer | **0,009** | 0,054 (6×) |
| generalist | 0,045 | 0,069 |
| fellwarm | 0,084 | 0,089 |

Bei „Behänder Kletterer" ist die Streuung in den *nicht erhobenen* Genen **sechsmal so
groß** wie in den Genen, die den Körperbau tragen — und die Quantisierung liegt bei
1/255 = 0,004. `weightFloor` 0.3 blendet diese Richtungen nie ganz aus, also **zählt das
eigens erzeugte Rauschen mit 30 % Gewicht in den Abstand ein, der den Artnamen bestimmt.**

Damit schließt sich N1 zu N6: Die Arten einer Gruppe unterscheiden sich vor allem dort,
wo nichts gemessen wurde — und genau dort entscheidet die Namenswahl.

### N8 · Der Namensvorrat passt nicht zu dem, was erreichbar ist

Erreichbarkeit am Schwarm gemessen (`docs/rarity.json`):

| Bauplan | erreichbar | hält Artnamen |
|---|---|---|
| **Generalisten-Tier** | **7,67 %** | 623 (davon 96 % Vögel) |
| **Flatterer · Vogel** | **0,33 %** | 4.868 |
| Fisch · Aalform | 0,75 % | 3.686 |
| Blütenkraut | 0,08 % | 1.395 |
| Moos | 0,08 % | 934 |
| Amphibie · Lurch | **0 %** | 264 |

Der Bauplan, der einen Vogel **zeichnen** würde, ist 23-mal unwahrscheinlicher als der,
der die Vogel-**Namen** hält. Die Namen haben nirgendwo sonst hin.

### Die Kette in einem Satz

> Der Artname stützt sich auf Koordinaten, die zu 99 % aus der Klade stammen (N1), wird
> auf Prototypen abgebildet, die das entscheidende Gen nicht ansehen (N2) und für ihre
> eigene Klade zu eng stehen (N3), mit Gewichten, die zu 78 % auf dem Boden liegen (N4)
> und einem Bonus, der die Reihenfolge kippt (N5) — und fällt am Ende zwischen Arten,
> die sich nur im absichtlich erzeugten Rauschen unterscheiden (N6/N7), in einem
> Bauplan, den die Evolution 23-mal häufiger trifft als den richtigen (N8).

Die fehlende Klade-Schranke aus Abschnitt 3 ist damit **nicht die Ursache, sondern die
letzte fehlende Sicherung** vor einer Kette, die schon vorher kein Signal mehr trägt.

---

## 4. Wie verbreitet ist das? (P8 / P9)

Gemessen wird gegen die einzige Behauptung, die die Zeichnung eindeutig aufstellt: die
**Beinzahl**. Sie steht seit dem #30-Fix pro Bauplan-Gruppe fest in `drawAnimalSvg()`,
und sie steht für jede Großklade biologisch fest (Vögel 2, Tetrapoden 4, Insekten 6,
Spinnentiere 8, Krebse 10, Weichtiere/Würmer/Stachelhäuter/Fische 0).

### P8 — im Katalog: **8.146 von 24.846 Tierarten (32,8 %)**

| Bauplan-Gruppe | gezeichnet | Einträge | widersprüchlich | tatsächlicher Inhalt |
|---|---|---|---|---|
| Chamäleon · Tarnjäger | 4 Beine | 1 | **100 %** | Stachelhäuter 100 % |
| **Generalisten-Tier** | **4 Beine** | **623** | **96 %** | **Vögel 96 %** |
| Krill · Filtrierendes Kleinstwesen | 10 Beine | 795 | 94 % | Weichtiere 90 % |
| Kleines flinkes Tier | 4 Beine | 3.987 | 81 % | Insekten 78 %, Amphibien 10 % |
| Aktiver Großjäger | 4 Beine | 78 | 72 % | Vögel 72 % |
| Krebstier · Arthropode | 10 Beine | 2.268 | 66 % | Insekten 62 % |
| Amphibie · Lurch | 4 Beine | 264 | 48 % | Nesseltiere 21 %, Fische 16 % |
| Fisch · Aalform | 0 Beine | 3.686 | 28 % | Reptilien 15 %, Vögel 12 % |
| Insekt · Gliederfüßer | 6 Beine | 2.340 | 20 % | Spinnentiere 19 % |
| Fell-Warmblüter | 4 Beine | 3.749 | 11 % | Vögel 11 % |

Von der anderen Seite gelesen:

- **6.371 Vogelarten** im Katalog — **1.505 (24 %)** stehen in einer Gruppe, die keinen
  Vogel zeichnet: 598 Generalisten-Tier, 439 Fisch · Aalform, 411 Fell-Warmblüter,
  56 Aktiver Großjäger, 1 Reptil · Echse.
- **6.398 Insektenarten** — **4.525 (71 %)** außerhalb eines Insekten-Bauplans:
  3.112 „Kleines flinkes Tier" (Mausform), 1.413 „Krebstier · Arthropode" (Krabbenform).
- **4.923 Säugerarten** — nur **57 (1 %)** fehlplatziert. Der Säuger-Bauplan ist der
  einzige, der weitgehend hält, weil der Vierbeiner-Fallback zufällig sein Körperbau ist.

Auch außerhalb der Tiere, wo die Zeichnung weniger eindeutig behauptet:

| Gruppe | Einträge | Inhalt |
|---|---|---|
| Moos | 934 | **934 Blütenpflanzen**, kein einziges Moos |
| Grünalge | 399 | 386 Moose, 7 Blütenpflanzen, 6 Farne — keine Alge |
| Farn | 125 | 125 Blütenpflanzen |
| Schwamm | 54 | 38 Nesseltiere, 16 Stachelhäuter — kein Schwamm |
| Koralle · Riffbildner | 37 | 37 Nesseltiere ✓ |
| Seestern · Stachelhäuter | 43 | 43 Stachelhäuter ✓ |

Moos- und Grünalgen-Gruppe haben ihre Inhalte praktisch **vertauscht**.

### P9 — live, als Stichprobe: **71 von 174 Karten (40,8 %)**

600 zufällige Umwelten (6 Kern-Regler frei, in der Hälfte zusätzlich ein Stressor wie bei
einer Einfluss-Karte), 300 Generationen deterministisch auskonvergiert, dann die fertige
Karte geprüft. Von den Karten, bei denen sowohl Klade als auch gezeichnete Beinzahl
eindeutig bestimmbar sind, widersprechen sich **zwei von fünf**:

```
„Ciliatocardium ciliatum" (Weichtier, 0 Beine)  auf „Krill"          — gezeichnet 10
„Ringelrobbe"             (Säuger,    4 Beine)  auf „Fisch · Aalform" — gezeichnet 0
„Radjah radjah"           (Vogel,     2 Beine)  auf „Fell-Warmblüter" — gezeichnet 4
„Gebänderter Schlangenstern" (Stachelhäuter, 0) auf „Chamäleon"       — gezeichnet 4
„Elliotfasan"             (Vogel,     2 Beine)  auf „Fell-Warmblüter" — gezeichnet 4
„Eselspinguin"            (Vogel,     2 Beine)  auf „Fisch · Aalform" — gezeichnet 0
```

Der Bussard ist damit kein Einzelfall, sondern **jede zweite bis dritte benannte Karte**.

---

## 5. Warum das keiner der bestehenden Prüfstände gesehen hat (P10)

`app/catalog.js` speichert die Elterntaxon-Kette **gekürzt**:

```js
lineage: p.v.lineage.slice(0, 12),   // s. CORPUS_DEPTH in impute.mjs
```

Bei tief verschachtelten Taxa fällt die Klassen-QID damit aus dem Feld heraus. Beim
Mantelbussard endet die gespeicherte Kette bei `Q2330918` — `Q5113` (Aves) steht mehrere
Ebenen darüber und ist **nicht mehr im Katalog**. Jede Prüfung der Form
`entry.lineage.includes(qid)` — und das waren P1 und P7 aus Runde 1 — hat deshalb nur
einen Bruchteil ihrer eigenen Prüfmenge gesehen:

| Klade | im Feld gefunden | tatsächlich im Katalog | Abdeckung |
|---|---|---|---|
| Insekten | 213 | 6.398 | **3 %** |
| Säugetiere | 1.655 | 4.923 | 34 % |
| Vögel | 2.462 | 6.371 | 39 % |
| Spinnentiere | 606 | 609 | 100 % |

Insgesamt fehlt bei **16.521 von 24.846 Tierarten (66,5 %)** die Klassen-QID im
gespeicherten Feld.

Der Prüfstand hat also „0 Verstöße" gemeldet, wo er schlicht nicht hingeschaut hat. Die
fehlenden Ebenen lassen sich **ohne Netz** rekonstruieren: jede der 42.648 Ketten ist ein
Stück desselben Baums, flacher verschachtelte Arten enthalten genau die Knoten, die den
tieferen abgeschnitten wurden. Die Vereinigung aller Ketten ergibt einen Elterngraphen,
dessen transitive Hülle die vollständige Vorfahrenmenge liefert. Genau das tut
`cladeClosure()` in `tools/plausi-check.mjs` jetzt.

**Folge für die alten Zahlen** — dieselbe Regel, ehrlich gemessen:

| Regel | vorher | jetzt |
|---|---|---|
| P1a Tetrapode mit 6+ Beinen | 0 von 5.187 | 0 von **11.294** ✓ |
| P1b Insekt **nicht** mit sechs Beinen | 85 von 213 (40 %) | **4.459 von 6.398 (70 %)** |

Sieben von zehn Insektenarten im Katalog werden mit der falschen Beinzahl beschrieben —
gemeldet wurden bisher 85 Fälle.

---

## 6. Was sonst noch an derselben Wurzel hängt

Unverändert aus Runde 1, hier nur eingeordnet — es sind Symptome derselben Trennung:

- **P4 · 12 von 12 (100 %)** — „≈ Mantelbussard ↗" wiederholt nur die Überschrift.
  Seit Schritt 0.3 zieht `updateSpeciesWiki()` sein Label aus derselben Quelle wie der
  Titel (`e.de || e.sci`). Der Verweis, der einmal „so sieht das in echt aus" bedeutete,
  ist zur Tautologie geworden. Im Screenshot gut sichtbar.
- **P3 · 6 von 24 (25 %)** — „Leuchtorgan" im Satz, während die benannte Art `biolum`
  0.04 trägt. In einer hellen Welt drückt `selectionWeights()` folgenlose Gene auf
  `weightFloor` (0.3) — für die Namenswahl ist das Leuchtorgan fast unsichtbar, im
  Satz steht es trotzdem. Auch das steht im Screenshot.
- **P7b · 6.353 von 37.461 (17 %)** — hohes Flug-Gen in einer Gruppe ohne Flug-Zweig,
  davon 487 echte Fledertiere. Sie werden als laufende Vierbeiner gezeichnet **und**
  beschrieben.
- **P5 · 24 von 65 Bauplan-Gruppen** können nie einen realen Artnamen bekommen (leerer
  Katalog-Eimer) und zeigen weiter den Archetyp-Namen. Der Spieler sieht in derselben
  Zeile mal „Mantelbussard", mal „Erle · Knöllchen-Pflanze".

---

## 7. Was zu tun wäre

Nicht umgesetzt — dieser Auftrag war ein Audit. Die Reihenfolge ist bewusst nach
**Wirkung pro Aufwand** sortiert, nicht nach Tiefe der Ursache.

### Sofort, ohne Katalog-Neubau

1. **Nicht in Dimensionen messen, in denen nichts gemessen wurde** *(behebt N7, entschärft N6)*
   `nearestReal()` gewichtet jedes Gen zusätzlich mit der **Konfidenz** des
   Katalog-Eintrags (`e.conf[g]`): `w[g] * (conf ? conf/3 : 0)`. Ein Gen, dessen Wert
   aus dem Habitat abgeleitet und anschließend vom Gründer-Los verstreut wurde, zählt
   dann null statt 30 %. Eine Zeile Code, kein Datei-Neubau — und die 46,5 % Rauschen im
   Artabstand fallen weg. **Der billigste echte Fix im ganzen Dokument.**
2. **Klade-Schranke zur Laufzeit** *(behebt P8/P9)*
   Die Kladen-Hülle lässt sich beim App-Start aus `CATALOG` selbst rekonstruieren (der
   Code steht in `plausi-check.mjs`, ~20 Zeilen, einmalig über 42.648 Einträge).
   `nearestReal()` überspringt dann Kandidaten, deren Klade dem gezeichneten Bauplan
   widerspricht — kein Greifvogel auf einer Vierbeiner-Silhouette. Die falsche
   Gruppierung bleibt aber in den Daten stehen und verzerrt weiter Rarität, Lebensbaum
   und Abdeckungs-Metrik.
3. **Ehrlich sein, wo nichts zu entscheiden ist** *(N1/N6, behebt zugleich P4)*
   Bei einem Vorsprung von 0,44 % ist „Mantelbussard" eine Behauptung, die die Daten
   nicht tragen. Zwei Möglichkeiten: entweder die **Klade** als Überschrift
   („ein Greifvogel") und die Art nur als Beispiel darunter — oder die Art behalten und
   den „≈ in echt"-Verweis auf die Klade umstellen („≈ Greifvögel ↗"), was die Tautologie
   aus P4 gleich mit auflöst. Der `margin`-Wert für so eine Anzeige wird ohnehin schon
   berechnet, nur eben für Stufe 1 statt Stufe 2.

### Struktur — die Prototypen stimmen nicht mehr

4. **`wing` (und `sense`) in die Prototypen aufnehmen** *(behebt N2)*
   Die Prototyp-Gene stammen aus der **Geometrie der alten Kaskade** — und die hat
   `wing` nur in ihren Flieger-Zweigen abgefragt. Solange das so bleibt, kann kein
   Merkmalsraum-Verfahren einen Großvogel als Vogel erkennen. `sense` wird von *keinem*
   Prototyp genannt und sollte entweder hinein oder aus dem Genbuch heraus.
5. **Prototypen aus dem Katalog ableiten statt aus der Kaskade** *(behebt N3)*
   Der eigentliche Konstruktionsfehler: „Flatterer · Vogel" hat `size` 0.10, weil die
   *Engine* nur Singvögel hervorbringt. Ein Prototyp-Satz, der aus den 42.648 realen
   Arten geclustert wird (statt aus dem, was die alte Kaskade erreichte), hätte
   automatisch die volle Spannweite jeder Klade — und die Formen wären per Konstruktion
   die, für die es Namen gibt. Das ist der größte Eingriff auf dieser Liste und die
   einzige Änderung, die N2, N3 und N8 gemeinsam auflöst.
6. **`weightFloor`/`weightSharpen` neu kalibrieren** *(N4)*
   Dass 78 % der Gewichte auf dem Boden liegen, ist kein Bug in der Formel, sondern ihre
   Folge: die Ableitung wird auf einem Fitness-Gipfel gemessen, wo sie überall klein ist.
   Wer eine wirksame Gewichtung will, misst nicht den Gradienten am Optimum, sondern die
   **Fitness-Kosten einer endlichen Auslenkung** — das tut `unusedBurden()` an anderer
   Stelle bereits, und `founderSpreads()` in `world/founder.ts` ebenfalls.
7. **`specificityBonus` 0.55 senken oder ersetzen** *(N5)*
   Er soll die Reihenfolge der alten Kaskade nachbilden, überstimmt aber in 13,6 % der
   Fälle den Abstand selbst. Sauberer wäre, den Abstand über *alle* Gene zu mitteln und
   ungenannte Gene mit einem Ruhewert statt mit Schweigen zu behandeln — dann braucht es
   gar keinen Ausgleich für unterschiedlich gesprächige Prototypen.

### Datenhaltung

8. **`lineage` nicht mehr kürzen** *(behebt P10 dauerhaft)*
   Statt `slice(0, 12)` die Klassen-QID mitschreiben — oder gleich ein Feld `klade`
   (bzw. `beine`) pro Eintrag, beim Bau einmal aufgelöst.
9. **Klade-Schranke schon in `build-catalog.mjs`** *(die saubere Fassung von Punkt 2)*
   Der `ROOT_KINGDOM`-Wächter bekommt eine Ebene darunter ein Gegenstück: eine Tabelle
   `Bauplan-Gruppe → erlaubte Großkladen`, kuratiert wie `FICON` und die
   `requires`-Fenster.
   ⚠️ **Blockiert in dieser Sitzung:** ein Neubau des Katalogs braucht
   `tools/.harvest-state.json` (gitignored, nicht im Repo) und damit eine neue Ernte.

### Was das *nicht* löst

Punkt 1–3 machen die Karte widerspruchsfrei, **nicht** genauer. Solange 99,1 % der
Kern-Genwerte Kladen-Mittelwerte sind (N1), bleibt „die nächste reale Art" eine Auswahl
aus einem Gleichstand — sauber gerechnet, aber ohne Information unterhalb der Klade.
Die einzigen Wege dort heraus: echte Merkmalsdaten je Art erheben (`conf` 3 statt 2), oder
die Anzeige auf die Auflösung zurücknehmen, die die Daten hergeben.

---

## 8. Reproduktion

```bash
npm run plausi-check              # Symptome an der Karte — 13 Regeln, P8/P9/P10 neu
npm run naming-audit              # Ursachenkette — 8 Regeln, N1–N8, ~5 s
npm run plausi-check -- --strict  # Exit 1, sobald eine Regel reißt
npm run naming-audit -- --strict
```

Stand dieses Audits:

| Prüfstand | Ergebnis |
|---|---|
| `plausi-check` | **10 von 13 Regeln verletzt** (vorher 7 von 10) |
| `naming-audit` | **8 von 8 Schwellen gerissen** |

Beide Checks lesen den App-Kern aus `app/index.html` (dieselbe Technik wie `app-parity`),
die gezeichneten Beinzahlen aus `drawAnimalSvg()`, die Prototypen und Parameter aus
`app/archetypes.js`, die Kladen und Konfidenzen aus `app/catalog.js` und die
Erreichbarkeit aus `docs/rarity.json` — keine abgeschriebene Kopie, keine geratene
Ground Truth. Die Stichproben laufen mit fester Saat und ohne Rauschen in der
Konvergenz, sind also reproduzierbar.
