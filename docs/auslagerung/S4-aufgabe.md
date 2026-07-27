# Arbeitspaket S4 — Einordnung der inaktiven Katalog-Faktoren

**Für eine externe Bearbeitung (lokale KI oder Mensch) ohne Zugriff auf das Repository.**
Alles, was du brauchst, steht in dieser Datei und in `S4-eingabe.json`.

---

## Worum es geht

„Evolve" ist ein Evolutions-Spiel: Der Spieler stellt nie das Tier ein, sondern nur dessen
**Umwelt**. Das Wesen entwickelt sich daraufhin über Generationen — echte Selektion auf einem
Genom aus 25 Merkmalen.

Die Umwelt hat genau **16 Achsen**, jede von 0 bis 1:

| Achse | Bedeutung | Ruhewert |
|---|---|---|
| `temperature` | Wärme (0 = Eis, 1 = Glut) | 0.5 |
| `predation` | Räuberdruck | 0.3 |
| `foodAbundance` | Nahrungsfülle | 0.5 |
| `foodHeight` | Höhe, in der Nahrung hängt | 0.2 |
| `light` | Lichtangebot | 0.5 |
| `water` | Wasser/Feuchte | 0.6 |
| `toxicity` | Giftigkeit des Milieus | 0 |
| `oxygen` | Sauerstoff (1 = normal, tiefer = Hypoxie) | 1 |
| `salinity` | Salzgehalt | 0 |
| `uv` | UV-Strahlung | 0 |
| `pressure` | Wasserdruck/Tiefe | 0 |
| `aridity` | Austrocknungs-Nachfrage | 0 |
| `radiation` | ionisierende Strahlung | 0 |
| `fire` | Feuer-Regime | 0 |
| `frost` | tiefer Frost | 0 |
| `wind` | Wind-Exposition | 0 |

Im Spiel gibt es einen Knopf **„Umwelt-Einfluss auslösen"**. Dahinter liegt ein Katalog von
284 Faktoren aus der ökologischen und evolutionsbiologischen Literatur. **66 davon sind
umgesetzt** — sie setzen echte Werte auf diesen Achsen. Die **218 übrigen** stehen im Spiel
bisher pauschal als „kommt bald" da.

**Das ist unehrlich**, denn die meisten davon werden *nie* ein Umwelt-Einfluss werden — sie
gehören schlicht auf eine andere Ebene des Spiels. Deine Aufgabe ist, jedem dieser 218
Faktoren zu sagen, **wer für ihn zuständig ist**.

---

## Deine Aufgabe

Ordne **jeden** der 218 Faktoren aus `S4-eingabe.json` genau **einer** Ebene zu und begründe
das in einem Satz.

### Die erlaubten Ebenen

| `layer` | Wann |
|---|---|
| `umsetzbar` | Lässt sich **doch** als Umwelt-Zustand auf den 16 Achsen abbilden. **Dann bitte einen `env`-Vorschlag mitliefern** (siehe unten). |
| `zeitachse` | Braucht einen zeitlichen Verlauf: Schwankung, Zyklus, Saison, Puls, Häufigkeit. Die Engine kennt nur Momentaufnahmen — ein *schwankender* Zustand ist etwas anderes als ein hoher oder tiefer. |
| `lebende-welt` | Braucht mehrere Orte und Populationen: Isolation, Genfluss, Barrieren, Wanderung, Nachbararten, Koevolution, Artbildung. |
| `neue-achse` | Bräuchte eine Umwelt-Achse, die es nicht gibt (z. B. CO₂, Gravitation, Magnetfeld, Sauerstoff **über** Normalniveau). |
| `neues-gen` | Bräuchte ein neues Merkmal im Genom: Fortpflanzungsstrategie, Lebensdauer, Brutpflege, Paarungssystem, Dormanz. |
| `mechanik` | Betrifft die Evolutions-Mechanik selbst: Drift, Vererbungsmodus, Kopplung, Mutationsrate, Selektionsart. |
| `makro-muster` | Eine **Beobachtung** an fertigen Ergebnissen, nichts zum Einstellen (Diversitätskurven, Artbildungsmuster, Konvergenz). |
| `schon-regler` | Deckt sich mit einem der sechs Regler in der Konsole (Temperatur, Räuberdruck, Nahrung, Nahrungshöhe, Licht, Wasser). |
| `schon-abgedeckt` | Deckt sich inhaltlich mit einem bereits umgesetzten Faktor oder ist eine Zusammenfassung mehrerer. |

### Ausgabeformat

Eine einzige JSON-Datei. Schlüssel = **der Faktorname exakt wie in der Eingabe**
(Zeichen für Zeichen, inklusive Schrägstrichen, Klammern und Sonderzeichen):

```json
{
  "Saisonalität (Jahreszeiten)": {
    "layer": "zeitachse",
    "grund": "Ein schwankender Zustand ist etwas anderes als ein hoher oder tiefer; die Engine kennt nur Momentaufnahmen."
  },
  "Nebel/Tau-Interzeption": {
    "layer": "umsetzbar",
    "grund": "Küstennebel liefert Wasser aus der Luft bei wenig Licht — das ist ein eigenständiges Milieu.",
    "tone": "bio",
    "env": { "water": 0.72, "aridity": 0.45, "light": 0.35, "temperature": 0.44 }
  }
}
```

