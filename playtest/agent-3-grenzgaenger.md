# Playtest-Bericht — Persona "Grenzgänger / Breaker"

Getestet: `/home/user/evolve` (CLI `dist/cli/demo.js`), Build via `npm run build`.
Alle Läufe: `node dist/cli/demo.js "" <temp> <pred> <food> <height> <light> <water> <gens>`
(Reihenfolge: Temperatur, Prädation, Nahrung, Nahrungshöhe, Licht, Wasser, Generationen).
Über 30 Läufe, davon ein 81-Zellen-Grid und mehrere Trajektorien-Traces gegen die kompilierte Engine.

---

## Zusammenfassung

Die Engine ist robust gegen Absturz (auch `gens=99999`, out-of-range, konvergiert sauber) — aber es gibt **einen echten numerischen Bug** (Fell-Oszillation bei gemäßigter Temperatur), **eine ganze Klasse widersprüchlicher Ursache-Erklärungen** (die Klartext-Begründungen widersprechen regelmäßig der tatsächlichen Umwelt / dem tatsächlichen Grund), sowie **mehrere Balance-Probleme** (tote Zone ohne Nahrung, zwei dominante Attraktoren, Mobilität+Stoffwechsel maxen fast immer, statische Validitätsanzeige).

Kernbefunde:
- **BUG:** Bei Temperatur ≈ 0.5 oszilliert das Fell/Isolation-Merkmal dauerhaft (~0.35 ↔ 0.61) und konvergiert nie. Endwert, Ursache-Text ("anhaltende Kälte" vs. "Überhitzung") **und der sichtbare Bauplan (Fell vs. nackte Haut)** kippen mit der Parität der Generationszahl.
- **Widersprüche:** Die Ursache-Texte für Photosynthese, Mobilität, Stoffwechsel behaupten regelmäßig "reichliche Nahrung" bei Hungersnot bzw. "knappes Futter"/"Nahrungsknappheit" bei Überfluss.
- **Tote Zone:** Ohne Energiequelle (food+light+water niedrig) übt gar nichts Selektionsdruck aus — Temperatur und Prädation allein bewegen nichts.
- **Dominante Strategie:** Bei vorhandener Nahrung maxen Mobilität (93 %) und Stoffwechsel (91 %) fast immer.

---

## Mögliche Bugs (mit Repro-Einstellung)

### BUG 1 — Fell/Isolation oszilliert bei gemäßigter Temperatur, Ergebnis paritätsabhängig
**Repro:**
```
node dist/cli/demo.js "" 0.5 0 0.8 0 0.3 0.3 80   # -> Fell 0.55, "dichtes Fell", Ursache "anhaltende Kaelte"
node dist/cli/demo.js "" 0.5 0 0.8 0 0.3 0.3 81   # -> Fell 0.36, "nackte Haut", Ursache "Hitze/Ueberhitzung"
```
Trajektorie (temp 0.5) oszilliert und konvergiert nie:
```
0.50 0.47 0.59 0.37 0.61 0.39 0.51 0.38 0.50 0.42 0.55 0.49 0.54 0.35 0.55 0.49 0.59 ...
```
Endwert nach n Generationen flippt mit jeder einzelnen Generation:
```
gens=76 -> 0.533 (steigt, "Kaelte")   gens=77 -> 0.346 (faellt, "Hitze")
gens=78 -> 0.509 (steigt, "Kaelte")   gens=79 -> 0.418 (faellt, "Hitze")
gens=80 -> 0.585 (steigt, "Kaelte")   gens=81 -> 0.401 (faellt, "Hitze")
```
**Warum:** Insulation kommt in der Fitness nur in `thermal = 1 - |insulation - (1-temp)|` (scharfer V-Peak) und in den monotonen Unterhaltskosten vor. Bei temp≈0.5 liegt der Peak bei 0.5, im Inneren des Bereichs. Die Schrittweite `responseRate[0]*selectionStrength ≈ 0.231*0.907 ≈ 0.21` überschießt den Peak in jeder Generation → stabiler Grenzzyklus. Die Varianz-Dämpfung hilft hier nicht: bei x=0.5 ist `varFactor = 4·0.5·0.5 = 1` (maximal, also **keine** Dämpfung). Bei temp 0 oder 1 liegt der Peak am Rand (0/1), wo `clamp01` die Oszillation abfängt — deshalb tritt das Problem nur im temperierten Band auf.
**Auswirkung:** Genau im spannendsten Klimabereich (gemäßigt) ist das Fell-Merkmal reines Rauschen; identische Umwelt liefert je nach Generationszahl "warmblütiger Pelzträger" oder "nackte Haut", inklusive widersprüchlicher Begründung.

