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
import { recordEpisodic } from "./memory";
import { noteInteraction, observeLook, playerModel, tickPlayerModel } from "./player-model";
import { expectation, onPlayerArrived, anticipateFromPrediction } from "./expectation";
import { loadCognition, markDirty, saveCognition } from "./persist";
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
  loadCognition();
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
        spikeAttention("player", null, 0.9);
        // Prediction loop: learned routine vs. this arrival, then reinforce.
        onPlayerArrived(st.gameMinutes);
        noteInteraction("enter");
        markDirty();
        break;
      case "player_talked":
        spikeAttention("player", null, 0.75);
        noteInteraction("talk");
        recordEpisodic("talk", "Du hast mit ihr geredet.", {
          emotionalWeight: 0.3,
          gameMinutes: st.gameMinutes,
        });
        break;
      case "player_touched":
        spikeAttention("player", null, 0.75);
        noteInteraction("touch");
        recordEpisodic("touch", "Du hast sie berührt.", {
          emotionalWeight: 0.4,
          gameMinutes: st.gameMinutes,
        });
        break;
      case "player_left":
        recordEpisodic("departure", "Du hast die Wohnung verlassen.", {
          emotionalWeight: 0.3,
          gameMinutes: st.gameMinutes,
        });
        markDirty();
        saveCognition(true);
        break;
      case "object_used":
        // She notices what the player touches — object attention spike.
        spikeAttention("object", st.lookId, 0.55);
        noteInteraction("object");
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

  // Player model learning: gaze dwell + interaction time.
  const st = useCompanion.getState();
  observeLook(st.lookId, dt);
  tickPlayerModel(dt, p.playerNear);
  // Anticipation: occasional glance at the predicted object (Blueprint §7).
  if (playerModel.predictedObject && Math.random() < dt * 0.12) {
    anticipateFromPrediction(playerModel.predictedObject);
    spikeAttention("object", playerModel.predictedObject, 0.5);
  }
  saveCognition();

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

export { dominantEmotion, attention, microState, TRAITS, expectation, playerModel };
