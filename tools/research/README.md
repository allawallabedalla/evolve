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
- `archetype-derive.mjs` *(Stufe 2)* — leitet die Prototyp-Zahlen von `app/archetypes.js`
  mechanisch aus der alten Kaskade ab: welche Gene ein Zweig festlegt (Streuung über 4 Mio
  gleichverteilte Genome) und welchen Wert sie bekommen (Mischung aus geometrischer Mitte
  des Schwellen-Fensters und Mittelwert über erreichbare Genome). Nachrechen-Werkzeug für
  die Frage „woher kommt diese Zahl?" und Grundlage, um die Bibliothek nach einer
  Physik-Änderung neu abzuleiten. Die eingecheckte Bibliothek ist damit reproduzierbar.

> Hinweis: `classify.mjs` bildet weiterhin die **alte** Kaskade ab — die anderen Skripte
> messen damit bewusst den Ist-Zustand vor Stufe 2 (Vergleichsbasis). Die Live-App benennt
> seit Stufe 2 über `matchArchetype()` + `app/archetypes.js`.

Aufruf: `npm run build` zuerst (Skripte importieren aus `dist/`), dann z. B.
`node tools/research/bench.mjs`.
- `gap-sweep.mjs` — Lebensbaum-Lückenmessung: welche der 44 Formen von selbst entstehen,
  welche Gene hochlaufen ohne von einem Prototyp benannt zu werden, und wie stark die
  Selektion konkrete namenlose Nischen besetzt. Grundlage von `docs/lebensbaum-luecken.md`.
- `room-sweep.mjs` — misst, ob eine grobe Lebensraum-Ebene über den 6 Reglern trägt:
  Formprofil je Raum, Abdeckung des freien Regler-Würfels, und ob jedes der 12 Presets
  auf etwas konvergiert, das zu seinem Namen passt. Befund in
  `docs/lebensbaum-luecken.md` §7.
- `archetype-transition-check.mjs` — Regressions-Wächter für `app/archetypes.js`: vergleicht
  klassifizierte Namen vor/nach einer Änderung auf denselben Umwelten (gleiche RNG-Sequenz)
  und zeigt, welche Bestandsformen wie viel an neue/geänderte Prototypen verlieren. Ein Sweep
  auf der isolierten Nischen-Bedingung einer neuen Form sagt nur ihre Nischen-GRÖSSE voraus,
  nicht ihre Erreichbarkeit NACH Konkurrenz mit allen anderen Prototypen — das misst dieses
  Werkzeug. Aufruf: `node tools/research/archetype-transition-check.mjs [git-ref=HEAD] [N=4000]`.
