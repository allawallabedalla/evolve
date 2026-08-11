# Baseline — vor der Photosynthese-Wasserkopplung (Backlog Punkt 14, Stufe 0)

**Stand:** 2026-08-10, unmittelbar vor jedem Eingriff an `engine/fitness.ts`/`physics.json`.
**Zweck:** jede Kennzahl hier ist der Ist-Wert VOR dem Umbau — Stufe 5 vergleicht direkt
dagegen. Build sauber (`tsc`, 0 Fehler) unmittelbar vor diesem Lauf.

## 1 · Pflicht-Gates

Alle mit `npm run build && ...` frisch gebaut, in einem Rutsch durchlaufen.

| Gate | Ergebnis | Kennzahl |
|---|---|---|
| `parity` | ✅ OK | Engine ↔ Orakel exakt |
| `app-parity` | ✅ OK | App-Inline ↔ Engine, Max-Δ = 0.000e+0 |
| `ecology` | ✅ OK | Tier 52.9 % · Pilz 21.0 % · Mikrobe 14.3 % · Protist 8.5 % · **Pflanze 3.3 %** |
| `ecology-full` (25-Gen-Voll-Modell) | ✅ OK | Tier 43.1 % · Mikrobe 28.8 % · Protist 14.0 % · Pilz 11.0 % · **Pflanze 3.2 %** |
| `reality` | ✅ OK | 21/21 Regeln |
| `mf-fidelity` | ✅ OK | — |
| `pop-check` | ✅ OK | — |
| `branching-check` | ✅ OK | — |
| `world-check` | ✅ OK | — |
| `coevolution-check` | ✅ OK | Red Queen **6.5×** (Kontroll-Schwelle 2.5×) — **Referenzwert für Stufe 3, Schritt 1** |
| `symbiosis-check` | ✅ OK | Mutualismus + Parasitismus beide OK |
| `seasonal-check` | ✅ OK | — |
| `lifehistory-check` | ✅ OK | — |
| `phenomena-check` | ✅ OK | 8/8 (P1–P6, P8) |
| `founder-check` | ✅ OK | — |
| `distribution-check` | ✅ OK | B1–B4 alle OK |
| `census-check` | ❌ **FAIL** | **Vorbestehender, unabhängiger Bug — s. Abschnitt 3** |
| `seed-check` | ✅ OK | — |
| `rarity-check` | ✅ OK | — |
| `app-fitness-check` | ✅ OK | — |
| `app-world-smoke` | ✅ OK | — |
| `exemplar-check` | ✅ OK | 65/65 Archetypen mit Vorbild |
| `key-check` | ✅ OK | 65 Formen, 65 Äste |
| `plausi-check` | ✅ OK | — |
| `story-check` | ✅ OK | — |
| `influence-check` | ✅ OK | — |
| `ui-calm-check` | ✅ OK | — |
| `catalog-check` | ✅ OK | — |
| `design-audit` | ✅ OK | 0 Kontrastverstöße |
| `pattern-continuity-check` | ✅ OK | — |

`layer-import-check`/`story-import-check`/`plain-import-check`/`gene-import-check`/
`challenge-import-check` sind **keine bar aufrufbaren Gates** (brauchen ein
Datei-Argument, Aufruf ohne Argument gibt korrekt "exit 2" mit Usage-Hinweis) — nicht
Teil dieser Baseline.

**Ergebnis: 30/31 Pflicht-Gates grün, 1 Fund (census-check, vorbestehend, unabhängig).**

## 2 · Diagnose-Tools (kein Gate, Referenzmessung)

- `npm run coverage-check` (voll, nicht `--quick`): **56/65 Bauplan-Gruppen erreicht**
  (davon 35 mit realen Arten), 40.243/42.648 Arten in erreichten Gruppen (94,36 %),
  377/42.648 an einem tatsächlich erreichten Genom-Punkt (0,88 %). Bestätigt eigenständig:
  `docs/rarity.json` kennt 22 der heute 65 Formen nicht (Schicht-A-Übereinstimmung nur
  32/43 bei den bekannten Formen).
