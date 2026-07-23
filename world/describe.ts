// Prozedurale, EMERGENZ-abgeleitete Art-Beschreibung.
//
// Keine handgeschriebene Formen-Tabelle (classify-Kaskade) — der Name entsteht
// direkt aus dem Genom: Reich aus der Photo×Mobilitäts-Achse, dann die
// hervorstechenden Merkmale. Erster Baustein von Stufe 5 (emergente Benennung).
// Damit misst/zeigt der v2-Kern Arten ohne v1-Autorenschaft.

const AXES: { idx: number; hi: string; lo?: string; hiT: number; loT?: number }[] = [
  { idx: 1, hi: "groß", lo: "winzig", hiT: 0.62, loT: 0.22 },
  { idx: 4, hi: "gepanzert", hiT: 0.55 },
  { idx: 0, hi: "isoliert", hiT: 0.6 },
  { idx: 8, hi: "geflügelt", hiT: 0.5 },
  { idx: 7, hi: "verholzt", hiT: 0.62 },
  { idx: 3, hi: "hochaktiv", lo: "träge", hiT: 0.72, loT: 0.18 },
  { idx: 2, hi: "gliedmaßenreich", hiT: 0.66 },
  { idx: 9, hi: "grabend", hiT: 0.55 },
];

export function kingdomOf(g: number[]): string {
  const size = g[1],
    photo = g[5],
    mob = g[6];
  if (photo > 0.45 && mob < 0.4) return "Pflanze";
  if (mob > 0.45 && photo < 0.4) return "Tier";
  if (photo < 0.45 && mob < 0.4) return size < 0.18 ? "Mikrobe" : "Pilz";
  return "Protist";
}

/** Kurz-Etikett: Reich + bis zu 3 hervorstechende Merkmale (aus dem Genom). */
export function describe(g: number[]): string {
  const traits: string[] = [];
  for (const a of AXES) {
    const v = g[a.idx] ?? 0.5;
    if (v >= a.hiT) traits.push(a.hi);
    else if (a.lo && a.loT !== undefined && v <= a.loT) traits.push(a.lo);
  }
  const desc = traits.length ? traits.slice(0, 3).join(", ") : "generalistisch";
  return `${kingdomOf(g)} · ${desc}`;
}

/** Grob-Schlüssel für „ist das dieselbe Art?" — Reich + Merkmals-Signatur. */
export function formKey(g: number[]): string {
  const traits: string[] = [];
  for (const a of AXES) {
    const v = g[a.idx] ?? 0.5;
    if (v >= a.hiT) traits.push(a.hi);
    else if (a.lo && a.loT !== undefined && v <= a.loT) traits.push(a.lo);
  }
  return kingdomOf(g) + "|" + traits.sort().join(",");
}
