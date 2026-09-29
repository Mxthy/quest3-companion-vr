# CHANGELOG

## 2026-09-29 (1)
- Native hand-tracking sensing gate: XR_EXT_HAND_TRACKING in enabledExtensions + PFN-Loader
  (xrCreateHandTrackerEXT / xrLocateHandJointsEXT) im OpenXR-Bootstrap; Oculus HAND_TRACKING
  Permission + uses-feature (required=false) im Manifest
- contact_sampler.h/.cpp: 17 BodyRegions, Tap/Hold/Stroke/Grab/Push-Klassifikation,
  Penetration-Intensitaet, per-Hand-Zone-Tracking, Event-Queue; sensing-only (keine Logik)
- main.cpp: JNI_OnLoad cached ContactBridge-Klasse, Frame-Loop wired
  (SampleHandJoints → Sampler.Update → PollEvent → JNI Push, "(IFFJ)V");
  Session-Gate fehlt noch → Sampling zur Laufzeit inaktiv bis XrSession existiert
  (kompiliert und APK-geci, nicht als "laufend" gemeldet – Bootstrap-Disziplin)
- Java ContactBridge (com.zevra.questcompanion): Listener-Registry als Gegenstelle
- TS-Seite: ContactController.dispatchNativeContact (beide Core-Kopien),
  integration/companion/drop-in/native-contact-bridge.ts mit BodyRegion-Mirror,
  interpretTouch (comfort/attention/tap_directive/hold_comfort/neutral),
  Region→ZoneId-Mapping + installNativeContactGlobal()

## 2026-09-20 (3)
- XR immersive mode live: VR-Button im Overlay, XR-Adapter (xr-vr.tsx) als einzige WebXR-Schicht
  (platform-adapters-Kontrakt), Hand-Pinch=Grab + Fingerspitzen-Hit-Test, Controller-Squeeze/Trigger,
  Snap-Turn-Locomotion, In-VR-HUD; Sim-Layer three.js-befreit (Anker-Registry, playerSim plain)
- Asset-Pipeline npm run assets (offline-Backen, Meshopt, 100k-Tris-Budget)
- Desktop-Paritaet: verify-adult/verify-spank gruen auf Prod, Kurve bit-identisch zum Prae-Refactor
- Hand-Visuals (XRHandModel) + KTX2-Texturen aufgeschoben (Toktx fehlt in Sandbox; Modell-GLTF via CDN)

## 2026-09-20 (2)
- Deployed to Cloudflare Pages (quest-companion-dif.pages.dev), live regression green incl. orgasm
- vite.config: NITRO_PRESET override, wrangler devDep, verify-adult.mjs Q3_BASE param
- Agent rule: vault-check-before-code; separate deploy token Base44-Deploy created
- vivi.vrm activated: VRM path verified end-to-end on real rig (arousal->orgasm on breast zones,
  spank on glute_r, 0 console errors); binary stays on Drive, public/models/ gitignored
- Phase 2 scaffold: @pixiv/three-vrm loader + bone-based zone anchors with Elara fallback (typecheck green, fallback regression passed)
- Spank verified headless: glute zone + Q -> YAML spank dialogue, 0 errors (verify-spank.mjs, debug teleport probe)
- Headless browser verification of adult wiring PASSED: 18+ gate, walk/proximity,
  look=touch zones, arousal curve to orgasm + refractory, bond gains, HUD, YAML dialogue
- app/scripts/verify-adult.mjs (Playwright) + ?debug=1 store probe added
- Wired Adult Core Phase 1 into companion MVP (from Drive grok-workspace.zip)
- app/: full MVP tree in repo (src, content, scripts, server, migrations)
- Adult core from src/core/adult/ wired via app/src/lib/companion/adult.ts
- Zone anchors on Elara, arousal HUD, 18+ gate, toy stub toy_wand
- Typecheck green; adult zone/HUD verification in preview pending
- Updated TASK_STATE, HANDOFF, STATUS_NOW, REPO_INDEX, README

## 2026-09-14
- Created private GitHub repo Mxthy/quest3-companion-vr
- Created Drive folder quest3-game + subfolders apks, state, reports, archives
- Defined storage policy (GitHub = text, Drive = binaries)
- Dialer excluded earlier
- Ready to push governance and start pilot APK analysis
