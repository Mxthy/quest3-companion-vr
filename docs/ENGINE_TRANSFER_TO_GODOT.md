# Engine-neutral function → Godot variant

## Rule

1. **Lock the behavior** (inputs, outputs, constraints, acceptance) in plain language or `INTERACTION_CONTRACT`.
2. **Map to Godot primitives** (nodes, signals, physics, animation) — do not line-translate Unity/Unreal/C#/R3F.
3. **Prefer stock** (XR Tools, OpenXR, SoftBody3D, AnimationTree) before custom solvers.
4. **Domain value** stays outside the XR/physics core (bond, phase, narrative).

GDScript is treated as a normal target language: agents implement *known* behavior in Godot style.

## Examples

### Grab / throw

| Neutral | Godot |
|---------|--------|
| Grip near object → hold → release with velocity | `XRToolsPickable` / physics-hand template; signals → DomainState |

### Body zones / contact intensity

| Neutral | Godot |
|---------|--------|
| Zones on body, scalar 0–1, peak event | `Area3D` (or shape queries) parented to `Skeleton3D` bones; intensity in Domain script; **no** second grab system |

### Soft / deformable prop

| Neutral | Godot |
|---------|--------|
| Soft toy deformation | Prefer simple: blend shapes / shader / few bones; `SoftBody3D` only if budget allows on Quest; document fallback |

### Animation understood as logic

| Neutral | Godot |
|---------|--------|
| State A→B, look-at, breath | `AnimationPlayer` / `AnimationTree` + code on skeleton; VRM via supported importer path |

### From WebXR / R3F prototype

| Neutral (already in web MVP) | Godot |
|------------------------------|--------|
| phase, held, bond, three props | Same domain names; XR via OpenXR+Tools not `@react-three/xr` |

## Forbidden transfer

- Pasting Unity XRI C# into `.gd` files
- Inventing APIs that “should exist” without Godot docs / XR Tools
- Claiming Quest performance of a SoftBody setup untested on device
