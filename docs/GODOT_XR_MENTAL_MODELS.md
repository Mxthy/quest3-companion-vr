# Godot XR – Mental Models (for agents)

Goal: **understand official patterns**, then adapt. Do not invent parallel grab/locomotion systems.

## 1. Session & origin

- `XROrigin3D` = play-space root (not the player body alone).
- `XRCamera3D` + `XRController3D` are **tracked**; you do not freely `position` them like normal nodes for room-scale truth.
- Virtual locomotion moves **origin or a CharacterBody parent**, not by faking HMD pose.

Character-body-centric idea (official demos): physical walk updates body toward camera; stick movement is normal CharacterBody motion. See Godot demo `openxr_character_centric_movement`.

## 2. XR Tools mental model

| Concept | Role |
|---------|------|
| PlayerBody | Helper on origin for collision/movement integration |
| Function nodes | Children of controllers (move, teleport, pickup, …) |
| Pickable | Object that can be grabbed; physics layers matter |
| Physics layers | Static / Dynamic / Pickable / Player Hands / Held / … – mis-layer = “works in editor, broken on device” |

Prefer **composing** function scenes over rewriting `_process` grab raycasts from scratch.

## 3. Grab (what “same in every game” means)

Typical pipeline (XR Tools / physics templates):

1. Detect hover / overlap / pose near grabbable
2. On grip: attach or joint or reparent collision to hand proxy
3. While held: hand is **kinematic** authority; object follows constraint
4. On release: restore dynamic body, apply release velocity

Physics-hand variants (godot4-vr-physics-template): hand anchor uses `move_and_slide` so the hand **cannot tunnel walls**; pickups reparent collision shapes to the hand.

**Agent rule:** If product only needs “grab cup / throw”, use XR Tools pickable path. If product needs “hand collides with world and objects realistically”, study physics-template pattern and **extend**, don’t mix both blindly.

## 4. Hand tracking vs controller

- Controllers: `/user/hand/left` style trackers via `XRController3D`
- Optical hands: hand trackers `/user/hand_tracker/left|right` + skeleton mapping to Godot humanoid hand bones
- Meta samples add vendor extensions; enable matching OpenXR project settings

Don’t assume controller grip code equals finger pinch without an interaction profile.

## 5. Where product value lives (beyond the library)

Libraries already solve: track, grab, teleport, basic UI quad.

**Your value** (Elara / companion):

- Game state: phase, bond, held item ids, soft contact zones as **data**
- Reactions: audio, animation weights, save — on signals `picked_up` / `dropped` / contact events
- Content: room, props, VRM, narrative — not a second physics engine

Pattern:

```text
[XR Tools / OpenXR] → signals / held body
        ↓
[Your domain layer] → bond, intensity, quests, save
```

## 6. Anti-patterns

- Reimplementing grab in 200 lines when Pickable exists
- `new` allocations every frame for XR poses
- Driving HMD with gameplay code instead of origin/body
- Copying Unity XRI C# names into GDScript
- Treating WebXR R3F component trees as Godot scene trees 1:1
