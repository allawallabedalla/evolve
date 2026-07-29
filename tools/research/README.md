# Forschungs-Messskripte (Punkt 2, Migrations-Stufe 0)

Diese Skripte sind die reproduzierbaren Messungen hinter
`docs/engine-forschungsergebnis.md`. Sie sind **keine Pass/Fail-Gates** (kein
`process.exit(1)`, keine Zielbänder) — sie sind Referenz-/Regressionsmessungen, die bei
jeder späteren Migrations-Stufe (s. BACKLOG.md Punkt 2) erneut gelaufen werden sollten, um zu
prüfen, ob sich die Kernzahlen (Cluster/Lauf, Formenvielfalt, Performance) wie erwartet
bewegen.

- `classify.mjs` — eigenständige Kopie der `app/index.html`-Namens-Kaskade für Node-Skripte
  ohne Browser/DOM (nur lesend genutzt, kein Ersatz für die echte App-Funktion).
- `bench.mjs` — Durchsatz/Performance: `fitness()`, `Population.step()` (mit/ohne
  Konkurrenz-Kernel), `clusters()`, Status-quo-`stepGeneration()`.
- `optima.mjs` — Multi-Start-Bergsteigen je Biom: wie viele lokale Optima hat die
  Fitness-Landschaft wirklich (Landschafts-Reichtum vs. Rauschen in den bedingten Genen)?
- `biome.mjs` — Formverteilung über die 13 realen Biom-Presets, drei Regime (Mean-Field
  deterministisch / mit Drift / Agentenpopulation), plus Per-Gen-Varianz-Zerlegung.
- `reach.mjs` — Formverteilung über Zufalls-Umwelten, fünf Regime (A-E, inkl. Konkurrenz +
  Metapopulation).
- `proto.mjs` — Prototyp des empfohlenen Nischen-Schwarms (gestreute Gründer + mehrdimensionaler
  Konkurrenz-Kernel + selektions-gewichtete Cluster-Metrik).
- `naming.mjs` — reproduziert den gemeldeten Kaskaden-Bug (Fell+Biolumineszenz) und
  demonstriert den Prototyp-Matcher als Ersatz.

Aufruf: `npm run build` zuerst (Skripte importieren aus `dist/`), dann z. B.
`node tools/research/bench.mjs`.
