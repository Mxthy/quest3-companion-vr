/**
 * Adult interaction runtime for the companion app.
 * Values mirror content/adult_interaction.yaml and content/props_adult.yaml
 * (repo Mxthy/quest3-companion-vr = source of truth; update both together).
 */

import { create } from "zustand";
import { AdultInteractionController } from "@/core/adult/AdultInteractionController";
import { IntimateContactSystem } from "@/core/adult/IntimateContact";
import type { ArousalLevel, PleasureConfig } from "@/core/adult/PleasureModel";
import type { ZoneId, Vec3 } from "@/core/adult/TouchZoneSystem";

/** arousal: content/adult_interaction.yaml */
export const ADULT_PLEASURE_CFG: PleasureConfig = {
  max: 100,
  baseRatePerSec: 8,
  grabMultiplier: 1.75,
  intenseBurst: 12,
  decayPerSec: 6,
  decayAfterglowPerSec: 4,
  orgasmThreshold: 100,
  postOrgasmLevel: 35,
  refractorySec: 12,
};

/** bond: content/adult_interaction.yaml */
export const ADULT_BOND = {
  onReachHot: 3,
  onOrgasm: 8,
  onFirstZoneGrab: 2,
};

/** dialogue_adult + dialogue_prop_adult from content YAML (original lines). */
export const ADULT_LINES = {
  zone_enter: {
    breast_l: ["Da… ja.", "Deine Hand ist warm."],
    breast_r: ["Nicht so schüchtern.", "Mmm."],
    groin: ["Du weißt, was du willst.", "Näher."],
    glute_l: ["Hey—", "Unverschämt. Mach weiter."],
    glute_r: ["Hey—", "Unverschämt. Mach weiter."],
    mouth: ["…", "Wenn du willst."],
    default: ["Ich spüre dich.", "Ja."],
  } as Record<string, string[]>,
  level_tease: ["Nur anfassen ist schon unfair.", "Du machst mich unruhig."],
  level_hot: ["Nicht aufhören.", "Härter ist auch erlaubt."],
  level_peak_build: ["Ich— gleich—", "Bei dir… ja—"],
  orgasm: ["Ah—!", "Verdammt…"],
  afterglow: ["Bleib noch.", "…Danke. Fürs Tempo."],
  stop_high: ["Schon gut. Ich bin noch da.", "Wann du willst, weiter."],
  toy_grab: ["Oh— du hast was mitgebracht.", "Zeig her."],
  shaft_zone: {
    groin: ["Da… ja, genau.", "Tiefer ist erlaubt."],
    mouth: ["Mmm.", "Langsam."],
  } as Record<string, string[]>,
};

const lastPick: Record<string, number> = {};

/** No-repeat picker (same style as companion/dialogue.ts). */
export function pickAdultLine(key: string, pool: string[]): string {
  if (pool.length === 1) return pool[0]!;
  let i = Math.floor(Math.random() * pool.length);
  if (i === lastPick[key]) i = (i + 1) % pool.length;
  lastPick[key] = i;
  return pool[i]!;
}

export type AdultHudState = {
  arousal: number;
  level: ArousalLevel;
  activeZone: ZoneId | null;
  refractory: boolean;
};

/** Subtle arousal HUD state; updated (throttled) by the adult bridge. */
export const useAdultHud = create<AdultHudState>(() => ({
  arousal: 0,
  level: "idle",
  activeZone: null,
  refractory: false,
}));

export type AdultInput = {
  grabbing: boolean;
  intensePressed: boolean;
  spankPressed: boolean;
};

/** Single shared runtime instance for the whole app. */
export const adultRuntime = {
  controller: new AdultInteractionController(ADULT_PLEASURE_CFG),
  intimate: new IntimateContactSystem(undefined, ADULT_PLEASURE_CFG),
  /** Edge-triggered input consumed by the bridge each frame (desktop keys / XR later). */
  input: {
    grabbing: false,
    intensePressed: false,
    spankPressed: false,
  } as AdultInput,
  /**
   * XR hand/controller touch points in world space, written by the XR input
   * adapter each frame and consumed by the adult bridge (plain Vec3 data —
   * never an engine object; Unity ports map its poses onto the same channel).
   * Cleared by the bridge after consumption.
   */
  xrTouchPoints: [] as Vec3[],
};

/** True while an immersive XR session is active (render adapter flag). */
export let xrActive = false;
export function setXrActive(v: boolean) {
  xrActive = v;
}
