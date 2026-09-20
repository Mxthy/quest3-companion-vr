# HANDOFF

**Updated:** 2026-09-20 (2)

## Priority doc
**`docs/BALANCED_SLICE.md`** + **`docs/FEATURE_BUDGET.yaml`**

Balance: Leistung · Inhalt · Spielbarkeit · Umsetzung. Sequence A→F, gates G0–G3.

## Backends
- GitHub: https://github.com/Mxthy/quest3-companion-vr
- Drive: `docs/DRIVE_AND_CONNECTORS.md`
- Wissensbasis MCP: zevra-vault-core (KnowledgeEntry)

## State
- **XR immersive mode LIVE on Pages (2026-09-20 abends)** — VR button (VR-capable browsers only),
  hands via frame.getJointPose (index-tip zone hit-test, generous radii, pinch=grab),
  controllers (squeeze=grab, trigger=touch+burst), snap-turn locomotion (30 deg) + thumbstick move,
  in-VR HUD (world-space, Billboard). Adapter isolation per platform-adapters: ONLY
  `app/src/components/companion/xr-vr.tsx` touches WebXR; sim channel = adultRuntime.xrTouchPoints (plain Vec3).
- Sim layer three.js-free: anchors registry moved to adapter (`adult-anchors.ts`), playerSim plain {x,y,z},
  experience/elara/vrm-companion now write via adapter registry
- `npm run assets` offline GLB pipeline (raw-assets/ -> public/models/, dedup/weld/prune/resample/meshopt,
  KTX2 wenn toktx verfuegbbar, 100k-Tris-Budget-Warnung, VRM roh)
- Desktop parity verified on prod: verify-adult + verify-spank green, arousal curve bit-identical
  to pre-refactor (86 peak_build @ 10 bursts, bond 16). Hand visuals (XRHandModel) + KTX2 deferred.
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


## Deployment (2026-09-20)
- LIVE: https://quest-companion-dif.pages.dev (Cloudflare Pages, project quest-companion,
  account 2115ac9b105867afb7dc06c60d47f112). Full regression green in prod:
  18+ gate, walk, breast zones -> orgasm (burst 10), HUD; one cosmetic 404 (TBD).
- Build: `NITRO_PRESET=cloudflare_pages npm run build` in app/ (vite.config.ts preset
  now env-overridable, default vercel untouched). Deploy: `npx wrangler pages deploy dist
  --project-name=quest-companion --branch=main` (wrangler now a devDependency).
- Tokens (Cloudflare): Base44-Deploy (Workers/Pages/KV/Routes write, account-scoped;
  zone rights to add later when a zone exists). Stored as CLOUDFLARE_DEPLOY_TOKEN in
  agent secrets. The broad admin token is NOT in the repo.
- Agent rule active: check zevra-vault-core MCP before any code change
  (.agents/rules/check-vault-before-code.md). Vault currently EMPTY on
  nitro/cloudflare-deploy/webxr-performance - gap to backfill.


## Roadmap-Pivot (2026-09-20, Eva)
- ENDFZIEL: Unity 6 + OpenXR + Multiview als natives Quest-APK (siehe Vault
  life-vibe/quest/unity-openxr). WebXR-App = austauschbare Demo.
- Architektur verbindlich (Vault life-vibe/architecture/platform-adapters):
  geteilte Simulations-Kern (Arousal, Zonen, Dialog, Bond, Events) OHNE three.js/XR-Imports
  in src/core/; Rendering/Input in Adaptern (clients/webxr spaeter clients/unity).
  Gameplay konsumiert InputActions, nie rohe Controller-APIs.
- Reihenfolge: (1) Core-Refactoring + WebXR-Immersive-Modus im Demo-Client,
  (2) G0-FPS-Gate neu als immersive Messung, (3) Assets ueber GLB-Pipeline
  (KTX2/Meshopt/LOD, Quest-Budgets), (4) Unity-Scaffold als eigenstaendiger Client.
- AAA-Assets: Agent kann prozedurale/stilisierte Welt + Beleuchtung bauen; photorealistische
  AAA-Assets muessen geliefert oder lizenziert werden (Unity Asset Store / Fab / Meta), dann
  durch die GLB-Pipeline. VRM bleibt Companion-Format (Bone-Identitaet = Asset-Identity).
