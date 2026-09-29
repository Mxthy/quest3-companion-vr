import { useMemo } from "react";
import * as THREE from "three";
import { useRoomTextures } from "@/lib/companion/textures";
import { useCompanion } from "@/lib/companion/store";
import { useXrSessionActive } from "@/lib/companion/adult";

// ─── Maisonette layout constants ───────────────────────────────────
// Ground floor: X [-6, 6], Z [-4.5, 4.5], Y 0-5.5 (double height)
// Loft slab:    X [-6, 0.8], Z [-4.5, 4.5], Y 3.2 (bedroom + bath)
// Kitchen/dining: X [1.5, 5.8], Z [-4.5, 4.5] (ground floor right wing)
// Staircase:    X [0.2, 1.4], Z [0.8, 3.8] (connects ground to loft)

export const ROOM_BOUNDS = {
  minX: -5.6,
  maxX: 5.6,
  minZ: -4.1,
  maxZ: 4.1,
};

export const COLLIDERS: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [
  // Living room furniture
  { minX: -2.2, maxX: 0.8, minZ: -3.8, maxZ: -2.5 },  // large sofa
  { minX: -1.0, maxX: 0.6, minZ: -2.1, maxZ: -1.2 },  // coffee table
  { minX: -5.4, maxX: -3.8, minZ: -3.6, maxZ: -2.2 }, // TV unit
  { minX: -5.4, maxX: -4.6, minZ: 0.8, maxZ: 2.0 },   // plant corner
  // Kitchen island
  { minX: 2.2, maxX: 4.8, minZ: 0.2, maxZ: 1.2 },     // kitchen island
  { minX: 2.2, maxX: 5.4, minZ: -3.8, maxZ: -2.6 },   // dining table
  { minX: 3.8, maxX: 5.4, minZ: 1.6, maxZ: 3.2 },     // kitchen counter
  // Small bathroom ground floor
  { minX: 3.6, maxX: 5.8, minZ: -4.5, maxZ: -3.0 },   // bathroom (walls)
  // Staircase footprint
  { minX: 0.2, maxX: 1.4, minZ: 0.8, maxZ: 3.8 },     // staircase (blocked on ground)
  // Loft support column
  { minX: 0.6, maxX: 1.0, minZ: -0.2, maxZ: 0.2 },    // structural column
];

function Dust() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 120;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 11;
      pos[i * 3 + 1] = 0.3 + Math.random() * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#e8d4b8" size={0.016} transparent opacity={0.28} depthWrite={false} />
    </points>
  );
}

