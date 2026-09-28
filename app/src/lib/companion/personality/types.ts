/** Companion-app state model — explicit variables, not free-form drift. */

export type Presence = "online" | "idle" | "resting" | "away";
export type Warmth = "low" | "medium" | "high";
export type TopicSafety = "allowed" | "caution" | "block";
export type MemoryConfidence = "weak" | "medium" | "strong";
export type VulnerabilityFlag = "normal" | "elevated" | "crisis";
export type ConsentMode = "chat" | "voice" | "roleplay" | "apartment_sim" | "intimacy";

export type IntimacyPace = "slow" | "medium" | "exploratory";

export type IntimacyRegion =
  | "hands"
  | "face"
  | "shoulders"
  | "soft_torso" // chest / waist / back with soft intent
  | "close" // hips / intimate layer when mutually opened
  | "aftercare";

export type CompanionState = {
  presence: Presence;
  /** 0–100, slow-moving */
  trust: number;
  warmth: Warmth;
  topicSafety: TopicSafety;
  memoryConfidence: MemoryConfidence;
  userVulnerability: VulnerabilityFlag;
  consentScope: ConsentMode[];
  /** girlfriend-sim affection bridge 0–100 (maps from game bond/affection) */
  girlfriendAffection: number;
  /** last reaction label for UI */
  lastReaction: string;
  updatedAt: number;
};

export type SemanticFact = {
  id: string;
  key: string;
  value: string;
  confidence: MemoryConfidence;
  source: "user" | "inferred" | "system";
  updatedAt: number;
};

export type EpisodicMoment = {
  id: string;
  summary: string;
  tags: string[];
  valence: "positive" | "neutral" | "mixed" | "negative";
  at: number;
};

export type StructuredMemory = {
  semantic: SemanticFact[];
  episodic: EpisodicMoment[];
  /** raw turns kept only briefly */
  rawUntil: number;
};

export type PrivacySettings = {
  trainOnUserContent: false;
  rawRetentionHours: number;
  userEditableMemory: boolean;
  showMemoryUi: boolean;
};

export type PolicyVerdict =
  | { ok: true }
  | { ok: false; reason: string; rewriteHint?: string };

/** Framework-agnostic stats adapter for store synchronization */
export type PersonaGameStats = {
  /** Bond 0-100 (maps to girlfriend affection) */
  bond: number;
  /** Optional legacy affection override 0-300 if migrating */
  affection?: number;
  /** Comfort stat (0-100) */
  comfort?: number;
  /** Energy stat (0-100) */
  energy?: number;
  /** Game time in minutes (0-1439) */
  gameMinutes?: number;
  /** Intimacy trust rating (0-10) */
  intimacyTrust?: number;
  /** Whether user consent is active */
  consent?: boolean;
  /** Active consent modes */
  consentModes?: ConsentMode[];
  /** Number of visits */
  visits?: number;
};

export const defaultCompanionState = (): CompanionState => ({
  presence: "online",
  trust: 12,
  warmth: "medium",
  topicSafety: "allowed",
  memoryConfidence: "medium",
  userVulnerability: "normal",
  consentScope: ["chat", "apartment_sim"],
  girlfriendAffection: 0,
  lastReaction: "present",
  updatedAt: Date.now(),
});
