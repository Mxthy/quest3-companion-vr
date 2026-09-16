# Textures & Toys

## Approach (KB-aligned)

From Wissensspeicher `textures/*`:
- **Procedural first** (canvas / noise) for MVP – no binary bulk in git
- Later: export PNG → optional **KTX2 / Basis** for Quest (`ktx2-basis-transcoding`)
- PBR channels: albedo via map, roughness/metal as scalars for now

## Files

| Path | Role |
|------|------|
| `integration/companion/drop-in/propTextures.ts` | ceramic, vinyl, paper, silicone, fabric, glass |
| `integration/companion/drop-in/toys.tsx` | Cup/Vinyl/Lantern textured + wand/ring/pillow/lube |
| Imagine albedos (chat) | Art direction reference; bake into canvas or replace maps |

## Soft props palette
Warm plaster `#e8ddd0`, wood amber, paper lantern, vinyl label “ATELIER”.

## Toys (props_adult.yaml)
| id | Mesh helper |
|----|-------------|
| toy_wand | `ToyWandMesh` |
| toy_ring | `ToyRingMesh` |
| pillow_soft | `PillowMesh` |
| lube_bottle | `LubeBottleMesh` |

## Wire
1. Copy `propTextures.ts` + `toys.tsx` into app `src/components/companion/`
2. In Scene: `<ToyInteractables />`
3. Extend store `HeldId` + `interact()` for new ids (optional grab)
4. Soft: swap CupMesh → CupMeshTextured in interactables

## Quest note
When shipping: bake canvas → PNG 512 → KTX2 UASTC; load via KTX2Loader.
