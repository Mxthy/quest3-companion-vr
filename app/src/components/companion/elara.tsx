import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerSim } from "@/lib/companion/player-ref";
import { useCompanion } from "@/lib/companion/store";
import { registerAdultAnchor, unregisterAdultAnchor } from "@/lib/companion/adult";
import type { ZoneId } from "@/core/adult/TouchZoneSystem";

/** Adult touch-zone anchors in torso space (content/adult_interaction.yaml zones).
 *  Placeholder rig; move onto VRM bones when the VRM companion lands. */
const ZONE_ANCHORS: Array<[ZoneId, [number, number, number]]> = [
  ["head", [0, 0.66, 0.02]],
  ["mouth", [0, 0.55, 0.16]],
  ["breast_l", [0.09, 0.4, 0.12]],
  ["breast_r", [-0.09, 0.4, 0.12]],
  ["waist", [0, 0.22, 0.12]],
  ["hip_l", [0.09, 0.02, 0.08]],
  ["hip_r", [-0.09, 0.02, 0.08]],
  ["glute_l", [0.08, 0.02, -0.16]],
  ["glute_r", [-0.08, 0.02, -0.16]],
  ["thigh_l", [0.09, -0.22, 0.12]],
  ["thigh_r", [-0.09, -0.22, 0.12]],
  ["groin", [0, -0.02, 0.12]],
  ["hand_l", [0.24, 0.06, 0.06]],
  ["hand_r", [-0.24, 0.06, 0.06]],
];

