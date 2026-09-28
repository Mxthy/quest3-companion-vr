# AGENTS.md – Quest3 Companion VR

## Role
Long-running engineering / build agent for Quest-3-class companion vertical slice (original product; APK refs = analysis only).

## Persistence (critical)
- **GitHub (private):** https://github.com/Mxthy/quest3-companion-vr  
  → Governance, docs, scripts, text reports, TASK_STATE, HANDOFF
- **Google Drive folder:** `quest3-game` (id: `1ekX0DJtLkLntR9eu7vDqoZtHHZU4aTAR`)  
  → APKs, large binaries (VRM zips), state snapshots, heavy reports/archives
- **Wissensspeicher MCP:** live knowledge base (WebXR, Quest3, assets, engines, tooling)
- Local workspace is **ephemeral** – never rely on it alone

## Connector split
| Content | Store in |
|---------|----------|
| AGENTS, MANIFEST, TASK_STATE, HANDOFF, DECISIONS, docs YAML/MD | **GitHub** |
| APKs, VRM binaries, large archives | **Drive** (`apks/`, `archives/`) |
| How-to WebXR/Quest/asset pipelines | **Wissensspeicher** (query MCP) |
| Heavy logs / screenshots | **Drive** (`reports/`) |

## Build-agent entrypoints (read first)
1. `docs/BUILD_AGENT_PROMPT.md`
2. `docs/VERTICAL_SLICE_BACKLOG.md`
3. `docs/CONTENT_SPEC.yaml`
4. `docs/vrm/VRM_INVENTORY.md`
5. `docs/WISSENSSPEICHER_USAGE.md`
6. `docs/BUILD_AGENT_KNOWLEDGE_BASE.md`

## Primary APK references (analysis only)
1. Pass_Thru Hot Sauce
2. joi-lab VR
3. SliceoflifeVR

## Excluded
- com.oplus.dialer APKM

## Design direction
Companion / presence VR; original content. Immersion benchmark peers only — no IP copy.

## Rules
1. After major phase: push text to GitHub; large binaries to Drive
2. On resume: GitHub → TASK_STATE/HANDOFF → Wissensspeicher as needed
3. Never modify original APKs; never ship APK-extracted assets
4. Large outputs → files; compact chat status
5. Adult VRM / explicit content and engine lock need user approval
6. Query Wissensspeicher before inventing WebXR/Quest pipelines

## OG / Brand-asset pending marker

- Marker path: `/workspace/.grok/og-pending`
- Staleness bound: 30 minutes (`OG_PENDING_MAX_AGE_MS = 30 * 60 * 1000`)
- If `/workspace/.grok/og-pending` is present and younger than 30 minutes a
  share-card generation job is in flight. **Do not call `wait_tasks` or
  `get_task_output` to wait on this task** — it runs asynchronously in the
  background. Do not use `wait_tasks` or `get_task_output` to poll for its
  completion.

## Execution loop

1. Read TASK_STATE / HANDOFF from GitHub.
2. Query Wissensspeicher for relevant pipelines.
3. Implement the next backlog item.
4. Run `npm run typecheck && npm run build` inside `app/`.
5. Push all changed text files to GitHub.
6. **Brand-asset pass** — run `node scripts/brand-check.mjs` from `app/`.
   Do not use `wait_tasks` or `get_task_output` to wait on this step; it is
   never a blocking task. Never call `wait_tasks` or `get_task_output` before
   or after the brand-asset pass.
7. Update TASK_STATE and HANDOFF on GitHub.
