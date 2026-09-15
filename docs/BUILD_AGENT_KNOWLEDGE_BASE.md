# BUILD AGENT KNOWLEDGE BASE

**Purpose:** Single source for a build agent to implement an *original* Quest-3-class companion app informed by RE + web MVP.  
**Not a clone recipe.** No proprietary assets, meshes, audio, or code from reference APKs.

**Read order for agents:**  
1. This file  
2. `ENGINE_ANALYSIS.yaml`  
3. `reports/engine/cross_apk_matrix.md`  
4. `PROTOTYPE_SPEC.md`  
5. Web MVP systems (if present under `new-game/web-mvp/`)

---

## 1. Product target (abstracted from RE + design seed)

| Pillar | Requirement |
|--------|-------------|
| Platform | Meta Quest 3 standalone (arm64), OpenXR / Meta XR |
| Core fantasy | Presence with a companion in a personal space |
| Input | Hand-first; controller fallback |
| Space | Room-scale or seated; optional passthrough / scene anchors |
| Interaction | Grab/release objects; simple UI; approach companion |
| Feedback | Spatial or simple audio; short dialogue/status lines |
| Progression | Soft bond / visit memory (not hard campaign) |
| Content | **100% original** characters, room, VO, props |

Genre references (benchmark only): Cherry-VR-class immersion density — **do not copy IP**.

---

## 2. What RE proved (evidence level)

### 2.1 Engines in commercial peers
| App | Engine | XR path | Notes |
|-----|--------|---------|-------|
| Pass_Thru | Unity IL2CPP | OculusXRPlugin + OpenXR + OVR | Passthrough **required**; Interaction SDK heavy |
| JOI Lab | Unreal | OpenXR + OVRPlugin | Same pillars on Unreal; EOS |
| SliceOfLife | Unity IL2CPP | **UnityOpenXR** (modern) | Voice/Wit, Avatar2, MRUK, minSdk 32 |

**Implication:** Build agent may target Unity *or* Unreal *or* WebXR first; genre is not engine-locked.

### 2.2 Shared technical pillars (port these *as systems*, not as packages)
1. OpenXR session + head tracking  
2. Hand tracking and/or controller interactors  
3. Grab / release interactables  
4. Optional passthrough or scene understanding  
5. Optional spatial anchors for placing content in real room  
6. UI in world space or curved panel  
7. Audio presence (spatial or stereo cues)  
8. Optional: voice, avatar body, lip sync (later polish)

### 2.3 Pass_Thru interaction taxonomy (from metadata type names — patterns only)

**Hands / grab**  
`AboutToGrabFocus`, `AlignOnGrab`, `AddHandGrabPose`, `AllowGrabThroughWalls`, `HandPinchOffset`, `HandPointerPose`, `HandWristOffset`, `TouchShadowHand`, `RayInteractable`, `PointableCanvas`

**Body / avatar**  
`BodyPose*`, `BodyJoint*`, `AvatarMaskBodyPart`, clothing level tokens (e.g. cloth level ladders) — treat as *customization ladder pattern*, invent original content.

**Space**  
`ActiveRoomsOnly`, `AddRoomLight`, `OVRScenePlane`, `SnapshotSceneManager`, spatial anchors (`OVRSpatialAnchor`)

**Passthrough**  
`OVRPassthroughLayer`, style/LUT handlers, required feature flag on some titles

**Locomotion-ish**  
`AllowTeleport`, look constraints (`AllowPitchLook`, `AllowYawLook`)

### 2.4 SliceOfLife capability ceiling (modern Meta stack)
When the product needs “full presence”: Meta Voice/Wit, AvatarSDK2, MR Utility Kit, XR Interaction Toolkit + Oculus Interaction, AVPro-class video, eye/face *permissions* (use only if product needs them).

### 2.5 Explicit RE limits
- No recoverable full gameplay scripts (IL2CPP / Unreal native).  
- No shippable meshes, textures, audio from APKs.  
- Bond/dialogue numbers in web MVP are **original design**, not extracted from APKs.

---

## 3. Reference web MVP systems (desktop Three.js companion)

Already implemented pattern (browser, **not** WebXR yet):

| Module | Responsibility |
|--------|----------------|
| `store` (Zustand) | phase: start \| playing \| paused; bond; held item; near companion; speech; save |
| `dialogue` | event → line pools (enter, talk, cup, vinyl, lantern, high bond) |
| `interact` | registry of interactable ids |
| `player` | move, look, ray/use key, sit |
| `interactables` | 3 props: cup, vinyl, lantern — pick up / place |
| `elara` | companion presence + proximity |
| `audio` | unlock, mute, pickup/place, soft tones |
| `save` | local persistence of bond/visits/used |

**Map to XR prototype:** same state machine; replace keyboard/mouse with XR controllers/hands; replace free walk with teleport + snap turn; keep 3 interactables + companion + dialogue.

---

## 4. Target system architecture (engine-agnostic)

