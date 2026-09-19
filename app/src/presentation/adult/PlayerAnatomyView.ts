/**
 * Presentation adapter notes for virtual anatomy mesh.
 * Engine-agnostic numbers; Three.js example mapping in comments.
 */

import type { VirtualAnatomyPose, Vec3, Quat } from "../../core/adult/VirtualAnatomy";

export type Transform = {
  position: Vec3;
  quaternion: Quat;
  scale: Vec3;
};

/** Place a shaft mesh: pivot at base, local +Z along length. */
export function shaftMeshTransform(pose: VirtualAnatomyPose): Transform {
  return {
    position: { ...pose.shaftBase },
    quaternion: { ...pose.shaftOrientation },
    scale: {
      x: pose.radiusM / 0.025,
      y: pose.radiusM / 0.025,
      z: pose.lengthM / 0.16,
    },
  };
}

/**
 * Suggested Three.js wiring (do not import three here):
 *
 * const pose = computeVirtualAnatomy({ position: hmd.pos, orientation: hmd.quat });
 * const t = shaftMeshTransform(pose);
 * mesh.position.set(t.position.x, t.position.y, t.position.z);
 * mesh.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);
 * mesh.scale.set(t.scale.x, t.scale.y, t.scale.z);
 *
 * Visibility: show only in playing phase; optional fade when not adult-engaged.
 * Desktop: use camera instead of XR viewer pose.
 */
export const PRESENTATION_NOTES = {
  pivot: "base of shaft at shaftBase",
  axis: "local +Z toward tip",
  tracking: "HMD yaw only for aim; pitch ignored for stability",
  height: "hipY = eyeY * hipHeightFactor (default 0.55)",
  floor: "require local-floor reference space when available",
};
