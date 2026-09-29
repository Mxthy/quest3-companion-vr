import type {
  LlmRequestContext,
  LlmPersonaSnapshot,
  LlmIntimacySnapshot,
  LlmPlayerStance,
  LlmSituation,
} from "./types";
import { dialogueMemory } from "./memory-store";
import { memoryContext } from "@/lib/companion/cognition";

/** Local intimacy agreement interface matching system structure */
export type IntimacyAgreement = {
  pace?: string;
  openRegions?: string[];
  trust?: number;
  checkIns?: boolean;
};

/** Local persona disposition state interface */
export type PersonaState = {
  disposition?: {
    openness?: number;
    needsTalk?: number;
    warmth?: number;
    playfulness?: number;
  };
  moodBias?: string;
  lastThought?: string;
  memory?: Record<string, { liked: number }>;
};

/** Local companion state context interface for game/store integration */
export type CompanionContext = {
  bond?: number;
  mood?: string;
  scheduleBeat?: string;
  presence?: string;
  trust?: number;
  warmth?: number;
  topicSafety?: string;
  vulnerability?: string;
  userVulnerability?: string;
  consentScope?: string;
  girlfriendAffection?: number;
  lastReaction?: string;
  held?: string | null;
  seated?: boolean;
  nearElara?: boolean;
  lookId?: string | null;
  [key: string]: unknown;
};

export type GameSnapshotForLlm = {
  bond?: number;
  affection?: number;
  comfort?: number;
  energy?: number;
  level?: number;
  day?: number;
  gameMinutes?: number;
  consent?: boolean;
  intimacy?: IntimacyAgreement;
  persona?: PersonaState;
  recentLog?: string;
  focusName?: string;
  zoneId?: string;
  zoneLayer?: number;
  gateReason?: string;
  scene?: LlmSituation["scene"];
  playerInput?: string;
  seedNodeId?: string;
  companion?: CompanionContext;
  structuredMemory?: Record<string, unknown> | string;
};

function clockLabel(gameMinutes: number): string {
  const h = Math.floor(gameMinutes / 60) % 24;
  if (h < 6) return "late night";
  if (h < 11) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export function interactionLayer(level: number): number {
  return Math.min(3, Math.max(1, Math.floor(level / 2) + 1));
}

export function identitySystemPrompt(): string {
  return "You are Vivi (Elara), a warm, observant, present companion in a VR apartment space. You speak concisely, with warmth and gentle presence.";
}

export function memoryPromptBlock(mem: Record<string, unknown> | string): string {
  if (typeof mem === "string") return mem;
  try {
    return JSON.stringify(mem);
  } catch {
    return "";
  }
}

export function buildPersonaSnap(p?: PersonaState): LlmPersonaSnapshot {
  const regionLikes: Record<string, number> = {};
  if (p?.memory) {
    for (const [k, v] of Object.entries(p.memory)) {
      if (v && typeof v.liked === "number") {
        regionLikes[k] = Math.round(v.liked * 100) / 100;
      }
    }
  }
  return {
    openness: p?.disposition?.openness ?? 0.8,
    needsTalk: p?.disposition?.needsTalk ?? 0.5,
    warmth: p?.disposition?.warmth ?? 0.8,
    playfulness: p?.disposition?.playfulness ?? 0.7,
    moodBias: p?.moodBias ?? "warm",
    lastThought: p?.lastThought ?? "",
    regionLikes,
  };
}

export function buildIntimacySnap(i?: IntimacyAgreement, consent = true): LlmIntimacySnapshot {
  return {
    consent,
    pace: i?.pace ?? "gentle",
    openRegions: i?.openRegions ? [...i.openRegions] : [],
    trust: i?.trust ?? 10,
    checkIns: i?.checkIns ?? true,
  };
}

export function buildPlayerSnap(s: GameSnapshotForLlm): LlmPlayerStance {
  const level = s.level ?? 1;
  return {
    affection: s.affection ?? s.bond ?? 50,
    comfort: s.comfort ?? 50,
    energy: s.energy ?? 100,
    level,
    layer: interactionLayer(level),
    recentActions: s.recentLog ? [s.recentLog] : [],
  };
}

export function buildLlmContext(s: GameSnapshotForLlm): LlmRequestContext {
  // Cognition memory: episodic highlights + semantic facts (Phase 2).
  const cognitionMemory = memoryContext();
  const situation: LlmSituation = {
    scene: s.scene ?? (s.zoneId ? "touch" : "apartment"),
    focus: s.focusName,
    zoneId: s.zoneId,
    zoneLayer: s.zoneLayer,
    gateReason: s.gateReason,
    timeOfDay: clockLabel(s.gameMinutes ?? 1200),
    day: s.day ?? 1,
  };
  return {
    situation,
    persona: buildPersonaSnap(s.persona),
    intimacy: buildIntimacySnap(s.intimacy, s.consent ?? true),
    player: buildPlayerSnap(s),
    memory: dialogueMemory.recent(12),
    playerInput: s.playerInput,
    seedNodeId: s.seedNodeId,
    companion: s.companion
      ? {
          presence: s.companion.presence,
          trust: s.companion.trust,
          warmth: s.companion.warmth,
          topicSafety: s.companion.topicSafety,
          vulnerability: s.companion.vulnerability || s.companion.userVulnerability,
          consentScope: s.companion.consentScope,
          girlfriendAffection: s.companion.girlfriendAffection,
          lastReaction: s.companion.lastReaction,
          bond: s.companion.bond,
          mood: s.companion.mood,
          scheduleBeat: s.companion.scheduleBeat,
        }
      : undefined,
    // Cognition memory: episodic highlights + semantic facts (Phase 2).
    structuredMemoryBlock: [
      s.structuredMemory ? memoryPromptBlock(s.structuredMemory) : undefined,
      cognitionMemory,
    ]
      .filter(Boolean)
      .join("\n\n") || undefined,
  };
}

/** Compact system + user messages for chat API (token-efficient). */
export function contextToMessages(
  ctx: LlmRequestContext,
  voiceStyle: string,
): { role: "system" | "user" | "assistant"; content: string }[] {
  const system = [
    identitySystemPrompt(),
    voiceStyle,
    "You are Vivi, adult roommate companion. Reply ONLY as JSON:",
    '{"text":"...","expression":"happy|relaxed|surprised|neutral|sad","choices":[{"id":"a","label":"...","effect":"none"}],"effects":[]}',
    "effects may include: consent_yes, consent_no, pace_slow, open_soft, open_close, pause, aftercare, none.",
    "Respect gates: if consent false or region closed, do not escalate; invite talk or soft only.",
    "Stay coherent with persona openness and regionLikes. Never invent non-consent.",
    "Max 3 short sentences in text. Max 3 choices.",
  ].join("\n");

  const stateBlock = JSON.stringify(
    {
      situation: ctx.situation,
      persona: ctx.persona,
      intimacy: ctx.intimacy,
      player: ctx.player,
      companion: ctx.companion,
      seed: ctx.seedNodeId,
    },
    null,
    0,
  );

  const mem = ctx.memory
    .map((t) => `${t.role}: ${t.text}`)
    .join("\n");

  const user = [
    `STATE:${stateBlock}`,
    ctx.structuredMemoryBlock ? `LONG_MEMORY:\n${ctx.structuredMemoryBlock}` : "",
    mem ? `WORKING_MEMORY:\n${mem}` : "WORKING_MEMORY: (empty)",
    ctx.playerInput ? `PLAYER: ${ctx.playerInput}` : "PLAYER: (awaits your line)",
    "Respond as Vivi JSON now.",
  ].filter(Boolean).join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
