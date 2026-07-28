# Forschungsarbeit: Ein realitätstreues Evolutionsmodell mit selbstlaufendem Test→Optimierungs-Kreislauf

**Titel (Arbeitsfrage):** Was ist das wissenschaftlich fundierteste Evolutionsmodell,
das in einem Browser in Echtzeit laufen kann — und wie baut man einen automatischen
Kreislauf, der seine Treue zur biologischen Realität selbst *misst* und *maximiert*?

**Status:** Forschungsarbeit / Design-Grundlage. Code folgt in einem späteren Schritt.
**Rahmen (vom Auftraggeber gesetzt):**
- Realitätstreue wird auf **drei Schichten** gemessen: (A) Evolutionstheorie-Phänomene,
  (B) reale Biodiversitäts-Datenverteilungen, (C) High-Fidelity-Orakel-Distillation.
- **Zwei-Modell-Architektur**: langsames, reiches Referenzmodell (offline) ↔ schnelle
  Browser-Engine (Echtzeit), verbunden durch den Kreislauf.
- Erst **frei** das Ideal entwerfen, dann eine **Brücke** zum bestehenden Repo.

---

## 0. Kurzfassung (für Eilige)

Echte Evolution ist kein Optimierungsalgorithmus, der einen „besten" Organismus
findet. Sie ist ein **stochastischer, populationsbasierter, ko-evolutionärer
Prozess ohne Ziel**, der durch vier Kräfte getrieben wird: **Variation,
Selektion, Drift, Vererbung** — eingebettet in ein **Ökosystem**, das sich selbst
mit-verändert (Nische-Konstruktion, Räuber-Beute, Wettrüsten). Ein Modell ist
genau so realitätstreu, wie es diese Kräfte *kausal* enthält statt sie durch
Heuristiken zu imitieren.

Kein Modell bildet die Welt „perfekt" ab. Was erreichbar und ehrlich ist: ein
Modell, das die **bekannten emergenten Phänomene** echter Evolution reproduziert
(Speziation, adaptive Radiation, konvergente Evolution, Rote-Königin-Dynamik,
Massenaussterben-Erholung, Gründereffekte, Verteilungsgesetze der Biodiversität)
— und dessen Treue **automatisch, quantitativ und fortlaufend** geprüft wird.
Dieser letzte Punkt ist der **Test→Optimierungs-Kreislauf**, und er ist das
eigentliche wissenschaftliche Herzstück dieser Arbeit: *ein Modell ist nur so
gut wie das Verfahren, das seine Treue misst und verbessert.*

---

## TEIL I — Das ideale Modell (frei gedacht)

### 1. Was echte Evolution ausmacht (und was Modelle typischerweise falsch machen)

**Die vier Grundkräfte (Populationsgenetik, Fisher/Wright/Haldane):**

1. **Variation** — Mutation + Rekombination erzeugen fortlaufend neue Genotypen.
   Real: Mutationen sind *lokal, meist neutral oder schädlich, selten vorteilhaft*;
   Rekombination mischt bestehende Allele.
2. **Selektion** — differenzieller Reproduktionserfolg als Funktion des Phänotyps
   *in einer Umwelt*. Real: **frequenz- und dichteabhängig**, nicht absolut.