`tone` ist einer von `hit` (Katastrophe), `shift` (Milieu-Wechsel), `bio` (günstig).

### Regeln

- **Alle 218** müssen vorkommen, jeder genau einmal. Keine erfundenen Einträge.
- **Namen exakt übernehmen.** Auch typografische Anführungszeichen und `–` gegen `-` nicht tauschen.
- `grund`: **ein** Satz, höchstens 160 Zeichen, reiner Text (kein Markdown, keine Sternchen).
  Er soll erklären, *warum diese Ebene*, nicht den Faktor nacherzählen.
- Ton: nüchtern und sachlich. Der Text erscheint später im Spiel.
- **Im Zweifel nicht `umsetzbar`.** Ein Faktor, der etwas anderes tut als sein Name verspricht,
  ist schlimmer als einer, der ehrlich auf eine andere Ebene verweist.

### Wenn du `umsetzbar` vergibst

Dann muss der Vorschlag die Selektion **messbar verschieben** — sonst blitzt im Spiel nur die
Animation, und das Wesen entwickelt sich exakt wie vorher. Faustregeln:

- **Eine einzelne Achse reicht meist nicht.** Ein realer Ort ist ein *Bündel*: volle Sonne heißt
  auch Hitze und Verdunstung; eine Höhle heißt dunkel **und** nahrungsarm **und** schlecht belüftet.
- **Neue Kombinationen sind wertvoller als neue Zahlen.** Es gibt schon 66 Faktoren; ein weiterer,
  der fast dasselbe Milieu trifft, wird als Dublette abgelehnt.
- Werte immer zwischen 0 und 1. Nicht gesetzte Achsen fallen auf ihren Ruhewert zurück.

---

## Wie das Ergebnis geprüft wird

Die Zulieferung geht durch `node tools/layer-import-check.mjs <datei.json>`. Der prüft
**maschinell** und übernimmt nichts, solange etwas beanstandet ist:

1. **Namens-Treue** — jeder Schlüssel muss exakt einem Katalog-Faktor entsprechen.
2. **Vollständigkeit** — alle 218, keine Dubletten.
3. **Wertebereich** — `layer` aus der Liste, `grund` vorhanden, kurz und ohne Markdown.
4. **Keine Übergriffe** — bereits aktive Faktoren dürfen nicht umetikettiert werden.
5. **Wirksamkeit** — jeder `env`-Vorschlag durchläuft sofort denselben Test wie ein echter
   Faktor: eine deterministische Konvergenz über 400 Generationen. Verschiebt der Vorschlag
   das Endgenom um weniger als L1 0,25 gegenüber dem neutralen Milieu, gilt er als Attrappe
   und wird abgelehnt. Zusätzlich wird gegen alle 66 bestehenden Faktoren auf Dubletten geprüft.

Das heißt: **eine fehlerhafte Zulieferung kann nichts kaputt machen** — sie kommt gar nicht erst
in den Generator. Im schlimmsten Fall kostet sie eine Runde Nacharbeit.

---

## Gute Beispiele (bereits entschieden)

Diese Einordnungen wurden beim Bearbeiten der Sektionen 1, 2 und 10 getroffen und zeigen den
gewünschten Maßstab:

| Faktor | Ebene | Begründung |
|---|---|---|
| Mitteltemperatur | `schon-regler` | Deckt sich vollständig mit dem Temperatur-Regler. |
| Wetter-Stochastik | `zeitachse` | Unvorhersehbarkeit ist ein Verlauf, kein Zustand. |
| Landbrücken / Meeresspiegel | `lebende-welt` | Verbindet oder trennt Orte — Sache der Metapopulation. |
| Große Sauerstoff-Krise (GOE) | `neue-achse` | Unsere `oxygen`-Achse endet bei „normal"; eine O₂-Vergiftung von Anaerobiern ist damit nicht darstellbar. |
| Domestikation / künstliche Zucht | `neues-gen` | Hier wählt ein Züchter Merkmale aus, nicht die Umwelt; Zahmheit ist kein Umweltzustand. |
| Ernte-induzierte Evolution | `neues-gen` | Bräuchte größenselektive Prädation; unsere `predation`-Achse trifft alle Größen gleich. |
| Auslöser-Bündel | `schon-abgedeckt` | Fasst Vulkanismus, Anoxie und Impakt zusammen — alle drei sind einzeln umgesetzt. |
| Freie Nischen → adaptive Radiation | `schon-abgedeckt` | Deckt sich mit dem umgesetzten Faktor „Freie Nische". |

---

## Was ausdrücklich **nicht** Teil dieses Pakets ist

Der Umbau der Oberfläche (Suchfeld, Wirkungs-Vorschau, Zurücknehmen) gehört **nicht** dazu.
Der liegt in einer einzigen, 3500 Zeilen langen Datei mit projekteigenen Konventionen — dort
wäre ein von außen zugelieferter Patch echtes Integrationsrisiko. Dieses Paket ist bewusst so
geschnitten, dass die Zulieferung **reine Daten** sind.
