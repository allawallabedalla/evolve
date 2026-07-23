// Bündelt den (getesteten) v2-Welt-Kern als browserladbare ES-Module unter app/core/.
//
// Warum kopieren statt referenzieren? GitHub Pages deployt NUR den Ordner app/.
// dist/ ist gitignored und steht zur Laufzeit nicht bereit. Also spiegeln wir die
// von tsc erzeugten (und per npm-Checks verifizierten) Module in app/core/ —
// exakt derselbe Code wie im headless-Prüfstand, nur am Auslieferungsort.
//
// Laufzeit-Abhängigkeiten des Kerns (types.ts wird beim Compile gelöscht):
//   engine/fitness.js  +  world/{population,cluster,describe,rarity,world,census,coevolution}.js
// Aufruf:  npm run bundle-app   (baut vorher via tsc)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "app", "core");
mkdirSync(join(OUT, "engine"), { recursive: true });
mkdirSync(join(OUT, "world"), { recursive: true });

const HEADER = "// AUTO-GENERIERT von tools/bundle-app-core.mjs — nicht von Hand editieren.\n" +
  "// Quelle: world/*.ts + engine/fitness.ts (via tsc). Neu bündeln: npm run bundle-app\n";

function copyModule(rel) {
  const src = join(ROOT, "dist", rel);
  const dst = join(OUT, rel);
  const code = readFileSync(src, "utf-8");
  writeFileSync(dst, HEADER + code);
  return rel;
}

const engine = ["engine/fitness.js"];
const world = [
  "world/population.js", "world/cluster.js", "world/describe.js",
  "world/rarity.js", "world/world.js", "world/census.js", "world/coevolution.js",
];
[...engine, ...world].forEach(copyModule);

// Getunte v2-Landschaft mitliefern (Live-physics.json bleibt unberührt).
copyFileSync(join(ROOT, "world", "physics-v2.json"), join(OUT, "physics-v2.json"));

console.log(`app/core/ gebündelt: ${engine.length + world.length} Module + physics-v2.json`);
