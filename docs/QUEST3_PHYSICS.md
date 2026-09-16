# Quest 3 Physics Architecture

Target: **90 Hz** stable (72/120 optional). Physics must not steal GPU/CPU from WebXR + optional Passthrough.

## Decision (this project)

| Layer | Engine | Use |
|-------|--------|-----|
| **Rigid props** (cup, vinyl, lantern, table, floor) | **Rapier.js WASM** via `@react-three/rapier` | Colliders, gravity, grab impulses |
| **Soft toys** (wand, ring, pillow) | **Verlet** `src/core/physics/SoftVerlet.ts` | Jiggle / squash without FEM cost |
| **Hands / controllers** | **Kinematic** Rapier bodies + **CCD** | Follow XR poses; never dynamic |
| **Optional MR room mesh** | Static Rapier colliders from WebXR mesh | Passthrough bounce |

**Not primary:** Cannon (heavier JS), Ammo (older). Babylon+Havok is fine for non-R3F stacks — we stay on R3F/Three.

## Why hybrid

Rapier is the Quest WebXR performance king (Rust→WASM). Soft silicone-style deformation is still expensive as true soft-body; Verlet segments stay cheap and readable.

## Quest rules

1. **Fixed timestep** prefer `1/90` inside Rapier `<Physics>` when possible; clamp `dt` ≤ `1/30` for Verlet.
2. **Hands = kinematic**, never free-falling dynamics.
3. **CCD on** hand/finger and fast-moving grabbables.
4. **Passthrough:** room mesh → static colliders only; do not rebuild every frame.
5. **Budget:** few dynamic bodies; sleep when idle; avoid 100+ constraint iterations on soft.

## npm (app)

```bash
npm i three @react-three/fiber @react-three/drei @react-three/xr @react-three/rapier
npm i -D @types/three typescript
```

## Wire order

1. `<XR>` / existing session
2. `<Physics gravity={[0,-9.81,0]}>` (Rapier)
3. Static room + table colliders
4. Dynamic rigid soft-props (cup…)
5. Kinematic hand colliders from XR input
6. `<SoftToyScene />` Verlet (outside or beside Rapier; no double gravity on soft points)

See `integration/companion/drop-in/RapierScene.tsx` and `SOFT_TOY_PHYSICS.md`.
