/**
 * Semantic voice-clip schema (Blueprint §15): every authored line carries
 * intent/trigger/mood/relationship/priority/cooldown/object/animation/lookAt
 * metadata so the brain can decide *which* line fits a situation.
 */
export type VoiceClip = {
  id: string;
  text: string;
  file: string;
  style: string;
  intent: string;
  trigger: string;
  moods: string[];
  relationshipMin: number;
  requiresConsent: boolean;
  priority: number;
  cooldownSec: number;
  requiredObject: string | null;
  animation: string;
  lookAt: "player" | "away";
  fallback: string | null;
  intensity: number | null;
  interaction: string | null;
};

export type VoiceQuery = {
  intent: string;
  interaction?: string | null;
  /** 0..5 relationship level (trust-derived). */
  relationship: number;
  consent: boolean;
  object?: string | null;
  /** Activity queries must match the object exactly. */
  requireObject?: boolean;
  /** Touch: only lines at or below this intensity (0..1). */
  maxIntensity?: number;
};
