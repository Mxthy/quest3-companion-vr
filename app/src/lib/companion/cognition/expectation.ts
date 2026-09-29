/**
 * Expectation (Blueprint §5): learned routines create expectations; a
 * confirmed expectation raises joy, a violated one sadness — and both are
 * remembered. Predictions also drive attention (anticipation glances).
 */
import { emotions } from "./emotion";
import { recordEpisodic } from "./memory";
import { noteArrival } from "./player-model";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const expectation = {
  /** Learned probability that the player shows up around now. */
  arrivalExpected: 0,
  arrivalHour: -1,
};

/**
 * Called at session start (player_entered): evaluates the prediction BEFORE
 * reinforcing it — the prediction/confirmation loop from the blueprint.
 */
export function onPlayerArrived(gameMinutes: number): void {
  const h = Math.floor(gameMinutes / 60) % 24;
  const expected = noteArrival(gameMinutes);
  expectation.arrivalExpected = expected;
  expectation.arrivalHour = h;

  if (expected > 0.45) {
    // prediction confirmed → joy, and she remembers expecting you
    emotions.joy = clamp01(emotions.joy + 0.25);
    emotions.affection = clamp01(emotions.affection + 0.1);
    recordEpisodic(
      "arrival_confirmed",
      "Du kamst, wie Vivi es erwartet hatte.",
      { emotionalWeight: 0.5, gameMinutes },
    );
  } else {
    recordEpisodic("arrival", "Du kamst in die Wohnung.", {
      emotionalWeight: 0.25,
      gameMinutes,
    });
  }
}

/** Predicted-object anticipation: she glances where you are heading. */
export function anticipateFromPrediction(predictedObject: string | null): void {
  if (!predictedObject) return;
  // Small affection from attentive anticipation; the attention spike itself
  // is raised by the caller (core) via spikeAttention.
  emotions.affection = clamp01(emotions.affection + 0.005);
}
