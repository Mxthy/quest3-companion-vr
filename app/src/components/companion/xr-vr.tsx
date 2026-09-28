/**
 * XR input/render adapter — the "clients/webxr" layer.
 *
 * Vault contract (life-vibe/architecture/platform-adapters + life-vibe/webxr/iwsdk):
 * gameplay systems never import raw XR APIs. This adapter is the ONLY place that
 * touches WebXR; it maps hands/controllers onto the same InputAction channel the
 * desktop keyboard uses (adultRuntime.input / xrTouchPoints).
 *
 * Deviation noted 2026-09-20: built on @react-three/xr (three.js WebXR) instead of
 * Meta IWSDK for velocity; adapter isolation keeps an IWSDK swap possible.
 */

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import {
  createXRStore,
  XR,
  XROrigin,
  useXRControllerLocomotion,
  useXRInputSourceStates,
} from "@react-three/xr";
import * as THREE from "three";
import { adultRuntime, setXrActive, useAdultHud } from "@/lib/companion/adult";
import { DEFAULT_ZONES } from "@/core/adult/TouchZoneSystem";
import { adultAnchors } from "./adult-anchors";
import { useCompanion } from "@/lib/companion/store";
import { playerSim } from "@/lib/companion/player-ref";
import { xrOriginHeightCorrection } from "@/lib/companion/view-height.mjs";
import {
  applyQuestRendererProfile,
  applyQuestSceneProfile,
  detectPerformanceTier,
  formatDiagLines,
  getSuggestedFoveationLevel,
  XRDiagnostics,
} from "@/xr";

const ZONE_DEFS = new Map(DEFAULT_ZONES.map((z) => [z.id, z]));
const PINCH_CM = 0.028;
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP_C = new THREE.Vector3();
const GAZE_HIT = new THREE.Vector3();
const GAZE_SPHERE = new THREE.Sphere(new THREE.Vector3(), 0.05);
const GAZE_RAY = new THREE.Ray();

/** Timestamp of the last successfully read hand joint pose (gaze fallback gate). */
let lastHandPoseAt = 0;

/** Immersive session needs HTTPS + user gesture (button in overlay). */
export const xrStore = createXRStore({
  hand: true,
  controller: true,
  foveation: 0.2,
  offerSession: false,
});

const LEVEL_TEXT: Record<string, string> = {
  idle: "",
  tease: "…",
  hot: "♥",
  peak_build: "♥♥",
  orgasm: "♥♥♥",
};

/** VR rig: origin group + thumbstick locomotion (snap turn, comfort-first). */
function XrRig() {
  const originRef = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const states = useXRInputSourceStates();
  useXRControllerLocomotion(
    originRef,
    { speed: 1.9 },
    { type: "snap", degrees: 30, deadZone: 0.5 },
  );

  useFrame(() => {
    const origin = originRef.current;
    if (!origin || !gl.xr.getSession()) return;
    const xrCam = gl.xr.getCamera();
    const cam = (xrCam as unknown as { cameras?: THREE.PerspectiveCamera[] }).cameras?.[0];
    if (!cam) return;
    const trackedInput = states.some((s) => s.type === "hand" || s.type === "controller");
    origin.position.y = xrOriginHeightCorrection(cam.position.y, trackedInput);
  });

  useEffect(() => {
    const unsub = xrStore.subscribe((s) => setXrActive(s.session != null));
    setXrActive(xrStore.getState().session != null);
    return unsub;
  }, []);

  return <XROrigin ref={originRef} position={[0.18, 0, 2.62]} />;
}

/** Hands -> xrTouchPoints + pinch=grab. Robust via frame.getJointPose. */
function XrHands() {
  const states = useXRInputSourceStates();
  const gl = useThree((s) => s.gl);

  useFrame((_state, _raw, frame) => {
    const session = gl.xr.getSession();
    if (!session || !frame) return;
    const refSpace = gl.xr.getReferenceSpace();
    if (!refSpace) return;
    const xrCam = gl.xr.getCamera();
    if (!xrCam) return;

    let anyPinch = false;
    for (const st of states) {
      if (st.type !== "hand" || !st.inputSource.hand) continue;
      const hand = st.inputSource.hand as XRHand;
      const indexTip = hand.get("index-finger-tip");
      const thumbTip = hand.get("thumb-tip");
      if (!indexTip || !thumbTip) continue;
      const getJointPose = frame.getJointPose?.bind(frame);
      if (!getJointPose) continue;
      const poseIdx = getJointPose(indexTip, refSpace);
      const poseThumb = getJointPose(thumbTip, refSpace);
      if (!poseIdx || !poseThumb) continue;
      lastHandPoseAt = performance.now();

      const pIdx = TMP_A.set(poseIdx.transform.position.x, poseIdx.transform.position.y, poseIdx.transform.position.z);
      const pThumb = TMP_B.set(poseThumb.transform.position.x, poseThumb.transform.position.y, poseThumb.transform.position.z);
      applyOrigin(pIdx, xrCam);
      applyOrigin(pThumb, xrCam);

      const pinch = pIdx.distanceTo(pThumb) < PINCH_CM;
      if (pinch) anyPinch = true;

      for (const [id, obj] of adultAnchors) {
        const def = ZONE_DEFS.get(id);
        if (!def) continue;
        obj.getWorldPosition(TMP_C);
        const radius = Math.max(def.radius_m * 1.25, 0.045);
        if (pIdx.distanceTo(TMP_C) <= radius) {
          adultRuntime.xrTouchPoints.push({ x: pIdx.x, y: pIdx.y, z: pIdx.z });
          break;
        }
      }
    }
    if (states.some((s) => s.type === "hand")) {
      adultRuntime.input.grabbing = anyPinch || xrControllerGrabbing;
    }
  });

  return null;
}

