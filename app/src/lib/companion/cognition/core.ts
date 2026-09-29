/**
 * Vivi cognitive core (Phase 1, LIDA-inspired): wires perception →
 * attention → emotion together and exposes one frame tick. The NPC brain
 * (utility intents) consumes attention/emotion implicitly via the render
 * layer; traits reshape its utility scores directly.
 */
import { useCompanion } from "@/lib/companion/store";
import { onNpc, type NpcEvent } from "../npc/events";
import { perceive, type Perception } from "../npc/perception";
import type { Intent } from "../npc/brain";
import { appraise, appraiseAmbient, tickEmotion, dominantEmotion } from "./emotion";
import { attention, spikeAttention, tickAttention } from "./attention";
import { tickMicro, microState } from "./micro";
import { TRAITS } from "./traits";

let initialized = false;

export function relationshipStage(): number {
  return useCompanion.getState().companion.trust / 20;
}

export function initCognition(): void {
  if (initialized) return;
  initialized = true;
  onNpc((e: NpcEvent) => {
    const st = useCompanion.getState();
    const ctx = {
      traits: TRAITS,
      relationship: relationshipStage(),
      playerNear: st.nearElara ?? false,
    };
    appraise(e, ctx);
    switch (e) {
      case "player_entered":
      case "player_touched":
      case "player_talked":
        spikeAttention("player", null, e === "player_entered" ? 0.9 : 0.75);
        break;
      case "object_used":
        // She notices what the player touches — object attention spike.
        spikeAttention("object", st.lookId, 0.55);
        break;
      case "player_near":
        spikeAttention("player", null, 0.5);
        break;
    }
  });
}

/** One cognition tick per frame; call after the brain tick. */
export type NeedsSnapshot = { energy: number; boredom: number };

export function tickCognition(
  dt: number,
  p: Perception,
  intent: Intent,
  playing: boolean,
  needs: NeedsSnapshot,
): void {
  if (!playing) return;
  tickEmotion(dt);
  tickAttention(dt, p, intent);
  const { energy, boredom } = needs;
  appraiseAmbient(dt, { playerNear: p.playerNear, boredom, patience: TRAITS.patience });
  tickMicro(dt, {
    traits: TRAITS,
    emotions: emotionsRef,
    energy,
    boredom,
    attention,
    playerNear: p.playerNear,
  });
}

// Emotions are a plain record — import the live object for the context.
import { emotions as emotionsRef } from "./emotion";

export { dominantEmotion, attention, microState, TRAITS };
