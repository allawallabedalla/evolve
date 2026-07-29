# Forschungsergebnis: die nächste Engine-Generation (Konvergenz-Phase)

**Stand:** 2026-07-29 · Ergebnis des Forschungsauftrags aus `docs/forschungsauftrag-naechste-engine.md`
(Backlog Punkt 2). Divergenz-Phase: 4 parallele Sonnet-5-Agenten (12 Kandidaten aus 4
Themenclustern). Konvergenz-Phase + Deliverable: 1 Opus-5-Agent. Alle Zahlen in diesem
Dokument sind **an diesem Repo gemessen** (Node 22.22, `dist/` aus dem Stand von
2026-07-29), nicht geschätzt — Messskripte s. Anhang.

**Status:** Forschung abgeschlossen, Empfehlung liegt vor. Implementierung ist ein
eigener, mehrstufiger Umbau (s. „Migrationsplan" unten) — noch nicht begonnen außer wo im
Backlog explizit als erledigt vermerkt.

---

## Vorbemerkung: drei Messungen, die die Bewertung tragen

Bevor die Kandidaten bewertet werden, drei Befunde aus der Vermessung des Ist-Zustands. Sie
widerlegen teilweise die Arbeitshypothese des Forschungsauftrags und ändern damit, welcher
Kandidat gewinnt.

**Messung 1 — Die Fitness-Landschaft ist in ~15 von 25 Dimensionen flach.**
200 Bergsteiger-Läufe von je zufälligem Startpunkt, pro Biom, reiner Gradientenaufstieg bis
Konvergenz:

| Biom | verschiedene Endpunkte (Abstand > 0.25) |
|---|---|
| Eiszeit | 198 von 200 |
| Reiche Kronen | 200 von 200 |
| Offenes Meer | 200 von 200 |
| Lichtlose Tiefsee | 200 von 200 |

Praktisch jeder Startpunkt endet woanders. Das ist **kein** Landschafts-Reichtum, sondern das
Gegenteil: die 15 bedingten Kosten-Gene (detox … nfix) haben ohne ihren Stressor einen
Gradienten nahe null, der Bergsteiger bewegt sie nicht, und sie behalten ihren zufälligen
Startwert. Bestätigt durch die Varianz in der Agentenpopulation nach 250 Generationen (Mittel
über 13 Biome): **Σsd² der 15 bedingten Gene = 0.491, Σsd² der 10 Kern-Gene = 0.271.** Rund
**64 % des rohen 25-D-Euklid-Abstands zwischen zwei Individuen ist neutrales Driftrauschen.**

Konsequenz, die jeden populationsbasierten Kandidaten betrifft: `world/cluster.ts` und
`world/census.ts` funktionieren bei 25 Genen **nicht**. Gemessen bei N=300, 250 Generationen:
mittlere Paardistanz 1.28, Nächster-Nachbar-Distanz 0.90 — der voreingestellte Cluster-Radius
0.6 (bzw. 0.7 im Zensus) findet im Schnitt **0.10 bis 1.23 Cluster pro Lauf**, d. h. meistens
gar keinen. Arten-Erkennung braucht zwingend eine **selektions-gewichtete Metrik**.

**Messung 2 — Eine Agentenpopulation allein ist NICHT vielfältiger als der Status quo.**
Über die 13 realen Biom-Presets der App, je 40 Läufe:

| Regime | verschiedene Formen | Determinismus |
|---|---|---|
| A) Status quo, Mean-Field, deterministisch | 10 | 100 % (per Definition) |
| B) Status quo + stochastische Drift (`DRIFT_SCALE`) | **32** | z. B. Räuberland 100 % Fisch |
| C) Agentenpopulation N=300, Mittelwert | 24 | 7 von 13 Biomen zu 100 % festgelegt |

Die naive Antwort „nimm einfach `world/population.ts`" ist **empirisch falsch**. Der Grund ist
Fishers Fundamentalsatz, exakt wie in `spike/FINDINGS.md` vorhergesagt: Selektion auf einer
*fixen* Landschaft zehrt Varianz auf und konvergiert auf **einen** Gipfel. Die Population ist
sogar *deterministischer* als der Mean-Field-Lauf mit Drift, weil N=300 die Drift wegmittelt.

Der Vielfalts-Treiber ist also nicht „Population statt Punkt" — es ist **Frequenzabhängigkeit**.
Population ist nur die notwendige *Darstellung* dafür.

**Messung 3 — „Fisch/Insekten unerreichbar" sind zwei verschiedene Probleme.**
Über gleichverteilte Zufalls-Umwelten (400 Stichproben, 250 Generationen) liefert schon der
**heutige** deterministische Mean-Field-Lauf: Fisch 11.8 %, Insekt 2.8 %, 30 verschiedene
Formen. Über die 13 **realen Biom-Presets** dagegen: Fisch 15–16 %, **Insekt 0.0 % in allen
drei Regimen.**

- **Fisch ist längst erreichbar.** Der Nutzer-Eindruck „nie gesehen" entsteht, weil die
  Regler-Voreinstellung und die meisten Presets in Mikroben-/Mischotrophen-Regionen fallen —
  „Archaee · Extremophil" und „Bakterie" schlucken zusammen ~35 % aller Presets. Das ist ein
  **Kalibrier- und Benennungsproblem**, kein Erreichbarkeitsproblem.
- **Insekt ist wirklich unerreichbar**, aber nicht wegen des Gradientenaufstiegs: in
  `engine/fitness.ts` gibt es **keinen Term, der lange Gliedmaßen an einem winzigen Körper
  belohnt**. `reach` skaliert mit `limb*reachFromLimb*landFactor` — aber `size*reachFromSize`
  liefert dasselbe billiger, und `maintenance.limbLength` bleibt. Es gibt schlicht keinen
  Fitness-Gipfel dort. Multi-Start über 2200 Läufe findet „Insekt · Gliederfüßer" bei
  **0.14 %**, „Krebstier · Arthropode" bei 1.64 %. Kein Suchalgorithmus der Welt findet einen
  Gipfel, den die Physik nicht enthält.

**Messung 4 — Der Kaskaden-Bug, exakt reproduziert.**
Genom `insulation .82, metabolism .75, mobility .70, biolum .60, limb .20, armor .20`:

```
classify()  ->  "Leuchtwesen · Tiefsee"
dasselbe Genom, nur biolum .60 -> .20:
classify()  ->  "Fisch · Aalform"
```

Ein einziges Gen kippt die Identität über zwei Archetypen hinweg, und „Fell-Warmblüter" wird
**nie** erreicht, obwohl Isolation der mit Abstand höchste Wert ist. Bestätigt die
Fehleranalyse wörtlich.

