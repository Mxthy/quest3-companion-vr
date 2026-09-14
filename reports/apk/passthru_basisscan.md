# Basisscan – Pass_Thru Hot Sauce v1.3.9

**Date:** 2026-09-14  
**Source:** dlvr.sh `l8lXK-efVkVE` / file `wEuqRMNuOlvP`  
**Local path:** `/home/workdir/artifacts/quest3-game/artifacts/Pass_Thru_Hot_Sauce_v1.3.9.apk`  
**SHA-256:** `f44b53d9af0fd344b28659473347c4edf02217c5214754ece537ea476daf8071`  
**Size:** 421101177 bytes (~401 MiB)

## Package identity
| Field | Value |
|-------|--------|
| package | `com.metaxrdev.pths_full` |
| label | PTHS Full |
| versionName | 1.3 |
| versionCode | 1 |
| minSdk | 29 |
| targetSdk | 32 |
| compileSdk | 32 |
| ABI | arm64-v8a only |
| launchable-activity | `com.unity3d.player.UnityPlayerActivity` |

## Engine (high confidence)
**Unity (IL2CPP)**

Evidence:
- Launch activity: `UnityPlayerActivity`
- Native: `libunity.so` (~19.5 MB), `libil2cpp.so` (~49 MB), `libmain.so`
- `assets/bin/Data/` (Unity data layout, ~948 entries)
- `assets/bin/Data/Managed/Metadata/global-metadata.dat` (~8.7 MB)
- `assets/UnityServicesProjectConfiguration.json`
- `assets/bin/Data/UnitySubsystems/OculusXRPlugin`

## VR / Meta platform stack
| Component | Evidence |
|-----------|----------|
| OpenXR | `libopenxr_loader.so` |
| OVR Plugin | `libOVRPlugin.so` |
| OVR LipSync | `libOVRLipSync.so` |
| OVR Avatar | `libovravatarloader.so` |
| Oculus XR Plugin | Unity subsystem folder |
| Passthrough | `com.oculus.feature.PASSTHROUGH` (required feature) |
| Hand tracking | permission + optional feature `oculus.software.handtracking` |
| Scene / Anchors | `USE_SCENE`, `USE_ANCHOR_API` permissions |
| Head tracking | `android.hardware.vr.headtracking` |

## Permissions (summary)
- com.oculus.permission.HAND_TRACKING
- com.oculus.permission.USE_SCENE
- com.oculus.permission.USE_ANCHOR_API
- INTERNET, ACCESS_NETWORK_STATE
- CAMERA, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS
- AD_ID, BILLING

## Architecture notes
- Standalone Quest-oriented Unity IL2CPP build
- Strong focus on **passthrough** + scene understanding + anchors
- Interaction SDK present (`libInteractionSdk.so`)
- Billing → likely IAP / store integration
- Single ABI arm64-v8a (Quest 2/3/Pro class devices)

## Confidence
| Claim | Level |
|-------|--------|
| Unity IL2CPP | confirmed |
| Meta Quest / Oculus XR | confirmed |
| Passthrough-centric | confirmed (required feature) |
| Companion/intimate content | not yet verified (needs deeper asset/script review) |

## Next analysis steps
1. apktool decode (resources + smali if present) or jadx on non-IL2CPP parts
2. Inspect global-metadata / string tables for scene/UI names (careful, large)
3. Compare engine fingerprint with joi-lab and SliceoflifeVR
4. Document interaction patterns (hands, anchors, passthrough UI) without copying assets
