import type { LlmClientConfig, LlmReply } from "./types";
import { contextToMessages, type GameSnapshotForLlm, buildLlmContext } from "./context-builder";
import { viviChat } from "./vivi-chat";

export function parseReplyJson(content: string): LlmReply {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  try {
    const j = JSON.parse(slice) as {
      text?: string;
      expression?: string;
      choices?: LlmReply["choices"];
      effects?: LlmReply["effects"];
      speak?: boolean;
    };
    return {
      speaker: "Vivi",
      text: j.text?.trim() || trimmed.slice(0, 280),
      expression: j.expression,
      choices: j.choices?.slice(0, 3),
      effects: j.effects,
      speak: j.speak !== false,
      raw: j,
    };
  } catch {
    return {
      speaker: "Vivi",
      text: trimmed.slice(0, 280) || "…",
      expression: "neutral",
      choices: [
        { id: "ok", label: "Continue", effect: "none" },
        { id: "talk", label: "Talk more", effect: "none" },
      ],
      speak: true,
    };
  }
}

export type StreamHandlers = {
  onToken?: (partial: string) => void;
  signal?: AbortSignal;
};

/**
 * Grok chat via client-side viviChat function. Fallbacks are handled by DialogueLLM.
 */
export async function chatCompletion(
  config: LlmClientConfig,
  snap: GameSnapshotForLlm,
  handlers?: StreamHandlers,
): Promise<LlmReply> {
  const ctx = buildLlmContext(snap);
  const messages = contextToMessages(ctx, config.voiceStyle);

  const result = await viviChat({
    data: {
      messages,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      model: config.model,
    },
  });

  if (handlers?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!result.ok) {
    throw new Error(result.error);
  }
  handlers?.onToken?.(result.text);
  return parseReplyJson(result.text);
}

export function isLlmConfigured(config: LlmClientConfig): boolean {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const apiKey = config.apiKey || env?.VITE_LLM_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}