/** Wooden staircase from Y=0 to Y=3.2 running along Z axis */
function Staircase({ inXR }: { inXR: boolean }) {
  const steps = 14;
  const stepH = 3.2 / steps;  // ~0.229m per step
  const stepD = 3.0 / steps;  // ~0.214m depth
  const woodMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#8a6a52", roughness: 0.65 }), []);
  const metalMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.7, roughness: 0.3 }), []);

  return (
    <group position={[0.8, 0, 1.0]}>
      {/* treads */}
      {Array.from({ length: steps }, (_, i) => (
        <mesh
          key={i}
          position={[0, stepH * i + stepH * 0.5, stepD * i + stepD * 0.5]}
          castShadow={!inXR}
          receiveShadow={!inXR}
          material={woodMat}
        >
          <boxGeometry args={[1.0, 0.045, stepD]} />
        </mesh>
      ))}
      {/* left stringer */}
      <mesh position={[-0.52, 1.6, 1.5]} rotation={[Math.atan2(3.2, 3.0), 0, 0]} material={metalMat}>
        <boxGeometry args={[0.06, 0.08, 4.42]} />
      </mesh>
      {/* right stringer */}
      <mesh position={[0.52, 1.6, 1.5]} rotation={[Math.atan2(3.2, 3.0), 0, 0]} material={metalMat}>
        <boxGeometry args={[0.06, 0.08, 4.42]} />
      </mesh>
      {/* handrail left */}
      <mesh position={[-0.52, 3.05, 1.5]} rotation={[Math.atan2(3.2, 3.0), 0, 0]} material={metalMat}>
        <boxGeometry args={[0.05, 0.05, 4.42]} />
      </mesh>
      {/* handrail right */}
      <mesh position={[0.52, 3.05, 1.5]} rotation={[Math.atan2(3.2, 3.0), 0, 0]} material={metalMat}>
        <boxGeometry args={[0.05, 0.05, 4.42]} />
      </mesh>
      {/* balusters every 2 steps */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.52, 1.5 + i * 0.42, 0.3 + i * 0.82]} material={metalMat}>
          <cylinderGeometry args={[0.02, 0.02, 1.05, 6]} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0.52, 1.5 + i * 0.42, 0.3 + i * 0.82]} material={metalMat}>
          <cylinderGeometry args={[0.02, 0.02, 1.05, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Loft floor slab with open balustrade railing facing the living room */
function LoftSlab({ inXR, woodMat }: { inXR: boolean; woodMat: THREE.Material }) {
  const metalMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#5a5a5a", metalness: 0.6, roughness: 0.35 }), []);
  const LOFT_Y = 3.2;
  const SLAB_W = 6.8;  // X: -6 to 0.8
  const SLAB_D = 9.0;  // Z: -4.5 to 4.5

  // Balustrade along the open edge (X = 0.8, the loft front edge)
  const balusterCount = 10;
  const balusterSpacing = SLAB_D / (balusterCount + 1);

  return (
    <group>
      {/* Loft floor slab */}
      <mesh
        position={[-2.6, LOFT_Y, 0]}
        receiveShadow={!inXR}
        castShadow={!inXR}
      >
        <boxGeometry args={[SLAB_W, 0.18, SLAB_D]} />
        <meshStandardMaterial color="#c4a078" roughness={0.72} />
      </mesh>

      {/* Exposed wooden beams on loft underside */}
      {[-3.5, -1.5, 0.2].map((x, i) => (
        <mesh key={i} position={[x, LOFT_Y - 0.06, 0]} material={woodMat as THREE.MeshStandardMaterial}>
          <boxGeometry args={[0.18, 0.12, SLAB_D]} />
        </mesh>
      ))}

      {/* Balustrade top rail */}
      <mesh position={[0.72, LOFT_Y + 0.95, 0]} material={woodMat as THREE.MeshStandardMaterial}>
        <boxGeometry args={[0.08, 0.06, SLAB_D]} />
      </mesh>

      {/* Balustrade balusters (metal) */}
      {Array.from({ length: balusterCount }, (_, i) => (
        <mesh
          key={i}
          position={[0.72, LOFT_Y + 0.45, -SLAB_D / 2 + balusterSpacing * (i + 1)]}
          material={metalMat}
          castShadow={!inXR}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Bedroom on the loft level */
function Bedroom({ inXR, woodMat }: { inXR: boolean; woodMat: THREE.Material }) {
  const LOFT_Y = 3.2 + 0.18; // top of slab
  return (
    <group>
      {/* Bed frame */}
      <group position={[-4.5, LOFT_Y, -1.5]}>
        <mesh position={[0, 0.18, 0]} castShadow={!inXR} receiveShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
          <boxGeometry args={[2.0, 0.22, 2.1]} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[1.92, 0.22, 2.0]} />
          <meshStandardMaterial color="#e8ddd0" roughness={0.95} />
        </mesh>
        {/* Duvet */}
        <mesh position={[0, 0.52, 0.2]}>
          <boxGeometry args={[1.88, 0.12, 1.6]} />
          <meshStandardMaterial color="#d4c8b8" roughness={0.98} />
        </mesh>
        {/* Pillow L */}
        <mesh position={[-0.45, 0.55, -0.75]}>
          <boxGeometry args={[0.72, 0.1, 0.48]} />
          <meshStandardMaterial color="#f0ebe4" roughness={0.95} />
        </mesh>
        {/* Pillow R */}
        <mesh position={[0.45, 0.55, -0.75]}>
          <boxGeometry args={[0.72, 0.1, 0.48]} />
          <meshStandardMaterial color="#f0ebe4" roughness={0.95} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.6, -1.0]} castShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
          <boxGeometry args={[2.0, 0.9, 0.1]} />
        </mesh>
      </group>

      {/* Large wardrobe / built-in closet */}
      <mesh position={[-1.2, LOFT_Y + 1.1, -3.9]} castShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
        <boxGeometry args={[3.0, 2.2, 0.55]} />
      </mesh>
      {/* Wardrobe doors (lighter panel) */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x - 1.2, LOFT_Y + 1.1, -3.64]}>
          <boxGeometry args={[1.38, 2.18, 0.04]} />
          <meshStandardMaterial color="#b09a80" roughness={0.55} />
        </mesh>
      ))}

      {/* Bedside tables */}
      <mesh position={[-3.4, LOFT_Y + 0.32, -1.5]} castShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
        <boxGeometry args={[0.45, 0.48, 0.42]} />
      </mesh>
      <mesh position={[-5.6, LOFT_Y + 0.32, -1.5]} castShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
        <boxGeometry args={[0.45, 0.48, 0.42]} />
      </mesh>

      {/* Bedside lamp L */}
      <mesh position={[-3.4, LOFT_Y + 0.62, -1.5]}>
        <cylinderGeometry args={[0.12, 0.08, 0.3, 10]} />
        <meshStandardMaterial color="#e8d0a8" emissive="#c4903a" emissiveIntensity={0.5} roughness={0.8} />
      </mesh>
      {/* Bedside lamp R */}
      <mesh position={[-5.6, LOFT_Y + 0.62, -1.5]}>
        <cylinderGeometry args={[0.12, 0.08, 0.3, 10]} />
        <meshStandardMaterial color="#e8d0a8" emissive="#c4903a" emissiveIntensity={0.5} roughness={0.8} />
      </mesh>

      {/* Loft ceiling (sloped suggestion – flat for now) */}
      <mesh position={[-2.6, LOFT_Y + 2.4, 0]}>
        <boxGeometry args={[6.8, 0.12, 9.0]} />
        <meshStandardMaterial color="#2a2420" roughness={1} />
      </mesh>
    </group>
  );
}