- `node tools/research/random-diversity-sweep.mjs --n=1000 --seed=1`
  (`docs/random-diversity-sweep.json`, bereits committed): 1000 Zufalls-Umwelten →
  1515 Endpunkte, **47/65 Bauplan-Gruppen**, 296 reale Artnamen, 0 % jenseits
  novelThreshold. Reich-Verteilung: Tier 46,7 % · Pilz 21,8 % · Protist 14,8 % ·
  Mikrobe 11,7 % · **Pflanze 5,0 %**.
- `node tools/research/plant-gap.mjs --n=300 --seed=1` (`docs/plant-gap.json`, bereits
  committed): Pflanzen-Strategie gewinnt **14/300 (4,7 %)** der Zufalls-Umwelten.
  Land-Band (water 0.02–0.35): **3 % Gewinnquote** (Fitness 0.226 vs 0.538). Wasser-Band
  (0.65–1.00): **11 %** (0.286 vs 0.571). Korrelation Fitness-Abstand↔`foodAbundance`:
  r = −0.796.

**Drei unabhängige Methoden (mean-field-Gitter in `ecology-check`, Vollsweep in
`coverage-check`, echter Schwarm in `random-diversity-sweep`) finden dieselbe Größenordnung:
Pflanzen liegen bei 3–5 %.** Das ist der Zielkorridor, den Stufe 1 anheben soll (Plan: 12–20 %).

## 3 · Nebenfund — `census-check` scheitert, unabhängig von Punkt 14

`node tools/census-check.mjs` liefert reproduzierbar (3× bestätigt) `Status: FAIL` — sowohl die
isolierte als auch die verbundene Welt liefern **0 Arten**.

**Ursache gefunden:** `world/physics-v2.json` (separate, ältere Physik-Kopie für
`world/world.ts`/`world/census.ts`, NICHT die produktive `physics.json`) fehlen fünf Schlüssel,
die `engine/fitness.ts` ungeschützt (ohne `?? default`) liest: `amphibiousYield`,
`amphibiousWaterCenter`, `amphibiousBandWidth`, `amphibiousLimbOpt`, `amphibiousLimbWidth`.
`phys.amphibiousWaterCenter` ist dadurch `undefined`, `env.water - undefined = NaN`, und das
propagiert durch die gesamte `fitness()`-Berechnung — bestätigt direkt: `fitness(genom, env,
physics-v2.json)` liefert `NaN` für JEDES Genom/JEDE Umwelt, `fitness(genom, env, physics.json)`
liefert einen normalen Wert. Betrifft nachweislich nur `census-check` — `rarity-check` und
`seed-check` nutzen `physics-v2.json` auf einem Pfad, der diesen Wert nicht bricht.

**Nicht behoben, bewusst dokumentiert statt kaschiert:** kein Bezug zur
Photosynthese-Wasserkopplung, eigener, separater Backlog-Punkt bei Bedarf.

## 4 · Orakel-Cache

`npm run oracle-swarm` frisch erzeugt (`.swarm-oracle.json`, 24.220.652 Bytes, gitignored) —
11 Biom-Presets × 5 Läufe, N=2000, 250 Generationen, 3 Python-Worker.

**JSD (Browser N=200 ↔ Orakel N=2000): 0.0960** (Ziel < 0.15, besteht). Score_C
(`training/fidelity-config.ts`) = 0,9040 (Mindestschwelle 0,85, besteht).

⚠️ **Deutlich höher als der zuletzt dokumentierte Wert (0,0218, Migrations-Stufe 6,
2026-07-30).** Kein Fehler — seither kamen mehrere Physik-Änderungen dazu (u. a. AXIS-25
Krautiger Wuchs, Habitat-Filter, Landgang-Verkabelung auf 0), die den Wert nie neu vermessen
haben. **Das ist der ehrliche Vergleichswert für Stufe 3**, nicht 0,0218 — ein Vergleich gegen
den alten Wert wäre unfair (er misst einen anderen Physik-Stand). Mittlere Clusterzahl:
Browser 1,31 · Orakel 1,60. Rangkorrelation Rarität (Spearman): 0,579.

## 5 · Reihenfolge ab hier

Stufe 1 (Formel + Parameter, neutral zuerst) kann beginnen. `.swarm-oracle.json` bleibt lokal
liegen (gitignored) bis Stufe 3 den Vergleich braucht — nicht committen, ~24 MB.
