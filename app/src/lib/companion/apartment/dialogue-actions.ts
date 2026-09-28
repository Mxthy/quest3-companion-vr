/**
 * Shared dialogue side-effects. DOM HUD and VR world-space UI both call this.
 * Does not duplicate node data — only applies grants / intimacy / navigation.
 */
import { dialogues, type DialogueNode } from "@/data/dialogues";

export type IntimacyPace = "slow" | "medium" | "exploratory";
export type IntimacyRegion = "soft_torso" | "close" | "full";

export type ApartmentGameStats = {
  bond: number;
  affection: number;
  comfort: number;
  consent: boolean;
  intimacyPace: IntimacyPace;
  openRegions: Set<IntimacyRegion> | IntimacyRegion[];
  tutorialGranted?: boolean;
  day?: number;
  dialogueId?: string | null;
  used?: Record<string, boolean>;
};

export function createDefaultApartmentStats(): ApartmentGameStats {
  return {
    bond: 0,
    affection: 0,
    comfort: 50,
    consent: false,
    intimacyPace: "slow",
    openRegions: new Set<IntimacyRegion>(),
    tutorialGranted: false,
    day: 1,
    dialogueId: null,
    used: {},
  };
}

export type DialogueActionEvent =
  | { type: "SET_CONSENT"; consent: boolean }
  | { type: "SET_INTIMACY_PACE"; pace: IntimacyPace }
  | { type: "OPEN_INTIMACY_REGION"; region: IntimacyRegion }
  | { type: "RESPECT_INTIMACY_BOUNDARY" }
  | { type: "NOTE_SHARED_INTIMACY" }
  | { type: "GRANT_TUTORIAL" }
  | { type: "SLEEP_TO_NEXT_DAY" }
  | { type: "ADD_STATS"; affection?: number; comfort?: number }
  | { type: "SET_DIALOGUE"; dialogueId: string | null };

export type DialogueResult = {
  stats: ApartmentGameStats;
  events: DialogueActionEvent[];
};

const entered = new Set<string>();

export function resetVisitedNodes() {
  entered.clear();
}

export function getDialogueNode(id: string | null): DialogueNode | null {
  if (!id) return null;
  return dialogues.nodes[id] ?? null;
}

export function applyIntimacyEffects(
  nodeId: string,
  choiceId?: string,
  stats: ApartmentGameStats = createDefaultApartmentStats()
): DialogueResult {
  let consent = stats.consent;
  let intimacyPace = stats.intimacyPace;
  const openRegions = new Set<IntimacyRegion>(
    Array.isArray(stats.openRegions) ? stats.openRegions : Array.from(stats.openRegions)
  );
  const events: DialogueActionEvent[] = [];

  if (
    nodeId === "consent_yes" ||
    nodeId === "negotiate_soft_yes" ||
    nodeId === "negotiate_region_torso" ||
    choiceId === "yes"
  ) {
    consent = true;
    events.push({ type: "SET_CONSENT", consent: true });
  }

  if (nodeId === "negotiate_pace_slow" || choiceId === "slow") {
    intimacyPace = "slow";
    events.push({ type: "SET_INTIMACY_PACE", pace: "slow" });
  }
  if (nodeId === "negotiate_pace_medium" || choiceId === "medium") {
    intimacyPace = "medium";
    events.push({ type: "SET_INTIMACY_PACE", pace: "medium" });
  }
  if (nodeId === "negotiate_pace_explore" || choiceId === "explore") {
    intimacyPace = "exploratory";
    events.push({ type: "SET_INTIMACY_PACE", pace: "exploratory" });
  }

  if (nodeId === "negotiate_region_torso" || nodeId === "negotiate_soft_yes") {
    openRegions.add("soft_torso");
    events.push({ type: "OPEN_INTIMACY_REGION", region: "soft_torso" });
  }
  if (nodeId === "negotiate_region_close_yes") {
    openRegions.add("soft_torso");
    openRegions.add("close");
    events.push({ type: "OPEN_INTIMACY_REGION", region: "soft_torso" });
    events.push({ type: "OPEN_INTIMACY_REGION", region: "close" });
  }
  if (nodeId === "consent_yes") {
    openRegions.add("soft_torso");
    events.push({ type: "OPEN_INTIMACY_REGION", region: "soft_torso" });
  }
  if (nodeId === "vivi_curiosity_yes") {
    openRegions.add("soft_torso");
    openRegions.add("close");
    consent = true;
    events.push({ type: "OPEN_INTIMACY_REGION", region: "soft_torso" });
    events.push({ type: "OPEN_INTIMACY_REGION", region: "close" });
    events.push({ type: "SET_CONSENT", consent: true });
  }
  if (nodeId === "vivi_invite_soft_yes") {
    openRegions.add("soft_torso");
    consent = true;
    events.push({ type: "OPEN_INTIMACY_REGION", region: "soft_torso" });
    events.push({ type: "SET_CONSENT", consent: true });
  }
  if (nodeId === "vivi_invite_declined") {
    events.push({ type: "RESPECT_INTIMACY_BOUNDARY" });
  }

  if (
    nodeId === "pause_honored" ||
    nodeId === "touch_intimate_stop" ||
    nodeId === "touch_intimate_slow" ||
    nodeId === "negotiate_region_close_wait" ||
    nodeId === "negotiate_not_tonight" ||
    choiceId === "pause" ||
    choiceId === "stop" ||
    choiceId === "wait" ||
    choiceId === "slower"
  ) {
    events.push({ type: "RESPECT_INTIMACY_BOUNDARY" });
  }

  if (
    nodeId === "touch_intimate_ask" ||
    nodeId === "touch_intimate_yes" ||
    nodeId === "check_in_more" ||
    nodeId === "aftercare_quiet"
  ) {
    events.push({ type: "NOTE_SHARED_INTIMACY" });
  }

  if (nodeId === "negotiate_not_tonight") {
    consent = false;
    events.push({ type: "SET_CONSENT", consent: false });
  }

  return {
    stats: {
      ...stats,
      consent,
      intimacyPace,
      openRegions,
    },
    events,
  };
}

