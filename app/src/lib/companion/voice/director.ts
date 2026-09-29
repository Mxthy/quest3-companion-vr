/**
 * Voice director: connects world events and touch interactions to the voice
 * library (AUTHORED LINES layer — the LLM remains the high-level dialogue
 * layer and never controls this playback path directly).
 */
import { useCompanion } from "@/lib/companion/store";
import { onNpc } from "@/lib/companion/npc/events";
import { selectVoiceLine } from "./library";
import { playVoiceClip } from "./playback";
import type { VoiceClip, VoiceQuery } from "./schema";

/** Adult touch zone → clip interaction family. */
const ZONE_INTERACTION: Record<string, string> = {
  head: "HEAD",
  mouth: "HEAD",
  breast_l: "CHEST",
  breast_r: "CHEST",
  hand_l: "HAND",
  hand_r: "HAND",
  waist: "BODY",
  hip_l: "BODY",
  hip_r: "BODY",
  glute_l: "BODY",
  glute_r: "BODY",
  thigh_l: "INTIMATE",
  thigh_r: "INTIMATE",
  groin: "INTIMATE",
};

/** Activity object → clip intent. */
const OBJECT_INTENT: Record<string, string> = {
  couch: "REST_COUCH",
  cushion: "REST_COUCH",
  kettle: "MAKE_TEA",
  stove: "COOK",
  fridge: "COOK_MISSING",
  bookshelf: "SHELF_TALK",
  window: "WINDOW_TALK",
  plant: "PLANT_CARE",
  tv: "WATCH_TV",
  laptop: "LAPTOP_TALK",
  mirror: "MIRROR_TALK",
  photo_frame: "PHOTO_TALK",
  wardrobe: "WARDROBE_TALK",
  bed: "BED_TALK",
  nightstand: "DIARY_TALK",
  kitchen_counter: "FLIRT",
  coffee_table: "PHOTO_TALK",
};

let voiceBusyUntil = 0;
let initialized = false;

function relationshipLevel(): number {
  return useCompanion.getState().companion.trust / 20;
}

function consentActive(): boolean {
  return useCompanion.getState().companion.consentScope.length > 0;
}

/** Speak a voice clip with caption synced to the audio duration. */
export function speakWithVoice(q: VoiceQuery): boolean {
  const now = performance.now();
  if (now < voiceBusyUntil) return false;
  const line = selectVoiceLine(q);
  if (!line) return false;
  void deliverVoiceLine(line);
  return true;
}

async function deliverVoiceLine(line: VoiceClip): Promise<void> {
  const played = await playVoiceClip(line);
  if (!played.ok) return;
  const st = useCompanion.getState();
  st.speakLine(line.text, Math.max(2500, (played.durationSec + 0.7) * 1000));
  voiceBusyUntil = performance.now() + played.durationSec * 1000 + 1200;
}

/** Adult-runtime hook: a touch zone was entered. */
export function tryZoneVoice(zoneId: string): boolean {
  const interaction = ZONE_INTERACTION[zoneId];
  if (!interaction) return false;
  const rel = relationshipLevel();
  // Intensity cap grows with the relationship — early visits stay soft.
  const cap = 0.25 + Math.min(1, rel) * 0.16;
  return speakWithVoice({
    intent: "RESPOND_TO_TOUCH",
    interaction,
    relationship: rel,
    consent: consentActive(),
    maxIntensity: cap,
  });
}

/** GOAP step hook: fire a voice intent without an object binding. */
export function tryIntentVoice(intent: string): boolean {
  return speakWithVoice({
    intent,
    relationship: relationshipLevel(),
    consent: consentActive(),
  });
}

/** NPC brain hook: she started attending an object (or rests at it). */
export function tryActivityVoice(targetId: string | null): boolean {
  if (!targetId) return false;
  const intent = OBJECT_INTENT[targetId];
  if (!intent) return false;
  return speakWithVoice({
    intent,
    relationship: relationshipLevel(),
    consent: consentActive(),
    object: targetId,
    requireObject: true,
  });
}

/** Greeting by time of day, fired from the player_entered event. */
function greetingIntent(): string | null {
  const st = useCompanion.getState();
  const h = Math.floor(st.gameMinutes / 60) % 24;
  if (h < 5) return "GREET_NIGHT";
  if (h < 11) return "GREET_MORNING";
  if (h < 22) return "GREET_EVENING";
  return "GREET_NIGHT";
}

/** Idempotent init — subscribes to world events. */
export function initVoiceDirector(): void {
  if (initialized) return;
  initialized = true;
  onNpc((e) => {
    if (e === "player_entered") {
      const intent = greetingIntent();
      if (!intent) return;
      window.setTimeout(() => {
        speakWithVoice({
          intent,
          relationship: relationshipLevel(),
          consent: consentActive(),
        });
      }, 1400);
    }
  });
}
