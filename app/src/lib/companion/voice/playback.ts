/**
 * Spatial voice playback: decoded-buffer cache routed through the apartment
 * audio graph at Vivi's head position (Zevra-KB: positional sources need
 * per-frame positions — vivi_head is already updated by the render layer).
 */
import { playVoiceClipAtHead } from "@/lib/companion/apartment";
import type { VoiceClip } from "./schema";

export type VoicePlayback = {
  ok: boolean;
  durationSec: number;
};

export async function playVoiceClip(clip: VoiceClip, volume = 0.95): Promise<VoicePlayback> {
  const r = await playVoiceClipAtHead(`/audio/vivi/${clip.file}`, volume);
  return { ok: r.ok, durationSec: r.durationSec };
}
