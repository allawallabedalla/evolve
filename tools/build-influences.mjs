// Generiert app/influences.js aus docs/faktoren-katalog.md — der Katalog bleibt die
// EINZIGE Quelle der Wahrheit. Jeder Faktor kommt mit seinem Erklärsatz in den
// geschachtelten Browser (Sektion -> Untergruppe -> Faktor). Die real umsetzbaren
// (Umwelt-)Faktoren bekommen aus EFFECTS einen echten Effekt auf die 6 Kern-Dimensionen
// (+ toxicity); alles andere ist ehrlich als „kommt bald" markiert (künftige Achsen/Ebenen).
//
// Aufruf:  node tools/build-influences.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(ROOT, "docs", "faktoren-katalog.md"), "utf-8");

// Icon je Sektion (Nummer -> flaches Icon aus dem App-Icon-Set).
const SEC_ICON = {
  "1": "mountain", "2": "meteor", "3": "island", "4": "fang", "5": "dna",
  "6": "egg", "7": "tune", "8": "waves", "9": "globe", "10": "flame",
};

// Real umsetzbare Umwelt-Effekte, gekeyed nach dem EXAKTEN Faktor-Namen im Katalog.
// tone: "hit" (Katastrophe), "shift" (Klima/Milieu), "bio" (mild/günstig).
const EFFECTS = {
  // 1.1 Temperatur
  "Thermische Extreme (Hitze/Frost-Spitzen)": { tone: "hit", env: { temperature: 0.96, foodAbundance: 0.3 } },
  "Geothermie / Mikroklima-Refugien": { tone: "bio", env: { temperature: 0.62, water: 0.75, light: 0.2 } },
  // 1.2 Wasser
  "Niederschlag / Feuchte": { tone: "bio", env: { water: 0.92 } },
  "Schneedecke / subnivaler Raum": { tone: "shift", env: { temperature: 0.12, water: 0.5, light: 0.4 } },
  // 1.3 Licht
  "Lichtintensität": { tone: "shift", env: { light: 0.97, temperature: 0.74, water: 0.38, foodAbundance: 0.3, aridity: 0.3 } },   // volle Sonne = auch Hitze + Verdunstung; Licht allein verschiebt nichts (influence-check)
  "Photische vs. aphotische Zone": { tone: "shift", env: { light: 0.02, water: 0.98, pressure: 0.45, temperature: 0.3, foodAbundance: 0.35 } },   // lichtlose Wassersäule (nicht Höhle — influence-check fand die Dublette)
  // 1.4 Atmosphäre — AXIS-7 Hypoxie (dünne Höhenluft): oxygen<1 stresst hohen Stoffwechsel
  "Luftdruck / Höhe / Hypoxie": { tone: "shift", env: { oxygen: 0.12, temperature: 0.28, light: 0.8, foodAbundance: 0.45, water: 0.4 } },
  "UV-Strahlung": { tone: "hit", env: { uv: 0.9, light: 0.92 } },   // AXIS-10: DNA-Schaden -> Schutzpigment
  "Tiefe / hydrostatischer Druck": { tone: "shift", env: { pressure: 0.9, water: 0.98, light: 0.02, temperature: 0.28 } },   // AXIS-12: Tiefsee -> Druck-Toleranz
  // 1.5 Aquatik
  "pH / Säure": { tone: "shift", env: { toxicity: 0.7, water: 0.85 } },
  "Trübung / Sediment": { tone: "shift", env: { water: 0.8, light: 0.15 } },
  "Nährstoffstatus (oligo→eutroph)": { tone: "bio", env: { water: 0.85, foodAbundance: 0.85 } },
  "Gelöster Sauerstoff": { tone: "shift", env: { oxygen: 0.2, water: 0.92, temperature: 0.7 } },   // warmes, stehendes Wasser = O2-arm
  "Salinität + Salz-Gradienten": { tone: "shift", env: { salinity: 0.85, water: 0.9 } },   // AXIS-8: Salzsee/Brine/Ästuar -> Osmoregulation
  // 1.6 Boden
  "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)": { tone: "shift", env: { foodAbundance: 0.12 } },   // AXIS-19: karg -> N-Fixierung lohnt
  "Serpentin/Schwermetall-Toxizität": { tone: "hit", env: { toxicity: 0.85, foodAbundance: 0.3 } },
  "Boden-Sauerstoff (Staunässe/anoxisch)": { tone: "shift", env: { oxygen: 0.18, water: 0.95, foodAbundance: 0.5 } },   // Staunässe/Sumpf: anoxischer Boden
  // 1.7 Terrain
  "Höhengradient": { tone: "shift", env: { temperature: 0.2, foodHeight: 0.15, light: 0.72, water: 0.4 } },
  "Wind (Exposition + Ausbreitungs-Vektor)": { tone: "shift", env: { wind: 0.9, water: 0.35, temperature: 0.35 } },   // AXIS-18: Windhärte
  "Habitat-Struktur-Komplexität / Deckung": { tone: "bio", env: { foodHeight: 0.9, foodAbundance: 0.7 } },
  "Höhlen / unterirdischer Raum": { tone: "shift", env: { light: 0.02, temperature: 0.46, water: 0.55, foodAbundance: 0.22, oxygen: 0.82 } },   // Fels statt Wassersäule: konstant, nahrungsarm, schlecht belüftet
  // 1.8 Energie & Extrem-Chemie
  "Primärproduktivität / Ressourcen-Fülle": { tone: "bio", env: { foodAbundance: 0.95 } },
  "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)": { tone: "hit", env: { toxicity: 0.92, salinity: 0.7, water: 0.6, light: 0.3 } },
  "Natürliche Toxine / ionisierende Strahlung": { tone: "hit", env: { toxicity: 0.55, radiation: 0.9 } },   // AXIS-15: Radon/Uran-Boden -> Strahlungsresistenz
  // 1.9 Feuer
  "Feuer-Regime (Häufigkeit/Intensität/Saison)": { tone: "hit", env: { foodAbundance: 0.3, temperature: 0.72, fire: 0.9 } },   // AXIS-16: Pyrophyt
  // 2.2 Geophysikalisch
  "Vulkanausbruch / Flutbasalt (LIP)": { tone: "hit", env: { temperature: 0.8, light: 0.25, foodAbundance: 0.3 } },
  "Vulkanwinter / Aschefall": { tone: "hit", env: { light: 0.15, temperature: 0.25, foodAbundance: 0.35 } },
  "Erdbeben / Tsunami / Hangrutsch": { tone: "hit", env: { water: 0.75, foodAbundance: 0.4 } },
  // 2.3 Klima-Puls
  "Dürre als Selektions-Episode": { tone: "hit", env: { water: 0.1, temperature: 0.82, foodAbundance: 0.3, aridity: 0.9 } },   // AXIS-14: Austrocknung
  // 2.4 Langzeit-Klima
  "Eiszeit / Interglazial / abrupter Klimawechsel": { tone: "shift", env: { temperature: 0.06, foodAbundance: 0.35, water: 0.5, frost: 0.9 } },   // AXIS-17: Frost -> Kryoprotektion
  "Hyperthermal (PETM) / Schneeball-Erde": { tone: "bio", env: { temperature: 0.88, foodAbundance: 0.8, water: 0.7 } },
  "Meeresspiegel-Änderung (Transgression/Regression)": { tone: "shift", env: { water: 0.96, foodHeight: 0.1 } },
  "Aridifizierung / Grasland-Ausbreitung": { tone: "shift", env: { water: 0.35, foodHeight: 0.3, foodAbundance: 0.55, light: 0.78 } },
  "Ozean-Anoxie / -Versauerung / Euxinie": { tone: "hit", env: { oxygen: 0.08, toxicity: 0.6, water: 0.98, light: 0.25 } },   // AXIS-7×6: anoxisch + H2S-giftig
  // 2.5 Kosmisch
  "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter": { tone: "hit", env: { light: 0.1, temperature: 0.25, foodAbundance: 0.2 } },
};

