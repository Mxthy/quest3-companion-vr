/**
 * VRM companion (Phase 2): loads /models/vivi.vrm when present and maps the
 * adult touch zones onto humanoid bones. Falls back to the Elara placeholder
 * (same anchor contract) when the file is missing or fails to load.
 *
 * Anchor strategy: detached Object3Ds in a scene-root group; each frame the
 * bone world pose is copied in (world pos + world-quaternion-rotated offset).
 * This survives rig differences (raw bone names, proxy hierarchies).
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { Elara } from "./elara";
import { registerAdultAnchor, unregisterAdultAnchor } from "@/lib/companion/adult";
import { playerSim } from "@/lib/companion/player-ref";
import type { ZoneId } from "@/core/adult/TouchZoneSystem";

const VRM_URL = "/models/vivi.vrm";

/** Zone -> humanoid bone + local offset (bone space, meters). */
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

  // A-pose arms + anchor registration
  useLayoutEffect(() => {
    const lArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    const rArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    if (lArm) lArm.rotation.z = 1.15;
    if (rArm) rArm.rotation.z = -1.15;

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
  }, [vrm]);

  useEffect(() => {
    return () => {
      VRMUtils.deepDispose(vrm.scene);
    };
  }, [vrm]);

  const head = vrm.humanoid.getNormalizedBoneNode("head");
  const spine = vrm.humanoid.getNormalizedBoneNode("spine");

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const t = state.clock.elapsedTime;

    // Breathing via spine sway; head tracks the player like the placeholder.
    if (spine) spine.rotation.x = Math.sin(t * 1.35) * 0.012;
    if (head) {
      const dx = playerSim.position.x - 0;
      const dz = playerSim.position.z - -1.52;
      const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -0.85, 0.85);
      head.rotation.y = THREE.MathUtils.damp(head.rotation.y, yaw, 3.4, dt);
      const pitch = THREE.MathUtils.clamp((playerSim.position.y - 1.35) * 0.12, -0.18, 0.16);
      head.rotation.x = THREE.MathUtils.damp(head.rotation.x, pitch, 3.4, dt);
    }

    vrm.update(dt);

    // Refresh anchor world positions from bone poses.
    if (anchorsRoot.current) {
      for (const [zone, [bone, off]] of bones) {
        const target = anchorsRoot.current.children.find(
          (c) => (c.userData as { adultZone?: ZoneId }).adultZone === zone,
        );
        if (!target || !bone) continue;
        bone.getWorldPosition(target.position);
        target.getWorldQuaternion(Q_TMP);
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
