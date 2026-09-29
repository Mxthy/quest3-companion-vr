/**
 * Attention (LIDA-style attention step): what is currently salient?
 * Urgency-weighted focus on player/objects/sounds; spikes on events and
 * decays back to the activity background. Gaze and brain consume this.
 */
import { playerSim } from "@/lib/companion/player-ref";
import { interactablePos } from "../npc/brain";
import type { Perception } from "../npc/perception";
import type { Intent } from "../npc/brain";
import { emotions } from "./emotion";

export type AttentionKind = "player" | "object" | "none";

export type AttentionFocus = {
  kind: AttentionKind;
  objectId: string | null;
  urgency: number; // 0..1
  objectX: number;
  objectZ: number;
};

export const attention: AttentionFocus = {
  kind: "none",
  objectId: null,
  urgency: 0,
  objectX: 0,
  objectZ: 0,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** External spike: something happened that deserves attention now. */
export function spikeAttention(kind: AttentionKind, objectId: string | null, urgency: number): void {
  if (urgency >= attention.urgency * 0.6) {
    attention.kind = kind;
    attention.objectId = objectId;
    attention.urgency = clamp01(Math.max(attention.urgency, urgency));
    if (kind === "object" && objectId) {
      const p = interactablePos(objectId);
      if (p) {
        attention.objectX = p.x;
        attention.objectZ = p.z;
      }
    }
  }
}

export function tickAttention(dt: number, p: Perception, intent: Intent): void {
  // Passive salience: a talking, close player is always somewhat salient.
  const playerSalience =
    (p.playerNear ? 0.35 : 0) +
    (p.playerTalking ? 0.45 : 0) +
    (p.playerVisible && p.playerDistance < 3.5 ? 0.15 : 0) +
    emotions.surprise * 0.3;

  // Decay current urgency.
  attention.urgency = clamp01(attention.urgency - dt * 0.18);

  // The brain's own intent sets the activity background.
  if (attention.kind !== "player" || attention.urgency < playerSalience) {
    if (playerSalience > 0.45) {
      attention.kind = "player";
      attention.objectId = null;
      attention.urgency = clamp01(Math.max(attention.urgency, playerSalience));
    } else if (intent.kind === "attend" && intent.targetId) {
      const pos = interactablePos(intent.targetId);
      if (pos) {
        attention.kind = "object";
        attention.objectId = intent.targetId;
        attention.objectX = pos.x;
        attention.objectZ = pos.z;
        attention.urgency = clamp01(Math.max(attention.urgency, 0.3));
      }
    } else if (attention.urgency < 0.2) {
      attention.kind = "none";
      attention.objectId = null;
    }
  }

  if (attention.kind === "player") {
    attention.objectX = playerSim.position.x;
    attention.objectZ = playerSim.position.z;
  }
}
