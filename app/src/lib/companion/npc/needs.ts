/**
 * Needs model (Blueprint §5): slow-moving 0..1 drives that make the NPC
 * decide instead of looping one animation.
 */
import type { Perception } from "./perception";

export type Needs = {
  energy: number;
  social: number;
  boredom: number;
  hunger: number;
};

export type NeedMode = "sleep" | "rest" | "active" | "idle";

export function initialNeeds(): Needs {
  return { energy: 0.85, social: 0.6, boredom: 0.25, hunger: 0.3 };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function tickNeeds(needs: Needs, dt: number, p: Perception, mode: NeedMode): Needs {
  if (mode === "sleep") {
    needs.energy = clamp01(needs.energy + dt * 0.02);
  } else if (mode === "rest") {
    needs.energy = clamp01(needs.energy + dt * 0.004);
  } else if (p.awake) {
    needs.energy = clamp01(needs.energy - dt * 0.0015);
  }
  if (p.playerTalking) {
    needs.social = clamp01(needs.social + dt * 0.05);
  } else if (p.playerNear) {
    needs.social = clamp01(needs.social + dt * 0.01);
  } else {
    needs.social = clamp01(needs.social - dt * 0.002);
  }
  if (mode === "active") {
    needs.boredom = clamp01(needs.boredom - dt * 0.02);
  } else if (mode !== "sleep") {
    needs.boredom = clamp01(needs.boredom + dt * 0.004);
  }
  needs.hunger = clamp01(needs.hunger + dt * 0.0008);
  return needs;
}
