/**
 * World-space VR HUD. Canvas textures, ray-selectable buttons, same store as DOM HUD.
 * Panels sit 1.8–2.4 m in front of the player (comfort / readability).
 */

/**
 * Minimal world-space UI planes for interaction prompts / dialogue title.
 * Uses canvas textures — no React dependency inside the render loop.
 */

import type { XRDiagSnapshot } from "./diagnostics";
import { loadComfort } from "./comfort-settings";
import {
  vrClosePanel,
  vrSelectDialogue,
  vrInventoryUse,
  vrShopBuy,
  vrFridgeTake,
  vrFridgeClear,
  vrSetOutfit,
  vrOpenPhoto,
  vrToggleComfort,
  vrResume,
  vrResetSave,
} from "./panel-actions";

export type HudButton = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  enabled?: boolean;
};

export type HudPanelType =
  | "none"
  | "dialogue"
  | "inventory"
  | "shop"
  | "fridge"
  | "cook"
  | "wardrobe"
  | "gallery"
  | "photo"
  | "pause";

export interface HudStateAdapter {
  dialogueId?: string | null;
  panel?: HudPanelType | string;
  photoMode?: boolean;
  paused?: boolean;
  hoverName?: string | null;
  day?: number;
  gameMinutes?: number;
  affection?: number;
  coins?: number;
  inventory?: Array<{ id: string; qty: number; kind?: string }>;
  cookingSlots?: string[];
  unlockedOutfits?: string[];
  outfit?: string;
  photos?: string[] | number[];
}

export type HudStatusData = {
  day: number;
  gameMinutes: number;
  clockText: string;
  affection: number;
  coins: number;
  hoverName: string | null;
};

export type HudPanelData = {
  type: HudPanelType;
  title: string;
  subtitle?: string;
  text?: string;
  buttons: HudButton[];
  diagSnapshot?: XRDiagSnapshot | null;
  showDiag?: boolean;
};

/** Pure TS helper to format clock from game minutes (e.g. 510 => "8:30 AM") */
export function formatClock(minutes: number): string {
  const m = Math.floor(minutes) % 1440;
  const hrs = Math.floor(m / 60);
  const mins = Math.floor(m % 60);
  const period = hrs >= 12 ? "PM" : "AM";
  const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
  const displayMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${displayHrs}:${displayMins} ${period}`;
}

/**
 * World-space UI label wrapper (from VRWorldUI).
 * Splitting strings into multiline text array for 3D panel displays.
 */
export function formatWorldLabel(text: string, maxLen = 28): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxLen) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/** Pure vector placement logic derived from VRHudSystem.placeInFront */
export function computeHudPlacement(
  cameraPos: { x: number; y: number; z: number },
  cameraDir: { x: number; y: number; z: number },
  dist = 2.05
): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  let dx = cameraDir.x;
  let dz = cameraDir.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) {
    dx = 0;
    dz = -1;
  } else {
    const inv = 1 / Math.sqrt(lenSq);
    dx *= inv;
    dz *= inv;
  }

  const px = cameraPos.x + dx * dist;
  const py = Math.max(1.15, Math.min(1.7, cameraPos.y - 0.05));
  const pz = cameraPos.z + dz * dist;

  return {
    position: [px, py, pz],
    lookAt: [px + dx, py, pz + dz],
  };
}

/** UV space button intersection logic */
export function findButtonAtUV(
  uv: { x: number; y: number },
  buttons: HudButton[],
  pw = 1024,
  ph = 768
): HudButton | null {
  const px = uv.x * pw;
  const py = (1 - uv.y) * ph;
  return buttons.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) ?? null;
}

/** Derive status bar data snapshot */
export function getHudStatus(state: HudStateAdapter): HudStatusData {
  const day = state.day ?? 1;
  const gameMinutes = state.gameMinutes ?? 8 * 60;
  return {
    day,
    gameMinutes,
    clockText: formatClock(gameMinutes),
    affection: Math.round(state.affection ?? 0),
    coins: state.coins ?? 0,
    hoverName: state.hoverName ?? null,
  };
}

/** Dispatch HUD action based on button ID string */
export function dispatchHudAction(id: string, options?: { showDiag?: boolean; toggleDiag?: () => void }) {
  if (id.startsWith("dlg:")) vrSelectDialogue(id.slice(4));
  else if (id.startsWith("inv:")) vrInventoryUse(id.slice(4));
  else if (id.startsWith("shop:")) vrShopBuy(id.slice(4));
  else if (id.startsWith("fridge:")) vrFridgeTake(id.slice(7));
  else if (id.startsWith("fit:")) vrSetOutfit(id.slice(4));
  else if (id === "close") vrClosePanel();
  else if (id === "continue") vrSelectDialogue("__continue");
  else if (id === "fridge-clear") vrFridgeClear();
  else if (id === "photo") vrOpenPhoto();
  else if (id === "resume") vrResume();
  else if (id === "reset") vrResetSave();
  else if (id === "smooth") {
    const c = loadComfort();
    vrToggleComfort({ smoothEnabled: !c.smoothEnabled });
  } else if (id === "teleport") {
    const c = loadComfort();
    vrToggleComfort({ teleportEnabled: !c.teleportEnabled });
  } else if (id === "snap") {
    const c = loadComfort();
    vrToggleComfort({ turn: c.turn === "snap" ? "smooth" : "snap" });
  } else if (id === "vignette") {
    const c = loadComfort();
    vrToggleComfort({ vignette: !c.vignette });
  } else if (id === "diag") {
    options?.toggleDiag?.();
  }
}

/**
 * Pure TS HUD panel data/logic manager.
 * Stores HUD layout, buttons, diagnostics state without WebGL/React dependencies.
 */
export class VRHudSystem {
  showDiag = false;
  private diag: XRDiagSnapshot | null = null;
  private lastKey = "";
  private hoverId: string | null = null;
  private locked = false;

  setDiagnostics(d: XRDiagSnapshot | null) {
    this.diag = d;
  }

  getHoverId(): string | null {
    return this.hoverId;
  }

  setHoverId(id: string | null) {
    this.hoverId = id;
  }

  isLocked(): boolean {
    return this.locked;
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  toggleDiag() {
    this.showDiag = !this.showDiag;
  }

  dispatch(id: string) {
    dispatchHudAction(id, {
      showDiag: this.showDiag,
      toggleDiag: () => this.toggleDiag(),
    });
  }
}

/**
 * Pure TS World UI manager (from VRWorldUI).
 */
export class VRWorldUI {
  private lastText = "";
  private visible = false;

  show(text: string): string[] {
    this.lastText = text;
    this.visible = true;
    return formatWorldLabel(text);
  }

  hide() {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getText(): string {
    return this.lastText;
  }
}
