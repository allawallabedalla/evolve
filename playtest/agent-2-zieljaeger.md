# Spieltest-Bericht — Persona "Ziel-Jäger"

Ich wollte gezielt bestimmte Lebewesen ERSCHAFFEN und prüfen, ob das Spiel meine
Absicht belohnt. Getestet über die freie Umwelt:
`node dist/cli/demo.js "" <temp> <pred> <food> <höhe> <licht> <wasser> <gens>`.

## Gesamturteil

Die Vision trägt für das **Tier-Reich** überraschend gut: alle 7 Tier-Archetypen
lassen sich gezielt ansteuern, und die Baupläne (Größe, Fell, Panzer, Beine,
Fortbewegung) reagieren nachvollziehbar auf die Regler. Für das **Pflanzen-Reich
bricht die Vision fast komplett zusammen**: von 5 Pflanzen-Archetypen ist real nur
EINER erreichbar (der verholzte Strauch 🪴), weil Stützgewebe *immer* über 0.6
saturiert, sobald Photosynthese aktiv ist — Baum, Kaktus, Kraut und behaarte
Kältepflanze sind praktisch unbaubar. Ganze Baupläne (Fliegen, Graben,
Filtrieren, Fleischfresser-Pflanze) fehlen mangels Genen/Achsen völlig. Fazit:
"fast alles" gilt für Tiere, für Pflanzen und Sonder-Nischen deutlich nicht.

## Ziel-Versuche

| # | Ziel | Einstellung (temp pred food höhe licht wasser gens) | Ergebnis (Archetyp + Bauplan) | Getroffen? |
|---|------|------|------|-----|
| 1 | Eisbär (großer Pelzriese) | `0 0 0.9 1.0 0.1 0.2 90` | 🐺 Aktiver Grossjaeger — **riesig, dichtes Fell, schwerer Läufer** | teils (Bauplan perfekt, aber Label "Grossjäger", keine eigene "Pelzriese"-Klasse) |
| 2 | Kaktus / Wüstenpflanze (🌵 bewehrte Pflanze) | `0.9 0.85 0 0 0.4 0.7`; auch `0.9 1.0 0 0 0.35 1.0` | 🪴 Strauch bzw. 🦠 Mischotroph — Panzer bleibt < Stützgewebe | **nein** (Struktur schlägt immer Panzer als Pflanzen-Verteidigung) |
| 3 | Schneller Raubjäger (🐺) | `0.6 0.0 1.0 1.0 0.1 0.2 100` | 🐺 Aktiver Grossjaeger — riesig, nackt, schwerer Läufer, Fress-/Greifwerkzeug | **ja** |
| 4 | Baum (🌳 verholzt/baumartig) | `0.5 1.0 0 1.0 1.0 1.0 150` (max Räuber, max Höhe) | 🪴 Strauch — Struktur 0.97, **Größe deckelt bei 0.42** (<0.45-Schwelle) | **nein** (Pflanzen-Größe strukturell begrenzt) |
| 5 | Maulwurf / Grabtier | — (kein Grab-/Wühl-Gen) | keine Achse vorhanden | **nein** (fehlende Mechanik) |
| 6 | Filtrierer | — (kein Ernährungsmodus-Gen) | keine Achse vorhanden | **nein** (fehlende Mechanik) |
| 7 | Etwas Fliegendes | — (kein Flug-/Flügel-Gen) | keine Achse vorhanden | **nein** (fehlende Mechanik) |
| 8 | Tiefsee-Wesen | `0.1 0.6 0.5 0.3 0.0 1.0 80` (Licht 0 erzwingt Tier) | 🦊 Fell-Warmblüter — winzig, Fell | teils (Dunkel zwingt korrekt in den Tier-Pfad, aber generisch, keine Tiefsee-Merkmale) |
| 9 | Panzertier / Schildkröte (🐢) | `0.5 0.85 0.5 0.1 0.1 0.2 80` | 🐢 Gepanzertes Beutetier — winzig, Panzerplatten, Verteidigungsstacheln | **ja** |
| 10 | Fleischfressende Pflanze | `0.9 0.85 0 0 0.4 0.7` u.a. | 🦠 Mischotroph (Näherung) | **nein** ("exclusion" verbietet Photosynthese+Jagd gleichzeitig) |
| 11 | Winziges Insekt-Tier (🐭) | `0.6 0.0 0.4 0.0 0.1 0.2 80` | 🐭 Kleines flinkes Tier — winzig, 1 Segment, kurze Extremitäten | **ja** |
| 12 | Gepanzerter Koloss (🦏) | `0.6 0.35 0.95 0.85 0.1 0.2 80` | 🦏 Gepanzerter Koloss — riesig, Panzer, schwerer Läufer | **ja** |
| 13 | Fell-Warmblüter (🦊) | `0.0 0.1 0.5 0.2 0.1 0.2 80` | 🦊 Fell-Warmblüter — winzig, dichtes Fell | **ja** |
| 14 | Behaarte Kältepflanze (🌿) | `0.0 0.0 0 0 0.45 1.0 100` | 🪴 Strauch — Fell 0.79 **aber** Struktur 0.80 (>0.6 → Strauch) | **nein** (Struktur saturiert immer) |
| 15 | Kraut / niedrige Pflanze (☘️) | `0.5 0.0 0 0 0.55 1.0 100` | 🪴 Strauch — Struktur 0.93 selbst OHNE Räuber | **nein** (Struktur saturiert immer) |
| 16 | Mischotroph (🦠) | `0.9 0.85 0 0 0.4 0.7 100` | 🦠 Mischotroph — Werte bei 0.5 „stecken geblieben" | **ja** (aber als instabiler Sattelpunkt, nicht als echte Nische) |
| 17 | Generalisten-Tier (🦎) | `0.5 0.0 0.85 0.68 0.1 0.2 70` | 🦎 Generalist — Größe 0.45 | **ja** (sehr schmales Fenster: Höhe 0.62→🐒, 0.68→🦎) |
| 18 | Kletterer / Springer (🐒) | `0.5 0.5 0.5 0.5 0.5 0.5 40` (Default) | 🐒 Behänder Kletterer/Springer | **ja** |