---

## 1. Vollständige Kandidatenliste aus Phase 1 (ungefiltert)

| # | Kandidat | Cluster | Kernidee in einem Satz | Urteil Phase 2 |
|---|---|---|---|---|
| 1 | **Gen-Regulationsnetzwerk mit Zell-Abstammungsbaum** | A Evo-Devo | Genom = gerichteter Genschalter-Graph; Körper entsteht aus wiederholter Zellteilung mit lokalen Morphogenkonzentrationen; modulare Wiederverwendung erzeugt Segmentierung, Rückkopplung erzeugt Makromutationen | **verworfen** — s. §7 |
| 2 | **Reaktions-Diffusions-Morphogenfeld** | A Evo-Devo | Genom kodiert Turing-Chemie (Diffusionsraten, Kinetik); Körper = ausgelesenes Konzentrationsfeld; Fisch vs. Insekt = verschiedene Bifurkationszweige | **verworfen** — s. §7 |
| 3 | **Parametrisches L-System / Graph-Grammatik** | A Evo-Devo | Genom = Ersetzungsregeln variabler Länge; rekursive Baupläne, variable Bein-/Fingerzahl gratis; Mutation = Baum-Edits | **verworfen** — Genotyp variabler Länge bricht Fitness-Funktion + Orakel-Parität; kein Weg zurück in die validierte Physik |
| 4 | **Artenschwarm mit emergenter adaptiver Radiation** | B Ökosystem | Hunderte Individuen, Cluster = Arten, endliche Ressourcen per Lotka-Volterra; Speziation/Aussterben first-class; frequenzabhängige Fitness | ⭐ **Kern des Gewinners** |
| 5 | **Nischenkonstruktion — Organismen als Umwelt-Architekten** | B Ökosystem | Umweltachsen werden mutierbares Feld, das Organismen lokal überschreiben; geschichtete Ökosysteme ohne Design | ⭐ **teilweise übernommen** (skalare, nicht räumliche Form) |
| 6 | **Genomloses Replikator-Substrat (Tierra/Avida)** | B Ökosystem | Kein Merkmalsvektor; Organismen = Instruktionsmuster, die um Energie/Rechenzeit konkurrieren; Merkmale sind Verhaltens-Signaturen | **verworfen** — s. §7 |
| 7 | **Lenia-artige Kontinuums-CA** | C ALife | Genom = CA-Regelparameter (Kernel, Wachstumsfunktion); Phänotyp entsteht durch Simulation über Entwicklungszeit; Beinpaare als Phasenübergang | **verworfen** — Regel→Phänotyp teils chaotisch, keine Erklärbarkeit, Feldsimulation pro Individuum unbezahlbar |
| 8 | **Artificial-Chemistry-Reaktionsnetzwerk (Chromaria-artig)** | C ALife | Genom = Population reagierender Gen-Moleküle; Phänotyp = Attraktor; Multistabilität erlaubt koexistierende inkompatible Lösungen | **verworfen** — Multistabilität liefert Kandidat 4 billiger und beweisbar |
| 9 | **Quanten-Superpositions-Genom mit Beobachter-Kollaps** | C ALife | Individuum = gewichtete Superposition mehrerer Phänotypen, kollabiert bei Spieler-Handlung; Geschwister verschränkt | **verworfen** — Erklärbarkeit strukturell unmöglich; Vererbung über Kollaps hinweg undefiniert |
| 10 | **Modulare Chimären-Engine (Teile-Graph)** | D Generativ | Individuum = generativer Bauteil-Graph mit Slots; Mutation fügt Teile hinzu/entfernt; diskontinuierliche Sprünge 0→6 Beine. **Namensersatz: Ähnlichkeits-Matching gegen Archetyp-Bibliothek mit Konfidenz** | ⭐ **Benennungs-Hälfte übernommen**, Genom-Hälfte verworfen |
| 11 | **Chronik-getriebene Divergenz (Narrative-first)** | D Narrativ | „Story-Score" neben physikalischer Fitness, darf sie überstimmen; garantiert unterschiedliche Durchläufe | **verworfen** — s. §7 |
| 12 | **Prozedurale Mythologie (Stil-Attraktoren)** | D Stil | Zweite, unabhängige Vererbungsspur (Stil-Genom) neben dem Funktions-Genom, mit eigenen ästhetischen Drift-Regeln | **verworfen** — reines Renderer-Feature, löst kein Modellproblem; als späteres Kosmetik-Layer möglich |

---

## 2. Empfehlung: **Nischen-Schwarm mit Prototyp-Benennung**

> **Kandidat 4** (Artenschwarm/adaptive Radiation) als Kern
> **+ frequenzabhängige Konkurrenz auf einem mehrdimensionalen Nischen-Kernel** (der in
> Kandidat 4 nur angedeutete Lotka-Volterra-Teil — das eigentliche Wirkprinzip)
> **+ gestreute Gründer-Genome** statt festem Startpunkt 0.5 (der pragmatische
> Performance-Trick: Basin-Diversität zum Preis von null)
> **+ Kandidat 5 in reduzierter, skalarer Form** (endogener Prädationsdruck statt exogenem
> Regler — bereits als `world/coevolution.ts` implementiert)
> **+ Benennungs-Hälfte von Kandidat 10**: Prototyp-Bibliothek + gewichtetes
> Ähnlichkeits-Matching mit Konfidenz, statt if/else-Kaskade.

### Warum dieser Hybrid unter den Phase-2-Kriterien gewinnt

**Browser-Echtzeit — gemessen, nicht geschätzt.** N=200, 25 Gene, 8-achsiger O(N²)-Nischen-
Kernel: **2.0 ms pro Generation** in Node. Bei einem Browser-Faktor 1.5–3× sind das 3–6 ms —
**6 % des 100-ms-Budgets**. Selbst vier Orte (Metapopulation) landen bei 12–24 ms. Reines JS,
keine GPU, kein WASM, keine Typed-Array-Optimierung nötig (die wäre noch als Reserve da).

