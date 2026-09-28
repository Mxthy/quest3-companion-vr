/**
 * Unified action layer — Desktop / Touch / Quest map onto the same actions.
 * Portable action mapping consumed by react-three/xr input sources & gamepads.
 */

export type InputAction =
  | "move"
  | "turn"
  | "interact"
  | "grab"
  | "teleport"
  | "menu"
  | "back"
  | "photo"
  | "inventory"
  | "sprint";

export type ActionState = {
  /** continuous axes */
  moveX: number;
  moveY: number;
  turnX: number;
  turnY: number;
  /** edge-triggered buttons (true for one frame after press) */
  interact: boolean;
  interactHeld: boolean;
  grab: boolean;
  grabHeld: boolean;
  teleport: boolean;
  teleportHeld: boolean;
  menu: boolean;
  back: boolean;
  photo: boolean;
  inventory: boolean;
  sprint: boolean;
};

export function emptyActions(): ActionState {
  return {
    moveX: 0,
    moveY: 0,
    turnX: 0,
    turnY: 0,
    interact: false,
    interactHeld: false,
    grab: false,
    grabHeld: false,
    teleport: false,
    teleportHeld: false,
    menu: false,
    back: false,
    photo: false,
    inventory: false,
    sprint: false,
  };
}

/** Merge multiple provider snapshots; axes sum+clamp, buttons OR */
export function mergeActions(...parts: ActionState[]): ActionState {
  const out = emptyActions();
  for (const p of parts) {
    out.moveX += p.moveX;
    out.moveY += p.moveY;
    out.turnX += p.turnX;
    out.turnY += p.turnY;
    out.interact = out.interact || p.interact;
    out.interactHeld = out.interactHeld || p.interactHeld;
    out.grab = out.grab || p.grab;
    out.grabHeld = out.grabHeld || p.grabHeld;
    out.teleport = out.teleport || p.teleport;
    out.teleportHeld = out.teleportHeld || p.teleportHeld;
    out.menu = out.menu || p.menu;
    out.back = out.back || p.back;
    out.photo = out.photo || p.photo;
    out.inventory = out.inventory || p.inventory;
    out.sprint = out.sprint || p.sprint;
  }
  out.moveX = Math.max(-1, Math.min(1, out.moveX));
  out.moveY = Math.max(-1, Math.min(1, out.moveY));
  out.turnX = Math.max(-1, Math.min(1, out.turnX));
  out.turnY = Math.max(-1, Math.min(1, out.turnY));
  return out;
}

export function applyDeadzone(v: number, z = 0.15): number {
  if (Math.abs(v) < z) return 0;
  const s = Math.sign(v);
  return s * ((Math.abs(v) - z) / (1 - z));
}

export type GamepadPrevState = {
  triggerL?: boolean;
  triggerR?: boolean;
  squeezeL?: boolean;
  squeezeR?: boolean;
  buttonA?: boolean;
  buttonB?: boolean;
  buttonX?: boolean;
  buttonY?: boolean;
};

/** Convert WebXR gamepad states into ActionState snapshot for react-three/xr input. */
export function actionsFromGamepad(
  leftGp?: Gamepad | null,
  rightGp?: Gamepad | null,
  prevStates?: GamepadPrevState
): {
  actions: ActionState;
  nextPrev: Required<GamepadPrevState>;
} {
  const a = emptyActions();
  const prev = prevStates ?? {};

  const lBtns = leftGp?.buttons ?? [];
  const rBtns = rightGp?.buttons ?? [];
  const lAxes = leftGp?.axes ?? [];
  const rAxes = rightGp?.axes ?? [];

  const lThumbX = applyDeadzone(lAxes.length >= 4 ? lAxes[2]! : lAxes[0]!);
  const lThumbY = applyDeadzone(lAxes.length >= 4 ? -lAxes[3]! : -lAxes[1]!);
  const rThumbX = applyDeadzone(rAxes.length >= 4 ? rAxes[2]! : rAxes[0]!);
  const rThumbY = applyDeadzone(rAxes.length >= 4 ? -rAxes[3]! : -rAxes[1]!);

  a.moveX = lThumbX;
  a.moveY = lThumbY;
  a.turnX = rThumbX;
  a.turnY = rThumbY;

  a.teleportHeld = rThumbY > 0.65;
  a.teleport = a.teleportHeld;

  const trigL = (lBtns[0]?.value ?? 0) > 0.75 || Boolean(lBtns[0]?.pressed);
  const trigR = (rBtns[0]?.value ?? 0) > 0.75 || Boolean(rBtns[0]?.pressed);
  a.interactHeld = trigL || trigR;
  a.interact = (trigL && !prev.triggerL) || (trigR && !prev.triggerR);

  const sqL = (lBtns[1]?.value ?? 0) > 0.75 || Boolean(lBtns[1]?.pressed);
  const sqR = (rBtns[1]?.value ?? 0) > 0.75 || Boolean(rBtns[1]?.pressed);
  a.grabHeld = sqL || sqR;
  a.grab = (sqL && !prev.squeezeL) || (sqR && !prev.squeezeR);

  const btnA = Boolean(rBtns[4]?.pressed);
  const btnB = Boolean(rBtns[5]?.pressed);
  const btnX = Boolean(lBtns[4]?.pressed);
  const btnY = Boolean(lBtns[5]?.pressed);

  a.photo = btnA && !prev.buttonA;
  a.menu = btnB && !prev.buttonB;
  a.back = btnX && !prev.buttonX;
  a.inventory = btnY && !prev.buttonY;

  return {
    actions: a,
    nextPrev: {
      triggerL: trigL,
      triggerR: trigR,
      squeezeL: sqL,
      squeezeR: sqR,
      buttonA: btnA,
      buttonB: btnB,
      buttonX: btnX,
      buttonY: btnY,
    },
  };
}
