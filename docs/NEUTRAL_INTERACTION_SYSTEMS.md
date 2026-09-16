# Neutral Interaction Systems (Collider + State)

Content-agnostic gameplay systems. No narrative policy in code paths.

## Modules (`src/core/interaction/`)

| File | Role |
|------|------|
| `IntensityModel.ts` | Float 0–100, bands, decay, peak event, cooldown |
| `ColliderZones.ts` | Named sphere colliders, query from world points |
| `TrackingProxy.ts` | Capsule from HMD height + yaw |
| `ContactController.ts` | Wires zones + proxy + intensity + events |

Legacy paths under `src/core/adult/` remain for compatibility; **new work uses `interaction/`**.

## Frame loop
```
if phase != playing: optional decay only
hmd = viewer or camera
hands = controller or cursor world points
update zone positions from avatar skeleton
out = contactController.tick({ hmd, handPoints, holding, burstPressed, impulsePressed, progress, dt, extraTargets })
if out.proxy: place debug/proxy mesh at out.proxy.base with out.proxy.orientation
on events: optional UI lines / blendshape weights from expressionWeights()
```

## Inputs
- `holding` ← grip / key
- `burstPressed` ← trigger edge
- `impulsePressed` ← short impulse on selected zones
- `progress` ← soft progression unlock (bond or 0)

## Outputs
- `intensity.value` / `band`
- `activeZone`
- `proxy` pose for mesh
- events: zone_enter/exit, hold_*, band, peak, impulse

## Avatar zone ids
head, face, chest_l, chest_r, torso, hip_l, hip_r, back_l, back_r, thigh_l, thigh_r, center, hand_l, hand_r

## WebXR
Prefer `local-floor`. Same controller for desktop (camera as hmd).