**Erklärbarkeit — besser als heute, nicht schlechter.** Das ist das kontraintuitive Argument,
und es ist das stärkste. `engine/explain.ts` liefert heute *handgeschriebene deutsche
Ursachen-Strings* pro Gen (`causeFor()`), die aus `env`-Schwellen geraten werden — der
Kommentar im Code dokumentiert selbst einen Bug daraus (BUG-2: „behauptet knappe Nahrung,
obwohl Nahrung reichlich ist"). Eine Population liefert stattdessen die **echte, messbare
Größe der Populationsgenetik**: das Selektionsdifferential

```
S_g = cov(fitness_i, gene_i,g) / mean(fitness)
```

direkt aus dem Schwarm, jede Generation, ohne eine einzige geratene Schwelle. Daraus wird
„**Isolation +0.08 diese Generation, weil isoliertere Individuen 12 % mehr Nachkommen
hatten**" — eine Aussage, die aus der Simulation *folgt* statt sie zu behaupten. Zusätzlich
wird die Energie-Zerlegung von `fitness()` pro Cluster ausweisbar: „diese Linie lebt zu 71 %
von aquatischer Jagd" — das ist die Ursache-Wirkungs-Kette, die der Spieler sehen soll.

**Trade-off-Tiefe — bleibt vollständig erhalten und wird tiefer.** Die gesamte Physik aus
`engine/fitness.ts` (402 Zeilen, 7 Energiepfade, 13 Überlebens-Terme, Kleiber-Allometrie,
`exclusion`-Gabelung, `landFactor`, Wasser-Drag, quadratische Grenzkosten) wird **unverändert**
weiterbenutzt. Zusätzlich kommt eine Trade-off-Ebene dazu, die es heute überhaupt nicht gibt:
der **Konkurrenz-Trade-off**. Ein Genom ist nicht mehr nur gegen die Umwelt gut oder schlecht,
sondern gegen die Umwelt *und gegen das, was sonst noch da ist*. Genau das erzeugt „ich weiche
in die schlechtere, aber leere Nische aus" — die Bewegung, die reale Radiationen antreibt.

**Erreichbarkeit aller Grundformen — gemessen.** Prototyp-Lauf (N=200, 250 Gen, 8-Achsen-
Kernel σ_C=0.22, gestreute Gründer, 5 Läufe je Biom über 11 Biome):

- **1.47 koexistierende Cluster pro Lauf** (statt 1.0 per Konstruktion beim Mean-Field)
- **20 verschiedene Formen**, Verteilung nicht-uniform aber ohne Totalausfall: Protist 15.9 %,
  Verholzter Strauch 12.6 %, Leuchtwesen 9.9 %, Fisch 9.9 %, Generalist 7.9 %, …
  Zunderschwamm 0.30 %
- echte Koexistenz pro Biom, z. B. *Räuberland* → Generalisten-Tier 40 % **+**
  Fell-Warmblüter 40 % **+** Fell-Großtier 20 %; *Sonniger Sumpf* → 5 gleichzeitige Formen

Das ist genau das geforderte Profil: **plausibel, nicht-uniform, nicht verschwindend.**

### Warum das ein Sprung ist und keine Politur

Vier Dinge ändern sich **qualitativ**, nicht graduell:

1. **Der Zustand wechselt von einem Punkt zu einer Verteilung.** Koexistenz ist heute nicht
   „selten", sondern **nicht darstellbar** — der Mittelwert eines gespaltenen Schwarms liegt
   im leeren Tal (`spike/FINDINGS.md`). Nach dem Umbau ist Vielfalt ein *Gleichgewichtszustand*,
   kein Lotterie-Treffer.
2. **Die Fitness wechselt von fix zu frequenzabhängig.** Damit hört Fishers Fundamentalsatz
   auf, Konvergenz auf einen Gipfel zu erzwingen. Das ist der einzige gemessene Mechanismus,
   der in *diesem* Repo, mit *dieser* Fitness, mehrgipflige Stabilität erzeugt hat (Spike
   bestätigt, Prototyp bestätigt).
3. **Die drei globalen Parameter verschwinden statt neu gefittet zu werden.** Die
   Per-Gen-Fehleranalyse (Punkt 9 Schritt 1) hat richtig diagnostiziert, dass `mutationRate`/
   `selectionStrength`/`varianceWeight` als je *eine* Zahl für 25 Gene an eine
   Kapazitätsgrenze stoßen (`validityTest` 71.6 %, Ziel 80–90 %). Die ehrliche Auflösung ist
   nicht „mehr Parameter", sondern: **das Surrogat wird gelöscht.** Die Produktions-Engine
   *ist* danach der Referenz-Algorithmus, nur mit kleinerem N. Es gibt nichts mehr zu
   approximieren.
4. **Die Identität wechselt von Regel-Reihenfolge zu Metrik-Nähe.** Die heutige Klippe
   (biolum .60 → „Leuchtwesen", biolum .20 → „Fisch", nie „Fell") ist nicht wegkalibrierbar —
   sie ist die Bauform „erster Treffer gewinnt". Sie verschwindet nur mit der Bauform.

### Explizite Antwort: Ist das Zwei-Motoren-Prinzip noch richtig?

**Nein, nicht in seiner heutigen Form — aber der Gedanke überlebt in einer neuen.**

Das Distillations-Gerüst stirbt aus einem strukturellen Grund: das Ziel ist eine
**multimodale Verteilung**, das Surrogat ist ein **Mittelwert**. Eine multimodale Verteilung
lässt sich nicht in ihren Mittelwert destillieren — die Zielgröße existiert im
Surrogat-Zustandsraum nicht. `validityTrain`/`validityTest`/`trainMAE` (Per-Gen-MAE auf einer
Mittelwert-Trajektorie) messen danach nichts Sinnvolles mehr und fallen **ersatzlos** weg.

Was überlebt, verschiebt sich um eine Ebene nach oben: das Python-Orakel wird vom
**Destillations-Ziel** zum **statistischen Prüfstand**. Neue Frage: *Erzeugt der
Browser-Schwarm mit N=200 dasselbe Arten-Frequenzspektrum wie der Orakel-Schwarm mit
N=2000?* Neue Metrik: Jensen-Shannon-Divergenz über die Formhäufigkeiten + Abweichung der
mittleren Clusterzahl + Rangkorrelation der Rarität. Kalibriert werden nicht mehr
Antwortraten, sondern `PopulationConfig` (`size`, `mutationSd`, `selPower`, `sigmaC`). Das
ist ein **Konvergenz-in-N-Test**, kein Distillations-Test.

### Explizite Antwort: Kann er auf `world/` aufbauen?

**Ja, zu geschätzt 80 %.** `world/` ist das richtige Fundament und nicht bei null. Was fehlt,
ist präzise benennbar:

| Datei | Zustand | nötige Änderung |
|---|---|---|
| `world/population.ts` | ✅ tragfähig (Wright-Fisher, Roulette, Rekombination, Mutation, `reproduceWith`) | `CompetitionConfig.axis: number` → `axes: number[]` (mehrdimensionaler Kernel); `startSpread` als Uniform-Option |
| `world/world.ts` | ✅ 1:1 nutzbar (Metapopulation, Migration, `catastrophe`, `colonize`, `climateShift`) | keine |
| `world/coevolution.ts` | ✅ 1:1 nutzbar (Red-Queen, endogene Prädation) | keine — als optionale Stufe 2 einschalten |
| `world/cluster.ts` | ⚠️ **Struktur gut, Metrik kaputt** | `dist()` durch **selektions-gewichtete** Distanz ersetzen (Messung 1 — sonst 0.1 Cluster/Lauf) |
| `world/census.ts` | ⚠️ nutzbar | `radius`-Default neu kalibrieren; `describe`/`formKey` durch Prototyp-Matcher ersetzen |
| `world/describe.ts` | ❌ | ersetzen — ist selbst eine (kleinere) Schwellen-Kaskade mit denselben Klippen |
| `world/rarity.ts` | ✅ Konzept richtig | auf neuen Formschlüssel umstellen |

---

## 3. Algorithmus in Pseudocode

```
// ============================================================
// TYPEN
// ============================================================
Genome      = Float64Array(25)          // Reihenfolge = TRAITS (types.ts), unverändert
Environment = { 6 Regler + 10 optionale Stressoren }   // types.ts, unverändert
Physics     = physics.json                              // unverändert

SwarmConfig = {
  N            : 200,          // Individuen je Ort
  mutationSd   : 0.05,
  selPower     : 2.0,
  recombProb   : 0.5,
  nicheAxes    : [1,2,4,5,6,8,9,15],   // size,limb,armor,photo,mobility,wing,biolum,filter
  sigmaC       : 0.22,         // Konkurrenzbreite (validiert: Branching wenn sigmaC < sigmaK)
  sigmaK       : 0.35,         // Ressourcenbreite
  compStrength : 1.0,          // 0 = Frequenzabhängigkeit aus (Fallback = altes Verhalten)
  founderSpread: "uniform",    // "uniform" | "tight"
}

// ============================================================
// A) INITIALISIERUNG — einmal je Spiel-/Ortsstart
// ============================================================
function initSwarm(cfg, seed, seedGenome?) -> Genome[]:
    rng = mulberry32(seed)                       // aus world/population.ts, unverändert
    if seedGenome given:                         // „dein Wesen besiedelt diesen Ort"
        // WICHTIG: auch hier streuen, sonst ist der Ort sofort monomorph
        return N × clamp01(seedGenome + gauss(0, 0.12))
    if cfg.founderSpread == "uniform":
        // DER TRICK: gestreute Gründer statt Startpunkt 0.5.
        // Kostet null Rechenzeit und öffnet alle Einzugsgebiete gleichzeitig.
        // Gemessen: ohne ihn kollabiert die Vielfalt auf das Mean-Field-Niveau.
        return N × Genome(25 × rng())
    else:
        return N × clamp01(0.5 + gauss(0, 0.03))

// ============================================================
// B) EIN SIMULATIONSSCHRITT = EINE GENERATION = EIN SPIEL-TICK
// ============================================================
function stepSwarm(pop, env, phys, cfg, rng) -> { pop, telemetry }:

    // --- B1. Basis-Fitness: DIE BESTEHENDE PHYSIK, UNVERÄNDERT ---
    for i in 0..N-1:
        f[i] = fitness(pop[i], env, phys)        // engine/fitness.ts, 341 ns/Aufruf
        base[i] = f[i] ^ cfg.selPower

    // --- B2. Frequenzabhängige Konkurrenz (DER Vielfalts-Mechanismus) ---
    // n_i = Dichte ähnlicher Konkurrenten im Nischenraum.
    // K_i = Ressourcen-Verfügbarkeit an dieser Nischenposition.
    // Adaptive Dynamics: Branching genau dann, wenn sigmaC < sigmaK.
    if cfg.compStrength > 0:
        inv2c2 = 1/(2*sigmaC^2);  inv2k2 = 1/(2*sigmaK^2)
        for i in 0..N-1:
            n = 0
            for j in 0..N-1:                                  // O(N² × |nicheAxes|)
                d2 = Σ over a in nicheAxes: (pop[i][a]-pop[j][a])²
                n += exp(-d2 * inv2c2)
            n /= N
            dk2 = Σ over a in nicheAxes: (pop[i][a] - 0.5)²
            K   = exp(-dk2 * inv2k2)
            w[i] = base[i] * K / (n + 1e-9) ^ cfg.compStrength
    else:
        w = base

    // --- B3. Optional Stufe 2: endogener Räuberdruck (world/coevolution.ts) ---
    //     Ersetzt env.predation individuell durch das Beuteschema der Räuber-Population.
    //     Red-Queen-Dynamik; unverändert übernehmbar.

    // --- B4. Reproduktion: Wright-Fisher, unverändert aus population.ts ---
    cum = kumulierte Gewichte von w;  total = cum[N-1]
    next = []
    for k in 0..N-1:
        pa = rouletteBinarySearch(cum, total, rng)
        pb = rouletteBinarySearch(cum, total, rng)
        child = new Genome(25)
        for g in 0..24:
            child[g] = clamp01( (rng() < recombProb ? pb[g] : pa[g]) + gauss(0, mutationSd) )
        next.push(child)

    // --- B5. Telemetrie für die Erklärung — misst, statt zu behaupten ---
    meanFit = mean(f)
    for g in 0..24:
        selDiff[g] = cov(f, column(pop, g)) / meanFit      // echtes Selektionsdifferential
        drift[g]   = mean(next, g) - mean(pop, g)
    energyShare  = mittlere Zerlegung von fitness() in die 7 Energiepfade
    stressLosses = mittlere Zerlegung in die 13 Überlebens-Terme

    return { pop: next, telemetry: { selDiff, drift, meanFit, energyShare, stressLosses } }

// ============================================================
// C) WELT-SCHRITT (Metapopulation) — world/world.ts, unverändert
// ============================================================
function stepWorld(world):
    for place in world.places:  place.pop = stepSwarm(place.pop, place.env, ...)
    world.migrate()                     // Genfluss gemäß Migrationsmatrix
    // Ereignisse (Spieler): catastrophe | colonize | climateShift

// ============================================================
// D) TERMINIERUNG
// ============================================================
// Es gibt KEIN Ende. Das Spiel ist ein Dauerlauf: 1 Tick = 1 Generation.
// Die Ergebnis-Extraktion (E) ist eine LESE-Operation auf dem laufenden Zustand
// und läuft NICHT jeden Tick, sondern alle CENSUS_INTERVAL = 15 Ticks
// (Amortisierung; s. §5) oder sofort auf Spieler-Anforderung.
//
// Nur für Offline-Werkzeuge (rarity-Sweep, Orakel-Parität) gibt es ein Ende:
//   stop wenn  gen >= maxGens
//        ODER  Formspektrum über 40 Generationen stabil
//              (JS-Divergenz aufeinanderfolgender Fenster < 0.02)

// ============================================================
// E) ERGEBNIS-EXTRAKTION — „was ist mein Wesen geworden?"
// ============================================================
function readSpecies(pop, env, phys, protoLib) -> Species[]:

    // E1. Selektions-Relevanz je Gen (behebt Messung 1)
    //     Ohne diesen Schritt ertrinkt jede Cluster-Erkennung im Driftrauschen
    //     der 15 bedingten Gene (gemessen: 64 % des rohen Abstands).
    m = mean(pop)
    for g in 0..24:
        rel[g] = |fitness(m+εe_g) - fitness(m-εe_g)| / 2ε         // 50 fitness-Aufrufe
    relW = 0.15 + 0.85 * rel / max(rel)      // Boden 0.15: nie ganz ignorieren

    // E2. Gewichtetes Dichte-Clustering (world/cluster.ts mit ersetzter Metrik)
    wdist(a,b) = sqrt( Σ_g ((a[g]-b[g]) * relW[g])² )
    clusters = greedyLeaderClustering(pop, wdist, radius=0.35, minFraction=0.08)

    // E3. Benennung je Cluster — s. §4
    for c in clusters:
        c.identity = matchArchetype(c.centroid, env, phys, protoLib)

    // E4. Anreicherung
    for c in clusters:
        c.abundance    = c.fraction
        c.energyPath   = dominanter Energiepfad des Zentroids
        c.rarity       = rarityMap.lookup(c.identity.key)      // world/rarity.ts
        c.whyItExists  = topN(selDiff, 3) + energyShare        // aus Telemetrie B5

    return clusters sorted by abundance desc
```

---

## 4. Konkreter Ersatz für die Genom→Archetyp-Namenskaskade

**Weg:** die ~60-zeilige if/else-Kaskade in `app/index.html` (`classify()`, 43 Formen, erster
Treffer gewinnt) und die kleinere Schwellen-Kaskade in `world/describe.ts`.

**Ersatz:** Prototyp-Bibliothek + selektions-gewichtetes Nächster-Nachbar-Matching mit
Konfidenz und Neuheits-Erkennung.

### 4.1 Datenstruktur

Jeder Archetyp wird zu **Daten** statt zu Kontrollfluss — eine JSON-Datei `archetypes.json`,
kein Code:

```jsonc
{
  "archetypes": [
    { "key": "fisch",   "name": "Fisch · Aalform",       "icon": "fish",  "emoji": "🐟",
      "proto": { "size":.40, "limbLength":.05, "mobility":.85, "armor":.08,
                 "structure":.10, "metabolism":.60, "photosynthesis":.02 },
      "requires": { "water": [0.55, 1.0] } },        // optionales Umwelt-Plausibilitätsfenster

    { "key": "fellwarm","name": "Fell-Warmblüter",       "icon": "fox",   "emoji": "🦊",
      "proto": { "insulation":.80, "size":.45, "limbLength":.40, "mobility":.70,
                 "metabolism":.80, "armor":.15, "photosynthesis":.02 } },

    { "key": "leucht",  "name": "Leuchtwesen · Tiefsee", "icon": "jelly", "emoji": "🪼",
      "proto": { "size":.30, "limbLength":.05, "mobility":.60, "armor":.05,
                 "biolum":.80, "structure":.05, "photosynthesis":.02 },
      "requires": { "light": [0.0, 0.25] } }
    // … alle 43 bestehenden Formen; nicht genannte Gene default 0.15
  ]
}
```

Der Migrations-Aufwand ist mechanisch: jede Kaskaden-Zeile
`if(limb<0.3 && armor<0.32 && mob>0.6) return "Fisch"` wird zum Prototyp-Vektor mit genau
diesen Werten in der Mitte ihres Bereichs. Die Schwellen sind bereits die Information — sie
werden nur von Grenzen zu Zentren.

### 4.2 Matching-Algorithmus

```ts
function matchArchetype(g: Genome, env: Environment, phys: Physics, lib: Archetype[]) {
  // (1) Selektions-Relevanz — dieselbe wie in E1.
  //     Wirkung: in einer giftfreien Umwelt zählt 'detox' fast nichts für die
  //     Identität; in einer giftigen wird es identitätsstiftend. Die Benennung
  //     wird damit UMWELT-BEWUSST, ohne eine einzige if-Abfrage über env.
  const w = relevanceWeights(g, env, phys);        // 50 fitness-Aufrufe, ~17 µs

  // (2) gewichteter, normierter Abstand zu jedem Prototyp
  const scored = lib.map(a => {
    let s = 0, z = 0;
    for (let k = 0; k < 25; k++) { const d = (g[k] - a.proto[k]) * w[k]; s += d*d; z += w[k]*w[k]; }
    let dist = Math.sqrt(s / z);
    // (3) Plausibilitätsfenster: ein Landtier wird in der Tiefsee bestraft,
    //     aber NICHT verboten — weiche Strafe statt harter Zweig.
    if (a.requires && !inRange(env, a.requires)) dist *= 1.35;
    return { a, dist };
  }).sort((x, y) => x.dist - y.dist);

  const [best, second] = scored;
  // (4) Konfidenz = relativer Vorsprung vor dem Zweitplatzierten
  const confidence = clamp01((second.dist - best.dist) / second.dist * 2.2);
  // (5) Neuheit: zu weit von ALLEM entfernt -> keine erzwungene Einordnung
  const novel = best.dist > NOVEL_THRESHOLD;   // 0.42, kalibriert am Rarity-Sweep

  return novel
    ? { name: generateName(g, env), key: `novum:${signature(g)}`, confidence: 0,
        nearest: best.a.name, novel: true }
    : { name: best.a.name, key: best.a.key, icon: best.a.icon, emoji: best.a.emoji,
        confidence, alternative: second.a.name, novel: false };
}
```

### 4.3 Generierter Name für neuartige Topologien

Kein Zwang zur Einordnung. `generateName()` komponiert aus den drei am stärksten
*selektionsrelevanten* Abweichungen vom nächsten Prototyp — z. B. „**Gepanzerter
Leuchtschwimmer**" statt einer falschen Zuordnung zu „Krebstier". Die vorhandenen
Merkmals-Adjektive aus `world/describe.ts` (`AXES`) sind dafür direkt wiederverwendbar; nur
die Auswahl ändert sich von festen Schwellen zu Relevanz-Ranking.

### 4.4 Verifikation — der gemeldete Bug, gemessen vorher/nachher

| Genom | `classify()` heute | Prototyp-Matcher |
|---|---|---|
| `insul .82, metab .75, mobility .70, biolum .60, limb .20` | **Leuchtwesen · Tiefsee** ❌ | **Fell-Warmblüter** (Konfidenz 59 %, „oder: Fisch · Aalform") ✅ |
| dito, aber `biolum .20` | **Fisch · Aalform** ❌ (Identitätsklippe) | **Fell-Warmblüter** (Konfidenz 100 %) ✅ |
| `size .15, limb .72, mobility .68, armor .32` | Insekt · Gliederfüßer ✅ | **Insekt · Gliederfüßer** (Konfidenz 100 %, „oder: Krebstier") ✅ |
| unmögliche Chimäre (alles ~.5) | Gepanzerter Koloss ❌ (stiller Fehltreffer) | Gepanzerter Koloss, **Konfidenz 1 % → generierter Name** ✅ |

Beide gemeldeten Symptome verschwinden: die falsche Leuchtwesen-Zuordnung *und* die Klippe,
bei der ein einzelnes Gen die Identität über zwei Archetypen hinweg kippt. Zusätzlich fällt
ein bisher unsichtbarer Fehlerklasse weg: der stille Fehltreffer bei Chimären wird sichtbar,
weil die Konfidenz ihn ausweist.

**Produkt-Nebeneffekt:** Konfidenz ist Spielinhalt. „Fell-Warmblüter (59 % — grenzt an Fisch)"
erzählt dem Spieler, dass seine Linie an einer Weggabelung steht. Das ist Information, die die
Kaskade prinzipiell nicht liefern kann.

---

## 5. Performance-Abschätzung

**Alle Basiswerte gemessen**, Node 22.22, `dist/` aus dem aktuellen Stand.

### Gemessene Bausteine

| Operation | Messung |
|---|---|
| `fitness()` (25 Gene, alle Terme) | **341 ns/Aufruf** (2.93 M/s, 2 Mio Aufrufe in 683 ms) |
| `Population.step()` N=100 / 200 / 300 / 500 / 1000 | 0.225 / 0.387 / **0.604** / 0.971 / 2.012 ms |
| `Population.step()` + 1-Achsen-Kernel, N=100/200/300/500 | 0.361 / 0.903 / 1.706 / 4.085 ms |
| **Nischen-Schwarm N=200, 8-Achsen-Kernel** | **2.00 ms/Generation** (500 ms / 250 Gen, Prototyp) |
| `clusters()` N=100 / 200 / 300 / 500 | 0.474 / 1.157 / **1.954** / 5.102 ms |
| Relevanzgewichte (50 `fitness()`-Aufrufe) | 0.017 ms |
| *Referenz:* `stepGeneration()` Status quo | 0.017 ms/Generation |

### Operationszählung pro Tick (Zielkonfiguration N=200)

| Phase | Operationen | Kosten |
|---|---|---|
| B1 Basis-Fitness | 200 × `fitness()` | 0.07 ms |
| B2 Nischen-Kernel | 200 × 200 × 8 = **320 000** Distanz+exp | ~1.5 ms |
| B4 Reproduktion | 400 Binärsuchen (log₂200≈8) + 200 × 25 Mutationen = 5 000 | ~0.3 ms |
| B5 Telemetrie | 25 Kovarianzen über 200 = 5 000 | ~0.05 ms |
| **Summe pro Generation** | **~330 000 Operationen** | **≈ 2.0 ms (Node)** |
| E Zensus (alle 15 Ticks) | 50 `fitness()` + 200²×25 = 1.0 M | +2.5 ms |

### Browser-Hochrechnung

Konservativer Faktor **1.5–3×** gegenüber Node (dieselbe V8-Engine, aber ungünstigere
JIT-Bedingungen, GC-Druck, konkurrierende Renderarbeit):

| Konfiguration | Node | **Browser (erwartet)** | Anteil am 100-ms-Budget |
|---|---|---|---|
| 1 Ort, N=200 | 2.0 ms | **3 – 6 ms** | **3 – 6 %** |
| 1 Ort, N=200 + Zensus-Tick | 4.5 ms | 7 – 14 ms | 7 – 14 % |
| 4 Orte (Metapopulation), N=150 | ~5.5 ms | 8 – 17 ms | 8 – 17 % |
| 4 Orte + Koevolution (Räuber) | ~11 ms | 17 – 33 ms | 17 – 33 % |

**Fazit: 15- bis 30-facher Sicherheitsabstand zum 100-ms-Ziel.** Selbst die Vollausbaustufe
(Metapopulation + Räuber-Koevolution + Zensus) bleibt unter einem Drittel des Budgets. Ein Ort
passt sogar in einen 60-fps-Frame (16.7 ms); für die Ausbaustufen empfiehlt sich ein vom
Rendering entkoppelter Sim-Tick mit 4–8 Hz — was ohnehin dem Spielgefühl entspricht (eine
Generation ist kein Frame).

### Reserven, falls je nötig (aktuell nicht erforderlich)

1. `Genome` als `Float64Array` statt `number[]` — erfahrungsgemäß 1.5–2× auf solchen Schleifen.
2. Nischen-Kernel auf **Stichprobe** statt volles O(N²): 40 zufällige Konkurrenten statt 200 →
   5× billiger, statistisch praktisch identisch. Macht N=1000 erreichbar.
3. Kernel-Dichten nur alle 3 Generationen neu berechnen (ändern sich langsam) → −60 % auf B2.
4. Zensus in einen Web Worker.

---

## 6. Migrationsplan

### 6.1 Unverändert wiederverwendbar (das wertvollste Kapital)

| Asset | Umfang | Begründung |
|---|---|---|
| **`engine/fitness.ts`** | 402 Zeilen | **Der Kern bleibt zu 100 %.** 7 Energiepfade, 13 Überlebens-Terme, Kleiber-Allometrie, `exclusion`-Gabelung, `landFactor`, Wasser-Drag, quadratische Grenzkosten. Wird pro Individuum statt pro Mittelwert aufgerufen — die Funktion selbst ändert sich **nicht in einer Zeile**. |
| **`physics.json`** | ~100 Konstanten | unverändert. Die gesamte Biologie-Audit-Arbeit (AXIS-1 … AXIS-19) bleibt gültig. |
| **`oracle/reference_model.py`** | 397 Zeilen | bleibt als Prüfstand, neue Rolle (s. o.) |
| `world/population.ts` | 195 Zeilen | Wright-Fisher, Roulette, Rekombination, `reproduceWith`, `seedFrom` — nur `CompetitionConfig` erweitern |
| `world/world.ts` | 229 Zeilen | Metapopulation, Migration, `catastrophe`, `colonize`, `climateShift`, `diversityNN` — **keine Änderung** |
| `world/coevolution.ts` | 126 Zeilen | Red-Queen-Modul — **keine Änderung**, als Stufe 2 zuschaltbar |
| `engine/types.ts` | TRAITS, Environment, Physics | unverändert (nur `EngineParams` fällt weg) |
| `tools/bundle-app-core.mjs` + `app/core/` | Build-Pipeline | unverändert — `world/` ist bereits gebündelt |
| `engine/development.ts` | 168 Zeilen | Bauplan-Ableitung; nur `classify()`-Aufruf → Matcher-Aufruf |
| `docs/`-Referenzen | tree-of-life, biodiversity, faktoren-katalog | unverändert |

### 6.2 Zu ersetzen

| Was | Wodurch | Aufwand |
|---|---|---|
| `world/cluster.ts` → `dist()` | **selektions-gewichtete Distanz** (E1). *Nicht optional* — ohne sie 0.10–1.23 Cluster/Lauf statt 1.47 (gemessen). | S — eine Funktion + Gewichtsvektor durchreichen |
| `app/index.html` `classify()` | `archetypes.json` + `matchArchetype()` (§4) | M — 43 Kaskadenzweige mechanisch zu Prototypen |
| `world/describe.ts` | dito (ist dieselbe Bauform, kleiner) | S |
| `world/census.ts` | Matcher statt `describe`/`formKey`; `radius`-Default neu | S |
| `world/rarity.ts` | neuer Formschlüssel; Sweep über Schwarm statt Einzelpopulation | S |
| `engine/explain.ts` `causeFor()` | **Selektionsdifferential aus Telemetrie B5** statt handgeschriebener `env`-Schwellen-Strings. Behebt nebenbei die im Code selbst dokumentierte BUG-2-Klasse. | M |
| `training/fit.ts` (266 Z.) | Verteilungs-Kalibrierung von `PopulationConfig` gegen das Orakel (JS-Divergenz über Formspektren) statt Per-Gen-MAE-Fit | M |
| `app/index.html` dupliziertes `fitness()` | aus dem Bundle lesen. **Warnung:** die Physik existiert derzeit in **drei** Kopien (TS, Python, inline-JS) — mit der Umstellung sollte die inline-Kopie verschwinden, sonst driften sie auseinander. | S |

### 6.3 Ersatzlos entfallend

| Was | Warum |
|---|---|
| `engine/simulate.ts` — `runSimulation`, `stepGeneration` | Das Surrogat selbst. Aus dem Produktionspfad entfernen (Datei als Benchmark-Baseline aufheben, nicht mehr aufrufen). Zwei parallele Wahrheiten sind schlimmer als ein Umbau. |
| `EngineParams`: `responseRate[25]`, `mutationRate`, `selectionStrength`, `varianceWeight` | Es gibt keinen Mittelwert-Vektor mehr, der eine Antwortrate hätte. **Das ist die direkte Auflösung des Kapazitätsgrenzen-Befunds** — die drei globalen Zahlen werden nicht besser gefittet, sie hören auf zu existieren. |
| `fitted-params.json` | dito |
| `validityTrain` / `validityTest` / `trainMAE` / `testMAE` (71.6 %, Ziel 80–90 %) | Per-Gen-MAE auf einer Mittelwert-Trajektorie misst nichts mehr, wenn die Produktions-Engine der Referenz-Algorithmus ist. Ersetzt durch Verteilungs-Konvergenz in N. **Der Prozentbalken in der App braucht eine neue Bedeutung oder muss weg.** |
| `DRIFT_SCALE` + gesäter Drift-Hack in `simulate.ts` | Drift entsteht jetzt echt aus endlicher Populationsgröße — kein nachträglich aufaddiertes Rauschen mehr. |
| `mutationAnchor[25]` (0.5 für Kern-, 0.12 für bedingte Gene) | Der Anker war eine Korrektur für „Phantom-Unterhaltslast" im Mittelwert-Modell. In der Population regelt das die Selektion gegen `maintenance` selbst. **Vorsicht:** die bedingten Gene bleiben trotzdem nahezu neutral (gemessen sd ≈ 0.18) — das ist korrekt und wird auf der **Ausleseseite** durch die gewichtete Metrik behandelt, nicht durch Verbiegen der Dynamik. |

### 6.4 Empfohlene Reihenfolge (jede Stufe einzeln lauffähig und messbar)

| Stufe | Inhalt | Abnahme-Kriterium |
|---|---|---|
| **0** | Messskripte aus diesem Dokument als dauerhafte Regressionstests einchecken (`tools/`) | Baseline-Zahlen reproduzierbar |
| **1** | Gewichtete Cluster-Metrik in `world/cluster.ts` + `census.ts` | ≥ 1.3 Cluster/Lauf im Prototyp-Setup (heute 0.10) |
| **2** | Prototyp-Matcher + `archetypes.json`; `classify()` in der App ersetzen | Fell/Biolum-Fall korrekt; keine Identitätsklippe bei Δgen = 0.05 |
| **3** | Mehrdimensionaler Nischen-Kernel in `population.ts`; gestreute Gründer | ≥ 18 Formen über 11 Biome; Koexistenz in ≥ 5 Biomen |
| **4** | Live-App auf `world/` umstellen; `simulate.ts` aus dem Produktionspfad | Tick < 10 ms im Browser gemessen |
| **5** | Telemetrie-Erklärung (Selektionsdifferential) statt `causeFor()` | keine geratenen `env`-Schwellen mehr im Erklärpfad |
| **6** | Orakel-Prüfstand auf Verteilungsmetrik; `fitted-params.json` löschen | JS-Divergenz Browser-N=200 ↔ Orakel-N=2000 < 0.15 |
| **7** | *optional:* Koevolution + Metapopulation einschalten | Tick < 35 ms |

### 6.5 Eine Physik-Ergänzung, die der Umbau **nicht** ersetzt

Messung 3 ist unbequem und muss ausgesprochen werden: **„Insekt" wird auch nach dem Umbau
nicht erscheinen**, weil `engine/fitness.ts` keinen Term enthält, der lange Gliedmaßen an
einem winzigen Körper belohnt. Multi-Start über 2200 Läufe: 0.14 %. Der Prototyp-Lauf: 0 %.

Das ist ein **eigenständiger, kleiner Physik-Auftrag** (in der Bauart der bestehenden
AXIS-Achsen, ~15 Zeilen), kein Architekturproblem — etwa ein Term für *Klettern/Substrat-
Traktion* (Beinlänge relativ zur Körpermasse erschließt strukturiertes Substrat bei hoher
`foodHeight` an Land) oder für *Skalierungs-Ökonomie der Fortbewegung* (kleine Körper laufen
pro Masse billiger mit langen Gliedmaßen). Er sollte **nach** Stufe 3 kommen und mit der
Multi-Start-Messung abgenommen werden (Ziel: Insekt ≥ 2 % im Zufalls-Sweep). Ihn vorher zu
machen, hieße wieder Einzelfixes an der alten Architektur.

---

## 7. Was wir uns getraut haben zu verwerfen

### 7.1 Kandidat 1 — Gen-Regulationsnetzwerk mit Zell-Abstammungsbaum

**Der schmerzhafteste Verzicht.** Er ist der einzige Kandidat, der die *echte* biologische
Antwort auf „warum sieht ein Insekt aus wie ein Insekt" gibt: modulare Wiederverwendung
(„baue ein Bein" duplizieren → Segmentierung), Heterochronie als nativer Mutationskanal,
hoffnungsvolle Monster aus Netzwerk-Rückkopplung. Kein anderer Kandidat kann das.

**Warum er trotzdem verliert — drei unabhängige Gründe, jeder allein tödlich:**

1. **Der Phänotyp würde zur Fitness-Funktion nicht mehr passen.** `engine/fitness.ts` ist
   eine Funktion von 25 skalaren Merkmalen. Ein Zell-Abstammungsbaum liefert eine Zellmenge
   mit Gewebetypen. Dazwischen bräuchte man eine Ablese-Schicht Baum → 25 Skalare. Diese
   Schicht wäre eine **neue, unvalidierte, handgeschriebene Zuordnung** — also exakt dieselbe
   Bauform wie die Kaskade, die wir gerade abschaffen, nur größer und an einer Stelle, wo sie
   niemand mehr prüfen kann.
2. **Erklärbarkeit bricht zusammen.** „Dein Regler hat Gen 7 um 0.03 gesenkt, wodurch Zelle 44
   in der 6. Teilung in einen anderen Expressionszustand kippte und der ganze hintere
   Körperabschnitt entfiel" ist ein wahrer Satz und eine unbrauchbare Erklärung.
3. **Kosten.** Netzwerkdynamik-Simulation pro Individuum pro Generation, mal N=200: mindestens
   zwei Größenordnungen über den gemessenen 2 ms.

**Ehrlicher Nachsatz:** Es gibt einen Weg, ihn später zu bekommen — als reine
**Renderer-Schicht**. Ein Entwicklungsprozess, der aus dem fertigen 25-Gen-Vektor eine
*sichtbare* Morphologie wachsen lässt (`engine/development.ts` ist bereits die Vorstufe
davon). Nur eben keine Evolution auf Netzwerktopologie.

### 7.2 Kandidat 6 — Genomloses Replikator-Substrat (Tierra/Avida)

**Intellektuell der ehrlichste Kandidat der ganzen Liste.** Der einzige, der Open-Endedness
nicht behauptet, sondern historisch belegt hat.

**Warum er verliert — er löscht das Produkt:** Der Spieler steuert Temperatur, Prädationsdruck,
Nahrungshöhe. In einem Instruktions-Substrat gibt es **keine Temperatur**. Der Kern der
Spielerfahrung — die nachvollziehbare Kausalkette von meinem Regler zu einer erkennbaren
Lebensform — ist in diesem Paradigma nicht bloß schwer, sondern **prinzipiell nicht
konstruierbar**. Dazu kommt: Avida-Innovationen brauchen Millionen Updates, kein
Tamagotchi-Zeitrahmen. Und der gesamte Bestand (402 Zeilen auditierte Fitness-Physik, 19
AXIS-Achsen, Orakel, Benchmark-Suite) wäre restlos wertlos.

### 7.3 Kandidat 11 — Chronik-getriebene Divergenz (Narrative-first)

**Er beantwortet die falsche Frage — aber so gut, dass man es fast übersieht.** Ein
„Story-Score", der die Fitness überstimmen darf, macht die Beziehung zwischen Spielerhandlung
und Ergebnis verhandelbar — und genau diese Beziehung ist das Spiel. Er löst zudem **keines**
der beiden gemessenen Probleme (Kaskaden-Bug, Insekt-Unerreichbarkeit).

**Was wir stattdessen mitnehmen:** Erzählbarkeit als Kriterium wird im Gewinner-Modell
*erfüllt statt optimiert*: Speziation, Aussterben, Koexistenz, Founder-Effekte, Flaschenhälse,
Red-Queen-Wettrüsten und die Konfidenz-Anzeige bei Grenzformen sind allesamt von selbst
erzählbare Ereignisse, die aus der Dynamik fallen.

---

## Anhang: reproduzierbare Messungen

Die Messskripte lagen im Scratchpad des Forschungsagenten und sollten als Stufe 0 nach
`tools/` übernommen werden:

| Skript | misst | Kernzahl |
|---|---|---|
| `bench.mjs` | Durchsatz aller Bausteine | `fitness()` 341 ns; Schwarm N=200 2.0 ms/Gen |
| `optima.mjs` | Multi-Start-Bergsteigen, 200 Starts × 11 Biome | ~199/200 verschiedene Endpunkte → Landschaft in 15 D flach |
| `biome.mjs` | Formverteilung A/B/C über 13 reale Presets + Per-Gen-Varianz | Insekt 0 %; Σsd² bedingt 0.491 vs. Kern 0.271 |
| `reach.mjs` | Formverteilung über 400 Zufalls-Umwelten, 5 Regime | A 30 Formen / B 35 / C 31 / D+E kollabiert (Metrik-Bug) |
| `proto.mjs` | Nischen-Schwarm-Prototyp | 1.47 Cluster/Lauf, 20 Formen, 500 ms/250 Gen |
| `naming.mjs` | Kaskaden-Bug + Prototyp-Matcher | Fell/Biolum korrekt, Chimäre bei 1 % Konfidenz |

Die entscheidende Zahl für die Abnahme des Umbaus: **Cluster pro Lauf von 0.10 (heutige
Metrik, 25 Gene) auf ≥ 1.3** — alles andere folgt daraus.