// Klartext-Anzeigenamen (Usability-Audit): der Fachbegriff bleibt als Untertitel,
// aber der fette Titel ist laienverständlich. Nur für die AKTIVEN Faktoren nötig —
// die grauen „kommt bald" behalten den Katalognamen.
const PLAIN = {
  "Thermische Extreme (Hitze/Frost-Spitzen)": "Hitze- & Frost-Spitzen",
  "Geothermie / Mikroklima-Refugien": "Warme Erdwärme-Zuflucht",
  "Niederschlag / Feuchte": "Viel Regen & Feuchte",
  "Schneedecke / subnivaler Raum": "Schnee & Leben darunter",
  "Lichtintensität": "Grelles Sonnenlicht",
  "Photische vs. aphotische Zone": "Lichtlose Tiefe (Dunkelheit)",
  "Luftdruck / Höhe / Hypoxie": "Dünne Höhenluft",
  "UV-Strahlung": "Starke UV-Strahlung",
  "pH / Säure": "Saures Wasser",
  "Trübung / Sediment": "Trübes, schlammiges Wasser",
  "Nährstoffstatus (oligo→eutroph)": "Nährstoffreiches Wasser",
  "Gelöster Sauerstoff": "Sauerstoffarmes Wasser",
  "Salinität + Salz-Gradienten": "Salziges Wasser",
  "Nährstoff-Limitierung (N, P, Fe, Mikronährstoffe)": "Karger, nährstoffarmer Boden",
  "Serpentin/Schwermetall-Toxizität": "Giftiger Schwermetall-Boden",
  "Boden-Sauerstoff (Staunässe/anoxisch)": "Staunässe / Sumpfboden",
  "Höhengradient": "Gebirgs-Höhenlage",
  "Wind (Exposition + Ausbreitungs-Vektor)": "Dauerwind & Sturm",
  "Habitat-Struktur-Komplexität / Deckung": "Dichtes Versteck-Gestrüpp",
  "Höhlen / unterirdischer Raum": "Dunkle Höhle",
  "Primärproduktivität / Ressourcen-Fülle": "Nahrungs-Überfluss",
  "Extrem-Chemie (Schwefel/H₂S, Methan, hypersalin, Säure/Alkali)": "Extremchemie (Schwefel, Salz, Säure)",
  "Natürliche Toxine / ionisierende Strahlung": "Gift & radioaktive Strahlung",
  "Feuer-Regime (Häufigkeit/Intensität/Saison)": "Häufige Brände",
  "Vulkanausbruch / Flutbasalt (LIP)": "Vulkanausbruch",
  "Vulkanwinter / Aschefall": "Vulkanwinter (Aschehimmel)",
  "Erdbeben / Tsunami / Hangrutsch": "Erdbeben & Flutwelle",
  "Dürre als Selektions-Episode": "Lange Dürre",
  "Eiszeit / Interglazial / abrupter Klimawechsel": "Eiszeit",
  "Hyperthermal (PETM) / Schneeball-Erde": "Extreme Warmzeit",
  "Meeresspiegel-Änderung (Transgression/Regression)": "Steigender Meeresspiegel",
  "Aridifizierung / Grasland-Ausbreitung": "Versteppung (Grasland breitet sich aus)",
  "Tiefe / hydrostatischer Druck": "Tiefsee-Druck",
  "Ozean-Anoxie / -Versauerung / Euxinie": "Sauerstofftotes, giftiges Meer",
  "Meteoriten-/Asteroiden-Einschlag + Impakt-Winter": "Asteroiden-Einschlag",
};
// Klartext-Kategorienamen (Schlüssel = Title-Case-Ergebnis des Parsers).
const CAT_PLAIN = {
  "Ort-Parameter": "Ort & Klima",
  "Welt-Events": "Katastrophen & Welt-Ereignisse",
  "Raum, Isolation & Biogeografie": "Raum & Isolation",
  "Biotische Interaktionen": "Leben mit anderen Arten",
  "Genom-Achsen": "Körper & Gene",
  "Fortpflanzung & Lebensgeschichte": "Fortpflanzung & Lebensweg",
  "Evolutions-Mechanik": "Wie Evolution läuft",
  "Stochastik & Kontingenz": "Zufall & Schicksal",
  "Makro-Muster": "Große Muster der Vielfalt",
  "Anthropogen / Moderne Ära": "Mensch & moderne Welt",
};

