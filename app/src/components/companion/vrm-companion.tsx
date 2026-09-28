/**
 * VRM companion (Phase 2): loads /models/vivi.vrm when present and maps the
 * adult touch zones onto humanoid bones. Falls back to the Elara placeholder
 * (same anchor contract) when the file is missing or fails to load.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  setImmersionMix,
  setSourcePosition,
  tickCloth,
  tickClosePulse,
} from "@/lib/companion/apartment";
import { useCompanion } from "@/lib/companion/store";
import { initVoiceDirector, tryActivityVoice } from "@/lib/companion/voice";
import {
  IDLE_INTENT,
  NpcBrain,
  interactablePos,
  perceive,
  steerYaw,
  walkStep,
  type Intent,
} from "@/lib/companion/npc";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { Elara } from "./elara";
import { registerAdultAnchor, unregisterAdultAnchor } from "./adult-anchors";
import { playerSim } from "@/lib/companion/player-ref";
import type { ZoneId } from "@/core/adult/TouchZoneSystem";

const VRM_URL = "/models/vivi.vrm";

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
const HEAD_POS = new THREE.Vector3();
const LAST_VIVI = { x: 0, z: 0, yaw: 0 };

// ── NPC life layer (Blueprint §§3-6, 10-12) ─────────────────────────
const NPC_BRAIN = new NpcBrain();
initVoiceDirector();
let lastVoiceActivityLabel = "";
const GAZE_TARGET = new THREE.Vector3(0, 1.45, 2);
const EYE_TARGET = new THREE.Object3D();
let gazeHold = 0;
let eyesBound = false;
let WALK_PHASE = 0;
let WALK_BLEND = 0;
let blinkTimer = 2;
let stuckMs = 0;
let skipNavLabel = "";
let blinkVal = 0;
let exprVal = 0;

const EXPR_MAP: Record<string, string> = {
  happy: "happy",
  surprised: "surprised",
  relaxed: "relaxed",
  sad: "sad",
  angry: "angry",
  neutral: "relaxed",
};
const EXPR_NAMES = ["happy", "surprised", "relaxed", "sad", "angry"];

function setExpr(
  em: NonNullable<VRM["expressionManager"]>,
  name: string,
  v: number,
): void {
  try {
    if (em.getExpression(name)) em.setValue(name, v);
  } catch {
    /* unknown preset on this model */
  }
}
const OFF_TMP = new THREE.Vector3();

