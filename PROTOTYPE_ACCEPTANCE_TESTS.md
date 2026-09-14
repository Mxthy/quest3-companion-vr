# PROTOTYPE_ACCEPTANCE_TESTS.md

Fill one column per engine after build + Quest 3 (or approved device farm) run.

## Functional acceptance (pass/fail)

| Test | Unity | Godot | Unreal |
|------|-------|-------|--------|
| APK installs on Quest 3 | | | |
| App starts to XR view | | | |
| Head tracking works | | | |
| Controller tracking works | | | |
| Hand tracking works (or documented fallback) | | | |
| Grab object | | | |
| Release object | | | |
| UI interactable | | | |
| Companion placeholder visible / reacts | | | |
| Audio triggers on interact | | | |
| Three interactive objects present | | | |
| Passthrough optional OK or N/A | | | |

**Gate:** All required rows Pass (or N/A for optional passthrough) before performance ranks count.

## Performance & size metrics

| Metric | Unity | Godot | Unreal | Method |
|--------|-------|-------|--------|--------|
| Build time (clean) | | | | CI or local wall clock |
| APK size (MiB) | | | | file size |
| Install time | | | | adb install |
| Cold start to interactive (s) | | | | stopwatch / log |
| RAM (foreground, MB) | | | | adb dumpsys / Meta tools |
| CPU frame time (ms) p50/p95 | | | | Perfetto / engine profiler |
| GPU frame time (ms) p50/p95 | | | | same |
| FPS stability @ 72/90 | | | | on-device |
| Draw calls (approx) | | | | profiler |
| Render resolution / FFR | | | | settings log |
| Shader hitches observed | | | | count sessions |
| Tracking/interaction latency (subjective 1–5) | | | | tester |
| Error count (first session) | | | | logcat |
| Manual interventions to first build | | | | engineer count |
| Time to first working build | | | | hours |
| Agent correction loops | | | | chat/tool iterations |

## Agent-maintainability score (post-build)

| Question | Unity | Godot | Unreal |
|----------|-------|-------|--------|
| Could agent edit interaction logic without GUI? (1–5) | | | |
| Scene/format diff-friendly? (1–5) | | | |
| Rebuild after agent edit friction (1–5, 5=easy) | | | |

## Decision input

After tables filled:
1. Discard engines failing functional gate.
2. Rank remaining by (Quest metrics + agent loops + license OK).
3. Record final pick in DECISIONS.md as D-00x with evidence links.

## Environment note
This agent host **cannot** run Quest 3 natively. Metrics marked hardware-bound require user device, cloud device farm, or remote build + user measurement.
