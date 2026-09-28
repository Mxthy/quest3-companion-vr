/**
 * Perception snapshot (Blueprint §3): the brain never reads the world
 * directly, it only ever sees this struct.
 */
import { playerSim } from "@/lib/companion/player-ref";
import { isAwakeHour, isNight } from "@/lib/companion/personality/schedule";

export type Perception = {
  playerDistance: number;
  playerVisible: boolean;
  playerNear: boolean;
  playerTalking: boolean;
  hour: number;
  awake: boolean;
  night: boolean;
};

export function perceive(
  companionWorld: { x: number; z: number; yaw: number },
  gameMinutes: number,
  playerTalking: boolean,
): Perception {
  const dx = playerSim.position.x - companionWorld.x;
  const dz = playerSim.position.z - companionWorld.z;
  const playerDistance = Math.hypot(dx, dz);
  // Facing cone ~100°: "Spieler ist gerade hinter mir" is a different
  // situation than "Spieler vor mir" (Blueprint §8).
  const angleToPlayer = Math.atan2(dx, dz) - companionWorld.yaw;
  const norm = Math.atan2(Math.sin(angleToPlayer), Math.cos(angleToPlayer));
  const playerVisible = playerDistance < 4.5 && Math.abs(norm) < 0.9;
  return {
    playerDistance,
    playerVisible,
    playerNear: playerDistance < 2.4,
    playerTalking,
    hour: Math.floor(gameMinutes / 60) % 24,
    awake: isAwakeHour(gameMinutes),
    night: isNight(gameMinutes),
  };
}
