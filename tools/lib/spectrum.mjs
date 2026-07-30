// Verteilungs-Vergleich zweier Schwaerme (Migrations-Stufe 6, BACKLOG.md Punkt 2 /
// docs/engine-forschungsergebnis.md Abschnitt "Ist das Zwei-Motoren-Prinzip noch richtig?").
//
// Das hier ist die MESS-MATHEMATIK des neuen Orakel-Pruefstands, bewusst getrennt von
// tools/spectrum-check.mjs (dem Pruefstand selbst), damit sie einzeln nachvollziehbar und
// wiederverwendbar bleibt. Kein Zufall, keine Simulation — reine Funktionen.
//
// Drei Kennzahlen, exakt die aus dem Forschungsdokument:
//   1. Jensen-Shannon-Divergenz ueber die FORMHAEUFIGKEITEN (Hauptmass)
//   2. Abweichung der mittleren Clusterzahl
//   3. Rangkorrelation der Raritaet (Spearman ueber die Formhaeufigkeiten)

/** Label fuer eine Form, die der Matcher NICHT benannt hat (`novel:true`).
 *  BEGRUENDUNG, warum alle Neuformen in EINEN Eimer fallen: `generateFormName()`
 *  baut Namen kombinatorisch aus den zwei staerksten Abweichungen ("Gepanzerter
 *  Leuchtschwimmer"). Als eigene Kategorien gezaehlt zersplittern sie das Spektrum in
 *  viele Einzelfaelle, die auf beiden Seiten fast nie denselben String ergeben — die
 *  JS-Divergenz waere dann per Konstruktion hoch und wuerde Namens-Kombinatorik statt
 *  Verteilungs-Unterschied messen. Der Anteil dieses Eimers wird separat berichtet. */
export const NOVEL_LABEL = "· Neuform (unbenannt)";

/**
 * Formhaeufigkeits-Spektrum EINES Laufs: klassifiziert JEDES Individuum der
 * End-Population und gibt Anteile (Summe 1) zurueck.
 *
 * Warum je Individuum und nicht je Cluster-Zentroid: ein Lauf liefert nur 1-3 Cluster,
 * ueber 55 Laeufe also ~80 Beobachtungen auf ~20 Formen — die Stichprobe waere so duenn,
 * dass die JS-Divergenz von Zaehlrauschen dominiert wuerde und nicht vom gemessenen
 * Unterschied (in dieser Session gemessen, s. tools/spectrum-check.mjs Kopf). Die
 * Individuen-Ebene nutzt die volle Population — genau der Punkt dieser Migrations-Stufe:
 * der Zustand IST eine Verteilung, kein Punkt. Die Clusterzahl wird als eigene, zweite
 * Kennzahl verglichen (s. clusterCountDelta unten), nicht ins Spektrum gemischt.
 */
export function spectrumOfRun(genomes, env, classify) {
  const counts = new Map();
  for (const g of genomes) {
    const a = classify(g, env);
    const label = a.novel ? NOVEL_LABEL : a.n;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const n = genomes.length || 1;
  const out = new Map();
  for (const [k, c] of counts) out.set(k, c / n);
  return out;
}

/**
 * Pooled-Spektrum ueber mehrere Laeufe: MITTELWERT der Pro-Lauf-Spektren, d. h. jeder
 * Lauf (Biom x Seed) zaehlt gleich viel — unabhaengig von N. Genau das macht die
 * Spektren von Browser (N=200) und Orakel (N gross) ueberhaupt vergleichbar: sonst
 * haette die Seite mit dem groesseren N automatisch mehr Gewicht in der Summe.
 */
export function poolSpectra(spectra) {
  const out = new Map();
  if (!spectra.length) return out;
  for (const s of spectra) for (const [k, v] of s) out.set(k, (out.get(k) ?? 0) + v / spectra.length);
  return out;
}

/** Alle Labels beider Spektren, stabil sortiert (absteigende Gesamthaeufigkeit). */
export function unionLabels(p, q) {
  const keys = new Set([...p.keys(), ...q.keys()]);
  return [...keys].sort((a, b) => ((q.get(b) ?? 0) + (p.get(b) ?? 0)) - ((q.get(a) ?? 0) + (p.get(a) ?? 0)));
}

/**
 * Jensen-Shannon-Divergenz. Standardformel JSD(P,Q) = 0.5*KL(P||M) + 0.5*KL(Q||M) mit
 * M = (P+Q)/2.
 *
 * BASIS 2 (bewusste Wahl, dokumentiert): damit liegt JSD in [0,1] — 0 = identische
 * Verteilungen, 1 = disjunkte Traeger. Nur mit dieser Normierung ist die Zielschwelle
 * "< 0.15" aus der Migrationsplan-Tabelle als "15 % des maximal moeglichen Unterschieds"
 * lesbar; mit natuerlichem Logarithmus laege das Maximum bei ln2 = 0.693 und 0.15
 * bedeutete stillschweigend 21.6 %. Beide Basen sind in der Literatur ueblich, deshalb
 * steht die Wahl hier explizit.
 */
export function jsDivergence(p, q) {
  let sum = 0;
  for (const k of new Set([...p.keys(), ...q.keys()])) {
    const pv = p.get(k) ?? 0;
    const qv = q.get(k) ?? 0;
    const m = 0.5 * (pv + qv);
    if (pv > 0) sum += 0.5 * pv * Math.log2(pv / m);
    if (qv > 0) sum += 0.5 * qv * Math.log2(qv / m);
  }
  // Numerisches Rauschen kann minimal negativ/ueber 1 laufen.
  return sum < 0 ? 0 : sum > 1 ? 1 : sum;
}

/** Mittelwert einer Zahlenliste (leere Liste -> 0). */
export function mean(xs) {
  return xs.length ? xs.reduce((a, c) => a + c, 0) / xs.length : 0;
}

/**
 * Rangkorrelation der Raritaet (Spearman) ueber die Formhaeufigkeiten der VEREINIGUNG
 * beider Spektren. "Raritaet" ist hier die Haeufigkeit selbst: stimmen beide Seiten
 * darin ueberein, WELCHE Formen haeufig und welche selten sind? Fehlende Formen zaehlen
 * als Haeufigkeit 0 (sie sind auf dieser Seite maximal selten) — Bindungen bekommen
 * mittlere Raenge, sonst wuerden die vielen Nullen die Korrelation kuenstlich aufblasen.
 */
export function spearman(p, q) {
  const labels = unionLabels(p, q);
  if (labels.length < 3) return NaN;
  const rank = (vals) => {
    const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(vals.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const a = rank(labels.map((l) => p.get(l) ?? 0));
  const b = rank(labels.map((l) => q.get(l) ?? 0));
  const ma = mean(a);
  const mb = mean(b);
  let sab = 0, sa = 0, sb = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    sab += da * db; sa += da * da; sb += db * db;
  }
  return sa > 0 && sb > 0 ? sab / Math.sqrt(sa * sb) : NaN;
}

/** Absolute Abweichung der mittleren Clusterzahl (Kennzahl 2 aus dem Forschungsdokument). */
export function clusterCountDelta(clustersA, clustersB) {
  return Math.abs(mean(clustersA) - mean(clustersB));
}
