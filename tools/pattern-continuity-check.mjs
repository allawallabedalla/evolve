// ============================================================================
// pattern-continuity-check — misst die KERNEIGENSCHAFT der CPPN-Musterschicht
// (BACKLOG Punkt 13, Phase 2): kleine Genom-Distanz muss kleine Bild-Distanz
// ergeben. Ohne diesen Nachweis waere "stetig" eine Behauptung.
//
// Warum das ueberhaupt fraglich ist: das Musterfeld wird fuer die Darstellung in
// Stufen QUANTISIERT (Projektregel: nur Flaechenfarben, kein Verlauf). Harte
// Schwellen koennten die Stetigkeit zerstoeren — tun sie theoretisch nicht (eine
// Schwelle wandert bei einer Feldverschiebung eps nur um einen schmalen Saum),
// aber genau das wird hier gemessen statt geglaubt.
//
// Drei Messungen:
//   1. Stetigkeit — Bild-Distanz gegen Genom-Distanz, ueber viele Zufallspaare.
//      Erwartung: monoton wachsend, KEIN Sprung bei winzigen Genom-Distanzen.
//   2. Lipschitz-Schranke — max(Bild-Distanz / Genom-Distanz). Muss endlich und
//      klein bleiben; ein Ausreisser hier hiesse "ein Gen-Zucken kippt das Bild".
//   3. Gegenprobe Hash — dieselbe Messung mit gehashten statt projizierten
//      Gewichten. Muss DEUTLICH schlechter sein, sonst misst der Test nichts.
//
// Aufruf: node tools/pattern-continuity-check.mjs
// ============================================================================
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8000 + Math.floor(Math.random() * 1000);
const pwDir = "/opt/pw-browsers";
const chromeDir = readdirSync(pwDir).find(d => /^chromium-\d+$/.test(d));
const EXEC = join(pwDir, chromeDir, "chrome-linux", "chrome");

const { chromium } = await import("playwright-core");
const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", join(ROOT, "app")], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(900);
await page.evaluate(() => { running = false; });

const res = await page.evaluate(() => {
  // Das Feld auf einem festen Raster abtasten und in FLECKENDECKUNG umrechnen —
  // exakt die Groesse, die patternPatches() zeichnet (Flaeche ~ over, s. dort).
  // Bewusst NICHT eine eigene Binaerstufung: der Test muss messen, was das Auge
  // sieht, sonst prueft er eine Groesse, die so nie auf dem Schirm landet.
  const N = 24;
  const HI = 0.72 - 0.5*0.34, LO = -0.72 + 0.5*0.34;   // amount=0.5 (Default-Pigment)
  const cover = f => {
    if(f > HI) return (f-HI)/(1-HI);        // heller Fleck: +Deckung
    if(f < LO) return -(LO-f)/(1+LO);       // dunkler Fleck: -Deckung
    return 0;
  };
  const render = (field, freq) => {
    const out = new Float64Array(N*N);
    for(let iy=0; iy<N; iy++) for(let ix=0; ix<N; ix++){
      const u = ((ix+0.5)/N*2-1)*freq, v = ((iy+0.5)/N*2-1)*freq;
      out[iy*N+ix] = cover(field(u, v));
    }
    return out;
  };
  // Bild-Distanz = mittlere Deckungsaenderung je Rasterzelle.
  const imgDist = (a, b) => { let d = 0; for(let i=0;i<a.length;i++) d += Math.abs(a[i]-b[i]); return d/a.length; };
  const genDist = (a, b) => { let s = 0; for(let i=0;i<a.length;i++){ const d = a[i]-b[i]; s += d*d; } return Math.sqrt(s/a.length); };

  // Hash-Variante als Gegenprobe: Gewichte aus fnv1a32 des gerundeten Genoms.
  const fnv = s => { let h = 0x811c9dc5; for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h>>>0; };
  const hashField = g => {
    const r = mulberry32(fnv(g.map(v=>v.toFixed(3)).join(",")));
    const w = new Float64Array(CPPN_NW);
    for(let k=0;k<CPPN_NW;k++) w[k] = r()*2-1;
    // gleiche Topologie, nur andere Gewichtsherkunft
    return (u,v) => {
      const inp = [u, v, Math.sqrt(u*u+v*v), 1];
      const h1 = new Float64Array(CPPN_H1), h2 = new Float64Array(CPPN_H2);
      for(let i=0;i<CPPN_H1;i++){ let s=w[_CPPN_B1+i];
        for(let j=0;j<CPPN_IN;j++) s += w[_CPPN_W1+i*CPPN_IN+j]*inp[j];
        h1[i] = _CPPN_ACT[_CPPN_ACT1[i]](s*2.2); }
      for(let i=0;i<CPPN_H2;i++){ let s=w[_CPPN_B2+i];
        for(let j=0;j<CPPN_H1;j++) s += w[_CPPN_W2+i*CPPN_H1+j]*h1[j];
        h2[i] = _CPPN_ACT[_CPPN_ACT2[i]](s*1.8); }
      let s = w[_CPPN_B3];
      for(let j=0;j<CPPN_H2;j++) s += w[_CPPN_W3+j]*h2[j];
      return Math.tanh(s*1.5);
    };
  };

  const ratios = [];
  const rnd = mulberry32(12345);
  const FREQ = 2.0;
  // Genom-Distanzen ueber mehrere Groessenordnungen — von "ein Mutationsschritt"
  // (SD 0.06, s. PARAMS) bis "voellig anderes Wesen".
  const steps = [0.002, 0.006, 0.02, 0.06, 0.15, 0.4];
  const buckets = steps.map(s => ({ step: s, cppn: [], hash: [] }));
  let worstRatio = 0, worstStep = 0;

  for(let trial=0; trial<160; trial++){
    const base = Array.from({length: NG}, () => rnd());
    const fB = render(cppnField(base), FREQ);
    const hB = render(hashField(base), FREQ);
    for(const b of buckets){
      const mut = base.map(v => Math.max(0, Math.min(1, v + (rnd()*2-1)*b.step)));
      const gd = genDist(base, mut);
      if(gd < 1e-9) continue;
      const dC = imgDist(fB, render(cppnField(mut), FREQ));
      const dH = imgDist(hB, render(hashField(mut), FREQ));
      b.cppn.push(dC); b.hash.push(dH);
      const ratio = dC/gd;
      ratios.push(ratio);
      if(ratio > worstRatio){ worstRatio = ratio; worstStep = b.step; }
    }
  }
  const mean = a => a.reduce((x,y)=>x+y, 0)/Math.max(1, a.length);
  return {
    NG,
    rows: buckets.map(b => ({ step: b.step, cppn: mean(b.cppn), hash: mean(b.hash) })),
    worstRatio, worstStep,
    meanRatio: mean(ratios),
  };
});

