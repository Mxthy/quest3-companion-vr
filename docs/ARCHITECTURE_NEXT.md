# Architecture Beyond MVP

## Goal
Same companion loop as the desktop MVP, but structured so WebXR and later native engines share **one core**.

## Module map
```
core/                     # engine-agnostic TypeScript or C# mirror later
  PhaseController
  BondModel
  HoldInventory
  InteractableRegistry
  DialogueDirector
  CompanionProximity
  SaveRepository
  ContentLoader        # reads CONTENT_SPEC

adapters/
  desktop/             # current Three.js FPS controls
  webxr/               # XRSession, hands/controllers, teleport, snap
  native_unity/        # future
  native_godot/        # future

presentation/
  room/
  companion_vrm/
  props/
  ui_xr/
  audio/

content/
  CONTENT_SPEC.yaml
  dialogue/
  audio/
  models/              # vrm, glb – originals only
```

## WebXR feature target (next build tier)
| Feature | Priority | Notes |
|---------|----------|-------|
| immersive-vr session | P0 | HTTPS required |
| controllers grab | P0 | |
| hands if available | P1 | graceful fallback |
| teleport + snap turn | P0 | |
| world UI prompts | P0 | |
| VRM companion load | P1 | `@pixiv/three-vrm` |
| three props + anchors | P0 | |
| passthrough | P2 | browser/device dependent |
| desktop fallback | P0 | keep current controls |

## State machine (authoritative)
```
start --enter--> playing --pause--> paused --resume--> playing
playing --leave--> start
```
All interactables disabled unless `phase == playing`.

## Interfaces (contracts)
```ts
interface IInputAdapter {
  onGrab(targetId: string): void;
  onRelease(): void;
  onUse(): void;
  onTeleport(pos: Vec3): void;
  onSnapTurn(deltaDeg: number): void;
}
interface IDialogueView {
  show(line: string): void;
  clear(): void;
}
interface IAudioBus {
  play(cueId: string, pos?: Vec3): void;
  setMuted(m: boolean): void;
}
```
Core never imports Three/Unity APIs.

## Performance budgets (targets, measure later)
| Platform | FPS target | Companion | Draw calls (aim) |
|----------|------------|-----------|------------------|
| WebXR Quest Browser | stable 72 if possible | 1 VRM medium | < 80 |
| Native Quest 3 | 72/90 | 1 VRM + LODs | < 100 |

## Build agent rules
1. Prefer extending `core` + `adapters/webxr` over rewriting store logic.
2. Load content from YAML/JSON, not magic strings in mesh components.
3. One PR-sized milestone at a time (see VERTICAL_SLICE_BACKLOG.md).
