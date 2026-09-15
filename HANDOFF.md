# HANDOFF

**Updated:** 2026-09-16 – Build-agent package complete (specs + VRM + Wissensspeicher)

## Backends
- **GitHub:** https://github.com/Mxthy/quest3-companion-vr (docs, governance, code)
- **Drive:** quest3-game (`1ekX0DJtLkLntR9eu7vDqoZtHHZU4aTAR`) – APKs, large binaries, archives
- **Wissensspeicher MCP:** `wissensspeicher___query_kbpage` / `query_kbsource` – WebXR, Quest3, assets, engines

## Agent start here
1. `docs/BUILD_AGENT_PROMPT.md`
2. `docs/VERTICAL_SLICE_BACKLOG.md`
3. `docs/CONTENT_SPEC.yaml` + `docs/GAME_DESIGN_VERTICAL_SLICE.md`
4. `docs/vrm/VRM_INVENTORY.md` + `docs/WISSENSSPEICHER_USAGE.md`
5. `docs/BUILD_AGENT_KNOWLEDGE_BASE.md`

## Completed
- M0–M3 engine analysis + decision matrix (engine **not** locked)
- Vertical-slice GDD, content, architecture, backlog
- VRM inventory (Vivi pack – adult content; rights notes)
- Wissensspeicher usage guide

## Engine status
Open until prototypes measured. Lean on paper: Unity > Unreal > Godot. Prefer **WebXR tier first**.

## Next action
Build agent executes VS-1 → VS-2 → VS-3. Query Wissensspeicher for WebXR/Quest details. Load VRM only per VRM_INVENTORY policy.