let xrControllerGrabbing = false;
let prevTrigger = [false, false];

/** Controllers -> xrTouchPoints (grip pos), squeeze=grab, trigger=burst. */
function XrControllers() {
  const states = useXRInputSourceStates();
  const gl = useThree((s) => s.gl);

  useFrame((_state, _raw, frame) => {
    const session = gl.xr.getSession();
    if (!session || !frame) return;
    const refSpace = gl.xr.getReferenceSpace();
    if (!refSpace) return;
    const xrCam = gl.xr.getCamera();
    if (!xrCam) return;

    let grabbing = false;
    states.forEach((st, i) => {
      if (st.type !== "controller" || !st.inputSource.gripSpace) return;
      const gp = st.inputSource.gamepad;
      if (!gp) return;
      const squeeze = (gp as unknown as { squeeze?: { pressed: boolean } }).squeeze?.pressed ?? gp.buttons[1]?.pressed ?? false;
      const trigger = gp.buttons[0]?.pressed ?? false;
      if (squeeze) grabbing = true;

      if (trigger) {
        const pose = frame.getPose(st.inputSource.gripSpace, refSpace);
        if (pose) {
          const p = TMP_A.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          applyOrigin(p, xrCam);
          adultRuntime.xrTouchPoints.push({ x: p.x, y: p.y, z: p.z });
        }
      }
      if (trigger && !prevTrigger[i]) adultRuntime.input.intensePressed = true;
      prevTrigger[i] = trigger;
    });
    xrControllerGrabbing = grabbing;
    const hasHands = states.some((s) => s.type === "hand");
    if (!hasHands) adultRuntime.input.grabbing = grabbing;
  });

  return null;
}

/** Ported Quest perf heuristics: renderer/scene profile on session start,
 * running fps/frame-time diagnostics and adaptive foveation. */
const xrDiag = new XRDiagnostics();

function XrPerf() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const appliedRef = useRef(false);
  const frameTimesRef = useRef<number[]>([]);
  const lastAdjustRef = useRef(0);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const onToggle = () => {
      xrDiag.toggle();
      forceRender((n) => n + 1);
    };
    window.addEventListener("xr-diag-toggle", onToggle);
    return () => window.removeEventListener("xr-diag-toggle", onToggle);
  }, []);

  useEffect(() => {
    const unsub = xrStore.subscribe((s) => {
      if (!s.session || appliedRef.current) return;
      if (detectPerformanceTier() !== "quest") return;
      applyQuestRendererProfile(gl);
      applyQuestSceneProfile(scene);
      appliedRef.current = true;
    });
    return unsub;
  }, [gl, scene]);

  useFrame((_state, delta, frame) => {
    const session = gl.xr.getSession();
    if (!session || !frame) return;
    xrDiag.tick(delta);
    const win = frameTimesRef.current;
    win.push(delta * 1000);
    if (win.length > 120) win.shift();
    const now = performance.now();
    if (now - lastAdjustRef.current < 2000 || win.length < 60) return;
    const avg = win.reduce((a, b) => a + b, 0) / win.length;
    const level = getSuggestedFoveationLevel(detectPerformanceTier(), avg);
    if (typeof level === "number" && typeof gl.xr.setFoveation === "function") {
      gl.xr.setFoveation(level);
    }
    lastAdjustRef.current = now;
  });

  if (!xrDiag.visible) return null;
  return (
    <Billboard position={[0, 2.05, -1.52]}>
      <Text fontSize={0.045} color="#9ad7ff" anchorX="center" anchorY="middle">
        {formatDiagLines(xrDiag.snapshot({ presenting: true })).join("\n")}
      </Text>
    </Billboard>
  );
}

/** Gaze fallback (Zevra-KB quest3-hands-touch-zones): when hand tracking
 * drops and no controllers are held, looking at a zone (with a short dwell)
 * counts as touch, so interactions survive tracking loss. */
