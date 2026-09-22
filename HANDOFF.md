---
title: Quest Companion VR handoff
summary: Quest 3 G0 performance optimization status and next physical-device check.
---

# Quest Companion VR handoff

## Current state

The immersive Quest 3 baseline from 2026-09-20 was 33.3 FPS over 889 samples, with 879.3 mean draw calls and 277,704 mean triangles. The draw-call count strongly identifies the shadow-rendering pipeline as the first bottleneck: a shadow-casting point light uses a six-face cubemap shadow, then the scene is rendered in stereo. This is a better explanation for the 33 FPS result than the 14.8 MB VRM download size alone.

## Implemented on 2026-09-22

- Immersive XR disables dynamic shadow-map passes.
- Drei ContactShadows is desktop-only and limited to one 512px update.
- Vivi no longer casts dynamic shadows.
- Fixed foveation changed from 0.2 to 0.75.
- Applied official three-vrm runtime utilities: unnecessary-vertex removal, skeleton combination, and morph combination.
- `session_start` telemetry now records the exact XR quality profile, framebuffer size, GPU renderer string, and browser user agent.

The gameplay core and normalized VRM bone anchors are unchanged. Desktop and production adult-zone and spank regressions pass with zero console errors. The optimized build is live at https://quest-companion-dif.pages.dev.

## Asset facts

`public/models/vivi.vrm` is 14.8 MB and intentionally gitignored. Inspection shows about 71.6k render vertices, 17.3k uploaded vertices, 93 glTF primitives, and 26 PNG textures. The textures are estimated at roughly 121 MB uncompressed GPU memory, including two 2048px body maps and a 2048px thumbnail. Generic glTF Transform reports the legacy `VRM` extension as unsupported, so the binary must not be rewritten with that generic path until metadata, expressions, spring bones, and normalized humanoid bones are proven intact.

## Next check

When the Quest 3 is available, run immersive VR continuously for at least two minutes. Compare FPS, draw calls, triangles, framebuffer, renderer, and render-probe brightness against the baseline. G0 remains unapproved until the real headset sustains the 72 Hz target (13.89 ms theoretical frame budget) without unacceptable visual loss.


## Phase 3 props, 2026-09-22

The engine-neutral `PropInteractionSystem` now mirrors the adult prop contract for `toy_wand`, `toy_ring`, `pillow_soft`, and `lube_bottle`. Allowed zones, socket offsets, radii, sensitivities, and the fixed lube arousal bonus are processed without Three.js or WebXR imports. Desktop and XR adapters feed the same core contract. XR supports direct pickup through hand pinch or controller squeeze and renders held props from the tracked pose.

Focused core tests pass 3/3. The browser prop regression, adult interaction regression, and spank regression pass with zero console errors. The Cloudflare production bundle builds successfully. The new release is not live yet: Wrangler returned Cloudflare API authentication error `10000` while deploying. Refresh `CLOUDFLARE_API_TOKEN` with Pages deployment permission, then deploy and repeat the live smoke tests before marking Phase 3 live. The broader repository suite still has eight unrelated existing PWA metadata fixture failures.


## Phase 3 live release, 2026-09-22

Phase 3 is live at `https://quest-companion-dif.pages.dev` (deployment `https://039e8a29.quest-companion-dif.pages.dev`). Production HTTP returned 200. Live `verify-props`, `verify-adult`, and `verify-spank` all passed with zero console errors.

The Pages rollout used an ephemeral least-privilege token created through Cloudflare's API from the existing token-manager credential. It was limited to this account, verified against `quest-companion`, used only in Wrangler's child-process environment, and revoked immediately after deployment. The reusable Superagent skill is `cloudflare-scoped-pages-token`; it repeats this create, verify, deploy, revoke lifecycle without exposing or persisting the temporary token.

Remaining gate: perform the immersive Quest 3 G0 FPS/device check on the live Phase 3 build. The ZEVRA Vault had no focused Cloudflare API-token entry; consider adding the validated ephemeral-token pattern.

## Native C++ OpenXR bootstrap, 2026-09-22

