# Cross-APK Comparison Matrix

**Date:** 2026-09-14  
**Sources:** Pass_Thru (basisscan + deep), JOI Lab (basisscan)  
**Missing:** SliceoflifeVR_Meta_Beta_V11.apk – not on current dlvr share; Drive download blocked (>128 MiB)

## Identity

| Field | Pass_Thru Hot Sauce | JOI Lab VR |
|-------|---------------------|------------|
| Package | `com.metaxrdev.pths_full` | `com.multisekai.VRHand` |
| Label | PTHS Full | JOI Lab VR |
| Version | 1.3 | 1.0 |
| Size | ~401 MB | ~580 MB |
| SHA-256 | f44b53d9…8071 | 8b45df46…7792 |

## Engine

| Field | Pass_Thru | JOI Lab |
|-------|-----------|---------|
| **Engine** | **Unity (IL2CPP)** | **Unreal Engine** |
| Entry activity | `UnityPlayerActivity` | `com.epicgames.unreal.GameActivity` |
| Main native | libunity + libil2cpp | libUnreal (~131 MB) |
| Content layout | assets/bin/Data + global-metadata | assets/main.obb.png (~547 MB) |
| Services middleware | Unity Analytics + Purchasing | Epic Online Services (EOSSDK) |

## Meta Quest / XR

| Feature | Pass_Thru | JOI Lab |
|---------|-----------|---------|
| OpenXR loader | yes | yes |
| OVR Plugin | yes | yes |
| **Passthrough (required)** | **yes** | **yes** |
| Hand tracking permission | yes | yes |
| Hand tracking feature | optional | optional |
| Head tracking | yes | yes |
| Scene / Anchors APIs | yes (USE_SCENE, USE_ANCHOR_API) | not declared in badging |
| LipSync / Avatar loaders | yes | not observed in lib list |
| Interaction SDK (Oculus) | heavy (Oculus.Interaction*) | not observed as separate .so set |

## Product direction (abstracted)

Both titles align on:
1. Standalone Quest targeting (arm64-v8a, minSdk 29)
2. **Passthrough as core capability** (required feature)
3. **Hand-centric interaction**
4. Store monetization (Billing)

They diverge on **engine choice** (Unity IL2CPP vs Unreal) and middleware (Unity Services vs EOS; richer Oculus Interaction stack on Pass_Thru).

## Implications for new game

- Reference set already shows the genre is **engine-agnostic** at product level: same immersion pillars work on Unity *and* Unreal.
- For a new Quest 3 companion vertical slice, engine decision can prioritize: agent maintainability, OpenXR/Meta XR support, build times, team skill – not “whatever the references used.”
- Reusable patterns (not assets): passthrough-first presence, hand grab/ray UI, optional anchors/scene, spatial audio/lipsync as polish.
- Sliceoflife still needed as third data point (may confirm Unity, Unreal, or a third stack).

## Blockers

| Item | Status |
|------|--------|
| SliceoflifeVR on dlvr | **absent** from share `l8lXK-efVkVE` |
| SliceoflifeVR via Drive connector | **blocked** (size ~962 MB > 128 MiB limit) |
| Workaround | New dlvr/direct HTTPS link, or split parts <120 MB |

## Next recommended
1. User provides Sliceoflife via dlvr or split → basisscan
2. Finalize ENGINE_ANALYSIS.yaml from three (or two if Sliceoflife delayed)
3. Start GAME_DESIGN_DOCUMENT + engine decision matrix (M3/M4 prep)
