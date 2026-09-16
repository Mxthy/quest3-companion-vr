# Repository index

## Layout

```
quest3-companion-vr/
├── AGENTS.md, HANDOFF.md, TASK_STATE.yaml, PROJECT_MANIFEST.yaml
├── README.md, package.json, tsconfig.core.json, .gitignore
├── content/           # YAML content contracts
├── docs/              # Specs, overrides, design
├── integration/       # Drop-ins for the live companion app
├── src/core/          # Framework-free systems (interaction + adult legacy)
├── src/presentation/  # Mesh transform helpers
├── scripts/           # Node utilities
└── reports/           # APK/engine text reports
```

## Docs map

| Doc | Purpose |
|-----|---------|
| `PRODUCT_OWNER_OVERRIDE_INTERACTION.md` | Binding: contact systems P0 |
| `NEUTRAL_INTERACTION_SYSTEMS.md` | Collider / intensity / proxy |
| `GAME_DESIGN_VERTICAL_SLICE.md` | Soft loop beats |
| `CONTENT_SPEC.yaml` | Soft content |
| `ARCHITECTURE_NEXT.md` | core vs adapters |
| `DEPENDENCIES.md` | npm + Drive |
| `DRIVE_AND_CONNECTORS.md` | GitHub / Drive / MCP IDs |
| `integration/companion/drop-in/APPLY.md` | Apply order |

## Code map

| Path | Purpose |
|------|---------|
| `src/core/interaction/*` | **Preferred** contact systems |
| `src/core/adult/*` | Legacy explicit naming (compat) |
| `integration/companion/drop-in/*` | Copy into app |

## Scripts

| npm script | Action |
|------------|--------|
| `typecheck:core` | tsc on src/core |
| `test:intensity` | smoke intensity tick |
| `docs:list` | print docs tree |
| `sync:check` | verify critical paths exist |
