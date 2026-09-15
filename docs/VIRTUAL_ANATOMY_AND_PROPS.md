# Virtual Anatomy, Character Contact & Props

## Virtual P (player)

**Source of truth:** headset pose only (`local-floor` when possible).

| Derived | Rule |
|---------|------|
| Eye height | HMD `position.y` (clamped ~1.0–2.1 m) |
| Scale | `eyeHeight / 1.65` clamped 0.85–1.2 |
| Hip | Same XZ as HMD, `y = eyeHeight * 0.55` |
| Facing | Horizontal forward from HMD quaternion (pitch ignored) |
| Shaft base | Hip + forward * 0.12 * scale + small up offset |
| Shaft tip | Base + forward * length |
| Length / radius | 0.16 m / 0.025 m at ref scale |

Code: `src/core/adult/VirtualAnatomy.ts`  
Mesh transform helper: `src/presentation/adult/PlayerAnatomyView.ts`

## Character / model interactions

1. **Hand touch** – existing `AdultInteractionController` + body zones on VRM bones.  
2. **Shaft vs zones** – `IntimateContactSystem` tests capsule (base→tip) against zone spheres (mouth, breast, groin, glute, …).  
3. **Effect** – contact raises arousal faster; events drive dialogue (`shaft_zone_*`) and VRM expressions.  
4. **Props** – sockets on toys/surfaces also tested against shaft.

Code: `src/core/adult/IntimateContact.ts`

## Props that fit the game

| Kind | IDs | Role |
|------|-----|------|
| Soft slice | cup, vinyl, lantern | Bond / room fantasy |
| Adult | toy_wand, toy_ring, pillow_soft, lube_bottle | Grab + socket contact |
| Character sockets | mouth, groin, breasts, glutes | Accept hand / shaft / toy |

Catalog: `content/props_adult.yaml`

Meshes are placeholders — use simple cylinders/capsules until final GLB art.

## Frame loop (presentation)
```text
1. Read HMD (or camera) pose
2. anatomy = computeVirtualAnatomy(hmd)
3. Update VRM bone → zone positions
4. Build PropSocket list from grabbed/placed adult props
5. out = IntimateContact.tick({ hmd, zones, props, hands, dt, bond })
6. Apply shaft mesh transform from out.anatomy
7. On out.pleasure events → audio / lines / expressionWeights
8. Soft prop interact remains on parallel input path
```

## WebXR notes
- Prefer `referenceSpace: local-floor` so y=0 is floor and eye height is correct.
- If only `local`, calibrate eye height once (user stands, press calibrate).
- Controllers still feed hand zones; shaft is HMD-driven body proxy.
