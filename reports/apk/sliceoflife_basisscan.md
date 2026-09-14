# Basisscan – SliceOfLifeVR Meta Beta V11

**Date:** 2026-09-14  
**Source:** dlvr.sh `WWCaUEphFPBk`  
**SHA-256:** `dc3ea217d43195cce0271cb1ef35260517710184b489287223cdd6b2e1a626fd`  
**Size:** 961962298 bytes (~918 MiB)

## Package identity
| Field | Value |
|-------|--------|
| package | `com.sliceoflifevr.app` |
| label | SliceOfLifeVR |
| versionName | 1.0 |
| versionCode | 3 |
| minSdk | **32** |
| targetSdk | **36** |
| compileSdk | 36 |
| ABI | arm64-v8a |
| launchable-activity | `com.unity3d.player.UnityPlayerGameActivity` |

## Engine (high confidence)
**Unity IL2CPP** (newer stack than Pass_Thru)

Evidence:
- `UnityPlayerGameActivity`
- `libunity.so` (~23 MB), `libil2cpp.so` (~130 MB), `libmain.so`
- `assets/bin/Data/` + ScriptingAssemblies / boot.config
- `xrsdk-pre-init-library=UnityOpenXR` (not legacy OculusXRPlugin)

## Meta / XR stack (richer than other two)
| Component | Evidence |
|-----------|----------|
| Unity OpenXR | libUnityOpenXR, Unity.XR.OpenXR*, MetaQuestSupport features |
| OpenXR Hands | libUnityOpenXRHands, Unity.XR.Hands |
| OVR Plugin | libOVRPlugin |
| Interaction | Oculus.Interaction* + Unity XR Interaction Toolkit |
| Avatar | Oculus.AvatarSDK2, libovravatar2, libovrbody |
| MR Utility Kit | meta.xr.mrutilitykit, libmrutilitykitshared |
| Environment depth | Meta.XR.EnvironmentDepth, BuildingBlocks.DepthAPI |
| Voice / Wit | Meta.WitAi*, Meta.Voice*, Meta.VoiceSDK.Mic* |
| Audio | Meta.XR.Audio, libMetaXRAudioUnity, Audio360, AVPro Video |
| Haptics | Oculus.Haptics, libhaptics_sdk |
| AR Foundation | Unity.XR.ARFoundation*, libUnityARFoundationAndroidXR |

## Permissions / capabilities (notable)
- HAND_TRACKING (Oculus + Android)
- USE_SCENE, BOUNDARY_VISIBILITY
- SCENE_UNDERSTANDING_COARSE / FINE
- EYE_TRACKING_COARSE, FACE_TRACKING
- OPENXR permission
- RECORD_AUDIO, FOREGROUND_SERVICE*
- No explicit `com.oculus.feature.PASSTHROUGH` in badging (unlike Pass_Thru/JOI) – may still use scene/MR paths

## Architecture notes
- Highest platform bar of the three (minSdk 32, target 36)
- Modern **Unity OpenXR** path rather than older OculusXRPlugin-only
- Strong presence/social-adjacent stack: Voice, Avatar2, Body, Face/Eye tracking
- Video (AVPro) + spatial audio → media-rich slice-of-life presentation
- XR Interaction Toolkit + Oculus Interaction dual approach possible

## Comparison vs other two
| Aspect | Pass_Thru | JOI Lab | SliceOfLife |
|--------|-----------|---------|-------------|
| Engine | Unity IL2CPP | Unreal | **Unity IL2CPP** |
| XR entry | OculusXRPlugin | OVR+OpenXR | **UnityOpenXR** |
| minSdk | 29 | 29 | **32** |
| Passthrough feature flag | required | required | not in badging |
| Hand tracking | yes | yes | yes |
| Voice / Wit | no | no | **yes** |
| Avatar2 / Body | partial | no | **yes** |
| MR Utility Kit | no | no | **yes** |
| Video (AVPro) | no | no | **yes** |

## Confidence
| Claim | Level |
|-------|--------|
| Unity IL2CPP | confirmed |
| Modern Meta XR / OpenXR | confirmed |
| Companion / presence-oriented | high (Voice, Avatar, scene, face/eye) |
| Exact loop | not scanned |

## Next
Update cross matrix + ENGINE_ANALYSIS.yaml with three-engine/product picture.
