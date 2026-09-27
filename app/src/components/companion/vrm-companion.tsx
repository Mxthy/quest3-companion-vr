/**
 * VRM companion (Phase 2): loads /models/vivi.vrm when present and maps the
 * adult touch zones onto humanoid bones. Falls back to the Elara placeholder
 * (same anchor contract) when the file is missing or fails to load.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { Elara } from "./elara";
import { registerAdultAnchor, unregisterAdultAnchor } from "./adult-anchors";
import { playerSim } from "@/lib/companion/player-ref";
import type { ZoneId } from "@/core/adult/TouchZoneSystem";

const VRM_URL = "/models/vivi.vrm";

const ZONE_BONES: Array<[ZoneId, string, [number, number, number]]> = [
  ["head", "head", [0, 0.08, 0.02]],
  ["mouth", "head", [0, -0.06, 0.09]],
  ["breast_l", "chest", [0.09, 0.02, 0.09]],
  ["breast_r", "chest", [-0.09, 0.02, 0.09]],
  ["waist", "spine", [0, 0.02, 0.11]],
  ["hip_l", "hips", [0.09, 0, 0.07]],
  ["hip_r", "hips", [-0.09, 0, 0.07]],
  ["glute_l", "hips", [0.09, -0.02, -0.08]],
  ["glute_r", "hips", [-0.09, -0.02, -0.08]],
  ["thigh_l", "leftUpperLeg", [0.02, 0, 0.05]],
  ["thigh_r", "rightUpperLeg", [-0.02, 0, 0.05]],
  ["groin", "hips", [0, -0.06, 0.08]],
  ["hand_l", "leftHand", [0, 0, 0]],
  ["hand_r", "rightHand", [0, 0, 0]],
];

const Q_TMP = new THREE.Quaternion();
const OFF_TMP = new THREE.Vector3();

type RestPose = {
  spineX: number;
  chestZ: number;
  hipsY: number;
  leftArmZ: number;
  rightArmZ: number;
  leftForearmZ: number;
  rightForearmZ: number;
  headX: number;
  headY: number;
};

function VrmBody({ vrm }: { vrm: VRM }) {
  const root = useRef<THREE.Group>(null);
  const anchorsRoot = useRef<THREE.Group>(null);
  const bones = useMemo(() => {
    const map = new Map<ZoneId, [THREE.Object3D | null, THREE.Vector3]>();
    for (const [zone, boneName, off] of ZONE_BONES) {
      const node = vrm.humanoid.getNormalizedBoneNode(boneName as never);
      map.set(zone, [node, new THREE.Vector3(...off)]);
    }
    return map;
  }, [vrm]);

  const head = vrm.humanoid.getNormalizedBoneNode("head");
  const spine = vrm.humanoid.getNormalizedBoneNode("spine");
  const chest = vrm.humanoid.getNormalizedBoneNode("chest");
  const hips = vrm.humanoid.getNormalizedBoneNode("hips");
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode("leftLowerArm");
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");
  const restPose = useRef<RestPose | null>(null);

  // Relax the imported T/A pose once, then animate small offsets around it.
  useLayoutEffect(() => {
    restPose.current = {
      spineX: spine?.rotation.x ?? 0,
      chestZ: chest?.rotation.z ?? 0,
      hipsY: hips?.rotation.y ?? 0,
      leftArmZ: 1.0,
      rightArmZ: -1.0,
      leftForearmZ: (leftLowerArm?.rotation.z ?? 0) - 0.12,
      rightForearmZ: (rightLowerArm?.rotation.z ?? 0) + 0.12,
      headX: head?.rotation.x ?? 0,
      headY: head?.rotation.y ?? 0,
    };
    if (leftUpperArm) leftUpperArm.rotation.z = 1.0;
    if (rightUpperArm) rightUpperArm.rotation.z = -1.0;
    if (leftLowerArm) leftLowerArm.rotation.z = restPose.current.leftForearmZ;
    if (rightLowerArm) rightLowerArm.rotation.z = restPose.current.rightForearmZ;

    const g = anchorsRoot.current;
    if (!g) return;
    const found: Array<[ZoneId, THREE.Object3D]> = [];
    g.traverse((o) => {
      const z = (o.userData as { adultZone?: ZoneId }).adultZone;
      if (z) found.push([z, o]);
    });
    for (const [z, o] of found) registerAdultAnchor(z, o);
    return () => {
      for (const [z] of found) unregisterAdultAnchor(z);
    };
  }, [chest, head, hips, leftLowerArm, leftUpperArm, rightLowerArm, rightUpperArm, spine]);

  useEffect(() => {
    return () => {
      VRMUtils.deepDispose(vrm.scene);
    };
  }, [vrm]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const t = state.clock.elapsedTime;
    const rest = restPose.current;

    if (rest) {
      const breath = Math.sin(t * 1.35);
      const weight = Math.sin(t * 0.42);
      if (spine) spine.rotation.x = rest.spineX + breath * 0.018;
      if (chest) chest.rotation.z = rest.chestZ + weight * 0.025;
      if (hips) hips.rotation.y = rest.hipsY + weight * 0.018;
      if (leftUpperArm) leftUpperArm.rotation.z = rest.leftArmZ + breath * 0.022 + weight * 0.015;
      if (rightUpperArm) rightUpperArm.rotation.z = rest.rightArmZ - breath * 0.022 + weight * 0.015;
      if (leftLowerArm) leftLowerArm.rotation.z = rest.leftForearmZ + Math.sin(t * 0.7) * 0.018;
      if (rightLowerArm) rightLowerArm.rotation.z = rest.rightForearmZ - Math.sin(t * 0.7) * 0.018;

      if (head) {
        const dx = playerSim.position.x;
        const dz = playerSim.position.z + 1.52;
        const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -0.85, 0.85);
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, rest.headY + yaw, 3.4, dt);
        const pitch = THREE.MathUtils.clamp((playerSim.position.y - 1.35) * 0.12, -0.18, 0.16);
        const idleNod = Math.sin(t * 0.55) * 0.012;
        head.rotation.x = THREE.MathUtils.damp(head.rotation.x, rest.headX + pitch + idleNod, 3.4, dt);
      }
    }

    vrm.update(dt);

    if (anchorsRoot.current) {
      for (const [zone, [bone, off]] of bones) {
        const target = anchorsRoot.current.children.find(
          (c) => (c.userData as { adultZone?: ZoneId }).adultZone === zone,
        );
        if (!target || !bone) continue;
        bone.getWorldPosition(target.position);
        bone.getWorldQuaternion(Q_TMP);
        OFF_TMP.copy(off).applyQuaternion(Q_TMP);
        target.position.add(OFF_TMP);
      }
    }
  });

  return (
    <>
      <group ref={root} position={[0, 0, -1.52]}>
        <primitive object={vrm.scene} />
      </group>
      <group ref={anchorsRoot}>
        {ZONE_BONES.map(([zone]) => (
          <group key={zone} userData={{ adultZone: zone }} />
        ))}
      </group>
    </>
  );
}

export function VrmCompanion() {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load(
      VRM_URL,
      (gltf) => {
        const v = (gltf.userData as { vrm?: VRM }).vrm;
        if (!alive) return;
        if (v) {
          v.scene.traverse((o) => {
            o.castShadow = true;
            o.frustumCulled = false;
          });
          setVrm(v);
        } else {
          setFailed(true);
        }
      },
      undefined,
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  if (vrm) return <VrmBody vrm={vrm} />;
  if (failed) return <Elara />;
  return null;
}
