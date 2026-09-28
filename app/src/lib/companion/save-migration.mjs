export const CURRENT_SAVE_KEY = "elara-companion-v1";
export const LEGACY_FUSED_SAVE_KEY = "quest-companion-apartment-alpha";
export const CURRENT_SAVE_VERSION = 2;

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value, min)));
const strings = (value) =>
  Array.isArray(value) ? value.filter((entry) => typeof entry === "string").slice(0, 256) : [];

export function unwrapLegacySave(raw) {
  if (!raw || typeof raw !== "object") return null;
  const state = raw.state && typeof raw.state === "object" ? raw.state : raw;
  return state && typeof state === "object" ? state : null;
}

export function legacyProgressFrom(raw) {
  const state = unwrapLegacySave(raw);
  if (!state) return null;

  return {
    source: LEGACY_FUSED_SAVE_KEY,
    day: Math.max(1, Math.floor(num(state.day, 1))),
    gameMinutes: Math.max(0, Math.floor(num(state.gameMinutes, 600))),
    affection: Math.max(0, num(state.affection)),
    comfort: clamp(state.comfort, 0, 100),
    energy: clamp(state.energy, 0, 100),
    coins: Math.max(0, Math.floor(num(state.coins))),
    level: Math.max(0, Math.floor(num(state.level))),
    outfit: typeof state.outfit === "string" ? state.outfit : "cream",
    unlockedOutfits: strings(state.unlockedOutfits),
    unlockedDecor: strings(state.unlockedDecor),
    interacted: strings(state.interacted),
    photos: strings(state.photos),
    giftedCount: Math.max(0, Math.floor(num(state.giftedCount))),
    dishesCooked: Math.max(0, Math.floor(num(state.dishesCooked))),
    alphaComplete: Boolean(state.alphaComplete),
  };
}

export function mergeLegacyProgress(current, legacyRaw) {
  const legacy = legacyProgressFrom(legacyRaw);
  if (!legacy) return current;

  const currentUsed = current.used && typeof current.used === "object" ? current.used : {};
  const legacyState = unwrapLegacySave(legacyRaw);
  const importedBond = clamp(legacy.affection, 0, 100);

  return {
    ...current,
    version: CURRENT_SAVE_VERSION,
    bond: Math.max(clamp(current.bond, 0, 100), importedBond),
    visits: Math.max(0, Math.floor(num(current.visits)), legacy.day),
    muted: Boolean(current.muted),
    used: {
      cup: Boolean(currentUsed.cup),
      vinyl: Boolean(currentUsed.vinyl || legacyState?.radioOn),
      lantern: Boolean(currentUsed.lantern || legacyState?.lampOn),
    },
    importedProgress: legacy,
  };
}
