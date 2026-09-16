/**
 * Soft toy physics without native engine dependency.
 * Verlet points + distance constraints – good enough for wand/ring/pillow jiggle on Quest.
 */

export type Vec3 = { x: number; y: number; z: number };

export function v3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function len(a: Vec3): number {
  return Math.hypot(a.x, a.y, a.z);
}

export function normalize(a: Vec3): Vec3 {
  const l = len(a) || 1;
  return scale(a, 1 / l);
}

export type SoftPoint = {
  pos: Vec3;
  prev: Vec3;
  pinned: boolean;
  mass: number;
};

export type SoftConstraint = {
  i: number;
  j: number;
  rest: number;
  stiffness: number; // 0..1
};

export type SoftBodyConfig = {
  gravity?: Vec3;
  damping?: number; // velocity retention 0.9–0.99
  iterations?: number;
  groundY?: number;
};

export class SoftBody {
  points: SoftPoint[] = [];
  constraints: SoftConstraint[] = [];
  gravity: Vec3;
  damping: number;
  iterations: number;
  groundY: number;

  constructor(cfg: SoftBodyConfig = {}) {
    this.gravity = cfg.gravity ?? v3(0, -9.5, 0);
    this.damping = cfg.damping ?? 0.985;
    this.iterations = cfg.iterations ?? 4;
    this.groundY = cfg.groundY ?? 0.05;
  }

  addPoint(pos: Vec3, pinned = false, mass = 1): number {
    this.points.push({
      pos: { ...pos },
      prev: { ...pos },
      pinned,
      mass,
    });
    return this.points.length - 1;
  }

  connect(i: number, j: number, stiffness = 0.85, rest?: number) {
    const d = len(sub(this.points[i].pos, this.points[j].pos));
    this.constraints.push({ i, j, rest: rest ?? d, stiffness });
  }

  /** Pin or move a control point (grab handle). */
  setPinnedPos(index: number, pos: Vec3, pinned = true) {
    const p = this.points[index];
    p.pos = { ...pos };
    p.prev = { ...pos };
    p.pinned = pinned;
  }

  tick(dt: number) {
    const dtClamped = Math.min(dt, 1 / 30);
    const g = scale(this.gravity, dtClamped * dtClamped);

    for (const p of this.points) {
      if (p.pinned) continue;
      const vel = scale(sub(p.pos, p.prev), this.damping);
      p.prev = { ...p.pos };
      p.pos = add(add(p.pos, vel), g);
      if (p.pos.y < this.groundY) {
        p.pos.y = this.groundY;
        p.prev.y = p.pos.y;
      }
    }

    for (let k = 0; k < this.iterations; k++) {
      for (const c of this.constraints) {
        const a = this.points[c.i];
        const b = this.points[c.j];
        const delta = sub(b.pos, a.pos);
        const d = len(delta) || 1e-6;
        const diff = ((d - c.rest) / d) * c.stiffness;
        const corr = scale(delta, 0.5 * diff);
        if (!a.pinned) a.pos = add(a.pos, corr);
        if (!b.pinned) b.pos = sub(b.pos, corr);
      }
    }
  }

  /** World positions snapshot for mesh skinning / instance placement. */
  positions(): Vec3[] {
    return this.points.map((p) => ({ ...p.pos }));
  }
}

/** Soft silicone wand: pinned base + chain toward tip. */
export function createWandSoftBody(base: Vec3, length = 0.18, segments = 6): SoftBody {
  const body = new SoftBody({ damping: 0.97, iterations: 5, gravity: v3(0, -4.5, 0) });
  const step = length / segments;
  for (let i = 0; i <= segments; i++) {
    body.addPoint(v3(base.x, base.y + i * step, base.z), i === 0);
  }
  for (let i = 0; i < segments; i++) {
    body.connect(i, i + 1, i < 2 ? 0.95 : 0.72);
  }
  // mild bend resistance
  for (let i = 0; i < segments - 1; i++) {
    body.connect(i, i + 2, 0.35, step * 2);
  }
  return body;
}

/** Soft ring: 8 points on a circle, all linked. */
export function createRingSoftBody(center: Vec3, radius = 0.035, points = 8): SoftBody {
  const body = new SoftBody({ damping: 0.98, iterations: 6, gravity: v3(0, -3, 0) });
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    body.addPoint(
      v3(center.x + Math.cos(a) * radius, center.y, center.z + Math.sin(a) * radius),
      false,
    );
  }
  for (let i = 0; i < points; i++) {
    body.connect(i, (i + 1) % points, 0.9);
    body.connect(i, (i + 2) % points, 0.4);
  }
  return body;
}

/** Soft pillow: 2x2x2 lattice. */
export function createPillowSoftBody(origin: Vec3, size = { x: 0.28, y: 0.1, z: 0.2 }): SoftBody {
  const body = new SoftBody({ damping: 0.96, iterations: 4, gravity: v3(0, -6, 0) });
  const idx: number[][][] = [];
  for (let ix = 0; ix < 2; ix++) {
    idx[ix] = [];
    for (let iy = 0; iy < 2; iy++) {
      idx[ix][iy] = [];
      for (let iz = 0; iz < 2; iz++) {
        const p = v3(
          origin.x + (ix - 0.5) * size.x,
          origin.y + iy * size.y,
          origin.z + (iz - 0.5) * size.z,
        );
        // bottom pins lightly: not pinned so it can squash, ground constraint handles floor
        idx[ix][iy].push(body.addPoint(p, false, 1.2));
      }
    }
  }
  const link = (a: number, b: number, s: number) => body.connect(a, b, s);
  for (let ix = 0; ix < 2; ix++)
    for (let iy = 0; iy < 2; iy++)
      for (let iz = 0; iz < 2; iz++) {
        if (ix < 1) link(idx[ix][iy][iz], idx[ix + 1][iy][iz], 0.8);
        if (iy < 1) link(idx[ix][iy][iz], idx[ix][iy + 1][iz], 0.75);
        if (iz < 1) link(idx[ix][iy][iz], idx[ix][iy][iz + 1], 0.8);
      }
  return body;
}