### BUG 2 — Keine Eingabevalidierung: NaN erzeugt "NaN Koerpersegment(e)"
**Repro:**
```
node dist/cli/demo.js "" x 0 0.8 0 0.5 0.5 50
```
Ausgabe: `Bauplan: asymmetrischsymmetrisch, riesig, NaN Koerpersegment(e). ...`
`Number("x") = NaN` propagiert ungeprüft: `clamp01(NaN)` bleibt NaN, alle `<`-Vergleiche in `sizeClassOf` sind false → "riesig", `segments = 1 + Math.round(NaN·…) = NaN`. Auch out-of-range (`temp=5`, `food=-1`) wird stumm verschluckt (Umwelt-Regler werden nie geclampt, nur die Merkmale) und ergibt "Kaum Veränderung" ohne Hinweis.

### BUG 3 — Wortfehler "asymmetrischsymmetrisch"
**Repro:** jede Übergangsform, z.B. `node dist/cli/demo.js "" 0.5 0.5 0.5 0.5 0.5 0.5 0`
`develop()` setzt für die Übergangsform `symmetry = "asymmetrisch"`, `describeMorphology` hängt aber pauschal `"symmetrisch"` an → `"asymmetrischsymmetrisch"`. (Bei Pflanze/Tier passt es: "radiaer"+"symmetrisch", "bilateral"+"symmetrisch".)

---

## Unlogische/unschöne Ausgaben — Ursache-Erklärungen widersprechen der Realität

Dies ist die größte Fundgrube: `causeFor()` in `engine/explain.ts` wählt Begründungen aus fixen Textbausteinen anhand roher Umwelt-Schwellen — nie anhand des *tatsächlichen* Grundes (Energie-Pfad-Verdrängung). Dadurch widersprechen die Erklärungen regelmäßig der Merkmalsänderung bzw. der Umwelt.

### W1 — "reichliche Nahrung" als Grund, obwohl Hungersnot herrscht
Szenario **Hungersnot** (food 0.22) bzw. `node dist/cli/demo.js "" 0.5 0.1 0.22 0.1 0.35 0.5 80`:
```
- Photosynthese: faellt 0.50 -> 0.13
    Ursache: reichliche Nahrung macht die Nahrungssuche lohnender als Photosynthese.
```
Nahrung ist **knapp** (0.22), nicht reichlich. Der else-Zweig von `photosynthesis`-fällt ignoriert `foodAbundance`.

### W2 — "bei knappem Futter", obwohl Nahrung im Überfluss (=1.0)
`node dist/cli/demo.js "" 1 1 1 1 1 1 50`:
```
- Photosynthese: steigt ... Ursache: viel Licht bei knappem Futter macht Photosynthese zur besten Energiequelle
```
`food = 1.0`. Der up-Zweig hat "bei knappem Futter" fest verdrahtet.

### W3 — "kaum erreichbare Nahrung" / "Nahrungsknappheit", obwohl food=1.0
Gleicher All-1-Lauf:
```
- Mobilitaet: faellt ... Ursache: kaum erreichbare Nahrung macht aktive Fortbewegung unrentabel (Energie sparen)
- Stoffwechsel: faellt ... Ursache: bei Nahrungsknappheit senkt ein sparsamer Stoffwechsel den Energiebedarf
```
Der wahre Grund ist, dass der **Pflanzen-Pfad** (Photosynthese, `exclusion`) hier gewinnt und Mobilität/Stoffwechsel verdrängt — nicht Nahrungsmangel. Bei Überfluss klingt "Nahrungsknappheit" absurd.

