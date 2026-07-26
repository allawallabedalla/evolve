# Erzählwerk — ein „unendlicher" Satzvorrat ohne Sprachmodell

**Frage (Nutzer, 2026-07):** Die Evolution soll von kurzen Phrasen begleitet werden, die
an sinnvollen Stellen erscheinen — deterministisch, aus einem vorbereiteten Katalog.
Und: *Wie erzeugt man das Gefühl eines **unendlichen** Vorrats an Textzeilen, ohne
externe LLM-Werkzeuge?*

Diese Datei ist die Antwort: erst die Recherche, dann die Architektur, dann das Werkzeug,
mit dem sich das messen lässt. Umsetzung: `app/story.js` · Prüfstand: `tools/story-check.mjs`
(`npm run story-check`) · Anschlussstellen: `app/index.html`.

---

## 1. Warum die naheliegenden Lösungen scheitern

| Ansatz | Warum er nicht trägt |
|---|---|
| **Fester Phrasen-Katalog** (100–300 Sätze) | Nach zwei Sitzungen kennt man sie. Bei ~10 Zeilen je Sitzung ist ein 200er-Katalog in ~3 Wochen erschöpft. Wächst nur linear mit der Schreibarbeit. |
| **Wortweiser Baukasten** („Das {Adjektiv} {Nomen} {Verb}") | Im Deutschen der klassische Fallstrick: Kasus, Genus, Numerus, Verbstellung. Ein Slot-Tausch erzeugt „die Gliedmaßen steigt". Enormer Aufwand für Morphologie-Tabellen. |
| **Markov-Ketten / n-Gramme über eigenem Text** | Erzeugt grammatisch Halbgares und — schlimmer — **Unwahres**: der Satz behauptet dann Dinge, die die Simulation gar nicht sagt. |
| **Reiner Zufalls-Rekombinator** | Comptons „10.000 Schüsseln Haferbrei": mathematisch verschieden, gefühlt identisch. |

### Der zentrale Befund der Forschung

**Kate Compton — „10.000 Bowls of Oatmeal":** man kann mühelos 10.000 Schüsseln Haferbrei
erzeugen, in denen jede Flocke anders liegt. Der Betrachter sieht: Haferbrei. *Perzeptive*
Einzigartigkeit ist die relevante Größe, nicht die mathematische.

**Rabii & Cook (FDG 2023), „Why Oatmeal is Cheap":** formaler Nachweis, dass die Komplexität
des komplexesten erzeugbaren Artefakts durch das **im Generator kodierte Wissen** begrenzt
ist. Mehr Würfel erhöhen sie nicht — Haferbrei ist billig, *weil* er kein Wissen braucht.
Konsequenz: Vielfalt muss aus einer **Wissensquelle** kommen, nicht aus dem Zufallsgenerator.

**Emily Short — „Bowls of Oatmeal and Text Generation":** für Text heißt die Wissensquelle
**Salienz** — wie viel vom Weltmodell im Satz steckt. Ihre Kernempfehlung: den Generator an
etwas **Mechanisches** binden; rein dekorative Erzeugung wird als solche erkannt und
abgetan. Sie nennt drei Messgrößen: Salienz, Varietät je Slot, und die Verteilung der
variierenden Abschnitte.

**Bruno Dias — „Improv":** die praktische Bauform dazu. Anders als Tracery zieht Improv
nicht blind aus Grammatikregeln, sondern filtert Textbausteine über **Tags** gegen ein
Weltmodell.

**Smith & Whitehead (2010) — „Expressive Range Analysis":** die passende Prüfmethodik.
Viele Artefakte erzeugen, mit Kennzahlen versehen, und den entstehenden Raum auf **Löcher
und Schlagseiten** absuchen. Genau das tut `story-check`.

### Die Schlussfolgerung für dieses Spiel

> **Unser Wissen ist die Simulation.**

Evolve hat 25 Gene, 16 Umwelt-Achsen, 43 Formen, 5 Reiche, eine Fitness-Zahl und einen
Selektionsgradienten. Das ist eine ungewöhnlich reiche, *bereits vorhandene* Wissensquelle.
Zwei Sätze unterscheiden sich dann nicht, weil ein Würfel anders fiel, sondern **weil die
Welt anders steht**. Das ist der Unterschied zwischen Vielfalt und Haferbrei — und er ist
hier gratis zu haben, weil das Spiel diese Zustände ohnehin führt.

---

## 2. Architektur

Drei Schichten (`app/story.js`):

```
Simulationszustand ──► tagsOf() ──► Fakten-Tags       (Salienz)
                                        │
                       ┌────────────────┴──────────────┐
                       ▼                               ▼
                 KERN-Pools                      TEXTUR-Pools
        (was ist passiert: welches Gen,     (#auftakt# #ausklang# #zeit#)
         welche Achse, welches Reich)        + 10 Satz-Schablonen
                       └────────────┬──────────────────┘
                                    ▼
                     deterministische Auswahl + Gedächtnis
                                    ▼
                            polish() ──► eine Zeile
```

**1. Salienz-Schicht.** `tagsOf(ctx)` übersetzt den Zustand in Fakten-Tags: `kalt`, `finster`,
`hunger`, `jagd`, `gift`, `tiefe`, `k-pilz`, `gepanzert`, `sessil`, `not`, `bluete`, `uralt`,
`auf`/`ab`, `b-<beat>` … Jeder Textbaustein kann Tags fordern (`"kalt,jagd"`) oder
ausschließen (`"!b-welt"`).

**2. Kern-Pools** tragen die *Bedeutung* — je Umwelt-Achse und Richtung, je Gen und Richtung,
je Reich, je Seltenheitsstufe. Sie sind der Grund, warum der Satz etwas Wahres sagt.

**3. Textur-Pools** tragen den *Klang* und werden nach denselben Tags gefiltert — deshalb
landet nie ein Hitze-Bild in einer Eiswelt.

### Die deutsche Grammatik-Falle — und wie sie umgangen wird

Kombiniert wird **auf Satzebene, nicht auf Wortebene**. Jedes Fragment ist ein
vollständiger Hauptsatz in Verbzweitstellung. Damit gibt es zwischen den Bausteinen
**keine Kongruenz** mehr, die schiefgehen könnte. Regeln:

* Fragmente beginnen **klein** und enden **ohne** Satzzeichen; `polish()` setzt beides.
* Schablonen verbinden nur mit `. ` · ` — ` · `: ` · `, und ` — alles Verbindungen, die die
  Verbstellung **nicht** ändern. Kein „weil/obwohl" (das erzwänge Verbletztstellung).
* `, und` wird verworfen, wenn ein Baustein selbst ein Komma trägt.

Das ist der Trick, mit dem der Ansatz im Deutschen praktikabel wird — und der Grund, warum
kein Morphologie-Modul nötig ist.

### Determinismus

Kein `Math.random`, keine Uhr (der Prüfstand erzwingt das). Die Auswahl ist eine reine
Funktion aus `(lineageSeed, Beat, Situations-Schlüssel, Generation, Gedächtnis)`. Derselbe
Spielverlauf erzählt dieselbe Geschichte. Der Ruhepausen-Takt nutzt die Uhr — die Auswahl
des *Textes* nicht.

### Anti-Wiederholung auf zwei Ebenen

Ein bekannter **Baustein** wirkt schal, eine bekannte **Zeile** wirkt kaputt. Darum zwei
Gedächtnisse (90 Bausteine, 160 Zeilen), gemeinsam im Ringpuffer, **über das Neuladen und
sogar über „Neues Leben" hinweg gespeichert**: die Chronik gehört dem Leben, die Vermeidung
von Wiederholung gehört dem Spieler.

---

## 3. Die Anschlussstellen im Spiel (Beats)

| Beat | Wann | Ruhepause |
|---|---|---|
| `anfang` | neue Linie / erster Besuch | sofort |
| `heimkehr` | Offline-Rückkehr (mit Dauer + „Form gekippt?") | sofort |
| `welt` | Regler, Biom oder Umwelt-Einfluss (entprellt, ab spürbarer Änderung) | 5 s |
| `druck` | dasselbe Merkmal steht 60 Generationen unter Auslese | 20 s |
| `wandel` | die committete Form kippt | 2 s |
| `reich` | erstes Wesen eines der 5 Reiche | sofort |
| `fund` | neue Form entdeckt (nach Seltenheit differenziert) | sofort |
| `ruhe` | 120 Generationen ohne Netto-Bewegung (Attraktor) | 20 s |
| `not` / `bluete` | Passung lange < 32 % bzw. > 82 % | 25 s |
| `zeit` | Generationen-Marken 100 … 100.000 | 12 s |

Die Schwellen zählen in **Generationen**, nicht in Sekunden — bei Tempo „schnell" erzählt
das Spiel also nicht häufiger, sondern gleich viel.

**Darstellung:** eine ruhige Serifen-Zeile unter der Art (`#chronLine`), plus ein
aufklappbares Archiv „Chronik dieses Lebens" (letzte 24 Zeilen mit Generationsnummer).
Die Chronik **erzählt** (Bild), die Warum-Zeile darüber **erklärt** (Mechanik) — bewusst
getrennte Stimmen.

---

## 4. Das Werkzeug: `npm run story-check`

Bei einem Generator zählt die **Ausgabe**, nicht der Quelltext. Der Prüfstand erzeugt
~10.000 Sätze über eine Suite von 166 repräsentativen Spiellagen und misst:

| Prüfung | Was sie fängt |
|---|---|
| **Quellen-Lint** | leere/doppelte Fragmente, falsche Groß-/Kleinschreibung, Satzzeichen, Emoji, Ausrufezeichen, **Absichts-Sprache** |
| **Determinismus** | jede Lage 5× identisch reproduziert; keine Zufalls-/Zeitquelle im Code |
| **Ausgaben-Lint** | dieselben Leitplanken über alle erzeugten Sätze (Property-Based statt Handprobe) |
| **Widerspruchs-Test** | Hitze-Bild in der Eiswelt, Überfluss-Bild in der Hungerwelt … |
| **Tote Bausteine** | Fragmente, die in **keiner** Lage vorkommen (Tag zu eng) |
| **Vielfalt** | beobachtete Sätze je Lage + **Chao1**-Schätzer für den wahren Vorrat + **schwächste Lage** |
| **Sitzungs-Simulation** | 24 Linien × 120 Zeilen mit Gedächtnis: *nach wie vielen Zeilen wiederholt sich etwas wörtlich?* |
| **Haferbrei-Index** | gzip-Bytes je Satz gegen den Boden „immer derselbe Satz" |
| **Satzbau-Verteilung** | Schlagseite der Schablonen (ERA) |

`node tools/story-check.mjs --sample 6` gibt Kostproben je Lage aus — die Autoren-Schleife.

### Aktueller Messstand

```
444 Bausteine · 10 Schablonen · 166 geprüfte Lagen
Gesamtvorrat (Chao1):        ~142.000 verschiedene Sätze
Geburtstags-Abstand:         erste Wiederholung im Mittel nach ~480 blinden Ziehungen
Sitzungs-Simulation:         120 von 120 Zeilen verschieden (keine wörtliche Wiederholung)
Haferbrei-Index:             6,6 gzip-Byte/Satz — 34× über dem Boden
Satzbau:                     11 % ein Baustein · 75 % zwei · 14 % drei
```

Zum Einordnen: ~142.000 Sätze aus 444 geschriebenen Bausteinen sind Faktor **320** an
Hebelwirkung — und, wichtiger, jeder dieser Sätze ist an einen echten Simulationszustand
gebunden. Bei ~10 Zeilen je Sitzung reichte das rein rechnerisch für **Jahrzehnte**.

### Warum die Kennzahlen so gewählt sind

* **Der Gesamtvorrat allein wäre irreführend** — genau der Fehler, den Compton beschreibt.
  Darum steht die **schwächste Lage** gleichberechtigt daneben: die gefühlte Vielfalt richtet
  sich nach dem *dünnsten* Pool, den ein Spieler antrifft, nicht nach dem Produkt aller Pools.
  Der Prüfstand schlägt fehl, wenn irgendeine Lage unter ~12 mögliche Sätze fällt.
* **Die Sitzungs-Simulation ist die eigentliche Spieler-Kennzahl.** Sie hat den bisher
  wichtigsten Fehler gefunden: bei nur einem Baustein-Gedächtnis wiederholte sich eine Zeile
  bereits nach 32 Zeilen wörtlich — trotz 200.000 möglicher Sätze. Daraufhin kam das zweite
  Gedächtnis (Zeilen-Hashes) dazu.
* **Der Haferbrei-Index ist absolut bedeutungslos** und nur als *Verhältnis* zum Boden und
  als Regressionswächter über die Zeit brauchbar. Das steht so auch im Werkzeug.

### Weitere Funde des Prüfstands (dokumentiert, weil lehrreich)

1. **Das schwächste Glied lag in der Mitte.** In einer *milden* Welt schrumpfte der
   Auftakt-Pool von 40 auf 6 Bausteine, weil fast alle Bilder an Extreme getaggt waren.
   Gegenmittel: die Mitte ist ein Zustand, kein Rückfall — 28 Bausteine für milde Welten und
   für den *Körper*, der gerade lebt.
2. **Der eigene Dopplungs-Filter tötete gute Bausteine.** „Generation für Generation" wurde
   als Wortdopplung verworfen. Korrektur: geprüft wird nur noch **zwischen** Bausteinen
   (auf 6-Zeichen-Stämmen, damit Beugungen greifen); innerhalb eines Fragments ist
   Wiederholung Absicht des Autors.
3. **Allgemeine Rückfall-Sätze verdrängten die spezifischen.** „Die Welt ist eine andere"
   stand öfter da als „die Nahrung wird knapp" — direkter Salienz-Verlust. Gegenmittel:
   Gewicht 0,06 für Rückfälle. Sie geben Rhythmus, führen aber nie.
4. **Zeitangaben widersprachen dem Anlass.** „Seit vielen Generationen unverändert" stand in
   dem Moment, in dem der Spieler gerade die Welt geändert hatte. Gegenmittel: der Anlass
   selbst wurde ein Tag (`b-welt`), und Verlaufs-Angaben schließen ihn aus.

---

## 5. Wie man den Vorrat erweitert

Die Hebelwirkung ist **nicht** gleichmäßig — hier die Reihenfolge nach Wirkung je
geschriebenem Satz:

1. **Neue KERN-Bilder für dünne Lagen.** `npm run story-check` nennt die schwächste Lage je
   Beat. Dort schlagen zwei neue Sätze am stärksten durch. *(Wirkung: hoch, direkt sichtbar)*
2. **Neue Tag-Dimensionen.** Jede neue Achse in `tagsOf()` (z. B. Jahreszeit, Populations-
   größe, Nachbarschaft aus der „Lebenden Welt") multipliziert den Raum, **und** erhöht die
   Salienz — der doppelte Gewinn, den Rabii & Cook beschreiben.
3. **Neue Textur-Bausteine** für die Mitte (untagged oder `mild`/`karg`/`daemmer`).
   *(Wirkung: mittel, breit)*
4. **Neue Schablonen.** *(Wirkung: gering — Satzbau fällt weniger auf als Wortwahl.)*

**Regeln beim Schreiben** (der Prüfstand erzwingt sie):
kleingeschrieben beginnen · kein Schlusspunkt · vollständiger Hauptsatz in
Verbzweitstellung · keine Absichts-Sprache („will/versucht/lernt") — erzählt wird **Auslese** ·
kein Ausrufezeichen, kein Emoji · Bilder immer taggen, wenn sie eine Welt voraussetzen.

Nach jeder Änderung: `npm run story-check` (und `--sample 6` fürs Ohr).

---

## 6. Bewusst nicht gemacht

* **Kein LLM zur Laufzeit** — bräche Offline-Fähigkeit, Determinismus, Datenschutz und
  Kosten-Neutralität; und die Leitplanken wären nicht mehr maschinell erzwingbar.
* **Kein LLM zur Bauzeit** zum Aufblähen des Katalogs: das erzeugte genau den Haferbrei,
  gegen den die ganze Architektur gebaut ist (viele Sätze, wenig Wissen).
* **Keine Morphologie-Engine** — die Satzebenen-Kombination löst das Problem billiger.
* **Keine Erzählung ohne Deckung in der Simulation.** Der Generator behauptet nie etwas,
  das der Zustand nicht hergibt. Das ist die Bedingung dafür, dass die Zeile *gelesen* wird
  statt weggeklickt.

---

## Quellen

- Kate Compton, *So you want to build a generator…* („10.000 Bowls of Oatmeal") —
  <https://galaxykate0.tumblr.com/post/139774965871/so-you-want-to-build-a-generator>
- Younès Rabii & Michael Cook, *Why Oatmeal is Cheap: Kolmogorov Complexity and Procedural
  Generation*, FDG 2023 — <https://arxiv.org/pdf/2305.02131>
- Emily Short, *Bowls of Oatmeal and Text Generation* —
  <https://emshort.blog/2016/09/21/bowls-of-oatmeal-and-text-generation/>
- Emily Short, *Procedural Text Generation in IF* —
  <https://emshort.blog/2014/11/18/procedural-text-generation-in-if/>
- Bruno Dias, *Improv — a JavaScript library for generative text* —
  <https://brunodias.dev/2016/01/27/improv.html> · <https://github.com/sequitur/improv>
- Gillian Smith & Jim Whitehead, *Analyzing the expressive range of a level generator*,
  PCG 2010 — <https://dl.acm.org/doi/10.1145/1814256.1814260>
