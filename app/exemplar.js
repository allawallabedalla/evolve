// „≈ in echt"-Verweis: ordnet einer EMERGENTEN Art ein reales Vorbild + Wikipedia-Link
// zu, damit man sieht, wie so etwas in der Natur aussehen könnte. Bewusst KEINE
// Klassifikation — die Arten bleiben emergent (Cluster im Genom). Das hier ist nur
// eine didaktische Anschauungs-Brücke („ähnelt am ehesten …"), passend zum Pfeiler
// „Wertschätzung für die Natur". Hand-kuratiert, klar getrennt vom Sim-Kern.
//
// Eingabe = der prozedurale Name aus describe() („Reich · merkmal1, merkmal2, …").

const W = (title) => "https://de.wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));

/** Reales Vorbild + Wikipedia-URL zu einem emergenten Art-Namen. */
export function realExample(name) {
  const [kingdom, rest = ""] = String(name).split(" · ");
  const t = new Set(rest.split(",").map((s) => s.trim()).filter(Boolean));
  const has = (...xs) => xs.some((x) => t.has(x));

  switch (kingdom) {
    case "Tier":
      if (has("geflügelt") && has("groß")) return { name: "Fledermaus", wiki: W("Fledertiere") };
      if (has("geflügelt")) return { name: "Schmetterling", wiki: W("Schmetterlinge") };
      if (has("gepanzert") && has("groß")) return { name: "Schildkröte", wiki: W("Schildkröten") };
      if (has("gepanzert")) return { name: "Käfer", wiki: W("Käfer") };
      if (has("gliedmaßenreich")) return { name: "Tausendfüßer", wiki: W("Tausendfüßer") };
      if (has("isoliert") && has("groß")) return { name: "Eisbär", wiki: W("Eisbär") };
      if (has("isoliert")) return { name: "Robbe", wiki: W("Robben") };
      if (has("groß")) return { name: "Elefant", wiki: W("Elefanten") };
      if (has("hochaktiv")) return { name: "Maus", wiki: W("Mäuse") };
      if (has("winzig")) return { name: "Milbe", wiki: W("Milben") };
      return { name: "Säugetier", wiki: W("Säugetiere") };
    case "Pflanze":
      if (has("verholzt") || has("groß")) return { name: "Baum", wiki: W("Baum") };
      if (has("geflügelt")) return { name: "Löwenzahn", wiki: W("Wiesen-Löwenzahn") };
      if (has("winzig")) return { name: "Moos", wiki: W("Laubmoose") };
      return { name: "Kraut", wiki: W("Kräuter") };
    case "Pilz":
      if (has("verholzt") || has("groß")) return { name: "Baumpilz", wiki: W("Zunderschwamm") };
      if (has("winzig")) return { name: "Hefe", wiki: W("Hefen") };
      return { name: "Hutpilz", wiki: W("Ständerpilze") };
    case "Mikrobe":
      if (has("gliedmaßenreich")) return { name: "Kieselalge", wiki: W("Kieselalgen") };
      return { name: "Bakterie", wiki: W("Bakterien") };
    case "Protist":
      if (has("geflügelt")) return { name: "Strahlentierchen", wiki: W("Radiolarien") };
      if (has("gliedmaßenreich")) return { name: "Pantoffeltierchen", wiki: W("Pantoffeltierchen") };
      return { name: "Amöbe", wiki: W("Amöben") };
    default:
      return { name: "Lebewesen", wiki: W("Lebewesen") };
  }
}
