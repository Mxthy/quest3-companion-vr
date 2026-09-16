# HANDOFF

**Updated:** 2026-09-16

## Backends
- GitHub: https://github.com/Mxthy/quest3-companion-vr
- Drive quest3-game + archives (MVP zip, VRM) — see `docs/DRIVE_AND_CONNECTORS.md`
- Wissensspeicher MCP — `docs/WISSENSSPEICHER_USAGE.md`

## Repo now includes
- `package.json` / `tsconfig.core.json` / scripts (`sync-check`, `smoke-intensity`, `list-docs`)
- Full `README.md`, `docs/REPO_INDEX.md`, `docs/DEPENDENCIES.md`
- Neutral core: `src/core/interaction/*`
- Drop-in: `integration/companion/drop-in/*`
- PO override: `docs/PRODUCT_OWNER_OVERRIDE_INTERACTION.md`

## Next (live app)
1. `npm run sync:check` in this repo
2. Apply `integration/companion/drop-in/APPLY.md` into the companion preview app
3. Preview: zones + intensity HUD + proxy

## Resume order
`README.md` → `docs/REPO_INDEX.md` → `TASK_STATE.yaml` → `PRODUCT_OWNER_OVERRIDE_INTERACTION.md` → `drop-in/APPLY.md`
