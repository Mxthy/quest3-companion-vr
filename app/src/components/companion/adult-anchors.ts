/**
 * Zone anchors — RENDER/ADAPTER layer.
 *
 * Per life-vibe/architecture/platform-adapters the simulation never owns
 * engine objects: these THREE.Object3D anchors are owned by the webxr
 * adapter (Unity later keeps its own Transform registry). The bridge feeds
 * plain Vec3 world positions from them into the sim each frame.
 */

import * as THREE from "three";
import type { ZoneId } from "@/core/adult/TouchZoneSystem";

/** Zone anchor Object3Ds attached to the companion body (VRM bones / Elara placeholder). */
export const adultAnchors = new Map<ZoneId, THREE.Object3D>();

export function registerAdultAnchor(id: ZoneId, obj: THREE.Object3D) {
  adultAnchors.set(id, obj);
}

export function unregisterAdultAnchor(id: ZoneId) {
  adultAnchors.delete(id);
}
