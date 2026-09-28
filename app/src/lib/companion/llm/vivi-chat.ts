export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ViviChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type ViviChatInput = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
};

/**
 * Client-side xAI / OpenAI-compatible chat completion function for Vivi.
 * Reads configuration from Vite env (import.meta.env) with optional runtime overrides.
 * User-initiated from the Live talk panel; capped tokens.
 */
export async function viviChat(req: { data: ViviChatInput }): Promise<ViviChatResult> {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const apiKey = req.data.apiKey || env?.VITE_LLM_API_KEY;
  const apiUrl = req.data.apiUrl || env?.VITE_LLM_API_URL || "https://api.x.ai/v1/chat/completions";
  const model = req.data.model || env?.VITE_LLM_MODEL || "grok-4.5";

  if (!apiKey) {
    return { ok: false, error: "AI is not available in this environment (missing VITE_LLM_API_KEY)" };
  }

  const messages = req.data.messages.slice(0, 8);
  const maxTokens = Math.min(Math.max(req.data.maxTokens ?? 180, 40), 220);
  const temperature = Math.min(Math.max(req.data.temperature ?? 0.85, 0.2), 1.1);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { ok: false, error: `xAI ${res.status}: ${errText.slice(0, 160)}` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    return { ok: true, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 160) };
  } finally {
    clearTimeout(timer);
  }
}