### W4 — "Photosynthese verdrängt Mobilität", obwohl Photosynthese ebenfalls kollabiert
`node dist/cli/demo.js "" 0.5 0 0.1 0 1 0 80` (viel Licht, **kein Wasser**, wenig Futter):
```
- Photosynthese: faellt 0.50 -> 0.14   (Ursache: ohne Licht bzw. Wasser traegt Photosynthese nicht)
- Mobilitaet:    faellt 0.50 -> 0.33   (Ursache: Photosynthese verdraengt die teure Mobilitaet (Pflanzen-Pfad))
```
Beide Energie-Pfade sterben (Wasser fehlt), Ergebnis ist eine Übergangsform. Die Mobilitäts-Begründung behauptet einen triumphierenden Pflanzen-Pfad, den es nicht gibt. `causeFor` für `mobility`-fällt prüft nur `light>0.6 && food<0.4` und ignoriert `water`.

### W5 — "anhaltende Kälte"/"Überhitzung" bei gemäßigter Temperatur (0.5)
Direkt aus BUG 1: temp 0.5 = "gemaessigt", trotzdem behauptet die Ausgabe je nach Parität "anhaltende Kaelte" oder "Hitze macht Isolation zur Last". Am selben Temperaturregler (0.5) liefern verschiedene Läufe entgegengesetzte Richtungen **und** entgegengesetzte Begründungen:
```
0.5 0 0.8 0 0 0 80      -> Fell steigt 0.59, "anhaltende Kaelte"
0.5 1 0.8 0 0.5 0.5 80  -> Fell faellt 0.41, "Ueberhitzung"
```

### Sonstige unschöne Ausgaben
- **Übergangsform/Mischotroph zeigt nie Photosynthese:** Der 0.5-Blob und jede Übergangsform melden `Energie: Mischotroph (beides)`, haben Photosynthese-Balken 0.50, aber der Bauplan ist rein tierisch (`nackte Haut`, `kurze Extremitaet`, keine Blätter). Das "beides" wird morphologisch nicht dargestellt.
- **Sessile Pflanze mit Gliedmaßen-Balken:** Im All-1-Lauf (🌳 Baum) steht `Gliedmassenlaenge 0.55` prominent im Balkendiagramm — für eine festgewachsene Pflanze bedeutungslos, aber gleichwertig dargestellt.
- **Out-of-range stumm:** `temp=5`, `food=-1` liefern kommentarlos "Kaum Veränderung", statt die ungültige Eingabe zu melden.

---

## Balance-/Design-Probleme

### D1 — Tote Zone: ohne Energiequelle kein einziger Selektionsdruck
Läufe mit nur EINEM Regler auf max und Rest 0 (`temp`, `pred`, `height`, `light`, `water` je einzeln) ergeben alle **"Kaum Veränderung — die Umwelt übt keinen klaren gerichteten Druck aus"** und bleiben beim 0.5-Blob:
```
node dist/cli/demo.js "" 1 0 0 0 0 0 50   # heiß, sonst nichts -> keine Anpassung
node dist/cli/demo.js "" 0 1 0 0 0 0 50   # Räuber-Hölle -> keine Panzerung, nichts
```
Nur `food` allein (`0 0 1 0 0 0 50`) treibt Evolution an. **Grund:** Wenn food+light+water niedrig sind, kollabiert `nutrition` auf `floor = 0.02`; die Fitness-Landschaft wird flach → Gradient ≈ 0 → Temperatur und Prädation haben keinen Effekt. Ein heißer, räuberreicher, nahrungsloser Planet entwickelt buchstäblich nichts. Der Nahrungs- (bzw. Licht+Wasser-) Regler ist ein "Master-Schalter", ohne den die anderen vier Regler wirkungslos sind — unintuitiv für ein Spiel, in dem man an sechs gleichwertig aussehenden Reglern dreht.

