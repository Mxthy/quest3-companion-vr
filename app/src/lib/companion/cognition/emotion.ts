/**
 * Emotion via appraisal (Blueprint §8): EVENT → APPRAISAL → emotion vector.
 * Values decay with individual half-lives; the dominant emotion feeds the
 * facial expression and micro-behavior selection.
 */
import type { NpcEvent } from "../npc/events";
import type { Traits } from "./traits";

export type EmotionName =
  | "joy"
  | "affection"
  | "surprise"
  | "sadness"
  | "fear"
  | "frustration";

export type EmotionVector = Record<EmotionName, number>;

/** Per-second decay rates — surprise fades fast, sadness lingers. */
const DECAY: EmotionVector = {
  joy: 0.055,
  affection: 0.03,
  surprise: 0.12,
  sadness: 0.02,
  fear: 0.08,
  frustration: 0.045,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const emotions: EmotionVector = {
  joy: 0.1,
  affection: 0.15,
  surprise: 0,
  sadness: 0,
  fear: 0,
  frustration: 0,
};

export type AppraisalContext = {
  traits: Traits;
  relationship: number; // 0..5
  playerNear: boolean;
};

/** Appraise a world event into emotion deltas. */
export function appraise(event: NpcEvent, ctx: AppraisalContext): void {
  const { traits, relationship } = ctx;
  const relBoost = 0.6 + Math.min(1, relationship / 5) * 0.4;
  switch (event) {
    case "player_entered":
      emotions.surprise = clamp01(emotions.surprise + 0.25 * relBoost);
      emotions.joy = clamp01(
        emotions.joy + (0.15 + traits.sociability * 0.2) * relBoost,
      );
      break;
    case "player_talked":
      emotions.affection = clamp01(
        emotions.affection + (0.08 + traits.sensitivity * 0.12) * relBoost,
      );
      emotions.joy = clamp01(emotions.joy + 0.06 * relBoost);
      break;
    case "player_touched":
      emotions.surprise = clamp01(emotions.surprise + 0.3);
      emotions.affection = clamp01(
        emotions.affection + (0.1 + traits.sensitivity * 0.25) * relBoost,
      );
      break;
    case "player_near":
      emotions.affection = clamp01(emotions.affection + 0.04 * relBoost);
      break;
    case "object_used":
      emotions.joy = clamp01(emotions.joy + 0.05 * relBoost);
      break;
  }
}

/** Continuous appraisals that are not discrete events. */
export function appraiseAmbient(dt: number, ctx: {
  playerNear: boolean;
  boredom: number;
  patience: number;
}): void {
  // Unmet boredom + absent player slowly grows frustration (patience buffers).
  if (!ctx.playerNear && ctx.boredom > 0.6) {
    const rate = (ctx.boredom - 0.6) * (1.4 - ctx.patience) * 0.01;
    emotions.frustration = clamp01(emotions.frustration + rate * dt);
  }
}

export function tickEmotion(dt: number): void {
  for (const k of Object.keys(emotions) as EmotionName[]) {
    emotions[k] = clamp01(emotions[k] - DECAY[k] * dt * (0.7 + emotions[k]));
  }
}

export type DominantEmotion = { name: EmotionName; intensity: number } | null;

export function dominantEmotion(threshold = 0.25): DominantEmotion {
  let best: DominantEmotion = null;
  for (const k of Object.keys(emotions) as EmotionName[]) {
    if (emotions[k] > (best?.intensity ?? threshold)) {
      best = { name: k, intensity: emotions[k] };
    }
  }
  return best;
}

/** Map dominant emotion onto the VRM expression presets. */
export function expressionFromEmotion(d: DominantEmotion): string | null {
  if (!d) return null;
  switch (d.name) {
    case "joy":
      return "happy";
    case "affection":
      return "relaxed";
    case "surprise":
      return "surprised";
    case "sadness":
      return "sad";
    case "fear":
      return "surprised";
    case "frustration":
      return "angry";
    default:
      return null;
  }
}