type RestPose = {
  spineX: number;
  chestZ: number;
  hipsY: number;
  leftArmZ: number;
  rightArmZ: number;
  leftForearmZ: number;
  rightForearmZ: number;
  headX: number;
  headY: number;
};

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

  const head = vrm.humanoid.getNormalizedBoneNode("head");
  const spine = vrm.humanoid.getNormalizedBoneNode("spine");
  const chest = vrm.humanoid.getNormalizedBoneNode("chest");
  const hips = vrm.humanoid.getNormalizedBoneNode("hips");
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode("leftLowerArm");
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");
  const restPose = useRef<RestPose | null>(null);

  // Relax the imported T/A pose once, then animate small offsets around it.
  useLayoutEffect(() => {
    restPose.current = {
      spineX: spine?.rotation.x ?? 0,
      chestZ: chest?.rotation.z ?? 0,
      hipsY: hips?.rotation.y ?? 0,
      leftArmZ: 1.0,
      rightArmZ: -1.0,
      leftForearmZ: (leftLowerArm?.rotation.z ?? 0) - 0.12,
      rightForearmZ: (rightLowerArm?.rotation.z ?? 0) + 0.12,
      headX: head?.rotation.x ?? 0,
      headY: head?.rotation.y ?? 0,
    };
    if (leftUpperArm) leftUpperArm.rotation.z = 1.0;
    if (rightUpperArm) rightUpperArm.rotation.z = -1.0;
    if (leftLowerArm) leftLowerArm.rotation.z = restPose.current.leftForearmZ;
    if (rightLowerArm) rightLowerArm.rotation.z = restPose.current.rightForearmZ;

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
  }, [chest, head, hips, leftLowerArm, leftUpperArm, rightLowerArm, rightUpperArm, spine]);

  useEffect(() => {
    return () => {
      VRMUtils.deepDispose(vrm.scene);
    };
  }, [vrm]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const t = state.clock.elapsedTime;
    const rest = restPose.current;
    const st = useCompanion.getState();
    const playing = st.phase === "playing";

    // ── NPC brain + navigation (Blueprint §§4-6, 12) ──────────────
    const rootObj = root.current;
    let moving = false;
    let lastIntent: Intent = IDLE_INTENT;
    if (rootObj) {
      const p = perceive(
        { x: rootObj.position.x, z: rootObj.position.z, yaw: rootObj.rotation.y },
        st.gameMinutes,
        Boolean(st.speech),
      );
      const intent = playing ? NPC_BRAIN.tick(dt, p) : IDLE_INTENT;
      lastIntent = intent;
      if (playing && intent.label !== st.activity) {
        useCompanion.setState({ activity: intent.label });
      }
      // Authored activity voice lines when the brain commits to an object.
      if (
        playing &&
        intent.label !== lastVoiceActivityLabel &&
        (intent.kind === "attend" || intent.kind === "rest")
      ) {
        lastVoiceActivityLabel = intent.label;
        tryActivityVoice(intent.targetId);
      } else if (intent.kind === "idle" || intent.kind === "sleep") {
        lastVoiceActivityLabel = "";
      }

      // Stuck detection: if we can't make progress toward the current
      // intent's target, stop pathing until the brain picks a new intent.
      if (intent.label !== skipNavLabel) {
        skipNavLabel = "";
        stuckMs = 0;
      }
      let tx: number | null = null;
      let tz: number | null = null;
      if (playing && intent.targetId && intent.label !== skipNavLabel) {
        const it = interactablePos(intent.targetId);
        if (it) {
          const bx = rootObj.position.x - it.x;
          const bz = rootObj.position.z - it.z;
          const bd = Math.hypot(bx, bz) || 1;
          tx = it.x + (bx / bd) * 0.55;
          tz = it.z + (bz / bd) * 0.55;
        }
      }
      let bodyYaw = rootObj.rotation.y;
      if (tx !== null && tz !== null) {
        const px0 = rootObj.position.x;
        const pz0 = rootObj.position.z;
        const w = walkStep(rootObj.position, tx, tz, dt);
        moving = w.moving;
        if (moving) {
          const moved = Math.hypot(rootObj.position.x - px0, rootObj.position.z - pz0);
          stuckMs = moved < 0.0015 ? stuckMs + dt : 0;
          if (stuckMs > 2.5) {
            skipNavLabel = intent.label;
            moving = false;
          }
        }
        const it = intent.targetId ? interactablePos(intent.targetId) : null;
        if (w.arrived && it) {
          bodyYaw = steerYaw(
            bodyYaw,
            Math.atan2(it.x - rootObj.position.x, it.z - rootObj.position.z),
            dt,
          );
        } else if (!w.arrived) {
          bodyYaw = steerYaw(bodyYaw, w.targetYaw, dt);
        }
      } else if (playing && intent.kind === "observe_player") {
        bodyYaw = steerYaw(
          bodyYaw,
          Math.atan2(
            playerSim.position.x - rootObj.position.x,
            playerSim.position.z - rootObj.position.z,
          ),
          dt,
          1.6,
        );
      }
      rootObj.rotation.y = bodyYaw;

      // ── gaze director (Blueprint §11: ~70% activity / 20% player / 10% saccade) ──
      gazeHold -= dt;
      if (gazeHold <= 0) {
        gazeHold = 2.5 + Math.random() * 3.5;
        const r = Math.random();
        const dist = Math.hypot(
          playerSim.position.x - rootObj.position.x,
          playerSim.position.z - rootObj.position.z,
        );
        const gIt = intent.targetId ? interactablePos(intent.targetId) : null;
        if (r < 0.2 && dist < 4.5) {
          GAZE_TARGET.set(playerSim.position.x, playerSim.position.y - 0.25, playerSim.position.z);
        } else if (gIt) {
          GAZE_TARGET.set(gIt.x, 1.15, gIt.z);
        } else if (r < 0.35) {
          GAZE_TARGET.set(
            rootObj.position.x + (Math.random() - 0.5) * 3,
            0.8 + Math.random() * 1.4,
            rootObj.position.z + (Math.random() - 0.5) * 3,
          );
        } else {
          GAZE_TARGET.set(
            rootObj.position.x + Math.sin(bodyYaw) * 2.2,
            1.35,
            rootObj.position.z + Math.cos(bodyYaw) * 2.2,
          );
        }
      }
      EYE_TARGET.position.copy(GAZE_TARGET);
      if (!eyesBound && vrm.lookAt) {
        vrm.lookAt.target = EYE_TARGET;
        eyesBound = true;
      }
    }

    // ── procedural walk cycle (Blueprint §2 movement) ─────────────
    WALK_PHASE += moving ? dt * 5.2 : 0;
    const swing = Math.sin(WALK_PHASE);
    WALK_BLEND += ((moving ? 1 : 0) - WALK_BLEND) * (1 - Math.exp(-10 * dt));
    const wb = WALK_BLEND;
    const legL = vrm.humanoid.getNormalizedBoneNode("leftUpperLeg" as never);
    const legR = vrm.humanoid.getNormalizedBoneNode("rightUpperLeg" as never);
    const shinL = vrm.humanoid.getNormalizedBoneNode("leftLowerLeg" as never);
    const shinR = vrm.humanoid.getNormalizedBoneNode("rightLowerLeg" as never);
    if (legL) legL.rotation.x = -swing * 0.42 * wb;
    if (legR) legR.rotation.x = swing * 0.42 * wb;
    if (shinL) shinL.rotation.x = Math.max(0, -swing) * 0.55 * wb;
    if (shinR) shinR.rotation.x = Math.max(0, swing) * 0.55 * wb;
    if (leftUpperArm) leftUpperArm.rotation.x = swing * 0.16 * wb;
    if (rightUpperArm) rightUpperArm.rotation.x = -swing * 0.16 * wb;

    if (lastIntent.kind === "sleep") {
      // night: no wandering, calm breathing only
      moving = false;
    }

    if (rest) {
      const breath = Math.sin(t * 1.35);
      const weight = Math.sin(t * 0.42);
      if (spine) spine.rotation.x = rest.spineX + breath * 0.018;
      if (chest) chest.rotation.z = rest.chestZ + weight * 0.025;
      if (hips) hips.rotation.y = rest.hipsY + weight * 0.018;
      if (leftUpperArm) leftUpperArm.rotation.z = rest.leftArmZ + breath * 0.022 + weight * 0.015;
      if (rightUpperArm) rightUpperArm.rotation.z = rest.rightArmZ - breath * 0.022 + weight * 0.015;
      if (leftLowerArm) leftLowerArm.rotation.z = rest.leftForearmZ + Math.sin(t * 0.7) * 0.018;
      if (rightLowerArm) rightLowerArm.rotation.z = rest.rightForearmZ - Math.sin(t * 0.7) * 0.018;

      if (head && root.current) {
        const dx = GAZE_TARGET.x - root.current.position.x;
        const dz = GAZE_TARGET.z - root.current.position.z;
        let rel = Math.atan2(dx, dz) - root.current.rotation.y;
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        const yaw = THREE.MathUtils.clamp(rel, -0.85, 0.85);
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, rest.headY + yaw, 3.4, dt);
        const pitch = THREE.MathUtils.clamp((GAZE_TARGET.y - 1.42) * 0.3, -0.2, 0.22);
        const idleNod = Math.sin(t * 0.55) * 0.012;
        head.rotation.x = THREE.MathUtils.damp(head.rotation.x, rest.headX + pitch + idleNod, 3.4, dt);
      }
    }

    // ── facial expressions + blink (Blueprint §10) ────────────────
    const em = vrm.expressionManager;
    if (em) {
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkTimer = 2.4 + Math.random() * 3.6;
        blinkVal = 1;
      }
      blinkVal = Math.max(0, blinkVal - dt * 6);
      setExpr(em, "blink", Math.min(1, blinkVal * 1.8));
      const targetName = EXPR_MAP[st.expression] ?? "relaxed";
      const targetW = playing ? 0.75 : 0.3;
      exprVal += (targetW - exprVal) * (1 - Math.exp(-2.5 * dt));
      for (const name of EXPR_NAMES) {
        setExpr(em, name, name === targetName ? exprVal : 0);
      }
    }

    vrm.update(dt);

    // Ported apartment spatial sources — Vivi head/cloth/feet (Zevra-KB:
    // positional sources need per-frame positions or they drift/stick).
    if (head) {
      head.getWorldPosition(HEAD_POS);
      setSourcePosition("vivi_head", HEAD_POS.x, HEAD_POS.y, HEAD_POS.z);
      setSourcePosition("vivi_cloth", HEAD_POS.x, HEAD_POS.y - 0.35, HEAD_POS.z);
    }
    const rp = root.current ? root.current.position : vrm.scene.position;
    setSourcePosition("vivi_feet", rp.x, 0.05, rp.z);
    const dx = playerSim.position.x - (head ? HEAD_POS.x : rp.x);
    const dz = playerSim.position.z - (head ? HEAD_POS.z : rp.z);
    const proximity = THREE.MathUtils.clamp(1 - Math.hypot(dx, dz) / 2.5, 0, 1);
    const viviMoving = Math.hypot(rp.x - LAST_VIVI.x, rp.z - LAST_VIVI.z) > 0.002;
    const viviTurning = Math.abs(
      (root.current ? root.current.rotation.y : 0) - LAST_VIVI.yaw,
    ) > 0.01;
    LAST_VIVI.x = rp.x;
    LAST_VIVI.z = rp.z;
    LAST_VIVI.yaw = root.current ? root.current.rotation.y : 0;
    tickCloth({ dt, proximity, turning: viviTurning, moving: viviMoving });
    tickClosePulse({ dt, proximity, consent: st.companion.consentScope.length > 0 });
    const night = st.gameMinutes < 6 * 60 || st.gameMinutes >= 22 * 60;
    setImmersionMix(proximity, st.companion.trust / 100, night);

    if (anchorsRoot.current) {
      for (const [zone, [bone, off]] of bones) {
        const target = anchorsRoot.current.children.find(
          (c) => (c.userData as { adultZone?: ZoneId }).adultZone === zone,
        );
        if (!target || !bone) continue;
        bone.getWorldPosition(target.position);
        bone.getWorldQuaternion(Q_TMP);
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
