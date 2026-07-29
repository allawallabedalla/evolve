// (1) Bug reproduzieren: Fell + Biolumineszenz -> immer "Leuchtwesen"?
// (2) Prototyp-Matcher als Ersatz demonstrieren.
// (Punkt 2, Migrations-Stufe 0). Kein Gate — Referenzmessung fuer
// docs/engine-forschungsergebnis.md, Messung 4 / Abschnitt 4.4.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fitness } from "../../dist/engine/fitness.js";
import { classify } from "./classify.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const phys = JSON.parse(readFileSync(join(ROOT, "physics.json"), "utf8"));
const T=["insulation","size","limbLength","metabolism","armor","photosynthesis","mobility","structure","wing","biolum","detox","oxyEff","osmo","burrow","pigment","filter","camo","baro","sense","desicc","radres","fireres","frostres","windres","nfix"];
const G = o => T.map(t => o[t] ?? 0.15);

console.log("### (1) Kaskaden-Bug: Fellwesen mit Leuchtorgan");
const fellLeucht = G({insulation:.82,size:.5,limbLength:.2,metabolism:.75,armor:.2,mobility:.7,biolum:.6,structure:.2,photosynthesis:.05});
console.log("  Genom: insulation .82, metabolism .75, biolum .60, limb .20, armor .20, mobility .70");
console.log("  classify() sagt:", classify(fellLeucht).n, "  <-- biolum-Zweig steht VOR dem Fell-Zweig");
const fellOhne = {...fellLeucht}; fellOhne[9]=0.2;
console.log("  dasselbe Genom mit biolum .20:", classify(fellOhne).n, " <-- nur das eine Gen kippt die Identität\n");

// --- (2) Prototyp-Bibliothek: jeder Archetyp = ein Referenz-Genom + Achsen-Gewichte
const PROTO = [
  ["Fisch · Aalform",       {size:.4,limbLength:.05,mobility:.85,armor:.08,structure:.1,metabolism:.6,photosynthesis:.02}],
  ["Insekt · Gliederfüßer", {size:.14,limbLength:.75,mobility:.7,armor:.35,structure:.2,metabolism:.6,photosynthesis:.02}],
  ["Krebstier · Arthropode",{size:.35,limbLength:.65,mobility:.55,armor:.7,structure:.3,metabolism:.45,photosynthesis:.02}],
  ["Fell-Warmblüter",       {insulation:.8,size:.45,limbLength:.4,mobility:.7,metabolism:.8,armor:.15,photosynthesis:.02}],
  ["Leuchtwesen · Tiefsee", {size:.3,limbLength:.05,mobility:.6,armor:.05,biolum:.8,structure:.05,photosynthesis:.02}],
  ["Gepanzerter Koloss",    {size:.85,armor:.8,mobility:.5,limbLength:.4,structure:.6,photosynthesis:.02}],
  ["Flatterer · Vogel",     {size:.2,wing:.85,metabolism:.85,insulation:.6,mobility:.8,armor:.1,photosynthesis:.02}],
  ["Fluginsekt · Segler",   {size:.1,wing:.8,metabolism:.6,limbLength:.5,mobility:.7,armor:.15,photosynthesis:.02}],
  ["Laubbaum",              {photosynthesis:.85,structure:.85,size:.8,mobility:.05,armor:.2}],
  ["Kraut · niedrige Pflanze",{photosynthesis:.8,structure:.2,size:.25,mobility:.05,armor:.1}],
  ["Hutpilz",               {photosynthesis:.03,mobility:.05,size:.5,structure:.35,metabolism:.4}],
  ["Bakterie",              {photosynthesis:.03,mobility:.1,size:.05,structure:.05,metabolism:.3}],
];
const protoVecs = PROTO.map(([n,o]) => [n, G(o)]);
const clamp01=x=>x<0?0:x>1?1:x;

// Relevanzgewichte: |df/dg| am Kandidaten -> neutrale Gene zählen kaum
function relevance(g, env){
  const eps=0.01, w=new Array(25);
  for(let k=0;k<25;k++){ const u=g.slice(); u[k]=clamp01(u[k]+eps); const d=g.slice(); d[k]=clamp01(d[k]-eps);
    w[k]=Math.abs(fitness(u,env,phys)-fitness(d,env,phys))/(2*eps); }
  const mx=Math.max(...w,1e-9); return w.map(v=>0.25+0.75*v/mx);
}
function match(g, env){
  const w = relevance(g, env);
  const scored = protoVecs.map(([n,p])=>{ let s=0,z=0;
    for(let k=0;k<25;k++){ const d=(g[k]-p[k])*w[k]; s+=d*d; z+=w[k]*w[k]; }
    return [n, Math.sqrt(s/Math.max(z,1e-9))]; }).sort((a,b)=>a[1]-b[1]);
  const [best,db]=scored[0], [second,ds]=scored[1];
  // Konfidenz = relativer Abstand zum Zweitplatzierten
  const conf = ds>0 ? clamp01((ds-db)/ds*2.2) : 1;
  return {best, second, db, conf, novel: db>0.42};
}
const envDeep={temperature:.3,predation:.5,foodAbundance:.55,foodHeight:.1,light:.03,water:.95};
console.log("### (2) Prototyp-Matcher auf denselben Fällen (Umwelt: Lichtlose Tiefsee)");
for (const [label,g] of [["Fell+Leuchten",fellLeucht],["Fell ohne Leuchten",Object.values(fellOhne)]]){
  const m = match(g, envDeep);
  console.log(`  ${label.padEnd(20)} -> ${m.best}  (Konfidenz ${(m.conf*100).toFixed(0)}%, zweitnächst: ${m.second}, d=${m.db.toFixed(3)}${m.novel?", NEUARTIG":""})`);
}
const insekt = G({size:.15,limbLength:.72,mobility:.68,armor:.32,metabolism:.6,structure:.18,photosynthesis:.02});
const m2 = match(insekt, {temperature:.5,predation:.4,foodAbundance:.6,foodHeight:.4,light:.6,water:.4});
console.log(`  ${"Insekten-Genom".padEnd(20)} -> ${m2.best}  (Konfidenz ${(m2.conf*100).toFixed(0)}%, zweitnächst: ${m2.second})`);
console.log(`  ${"  ... classify() sagt".padEnd(20)} -> ${classify(insekt).n}`);
const chimaere = G({size:.55,limbLength:.5,mobility:.5,armor:.5,photosynthesis:.5,structure:.5,biolum:.5,wing:.4});
const m3 = match(chimaere, {temperature:.5,predation:.3,foodAbundance:.5,foodHeight:.2,light:.5,water:.6});
console.log(`  ${"unmögliche Chimäre".padEnd(20)} -> ${m3.best}  (Konfidenz ${(m3.conf*100).toFixed(0)}%, d=${m3.db.toFixed(3)}${m3.novel?"  => NEUARTIG, generierter Name":""})`);
