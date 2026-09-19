/** Orchestrates collider queries + intensity tick. Content-agnostic. */

import {
  applyBurst,
  createIntensityState,
  tickIntensity,
  type IntensityConfig,
  type IntensityState,
  type IntensityBand,
} from "./IntensityModel";
import {
  ColliderZoneSystem,
  DEFAULT_AVATAR_ZONES,
  type Contact,
  type Vec3,
  type ZoneId,
} from "./ColliderZones";
import {
  computeTrackingProxy,
  distancePointToCapsule,
  type HmdSample,
  type ProxyPose,
  type ProxyConfig,
} from "./TrackingProxy";

export type ContactEvent =
  | { type: "zone_enter"; zoneId: ZoneId }
  | { type: "zone_exit"; zoneId: ZoneId }
  | { type: "band"; band: IntensityBand; prev: IntensityBand }
  | { type: "peak" }
  | { type: "hold_start"; zoneId: ZoneId }
  | { type: "hold_end"; zoneId: ZoneId }
  | { type: "impulse"; zoneId: ZoneId };

export type FrameInput = {
  hmd?: HmdSample;
  handPoints: Vec3[];
  holding: boolean;
  burstPressed: boolean;
  impulsePressed: boolean;
  progress: number;
  dt: number;
  /** Optional extra sphere targets (props). */
  extraTargets?: Array<{ id: string; position: Vec3; radius: number; sensitivity: number }>;
};

export class ContactController {
  readonly zones = new ColliderZoneSystem();
  private intensity: IntensityState = createIntensityState();
  private active: Contact | null = null;
  private holding = false;
  private holdZone: ZoneId | null = null;
  private listeners: Array<(e: ContactEvent) => void> = [];
  private intensityCfg?: IntensityConfig;
  private proxyCfg?: ProxyConfig;

  constructor(intensityCfg?: IntensityConfig, proxyCfg?: ProxyConfig) {
    this.intensityCfg = intensityCfg;
    this.proxyCfg = proxyCfg;
    for (const z of DEFAULT_AVATAR_ZONES) {
      this.zones.setZone(z, { x: 0, y: 0, z: 0 });
    }
  }

  onEvent(fn: (e: ContactEvent) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(e: ContactEvent) {
    for (const l of this.listeners) l(e);
  }

  updateZonePosition(id: ZoneId, position: Vec3) {
    const def = DEFAULT_AVATAR_ZONES.find((z) => z.id === id) ?? {
      id,
      radius_m: 0.1,
      sensitivity: 1,
      min_progress: 0,
    };
    this.zones.setZone(def, position);
  }

  getIntensity() {
    return this.intensity;
  }

  /** Blendshape-style weights 0–1 from intensity only. */
  expressionWeights(): { a: number; b: number; blink: number } {
    const v = this.intensity.value / 100;
    return {
      a: Math.min(1, v * 0.9),
      b:
        this.intensity.band === "peak" || this.intensity.band === "peak_build"
          ? Math.min(1, v)
          : v * 0.35,
      blink: this.intensity.justPeaked ? 1 : 0,
    };
  }

  tick(input: FrameInput): {
    intensity: IntensityState;
    activeZone: ZoneId | null;
    proxy: ProxyPose | null;
    proxyHit: boolean;
  } {
    let best: Contact | null = null;
    for (const p of input.handPoints) {
      const c = this.zones.queryPoint(p, input.progress);
      if (c && (!best || c.distance < best.distance)) best = c;
    }

    let proxy: ProxyPose | null = null;
    let proxyHit = false;
    let proxySens = 1;
    if (input.hmd) {
      proxy = computeTrackingProxy(input.hmd, this.proxyCfg);
      for (const z of DEFAULT_AVATAR_ZONES) {
        // zone positions already in system; re-query via stored map through queryAll on tip/base samples
      }
      // Test proxy capsule against each updated zone by sampling zone positions from last setZone
      // Use hand-style: distance from zone centers collected via query on tip
      const tipContact = this.zones.queryPoint(proxy.tip, input.progress);
      const baseContact = this.zones.queryPoint(proxy.base, input.progress);
      const pc = tipContact ?? baseContact;
      if (pc) {
        proxyHit = true;
        proxySens = pc.sensitivity;
        if (!best || pc.distance < best.distance) best = pc;
      }
      for (const t of input.extraTargets ?? []) {
        const d = distancePointToCapsule(t.position, proxy);
        if (d <= proxy.radiusM + t.radius) {
          proxyHit = true;
          proxySens = Math.max(proxySens, t.sensitivity);
        }
      }
    }

    if (best && (!this.active || this.active.zoneId !== best.zoneId)) {
      if (this.active) this.emit({ type: "zone_exit", zoneId: this.active.zoneId });
      this.emit({ type: "zone_enter", zoneId: best.zoneId });
    } else if (!best && this.active) {
      this.emit({ type: "zone_exit", zoneId: this.active.zoneId });
    }
    this.active = best;

    if (input.holding && best && !this.holding) {
      this.holding = true;
      this.holdZone = best.zoneId;
      this.emit({ type: "hold_start", zoneId: best.zoneId });
    } else if (!input.holding && this.holding) {
      if (this.holdZone) this.emit({ type: "hold_end", zoneId: this.holdZone });
      this.holding = false;
      this.holdZone = null;
    }

    if (input.impulsePressed && best) {
      this.emit({ type: "impulse", zoneId: best.zoneId });
      this.intensity = applyBurst(this.intensity, this.intensityCfg);
    }
    if (input.burstPressed && (best || proxyHit)) {
      this.intensity = applyBurst(this.intensity, this.intensityCfg);
    }

    const prevBand = this.intensity.band;
    const contacting = !!best || proxyHit;
    const sensitivity = best?.sensitivity ?? (proxyHit ? proxySens : 1);
    this.intensity = tickIntensity(this.intensity, input.dt, {
      contacting,
      sensitivity: sensitivity * (proxyHit ? 1.25 : 1),
      holding: this.holding || proxyHit,
      cfg: this.intensityCfg,
    });

    if (this.intensity.justPeaked) this.emit({ type: "peak" });
    else if (this.intensity.bandChanged) {
      this.emit({ type: "band", band: this.intensity.band, prev: prevBand });
    }

    return {
      intensity: this.intensity,
      activeZone: this.active?.zoneId ?? null,
      proxy,
      proxyHit,
    };
  }
}
