# quest3-companion-vr

Governance + **neutral interaction core** + integration drop-ins for a Meta Quest–class companion vertical slice.

Reference APKs and large binaries live on **Google Drive** only (not in git).

## Quick start (core library)

```bash
git clone https://github.com/Mxthy/quest3-companion-vr.git
cd quest3-companion-vr
npm install
npm run typecheck:core
npm run test:intensity
npm run sync:check
```

## Wire into the companion app (preview)

1. Read `docs/PRODUCT_OWNER_OVERRIDE_INTERACTION.md` (binding).
2. Follow `integration/companion/drop-in/APPLY.md`.
3. Copy `src/core/interaction/*` and drop-in components into the app.
4. Peer deps: see `docs/DEPENDENCIES.md`.

## Key paths

| Path | What |
|------|------|
| `src/core/interaction/` | Intensity, colliders, HMD proxy, ContactController |
| `integration/companion/drop-in/` | ContactBridge, experience, HUD, store fields |
| `app/` | Wired companion MVP (Adult Core Phase 1, typecheck green) |
| `docs/` | Specs, override, design, Drive map |
| `content/` | YAML contracts |
| `reports/` | APK / engine text reports |

## Connectors

| System | Role |
|--------|------|
| **GitHub** (this repo) | Docs, core TS, drop-ins, task state |
| **Drive `quest3-game`** | archives (MVP zip, VRM), structure under apks/reports/state |
| **Drive `Mcp`** | Large reference APKs |
| **Wissensspeicher MCP** | WebXR / Quest knowledge queries |

IDs and layout: `docs/DRIVE_AND_CONNECTORS.md`, `PROJECT_MANIFEST.yaml`.

## Documentation index

See `docs/REPO_INDEX.md`.

## License / rights

Original project code and specs in this repo. Third-party VRM/APKs: see `docs/vrm/VRM_INVENTORY.md` and `RIGHTS_STATUS.yaml`. Do not ship APK-extracted assets.
