/** Engine-agnostic pleasure / arousal model for adult companion interactions. */

export type ArousalLevel = "idle" | "tease" | "hot" | "peak_build" | "orgasm";

export type PleasureConfig = {
  max: number;
  baseRatePerSec: number;
  grabMultiplier: number;
  intenseBurst: number;
  decayPerSec: number;
  decayAfterglowPerSec: number;
  orgasmThreshold: number;
  postOrgasmLevel: number;
  refractorySec: number;
};

export const DEFAULT_PLEASURE: PleasureConfig = {
  max: 100,
  baseRatePerSec: 8,
  grabMultiplier: 1.75,
  intenseBurst: 12,
  decayPerSec: 6,
  decayAfterglowPerSec: 4,
  orgasmThreshold: 100,
  postOrgasmLevel: 35,
  refractorySec: 12,
};

export function levelFor(arousal: number): ArousalLevel {
  if (arousal >= 95) return "orgasm";
  if (arousal >= 75) return "peak_build";
  if (arousal >= 40) return "hot";
  if (arousal >= 15) return "tease";
  return "idle";
}

export type PleasureState = {
  arousal: number;
  level: ArousalLevel;
  refractoryLeft: number;
  justOrgasm: boolean;
  levelChanged: boolean;
  prevLevel: ArousalLevel;
};

export function createPleasureState(): PleasureState {
  return {
    arousal: 0,
    level: "idle",
    refractoryLeft: 0,
    justOrgasm: false,
    levelChanged: false,
    prevLevel: "idle",
  };
}

export function tickPleasure(
  state: PleasureState,
  dt: number,
  opts: {
    touching: boolean;
    sensitivity: number;
    grabbing: boolean;
    cfg?: PleasureConfig;
  }
): PleasureState {
  const cfg = opts.cfg ?? DEFAULT_PLEASURE;
  let arousal = state.arousal;
  let refractoryLeft = Math.max(0, state.refractoryLeft - dt);
  let justOrgasm = false;

  if (refractoryLeft > 0) {
    arousal = Math.max(cfg.postOrgasmLevel * 0.5, arousal - cfg.decayAfterglowPerSec * dt);
  } else if (opts.touching) {
    const mult = (opts.grabbing ? cfg.grabMultiplier : 1) * opts.sensitivity;
    arousal = Math.min(cfg.max, arousal + cfg.baseRatePerSec * mult * dt);
  } else {
    const decay =
      state.level === "orgasm" || arousal > cfg.postOrgasmLevel
        ? cfg.decayAfterglowPerSec
        : cfg.decayPerSec;
    arousal = Math.max(0, arousal - decay * dt);
  }

  if (arousal >= cfg.orgasmThreshold && refractoryLeft <= 0) {
    justOrgasm = true;
    arousal = cfg.postOrgasmLevel;
    refractoryLeft = cfg.refractorySec;
  }

  const prevLevel = state.level;
  const level = levelFor(arousal);
  return {
    arousal,
    level,
    refractoryLeft,
    justOrgasm,
    levelChanged: level !== prevLevel && !justOrgasm,
    prevLevel,
  };
}

export function applyIntenseBurst(state: PleasureState, cfg = DEFAULT_PLEASURE): PleasureState {
  if (state.refractoryLeft > 0) return state;
  const arousal = Math.min(cfg.max, state.arousal + cfg.intenseBurst);
  return { ...state, arousal, level: levelFor(arousal) };
}
