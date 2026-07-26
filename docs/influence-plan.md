# Arbeitsplan — „Umwelt-Einfluss auslösen" fertigstellen

**Auftrag (Nutzer, 2026-07-26):** Die Funktion „Umwelt-Einfluss auslösen" soll fertig werden.
Selbstständige Nachtarbeit in Stufen; nach jeder Stufe committen + pushen.

> **Diese Datei ist der Zustandsspeicher der Arbeit.** Nach jeder *tatsächlich* erledigten
> Stufe hier den Haken setzen und die **gemessenen** Befunde notieren — nie im Voraus.
> Arbeitszweig: `claude/storytelling-evolution-catalog-uibufo`.

## Ausgangslage (gemessen 2026-07-26)

`docs/faktoren-katalog.md` → `tools/build-influences.mjs` (EFFECTS) → `app/influences.js` → Modal.

| Sektion | aktiv / gesamt |
|---|---|
| 1 · Ort & Klima | 25 / 53 |
| 2 · Katastrophen & Welt-Ereignisse | 10 / 27 |
| 3 · Raum & Isolation | 0 / 44 |
| 4 · Leben mit anderen Arten | 0 / 47 |
| 5 · Körper & Gene | 0 / 12 |
| 6 · Fortpflanzung & Lebensweg | 0 / 31 |
| 7 · Wie Evolution läuft | 0 / 29 |
| 8 · Zufall & Schicksal | 0 / 9 |
| 9 · Große Muster der Vielfalt | 0 / 21 |
| 10 · Mensch & moderne Welt | 0 / 11 |
| **gesamt** | **35 / 284 (12 %)** |

## Was „fertig" heißt (Definition)

„Alle 284 Faktoren aktiv" ist das falsche Ziel: die Sektionen 3–9 sind **keine Umwelt-Einflüsse
auf eine einzelne Linie**, sondern brauchen andere Ebenen (Metapopulation `world/`,
Lebensgeschichte-Gene, Evolutions-Mechanik). Sie hier zu „aktivieren" hieße, Wirkung
vorzutäuschen — genau die Attrappe, die das Projekt sonst vermeidet.

**Fertig heißt darum:**

1. **Jeder Faktor, der wirklich ein Umwelt-Einfluss ist** (Sektionen 1, 2, 10 + Einzelfälle),
   hat einen echten, **gemessen wirksamen** Effekt auf die 16 Umwelt-Achsen.
2. **Jeder andere Faktor** ist nicht mehr vage „kommt bald", sondern trägt sichtbar die
   **zuständige Ebene** („gehört zur Lebenden Welt", „braucht ein Fortpflanzungs-Gen").
   Ehrlichkeit statt Versprechen.
3. **Kein Faktor ist eine Attrappe**: der Prüfstand weist für jeden aktiven Faktor nach, dass
   er die Selektion messbar verschiebt — und dass keine zwei Faktoren dasselbe tun.
4. **Das Modal ist zu Ende gebaut**: Suchen, Wirkungs-Vorschau, Zurücknehmen, sichtbarer
   Stapel aktiver Einflüsse.

## Stufen

- [x] **S0 · Prüfstand** `tools/influence-check.mjs` (`npm run influence-check`):
      Vollständigkeit (env/plain/desc/tone), **Wirksamkeit** (Konvergenz-Lauf: verschiebt der
      Faktor Genom/Archetyp messbar gegenüber dem Ausgangsmilieu?), **Redundanz**
      (keine zwei Faktoren mit fast gleichem Achsen-Fingerabdruck), Abdeckungs-Bericht.
- [ ] **S1 · Sektion 1 vervollständigen** (28 offene Faktoren) — jeder mit Achsen-Mapping,
      Klartextnamen, Ton; danach `influence-check` grün.
- [ ] **S2 · Sektion 2 vervollständigen** (17 offene) — Katastrophen/Zyklen/Massenaussterben,
      soweit als Umwelt-Zustand darstellbar.
- [ ] **S3 · Sektion 10 anthropogen** (11 offene) — Habitatverlust, Verschmutzung, Klimawandel,
      Lichtverschmutzung, Urbanisierung, Übernutzung …
- [ ] **S4 · Ehrliche Einordnung der Rest-Sektionen** — `layer`-Feld statt `soon`:
      „Lebende Welt", „Fortpflanzung", „Evolutions-Mechanik", „Makro-Muster"; Modal zeigt es an.
