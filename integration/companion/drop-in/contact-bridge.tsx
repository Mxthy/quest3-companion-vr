/**
 * Copy to: src/components/companion/contact-bridge.tsx
 * Requires: src/core/interaction/* from this repo
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ContactController } from "@/core/interaction/ContactController";
import { playerSim } from "@/lib/companion/player-ref";
import { useCompanion } from "@/lib/companion/store";

const ZONE_LOCAL: Record<string, [number, number, number]> = {
  head: [0, 1.55, -1.5],
  face: [0, 1.52, -1.42],
  chest_l: [0.12, 1.25, -1.48],
  chest_r: [-0.12, 1.25, -1.48],
  torso: [0, 1.15, -1.5],
  center: [0, 0.95, -1.48],
  hip_l: [0.12, 0.85, -1.5],
  hip_r: [-0.12, 0.85, -1.5],
  back_l: [0.1, 1.1, -1.62],
  back_r: [-0.1, 1.1, -1.62],
  thigh_l: [0.1, 0.55, -1.5],
  thigh_r: [-0.1, 0.55, -1.5],
  hand_l: [0.28, 1.05, -1.4],
  hand_r: [-0.28, 1.05, -1.4],
};

const DEBUG_ZONES = true;

export function ContactBridge() {
  const camera = useThree((s) => s.camera);
  const ctrl = useMemo(() => new ContactController(), []);
  const proxyMesh = useRef<THREE.Mesh>(null);
  const prevBurst = useRef(false);

  useEffect(() => {
    return ctrl.onEvent((e) => {
      const s = useCompanion.getState() as Record<string, unknown>;
      if (e.type === "zone_enter" && typeof s.setContactZone === "function") {
        (s.setContactZone as (z: string | null) => void)(e.zoneId);
      }
      if (e.type === "zone_exit" && typeof s.setContactZone === "function") {
        (s.setContactZone as (z: string | null) => void)(null);
      }
      if (e.type === "peak" && typeof s.onContactPeak === "function") {
        (s.onContactPeak as () => void)();
      }
      if (e.type === "band" && typeof s.setIntensityBand === "function") {
        (s.setIntensityBand as (b: string) => void)(e.band);
      }
    });
  }, [ctrl]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.1);
    const state = useCompanion.getState() as {
      phase: string;
      bond: number;
      setIntensityValue?: (v: number) => void;
    };
    if (state.phase !== "playing") {
      if (proxyMesh.current) proxyMesh.current.visible = false;
      return;
    }

    for (const [id, pos] of Object.entries(ZONE_LOCAL)) {
      ctrl.updateZonePosition(id, { x: pos[0], y: pos[1], z: pos[2] });
    }

    const reach = new THREE.Vector3(0, 0, -0.55).applyQuaternion(camera.quaternion);
    const hand = camera.position.clone().add(reach);
    const q = camera.quaternion;
    const hmd = {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      orientation: { x: q.x, y: q.y, z: q.z, w: q.w },
    };

    const keys = playerSim.keys;
    const holding = keys.has("KeyF") || keys.has("ShiftLeft");
    const burstKey = keys.has("KeyR");
    const burstPressed = burstKey && !prevBurst.current;
    prevBurst.current = burstKey;

    const out = ctrl.tick({
      hmd,
      handPoints: [{ x: hand.x, y: hand.y, z: hand.z }],
      holding,
      burstPressed,
      impulsePressed: false,
      progress: state.bond ?? 0,
      dt,
    });

    state.setIntensityValue?.(out.intensity.value);

    if (proxyMesh.current && out.proxy) {
      proxyMesh.current.visible = true;
      proxyMesh.current.position.set(out.proxy.base.x, out.proxy.base.y, out.proxy.base.z);
      proxyMesh.current.quaternion.set(
        out.proxy.orientation.x,
        out.proxy.orientation.y,
        out.proxy.orientation.z,
        out.proxy.orientation.w,
      );
      const sx = out.proxy.radiusM / 0.025;
      const sz = out.proxy.lengthM / 0.16;
      proxyMesh.current.scale.set(sx, sx, sz);
    }
  });

  return (
    <group>
      <mesh ref={proxyMesh} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.022, 0.16, 10]} />
        <meshStandardMaterial color="#c4a07a" roughness={0.55} transparent opacity={0.85} />
      </mesh>
      {DEBUG_ZONES &&
        Object.entries(ZONE_LOCAL).map(([id, p]) => (
          <mesh key={id} position={p}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#88ccee" transparent opacity={0.18} depthWrite={false} />
          </mesh>
        ))}
    </group>
  );
}
