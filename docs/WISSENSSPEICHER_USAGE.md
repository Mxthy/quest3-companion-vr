# Wissensspeicher MCP – Usage for Build Agents

User-operated knowledge MCP connected to this workspace.

## Tools

| Tool | Purpose |
|------|---------|
| `wissensspeicher___query_kbpage` | Long-form KB articles (title, slug, category, content, sources) |
| `wissensspeicher___query_kbsource` | Source URL catalog (docs, tools, samples) |

### query_kbpage parameters
- `id` – single record
- `query` – Mongo-style filter, e.g. `{ "category": "webxr" }`, `{ "slug": "quest3/passthrough-mixed-reality" }`
- `sort` – e.g. `"-updatedAt"`
- `limit` – 1–500 (default 50)
- `fields` – optional projection

### query_kbsource parameters
Same shape; records include `url`, `category`, `authority`, `status`.

## High-value categories (for this project)

| category | Use when |
|----------|----------|
| `webxr` | Session, controllers, Three.js physics, Needle, samples |
| `quest3` | Passthrough/MR, foveated rendering, GPU profiler, Quest perf |
| `assets` | CC0 stores, RPM, photogrammetry, AI-3D catalog pointers |
| `gltf-pipelines` | Extensions, gltf-transform optimize |
| `textures` | KTX2/Basis, procedural |
| `engine` | WASM/SIMD, Godot, Unity/Unreal ECS notes, game loop |
| `tooling` | Lighthouse/WebXR audits, CI, Tracy, GPU profiling |
| `ai-vibe` | 3D gen tools, agentic codegen, NPC dialogue, RAG |
| `networking` | PartyKit, Yjs, WebRTC (later multiplayer) |

## Example slugs (verified present in KB sample)
- `webxr/meta-quest-perf-bp`
- `webxr/gamepads-module-controllers`
- `quest3/passthrough-mixed-reality`
- `quest3/foveated-rendering-deep`
- `assets/free-asset-stores`
- `assets/ready-player-me-integration`
- `gltf-pipelines/gltf-transform-optimizer`
- `textures/ktx2-basis-deep`
- `tooling/lighthouse-webdev-audits`
- `ai-vibe/tools-3d-catalog`
- `engine/godot-architecture-deep`

## Agent policy
1. Before implementing WebXR/Quest/asset pipelines, query relevant category.
2. Cite slug or title in your notes when you follow KB guidance.
3. KB does not replace project CONTENT_SPEC / rights rules.
4. If MCP unavailable, fall back to repo docs only and note the gap.
