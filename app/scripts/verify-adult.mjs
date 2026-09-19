#!/usr/bin/env node
import { chromium } from "playwright";

const URL = "http://127.0.0.1:8080/?debug=1";
// expected: /models/vivi.vrm 404 until Phase 2 asset lands
const EXPECTED_404 = "/models/vivi.vrm";
const shots = "/workspace/screenshots";
const log = (...a) => console.log(...a);
const q = (expr) => page.evaluate(expr);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const url = m.location()?.url || "";
  if (url.includes(EXPECTED_404)) return;
  errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Ich bin 18+ — weiter" }).click();
await page.getByRole("button", { name: "Den Raum betreten" }).click();
await page.getByText("Nähe").first().waitFor({ timeout: 15000 });
log("GATE+ENTER: ok");

// Walk until near Elara
let near = false;
for (let i = 0; i < 40 && !near; i++) {
  await page.keyboard.down("w"); await page.waitForTimeout(300); await page.keyboard.up("w");
  near = await q("window.__quest.state().nearElara");
}
log("WALK: nearElara =", near, "| bond =", await q("window.__quest.state().bond"));

// Aim down until the center ray is inside a zone (look = touch)
let zone = null;
await page.mouse.move(640, 400);
await page.mouse.down();
for (let i = 0; i < 24 && !zone; i++) {
  await page.mouse.move(640, 400 + i * 14, { steps: 2 });
  await page.waitForTimeout(120);
  zone = await q("window.__quest.adult().activeZone");
}
await page.mouse.up();
log("AIM: activeZone =", zone);
await page.waitForTimeout(400);
log("SPEECH after zone enter:", JSON.stringify(await q("window.__quest.state().speech")));

// F/G bursts
let lastLevel = null;
for (let i = 0; i < 10; i++) {
  await page.keyboard.down("f"); await page.waitForTimeout(900); await page.keyboard.up("f");
  await page.keyboard.down("g"); await page.waitForTimeout(600); await page.keyboard.up("g");
  const hud = await q("window.__quest.adult()");
  if (hud.level !== lastLevel) { lastLevel = hud.level; log("  burst", i + 1, "arousal=", hud.arousal.toFixed(1), "level=", hud.level, "zone=", hud.activeZone); }
}
await page.waitForTimeout(800);
const hud = await q("window.__quest.adult()");
const st = await q("window.__quest.state()");
log("RESULT: arousal=", hud.arousal.toFixed(1), "level=", hud.level, "zone=", hud.activeZone, "refractory=", hud.refractory);
log("RESULT: bond=", st.bond, "speech=", JSON.stringify(st.speech).slice(0, 140));
await page.screenshot({ path: shots + "/verify-adult-hud.png" });
log("HUD: Erregung widget visible =", (await page.getByText("Erregung").count()) > 0);
log("CONSOLE ERRORS:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
