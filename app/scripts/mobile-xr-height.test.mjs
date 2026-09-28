import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DESKTOP_STANDING_EYE_HEIGHT,
  MOBILE_STANDING_EYE_HEIGHT,
  PHONE_XR_EYE_HEIGHT,
  nonXrStandingEyeHeight,
  shouldStandFromMovement,
  xrOriginHeightCorrection,
} from "../src/lib/companion/view-height.mjs";

test("touch movement leaves the seated state", () => {
  assert.equal(shouldStandFromMovement(0, 0, false), false);
  assert.equal(shouldStandFromMovement(0.2, 0, false), true);
  assert.equal(shouldStandFromMovement(0, 0, true), true);
});

test("mobile and desktop use deliberate non-XR eye heights", () => {
  assert.equal(nonXrStandingEyeHeight(false), DESKTOP_STANDING_EYE_HEIGHT);
  assert.equal(nonXrStandingEyeHeight(true), MOBILE_STANDING_EYE_HEIGHT);
  assert.ok(MOBILE_STANDING_EYE_HEIGHT < DESKTOP_STANDING_EYE_HEIGHT);
});

test("phone XR floor poses are corrected without moving tracked headsets", () => {
  assert.equal(xrOriginHeightCorrection(0, false), PHONE_XR_EYE_HEIGHT);
  assert.equal(xrOriginHeightCorrection(0.12, false), PHONE_XR_EYE_HEIGHT - 0.12);
  assert.equal(xrOriginHeightCorrection(0, true), 0);
  assert.equal(xrOriginHeightCorrection(1.2, false), 0);
});

test("mobile overlay exposes an explicit stand button", () => {
  const overlay = readFileSync(new URL("../src/components/companion/overlay.tsx", import.meta.url), "utf8");
  assert.match(overlay, /onClick=\{stand\}/);
  assert.match(overlay, />\s*Aufstehen\s*</);
});
