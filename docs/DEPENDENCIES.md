# Dependencies

## This repo (governance + core libraries)

| Package | Role |
|---------|------|
| `typescript` (dev) | Typecheck `src/core/**` via `npm run typecheck:core` |

Core under `src/core/` is mostly **framework-free**. Physics soft body has no npm dep. Rapier is **peer** of the app.

## Peer deps (preview / Quest app)

```bash
npm i three @react-three/fiber @react-three/drei @react-three/xr @react-three/rapier zustand
npm i -D @types/three typescript
```

Optional ship:
- Basis transcoder static files for KTX2Loader
- meshopt decoder (Three examples)

## Architecture docs

- `docs/QUEST3_ARCHITECTURE_LEVERS.md` — workers, forward, FFR, instancing, zero-alloc
- `docs/QUEST3_PHYSICS.md` — Rapier + Verlet
- `docs/ASSET_PIPELINE.md` — glTF / Meshopt / KTX2

## Drive binaries

MVP zip, VRM, APKs — see `docs/DRIVE_AND_CONNECTORS.md`.
