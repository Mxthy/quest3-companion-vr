/**
 * Native → TypeScript contact bridge (integration drop-in).
 *
 * C++ ContactSampler (XR_EXT_hand_tracking) → JNI
 * com.zevra.questcompanion.ContactBridge.onNativeContact → this module →
 * ContactController.dispatchNativeContact. The decision layer stays here in
 * TypeScript; the native side is sensing only.
 */

import { ContactController, type ZoneId } from "@/core/interaction/ContactController";

/** Mirror of quest_companion::BodyRegion (contact_sampler.h). */
export enum BodyRegion {
  Head = 0,
  FaceL = 1,
  FaceR = 2,
  ShoulderL = 3,
  ShoulderR = 4,
  UpperArmL = 5,
  UpperArmR = 6,
  ForearmL = 7,
  ForearmR = 8,
  HandL = 9,
  HandR = 10,
  Chest = 11,
  Belly = 12,
  Back = 13,
  HipL = 14,
  HipR = 15,
}

export type SocialTouchIntent =
  | "comfort"
  | "attention"
  | "tap_directive"
  | "hold_comfort"
  | "neutral";

/** BodyRegion → closest existing ColliderZones zone. */
const REGION_TO_ZONE: Record<BodyRegion, ZoneId> = {
  [BodyRegion.Head]: "head",
  [BodyRegion.FaceL]: "face",
  [BodyRegion.FaceR]: "face",
  [BodyRegion.ShoulderL]: "torso",
  [BodyRegion.ShoulderR]: "torso",
  [BodyRegion.UpperArmL]: "torso",
  [BodyRegion.UpperArmR]: "torso",
  [BodyRegion.ForearmL]: "torso",
  [BodyRegion.ForearmR]: "torso",
  [BodyRegion.HandL]: "torso",
  [BodyRegion.HandR]: "torso",
  [BodyRegion.Chest]: "torso",
  [BodyRegion.Belly]: "torso",
  [BodyRegion.Back]: "back_l",
  [BodyRegion.HipL]: "hip_l",
  [BodyRegion.HipR]: "hip_r",
};

export function interpretTouch(
  region: BodyRegion,
  intensity: number,
  durationMs: number,
): SocialTouchIntent {
  if (region === BodyRegion.Head && intensity < 0.4) return "comfort";
  if (region === BodyRegion.ShoulderL || region === BodyRegion.ShoulderR) return "attention";
  if (intensity > 0.75 && durationMs < 200) return "tap_directive";
  if (durationMs > 1500) return "hold_comfort";
  return "neutral";
}

export type NativeContact = {
  region: BodyRegion;
  intent: SocialTouchIntent;
  intensity: number;
  durationMs: number;
  timestampNs: number;
};

export type NativeContactDispatcher = (contact: NativeContact) => void;

const dispatchers = new Set<NativeContactDispatcher>();

/** Wire the native JNI callback into the TypeScript decision layer. */
export function onNativeContact(
  region: BodyRegion,
  intensity: number,
  durationMs: number,
  timestampNs = 0,
): void {
  const intent = interpretTouch(region, intensity, durationMs);
  const contact: NativeContact = {
    region,
    intent,
    intensity,
    durationMs,
    timestampNs,
  };
  for (const dispatch of dispatchers) dispatch(contact);
}

/** Bind a ContactController so native touches flow through the core. */
export function bindNativeContactController(ctrl: ContactController): () => void {
  const dispatch: NativeContactDispatcher = (c) => {
    ctrl.dispatchNativeContact(REGION_TO_ZONE[c.region], c.intensity, c.durationMs);
  };
  dispatchers.add(dispatch);
  return () => dispatchers.delete(dispatch);
}

/**
 * Host-runtime hook: expose onNativeContact globally so the native shell
 * (JNI → WebView/JS glue) can push events without an import cycle.
 */
export function installNativeContactGlobal(): void {
  const g = globalThis as Record<string, unknown>;
  g.onNativeContact = onNativeContact;
}
