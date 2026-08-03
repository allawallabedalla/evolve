# Plausibilitäts-Audit der Anzeige-Schicht

**Anlass:** zwei Screenshots aus der Live-App.

1. „Javanisches Pustelschwein“ — *„mittelgroß, dichtes Fell, zahlreiche Beine
   (Vielfüßer), Leuchtorgan. Energie: Jäger/Sammler. Fortbewegung: Läufer.“*
   Daneben der Verweis „≈ Javanisches Pustelschwein ↗“.
2. „Erle · Knöllchen-Pflanze“ — Bauplan-Name statt Artname, Verweis „≈ Erlen ↗“.

**Nachrechenbar gemacht durch:** `npm run plausi-check`
(`tools/plausi-check.mjs`). Der Check liest den App-Kern aus `app/index.html`
(dieselbe Technik wie `app-parity`), prüft ihn gegen die 20.178 belegten Arten in
`app/catalog.js` und gegen die Zeichen-Schwellen, die er aus derselben Datei
ausliest — keine abgeschriebene Kopie, keine geratene Ground Truth.

**Ergebnis:** 9 von 10 Regeln verletzt. Alle Zahlen unten sind gemessen.

---

## Die Wurzel: drei Quellen, die nichts voneinander wissen

Die Karte unter der Bühne zeigt **drei Angaben aus drei verschiedenen Quellen**:

| Zeile | Quelle | Datei |
|---|---|---|
| **Artname** | nächster Nachbar im Artenkatalog (gewichteter Genom-Abstand) | `nearestReal()` |
| **Bauplan-Satz** | das **eigene** Genom | `describe()` |
| **Silhouette** | das **eigene** Genom, aber mit **eigenen Schwellen** | `drawAnimalSvg()` |

Es gibt keine Stelle, die diese drei gegeneinander abgleicht. Jeder Widerspruch
unten folgt aus dieser Trennung.

---

## Befund 1 — „zahlreiche Beine (Vielfüßer)“: Gen 2 wird als Beinzahl gelesen

Das ist **kein** Fehler des Screenshot-Wesens, sondern des Katalog-Eintrags selbst.
Das Pustelschwein steht mit `limbLength = 199/255 = 0.780` im Katalog, und
`describe()` (app/index.html:1522-1525) staffelt:

```
< 0.18  „kaum Gliedmaßen“
< 0.50  „vier … Beine“
< 0.78  „sechs gegliederte Beine“
≥ 0.78  „zahlreiche Beine (Vielfüßer)“
```

0.780 fällt um 0.0003 in die oberste Stufe. Der Satz aus dem reinen Katalog-Genom
lautet wörtlich:

> mittelgroß, dichtes Fell. zahlreiche Beine (Vielfüßer). Energie: Jäger/Sammler. Fortbewegung: Läufer.

Das ist der Screenshot, minus Leuchtorgan (dazu Befund 2).

**Warum das systematisch falsch sein muss:** `limbLength` ist nirgends sonst eine
Beinzahl. `engine/fitness.ts` und `tools/lib/clade-rules.mjs` definieren es als
**Gliedmaßen-LÄNGE** — *„Reichweite NUR an Land; im Wasser reiner Widerstand
(aquaticLimbDrag 0.7)“*. Langbeinig → viele Beine ist eine Bedeutungs-Verwechslung,
kein Grenzfall.

**Gemessen (P1a/P1b):**

- **779 von 1831** Säugetieren und Vögeln im Katalog (**42,5 %**) werden mit
  **sechs oder mehr** Beinen beschrieben. Alle sind Tetrapoden, alle haben vier.
- **83 von 185** Insekten (**44,9 %**) bekommen **nicht** sechs Beine — obwohl
  „sechs Beine“ die Definition der Klasse ist.

---

## Befund 2 — „Leuchtorgan“ am Schwein: das Gen ist für die Namenswahl fast unsichtbar

Der Katalog-Eber hat `biolum = 0.031`. Das Leuchtorgan kommt also aus dem **eigenen**
Genom des Spieler-Wesens (`biolum > 0.45`) — und überlebt, weil es die **Namenswahl
kaum beeinflusst**:

