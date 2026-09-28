export const CURRENT_SAVE_KEY: "elara-companion-v1";
export const LEGACY_FUSED_SAVE_KEY: "quest-companion-apartment-alpha";
export const CURRENT_SAVE_VERSION: 2;

export type LegacyProgress = {
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

export function unwrapLegacySave(raw: unknown): Record<string, unknown> | null;
export function legacyProgressFrom(raw: unknown): LegacyProgress | null;
export function mergeLegacyProgress<T extends Record<string, unknown>>(
  current: T,
  legacyRaw: unknown,
): T & { version: 2; importedProgress?: LegacyProgress };
