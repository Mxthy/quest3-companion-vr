# Soft-Toy Physics (Verlet) + Quest 3

## Stack with Rapier

See **`docs/QUEST3_PHYSICS.md`**.

- **Rapier:** rigid cup/table/floor, kinematic hands + CCD
- **Verlet:** wand / ring / pillow soft deformation only

Do **not** simulate silicone as Rapier soft-body (cost). Pin Verlet handle to the same world point as the kinematic grab when held.

## Core

`src/core/physics/SoftVerlet.ts`

| Factory | Use |
|---------|-----|
| `createWandSoftBody` | Segment chain |
| `createRingSoftBody` | 8-point loop |
| `createPillowSoftBody` | 2×2×2 lattice |

`SoftBody.tick(dt)` — clamp `dt` ≤ `1/30`; prefer stepping near 90 Hz display.

## R3F

`integration/companion/drop-in/SoftToys.tsx` → `<SoftToyScene />`

Desktop: **T** soft-hold wand, **G** release (until store HeldId includes toys).

## Wire

```tsx
import { RapierRigidLayer } from "./RapierScene";
import { SoftToyScene } from "./SoftToys";

<>
  <RapierRigidLayer />
  <SoftToyScene />
</>
```

## Tuning

| Param | Effect |
|-------|--------|
| damping 0.96–0.99 | residual motion |
| stiffness | firmer silicone |
| iterations 4–6 | Quest-safe |
