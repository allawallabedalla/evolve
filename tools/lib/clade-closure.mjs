// KLADEN-AUFLOESUNG AUS DEM KATALOG SELBST — ohne Netz, ohne Ernte.
//
// WOZU. `app/catalog.js` speichert die Elterntaxon-Kette GEKUERZT
// (`tools/build-catalog.mjs`: `p.v.lineage.slice(0, 12)`, begruendet mit CORPUS_DEPTH).
// Bei tief verschachtelten Taxa faellt die Klassen-QID damit aus dem Feld: der
// Maeusebussard traegt Q5113 (Aves) drei Ebenen ueber dem letzten gespeicherten Knoten.
// Ein direktes `lineage.includes(qid)` sieht deshalb nur einen Bruchteil der gemeinten
// Menge — gemessen bei Insekten 3 %, s. plausi-check P10.
//
// WIE. Jede der 42.648 Ketten ist ein Stueck DESSELBEN Baums, und flacher verschachtelte
// Arten enthalten genau die Knoten, die den tieferen abgeschnitten wurden. Die
// Vereinigung aller Ketten ergibt einen Elterngraphen, aus dem sich die fehlenden Ebenen
// rekonstruieren lassen.
//
// WARUM NICHT DIE BLINDE TRANSITIVE HUELLE. Wikidatas P171 ist nicht funktional — ein
// Taxon kann mehrere Elterntaxa haben (konkurrierende Backbones, s. tools/lib/lineage.mjs
// und der Kommentar in clade-rules.mjs Z. 40: "Q1390 Insecta haengt dort UNTER Q25364
// Crustacea"). Wer einfach ALLE Vorfahren einsammelt, faengt sich diese Querverbindungen
// ein. Gemessen an genau diesem Katalog: eine blinde Huelle ordnet 8.140 Eintraege
// (19 %) zwei einander ausschliessenden Klassen zu — saemtliche Insekten, Weichtiere
// und Spinnentiere landen zusaetzlich unter Q25522 (Annelida).
//
// Die Loesung ist die NAECHSTE Klasse statt irgendeiner: Breitensuche vom Taxon aus, und
// die erste Ebene, auf der ueberhaupt eine Zielklade auftaucht, gewinnt. Der echte
// Vorfahr steht naeher als die Querverbindung. Gemessen an diesem Katalog: 0 Konflikte
// (mehrere Zielkladen auf DERSELBEN Ebene), Annelida faellt von 8.140 auf die 137
// echten Ringelwuermer, alle uebrigen Klassenzahlen bleiben unveraendert.
//
// `conflicts()` meldet, wenn doch einmal zwei Zielkladen auf derselben Ebene liegen —
// dann stimmt die Annahme nicht mehr und der Aufrufer soll das sehen, statt still eine
// der beiden zu nehmen.

/** Klassen-Ebene, an der ein Bauplan haengt. QIDs wie in tools/lib/clade-rules.mjs
 *  (dort gegen Wikidata geprueft, s. dessen Kopfkommentar "HERKUNFT DER QIDs").
 *
 *  `beine` = biologisch feste Beinzahl der Klade; -1 = kein Tier (Beinzahl sinnlos).
 *
 *  `rang` = SPEZIFITAET, nicht Rangfolge im Sinne von Prioritaet: 1 = Klasse (Aves,
 *  Insecta), 2 = Stamm/Abteilung (Mollusca, Farne), 3 = Reich (Plantae, Fungi). Sie
 *  wird gebraucht, weil manche Ketten MEHRERE Zielkladen auf derselben Ebene fuehren —
 *  ein Farn traegt Q373615 (Farne) UND Q756 (Pflanzen) in seinen 12 gespeicherten
 *  Knoten. Das ist kein Widerspruch, sondern Verschachtelung: die speziellere gewinnt.
 *  Ein echter Konflikt ist erst, wenn zwei Kladen DESSELBEN Rangs zusammentreffen —
 *  genau das zaehlt conflicts(). */
