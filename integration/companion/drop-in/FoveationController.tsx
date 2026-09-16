/**
 * FoveationController – Fixed Foveated Rendering + dynamic resolution scale.
 * KB: quest3/foveated-rendering-deep, webxr/meta-quest-perf-bp
 *
 * Rules:
 * - Set FFR via XRWebGLLayer.fixedFoveation (0..1) or session optionalFeatures.
 * - If frame time > budget, lower scale via session.requestViewportScale.
 * - Never allocate in tick; reuse temps.
 * - Gate: sustained >= 72 Hz, no thermal spike.
 */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

const BUDGET_MS = 13.5; // ~74 Hz headroom under 90
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.0;
const FFR_LEVELS = [0, 1 / 3, 2 / 3, 1] as const; // off, low, med, high

export function FoveationController({
  enabled = true,
  targetFfr = 2 / 3, // medium default
}: {
  enabled?: boolean;
  targetFfr?: number;
}) {
  const { gl } = useThree();
  const { session, isPresenting } = useXR();
  const frameTimes = useRef<number[]>([]);
  const last = useRef(performance.now());
  const currentScale = useRef(1.0);
  const currentFfr = useRef(0);

  useFrame(() => {
    if (!enabled || !isPresenting || !session) return;
    const now = performance.now();
    const dt = now - last.current;
    last.current = now;
    frameTimes.current.push(dt);
    if (frameTimes.current.length > 30) frameTimes.current.shift();

    // average over window
    let sum = 0;
    for (let i = 0; i < frameTimes.current.length; i++) sum += frameTimes.current[i];
    const avg = sum / frameTimes.current.length;

    // adjust scale
    let scale = currentScale.current;
    if (avg > BUDGET_MS && scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, scale - 0.05);
    } else if (avg < BUDGET_MS * 0.85 && scale < MAX_SCALE) {
      scale = Math.min(MAX_SCALE, scale + 0.02);
    }
    if (scale !== currentScale.current) {
      currentScale.current = scale;
      try {
        (session as any).requestViewportScale?.(scale);
      } catch {
        /* unsupported */
      }
    }

    // FFR via baseLayer
    const baseLayer = (session as any).renderState?.baseLayer as XRWebGLLayer | undefined;
    if (baseLayer && 'fixedFoveation' in baseLayer) {
      const want = avg > BUDGET_MS ? Math.min(1, targetFfr + 0.1) : targetFfr;
      if (Math.abs(baseLayer.fixedFoveation - want) > 0.01) {
        baseLayer.fixedFoveation = want;
        currentFfr.current = want;
      }
    }
  });

  return null;
}

/** Call once at session start to request high foveation feature. */
export function ffrSessionInit() {
  return {
    optionalFeatures: ['high-fixed-foveation-level', 'local-floor'],
  };
}
