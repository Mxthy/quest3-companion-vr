# Soft-Toy Physics (Verlet)

## Why Verlet (not full FEM / PhysX)

Quest / WebXR budget: lightweight **position-based dynamics** (Verlet + distance constraints).
No native plugin required. Suitable for wand jiggle, ring flex, pillow squash.

## Core

`src/core/physics/SoftVerlet.ts`

| Factory | Use |
|---------|-----|
| `createWandSoftBody` | Segment chain, pinned base when held |
| `createRingSoftBody` | 8-point loop |
| `createPillowSoftBody` | 2×2×2 lattice |

`SoftBody.tick(dt)` → gravity, damping, constraint iterations, ground plane.

## R3F

`integration/companion/drop-in/SoftToys.tsx` → `<SoftToyScene />`

- Hold: pin point 0 to camera reach (or controller)
- Release: unpin, soft settle
- Desktop test: **T** soft-hold wand, **G** release (until store HeldId extended)

## Wire

```tsx
import { SoftToyScene } from "./SoftToys";
// in Scene:
<SoftToyScene />
```

Optional later: `@react-three/rapier` rigid colliders for cup/table only; keep soft toys on Verlet.

## Tuning

| Param | Effect |
|-------|--------|
| `damping` 0.96–0.99 | less / more residual motion |
| `stiffness` on connect | firmer silicone |
| `iterations` 4–8 | stability vs cost |
| `gravity` | lighter toys use weaker Y |

## Do not

- Run 100+ constraint iterations per frame on Quest
- Mix heavy convex colliders on every soft segment
