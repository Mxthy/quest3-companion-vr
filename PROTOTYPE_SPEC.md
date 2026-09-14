# PROTOTYPE_SPEC.md – Equivalent Minimal XR Prototype

**Goal:** Same feature set on Unity, Godot, and Unreal so comparison is fair.  
**Not in scope:** Full game world, production art, networking, IAP.

## Common functional requirements

Each prototype **must** include:

1. Quest 3–oriented XR scene (OpenXR or Meta XR path)
2. Head tracking + controller tracking
3. At least one **hand interaction** path (hand tracking preferred; controller fallback OK)
4. **Grab and release** of a grabbable object
5. Simple **world-space or panel UI** (e.g. toggle label / button)
6. **Companion placeholder**: non-player entity (primitive or simple rig) that can face user or play idle
7. **Audio**: one spatial or stereo voice/sfx source triggered by interact
8. Scene with **exactly three interactive objects** (grab or press)
9. **Optional** passthrough toggle or passthrough layer if engine supports it in ≤0.5 day effort
10. **Android ARM64** export / APK side-loadable to Quest 3

## Equalization rules
- Same interaction count and object count
- Same approximate visual complexity (unlit/simple lit primitives)
- No marketplace packs that one engine cannot match cheaply
- Document any feature that could not be equalized as `deviation`

## Per-engine notes

### Unity
- Prefer **Unity 6 LTS or 2022 LTS** + **Unity OpenXR** + XR Interaction Toolkit
- Optional Meta XR SDK only if needed for passthrough/hands within timebox
- IL2CPP ARM64 build

### Godot
- Godot 4.x + OpenXR
- GDScript preferred for agent edits (C# optional)
- Export Android ARM64 with OpenXR enabled

### Unreal
- UE5.x + OpenXR / Meta XR plugin as appropriate
- Blueprint-first for prototype speed; minimal C++
- Package Android ASTC ARM64

## Timebox
- Target: **≤ 1 working day** per engine to first installable APK
- If blocked >4 hours on one feature, mark `blocked` and ship without that optional item

## Deliverables per engine
- Source under `new-game/prototypes/<engine>/`
- Built APK path documented
- `prototype_notes.md` (deviations, versions, build flags)
- Filled metrics section in PROTOTYPE_ACCEPTANCE_TESTS.md

## Success for M3→M4 transition
At least **one** engine completes the required set; ideally two for comparison. Third can be deferred if risk already clear.
