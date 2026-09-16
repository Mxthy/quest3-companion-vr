/**
 * Neutral continuous intensity state (0–100).
 * Driven only by contact flags from colliders — no content policy in this module.
 */

export type IntensityBand = "low" | "mid" | "high" | "peak_build" | "peak";

export type IntensityConfig = {
  max: number;
  baseRatePerSec: number;
  holdMultiplier: number;
  burst: number;
  decayPerSec: number;
  decayAfterPeakPerSec: number;
  peakThreshold: number;
  postPeakLevel: number;
  cooldownSec: number;
};

export const DEFAULT_INTENSITY: IntensityConfig = {
  max: 100,
  baseRatePerSec: 8,
  holdMultiplier: 1.75,
  burst: 12,
  decayPerSec: 6,
  decayAfterPeakPerSec: 4,
  peakThreshold: 100,
  postPeakLevel: 35,
  cooldownSec: 12,
};

export function bandFor(value: number): IntensityBand {
  if (value >= 95) return "peak";
  if (value >= 75) return "peak_build";
  if (value >= 40) return "high";
  if (value >= 15) return "mid";
  return "low";
}

export type IntensityState = {
  value: number;
  band: IntensityBand;
  cooldownLeft: number;
  justPeaked: boolean;
  bandChanged: boolean;
  prevBand: IntensityBand;
};

export function createIntensityState(): IntensityState {
  return {
    value: 0,
    band: "low",
    cooldownLeft: 0,
    justPeaked: false,
    bandChanged: false,
    prevBand: "low",
  };
}

export function tickIntensity(
  state: IntensityState,
  dt: number,
  opts: {
    contacting: boolean;
    sensitivity: number;
    holding: boolean;
    cfg?: IntensityConfig;
  }
): IntensityState {
  const cfg = opts.cfg ?? DEFAULT_INTENSITY;
  let value = state.value;
  let cooldownLeft = Math.max(0, state.cooldownLeft - dt);
  let justPeaked = false;

  if (cooldownLeft > 0) {
    value = Math.max(cfg.postPeakLevel * 0.5, value - cfg.decayAfterPeakPerSec * dt);
  } else if (opts.contacting) {
    const mult = (opts.holding ? cfg.holdMultiplier : 1) * opts.sensitivity;
    value = Math.min(cfg.max, value + cfg.baseRatePerSec * mult * dt);
  } else {
    const decay =
      state.band === "peak" || value > cfg.postPeakLevel
        ? cfg.decayAfterPeakPerSec
        : cfg.decayPerSec;
    value = Math.max(0, value - decay * dt);
  }

  if (value >= cfg.peakThreshold && cooldownLeft <= 0) {
    justPeaked = true;
    value = cfg.postPeakLevel;
    cooldownLeft = cfg.cooldownSec;
  }

  const prevBand = state.band;
  const band = bandFor(value);
  return {
    value,
    band,
    cooldownLeft,
    justPeaked,
    bandChanged: band !== prevBand && !justPeaked,
    prevBand,
  };
}

export function applyBurst(state: IntensityState, cfg = DEFAULT_INTENSITY): IntensityState {
  if (state.cooldownLeft > 0) return state;
  const value = Math.min(cfg.max, state.value + cfg.burst);
  return { ...state, value, band: bandFor(value) };
}
