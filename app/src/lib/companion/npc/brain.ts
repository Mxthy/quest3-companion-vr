/**
 * NPC Brain (Blueprint §4/§5/§9): intent-based utility brain. It never
 * touches animation directly — it only produces an Intent, the render layer
 * translates it (AI Decision → Intent → Action → Animation).
 */
import { interactables } from "@/data/interactables";
import { emitNpc, onNpc, type NpcEvent } from "./events";
import { initialNeeds, tickNeeds, type Needs, type NeedMode } from "./needs";
import { TRAITS } from "@/lib/companion/cognition/traits";
import type { Perception } from "./perception";

export type IntentKind = "sleep" | "rest" | "attend" | "observe_player" | "idle";

export type Intent = {
  kind: IntentKind;
  targetId: string | null;
  label: string;
};

/** Hour-relevant object pools — makes activities match the day (Blueprint §12). */
const POOLS: Array<{ from: number; to: number; ids: string[] }> = [
  { from: 6, to: 10, ids: ["kettle", "sink", "fridge", "stove", "window"] },
  { from: 10, to: 14, ids: ["stove", "fridge", "kitchen_counter", "bookshelf", "radio"] },
  { from: 14, to: 18, ids: ["bookshelf", "window", "laptop", "radio", "plant", "mirror"] },
  { from: 18, to: 22, ids: ["tv", "couch", "cushion", "radio", "photo_frame"] },
  { from: 22, to: 6, ids: ["window", "bookshelf", "bed"] },
];

const ACTIVITY_LABEL: Record<string, string> = {
  kettle: "kocht Tee",
  sink: "spült ab",
  fridge: "stöbert im Kühlschrank",
  stove: "kocht",
  kitchen_counter: "räumt die Küche",
  bookshelf: "liest",
  window: "schaut aus dem Fenster",
  laptop: "tippt am Laptop",
  radio: "hört Radio",
  plant: "gießt die Pflanze",
  mirror: "richtet sich im Spiegel",
  tv: "schaat Fernsehen",
  couch: "räkelt sich aufs Sofa",
  cushion: "macht es sich bequem",
  photo_frame: "schaut Fotos an",
  bed: "ruht",
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function poolForHour(hour: number): string[] {
  for (const p of POOLS) {
    if (p.from <= p.to ? hour >= p.from && hour < p.to : hour >= p.from || hour < p.to) {
      return p.ids;
    }
  }
  return POOLS[2]!.ids;
}

export class NpcBrain {
  readonly needs: Needs = initialNeeds();
  intent: Intent = { kind: "idle", targetId: null, label: "steht da und schaut umher" };
  private holdUntil = 0;
  private recentTargets: string[] = [];
  private detach: (() => void) | null = null;

  constructor() {
    this.detach = onNpc((e) => this.onEvent(e));
  }

  dispose(): void {
    this.detach?.();
  }

  onEvent(e: NpcEvent): void {
    if (e === "player_entered" || e === "player_talked") {
      this.needs.social = clamp01(this.needs.social + 0.25);
      this.holdUntil = 0; // re-decide soon: greet/observe the player
    }
    if (e === "player_touched") {
      this.needs.boredom = clamp01(this.needs.boredom - 0.1);
      this.holdUntil = 0;
    }
    if (e === "object_used") this.needs.boredom = clamp01(this.needs.boredom - 0.15);
  }

  /** Called every frame; internally re-evaluates at ~0.5 Hz with hysteresis. */
  tick(dt: number, p: Perception): Intent {
    const mode: NeedMode =
      this.intent.kind === "sleep"
        ? "sleep"
        : this.intent.kind === "rest"
          ? "rest"
          : this.intent.kind === "attend"
            ? "active"
            : "idle";
    tickNeeds(this.needs, dt, p, mode);
    const now = performance.now();
    if (now < this.holdUntil) return this.intent;
    this.intent = this.decide(p);
    // Hold durations keep decisions from flickering (Blueprint §12).
    const holdMs: Record<IntentKind, number> = {
      sleep: 60_000,
      rest: 30_000 + Math.random() * 25_000,
      attend: 14_000 + Math.random() * 16_000,
      observe_player: 8_000 + Math.random() * 8_000,
      idle: 10_000 + Math.random() * 12_000,
    };
    this.holdUntil = now + holdMs[this.intent.kind];
    return this.intent;
  }

  private decide(p: Perception): Intent {
    const candidates: Array<{ score: number; intent: Intent }> = [];

    if (!p.awake) {
      candidates.push({
        score: 5,
        intent: { kind: "sleep", targetId: "bed", label: ACTIVITY_LABEL.bed! },
      });
    } else {
      // Personality reshapes the utility landscape (cognition traits).
      const social = TRAITS.sociability;
      const curious = TRAITS.curiosity;
      const independent = TRAITS.independence;
      const jitter = TRAITS.impulsiveness * 0.12;
      candidates.push({
        score: (0.4 + Math.random() * 0.1 + jitter * 0.5) * (0.85 + independent * 0.3),
        intent: { kind: "idle", targetId: null, label: "steht da und schaut umher" },
      });
      if (this.needs.energy < 0.35) {
        const restId = pick(["couch", "cushion"]);
        candidates.push({
          score: 1.2 + (0.35 - this.needs.energy),
          intent: { kind: "rest", targetId: restId, label: ACTIVITY_LABEL[restId]! },
        });
      }

      const pool = poolForHour(p.hour).filter((id) => !this.recentTargets.includes(id));
      const attendId = pool.length ? pick(pool) : pick(poolForHour(p.hour));
      candidates.push({
        score: (0.3 + this.needs.boredom * 0.9 + Math.random() * 0.15) * (0.8 + curious * 0.4),
        intent: {
          kind: "attend",
          targetId: attendId,
          label: ACTIVITY_LABEL[attendId] ?? "beschäftigt sich",
        },
      });

      if (this.needs.hunger > 0.75) {
        candidates.push({
          score: 0.8 + this.needs.hunger * 0.3,
          intent: { kind: "attend", targetId: "fridge", label: ACTIVITY_LABEL.fridge! },
        });
      }

      if (p.playerNear || p.playerTalking || p.playerDistance < 3.5) {
        candidates.push({
          score:
            ((1 - this.needs.social) * 0.9 +
              (p.playerTalking ? 0.8 : 0) +
              (p.playerNear ? 0.3 : 0)) *
            (0.7 + social * 0.6),
          intent: { kind: "observe_player", targetId: null, label: "schaut dich an" },
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const winner = candidates[0]!.intent;
    if (winner.targetId) {
      this.recentTargets = [winner.targetId, ...this.recentTargets].slice(0, 3);
    }
    return winner;
  }
}

/** Shared idle intent used whenever the game is not in the playing phase. */
export const IDLE_INTENT: Intent = {
  kind: "idle",
  targetId: null,
  label: "steht da und schaut umher",
};

/** Look up an interactable's world position by id (waypoint source). */
export function interactablePos(id: string): { x: number; z: number } | null {
  const it = interactables.find((i) => i.id === id);
  return it ? { x: it.position[0], z: it.position[2] } : null;
}
