# Godot allowed API surface (agents)

Use only documented Godot 4 + OpenXR + XR Tools patterns. If an API is not listed and not in the **pinned lab** project, do not invent it — ask.

## Core XR

- `XRServer`, `XRInterface` / OpenXR via `XRServer.find_interface("OpenXR")`
- `XROrigin3D`, `XRCamera3D`, `XRController3D`, `XRNode3D`
- Viewport: `use_xr`, project OpenXR settings (hand tracking extensions as needed)
- Action map: OpenXR action map resource (project), not hardcoded magic strings without map

## Body / movement

- `CharacterBody3D`, `move_and_slide`
- XR Tools: `PlayerBody`, movement function scenes (direct, teleport, turn) as in installed addon
- Do **not** invent `XRPlayer.teleport_to()`-style helpers unless they exist in your lab addon

## Physics / grab

- `RigidBody3D`, `StaticBody3D`, `AnimatableBody3D`, `Area3D`, `CollisionShape3D`
- XR Tools pickable / function pickup scenes and their **real** signals from the installed version
- Optional: physics-hand pattern from `godot4-vr-physics-template` (CharacterBody hand anchor)
- Layers: use names from `INTERACTION_CONTRACT.yaml` / XR Tools demo

## Skeleton / zones / animation

- `Skeleton3D`, bone attachment / `BoneAttachment3D`
- `AnimationPlayer`, `AnimationTree`
- `Area3D` (or shape queries) for contact zones — intensity in **domain** script
- SoftBody3D only if contract `softbody_default` allows and perf budget OK

## Domain (preferred home for game logic)

- Autoload / plain `Node` scripts: phase, bond, held id, save
- Signals / EventBus between XR layer and domain
- **No** grab math inside domain

## Explicitly disallowed (hallucination magnets)

- Unity: `XRInteractionManager`, `XRGrabInteractable`, C# XRI
- WebXR/R3F: `useXR`, `useFrame`, npm packages inside `.gd`
- Fake APIs: `xr.grab_object()`, `QuestAPI.*`, `MetaSDK.Grab()` in GDScript without a real Godot binding in lab
- Random bone names not in contract / asset manifest

## When unsure

```text
QUESTION: <what is missing from contract or lab>
STOP: no code for that part
```