/** Large upstairs bathroom */
function UpstairsBath({ inXR }: { inXR: boolean }) {
  const LOFT_Y = 3.2 + 0.18;
  const tileMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#c8c0b4", roughness: 0.3, metalness: 0.05 }), []);
  const chromeMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 0.9, roughness: 0.1 }), []);

  return (
    <group>
      {/* Bathroom partition wall (partial, creates alcove) */}
      <mesh position={[-0.4, LOFT_Y + 1.1, 2.5]}>
        <boxGeometry args={[0.1, 2.2, 4.0]} />
        <meshStandardMaterial color="#4a4038" roughness={0.9} />
      </mesh>

      {/* Bathtub */}
      <group position={[-3.2, LOFT_Y, 3.2]}>
        {/* Outer shell */}
        <mesh position={[0, 0.28, 0]} castShadow={!inXR}>
          <boxGeometry args={[1.65, 0.56, 0.8]} />
          <meshStandardMaterial color="#e8e4e0" roughness={0.25} metalness={0.05} />
        </mesh>
        {/* Inner cutout suggestion – darker fill */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[1.45, 0.22, 0.6]} />
          <meshStandardMaterial color="#b8d8e4" roughness={0.1} metalness={0.1} transparent opacity={0.6} />
        </mesh>
        {/* Chrome tap */}
        <mesh position={[0.7, 0.62, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
        </mesh>
      </group>

      {/* Walk-in shower */}
      <group position={[-1.2, LOFT_Y, 2.8]}>
        {/* Shower tray */}
        <mesh position={[0, 0.04, 0]} receiveShadow={!inXR} material={tileMat}>
          <boxGeometry args={[1.1, 0.08, 1.2]} />
        </mesh>
        {/* Glass walls (front + side) */}
        <mesh position={[0, 1.1, 0.6]}>
          <boxGeometry args={[1.1, 2.2, 0.025]} />
          <meshStandardMaterial color="#88c4d4" transparent opacity={0.18} metalness={0.1} roughness={0.05} />
        </mesh>
        <mesh position={[0.55, 1.1, 0]}>
          <boxGeometry args={[0.025, 2.2, 1.2]} />
          <meshStandardMaterial color="#88c4d4" transparent opacity={0.18} metalness={0.1} roughness={0.05} />
        </mesh>
        {/* Chrome shower head */}
        <mesh position={[0, 2.1, -0.45]} material={chromeMat}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
        </mesh>
        <mesh position={[0, 2.1, -0.44]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 8]} />
        </mesh>
      </group>

      {/* Large mirror above vanity */}
      <mesh position={[-4.8, LOFT_Y + 1.3, 4.4]}>
        <boxGeometry args={[1.8, 1.2, 0.04]} />
        <meshStandardMaterial color="#c0d4dc" metalness={0.85} roughness={0.05} />
      </mesh>
      {/* Mirror frame */}
      <mesh position={[-4.8, LOFT_Y + 1.3, 4.42]}>
        <boxGeometry args={[1.88, 1.28, 0.025]} />
        <meshStandardMaterial color="#2a2420" roughness={0.5} />
      </mesh>

      {/* Vanity / double sink */}
      <group position={[-4.8, LOFT_Y, 4.0]}>
        <mesh position={[0, 0.42, 0]} castShadow={!inXR}>
          <boxGeometry args={[1.8, 0.84, 0.48]} />
          <meshStandardMaterial color="#e0dbd5" roughness={0.3} />
        </mesh>
        {/* Sink basins */}
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.87, 0.02]}>
            <boxGeometry args={[0.5, 0.12, 0.36]} />
            <meshStandardMaterial color="#f0eeec" roughness={0.15} />
          </mesh>
        ))}
        {/* Taps */}
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.98, -0.08]} material={chromeMat}>
            <cylinderGeometry args={[0.018, 0.018, 0.18, 8]} />
          </mesh>
        ))}
      </group>

      {/* Towel rail */}
      <mesh position={[-0.55, LOFT_Y + 1.1, 4.42]} material={chromeMat}>
        <boxGeometry args={[0.06, 0.04, 0.7]} />
      </mesh>
    </group>
  );
}

