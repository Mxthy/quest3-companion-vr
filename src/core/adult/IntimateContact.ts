/**
 * Intimate contact between virtual player anatomy and companion zones / props.
 */

import {
  computeVirtualAnatomy,
  distancePointToShaft,
  shaftTouchesPoint,
  type HmdSample,
  type VirtualAnatomyPose,
  type AnatomyConfig,
  DEFAULT_ANATOMY,
  type Vec3,
} from "./VirtualAnatomy";
import type { ZoneId } from "./TouchZoneSystem";
import {
  applyIntenseBurst,
  tickPleasure,
  type PleasureState,
  createPleasureState,
  type PleasureConfig,
} from "./PleasureModel";

export type ZoneSample = { id: ZoneId; position: Vec3; radius: number; sensitivity: number };

export type PropSocket = {
  id: string;
  /** World position of use socket (e.g. toy, mouth prop). */
  position: Vec3;
  radius: number;
  kind: "oral" | "toy" | "surface" | "hand";
  sensitivity: number;
};

export type IntimateFrameIn = {
  hmd: HmdSample;
  /** Companion body zones this frame. */
  zones: ZoneSample[];
  /** Optional interactive props (toys aligned to adult play). */
  props?: PropSocket[];
  /** Hand points still drive manual touch. */
  handPoints?: Vec3[];
  grabbing?: boolean;
  intensePressed?: boolean;
  dt: number;
  bond: number;
};

export type IntimateHit = {
  target: "zone" | "prop";
  id: string;
  distance: number;
  sensitivity: number;
};

export type IntimateFrameOut = {
  anatomy: VirtualAnatomyPose;
  pleasure: PleasureState;
  active: IntimateHit | null;
  shaftEngaged: boolean;
};

export class IntimateContactSystem {
  private pleasure: PleasureState = createPleasureState();
  private anatomyCfg: AnatomyConfig;
  private pleasureCfg?: PleasureConfig;

  constructor(anatomyCfg?: AnatomyConfig, pleasureCfg?: PleasureConfig) {
    this.anatomyCfg = anatomyCfg ?? DEFAULT_ANATOMY;
    this.pleasureCfg = pleasureCfg;
  }

  getPleasure() {
    return this.pleasure;
  }

  tick(input: IntimateFrameIn): IntimateFrameOut {
    const anatomy = computeVirtualAnatomy(input.hmd, this.anatomyCfg);

    let best: IntimateHit | null = null;

    for (const z of input.zones) {
      const d = distancePointToShaft(z.position, anatomy);
      const limit = anatomy.radiusM + z.radius;
      if (d <= limit) {
        const hit: IntimateHit = {
          target: "zone",
          id: z.id,
          distance: d,
          sensitivity: z.sensitivity,
        };
        if (!best || d < best.distance) best = hit;
      }
    }

    for (const p of input.props ?? []) {
      const d = distancePointToShaft(p.position, anatomy);
      if (d <= anatomy.radiusM + p.radius) {
        const hit: IntimateHit = {
          target: "prop",
          id: p.id,
          distance: d,
          sensitivity: p.sensitivity,
        };
        if (!best || d < best.distance) best = hit;
      }
    }

    // Manual hand touch still counts as contact for pleasure
    let handTouch = false;
    let handSens = 1;
    for (const h of input.handPoints ?? []) {
      for (const z of input.zones) {
        const d = Math.hypot(h.x - z.position.x, h.y - z.position.y, h.z - z.position.z);
        if (d <= z.radius) {
          handTouch = true;
          handSens = Math.max(handSens, z.sensitivity);
        }
      }
    }

    const shaftEngaged = !!best;
    const touching = shaftEngaged || handTouch;
    const sensitivity = best?.sensitivity ?? (handTouch ? handSens : 1);

    if (input.intensePressed && touching) {
      this.pleasure = applyIntenseBurst(this.pleasure, this.pleasureCfg);
    }

    this.pleasure = tickPleasure(this.pleasure, input.dt, {
      touching,
      sensitivity: sensitivity * (shaftEngaged ? 1.25 : 1),
      grabbing: !!input.grabbing || shaftEngaged,
      cfg: this.pleasureCfg,
    });

    return {
      anatomy,
      pleasure: this.pleasure,
      active: best,
      shaftEngaged,
    };
  }
}
