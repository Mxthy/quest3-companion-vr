/**
 * Soft-physics toys driven by Verlet SoftBody.
 * Grab = pin handle to hand/reach point; release = free jiggle + gravity.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  createPillowSoftBody,
  createRingSoftBody,
  createWandSoftBody,
  type SoftBody,
  type Vec3,
} from "@/core/physics/SoftVerlet";
import { usePropTextures } from "./propTextures";
import { playerSim } from "@/lib/companion/player-ref";
import { useCompanion } from "@/lib/companion/store";

function toV3(p: THREE.Vector3): Vec3 {
  return { x: p.x, y: p.y, z: p.z };
}

function SoftWand({ held }: { held: boolean }) {
  const t = usePropTextures();
  const body = useMemo(() => createWandSoftBody({ x: -0.55, y: 0.72, z: -0.35 }), []);
  const meshes = useRef<THREE.Mesh[]>([]);
  const tip = useRef(new THREE.Vector3());

  useFrame(({ camera }, dt) => {
    if (held) {
      const reach = new THREE.Vector3(0, 0, -0.45).applyQuaternion(camera.quaternion);
      const hand = camera.position.clone().add(reach);
      body.setPinnedPos(0, toV3(hand), true);
    } else {
      body.points[0].pinned = false;
    }
    body.tick(dt);
    const pts = body.positions();
    for (let i = 0; i < pts.length - 1; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const a = pts[i];
      const b = pts[i + 1];
      const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      m.position.copy(mid);
      tip.set(b.x - a.x, b.y - a.y, b.z - a.z);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().normalize());
      const h = tip.length();
      m.scale.set(1, Math.max(0.5, h / 0.03), 1);
    }
  });

  const segs = body.points.length - 1;
  return (
    <group>
      {Array.from({ length: segs }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
          castShadow
        >
          <capsuleGeometry args={[0.016, 0.02, 4, 8]} />
          <meshStandardMaterial map={t.silicone} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function SoftRing({ held }: { held: boolean }) {
  const t = usePropTextures();
  const body = useMemo(() => createRingSoftBody({ x: -0.45, y: 0.72, z: -0.28 }), []);
  const line = useRef<THREE.LineLoop>(null);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    return g;
  }, []);

  useFrame(({ camera }, dt) => {
    if (held) {
      const reach = new THREE.Vector3(0, 0, -0.4).applyQuaternion(camera.quaternion);
      const hand = camera.position.clone().add(reach);
      // drag whole ring by pinning point 0
      body.setPinnedPos(0, toV3(hand), true);
    } else {
      body.points[0].pinned = false;
    }
    body.tick(dt);
    const pts = body.positions();
    const arr = geom.attributes.position.array as Float32Array;
    for (let i = 0; i < pts.length; i++) {
      arr[i * 3] = pts[i].x;
      arr[i * 3 + 1] = pts[i].y;
      arr[i * 3 + 2] = pts[i].z;
    }
    geom.attributes.position.needsUpdate = true;
  });

  return (
    <lineLoop ref={line} geometry={geom}>
      <lineBasicMaterial color="#9a88c4" linewidth={2} />
      {/* solid ring follow centroid */}
      <SoftRingMeshFollow body={body} map={t.siliconeAlt} />
    </lineLoop>
  );
}

function SoftRingMeshFollow({
  body,
  map,
}: {
  body: SoftBody;
  map: THREE.Texture;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const pts = body.positions();
    let x = 0,
      y = 0,
      z = 0;
    for (const p of pts) {
      x += p.x;
      y += p.y;
      z += p.z;
    }
    const n = pts.length || 1;
    ref.current.position.set(x / n, y / n, z / n);
  });
  return (
    <mesh ref={ref} castShadow rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.035, 0.012, 10, 20]} />
      <meshStandardMaterial map={map} roughness={0.3} />
    </mesh>
  );
}

function SoftPillow({ held }: { held: boolean }) {
  const t = usePropTextures();
  const body = useMemo(() => createPillowSoftBody({ x: 0.9, y: 0.12, z: -0.9 }), []);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ camera }, dt) => {
    if (held) {
      const reach = new THREE.Vector3(0, -0.15, -0.5).applyQuaternion(camera.quaternion);
      const hand = camera.position.clone().add(reach);
      body.setPinnedPos(0, toV3(hand), true);
    } else {
      body.points[0].pinned = false;
    }
    body.tick(dt);
    if (ref.current) {
      const pts = body.positions();
      let x = 0,
        y = 0,
        z = 0;
      for (const p of pts) {
        x += p.x;
        y += p.y;
        z += p.z;
      }
      const n = pts.length;
      ref.current.position.set(x / n, y / n, z / n);
      // squash factor from vertical span
      let minY = Infinity,
        maxY = -Infinity;
      for (const p of pts) {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      const h = Math.max(0.04, maxY - minY);
      ref.current.scale.set(1.05, h / 0.1, 1.05);
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[0.28, 0.1, 0.2]} />
      <meshStandardMaterial map={t.fabric} roughness={0.85} />
    </mesh>
  );
}

/**
 * Held ids optional – wire store HeldId to include toy_wand | toy_ring | pillow_soft
 * Until then, KeyT toggles local soft-hold for demo.
 */
export function SoftToyScene() {
  const held = useCompanion((s) => s.held as string | null);
  const softHold = useRef(false);

  useFrame(() => {
    // T = temporary soft-grab for testing without store extension
    if (playerSim.keys.has("KeyT")) softHold.current = true;
    if (playerSim.keys.has("KeyG")) softHold.current = false;
  });

  const holdWand = held === "toy_wand" || softHold.current;
  const holdRing = held === "toy_ring";
  const holdPillow = held === "pillow_soft";

  return (
    <group>
      <SoftWand held={holdWand} />
      <SoftRing held={holdRing} />
      <SoftPillow held={holdPillow} />
    </group>
  );
}
