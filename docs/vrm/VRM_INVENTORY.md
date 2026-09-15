# VRM Inventory

## Pack: vivi.vrm..ZIP (user upload, 2026-09-16)

**Storage:** User attachment / local extract; prefer Drive `quest3-game/archives/` for persistence (not committed to git – binary size).

| File | Size (approx) | Role |
|------|----------------|------|
| `DCs_Vivi_nude_v01.vrm` | ~14 MB | **Primary runtime avatar** (VRM 0.x) |
| `DCs_Vivi_nude_v01.vroid` | ~36 MB | VRoid Studio source |
| `DCs_Vivi_nude_v01_MMD/` | PMX + textures | MMD export |
| `readme.txt` | tiny | Author note |

## Parsed VRM meta (from binary)

| Field | Value |
|-------|--------|
| Format | GLB / glTF 2.0 |
| Extensions | `VRM` (0.x), `KHR_materials_unlit` |
| Title | `DCs_Vivi_nude_v01` |
| Author (meta) | `yomox9` |
| allowedUserName | Everyone |
| violent usage | Allow |
| sexual usage | Allow |
| commercial usage | Allow |
| Structure | ~123 nodes, 3 meshes, 14 materials, 26 images |
| Features | humanoid, blendShapeMaster, secondaryAnimation, firstPerson, materialProperties |

## Product / rights policy

1. **Tech prototype:** Allowed to load this VRM to prove companion pipeline (`@pixiv/three-vrm`, UniVRM, etc.).
2. **Content tone:** Filename and model are **nude/adult**. Only use as on-screen companion if product owner explicitly accepts adult scope for the slice; otherwise use placeholder mesh or a clothed VRM.
3. **Shipping / store:** Re-verify original distribution license (Booth/etc.) even if VRM meta says Allow. Keep attribution to `yomox9` where required. Do **not** claim the mesh as project-original IP.
4. **APK rule unchanged:** Never replace this with characters extracted from reference game APKs.

## Integration target

- Entity id: `companion_01` (see CONTENT_SPEC / ASSETS_ENTITIES_AND_VRM)
- Loader (Web): `@pixiv/three-vrm`
- Hook expressions: blink / talk from CONTENT_SPEC `expression_hooks`
- Scale: ~1.55 m height target; feet on y=0

## Related project docs
- `docs/vrm/VRM_KB_INDEX.md` – format + agent texture pipeline
- `docs/ASSETS_ENTITIES_AND_VRM.md` – entity architecture
- Character reference sheets (separate zips) – design refs for *original* characters if replacing this mesh later
