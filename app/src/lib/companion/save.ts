const KEY = "elara-companion-v1";
const VERSION = 1;

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

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults, used: { ...defaults.used } };
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
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
