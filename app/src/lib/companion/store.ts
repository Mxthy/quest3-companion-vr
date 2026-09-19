import { create } from "zustand";
import { loadSave, writeSave, type SaveData } from "./save";
import { pickLine, talkEvent, type SpeechEvent } from "./dialogue";
import { ADULT_LINES, pickAdultLine } from "./adult";
import {
  playPickup,
  playPlace,
  playSoft,
  setMuted,
  speakTone,
  startRecord,
  unlockAudio,
} from "./audio";

export type HeldId = "cup" | "vinyl" | "lantern" | "toy_wand" | null;
export type Phase = "start" | "playing" | "paused";

type CompanionState = {
  phase: Phase;
  bond: number;
  used: SaveData["used"];
  visits: number;
  muted: boolean;
  held: HeldId;
  lookId: string | null;
  seated: boolean;
  nearElara: boolean;
  speech: string | null;
  prompt: string;
  musicOn: boolean;
  lanternLit: boolean;
  enter: () => void;
  pause: () => void;
  resume: () => void;
  leave: () => void;
  toggleMute: () => void;
  setLook: (id: string | null) => void;
  setNear: (near: boolean) => void;
  sit: () => void;
  stand: () => void;
  interact: () => void;
  speak: (event: SpeechEvent) => void;
  speakLine: (line: string) => void;
  addBond: (n: number) => void;
};

const saved = loadSave();

function persist(partial: Partial<SaveData>) {
  const cur = loadSave();
  writeSave({ ...cur, ...partial, used: partial.used ?? cur.used });
}

let nearOnce = false;
let speechTimer: number | null = null;

