# Basisscan – JOI Lab VR (joi-lab-vr-meta-quest-23pro)

**Date:** 2026-09-14  
**Source:** dlvr.sh file `hTU8YqqhXWqn`  
**SHA-256:** `8b45df46b2793d469fe3e900c4aa11b0fa902729fc0171ca36d4cd2523fc7792`  
**Size:** 608242436 bytes (~580 MiB)

## Package identity
| Field | Value |
|-------|--------|
| package | `com.multisekai.VRHand` |
| label | JOI Lab VR |
| versionName | 1.0 |
| versionCode | 1 |
| minSdk | 29 |
| targetSdk | 29 |
| compileSdk | 32 |
| ABI | arm64-v8a only |
| launchable-activity | `com.epicgames.unreal.GameActivity` |

## Engine (high confidence)
**Unreal Engine**

Evidence:
- Launch activity: `com.epicgames.unreal.GameActivity`
- Native: `libUnreal.so` (~131 MB)
- Payload: `assets/main.obb.png` (~547 MB) – typical Unreal embedded pak/OBB naming
- `libEOSSDK.so` (~23 MB) – Epic Online Services
- No Unity markers (no libunity, libil2cpp, assets/bin/Data)

## VR / Meta platform stack
| Component | Evidence |
|-----------|----------|
| OpenXR | `libopenxr_loader.so` |
| OVR Plugin | `libOVRPlugin.so` |
| Passthrough | `com.oculus.feature.PASSTHROUGH` (**required**) |
| Hand tracking | permission + optional `oculus.software.handtracking` |
| Head tracking | `android.hardware.vr.headtracking` |
| Experimental | `com.oculus.experimental.enabled` |

## Permissions (summary)
- INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, WAKE_LOCK
- READ/WRITE_EXTERNAL_STORAGE
- HAND_TRACKING (Oculus)
- BILLING, CHECK_LICENSE

## Architecture notes
- Standalone Quest-oriented **Unreal** build
- Same high-level product focus as Pass_Thru: **passthrough + hand** (package id even contains `VRHand`)
- EOS present → online/services/auth possible
- Single large embedded content blob (`main.obb.png`)
- Smaller native surface than Unity IL2CPP title (fewer middleware .so files listed)

## Comparison seed vs Pass_Thru
| Aspect | Pass_Thru | JOI Lab |
|--------|-----------|---------|
| Engine | Unity IL2CPP | **Unreal** |
| Activity | UnityPlayerActivity | GameActivity |
| Passthrough | required | required |
| Hand tracking | yes | yes |
| OpenXR + OVRPlugin | yes | yes |
| IAP/Billing | yes | yes |
| Extra | Interaction SDK, LipSync, Avatar, URP | EOS SDK, embedded OBB |

## Confidence
| Claim | Level |
|-------|--------|
| Unreal Engine | confirmed |
| Meta Quest + Passthrough | confirmed |
| Hand-oriented (package VRHand) | high |
| Companion genre content | assumed (user), not yet content-scanned |

## Next
1. Optional light string/asset pass on Unreal side (harder than Unity metadata)
2. SliceoflifeVR basisscan for third data point
3. Cross-APK matrix → engine decision input for new game
