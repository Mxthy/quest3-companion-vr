import {
  CURRENT_SAVE_KEY,
  CURRENT_SAVE_VERSION,
  LEGACY_FUSED_SAVE_KEY,
  mergeLegacyProgress,
} from "./save-migration.mjs";

const KEY = CURRENT_SAVE_KEY;
const VERSION = CURRENT_SAVE_VERSION;

export type ImportedProgress = {
  source: typeof LEGACY_FUSED_SAVE_KEY;
  day: number;
  gameMinutes: number;
  affection: number;
  comfort: number;
  energy: number;
  coins: number;
  level: number;
  outfit: string;
  unlockedOutfits: string[];
  unlockedDecor: string[];
  interacted: string[];
  photos: string[];
  giftedCount: number;
  dishesCooked: number;
  alphaComplete: boolean;
};

export type SaveData = {
  version: number;
  bond: number;
  used: {
    cup: boolean;
    vinyl: boolean;
    lantern: boolean;
  };
  visits: number;
  muted: boolean;
  importedProgress?: ImportedProgress;
};

const defaults: SaveData = {
  version: VERSION,
  bond: 0,
  used: { cup: false, vinyl: false, lantern: false },
  visits: 0,
  muted: false,
};

function migrate(raw: SaveData): SaveData {
  const merged: SaveData = {
    ...defaults,
    ...raw,
    used: { ...defaults.used, ...(raw.used ?? {}) },
    version: VERSION,
  };
  merged.bond = Math.max(0, Math.min(100, Number(merged.bond) || 0));
  return merged;
}

function parseStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  try {
    const currentRaw = parseStored(KEY);
    const current = currentRaw ? migrate(currentRaw as SaveData) : { ...defaults, used: { ...defaults.used } };

    if (current.importedProgress) return current;

    const legacyRaw = parseStored(LEGACY_FUSED_SAVE_KEY);
    if (!legacyRaw) return current;

    const imported = migrate(mergeLegacyProgress(current, legacyRaw) as SaveData);
    writeSave(imported);
    return imported;
  } catch {
    return { ...defaults, used: { ...defaults.used } };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: VERSION }));
  } catch {
    /* private mode / quota */
  }
}
