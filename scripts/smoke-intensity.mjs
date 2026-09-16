#!/usr/bin/env node
/** Minimal smoke test without TS compile (mirrors IntensityModel logic). */

function bandFor(value) {
  if (value >= 95) return "peak";
  if (value >= 75) return "peak_build";
  if (value >= 40) return "high";
  if (value >= 15) return "mid";
  return "low";
}

function tick(state, dt, { contacting, sensitivity, holding }) {
  const cfg = {
    max: 100,
    baseRatePerSec: 8,
    holdMultiplier: 1.75,
    decayPerSec: 6,
    peakThreshold: 100,
    postPeakLevel: 35,
    cooldownSec: 12,
  };
  let value = state.value;
  let cooldownLeft = Math.max(0, state.cooldownLeft - dt);
  let justPeaked = false;
  if (cooldownLeft > 0) {
    value = Math.max(0, value - 4 * dt);
  } else if (contacting) {
    const mult = (holding ? cfg.holdMultiplier : 1) * sensitivity;
    value = Math.min(cfg.max, value + cfg.baseRatePerSec * mult * dt);
  } else {
    value = Math.max(0, value - cfg.decayPerSec * dt);
  }
  if (value >= cfg.peakThreshold && cooldownLeft <= 0) {
    justPeaked = true;
    value = cfg.postPeakLevel;
    cooldownLeft = cfg.cooldownSec;
  }
  return { value, band: bandFor(value), cooldownLeft, justPeaked };
}

let s = { value: 0, cooldownLeft: 0 };
for (let i = 0; i < 40; i++) {
  s = tick(s, 0.25, { contacting: true, sensitivity: 1.2, holding: true });
}
if (s.value < 50) {
  console.error("FAIL: expected intensity to rise", s);
  process.exit(1);
}
console.log("OK intensity rose →", s.band, s.value.toFixed(1));

for (let i = 0; i < 80; i++) {
  s = tick(s, 0.25, { contacting: true, sensitivity: 1.45, holding: true });
  if (s.justPeaked) {
    console.log("OK peak event", s);
    process.exit(0);
  }
}
console.error("FAIL: no peak", s);
process.exit(1);
