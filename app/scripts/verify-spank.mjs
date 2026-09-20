#!/usr/bin/env node
import { chromium } from "playwright";
const URL = (process.env.Q3_BASE ?? "http://127.0.0.1:8080") + "/?debug=1";
const EXPECTED_404 = "/models/vivi.vrm";
const log = (...a) => console.log(...a);
const q = (expr) => page.evaluate(expr);
const wait = (ms) => page.waitForTimeout(ms);

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

await page.goto(URL, { waitUntil: "domcontentloaded" });
const gateBtn = page.getByRole("button", { name: "Ich bin 18+ — weiter" });
await gateBtn.waitFor({ timeout: 30000 });
await page.waitForTimeout(600);
let gateDone = false;
for (let attempt = 0; attempt < 3 && !gateDone; attempt++) {
  await gateBtn.click();
  await page.waitForTimeout(400);
  gateDone = (await page.getByRole("button", { name: "Den Raum betreten" }).count()) > 0;
}
if (!gateDone) throw new Error("18+ gate did not confirm after 3 clicks");
const enterBtn = page.getByRole("button", { name: "Den Raum betreten" });
await enterBtn.waitFor({ timeout: 15000 });
let entered = false;
for (let attempt = 0; attempt < 3 && !entered; attempt++) {
  await enterBtn.click();
  await page.waitForTimeout(500);
  entered = (await page.getByText("Nähe").count()) > 0;
}
if (!entered) throw new Error("enter did not start playing phase");
log("GATE+ENTER: ok");

// 1-3) Position synthetically behind her (real input path stays for aim + Q)
await q("window.__quest.teleport(0, -2.35, Math.PI)");
await wait(700);
let pos = await q("window.__quest.camera().pos");
log("BEHIND: pos =", pos.map((v) => v.toFixed(2)).join(", "), "| near =", await q("window.__quest.state().nearElara"));
let dir = await q("window.__quest.camera().dir");
log("FACE: dir =", dir.map((v) => v.toFixed(2)).join(", "));

// 4) Aim down until a glute zone is under the crosshair
let hud = await q("window.__quest.adult()");
await page.mouse.move(640, 400);
await page.mouse.down();
let dragY = 400;
for (let i = 0; i < 46 && !(hud.activeZone === "glute_l" || hud.activeZone === "glute_r"); i++) {
  dragY += 14;
  await page.mouse.move(640, dragY, { steps: 2 });
  await wait(90);
  hud = await q("window.__quest.adult()");
}
await page.mouse.up();
log("AIM: activeZone =", hud.activeZone, "| near =", await q("window.__quest.state().nearElara"));

// 5) Spank with Q
const bond0 = await q("window.__quest.state().bond");
let speech = null;
for (let i = 0; i < 3; i++) {
  await page.keyboard.down("q"); await wait(140); await page.keyboard.up("q");
  await wait(350);
  speech = await q("window.__quest.state().speech");
}
const st = await q("window.__quest.state()");
log("SPANK: bond", bond0, "->", st.bond, "| speech =", JSON.stringify(speech));
await page.screenshot({ path: "/workspace/screenshots/verify-spank.png" });
log("VERDICT:", hud.activeZone === "glute_l" || hud.activeZone === "glute_r" ? "ZONE+Q reached" : "glute zone NOT reached");
log("CONSOLE ERRORS:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
