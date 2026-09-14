# Pass_Thru Hot Sauce – Deep Analysis (Phase 1)

**Date:** 2026-09-14  
**APK SHA-256:** f44b53d9af0fd344b28659473347c4edf02217c5214754ece537ea476daf8071  
**Builds on:** reports/apk/passthru_basisscan.md

## 1. Engine & render stack
- **Unity IL2CPP** with `Assembly-CSharp.dll` present in scripting list (game logic compiled to native via IL2CPP).
- **URP / Render Pipelines:** `Unity.RenderPipelines.Core.Runtime`, ShaderGraph libraries.
- **XR:** `Unity.XR.Management`, `Unity.XR.Oculus`, boot.config `xrsdk-pre-init-library=OculusXRPlugin`.
- **Vulkan-oriented XR flags:** fragment density map, low-latency audio, pipeline cache, usable core mask.
- **Services:** Unity Analytics 5.0.0, Purchasing 4.9.3, Core 1.11.0 (production).

## 2. Meta / Oculus integration (confirmed packages)
| Assembly / lib | Role |
|----------------|------|
| Oculus.VR | Core VR, spatial anchors init on load |
| Oculus.Interaction / Oculus.Interaction.OVR | Grab, ray, hand, interactor group, pointable canvas |
| Oculus.Interaction.OVR.Samples | Sample interaction patterns |
| Oculus.Platform | Platform / social / IAP surface |
| Oculus.LipSync | Mouth / speech visemes |
| Oculus.Spatializer / AudioManager | Spatial audio |
| Meta.XR.BuildingBlocks | Meta XR building-block helpers |
| libopenxr_loader, libOVRPlugin, libovravatarloader | Native XR + avatar |

boot.config highlights:
- OculusXRPlugin pre-init
- xr-low-latency-audio-enabled
- xr-keyboard-overlay-enabled
- android fullscreen / render outside safe area

## 3. Interaction model (from metadata type names)
Observed Interaction SDK concepts (not copied, only classified):
- Hand: HandActiveState, HandPointerPose, HandPinchOffset, HandWristOffset, TouchShadowHand
- Grab: AboutToGrabFocus, AlignOnGrab, BezierGrabSurface, AllowGrabThroughWalls, AddHandGrabPose
- Ray / UI: RayInteractable, PointableCanvas, VirtualSelector
- Body: BodyPose*, BodyJoint*, AvatarMaskBodyPart, BodyPoseComparer*
- Passthrough: OVRPassthroughLayer (BCS / ColorLut handlers), PassthroughCapabilities
- Scene: OVRScenePlane, SnapshotSceneManager, AttemptToLoadSceneModel, BasicSceneManager
- Spatial anchors: OVRSpatialAnchor InitializeOnLoad

→ Design pattern: **hand-centric interaction in passthrough space**, with scene anchors and optional body/avatar.

## 4. Content signals (metadata strings only)
App/domain hints (illustrative, not asset extraction):
- Identifiers: PTHS / metaxrdev package already known
- Character-related tokens: `BGirlBlk`, `BGirlBlk2`, `BGirlMat`, `BGirlTat`, `BGirlTat2`
- Clothing: `BodiceClothLevel`, `BodiceClothLevel2`, `BodiceClothLevel3`
- Space: `ActiveRoomsOnly`, `AddRoomLight`
- Camera look: `AllowPitchLook`, `AllowYawLook`

These support the **companion / character-in-room + passthrough** direction without implying we reuse any assets.

## 5. Scene / data layout
- Single primary level split: `level0.split0` … `level0.split4`
- `globalgamemanagers` (+ splits)
- ~948 files under `assets/bin/Data/`
- Managed metadata ~8.7 MB (`global-metadata.dat`)

## 6. Monetization / services
- Unity IAP (Purchasing 4.9.3) + `com.android.vending.BILLING`
- Analytics enabled (production environment)
- AD_ID permission

## 7. Implications for new game (abstracted)
Technical targets that align with a Quest 3 companion vertical slice:
1. **Unity + OpenXR/Meta XR** (or Godot/Unreal OpenXR) with passthrough as first-class feature
2. Hand grab + ray UI as primary input
3. Spatial anchors / scene understanding for placing content in real room
4. Optional LipSync / spatial audio for presence
5. URP (or equivalent) mobile VR pipeline with foveation / density map awareness
6. Clear separation: original characters, rooms, and loops — only patterns above are reusable knowledge

## 8. Confidence & limits
| Topic | Confidence |
|-------|------------|
| Unity IL2CPP + Meta XR stack | high |
| Passthrough + hand interaction focus | high |
| Companion/character presence | medium (string signals only) |
| Exact gameplay loop / progression | low (needs deeper RE or play observation) |
| IL2CPP full logic recovery | not attempted (out of scope for this phase) |

## 9. Recommended follow-ups
1. Comparative basisscan of joi-lab (same dlvr share)
2. Comparative basisscan of SliceoflifeVR
3. Cross-matrix: engine, passthrough usage, interaction SDK, monetization
4. Only then: GAME_DESIGN_DOCUMENT outline + engine decision matrix
