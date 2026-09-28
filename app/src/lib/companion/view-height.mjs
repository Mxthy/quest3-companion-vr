/** Shared eye-height rules for desktop, touch/mobile and untracked phone XR. */

export const DESKTOP_STANDING_EYE_HEIGHT = 1.62;
export const MOBILE_STANDING_EYE_HEIGHT = 1.5;
export const PHONE_XR_EYE_HEIGHT = 1.55;
export const XR_TRACKED_HEIGHT_THRESHOLD = 0.55;
export const STAND_MOVE_DEAD_ZONE = 0.15;

/**
 * Touch screens are held closer than a desktop display, so a slightly lower
 * simulated eye height keeps the companion framed naturally without changing
 * room or avatar scale.
 * @param {boolean} coarsePointer
 */
export function nonXrStandingEyeHeight(coarsePointer) {
  return coarsePointer ? MOBILE_STANDING_EYE_HEIGHT : DESKTOP_STANDING_EYE_HEIGHT;
}

/**
 * Decide whether movement input should leave the seated state.
 * @param {number} touchX
 * @param {number} touchY
 * @param {boolean} hasKeyboardMovement
 */
export function shouldStandFromMovement(touchX, touchY, hasKeyboardMovement) {
  return hasKeyboardMovement || Math.hypot(touchX, touchY) > STAND_MOVE_DEAD_ZONE;
}

/**
 * Some phone/Cardboard WebXR runtimes expose a viewer pose at y=0 even though
 * the user is standing. Floor-tracked headsets report a real viewer height and
 * must never receive this correction.
 * @param {number} viewerHeight Height reported by the XR sub-camera.
 * @param {boolean} hasTrackedInput Whether hands/controllers are present.
 */
export function xrOriginHeightCorrection(viewerHeight, hasTrackedInput) {
  if (!Number.isFinite(viewerHeight) || hasTrackedInput || viewerHeight >= XR_TRACKED_HEIGHT_THRESHOLD) {
    return 0;
  }
  return PHONE_XR_EYE_HEIGHT - Math.max(0, viewerHeight);
}
