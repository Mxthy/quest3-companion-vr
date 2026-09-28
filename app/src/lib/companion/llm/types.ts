/** Structured context the LLM receives — never free-form secrets from the client beyond game state. */

export type LlmChoice = {
  id: string;
  label: string;
  /** Optional hint for client side-effects after pick */
  effect?: "consent_yes" | "consent_no" | "pace_slow" | "pace_medium" | "open_soft" | "open_close" | "pause" | "aftercare" | "none";
};

export type LlmDialogueTurn = {
  role: "vivi" | "player" | "system";
  text: string;
  at: number;
  /** optional zone / interactable id */
  about?: string;
};

export type LlmSituation = {
  /** high-level scene */
  scene: "apartment" | "touch" | "negotiate" | "aftercare" | "daily" | "gift" | "cook" | "photo";
  /** player near / ray on */
  focus?: string;
  zoneId?: string;
  zoneLayer?: number;
  gateReason?: string;
  roomHint?: string;
  timeOfDay?: string;
  day?: number;
};

export type LlmPersonaSnapshot = {
  openness: number;
  needsTalk: number;
  warmth: number;
  playfulness: number;
  moodBias: string;
  lastThought: string;
  regionLikes: Record<string, number>;
};

export type LlmIntimacySnapshot = {
  consent: boolean;
  pace: string;
  openRegions: string[];
  trust: number;
  checkIns: boolean;
};

export type LlmPlayerStance = {
  affection: number;
  comfort: number;
  energy: number;
  level: number;
  layer: number;
  recentActions: string[];
};

export type LlmRequestContext = {
  situation: LlmSituation;
  persona: LlmPersonaSnapshot;
  intimacy: LlmIntimacySnapshot;
  player: LlmPlayerStance;
  memory: LlmDialogueTurn[];
  /** player just said / did */
  playerInput?: string;
  /** scripted seed line if any */
  seedNodeId?: string;
  /** Companion state machine snapshot (string bag for JSON) */
  companion?: Record<string, unknown>;
  structuredMemoryBlock?: string;
};

export type LlmReply = {
  speaker: "Vivi";
  text: string;
  expression?: string;
  choices?: LlmChoice[];
  /** NPC-side effects suggested by model (client validates) */
  effects?: LlmChoice["effect"][];
  /** for TTS */
  speak?: boolean;
  raw?: unknown;
};

export type LlmClientConfig = {
  /** Unused on the client — chat goes through the xAI server function. */
  apiUrl: string;
  apiKey?: string;
  model: string;
  /** hard cap for latency */
  maxTokens: number;
  temperature: number;
  /** abort after ms */
  timeoutMs: number;
  /** enable streaming when server supports it */
  stream: boolean;
  /** browser TTS after reply */
  tts: boolean;
  ttsLang: string;
  /** system style */
  voiceStyle: string;
};

export const DEFAULT_LLM_CONFIG = (): LlmClientConfig => {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  return {
    apiUrl: env?.VITE_LLM_API_URL || "https://api.x.ai/v1/chat/completions",
    apiKey: env?.VITE_LLM_API_KEY || undefined,
    model: env?.VITE_LLM_MODEL || "grok-4.5",
    maxTokens: 180,
    temperature: 0.85,
    timeoutMs: 8000,
    stream: false,
    tts: true,
    ttsLang: "en-US",
    voiceStyle:
      "Adult consensual roommate intimacy sim. Warm, specific, never cruel. No non-consent. Short lines (1-3 sentences). Offer 2-3 player choices when natural.",
  };
};
