# Arbeitspaket S6 — Erzähl-Bausteine für die Chronik

**Für eine externe Bearbeitung ohne Zugriff auf das Repository.**
Eingabe: `S6-eingabe.json` (66 Umwelt-Einflüsse mit ihren Werten und Ergebnissen).
Umfang: **rund 200–350 Textbausteine.** Das ist deutlich mehr Arbeit als das S4-Paket.

---

## 1. Worum es geht

„Evolve" ist ein Evolutions-Spiel: Der Spieler stellt nur die **Umwelt** ein, das Wesen
entwickelt sich über Generationen von selbst. Begleitet wird das von einer **Chronik** —
einer ruhigen Zeile unter dem Tier, die an sinnvollen Stellen erzählt, was gerade passiert.

Diese Zeilen kommen nicht aus einem Sprachmodell, sondern aus einem **Baukasten**: kurze
Fragmente werden zur Laufzeit zu Sätzen montiert. Aus rund 460 Bausteinen entstehen so
etwa 150.000 verschiedene Sätze.

**Was fehlt:** Der Spieler kann 66 verschiedene Umwelt-Einflüsse auslösen — von „Nebelwüste"
über „Eissturm" bis „Heiße Tiefsee-Quelle". Die Chronik kennt aber nur die *Achse*, die sich
bewegt hat („es wird kälter"), nicht den *Einfluss* selbst. Jeder kälter machende Einfluss
sagt deshalb dasselbe. Deine Aufgabe ist, jedem Einfluss eine eigene Stimme zu geben.

---

## 2. Wie ein Satz entsteht (das musst du verstanden haben)

Ein Satz besteht aus **2–3 Bausteinen**, die zur Laufzeit nach dem Zufallsprinzip — aber
deterministisch — kombiniert werden:

```
#auftakt#. #kern#.              →  „Der Frost sitzt im Boden. Die Dämmung wächst mit jedem Nachwuchs."
#kern# — #ausklang#.            →  „Das Fell wird lichter — vor hundert Generationen sah das noch anders aus."
#kern#, #zeit#.                 →  „Die Jäger sind fort, ab dem nächsten Nachwuchs."
#kern#.                         →  „Es wird kälter, Grad um Grad."
```

Daraus folgen die wichtigsten Regeln:

**Jeder Baustein muss ein vollständiger Hauptsatz in Verbzweitstellung sein.**
Er muss allein stehen können *und* an jeder Position passen. Deshalb:

- **klein beginnen** — der Satzanfang wird automatisch großgeschrieben.
- **kein Schlusspunkt** — den setzt die Schablone.
- **kein „weil/obwohl/damit"** am Anfang (das verlangt Verbletztstellung und bricht die Montage).
- Höchstens **95 Zeichen**. Der fertige Satz darf 120 nicht überschreiten; zu lange Bausteine
  passen in keine Kombination mehr.

✅ `die Dämmung wächst mit jedem Nachwuchs`
✅ `wer hier besser zurechtkommt, hinterlässt mehr Junge`
❌ `Die Dämmung wächst.` (groß, mit Punkt)
❌ `weil die Kälte drückt` (Nebensatz)

---

## 3. Der Ton — das ist der schwierigste Teil

Der Ton wurde nach einer Nutzer-Rückmeldung ausdrücklich geändert: **„weniger lyrisch, mehr
prosaisch — eine persönliche Beziehung zum Wesen ermöglichen, kein Gedicht."**

Der alte Katalog war voller Sentenzen über Evolution im Allgemeinen. Sätze wie
*„kein einzelnes Wesen erlebt diesen Satz"* oder *„die Auslese hat kein Ziel, nur eine
Richtung"* schoben den Spieler **weg** von seinem Tier. Solche Sätze sind jetzt verboten —
der Prüfstand misst das und lehnt ab.

**Stattdessen gilt:**

| statt | besser |
|---|---|
| „die Auslese rechnet unerbittlich" | „die dünner Bedeckten kommen besser durch" |
| „Vererbung ist das Gedächtnis der Welt" | „vor hundert Generationen sah das noch anders aus" |
| „die Form ist nur die Spur davon" | „am Umriss ist davon schon etwas zu erkennen" |
| „das Milieu verzeiht keinen Fehler" | „{wesen} kommt hier schlecht zurecht" |

Konkret, nüchtern, überprüfbar. Sag, **was zu sehen ist**, **was es kostet**, **wovon es
abhängt** oder **wie es vorher war**. Keine Aphorismen, keine Poesie, kein Pathos.

**Das Wesen ansprechen.** Zwei Platzhalter stehen zur Verfügung:

- `{wesen}` → der Name des Wesens, oder „dein Wesen" (Nominativ)
- `{demwesen}` → derselbe im Dativ („bei {demwesen}" → „bei Nebel" / „bei deinem Wesen")

Nutze sie in etwa **jedem vierten Baustein** — nicht öfter, sonst wirkt es aufdringlich.
Weitere erlaubte Platzhalter: `{gen}` (Generationszahl), `{merkmal}`, `{form}`, `{vorher}`.

**Verboten** (der Prüfstand lehnt ab): Absichts-Sprache — „will", „versucht", „möchte",
„lernt", „strebt". Kein Wesen *will* sich verändern; es wird **ausgelesen**. Außerdem: keine
Ausrufezeichen, keine Emoji, kein Markdown.

---

## 4. Was zu liefern ist

### Teil A — Zeilen je Einfluss (der Hauptteil, ~200 Bausteine)

Für **jeden** der 66 Einflüsse aus `S6-eingabe.json` **drei** Bausteine. Sie erscheinen in dem
Moment, in dem der Spieler diesen Einfluss auslöst.

Jeder Eintrag der Eingabedatei sieht so aus:

```json
{
  "name": "Vulkanwinter / Aschefall",
  "anzeigename": "Vulkanwinter (Aschehimmel)",
  "sektion": "Katastrophen & Welt-Ereignisse",
  "ton": "hit",
  "beschreibung": "Sonnenlicht-Blockade, Abkühlung (Toba).",
  "achsen": ["Licht 0.15", "Temperatur 0.25", "Nahrung 0.35"],
  "ergebnis": { "form": "Protist · Amöbe", "reich": "Mikrobe", "passung": 16 }
}
```

- `achsen` sagt dir, **was sich real ändert** — schreib darüber, nicht über etwas anderes.
- `ergebnis` sagt dir, **wohin die Evolution unter diesem Einfluss läuft** und wie gut es dem
  Wesen dabei geht (`passung` in Prozent). Bei 16 % ist das eine harte Welt — der Ton darf das
  spiegeln, ohne dramatisch zu werden.
- `ton`: `hit` = Katastrophe, `shift` = Milieu-Wechsel, `bio` = günstig.

**Die drei Bausteine sollen verschiedene Blickwinkel haben**, nicht dreimal dasselbe:
einer benennt das Ereignis, einer die Folge für den Körper, einer die neue Rechnung.

Beispiel für „Vulkanwinter":
```json
"Vulkanwinter / Aschefall": [
  "die Asche steht wochenlang in der Luft und nimmt das Licht",
  "ohne Sonne bringt jedes grüne Blatt {demwesen} nichts mehr ein",
  "wer jetzt noch von Licht lebt, lebt nicht mehr lange"
]
```

### Teil B — Textur-Bausteine (~100)

Freie Bausteine für die geteilten Pools. Format `["text", "bedingung"]`; leere Bedingung = immer erlaubt.

| Pool | Rolle | Bedarf |
|---|---|---|
| `auftakt` | verortet den Satz in der Welt („der Frost sitzt im Boden") | ~40 |
| `ausklang` | Nachsatz: was das bedeutet, kostet, wovon es abhängt | ~40 |
| `ruhe` | Gleichgewicht erreicht, nichts bewegt sich mehr | ~8 |
| `not` | Passung lange schlecht | ~8 |
| `bluete` | Passung lange sehr gut | ~8 |

**Bedingungs-Tags** (mehrere mit Komma, `!` verneint — z. B. `"kalt,!bluete"`):

`kalt` `mild` `heiss` `eis` `glut` · `dunkel` `daemmer` `hell` `finster` ·
`trocken` `feucht` `nass` · `hunger` `karg` `fuelle` · `jagd` `wachsam` `sicher` ·
`hochnahrung` `bodennah` · `gift` `hypoxie` `salz` `uv` `tiefe` `duerre` `strahlung`
`feuer` `frostnacht` `sturm` `extrem` · `k-mikrobe` `k-protist` `k-pflanze` `k-pilz` `k-tier` ·
`gepanzert` `gruen` `mobil` `hoch` `fliegend` `leuchtend` `winzig` `mittelgross` `riesig` `sessil` ·
`not` `bluete` `auskommen` · `jung` `gewachsen` `uralt` · `b-welt` `b-druck` `b-ruhe` … (Anlass)

⚠️ **Wichtig: die Mitte nicht vergessen.** Ein früherer Prüflauf zeigte, dass in einer
*mittleren* Welt (nichts extrem) der Auftakt-Pool von 40 auf 6 Bausteine schrumpfte, weil fast
alles an Extreme getaggt war. Mindestens die Hälfte deiner Textur-Bausteine sollte **ohne
Bedingung** oder mit `mild`/`karg`/`daemmer`/`feucht`/`wachsam` getaggt sein.

### Ausgabeformat

```json
{
  "faktoren": {
    "Vulkanwinter / Aschefall": ["…", "…", "…"],
    "Nebel/Tau-Interzeption": ["…", "…", "…"]
  },
  "pools": {
    "auftakt":  [["die Asche liegt fingerdick auf allem", "feuer"], ["nichts hier drängt", ""]],
    "ausklang": [["{wesen} zahlt das an anderer Stelle", ""]],
    "not": [["hier reicht es hinten und vorne nicht", ""]]
  }
}
```

Faktor-Namen **exakt** aus `S6-eingabe.json` übernehmen (Feld `name`, nicht `anzeigename`).

---

## 5. Wie das Ergebnis geprüft wird

`node tools/story-import-check.mjs <datei.json>` — und zwar nicht oberflächlich:

1. **Schlüssel** — Faktor-Namen exakt, Pool-Namen gültig.
2. **Form** — klein beginnend, ohne Schlusspunkt, ≤ 95 Zeichen, bekannte Platzhalter.
3. **Leitplanken** — keine Absichts-Sprache, kein Ausrufezeichen, kein Emoji, kein Markdown.
4. **Tags** — nur bekannte Bedingungs-Tags.
5. **Dubletten** — weder untereinander noch gegen die bestehenden 460 Bausteine.
6. **Zusammenbau** — jeder Baustein wird auf dem **echten Pfad des Generators** in vier
   fertige Sätze montiert, in einer Welt, die seine Bedingung erfüllt. Geprüft wird das
   Ergebnis: Länge, Zeichensetzung, Groß-/Kleinschreibung, unersetzte Platzhalter.
7. **Tonfall** — Anteil Sätze mit Bezug zum Wesen und Anteil Sentenz-Vokabular. Über 12 %
   Sentenzen wird die ganze Zulieferung abgelehnt.

**Eine fehlerhafte Zulieferung kann nichts kaputt machen** — sie kommt gar nicht erst in den
Katalog. Teillieferungen sind erlaubt: wer nur 20 Faktoren bearbeitet, bekommt einen Hinweis,
aber keinen Fehler.

---

## 6. Worauf es am Ende ankommt

Der Maßstab ist nicht die **Zahl** der Bausteine, sondern ob zwei Sätze sich **verschieden
anfühlen**. 10.000 Sätze, die alle gleich klingen, sind wertlos — das ist ein bekanntes
Problem der prozeduralen Textgenerierung („10.000 Schüsseln Haferbrei"). Der Ausweg ist
nicht mehr Zufall, sondern mehr **Bezug zur Simulation**: Ein Satz, der etwas Konkretes über
*diese* Welt und *dieses* Tier sagt, ist unverwechselbar. Ein Satz, der über Evolution im
Allgemeinen spricht, ist austauschbar — egal wie schön er ist.

Schreib so, als würdest du jemandem beim Zusehen erklären, was gerade mit seinem Tier passiert.
