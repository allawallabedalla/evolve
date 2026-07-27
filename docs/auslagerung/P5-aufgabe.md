# Arbeitspaket P5 — „Herausforderungen der Natur" (Inhalt)

**Für eine externe Bearbeitung ohne Zugriff auf das Repository.**
Umfang: **15–30 Herausforderungen**. Das größte der bisherigen Pakete — und das Einzige,
das eine neue Spielidee einführt statt einer bestehenden Lücke zu füllen.

⚠️ **Dieses Paket liefert nur den Inhalt.** Ob und wie Herausforderungen ins Spiel eingebaut
werden (neue Oberfläche, Fortschrittsanzeige, Speicherstand), ist eine separate Entscheidung,
die erst nach Durchsicht des Inhalts getroffen wird. Du schreibst Zieldefinitionen und Text —
keine Programmierung nötig.

---

## 1. Die Idee dahinter

„Evolve" ist bisher ein **Spielzeug**: Der Spieler stellt die Umwelt frei ein, jede Änderung
ist sofort und ohne Kosten möglich. Das erzeugt Neugier, aber keine **Verbindlichkeit** — man
kann nichts falsch machen, also gibt es auch nichts zu meistern.

Eine **Herausforderung** ist ein Ziel mit einer Beschränkung und einem Zeitrahmen, z. B.:

> **Leben ohne Sonne**
> Bring eine Linie ins Reich der Pilze, ohne das Licht je über 0,3 zu heben.
> 500 Generationen.

Der Spieler darf weiter alles einstellen, aber jetzt zählt: *schafft er es innerhalb der
Regel?* Das ist der fehlende Baustein „Kompetenz" — man kann üben, scheitern, es noch einmal
versuchen und dabei lernen, wie die sechs Regler wirklich zusammenspielen.

**Wichtig — die Leitplanken des Spiels gelten hier genauso:** keine Bestrafung, kein Zwang,
kein Zeitdruck durch reale Uhrzeit. Eine Herausforderung ist eine **Einladung**, keine
Pflicht. Wer sie ignoriert, verliert nichts.

---

## 2. Was du bekommst

`P5-eingabe.json` enthält:

```json
{
  "achsen": [
    {"key":"temperature","name":"Temperatur","tief":"kalt","hoch":"heiß"},
    {"key":"predation","name":"Räuber","tief":"sicher","hoch":"tödlich"},
    {"key":"foodAbundance","name":"Nahrung","tief":"...","hoch":"..."},
    {"key":"foodHeight","name":"Nahrungshöhe","tief":"...","hoch":"..."},
    {"key":"light","name":"Licht","tief":"...","hoch":"..."},
    {"key":"water","name":"Wasser","tief":"...","hoch":"..."}
  ],
  "reiche": ["Mikrobe","Protist","Pflanze","Pilz","Tier"],
  "formen": [
    {"reich":"Pflanze","form":"Grünalge","raritaet":"haeufig"},
    {"reich":"Tier","form":"Fluginsekt · Segler","raritaet":"sehr-selten"}
  ]
}
```

- **6 Regler** — das sind die einzigen Achsen, die für Herausforderungen infrage kommen
  (verborgene Stressoren wie Gift/Salz/UV lassen sich nicht ohne Weiteres konstant halten,
  darum bitte nur mit den 6 Reglern arbeiten).
