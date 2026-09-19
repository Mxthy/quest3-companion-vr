import type { Object3D } from "three";

const nodes = new Map<string, Object3D>();

export function registerInteract(id: string, obj: Object3D | null) {
  if (obj) {
    obj.userData.interactId = id;
    nodes.set(id, obj);
  }
  return () => {
    nodes.delete(id);
  };
}

export function interactObjects(): Object3D[] {
  return [...nodes.values()];
}
