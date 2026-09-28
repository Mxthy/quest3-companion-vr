/**
 * Personality barrel — the ported companion personality API.
 * Framework-agnostic pure TypeScript; the zustand store calls into these.
 */

export { getPersonaConfig, identitySystemPrompt } from "./identity";
export type { PersonaConfig } from "./identity";

export { LEVEL_OUTFITS, LEVEL_DECOR, outfitById } from "./items";
export type { OutfitItem, DecorItem } from "./items";

export {
  loadStructuredMemory,
  saveStructuredMemory,
  upsertFact,
  removeFact,
  addEpisode,
  distillTurn,
  purgeExpiredRaw,
  wipeAllMemory,
  memoryPromptBlock,
} from "./memory";

export {
  levelFromBond,
  expressionFromMood,
  expressionAfterTouch,
  applyLevelUnlocks,
  nextLevelNeed,
  intimacyLabel,
} from "./mood";
export type { UnlocksData } from "./mood";

export { prePolicy, postPolicy, privacyDisclosure } from "./privacy";

export { reactToInteraction, affectionStage } from "./reactions";
export type { ReactionResult } from "./reactions";

export {
  SCHEDULE,
  GAME_MINUTES_PER_REAL_SECOND,
  beatAt,
  formatClock,
  sunFactor,
  isNight,
  isAwakeHour,
} from "./schedule";
export type { ScheduleBeat } from "./schedule";

export {
  mapAffectionToGirlfriend,
  warmthFromStats,
  presenceFromEnergy,
  syncCompanionFromGame,
  setVulnerability,
  reactionForEvent,
  applyReaction,
} from "./state-machine";

export {
  defaultCompanionState,
} from "./types";
export type {
  CompanionState,
  Presence,
  Warmth,
  TopicSafety,
  MemoryConfidence,
  VulnerabilityFlag,
  ConsentMode,
  IntimacyPace,
  IntimacyRegion,
  StructuredMemory,
  SemanticFact,
  EpisodicMoment,
  PrivacySettings,
  PolicyVerdict,
  PersonaGameStats,
} from "./types";

export {
  rollPersona,
  decideWillingness,
  learnFromBeat,
  autonomyTick,
  regionsSheAllows,
  dispositionLabel,
  inferOutcome,
} from "./persona";
export type {
  Disposition,
  RegionMemory,
  PersonaState,
  Willingness,
} from "./persona";
