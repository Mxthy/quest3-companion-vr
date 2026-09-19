import * as THREE from "three";

export const playerSim = {
  position: new THREE.Vector3(0.18, 1.62, 2.62),
  yaw: 0,
  pitch: -0.06,
  speed: 0,
  seated: false,
  keys: new Set<string>(),
  keyOverride: null as string[] | null,
  touchMove: { x: 0, y: 0 },
  looking: null as string | null,
};

export function heldKeys(): Set<string> {
  if (playerSim.keyOverride) return new Set(playerSim.keyOverride);
  return playerSim.keys;
}

export function installControlsProbe() {
  window.__controlsTest = {
    getYaw: () => playerSim.yaw,
    getSpeed: () => playerSim.speed,
    getX: () => playerSim.position.x,
    getZ: () => playerSim.position.z,
    setKeys: (codes: string[]) => {
      playerSim.keyOverride = codes.length ? codes : null;
    },
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX?: () => number;
      getZ?: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
