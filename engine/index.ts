// Barrel: ein Einstiegspunkt fuer Browser-Mockup, CLI und Trainings-Schleife.
export * from "./types.js";
export { fitness } from "./fitness.js";
export { runSimulation } from "./simulate.js";
export type { SimResult } from "./simulate.js";
export { explainRun } from "./explain.js";
export type { ExplainEvent } from "./explain.js";
export {
  formatRunReport,
  formatTraitBar,
  type ValidityInfo,
} from "./report.js";
export { classify, type Archetype } from "./archetype.js";
export { develop, describeMorphology, type Morphology, type Appendage } from "./development.js";
