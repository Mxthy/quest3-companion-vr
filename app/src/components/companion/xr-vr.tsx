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
 *
 * Hand mapping (input-devices/input/quest3-hands-touch-zones):
 * - index-fingertip hit-test vs zone anchors with generous radii
 * - pinch (index-tip <-> thumb-tip < ~2.5cm) = grab
 * - no haptics with pure hands: speech/audio = confirm (handled by sim)
 * - tracking loss tolerated: zones re-arm, desktop look=touch stays fallback
 *
 * Controller mapping: left stick = move, right stick = snap turn 30 deg,
 * squeeze = grab, trigger held = touch point at controller, trigger press = burst.
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

const ZONE_DEFS = new Map(DEFAULT_ZONES.map((z) => [z.id, z]));
const PINCH_CM = 0.028;
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP_C = new THREE.Vector3();

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
  useXRControllerLocomotion(
    originRef,
    { speed: 1.9 },
    { type: "snap", degrees: 30, deadZone: 0.5 },
  );

  // Keep XR session flag in sync for the sim/bridge (desktop path must sleep).
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
  const origin = useRef<THREE.Object3D | null>(null);

  useFrame((_state, _raw, frame) => {
    const session = gl.xr.getSession();
    if (!session || !frame) return;
    const refSpace = gl.xr.getReferenceSpace();
    if (!refSpace) return;
    // find XROrigin group: XR renders camera offset by its matrix
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

      // ref-space -> world (XR camera rig carries the origin offset)
      const pIdx = TMP_A.set(poseIdx.transform.position.x, poseIdx.transform.position.y, poseIdx.transform.position.z);
      const pThumb = TMP_B.set(poseThumb.transform.position.x, poseThumb.transform.position.y, poseThumb.transform.position.z);
      applyOrigin(pIdx, xrCam);
      applyOrigin(pThumb, xrCam);

      const pinch = pIdx.distanceTo(pThumb) < PINCH_CM;
      if (pinch) anyPinch = true;

      // generous hit-test radius per zone (vault: ~2cm base, scaled by zone def)
      for (const [id, obj] of adultAnchors) {
        const def = ZONE_DEFS.get(id);
        if (!def) continue;
        obj.getWorldPosition(TMP_C);
        const radius = Math.max(def.radius_m * 1.25, 0.045);
        if (pIdx.distanceTo(TMP_C) <= radius) {
          adultRuntime.xrTouchPoints.push({ x: pIdx.x, y: pIdx.y, z: pIdx.z });
          break; // one zone per fingertip
        }
      }
    }
    if (states.some((s) => s.type === "hand")) {
      // hands present in session -> XR owns the grab channel
      adultRuntime.input.grabbing = anyPinch || xrControllerGrabbing;
    }
  });

  // Hand visuals (XRHandModel) come with a later iteration: tracking itself
  // works joint-based; models need the pmndrs asset CDN and add draw calls.
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

      // trigger held = touch point at grip position
      if (trigger) {
        const pose = frame.getPose(st.inputSource.gripSpace, refSpace);
        if (pose) {
          const p = TMP_A.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          applyOrigin(p, xrCam);
          adultRuntime.xrTouchPoints.push({ x: p.x, y: p.y, z: p.z });
        }
      }
      // rising edge = intense burst
      if (trigger && !prevTrigger[i]) adultRuntime.input.intensePressed = true;
      prevTrigger[i] = trigger;
    });
    xrControllerGrabbing = grabbing;
    const hasHands = states.some((s) => s.type === "hand");
    if (!hasHands) adultRuntime.input.grabbing = grabbing; // hands win if present
  });

  // Controller shells (XRControllerModel) deferred — input works without them.
  return null;
}

/** In-VR arousal HUD: world-space text above the companion (DOM HUD is invisible in XR). */
function XrHud() {
  const hud = useAdultHud();
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

/** Apply the XR origin offset (ref-space -> scene world). */
type XRCam = { cameras?: THREE.PerspectiveCamera[] };

/** Apply the XR origin offset (ref-space -> scene world): the XR camera's
 * parent carries the XROrigin transform that @react-three/xr applies. */
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
  // proximity sync: playerSim mirrors XR head pos for audio/store
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
      <XrHud />
    </XR>
  );
}
