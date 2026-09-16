# APPLY — execute open items (no status-only loops)

**Also read:** `docs/DEPENDENCIES.md`, `docs/REPO_INDEX.md`, `docs/PRODUCT_OWNER_OVERRIDE_INTERACTION.md`

## Prerequisites (app that runs preview)

```bash
npm i three @react-three/fiber @react-three/drei zustand
npm i -D typescript @types/three
```

Path alias `@/` → `src/` (see `docs/DEPENDENCIES.md`).

## Order (do, don’t only report)

1. Copy `src/core/interaction/*.ts` (+ `index.ts`) from this repo into the app.
2. Copy `drop-in/contact-bridge.tsx` → `src/components/companion/contact-bridge.tsx`
3. Replace or merge `experience.tsx` with `drop-in/experience.tsx` (adds `<ContactBridge />`).
4. In `store.ts`: extend type + create() with fields from `store-contact-fields.ts`.
5. In `overlay.tsx`: render `<IntensityHud />` from `IntensityHud.tsx`.
6. Preview: enter room → walk to Elara → cyan zone spheres → F near zones raises bar → R burst.
7. XR (if present): grip→holding, trigger edge→burstPressed, controller positions→handPoints.

## Verify this governance repo

```bash
npm install
npm run sync:check
npm run test:intensity
```

## Controls
| Input | Action |
|-------|--------|
| Move to Elara | zone proximity via reach point |
| F / Shift | holding |
| R (edge) | burst |

## Done when
- Soft props still work
- ≥3 zones show contact (HUD zone id)
- intensity bar moves
- proxy capsule visible near hip height from camera
- peak can fire after sustained contact