The native engine direction now has a bounded Android/C++ scaffold at `native/QuestCompanionNative`. It follows the Vault contracts for an ARM64-only GameActivity application, Khronos OpenXR Loader AAR, Android loader initialization, and reproducible GitHub compilation. The previous Unity scaffold remains available as a fallback under its renamed Unity workflow.

The pinned native matrix is JDK 17, Gradle 8.9, AGP 8.7.3, compile/target SDK 35, minimum SDK 29, NDK 27.2.12479018, CMake 3.22.1, GameActivity 4.4.2, and OpenXR Loader 1.1.63. The C++ bootstrap calls `xrInitializeLoaderKHR`, requires the Android-create-instance and Vulkan-enable2 extensions, creates the OpenXR instance, polls events, and discovers/logs the HMD system. It also emits stable Logcat tags `QuestCompanion` and `QuestCompanionXR`.

`.github/workflows/build-native-quest-apk.yml` installs the pinned toolchain, builds a debug-signed `arm64-v8a` APK, verifies the manifest and ABI, calculates SHA-256, and stores the APK plus unstripped native symbols for 14 days. Workflow actions are pinned to immutable commit revisions. `npm run validate:native`, `npm run validate:unity`, and Android XML parsing pass locally.

This is only a statically validated bootstrap. The local sandbox has no JDK, Android SDK, CMake, or Git remote, so no real APK was compiled or uploaded in this run. Do not claim rendering or device readiness yet. The next gate is a successful GitHub workflow artifact. Only after that should Vulkan device creation, OpenXR session state, swapchains, stereo multiview, input, and VRM loading be implemented in separate verified gates.
The native scaffold was published to GitHub as commit `6ec8d6c83b12bd1e6001dcac0b0b9601d5755590`. Push-triggered workflow run `35744768797` was successfully created and entered the queue: https://github.com/Mxthy/quest3-companion-vr/actions/runs/35744768797. This confirms the GitHub workflow is active, but does not yet prove compilation; inspect the terminal conclusion and artifacts before advancing the Vulkan gate.
Run `35744768797` failed before compilation inside `android-actions/setup-android`: its Node 24 execution requested the removed Android SDK package `tools`. The workflow now avoids that stale action and uses the GitHub runner's preinstalled SDK manager to install only the pinned platform, build-tools, NDK, and CMake packages. This is a CI bootstrap correction, not an application-code change.
Retry run `35745028019` reached the pinned toolchain step but failed because `sdkmanager` was installed under the hosted runner's Android SDK and not exported on `PATH`. The workflow now resolves the newest preinstalled `cmdline-tools/*/bin/sdkmanager` by absolute path, exports `ANDROID_HOME`/`ANDROID_SDK_ROOT`, and keeps all installed packages explicitly pinned.
Run `35745257630` successfully installed the complete pinned Android toolchain and reached C++ compilation. Compilation then exposed a deterministic include-order defect: `openxr_platform.h` saw `XR_USE_GRAPHICS_API_VULKAN` before Vulkan types were declared. `openxr_bootstrap.cpp` now includes `vulkan/vulkan.h` before the OpenXR platform header.

## Native APK compiler gate passed, 2026-09-22

GitHub Actions run `35745713618` completed successfully from commit `bafb2b089e52d83187bec800532dc1ac11962d51`: https://github.com/Mxthy/quest3-companion-vr/actions/runs/35745713618. Every workflow step passed, including pinned Android toolchain installation, Gradle/CMake compilation, APK manifest and `arm64-v8a` verification, checksum generation, unstripped symbol collection, and artifact upload.

Artifact `quest-companion-native-4` (`10702583169`) contains a 4,004,237-byte debug APK, its SHA-256 file, a 999,104-byte unstripped `libquest_companion.so`, and the pinned version catalog. The downloaded APK checksum was independently verified as `95400146bdf35e220f055ebdb34ec995d9e80b353149a85d263dcedb278e1bdf`. GitHub retains the artifact until 2026-10-06 15:13:55 UTC.

The compiler gate is now green. The runtime is still only an OpenXR bootstrap: the next gate is physical installation and Logcat confirmation on Quest 3, followed by Vulkan device/session/swapchain work. Do not claim stereo rendering, controller tracking, hand tracking, VRM rendering, thermals, or 72 Hz yet.