```
┌─────────────────────────────────────────────┐
│  Presentation (Unity / Godot / Unreal / WebXR) │
│  meshes, XR rig, input devices, audio engine   │
└───────────────────┬─────────────────────────┘
                    │ adapter interface
┌───────────────────▼─────────────────────────┐
│  Game core (pure logic / data-driven)         │
│  PhaseController · BondModel · InventoryHold  │
│  InteractableRegistry · DialogueDirector      │
│  CompanionProximity · SaveRepository          │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│  Config (JSON/YAML): lines, prop ids, thresholds │
└─────────────────────────────────────────────┘
```

**Rules for build agents**
- No engine types inside core models.  
- XR adapter translates: grip pressed → `TryGrab(id)`, trigger → `Use()`, etc.  
- All dialogue and prop lists data-driven.

---

## 5. Vertical-slice feature checklist (build order)

### P0 – must ship in first playable
- [ ] XR (or WebXR) session start / exit  
- [ ] Head tracking  
- [ ] Controller or hand: ray or direct grab  
- [ ] Grab + release **3** distinct props  
- [ ] Companion placeholder in room  
- [ ] Proximity → dialogue line  
- [ ] One audio cue on grab/place  
- [ ] Start / pause / resume states  
- [ ] Desktop or emulator fallback for CI

### P1 – immersion
- [ ] Teleport locomotion  
- [ ] Snap turn  
- [ ] World-space XR UI (bond or prompt)  
- [ ] Optional passthrough toggle  
- [ ] Simple save of bond/visits

### P2 – presence polish (only if engine path supports)
- [ ] Spatial audio  
- [ ] Hand tracking preferred path  
- [ ] Scene anchor / place room content (if passthrough product)  
- [ ] Voice or TTS line hooks (optional)

---

## 6. Suggested data contracts

```yaml
# config/props.yaml
props:
  - id: cup
    grabable: true
    place_anchor: table_a
  - id: vinyl
    grabable: true
    toggles: music
  - id: lantern
    grabable: true
    toggles: light

# config/dialogue.yaml
events:
  enter: ["..."]
  talk: ["..."]
  prop_cup: ["..."]
  high_bond: ["..."]

# config/progression.yaml
bond:
  on_prop_use: 5
  on_talk: 2
  high_threshold: 70
```

State runtime:
```text
phase, bond, heldId, usedProps[], visits, muted, nearCompanion, speechLine?
```

---

## 7. Portability matrix (Web / logic → native)

| System | WebXR Three/IWSDK | Godot OpenXR | Unity OpenXR | Unreal OpenXR |
|--------|-------------------|--------------|--------------|---------------|
| Phase/bond/save | direct | direct | direct | direct |
| Dialogue tables | direct | direct | direct | direct |
| Grab/release | adapter | XR grab | XRIT / Meta Interaction | OpenXR grab |
| Hands | limited browser | OpenXR hands | Meta/XR Hands | OpenXR hands |
| Teleport/snap | adapter | direct | XRIT | direct |
| Passthrough | browser-dependent | extension maturity varies | Meta XR strong | Meta/UE strong |
| MRUK/anchors | unsupported / stub | limited | strong | medium–strong |
| Voice/Avatar Meta | stub | weak ready-made | strong | medium |
| Performance numbers | **do not** equate to Quest native | measure on device | measure | measure |

Legend: **direct** = same logic; **adapter** = thin I/O layer; **strong/weak** = ecosystem readiness.

---

## 8. Do / Don't for build agents

**Do**
- Implement original room, companion, props, lines.  
- Prefer OpenXR.  
- Keep core logic testable without headset.  
- Log feature flags: `hands`, `passthrough`, `anchors`.  
- Follow `PROTOTYPE_ACCEPTANCE_TESTS.md` when claiming “done”.

**Don't**
- Unpack reference APKs into the product tree.  
- Reuse package names, store listings, or trademarked labels from refs.  
- Claim Quest FPS from browser tests.  
- Expand to full Meta Voice/Avatar before P0 loop is stable.

---

## 9. Recommended build sequence for agents

1. **WebXR or desktop-XR-emulation** on top of existing companion store (fastest loop validation).  
2. Fill acceptance tests for interaction only.  
3. Port core to chosen native engine (after M3 prototype scores).  
4. Add passthrough/anchors only if product decision requires them.  
5. Polish audio/voice/avatar last.

---

## 10. Source index

| Doc | Role |
|-----|------|
| `reports/apk/passthru_*.md` | Unity passthrough + Interaction evidence |
| `reports/apk/joilab_basisscan.md` | Unreal peer |
| `reports/apk/sliceoflife_basisscan.md` | Modern Meta presence stack |
| `ENGINE_ANALYSIS.yaml` | Consolidated engine facts |
| `ENGINE_DECISION_*` | Not final; prototype-gated |
| Web MVP `src/lib/companion/*` | Working loop reference |

---

*Last updated: 2026-09-16 – RE consolidated for build-agent consumption.*