- **5 Reiche** — ein grobes Ziel („werde zum Pilz").
- **44 Formen** mit Seltenheit — ein präzises Ziel („werde zum Fluginsekt"). `raritaet` reicht
  von `haeufig` bis `legendaer` — nütze das für die Schwierigkeit: ein seltenes Ziel ist von
  sich aus schon eine Herausforderung, ein häufiges braucht eine härtere Beschränkung.

---

## 3. Was eine Herausforderung braucht

Vier Zutaten, alle Pflicht:

1. **Ein Ziel** — entweder ein Reich (`ziel.reich`) oder eine konkrete Form (`ziel.form`).
2. **Eine Beschränkung** (`grenzen`) — mindestens ein Regler, den der Spieler NICHT frei
   bewegen darf: `{"light": {"max": 0.3}}` heißt „Licht darf 0,3 nie übersteigen".
   `{"temperature": {"min": 0.6}}` heißt „Temperatur muss immer mindestens 0,6 sein". Die
   übrigen Regler bleiben frei — genau darin liegt die Aufgabe: einen Weg durch die
   verbliebene Freiheit zu finden.
3. **Ein Generationen-Budget** (`generationen`) — realistisch: 300–3000. Als Anhalt: 100
   Generationen sind ein kurzer Selektionspuls, 1000 eine deutliche Anpassung.
4. **Eine Schwierigkeit** (`leicht` / `mittel` / `schwer`).

**Die Beschränkung muss echt einschränken.** Eine Regel, die für das Ziel ohnehin keine Rolle
spielt („werde zum Pilz, ohne die Windhärte zu übertreiben"), ist keine Herausforderung,
sondern Dekoration — das wird beim Prüfen erkannt und zurückgewiesen.

---

## 4. Der Text

**Titel:** höchstens 60 Zeichen, benennt das Bild, nicht die Mechanik. „Leben ohne Sonne" statt
„Pilz-Herausforderung mit Lichtgrenze".

**Beschreibung:** 30–220 Zeichen, ein bis zwei Sätze. Nenn Ziel und Beschränkung in normaler
Sprache — der Spieler muss nicht raten, was gemeint ist.

✅ Gut:
> „Bring eine Linie ins Reich der Pilze, ohne das Licht je über 0,3 zu heben."

❌ Zu technisch:
> „ziel.reich = Pilz, grenzen.light.max = 0.3"

❌ Klingt nach Zwang (Leitplanke „kein Sammelzwang"):
> „Du musst es in 500 Generationen schaffen, sonst hast du verloren!"

Kein Ausrufezeichen, keine Drohung, kein „schaffe es rechtzeitig". Formulier es als offene
Einladung: „Bring …", „Halt …", „Erreiche …" — nicht als Countdown.

---

## 5. Vorschläge für die Bandbreite

Damit die 15–30 Herausforderungen nicht alle dieselbe Form haben:

- **Reich-Ziele** (breiter, für den Einstieg): „Werde zur Pflanze, ohne dass die Nahrung je
  unter 0,2 fällt" — leichter, weil ein ganzes Reich viele Formen umfasst.
- **Form-Ziele** (präziser, für Fortgeschrittene): „Werde zum Leuchtwesen der Tiefsee" — ein
  einzelner Archetyp, oft von Natur aus selten.
- **Gegensätzliche Beschränkungen**: ein Ziel, das dem naheliegenden Weg dorthin widerspricht
  („werde zum Tier, aber ohne dass der Räuberdruck je über 0,2 steigt" — Tiere entstehen sonst
  oft gerade WEGEN Räubern).
- **Enge Zeitfenster**: eine kurze Generationen-Zahl für ein Ziel, das sonst leicht erreichbar
  wäre — macht Tempo zum Thema.
- **Seltene Formen als Ziel**: eine `raritaet: sehr-selten`- oder `legendaer`-Form OHNE
  zusätzliche künstliche Beschränkung — die Seltenheit selbst ist schon die Herausforderung.

---

## 5b. Du brauchst die Spiel-Engine NICHT — hier ist die Antwort, warum

Falls die Frage aufkommt „wie prüfe ich, ob mein Ziel überhaupt erreichbar ist, ohne die
Engine laufen zu lassen": **das musst du nicht.** Genau dafür gibt es
`node tools/challenge-import-check.mjs deine-datei.json` auf unserer Seite — der lädt die
echte Engine (`app/index.html`) und **simuliert** jede deiner Herausforderungen tatsächlich.
Du lieferst nur Text + Zieldefinitionen, keine Simulation.

Damit deine Vorschläge trotzdem beim ersten Versuch treffen, liefert `P5-eingabe.json` jetzt
zusätzlich `biomeBeispiele` — **12 bereits bekannte, funktionierende Umwelt-Rezepte** aus dem
Spiel selbst, jedes mit seinem echten Konvergenz-Ergebnis (800 Generationen, in der Engine
gemessen):

```json
{"name":"Moderwald","env":{"temperature":0.5,"light":0.15,"water":0.85,"foodAbundance":0.5,"predation":0.3,"foodHeight":0.2},
 "nachGenerationen":{"form":"Protist · Euglenoid · Mixotroph","reich":"Protist","passung":11}}
```

Nutze diese als **Ausgangspunkt**, nicht als Zwang: Willst du eine Herausforderung mit Ziel
„Pilz", schau dir „Reiche Kronen" an (→ Hefe) — eine Beschränkung, die *nah* an diesem Rezept
bleibt (z. B. nur EINE seiner Achsen einschränkt), ist mit hoher Wahrscheinlichkeit lösbar.
Eine Beschränkung, die *weit* von jedem bekannten Rezept wegführt, ist ein Risiko — kann
klappen, kann aber auch am Budget scheitern. Beides ist okay, der Prüfstand sagt dir danach,
was zutrifft.

## 6. Ausgabeformat

```json
[
  {
    "id": "pilz-ohne-licht",
    "titel": "Leben ohne Sonne",
    "beschreibung": "Bring eine Linie ins Reich der Pilze, ohne das Licht je über 0,3 zu heben.",
    "ziel": { "reich": "Pilz" },
    "grenzen": { "light": { "max": 0.3 } },
    "generationen": 600,
    "schwierigkeit": "mittel"
  }
]
```

`id`: kurz, in Kleinbuchstaben mit Bindestrichen, eindeutig innerhalb der Liste.

---

## 7. Wie geprüft wird

`node tools/challenge-import-check.mjs <datei.json>` — und zwar **nicht durch Lesen**, sondern
durch echte Simulation:

1. **Form** — Pflichtfelder, bekannte Achsen/Reiche/Formen, Textlänge und -ton.
2. **Erreichbarkeit** — 24 Stichproben-Umwelten, die deine Beschränkung einhalten, laufen
   tatsächlich über das angegebene Generationen-Budget. Wird das Ziel **nie** erreicht, gilt
   die Herausforderung als Attrappe und wird zurückgewiesen.
3. **Echte Beschränkung** — dieselben Stichproben laufen zusätzlich OHNE deine Beschränkung.
   Ist die Erfolgsquote fast identisch, testet die Beschränkung nichts — Hinweis, kein Fail.
4. **Schwierigkeit** — die gemessene Erfolgsquote wird gegen dein `leicht`/`mittel`/`schwer`
   gehalten (grobe Bänder: leicht ≥ 40 %, mittel 12–65 %, schwer ≤ 25 %). Passt es nicht,
   gibt es einen Hinweis — das ist als Anhalt gedacht, nicht als exakte Vorgabe.

Eine Herausforderung, die im Budget nicht lösbar ist, kommt **nicht** ins Spiel — genau wie
bei den Umwelt-Einflüssen gilt: lieber weniger Herausforderungen als eine, die niemand
schaffen kann.
