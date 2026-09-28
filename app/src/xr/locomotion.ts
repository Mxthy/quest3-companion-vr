/**
 * Smooth locomotion, snap turn, teleport — operates on XRPlayerRig.
 * KB: teleport default, snap 30–45°, vignette while moving.
 */
/**
 * Player dolly — locomotion is applied here, never to the XR camera directly.
 *
 *   PlayerRig (Group / dolly)
 *     ├── XR Camera          (local pose from WebXRManager)
 *     ├── Left/Right target ray
 *     ├── Left/Right grip
 *     └── collision capsule (logical)
 *
 * KB: three.js WebXR — parent camera + controllers to the dolly so snap/teleport
 * move the whole tracking space.
 */

import * as THREE from "three";
import type { ActionState } from "@/xr/input-actions";
import type { VRComfortConfig } from "@/xr/comfort-settings";

export type FloorProbe = (x: number, z: number) => boolean;

export type LocomotionResult = {
  moved: boolean;
  turned: boolean;
  teleported: boolean;
};

export type RayProvider = (outOrigin: THREE.Vector3, outDir: THREE.Vector3) => boolean;

export type XRSessionAdapter = {
  session?: unknown;
  frameRate?: number;
  presenting?: boolean;
};

export interface LocomotionRig {
  group: THREE.Object3D;
  camera: THREE.Camera;
  radius?: number;
  yaw?: number;
  rotateAroundHead?: (delta: number) => void;
  proposeMove?: (
    moveX: number,
    moveY: number,
    speed: number,
    dt: number,
    presenting: boolean,
  ) => THREE.Vector3;
  commitPosition?: (x: number, z: number) => void;
  teleportFeet?: (x: number, z: number) => void;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _before = new THREE.Vector3();
const _after = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _headWorld = new THREE.Vector3();
const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _hit = new THREE.Vector3();

export function applyDeadzone(v: number, z = 0.15): number {
  if (Math.abs(v) < z) return 0;
  const s = Math.sign(v);
  return s * ((Math.abs(v) - z) / (1 - z));
}

export function clampMoveSpeed(speed: number, min = 0.5, max = 5.0): number {
  return Math.max(min, Math.min(max, speed));
}

export function computeSnapTurnAngle(snapAngleDeg: number, directionSign: number): number {
  return -Math.sign(directionSign) * ((snapAngleDeg * Math.PI) / 180);
}

export function rotateAroundHead(
  camera: THREE.Camera,
  rigGroup: THREE.Object3D,
  deltaYaw: number,
): void {
  camera.getWorldPosition(_before);
  rigGroup.rotation.y += deltaYaw;
  while (rigGroup.rotation.y > Math.PI) rigGroup.rotation.y -= Math.PI * 2;
  while (rigGroup.rotation.y < -Math.PI) rigGroup.rotation.y += Math.PI * 2;
  rigGroup.updateMatrixWorld(true);
  camera.getWorldPosition(_after);
  rigGroup.position.x += _before.x - _after.x;
  rigGroup.position.z += _before.z - _after.z;
}

export function getHeadForward(
  camera: THREE.Camera,
  rigYaw: number,
  presenting: boolean,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  if (presenting) {
    camera.getWorldDirection(out);
    out.y = 0;
    if (out.lengthSq() < 1e-6) {
      out.set(-Math.sin(rigYaw), 0, -Math.cos(rigYaw));
    } else {
      out.normalize();
    }
  } else {
    out.set(-Math.sin(rigYaw), 0, -Math.cos(rigYaw));
  }
  return out;
}

export function getHeadRight(
  camera: THREE.Camera,
  rigYaw: number,
  presenting: boolean,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  getHeadForward(camera, rigYaw, presenting, _fwd);
  out.crossVectors(_fwd, Y_AXIS).normalize();
  return out;
}

export function proposeMove(
  currentPos: THREE.Vector3,
  moveX: number,
  moveY: number,
  speed: number,
  dt: number,
  camera: THREE.Camera,
  rigYaw: number,
  presenting: boolean,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  getHeadForward(camera, rigYaw, presenting, _fwd);
  getHeadRight(camera, rigYaw, presenting, _right);
  const dist = speed * dt;
  out.copy(currentPos);
  out.addScaledVector(_fwd, moveY * dist);
  out.addScaledVector(_right, moveX * dist);
  return out;
}

export function teleportFeet(
  rigGroup: THREE.Object3D,
  camera: THREE.Camera,
  targetX: number,
  targetZ: number,
): void {
  camera.getWorldPosition(_headWorld);
  const ox = _headWorld.x - rigGroup.position.x;
  const oz = _headWorld.z - rigGroup.position.z;
  rigGroup.position.x = targetX - ox;
  rigGroup.position.z = targetZ - oz;
}

export class LocomotionSystem {
  private snapCool = 0;
  private teleportArmed = false;
  private teleportTarget: THREE.Vector3 | null = null;
  private marker: THREE.Mesh;
  private rayLine: THREE.Line;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.28, 28),
      new THREE.MeshBasicMaterial({
        color: 0x6ee7a8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);

    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1),
    ]);
    this.rayLine = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0x6ee7a8, transparent: true, opacity: 0.55 }),
    );
    this.rayLine.visible = false;
    scene.add(this.rayLine);
  }

  update(
    dt: number,
    actions: ActionState,
    rig: LocomotionRig,
    comfort: VRComfortConfig,
    presenting: boolean,
    controllers: RayProvider | { getPrimaryRay: RayProvider } | null,
    collide: (pos: THREE.Vector3, radius: number) => void,
    isWalkable: FloorProbe,
    _adapter?: XRSessionAdapter,
  ): LocomotionResult {
    const result: LocomotionResult = { moved: false, turned: false, teleported: false };
    if (!presenting) {
      this.marker.visible = false;
      this.rayLine.visible = false;
      return result;
    }
    if (this.snapCool > 0) this.snapCool -= dt;

    if (comfort.turn === "snap") {
      if (Math.abs(actions.turnX) > 0.55 && this.snapCool <= 0) {
        const ang = computeSnapTurnAngle(comfort.snapAngleDeg, actions.turnX);
        if (rig.rotateAroundHead) {
          rig.rotateAroundHead(ang);
        } else {
          rotateAroundHead(rig.camera, rig.group, ang);
        }
        this.snapCool = 0.28;
        result.turned = true;
      }
    } else if (Math.abs(actions.turnX) > 0.12) {
      const turnAmount = -actions.turnX * comfort.smoothTurnSpeed * dt;
      if (rig.rotateAroundHead) {
        rig.rotateAroundHead(turnAmount);
      } else {
        rotateAroundHead(rig.camera, rig.group, turnAmount);
      }
      result.turned = true;
    }

    const speed = clampMoveSpeed(comfort.moveSpeed);
    const smoothOn =
      comfort.smoothEnabled && (comfort.locomotion === "smooth" || comfort.locomotion === "both");
    if (smoothOn && (Math.abs(actions.moveX) > 0.05 || Math.abs(actions.moveY) > 0.05)) {
      const radius = rig.radius ?? 0.22;
      let proposed: THREE.Vector3;
      if (rig.proposeMove) {
        proposed = rig.proposeMove(actions.moveX, actions.moveY, speed, dt, presenting);
      } else {
        proposed = proposeMove(
          rig.group.position,
          actions.moveX,
          actions.moveY,
          speed,
          dt,
          rig.camera,
          rig.yaw ?? rig.group.rotation.y,
          presenting,
        );
      }
      collide(proposed, radius);
      if (isWalkable(proposed.x, proposed.z)) {
        if (rig.commitPosition) {
          rig.commitPosition(proposed.x, proposed.z);
        } else {
          rig.group.position.x = proposed.x;
          rig.group.position.z = proposed.z;
        }
        result.moved = true;
      }
    }

    const teleportOn =
      comfort.teleportEnabled &&
      (comfort.locomotion === "teleport" || comfort.locomotion === "both");
    if (teleportOn) {
      const aiming = actions.teleportHeld;
      const getRay: RayProvider | null =
        typeof controllers === "function"
          ? controllers
          : controllers?.getPrimaryRay
            ? (outO, outD) => (controllers as { getPrimaryRay: RayProvider }).getPrimaryRay(outO, outD)
            : null;
      if (aiming && getRay) {
        const ok = getRay(_origin, _dir);
        if (ok) {
          const t = _dir.y < -0.04 ? -(_origin.y - 0.02) / _dir.y : -1;
          if (t > 0.25 && t < 10) {
            _hit.copy(_origin).addScaledVector(_dir, t);
            const valid = isWalkable(_hit.x, _hit.z);
            this.teleportTarget = valid ? _hit.clone() : null;
            this.marker.visible = true;
            this.marker.position.set(_hit.x, 0.03, _hit.z);
            (this.marker.material as THREE.MeshBasicMaterial).color.setHex(
              valid ? 0x6ee7a8 : 0xf87171,
            );
            this.rayLine.visible = true;
            const pos = this.rayLine.geometry.attributes.position as THREE.BufferAttribute;
            pos.setXYZ(0, _origin.x, _origin.y, _origin.z);
            pos.setXYZ(1, _hit.x, 0.03, _hit.z);
            pos.needsUpdate = true;
            this.teleportArmed = valid;
          } else {
            this.hideTeleport();
          }
        }
      } else {
        if (this.teleportArmed && this.teleportTarget && !aiming) {
          const p = this.teleportTarget;
          const probe = new THREE.Vector3(p.x, 0, p.z);
          const radius = rig.radius ?? 0.22;
          collide(probe, radius);
          if (isWalkable(probe.x, probe.z)) {
            if (rig.teleportFeet) {
              rig.teleportFeet(probe.x, probe.z);
            } else {
              teleportFeet(rig.group, rig.camera, probe.x, probe.z);
            }
            result.teleported = true;
          }
        }
        this.hideTeleport();
      }
    } else {
      this.hideTeleport();
    }

    return result;
  }

  private hideTeleport() {
    this.teleportArmed = false;
    this.teleportTarget = null;
    this.marker.visible = false;
    this.rayLine.visible = false;
  }

  dispose() {
    this.scene.remove(this.marker);
    this.scene.remove(this.rayLine);
    this.marker.geometry.dispose();
    (this.marker.material as THREE.Material).dispose();
    this.rayLine.geometry.dispose();
    (this.rayLine.material as THREE.Material).dispose();
  }
}