**Bilanz:** 9 von 13 Archetypen gezielt erreichbar (alle 7 Tiere + Strauch +
Mischotroph). 4 von 5 Pflanzen-Archetypen unerreichbar.

## Wo der Möglichkeitsraum endet

**1. Das Pflanzen-Reich kollabiert auf einen einzigen Archetyp.**
Stützgewebe erhöht die Lichtausbeute (`lightAccess = 0.4 + 0.6*structure`), darum
maximiert es sich, sobald Photosynthese lohnt — selbst bei Räuberdruck 0 (Test 15:
Struktur 0.93 ohne Räuber). Ergebnis: jede Pflanze überschreitet `structure>0.6`
und wird zum 🪴 Strauch. Die Sub-Archetypen mit `structure<0.6` (Kraut ☘️,
behaarte Kältepflanze 🌿, bewehrte Pflanze/Kaktus 🌵) liegen auf einer
Messerschneide, die die Dynamik überspringt: bei Licht 0.3 bleibt alles im
Mischotroph-Patt bei 0.5, bei Licht 0.45 sitzt Struktur schon bei 0.80. Es gibt
kein Regler-Fenster dazwischen.

**2. Der Baum ist mathematisch unerreichbar.**
🌳 verlangt `size>0.45`, aber Pflanzen-Größe bringt keinen Energievorteil (nur
Struktur zahlt auf Photosynthese ein) und kostet am meisten Unterhalt (0.22).
Selbst bei maximalem Räuberdruck über 150 Generationen deckelt die Größe bei 0.42
— knapp unter der Schwelle. Kein realer "großer" Pflanzen-Typ ist baubar.

**3. Der Pflanzen-Kaktus ist blockiert.**
🌵 verlangt `armor>0.5` bei `structure<0.6`. Aber für Pflanzen ist Struktur der
billigere Verteidigungsweg (sie ist ohnehin schon hoch für die Lichtausbeute),
also wird Panzer nie über Struktur gewählt. "Bewehrte Pflanze" ist tot.

**4. Fehlende Bau-Achsen (gar kein Gen vorhanden):**
- **Flug / Flügel** — kein Anhang-Typ, keine Achse. Kein Vogel, kein Insektenflug.
- **Graben / Wühlen** — kein Maulwurf, kein Grabtier.
- **Filtrieren / Ernährungsmodus** — nur die binäre Photosynthese-vs.-Jagd-Achse;
  Filtrierer, Aasfresser, Parasit, Symbiont fehlen.
- **Fleischfressende Pflanze** — der `exclusion`-Term (0.8) macht Photosynthese und
  Nahrungssuche gegenseitig ausschließend; ein Mischwesen ist per Design verboten,
  bestenfalls entsteht das instabile Mischotroph-Patt.
