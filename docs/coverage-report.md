# Abdeckungs-Bericht und Achsen-Vorschläge

**Stand:** 2026-08-01 · Schritte **3.1** und **3.2** aus `docs/artenkatalog-plan.md` (Phase 3),
gehört zu `BACKLOG.md` Punkt 12.
**Erzeugt aus:** `node tools/coverage-check.mjs` — Rohzahlen in `docs/coverage.json`.
**Alle Zahlen dieses Dokuments stammen aus diesem einen Lauf** und sind reproduzierbar;
keine Schätzung, keine gerundete Erinnerung.

> **Nachtrag (2026-08-03):** der Genom-Zwillings-Fix (`founderSpreads()` auf den Katalog
> angewendet, s. Plan Abschnitt 8/1.4) hat die 692-Punkte-Decke aufgehoben, auf die sich
> dieser Bericht in Abschnitt 1 und 5 stützt. **Erneuter Lauf mit dem reparierten Katalog:**
> tatsächlich benannte Arten steigen von 110 (0,55 %, gedeckelt bei 3,4 %) auf **317
> (1,57 %, keine Deckelung mehr — 20.178 unterscheidbare Punkte)**. `novelThreshold` bleibt
> bei 0 Endpunkten jenseits der Schwelle — **weiterhin korrekt kalibriert**, jetzt gegen den
> vollen Katalog statt gegen 70 Prototypen bestätigt (schließt den offenen Punkt aus Plan
> Abschnitt 8). Alle übrigen Zahlen dieses Berichts (Engine-Lücken, Gen-Verlust-Rangfolge,
> Chimären-Falle) sind im Nachlauf **bitgleich bzw. binnen Rauschen** reproduziert — die
> Zwillinge waren nie der Engpass.
>
> **Zweiter Nachtrag (2026-08-03): V0 UMGESETZT und gemessen — die Vorhersage hat sich
> NICHT bestätigt.** `tools/lib/impute.mjs` wendet jetzt die in Abschnitt 6 (V0)
> vorgeschlagene Mehrheitsregel an (Median nur noch bei belegter Mehrheit > 0.3, sonst
> „Gen aus“ über Stufe (d)). Ergebnis nach vollem Sweep: **319 statt 317 benannte Arten
> (1,58 % statt 1,57 %) — kein messbarer Effekt.** Auch die Distanz-Verteilung (Abschnitt
> 3.3b) und die Gen-Verlust-Rangfolge (Abschnitt 4) bleiben binnen Rauschen gleich. **Die
> in Abschnitt 4 erzählte Kausalkette — Median erzeugt Chimären, Chimären erklären die
> Lücke — war zur Hälfte richtig:** die Imputation ist jetzt ehrlicher (keine erfundene
> „Durchschnittsart“ mehr), aber die tatsächliche Nicht-Erreichbarkeit hängt gemessen
> überwiegend an anderen Stellen — vermutlich an denselben Kern-Genen (Struktur, Mobilität,
> Photosynthese, Stoffwechsel), die die vier dokumentierten Engine-Lücken
> (`bluetenkraut`/`amphibie`/`plankton`/`kopffuesser`) schon vorher trugen, nicht an den 15
> bedingten Stressor-Genen. **V0 bleibt trotzdem im Code** — die Mehrheitsregel ist die
> biologisch korrektere Schätzung unabhängig vom Abdeckungseffekt, nur die Erwartung
> „größter Hebel“ ist widerlegt. **V1/V2/AXIS-22–25 sind davon nicht entlastet:** ihre
> Begründung (Kombinations-Lücke bei gleichzeitigen Dauer-Toleranzen bzw. fehlende
> Kern-Gen-Nischen) steht unabhängig von der V0-Diagnose.
> Volle neue Zahlen: `docs/coverage.json` (Lauf vom 2026-08-03, nach V0).

