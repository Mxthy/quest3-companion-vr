# HANDOFF

**Updated:** 2026-09-19

## Priority doc
**`docs/BALANCED_SLICE.md`** + **`docs/FEATURE_BUDGET.yaml`**

Balance: Leistung · Inhalt · Spielbarkeit · Umsetzung. Sequence A→F, gates G0–G3.

## Backends
- GitHub: https://github.com/Mxthy/quest3-companion-vr
- Drive: `docs/DRIVE_AND_CONNECTORS.md`
- Wissensbasis MCP: zevra-vault-core (KnowledgeEntry)

## State
- `app/` = wired companion MVP (Grok workspace + Adult Core Phase 1), typecheck green
- Headless browser verification PASSED (scripts/verify-adult.mjs, ?debug=1 probe):
  18+ gate, walk, proximity, look=touch zones (breast_l), arousal idle->tease->hot->peak_build->orgasm->refractory,
  bond 3->13..16, Erregung HUD, zone dialogue from adult_interaction.yaml, zero console errors
- Adult core modules live in `src/core/adult/`, wired via `app/src/lib/companion/adult.ts`
- Zone anchors on Elara placeholder, arousal HUD, 18+ gate, toy stub `toy_wand`

## Do next (stable path)
1. Phase 2: VRM Vivi + bones -> zones (keep placeholder fallback)
2. Measure Soft-Loop FPS WITH adult loop active on user machine (Gate G0 re-check)
   (headless browser proxy verified; not a native Quest metric)
3. Only then next feature per FEATURE_BUDGET (VRM Vivi, WebXR tier) — one at a time if FPS tight
4. Kill switches in FEATURE_BUDGET if unstable

## Resume
README → app/README.md → BALANCED_SLICE → FEATURE_BUDGET → PROTOTYPE_ACCEPTANCE_TESTS
