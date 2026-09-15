# Assets, Entities & VRM – Build-Agent Guidance

## Answer in one line
Yes: a build agent **can** program with proper assets and entities — using **original** VRM characters, props, and data-driven configs — not by ripping meshes from the reference APKs.

## Layers

| Layer | Source for this project | Agent may |
|-------|-------------------------|-----------|
| **Gameplay systems** | `docs/BUILD_AGENT_KNOWLEDGE_BASE.md`, `SYSTEMS_FROM_RE.yaml` | Implement phase, bond, grab, dialogue |
| **Entities** | Original definitions (companion, props, anchors) | Code ECS/components + IDs |
| **Character models** | **VRM pipeline** + character sheets (original design) | Generate/edit VRM, expressions, textures |
| **Room/props meshes** | Procedural / AI-gen / hand-authored GLB | Place as interactables |
| **APK reference binaries** | Analysis only | **Never** ship extracted assets |

## VRM role in the companion app

VRM is the **portable humanoid avatar format** (glTF + humanoid + expressions + optional spring bones + MToon).

Typical companion entity:
```text
CompanionEntity
  ├─ VrmAvatar (mesh, humanoid bones, expressions)
  ├─ ProximitySensor
  ├─ DialogueSpeaker
  ├─ LookAtUser (optional)
  └─ SimpleIdlePose
```

Props stay separate GLB/glTF (cup, vinyl, lantern) — not part of the VRM body.

## What the VRM KB enables

From project pack `vrm_agent_kb_v5` + `docs/vrm/VRM_REVERSE_ENGINEERING.md`:

1. Parse/write GLB/VRM binary (JSON + BIN chunks)
2. Humanoid bone mapping (hips…fingers)
3. Expressions / blendshapes (blink, A/I/U/E/O, emotion presets)
4. MToon / material texture slots
5. Texture atlas inspect/replace pipeline (recolor, iris, validation)
6. Agent roles: inspector → texture → validation → injector

**Use for:** building *our* companion appearance from reference **sheets** into a legal original VRM — or customizing a base VRM you own/license.

**Do not use for:** extracting characters from Pass_Thru / JOI / SliceOfLife APKs.

## Character reference packs (user-supplied)

| Pack | Contents | Use |
|------|----------|-----|
| `VRM_Character_Reference_Sheet.zip` | T/A-pose, face, hair, hands, feet, bone guide | 2D design → 3D/VRM generation brief |
| `VRM_Character_Extras.zip` | Expression sheet, ear closeup, hair variants | Expression + style consistency |
| `vrm5.0wissentexturplacement.tar` | Full agent KB + Python tools | Automated texture placement / validation |

Store large binaries on Drive (`quest3-game/archives/`); keep docs + tool source on GitHub.

## Entity inventory (vertical slice)

| Entity ID | Type | Visual | Systems |
|-----------|------|--------|---------|
| `companion_01` | character | VRM avatar | proximity, dialogue, look-at |
| `prop_cup` | interactable | small GLB | grab, place, bond+ |
| `prop_vinyl` | interactable | small GLB | grab, toggle music |
| `prop_lantern` | interactable | small GLB | grab, toggle light |
| `room_01` | environment | room mesh / passthrough | collision, anchors optional |
| `player_rig` | XR rig | invisible / hands | teleport, snap, grab |

## Suggested agent pipeline (original character)

1. Lock art direction from reference sheets (silhouette, palette) — **new** character identity.
2. Produce or commission base body (VRoid / Blender / AI mesh) → export VRM 0.x or 1.0.
3. Run KB tools: inspect materials, map expressions, validate textures.
4. Optional: texture recipes / replace pipeline for skin/iris/hair consistency.
5. Load VRM in WebXR (`@pixiv/three-vrm`) or UniVRM / engine equivalent.
6. Wire to `CompanionEntity` systems from SYSTEMS_FROM_RE — no APK meshes.

## Engine loaders

| Target | Typical loader |
|--------|----------------|
| Three.js / WebXR | `@pixiv/three-vrm` |
| Unity | UniVRM |
| Godot | community VRM importer (verify) |
| Unreal | glTF + VRM plugin (verify) |

Browser FPS ≠ Quest FPS; budget materials/LODs for one companion on device.

## Rights

- VRM/glTF format knowledge = open specifications.
- Character sheets = project design refs unless another license is attached.
- Reference APK characters = analysis only, never ship.
