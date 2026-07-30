// Erzeugt die INLINE-Kopie von PHYS + fitness() in app/index.html — die dritte,
// bisher von Hand gepflegte Kopie neben engine/fitness.ts (TS, kanonisch) und
// oracle/reference_model.py (Python-Orakel). Siehe docs/komplexitaets-audit.md
// ("Technische Seite", P2/P2.6): genau diese Handkopie schickte das Spiel frueher
// ueber 10 Versionen mit NaN-Fitness live, weil parity/ecology nur TS<->Python
// pruefen, nicht diese dritte Stelle. app-parity (tools/app-parity.mjs) faengt
// FUNKTIONALE Abweichungen ab; dieses Skript verhindert, dass sie ueberhaupt erst
// entsteht, indem es die Kopie GENERIERT statt sie neu abzutippen.
//
// Prinzip identisch zu tools/bundle-app-core.mjs ("kopiere den bereits geprueften
// kompilierten Code, tippe ihn nicht neu") — nur ist das Ziel hier kein eigenes
// File unter app/core/, sondern ein Textblock MITTEN in app/index.html. Deshalb:
// gezielte Textersetzung per String.replace() mit denselben Regex-Grenzen, die
// tools/lib/app-core.mjs (influence-check, layer-import-check) und
// tools/app-parity.mjs schon benutzen, um den Block zu FINDEN — kein volles
// Neu-Dumpen der Datei (das wuerde unbeteiligte Formatierung woanders zerstoeren).
//
// Quellen (beide bereits von anderen Gates geprueft, hier nur kopiert):
//   - physics.json         -> const PHYS = {...};   (minus _comment/traits/traitLabels,
//                              die restlichen Schluessel sind 1:1 = Laufzeit-Physik)
//   - dist/engine/fitness.js -> function fitness(t, e){...}  (das von tsc kompilierte,
//                              bereits von `npm run parity`/`app-parity` gepruefte JS —
//                              NICHT engine/fitness.ts neu transpiliert, s. unten)
//
// Warum dist/*.js und nicht engine/fitness.ts? Die App ist ein <script> OHNE
// Bundler/TS-Toolchain im Browser (GitHub Pages liefert nur statisches app/). Das
// bereits von tsc kompilierte, typgeprüfte JS laesst sich wortwoertlich einbetten;
// TS-Syntax (Typen/`import type`) waere im Browser ein Syntaxfehler.
//
// Warum weiterhin INLINE (kein import() aus app/core/engine/fitness.js)? fitness()
// wird SYNCHRON beim App-Boot fuer classify()/matchArchetype() gebraucht, BEVOR
// irgendein import() aufloest (Migrations-Stufe 2/4, s. BACKLOG.md) — das ist ein
// harter Constraint, kein Versehen.
//
// Aufruf:  npm run bundle-app            (schreibt app/index.html)
//          node tools/bundle-app-fitness.mjs --check   (nur pruefen, exit 1 bei Drift)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const HEADER =
  "// AUTO-GENERIERT von tools/bundle-app-fitness.mjs — nicht von Hand editieren.\n" +
  "// Quelle: physics.json + dist/engine/fitness.js. Neu erzeugen: npm run bundle-app\n";

// ---------- 1) PHYS aus physics.json ----------
// physics.json enthaelt 3 Nicht-Laufzeit-Felder (_comment/traits/traitLabels) —
// alle anderen Schluessel sind wortgleich die Laufzeit-Physik (verifiziert durch
// app-parity: Wertegleichheit ueber 3000 Zufallsstichproben). JSON ist bereits ein
// gueltiges JS-Objektliteral, ABER: tools/mf-fidelity.mjs liest einzelne Werte
// (u. a. PHYS.eps) per Regex `name\s*:\s*wert` OHNE Anfuehrungszeichen aus
// app/index.html (dieselbe Technik wie fuer PARAMS.responseRate etc., die von
// diesem Skript unangetastet bleiben). JSON.stringify quotet Schluessel
// ("eps": 0.02) und wuerde dieses bestehende Gate stumm brechen (kein Treffer ->
// throw). Deshalb ein eigener, minimaler Serializer: gleiches Einrueck-Format wie
// JSON.stringify(..., null, 2), aber UNQUOTED keys — bleibt gueltiges JS-Objekt-
// literal (jeder physics.json-Schluessel ist ein gueltiger JS-Bezeichner, s.
// Assertion unten) und haelt bestehende Regex-Leser kompatibel.
function toJsObjectLiteral(obj, depth = 0) {
  const pad = "  ".repeat(depth + 1);
  const closePad = "  ".repeat(depth);
  const lines = Object.entries(obj).map(([k, v]) => {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k)) {
      console.error(`bundle-app-fitness: physics.json-Schluessel '${k}' ist kein gueltiger JS-Bezeichner — Serializer anpassen.`);
      process.exit(1);
    }
    const val = v !== null && typeof v === "object" && !Array.isArray(v)
      ? toJsObjectLiteral(v, depth + 1)
      : JSON.stringify(v);
    return `${pad}${k}: ${val}`;
  });
  return `{\n${lines.join(",\n")}\n${closePad}}`;
}

