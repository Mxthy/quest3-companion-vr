/**
 * Session-persistent cognition (Blueprint §10): episodic highlights, semantic
 * facts and the player model survive reloads via localStorage. The game save
 * (save.ts) stays untouched — memory is Vivi's own store.
 */
import { episodic, semantic, type EpisodicMemory } from "./memory";
import { playerModel } from "./player-model";

const KEY = "vivi_cognition_v1";
const SAVE_INTERVAL_MS = 15_000;
let lastSave = 0;
let dirty = false;

type Persisted = {
  version: 1;
  episodic: EpisodicMemory[];
  semantic: [string, { key: string; value: number; text: string; updatedAt: number }][];
  playerModel: typeof playerModel;
};

export function markDirty(): void {
  dirty = true;
}

export function loadCognition(): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Persisted;
    if (data.version !== 1) return;
    episodic.length = 0;
    episodic.push(...(data.episodic ?? []));
    for (const [k, f] of data.semantic ?? []) semantic.set(k, f);
    if (data.playerModel) {
      playerModel.familiarity = data.playerModel.familiarity ?? 0;
      playerModel.interactionSeconds = data.playerModel.interactionSeconds ?? 0;
      playerModel.preferredObjects = data.playerModel.preferredObjects ?? {};
      playerModel.preferredActivities = data.playerModel.preferredActivities ?? {};
      playerModel.hourlyPresence = data.playerModel.hourlyPresence ?? new Array(24).fill(0);
      playerModel.confidence = data.playerModel.confidence ?? 0;
    }
  } catch {
    /* corrupted store → start fresh */
  }
}

export function saveCognition(force = false): void {
  const now = Date.now();
  if (!force && !dirty && now - lastSave < SAVE_INTERVAL_MS) return;
  try {
    const data: Persisted = {
      version: 1,
      episodic: episodic.slice(-20), // only highlights survive the session
      semantic: [...semantic.entries()],
      playerModel,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    lastSave = now;
    dirty = false;
  } catch {
    /* storage full/blocked → memory stays in-session */
  }
}
