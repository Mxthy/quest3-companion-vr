# Vertical Slice Backlog (ordered)

Work **top-down**. Each milestone should leave a playable build.

## VS-0 – Freeze contracts (docs only)
- [x] BUILD_AGENT_KNOWLEDGE_BASE
- [x] SYSTEMS_FROM_RE
- [x] CONTENT_SPEC / GDD slice / ARCHITECTURE_NEXT
- [ ] Copy CONTENT_SPEC into app `content/` when coding starts

## VS-1 – Core extraction
- [ ] Move companion store logic into `core/` (phase, bond, hold, dialogue, save)
- [ ] ContentLoader reads YAML/JSON
- [ ] Unit-test core without WebGL

## VS-2 – Presentation polish (desktop still OK)
- [ ] Room scale matches CONTENT_SPEC anchors
- [ ] 3 props with place anchors
- [ ] Companion placeholder → **VRM load** if model available
- [ ] Expression blink + talk hook
- [ ] Full dialogue pools from CONTENT_SPEC
- [ ] Audio bus + mute persist

## VS-3 – WebXR tier
- [ ] immersive-vr button + session
- [ ] Controller ray grab/release
- [ ] Teleport + snap turn
- [ ] XR prompt UI
- [ ] Desktop fallback remains
- [ ] Document browser limits (no fake Quest FPS)

## VS-4 – Presence
- [ ] Sit volume + seated lines
- [ ] All-props moment
- [ ] High-bond line gate
- [ ] Optional passthrough flag (unsupported → skip)

## VS-5 – Ship checklist
- [ ] HTTPS deploy or local trusted for XR
- [ ] 5-minute design beats completable
- [ ] Save/load verified
- [ ] Rights: only original assets in tree

## Parallel (assets)
- [ ] Original prop GLBs (cup, vinyl, lantern)
- [ ] Room mesh or stylized boxes + light
- [ ] VRM companion via sheets + VRM KB pipeline
- [ ] SFX pack matching CONTENT_SPEC cue ids

## Explicit non-goals until VS-5 done
Native Unity/Godot/Unreal full port, multiplayer, Meta Voice full SDK, IAP.
