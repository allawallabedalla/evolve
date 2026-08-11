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

**Nachrechenbar gemacht durch:** `npm run plausi-check` — drei neue Regeln
(**P8**, **P9**, **P10**) in `tools/plausi-check.mjs`. Alle Zahlen unten sind gemessen,
nicht geschätzt.

Dieses Dokument ergänzt `docs/plausibilitaets-audit.md` (Runde 1, Befunde P1–P7). Der
dort beschriebene Riss geht tiefer als angenommen: Runde 1 hat die *Merkmale* einer Karte
gegeneinander geprüft, nicht die *Klade* des Namens.

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

## 3. Die Wurzel

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

Nicht umgesetzt — dieser Auftrag war ein Audit. Nach Wirkung sortiert:

1. **Klade-Schranke in `build-catalog.mjs`** *(behebt P8/P9 an der Wurzel)*
   Der `ROOT_KINGDOM`-Wächter bekommt eine Ebene darunter ein Gegenstück: eine Tabelle
   `Bauplan-Gruppe → erlaubte Großkladen`, kuratiert wie `FICON` und die
   `requires`-Fenster. `nearestInKingdom()` sucht dann nur unter Prototypen, deren
   Körperbau die Art überhaupt haben kann — ein Bussard landet bei „Flatterer · Vogel"
   oder „Laufvogel", nie bei „Generalisten-Tier".
   ⚠️ **Blockiert in dieser Sitzung:** ein Neubau des Katalogs braucht
   `tools/.harvest-state.json` (gitignored, nicht im Repo) und damit eine neue Ernte.
2. **Oder: Schranke zur Laufzeit in `nearestReal()`** *(ohne Katalog-Neubau)*
   Die Kladen-Hülle lässt sich beim App-Start aus `CATALOG` selbst rekonstruieren (der
   Code dafür steht jetzt in `plausi-check.mjs`, ~20 Zeilen, einmalig über 42.648
   Einträge). `nearestReal()` überspringt dann Kandidaten, deren Klade dem gezeichneten
   Bauplan widerspricht. Billiger, aber die falsche Gruppierung bleibt in den Daten
   stehen und verzerrt weiter Rarität, Lebensbaum und Abdeckungs-Metrik.
3. **`lineage` nicht mehr kürzen** *(behebt P10 dauerhaft)*
   Statt `slice(0, 12)` die Klassen-QID mitschreiben — oder gleich ein Feld `klade`
   (bzw. `beine`) pro Eintrag, beim Bau einmal aufgelöst. Dann braucht keine spätere
   Prüfung mehr eine rekonstruierte Hülle.
4. **P4 auflösen:** der „≈ in echt"-Verweis zeigt die **Klade** statt des Namens
   („≈ Greifvögel ↗"). Der Wikipedia-Link bleibt, die Zeile sagt wieder etwas.
5. **P1b:** `describe()` leitet die Beinzahl aus dem Kind ab (seit #30) — aber das Kind
   ist bei 71 % der Insekten kein Insekten-Kind. Fällt mit Punkt 1 oder 2 von selbst weg.

Punkt 1 ist die einzige Änderung, die alle vier Karten-Zeilen wieder auf dieselbe
Aussage bringt. Punkt 2 ist der Weg, der ohne Netzzugang möglich wäre.

---

## 8. Reproduktion

```bash
npm run plausi-check              # alle 13 Regeln, P8/P9/P10 neu
npm run plausi-check -- --strict  # Exit 1, sobald eine Regel reißt
```

Stand dieses Audits: **10 von 13 Regeln verletzt** (vorher 7 von 10 — die drei neuen
Regeln reißen alle).

Der Check liest den App-Kern aus `app/index.html` (dieselbe Technik wie `app-parity`),
die gezeichneten Beinzahlen aus `drawAnimalSvg()` und die Kladen aus `app/catalog.js` —
keine abgeschriebene Kopie, keine geratene Ground Truth.