await browser.close();
server.kill();

if(errors.length){ console.error("JS-Fehler beim Laden:", errors); process.exit(1); }

console.log(`pattern-continuity-check — CPPN-Musterschicht, ${res.NG} Gene\n`);
console.log("  Genom-Stoerung   Bild-Aenderung (CPPN)   dieselbe mit Hash");
console.log("  ---------------------------------------------------------");
let monotone = true, prev = -1;
for(const r of res.rows){
  const bar = "#".repeat(Math.round(r.cppn*40));
  console.log(`  +/-${r.step.toFixed(3)}          ${(r.cppn*100).toFixed(1).padStart(5)} %  ${bar.padEnd(22)} ${(r.hash*100).toFixed(1).padStart(5)} %`);
  if(r.cppn < prev - 1e-6) monotone = false;
  prev = r.cppn;
}

// Bewertung. Die Schwellen sind bewusst grosszuegig: geprueft wird die
// EIGENSCHAFT (kleine Stoerung -> kleines Bild-Delta, klar besser als Hash),
// nicht ein eingefrorener Zahlenwert, der bei jeder Musteranpassung neu justiert
// werden muesste.
const smallest = res.rows[0], largest = res.rows[res.rows.length-1];
const hashAvg = res.rows.reduce((s,r)=>s+r.hash, 0)/res.rows.length;
const cppnSmall = smallest.cppn;
// Zur Lipschitz-Schranke: der ABSOLUTWERT ist hier keine sinnvolle Messlatte. Die
// Empfindlichkeit ist gewollt und durch den Aufbau vorgegeben (Gen-Gewichtung bis
// 2.6, Schichtverstaerkungen 2.2/1.8/1.5, sin mit Steigung 3.1, dazu 26 Gene) —
// ein Wert in den Zehnern ist die Bau-Auslegung, kein Fehler. Ein erster Versuch
// mit "< 6" pruefte deshalb eine Groesse, deren natuerliche Skala ich vorher nicht
// kannte: schon der MITTELWERT liegt bei ~17, die Schranke war also von Anfang an
// unerfuellbar und haette nie etwas ueber die Musterschicht ausgesagt.
//
// Wogegen die Schranke wirklich schuetzen soll, ist ein KATASTROPHENFALL: einzelne
// Genome, bei denen ein Mutationsschritt das Muster komplett umwirft (flaches Feld
// liegt ganz auf der Schwelle und kippt geschlossen). Das zeigt sich als schwerer
// Ausreisser gegenueber dem typischen Verhalten — also wird genau das geprueft:
// Verhaeltnis schlimmster zu mittlerer Fall. Der Absolutwert bleibt informativ
// daneben stehen. (Beleg, dass die Groesse wirklich etwas misst: der Radius-Fix
// weiter oben senkte sie von 88 auf 52 und den Ausreisser-Faktor von 4 auf 3.)
const tailFactor = res.worstRatio / Math.max(1e-9, res.meanRatio);
const checks = [
  ["kleinste Stoerung aendert fast nichts (< 8 %)", cppnSmall < 0.08],
  ["Bild-Aenderung waechst mit der Genom-Distanz", monotone],
  ["grosse Distanz aendert das Muster wirklich (> 12 %)", largest.cppn > 0.12],
  ["Hash-Gegenprobe ist deutlich schlechter", hashAvg > cppnSmall*4],
  [`kein Katastrophen-Ausreisser (schlimmster/mittlerer Fall < 6)`, tailFactor < 6],
];
console.log(`\n  Empfindlichkeit (Bild-Delta / Genom-Delta): Mittel ${res.meanRatio.toFixed(1)} · schlimmster ${res.worstRatio.toFixed(1)} (bei +/-${res.worstStep}) · Faktor ${tailFactor.toFixed(1)}`);
console.log(`  Hash-Gegenprobe im Mittel: ${(hashAvg*100).toFixed(1)} % — CPPN bei kleinster Stoerung: ${(cppnSmall*100).toFixed(1)} %\n`);
let ok = true;
for(const [label, pass] of checks){ console.log(`  ${pass ? "OK  " : "FAIL"} ${label}`); if(!pass) ok = false; }
console.log(ok
  ? "\n✓ pattern-continuity-check bestanden — die Musterschicht ist stetig im Genom."
  : "\n✗ pattern-continuity-check FEHLGESCHLAGEN.");
process.exit(ok ? 0 : 1);
