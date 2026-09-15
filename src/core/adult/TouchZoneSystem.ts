/** Body-zone touch registry. Presentation attaches world positions each frame. */

export type ZoneId =
  | "head"
  | "mouth"
  | "breast_l"
  | "breast_r"
  | "waist"
  | "hip_l"
  | "hip_r"
  | "glute_l"
  | "glute_r"
  | "thigh_l"
  | "thigh_r"
  | "groin"
  | "hand_l"
  | "hand_r";

export type ZoneDef = {
  id: ZoneId;
  radius_m: number;
  sensitivity: number;
  unlock_bond: number;
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

export class TouchZoneSystem {
  private zones: Map<ZoneId, ZoneWorld> = new Map();

  setZone(def: ZoneDef, position: Vec3) {
    this.zones.set(def.id, { ...def, position: { ...position } });
  }

  clear() {
    this.zones.clear();
  }

  /** Nearest zone within radius of point (hand / ray hit). */
  queryPoint(point: Vec3, bond = 0): Contact | null {
    let best: Contact | null = null;
    for (const z of this.zones.values()) {
      if (bond < z.unlock_bond) continue;
      const d = dist(point, z.position);
      if (d <= z.radius_m) {
        if (!best || d < best.distance) {
          best = { zoneId: z.id, sensitivity: z.sensitivity, distance: d };
        }
      }
    }
    return best;
  }

  /** All zones currently intersecting point. */
  queryAll(point: Vec3, bond = 0): Contact[] {
    const out: Contact[] = [];
    for (const z of this.zones.values()) {
      if (bond < z.unlock_bond) continue;
      const d = dist(point, z.position);
      if (d <= z.radius_m) out.push({ zoneId: z.id, sensitivity: z.sensitivity, distance: d });
    }
    return out.sort((a, b) => a.distance - b.distance);
  }
}

export const DEFAULT_ZONES: ZoneDef[] = [
  { id: "head", radius_m: 0.12, sensitivity: 0.7, unlock_bond: 0 },
  { id: "mouth", radius_m: 0.08, sensitivity: 1.1, unlock_bond: 0 },
  { id: "breast_l", radius_m: 0.11, sensitivity: 1.2, unlock_bond: 0 },
  { id: "breast_r", radius_m: 0.11, sensitivity: 1.2, unlock_bond: 0 },
  { id: "waist", radius_m: 0.14, sensitivity: 0.9, unlock_bond: 0 },
  { id: "hip_l", radius_m: 0.12, sensitivity: 1.0, unlock_bond: 0 },
  { id: "hip_r", radius_m: 0.12, sensitivity: 1.0, unlock_bond: 0 },
  { id: "glute_l", radius_m: 0.12, sensitivity: 1.15, unlock_bond: 0 },
  { id: "glute_r", radius_m: 0.12, sensitivity: 1.15, unlock_bond: 0 },
  { id: "thigh_l", radius_m: 0.13, sensitivity: 0.85, unlock_bond: 0 },
  { id: "thigh_r", radius_m: 0.13, sensitivity: 0.85, unlock_bond: 0 },
  { id: "groin", radius_m: 0.1, sensitivity: 1.45, unlock_bond: 0 },
  { id: "hand_l", radius_m: 0.07, sensitivity: 0.5, unlock_bond: 0 },
  { id: "hand_r", radius_m: 0.07, sensitivity: 0.5, unlock_bond: 0 },
];
