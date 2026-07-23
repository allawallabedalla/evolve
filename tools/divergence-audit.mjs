// Divergenz-Audit der LIVE-App: simuliert normale Bedienung (Biom wählen / Regler
// setzen) und misst, ob die Ergebnis-Wesen hinreichend streuen — Verdacht des Nutzers:
// landet immer beim „Kleinen flinken Tier", nie ein Fisch. Nutzt die ECHTEN App-
// Funktionen (stepGeneration/classify/fitness/mulberry32) direkt im Seitenkontext.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
const PORT = 8132, EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const srv = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: "/home/user/evolve/app", stdio: "ignore" });
const done = (c) => { srv.kill("SIGKILL"); process.exit(c); };
await new Promise((r) => setTimeout(r, 800));

const b = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "load" });
await p.waitForTimeout(500);

const out = await p.evaluate(() => {
  const AQUATIC = new Set(["Fisch · Aalform","Schnecke · Weichtier","Kopffüßer · Tintenfisch","Amphibie · Lurch","Koralle · Riffbildner","Schwamm","Plankton"]);
  const gauss = (r) => () => { const u = Math.max(r(), 1e-9), v = r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  function run(env, seed, gens) {
    const randn = gauss(mulberry32(seed));
    let g = new Array(NG).fill(0.5);
    for (let i = 0; i < gens; i++) g = stepGeneration(g, env, randn);
    const c = classify(g);
    return { name: c.n, kingdom: c.k, g };
  }
  // 5 „Durchläufe" wie ein normaler Nutzer: je ein Preset-Biom, unterschiedliche Leben (Seeds).
  const B = BIOMES; // die 10 App-Biome
  const picks = [0, 3, 4, 6, 8]; // Eiszeit, Hitze-Dürre, Sonniger Sumpf, Moderwald, Plankton-See
  const playthroughs = picks.map((bi, k) => {
    const r = run(B[bi].env, 1000 + k * 7919, 320);
    return { biome: B[bi].n, form: r.name, kingdom: r.kingdom, genes: r.g.map((x) => +x.toFixed(2)) };
  });

  // Breiter Sweep: viele zufällige Umwelten (freie Regler) -> erreichbares Formen-Spektrum.
  const counts = {}, kings = {}; let aquaticHits = 0; const aquaticEnvs = [];
  const N = 500;
  for (let i = 0; i < N; i++) {
    const env = { temperature: Math.random(), predation: Math.random(), foodAbundance: Math.random(), foodHeight: Math.random(), light: Math.random(), water: Math.random() };
    const r = run(env, (i * 2654435761) >>> 0, 300);
    counts[r.name] = (counts[r.name] || 0) + 1;
    kings[r.kingdom] = (kings[r.kingdom] || 0) + 1;
    if (AQUATIC.has(r.name)) { aquaticHits++; if (aquaticEnvs.length < 3) aquaticEnvs.push({ form: r.name, env: Object.fromEntries(Object.entries(env).map(([k,v])=>[k,+v.toFixed(2)])) }); }
  }
  // Auch die 10 Presets einzeln (was ein Nutzer real anklickt)
  const presetForms = B.map((bm) => ({ biome: bm.n, form: run(bm.env, 42, 320).name }));

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { playthroughs, presetForms, sweep: { N, distinct: sorted.length, top: sorted.slice(0, 12), kingdoms: kings, aquaticHits, aquaticEnvs, allForms: Object.keys(counts) } };
});

await b.close();

const pad = (s, n) => String(s).padEnd(n);
console.log("\n======== DIVERGENZ-AUDIT DER LIVE-APP ========\n");
console.log("── 5 Durchläufe (Nutzer wählt ein Biom, lässt es entwickeln) ──");
for (const t of out.playthroughs) console.log(`  ${pad(t.biome, 16)} -> ${pad(t.form, 26)} [${t.kingdom}]`);

console.log("\n── Alle 10 Preset-Biome (was man real anklickt) ──");
for (const t of out.presetForms) console.log(`  ${pad(t.biome, 16)} -> ${t.form}`);
const presetDistinct = new Set(out.presetForms.map((t) => t.form)).size;
console.log(`  => ${presetDistinct} verschiedene Formen aus 10 Presets`);

console.log(`\n── Breiter Sweep: ${out.sweep.N} zufällige Umwelten (freie Regler) ──`);
console.log(`  Verschiedene End-Formen: ${out.sweep.distinct}`);
console.log(`  Reiche: ${Object.entries(out.sweep.kingdoms).map(([k, v]) => `${k} ${(100*v/out.sweep.N).toFixed(0)}%`).join(" · ")}`);
console.log("  Häufigste Formen:");
for (const [n, c] of out.sweep.top) console.log(`    ${pad(n, 28)} ${(100*c/out.sweep.N).toFixed(1)}%`);
console.log(`\n  AQUATISCHE Formen (Fisch/Schnecke/Kopffüßer/Amphibie/Koralle/Schwamm/Plankton): ${out.sweep.aquaticHits}/${out.sweep.N}`);
if (out.sweep.aquaticEnvs.length) out.sweep.aquaticEnvs.forEach((a) => console.log(`    ${a.form}  bei  ${JSON.stringify(a.env)}`));
else console.log("    -> NIE erreicht durch Selektion (nur über Drift denkbar).");

console.log("\n── Bewertung ──");
const fishSeen = out.sweep.allForms.includes("Fisch · Aalform");
console.log(`  „Fisch · Aalform" je erreicht:  ${fishSeen ? "JA" : "NEIN"}`);
console.log(`  Formen-Vielfalt Presets/Sweep:  ${presetDistinct}/10  ·  ${out.sweep.distinct} Formen`);
done(0);
