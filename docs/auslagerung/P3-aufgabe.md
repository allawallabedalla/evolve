# Arbeitspaket P3 — Klartextnamen und Erklärungen für den Faktoren-Katalog

**Für eine externe Bearbeitung ohne Zugriff auf das Repository.**
Eingabe: `P3-eingabe.json` (218 Faktoren).
Umfang: **436 Texte** — für jeden Faktor ein Name und eine Erklärung.
Das ist das bisher größte Paket.

---

## 1. Das Problem, das du löst

„Evolve" ist ein Evolutions-Spiel. Der Spieler stellt die Umwelt seines Wesens ein, und über
einen Knopf **„Umwelt-Einfluss auslösen"** öffnet sich ein Katalog von 284 Faktoren aus der
ökologischen und evolutionsbiologischen Literatur.

Dieser Katalog ist fachlich gut und für Spieler **weitgehend unlesbar**. Er zeigt Einträge wie:

> **R\*-Theorie (Tilman) / Storage-Effekt / Neutraltheorie**
> .

> **Mimikry (Batesian/Müllerian/Mertensian/aggressiv/Automimikry/Vavilov/Pouyann)**
> .

Der Punkt ist kein Tippfehler — **42 Faktoren haben überhaupt keine Beschreibung**, weitere
56 nur eine Wortgruppe. Und **alle 218** zeigen ausschließlich den Fachbegriff.

**Deine Aufgabe:** Gib jedem dieser 218 Faktoren
1. einen **Klartextnamen** — die fette Zeile, die ein Laie versteht, und
2. eine **Erklärung** in ein bis zwei Sätzen — was das ist und warum es für Evolution zählt.

Der Fachbegriff verschwindet nicht; er bleibt als kleiner Untertitel stehen. Du schreibst also
nicht *statt* der Wissenschaft, sondern *davor*.

---

## 2. Was du je Eintrag bekommst

```json
{
  "name": "Allee-Effekt",
  "sektion": "Leben mit anderen Arten",
  "gruppe": "Populationsdynamik",
  "bisher": "reduzierte Fitness bei geringer Dichte (Aussterbe-Beschleuniger).",
  "ebene": "mechanik",
  "warum": "Reduzierte Fitness bei geringer Dichte ist eine dichteabhängige Regel der Populationsdynamik."
}
```

- `bisher` ist die vorhandene Kurznotiz — oft nur ein Punkt. Sie ist ein Hinweis, kein Text,
  den du übernehmen sollst.
- `ebene` und `warum` sagen dir, **wie dieser Faktor im Spiel eingeordnet ist** (aus einem
  früheren Arbeitspaket). Das ist wichtig für den Ton: ein Faktor, der zur „Lebenden Welt"
  gehört, darf nicht klingen, als könnte man ihn gleich am Regler einstellen.

Die Ebenen: `lebende-welt` (braucht mehrere Orte und Arten) · `neues-gen` (bräuchte ein neues
Körpermerkmal) · `mechanik` (betrifft die Evolution selbst) · `zeitachse` (braucht Zyklen) ·
`makro-muster` (eine Beobachtung, nichts zum Einstellen) · `neue-achse` · `schon-regler` ·
`schon-abgedeckt`.

---

## 3. Der Klartextname

**Höchstens 42 Zeichen. Eine Sache, kein Katalogeintrag.**

Die Fachbegriffe sind oft Schrägstrich-Listen mit fünf Synonymen. Dein Name benennt die
**eine Sache**, um die es geht — nicht alle Varianten.

| Fachbegriff | ✅ Klartextname | ❌ falsch |
|---|---|---|
| Janzen-Connell / Priority-Effekte / Nurse-Plants | Wer zuerst da ist, bestimmt mit | Janzen-Connell und Priority-Effekte |
| Mimikry (Batesian/Müllerian/…) | Nachahmung fremder Warnsignale | Mimikry (verschiedene Formen) |
| Allee-Effekt | Zu selten, um sich zu finden | Allee-Effekt (Dichteabhängigkeit) |
| Vagilität / Dispersal-Kernel | Wie weit der Nachwuchs kommt | Vagilität und Ausbreitungskern |
| Panmixie vs. Struktur | Alle mischen sich, oder nicht | Panmixie gegen Populationsstruktur |

Regeln, die maschinell geprüft werden: **kein `/`** im Namen, höchstens eine Klammer, beginnt
groß, 6–42 Zeichen, nicht identisch mit dem Fachbegriff, **unter allen 218 eindeutig**.

