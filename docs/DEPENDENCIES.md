# Dependencies

## This repo (governance + core libraries)

| Package | Role |
|---------|------|
| `typescript` (dev) | Typecheck `src/core/**` via `npm run typecheck:core` |

Core under `src/core/interaction` and `src/core/adult` is **framework-free** (plain TypeScript). No runtime npm deps required to use the state/collider math.

## Peer deps (only when wiring into the Grok/R3F companion app)

| Package | Used by |
|---------|---------|
| `react` | drop-in UI / R3F |
| `three` | ContactBridge meshes |
| `@react-three/fiber` | ContactBridge `useFrame` |
| `@react-three/drei` | existing Experience (shadows) |
| `zustand` | companion store |

Install **in the app that runs the preview**, not necessarily in this governance repo:

```bash
npm i three @react-three/fiber @react-three/drei zustand
npm i -D @types/three typescript
```

Optional later:
- `@pixiv/three-vrm` — VRM avatar load
- `vite` / Next — as chosen by the app scaffold

## Drive binaries (not npm)

| Asset | Location |
|-------|----------|
| MVP source zip | Drive `quest3-game/archives/grok-workspace.zip` |
| VRM pack | Drive `quest3-game/archives/vivi_vrm.zip` |
| Reference APKs | Drive `Mcp/` (see `apks/APKS_LOCATION.txt`) |

## Path aliases (app)

```json
{
  "@/core/*": ["src/core/*"],
  "@/lib/*": ["src/lib/*"],
  "@/components/*": ["src/components/*"]
}
```

See `tsconfig.core.json` for this repo’s core-only check.
