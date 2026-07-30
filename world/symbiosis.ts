// Biotische Interaktion (Lebendige-Welt-Roadmap Phase 5, Punkt 10): Symbiose/Parasitismus.
//
// world/coevolution.ts modelliert bereits EINE Form biotischer Abhaengigkeit:
// Raeuber-Beute (antagonistisch, treibt DIVERGENZ - Beute weicht aus, Raeuber folgt).
// Hier zwei weitere, strukturell andere Formen, beide ueber denselben Baustein
// (zwei Population-Instanzen + Merkmals-Passungs-Kernel), aber mit andersartiger
// Auszahlung:
//
//   MUTUALISMUS: beide Seiten gewinnen bei guter Passung (z. B. Bestaeuber-Bluete,
//   Mykorrhiza). Treibt KONVERGENZ statt Divergenz - die Merkmale beider Populationen
//   wandern aufeinander zu, weil Anpassung an den Partner sich fuer BEIDE auszahlt.
//   Echte wechselseitige Abhaengigkeit zeigt sich daran, dass OHNE Partner (oder bei
//   schlechter Passung) BEIDE Populationen schlechter dastehen, nicht nur eine.
//
//   PARASITISMUS: eine Seite (Parasit) gewinnt bei guter Passung, die andere (Wirt)
//   verliert dabei GENAU AN DERSELBEN Achse - anders als Praedation kein Fang-Risiko
//   (diskret, kostet Individuen), sondern ein kontinuierlicher Energie-Abzug (der Wirt
//   ueberlebt, ist aber geschwaecht). Das erlaubt einen echten Wirt-Parasit-Ruestungs-
//   wettlauf: der Wirt kann eine Abwehr-Achse hochfahren, die die Auszahlung des
//   Parasiten wieder senkt (hier vereinfacht: Wirt-Drift auf derselben Achse weg vom
//   Parasiten senkt den Match wie beim Raeuber-Beute-Modell).
//
// Reine Ergaenzung; beruehrt die Live-App NICHT. Nutzt die validierte Fitness.

import { Population } from "./population.js";
import type { PopulationConfig } from "./population.js";
import type { Environment, Physics } from "../engine/types.js";
import { fitness } from "../engine/fitness.js";

export type InteractionMode = "mutualism" | "parasitism";

export interface SymbiosisConfig {
  matchAxis: number; // Merkmals-Achse der Passung
  matchWidth: number; // Breite des Passungs-Kernels (kleiner = spezialisierter)
  benefitScale: number; // Auszahlung bei perfekter Passung: Mutualismus (beide) / Parasit (nur Parasit)
  hostDrainScale: number; // nur Parasitismus: Abzug beim Wirt bei perfekter Passung
  selPower: number;
}

export const DEFAULT_SYMBIOSIS: SymbiosisConfig = {
  matchAxis: 1,
  matchWidth: 0.15,
  benefitScale: 0.6,
  hostDrainScale: 0.5,
  selPower: 2.0,
};

export class Symbiosis {
  a: Population; // Mutualismus: Partner A. Parasitismus: Wirt.
  b: Population; // Mutualismus: Partner B. Parasitismus: Parasit.
  mode: InteractionMode;
  private env: Environment;
  private phys: Physics;
  private cfg: SymbiosisConfig;
  history: { aMean: number; bMean: number; matchQuality: number }[] = [];

  constructor(
    mode: InteractionMode,
    env: Environment,
    phys: Physics,
    popCfg: Partial<PopulationConfig>,
    symb: Partial<SymbiosisConfig> = {},
    seed = 1,
    // Start-Mittelwert je Population auf der Passungs-Achse (Default 0.5/0.5 = schon
    // deckungsgleich). Fuer einen Konvergenz-Test bewusst auseinanderlegen (z. B. 0.2/0.8),
    // damit sich eine Annaeherung ueberhaupt MESSEN laesst.
    aStart = 0.5,
    bStart = 0.5,
  ) {
    this.mode = mode;
    this.env = env;
    this.phys = phys;
    this.cfg = { ...DEFAULT_SYMBIOSIS, ...symb };
    this.a = new Population(popCfg, seed, aStart);
    this.b = new Population(popCfg, seed ^ 0x9e3779b9, bStart);
  }

  private axis(pop: Population): number[] {
    return pop.axisValues(this.cfg.matchAxis);
  }

  /** Passung eines einzelnen Werts gegen die GESAMTE Partner-Population (Kernel-Mittel). */
  private matchAgainst(x: number, partnerX: number[], inv2w2: number): number {
    let m = 0;
    for (const px of partnerX) {
      const d = x - px;
      m += Math.exp(-d * d * inv2w2);
    }
    return m / partnerX.length;
  }

  /**
   * Ein Interaktions-Schritt. `withPartner=false` simuliert Isolation (Partner entfernt)
   * - der Vergleich mit/ohne Partner ist der Beleg fuer echte wechselseitige Abhaengigkeit.
   */
  step(withPartner = true): void {
    const { matchWidth, benefitScale, hostDrainScale, selPower } = this.cfg;
    const inv2w2 = 1 / (2 * matchWidth * matchWidth);
    const aX = this.axis(this.a);
    const bX = this.axis(this.b);

    const aW = new Array<number>(this.a.size);
    const bW = new Array<number>(this.b.size);
    let matchAcc = 0;

    for (let i = 0; i < this.a.size; i++) {
      const m = withPartner ? this.matchAgainst(aX[i], bX, inv2w2) : 0;
      matchAcc += m / this.a.size;
      const base = Math.pow(fitness(this.a.genomes[i], this.env, this.phys), selPower);
      if (this.mode === "mutualism") {
        aW[i] = base * (1 + benefitScale * m);
      } else {
        // Parasitismus: der Wirt (a) verliert Energie proportional zur Passung des Parasiten.
        aW[i] = base * Math.max(0, 1 - hostDrainScale * m);
      }
    }
    for (let p = 0; p < this.b.size; p++) {
      const m = withPartner ? this.matchAgainst(bX[p], aX, inv2w2) : 0;
      const base = Math.pow(fitness(this.b.genomes[p], this.env, this.phys), selPower);
      // Beide Modi: b profitiert von Passung (Mutualismus-Partner bzw. Parasit).
      bW[p] = base * (1 + benefitScale * m);
    }

    this.a.reproduceWith(aW);
    this.b.reproduceWith(bW);

    this.history.push({ aMean: mean(aX), bMean: mean(bX), matchQuality: matchAcc });
  }

  aMeanAxis(): number {
    return mean(this.axis(this.a));
  }
  bMeanAxis(): number {
    return mean(this.axis(this.b));
  }
  /** Mittlere unskalierte Fitness der Population (Vitalitaets-Proxy, ohne Interaktions-Boost/-Abzug). */
  aBaseVitality(): number {
    return mean(this.a.genomes.map((g) => fitness(g, this.env, this.phys)));
  }
  bBaseVitality(): number {
    return mean(this.b.genomes.map((g) => fitness(g, this.env, this.phys)));
  }
}

function mean(a: number[]): number {
  return a.reduce((s, c) => s + c, 0) / a.length;
}
