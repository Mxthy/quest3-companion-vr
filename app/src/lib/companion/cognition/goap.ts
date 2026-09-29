/**
 * GOAP layer (Blueprint §1, §12): the utility brain picks WHAT (a goal),
 * the planner figures out HOW (a chain of steps over world facts). Kept as
 * a small forward-chaining planner — no external AI runtime.
 */
import { interactablePos } from "../npc/brain";
import { useCompanion } from "@/lib/companion/store";

export type WorldFacts = {
  /** Whether Vivi believes the lamp is on. */
  lampOn: boolean;
  kettleHasWater: boolean;
  kettleBoiled: boolean;
  hasIngredients: boolean;
  plantWateredToday: boolean;
  day: number;
};

export type PlanStep = {
  actionId: string;
  targetId: string;
  doneLabel: string;
  /** voice-library intent fired when this step completes. */
  voiceIntent?: string;
};

export type Goal = {
  id: string;
  /** brain intent target that maps onto this goal */
  forTargetId: string;
  plan: (f: WorldFacts) => PlanStep[];
};

const GOALS: Goal[] = [
  {
    id: "make_tea",
    forTargetId: "kettle",
    plan: (f) => [
      { actionId: "get_water", targetId: "sink", doneLabel: "holt Wasser" },
      {
        actionId: "boil",
        targetId: "kettle",
        doneLabel: "macht Tee",
        voiceIntent: "MAKE_TEA",
      },
    ],
  },
  {
    id: "cook_meal",
    forTargetId: "stove",
    plan: (f) => [
      {
        actionId: "get_ingredients",
        targetId: "fridge",
        doneLabel: "sucht Zutaten",
        voiceIntent: f.hasIngredients ? undefined : "COOK_MISSING",
      },
      { actionId: "cook", targetId: "stove", doneLabel: "kocht", voiceIntent: "COOK" },
    ],
  },
  {
    id: "water_plant",
    forTargetId: "plant",
    plan: (f) => [
      { actionId: "fill_cup", targetId: "sink", doneLabel: "füllt eine Kanne" },
      {
        actionId: "water",
        targetId: "plant",
        doneLabel: "gießt Nori",
        voiceIntent: "PLANT_CARE",
      },
    ],
  },
];

export const goap = {
  activeGoalId: null as string | null,
  /** Deviation goals interrupt regardless of the current brain intent. */
  isDeviation: false,
  plan: [] as PlanStep[],
  stepIndex: 0,
  facts: {
    lampOn: true,
    kettleHasWater: false,
    kettleBoiled: false,
    hasIngredients: true,
    plantWateredToday: false,
    day: 1,
  } as WorldFacts,
};

export function resetDailyFacts(gameDay: number, gameMinutes: number): void {
  if (goap.facts.day !== gameDay) {
    goap.facts.day = gameDay;
    goap.facts.plantWateredToday = false;
    goap.facts.kettleBoiled = false;
    void gameMinutes;
  }
}

/** Player toggled an object — mirror it into the facts. */
export function noteWorldChange(objectId: string | null): void {
  if (objectId === "lamp") goap.facts.lampOn = !goap.facts.lampOn;
}

/** Routine deviation (Blueprint §15): lamp still on at night → tidy up. */
function deviationGoal(night: boolean): Goal | null {
  if (night && goap.facts.lampOn) {
    return {
      id: "tidy_lamp",
      forTargetId: "lamp",
      plan: () => [
        { actionId: "switch_off", targetId: "lamp", doneLabel: "macht das Licht aus" },
      ],
    };
  }
  return null;
}

export type GoapTick = {
  /** Walk target for this frame (replaces the raw intent target). */
  targetId: string | null;
  /** HUD label for the current step. */
  label: string | null;
  /** Completed step this frame (fire voice / effects), else null. */
  completed: PlanStep | null;
  /** Whole goal finished this frame. */
  goalDone: boolean;
};

const achieved = new Set<string>();

function startGoal(g: Goal, deviation = false): boolean {
  goap.plan = g.plan(goap.facts);
  if (goap.plan.length === 0) return false;
  goap.activeGoalId = g.id;
  goap.isDeviation = deviation;
  goap.stepIndex = 0;
  return true;
}

/**
 * Called each frame between brain and walk layer. `arrived` reports whether
 * Vivi reached the current step target this frame.
 */
export function tickGoap(
  intentTargetId: string | null,
  intentKind: string,
  arrived: boolean,
  night: boolean,
  playing: boolean,
): GoapTick {
  if (!playing) {
    goap.activeGoalId = null;
    goap.plan = [];
    goap.stepIndex = 0;
    return { targetId: null, label: null, completed: null, goalDone: false };
  }

  // Deviation check: no plan running and the world is off-routine.
  if (!goap.activeGoalId) {
    const dev = deviationGoal(night);
    if (dev && startGoal(dev, true)) {
      // fallthrough to step execution below
    } else if (intentTargetId) {
      const g = GOALS.find((x) => x.forTargetId === intentTargetId);
      if (g && !achieved.has(g.id) && startGoal(g)) {
        // goal accepted
      }
    }
  }

  if (!goap.activeGoalId) {
    return { targetId: intentTargetId, label: null, completed: null, goalDone: false };
  }

  const step = goap.plan[goap.stepIndex];
  if (!step) {
    const id = goap.activeGoalId;
    goap.activeGoalId = null;
    goap.isDeviation = false;
    goap.plan = [];
    achieved.add(id ?? "");
    return { targetId: intentTargetId, label: null, completed: null, goalDone: true };
  }

  let completed: PlanStep | null = null;
  if (arrived && (goap.isDeviation || intentKind === "attend" || intentKind === "rest")) {
    completed = step;
    applyEffects(step);
    goap.stepIndex += 1;
    if (goap.stepIndex >= goap.plan.length) {
      const gid = goap.activeGoalId;
      goap.activeGoalId = null;
      goap.isDeviation = false;
      goap.plan = [];
      achieved.add(gid ?? "");
      return { targetId: null, label: step.doneLabel, completed, goalDone: true };
    }
    const next = goap.plan[goap.stepIndex]!;
    return {
      targetId: next.targetId,
      label: next.doneLabel,
      completed,
      goalDone: false,
    };
  }

  return { targetId: step.targetId, label: step.doneLabel, completed: null, goalDone: false };
}

/** Reset the achieved set when the brain moves on to another activity. */
export function clearAchieved(): void {
  achieved.clear();
}

/** Abort the running plan (stuck recovery / interruption). */
export function cancelGoap(): void {
  goap.activeGoalId = null;
  goap.plan = [];
  goap.stepIndex = 0;
}

function applyEffects(step: PlanStep): void {
  switch (step.actionId) {
    case "get_water":
    case "fill_cup":
      goap.facts.kettleHasWater = true;
      break;
    case "boil":
      goap.facts.kettleBoiled = true;
      goap.facts.kettleHasWater = false;
      break;
    case "get_ingredients":
      goap.facts.hasIngredients = false;
      break;
    case "cook":
      goap.facts.hasIngredients = true; // fridge restocked next session
      break;
    case "water":
      goap.facts.plantWateredToday = true;
      break;
    case "switch_off":
      goap.facts.lampOn = false;
      // Real world effect: player-visible room flag.
      const st = useCompanion.getState();
      if (st.used && typeof st.used === "object" && "lantern" in st.used) {
        useCompanion.setState({ used: { ...st.used, lantern: false } as typeof st.used });
      }
      break;
  }
  // Waypoint sanity: target must exist.
  if (step.targetId && !interactablePos(step.targetId)) {
    goap.activeGoalId = null;
    goap.plan = [];
  }
}
