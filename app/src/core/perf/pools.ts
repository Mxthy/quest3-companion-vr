/**
 * Zero-allocation helpers for tick paths.
 * Import and mutate; never construct in useFrame.
 */
import * as THREE from "three";

export const _v0 = new THREE.Vector3();
export const _v1 = new THREE.Vector3();
export const _v2 = new THREE.Vector3();
export const _q0 = new THREE.Quaternion();
export const _q1 = new THREE.Quaternion();
export const _m0 = new THREE.Matrix4();
export const _m1 = new THREE.Matrix4();
export const _c0 = new THREE.Color();

/** Scratch array for soft-body position copies (fixed capacity). */
export function makeVec3Pool(n: number) {
  return Array.from({ length: n }, () => ({ x: 0, y: 0, z: 0 }));
}
