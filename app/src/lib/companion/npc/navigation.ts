/**
 * Companion movement (Blueprint §6): straight-line waypoint walking with the
 * room's wall/AABB collision. Full NavMesh + A* is the next step once the
 * apartment grows obstacles worth pathing around.
 */
import * as THREE from "three";
import { COLLIDERS, ROOM_BOUNDS } from "@/components/companion/room";

export function npcBlocked(x: number, z: number): boolean {
  if (x < ROOM_BOUNDS.minX || x > ROOM_BOUNDS.maxX || z < ROOM_BOUNDS.minZ || z > ROOM_BOUNDS.maxZ) {
    return true;
  }
  for (const c of COLLIDERS) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
  }
  return false;
}

export type WalkResult = {
  moving: boolean;
  arrived: boolean;
  targetYaw: number;
};

/** Walk `pos` toward (tx,tz). Returns the yaw the body should face. */
export function walkStep(
  pos: THREE.Vector3,
  tx: number,
  tz: number,
  dt: number,
  speed = 0.55,
): WalkResult {
  const dx = tx - pos.x;
  const dz = tz - pos.z;
  const dist = Math.hypot(dx, dz);
  const targetYaw = Math.atan2(dx, dz);
  if (dist < 0.4) return { moving: false, arrived: true, targetYaw };
  const step = Math.min(speed * dt, dist);
  const nx = pos.x + (dx / dist) * step;
  const nz = pos.z + (dz / dist) * step;
  if (!npcBlocked(nx, pos.z)) pos.x = nx;
  if (!npcBlocked(pos.x, nz)) pos.z = nz;
  return { moving: true, arrived: false, targetYaw };
}

/** Frame-rate independent yaw steering (shortest arc). */
export function steerYaw(current: number, target: number, dt: number, rate = 2.6): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + d * (1 - Math.exp(-rate * dt));
}