- [ ] **S5 · Modal fertig** — Suchfeld, Wirkungs-Vorschau (welche Achsen, vorher→nachher),
      „Einfluss zurücknehmen", sichtbarer Stapel aktiver Stressoren, a11y-Durchgang.
- [ ] **S6 · Chronik-Anbindung** — faktor-spezifische Erzähl-Zeilen für die neuen Einflüsse.
- [ ] **S7 · Abschluss** — Doku, `BACKLOG.md`/`resume.md`, Browser-Test, PR nach `main`.

## Regeln für diese Arbeit

- Engine/Physik/Validität bleiben **unberührt** (`physics.json`, `engine/fitness.ts`, Orakel).
  Alle Einflüsse arbeiten ausschließlich mit den bereits vorhandenen 16 Umwelt-Achsen.
- Quelle der Wahrheit bleibt `docs/faktoren-katalog.md`; Effekte in `tools/build-influences.mjs`
  pflegen und **neu generieren** (`npm run build-influences`) — `app/influences.js` nie von Hand.
- Nach jeder Stufe: `npm run influence-check` + `npm run story-check`, dann committen + pushen.
- Keine Attrappen: lieber ein Faktor weniger als ein Faktor ohne messbare Wirkung.
- **Nichts als erledigt eintragen, das nicht gelaufen ist.** Befunde nur aus echten Läufen.

## Fortschritts-Notizen

### 2026-07-26 · Auftakt
Ausgangslage vermessen (35/284 aktiv). Definition von „fertig" festgelegt (siehe oben), damit
die Arbeit nicht in 249 Schein-Aktivierungen läuft. Stufen S0–S7 stehen.

### S0 · Prüfstand — erledigt
`tools/influence-check.mjs` (`npm run influence-check`). Er extrahiert PHYS/PARAMS/fitness/
stepGeneration/classify aus `app/index.html` (App = maßgebliche Fassung, wie `app-parity`)
und lässt je Faktor eine deterministische Konvergenz über 400 Generationen laufen. Gemessen
wird die L1-Verschiebung des Endgenoms gegen das neutrale Ausgangsmilieu.

**Drei echte Befunde beim ersten Lauf:**
1. **Eine Attrappe:** „Grelles Sonnenlicht" (`light: 0.96` und sonst nichts) verschob die
   Evolution um **L1 0,07** — praktisch nicht messbar. Grund: im Ausgangsmilieu ist das Wesen
   ein Mixotroph, und Licht allein ändert die Rechnung nicht, solange Nahrung reichlich ist.
   Behoben, indem volle Sonne als ORT abgebildet wird (Hitze + Verdunstung + weniger Nahrung).
2. **Eine Dublette:** „Lichtlose Tiefe" und „Dunkle Höhle" lagen 0,05 auseinander — zwei Namen,
   ein Milieu. Getrennt in Wassersäule (Druck, nass, kalt) vs. Fels (nahrungsarm, schlecht
   belüftet, konstant).
3. **Eine echte Lücke:** die Achse **`predation` wird von KEINEM der 284 Faktoren benutzt.**
   Räuberdruck — einer der sechs Kern-Regler — ist über „Umwelt-Einfluss" gar nicht erreichbar,
   weil er in Sektion 4 (Leben mit anderen Arten) steckt, die komplett auf „kommt bald" steht.
   → In S1/S2 einplanen: mindestens ein paar Faktoren, die Räuberdruck real setzen
   (Raubtier-Einwanderung, Prädations-Freisetzung auf Inseln, Massenaussterben der Jäger).

**Weitere Messwerte des ersten Laufs (Ausgangspunkt für S1):**
- Ø L1-Verschiebung 2,79 über 35 Faktoren.
- Die 35 Faktoren erzeugen zusammen nur **11 verschiedene Formen**; „Fisch · Aalform" (9×),
  „Protist · Amöbe" (6×) und „Euglenoid" (6×) dominieren. Die Vielfalt der Einflüsse ist also
  deutlich kleiner, als die Faktor-Zahl suggeriert — dieselbe Lehre wie beim Erzählwerk.
- Mehrere Katastrophen enden bei 3–9 % Passung (Eiszeit, Dürre, Extremchemie). Das ist für
  Katastrophen plausibel, sollte aber in S1 im Blick bleiben: eine Welt, in der nichts mehr
  gedeiht, erzählt keine Geschichte.
