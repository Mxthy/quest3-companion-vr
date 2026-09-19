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

## Phase 2 status (2026-09-19/20)
- vrm-companion.tsx: loads /models/vivi.vrm via @pixiv/three-vrm; falls back to Elara
  when the file is 404/invalid (verified headless: full arousal curve still passes).
  Zone anchors = detached Object3Ds refreshed per frame from humanoid bone world poses
  (ZONE_BONES map, offsets in bone space). Idle: A-pose arms, spine breathing, head tracks player.
- Spank path verified headless: teleport behind + pitch aim -> glute_l, Q -> spank
  dialogue "Unverschamt. Mach weiter.", 0 console errors.
- vivi.vrm (DCs_Vivi_nude_v01) placed at app/public/models/vivi.vrm (gitignored,
  binary->Drive rule): VRM path ACTIVE and verified on the real rig 2026-09-20
  (orgasm reached via breast zones, spank on glute_r, 0 console errors).

## Do next (stable path)
1. User-side FPS re-check (Gate G0) WITH Vivi loaded - VRM adds ~14MB mesh+tex cost
2. Then Phase 3 per CONTENT_SPEC (toys/props wiring)
2. Measure Soft-Loop FPS WITH adult loop active on user machine (Gate G0 re-check)
   (headless browser proxy verified; not a native Quest metric)
3. Only then next feature per FEATURE_BUDGET (VRM Vivi, WebXR tier) — one at a time if FPS tight
4. Kill switches in FEATURE_BUDGET if unstable

## Resume
README → app/README.md → BALANCED_SLICE → FEATURE_BUDGET → PROTOTYPE_ACCEPTANCE_TESTS
