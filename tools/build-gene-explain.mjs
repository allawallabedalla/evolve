// Erzeugt app/gene-explain.js aus einer geprüften Zulieferung (Paket P6).
// Ablauf:  node tools/gene-import-check.mjs <datei>   (muss bestehen)
//     dann node tools/build-gene-explain.mjs <datei>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/app-core.mjs";

const src = process.argv[2] || join(ROOT, "docs", "auslagerung", "P6-ausgabe.json");
const html = readFileSync(join(ROOT, "app", "index.html"), "utf-8");
const GENE_LABELS = eval(html.match(/const GENE_LABELS = \[.*?\];/)[0].replace("const GENE_LABELS = ", "").replace(/;$/, ""));
const data = JSON.parse(readFileSync(src, "utf-8"));

const out = GENE_LABELS.map((_, i) => {
  const e = data[i] ?? data[String(i)];
  return e && e.erklaerung ? e.erklaerung : "";
});
const missing = out.filter(x => !x).length;
if (missing) { console.error(`build-gene-explain: ${missing} Gene ohne Erklärung — Zulieferung unvollständig, nichts geschrieben.`); process.exit(1); }

const body = `// AUTO-GENERIERT aus ${src.split("/").slice(-2).join("/")} (externe Zulieferung,
// geprüft mit tools/gene-import-check.mjs). Nicht von Hand editieren.
// Index entspricht GENE_LABELS in app/index.html.
window.GENE_EXPLAIN = ${JSON.stringify(out, null, 1)};
`;
writeFileSync(join(ROOT, "app", "gene-explain.js"), body);
console.log(`gene-explain.js: ${out.length} Gen-Erklärungen geschrieben.`);
