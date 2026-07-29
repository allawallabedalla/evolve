// Formverteilung ueber die 13 realen Biom-Presets, drei Regime (Mean-Field deterministisch /
// mit Drift / Agentenpopulation), plus Per-Gen-Varianz-Zerlegung. (Punkt 2, Migrations-Stufe
// 0). Kein Gate — Referenzmessung fuer docs/engine-forschungsergebnis.md, Messung 2.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stepGeneration } from "../../dist/engine/simulate.js";
import { Population, mulberry32 } from "../../dist/world/population.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const fitted = JSON.parse(readFileSync(join(ROOT, "fitted-params.json"), "utf8")).params;

const BIOMES = [
  ["Eiszeit",{temperature:.08,predation:.15,foodAbundance:.55,foodHeight:.15,light:.4,water:.5}],
  ["Räuberland",{temperature:.5,predation:.9,foodAbundance:.8,foodHeight:.15,light:.5,water:.6}],
  ["Reiche Kronen",{temperature:.5,predation:.1,foodAbundance:.9,foodHeight:.85,light:.5,water:.7}],
  ["Hitze-Dürre",{temperature:.92,predation:.1,foodAbundance:.3,foodHeight:.1,light:.9,water:.15}],
  ["Sonniger Sumpf",{temperature:.55,predation:.1,foodAbundance:.18,foodHeight:.1,light:.95,water:.95}],
  ["Dichter Wald",{temperature:.5,predation:.2,foodAbundance:.2,foodHeight:.7,light:.9,water:.85}],
  ["Moderwald",{temperature:.5,predation:.5,foodAbundance:.05,foodHeight:.05,light:.05,water:.12}],
  ["Urtümpel",{temperature:.35,predation:.1,foodAbundance:.05,foodHeight:.05,light:.1,water:.3}],
  ["Trüber See",{temperature:.55,predation:.55,foodAbundance:.28,foodHeight:.05,light:.1,water:.6}],
  ["Sonniges Flachmeer",{temperature:.4,predation:.05,foodAbundance:.05,foodHeight:.05,light:.88,water:.85}],
  ["Offenes Meer",{temperature:.5,predation:.5,foodAbundance:.65,foodHeight:.3,light:.5,water:.98}],
  ["Lichtlose Tiefsee",{temperature:.3,predation:.5,foodAbundance:.55,foodHeight:.1,light:.03,water:.95}],
  ["Default-Regler",{temperature:.5,predation:.3,foodAbundance:.5,foodHeight:.2,light:.5,water:.6}],
];
const GENS = 250, RUNS = 40;

console.log("Biom".padEnd(20), "| A: Mean-Field determ.".padEnd(32), "| B: +Drift (häufigste 2)".padEnd(42), "| C: Population N=300 (häufigste 2)");
const aAll=new Map(), bAll=new Map(), cAll=new Map();
const bump=(m,k)=>m.set(k,(m.get(k)??0)+1);
const top=(m,n,d)=>[...m].sort((x,y)=>y[1]-x[1]).slice(0,n).map(([k,v])=>`${k} ${(100*v/d).toFixed(0)}%`).join(", ");

for (const [name, env] of BIOMES) {
  let m0 = new Array(25).fill(0.5);
  for (let i=0;i<GENS;i++) m0 = stepGeneration(m0, env, phys, fitted);
  const a = classify(m0).n; bump(aAll,a);

  const bm = new Map(), cm = new Map();
  for (let r=0;r<RUNS;r++){
    const r2 = mulberry32((r*2654435761)>>>0);
    const randn = () => { const u=Math.max(r2(),1e-9), v=r2(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
    let m = new Array(25).fill(0.5);
    for (let i=0;i<GENS;i++) m = stepGeneration(m, env, phys, fitted, randn);
    const n = classify(m).n; bump(bm,n); bump(bAll,n);

    const pop = new Population({ size:300, numGenes:25 }, ((r+7)*2654435761)>>>0);
    for (let i=0;i<GENS;i++) pop.step(env, phys);
    const cn = classify(pop.mean()).n; bump(cm,cn); bump(cAll,cn);
  }
  console.log(name.padEnd(20), "|", a.padEnd(30), "|", top(bm,2,RUNS).padEnd(40), "|", top(cm,2,RUNS));
}
console.log(`\nA gesamt: ${aAll.size} verschiedene Formen über 13 Biome`);
console.log(`B gesamt: ${bAll.size} verschiedene Formen`);
console.log(`C gesamt: ${cAll.size} verschiedene Formen`);
console.log("\nB-Verteilung:", top(bAll, 99, 13*RUNS));
console.log("\nC-Verteilung:", top(cAll, 99, 13*RUNS));

// Per-Gen-Varianz in der Population (welche Gene driften frei?)
console.log("\n### Per-Gen-Standardabweichung in der Population nach 250 Gen (Mittel über 13 Biome)");
const TR=["insulation","size","limbLength","metabolism","armor","photosynthesis","mobility","structure","wing","biolum","detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense","desicc","radres","fireres","frostres","windres","nfix"];
const sd = new Array(25).fill(0);
for (const [,env] of BIOMES) {
  const pop = new Population({ size:300, numGenes:25 }, 12345);
  for (let i=0;i<GENS;i++) pop.step(env, phys);
  const mean = pop.mean();
  for (let k=0;k<25;k++){ let s=0; for(const g of pop.genomes) s+=(g[k]-mean[k])**2; sd[k]+=Math.sqrt(s/300)/BIOMES.length; }
}
TR.map((t,i)=>[t,sd[i]]).sort((a,b)=>b[1]-a[1]).forEach(([t,v])=>console.log(`   ${v.toFixed(3)}  ${t}`));
console.log(`\n  Summe sd^2 der 15 bedingten Gene: ${sd.slice(10).reduce((a,c)=>a+c*c,0).toFixed(3)} | der 10 Kern-Gene: ${sd.slice(0,10).reduce((a,c)=>a+c*c,0).toFixed(3)}`);
