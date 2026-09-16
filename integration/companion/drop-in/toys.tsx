/**
 * Soft props + play toys with cozy procedural textures.
 * Drop-in next to Interactables; registers interact ids for grab.
 */
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { registerInteract } from "@/lib/companion/interact";
import { useCompanion } from "@/lib/companion/store";
import { usePropTextures } from "./propTextures";

function useRegister(id: string) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => registerInteract(id, ref.current), [id]);
  return ref;
}

export function CupMeshTextured({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.038, 0.08, 20]} />
        <meshStandardMaterial map={t.ceramic} roughness={0.4} metalness={0.02} />
      </mesh>
      <mesh position={[0.05, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.028, 0.007, 8, 16]} />
        <meshStandardMaterial map={t.ceramic} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.012, 16]} />
        <meshStandardMaterial color="#c4b09a" roughness={0.55} />
      </mesh>
    </group>
  );
}

export function VinylMeshTextured({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <circleGeometry args={[0.12, 48]} />
        <meshStandardMaterial map={t.vinyl} roughness={0.32} metalness={0.12} />
      </mesh>
    </group>
  );
}

export function LanternMeshTextured({ lit, scale = 1 }: { lit?: boolean; scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial
          map={t.paper}
          transparent
          opacity={0.55}
          roughness={0.35}
          emissive={lit ? "#d4a574" : "#000000"}
          emissiveIntensity={lit ? 0.85 : 0}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial map={t.metalDark} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial map={t.metalDark} metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Soft silicone-style wand (grab + socket toy). */
export function ToyWandMesh({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow rotation={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.018, 0.14, 6, 12]} />
        <meshStandardMaterial map={t.silicone} roughness={0.28} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.025, 0.05, 12]} />
        <meshStandardMaterial map={t.metalDark} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0.01]} castShadow>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial map={t.silicone} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** Ring prop – soft torus. */
export function ToyRingMesh({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.035, 0.012, 12, 24]} />
        <meshStandardMaterial map={t.siliconeAlt} roughness={0.3} metalness={0.04} />
      </mesh>
    </group>
  );
}

/** Cushion / support prop. */
export function PillowMesh({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.06, 0]} rotation={[0.05, 0.2, 0]}>
        <boxGeometry args={[0.28, 0.1, 0.2]} />
        <meshStandardMaterial map={t.fabric} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Small bottle prop. */
export function LubeBottleMesh({ scale = 1 }: { scale?: number }) {
  const t = usePropTextures();
  return (
    <group scale={scale}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.025, 0.09, 12]} />
        <meshStandardMaterial map={t.glass} transparent opacity={0.75} roughness={0.15} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.025, 10]} />
        <meshStandardMaterial color="#f0e8e0" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Place toys in room; soft props stay in Interactables or swap there. */
export function ToyInteractables() {
  const wandRef = useRegister("toy_wand");
  const ringRef = useRegister("toy_ring");
  const pillowRef = useRegister("pillow_soft");
  const lubeRef = useRegister("lube_bottle");
  const held = useCompanion((s) => s.held);

  return (
    <group>
      {held !== ("toy_wand" as never) && (
        <group ref={wandRef} position={[-0.55, 0.72, -0.35]}>
          <ToyWandMesh />
        </group>
      )}
      {held !== ("toy_ring" as never) && (
        <group ref={ringRef} position={[-0.45, 0.7, -0.28]}>
          <ToyRingMesh />
        </group>
      )}
      {held !== ("pillow_soft" as never) && (
        <group ref={pillowRef} position={[0.9, 0.12, -0.9]}>
          <PillowMesh />
        </group>
      )}
      {held !== ("lube_bottle" as never) && (
        <group ref={lubeRef} position={[0.35, 0.72, -0.4]}>
          <LubeBottleMesh />
        </group>
      )}
    </group>
  );
}
