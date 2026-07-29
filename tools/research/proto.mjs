// Prototyp des Empfehlungs-Kerns: Nischen-Schwarm. (Punkt 2, Migrations-Stufe 0). Kein Gate —
// Referenzmessung fuer docs/engine-forschungsergebnis.md, Abschnitt 2 ("Erreichbarkeit aller
// Grundformen — gemessen").
//  (a) breit gestreute Gründer-Genome statt Startpunkt 0.5
//  (b) MEHRDIMENSIONALER frequenzabhängiger Konkurrenz-Kernel (nicht nur size)
//  (c) Cluster-Erkennung auf SELEKTIONS-GEWICHTETER Metrik (neutrale Gene abwerten)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { mulberry32 } from "../../dist/world/population.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const clamp01 = x => x<0?0:x>1?1:x;
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
// Nischen-Achsen: die Merkmale, die "wie ernährt/wo lebt man" kodieren
const NICHE = [1,2,5,6,4,8,9,15]; // size, limb, photo, mobility, armor, wing, biolum, filter

// Selektions-Relevanz je Gen: |df/dg| am Populations-Mittel -> gewichtet die Metrik
function relevance(mean, env) {
  const eps = 0.01, w = new Array(25);
  for (let g=0; g<25; g++) {
    const up=mean.slice(); up[g]=clamp01(up[g]+eps);
    const dn=mean.slice(); dn[g]=clamp01(dn[g]-eps);
    w[g] = Math.abs(fitness(up,env,phys)-fitness(dn,env,phys))/(2*eps);
  }
  const mx = Math.max(...w, 1e-9);
  return w.map(v => 0.15 + 0.85*(v/mx));  // Boden 0.15: nie ganz ignorieren
}
function wdist(a,b,w){ let s=0; for(let i=0;i<25;i++){const d=(a[i]-b[i])*w[i]; s+=d*d;} return Math.sqrt(s); }

function wclusters(genomes, w, radius, minFrac) {
  const N = genomes.length, dens = new Array(N).fill(0);
  for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) if(wdist(genomes[i],genomes[j],w)<=radius){dens[i]++;dens[j]++;}
  const order = Array.from({length:N},(_,i)=>i).sort((a,b)=>dens[b]-dens[a]);
  const used = new Array(N).fill(false), out=[];
  for(const s of order){ if(used[s])continue; const mem=[];
    for(let j=0;j<N;j++) if(!used[j] && wdist(genomes[s],genomes[j],w)<=radius){used[j]=true;mem.push(j);}
    const c=new Array(25).fill(0); for(const m of mem) for(let g=0;g<25;g++) c[g]+=genomes[m][g]/mem.length;
    out.push({centroid:c, fraction:mem.length/N});
  }
  return out.filter(c=>c.fraction>=minFrac).sort((a,b)=>b.fraction-a.fraction);
}

function run(env, seed, {N=200, gens=250, sigmaC=0.22, compStrength=1.0, mutSd=0.05, selPower=2.0, spreadInit=true}={}) {
  const rng = mulberry32(seed);
  const randn = () => { const u=Math.max(rng(),1e-9), v=rng(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  // (a) gestreute Gründer statt 0.5
  let pop = Array.from({length:N}, () => spreadInit
    ? Array.from({length:25}, () => rng())
    : Array.from({length:25}, () => clamp01(0.5+randn()*0.03)));
  const inv2c2 = 1/(2*sigmaC*sigmaC);
  for (let t=0; t<gens; t++) {
    const base = pop.map(g => Math.pow(fitness(g,env,phys), selPower));
    // (b) mehrdimensionaler Konkurrenz-Kernel über die Nischen-Achsen
    const w = new Array(N);
    for (let i=0;i<N;i++){
      let n=0;
      for(let j=0;j<N;j++){ let d=0; for(const k of NICHE){const dd=pop[i][k]-pop[j][k]; d+=dd*dd;} n+=Math.exp(-d*inv2c2); }
      n/=N;
      w[i] = base[i]/Math.pow(n+1e-9, compStrength);
    }
    const cum=new Array(N); let tot=0;
    for(let i=0;i<N;i++){tot+=w[i];cum[i]=tot;}
    const pick=()=>{ const r=rng()*tot; let lo=0,hi=N-1; while(lo<hi){const m=(lo+hi)>>1; if(cum[m]<r)lo=m+1; else hi=m;} return pop[lo]; };
    const next=new Array(N);
    for(let k=0;k<N;k++){ const pa=pick(), pb=pick(); const c=new Array(25);
      for(let g=0;g<25;g++) c[g]=clamp01((rng()<0.5?pb[g]:pa[g])+randn()*mutSd);
      next[k]=c; }
    pop=next;
  }
  return pop;
}

const mean = p => { const m=new Array(25).fill(0); for(const g of p) for(let k=0;k<25;k++) m[k]+=g[k]/p.length; return m; };

console.log("### Nischen-Schwarm-Prototyp: koexistierende Formen je Biom (5 Läufe je Biom)\n");
const all = new Map(); let totCl=0, runs=0;
const t0 = performance.now();
for (const [name, env] of BIOMES) {
  const seen = new Map();
  for (let r=0;r<5;r++){
    const pop = run(env, ((r+1)*2654435761)>>>0);
    const w = relevance(mean(pop), env);
    const cl = wclusters(pop, w, 0.35, 0.08);
    totCl += cl.length; runs++;
    for (const c of cl){ const n=classify(c.centroid).n;
      seen.set(n,(seen.get(n)??0)+c.fraction/5); all.set(n,(all.get(n)??0)+c.fraction); }
  }
  const s=[...seen].sort((a,b)=>b[1]-a[1]).map(([n,f])=>`${n} ${(100*f).toFixed(0)}%`).join(", ");
  console.log(name.padEnd(20)+"| "+s);
}
console.log(`\nDauer: ${(performance.now()-t0).toFixed(0)}ms für ${runs} Läufe (${(performance.now()-t0)/runs} ms/Lauf à 250 Gen)`);
console.log(`Mittlere Cluster/Lauf: ${(totCl/runs).toFixed(2)}`);
const denom=[...all.values()].reduce((a,c)=>a+c,0);
console.log(`\n### Gesamtverteilung (${all.size} verschiedene Formen)`);
for(const [n,f] of [...all].sort((a,b)=>b[1]-a[1])) console.log(`   ${(100*f/denom).toFixed(2).padStart(6)}%  ${n}`);
