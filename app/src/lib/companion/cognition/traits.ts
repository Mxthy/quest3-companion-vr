/**
 * Personality traits (Blueprint §9): a persona is only real if its numbers
 * measurably shape behavior. Rolled once per session alongside the persona.
 */
export type Traits = {
  curiosity: number;
  sociability: number;
  independence: number;
  patience: number;
  impulsiveness: number;
  playfulness: number;
  sensitivity: number;
  stubbornness: number;
};

const rnd = () => Math.random();
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function rollTraits(): Traits {
  // Base archetype with per-session jitter: a coherent person, not 8 dices.
  const base: Traits = {
    curiosity: 0.6,
    sociability: 0.65,
    independence: 0.5,
    patience: 0.55,
    impulsiveness: 0.4,
    playfulness: 0.55,
    sensitivity: 0.6,
    stubbornness: 0.4,
  };
  return {
    curiosity: clamp01(base.curiosity + (rnd() - 0.5) * 0.5),
    sociability: clamp01(base.sociability + (rnd() - 0.5) * 0.5),
    independence: clamp01(base.independence + (rnd() - 0.5) * 0.5),
    patience: clamp01(base.patience + (rnd() - 0.5) * 0.5),
    impulsiveness: clamp01(base.impulsiveness + (rnd() - 0.5) * 0.5),
    playfulness: clamp01(base.playfulness + (rnd() - 0.5) * 0.5),
    sensitivity: clamp01(base.sensitivity + (rnd() - 0.5) * 0.5),
    stubbornness: clamp01(base.stubbornness + (rnd() - 0.5) * 0.5),
  };
}

/** Session singleton — read by brain, emotion and microbehavior. */
export const TRAITS: Traits = rollTraits();
