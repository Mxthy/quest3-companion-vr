/**
 * Public LLM dialogue layer API.
 *
 * Usage:
 *   import { dialogueLLM, buildGameSnapFromCompanionStore } from "@/lib/companion/llm";
 *   const reply = await dialogueLLM.generate(snap, setPartial);
 */
export { dialogueLLM, DialogueLLM } from "./dialogue-llm";
export type { DialogueLLMStatus } from "./dialogue-llm";
export { buildLlmContext, contextToMessages } from "./context-builder";
export type {
  GameSnapshotForLlm,
  IntimacyAgreement,
  PersonaState,
  CompanionContext,
} from "./context-builder";
export { dialogueMemory, DialogueMemory } from "./memory-store";
export { DEFAULT_LLM_CONFIG } from "./types";
export type {
  LlmReply,
  LlmChoice,
  LlmClientConfig,
  LlmRequestContext,
  LlmSituation,
  LlmDialogueTurn,
} from "./types";
export { speakText, stopSpeaking, speakViaRest, isSpeaking } from "./tts";
export { viviChat } from "./vivi-chat";
export type { ViviChatResult, ViviChatInput } from "./vivi-chat";
export { isLlmConfigured, chatCompletion, parseReplyJson } from "./rest-client";

import type { GameSnapshotForLlm } from "./context-builder";
import type { LlmSituation } from "./types";

/**
 * Helper to construct a GameSnapshotForLlm from current Zustand companion store state.
 */
export function buildGameSnapFromCompanionStore(
  storeState: {
    bond: number;
    used: { cup: boolean; vinyl: boolean; lantern: boolean };
    visits: number;
    held: string | null;
    seated: boolean;
    nearElara: boolean;
    lookId: string | null;
  },
  extra?: {
    scene?: LlmSituation["scene"];
    focusName?: string;
    zoneId?: string;
    zoneLayer?: number;
    gateReason?: string;
    playerInput?: string;
    seedNodeId?: string;
    consent?: boolean;
  },
): GameSnapshotForLlm {
  return {
    bond: storeState.bond,
    affection: storeState.bond,
    comfort: 50 + Math.floor(storeState.bond / 2),
    energy: 100,
    level: Math.floor(storeState.bond / 20) + 1,
    day: 1,
    gameMinutes: 1200,
    consent: extra?.consent ?? true,
    recentLog: storeState.held ? `Holding ${storeState.held}` : undefined,
    focusName: extra?.focusName ?? storeState.lookId ?? undefined,
    zoneId: extra?.zoneId,
    zoneLayer: extra?.zoneLayer,
    gateReason: extra?.gateReason,
    scene: extra?.scene,
    playerInput: extra?.playerInput,
    seedNodeId: extra?.seedNodeId,
    companion: {
      bond: storeState.bond,
      held: storeState.held,
      seated: storeState.seated,
      nearElara: storeState.nearElara,
      lookId: storeState.lookId,
    },
  };
}
