import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { registerInteract } from "@/lib/companion/interact";
import { useCompanion } from "@/lib/companion/store";

function useRegister(id: string) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => registerInteract(id, ref.current), []);
  return ref;
}

export function CupMesh({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.038, 0.08, 16]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.45} />
      </mesh>
      <mesh position={[0.05, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.028, 0.007, 8, 16]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
        <meshStandardMaterial color="#c4b09a" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function VinylMesh({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#1a1816" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.035, 20]} />
        <meshStandardMaterial color="#c8b09a" roughness={0.55} />
      </mesh>
    </group>
  );
}

export function LanternMesh({ lit, scale = 1 }: { lit?: boolean; scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial
          color="#d8c4a4"
          transparent
          opacity={0.45}
          roughness={0.2}
          emissive={lit ? "#d4a574" : "#000000"}
          emissiveIntensity={lit ? 0.9 : 0}
        />
      </mesh>
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial color="#2a221c" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial color="#2a221c" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Adult prop stub (content/props_adult.yaml: toy_wand). Original mesh, geo placeholder. */
export function ToyWandMesh({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.017, 0.18, 12]} />
        <meshStandardMaterial color="#caa6a0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#d8b4b0"
          roughness={0.35}
          emissive="#c98a80"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

export function Interactables() {
  const cupRef = useRegister("cup");
  const vinylRef = useRegister("vinyl");
  const lanternRef = useRegister("lantern");
  const toyRef = useRegister("toy_wand");
  const elaraRef = useRegister("elara");
  const chairRef = useRegister("chair");
  const playerRef = useRegister("player");
  const tableRef = useRegister("table");

  const held = useCompanion((s) => s.held);
  const used = useCompanion((s) => s.used);
  const lookId = useCompanion((s) => s.lookId);
  const lanternLit = useCompanion((s) => s.lanternLit);

  const highlight = (id: string) => (lookId === id ? 0.22 : 0);

  return (
    <group>
      <group ref={cupRef} position={used.cup ? [-0.22, 0.62, -1.28] : [0.22, 0.38, -0.28]} visible={held !== "cup"}>
        <CupMesh />
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial transparent opacity={highlight("cup")} color="#f3ebe0" depthWrite={false} />
        </mesh>
      </group>

      <group
        ref={vinylRef}
        position={used.vinyl ? [2.37, 0.81, 0.37] : [2.05, 0.8, 0.35]}
        visible={held !== "vinyl"}
      >
        <VinylMesh />
      </group>

      <group ref={toyRef} position={[-0.45, 0.66, -1.3]} visible={held !== "toy_wand"}>
        <ToyWandMesh />
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial
            transparent
            opacity={highlight("toy_wand")}
            color="#f3ebe0"
            depthWrite={false}
          />
        </mesh>
      </group>

      <group
        ref={lanternRef}
        position={used.lantern ? [0.28, 0.38, -0.42] : [-2.9, 0.55, 0.35]}
        visible={held !== "lantern"}
      >
        <LanternMesh lit={lanternLit} />
      </group>

      <group ref={elaraRef} position={[0, 0.9, -1.52]}>
        <mesh>
          <boxGeometry args={[0.55, 1.3, 0.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <group ref={chairRef} position={[0.62, 0.4, 0.55]}>
        <mesh>
          <boxGeometry args={[0.55, 0.8, 0.55]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <group ref={playerRef} position={[2.37, 0.82, 0.37]}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.45]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <group ref={tableRef} position={[0.05, 0.32, -0.38]}>
        <mesh>
          <boxGeometry args={[0.95, 0.2, 0.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