/** Fire once per node visit (grants + mood ticks). */
export function enterDialogueNode(
  id: string | null,
  stats: ApartmentGameStats = createDefaultApartmentStats(),
  visitedNodes: Set<string> = entered
): DialogueResult {
  if (!id) {
    visitedNodes.clear();
    return { stats, events: [] };
  }
  if (visitedNodes.has(id)) return { stats, events: [] };
  visitedNodes.add(id);

  const node = dialogues.nodes[id];
  if (!node) return { stats, events: [] };

  let currentStats = { ...stats };
  const events: DialogueActionEvent[] = [];

  if (node.grant?.length) {
    currentStats.tutorialGranted = true;
    events.push({ type: "GRANT_TUTORIAL" });
  }
  if (node.affection || node.comfort) {
    currentStats.affection += node.affection;
    currentStats.comfort += node.comfort ?? 0;
    currentStats.bond = Math.max(0, Math.min(100, currentStats.bond + node.affection));
    events.push({
      type: "ADD_STATS",
      affection: node.affection,
      comfort: node.comfort ?? 0,
    });
  }

  const intimacyResult = applyIntimacyEffects(node.id, undefined, currentStats);
  currentStats = intimacyResult.stats;
  events.push(...intimacyResult.events);

  return { stats: currentStats, events };
}

export function continueDialogue(
  currentDialogueId: string | null,
  stats: ApartmentGameStats = createDefaultApartmentStats()
): DialogueResult & { nextDialogueId: string | null } {
  const node = currentDialogueId ? dialogues.nodes[currentDialogueId] : null;
  if (!node) {
    return {
      stats: { ...stats, dialogueId: null },
      nextDialogueId: null,
      events: [{ type: "SET_DIALOGUE", dialogueId: null }],
    };
  }

  let currentStats = { ...stats };
  const events: DialogueActionEvent[] = [];

  if (node.id === "sleep_yes") {
    currentStats.day = (currentStats.day ?? 1) + 1;
    events.push({ type: "SLEEP_TO_NEXT_DAY" });
  }
  if (node.id === "consent_yes") {
    currentStats.consent = true;
    events.push({ type: "SET_CONSENT", consent: true });
  }

  const intimacyResult = applyIntimacyEffects(node.id, undefined, currentStats);
  currentStats = intimacyResult.stats;
  events.push(...intimacyResult.events);

  const nextDialogueId = node.next ?? null;
  currentStats.dialogueId = nextDialogueId;
  events.push({ type: "SET_DIALOGUE", dialogueId: nextDialogueId });

  return {
    stats: currentStats,
    nextDialogueId,
    events,
  };
}

export function chooseDialogue(
  choiceId: string,
  currentDialogueId?: string | null,
  stats: ApartmentGameStats = createDefaultApartmentStats()
): DialogueResult & { nextDialogueId: string | null } {
  const dialogueId = currentDialogueId ?? stats.dialogueId ?? null;
  const node = dialogueId ? dialogues.nodes[dialogueId] : null;
  if (!node) {
    return {
      stats,
      nextDialogueId: null,
      events: [],
    };
  }
  const choice = node.choices?.find((c) => c.id === choiceId);
  if (!choice) {
    return {
      stats,
      nextDialogueId: null,
      events: [],
    };
  }

  let currentStats = { ...stats };
  const events: DialogueActionEvent[] = [];

  if (choice.affection) {
    currentStats.affection += choice.affection;
    currentStats.bond = Math.max(0, Math.min(100, currentStats.bond + choice.affection));
    events.push({
      type: "ADD_STATS",
      affection: choice.affection,
    });
  }

  const intimacyResult = applyIntimacyEffects(node.id, choice.id, currentStats);
  currentStats = intimacyResult.stats;
  events.push(...intimacyResult.events);

  if (choice.next === "sleep_yes") {
    currentStats.dialogueId = "sleep_yes";
    events.push({ type: "SET_DIALOGUE", dialogueId: "sleep_yes" });
    return {
      stats: currentStats,
      nextDialogueId: "sleep_yes",
      events,
    };
  }

  if (choice.next === "consent_yes" || choice.id === "yes") {
    currentStats.consent = true;
    events.push({ type: "SET_CONSENT", consent: true });
  }

  const nextDialogueId = choice.next ?? null;
  currentStats.dialogueId = nextDialogueId;
  events.push({ type: "SET_DIALOGUE", dialogueId: nextDialogueId });

  return {
    stats: currentStats,
    nextDialogueId,
    events,
  };
}