Ein Name darf eine Frage oder ein halber Satz sein („Wenn die großen Jäger fehlen") — das ist
oft verständlicher als ein Substantiv-Klotz.

---

## 4. Die Erklärung

**40 bis 200 Zeichen. Ein bis zwei ganze Sätze. Ganz normales Deutsch.**

Sie soll zwei Fragen beantworten: **Was ist das?** und **Warum verändert das Leben?**

✅ Gut:
> „Harmlose Arten kopieren das Aussehen giftiger Vorbilder. Wer die Täuschung besser
> hinbekommt, wird seltener gefressen und gibt sie weiter."

✅ Gut:
> „Wird eine Art zu selten, finden sich Partner nicht mehr zuverlässig. Ab da schrumpft der
> Bestand weiter, obwohl genug Platz und Futter da wären."

❌ Zu fachlich:
> „Dichteabhängige Regulation mit positiver Rückkopplung unterhalb eines kritischen
> Schwellenwertes der Populationsdichte."

❌ Nur der Name nochmal:
> „Der Allee-Effekt beschreibt den Allee-Effekt bei kleinen Populationen."

**Wichtig — Ton und Wahrhaftigkeit:**

- **Keine Versprechen.** Diese 218 Faktoren sind im Spiel **nicht** auslösbar; sie tragen ein
  Etikett, welche Ebene dafür zuständig wäre. Schreib nicht „stell diesen Regler höher".
  Beschreib die **Sache**, nicht die Bedienung.
- **Kein Fachbegriff zur Erklärung eines Fachbegriffs.** Wer „Vagilität" mit „Dispersal-Kapazität"
  erklärt, hat nichts erklärt. Der Prüfstand warnt bei mehreren ungeklärten Fachwörtern und bei
  zu vielen sehr langen Wörtern.
- **Umlaute richtig schreiben.** Kein „braeuchte", kein „Groesse". Diese Texte stehen im Spiel;
  beim ersten Paket kam ASCII-Umschrift zurück und musste nachträglich von Hand repariert
  werden. Der Prüfstand lehnt das jetzt ab.
- Kein Markdown, keine Sternchen, keine Aufzählungszeichen.

---

## 5. Ausgabeformat

```json
{
  "Mimikry (Batesian/Müllerian/Mertensian/aggressiv/Automimikry/Vavilov/Pouyann)": {
    "klartext": "Nachahmung fremder Warnsignale",
    "erklaerung": "Harmlose Arten kopieren das Aussehen giftiger Vorbilder. Wer die Täuschung besser hinbekommt, wird seltener gefressen."
  },
  "Allee-Effekt": {
    "klartext": "Zu selten, um sich zu finden",
    "erklaerung": "Wird eine Art zu selten, finden sich Partner nicht mehr zuverlässig. Ab da schrumpft der Bestand weiter, obwohl Platz und Futter reichen."
  }
}
```

Schlüssel = das Feld `name` aus `P3-eingabe.json`, **zeichengenau** übernommen (inklusive
Schrägstrichen, Klammern, `–` und Sonderzeichen).

---

## 6. Wie geprüft wird

`node tools/plain-import-check.mjs <datei.json>`

1. **Schlüssel** — Namen exakt, alle 218, keine Dubletten, kein bereits aktiver Faktor.
2. **Klartextname** — Länge 6–42, beginnt groß, kein `/`, höchstens eine Klammer, nicht der
   Fachbegriff selbst, unter allen eindeutig.
3. **Erklärung** — Länge 40–200, ganzer Satz mit Satzzeichen, beginnt groß, kein Markdown.
4. **Umlaute** — ASCII-Umschrift führt zur Ablehnung.
5. **Verständlichkeit** — Anteil sehr langer Wörter (Richtwert unter 6 %) und ungeklärte
   Fachbegriffe aus einer Sperrliste. Beides sind Näherungen und erzeugen nur Hinweise,
   aber sie fangen zuverlässig den Fall „Fachbegriff mit Fachbegriff erklärt".

Eine fehlerhafte Zulieferung kommt nicht in den Katalog. Teillieferungen melden die Lücke.

---

## 7. Warum das die Mühe wert ist

Der Katalog ist im Moment ein Museum, in dem 218 Vitrinen unbeschriftet sind. Er enthält das
gesammelte Wissen darüber, was Evolution antreibt — Inselbiogeografie, Koevolution, Rote
Königin, Massenaussterben, Nischenkonstruktion — und der Spieler sieht davon nur Kürzel.

Mit deinen Texten wird daraus etwas, das man **lesen und verstehen** kann, auch wenn man den
Faktor (noch) nicht auslösen kann. Der Anspruch des Projekts ist ausdrücklich, Staunen über die
Vielfalt des Lebens zu wecken — ohne belehrenden Ton. Genau in diesen 436 Texten entscheidet
sich, ob das gelingt.
