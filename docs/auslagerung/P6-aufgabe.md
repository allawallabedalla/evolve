# Arbeitspaket P6 — Erklärungen für die 25 Gene

**Für eine externe Bearbeitung ohne Zugriff auf das Repository.**
Eingabe: `P6-eingabe.json` (25 Gene). Umfang: **25 kurze Texte**. Das kleinste der bisherigen Pakete.

---

## 1. Worum es geht

„Evolve" zeigt das Wesen als Balken für 25 Gene (Wärmedämmung, Größe, Panzerung, Grabtrieb,
Photosynthese, …). Ein Spieler sieht den Namen und den Wert — aber **keine Erklärung**, was
das Gen bewirkt oder wofür es gut ist. Deine Aufgabe: für jedes der 25 Gene ein Tooltip-Text
(erscheint beim Überfahren mit der Maus), der sagt, **was ein hoher Wert bedeutet**.

---

## 2. Was du je Gen bekommst

```json
{
  "index": 13,
  "label": "Grabtrieb",
  "kernGen": false,
  "hinweisAuf": ["unter der Erde ist es sicher", "wer gräbt, entkommt dem, was oben wartet"],
  "hinweisAb": ["der Grabtrieb bringt hier nichts mehr"]
}
```

- `kernGen: true` (10 Gene) — ein **Grundmerkmal des Bauplans**: Wärmedämmung, Größe,
  Gliedmaßen, Stoffwechsel, Panzerung, Photosynthese, Mobilität, Stützgewebe, Flügelfläche,
  Biolumineszenz. Jedes Wesen hat davon immer etwas.
- `kernGen: false` (15 Gene) — eine **Antwort auf einen bestimmten Umweltdruck**: Entgiftung,
  Grabtrieb, Schutzpigment, Frostschutz usw. Ohne den passenden Stressor bleibt das Gen
  standardmäßig niedrig — es lohnt sich erst, wenn die Bedrohung da ist.
- `hinweisAuf` / `hinweisAb` sind Zitate aus der **Chronik des Spiels** (bereits vorhandene
  Erzähl-Bausteine, die erscheinen, wenn dieses Gen gerade unter Auslese steht). Sie sind
  **Stimmungs-Referenz**, kein Text zum Abschreiben — dein Tooltip ist kürzer, direkter und
  steht für sich allein, nicht als Teil eines montierten Satzes.

---

## 3. Was zu schreiben ist

**Ein Satz, 40–160 Zeichen.** Beantworte: *Wofür ist ein hoher Wert gut, und was kostet er?*

✅ Gut:
> „Schützt vor Kälte, aber ein dicker Pelz wird in der Hitze schnell zur Last."

✅ Gut:
> „Erlaubt, sich unter die Erde zurückzuziehen — nützlich vor Räubern, aber ohne Nutzen,
> wo nichts jagt."

❌ Nennt nur den Namen nochmal:
> „Grabtrieb ist der Trieb zu graben."

❌ Absichts-Sprache (Leitplanke des Spiels: ein Wesen *will* nichts, es wird *ausgelesen*):
> „Das Wesen möchte sich eingraben, um sich zu schützen."

**Regeln:**
- Kein Ausrufezeichen, kein Markdown.
- Nenn nicht zwingend den Gen-Namen selbst — der steht daneben, das wäre doppelt.
- **Kern-Gene** (immer relevant) dürfen neutraler klingen; **bedingte Gene** (nur bei
  passendem Stressor sinnvoll) sollten kurz andeuten, *wogegen* sie helfen.
- Umlaute korrekt schreiben (kein „waermedaemmung").

---

## 4. Ausgabeformat

```json
{
  "0": { "erklaerung": "Schützt vor Kälte, aber ein dicker Pelz wird in der Hitze schnell zur Last." },
  "13": { "erklaerung": "Erlaubt, sich unter die Erde zurückzuziehen — nützlich vor Räubern, ohne Nutzen, wo nichts jagt." }
}
```

Schlüssel = der `index` aus `P6-eingabe.json` (als String oder Zahl, beides geht).

---

## 5. Wie geprüft wird

`node tools/gene-import-check.mjs <datei.json>` — alle 25 vorhanden, Länge, Groß-/Kleinschreibung,
Satzzeichen, kein Markdown/Ausrufezeichen, keine Absichts-Sprache, Umlaute korrekt, kein Text
doppelt oder fast identisch zu einem anderen Gen.
