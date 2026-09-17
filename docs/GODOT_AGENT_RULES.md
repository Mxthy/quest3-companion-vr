# Godot Agent Rules (Fable / Astra / local)

## Role

You implement **Quest 3 OpenXR** features in **Godot 4.6+** using GDScript and official XR patterns.
You do **not** invent Unity C# APIs or WebXR-only APIs inside Godot.

## Allowed sources

1. `docs/GODOT_POC_SOURCES.md` listed repos (MIT/CC only)
2. Official Godot XR docs (OpenXR, locomotion, hand tracking)
3. This repo’s `docs/INTERACTION_CONTRACT.yaml` and `docs/godot_poc/` when present
4. User-owned glTF/VRM assets

## Forbidden

- Decompiling Quest Store / itch commercial APKs
- Copying large third-party project trees into production without license entry in `THIRD_PARTY.md`
- Mixing Unity XRI / Meta Interaction SDK C# into Godot scripts
- Claiming WebXR frame-time numbers as native Quest performance

## Workflow per feature

1. **Spec first** – 5–15 lines: inputs, distances, acceptance test
2. **Map to PoC folder** – e.g. `docs/godot_poc/04_grab_throw/`
3. **Minimal scene** – one scene, one script if possible
4. **Accept** – user or device test checklist passes
5. **Only then** integrate into the main game scene

## Coding style

- Godot 4 typed GDScript where practical
- Prefer XR Tools nodes when they match the PoC; do not reimplement grab from scratch unless Physics Template pattern is required
- Physics layers: follow XR Tools naming (Static World, Pickable, Player Hands, …)
- No allocations in hot paths beyond engine norms; keep movement in `_physics_process`

## Output format when reporting

```
STATUS:
POC: <id>
SOURCE: <repo + path>
LICENSE: MIT|CC0|…
DONE:
- …
ACCEPTANCE:
- [ ] …
NEXT:
- …
```