export const KLASSEN = [
  { qid: "Q5113",   de: "Voegel",         beine: 2,  rang: 1 },
  { qid: "Q7377",   de: "Saeuger",        beine: 4,  rang: 1 },
  { qid: "Q10811",  de: "Reptilien",      beine: 4,  rang: 1 },
  { qid: "Q10908",  de: "Amphibien",      beine: 4,  rang: 1 },
  { qid: "Q127282", de: "Knochenfische",  beine: 0,  rang: 1 },
  { qid: "Q129026", de: "Knorpelfische",  beine: 0,  rang: 1 },
  { qid: "Q1390",   de: "Insekten",       beine: 6,  rang: 1 },
  { qid: "Q1358",   de: "Spinnentiere",   beine: 8,  rang: 1 },
  // Q25375 Odonata (Libellen) — Unterklade von Q1390 Insecta, aber im rekonstruierten
  // Elterngraphen NICHT mit ihr verbunden: alle 289 Libellen-Ketten enden auf derselben
  // Tiefe, es gibt also keine flacher verschachtelte Art, die den fehlenden Schritt
  // beisteuern koennte (s. Kopfkommentar). Ohne diesen Eintrag blieben sie ohne Klade —
  // und damit im Bauplan „Kleines flinkes Tier" (Mausform). Beinzahl und zugelassene
  // Bauplaene sind identisch mit Insecta, die Zeile aendert also nichts ausser der
  // Erreichbarkeit. Label gegen Wikidata geprueft (Q25375 = Libellen / Odonata).
  { qid: "Q25375",  de: "Libellen",       beine: 6,  rang: 1 },
  { qid: "Q25364",  de: "Krebse",         beine: 10, rang: 1 },
  { qid: "Q5194",   de: "Baertierchen",   beine: 8,  rang: 1 },
  { qid: "Q25314",  de: "Bedecktsamer",   beine: -1, rang: 1 },
  { qid: "Q133712", de: "Nacktsamer",     beine: -1, rang: 1 },
  { qid: "Q373615", de: "Farne",          beine: -1, rang: 1 },
  { qid: "Q25347",  de: "Moose",          beine: -1, rang: 1 },
  { qid: "Q174726", de: "Schlauchpilze",  beine: -1, rang: 1 },
  { qid: "Q174698", de: "Staenderpilze",  beine: -1, rang: 1 },
  { qid: "Q25326",  de: "Weichtiere",     beine: 0,  rang: 2 },
  { qid: "Q25522",  de: "Ringelwuermer",  beine: 0,  rang: 2 },
  { qid: "Q44631",  de: "Stachelhaeuter", beine: 0,  rang: 2 },
  { qid: "Q25441",  de: "Nesseltiere",    beine: 0,  rang: 2 },
  { qid: "Q18960",  de: "Schwaemme",      beine: 0,  rang: 2 },
  // Q473809 Amoebozoa — dasselbe Muster wie Q25375: die Schleimpilze (Licea, Lycogala,
  // Ceratiomyxa) haengen im Katalog an keiner der bisherigen Zielkladen. Sie stehen
  // bereits im Bauplan „Plankton"; der Eintrag verschiebt sie nicht, sondern gibt ihnen
  // eine Klade — und damit einen sinnvollen „≈ in echt"-Verweis statt einer Tautologie.
  // Label gegen Wikidata geprueft (Q473809 = Amoebozoa).
  { qid: "Q473809", de: "Amoeben",        beine: -1, rang: 2 },
  { qid: "Q764",    de: "Pilze",          beine: -1, rang: 3 },
  { qid: "Q10876",  de: "Bakterien",      beine: -1, rang: 3 },
  { qid: "Q10872",  de: "Archaeen",       beine: -1, rang: 3 },
  { qid: "Q756",    de: "Pflanzen",       beine: -1, rang: 3 },
];

const MAX_TIEFE = 40;   // wie MAX_DEPTH in tools/lib/lineage.mjs — Zyklenschutz

/**
 * Aufloeser fuer EINEN Katalog. Baut den Elterngraphen einmal auf und merkt sich
 * Ergebnisse je Kette.
 *
 * @param {{entries: Array<{lineage: string[]}>}} catalog  app/catalog.js (window.CATALOG)
 * @param {Array<{qid: string, de: string, beine: number}>} klassen  Zielkladen
 */
export function cladeResolver(catalog, klassen = KLASSEN) {
  const parent = new Map();
  for (const e of catalog.entries) {
    const L = e.lineage || [];
    for (let i = 0; i < L.length - 1; i++) {
      if (!parent.has(L[i])) parent.set(L[i], new Set());
      parent.get(L[i]).add(L[i + 1]);
    }
  }
  const ziel = new Map(klassen.map((k) => [k.qid, k]));
  const memo = new Map();
  let konflikte = 0;
  const konfliktBeispiele = [];

  /** Naechste Zielklade eines Eintrags — oder null, wenn keine erreichbar ist. */
  function klasseVon(e) {
    const key = (e.lineage || []).join(",");
    if (memo.has(key)) return memo.get(key);
    let front = new Set(e.lineage || []);
    const gesehen = new Set(front);
    let out = null;
    for (let tiefe = 0; tiefe < MAX_TIEFE && front.size; tiefe++) {
      const treffer = [...front].map((q) => ziel.get(q)).filter(Boolean)
        .sort((a, b) => a.rang - b.rang);   // speziellere Klade zuerst
      if (treffer.length) {
        // Verschachtelung (Farne in Pflanzen) ist normal — nur GLEICHER Rang auf
        // derselben Ebene ist ein echter Widerspruch.
        if (treffer.length > 1 && treffer[1].rang === treffer[0].rang) {
          konflikte++;
          if (konfliktBeispiele.length < 5)
            konfliktBeispiele.push(`${e.sci || e.qid}: ${treffer.filter((t) => t.rang === treffer[0].rang).map((t) => t.de).join(" + ")} auf Ebene ${tiefe}`);
        }
        out = { ...treffer[0], tiefe };
        break;
      }
      const next = new Set();
      for (const q of front)
        for (const p of (parent.get(q) || [])) if (!gesehen.has(p)) { gesehen.add(p); next.add(p); }
      front = next;
    }
    memo.set(key, out);
    return out;
  }

  /** Alle Vorfahren eines Eintrags — fuer Aufrufer, die nur Zugehoerigkeit pruefen
   *  wollen (z. B. habitatOf()). ACHTUNG: enthaelt die o. g. Querverbindungen; fuer
   *  Klassenfragen immer klasseVon() nehmen. */
  const huelleMemo = new Map();
  function huelle(e) {
    const key = (e.lineage || []).join(",");
    if (huelleMemo.has(key)) return huelleMemo.get(key);
    const out = new Set(e.lineage || []);
    const stack = [...out];
    let schritte = 0;
    while (stack.length && schritte++ < 10000) {
      const x = stack.pop();
      for (const p of (parent.get(x) || [])) if (!out.has(p)) { out.add(p); stack.push(p); }
    }
    huelleMemo.set(key, out);
    return out;
  }

  return {
    klasseVon,
    huelle,
    parent,
    /** Anzahl Eintraege, bei denen zwei Zielkladen auf DERSELBEN Ebene lagen. */
    conflicts: () => ({ n: konflikte, beispiele: konfliktBeispiele }),
  };
}