### D2 — Dominante Strategie: Mobilität & Stoffwechsel maxen fast immer
81er-Grid (food ∈ {0.5,0.7,0.9} × temp × pred × height, light/water=0.4, 80 Gen):
```
Mobilität   > 0.85 in 75/81 Läufen (93%)
Stoffwechsel> 0.85 in 74/81 Läufen (91%)
```
Sobald überhaupt Nahrung da ist, sind Tiere praktisch immer "schnell + hoher Stoffwechsel + Photosynthese ~0.05". Zwei der acht Merkmale tragen damit fast keine Variationsinformation. Differenzierung kommt nur noch aus insulation (Temperatur), armor (Prädation), size/limb (Höhe).

### D3 — Nur zwei echte Attraktoren; Übergangsform = "kein Druck"
Die `exclusion = 0.8` erzwingt eine scharfe Gabelung Tier ↔ Pflanze. Die Übergangsform ("🦠 Mischotroph") erscheint praktisch nur, wenn **gar kein** Druck herrscht (0.5-Blob, tote Zone) — nie als echte, angepasste Mischnische. "Mischotroph" ist de facto ein Synonym für "untrainiert". Das Spiel hat effektiv zwei stabile Endzustände plus einen Neutral-Blob.

### D4 — Validitätsanzeige ist statisch (immer 80.0 %)
Über völlig verschiedene Umwelten hinweg zeigt die "Validitaet gegen Referenz-Orakel" **immer exakt 80.0 %**:
```
0 0 0.8 0 0.5 0.5 50   -> 80.0%
1 1 1 1 1 1 50         -> 80.0%
0.5 0 0.1 0 1 1 80     -> 80.0%
```
Der Wert stammt global aus `fitted-params.json` und bewertet **nicht** den aktuellen Lauf, wird aber unter jedem einzelnen Lauf angezeigt, als gälte er diesem. Das ist irreführend (UX/Design).

---

## Ideen fürs Backlog

1. **`causeFor()` kontextsensitiv machen:** Den tatsächlichen Grund aus `energyPhoto` vs. `energyForage` (Pfad-Verdrängung) und dem realen `foodAbundance`/`water` ableiten, statt fixe Textbausteine an rohe Schwellen zu hängen. Behebt W1–W5 auf einen Schlag.
2. **Fell-Oszillation dämpfen (BUG 1):** entweder `thermal` glätten (quadratisch `1-(insulation-ideal)^2` statt Betrag → kein Kink), oder Schrittweite nahe dem Fitness-Peak adaptiv reduzieren, oder `responseRate` für insulation senken. Zusätzlich Konvergenz-/Oszillationswarnung, wenn ein Merkmal nicht stabilisiert.
3. **Eingabevalidierung + Clamping** der sechs Umwelt-Regler (NaN abfangen, auf 0..1 clampen, `gens` als Integer ≥ 0 prüfen). Behebt BUG 2.
4. **`describeMorphology`:** Sonderfall "asymmetrisch" nicht mit "symmetrisch" verketten. Behebt BUG 3.
5. **Tote Zone entschärfen (D1):** Temperatur/Prädation auch bei Nahrungsknappheit wirksam machen — z.B. Verhungern selbst als sichtbaren Druck modellieren oder den `floor` so wählen, dass Restgradienten erhalten bleiben. Sonst fühlen sich 4 von 6 Reglern kaputt an.
6. **Merkmalsvielfalt (D2):** Mobilität und Stoffwechsel entkoppeln / mit steigenden Kosten versehen, damit sie nicht immer gemeinsam an die Decke laufen.
7. **Echte Mischform (D3):** `exclusion` < 1 oder eine mittlere Nische belohnen, damit "Mischotroph" auch als *angepasste* Strategie gewinnen kann, nicht nur als Nichtentscheidung.
8. **Bauplan der Übergangsform** soll Photosynthese-Flächen zeigen, wenn `photo > 0.4` (aktuell nie), damit "Mischotroph (beides)" morphologisch stimmt.
9. **Validitätsanzeige** klar als globalen Trainingswert labeln (nicht pro-Lauf), oder tatsächlich lauf-spezifisch gegen das Orakel rechnen. Behebt D4.
