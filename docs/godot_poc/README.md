# Godot PoC Skeleton

**PoC = Proof of Concept** = small, isolated, testable Godot scene + script that proves one interaction idea works on Quest (or desktop OpenXR), before it enters the full game.

## Who builds what

| Step | Who | What |
|------|-----|------|
| Catalog (this folder) | Grok / docs | Structure + source list |
| Spec for one PoC | You or Architect agent | Acceptance criteria |
| Implement scene/script | Fable / Astra / you | Minimal GDScript + `.tscn` |
| Device check | You on Quest 3 | FPS, grab feel, comfort |
| Promote to game | After pass | Wire into main project |

Nothing here is “done” until acceptance is checked on device (or explicit desktop OpenXR pass).

## Folders (fill one at a time)

```
01_session_start/     # OpenXR on, foveation, action map
02_player_body/       # PlayerBody / CharacterBody-centric move
03_locomotion/        # direct, teleport, snap turn, comfort
04_grab_throw/        # pickable, physics hand, no wall clip
05_two_hand/          # two-hand constraints
06_hand_tracking/     # OpenXR + Meta sample patterns
07_world_ui/          # Viewport2Din3D / laser UI
08_export_quest/      # Android export, vendors plugin notes
```

Each folder should eventually contain:

- `SPEC.md` – goal, inputs, acceptance checklist
- `NOTES.md` – source repo + license + what was adapted
- optional: `snippet.gd` or link to lab project path

## Validation (how “prüfen” works)

1. **Concept check (paper)** – Does the SPEC match INTERACTION_CONTRACT and product goal? (cheap, before coding)
2. **Editor check** – Scene runs in Godot editor / XR simulator without errors
3. **Device check** – Quest 3: feature works, no nausea-critical bugs, frame budget OK for that scene alone
4. **Integration check** – Still OK when combined with previous PoCs

Agents propose; **you** (or a fixed test script on device) confirm pass/fail. Agents cannot replace headset feel tests.

## Suggested order

1 → 2 → 3 → 4 → 6 → 5 → 7 → 8

Start lab from: `godot-xr-template` + `godot-xr-tools`.