3. **Drift** — in endlichen Populationen ändern sich Allelfrequenzen zufällig.
   Real: bei kleinen Populationen dominant; Quelle von **Kontingenz** (Gould:
   „replay the tape of life" → anderes Ergebnis).
4. **Vererbung mit Struktur** — Genotyp→Phänotyp ist **nicht linear**: Epistase,
   Pleiotropie, Genregulation, Entwicklungsbeschränkungen (Evo-Devo).

**Die typischen Modellierungs-Sünden (die wir vermeiden):**

| Sünde | Warum falsch | Realität |
|---|---|---|
| **Ein „bester" Organismus** (Optimierung) | Evolution hat kein Ziel und keinen Endpunkt | Populationen von Genotypen, viele Optima koexistieren |
| **Mittelwert-Genom** | Der Mittelwert einer aufgespaltenen Population liegt im leeren Tal zwischen zwei Arten | Verteilung/Schwarm, Multimodalität ist der Normalfall |
| **Fixe Umwelt** | Organismen verändern ihre Umwelt und einander | Ko-Evolution, Nische-Konstruktion, Rote Königin |
| **Deterministischer Verlauf** | Nimmt Kontingenz weg — das Lebendigste an Evolution | Drift + Gründereffekte → echte Varianz |
| **Lineare Genotyp→Phänotyp-Abbildung** | Ignoriert Epistase/Pleiotropie/Constraints | nichtlineare Entwicklungslandschaft |
| **Selektion absolut statt relativ** | Kein Branching, keine Koexistenz | frequenzabhängige Selektion erzeugt Diversität |

**Konsequenz für das ideale Modell:** Es muss *populationsbasiert*, *stochastisch*,
*ko-evolutionär* und *nichtlinear in der Genotyp→Phänotyp-Abbildung* sein. Alles
andere ist eine Vereinfachung, die genau die interessanten Phänomene wegnimmt.

### 2. Die bekannten emergenten Phänomene (unsere „Zielbilder" der Realität)

Ein realitätstreues Modell muss diese *ohne sie hineinzuprogrammieren*
hervorbringen. Sie werden später (Teil III) zu messbaren Tests.

- **P1 Adaptive Radiation** — eine Linie füllt schnell viele leere Nischen
  (Darwinfinken, Cichliden). Test: nach Öffnen von Nischen steigt die Artenzahl
  überproportional.
- **P2 Sympatrische Speziation / evolutionäres Branching** — eine Population
  spaltet ohne geografische Trennung, getrieben durch frequenzabhängige
  Konkurrenz (Dieckmann & Doebeli 1999). Test: unter disruptiver Selektion
  entstehen ≥2 stabile Modi.
- **P3 Allopatrische Speziation** — Trennung durch Isolation/Distanz +
  unabhängige Drift (Gründereffekte). Test: getrennte „Orte" divergieren, auch
  bei identischer Umwelt.
- **P4 Konvergente Evolution** — unabhängige Linien finden ähnliche Lösungen für
  ähnliche Probleme (Auge, Flügel, Stromlinienform). Test: gleiche Umwelt aus
  verschiedenen Startpunkten → ähnliche Phänotyp-Region.
- **P5 Rote-Königin-Dynamik** — Räuber-Beute-Wettrüsten, nie-endende
  Ko-Anpassung (Van Valen 1973). Test: dauerhafte gerichtete Merkmalsoszillation
  ohne Gleichgewicht.
- **P6 Kontingenz** — gleiche Anfangsbedingung + andere Zufallssaat → andere,
  aber plausible Endzustände (Gould). Test: Varianz über Seeds > 0, aber im
  realistischen Rahmen.
- **P7 Verteilungsgesetze** — reale Biodiversität folgt statistischen Mustern:
  Körpergrößen-Spektren (log-normal/potenzartig), Arten-Häufigkeit
  (log-series/log-normal, Fisher/Preston), Arten-Areal-Beziehung (Potenzgesetz).
  Test: die vom Modell erzeugten Verteilungen matchen diese Formen.
- **P8 Aussterben & Erholung** — nach einem Störereignis (Massenaussterben)
  Erholung der Diversität über Zeit. Test: Diversität bricht ein und erholt sich.

### 3. Das ideale Referenzmodell (langsam, reich) — „Digital Evolution"

Ich schlage ein **individuenbasiertes, räumlich strukturiertes, ko-evolutionäres
Modell mit nichtlinearer Genotyp→Phänotyp-Abbildung** vor. Es darf offline
Sekunden bis Minuten brauchen. Es ist die **Wahrheit**, gegen die die
Browser-Engine kalibriert wird (Schicht C).

**Bausteine (jeweils mit Vorbild in der Literatur):**

1. **Genom** — ein Vektor regulatorischer + struktureller Gene. Wichtiger
   Realismus-Schritt: **Genotyp→Phänotyp ist ein kleines Entwicklungs-/
   Regulationsnetz** (Wagner-Stil GRN, oder mindestens epistatische Interaktionen),
   nicht eine 1:1-Abbildung. Damit entstehen Constraints, Pleiotropie und
   „schwer erreichbare" Phänotypen *von selbst*.
2. **Phänotyp** — kontinuierliche Merkmale (Größe, Stoffwechsel, Panzerung,
   Photosynthese, Mobilität, …), abgeleitet aus dem Genom über das GRN.
3. **Fitness als Ökologie, nicht als Formel** — Fitness ist der *realisierte
   Reproduktionserfolg* in einem **Ressourcen-Wettbewerbsmodell** (MacArthur
   consumer-resource). Kein absoluter „Score", sondern: wer welche Ressource wie
   effizient nutzt, wie stark er mit Ähnlichen konkurriert, wie stark er
   gefressen wird. → frequenz-/dichteabhängig, erzeugt P2 von selbst.
4. **Ko-Evolution** — mindestens eine Räuber- und eine Beute-Population, die sich
   gegenseitig als Selektionsdruck sehen (Red Queen, P5). Optional Mutualismus/
   Parasitismus.
5. **Raum & Metapopulation** — mehrere „Orte" (Habitate) mit Migration; erzeugt
   P3 (allopatrisch) und P7 (Arten-Areal). Umweltgradienten über Orte.
6. **Stochastik** — endliche Populationen (Wright-Fisher-Sampling) → Drift (P6);
   Mutation Gauß/selten-groß; alles seedbar für Reproduzierbarkeit.
7. **Störungen** — episodische Umweltschocks/Aussterbe-Events (P8).

**Warum das die Realität besser trifft als jede Formel-Fitness:** Diversität,
Speziation und Rote-Königin sind hier **emergent** — sie folgen aus Interaktion,
nicht aus einer Regel „mach jetzt zwei Arten". Das ist der entscheidende
Unterschied zwischen *simulieren* und *faken*.

### 4. Die schnelle Browser-Engine (Echtzeit) — ein *distilliertes* Surrogat

Das Referenzmodell ist zu teuer für `<< 100 ms`. Die Browser-Engine ist ein
**vereinfachtes, aber strukturgleiches** Modell: dieselben Kräfte, kleinere
Population, weniger Generationen, kalibrierte Parameter. Entscheidend — sie behält
die **nicht verhandelbaren** Struktureigenschaften:

- **populationsbasiert** (Schwarm, kein Mittelwert),
- **stochastisch + seedbar** (Drift + Reproduzierbarkeit),
- **frequenzabhängige Selektion** (Branching möglich),
- **Arten = Cluster** (emergent), nicht per Kaskade zugewiesen.

Was sie opfern *darf*: das volle GRN (ersetzbar durch eine kalibrierte
nichtlineare Abbildung), die volle Räuber-Beute-Population (ersetzbar durch einen
effektiven, aus dem Orakel gefitteten Prädationsterm), die Zahl der Orte.

**Die Kunst liegt in der Distillation:** Der Kreislauf (Teil IV) sorgt dafür,
dass die schnelle Engine dieselben *emergenten Phänomene* zeigt wie das
Referenzmodell — nicht dieselben Einzeltrajektorien, sondern dieselbe *Statistik*.

---

## TEIL II — Ground-Truth in drei Schichten

Realitätstreue ist nicht *eine* Zahl. Wir definieren sie als gewichtete Summe über
drei unabhängige Schichten. Das ist bewusst: jede Schicht fängt eine andere Art
von „falsch" ab.

### Schicht A — Evolutionstheorie-Phänomene (qualitativ→quantitativ)

Jedes Phänomen P1–P8 aus §2 wird zu einem **Szenario mit Erwartungswert**:

| Phänomen | Szenario | Metrik | Zielband |
|---|---|---|---|
| P1 Radiation | Nischen öffnen | Δ Artenzahl / Zeit | steigt, > Baseline |
| P2 Branching | disruptive Konkurrenz (σ_C<σ_K) | # Modi entlang Nischenachse | ≥ 2 |
| P3 Allopatrie | 2 isolierte Orte, gleiche Umwelt | Genom-Divergenz zwischen Orten | > 0, wächst mit Zeit |
| P4 Konvergenz | gleiche Umwelt, verschiedene Starts | Distanz der Endregionen | klein |
| P5 Red Queen | Räuber+Beute an | zeitliche Merkmalsvarianz | dauerhaft > 0 |
| P6 Kontingenz | gleiche Umwelt, viele Seeds | Varianz der Endzustände | > 0, aber begrenzt |
| P7 Verteilungen | reife Welt | Fit an log-normal/log-series | KS/χ² gut |
| P8 Erholung | Schock injizieren | Diversität(t) | Einbruch + Erholung |

**Score_A** = Anteil der Szenarien, deren Metrik im Zielband liegt (0..1).

### Schicht B — Reale Biodiversitäts-Datenverteilungen (statistisch)

Nicht Einzelarten nachbauen (unmöglich), sondern die **statistischen Signaturen**
echter Ökosysteme treffen. Diese sind gut dokumentiert und quantitativ:

- **Körpergrößen-Verteilung** — real annähernd log-normal / rechtsschief über
  viele Größenordnungen.
- **Arten-Häufigkeits-Verteilung (SAD)** — Fisher log-series bzw. Preston
  log-normal; wenige häufige, viele seltene Arten.
- **Arten-Areal-Beziehung (SAR)** — S ≈ c·Aᶻ, z≈0.2–0.35.
- **Trophische Pyramide** — Biomasse nimmt pro Trophiestufe ~10× ab.
- **Merkmals-Kovarianz** — reale „Bauplan-Korrelationen" (z. B. große Tiere →
  langsamer Stoffwechsel pro Masse, Kleiber-Gesetz).

