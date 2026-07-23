// „≈ in echt"-Verweis: ordnet einer EMERGENTEN Art ein reales Vorbild + Wikipedia-Link
// zu, damit man sieht, wie so etwas in der Natur aussehen könnte. Bewusst KEINE
// Klassifikation — die Arten bleiben emergent (Cluster im Genom). Das hier ist nur
// eine didaktische Anschauungs-Brücke („ähnelt am ehesten …"), passend zum Pfeiler
// „Wertschätzung für die Natur". Hand-kuratiert, klar getrennt vom Sim-Kern.
//
// Eingabe = der prozedurale Name aus describe() („Reich · merkmal1, merkmal2, …").

const W = (title) => "https://de.wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));

/**
 * Reales Vorbild zu einem emergenten Art-Namen: Anzeige-Name, Wikipedia-URL UND ein
 * passendes flaches Icon (Schlüssel aus dem App-Icon-Set) — damit die kleine Silhouette
 * je Ort und der „≈ in echt"-Link dieselbe Anschauung zeigen. Emergenz-abgeleitet
 * (aus describe()), nicht aus classify() — die Klassifikation bleibt unberührt.
 */
export function realExample(name) {
  const [kingdom, rest = ""] = String(name).split(" · ");
  const t = new Set(rest.split(",").map((s) => s.trim()).filter(Boolean));
  const has = (...xs) => xs.some((x) => t.has(x));

  switch (kingdom) {
    case "Tier":
      if (has("geflügelt") && has("groß")) return { name: "Fledermaus", wiki: W("Fledertiere"), icon: "bat" };
      if (has("geflügelt")) return { name: "Schmetterling", wiki: W("Schmetterlinge"), icon: "butterfly" };
      if (has("gepanzert") && has("groß")) return { name: "Schildkröte", wiki: W("Schildkröten"), icon: "turtle" };
      if (has("gepanzert")) return { name: "Käfer", wiki: W("Käfer"), icon: "insect" };
      if (has("gliedmaßenreich")) return { name: "Tausendfüßer", wiki: W("Tausendfüßer"), icon: "worm" };
      if (has("isoliert") && has("groß")) return { name: "Eisbär", wiki: W("Eisbär"), icon: "bear" };
      if (has("isoliert")) return { name: "Robbe", wiki: W("Robben"), icon: "fish" };
      if (has("groß")) return { name: "Elefant", wiki: W("Elefanten"), icon: "rhino" };
      if (has("hochaktiv")) return { name: "Maus", wiki: W("Mäuse"), icon: "mouse" };
      if (has("winzig")) return { name: "Milbe", wiki: W("Milben"), icon: "insect" };
      return { name: "Säugetier", wiki: W("Säugetiere"), icon: "quadruped" };
    case "Pflanze":
      if (has("verholzt") || has("groß")) return { name: "Baum", wiki: W("Baum"), icon: "tree" };
      if (has("geflügelt")) return { name: "Löwenzahn", wiki: W("Wiesen-Löwenzahn"), icon: "flower" };
      if (has("winzig")) return { name: "Moos", wiki: W("Laubmoose"), icon: "moss" };
      return { name: "Kraut", wiki: W("Kräuter"), icon: "herb" };
    case "Pilz":
      if (has("verholzt") || has("groß")) return { name: "Baumpilz", wiki: W("Zunderschwamm"), icon: "bracket" };
      if (has("winzig")) return { name: "Hefe", wiki: W("Hefen"), icon: "mycelium" };
      return { name: "Hutpilz", wiki: W("Ständerpilze"), icon: "agaric" };
    case "Mikrobe":
      if (has("gliedmaßenreich")) return { name: "Kieselalge", wiki: W("Kieselalgen"), icon: "alga" };
      return { name: "Bakterie", wiki: W("Bakterien"), icon: "cell" };
    case "Protist":
      if (has("geflügelt")) return { name: "Strahlentierchen", wiki: W("Radiolarien"), icon: "flower" };
      if (has("gliedmaßenreich")) return { name: "Pantoffeltierchen", wiki: W("Pantoffeltierchen"), icon: "worm" };
      return { name: "Amöbe", wiki: W("Amöben"), icon: "lichen" };
    default:
      return { name: "Lebewesen", wiki: W("Lebewesen"), icon: "cell" };
  }
}
