/**
 * MicroBehavior controller (Blueprint §10-11): small constant actions that
 * make the companion feel alive. Selection is weighted by personality,
 * emotion, energy, boredom and attention — combinations never hard-coded.
 */
import type { Traits } from "./traits";
import type { EmotionVector } from "./emotion";
import type { AttentionFocus } from "./attention";

export type MicroAction =
  | "look_around"
  | "look_player"
  | "look_away"
  | "shift_weight"
  | "adjust_posture"
  | "adjust_hair"
  | "stretch"
  | "yawn"
  | "fidget"
  | "sigh"
  | "inspect_object";

export type ActiveMicro = {
  action: MicroAction;
  startedAt: number;
  durationSec: number;
};

export const microState: { active: ActiveMicro | null } = { active: null };

const DURATIONS: Record<MicroAction, [number, number]> = {
  look_around: [1.2, 2.4],
  look_player: [1.0, 2.0],
  look_away: [0.8, 1.6],
  shift_weight: [1.5, 2.8],
  adjust_posture: [1.4, 2.2],
  adjust_hair: [1.6, 2.6],
  stretch: [2.0, 3.2],
  yawn: [1.8, 2.8],
  fidget: [1.2, 2.4],
  sigh: [1.4, 2.2],
  inspect_object: [1.8, 3.0],
};

const cooldowns = new Map<MicroAction, number>();

export type MicroContext = {
  traits: Traits;
  emotions: EmotionVector;
  energy: number; // needs.energy 0..1
  boredom: number; // 0..1
  attention: AttentionFocus;
  playerNear: boolean;
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/** Weights: state × personality × emotion → candidate micro actions. */
function weights(ctx: MicroContext): Array<[MicroAction, number]> {
  const w: Array<[MicroAction, number]> = [];
  const e = ctx.energy;
  const b = ctx.boredom;
  const t = ctx.traits;

  if (ctx.playerNear) w.push(["look_player", 0.5 + t.sociability * 0.5]);
  w.push(["look_around", 0.2 + t.curiosity * 0.4 + b * 0.5]);
  w.push(["look_away", 0.15 + b * 0.2]);
  w.push(["shift_weight", 0.25 + b * 0.3]);
  w.push(["adjust_posture", 0.12]);
  w.push(["adjust_hair", 0.15 + t.playfulness * 0.2]);
  w.push(["fidget", 0.1 + t.playfulness * 0.4 + b * 0.4]);
  w.push(["sigh", ctx.emotions.frustration * 1.2 + (1 - e) * 0.3]);
  w.push(["yawn", (1 - e) * 1.5]);
  w.push(["stretch", (1 - e) * 0.8]);
  if (ctx.attention.kind === "object" && ctx.attention.objectId) {
    w.push(["inspect_object", 0.4 + t.curiosity * 0.4]);
  }
  return w;
}

export function tickMicro(dt: number, ctx: MicroContext): void {
  const now = performance.now();
  const a = microState.active;
  if (a) {
    if (now - a.startedAt > a.durationSec * 1000) microState.active = null;
    return;
  }

  // Base chance per second — roughly one micro action every 4–9 s.
  const base = 1 / (9 - ctx.traits.impulsiveness * 4);
  if (Math.random() > base * dt) return;

  const now2 = performance.now();
  const candidates = weights(ctx).filter(([act]) => {
    const until = cooldowns.get(act) ?? 0;
    return now2 >= until;
  });
  if (candidates.length === 0) return;

  const total = candidates.reduce((s, [, wt]) => s + wt, 0);
  let r = Math.random() * total;
  let chosen = candidates[0]!;
  for (const c of candidates) {
    r -= c[1];
    if (r <= 0) {
      chosen = c;
      break;
    }
  }
  const [lo, hi] = DURATIONS[chosen[0]];
  microState.active = {
    action: chosen[0],
    startedAt: now2,
    durationSec: rnd(lo, hi),
  };
  // Cooldown: don't repeat the same mannerism too soon.
  cooldowns.set(chosen[0], now2 + 6000 + Math.random() * 8000);

  // Impulsiveness occasionally stacks a second action immediately.
  if (ctx.traits.impulsiveness > 0.7 && Math.random() < 0.3) {
    cooldowns.set(chosen[0], now2 + 12000);
  }
}

/** 0..1 progress envelope for smooth in/out during execution. */
export function microEnvelope(a: ActiveMicro): number {
  const el = (performance.now() - a.startedAt) / (a.durationSec * 1000);
  const x = Math.min(1, Math.max(0, el));
  return Math.sin(x * Math.PI); // smooth rise & fall
}
