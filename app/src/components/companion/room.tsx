import { useMemo } from "react";
import * as THREE from "three";
import { useRoomTextures } from "@/lib/companion/textures";
import { useCompanion } from "@/lib/companion/store";

function Dust() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 80;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = 0.3 + Math.random() * 2.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#e8d4b8" size={0.018} transparent opacity={0.35} depthWrite={false} />
    </points>
  );
}

export function Room() {
  const tex = useRoomTextures();
  const lanternLit = useCompanion((s) => s.lanternLit);
  const bond = useCompanion((s) => s.bond);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a4038",
        map: tex.plaster,
        roughness: 0.92,
      }),
    [tex.plaster],
  );
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8a6a52",
        map: tex.wood,
        roughness: 0.68,
      }),
    [tex.wood],
  );

  return (
    <group>
      <ambientLight intensity={0.42} color="#3a322c" />
      <hemisphereLight args={["#8a7a6c", "#1c1612", 0.55]} />
      <directionalLight position={[-5.5, 2.6, 0.2]} intensity={1.15} color="#9aadc8" />
      <pointLight
        position={[1.55, 1.82, -1.55]}
        color="#ffc9a0"
        intensity={bond >= 40 ? 55 : 42}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />
      <pointLight position={[0.15, 2.15, -0.2]} color="#f0d8c0" intensity={22} distance={8} decay={2} />
      <pointLight position={[-2.4, 1.6, 0.15]} color="#7d90b0" intensity={10} distance={6} decay={2} />
      {lanternLit && (
        <pointLight position={[0.2, 0.72, -0.32]} color="#ffd2a8" intensity={10} distance={5} decay={2} />
      )}

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} receiveShadow>
        <planeGeometry args={[7.4, 6.6]} />
        <meshStandardMaterial color="#c4a078" map={tex.wood} roughness={0.72} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.72, 0.2]}>
        <planeGeometry args={[7.4, 6.6]} />
        <meshStandardMaterial color="#2a2420" roughness={1} />
      </mesh>

      {/* walls */}
      <mesh position={[0, 1.36, -2.95]} material={wallMat} receiveShadow>
        <boxGeometry args={[7.4, 2.72, 0.12]} />
      </mesh>
      <mesh position={[0, 1.36, 3.45]} material={wallMat}>
        <boxGeometry args={[7.4, 2.72, 0.12]} />
      </mesh>
      <mesh position={[3.7, 1.36, 0.25]} material={wallMat} receiveShadow>
        <boxGeometry args={[0.12, 2.72, 6.6]} />
      </mesh>
      <mesh position={[-3.7, 1.36, 0.25]} material={wallMat} receiveShadow>
        <boxGeometry args={[0.12, 2.72, 6.6]} />
      </mesh>

      {/* window */}
      <mesh position={[-3.62, 1.45, 0.15]}>
        <planeGeometry args={[0.04, 1.7, 1]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[-3.58, 1.45, 0.15]}>
        <planeGeometry args={[2.2, 1.55]} />
        <meshBasicMaterial map={tex.city} />
      </mesh>
      <mesh position={[-3.5, 1.45, 0.15]}>
        <planeGeometry args={[2.28, 1.64]} />
        <meshStandardMaterial color="#1a1612" roughness={0.4} metalness={0.3} transparent opacity={0.18} />
      </mesh>
      {/* curtains */}
      <mesh position={[-3.48, 1.4, -1.15]} castShadow>
        <boxGeometry args={[0.08, 2.2, 0.55]} />
        <meshStandardMaterial color="#2c201c" roughness={0.85} />
      </mesh>
      <mesh position={[-3.48, 1.4, 1.45]} castShadow>
        <boxGeometry args={[0.08, 2.2, 0.55]} />
        <meshStandardMaterial color="#2c201c" roughness={0.85} />
      </mesh>

      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -0.35]} receiveShadow>
        <planeGeometry args={[2.6, 2.2]} />
        <meshStandardMaterial map={tex.rug} roughness={0.95} color="#6a4a40" />
      </mesh>

      {/* sofa */}
      <group position={[0, 0, -1.85]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.38, 0.72]} />
          <meshStandardMaterial color="#6a5248" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.58, -0.28]} castShadow>
          <boxGeometry args={[1.85, 0.55, 0.18]} />
          <meshStandardMaterial color="#3f302c" roughness={0.88} />
        </mesh>
        <mesh position={[-0.92, 0.42, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.7]} />
          <meshStandardMaterial color="#3f302c" roughness={0.88} />
        </mesh>
        <mesh position={[0.92, 0.42, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.7]} />
          <meshStandardMaterial color="#3f302c" roughness={0.88} />
        </mesh>
      </group>

      {/* player chair */}
      <group position={[0.62, 0, 0.55]}>
        <mesh position={[0, 0.24, 0]} castShadow>
          <boxGeometry args={[0.48, 0.08, 0.48]} />
          <meshStandardMaterial color="#4e3c34" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.48, -0.2]} castShadow>
          <boxGeometry args={[0.48, 0.42, 0.08]} />
          <meshStandardMaterial color="#43342e" roughness={0.8} />
        </mesh>
        {[
          [-0.18, 0.12, -0.18],
          [0.18, 0.12, -0.18],
          [-0.18, 0.12, 0.18],
          [0.18, 0.12, 0.18],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} material={woodMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
          </mesh>
        ))}
      </group>

      {/* coffee table */}
      <mesh position={[0.05, 0.28, -0.38]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[0.85, 0.06, 0.5]} />
      </mesh>
      <mesh position={[0.05, 0.14, -0.38]} material={woodMat}>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
      </mesh>

      {/* sideboard + record player body */}
      <group position={[2.25, 0, 0.35]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[0.9, 0.76, 0.42]} />
        </mesh>
        <mesh position={[0.12, 0.78, 0.02]} castShadow>
          <boxGeometry args={[0.42, 0.04, 0.36]} />
          <meshStandardMaterial color="#1a1614" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0.8, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial color="#1c1a18" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* floor lamp */}
      <group position={[1.55, 0, -1.55]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 1.8, 8]} />
          <meshStandardMaterial color="#2a2420" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.82, 0]}>
          <coneGeometry args={[0.22, 0.28, 12]} />
          <meshStandardMaterial
            color="#f0d8b8"
            emissive="#d4a574"
            emissiveIntensity={0.8}
            roughness={0.7}
          />
        </mesh>
      </group>

      {/* plant */}
      <group position={[-2.55, 0, -1.9]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.22, 10]} />
          <meshStandardMaterial color="#6a4032" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color="#3a5244" roughness={0.85} />
        </mesh>
        <mesh position={[0.16, 0.7, 0.08]} castShadow>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial color="#2f4a3c" roughness={0.85} />
        </mesh>
      </group>

      {/* bookshelf */}
      <group position={[2.4, 0, -1.7]}>
        <mesh position={[0, 0.9, 0]} castShadow material={woodMat}>
          <boxGeometry args={[0.7, 1.8, 0.28]} />
        </mesh>
        {[0.35, 0.75, 1.15, 1.5].map((y, i) => (
          <mesh key={i} position={[0.02, y, 0.08]}>
            <boxGeometry args={[0.58, 0.22, 0.16]} />
            <meshStandardMaterial
              color={i % 2 ? "#3a3330" : "#4a3832"}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* baseboard hint */}
      <mesh position={[0, 0.04, -2.86]}>
        <boxGeometry args={[7.2, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1612" />
      </mesh>

      <Dust />
    </group>
  );
}

export const COLLIDERS: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [
  { minX: -1.05, maxX: 1.05, minZ: -2.35, maxZ: -1.4 }, // sofa
  { minX: -0.42, maxX: 0.5, minZ: -0.7, maxZ: -0.08 }, // table
  { minX: 1.7, maxX: 2.75, minZ: 0.05, maxZ: 0.7 }, // sideboard
  { minX: 1.95, maxX: 2.8, minZ: -2.05, maxZ: -1.4 }, // shelf
  { minX: -2.8, maxX: -2.3, minZ: -2.15, maxZ: -1.65 }, // plant
];

export const ROOM_BOUNDS = { minX: -3.35, maxX: 3.35, minZ: -2.55, maxZ: 3.15 };
