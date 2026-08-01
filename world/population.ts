// Populations-Kern (v2, Umbau — Stufe 1+2).
//
// Eine agentenbasierte Population, die auf der VALIDIERTEN Fitness-Landschaft
// (engine/fitness.ts, physics.json) evolviert — NICHT der Mean-Field-Mittelwert
// der Live-App, sondern der Schwarm selbst. Damit werden Koexistenz und
// evolutionaeres Branching darstellbar (der Mittelwert eines gespaltenen
// Schwarms laege im leeren Tal; siehe spike/FINDINGS.md).
//
// Dynamik = Spiegel des Python-Orakels (oracle/reference_model.py):
// fitness-proportionale Fortpflanzung + Rekombination + gaussche Mutation +
// endliche Population -> Drift. Optional frequenzabhaengige Konkurrenz.
//
// WICHTIG: Beruehrt die Live-App NICHT. Reines headless-Fundament.

import { fitness } from "../engine/fitness.js";
import type { Environment, Physics } from "../engine/types.js";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Seedbarer RNG (mulberry32) — identisch zu Engine/Orakel, fuer Reproduzierbarkeit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gauss-Zufall (Box-Muller) aus einem uniformen RNG. */
function makeRandn(rng: () => number): () => number {
  return () => {
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Frequenzabhaengige Konkurrenz ueber EINE ODER MEHRERE Merkmals-Achsen
 * (Ressourcen-/Nischen-Achsen). w_i wird geteilt durch die effektive Dichte
 * aehnlich gelegener Konkurrenten (euklidische Distanz UEBER ALLE `axes`) und
 * multipliziert mit der Ressourcen-Verfuegbarkeit K(x) (Gauss um kCenter, auch
 * ueber alle Achsen). Branching entsteht, wenn die Konkurrenz schmaler ist als
 * die Ressource (sigmaC < sigmaK). Dieckmann & Doebeli 1999; validiert in
 * spike/FINDINGS.md und tools/research/proto.mjs (8-Achsen-Kernel, Migrations-
 * Stufe 3, docs/engine-forschungsergebnis.md Abschnitt 3 B2).
 */
export interface CompetitionConfig {
  /**
   * Nischen-Achsen (Trait-Indizes), mehrdimensional — der Kernel misst die
   * euklidische Distanz ueber ALLE hier genannten Achsen gleichzeitig (nicht nur
   * eine). Ein-Achsen-Konkurrenz ist der Spezialfall `axes: [SIZE]` usw.
   */
  axes?: number[];
  /**
   * @deprecated Alt-Form aus der Ein-Achsen-Aera (vor Migrations-Stufe 3): eine
   * einzelne Achse, aequivalent zu `axes: [axis]`. Nur fuer Rueckwaertskompatibilitaet
   * bestehender Aufrufer (z.B. `world/phenomena.ts`, `tools/research/{bench,reach}.mjs`),
   * die bewusst unveraendert bleiben — neue Aufrufer sollten `axes` verwenden.
   */
  axis?: number;
  sigmaC: number; // Breite des Konkurrenz-Kernels
  sigmaK: number; // Breite der Ressourcen-Verteilung K(x) (Gauss um kCenter)
  kCenter: number; // Ressourcen-Gipfel (Default 0.5)
}

/** Loest `axes`/`axis` (Legacy) auf eine einheitliche Achsen-Liste auf. Leer = keine Achse konfiguriert. */
function competitionAxes(c: CompetitionConfig): number[] {
  if (c.axes && c.axes.length) return c.axes;
  if (typeof c.axis === "number") return [c.axis];
  return [];
}

/**
 * GRUENDER-LOS (Artenkatalog-Plan Phase 4, Schritt 4.1).
 *
 * Ein EINMAL beim Gruendungs-Ereignis gezogener, danach fest vererbter Versatz
 * je Gen — der Gruendereffekt (Mayr 1942). Er wirkt nur dort, wo die Selektion
 * flach ist; welche Gene das sind und wie weit dort gelost werden darf, wird
 * NICHT hier berechnet, sondern von aussen gemessen und uebergeben
 * (`world/founder.ts` -> `founderSpreads()`). Damit existiert die Logik der
 * Fitness-Ableitung genau einmal, und dieses Modul bleibt reine Dynamik.
 *
 * Warum "einmal" der ganze Punkt ist: ein je Generation neu gewuerfelter Versatz
 * waere nur zusaetzliches Rauschen, das die Selektion sofort wieder wegmittelt.
 * Ein einmal gezogener Versatz im Nullraum bleibt stehen — genau das macht aus
 * Zufall eine dauerhafte Verschiedenheit statt eines Wackelns.
 */
export interface FounderLotteryConfig {
  /**
   * Los-Radius je Gen. Gezogen wird gleichverteilt in [-spread, +spread] —
   * nicht gaussisch, damit der von `founderSpreads()` an den Raendern geprueft
   * neutrale Bereich den GANZEN Traeger der Ziehung abdeckt (Begruendung im
   * Kopf von world/founder.ts). Kuerzere Vektoren werden mit 0 aufgefuellt.
   */
  spread: number[];
}

/**
 * SPERRKLINKE / KANALISIERUNG (Artenkatalog-Plan Phase 4, Schritt 4.2).
 *
 * Ein Gen, das in dieser Linie LANGE nahe 0 oder 1 stand, bekommt eine kleinere
 * effektive Mutations-Schrittweite und ist damit schwerer zurueckzudriften.
 * Biologisch ist das Kanalisierung (Waddington 1942) bzw. die Mechanik hinter
 * Dollos Regel: ein tief eingefahrener Merkmalszustand wird mit der Zeit
 * entwicklungsbiologisch verriegelt und kommt nicht auf demselben Weg zurueck,
 * auf dem er erworben wurde.
 *
 * FORMEL (ein gleitendes Mittel, eine Schwelle, ein Boden — so einfach wie moeglich):
 *
 *   raw_g = min(1, 2*|x̄_g - 0.5|)                    Auslenkung, 0 = Mitte, 1 = Rand
 *   ext_g = clamp01((raw_g - onset) / (1 - onset))    erst ab `onset` zaehlt sie
 *   h_g  <- (1-memory)*h_g + memory*ext_g             Gedaechtnis der Linie
 *   sd_g  = mutationSd * (1 - (1-floor) * h_g^power)
 *
 * `h_g` ist der einzige neue Zustand je Linie (ein Vektor der Laenge numGenes)
 * und startet bei 0: die Sperrklinke muss verdient werden, ein frisch
 * gegruendeter Extremwert ist noch nicht verriegelt.
 *
 * WARUM EINE SCHWELLE (`onset`) UND NICHT EINFACH DIE AUSLENKUNG — GEMESSEN.
 * 15 der 25 Gene sind bedingte Kosten-Gene und ankern in einer Welt ohne ihren
 * Stressor bei ~0.12-0.16 ("standardmaessig aus", BACKLOG Punkt 12/Achsen-Arbeit).
 * Das ist ihr RUHEWERT, nicht ein eingefahrener Extremzustand. Ohne Schwelle
 * bekaemen genau diese Gene die staerkste Verriegelung, obwohl sie nichts
 * "erworben" haben — und weil sie zugleich die Hauptquelle der Driftvarianz sind,
 * SENKT das die Kontingenz statt sie zu stuetzen: gemessen faellt P6
 * (world/phenomena.ts contingency, 8 Seeds, 300 Gen.) von 0.0196 auf 0.0171.
 * Mit `onset = 0.8` greift die Klinke erst unter 0.10 bzw. ueber 0.90 — also
 * dort, wo ein Gen wirklich am Anschlag steht, und nicht schon in seiner Ruhelage.
 *
 * WARUM SIE NICHT GERICHTET IST (verworfene Bauform, mit Zahlen).
 * Naheliegend waere, den Weg ZURUECK ZUR MITTE staerker zu bremsen als den Weg
 * nach aussen — eine echte Klinke. Diese Variante wurde gebaut und gemessen und
 * ist VERWORFEN: sie hat kein brauchbares Arbeitsfenster. Unterhalb einer Bremse
 * von ~0.5 tut sie nichts (P6 bleibt bei 0.014-0.021, also im Rauschen von acht
 * Seeds); oberhalb kippt sie schlagartig um und ueberstimmt die Selektion
 * vollstaendig — bei Bremse 0.6/Gedaechtnis 0.1 steigt P6 auf 0.185, bei 0.8 auf
 * 1.29, bei 1.0 auf 2.13. Der letzte Wert liegt UEBER der Referenz "gar keine
 * Selektion" (NG/12 = 2.083, s. Begruendung des P6-Zielbands in phenomena.ts).
 * Ein gebremster Rueckweg bei freiem Hinweg ist eben keine Klinke, sondern eine
 * mutative Drift nach aussen — eine erfundene Kraft, die Gene gegen ihre
 * Unterhaltslast an den Anschlag druecken kann. Genau das darf ein reiner
 * Drift-Mechanismus nicht koennen. Die symmetrische Bauform kann es strukturell
 * nicht: sie macht Schritte nur KLEINER, verschiebt aber keinen Erwartungswert.
 *
 * WAS SIE IST UND WAS NICHT: kein Eingriff in die Fitness. Die symmetrische Form
 * macht Mutations-Schritte nur KLEINER und verschiebt keinen Erwartungswert — sie
 * kann eine Linie deshalb VERLANGSAMEN, aber nirgendwo HINBRINGEN, wo die
 * Selektion sie nicht ohnehin haette. Das ist keine Behauptung, sondern die
 * Abnahmebedingung D3 von `npm run founder-check`: nach vollstaendiger Entspannung
 * liegt die Ruhelage mit und ohne Klinke innerhalb der Messtoleranz gleich, waehrend
 * die RueckkehrZEIT messbar laenger ist. Deshalb haengt die Klinke am
 * Mechanismus-Schalter `drift`, nicht an der Selektion.
 */
export interface CanalizationConfig {
  /**
   * Traegheit des gleitenden Mittels je Generation (0..1). 0.05 entspricht einer
   * Halbwertszeit von ~14 Generationen — lang genug, dass eine einzelne
   * Zufalls-Auslenkung nichts verriegelt (ein Ausreisser einer Generation aendert
   * h um hoechstens 5 %), kurz genug, dass eine Linie innerhalb ihrer typischen
   * Lebensdauer (250-600 Generationen) einrasten kann.
   */
  memory: number;
  /**
   * Ab welcher Auslenkung (0..1, gemessen als 2*|x̄-0.5|) ueberhaupt verriegelt
   * wird. 0.8 = erst unter 0.10 bzw. ueber 0.90. Begruendung s. oben.
   */
  onset: number;
  /** Kleinste erreichbare Schrittweite als Bruchteil von `mutationSd` (0..1). */
  floor: number;
  /** Schaerfe der Verriegelungs-Kurve oberhalb von `onset`. */
  power: number;
}

/**
 * Begruendete Vorgaben — kalibriert und geprueft in `npm run founder-check`.
 * `floor: 0.15` ist der Arbeitspunkt aus der Dollo-Messung dort: er verlaengert
 * die Rueckkehrzeit eines gesaettigten Gens messbar (gemessen 27.0 -> 35.8
 * Generationen, +32 %), laesst der
 * Mutation aber ein Sechstel ihres Schritts, sodass die Selektion die Ruhelage
 * unveraendert erreicht.
 */
export const DEFAULT_CANALIZATION: CanalizationConfig = {
  memory: 0.05, onset: 0.8, floor: 0.15, power: 1,
};

export interface PopulationConfig {
  size: number; // Anzahl Agenten N
  numGenes: number; // Genom-Laenge
  mutationSd: number; // SD der gaussschen Mutation
  selPower: number; // Fitness^selPower (Selektions-Schaerfe)
  recombProb: number; // Rekombinations-Wahrscheinlichkeit je Gen
  startSpread: number; // Anfangsstreuung um den Startwert (nur bei founderSpread="gaussian")
  /**
   * Gruender-Verteilung bei freiem/unbesiedeltem Start (Migrations-Stufe 3):
   * "gaussian" (Default, unveraendertes Verhalten) streut eng um `start`
   * (Konstruktor-Parameter, Default 0.5) mit SD `startSpread`. "uniform" streut
   * jedes Gen jedes Individuums unabhaengig gleichverteilt in [0,1] — der
   * gestreute-Gruender-Trick aus tools/research/proto.mjs: kostet keine
   * Rechenzeit, oeffnet aber alle Einzugsgebiete gleichzeitig statt nur das um
   * `start`. Betrifft NUR den Konstruktor, NICHT `seedFrom()` (Spieler-Linie
   * besiedelt einen Ort bleibt bewusst eng gaussisch — siehe dort).
   */
  founderSpread: "uniform" | "gaussian";
  /**
   * Gruender-Los im Nullraum der Selektion (Schritt 4.1). `null` = aus, und dann
   * ist der ganze Pfad BIT-IDENTISCH zu vorher (es wird auch keine einzige
   * Zufallszahl zusaetzlich gezogen — wichtig, damit alle bestehenden
   * Prueffstaende und die Orakel-Paritaet unveraendert bleiben).
   */
  founderLottery: FounderLotteryConfig | null;
  /**
   * Sperrklinke/Kanalisierung (Schritt 4.2). `null` = aus, Mutation genau wie
   * vorher mit der skalaren `mutationSd`.
   */
  canalization: CanalizationConfig | null;
  competition: CompetitionConfig | null;
}

/** Defaults spiegeln das Orakel (ORACLE_POP/MUT_SD/SEL_POWER/RECOMB_PROB). */
export const DEFAULT_POP_CONFIG: PopulationConfig = {
  size: 300,
  numGenes: 25, // Hygiene: alle echten Aufrufer uebergeben ohnehin explizit 25 (phys.traits.length).
  mutationSd: 0.06,
  selPower: 2.0,
  recombProb: 0.5,
  startSpread: 0.03,
  founderSpread: "gaussian",
  founderLottery: null,
  canalization: null,
  competition: null,
};

export class Population {
  readonly cfg: PopulationConfig;
  genomes: number[][];
  /**
   * Das gezogene Gruender-Los (Schritt 4.1) — EINMAL im Konstruktor bestimmt und
   * danach unveraenderlich. Ohne `founderLottery` ein Nullvektor. Oeffentlich
   * lesbar, weil genau das die interessante Groesse ist: "was hat diese Linie
   * beim Gruenden zufaellig mitbekommen?" (`npm run founder-check` liest es).
   */
  readonly founderOffset: number[];
  /** Gedaechtnis der Sperrklinke je Gen (Schritt 4.2); leer, wenn nicht konfiguriert. */
  private canalHist: number[] = [];
  private rng: () => number;
  private randn: () => number;

  constructor(cfg: Partial<PopulationConfig>, seed: number, start = 0.5) {
    this.cfg = { ...DEFAULT_POP_CONFIG, ...cfg };
    this.rng = mulberry32(seed);
    this.randn = makeRandn(this.rng);
    const { size, numGenes, startSpread, founderSpread, founderLottery, canalization } = this.cfg;
    // Das Los ZUERST ziehen (Schritt 4.1): es gehoert zum Gruendungs-Ereignis,
    // nicht zu den Individuen. Ohne Konfiguration wird hier keine Zufallszahl
    // verbraucht — der Strom bleibt bit-identisch zum Verhalten vor Phase 4.
    this.founderOffset = new Array<number>(numGenes).fill(0);
    if (founderLottery) {
      for (let g = 0; g < numGenes; g++) {
        const s = founderLottery.spread[g] ?? 0;
        if (s > 0) this.founderOffset[g] = (this.rng() * 2 - 1) * s;
      }
    }
    if (canalization) this.canalHist = new Array<number>(numGenes).fill(0);
    const off = this.founderOffset;
    this.genomes =
      founderSpread === "uniform"
        ? // Gleichverteilte Gruender sind der GEGENBEGRIFF zum Gruendereffekt: jedes
          // Gen jedes Individuums ist unabhaengig gezogen, die Kohorte hat also gar
          // keinen gemeinsamen Zufalls-Ausgangspunkt, den ein Los verschieben
          // koennte (der Mittelwert liegt per Konstruktion bei 0.5 +- 1/sqrt(12N)).
          // Das Los wird hier deshalb bewusst NICHT angewandt, sondern erst dort,
          // wo es eine Gruender-Kohorte mit gemeinsamem Ausgangswert gibt:
          // gausssche Gruendung und `seedFrom()`.
          Array.from({ length: size }, () => Array.from({ length: numGenes }, () => this.rng()))
        : Array.from({ length: size }, () =>
            Array.from({ length: numGenes }, (_, g) =>
              clamp01(start + off[g] + this.randn() * startSpread),
            ),
          );
  }

  get size(): number {
    return this.genomes.length;
  }

  /**
   * Population aus EINEM konkreten Genom neu befüllen (mit kleiner Streuung) —
   * z. B. um einen Ort mit der Linie des Spielers zu besiedeln („dein Wesen als
   * Ort in der Welt"). Fehlende/überzählige Gene werden auf numGenes normiert.
   *
   * Das Gründer-Los (Schritt 4.1) wird hier MIT angewandt — eine Besiedlung IST
   * ein Gründungs-Ereignis. Gezogen wird es aber nicht neu: es ist das im
   * Konstruktor gezogene Los DIESER Linie, sonst wäre es kein Gründer-Effekt,
   * sondern ein Zufall pro Aufruf. Ohne `founderLottery` ist der Versatz exakt 0
   * und der Pfad bit-identisch zu vorher.
   */
  seedFrom(genome: number[], spread = this.cfg.startSpread): void {
    const { size, numGenes } = this.cfg;
    const off = this.founderOffset;
    const base = Array.from({ length: numGenes }, (_, k) => clamp01(genome[k] ?? 0.5));
    this.genomes = Array.from({ length: size }, () =>
      base.map((v, g) => clamp01(v + off[g] + this.randn() * spread)),
    );
  }

  /**
   * Reproduktions-Gewichte je Individuum (Fitness^selPower, optional /Konkurrenz).
   *
   * `envOf` (optional, Migrations-Stufe 7 / Koevolution) erlaubt eine INDIVIDUELLE
   * Umwelt je Individuum — genau das, was eine biotische Interaktion braucht: bei
   * Räuber-Beute-Koevolution hängt der erlebte Praedationsdruck davon ab, wie gut ein
   * Individuum ins aktuelle Beuteschema der Räuber passt, ist also KEIN globaler
   * Umwelt-Wert mehr (world/coevolution.ts rechnet dasselbe von Hand). Ohne `envOf`
   * ist das Verhalten bitgleich zu vorher; der Nischen-Konkurrenz-Kernel (K/Dichte)
   * bleibt in beiden Fällen unverändert und wird NICHT dupliziert.
   */
  weights(env: Environment, phys: Physics, envOf?: (i: number) => Environment): number[] {
    const { selPower, competition } = this.cfg;
    const base = this.genomes.map((g, i) =>
      Math.pow(fitness(g, envOf ? envOf(i) : env, phys), selPower),
    );
    if (!competition) return base;
    const axes = competitionAxes(competition);
    if (axes.length === 0) return base;
    const { sigmaC, sigmaK, kCenter } = competition;
    const G = this.genomes;
    const inv2c2 = 1 / (2 * sigmaC * sigmaC);
    const inv2k2 = 1 / (2 * sigmaK * sigmaK);
    const N = this.size;
    const w = new Array<number>(N);
    // Mehrdimensionaler Kernel (Migrations-Stufe 3): euklidische Distanz UEBER ALLE
    // `axes` gleichzeitig statt nur einer — reduziert bei axes.length===1 exakt auf
    // die alte Ein-Achsen-Formel (tools/research/proto.mjs B2).
    for (let i = 0; i < N; i++) {
      let n = 0;
      for (let j = 0; j < N; j++) {
        let d2 = 0;
        for (const a of axes) {
          const d = G[i][a] - G[j][a];
          d2 += d * d;
        }
        n += Math.exp(-d2 * inv2c2);
      }
      n /= N; // mittlere Konkurrenz-Dichte (0..1)
      let dk2 = 0;
      for (const a of axes) {
        const d = G[i][a] - kCenter;
        dk2 += d * d;
      }
      const K = Math.exp(-dk2 * inv2k2);
      w[i] = (base[i] * K) / (n + 1e-9);
    }
    return w;
  }

  /** Ein Individuum fitness-proportional ziehen (Roulette ueber kumulierte Gewichte). */
  private pick(cum: number[], total: number): number[] {
    const r = this.rng() * total;
    // binaere Suche
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return this.genomes[lo];
  }

  /** Eine Generation weiter: Selektion + Rekombination + Mutation. */
  step(env: Environment, phys: Physics): void {
    this.reproduceWith(this.weights(env, phys));
  }

  /**
   * Reproduktion mit EXTERN berechneten Gewichten — erlaubt biotische
   * Interaktionen (Praedation, Konkurrenz zwischen Populationen), deren Fitness
   * nicht allein aus der fixen Landschaft kommt (Stufe 5, world/coevolution.ts).
   */
  reproduceWith(w: number[]): void {
    const N = this.size;
    // kumulierte Gewichte
    const cum = new Array<number>(N);
    let total = 0;
    for (let i = 0; i < N; i++) {
      total += w[i];
      cum[i] = total;
    }
    const next: number[][] = new Array(N);
    const { numGenes, recombProb, mutationSd } = this.cfg;
    // Sperrklinke (Schritt 4.2): gen- UND linien-spezifische Schrittweite.
    // `null` -> `sd` bleibt null und der Rumpf unten rechnet exakt wie vor
    // Phase 4 (skalares mutationSd, gleiche Zufallszahlen in gleicher Reihenfolge).
    const sd = this.cfg.canalization ? this.canalStep() : null;
    for (let k = 0; k < N; k++) {
      const pa = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
      const pb = total > 0 ? this.pick(cum, total) : this.genomes[(this.rng() * N) | 0];
      const child = new Array<number>(numGenes);
      for (let g = 0; g < numGenes; g++) {
        const base = this.rng() < recombProb ? pb[g] : pa[g];
        child[g] = clamp01(base + this.randn() * (sd ? sd[g] : mutationSd));
      }
      next[k] = child;
    }
    this.genomes = next;
  }

  /**
   * Sperrklinke fortschreiben und die effektive Schrittweite je Gen liefern
   * (Schritt 4.2, Formel und Begruendung s. `CanalizationConfig`). Laeuft einmal
   * je Generation, Kosten O(N*G) — gegen den O(N^2)-Konkurrenz-Kernel, der in
   * derselben Generation laeuft, nicht messbar.
   */
  private canalStep(): number[] {
    const c = this.cfg.canalization!;
    const { numGenes, mutationSd } = this.cfg;
    const m = this.mean();
    const sd = new Array<number>(numGenes);
    for (let g = 0; g < numGenes; g++) {
      const raw = Math.min(1, 2 * Math.abs(m[g] - 0.5));
      const ext = clamp01((raw - c.onset) / (1 - c.onset));
      const h = (1 - c.memory) * (this.canalHist[g] ?? 0) + c.memory * ext;
      this.canalHist[g] = h;
      sd[g] = mutationSd * (1 - (1 - c.floor) * Math.pow(h, c.power));
    }
    return sd;
  }

  /**
   * Verriegelungsgrad je Gen (0 = frei beweglich wie vor Phase 4, 1 = maximal
   * kanalisiert). Nur zum Messen/Erklaeren — `npm run founder-check` liest das.
   */
  canalLock(): number[] {
    const c = this.cfg.canalization;
    if (!c) return new Array<number>(this.cfg.numGenes).fill(0);
    return this.canalHist.map((h) => Math.pow(h, c.power));
  }

  /** Mittleres Genom (nur sinnvoll bei unimodaler Population). */
  mean(): number[] {
    const N = this.size;
    const G = this.cfg.numGenes;
    const m = new Array<number>(G).fill(0);
    for (const ind of this.genomes) for (let g = 0; g < G; g++) m[g] += ind[g];
    return m.map((s) => s / N);
  }

  /** Werte einer Achse (fuer Cluster-Analyse). */
  axisValues(axis: number): number[] {
    return this.genomes.map((g) => g[axis]);
  }
}