export function Elara() {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const anchors = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const g = anchors.current;
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
  }, []);
  const blink = useRef(1);
  const nextBlink = useRef(2.4);

  const usedCup = useCompanion((s) => s.used.cup);
  const musicOn = useCompanion((s) => s.musicOn);
  const speech = useCompanion((s) => s.speech);
  const near = useCompanion((s) => s.nearElara);

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({
        color: "#c4a07a",
        roughness: 0.62,
        metalness: 0.04,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: "#1c1612",
        roughness: 0.45,
        metalness: 0.08,
      }),
      dress: new THREE.MeshStandardMaterial({
        color: "#6a7874",
        roughness: 0.7,
        metalness: 0.05,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: "#1a1614",
        roughness: 0.3,
        emissive: "#2a221c",
        emissiveIntensity: 0.2,
      }),
      core: new THREE.MeshStandardMaterial({
        color: "#e8c09a",
        emissive: "#d4a574",
        emissiveIntensity: 1.4,
        roughness: 0.35,
      }),
      lip: new THREE.MeshStandardMaterial({
        color: "#b07060",
        roughness: 0.45,
      }),
    }),
    [],
  );

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const t = state.clock.elapsedTime;
    const breath = Math.sin(t * 1.35) * 0.012;
    if (torso.current) torso.current.position.y = breath;
    if (root.current) {
      const sway = musicOn ? Math.sin(t * 1.8) * 0.045 : Math.sin(t * 0.55) * 0.012;
      root.current.rotation.y = sway;
    }

    nextBlink.current -= dt;
    if (nextBlink.current <= 0) {
      blink.current = 0.08;
      nextBlink.current = 2.2 + Math.random() * 3.2;
    }
    blink.current = THREE.MathUtils.lerp(blink.current, 1, 1 - Math.exp(-14 * dt));
    if (lids.current) lids.current.scale.y = blink.current;

    if (head.current) {
      const dx = playerSim.position.x - 0;
      const dz = playerSim.position.z - -1.52;
      const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -0.85, 0.85);
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, yaw, 3.4, dt);
      const pitch = THREE.MathUtils.clamp((playerSim.position.y - 1.35) * 0.12, -0.18, 0.16);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, pitch, 3.4, dt);
    }

    if (lArm.current && rArm.current) {
      const cupPose = usedCup ? 0.55 : 0.12;
      const listen = near ? 0.18 : 0;
      lArm.current.rotation.x = THREE.MathUtils.damp(
        lArm.current.rotation.x,
        -0.35 - cupPose + Math.sin(t * 1.2) * 0.04,
        4,
        dt,
      );
      rArm.current.rotation.x = THREE.MathUtils.damp(
        rArm.current.rotation.x,
        -0.28 - listen + Math.sin(t * 1.1 + 1) * 0.04,
        4,
        dt,
      );
    }
  });

  return (
    <group ref={root} position={[0, 0.46, -1.52]}>
      <mesh position={[0.09, 0.08, 0.16]} rotation={[1.12, 0, 0]} castShadow material={mats.skin}>
        <capsuleGeometry args={[0.075, 0.28, 6, 10]} />
      </mesh>
      <mesh position={[-0.09, 0.08, 0.16]} rotation={[1.12, 0, 0]} castShadow material={mats.skin}>
        <capsuleGeometry args={[0.075, 0.28, 6, 10]} />
      </mesh>
      <mesh position={[0.1, -0.12, 0.34]} rotation={[0.15, 0, 0]} castShadow material={mats.skin}>
        <capsuleGeometry args={[0.06, 0.26, 6, 10]} />
      </mesh>
      <mesh position={[-0.1, -0.12, 0.34]} rotation={[0.15, 0, 0]} castShadow material={mats.skin}>
        <capsuleGeometry args={[0.06, 0.26, 6, 10]} />
      </mesh>

      <group ref={torso}>
        <mesh position={[0, 0.28, 0]} castShadow material={mats.dress}>
          <capsuleGeometry args={[0.15, 0.28, 8, 12]} />
        </mesh>
        <mesh position={[0, 0.06, 0.05]} scale={[1.2, 0.42, 1.05]} castShadow material={mats.dress}>
          <sphereGeometry args={[0.28, 16, 12]} />
        </mesh>
        <mesh position={[0, 0.34, 0.1]} castShadow material={mats.core}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
        <pointLight position={[0, 0.36, 0.12]} color="#d4a574" intensity={4.2} distance={3.2} decay={2} />

        <group ref={lArm} position={[0.2, 0.38, 0]}>
          <mesh position={[0.02, -0.14, 0]} rotation={[0.2, 0, 0.25]} castShadow material={mats.skin}>
            <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
          </mesh>
          <mesh position={[0.04, -0.32, 0.06]} rotation={[0.5, 0, 0.1]} castShadow material={mats.skin}>
            <capsuleGeometry args={[0.036, 0.18, 6, 8]} />
          </mesh>
        </group>
        <group ref={rArm} position={[-0.2, 0.38, 0]}>
          <mesh position={[-0.02, -0.14, 0]} rotation={[0.15, 0, -0.22]} castShadow material={mats.skin}>
            <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
          </mesh>
          <mesh position={[-0.04, -0.32, 0.05]} rotation={[0.4, 0, -0.1]} castShadow material={mats.skin}>
            <capsuleGeometry args={[0.036, 0.18, 6, 8]} />
          </mesh>
        </group>

        <group ref={head} position={[0, 0.58, 0.02]}>
          <mesh castShadow scale={[0.92, 1.06, 0.9]} material={mats.skin}>
            <sphereGeometry args={[0.115, 20, 20]} />
          </mesh>
          <mesh position={[0, 0.06, -0.02]} scale={[1.05, 0.7, 1.05]} castShadow material={mats.hair}>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>
          <mesh position={[0.08, 0.02, 0.02]} rotation={[0, 0, 0.4]} castShadow material={mats.hair}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          <mesh position={[-0.08, 0.02, 0.02]} rotation={[0, 0, -0.4]} castShadow material={mats.hair}>
            <sphereGeometry args={[0.055, 12, 12]} />
          </mesh>
          <group ref={lids}>
            <mesh position={[0.038, 0.02, 0.1]} material={mats.eye}>
              <sphereGeometry args={[0.016, 10, 10]} />
            </mesh>
            <mesh position={[-0.038, 0.02, 0.1]} material={mats.eye}>
              <sphereGeometry args={[0.016, 10, 10]} />
            </mesh>
          </group>
          <mesh position={[0.038, 0.026, 0.112]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshBasicMaterial color="#f3ebe0" />
          </mesh>
          <mesh position={[-0.038, 0.026, 0.112]}>
            <sphereGeometry args={[0.004, 6, 6]} />
            <meshBasicMaterial color="#f3ebe0" />
          </mesh>
          <mesh position={[0, -0.028, 0.1]} scale={[0.7, speech ? 1.4 : 0.7, 1]} material={mats.lip}>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
          </mesh>
        </group>

        <group ref={anchors}>
          {ZONE_ANCHORS.map(([id, pos]) => (
            <group key={id} position={pos} userData={{ adultZone: id }} />
          ))}
        </group>
      </group>
    </group>
  );
}