`selectionWeights()` gewichtet jedes Gen mit seiner Fitness-Ableitung *in dieser
Umwelt*. Biolumineszenz wirkt laut `physics.json` **nur unterhalb
`biolumDarkFloor = 0.3`** (Tiefsee/Höhle). In einer hellen Welt ist die Ableitung
also ~0, das Gewicht fällt auf den Boden `ARCH.weightFloor = 0.3`, und ein
Leuchtorgan verschiebt den Abstand zum Katalog-Nachbarn fast nicht. Das Wesen darf
ein Schwein heißen und trotzdem leuchten.

Verschärfend: `unusedBurden()` (app/index.html:1372) misst überflüssige Ausrüstung
erst **ab Gen-Index 10** (`for(let i=10;i<NG;i++)`). Genau `wing` (8) und `biolum` (9)
— die zwei Gene, die `describe()` als sichtbares Merkmal ausgibt — fallen aus dieser
Messung heraus. Ein Wesen mit nutzlosem Leuchtorgan gilt deshalb als „gesetzt“.

**Gemessen (P3):** in **10 von 24** Stichproben über die 12 Presets (**41,7 %**)
beschreibt der Satz ein Merkmal, das die namensgebende Art nachweislich nicht hat —
z. B. *„Kaiserschnurrbarttamarin“ trägt Leuchtorgan (0.60), die benannte Art hat 0.03*.

---

## Befund 3 — Text und Zeichnung nennen verschiedene Beinzahlen

Der Kommentar über `describe()` behauptet ausdrücklich *„deckt sich mit der
Zeichnung“*. Er tut es nicht. `drawAnimalSvg()` (app/index.html:6219) rechnet:

```js
const legs = kind==="🐦" ? 2 : 2 + Math.round((0.3 + 0.7*limb)*5);
```

Das sind **zwei unabhängige Formeln auf demselben Gen** — Stufen bei 0.18/0.50/0.78
gegen eine Rundung mit Sprüngen bei anderen Stellen.

**Gemessen (P2):** auf **37 von 76** Punkten des Genom-Bereichs (**48,7 %**)
widersprechen sich Satz und Bild:

| Genom-Band | Text sagt | gezeichnet werden |
|---|---|---|
| 0.29–0.49 | vier Beine | **5** |
| 0.50–0.57 | sechs Beine | **5** |
| 0.78–0.85 | zahlreiche (Vielfüßer) | **6** |

Der Screenshot-Eber (0.78) wird also mit **sechs** Beinen gezeichnet, während der
Text „Vielfüßer“ sagt — und real hat er vier.

---

## Befund 4 — weitere Merkmale: gezeichnet, aber nicht genannt

Dieselbe Doppelpflege bei den übrigen Merkmalen (P6). Schwellen aus beiden Dateien
gelesen:

| Merkmal | Text ab | Zeichnung ab | Widerspruchs-Band |
|---|---|---|---|
| Fell / Isolationsschicht | 0.50 | **0.40** | 0.41–0.50 → sichtbar behaart, Text sagt „nackte Haut“ |
| Leuchtorgan | 0.45 | **0.40** | 0.41–0.45 → leuchtet sichtbar, Text schweigt |
| Panzerplatten | 0.50 | 0.50 | ✓ deckt sich |

---

## Befund 5 — Flug kommt nicht aus dem Flug-Gen

`describe()` entscheidet über Flug an der **zugeordneten Bauplan-Gruppe**, nicht am
Genom (app/index.html:1496):

```js
const flyer = a.e==="🦋"||a.e==="🐦"||a.e==="🦇";
```

**Gemessen (P7b):** **1689 Katalog-Arten (8,7 %)** tragen `wing > 0.45`, sitzen aber
in einer Nicht-Flieger-Gruppe — verteilt auf `flink` (771), `fellwarm` (489),
`insekt` (342), `fisch` (36), `generalist` (51). **487 davon sind echte Fledertiere
(Q28425)**, während die Gruppe `fledermaus` nur 318 Einträge hält. Diese Arten werden
als **laufende Vierbeiner** beschrieben *und* gezeichnet — ein Flughund mit
`wing = 0.80` bekommt „vier kräftige Beine, Fortbewegung: Läufer“.

(Die Gegenrichtung ist sauber: P7a = 0 — keine Art in einer Flieger-Gruppe hat ein
Flug-Gen nahe null.)

---

