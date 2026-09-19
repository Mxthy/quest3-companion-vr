# Repo-Index – quest3-companion-vr

## Docs (Architektur & Balance)
- `BALANCED_SLICE.md` – Vier-Säulen-Budget, Gates
- `BALANCED_CLOUD_ARCHITECTURE.md` – **Client / Edge / Cloud Split**, PartyKit, RAG, NPC
- `QUEST3_ARCHITECTURE_LEVERS.md` – 5 Performance-Hebel
- `QUEST3_PHYSICS.md` – Rapier + Verlet
- `ASSET_PIPELINE.md` – glTF/Meshopt/KTX2
- `FEATURE_BUDGET.yaml` – harte Zahlen + Kill-Switches

## App
- `app/` – Wired companion MVP (Adult Core Phase 1): adult.ts bridge, zone anchors on Elara, arousal HUD, 18+ gate; see `app/README.md`

## Core
- `src/core/interaction/` – ContactController, Intensity, ColliderZones, TrackingProxy
- `src/core/physics/` – SoftVerlet
- `src/core/perf/pools.ts` – Zero-Alloc

## Integration (Drop-in)
- `integration/companion/drop-in/` – ContactBridge, SoftToys, RapierScene, toys, propTextures

## Content
- `content/adult_interaction.yaml`, `content/props_adult.yaml`, `content/interaction.yaml`

## Connectors
- GitHub: dieses Repo
- Drive: `quest3-game/` (archives, apks)
- Wissensspeicher MCP: `networking/*`, `ai-vibe/*`, `webxr/*`, `quest3/*`