**Score_B** = 1 − normierte Distanz (KS-Statistik / Earth-Mover) zwischen den
Modell-Verteilungen und diesen Referenzformen. (Referenzformen als Parameter, die
sich an publizierte Daten anlehnen — die Datenquellen werden im Anhang belegt,
keine erfundenen Zahlen.)

### Schicht C — High-Fidelity-Orakel-Distillation (Selbstkonsistenz)

Das Referenzmodell aus §3 ist die **innere Wahrheit**. Die Browser-Engine wird
gegen es distilliert:

- **Verteilungs-Match**: gleiche Umwelt → Engine-Endverteilung vs.
  Orakel-Endverteilung (nicht Punkt-für-Punkt, sondern als Verteilung; Wasserstein/
  KS).
- **Phänomen-Match**: zeigt die Engine dieselben P1–P8-Ausgänge wie das Orakel?
- **Parameter-Identifizierbarkeit**: gibt es überhaupt Engine-Parameter, die das
  Orakel treffen? (Wenn nicht, ist die Engine-Struktur zu arm → Rückmeldung an
  den Entwurf.)

**Score_C** = 1 − mittlere Verteilungsdistanz Engine↔Orakel über ein
Szenario-Portfolio.

### Aggregat

```
Fidelity = w_A·Score_A + w_B·Score_B + w_C·Score_C
```

