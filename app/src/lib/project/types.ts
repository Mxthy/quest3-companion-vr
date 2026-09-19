export type MilestoneId = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7";

export type MilestoneStatus = "done" | "current" | "next" | "later";

export type EngineId = "unity" | "godot" | "unreal";

export type ApkId = "passthru" | "joilab" | "sliceoflife" | "dialer";

export type FeatureFlag = "yes" | "no" | "partial" | "unknown";

export type Milestone = {
  id: MilestoneId;
  title: string;
  detail: string;
  status: MilestoneStatus;
};

export type ApkRef = {
  id: ApkId;
  role: "primary" | "excluded";
  name: string;
  label: string;
  packageName: string;
  version: string;
  versionCode?: string;
  driveFileId?: string;
  sizeBytes?: number;
  sha256?: string;
  engine: string;
  engineConfidence: string;
  minSdk?: number;
  targetSdk?: number;
  xrBootstrap: string;
  passthrough: FeatureFlag;
  handTracking: FeatureFlag;
  sceneAnchors: FeatureFlag;
  voice: FeatureFlag;
  avatar: FeatureFlag;
  notes: string;
  reportSlugs: string[];
};

export type EngineCriterion = {
  id: number;
  name: string;
  category: string;
  unity: number;
  godot: number;
  unreal: number;
  note: string;
};

export type CategoryScore = {
  key: string;
  label: string;
  weight: number;
  unity: number;
  godot: number;
  unreal: number;
};

export type FunctionalTest = {
  id: string;
  label: string;
  optional?: boolean;
};

export type MetricTest = {
  id: string;
  label: string;
  method: string;
};

export type Decision = {
  id: string;
  title: string;
  body: string;
  status: "accepted" | "open";
};

export type Assumption = {
  id: string;
  body: string;
};

export type CommitEntry = {
  sha: string;
  message: string;
  date: string;
  url: string;
};

export type GovernanceFile = {
  path: string;
  kind: "yaml" | "md";
  role: string;
};

export type DriveFolderMeta = {
  key: "apks" | "state" | "reports" | "archives";
  name: string;
  id: string;
  purpose: string;
};
