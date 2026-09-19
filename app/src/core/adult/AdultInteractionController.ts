/**
 * Orchestrates adult touch agency (CH-class player control, original systems).
 * Presentation feeds hand points + zone bone positions each frame.
 */

import {
  applyIntenseBurst,
  createPleasureState,
  tickPleasure,
  type PleasureConfig,
  type PleasureState,
  type ArousalLevel,
} from "./PleasureModel";
import {
  DEFAULT_ZONES,
  TouchZoneSystem,
  type Contact,
  type Vec3,
  type ZoneId,
} from "./TouchZoneSystem";

export type AdultEvent =
  | { type: "zone_enter"; zoneId: ZoneId }
  | { type: "zone_exit"; zoneId: ZoneId }
  | { type: "level"; level: ArousalLevel; prev: ArousalLevel }
  | { type: "orgasm" }
  | { type: "spank"; zoneId: ZoneId }
  | { type: "grab_start"; zoneId: ZoneId }
  | { type: "grab_end"; zoneId: ZoneId };

export type AdultFrameInput = {
  /** World-space points for left/right hand or single desktop cursor point. */
  handPoints: Vec3[];
  /** Grip held (VR) or desktop grab key. */
  grabbing: boolean;
  /** Trigger / intense use this frame. */
  intensePressed: boolean;
  /** Optional spank impulse this frame. */
  spankPressed: boolean;
  bond: number;
  dt: number;
};

export type AdultPublicState = {
  arousal: number;
  level: ArousalLevel;
  activeZone: ZoneId | null;
  grabbing: boolean;
  refractoryLeft: number;
};

export class AdultInteractionController {
  readonly zones = new TouchZoneSystem();
  private pleasure: PleasureState = createPleasureState();
  private active: Contact | null = null;
  private grabbing = false;
  private grabZone: ZoneId | null = null;
  private seenZones = new Set<ZoneId>();
  private listeners: Array<(e: AdultEvent) => void> = [];
  private cfg: PleasureConfig | undefined;
  private reachedHot = false;

  constructor(cfg?: PleasureConfig) {
    this.cfg = cfg;
    for (const z of DEFAULT_ZONES) {
      this.zones.setZone(z, { x: 0, y: 0, z: 0 });
    }
  }

  onEvent(fn: (e: AdultEvent) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(e: AdultEvent) {
    for (const l of this.listeners) l(e);
  }

  /** Call when VRM bone matrices update. */
  updateZonePosition(id: ZoneId, position: Vec3) {
    const def = DEFAULT_ZONES.find((z) => z.id === id);
    if (def) this.zones.setZone(def, position);
  }

  getState(): AdultPublicState {
    return {
      arousal: this.pleasure.arousal,
      level: this.pleasure.level,
      activeZone: this.active?.zoneId ?? null,
      grabbing: this.grabbing,
      refractoryLeft: this.pleasure.refractoryLeft,
    };
  }

  tick(input: AdultFrameInput): AdultPublicState {
    let best: Contact | null = null;
    for (const p of input.handPoints) {
      const c = this.zones.queryPoint(p, input.bond);
      if (c && (!best || c.distance < best.distance)) best = c;
    }

    if (best && (!this.active || this.active.zoneId !== best.zoneId)) {
      if (this.active) this.emit({ type: "zone_exit", zoneId: this.active.zoneId });
      this.emit({ type: "zone_enter", zoneId: best.zoneId });
      if (!this.seenZones.has(best.zoneId)) this.seenZones.add(best.zoneId);
    } else if (!best && this.active) {
      this.emit({ type: "zone_exit", zoneId: this.active.zoneId });
    }
    this.active = best;

    // Grab state
    if (input.grabbing && best && !this.grabbing) {
      this.grabbing = true;
      this.grabZone = best.zoneId;
      this.emit({ type: "grab_start", zoneId: best.zoneId });
    } else if (!input.grabbing && this.grabbing) {
      if (this.grabZone) this.emit({ type: "grab_end", zoneId: this.grabZone });
      this.grabbing = false;
      this.grabZone = null;
    }

    if (input.spankPressed && best && (best.zoneId === "glute_l" || best.zoneId === "glute_r")) {
      this.emit({ type: "spank", zoneId: best.zoneId });
      this.pleasure = applyIntenseBurst(this.pleasure, this.cfg);
    }

    if (input.intensePressed && best) {
      this.pleasure = applyIntenseBurst(this.pleasure, this.cfg);
    }

    const prevLevel = this.pleasure.level;
    this.pleasure = tickPleasure(this.pleasure, input.dt, {
      touching: !!best,
      sensitivity: best?.sensitivity ?? 1,
      grabbing: this.grabbing,
      cfg: this.cfg,
    });

    if (this.pleasure.justOrgasm) {
      this.emit({ type: "orgasm" });
    } else if (this.pleasure.levelChanged) {
      this.emit({ type: "level", level: this.pleasure.level, prev: prevLevel });
    }

    if (!this.reachedHot && this.pleasure.level === "hot") this.reachedHot = true;

    return this.getState();
  }

  /** Expression weights 0–1 for VRM drivers. */
  expressionWeights(): { joy: number; a: number; blink: number } {
    const a = this.pleasure.arousal / 100;
    return {
      joy: Math.min(1, a * 0.9),
      a: this.pleasure.level === "orgasm" || this.pleasure.level === "peak_build" ? Math.min(1, a) : a * 0.35,
      blink: this.pleasure.justOrgasm ? 1 : 0,
    };
  }
}