// ---- Parser ----
const SKIP_HEAD = /^(Wie man liest|Priorisierung|Quellen)/;
const sections = [];
let sec = null, group = null;

const stripInline = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").trim();

for (const raw of md.split("\n")) {
  const line = raw.replace(/\s+$/, "");
  let m;
  if ((m = line.match(/^##\s+(\d+)\.\s+\S*\s*(.+)$/))) {
    // Sektion: "## 1. 🏝️ ORT-PARAMETER — ..."
    const num = m[1];
    const raw = m[2].replace(/\s+—.*$/, "").trim();
    // ALL-CAPS-Titel des Katalogs in lesbares Title-Case wandeln.
    const title = raw.toLowerCase().replace(/(^|[\s\-,&/])([a-zäöü])/g, (_, p, c) => p + c.toUpperCase());
    sec = { cat: title, plain: CAT_PLAIN[title] || title, icon: SEC_ICON[num] || "globe", groups: [] };
    sections.push(sec);
    group = { sub: "", factors: [] };
    sec.groups.push(group);
    continue;
  }
  if (/^##\s/.test(line)) { if (SKIP_HEAD.test(line.replace(/^##\s+/, ""))) sec = null; continue; }
  if (!sec) continue;
  if ((m = line.match(/^###\s+[\d.]+\s+(.+)$/))) {
    group = { sub: stripInline(m[1]), factors: [] };
    sec.groups.push(group);
    continue;
  }
  if ((m = line.match(/^-\s+\*\*(.+?)\*\*(.*)$/))) {
    const name = stripInline(m[1]);
    let rest = m[2].replace(/^\s*[—-]\s*/, "").trim();
    const tag = (rest.match(/\[([HZP][^\]]*)\]\s*$/) || [])[1] || "";
    rest = rest.replace(/\s*\[[HZP][^\]]*\]\s*$/, "").trim();
    const desc = stripInline(rest) || "—";
    const eff = EFFECTS[name];
    const f = { name, desc };
    if (PLAIN[name]) f.plain = PLAIN[name];
    if (eff) { f.env = eff.env; f.tone = eff.tone; } else { f.soon = true; }
    group.factors.push(f);
  }
}

// Leere Default-Gruppen (ohne Faktoren) verwerfen; Sektionen ohne Faktoren droppen.
for (const s of sections) s.groups = s.groups.filter((g) => g.factors.length);
const out = sections.filter((s) => s.groups.length);

const realCount = out.flatMap((s) => s.groups).flatMap((g) => g.factors).filter((f) => !f.soon).length;
const total = out.flatMap((s) => s.groups).flatMap((g) => g.factors).length;

const body =
  "// AUTO-GENERIERT von tools/build-influences.mjs aus docs/faktoren-katalog.md.\n" +
  "// Nicht von Hand editieren — Effekte in tools/build-influences.mjs (EFFECTS) pflegen,\n" +
  "// dann neu generieren: node tools/build-influences.mjs\n" +
  "// `env` = real umsetzbar (6 Kern-Dimensionen + toxicity). `soon` = im Katalog, aber als\n" +
  "// echte Selektionsachse/Ebene noch in Arbeit. `tone` = Effekt-Farbe (hit/shift/bio).\n" +
  "window.INFLUENCES = " + JSON.stringify(out, null, 1) + ";\n";
writeFileSync(join(ROOT, "app", "influences.js"), body);

// Report: welche EFFECTS-Keys nicht im Katalog gefunden wurden (Tippfehler-Schutz).
const names = new Set(out.flatMap((s) => s.groups).flatMap((g) => g.factors).map((f) => f.name));
const unmatched = Object.keys(EFFECTS).filter((k) => !names.has(k));
console.log(`influences.js: ${out.length} Sektionen, ${total} Faktoren (${realCount} real, ${total - realCount} kommt-bald).`);
if (unmatched.length) console.log("  ⚠ EFFECTS ohne Katalog-Treffer:\n   - " + unmatched.join("\n   - "));
