/**
 * Voice line selection (Blueprint §16): State + Context + Interaction + Mood
 * → candidate lines. Gated by relationship, consent, per-clip cooldown and
 * anti-repetition so the library doesn't become audible.
 */
import { VOICE_CLIPS } from "@/data/vivi-voice-generated";
import type { VoiceClip, VoiceQuery } from "./schema";

const byIntent = new Map<string, VoiceClip[]>();
const lastPlayed = new Map<string, number>();
const recentByIntent = new Map<string, string[]>();
let bootAt = -1e12;

for (const c of VOICE_CLIPS) {
  const list = byIntent.get(c.intent);
  if (list) list.push(c);
  else byIntent.set(c.intent, [c]);
}

export function voiceIntentCount(): number {
  return byIntent.size;
}

export function selectVoiceLine(q: VoiceQuery): VoiceClip | null {
  const pool = byIntent.get(q.intent);
  if (!pool || pool.length === 0) return null;
  const now = performance.now();
  if (bootAt === -1e12) bootAt = now;

  const rec = recentByIntent.get(q.intent) ?? [];
  const cands = pool.filter((c) => {
    if (q.relationship < c.relationshipMin) return false;
    if (c.requiresConsent && !q.consent) return false;
    if (q.requireObject && (c.requiredObject ?? null) !== (q.object ?? null)) return false;
    if (q.interaction != null && c.interaction != null && c.interaction !== q.interaction)
      return false;
    if (q.maxIntensity != null && c.intensity != null && c.intensity > q.maxIntensity)
      return false;
    if (now - (lastPlayed.get(c.id) ?? bootAt) < c.cooldownSec * 1000) return false;
    return true;
  });

  // Anti-repetition: prefer clips not heard recently for this intent.
  const fresh = cands.filter((c) => !rec.includes(c.id));
  const usable = fresh.length > 0 ? fresh : cands;
  if (usable.length === 0) return null;

  const topPrio = Math.max(...usable.map((c) => c.priority));
  const top = usable.filter((c) => c.priority === topPrio);
  const pick = top[Math.floor(Math.random() * top.length)]!;

  lastPlayed.set(pick.id, now);
  recentByIntent.set(q.intent, [pick.id, ...rec].slice(0, 3));
  return pick;
}

/** Mark a fallback clip as played (so its own cooldown engages). */
export function markVoicePlayed(clip: VoiceClip): void {
  lastPlayed.set(clip.id, performance.now());
}

export function findVoiceClipById(id: string): VoiceClip | null {
  return VOICE_CLIPS.find((c) => c.id === id) ?? null;
}
