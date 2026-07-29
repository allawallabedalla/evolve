// Wie viele LOKALE Optima hat die Landschaft je Biom? -> Multi-Start-Bergsteigen.
// (Punkt 2, Migrations-Stufe 0). Kein Gate — Referenzmessung fuer
// docs/engine-forschungsergebnis.md, Messung 1.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { mulberry32 } from "../../dist/world/population.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const BIOMES = [
  ["Eiszeit",{temperature:.08,predation:.15,foodAbundance:.55,foodHeight:.15,light:.4,water:.5}],
  ["Räuberland",{temperature:.5,predation:.9,foodAbundance:.8,foodHeight:.15,light:.5,water:.6}],
  ["Reiche Kronen",{temperature:.5,predation:.1,foodAbundance:.9,foodHeight:.85,light:.5,water:.7}],
  ["Hitze-Dürre",{temperature:.92,predation:.1,foodAbundance:.3,foodHeight:.1,light:.9,water:.15}],
  ["Sonniger Sumpf",{temperature:.55,predation:.1,foodAbundance:.18,foodHeight:.1,light:.95,water:.95}],
  ["Dichter Wald",{temperature:.5,predation:.2,foodAbundance:.2,foodHeight:.7,light:.9,water:.85}],
  ["Moderwald",{temperature:.5,predation:.5,foodAbundance:.05,foodHeight:.05,light:.05,water:.12}],
  ["Trüber See",{temperature:.55,predation:.55,foodAbundance:.28,foodHeight:.05,light:.1,water:.6}],
  ["Offenes Meer",{temperature:.5,predation:.5,foodAbundance:.65,foodHeight:.3,light:.5,water:.98}],
  ["Lichtlose Tiefsee",{temperature:.3,predation:.5,foodAbundance:.55,foodHeight:.1,light:.03,water:.95}],
  ["Default-Regler",{temperature:.5,predation:.3,foodAbundance:.5,foodHeight:.2,light:.5,water:.6}],
];
const clamp01 = x => x<0?0:x>1?1:x;

// Reiner Bergsteiger (kein Mutations-Anker, keine Drift) bis Konvergenz.
function climb(env, start) {
  let m = start.slice();
  const eps = 0.004;
  for (let it=0; it<1200; it++) {
    let moved = 0;
    for (let g=0; g<25; g++) {
      const up=m.slice(); up[g]=clamp01(up[g]+eps);
      const dn=m.slice(); dn[g]=clamp01(dn[g]-eps);
      const grad=(fitness(up,env,phys)-fitness(dn,env,phys))/(2*eps);
      const d = 0.02*grad;
      const nv = clamp01(m[g]+d);
      moved += Math.abs(nv-m[g]); m[g]=nv;
    }
    if (moved < 1e-5) break;
  }
  return m;
}
const dist=(a,b)=>{let s=0;for(let i=0;i<25;i++){const d=a[i]-b[i];s+=d*d;}return Math.sqrt(s);};

const STARTS = 200;
console.log("Biom".padEnd(20), "| #Optima(d>0.25) | Formen an den Optima (Anteil der Startpunkte)");
const globalForms = new Map();
for (const [name, env] of BIOMES) {
  const rng = mulberry32(31337);
  const peaks = []; // {v, fit, hits}
  const formCount = new Map();
  for (let s=0; s<STARTS; s++) {
    const start = Array.from({length:25}, () => rng());
    const p = climb(env, start);
    const f = fitness(p, env, phys);
    let found = peaks.find(q => dist(q.v,p) < 0.25);
    if (found) { found.hits++; if (f>found.fit){found.v=p;found.fit=f;} }
    else peaks.push({v:p, fit:f, hits:1});
    const n = classify(p).n;
    formCount.set(n,(formCount.get(n)??0)+1);
    globalForms.set(n,(globalForms.get(n)??0)+1);
  }
  const big = peaks.filter(p=>p.hits>=STARTS*0.02);
  const forms = [...formCount].sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n} ${(100*c/STARTS).toFixed(0)}%`).join(", ");
  console.log(name.padEnd(20), "|", String(big.length).padStart(3), "(roh "+peaks.length+")".padEnd(8), "|", forms);
}
console.log("\n### Alle über Multi-Start erreichbaren Formen (11 Biome x 200 Starts):");
for (const [n,c] of [...globalForms].sort((a,b)=>b[1]-a[1])) console.log(`   ${(100*c/(11*STARTS)).toFixed(2).padStart(6)}%  ${n}`);