> **Dritter Nachtrag (2026-08-03): AXIS-25 UMGESETZT** (nach ausdrücklicher Nutzer-Zustimmung
> für den Struktur-Wachstum-Schritt). Neues Gen `resprout` in `engine/fitness.ts` +
> `oracle/reference_model.py` + `physics.json` (voller Herleitungs-/Messkommentar dort,
> „Version 9"). Formel bewusst enger als hier vorgeschlagen: `disturbance = max(fire, frost)`
> (OHNE `predation`/Fraas — eine erste Fassung mit `predation*grazingShare` brach die
> Räuber-Beute-Koevolution, `distribution-check` B4 0.24→2.37), und `lightAccess`-Bonus +
> Energie-Steuer sind an `disturbance` gekoppelt (nicht unbedingt wie ursprünglich skizziert —
> sonst zog ein von Störung unabhängiger Größen-Anreiz selbst ungekoppelte Kontroll-
> Populationen in `symbiosis-check` zueinander). Alle Pflicht-Gates grün (parity, app-parity,
> ecology-check, reality-check 21/21, mf-fidelity, distribution-check 4/4, symbiosis-check,
> coevolution-check, phenomena-check 8/8, catalog-check).
>
> **Ehrlicher Befund zum Abdeckungs-Effekt** (dieses Diagnose-Werkzeug selbst ist KEIN
> Pass/Fail-Gate): ein voller Vorher/Nachher-Sweep gegen den Commit vor AXIS-25 zeigt ein
> gemischtes Bild, nicht die klare Verbesserung, die ein erster Blick auf den groben
> `--quick`-Sweep nahelegte. Neu erreichbar: `farn` (16 Arten) und `moos` (935 Arten, praktisch
> vollständig). Neu UNERREICHBAR: `kraut` (937 Arten, vorher erreicht), `schnecke`/`beutetier`
> (412+122 Arten, verlieren die Schwarm-Zensus-Erreichbarkeit). `bluetenkraut` selbst bleibt in
> diesem Sweep unerreicht (die Formel macht es rechnerisch konkurrenzfähig, s. Version-9-
> Kommentar, aber die deterministische Konvergenz aus einem neutralen Startgenom findet diesen
> Punkt in den gerasterten Testumwelten nicht). Ursache der Kraut/Schnecke/Beutetier-Regression:
> nachweislich NICHT die konkreten `resprout`-Werte (ein gezielter Archetyp-Fix änderte nichts)
> und NICHT `predation` (zeigt sich auch ohne Schwarm-Schicht) — am wahrscheinlichsten
> verschiebt das 26. Gen die deterministischen Konvergenzpfade geringfügig, sodass einzelne
> Gitterpunkte in ein anderes Archetyp-Becken kippen (derselbe Effekt, der `ecology-check` und
> eine `reality-check`-Schwelle minimal verschoben hat, dort durch Nachjustierung behoben).
> Bewusst NICHT weiter durch Parameter-Jagd „repariert" (mehrfach beobachtetes Whack-a-Mole-
> Muster) — vollständig dokumentiert in `BACKLOG.md` („AXIS-25"-Eintrag).

> **Der Teil 3.2 ist ein VORSCHLAG, keine Umsetzung.** Neue Gene und neue Mechaniken
> werden in diesem Repo grundsätzlich nur vorgeschlagen und von Hand bestätigt
> (README „Autonomie"); kontinuierliche Parameter werden gefittet, Struktur wächst nur
> mit ausdrücklicher Zustimmung. `engine/fitness.ts` und `physics.json` sind für diesen
> Schritt **nicht angefasst** worden — **das gilt für den ursprünglichen Vorschlag unten,
> AXIS-25 selbst wurde seither umgesetzt, s. dritter Nachtrag oben.**

---

## 1 · Was gemessen wurde — und was ausdrücklich nicht

Die Frage von Schritt 3.1 lautet **nicht** „wo liegt eine Art im Genraum" (das beantwortet
die Platzierungs-Pipeline aus 1.2/1.3) und **nicht** „ist eine Art von ihren Nachbarn
unterscheidbar" (das ist der Zwillings-Befund aus 1.4). Sie lautet:

> Gibt es eine Umwelt, in der die Evolutions-Engine ein Genom hervorbringt, dessen
> `nearestReal()` **diese** Art als nächste Art ausweist?

### Der Sweep — drei Schichten

| Schicht | Umfang | Technik | Warum |
|---|---:|---|---|
| **A · Regler-Gitter** | 15.625 Umwelten | 5 Stufen auf jeder der 6 Kern-Achsen, deterministische Konvergenz aus dem Ur-Genom (400 Generationen, kein Rauschen) | dieselbe Technik und dieselbe Gittergröße, mit der `docs/rarity.json` entstanden ist — damit direkt vergleichbar |
| **B · Stressor-Schicht** | 847 Umwelten | 66 aktive Einfluss-Faktoren (`app/influences.js`) × 15 kalibrierte Biome, Stressor-Rücksetzung wie `applyInfluence()` | die 15 bedingten Gene (Index 10–24) kommen in der App **nur** über Umwelt-Einflüsse; ohne diese Schicht wäre jede Art mit Entgiftung/Osmoregulation/Druck-Toleranz per Konstruktion „unerreichbar" |
| **C · Schwarm** | 192 Läufe | `world/population.ts`, N=200, 250 Generationen, Live-Konfiguration `SWARM` aus `app/index.html`; benannt werden die **Cluster-Zentroide** (das ist, was `readSwarm()` benennt) | A und B messen Attraktoren; der Spieler sieht einen driftenden Schwarm mit frequenzabhängiger Konkurrenz, der Punkte erreicht, die kein Attraktor sind |

*Einschränkung zur Vergleichbarkeit mit `docs/rarity.json`:* dessen Erzeuger
(`scratchpad/rarity2.mjs`) ist nicht eingecheckt und die damaligen Stufenwerte sind nicht
erhalten. Hier sind es 0 / 0.25 / 0.5 / 0.75 / 1.0 — die volle Spannweite, die der Spieler
an den Reglern einstellen kann. Der Abgleich in Abschnitt 3.4 ist deshalb ein **Ja/Nein**-
Vergleich (erreichbar / nicht erreichbar), kein Zahlenvergleich.

Zusammen **16.754 Endpunkte**. Bewusst **nicht** im Sweep: Gründer-Los und Sperrklinke
aus Phase 4 — beide sind opt-in und in der Live-App aus (Prüfung N0 in `founder-check`);
sie würden eine Reichweite messen, die heute niemand spielt.

### Die Decke, die nicht die Engine zu verantworten hat

`nearestReal()` vergleicht mit `<` (strikt). Unter Arten mit **bitgleichem** Genom kann
deshalb immer nur die erste in Sortier-Reihenfolge gewinnen. Der Zwillings-Befund aus 1.4
(96,6 % der Arten haben einen genom-identischen Zwilling, **692 unterscheidbare Punkte**)
ist damit eine harte Obergrenze für jede namensbasierte Abdeckungszahl: **höchstens 3,4 %
der 20.178 Arten können jemals angezeigt werden**, egal wie gut die Engine wird. Das ist
eine Folge der dünnen Merkmalslage (Plan 5a) und wird in Abschnitt 5 getrennt behandelt —
es ist **kein** Lückenreport der Engine.

Deshalb berichtet `coverage-check` drei ineinander liegende Zahlen statt einer.

---

## 2 · Die Zahlen

| Lesart | Arten | Anteil |
|---|---:|---:|
| **(1)** Arten in **erreichten Bauplan-Gruppen** — die Engine kommt in die Nachbarschaft | 19.411 / 20.178 | **96,2 %** |
| **(2)** Arten an **erreichten Genom-Punkten** — ein erreichtes Genom lässt genau diesen Katalog-Punkt gewinnen | 5.825 / 20.178 | **28,9 %** |
| **(3)** tatsächlich **benannte** Arten (strikt, an der Zwillings-Decke gedeckelt) | 110 / 20.178 | **0,55 %** |
| … dieselbe Zahl gegen die Decke von 692 unterscheidbaren Punkten | 110 / 692 | 15,9 % |

**(2) ist die Abdeckungszahl.** Sie sagt: knapp **drei von zehn katalogisierten Arten
liegen an einer Stelle im Genraum, die die Engine tatsächlich erzeugt**. Die übrigen sieben
liegen dort, wo diese Physik an keinem der 16.754 geprüften Endpunkte hinkommt.

Weitere Kennzahlen desselben Laufs:

- **59 von 65 Bauplan-Gruppen** werden erreicht (36 von 40 Gruppen, in denen überhaupt eine
  reale Art liegt).
- **110 von 692 unterscheidbaren Katalog-Punkten** (15,9 %) werden getroffen.
- **Kein einziger** der 16.754 Endpunkte liegt jenseits von `novelThreshold` (0,15) — die
  Schwelle ist weiterhin richtig kalibriert: was die Engine hervorbringt, hat immer einen
  echten Bauplan-Namen.
- Beitrag der Schichten (Genom-Punkte): A 88 · B 57 · C 50. **Ohne die Stressor-Schicht
  wären 520 Arten scheinbar unerreichbar, ohne den Schwarm weitere 569** — eine
  Abdeckungs-Messung nur auf dem Regler-Gitter hätte sich um rund ein Fünftel geirrt.

---

## 3 · Der Lückenreport

### 3.1 · Nach Bauplan-Gruppe — vier Quadranten

| Quadrant | Gruppen | Arten | Bedeutung |
|---|---:|---:|---|
| erreichbar **und** reale Arten | 36 | 19.411 | funktioniert |
| erreichbar, **keine** reale Art | 23 | 0 | **Katalog-Lücke** — die Ernte hat für diesen Bauplan (noch) nichts; die Anzeige bleibt beim Bauplan-Namen |
| reale Arten, **nicht** erreichbar | 4 | 767 | **Engine-Lücke** |
| weder noch | 2 | 0 | tote Form (`fluginsekt`, `wurm`) |

Die 23 Katalog-Lücken (u. a. `nadelbaum`, `koloss`, `myzel`, `bartenwal`, `muschel`,
`mammutbaum`) sind **kein** Engine-Problem: die Ernte hat noch 2.268 unbearbeitete Kladen
in der Warteschlange (Plan 1.4). Sie gehören in einen weiteren Ernte-Lauf, nicht in eine
neue Gen-Achse.

Die vier **Engine-Lücken**:

| Gruppe | Reich | Arten | Zweitplatzierter in … Umwelten | verliert gegen |
|---|---|---:|---:|---|
| `bluetenkraut` | Pflanze | 340 | 1 | `moos` |
| `amphibie` | Tier | 227 | 0 | — |
| `plankton` | Protist | 137 | 1 | `insekt` |
| `kopffuesser` | Tier | 63 | **151** | `insekt` (92), `grossjaeger` (30), `reptil` (28) |

„Zweitplatzierter" ist `matchArchetype()`s eigenes `alt`-Feld: **`kopffuesser` verliert
ständig knapp**, die anderen drei sind gar nicht erst in der Nähe.

### 3.2 · Nach Reich und Klade

| Reich | Arten | in erreichter Gruppe | an erreichtem Punkt |
|---|---:|---:|---:|
| Tier | 9.570 | 97 % | **35 %** |
| Pflanze | 7.744 | 96 % | **11 %** |
| Pilz | 2.172 | 100 % | **56 %** |
| Mikrobe | 555 | 100 % | **75 %** |
| Protist | 137 | 0 % | **0 %** |

Die auffälligsten Wurzel-Kladen (vollständige Tabelle in `docs/coverage.json`):

| Klade | Arten | an erreichtem Punkt |
|---|---:|---:|
| Bedecktsamer | 7.069 | 12 % |
| Säugetiere | 2.443 | 15 % |
| Strahlenflosser | 1.268 | 7 % |
| Reptilien | 625 | 4 % |
| Vögel | 500 | 20 % |
| **Laubmoose** | 386 | **0 %** |
| **Ringelwürmer** | 137 | **0 %** |
| **Amoebozoa / Euglenozoa / Ciliophora / Foraminifera** | 137 | **0 %** |
| Insekten | 1.315 | 77 % |
| Bakterien | 521 | 77 % |
| Spinnentiere | 609 | 66 % |

### 3.3 · Nach Gen-Achse

Zwei Fenster je Gen: „typisch" (1.–99. Perzentil über alle Endpunkte) und „max" (höchster
überhaupt erreichter Wert). Der Unterschied ist die eigentliche Auskunft — bei den 15
bedingten Genen liegt das typische Fenster nahe null, weil 93 % der geprüften Umwelten
gar keinen Stressor tragen; der hohe Wert ist erreichbar, aber nur in der schmalen Ecke,
in der genau dieser Stressor anliegt.

| Gen | typisch | max | Katalog (1.–99. %) | Arten über „typisch" | Arten über „max" |
|---|---|---:|---|---:|---:|
| Austrocknungs-Toleranz | 0.01–0.37 | 0.98 | 0.01–0.88 | 8.834 (62 %) | — |
| Gliedmaßen | 0.06–0.99 | 0.99 | 0.03–0.82 | 8.772 (61 %) | — |
| Schutzpigment | 0.01–0.20 | 0.99 | 0.01–0.65 | 8.270 (58 %) | — |
| Windhärte | 0.01–0.20 | 0.99 | 0.01–0.82 | 7.751 (54 %) | — |
| Frostschutz | 0.01–0.20 | 0.96 | 0.01–0.70 | 7.398 (52 %) | — |
| Feuerresistenz | 0.01–0.20 | 0.99 | 0.01–0.55 | 6.801 (47 %) | — |
| Osmoregulation | 0.01–0.20 | 0.99 | 0.01–0.95 | 6.181 (43 %) | — |
| Panzerung | 0.00–0.70 | 0.78 | 0.05–0.82 | 762 (5 %) | **143** |
| Grabtrieb | 0.01–0.73 | 0.76 | 0.01–0.85 | 184 (1 %) | **184** |

**Praktisch kein Gen ist grundsätzlich außer Reichweite** — jede Achse wird irgendwo bis
nahe 1.0 ausgefahren. Nur **327 Arten** im ganzen Katalog verlangen einen Wert, den die
Engine in 16.754 Umwelten **nie** erreicht hat, und beide Fälle sind eng: Panzerung über
0.78 (schwer gepanzerte Weichtiere) und Grabtrieb über 0.76 (Ringelwürmer, Kladen-Regel
`burrow` 0.82).

Die Lücke ist also **keine Wertebereichs-Lücke, sondern eine Kombinations-Lücke**: die
Engine erreicht jeden dieser Werte, aber nie mehrere davon gleichzeitig und dauerhaft.

Wie weit außer Reichweite die unerreichten Arten liegen (Abstand zum besten Endpunkt
ihrer eigenen Gruppe, in der Metrik von `nearestReal()`; `novelThreshold` = 0.15 als
Größenordnung):

| Abstand | Arten | Anteil |
|---|---:|---:|
| ≤ 0.05 | 0 | 0 % |
| ≤ 0.10 | 0 | 0 % |
| ≤ 0.20 | 5.851 | 40,8 % |
| ≤ 0.30 | 7.129 | 49,7 % |
| > 0.30 | 606 | 4,2 % |
| Bauplan-Gruppe selbst unerreichbar | 767 | 5,3 % |

**Keine einzige unerreichte Art liegt knapp daneben.** Es gibt keinen Saum von Arten, den
eine etwas feinere Platzierung einfangen würde — der Abstand beginnt bei 0.10 und liegt
im Schwerpunkt zwischen 0.20 und 0.30, also beim Ein- bis Zweifachen der Schwelle, ab der
die App überhaupt keinen realen Namen mehr behauptet.

### 3.4 · Gegenproben gegen die vorhandenen Messungen

**`docs/rarity.json`** ist mit derselben Technik und derselben Gittergröße entstanden
(5^6, deterministische Konvergenz) und damit direkt gegen Schicht A prüfbar. Ergebnis:
**32 von 43 Formen stimmen im Ja/Nein überein.** Die 11 Abweichungen sind kein Widerspruch,
sondern ein Altersnachweis — `rarity.json` ist vom 2026-07-29, kennt die 22 seither
dazugekommenen Formen nicht und stammt aus einem älteren Engine-Stand:

- **heute erreichbar, damals 0 %:** `fisch`, `reptil`, `fellgrosstier`, `grossjaeger`,
  `hutpilz`, `schimmel`, `farn` — genau die Wasser- und Extremformen, die laut Backlog
  „AXIS-4 zurückholt", plus die Pilze.
- **damals erreichbar, heute nicht (in Schicht A):** `plankton`, `bluetenkraut`,
  `beutetier`, `fluginsekt`. `beutetier` wird über den Schwarm (Schicht C) wieder erreicht,
  die anderen drei nicht.

**Folgerung, die nicht in diesen Schritt gehört, aber notiert werden muss:**
`docs/rarity.json` ist in einem Viertel seiner Einträge überholt und steuert die
Genbuch-Rarität. Es sollte neu erzeugt werden — das ist ein eigener, kleiner Schritt.

**`docs/tree-of-life.json`** (`observedForms` aus Schritt 2.1): vier Knoten haben
mehrheitlich unerreichbare Baupläne — **Amoebozoa (85), Cephalopoda (63), Discoba (25),
Rhizaria (5)**. Drei davon sind Protisten und landen alle im selben unerreichbaren
`plankton`-Bauplan (s. Abschnitt 6, „Protisten"); der vierte sind die Kopffüßer, die als
einzige Engine-Lücke ständig knapp verlieren.

---

## 4 · Der wichtigste Befund: die Chimären-Falle

Woran die 13.586 unerreichten Arten in erreichten Gruppen konkret verlieren — nicht gegen
„die Engine", sondern gegen den Katalog-Punkt, der an ihrer besten Stelle **stattdessen**
gewinnt (gewichteter Beitrag je Gen, artgewichtet):

| Gen | Beitrag |
|---|---:|
| Austrocknungs-Toleranz | 0.069 |
| Feuerresistenz | 0.048 |
| Schutzpigment | 0.048 |
| Frostschutz | 0.040 |
| Osmoregulation | 0.028 |
| Filterapparat | 0.026 |

Die sechs entscheidenden Gene sind **fünfmal ein bedingtes Stressor-Gen**. Das artenreichste
unerreichte Beispiel ist der größte Punkt des Katalogs überhaupt (2.338 Bedecktsamer, u. a.
*Ranunculus*, *Clematis*):

```
desicc 0.90 · pigment 0.60 · fireres 0.55 · frostres 0.52 · windres 0.35 · nfix 0.55
```

— sechs mittlere bis hohe Dauer-Toleranzen **gleichzeitig**. Der Punkt, der stattdessen
gewinnt, trägt dieselben Gene bei 0.02.

Diese Konstellation kann die Engine **strukturell** nicht erzeugen, und das ist kein Fehler,
sondern eine bewusste Eigenschaft:

1. **Jedes ungenutzte Gen kostet Unterhalt** (`maintenance`: 0.07 je Stressor-Gen, linear).
   Die sechs Werte oben summieren sich auf 3.47 und kosten damit dauerhaft rund **0.24
   Unterhaltslast**, ohne dass ein einziger der zugehörigen Stressoren anliegt — mehr als
   der Grundpreis für Größe (`m.size` 0.22) bei voller Körpergröße. `unusedBurden()` misst
   genau das und nennt so ein Wesen ausdrücklich eine **Chimäre**.
2. **Die App kann fast nie mehrere Stressoren gleichzeitig zeigen.** `applyInfluence()`
   setzt jede Stressor-Achse zurück, die der auslösende Faktor nicht selbst nennt. Von den
   66 aktiven Faktoren setzen **33 gar keinen** Stressor, **26 genau einen**, und nur **7**
   mehrere — und diese sieben sind Extremereignisse (Perm-Sterben, Gammablitz, Eissturm),
   keine Dauerstandorte. Die sechs Kern-Regler berühren keine Stressor-Achse.

Und ein dritter, unbequemer Teil: **die Werte selbst sind größtenteils geschätzt.**
`coverage-check` misst die Konfidenz-Herkunft genau der Gene, in denen die unerreichten
Arten verlieren — gewichtet mit dem Verlust, den sie verursachen:

| Herkunft des entscheidenden Gens | Anteil am Verlust |
|---|---:|
| 3 · direkt gemessen | 0,8 % |
| 2 · aus der Klade (dokumentierte Regel) | 18,1 % |
| **1 · hierarchisch imputiert (Geschwister-Median)** | **71,7 %** |
| 0 · Habitat-Rückwärtslauf | 9,4 % |

**Nicht einmal ein Fünftel der gemessenen Abdeckungslücke steht auf einer begründeten
Kladen-Regel.** Fast drei Viertel stehen auf dem Geschwister-Median aus Stufe (c) — für den
2.338er-Punkt sind das `pigment`, `desicc`, `fireres`, `frostres` und `nfix`. Der Median über
die Geschwister der Bedecktsamer erbt von den Kakteen die
Austrocknungs-Toleranz, von den Süßgräsern die Feuerresistenz, von den Nadelhölzern den
Frostschutz und von den Hülsenfrüchtlern die Stickstoff-Fixierung — und erzeugt so eine
**Durchschnittspflanze, die es nicht gibt**: jede reale Art hat *eine* dieser
Spezialisierungen, keine hat alle.

**Das ist die wichtigste Einzelerkenntnis dieses Schritts:** ein erheblicher Teil der
gemessenen Abdeckungslücke ist keine fehlende Gen-Achse, sondern ein **Schätzverfahren, das
für die 15 bedingten Gene das falsche ist**. Der Geschwister-Median ist der richtige
Schätzer für ein kontinuierliches Merkmal (Masse, Größe); für eine An/Aus-Spezialisierung
ist er es nicht.

---

## 5 · Was dieser Bericht ausdrücklich NICHT behauptet

- **Die 0,55 % benannter Arten sind keine Engine-Lücke.** Sie sind die Zwillings-Decke aus
  1.4 (692 unterscheidbare Punkte). Der dafür bereits dokumentierte Weg ist
  `founderSpreads()` aus Phase 4.1 auf den Katalog anzuwenden (Plan, „Bewusst offen") —
  **kein** neues Gen, keine neue Achse. Dieser Bericht schlägt dafür nichts Zusätzliches vor.
- **Die 23 leeren Bauplan-Gruppen sind keine Engine-Lücke**, sondern der Stand der Ernte.
- **Der Sweep ist nicht vollständig.** 16.472 Umwelten plus 192 Schwarm-Läufe sind ein
  Gitter, keine Ausschöpfung;
  Umweltkombinationen außerhalb der 66 kuratierten Einfluss-Faktoren wurden nicht geprüft,
  weil die App sie nicht erzeugen kann. Die Abdeckungszahl ist damit eine **untere Schranke**
  für die Physik und eine **genaue** Zahl für das heutige Spiel.
- **Drei der im Plan (3.2) genannten Kandidaten werden von der Messung nicht gestützt:**
  *Fortpflanzung*, *Sozialität* und *Wirt-Parasit*. Für Fortpflanzung und Sozialität gibt es
  im gesamten Lückenreport kein Signal (keine Klade fällt daran aus). Für Wirt-Parasit war
  die Erwartung, die parasitischen Pilze (Rostpilze, 785 Arten an einem Punkt) fielen daran
  aus — gemessen verlieren sie an `osmo` (Konfidenz 1, imputiert) und `size`, nicht an einer
  fehlenden Wirts-Mechanik, und die Pilz-Kladen sind mit 56–58 % ohnehin die
  **best**abgedeckten Vielzeller. Ein Parasitismus-Kanal mag aus Spielgründen reizvoll sein;
  aus der Abdeckungs-Messung folgt er nicht. *Lebenszyklus* dagegen folgt (s. AXIS-25).

---

## 6 · Die Vorschläge

Reihenfolge nach **gemessener Wirkung**, nicht nach Reiz. Jeder Vorschlag nennt: WAS fehlt ·
WARUM (welche reale Klade bleibt sonst unerreichbar, mit Zahl) · WIE die Physik aussähe ·
was daran riskant ist · woran man den Erfolg messen würde.

### V0 · Die Imputation der 15 bedingten Gene korrigieren — *keine neue Achse*

**WAS.** Stufe (c) in `tools/lib/impute.mjs` nimmt für **jedes** Gen den Median der nächsten
Kladen-Ebene mit ≥ 5 belegten Geschwistern. Für die 15 bedingten Gene ist das der falsche
Schätzer (s. Abschnitt 4).

**WARUM.** **71,7 % des gesamten gemessenen Verlusts** entfallen auf Gene mit Konfidenz 1
(Abschnitt 4) — auf Kladen-Regeln entfallen nur 18,1 %. Die fünf ausschlaggebenden Gene
(`desicc`, `fireres`, `pigment`, `frostres`, `osmo`) sind in den artenreichsten unerreichten
Punkten durchweg imputiert. Betroffen sind die **7.069 Bedecktsamer** (12 % Abdeckung) und
über dieselbe Mechanik ein großer Teil der 2.172 Pilze.

**WIE.** Für Gene mit Index ≥ 10 nicht den Median, sondern eine **Mehrheitsregel** über die
Geschwister: nur wenn mehr als die Hälfte der belegten Geschwister einen Wert > 0.3 trägt,
wird der Median übernommen; sonst gilt „Gen aus" (der Wert, den Stufe (d) ohnehin für
stressorfreie Habitate liefert). Das ist dieselbe Unterscheidung, die die Physik selbst
macht — ein Stressor-Gen ist eine Spezialisierung, kein Familienmittelwert.

**RISIKO.** Gering, aber nicht null: Kladen, in denen die Toleranz *wirklich* gruppenweit
gilt (Kakteen, Flechten), müssen weiterhin über ihre Kladen-Regel (Konfidenz 2) kommen —
das tun sie bereits.

**MESSUNG.** `node tools/impute-check.mjs` (I3-Konfidenzverteilung) und dieser Bericht:
Abdeckung (2) müsste deutlich steigen, ohne dass ein einziges Gen der Engine sich ändert.
**Das ist der billigste und größte Hebel im ganzen Bericht und sollte vor jeder neuen Achse
kommen.**

### V1 · Standort-Grundlast statt Einzel-Ereignis — *keine neue Achse, neue Umwelt-Kopplung*

**WAS.** Die sechs Kern-Regler erzeugen heute **nie** einen Stressor; Stressoren kommen
ausschließlich als Ereignis über einen Einfluss-Faktor und verschwinden mit ihm wieder
(`applyInfluence()` setzt alle nicht genannten zurück). Es gibt damit keinen **Standort**,
der dauerhaft mild trocken *und* mild windig *und* mild frostig ist — also genau das, was
jeder reale Landstandort ist.

**WARUM.** Nach V0 bleibt der Rest der Kombinations-Lücke: Süßgräser (`windres` 0.68 +
`fireres` 0.55 aus einer **begründeten Kladen-Regel**, Konfidenz 2), Nacktsamer (`frostres`
0.52 + `desicc` 0.45 + `windres` 0.50), Flechten (`desicc` 0.88 + `windres` 0.82 +
`frostres` 0.70 + `pigment` 0.65). Diese Arten sind biologisch korrekt platziert und bleiben
trotzdem unerreichbar, solange nur ein Stressor zur Zeit anliegen kann.

**WIE.** Eine milde, aus den vorhandenen Reglern **abgeleitete** Grundlast, kein neuer
Regler und kein neues Gen:

```
aridity ⩾ groundAridity · (1 − water) · temperature
uv      ⩾ groundUv      · light
frost   ⩾ groundFrost   · (1 − temperature)
wind    ⩾ groundWind    · (1 − water) · (1 − foodHeight)      // offene, niedrige Lagen
```

jeweils als Untergrenze (`Math.max` mit dem, was ein Einfluss setzt), mit kleinen
`ground*`-Faktoren (Größenordnung 0.2–0.3), damit ein Standort nie in die Nähe eines
Ereignisses kommt. Physikalisch ist das keine Erfindung, sondern die Kopplung, die real
besteht: warm + trocken *ist* Aridität, hell *ist* UV, kalt *ist* Frostrisiko.

**RISIKO.** Hoch — das ist ein Eingriff in die Umwelt-Semantik der ganzen App und
verschiebt jede bestehende Verteilung. `ecology`/`ecology-full` (C1–C6), `reality`,
`spectrum-check` (JSD 0.0218) und `rarity.json` müssten komplett neu gemessen werden. Deshalb
steht der Vorschlag hier und wird nicht gebaut. **Nicht vor V0 anfassen** — ein Teil der
Wirkung, die man sich davon verspricht, entfällt schon durch V0.

**MESSUNG.** Abdeckung (2) je Reich, insbesondere Pflanze (heute 11 %), plus unveränderte
C1–C6.

### V2 · Filterapparat kostet Stromlinienform — *keine neue Achse, ein Term*

**WAS.** `energyFilter` (AXIS-3) skaliert mit `filter · aquaHabitat · foodAbundance` und
kennt **keinen** Gegenposten außer dem Unterhalt. `energyAquatic` bestraft dagegen
Gliedmaßen und Panzer über `streamline`. Ein Filterapparat ist damit für einen schnellen
Schwimmer praktisch gratis.

**WARUM — die zweitgrößte Einzellücke.** Im Bauplan `fisch` liegen **1.637 reale Arten**,
erreichbar sind **61 (4 %)**. Der Punkt, der dort gewinnt, trägt `filter` 0.86; die realen
Fische tragen 0.03. Dasselbe Muster bei `schnecke` (412 Arten, 7 erreichbar, Gewinner
`filter` 0.92). Die Engine besetzt in beiden Wasser-Gruppen ausgerechnet die **Filtrier-Ecke**
und lässt das aktive Nekton unerreicht — das trifft die Strahlenflosser (1.268 Arten, 7 %)
und die Weichtiere (1.132 Arten, 36 %).

**WIE.** Der Filterkorb ist Widerstand — genau wie Gliedmaßen und Panzer:

```
streamline = clamp01(1 − limb·aquaticLimbDrag − armor·aquaticArmorDrag − filter·aquaticFilterDrag)
```

Ein einziger neuer Parameter (`aquaticFilterDrag`), derselbe Term, dieselbe Zeile. Bewusst
**kein** `(1 − exclusion·mobility)` wie bei `energyAbsorb`: mobile Filtrierer gibt es real
(Hering, Walhai, Bartenwal) — sie sollen möglich bleiben, nur nicht gratis. Der
Kopfkommentar von AXIS-3 („weder Mobilität NOCH Stromlinienform") bleibt damit gültig; er
wird nur um den Preis ergänzt, den ein Filterapparat hydrodynamisch wirklich hat.

**RISIKO.** Mittel. AXIS-3 ist laut Backlog „der riskanteste" Kanal für die Reich-Balance;
`aquaticFilterDrag` muss klein anfangen und gegen `ecology-full` gefahren werden. Die
Filtrier-Baupläne (Schwamm 41 %, Koralle 51 %, Krill 53 %) dürfen nicht wegbrechen.

**MESSUNG.** Abdeckung von `fisch`/`schnecke`/`kopffuesser` gegen die von
`schwamm`/`koralle`/`krill` — der Erfolg ist eine **Verschiebung**, kein Zugewinn auf beiden
Seiten.

### AXIS-22 · Poikilohydrie / Wiederbelebung — neues Gen `revive`

**WAS fehlt.** `desicc` (AXIS-14) ist ein **Puffer**: es verhindert den Austrocknungsschaden
und kostet dafür dauernd Unterhalt. Die entgegengesetzte, real weit verbreitete Strategie
fehlt: **austrocknen dürfen und bei Wiederbefeuchtung weiterleben.** Wer das kann, zahlt in
der Trockenphase gar nichts — er stellt den Betrieb ein.

**WARUM.** **Laubmoose: 386 Arten, 0 % erreichbar** — die einzige große Pflanzen-Klade bei
null. Der Bauplan `moos` selbst wird zwar erreicht, aber nur an **1 von 6** Punkten, und der
erreichte Punkt trägt gar keine Moose (dort liegen fehlplatzierte Dickblattgewächse). Der
Grund steckt in der Physik: ohne Stützgewebe gibt es keinen Lichtzugang nach oben
(`structureLightFloor` 0.3), also gewinnt entweder die winzige Grünalge oder der verholzte
Strauch — „mittelgroß und weich" liegt dazwischen und wird von beiden geschlagen. Genau
dieses Fenster füllen real die Moose, und sie tun es über einen Mechanismus, den diese
Physik nicht kennt.

Dass der Mechanismus real und in diesem Repo bereits benannt ist, steht schon in den
Kladen-Regeln: die Moos-Regel („Poikilohydrie — vollständig austrocknen und bei
Wiederbefeuchtung weiterleben — ist ihr Kernmerkmal und genau das, was `desicc` misst") und
die Flechten-Regel (`desicc` 0.88) beschreiben ihn. **Ehrlich dazu:** `flechte` (102 Arten)
und `farn` (16 Arten) sind heute zu 100 % erreichbar — sie brauchen AXIS-22 **nicht**. Der
Vorschlag trägt sich allein über die Moose; er ist damit der kleinste der vier Achsen-
Vorschläge, aber der einzige, der eine komplette Klade von null holt.

**WIE.** Ein Gen `revive` und ein Zusatzterm auf der Unterhaltsseite statt eines neuen
Energiekanals:

```
// Wechselfeuchte: der Anteil der Zeit, in dem der Standort trocken ist.
dryPhase   = aridity · (1 − water)
// Poikilohydrie: in der Trockenphase ruht der Stoffwechsel — Unterhalt entfaellt anteilig,
// aber es wird in dieser Zeit auch nichts erwirtschaftet.
reviveGain = poikiloYield · revive · dryPhase · sizeSmall      // sizeSmall = clamp01(1 − size/poikiloSizeCap)
maintenance *= (1 − reviveGain)
energy      *= (1 − poikiloDuty · reviveGain)
desiccSurvival = clamp01(1 − aridity·(1 − max(desicc, revive·sizeSmall))·desiccLethality)
```

Der `sizeSmall`-Deckel ist keine Bilanzierungs-Krücke, sondern die Physik der Sache:
Wiederbefeuchtung läuft über Diffusion durch das ganze Gewebe, und das skaliert nicht — es
gibt keinen poikilohydrischen Baum. Damit entsteht genau ein neuer Gipfel: **klein,
weich, photosynthetisch, trockenheitsfest, ohne Dauerkosten** — der Moos-/Flechten-Bauplan.

**RISIKO.** Mittel. Ein Unterhalts-Rabatt ist ein Eingriff in die Kostenseite, die überall
wirkt; `poikiloDuty` (der Ertragsausfall in der Ruhephase) muss ihn ehrlich bezahlen, sonst
wird `revive` ein Universal-Bonus. Vorher zu prüfen: ob AXIS-22 in benignen Umwelten
wegselektiert wird (das ist die Bedingung, die alle Stressor-Gene erfüllen müssen).

**MESSUNG.** Laubmoose von 0 % · die 5 unerreichten `moos`-Punkte · `flechte` und `farn`
müssen bei 100 % bleiben · C1–C6 unverändert.

### AXIS-23 · Kriechsohle / gliedmaßenlose Landfortbewegung — neues Gen `creep`

**WAS fehlt.** An Land gibt es in dieser Physik **kein Einkommen ohne Gliedmaßen**:
`energyForage` bezieht die Reichweite aus `reachFromLimb`/`reachFromSize`, und die
Substrat-Traktion (AXIS-20) verlangt ausdrücklich `limb·(1−size)`. Ein mobiles, aber
gliedmaßenloses Landtier ist damit nicht vorgesehen.

**WARUM.** **Weichtiere: 1.132 Arten, 36 % · Bauplan `schnecke`: 412 Arten, 7 erreichbar
(2 %) · Ringelwürmer: 137 Arten, 0 %**, und der Bauplan `wurm` ist eine tote Form (nie
erreicht, keine Art). Die Kladen-Regel für Ringelwürmer setzt `limbLength` 0.03 und
`burrow` 0.82 — biologisch korrekt und in dieser Physik ein Wesen ohne jede
Nahrungsquelle an Land.

**WIE.** Ein kleiner, eigener additiver Kanal — dieselbe Bauform wie `energyFilter`,
`energyNfix` und `energyTraction`, mit demselben Exklusivitäts-Muster:

```
// Kriechen: Muskelsohle bzw. peristaltische Fortbewegung auf/in feuchtem Substrat.
// Braucht KEINE Gliedmassen (das ist der Punkt), aber Feuchte — die Schleimspur bzw.
// die Hautatmung ist der Preis. Langsam: nur ein kleiner Ertrag, dafuer billig.
const moist = clamp01((env.water − creepWaterFloor) / (1 − creepWaterFloor));
const energyCreep =
  creepYield · creep · (1 − limb) · mobility · landFactor · moist ·
  env.foodAbundance · (1 − exclusion·photo);
// und der Preis: die Kriechsohle verdunstet.
desiccSurvival = clamp01(1 − aridity·(1 − desicc + creep·creepDesiccCost)·desiccLethality)
```

`(1 − limb)` macht den Kanal exklusiv für den wirklich gliedmaßenlosen Bauplan — dieselbe
Lehre, die AXIS-20 mit `(1−armor)·(1−insulation)` gezogen hat, nachdem ein
nicht-exklusiver Bonus die Reich-Balance kippte (gemessen und verworfen, s.
`engine/fitness.ts` Kommentar zu h)).

**RISIKO.** Mittel. Ein weiterer Land-Energiekanal wirkt auf die Tier-Quote (C4). Die
Feuchte-Bindung hält ihn auf feuchte Standorte begrenzt, und `creepDesiccCost` sorgt dafür,
dass er in ariden Umwelten nicht mit AXIS-14 konkurriert.

**MESSUNG.** `schnecke`/`wurm` als Attraktoren · Ringelwürmer von 0 % · Tier-Anteil in
C1–C6 unverändert (heute 45,4 %).

### AXIS-24 · Ruhephase / Ektothermie — neues Gen `dormancy` + Umwelt-Achse `seasonality`

**WAS fehlt.** Ein niedriger Stoffwechsel ist in dieser Physik **nur** billiger, nie
besser: jeder Energiekanal multipliziert mit `metabolism` (oder mit `base + rest·metabolism`).
Es gibt keine Umweltsituation, in der Herunterfahren die *bessere* Strategie ist — weil es
keine Umweltsituation gibt, die sich über die Zeit ändert.

**WARUM.** Der Bauplan `amphibie` (227 Arten) ist unerreichbar, und unter den vier stärksten
Abweichungen seines Prototyps steht `metabolism`: er verlangt 0.25, der nächstgelegene
erreichte Tier-Endpunkt liegt bei 0.49. **Reptilien: 625 Arten, 4 % erreichbar** — die schlechteste
Quote aller großen Tier-Kladen, und die Kladen-Regel gibt ihnen (korrekt) einen niedrigen
Stoffwechsel. Auch die Insekten-Diapause und die Sporen/Zysten der Mikroben gehören
hierher.

**WIE.** Eine neue Umwelt-Achse `seasonality` (0–1, über Umwelt-Einflüsse wie alle
Stressoren — es gibt bereits `world/seasonal.ts` als Modul) und ein Gen `dormancy`:

```
// Saisonalitaet = Tiefe des Nahrungstals, nicht dessen Mittelwert. Wer NICHT ruhen kann,
// muss den Winter mit vollem Stoffwechsel ueberstehen: das ist die Sterblichkeit.
troughSurvival = clamp01(1 − seasonality · metabolism · (1 − dormancy) · dormLethality)
// Wer ruhen kann, zahlt in der Ruhezeit weniger Unterhalt — und erwirtschaftet auch nichts.
maintenance   *= (1 − dormancyDiscount · dormancy · seasonality)
energy        *= (1 − seasonality · dormancy · dormDuty)
```

Der Term ist bewusst an `metabolism` gekoppelt: er bestraft nicht das Leben an sich,
sondern den **teuren** Bauplan im Nahrungstal. Damit entsteht der Gipfel „niedriger
Stoffwechsel, mittlere Größe, ruhefähig" = Ektotherm/Amphibie/Reptil, ohne dass die
Endothermie in konstanten Umwelten schlechter würde.

**RISIKO.** Mittel bis hoch. Das ist der erste Term dieser Physik, der eine **Zeitstruktur**
in eine bislang statische Fitness einführt (die Fitness sieht nur einen Zustand). Ehrlich
gesagt ist es ein *Erwartungswert über einen Zyklus*, kein echter Zyklus — das ist eine
Vereinfachung und muss so dokumentiert werden. Der ehrlichere, aber viel teurere Weg wäre
eine echte Saison-Schleife in `world/population.ts`.

**MESSUNG.** Reptilien von 4 % · `amphibie` als Attraktor · Endothermie (`fellwarm`) darf
in konstanten Umwelten nicht verlieren (das ist der Gegentest).

### AXIS-25 · Krautiger Wuchs / Regeneration nach Störung — neues Gen `resprout`

> **✅ UMGESETZT (2026-08-03)** — die Formel unten ist der ursprüngliche Vorschlag; die
> tatsächlich gebaute Fassung weicht in zwei gemessenen Punkten davon ab (kein `predation` im
> `disturbance`-Term, `lightAccess`/Energie-Steuer an `disturbance` gekoppelt statt unbedingt).
> Voller Befund inkl. ehrlicher Abdeckungs-Wirkung: dritter Nachtrag ganz oben in diesem
> Dokument, ausführliche Herleitung `physics.json`-Kommentar „Version 9", Zusammenfassung
> `BACKLOG.md` („AXIS-25"-Eintrag).

**WAS fehlt.** Stützgewebe (`structure`) ist in dieser Physik der einzige Weg nach oben ins
Licht (`structureLightFloor`) und trägt seinen Unterhalt (0.15) dauerhaft. Eine Pflanze, die
ihr Gewebe **jede Saison neu aufbaut** statt es zu erhalten, gibt es nicht — obwohl das die
mit Abstand häufigste Wuchsform der Bedecktsamer ist.

**WARUM.** Der Bauplan `bluetenkraut` (340 Arten) ist unerreichbar. Die Messung zeigt, wo:
sein Prototyp verlangt `structure` 0.24, der nächstgelegene erreichte Pflanzen-Endpunkt
liegt bei **0.09** (die Grünalgen-/Moos-Ecke), die verholzten Attraktoren daneben bei 0.83
(`strauch`) bzw. 0.89 (`laubbaum`) — **das Fenster dazwischen ist leer**.
**Bedecktsamer: 7.069 Arten, 12 %**, und die
artenreichste Pflanzenfamilie der Welt (Korbblütler, Kladen-Regel `structure` 0.20) fällt
genau in dieses leere Fenster. Süßgräser ebenso (`structure` 0.22, `fireres` 0.55 — der
Kommentar der Regel nennt die bodennahen Meristeme, die nach Feuer wieder austreiben).

**WIE.** Ein Gen `resprout` und eine Störungs-Größe, die aus den **vorhandenen** Achsen
kommt (Feuer, Frost, Fraßdruck) — kein neuer Regler:

```
disturbance = max(fire, frost, predation·grazingShare)
// Wer aus Basis-Meristemen/Speicherorganen neu austreibt, ueberlebt die Stoerung ohne
// Stuetzgewebe — bezahlt aber jede Saison den Wiederaufbau (Ertragsabschlag).
lightAccess += resproutReach · resprout · (1 − size)      // niedrig, aber schnell wieder da
survival    *= clamp01(1 − disturbance·(1 − max(fireres, resprout))·…)
energy      *= (1 − resproutCost · resprout)
```

Damit wird „niedrig, weich, schnell nachwachsend" in gestörten Umwelten zur besseren
Strategie als „hoch und verholzt" — das ist die Grasland-/Krautschicht-Nische, die real
etwa ein Drittel der Landfläche trägt und im Katalog ein Drittel aller Arten stellt.

**RISIKO.** Mittel. Berührt mit `lightAccess` den ältesten und am feinsten austarierten
Term der Physik. `resproutReach` muss klein bleiben, sonst entwertet es `structure` global.

**MESSUNG.** `bluetenkraut`/`kraut` als Attraktoren · Bedecktsamer-Abdeckung · `laubbaum`
und `strauch` dürfen in ungestörten Umwelten nicht verlieren.

### Ohne neue Achse: die Protisten brauchen Baupläne, keine Gene

**Protisten: 137 Arten, 0 % — die einzige Reich-Quote bei null.** Die Ursache ist aber
nicht die Physik, sondern die Bauplan-Auflösung: für fünf reale Wurzel-Kladen (Amoebozoa,
Ciliophora, Euglenozoa, Foraminifera, Diatomeen) gibt es **zwei** Archetypen (`plankton`,
`amoebe`), und der Reich-Wächter aus 2.1 zwingt jeden Protisten in genau diese beiden.
`amoebe` und `euglenoid` sind erreichbar, tragen aber **keine einzige** reale Art;
`plankton` trägt 137 und ist unerreichbar. Das ist eine Zuordnungs-, keine Reichweiten-Frage
und gehört in eine Überarbeitung der Protisten-Prototypen (bzw. in die in Plan 8 offene
Frage, ob Bauplan-Gruppen zusammengelegt oder aufgeteilt werden) — **nicht** in ein neues Gen.

---

## 7 · Zusammenfassung der Vorschläge

| # | Vorschlag | neues Gen? | Ziel-Klade (Arten · heutige Abdeckung) | Risiko |
|---|---|---|---|---|
| V0 | Imputation der bedingten Gene | nein | Bedecktsamer 7.069 · 12 %, Pilze 2.172 · 56 % | gering |
| V1 | Standort-Grundlast statt Ereignis | nein | Süßgräser, Nacktsamer, Flechten | hoch |
| V2 | Filterapparat kostet Stromlinienform | nein | Strahlenflosser 1.268 · 7 %, Weichtiere 1.132 · 36 % | mittel |
| AXIS-22 | Poikilohydrie (`revive`) | ja | Laubmoose 386 · **0 %**, Flechten, Farne | mittel |
| AXIS-23 | Kriechsohle (`creep`) | ja | Weichtiere 1.132 · 36 %, Ringelwürmer 137 · **0 %** | mittel |
| AXIS-24 | Ruhephase (`dormancy`) | ja | Reptilien 625 · 4 %, Amphibien-Bauplan 227 · **0 %** | mittel–hoch |
| AXIS-25 | Krautiger Wuchs (`resprout`) | ja | Bedecktsamer 7.069 · 12 %, Blütenkraut 340 · **0 %** | mittel |

**Empfohlene Reihenfolge:** V0 zuerst und allein messen — er kostet nichts an der Engine und
verschiebt vermutlich die Grundlage aller anderen Zahlen. Danach V2 (ein Parameter, klar
umrissene Wirkung), dann AXIS-22 und AXIS-23 (je eine saubere neue Nische, geringe
Wechselwirkung). V1 und AXIS-24 zuletzt, weil beide die Umwelt-Semantik anfassen.

Jeder dieser Schritte ist ein eigener Struktur-Wachstumsschritt mit eigener Bestätigung,
eigenem Zwei-Motoren-Abgleich (Engine ↔ Orakel ↔ App) und eigener Voll-Validierung —
so wie AXIS-1 bis AXIS-21 auch.
