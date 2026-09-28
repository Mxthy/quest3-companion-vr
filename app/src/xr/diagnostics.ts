/**
 * In-VR / on-screen diagnostics for Quest testing without a console.
 */
export type XRDiagSnapshot = {
  xrSession: string;
  referenceSpace: string;
  leftController: string;
  rightController: string;
  trigger: string;
  grip: string;
  thumbstick: string;
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  vrm: string;
  audio: string;
  presenting: boolean;
  trackingLossCount: number;
  trackingLost: boolean;
};

export class XRDiagnostics {
  private frames = 0;
  private acc = 0;
  private fps = 0;
  private frameMs = 0;
  private last = typeof performance !== "undefined" ? performance.now() : Date.now();
  private trackingLossCount = 0;
  private trackingLost = false;
  visible = false;

  tick(dt: number) {
    this.frames++;
    this.acc += dt;
    this.frameMs = dt * 1000;
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc);
      this.frames = 0;
      this.acc = 0;
    }
  }

  recordTrackingLoss(lost: boolean) {
    if (lost && !this.trackingLost) {
      this.trackingLossCount++;
    }
    this.trackingLost = lost;
  }

  toggle() {
    this.visible = !this.visible;
  }

  snapshot(partial: Partial<XRDiagSnapshot> = {}): XRDiagSnapshot {
    return {
      xrSession: "—",
      referenceSpace: "—",
      leftController: "—",
      rightController: "—",
      trigger: "—",
      grip: "—",
      thumbstick: "—",
      fps: this.fps,
      frameMs: Math.round(this.frameMs * 10) / 10,
      drawCalls: 0,
      triangles: 0,
      vrm: "—",
      audio: "—",
      presenting: false,
      trackingLossCount: this.trackingLossCount,
      trackingLost: this.trackingLost,
      ...partial,
    };
  }
}

/** Helper function to build a default diagnostic snapshot */
export function createDiagSnapshot(partial: Partial<XRDiagSnapshot> = {}): XRDiagSnapshot {
  return new XRDiagnostics().snapshot(partial);
}

/** Formats diagnostic snapshot into text lines for HUD display */
export function formatDiagLines(diag: XRDiagSnapshot): string[] {
  return [
    `XR ${diag.xrSession}  ref ${diag.referenceSpace}`,
    `L ${diag.leftController}  R ${diag.rightController}`,
    `trig ${diag.trigger}  grip ${diag.grip}  ${diag.thumbstick}`,
    `FPS ${diag.fps}  ${diag.frameMs}ms  draws ${diag.drawCalls}  tris ${diag.triangles}`,
    `VRM ${diag.vrm}  audio ${diag.audio}  trackLoss ${diag.trackingLossCount}${diag.trackingLost ? " (LOST)" : ""}`,
  ];
}
