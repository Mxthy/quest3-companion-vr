/** Named sphere colliders. Presentation supplies world positions each frame. */

export type ZoneId = string;

export type ZoneDef = {
  id: ZoneId;
  radius_m: number;
  sensitivity: number;
  min_progress: number;
};

export type Vec3 = { x: number; y: number; z: number };

export type ZoneWorld = ZoneDef & { position: Vec3 };

export type Contact = {
  zoneId: ZoneId;
  sensitivity: number;
  distance: number;
};

function dist(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class ColliderZoneSystem {
  private zones: Map<ZoneId, ZoneWorld> = new Map();

  setZone(def: ZoneDef, position: Vec3) {
    this.zones.set(def.id, { ...def, position: { ...position } });
  }

  clear() {
    this.zones.clear();
  }

  queryPoint(point: Vec3, progress = 0): Contact | null {
    let best: Contact | null = null;
    for (const z of this.zones.values()) {
      if (progress < z.min_progress) continue;
      const d = dist(point, z.position);
      if (d <= z.radius_m) {
        if (!best || d < best.distance) {
          best = { zoneId: z.id, sensitivity: z.sensitivity, distance: d };
        }
      }
    }
    return best;
  }

  queryAll(point: Vec3, progress = 0): Contact[] {
    const out: Contact[] = [];
    for (const z of this.zones.values()) {
      if (progress < z.min_progress) continue;
      const d = dist(point, z.position);
      if (d <= z.radius_m) {
        out.push({ zoneId: z.id, sensitivity: z.sensitivity, distance: d });
      }
    }
    return out.sort((a, b) => a.distance - b.distance);
  }
}

/** Default avatar attachment ids (bone tags). */
export const DEFAULT_AVATAR_ZONES: ZoneDef[] = [
  { id: "head", radius_m: 0.12, sensitivity: 0.7, min_progress: 0 },
  { id: "face", radius_m: 0.08, sensitivity: 1.1, min_progress: 0 },
  { id: "chest_l", radius_m: 0.11, sensitivity: 1.2, min_progress: 0 },
  { id: "chest_r", radius_m: 0.11, sensitivity: 1.2, min_progress: 0 },
  { id: "torso", radius_m: 0.14, sensitivity: 0.9, min_progress: 0 },
  { id: "hip_l", radius_m: 0.12, sensitivity: 1.0, min_progress: 0 },
  { id: "hip_r", radius_m: 0.12, sensitivity: 1.0, min_progress: 0 },
  { id: "back_l", radius_m: 0.12, sensitivity: 1.15, min_progress: 0 },
  { id: "back_r", radius_m: 0.12, sensitivity: 1.15, min_progress: 0 },
  { id: "thigh_l", radius_m: 0.13, sensitivity: 0.85, min_progress: 0 },
  { id: "thigh_r", radius_m: 0.13, sensitivity: 0.85, min_progress: 0 },
  { id: "center", radius_m: 0.1, sensitivity: 1.45, min_progress: 0 },
  { id: "hand_l", radius_m: 0.07, sensitivity: 0.5, min_progress: 0 },
  { id: "hand_r", radius_m: 0.07, sensitivity: 0.5, min_progress: 0 },
];