## Befund 6 — „≈ in echt“ wiederholt nur den Artnamen

`updateSpeciesWiki()` (app/index.html:6880) nimmt bei vorhandenem `arch.real`
`label = e.de || e.sci` — **dieselbe Quelle wie die Überschrift**. Ergebnis:
Überschrift „Javanisches Pustelschwein“, Chip „≈ Javanisches Pustelschwein ↗“.

**Gemessen (P4): 16 von 16 (100 %)** aller Fälle mit Katalog-Treffer sind
tautologisch. Der didaktische Zweck des Verweises („so etwas könnte in der Natur
aussehen“, s. `app/exemplar.js`) ist damit für den gesamten Katalog-Pfad verloren —
er funktioniert **nur noch** dort, wo es *keinen* Katalog-Treffer gibt (Screenshot 2:
„≈ Erlen ↗“).

---

## Befund 7 — zwei Namensarten in derselben Zeile

Screenshot 1 zeigt einen **Artnamen**, Screenshot 2 einen **Bauplan-Namen**. Die
Regel dahinter ist für den Spieler unsichtbar: `CATALOG_NAMES` kippt die Benennung
global auf „nächste reale Art“, aber `nearestReal()` liefert `null`, wenn die
Bauplan-Gruppe leer ist.

**Gemessen (P5):** **25 von 65** Bauplan-Gruppen (**38,5 %**) haben **keinen
einzigen** Katalog-Eintrag und können deshalb nie einen Artnamen zeigen — darunter
Nadelbaum, Wurm, Amöbe, Myzel, Robbe, Laufvogel, Erle, Mammutbaum, Muschel.

**(P5b):** weitere **8 Gruppen** haben unter 25 Einträge — Stufe 2 sucht
ausschließlich *innerhalb* der Gruppe, hat dort also kaum eine Wahl:
`Kraut` (1), `Chamäleon` (1), `Deinococcus` (4), `Hefe` (12), `Großjäger` (12),
`Farn` (16), `Bakterie` (20), `Leuchtwesen` (24). Zugleich sammelt `strauch` 5292
Arten — die Verteilung ist um Größenordnungen schief.

---

## Was der Sim-Kern *nicht* falsch macht

Zur Abgrenzung, damit die Suche nicht in die falsche Richtung läuft:

- **Fitness/Physik:** nachgelaufen und grün — `node tools/app-parity.mjs`
  (max |App − Engine| = 0.000e+0) und `node tools/reality-check.mjs`
  (20/20 Regeln erfüllt). Kein Befund oben berührt die Auslese.
- **Jahres-/Jahreszeit-Anzeige:** „Generation 29.918 · Jahr 50 · Winter“ rechnet
  korrekt — `SEASON.period = 600`, 29918/600 = 49,86 → Jahr 50, Phase 0,86 → Winter.
- **Habitat-Bühne** (`drawHabitat`): Himmel, Boden, Wasserstand, Schnee, Schleier
  lesen alle konsistent aus `envLive` (also inkl. Jahreszeit).

Die Fehler sitzen ausschließlich in der Schicht **zwischen Genom und Auge**.

---

## Reihenfolge, in der sich das lohnt

1. **Gen 2 im Text als Länge lesen**, nicht als Anzahl (Befund 1) — betrifft ~43 %
   aller Wirbeltiere im Katalog und ist eine reine Text-Änderung ohne Sim-Wirkung.
2. **Beinzahl aus EINER Quelle** für Text und Zeichnung (Befund 3).
3. **„≈ in echt“ auf die Klade heben** statt den Namen zu wiederholen (Befund 6) —
   kleinste Änderung, stellt einen ganzen didaktischen Pfeiler wieder her.
4. **`unusedBurden()` ab Index 8 statt 10** rechnen, damit nutzlose Flügel/Leuchtorgane
   als Umstellungs-Last sichtbar werden (Befund 2).
5. **Schwellen von Text und Zeichnung zusammenlegen** (Befund 4).
6. **Katalog-Gruppierung** der Flieger korrigieren und leere Gruppen füllen
   (Befund 5/7) — der größte Brocken, rein Daten-seitig.

Ohne Schritt 1–3 bleibt jede weitere Katalog-Arbeit unsichtbar: der Spieler liest
weiter einen Satz, der seinem eigenen Bild widerspricht.
