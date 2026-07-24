// Smoke-Test der Live-App inkl. des neuen Umwelt-Einfluss-Modals:
//  1. App bootet ohne (fatale) Konsolen-Fehler; das Einzel-Wesen rendert.
//  2. Der Knopf „Umwelt-Einfluss auslösen" öffnet das geschachtelte Modal.
//  3. Kategorie -> Sub-Modal (Faktoren + Erklärsatz) -> echten Faktor wählen -> Auslösen
//     ändert die Umwelt DES WESENS (biomeTag = Faktorname). Das alte Metapopulations-
//     Overlay ist zurückgezogen (Code bleibt, nicht verdrahtet).
// Läuft headless via playwright-core + vorinstalliertem Chromium.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8123;
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: join(ROOT, "app"), stdio: "ignore" });
const done = (code) => { server.kill("SIGKILL"); process.exit(code); };
await new Promise((r) => setTimeout(r, 800));

const errors = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "load", timeout: 15000 });
  await page.waitForTimeout(700);

  // 1) Einzel-Wesen-Ansicht da?
  const hasKingdom = await page.locator("#kingdom").count();
  const hasWorldBtn = await page.locator("#worldBtn").isVisible().catch(() => false);
  console.log(`  App-Kernansicht (#kingdom):       ${hasKingdom ? "OK" : "FAIL"}`);
  console.log(`  Welt-Knopf sichtbar:              ${hasWorldBtn ? "OK" : "FAIL"}`);

  // 2) Einfluss-Modal öffnen (Kategorien)
  await page.click("#worldBtn");
  await page.waitForSelector("#infl:not([hidden]) .infl-cat", { timeout: 10000 });
  const cats = await page.locator(".infl-cat").count();
  console.log(`  Einfluss-Modal: Kategorien:       ${cats >= 8 ? "OK" : "FAIL"} (${cats})`);

  // 3) Kategorie -> Sub-Modal mit Faktoren (jeder mit Erklärsatz)
  await page.locator(".infl-cat").first().click();
  await page.waitForSelector("#inflSub:not([hidden]) .infl-factor", { timeout: 5000 });
  const factors = await page.locator("#inflFactors .infl-factor").count();
  const descs = await page.locator("#inflFactors .infl-factor .fd").count();
  console.log(`  Sub-Modal: Faktoren + Erklärung:  ${factors >= 3 && descs === factors ? "OK" : "FAIL"} (${factors})`);

  // 4) echten Faktor wählen -> OK aktiv
  const factorName = (await page.locator("#inflFactors .infl-factor:not(.soon) .fn").first().textContent()).trim();
  await page.locator("#inflFactors .infl-factor:not(.soon)").first().click();
  const okEnabled = await page.locator("#inflOk").isEnabled();
  console.log(`  Faktor wählbar, OK aktiv:         ${okEnabled ? "OK" : "FAIL"}`);

  // 5) Auslösen -> Modal schließt, Umwelt DES WESENS geändert (biomeTag = Faktorname)
  await page.click("#inflOk");
  await page.waitForTimeout(300);
  const inflClosed = await page.locator("#infl").getAttribute("hidden");
  const tag = (await page.locator("#biomeTag").textContent()).trim();
  console.log(`  Auslösen schließt Modal:          ${inflClosed !== null ? "OK" : "FAIL"}`);
  console.log(`  Umwelt des Wesens geändert:       ${tag === factorName ? "OK" : "FAIL"} (${tag})`);

  const fatal = errors.filter((e) => !/supabase|fetch|network|Failed to load resource|ERR_/i.test(e));
  console.log(`  Keine fatalen JS-Fehler:          ${fatal.length === 0 ? "OK" : "FAIL"}`);
  if (fatal.length) fatal.forEach((e) => console.log("      • " + e));

  const ok = hasKingdom && hasWorldBtn && cats >= 8 && factors >= 3 && descs === factors && okEnabled && inflClosed !== null && tag === factorName && fatal.length === 0;
  await browser.close();
  console.log(ok ? "\nStatus: OK — App bootet, Umwelt-Einfluss-Modal wirkt aufs Wesen, keine fatalen Fehler." : "\nStatus: FAIL.");
  done(ok ? 0 : 1);
} catch (err) {
  console.error("Smoke-Test-Fehler:", err.message);
  if (errors.length) errors.forEach((e) => console.log("      • " + e));
  if (browser) await browser.close().catch(() => {});
  done(1);
}
