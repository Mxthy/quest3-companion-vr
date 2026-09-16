/**
 * Tracking-space proxy capsule derived from headset pose only.
 * Height from HMD Y; aim from horizontal yaw; no content semantics.
 */

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export type ProxyConfig = {
  refEyeHeightM: number;
  anchorHeightFactor: number;
  forwardOffsetM: number;
  lengthM: number;
  radiusM: number;
  upOffsetM: number;
  minScale: number;
  maxScale: number;
};

export const DEFAULT_PROXY: ProxyConfig = {
  refEyeHeightM: 1.65,
  anchorHeightFactor: 0.55,
  forwardOffsetM: 0.12,
  lengthM: 0.16,
  radiusM: 0.025,
  upOffsetM: 0.02,
  minScale: 0.85,
  maxScale: 1.2,
};

export type HmdSample = { position: Vec3; orientation: Quat };

export type ProxyPose = {
  scale: number;
  eyeHeightM: number;
  anchor: Vec3;
  base: Vec3;
  tip: Vec3;
  forward: Vec3;
  orientation: Quat;
  lengthM: number;
  radiusM: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function horizontalForwardFromQuat(q: Quat): Vec3 {
  const vx = 0,
    vy = 0,
    vz = -1;
  const ix = q.w * vx + q.y * vz - q.z * vy;
  const iy = q.w * vy + q.z * vx - q.x * vz;
  const iz = q.w * vz + q.x * vy - q.y * vx;
  const iw = -q.x * vx - q.y * vy - q.z * vz;
  const rx = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
  const rz = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
  const forward = { x: rx, y: 0, z: rz };
  const len = Math.hypot(forward.x, forward.z) || 1;
  return { x: forward.x / len, y: 0, z: forward.z / len };
}

export function quatLookHorizontal(forward: Vec3): Quat {
  const yaw = Math.atan2(forward.x, forward.z);
  const half = yaw * 0.5;
  return { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
}

export function computeTrackingProxy(
  hmd: HmdSample,
  cfg: ProxyConfig = DEFAULT_PROXY
): ProxyPose {
  const eyeHeightM = clamp(hmd.position.y, 1.0, 2.1);
  const scale = clamp(eyeHeightM / cfg.refEyeHeightM, cfg.minScale, cfg.maxScale);
  const forward = horizontalForwardFromQuat(hmd.orientation);
  const anchor: Vec3 = {
    x: hmd.position.x,
    y: eyeHeightM * cfg.anchorHeightFactor,
    z: hmd.position.z,
  };
  const lengthM = cfg.lengthM * scale;
  const radiusM = cfg.radiusM * scale;
  const fwdOff = cfg.forwardOffsetM * scale;
  const upOff = cfg.upOffsetM * scale;
  const base: Vec3 = {
    x: anchor.x + forward.x * fwdOff,
    y: anchor.y + upOff,
    z: anchor.z + forward.z * fwdOff,
  };
  const tip: Vec3 = {
    x: base.x + forward.x * lengthM,
    y: base.y,
    z: base.z + forward.z * lengthM,
  };
  return {
    scale,
    eyeHeightM,
    anchor,
    base,
    tip,
    forward,
    orientation: quatLookHorizontal(forward),
    lengthM,
    radiusM,
  };
}

export function distancePointToCapsule(point: Vec3, pose: ProxyPose): number {
  const ax = pose.base.x,
    ay = pose.base.y,
    az = pose.base.z;
  const bx = pose.tip.x,
    by = pose.tip.y,
    bz = pose.tip.z;
  const abx = bx - ax,
    aby = by - ay,
    abz = bz - az;
  const apx = point.x - ax,
    apy = point.y - ay,
    apz = point.z - az;
  const abLen2 = abx * abx + aby * aby + abz * abz || 1e-6;
  let t = (apx * abx + apy * aby + apz * abz) / abLen2;
  t = clamp(t, 0, 1);
  const cx = ax + abx * t,
    cy = ay + aby * t,
    cz = az + abz * t;
  return Math.hypot(point.x - cx, point.y - cy, point.z - cz);
}