/** Small downstairs bathroom (toilet + small sink) */
function DownstairsBath({ inXR }: { inXR: boolean }) {
  const tileMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#b8b0a8", roughness: 0.35 }), []);
  const chromeMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#c8c8c8", metalness: 0.85, roughness: 0.12 }), []);

  // Small bathroom: X [3.6, 5.8], Z [-4.5, -3.0]
  return (
    <group>
      {/* Bathroom walls */}
      <mesh position={[3.6, 1.36, -3.75]}>
        <boxGeometry args={[0.1, 2.72, 1.5]} />
        <meshStandardMaterial color="#4a4038" roughness={0.9} />
      </mesh>
      <mesh position={[4.7, 1.36, -3.0]}>
        <boxGeometry args={[2.2, 2.72, 0.1]} />
        <meshStandardMaterial color="#4a4038" roughness={0.9} />
      </mesh>

      {/* Toilet */}
      <group position={[5.2, 0, -4.1]}>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.58]} />
          <meshStandardMaterial color="#e8e4e0" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.44, -0.22]}>
          <boxGeometry args={[0.4, 0.08, 0.14]} />
          <meshStandardMaterial color="#dedad6" roughness={0.3} />
        </mesh>
      </group>

      {/* Small sink */}
      <mesh position={[4.0, 0.78, -4.2]}>
        <boxGeometry args={[0.44, 0.08, 0.38]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.2} />
      </mesh>
      <mesh position={[4.0, 0.0, -4.2]}>
        <boxGeometry args={[0.44, 1.44, 0.12]} />
        <meshStandardMaterial color="#e0dbd5" roughness={0.3} />
      </mesh>
      {/* Tap */}
      <mesh position={[4.0, 0.9, -4.06]} material={chromeMat}>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
      </mesh>

      {/* Small mirror */}
      <mesh position={[4.0, 1.45, -4.44]}>
        <boxGeometry args={[0.55, 0.55, 0.03]} />
        <meshStandardMaterial color="#c0d0d8" metalness={0.8} roughness={0.08} />
      </mesh>

      {/* Floor tile hint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.7, 0.005, -3.75]} material={tileMat}>
        <planeGeometry args={[2.2, 1.5]} />
      </mesh>
    </group>
  );
}

/** Open-plan kitchen with island + dining area */
function Kitchen({ inXR, woodMat }: { inXR: boolean; woodMat: THREE.Material }) {
  const counterMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#d8d0c4", roughness: 0.25, metalness: 0.05 }), []);
  const applianceMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#2a2820", metalness: 0.6, roughness: 0.3 }), []);
  const chromeMat = useMemo(() =>
    new THREE.MeshStandardMaterial({ color: "#c8c8c8", metalness: 0.88, roughness: 0.1 }), []);

  return (
    <group>
      {/* Kitchen counter along back wall */}
      <mesh position={[4.6, 0.45, 2.4]} castShadow={!inXR} receiveShadow={!inXR}>
        <boxGeometry args={[1.6, 0.9, 3.2]} />
        <meshStandardMaterial color="#5a4838" roughness={0.7} />
      </mesh>
      {/* Counter top */}
      <mesh position={[4.6, 0.92, 2.4]}>
        <boxGeometry args={[1.65, 0.06, 3.25]} />
        <primitive object={counterMat} />
      </mesh>

      {/* Sink in counter */}
      <mesh position={[4.62, 0.94, 1.6]}>
        <boxGeometry args={[0.52, 0.1, 0.42]} />
        <meshStandardMaterial color="#c8c0b8" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[4.62, 1.02, 1.45]} material={chromeMat}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
      </mesh>

      {/* Stove / hob */}
      <mesh position={[4.62, 0.94, 2.8]}>
        <boxGeometry args={[0.55, 0.04, 0.52]} />
        <primitive object={applianceMat} />
      </mesh>
      {/* Hob rings */}
      {[[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[4.62 + x, 0.97, 2.8 + z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.075, 16]} />
          <meshStandardMaterial color="#1a1a18" roughness={0.4} />
        </mesh>
      ))}

      {/* Upper cabinets */}
      <mesh position={[5.1, 1.7, 2.4]} castShadow={!inXR}>
        <boxGeometry args={[0.65, 0.72, 3.1]} />
        <meshStandardMaterial color="#6a5848" roughness={0.65} />
      </mesh>

      {/* Kitchen island */}
      <group position={[3.5, 0, 0.7]}>
        {/* Island body */}
        <mesh position={[0, 0.45, 0]} castShadow={!inXR} receiveShadow={!inXR}>
          <boxGeometry args={[1.3, 0.9, 2.6]} />
          <meshStandardMaterial color="#5a4838" roughness={0.7} />
        </mesh>
        {/* Island top – lighter stone look */}
        <mesh position={[0, 0.93, 0]}>
          <boxGeometry args={[1.38, 0.06, 2.68]} />
          <primitive object={counterMat} />
        </mesh>
        {/* Pendant lights above island */}
        {[-0.7, 0.7].map((z, i) => (
          <mesh key={i} position={[0, 2.4, z]}>
            <cylinderGeometry args={[0.14, 0.14, 0.22, 12]} />
            <meshStandardMaterial color="#e8c880" emissive="#b48820" emissiveIntensity={0.6} roughness={0.7} />
          </mesh>
        ))}
        {[-0.7, 0.7].map((z, i) => (
          <mesh key={i} position={[0, 2.2, z]} material={chromeMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
          </mesh>
        ))}
      </group>

      {/* Dining table */}
      <group position={[3.8, 0, -3.2]}>
        <mesh position={[0, 0.38, 0]} castShadow={!inXR} receiveShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
          <boxGeometry args={[1.6, 0.06, 0.95]} />
        </mesh>
        {/* Legs */}
        {[[-0.7, 0.38], [0.7, 0.38], [-0.7, -0.38], [0.7, -0.38]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.19, z]} material={woodMat as THREE.MeshStandardMaterial}>
            <cylinderGeometry args={[0.04, 0.04, 0.38, 8]} />
          </mesh>
        ))}
        {/* Dining chairs (4) */}
        {[[-0.7, -0.65, 0], [0.7, -0.65, 0], [-0.7, 0.65, Math.PI], [0.7, 0.65, Math.PI]].map(
          ([x, z, ry], i) => (
            <group key={i} position={[x as number, 0, z as number]} rotation={[0, ry as number, 0]}>
              <mesh position={[0, 0.22, 0]} castShadow={!inXR} material={woodMat as THREE.MeshStandardMaterial}>
                <boxGeometry args={[0.42, 0.06, 0.42]} />
              </mesh>
              <mesh position={[0, 0.56, -0.18]} material={woodMat as THREE.MeshStandardMaterial}>
                <boxGeometry args={[0.42, 0.62, 0.04]} />
              </mesh>
            </group>
          ),
        )}
      </group>

      {/* Pendant lights above dining */}
      <mesh position={[3.8, 2.3, -3.2]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#f0e0c0" emissive="#c48830" emissiveIntensity={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Room() {
  const tex = useRoomTextures();
  const lanternLit = useCompanion((s) => s.lanternLit);
  const bond = useCompanion((s) => s.bond);
  const inXR = useXrSessionActive((s) => s.active);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8e4de",  // bright white plaster for maisonette feel
        map: tex.plaster,
        roughness: 0.88,
      }),
    [tex.plaster],
  );
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8a6a52",
        map: tex.wood,
        roughness: 0.65,
      }),
    [tex.wood],
  );

  // Room dimensions: 12W × 9D, double height 5.5m
  const RW = 12.0;   // total width
  const RD = 9.0;    // total depth
  const RH = 5.5;    // ceiling height
  const CX = 0.0;    // center X
  const CZ = 0.0;    // center Z

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.38} color="#3a352e" />
      <hemisphereLight args={["#9a8a7c", "#1c1612", 0.5]} />

      {/* Main directional (simulates large window from left) */}
      <directionalLight position={[-7.5, 4.2, 0.5]} intensity={1.35} color="#b0c8e0" />

      {/* Living room floor lamp */}
      <pointLight position={[-3.0, 1.9, -2.8]} color="#ffc9a0" intensity={bond >= 40 ? 62 : 48} distance={14} decay={2} castShadow={!inXR} shadow-mapSize-width={inXR ? 256 : 1024} shadow-mapSize-height={inXR ? 256 : 1024} shadow-bias={-0.0002} />

      {/* General fill */}
      <pointLight position={[0, 3.0, 0]} color="#f0dcc0" intensity={28} distance={12} decay={2} />

      {/* Kitchen island pendants */}
      <pointLight position={[3.5, 2.1, -0.7]} color="#ffd080" intensity={22} distance={6} decay={2} />
      <pointLight position={[3.5, 2.1, 0.7]} color="#ffd080" intensity={22} distance={6} decay={2} />

      {/* Loft bedroom warm light */}
      <pointLight position={[-4.5, 4.6, -1.5]} color="#ffb870" intensity={35} distance={8} decay={2} />

      {/* Blue moonlight from window */}
      <pointLight position={[-6.2, 2.2, 0]} color="#7d90b0" intensity={12} distance={8} decay={2} />

      {lanternLit && (
        <pointLight position={[-1.0, 0.72, -0.6]} color="#ffd2a8" intensity={12} distance={6} decay={2} />
      )}

      {/* ── Ground floor ── */}
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0, CZ]} receiveShadow={!inXR}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#b8a080" map={tex.wood} roughness={0.72} />
      </mesh>

      {/* Main ceiling (above loft – top of building) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CX, RH, CZ]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#2a2420" roughness={1} />
      </mesh>

      {/* ── Walls (maisonette – full height) ── */}
      {/* Back wall */}
      <mesh position={[CX, RH / 2, -(RD / 2)]} material={wallMat} receiveShadow={!inXR}>
        <boxGeometry args={[RW, RH, 0.14]} />
      </mesh>
      {/* Front wall */}
      <mesh position={[CX, RH / 2, RD / 2]} material={wallMat}>
        <boxGeometry args={[RW, RH, 0.14]} />
      </mesh>
      {/* Left wall (window side) */}
      <mesh position={[-(RW / 2), RH / 2, CZ]} material={wallMat} receiveShadow={!inXR}>
        <boxGeometry args={[0.14, RH, RD]} />
      </mesh>
      {/* Right wall (kitchen side) */}
      <mesh position={[RW / 2, RH / 2, CZ]} material={wallMat} receiveShadow={!inXR}>
        <boxGeometry args={[0.14, RH, RD]} />
      </mesh>

      {/* ── Large windows – left wall ── */}
      {/* Window 1: living room large */}
      <mesh position={[-5.94, 2.2, -1.0]}>
        <planeGeometry args={[0.04, 2.6]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[-5.9, 2.2, -1.0]}>
        <planeGeometry args={[2.8, 2.5]} />
        <meshBasicMaterial map={tex.city} />
      </mesh>
      <mesh position={[-5.82, 2.2, -1.0]}>
        <planeGeometry args={[2.85, 2.58]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.35} transparent opacity={0.15} />
      </mesh>

      {/* Window 2: dining area */}
      <mesh position={[-5.9, 1.4, 2.2]}>
        <planeGeometry args={[1.8, 1.6]} />
        <meshBasicMaterial map={tex.city} />
      </mesh>
      <mesh position={[-5.82, 1.4, 2.2]}>
        <planeGeometry args={[1.85, 1.66]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.35} transparent opacity={0.15} />
      </mesh>

      {/* Loft bedroom window (upper) */}
      <mesh position={[-5.9, 4.1, -2.0]}>
        <planeGeometry args={[2.0, 1.4]} />
        <meshBasicMaterial map={tex.city} />
      </mesh>
      <mesh position={[-5.82, 4.1, -2.0]}>
        <planeGeometry args={[2.06, 1.46]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.35} transparent opacity={0.15} />
      </mesh>

      {/* Curtains – living room window */}
      <mesh position={[-5.72, 2.2, -2.55]} castShadow={!inXR}>
        <boxGeometry args={[0.1, 2.8, 0.6]} />
        <meshStandardMaterial color="#2c2018" roughness={0.85} />
      </mesh>
      <mesh position={[-5.72, 2.2, 0.45]} castShadow={!inXR}>
        <boxGeometry args={[0.1, 2.8, 0.5]} />
        <meshStandardMaterial color="#2c2018" roughness={0.85} />
      </mesh>

      {/* ── Living room ── */}
      {/* Large corner sofa */}
      <group position={[-1.2, 0, -2.8]}>
        {/* Main section */}
        <mesh position={[0, 0.22, 0]} castShadow={!inXR} receiveShadow={!inXR}>
          <boxGeometry args={[2.4, 0.38, 0.85]} />
          <meshStandardMaterial color="#7a6e62" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.6, -0.38]} castShadow={!inXR}>
          <boxGeometry args={[2.4, 0.62, 0.2]} />
          <meshStandardMaterial color="#4a3c34" roughness={0.88} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-1.28, 0.44, 0.1]} castShadow={!inXR}>
          <boxGeometry args={[0.2, 0.5, 0.82]} />
          <meshStandardMaterial color="#4a3c34" roughness={0.88} />
        </mesh>
        {/* Right arm */}
        <mesh position={[1.28, 0.44, 0.1]} castShadow={!inXR}>
          <boxGeometry args={[0.2, 0.5, 0.82]} />
          <meshStandardMaterial color="#4a3c34" roughness={0.88} />
        </mesh>
        {/* Corner section (L-shape extending right) */}
        <mesh position={[1.6, 0.22, 0.62]} castShadow={!inXR}>
          <boxGeometry args={[0.85, 0.38, 0.85]} />
          <meshStandardMaterial color="#7a6e62" roughness={0.88} />
        </mesh>
        {/* Cushions */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 0.52, -0.22]}>
            <boxGeometry args={[0.55, 0.16, 0.42]} />
            <meshStandardMaterial color="#a09080" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Coffee table */}
      <mesh position={[-0.8, 0.28, -1.5]} castShadow={!inXR} receiveShadow={!inXR} material={woodMat}>
        <boxGeometry args={[1.1, 0.06, 0.6]} />
      </mesh>
      <mesh position={[-0.8, 0.14, -1.5]} material={woodMat}>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
      </mesh>

      {/* TV unit / media console */}
      <group position={[-4.6, 0, -2.5]}>
        <mesh position={[0, 0.3, 0]} castShadow={!inXR} receiveShadow={!inXR} material={woodMat}>
          <boxGeometry args={[1.6, 0.6, 0.4]} />
        </mesh>
        {/* TV screen */}
        <mesh position={[0, 0.85, -0.14]}>
          <boxGeometry args={[1.5, 0.85, 0.06]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.1} metalness={0.4} />
        </mesh>
      </group>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.012, -1.8]} receiveShadow={!inXR}>
        <planeGeometry args={[3.2, 2.8]} />
        <meshStandardMaterial map={tex.rug} roughness={0.95} color="#6a4a40" />
      </mesh>

      {/* Floor lamp – living area */}
      <group position={[-3.0, 0, -2.8]}>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 1.9, 8]} />
          <meshStandardMaterial color="#2a2420" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <coneGeometry args={[0.24, 0.3, 12]} />
          <meshStandardMaterial color="#f0d8b8" emissive="#d4a574" emissiveIntensity={0.8} roughness={0.7} />
        </mesh>
      </group>

      {/* Large bookshelf on right of living room */}
      <group position={[0.4, 0, -3.8]}>
        <mesh position={[0, 1.1, 0]} castShadow={!inXR} material={woodMat}>
          <boxGeometry args={[0.8, 2.2, 0.3]} />
        </mesh>
        {[0.25, 0.65, 1.05, 1.5, 1.9].map((y, i) => (
          <mesh key={i} position={[0, y, 0.1]}>
            <boxGeometry args={[0.66, 0.24, 0.2]} />
            <meshStandardMaterial color={i % 2 ? "#3a3330" : "#4e3e36"} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Plant corner – living area */}
      <group position={[-5.0, 0, 1.0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.3, 10]} />
          <meshStandardMaterial color="#6a4032" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow={!inXR}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#3a5a44" roughness={0.85} />
        </mesh>
        <mesh position={[0.22, 0.8, 0.1]} castShadow={!inXR}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial color="#2f4a3c" roughness={0.85} />
        </mesh>
      </group>

      {/* Small hallway arch to bathroom area */}
      <mesh position={[3.6, 1.55, -4.42]}>
        <boxGeometry args={[0.14, 0.96, 0.14]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.75} />
      </mesh>

      {/* ── Staircase + Loft ── */}
      <Staircase inXR={inXR} />
      <LoftSlab inXR={inXR} woodMat={woodMat} />
      <Bedroom inXR={inXR} woodMat={woodMat} />
      <UpstairsBath inXR={inXR} />
      <DownstairsBath inXR={inXR} />
      <Kitchen inXR={inXR} woodMat={woodMat} />

      {/* ── Baseboard hint (ground floor) ── */}
      <mesh position={[CX, 0.04, -(RD / 2) + 0.1]}>
        <boxGeometry args={[RW - 0.3, 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1612" />
      </mesh>

      <Dust />
    </group>
  );
}
