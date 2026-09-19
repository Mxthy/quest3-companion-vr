/**
 * Virtual player anatomy (adult build).
 * Position/orientation derived from headset (HMD) only — no full body tracker required.
 *
 * Model:
 * - Floor Y = 0
 * - Player eye height ≈ HMD world Y (local-floor) or calibrated
 * - Average adult standing eye height ~1.65 m → scale body proportions
 * - Pelvis/hip below eyes by fixed anatomical ratios
 * - "P" attached at pelvis, oriented by HMD yaw (horizontal facing), slight pitch optional
 */

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export type AnatomyConfig = {
  /** Reference eye height in meters (standing). */
  refEyeHeightM: number;
  /** Hip height as fraction of eye height. */
  hipHeightFactor: number;
  /** Forward offset from hip center (meters at ref scale). */
  shaftForwardM: number;
  /** Default shaft length at ref scale. */
  shaftLengthM: number;
  /** Radius at base. */
  shaftRadiusM: number;
  /** Vertical adjust along body up. */
  shaftUpOffsetM: number;
  /** Minimum scale clamp. */
  minScale: number;
  /** Maximum scale clamp. */
  maxScale: number;
};

export const DEFAULT_ANATOMY: AnatomyConfig = {
  refEyeHeightM: 1.65,
  hipHeightFactor: 0.55,
  shaftForwardM: 0.12,
  shaftLengthM: 0.16,
  shaftRadiusM: 0.025,
  shaftUpOffsetM: 0.02,
  minScale: 0.85,
  maxScale: 1.2,
};

export type HmdSample = {
  /** Headset position in tracking space (prefer local-floor). */
  position: Vec3;
  /** Headset orientation quaternion. */
  orientation: Quat;
};

export type VirtualAnatomyPose = {
  /** Scale vs average adult. */
  scale: number;
  eyeHeightM: number;
  hip: Vec3;
  /** Origin of shaft (base). */
  shaftBase: Vec3;
  /** Tip position. */
  shaftTip: Vec3;
  /** Forward horizontal direction (unit, y≈0). */
  forward: Vec3;
  /** Quaternion aligning +Z to forward, Y up. */
  shaftOrientation: Quat;
  lengthM: number;
  radiusM: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/** Yaw-only forward from quaternion (ignore look up/down for shaft aim). */
export function horizontalForwardFromQuat(q: Quat): Vec3 {
  // Local -Z is typical camera forward in Three/glTF camera; WebXR viewer is -Z too.
  const x = -2 * (q.x * q.z + q.w * q.y);
  const z = -1 + 2 * (q.x * q.x + q.y * q.y);
  // Actually standard rotation of (0,0,-1):
  const fx = 2 * (q.x * q.z + q.w * q.y);
  const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
  // Use -Z forward:
  let forward = { x: -fx, y: 0, z: -fz };
  // Correct formula for rotating vector (0,0,-1) by quat:
  const vx = 0,
    vy = 0,
    vz = -1;
  const ix = q.w * vx + q.y * vz - q.z * vy;
  const iy = q.w * vy + q.z * vx - q.x * vz;
  const iz = q.w * vz + q.x * vy - q.y * vx;
  const iw = -q.x * vx - q.y * vy - q.z * vz;
  let rx = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
  let rz = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
  forward = { x: rx, y: 0, z: rz };
  const len = Math.hypot(forward.x, forward.z) || 1;
  return { x: forward.x / len, y: 0, z: forward.z / len };
}

/** Quaternion: Y-up, forward maps local +Z to horizontal forward. */
export function quatLookHorizontal(forward: Vec3): Quat {
  // yaw from forward
  const yaw = Math.atan2(forward.x, forward.z);
  const half = yaw * 0.5;
  return { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
}

/**
 * Compute virtual anatomy from HMD sample.
 * Eye height uses HMD Y when using local-floor; if seated low, scale clamps.
 */
export function computeVirtualAnatomy(
  hmd: HmdSample,
  cfg: AnatomyConfig = DEFAULT_ANATOMY
): VirtualAnatomyPose {
  const eyeHeightM = clamp(hmd.position.y, 1.0, 2.1);
  const scale = clamp(eyeHeightM / cfg.refEyeHeightM, cfg.minScale, cfg.maxScale);

  const forward = horizontalForwardFromQuat(hmd.orientation);
  const hipY = eyeHeightM * cfg.hipHeightFactor;
  const hip: Vec3 = {
    x: hmd.position.x,
    y: hipY,
    z: hmd.position.z,
  };

  const lengthM = cfg.shaftLengthM * scale;
  const radiusM = cfg.shaftRadiusM * scale;
  const fwdOff = cfg.shaftForwardM * scale;
  const upOff = cfg.shaftUpOffsetM * scale;

  const shaftBase: Vec3 = {
    x: hip.x + forward.x * fwdOff,
    y: hip.y + upOff,
    z: hip.z + forward.z * fwdOff,
  };
  const shaftTip: Vec3 = {
    x: shaftBase.x + forward.x * lengthM,
    y: shaftBase.y,
    z: shaftBase.z + forward.z * lengthM,
  };

  return {
    scale,
    eyeHeightM,
    hip,
    shaftBase,
    shaftTip,
    forward,
    shaftOrientation: quatLookHorizontal(forward),
    lengthM,
    radiusM,
  };
}

/** Capsule-style contact test: distance from point to shaft segment. */
export function distancePointToShaft(point: Vec3, pose: VirtualAnatomyPose): number {
  const ax = pose.shaftBase.x,
    ay = pose.shaftBase.y,
    az = pose.shaftBase.z;
  const bx = pose.shaftTip.x,
    by = pose.shaftTip.y,
    bz = pose.shaftTip.z;
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

export function shaftTouchesPoint(point: Vec3, pose: VirtualAnatomyPose, extraRadius = 0): boolean {
  return distancePointToShaft(point, pose) <= pose.radiusM + extraRadius;
}