export const useCompanion = create<CompanionState>((set, get) => ({
  phase: "start",
  bond: saved.bond,
  used: saved.used,
  visits: saved.visits,
  muted: saved.muted,
  held: null,
  lookId: null,
  seated: false,
  nearElara: false,
  speech: null,
  prompt: "",
  musicOn: saved.used.vinyl,
  lanternLit: saved.used.lantern,

  enter: () => {
    unlockAudio();
    setMuted(get().muted);
    const visits = get().visits + 1;
    set({ phase: "playing", visits, seated: false, held: null });
    persist({ visits, bond: get().bond, used: get().used, muted: get().muted });
    get().speak("enter");
    nearOnce = false;
  },

  pause: () => {
    if (get().phase !== "playing") return;
    set({ phase: "paused" });
  },

  resume: () => {
    if (get().phase !== "paused") return;
    unlockAudio();
    set({ phase: "playing" });
  },

  leave: () => {
    persist({
      bond: get().bond,
      used: get().used,
      visits: get().visits,
      muted: get().muted,
    });
    set({
      phase: "start",
      seated: false,
      held: null,
      speech: null,
      prompt: "",
    });
  },

  toggleMute: () => {
    const muted = !get().muted;
    setMuted(muted);
    set({ muted });
    persist({
      muted,
      bond: get().bond,
      used: get().used,
      visits: get().visits,
    });
  },

  setLook: (id) => {
    if (get().lookId === id) return;
    set({ lookId: id });
  },

  setNear: (near) => {
    if (get().nearElara === near) return;
    set({ nearElara: near });
    if (near && !nearOnce && get().phase === "playing") {
      nearOnce = true;
      get().speak("near");
      get().addBond(3);
    }
  },

  sit: () => {
    if (get().seated) return;
    set({ seated: true });
    get().speak("sit");
    get().addBond(6);
    playSoft();
  },

  stand: () => {
    if (!get().seated) return;
    set({ seated: false });
  },

  speakLine: (line) => {
    if (speechTimer != null) window.clearTimeout(speechTimer);
    set({ speech: line });
    speechTimer = window.setTimeout(() => {
      set({ speech: null });
    }, 6200);
  },

  speak: (event) => {
    const line = pickLine(event);
    if (speechTimer != null) window.clearTimeout(speechTimer);
    set({ speech: line });
    speakTone();
    speechTimer = window.setTimeout(() => {
      set({ speech: null });
    }, 6200);
  },

  addBond: (n) => {
    const bond = Math.max(0, Math.min(100, get().bond + n));
    set({ bond });
    persist({
      bond,
      used: get().used,
      visits: get().visits,
      muted: get().muted,
    });
  },

  interact: () => {
    const s = get();
    if (s.phase !== "playing") return;
    const look = s.lookId;

    if (s.seated && (look === "chair" || look == null || look === "elara")) {
      if (look === "elara" || look == null) {
        s.speak(talkEvent(s.bond, Number(s.used.cup) + Number(s.used.vinyl) + Number(s.used.lantern)));
        s.addBond(2);
        return;
      }
    }

    if (s.held) {
      if (s.held === "cup" && (look === "elara" || s.nearElara)) {
        const used = { ...s.used, cup: true };
        set({ held: null, used });
        persist({ used, bond: s.bond, visits: s.visits, muted: s.muted });
        playPlace();
        s.speak("cup");
        s.addBond(18);
        return;
      }
      if (s.held === "vinyl" && (look === "player" || look === "vinyl")) {
        const used = { ...s.used, vinyl: true };
        set({ held: null, used, musicOn: true });
        persist({ used, bond: s.bond, visits: s.visits, muted: s.muted });
        startRecord();
        playPlace();
        s.speak("vinyl");
        s.addBond(16);
        return;
      }
      if (s.held === "lantern" && (look === "table" || look === "lantern")) {
        const used = { ...s.used, lantern: true };
        set({ held: null, used, lanternLit: true });
        persist({ used, bond: s.bond, visits: s.visits, muted: s.muted });
        playPlace();
        s.speak("lantern");
        s.addBond(12);
        return;
      }
      // drop
      set({ held: null });
      playSoft();
      return;
    }

    if (look === "cup" && !s.used.cup) {
      set({ held: "cup" });
      playPickup();
      return;
    }
    if (look === "vinyl" && !s.used.vinyl) {
      set({ held: "vinyl" });
      playPickup();
      return;
    }
    if (look === "lantern" && !s.used.lantern) {
      set({ held: "lantern" });
      playPickup();
      return;
    }
    if (look === "toy_wand" && !s.held) {
      set({ held: "toy_wand" });
      playPickup();
      s.speakLine(pickAdultLine("toy_grab", ADULT_LINES.toy_grab));
      return;
    }
    if (look === "chair" || look === "elara") {
      if (!s.seated && s.nearElara) {
        s.sit();
        return;
      }
      s.speak(talkEvent(s.bond, Number(s.used.cup) + Number(s.used.vinyl) + Number(s.used.lantern)));
      s.addBond(2);
      return;
    }
  },
}));

export function promptFor(s: CompanionState): string {
  if (s.phase !== "playing") return "";
  if (s.held === "cup") return s.nearElara ? "E · Tasse reichen" : "E · Ablegen";
  if (s.held === "vinyl") return s.lookId === "player" ? "E · Auflegen" : "Zur Konsole gehen";
  if (s.held === "lantern") return s.lookId === "table" ? "E · Auf den Tisch" : "Zum Tisch gehen";
  if (s.held === "toy_wand") return "E · Weglegen · G halten · F intensiv · Q Klaps";
  if (s.lookId === "cup" && !s.used.cup) return "E · Tasse nehmen";
  if (s.lookId === "vinyl" && !s.used.vinyl) return "E · Platte nehmen";
  if (s.lookId === "lantern" && !s.used.lantern) return "E · Laterne nehmen";
  if (s.lookId === "chair" && !s.seated) return "E · Setzen";
  if (s.lookId === "elara") {
    if (s.seated) return "E · Sprechen";
    if (s.nearElara) return "E · Setzen";
    return "";
  }
  if (s.seated) return "E · Sprechen · WASD aufstehen";
  return "";
}
