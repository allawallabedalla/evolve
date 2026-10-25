// Erzeugt esp32/include/physics.h aus der Physik-JSON — nie von Hand abtippen.
//
// Quelle ist physics.json, NICHT app/core/physics-v2.json: das Haustier der Live-App
// rechnet mit der Inline-PHYS-Kopie von physics.json (npm run app-parity sichert das).
// physics-v2.json ist ein world/-Prototyp, dem u. a. die amphibious*-Konstanten fehlen
// (fitness() liefert damit NaN, s. ihr eigener _comment).
//
// Prüft vor dem Schreiben, dass jede in engine/fitness.ts gelesene Konstante existiert.
//
// Aufruf:  node esp32/tools/gen-physics.mjs [pfad/zur/physics.json]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ESP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(ESP, "..");
const src = process.argv[2] ?? join(ROOT, "physics.json");
const phys = JSON.parse(readFileSync(src, "utf-8"));
// Kommentare entfernen – dort stehen auch Namen, die es bewusst nicht gibt ("m.resprout")
const fitnessTs = readFileSync(join(ROOT, "engine", "fitness.ts"), "utf-8").replace(/\/\/.*$/gm, "");

const refs = (re) => [...new Set([...fitnessTs.matchAll(re)].map((m) => m[1]))];
const missing = [
  ...refs(/phys\.([A-Za-z0-9_]+)/g).filter((k) => !["maintenance", "maintenanceQuad"].includes(k) && typeof phys[k] !== "number"),
  ...refs(/\bm\.([A-Za-z0-9_]+)/g).filter((k) => typeof phys.maintenance?.[k] !== "number").map((k) => "maintenance." + k),
  ...refs(/\bmq\.([A-Za-z0-9_]+)/g).filter((k) => typeof phys.maintenanceQuad?.[k] !== "number").map((k) => "maintenanceQuad." + k),
];
if (missing.length) {
  console.error(`gen-physics: ${relative(ROOT, src)} fehlt: ${missing.join(", ")}`);
  process.exit(1);
}

// JS-Zahl als C++-Literal, das als double bit-gleich zurückgelesen wird
const lit = (v) => {
  let s = String(v);
  if (!/[.eE]/.test(s)) s += ".0";
  return s;
};
const cstr = (s) => JSON.stringify(s); // UTF-8 bleibt erhalten, Escapes passen zu C++

const scalars = Object.entries(phys).filter(([k, v]) => !k.startsWith("_") && typeof v === "number");
const lines = [];
lines.push(`// AUTOMATISCH ERZEUGT von esp32/tools/gen-physics.mjs aus ${relative(ROOT, src).replace(/\\/g, "/")}`);
lines.push("// Nicht von Hand ändern – Generator neu laufen lassen.");
lines.push("#pragma once");
lines.push('#include "evo_real.h"');
lines.push("");
lines.push("namespace phys {");
lines.push("");
lines.push(`constexpr int NUM_GENES = ${phys.traits.length};`);
lines.push("");
lines.push("// Trait-Indizes (Reihenfolge = TRAITS in engine/types.ts)");
phys.traits.forEach((t, i) => lines.push(`constexpr int T_${t.toUpperCase()} = ${i};`));
lines.push("");
lines.push(`static const char *const TRAIT_NAMES[NUM_GENES] = {${phys.traits.map(cstr).join(", ")}};`);
lines.push(`static const char *const TRAIT_LABELS[NUM_GENES] = {`);
for (const t of phys.traits) lines.push(`    ${cstr(phys.traitLabels?.[t] ?? t)},`);
lines.push("};");
lines.push("");
for (const [k, v] of scalars) lines.push(`constexpr real ${k} = real(${lit(v)});`);
lines.push("");
lines.push("namespace m {  // maintenance");
for (const [k, v] of Object.entries(phys.maintenance)) lines.push(`constexpr real ${k} = real(${lit(v)});`);
lines.push("}  // namespace m");
lines.push("");
lines.push("namespace mq {  // maintenanceQuad");
for (const [k, v] of Object.entries(phys.maintenanceQuad)) lines.push(`constexpr real ${k} = real(${lit(v)});`);
lines.push("}  // namespace mq");
lines.push("");
lines.push("}  // namespace phys");
lines.push("");

const out = join(ESP, "include", "physics.h");
writeFileSync(out, lines.join("\n"));
console.log(`gen-physics: ${phys.traits.length} Gene, ${scalars.length} Konstanten -> ${relative(ROOT, out).replace(/\\/g, "/")}`);
