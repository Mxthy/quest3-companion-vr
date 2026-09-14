# Cross-APK Comparison Matrix (v2 – all three)

**Date:** 2026-09-14

## Identity

| Field | Pass_Thru | JOI Lab | SliceOfLife |
|-------|-----------|---------|-------------|
| Package | com.metaxrdev.pths_full | com.multisekai.VRHand | com.sliceoflifevr.app |
| Label | PTHS Full | JOI Lab VR | SliceOfLifeVR |
| Version | 1.3 | 1.0 | 1.0 (vc 3) |
| Size | ~401 MB | ~580 MB | ~918 MB |
| SHA-256 | f44b53d9…8071 | 8b45df46…7792 | dc3ea217…26fd |

## Engine

| Field | Pass_Thru | JOI Lab | SliceOfLife |
|-------|-----------|---------|-------------|
| **Engine** | Unity IL2CPP | **Unreal** | Unity IL2CPP |
| Activity | UnityPlayerActivity | GameActivity | UnityPlayerGameActivity |
| XR bootstrap | OculusXRPlugin | OVR+OpenXR | **UnityOpenXR** |
| minSdk / target | 29 / 32 | 29 / 29 | **32 / 36** |

## Meta / presence features

| Feature | Pass_Thru | JOI Lab | SliceOfLife |
|---------|-----------|---------|-------------|
| Passthrough required flag | yes | yes | not in badging |
| Hand tracking | yes | yes | yes |
| Scene / anchors | yes | — | USE_SCENE + understanding |
| Voice / Wit | — | — | **yes** |
| Avatar2 / Body | partial | — | **yes** |
| Face / Eye tracking perms | — | — | **yes** |
| MR Utility Kit | — | — | **yes** |
| Video (AVPro) | — | — | **yes** |
| Spatial / Meta audio | LipSync etc. | — | Meta XR Audio + Audio360 |

## Product pattern (abstracted)

All three target standalone Quest with **hand-centric** interaction.  
Two Unity titles + one Unreal → genre is **not locked to one engine**.  
SliceOfLife shows the **most complete modern Meta presence stack** (OpenXR, Voice, Avatar, MRUK).  
Pass_Thru is the clearest **passthrough-first** Unity reference.  
JOI Lab proves the same pillars on **Unreal**.

## Implications for new game

1. Engine choice remains open; evidence supports Unity *or* Unreal for this genre.
2. Recommended technical pillars for a Quest 3 companion vertical slice:
   - OpenXR / Meta XR
   - Hand interaction (grab/ray)
   - Optional: passthrough or scene-anchored placement
   - Optional polish: voice, avatar, spatial audio
3. Prefer **original** content; only patterns above are reusable knowledge.
4. Next: ENGINE_ANALYSIS.yaml + design/engine decision prep (M3/M4).
