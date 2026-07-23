// Textausgabe-Formatierung - identisch nutzbar in Terminal (CLI) und Browser
// (Mockup). Das ist die "Optik" der Text-Demo.

import type { Environment, Physics, TraitVector } from "./types.js";
import { TRAITS } from "./types.js";
import type { SimResult } from "./simulate.js";
import { explainRun } from "./explain.js";
import { classify } from "./archetype.js";
import { develop, describeMorphology } from "./development.js";

export interface ValidityInfo {
  validityTest: number; // % auf zurueckgehaltenen Test-Szenarien
  validityTrain: number; // % auf Trainings-Szenarien
  targetLow: number; // Ziel-Band Untergrenze (z.B. 80)
  targetHigh: number; // Ziel-Band Obergrenze (z.B. 90)
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Ein horizontaler Balken 0..1 aus Bloecken, fuer Merkmalswerte. */
export function formatTraitBar(value: number, width = 20): string {
  const filled = Math.round(clamp01(value) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function envSummary(env: Environment): string {
  const t = env.temperature < 0.33 ? "kalt" : env.temperature > 0.66 ? "heiss" : "gemaessigt";
  const p = env.predation < 0.33 ? "wenig Raeuber" : env.predation > 0.66 ? "viele Raeuber" : "mittlerer Raeuberdruck";
  const f = env.foodAbundance < 0.33 ? "Nahrung knapp" : env.foodAbundance > 0.66 ? "Nahrung reichlich" : "Nahrung mittel";
  const h = env.foodHeight > 0.5 ? "hoch gelegen" : "am Boden";
  const l = env.light < 0.33 ? "dunkel" : env.light > 0.66 ? "sonnig" : "halbschattig";
  const w = env.water < 0.33 ? "trocken" : env.water > 0.66 ? "feucht" : "maessig feucht";
  return `${t}, ${p}, ${f}, ${h}, ${l}, ${w}`;
}

/**
 * Baut den kompletten Klartext-Bericht eines Laufs.
 * Reine Strings -> im Terminal und im <pre> des Browsers gleich verwendbar.
 */
export function formatRunReport(
  scenarioName: string,
  env: Environment,
  result: SimResult,
  phys: Physics,
  validity?: ValidityInfo,
): string {
  const lines: string[] = [];
  const gens = result.trajectory.length - 1;

  lines.push(`=== ${scenarioName} ===`);
  lines.push(`Umwelt: ${envSummary(env)}`);
  lines.push(
    `(Temp ${env.temperature.toFixed(2)} | Praed ${env.predation.toFixed(2)} | ` +
      `Nahrung ${env.foodAbundance.toFixed(2)} | Hoehe ${env.foodHeight.toFixed(2)} | ` +
      `Licht ${env.light.toFixed(2)} | Wasser ${env.water.toFixed(2)})`,
  );
  lines.push(`Simuliert: ${gens} Generationen`);
  lines.push("");

  const events = explainRun(result, env, phys);
  lines.push("--- Was sich entwickelt hat und warum ---");
  if (events.length === 0) {
    lines.push("Kaum Veraenderung - die Umwelt uebt keinen klaren gerichteten Druck aus.");
  } else {
    for (const e of events) {
      const arrow = e.delta > 0 ? "steigt" : "faellt";
      const nd = e.newlyDiscovered ? "  🆕 Erstmals ausgepraegt!" : "";
      lines.push(
        `- ${e.label}: ${arrow} ${e.from.toFixed(2)} -> ${e.to.toFixed(2)}${nd}`,
      );
      lines.push(`    Ursache: ${e.cause}.`);
    }
  }
  lines.push("");

  const arch = classify(result.final);
  const morph = develop(result.final);
  lines.push("--- Endzustand des Wesens ---");
  lines.push(`${arch.emoji}  ${arch.kingdom} — ${arch.name}`);
  lines.push(`Bauplan: ${describeMorphology(morph)}`);
  lines.push("");
  for (let g = 0; g < TRAITS.length; g++) {
    const label = (phys.traitLabels[TRAITS[g]] ?? TRAITS[g]).padEnd(22, " ");
    lines.push(`${label} ${formatTraitBar(result.final[g])} ${result.final[g].toFixed(2)}`);
  }
  lines.push("");

  if (validity) {
    lines.push(formatValidityBar(validity));
  }

  return lines.join("\n");
}

/** Der Validitaets-Indikator: wie nah ist die schlanke Engine am Orakel? */
export function formatValidityBar(v: ValidityInfo): string {
  const width = 30;
  const pct = clamp01(v.validityTest / 100);
  const filled = Math.round(pct * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const shown = Math.round(v.validityTest * 10) / 10;
  const inBand = shown >= v.targetLow && shown <= v.targetHigh;
  const above = shown > v.targetHigh;
  const lowerEdge = inBand && shown < v.targetLow + 1;
  let status: string;
  if (lowerEdge) status = "✅ im Ziel-Band (unteres Ende)";
  else if (inBand) status = "✅ im Ziel-Band";
  else if (above) status = "⚠️ ueber dem Band (evtl. zu nah am schweren Modell)";
  else status = "🔄 noch unter dem Ziel-Band - weiter trainieren";
  return (
    `--- Validitaet gegen Referenz-Orakel ---\n` +
    `[${bar}] ${v.validityTest.toFixed(1)}%  (Ziel ${v.targetLow}-${v.targetHigh}%)  ${status}\n` +
    `(Training: ${v.validityTrain.toFixed(1)}% | Test/zurueckgehalten: ${v.validityTest.toFixed(1)}%)`
  );
}
