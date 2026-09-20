/**
 * Adult bridge: wires the engine-agnostic adult core into the R3F scene.
 *
 * Per frame (phase === "playing"):
 *  - refresh zone world positions from Elara's zone anchors
 *  - synthesize desktop hand points from the center-screen ray (look = touch)
 *  - tick AdultInteractionController (zone events, grab, spank) and
 *    IntimateContactSystem (virtual anatomy shaft contact + pleasure)
 *  - place the shaft mesh from computeVirtualAnatomy output
 *  - drive dialogue / bond / arousal HUD from events
 *
 * Desktop input: G = halten/grab · F = intensiv · Q = Klaps (auf Po-Zonen)
 * Debug zones: append ?zones=1 to the URL.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ZoneSample } from "@/core/adult/IntimateContact";
import type { ArousalLevel } from "@/core/adult/PleasureModel";
import { DEFAULT_ZONES, type ZoneId } from "@/core/adult/TouchZoneSystem";
import type { Vec3 } from "@/core/adult/VirtualAnatomy";
import { playSoft, speakTone } from "@/lib/companion/audio";
import { playerSim } from "@/lib/companion/player-ref";
import { adultAnchors } from "./adult-anchors";
import { useCompanion } from "@/lib/companion/store";
import {
  ADULT_BOND,
  ADULT_LINES,
  adultRuntime,
  pickAdultLine,
  useAdultHud,
} from "@/lib/companion/adult";

const RAY = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
const TMP = new THREE.Vector3();
const CLOSEST = new THREE.Vector3();
const CAM_POS = new THREE.Vector3();
const CAM_QUAT = new THREE.Quaternion();

const ZONE_DEFS = new Map(DEFAULT_ZONES.map((z) => [z.id, z]));

function DebugZones() {
  const meshes = useMemo(() => new Map<ZoneId, THREE.Mesh>(), []);
  useFrame(() => {
    for (const [id, obj] of adultAnchors) {
      const m = meshes.get(id);
      if (!m) continue;
      obj.getWorldPosition(m.position);
      m.visible = m.position.lengthSq() > 0;
    }
  });
  return (
    <>
      {DEFAULT_ZONES.map((z) => (
        <mesh
          key={z.id}
          ref={(m) => {
            if (m) meshes.set(z.id, m);
            else meshes.delete(z.id);
          }}
        >
          <sphereGeometry args={[z.radius_m, 10, 10]} />
          <meshBasicMaterial color="#ff6a9a" wireframe transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

export function AdultBridge() {
  const camera = useThree((s) => s.camera);
  const shaftRoot = useRef<THREE.Group>(null);
  const shaftMesh = useRef<THREE.Mesh>(null);
  const tipMesh = useRef<THREE.Mesh>(null);

  const showZones =
    typeof window !== "undefined" && window.location.search.includes("zones");

  // Per-run event/dialogue state
  const ev = useRef({
    lastZoneLineAt: 0,
    hotArmed: true,
    afterglowTimer: 0,
    stopHighArmed: false,
    lastShaftZone: null as string | null,
    hudAt: 0,
  });
  const grabbedZones = useRef(new Set<ZoneId>());

  // Desktop adult input: G hold = grab, F = intense, Q = spank
  useEffect(() => {
    const input = adultRuntime.input;
    const onDown = (e: KeyboardEvent) => {
      const phase = useCompanion.getState().phase;
      if (phase !== "playing") return;
      if (e.code === "KeyG") input.grabbing = true;
      if (e.code === "KeyF") input.intensePressed = true;
      if (e.code === "KeyQ") input.spankPressed = true;
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "KeyG") input.grabbing = false;
    };
    const clear = () => {
      input.grabbing = false;
      input.intensePressed = false;
      input.spankPressed = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      input.grabbing = false;
    };
  }, []);

  // Wire controller events once: dialogue + bond from content YAML.
  useEffect(() => {
    const off = adultRuntime.controller.onEvent((event) => {
      const s = useCompanion.getState();
      if (s.phase !== "playing") return;
      const now = performance.now();

      switch (event.type) {
        case "zone_enter": {
          if (now - ev.current.lastZoneLineAt < 2600) break;
          const pool = ADULT_LINES.zone_enter[event.zoneId] ?? ADULT_LINES.zone_enter.default;
          s.speakLine(pickAdultLine(`zone_${event.zoneId}`, pool));
          ev.current.lastZoneLineAt = now;
          break;
        }
        case "grab_start": {
          if (!grabbedZones.current.has(event.zoneId)) {
            grabbedZones.current.add(event.zoneId);
            s.addBond(ADULT_BOND.onFirstZoneGrab);
          }
          break;
        }
        case "spank": {
          if (now - ev.current.lastZoneLineAt < 2600) break;
          const pool = ADULT_LINES.zone_enter[event.zoneId] ?? ADULT_LINES.zone_enter.default;
          s.speakLine(pickAdultLine(`spank_${event.zoneId}`, pool));
          ev.current.lastZoneLineAt = now;
          playSoft();
          break;
        }
        case "level": {
          const pool =
            event.level === "tease"
              ? ADULT_LINES.level_tease
              : event.level === "hot"
                ? ADULT_LINES.level_hot
                : event.level === "peak_build"
                  ? ADULT_LINES.level_peak_build
                  : null;
          if (pool && event.level !== "orgasm") {
            s.speakLine(pickAdultLine(`level_${event.level}`, pool));
          }
          if (event.level === "hot" && event.prev !== "hot" && ev.current.hotArmed) {
            ev.current.hotArmed = false;
            s.addBond(ADULT_BOND.onReachHot);
          }
          if (event.level === "hot" || event.level === "peak_build" || event.level === "orgasm") {
            ev.current.stopHighArmed = true;
          }
          break;
        }
        case "orgasm": {
          s.speakLine(pickAdultLine("orgasm", ADULT_LINES.orgasm));
          s.addBond(ADULT_BOND.onOrgasm);
          speakTone();
          playSoft();
          ev.current.hotArmed = true;
          ev.current.afterglowTimer = performance.now() + 2800;
          break;
        }
        default:
          break;
      }
    });
    return off;
  }, []);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const s = useCompanion.getState();
    const playing = s.phase === "playing";

    if (shaftRoot.current) shaftRoot.current.visible = playing;
    if (!playing) {
      adultRuntime.input.intensePressed = false;
      adultRuntime.input.spankPressed = false;
      return;
    }

    // 1) Zone world positions from Elara anchors
    const zones: ZoneSample[] = [];
    for (const [id, obj] of adultAnchors) {
      const def = ZONE_DEFS.get(id);
      if (!def) continue;
      obj.getWorldPosition(TMP);
      const pos: Vec3 = { x: TMP.x, y: TMP.y, z: TMP.z };
      adultRuntime.controller.updateZonePosition(id, pos);
      zones.push({ id, position: pos, radius: def.radius_m, sensitivity: def.sensitivity });
    }

    // 2) Hand points: XR hands/controllers take precedence, else desktop center-ray (look=touch)
    const handPoints: Vec3[] = adultRuntime.xrTouchPoints;
    if (handPoints.length === 0 && s.nearElara) {
      RAY.setFromCamera(CENTER, camera);
      const origin = RAY.ray.origin;
      const dir = RAY.ray.direction;
      let bestZone: ZoneSample | null = null;
      let bestPoint: Vec3 | null = null;
      let bestDist = Infinity;
      for (const z of zones) {
        TMP.set(z.position.x, z.position.y, z.position.z).sub(origin);
        const t = Math.max(TMP.dot(dir), 0.25);
        CLOSEST.copy(dir).multiplyScalar(t).add(origin);
        const d = CLOSEST.distanceTo(
          TMP.set(z.position.x, z.position.y, z.position.z),
        );
        if (d <= z.radius && d < bestDist) {
          bestDist = d;
          bestZone = z;
          bestPoint = { x: CLOSEST.x, y: CLOSEST.y, z: CLOSEST.z };
        }
      }
      if (bestZone && bestPoint) handPoints.push(bestPoint);
    }

    // 3) Tick zone/grab controller
    adultRuntime.controller.tick({
      handPoints,
      grabbing: adultRuntime.input.grabbing,
      intensePressed: adultRuntime.input.intensePressed,
      spankPressed: adultRuntime.input.spankPressed,
      bond: s.bond,
      dt,
    });
    adultRuntime.input.intensePressed = false;
    adultRuntime.input.spankPressed = false;
    if (adultRuntime.xrTouchPoints.length > 0) adultRuntime.xrTouchPoints = [];

    // 4) Tick intimate contact (virtual anatomy + pleasure)
    camera.getWorldPosition(CAM_POS);
    camera.getWorldQuaternion(CAM_QUAT);
    const toyHeld = s.held === "toy_wand";
    const out = adultRuntime.intimate.tick({
      hmd: {
        position: { x: CAM_POS.x, y: CAM_POS.y, z: CAM_POS.z },
        orientation: { x: CAM_QUAT.x, y: CAM_QUAT.y, z: CAM_QUAT.z, w: CAM_QUAT.w },
      },
      zones,
      props: toyHeld && handPoints.length
        ? [
            {
              id: "toy_wand",
              position: handPoints[0]!,
              radius: 0.07,
              sensitivity: 1.3,
              kind: "toy",
            },
          ]
        : [],
      handPoints,
      grabbing: adultRuntime.input.grabbing,
      intensePressed: false, // bursts already applied via controller above
      dt,
      bond: s.bond,
    });

    // 5) Shaft mesh from anatomy pose (pivot at base, +Z along forward)
    if (shaftRoot.current && shaftMesh.current && tipMesh.current) {
      const pose = out.anatomy;
      shaftRoot.current.position.set(pose.shaftBase.x, pose.shaftBase.y, pose.shaftBase.z);
      shaftRoot.current.quaternion.set(
        pose.shaftOrientation.x,
        pose.shaftOrientation.y,
        pose.shaftOrientation.z,
        pose.shaftOrientation.w,
      );
      shaftMesh.current.scale.set(pose.radiusM, pose.lengthM, pose.radiusM);
      shaftMesh.current.position.set(0, 0, pose.lengthM / 2);
      tipMesh.current.scale.setScalar(pose.radiusM);
      tipMesh.current.position.set(0, 0, pose.lengthM);
    }

    // 6) Shaft-zone dialogue (once per engaged zone)
    if (out.shaftEngaged && out.active && out.active.target === "zone") {
      const id = out.active.id;
      if (id !== ev.current.lastShaftZone) {
        ev.current.lastShaftZone = id;
        const pool = ADULT_LINES.shaft_zone[id];
        if (pool) s.speakLine(pickAdultLine(`shaft_${id}`, pool));
      }
    } else if (!out.shaftEngaged) {
      ev.current.lastShaftZone = null;
    }

    // 7) Afterglow + stop-at-high lines
    const now = performance.now();
    if (ev.current.afterglowTimer > 0 && now >= ev.current.afterglowTimer) {
      ev.current.afterglowTimer = 0;
      s.speakLine(pickAdultLine("afterglow", ADULT_LINES.afterglow));
    }
    const touching = out.shaftEngaged || handPoints.length > 0;
    if (!touching && ev.current.stopHighArmed && out.pleasure.level !== "idle" && out.pleasure.level !== "tease") {
      ev.current.stopHighArmed = false;
      s.speakLine(pickAdultLine("stop_high", ADULT_LINES.stop_high));
    }

    // 8) HUD (throttled)
    if (now - ev.current.hudAt > 200) {
      ev.current.hudAt = now;
      const st = useAdultHud.getState();
      const arousal = Math.round(out.pleasure.arousal);
      const level: ArousalLevel = out.pleasure.level;
      const activeZone = adultRuntime.controller.getState().activeZone;
      const refractory = out.pleasure.refractoryLeft > 0;
      if (st.arousal !== arousal || st.level !== level || st.activeZone !== activeZone || st.refractory !== refractory) {
        useAdultHud.setState({ arousal, level, activeZone, refractory });
      }
    }
  });

  const skin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b98a63",
        roughness: 0.55,
        metalness: 0.02,
      }),
    [],
  );

  return (
    <>
      <group ref={shaftRoot} visible={false}>
        <mesh ref={shaftMesh} rotation={[Math.PI / 2, 0, 0]} material={skin} castShadow>
          <cylinderGeometry args={[1, 1, 1, 12]} />
        </mesh>
        <mesh ref={tipMesh} material={skin} castShadow>
          <sphereGeometry args={[1, 14, 14]} />
        </mesh>
      </group>
      {showZones && <DebugZones />}
    </>
  );
}
