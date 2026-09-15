# VRM Knowledge Index (for build agents)

## Canonical format doc
- Full binary + humanoid + expression + MToon reference: project file `VRM_REVERSE_ENGINEERING.md` (user attachment; mirror under Drive archives if needed).
- Package: `vrm_agent_kb_v5/` from `vrm5.0wissentexturplacement.tar`

## KB structure (v5)
```
vrm_agent_kb_v5/
  knowledge_base/
    vrm_core/           # GLB layout, master RE
    materials_and_textures/  # MToon
    texture_generation/ # recipes, ontology
    validation/         # acceptance checks
    agent_specs/        # roles + task contracts
    recipes/
  tools/                # texture_replace, atlas_inspector, expression_mapper, ...
  bin/run_pipeline.py
  templates/            # TASK, RUN_SPEC, AGENT_PROMPT
```

## Agent roles (pipeline)
1. **inspector-agent** – parse VRM, images, materials, expressions
2. **texture-agent** – classify, recolor, synthesize (e.g. iris), metadata
3. **validation-agent** – dimensions, alpha, stats, gate
4. **injector-agent** – replace image payload, rebuild VRM, report

## glTF/VRM essentials (cheat sheet)
- File = GLB: 12-byte header (`glTF`, version 2, length) + JSON chunk + BIN chunk
- Nodes = hierarchy; skins = joints + inverseBindMatrices
- Humanoid map (VRM 0.x): hips, spine, chest, neck, head, limbs, fingers…
- Expressions: presets (blink, A/I/U/E/O, joy…) → morph target binds
- Pivot: feet on Y=0, character ~1.4–1.6 m height typical
- VRM 0.x: `extensions.VRM`; VRM 1.0: `VRMC_vrm`, `VRMC_springBone`, `VRMC_materials_mtoon`

## Integration with companion vertical slice
See `docs/ASSETS_ENTITIES_AND_VRM.md`.

## Not in scope
- Do not treat APK Unity/Unreal character bundles as VRM sources.