function buildPhysBlock() {
  const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf-8"));
  const { _comment, traits, traitLabels, ...runtime } = phys;
  const literal = toJsObjectLiteral(runtime);
  return `${HEADER}const PHYS = ${literal};`;
}

// ---------- 2) fitness() aus dist/engine/fitness.js ----------
// Das kompilierte Modul exportiert `fitness(traits, env, phys)` plus die Trait-
// Index-Konstanten (INSULATION..NFIX) und eigene clamp01/sigmoid auf Modul-Ebene.
// app/index.html hat clamp01/sigmoid schon als eigene top-level consts (fuer den
// Rest der Datei) — ein zweites `const clamp01` auf derselben Ebene waere ein
// SyntaxError (Redeclaration). Deshalb wird der GESAMTE dist-Inhalt (Konstanten +
// umbenannte Funktion) als eigener, in sich abgeschlossener Block INNERHALB von
// fitness(t, e){...} verschachtelt (eigener Function-Scope -> Shadowing ist legal,
// keine Kollision). Der duenne Rest von fitness() ruft nur noch durch:
//   function fitness(t, e){ ...(verschachtelter Block).. return _engineFitness(t, e, PHYS); }
// Das haelt die Aufrufer-Signatur `fitness(t, e)` (2 Argumente, PHYS implizit) fuer
// alle bestehenden Aufrufer in app/index.html unveraendert.
//
// WICHTIG fuer die Regex-Grenze aus tools/lib/app-core.mjs / tools/app-parity.mjs
// (`/function fitness\(t, e\)\{[\s\S]*?\n\}/`, matcht bis zur ERSTEN Zeile, die mit
// einer bündigen (nicht eingerückten) `}` beginnt): dist/engine/fitness.js enthaelt
// nach dem Entfernen des Datei-Kopfkommentars genau EIN `{` und genau EIN `}` (die
// Funktionsklammern selbst — keine ifs/for/verschachtelten Objektliterale drinnen,
// gegengeprueft per grep). Wird dieser Inhalt eingerueckt eingebettet, ist seine
// eigene schliessende `}` NIE buendig -> die Regex laeuft ungestoert bis zur
// buendigen `}` des AEUSSEREN, von diesem Skript erzeugten fitness(t, e){...}.
// Ohne diese Einrueckung wuerde die Regex am `}` von _engineFitness abschneiden
// und `return _engineFitness(...)` verschlucken -> genau der stumme NaN-Bug, den
// dieses Skript verhindern soll (fitness() liefe dann ohne return -> undefined).
function buildFitnessBlock() {
  const distSrc = readFileSync(join(ROOT, "dist", "engine", "fitness.js"), "utf-8");
  const bodyStart = distSrc.indexOf("const clamp01");
  if (bodyStart < 0) {
    console.error("bundle-app-fitness: 'const clamp01' nicht in dist/engine/fitness.js gefunden — tsc-Output-Format geaendert?");
    process.exit(1);
  }
  let body = distSrc.slice(bodyStart).trimEnd();
  const renamed = body.replace(
    "export function fitness(traits, env, phys) {",
    "function _engineFitness(traits, env, phys) {",
  );
  if (renamed === body) {
    console.error("bundle-app-fitness: 'export function fitness(traits, env, phys) {' nicht in dist/engine/fitness.js gefunden.");
    process.exit(1);
  }
  body = renamed;
  // Sanity: die Umbenennung darf kein zweites Mal treffen (sonst still falsch).
  if ((distSrc.match(/export function fitness/g) || []).length !== 1) {
    console.error("bundle-app-fitness: dist/engine/fitness.js hat nicht genau einen fitness()-Export.");
    process.exit(1);
  }
  // Sicherheitscheck der Brace-Balance-Annahme (s. Kommentar oben): genau 1 '{' / 1 '}'.
  const braceOpen = (body.match(/\{/g) || []).length;
  const braceClose = (body.match(/\}/g) || []).length;
  if (braceOpen !== 1 || braceClose !== 1) {
    console.error(
      `bundle-app-fitness: erwartete genau 1x '{' und 1x '}' in dist/engine/fitness.js (gefunden ${braceOpen}/${braceClose}). ` +
      "Die Einbett-Annahme (keine verschachtelten Bloecke) stimmt nicht mehr — Skript pruefen, bevor generiert wird.",
    );
    process.exit(1);
  }
  const indented = body
    .split("\n")
    .map((line) => (line.length ? "  " + line : line))
    .join("\n");
  return (
    `${HEADER}function fitness(t, e){\n` +
    `  // Koerper unten = dist/engine/fitness.js, umbenannt zu _engineFitness (eigener\n` +
    `  // Function-Scope, damit clamp01/sigmoid/Trait-Indizes nicht mit den top-level\n` +
    `  // Deklarationen weiter oben kollidieren). PHYS kommt aus dem const-Block oben.\n` +
    `${indented}\n` +
    `  return _engineFitness(t, e, PHYS);\n` +
    `}`
  );
}