mit per-Schicht **Mindestschwellen** (eine Schicht darf nicht durch die anderen
„erkauft" werden — z. B. Score_C hoch, aber Score_A kaputt = ungültig). Gewichte
und Schwellen sind selbst Gegenstand einer bewussten Entscheidung, nicht des
Optimierers (sonst optimiert der Loop seine eigene Messlatte weg — siehe §10
„Goodhart").

---

## TEIL III — Metriken (wie man die drei Schichten wirklich misst)

Damit der Kreislauf autonom laufen kann, muss **jede** Metrik ein reiner,
deterministischer (bei festem Seed) Zahlenwert sein. Definitionen:

- **Artenzahl / Modi** — Kerndichteschätzung entlang einer Merkmalsachse; Zählung
  klar getrennter Gipfel (Tal < Anteil des kleineren Nachbargipfels). Für den
  vollen Genom-Raum: Dichte-Clustering, eine Art = eine Häufung.
- **Divergenz zwischen Orten** — mittlerer paarweiser Genom-Abstand der
  Orts-Zentroide.
- **Zeitliche Merkmalsvarianz (Red Queen)** — SD einer Merkmalsachse über die
  letzten k Generationen; > 0 und nicht abklingend = Wettrüsten.
- **Kontingenz-Varianz** — Varianz der Endzustands-Zusammenfassung über Seeds.
- **Verteilungs-Fit** — Kolmogorov-Smirnov / Earth-Mover zwischen Modell- und
  Referenzverteilung.
- **Erreichbarkeit aller Archetypen** — Umwelt-Sweep: über viele zufällige
  Umwelten × Seeds die Häufigkeit jeder emergenten Form; jede Zielform muss
  Häufigkeit > ε haben (kein struktureller Ausschluss). Liefert zugleich die
  **empirische Rarität** (nicht behauptet, sondern gemessen).
- **Perf** — Wanduhrzeit pro `runSimulation`; harte Grenze `< 100 ms`, Zielwert
  deutlich darunter.

**Wichtiges Prinzip — Verteilungen statt Trajektorien:** Wir vergleichen nie
„lief die Engine genau wie das Orakel". Evolution ist stochastisch; identische
Trajektorien wären ein *Fehler* (kein Drift). Wir vergleichen **Statistiken über
viele Läufe**. Das ist der wissenschaftlich korrekte Treue-Begriff für einen
Zufallsprozess.

---

## TEIL IV — Der selbstlaufende Test→Optimierungs-Kreislauf

Das ist das eigentliche Deliverable-Konzept. Der Kreislauf verbindet die zwei
Modelle und die drei Schichten zu einer geschlossenen, autonomen Schleife.

### 4.1 Der Kreislauf im Überblick

```
        ┌────────────────────────────────────────────────────────────┐
        │                                                            │
        ▼                                                            │
 [1] KANDIDAT            [2] SIMULIEREN            [3] MESSEN         │
 Parametersatz θ    →    Portfolio von Szenarien   →  Fidelity(θ) =  │
 (Engine + Klassif.)     × Seeds, Engine & Orakel     w_A·A+w_B·B+   │
        ▲                                              w_C·C          │
        │                                                  │         │
        │                                                  ▼         │
 [6] CHAMPION       [5] SELEKTION            [4] OPTIMIERER          │
 persistieren   ◄── akzeptieren nur wenn ◄── schlägt nächste θ vor  ─┘
 + Report           kein Regress & alle      (Suchverfahren)
                    Schwellen erfüllt
```

### 4.2 Die sechs Stationen im Detail

**[1] Kandidat θ** — der veränderbare Parameterraum. Bewusst **zwei Ebenen**:

- *Kontinuierliche* Parameter (sicher, auto-optimierbar): Mutationsrate,
  Selektionsschärfe, σ_C/σ_K, N, Generationen, Prädationsstärke, Klassifikator-
  Schärfe, Merkmalsgewichte.
- *Strukturelle* Änderungen (Genom-Struktur, GRN-Topologie, neue Interaktions-
  terme) bleiben **außerhalb** der Auto-Schleife — sie sind Entwurfsentscheidungen
  des Forschers, weil der Optimierer sonst die Struktur „überanpasst". Der
  Kreislauf *meldet* aber, wenn kein θ die Schwellen erreicht → Signal, dass die
  Struktur überarbeitet werden muss (Modellkritik statt blindem Fitten).

**[2] Simulieren** — ein **Szenario-Portfolio** (nicht ein einzelnes Setup):
Radiation-, Branching-, Allopatrie-, Konvergenz-, Red-Queen-, Kontingenz-,
Verteilungs-, Schock-Szenario (P1–P8), jeweils über mehrere Seeds. Jedes Szenario
läuft in Engine *und* (für Schicht C) im Orakel. Seeds fest → reproduzierbar.

**[3] Messen** — alle Metriken aus Teil III → Score_A, Score_B, Score_C →
Fidelity(θ). Plus Perf-Messung. Ergebnis ist ein Vektor, nicht nur ein Skalar
(für Diagnose, welche Schicht bremst).

**[4] Optimierer** — schlägt das nächste θ vor. Empfehlung: **mehrstufig**:
1. *Global grob* — Zufalls-/Latin-Hypercube-Suche zum Kartografieren (findet die
   grobe Region, robust gegen Multimodalität der Fidelity-Landschaft).
2. *Populationsbasiert* — genetischer Algorithmus / CMA-ES auf θ (ironischerweise:
   Evolution optimiert das Evolutionsmodell). Gut bei rauschiger, nicht-glatter
   Fidelity.
3. *Lokal fein* — Coordinate-Descent/Nelder-Mead um den Champion (deterministisch,
   erklärbar, letzte Politur).
   Der Optimierer sieht die Fidelity als Blackbox — das entkoppelt ihn sauber vom
   Modell.

**[5] Selektion mit Regressionsschutz** — neues θ wird nur Champion, wenn (a) alle
per-Schicht-**Mindestschwellen** erfüllt sind **und** (b) es den bisherigen
Champion auf einem **Holdout-Portfolio** (Szenarien, die der Optimierer nicht
sieht) nicht verschlechtert. Das verhindert Overfitting an die Trainings-
Szenarien — dieselbe Logik wie Train/Test-Split im ML, hier gegen „Modell
frisiert sich seine Prüfung zurecht".

**[6] Champion persistieren + Report** — bestes θ + vollständiger Metrik-Vektor
werden versioniert gespeichert (JSON + Zeitstempel + Seed). Report zeigt: Trend
über Iterationen, welche Schicht limitiert, Regressions-Warnungen, Perf. Der
Report ist zugleich das **Modellkritik-Werkzeug**: bleibt Score_A trotz
Optimierung niedrig → die Engine-*Struktur* kann das Phänomen nicht, nicht die
Parameter.

### 4.3 Trigger & Autonomie

Der Loop läuft (a) auf Knopfdruck, (b) als Pre-Commit-/CI-Gate (Champion darf nie
schlechter werden → schützt vor Regressionen im laufenden Betrieb), (c) als
langlaufende Hintergrund-Suche (Nachts-Batch, der bessere θ sucht und morgens
einen Report hinterlässt). Alles seedbar → jeder Report ist reproduzierbar.

### 4.4 Warum „zirkulär" hier wörtlich stimmt

Das System hat **zwei ineinandergreifende Evolutionen**:
- *Innen:* die simulierten Organismen evolvieren (das Modell).
- *Außen:* die Modellparameter θ evolvieren gegen die Realitätstreue (der Loop).
Beide sind derselbe Mechanismus (Variation-Selektion-Retention). Der äußere
Kreislauf ist eine **Meta-Evolution**, die das innere Modell realistischer macht.
Das ist konzeptuell sauber und selbstähnlich — und praktisch der Grund, warum ein
GA im Optimierer natürlich passt.

---

## TEIL V — Validierungsplan (wie wir dem Ganzen trauen)

1. **Einheits-Phänomen-Tests** — jedes P1–P8 als isolierter Test mit bekanntem
   Erwartungswert; der Test *muss fehlschlagen*, wenn man die zuständige Kraft
   ausschaltet (z. B. Konkurrenz aus → P2 verschwindet). Das beweist, dass das
   Phänomen *emergent* ist und nicht hineinprogrammiert.
2. **Ablations-Studie** — jede Modellkomponente (Drift, Konkurrenz, Raum,
   Ko-Evolution) einzeln abschalten und zeigen, welches Phänomen stirbt. Bindet
   Mechanismus an Phänomen — der stärkste Realismus-Beweis.
3. **Identifizierbarkeit** — kann der Loop das Orakel überhaupt treffen? Sonst
   Struktur zu arm.
4. **Overfit-Kontrolle** — Holdout-Portfolio (§4.2 [5]).
5. **Perf-Regression** — `< 100 ms` als harte CI-Grenze.
6. **Reproduzierbarkeit** — fester Seed → identischer Report; variabler Seed →
   Varianz im erwarteten Band (P6).

---

## TEIL VI — Brücke zum bestehenden Repo (nach dem freien Entwurf)

Wie gewünscht erst frei gedacht, jetzt der Abgleich. Erfreulich viel des idealen
Modells existiert bereits — teils ungenutzt.

**Schon vorhanden und direkt verwertbar:**

- *Referenzmodell/Orakel (Schicht C):* `oracle/reference_model.py` +
  `engine/fitness.ts` (identische Logik, geteilte Physikkonstanten). Enthält
  bereits die „Reich-Gabelung" (sich ausschließende Photosynthese vs. Nahrungs-
  suche) — ein echter Trade-off, gut.
- *Populationsbasierter Kern:* `world/population.ts` (fitness-proportionale
  Reproduktion + Rekombination + Gauß-Mutation + endliche Population/Drift +
  optionale frequenzabhängige Konkurrenz nach Dieckmann & Doebeli). Deckt die
  „nicht verhandelbaren" Struktureigenschaften aus §4 ab.
- *Ko-Evolution (P5):* `world/coevolution.ts` (endogener Räuber-Beute-Druck, Red
  Queen).
- *Raum/Metapopulation (P3, P7):* `world/world.ts`.
- *Emergente Arten = Cluster (statt Kaskade):* `world/cluster.ts` (modes1D +
  Dichte-Clustering), Benennung `world/describe.ts`, Zensus `world/census.ts`.
- *Empirische Rarität / Erreichbarkeit:* `world/rarity.ts` (Umwelt-Sweep).
- *Äußere Optimierungsschleife (Keim des Loops):* `training/fit.ts` (GA fittet
  Engine-Parameter gegen das Orakel, 80–90 %-Validity-Band, mit Holdout-Schutz).
- *Theoretische Vorarbeit:* `spike/FINDINGS.md` bestätigt, dass Branching in
  diesem Rahmen real entsteht (braucht Population + Konkurrenzterm).

**Was fehlt / neu bzw. auszubauen ist:**

1. **Der Loop ist erst eine Schicht (nur C).** `training/fit.ts` misst nur
   Validity gegen das Orakel. Es fehlen **Schicht A** (Phänomen-Portfolio P1–P8
   als Score) und **Schicht B** (reale Verteilungsgesetze SAD/SAR/Größenspektrum
   als Score). → Kern-Neubau: das Szenario-Portfolio + die Verteilungs-Metriken.
2. **Genotyp→Phänotyp ist noch linear.** Kein GRN/Epistase → schwer erreichbare
   Phänotypen und Constraints entstehen nicht von selbst. → größter Realismus-
   Hebel, aber *strukturell* (gehört außerhalb der Auto-Schleife, §4.2).
3. **Genom-Breite inkonsistent.** `world/population.ts` nutzt `numGenes = 9`, das
   echte Genom hat 25 Merkmale (`engine/types.ts`), die v2-Benennung liest nur
   Indizes 0–9. → vor jeder Loop-Nutzung auf 25 vereinheitlichen, sonst misst der
   Loop ein verkürztes Modell.
4. **Die gute v2-Maschinerie ist nicht in der Live-App verdrahtet** (`app/index.html`
   importiert kein `core/world/*`, nutzt noch Mittelwert + Kaskade). → Distillation
   zielt sonst auf einen Pfad, den der Spieler gar nicht sieht.
5. **Champion-Persistenz + Multi-Schicht-Report + Regressions-Gate über alle drei
   Schichten** existieren noch nicht.

**Vorgeschlagene Reihenfolge (nächster Schritt nach dieser Arbeit):**
Genom auf 25 vereinheitlichen → Schicht-A-Portfolio + Schicht-B-Metriken bauen →
`training/fit.ts` zum Drei-Schicht-Loop mit Champion/Report/Regressions-Gate
erweitern → Ablations-Tests → (später, strukturell) GRN-Genotyp→Phänotyp.

---

## Anhang — Belegprinzip

Alle Verteilungs-Zielformen (Schicht B) und Phänomen-Erwartungen (Schicht A)
werden bei der Implementierung mit ihrer Quelle hinterlegt (Fisher 1943
log-series; Preston 1948 log-normal SAD; Arrhenius/Rosenzweig SAR z≈0.2–0.35;
Kleiber 1932 Stoffwechsel-Skalierung; Van Valen 1973 Red Queen; Dieckmann &
Doebeli 1999 sympatrische Speziation; Gould 1989 Kontingenz; Wright/Fisher Drift).
Es werden **keine** Zahlen erfunden — wo eine Referenzverteilung parametrisiert
wird, steht die Quelle daneben, und wo Unsicherheit besteht, wird ein Band statt
eines Punktwerts verwendet.
