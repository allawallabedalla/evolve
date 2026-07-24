// „≈ in echt"-Verweis: ordnet einer EMERGENTEN Art ein reales Vorbild + Wikipedia-Link
// zu, damit man sieht, wie so etwas in der Natur aussehen könnte. Bewusst KEINE
// Klassifikation — die Arten bleiben emergent (Cluster im Genom). Das hier ist nur
// eine didaktische Anschauungs-Brücke („ähnelt am ehesten …"), passend zum Pfeiler
// „Wertschätzung für die Natur". Hand-kuratiert, klar getrennt vom Sim-Kern.
//
// Eingabe = der prozedurale Name aus describe() („Reich · merkmal1, merkmal2, …").

const W = (title) => "https://de.wikipedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_"));

// Direkte, exakte Zuordnung der App-Archetyp-Namen (classify().n) auf ihr reales
// Wikipedia-Vorbild — für den „≈ in echt"-Link neben dem Namen in der HAUPTansicht.
// (Die Welt-Chronik nutzt realExample() für ihre EMERGENTEN Formen.)
// Spezifitäts-Prinzip (Nutzer-Wunsch): so TIEF verlinken, wie für die Form sicher
// belegbar — konkrete Klade statt Oberbegriff, ABER nie ins Risiko einer Falschanzeige.
// Generische Archetypen (z. B. „Fell-Warmblüter" = irgendein kleines Säugetier) bleiben
// bewusst auf der sicheren allgemeinen Ebene; nur wo der Name die Klade eindeutig nennt
// (z. B. „Aalform" -> Aal), geht es konkreter.
const ARCH_WIKI = {
  "Grünalge": ["Grünalge","Grünalgen"], "Moos": ["Moos","Laubmoose"], "Farn": ["Farn","Farne"],
  "Kraut · niedrige Pflanze": ["Kraut","Kräuter"], "Blütenkraut": ["Blütenpflanze","Blütenpflanzen"],
  "Verholzter Strauch": ["Strauch","Strauch"], "Laubbaum": ["Laubbaum","Laubbäume"],
  "Nadelbaum": ["Nadelbaum","Koniferen"], "Sukkulente · Kaktus": ["Kaktus","Kakteen"],
  "Polster-Kältepflanze": ["Polsterpflanze","Polsterpflanze"],
  "Wurm": ["Wurm","Würmer"], "Insekt · Gliederfüßer": ["Insekt","Insekten"],
  "Krebstier · Arthropode": ["Krebstier","Krebstiere"], "Fisch · Aalform": ["Aal","Aale"],
  "Reptil · Echse": ["Echse","Echsen"], "Gepanzertes Beutetier": ["Schildkröte","Schildkröten"],
  "Flatterer · Vogel": ["Vogel","Vögel"], "Fluginsekt · Segler": ["Fluginsekt","Fluginsekten"],
  "Flugsäuger · Fledermaus": ["Fledermaus","Fledertiere"], "Fell-Warmblüter": ["Säugetier","Säugetiere"],
  "Fell-Großtier": ["Bär","Bären"], "Aktiver Großjäger": ["Raubtier","Raubtiere"],
  "Gepanzerter Koloss": ["Nashorn","Nashörner"], "Behänder Kletterer": ["Primat","Primaten"],
  "Kleines flinkes Tier": ["Nagetier","Nagetiere"], "Generalisten-Tier": ["Säugetier","Säugetiere"],
  "Hutpilz": ["Hutpilz","Ständerpilze"], "Baumpilz · Porling": ["Porling","Porlinge"],
  "Zunderschwamm": ["Zunderschwamm","Zunderschwamm"], "Myzel · Pilzgeflecht": ["Myzel","Myzel"],
  "Schimmel · Fadenpilz": ["Schimmelpilz","Schimmelpilze"], "Flechte · Symbiose": ["Flechte","Flechte"],
  "Hefe": ["Hefe","Hefen"], "Bakterie": ["Bakterie","Bakterien"], "Archaee · Extremophil": ["Archaee","Archaeen"],
  "Protist · Amöbe": ["Amöbe","Amöben"], "Euglenoid · Mixotroph": ["Augentierchen","Euglena"],
  "Plankton": ["Plankton","Plankton"], "Schnecke · Weichtier": ["Schnecke","Schnecken"],
  "Kopffüßer · Tintenfisch": ["Tintenfisch","Kopffüßer"], "Amphibie · Lurch": ["Amphibie","Amphibien"],
  "Koralle · Riffbildner": ["Koralle","Korallen"], "Schwamm": ["Schwamm","Schwämme"],
  "Leuchtwesen · Tiefsee": ["Anglerfisch","Tiefseeanglerfische"],
};

/** Reales Vorbild + Wikipedia-URL zu einem konkreten App-Archetyp-Namen (Hauptansicht). */
export function archetypeWiki(archName) {
  const e = ARCH_WIKI[archName];
  if (!e) return null;
  return { name: e[0], wiki: W(e[1]) };
}

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
      if (has("leuchtend")) return { name: "Anglerfisch", wiki: W("Tiefseeanglerfische"), icon: "jelly" };
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
      if (has("leuchtend")) return { name: "Leuchtplankton", wiki: W("Meeresleuchten"), icon: "radiolarian" };
      if (has("geflügelt")) return { name: "Strahlentierchen", wiki: W("Radiolarien"), icon: "flower" };
      if (has("gliedmaßenreich")) return { name: "Pantoffeltierchen", wiki: W("Pantoffeltierchen"), icon: "worm" };
      return { name: "Amöbe", wiki: W("Amöben"), icon: "lichen" };
    default:
      return { name: "Lebewesen", wiki: W("Lebewesen"), icon: "cell" };
  }
}
