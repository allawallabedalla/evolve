// Smoke-Test der Live-App inkl. der neuen „Lebende Welt (Beta)":
//  1. App bootet ohne (fatale) Konsolen-Fehler; das Einzel-Wesen rendert.
//  2. Der Welt-Knopf existiert und öffnet das Overlay.
//  3. Nach Boot zeigt die Welt Orte (Karte) und emergente Arten (Chronik).
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

  // 2) Overlay öffnen
  await page.click("#worldBtn");
  await page.waitForSelector(".wl-place", { timeout: 20000 });
  const places = await page.locator(".wl-place").count();
  console.log(`  Welt-Overlay: Orte gerendert:     ${places >= 3 ? "OK" : "FAIL"} (${places})`);

  // 3) Chronik nach ein paar Steps
  await page.waitForTimeout(1500);
  const species = await page.locator("#wlChronik li").count();
  const rarityBadges = await page.locator("#wlChronik .rar").count();
  console.log(`  Welt-Overlay: Chronik-Arten:      ${species >= 1 ? "OK" : "FAIL"} (${species})`);
  console.log(`  Rarität annotiert:                ${rarityBadges >= 1 ? "OK" : "FAIL"} (${rarityBadges})`);

  // 4) Veränderung: Katastrophe klickt ohne Fehler
  await page.click("#wlCat");
  await page.waitForTimeout(300);

  // 5) Schließen
  await page.click("#worldClose");
  const closed = await page.locator("#world").getAttribute("hidden");
  console.log(`  Overlay schließt:                 ${closed !== null ? "OK" : "FAIL"}`);

  const fatal = errors.filter((e) => !/supabase|fetch|network|Failed to load resource|ERR_/i.test(e));
  console.log(`  Keine fatalen JS-Fehler:          ${fatal.length === 0 ? "OK" : "FAIL"}`);
  if (fatal.length) fatal.forEach((e) => console.log("      • " + e));

  const ok = hasKingdom && hasWorldBtn && places >= 3 && species >= 1 && rarityBadges >= 1 && closed !== null && fatal.length === 0;
  await browser.close();
  console.log(ok ? "\nStatus: OK — App bootet, Lebende Welt läuft im Overlay, Einzel-Wesen unberührt." : "\nStatus: FAIL.");
  done(ok ? 0 : 1);
} catch (err) {
  console.error("Smoke-Test-Fehler:", err.message);
  if (errors.length) errors.forEach((e) => console.log("      • " + e));
  if (browser) await browser.close().catch(() => {});
  done(1);
}
