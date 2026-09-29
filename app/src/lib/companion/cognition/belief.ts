/**
 * Belief state (Blueprint §2-3): Vivi's own world model — she does NOT
 * automatically know what really happens. Player presence is *believed*
 * from the last time she actually saw them.
 */
import type { Perception } from "../npc/perception";
import { playerSim } from "@/lib/companion/player-ref";
import { emotions } from "./emotion";
import { recordEpisodic } from "./memory";

const GONE_AFTER_SEC = 45;
const RESEE_JOY_AFTER_SEC = 20;

export const belief = {
  playerBelievedPresent: false,
  lastSeenX: 0,
  lastSeenZ: 0,
  lastSeenAt: -1e12, // performance.now ms
  timeSinceSeenSec: 9999,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function tickBelief(dt: number, p: Perception, gameMinutes: number): void {
  const now = performance.now();
  // She sees the player if they are within her (generous) sensory range.
  const sees = p.playerVisible || p.playerNear || p.playerTalking;
  if (sees) {
    const gapSec = belief.lastSeenAt < 0 ? 0 : (now - belief.lastSeenAt) / 1000;
    if (gapSec > RESEE_JOY_AFTER_SEC && !belief.playerBelievedPresent) {
      // "Oh, da bist du ja wieder." — re-seeing after a believed absence.
      emotions.joy = clamp01(emotions.joy + 0.18);
      emotions.surprise = clamp01(emotions.surprise + 0.12);
      recordEpisodic("player_reappeared", "Du warst fort, und dann kamst du zurück.", {
        emotionalWeight: 0.45,
        gameMinutes,
      });
    }
    belief.playerBelievedPresent = true;
    belief.lastSeenX = playerSim.position.x;
    belief.lastSeenZ = playerSim.position.z;
    belief.lastSeenAt = now;
    belief.timeSinceSeenSec = 0;
  } else {
    belief.timeSinceSeenSec += dt;
    if (belief.playerBelievedPresent && belief.timeSinceSeenSec > GONE_AFTER_SEC) {
      // Not a real departure (the VR player is always in the room) — she
      // just loses track of where they are; mild attention drift.
      belief.playerBelievedPresent = false;
    }
  }
}
