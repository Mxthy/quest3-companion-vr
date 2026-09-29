/**
 * Player model (Blueprint §6-7): what Vivi has learned about the player —
 * familiarity, preferences, routines and a simple activity prediction from
 * gaze dwell. No LLM involved; everything is observed behavior.
 */
import { strengthenSemantic, semanticFact } from "./memory";

export type PlayerModel = {
  familiarity: number; // 0..1 total interaction time
  interactionSeconds: number;
  /** Gaze dwell counts per object (what the player looks at). */
  preferredObjects: Record<string, number>;
  /** Interaction counts per kind. */
  preferredActivities: Record<string, number>;
  /** Arrival probability per hour, EMA-learned across sessions (0..1). */
  hourlyPresence: number[];
  /** Current best guess what the player is about to use. */
  predictedObject: string | null;
  confidence: number;
};

const ZERO23 = new Array(24).fill(0) as number[];

export const playerModel: PlayerModel = {
  familiarity: 0,
  interactionSeconds: 0,
  preferredObjects: {},
  preferredActivities: {},
  hourlyPresence: [...ZERO23],
  predictedObject: null,
  confidence: 0,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

let lookDwell = 0;

/** Called every frame with what the player currently looks at. */
export function observeLook(objectId: string | null, dt: number): void {
  if (!objectId) {
    lookDwell = Math.max(0, lookDwell - dt);
    return;
  }
  playerModel.preferredObjects[objectId] = (playerModel.preferredObjects[objectId] ?? 0) + dt;

  // Prediction: sustained dwell (>1.5 s) on an object anticipates its use.
  lookDwell += dt;
  if (lookDwell > 1.5) {
    if (playerModel.predictedObject !== objectId) playerModel.predictedObject = objectId;
  }

  // Semantic learning: notable gaze preference becomes a fact.
  const dwell = playerModel.preferredObjects[objectId] ?? 0;
  const seen = semanticFact(`player_looks_${objectId}`)?.value ?? 0;
  if (dwell > 8 && seen < 0.8) {
    strengthenSemantic(
      `player_looks_${objectId}`,
      0.1,
      `Du schaust oft zum ${objectLabel(objectId)}.`,
    );
  }
}

export function noteInteraction(kind: "talk" | "touch" | "gift" | "object" | "enter"): void {
  playerModel.preferredActivities[kind] = (playerModel.preferredActivities[kind] ?? 0) + 1;
  const n = Object.values(playerModel.preferredActivities).reduce((s, v) => s + v, 0);
  playerModel.confidence = clamp01(n / 30);
  if (kind !== "enter" && playerModel.preferredActivities[kind]! > 4) {
    strengthenSemantic(
      `player_interaction_${kind}`,
      0.12,
      kind === "touch"
        ? "Du berührst sie oft."
        : kind === "talk"
          ? "Du redest gern mit ihr."
          : `Du machst oft: ${kind}.`,
    );
  }
}

/** Estimated player mood heuristic from interaction rate (0 = calm, 1 = lively). */
export function estimatedMood(): number {
  const touch = playerModel.preferredActivities["touch"] ?? 0;
  const talk = playerModel.preferredActivities["talk"] ?? 0;
  return clamp01((touch + talk) / 40);
}

/**
 * Record a session arrival at this hour; returns the expectation that was
 * learned BEFORE this visit (Blueprint §5 prediction loop).
 */
export function noteArrival(gameMinutes: number): number {
  const h = Math.floor(gameMinutes / 60) % 24;
  const expected = playerModel.hourlyPresence[h] ?? 0;
  // EMA: visits reinforce this hour, absence in-session lets others decay.
  playerModel.hourlyPresence[h] = clamp01(expected * 0.6 + 0.45);
  for (let i = 0; i < 24; i++) {
    if (i !== h) playerModel.hourlyPresence[i] *= 0.985;
  }
  if (playerModel.hourlyPresence[h] > 0.55 && expected > 0.4) {
    strengthenSemantic(
      `player_routine_${h}h`,
      0.15,
      `Du kommst oft gegen ${h} Uhr.`,
    );
  }
  return expected;
}

export function tickPlayerModel(dt: number, playerNear: boolean): void {
  if (playerNear) {
    playerModel.interactionSeconds += dt;
    playerModel.familiarity = clamp01(playerModel.interactionSeconds / 3600); // 1h → 1.0
  }
}

const LABELS: Record<string, string> = {
  radio: "Radio",
  kettle: "Wasserkocher",
  fridge: "Kühlschrank",
  stove: "Herd",
  couch: "Sofa",
  tv: "Fernseher",
  laptop: "Laptop",
  window: "Fenster",
  plant: "Nori",
  bookshelf: "Bücherregal",
  bed: "Bett",
  door: "Tür",
  gift_box: "Geschenkbox",
  mirror: "Spiegel",
  wardrobe: "Kleiderschrank",
  photo_frame: "Fotorahmen",
};

function objectLabel(id: string): string {
  return LABELS[id] ?? id;
}
