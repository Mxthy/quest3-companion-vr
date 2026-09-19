# app/ – Wired Companion MVP (Adult Core Phase 1)

Source: `quest3-game/archives/grok-workspace.zip` (Grok App-Builder MVP),
wired in the Base44 Superagent workspace on 2026-09-19.

## What is wired (Phase 1 – Core ins MVP hängen)
- Adult core modules consumed from repo `src/core/adult/`:
  PleasureModel, TouchZoneSystem, AdultInteractionController,
  VirtualAnatomy, IntimateContact (`src/lib/companion/adult.ts`)
- Zone anchors on Elara placeholder torso (`src/components/companion/elara.tsx`)
- Arousal/Intensity HUD + 18+ gate (`src/components/companion/adult-bridge.tsx`,
  overlay, experience wiring)
- Toy stub `toy_wand` + `speakLine` in store
- Content contracts: `content/*.yaml` (copy of repo `content/`)
- `npm run typecheck` green

## Excluded from this copy (unchanged from Drive zip)
- `.grok/` (Grok sandbox skills + platform docs)
- `screenshots/`, `artifacts/`, `.tanstack/`, `.vercel/`, env files
- Original zip stays on Drive (`grok-workspace.zip`)

## Run
```bash
cd app && npm install && npm run dev   # 0.0.0.0:8080
```

## Pending verification (user preview)
- Zones/intensity visible in running preview
- XR grip/trigger mapping to holding/burst
- FPS measurement (Gate G0 re-check with adult loop)
- VRM Vivi replacement for Elara placeholder