const GAZE_DWELL_MS = 800;
const GAZE_COOLDOWN_MS = 1400;

function XrGazeFallback() {
  const gl = useThree((s) => s.gl);
  const states = useXRInputSourceStates();
  const dwellRef = useRef<{ id: string; since: number } | null>(null);
  const cooldownRef = useRef(0);

  useFrame(() => {
    const session = gl.xr.getSession();
    if (!session) return;
    const hasController = states.some((s) => s.type === "controller");
    const handSeen = performance.now() - lastHandPoseAt < 1500;
    if (hasController || handSeen) {
      dwellRef.current = null;
      return;
    }
    const xrCam = gl.xr.getCamera();
    const cam = (xrCam as unknown as XRCam).cameras?.[0];
    if (!cam) return;
    cam.getWorldPosition(TMP_B);
    cam.getWorldDirection(TMP_A);
    GAZE_RAY.set(TMP_B, TMP_A);

    let hitId: string | null = null;
    for (const [id, obj] of adultAnchors) {
      const def = ZONE_DEFS.get(id);
      if (!def) continue;
      obj.getWorldPosition(TMP_C);
      GAZE_SPHERE.center.copy(TMP_C);
      GAZE_SPHERE.radius = Math.max(def.radius_m * 1.25, 0.045);
      if (GAZE_RAY.intersectSphere(GAZE_SPHERE, GAZE_HIT)) {
        hitId = id;
        break;
      }
    }

    const now = performance.now();
    if (!hitId) {
      dwellRef.current = null;
      return;
    }
    if (dwellRef.current?.id !== hitId) {
      dwellRef.current = { id: hitId, since: now };
      return;
    }
    if (
      now - dwellRef.current.since >= GAZE_DWELL_MS &&
      cooldownRef.current <= now
    ) {
      adultRuntime.xrTouchPoints.push({ x: GAZE_HIT.x, y: GAZE_HIT.y, z: GAZE_HIT.z });
      cooldownRef.current = now + GAZE_COOLDOWN_MS;
      dwellRef.current = null;
    }
  });

  return null;
}

/** In-VR arousal HUD: world-space text above the companion (DOM HUD is invisible in XR). */
function XrHud() {
  const hud = useAdultHud();
  const clockLabel = useCompanion((s) => s.clockLabel);
  const expression = useCompanion((s) => s.expression);
  const [inSession, setInSession] = useState(false);
  useEffect(() => {
    const unsub = xrStore.subscribe((s) => setInSession(s.session != null));
    setInSession(xrStore.getState().session != null);
    return unsub;
  }, []);
  const level = LEVEL_TEXT[hud.level] ?? "";
  if (!inSession) return null;
  return (
    <Billboard position={[0, 1.86, -1.52]}>
      <Text
        fontSize={0.045}
        color="#ffd9e6"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.08, 0]}
      >
        {`${clockLabel} · ${expression}`}
      </Text>
      <Text
        fontSize={0.075}
        color="#ffd9e6"
        anchorX="center"
        anchorY="middle"
      >
        {level ? `${level} ${Math.round(hud.arousal)}%` : ""}
      </Text>
    </Billboard>
  );
}

type XRCam = { cameras?: THREE.PerspectiveCamera[] };

/** Apply the XR origin offset (ref-space -> scene world). */
function applyOrigin(p: THREE.Vector3, xrCam: XRCam) {
  const cam = xrCam.cameras?.[0];
  if (cam?.parent) p.applyMatrix4(cam.parent.matrixWorld);
}

/** Enter VR from an overlay button; keeps phase/gate untouched. */
export async function enterVR() {
  if (useCompanion.getState().phase !== "playing") return;
  try {
    await xrStore.enterVR();
  } catch (err) {
    console.warn("[xr] enterVR failed", err);
  }
}

export function isVRSupported(): Promise<boolean> {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr?.isSessionSupported) return Promise.resolve(false);
  return xr.isSessionSupported("immersive-vr").catch(() => false);
}

/** The full XR layer, mounted inside the R3F Canvas. */
export function XrLayer() {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    if (!gl.xr.getSession()) return;
    const xrCam = gl.xr.getCamera();
    const cam = (xrCam as unknown as { cameras?: THREE.PerspectiveCamera[] }).cameras?.[0];
    if (cam) {
      cam.getWorldPosition(TMP_A);
      playerSim.position.x = TMP_A.x;
      playerSim.position.y = TMP_A.y;
      playerSim.position.z = TMP_A.z;
    }
  });
  return (
    <XR store={xrStore}>
      <XrRig />
      <XrHands />
      <XrControllers />
      <XrPerf />
      <XrGazeFallback />
      <XrHud />
    </XR>
  );
}
