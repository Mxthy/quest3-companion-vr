/**
 * Controllable LLM dialogue layer.
 * - Builds context from gates, persona, intimacy, memory
 * - REST chat completions (OpenAI-compatible)
 * - Falls back to scripted dialogue lines when offline / error / not configured
 * - Optional TTS for low-friction audio replies
 */
import {
  DEFAULT_LLM_CONFIG,
  type LlmClientConfig,
  type LlmReply,
  type LlmChoice,
} from "./types";
import { chatCompletion, isLlmConfigured } from "./rest-client";
import type { GameSnapshotForLlm } from "./context-builder";
import { dialogueMemory } from "./memory-store";
import { speakText, stopSpeaking, speakViaRest } from "./tts";
import { pickLine, type SpeechEvent } from "../dialogue";

export type DialogueLLMStatus = "idle" | "streaming" | "ready" | "fallback" | "error";

export class DialogueLLM {
  config: LlmClientConfig;
  status: DialogueLLMStatus = "idle";
  lastError: string | null = null;
  private abort: AbortController | null = null;
  /** live partial text while streaming */
  partialText = "";

  constructor(config?: Partial<LlmClientConfig>) {
    this.config = { ...DEFAULT_LLM_CONFIG(), ...config };
  }

  updateConfig(partial: Partial<LlmClientConfig>) {
    this.config = { ...this.config, ...partial };
  }

  cancel() {
    this.abort?.abort();
    this.abort = null;
    stopSpeaking();
    this.status = "idle";
  }

  /**
   * Primary entry: generate Vivi line from live game snapshot.
   */
  async generate(
    snap: GameSnapshotForLlm,
    onPartial?: (text: string) => void,
  ): Promise<LlmReply> {
    this.cancel();
    this.abort = new AbortController();
    this.partialText = "";
    this.lastError = null;

    if (!isLlmConfigured(this.config)) {
      this.status = "fallback";
      return this.fallback(snap);
    }

    this.status = "streaming";
    try {
      const reply = await chatCompletion(this.config, snap, {
        signal: this.abort.signal,
        onToken: (partial) => {
          this.partialText = partial;
          onPartial?.(partial);
        },
      });
      this.status = "ready";
      dialogueMemory.push({ role: "vivi", text: reply.text, about: snap.zoneId });
      if (snap.playerInput) {
        dialogueMemory.push({ role: "player", text: snap.playerInput });
      }
      void this.maybeSpeak(reply.text, reply.speak !== false);
      return reply;
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
      this.status = "fallback";
      return this.fallback(snap);
    }
  }

  /** Player chose a label — store memory + optional follow-up generate */
  notePlayerChoice(label: string, about?: string) {
    dialogueMemory.push({ role: "player", text: label, about });
  }

  clearMemory() {
    dialogueMemory.clear();
  }

  private async maybeSpeak(text: string, enabled: boolean) {
    if (!enabled || !this.config.tts) return;
    const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
    const ttsUrl = env?.VITE_TTS_API_URL;
    const ttsKey = env?.VITE_TTS_API_KEY;
    if (ttsUrl) {
      const ok = await speakViaRest(text, ttsUrl, ttsKey);
      if (ok) return;
    }
    speakText(text, { lang: this.config.ttsLang, rate: 1.06 });
  }

  /** Scripted fallback keeps game playable offline */
  fallback(snap: GameSnapshotForLlm): LlmReply {
    const speechEvents: SpeechEvent[] = ["enter", "near", "sit", "talk", "cup", "vinyl", "lantern", "all", "high"];
    const candidate = snap.seedNodeId as SpeechEvent | undefined;
    const event: SpeechEvent = candidate && speechEvents.includes(candidate) ? candidate : "talk";
    const line = pickLine(event);

    const choices: LlmChoice[] = [
      { id: "ok", label: "Weiter", effect: "none" },
      { id: "talk", label: "Sprechen", effect: "none" },
    ];
    const reply: LlmReply = {
      speaker: "Vivi",
      text: line,
      expression: "relaxed",
      choices,
      speak: true,
    };
    dialogueMemory.push({ role: "vivi", text: reply.text, about: snap.zoneId });
    void this.maybeSpeak(reply.text, true);
    return reply;
  }
}

/** Singleton interface for the app */
export const dialogueLLM = new DialogueLLM();