- **Aquatisch / Schwimmen** — Wasser ist nur ein Photosynthese-Input, keine
  Fortbewegungs-/Habitatachse. Fisch, Wal, Qualle nicht darstellbar.
- **Sinne / Biolumineszenz / Tarnung / Gift** — keine Achsen; das "Tiefsee-Wesen"
  wird zum generischen kleinen Fellklumpen, weil Licht 0 nur den Tier-Pfad erzwingt.

**5. Label-Grenze bei großen Fell-Tieren.**
Ein riesiges Fell-Tier (Eisbär, Mammut) entsteht als *Bauplan* korrekt (Test 1:
riesig + Fell + schwerer Läufer), bekommt aber immer das Label "Grossjäger" oder
"Koloss", weil die Fell-Klasse 🦊 in `classify()` nach den Größe/Panzer-Checks
kommt und keinen Größen-Ast hat. Die Absicht "Pelzriese" wird also nicht als
eigene Auszahlung benannt.

**6. Generalist & Mischotroph nur auf Messerschneide.**
🦎 braucht Größe exakt in [0.3, 0.6] — bei Höhe 0.62 kam noch 🐒, erst bei 0.68 🦎.
🦠 ist kein bewohnbarer Zustand, sondern der Sattelpunkt, an dem beide
Energiepfade gleich schlecht sind. Beide fühlen sich wie Zufallstreffer an, nicht
wie ansteuerbare Ziele.

## Ideen fürs Backlog

**Pflanzen-Reich reparieren (höchste Priorität):**
- Stützgewebe von der Lichtausbeute **entkoppeln** oder deckeln: einen separaten
  `heightForLight`-Beitrag einführen, sodass Struktur nur bei echter
  Lichtkonkurrenz (hohe `foodHeight`/Nachbarschaft) über 0.6 steigt. Dann werden
  Kraut ☘️ (wenig Struktur, viel Blatt) und Strauch wieder unterscheidbar.
- Pflanzen-Größe an einen Vorteil koppeln (z.B. Wasserspeicher in Dürre, oder
  Größe erhöht die Blattfläche/Lichtabfang), damit `size>0.45` und damit der Baum
  🌳 erreichbar wird. Alternativ die Baum-Schwelle auf das real erreichbare Maximum
  (~0.4) senken.
- Für den Kaktus 🌵 einen eigenen Trockenheits-Panzer-Anreiz schaffen: bei
  `water` niedrig + `light` hoch soll Panzerung/Sukkulenz (Wasserspeicher) statt
  Verholzung selektiert werden.

**Neue Gene / Achsen (erweitern den Raum spürbar):**
- **Flug/Gleiten** (Gen "Flügelfläche"): belohnt bei hoher `foodHeight` + niedriger
  Größe; ermöglicht Vögel/Insekten und eine echte 3D-Nahrungsachse.
- **Grabvermögen** (Gen "Grabklauen"): belohnt bei hohem Räuberdruck + Boden-Nahrung
  als Flucht-/Versteck-Strategie → Maulwurf, Wühlmaus.
- **Ernährungsmodus** als eigene Achse (Filtrierer/Aasfresser/Parasit) statt der
  binären Photo-vs-Jagd-Gabel; erlaubt auch eine echte fleischfressende Pflanze,
  indem `exclusion` situativ (bei Nährstoffmangel) aufgehoben wird.
- **Aquatischer Regler** (Habitat: Land/Wasser/Tiefsee) mit eigener Fortbewegung
  (Schwimmen) und Merkmalen (Stromlinienform, Kiemen, Biolumineszenz bei Licht 0).

**Klassifikation glätten:**
- 🦊 einen Größen-Ast geben (`insul>0.6 & size>0.6` → "Fell-Riese/Eisbär-Typ"),
  damit der bereits erzeugte Pelzriesen-Bauplan seine eigene Auszahlung bekommt.
- Übergangsform 🦠 zu einer echten, stabilen Nische machen (z.B. Euglena-artiger
  Mixotroph im Halbschatten) statt eines instabilen Sattelpunkts.
- Die schmalen Größen-Fenster (🦎 vs 🐒 vs 🐭) mit weicheren Übergängen oder mehr
  Zwischen-Archetypen füllen, damit gezieltes Ansteuern weniger nach Glück wirkt.
