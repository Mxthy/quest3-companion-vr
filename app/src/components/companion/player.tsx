import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interactObjects } from "@/lib/companion/interact";
import { heldKeys, installControlsProbe, playerSim } from "@/lib/companion/player-ref";
import { promptFor, useCompanion } from "@/lib/companion/store";
import { updateListener } from "@/lib/companion/audio";
import { setXrActive, xrActive } from "@/lib/companion/adult";
import { COLLIDERS, ROOM_BOUNDS } from "./room";
import { CupMesh, LanternMesh, ToyWandMesh, VinylMesh } from "./interactables";

const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const NEXT = new THREE.Vector3();
const POS = new THREE.Vector3(); // THREE mirror of playerSim.position (render layer math)
const RAY = new THREE.Raycaster();
const NDC = new THREE.Vector2(0, 0);
const SEAT = new THREE.Vector3(0.62, 1.18, 0.72);

function blocked(x: number, z: number) {
  if (x < ROOM_BOUNDS.minX || x > ROOM_BOUNDS.maxX || z < ROOM_BOUNDS.minZ || z > ROOM_BOUNDS.maxZ) {
    return true;
  }
  for (const c of COLLIDERS) {
    if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
  }
  return false;
}

function findInteractId(obj: THREE.Object3D | null): string | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (typeof cur.userData.interactId === "string") return cur.userData.interactId;
    cur = cur.parent;
  }
  return null;
}

export function Player() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const hand = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const wasSeated = useRef(false);

  useEffect(() => {
    installControlsProbe();
    const keys = playerSim.keys;
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      const phase = useCompanion.getState().phase;
      if (phase === "playing") {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === "KeyE" || e.code === "Enter") {
          useCompanion.getState().interact();
        }
        if (e.code === "Escape") useCompanion.getState().pause();
      } else if (phase === "paused" && e.code === "Escape") {
        useCompanion.getState().resume();
      }
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    const clear = () => keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });

    const el = gl.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (useCompanion.getState().phase !== "playing") return;
      dragging.current = true;
      moved.current = false;
      last.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current || useCompanion.getState().phase !== "playing") return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      playerSim.yaw -= dx * 0.0026;
      playerSim.pitch -= dy * 0.0022;
      playerSim.pitch = THREE.MathUtils.clamp(playerSim.pitch, -1.15, 1.05);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (!moved.current && useCompanion.getState().phase === "playing") {
        useCompanion.getState().interact();
      }
    };
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gl]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.1);
    const phase = useCompanion.getState().phase;
    const seated = useCompanion.getState().seated;
    const inXR = xrActive; // immersive session: XR adapter owns the camera/rig
    if (inXR) camera.getWorldPosition(POS);
    else POS.set(playerSim.position.x, playerSim.position.y, playerSim.position.z);

    if (phase === "start") {
      const t = state.clock.elapsedTime;
      camera.position.set(Math.sin(t * 0.12) * 0.7 + 0.15, 1.22, 2.05);
      camera.lookAt(0, 1.12, -1.45);
      playerSim.speed = 0;
      if (hand.current) hand.current.visible = false;
      return;
    }

    FORWARD.set(-Math.sin(playerSim.yaw), 0, -Math.cos(playerSim.yaw));
    RIGHT.set(Math.cos(playerSim.yaw), 0, -Math.sin(playerSim.yaw));

    if (phase === "paused") {
      camera.position.set(playerSim.position.x, playerSim.position.y, playerSim.position.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = playerSim.yaw;
      camera.rotation.x = playerSim.pitch;
      playerSim.speed = 0;
      return;
    }

    if (inXR) {
      // XR: rig/locomotion is owned by the XR adapter; keep sim in sync for proximity/audio.
      playerSim.position.x = POS.x;
      playerSim.position.y = POS.y;
      playerSim.position.z = POS.z;
      playerSim.speed = 0;
      if (seated) useCompanion.getState().stand();
    } else if (seated) {
      POS.lerp(SEAT, 1 - Math.exp(-6 * dt));
      playerSim.position.x = POS.x;
      playerSim.position.y = POS.y;
      playerSim.position.z = POS.z;
      camera.position.set(POS.x, POS.y, POS.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = playerSim.yaw;
      camera.rotation.x = playerSim.pitch;
      const keys = heldKeys();
      if (keys.has("KeyW") || keys.has("KeyA") || keys.has("KeyS") || keys.has("KeyD")) {
        useCompanion.getState().stand();
        POS.set(0.62, 1.62, 1.05);
        playerSim.position.x = POS.x;
        playerSim.position.y = POS.y;
        playerSim.position.z = POS.z;
      }
      playerSim.speed = 0;
    } else {
      const keys = heldKeys();
      let ax = 0;
      let az = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) az += 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) az -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) ax += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) ax -= 1;
      ax += playerSim.touchMove.x;
      az += playerSim.touchMove.y;
      const len = Math.hypot(ax, az);
      if (len > 1) {
        ax /= len;
        az /= len;
      }
      const speed = 2.15;
      NEXT.copy(POS);
      NEXT.addScaledVector(FORWARD, az * speed * dt);
      NEXT.addScaledVector(RIGHT, ax * speed * dt);
      if (!blocked(NEXT.x, POS.z)) POS.x = NEXT.x;
      if (!blocked(POS.x, NEXT.z)) POS.z = NEXT.z;
      POS.y = 1.62;
      playerSim.position.x = POS.x;
      playerSim.position.y = POS.y;
      playerSim.position.z = POS.z;
      playerSim.speed = Math.hypot(az, ax) * speed;
      camera.position.set(POS.x, POS.y, POS.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = playerSim.yaw;
      camera.rotation.x = playerSim.pitch;
    }

    RAY.setFromCamera(NDC, camera);
    const hits = RAY.intersectObjects(interactObjects(), true);
    const lookId = hits.length ? findInteractId(hits[0]!.object) : null;
    playerSim.looking = lookId;
    useCompanion.getState().setLook(lookId);

    const dist = Math.hypot(POS.x, POS.z + 1.52);
    useCompanion.getState().setNear(dist < 2.15);

    const prompt = promptFor(useCompanion.getState());
    if (useCompanion.getState().prompt !== prompt) {
      useCompanion.setState({ prompt });
    }

    updateListener(
      POS.x,
      POS.y,
      POS.z,
      FORWARD.x,
      FORWARD.z,
    );

    const held = useCompanion.getState().held;
    if (hand.current) {
      hand.current.visible = Boolean(held);
      if (held) {
        hand.current.position.copy(camera.position);
        hand.current.quaternion.copy(camera.quaternion);
        hand.current.translateX(0.22);
        hand.current.translateY(-0.18);
        hand.current.translateZ(-0.48);
      }
    }
  });

  const held = useCompanion((s) => s.held);

  return (
    <group ref={hand}>
      {held === "cup" && <CupMesh scale={1.1} />}
      {held === "vinyl" && <VinylMesh scale={1.05} />}
      {held === "lantern" && <LanternMesh scale={1.05} />}
      {held === "toy_wand" && <ToyWandMesh scale={1.05} />}
    </group>
  );
}
