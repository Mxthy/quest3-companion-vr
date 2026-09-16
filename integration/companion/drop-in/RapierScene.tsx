/**
 * Quest 3–oriented Rapier scaffold (rigid layer).
 * Soft toys stay on Verlet SoftToyScene — do not put silicone chain under Rapier dynamics.
 *
 * Requires peer: @react-three/rapier @react-three/xr three
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

/** Floor + simple table — static. */
export function RoomColliders() {
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[4, 0.05, 4]} position={[0, -0.05, 0]} />
      </RigidBody>
      {/* table top approx */}
      <RigidBody type="fixed" colliders={false} position={[0.2, 0.72, -0.4]}>
        <CuboidCollider args={[0.45, 0.03, 0.3]} />
      </RigidBody>
    </>
  );
}

/** Dynamic cup — CCD on for fast grabs. */
export function DynamicCup({
  position = [0.35, 0.85, -0.35] as [number, number, number],
}) {
  return (
    <RigidBody
      position={position}
      colliders={false}
      restitution={0.15}
      friction={0.6}
      linearDamping={0.4}
      angularDamping={0.5}
      ccd
    >
      <CuboidCollider args={[0.04, 0.045, 0.04]} />
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.45} />
      </mesh>
    </RigidBody>
  );
}

/**
 * Kinematic hand proxy — follow camera reach or XR controller each frame.
 * Never type="dynamic". CCD on to reduce tunneling through props.
 */
export function KinematicHandProxy({
  getPose,
}: {
  /** World position of palm / grip. */
  getPose: () => { pos: THREE.Vector3; quat: THREE.Quaternion };
}) {
  const body = useRef<RapierRigidBody>(null);

  useFrame(() => {
    const b = body.current;
    if (!b) return;
    const { pos, quat } = getPose();
    b.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
    b.setNextKinematicRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} ccd>
      <BallCollider args={[0.04]} />
    </RigidBody>
  );
}

/** Desktop demo: kinematic ball follows camera reach. */
export function DesktopKinematicReach() {
  const tmpP = useRef(new THREE.Vector3());
  const tmpQ = useRef(new THREE.Quaternion());
  return (
    <KinematicHandProxy
      getPose={() => {
        // filled by parent via closure if needed — placeholder zeros
        return { pos: tmpP.current, quat: tmpQ.current };
      }}
    />
  );
}

/**
 * Full rigid physics root. Mount SoftToyScene as sibling OUTSIDE or inside without double gravity.
 *
 * @example
 * <Physics gravity={[0, -9.81, 0]} timeStep={1/90}>
 *   <RoomColliders />
 *   <DynamicCup />
 * </Physics>
 * <SoftToyScene />
 */
export function RapierRigidLayer({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 90}>
      <RoomColliders />
      <DynamicCup />
      {children}
    </Physics>
  );
}
