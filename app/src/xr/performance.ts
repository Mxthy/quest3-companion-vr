/**
 * Quest 3 WebXR performance profile.
 * KB: life-vibe/performance/quest3-budgets — target 72 FPS (~13.9 ms) as an
 * engineering budget, not a measured device guarantee.
 */

import type * as THREE from "three";

export const QUEST_TARGET_FPS = 72;
export const QUEST_FRAME_BUDGET_MS = 1000 / QUEST_TARGET_FPS;

export type PerformanceTier = "desktop" | "quest";

export type FoveationLevel = 0 | 0.2 | 0.5 | 1.0;

export type ResolutionScalingSuggestion = {
  pixelRatio: number;
  scaleFactor: number;
  reason: string;
};

export type PerformanceHeuristicSample = {
  deltaMs: number;
  frameRate?: number;
  session?: unknown;
};

export function detectPerformanceTier(): PerformanceTier {
  try {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("quest") || ua.includes("oculus")) return "quest";
    }
  } catch {
    /* */
  }
  return "desktop";
}

export function getSuggestedFoveationLevel(
  tier: PerformanceTier = detectPerformanceTier(),
  avgFrameTimeMs?: number,
): FoveationLevel {
  if (tier !== "quest") return 0;
  if (avgFrameTimeMs !== undefined && avgFrameTimeMs > QUEST_FRAME_BUDGET_MS * 1.1) {
    return 1.0;
  }
  return 0.5;
}

export function getResolutionScalingSuggestion(
  avgFrameTimeMs: number,
  targetFps = QUEST_TARGET_FPS,
): ResolutionScalingSuggestion {
  const budgetMs = 1000 / targetFps;
  if (avgFrameTimeMs > budgetMs * 1.25) {
    return {
      pixelRatio: 0.8,
      scaleFactor: 0.8,
      reason: `Frame time (${avgFrameTimeMs.toFixed(1)}ms) exceeds budget (${budgetMs.toFixed(1)}ms) by >25%`,
    };
  }
  if (avgFrameTimeMs > budgetMs * 1.05) {
    return {
      pixelRatio: 0.9,
      scaleFactor: 0.9,
      reason: `Frame time (${avgFrameTimeMs.toFixed(1)}ms) slightly exceeds budget (${budgetMs.toFixed(1)}ms)`,
    };
  }
  return {
    pixelRatio: 1.0,
    scaleFactor: 1.0,
    reason: `Performance within target budget (${budgetMs.toFixed(1)}ms)`,
  };
}

export function computePerformanceHeuristics(samples: PerformanceHeuristicSample[]): {
  avgFps: number;
  avgFrameTimeMs: number;
  recommendedFoveation: FoveationLevel;
  scaling: ResolutionScalingSuggestion;
} {
  if (!samples.length) {
    const tier = detectPerformanceTier();
    return {
      avgFps: QUEST_TARGET_FPS,
      avgFrameTimeMs: QUEST_FRAME_BUDGET_MS,
      recommendedFoveation: getSuggestedFoveationLevel(tier),
      scaling: getResolutionScalingSuggestion(QUEST_FRAME_BUDGET_MS),
    };
  }

  const totalDelta = samples.reduce((acc, s) => acc + s.deltaMs, 0);
  const avgFrameTimeMs = totalDelta / samples.length;
  const avgFps = avgFrameTimeMs > 0 ? 1000 / avgFrameTimeMs : QUEST_TARGET_FPS;
  const tier = detectPerformanceTier();
  const recommendedFoveation = getSuggestedFoveationLevel(tier, avgFrameTimeMs);
  const scaling = getResolutionScalingSuggestion(avgFrameTimeMs);

  return {
    avgFps,
    avgFrameTimeMs,
    recommendedFoveation,
    scaling,
  };
}

export function applyQuestRendererProfile(renderer: THREE.WebGLRenderer): void {
  const tier = detectPerformanceTier();
  try {
    if (typeof renderer.xr?.setFoveation === "function") {
      renderer.xr.setFoveation(tier === "quest" ? 1 : 0.5);
    }
  } catch {
    /* foveation optional */
  }
  if (tier !== "quest") return;
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = 0 as THREE.ToneMapping; // NoToneMapping
  renderer.toneMappingExposure = 1;
}

export function applyQuestSceneProfile(scene: THREE.Scene): void {
  if (detectPerformanceTier() !== "quest") return;
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      const mat = m as THREE.MeshStandardMaterial;
      if ("castShadow" in mesh) mesh.castShadow = false;
      if ("receiveShadow" in mesh) mesh.receiveShadow = false;
      if ("envMapIntensity" in mat) mat.envMapIntensity = 0;
      if ("shadowSide" in mat) mat.needsUpdate = true;
    }
  });
}
