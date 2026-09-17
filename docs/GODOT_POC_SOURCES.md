# Godot XR – POC Sources (legal, MIT/CC)

Only open-source repos. No store APKs, no decompilation.
For Fable / GPT-6 Astra / local agents: extract **concepts + minimal GDScript**, not whole projects.

## Primary sources

| Repo | License | Extract for |
|------|---------|-------------|
| [GodotVR/godot-xr-tools](https://github.com/GodotVR/godot-xr-tools) | MIT (code), CC0 images | Grab, teleport, climb, direct move, pickable, physics layers |
| [GodotVR/godot-xr-template](https://github.com/GodotVR/godot-xr-template) | MIT | Minimal game, export setup, XR Tools wired |
| [jtnicholl/godot4-vr-physics-template](https://github.com/jtnicholl/godot4-vr-physics-template) | MIT | Physics hands, no wall clip, pickup + collision reparent |
| [patrykkalinowski/godot-xr-kit](https://github.com/patrykkalinowski/godot-xr-kit) | MIT | Physics movement, gestures (Quest-tested) |
| [godotengine/godot-demo-projects](https://github.com/godotengine/godot-demo-projects) `xr/openxr_hand_tracking_demo` | MIT | Hand tracking patterns |
| [godotengine/godot-demo-projects](https://github.com/godotengine/godot-demo-projects) `xr/openxr_character_centric_movement` | MIT | CharacterBody-centric locomotion |
| [GodotVR/godot_openxr_vendors](https://github.com/GodotVR/godot_openxr_vendors) `samples/meta-hand-tracking-sample` | MIT | Meta-specific hand tracking |
| [Malcolmnixon/godot-xr-tools-demo](https://github.com/Malcolmnixon/godot-xr-tools-demo) | MIT | Teleport / flying / combined movement isolated |
| [NeoSpark314/VoxelWorksQuest](https://github.com/NeoSpark314/VoxelWorksQuest) | MIT | Jog-in-place **concept only** (code is messy) |

## Agent tooling (optional)

| Tool | Notes |
|------|--------|
| [hi-godot/godot-ai](https://github.com/hi-godot/godot-ai) MCP | MIT – production MCP for Godot editor/agent control |

## Clone order (lab)

```bash
git clone https://github.com/GodotVR/godot-xr-template.git
git clone https://github.com/GodotVR/godot-xr-tools.git
git clone https://github.com/jtnicholl/godot4-vr-physics-template.git
# then demos as needed
```

Install OpenXR Vendors plugin from Asset Library / GitHub for Quest export.

## Rules

1. Prefer official GodotVR + godot-demo-projects first.
2. Always record source URL + license in the PoC README.
3. Do not vendor entire third-party trees into product apps – quote patterns, minimal snippets.
4. Assets: prefer glTF/VRM you own or CC0; do not rip commercial game assets.