// ---------- 3) gezielt in app/index.html ersetzen ----------
// Superset-Regex (optionaler eigener Header + der bekannte Block): idempotent bei
// wiederholtem Lauf (ersetzt den vorherigen generierten Header mit, statt ihn bei
// jedem `npm run bundle-app` neu vor den Block zu haengen).
const PHYS_RE = /(?:\/\/ AUTO-GENERIERT[^\n]*\n(?:\/\/[^\n]*\n)*)?const PHYS = \{[\s\S]*?\n\};/;
const FITNESS_RE = /(?:\/\/ AUTO-GENERIERT[^\n]*\n(?:\/\/[^\n]*\n)*)?function fitness\(t, e\)\{[\s\S]*?\n\}/;

function main() {
  const htmlPath = join(ROOT, "app", "index.html");
  const html = readFileSync(htmlPath, "utf-8");

  const physBlock = buildPhysBlock();
  const fitnessBlock = buildFitnessBlock();

  if (!PHYS_RE.test(html)) {
    console.error("bundle-app-fitness: PHYS-Block nicht in app/index.html gefunden."); process.exit(1);
  }
  if (!FITNESS_RE.test(html)) {
    console.error("bundle-app-fitness: fitness()-Block nicht in app/index.html gefunden."); process.exit(1);
  }

  let next = html.replace(PHYS_RE, () => physBlock);
  next = next.replace(FITNESS_RE, () => fitnessBlock);

  if (CHECK) {
    if (next === html) {
      console.log("[bundle-app-fitness --check] OK — app/index.html ist auf dem frisch generierten Stand.");
      return;
    }
    console.error(
      "[bundle-app-fitness --check] ABWEICHUNG: die Inline-Kopie (PHYS/fitness()) in app/index.html\n" +
      "  stimmt nicht mit dem frisch aus physics.json + dist/engine/fitness.js generierten Stand ueberein.\n" +
      "  Wurde `npm run bundle-app` nach einer Aenderung an physics.json/engine/fitness.ts vergessen?\n" +
      "  Beheben: npm run bundle-app   (schreibt app/index.html neu)",
    );
    process.exit(1);
  }

  if (next === html) {
    console.log("[bundle-app-fitness] app/index.html bereits aktuell (keine Aenderung).");
    return;
  }
  writeFileSync(htmlPath, next);
  console.log("[bundle-app-fitness] app/index.html aktualisiert (PHYS + fitness() aus physics.json / dist/engine/fitness.js).");
}

main();
