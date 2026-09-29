/**
 * Memory (Blueprint §4): three tiers — working (current situation, owned by
 * attention/intent), episodic ("what happened, when, where, how it felt")
 * and semantic (learned facts about the player and the world).
 */
export type EpisodicMemory = {
  id: number;
  at: number; // wall-clock ms
  gameMinutes: number;
  kind: string;
  place: string;
  text: string;
  emotionalWeight: number;
};

export type SemanticFact = {
  key: string;
  value: number; // 0..1 strength
  text: string;
  updatedAt: number;
};

const EPISODIC_CAP = 40;
let nextEpisodicId = 1;

export const episodic: EpisodicMemory[] = [];
export const semantic = new Map<string, SemanticFact>();

export type EpisodicOptions = {
  place?: string;
  emotionalWeight?: number;
  gameMinutes?: number;
};

export function recordEpisodic(kind: string, text: string, opts: EpisodicOptions = {}): EpisodicMemory {
  const m: EpisodicMemory = {
    id: nextEpisodicId++,
    at: Date.now(),
    gameMinutes: opts.gameMinutes ?? 0,
    kind,
    place: opts.place ?? "apartment",
    text,
    emotionalWeight: opts.emotionalWeight ?? 0.2,
  };
  episodic.push(m);
  if (episodic.length > EPISODIC_CAP) episodic.shift();
  return m;
}

export function strengthenSemantic(key: string, delta: number, text: string): void {
  const cur = semantic.get(key);
  const v = Math.min(1, (cur?.value ?? 0) + delta);
  semantic.set(key, { key, value: v, text, updatedAt: Date.now() });
}

export function semanticFact(key: string): SemanticFact | undefined {
  return semantic.get(key);
}

/** The n most recent episodes (for recall / LLM context). */
export function recallRecent(n = 5): EpisodicMemory[] {
  return episodic.slice(-n);
}

/** The n emotionally most significant recent episodes. */
export function recallEmotional(n = 5): EpisodicMemory[] {
  return [...episodic]
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight)
    .slice(0, n);
}

/** Compact context string for the LLM dialogue layer / debugging. */
export function memoryContext(): string {
  const recent = recallRecent(4).map((e) => `- ${e.text}`);
  const hot = recallEmotional(3).map((e) => `- ${e.text}`);
  const facts = [...semantic.values()]
    .filter((f) => f.value > 0.4)
    .map((f) => f.text);
  const parts: string[] = [];
  if (recent.length) parts.push("Zuletzt passiert:\n" + recent.join("\n"));
  if (hot.length) parts.push("Bedeutsame Momente:\n" + hot.join("\n"));
  if (facts.length) parts.push("Was Vivi über dich weiß:\n" + facts.join("\n"));
  return parts.join("\n\n");
}
