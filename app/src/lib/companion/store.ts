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
import {
  defaultCompanionState,
  syncCompanionFromGame,
  expressionFromMood,
  formatClock,
  isAwakeHour,
  GAME_MINUTES_PER_REAL_SECOND,
  rollPersona,
  type CompanionState,
  type PersonaState,
} from "./personality";
import {
  dialogueLLM,
  isLlmConfigured,
  buildGameSnapFromCompanionStore,
} from "./llm";

export type HeldId = "cup" | "vinyl" | "lantern" | "toy_wand" | null;
export type Phase = "start" | "playing" | "paused";
export type DialogueMode = "scripted" | "llm";

type CompanionStateType = {
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
  /** Ported personality layer (mood, presence, trust, consent scope). */
  companion: CompanionState;
  /** Session-seeded persona brain (disposition + learned region memory). */
  persona: PersonaState;
  /** Game-world clock in minutes (20 real minutes = 24 game hours). */
  gameMinutes: number;
  /** Formatted clock label for HUD ("9:30 AM"). */
  clockLabel: string;
  /** Current facial expression derived from mood. */
  expression: string;
  /** Whether dialogue runs through the LLM or the scripted line pool. */
  dialogueMode: DialogueMode;
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
  /** Advance the game clock by real elapsed seconds (drives mood/schedule). */
  tick: (realSeconds: number) => void;
};

const saved = loadSave();

function persist(partial: Partial<SaveData>) {
  const cur = loadSave();
  writeSave({ ...cur, ...partial, used: partial.used ?? cur.used });
}

function energyFor(gameMinutes: number) {
  return isAwakeHour(gameMinutes) ? 80 : 30;
}

/** Bridge stats until the engine reports live comfort/energy. */
function syncPersonality(
  prev: CompanionState,
  bond: number,
  gameMinutes: number,
): CompanionState {
  return syncCompanionFromGame({
    prev,
    affection: bond,
    comfort: 70,
    energy: energyFor(gameMinutes),
    gameMinutes,
    intimacyTrust: Math.min(10, Math.floor(bond / 10)),
    consent: true,
  });
}

let nearOnce = false;
let speechTimer: number | null = null;

export const useCompanion = create<CompanionStateType>((set, get) => ({
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
  companion: defaultCompanionState(),
  persona: rollPersona(),
  gameMinutes: 8 * 60,
  clockLabel: formatClock(8 * 60),
  expression: "neutral",
  dialogueMode: isLlmConfigured(dialogueLLM.config) ? "llm" : "scripted",

  enter: () => {
    unlockAudio();
    setMuted(get().muted);
    const visits = get().visits + 1;
    // Fresh persona roll per session — she is a person-instance, not a script.
    const persona = rollPersona();
    const companion = syncPersonality(
      defaultCompanionState(),
      get().bond,
      get().gameMinutes,
    );
    set({
      phase: "playing",
      visits,
      seated: false,
      held: null,
      persona,
      companion,
      expression: expressionFromMood(get().bond, 70, energyFor(get().gameMinutes)),
    });
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
    // LLM upgrade layer: when configured, Vivi composes freely with
    // persona/mood context; the module falls back to pickLine internally.
    if (get().dialogueMode === "llm") {
      const snap = buildGameSnapFromCompanionStore(get(), {
        seedNodeId: event,
        consent: true,
      });
      void dialogueLLM.generate(snap, (partial) => {
        if (partial) get().speakLine(partial);
      }).then((reply) => {
        get().speakLine(reply.text);
      });
      return;
    }
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
    const gameMinutes = get().gameMinutes;
    set({
      bond,
      companion: syncPersonality(get().companion, bond, gameMinutes),
      expression: expressionFromMood(bond, 70, energyFor(gameMinutes)),
    });
    persist({
      bond,
      used: get().used,
      visits: get().visits,
      muted: get().muted,
    });
  },

  tick: (realSeconds) => {
    if (get().phase !== "playing") return;
    const gameMinutes =
      (get().gameMinutes + realSeconds * GAME_MINUTES_PER_REAL_SECOND) % 1440;
    set({
      gameMinutes,
      clockLabel: formatClock(gameMinutes),
      companion: syncPersonality(get().companion, get().bond, gameMinutes),
      expression: expressionFromMood(get().bond, 70, energyFor(gameMinutes)),
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

export function promptFor(s: CompanionStateType): string {
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
