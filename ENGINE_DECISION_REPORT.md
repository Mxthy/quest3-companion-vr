# Engine Decision Report (M3)

**Status:** Matrix complete · **No final engine selected**  
**Date:** 2026-09-14  
**Inputs:** ENGINE_ANALYSIS.yaml, reference APK evidence, weighted criteria

## Purpose
Choose among Unity, Godot, and Unreal for a Meta Quest 3 companion vertical slice, optimized for **Quest performance**, **agent/vibe-coding maintainability**, and **Meta XR integration** — not for brand familiarity.

## Weighted result (pre-prototype)

| Engine | Weighted total (1–5 scale) |
|--------|----------------------------|
| Unity | **4.42** |
| Unreal | **4.01** |
| Godot | **3.68** |

These numbers are **planning scores**, not a ship decision. Hardware and agent-loop measurements can change rank.

## Interpretation

### Unity
- Strengths: Best alignment with two of three commercial refs; Meta XR / Interaction / Voice / Avatar ecosystem; mature OpenXR path (SliceOfLife); strong automation.
- Weaknesses: License/policy uncertainty (must re-verify); package dependency friction; mid-weight editor for remote debugging.
- Fits: Fast path to presence features seen in analysis; C# is agent-friendly enough.

### Unreal
- Strengths: Proven in-ref (JOI Lab); excellent fidelity and tooling (Insights); OpenXR + passthrough production path.
- Weaknesses: Heaviest for agent-only workflows; C++/Blueprint mix resists pure vibe loops; high editor cost without strong PC/cloud.
- Fits: If vertical slice demands max visual/animation fidelity early.

### Godot
- Strengths: Best agent maintainability (text scenes, small API); MIT license; light editor; solid OpenXR.
- Weaknesses: Weaker Meta-specific MRUK/Voice/Avatar ready-made stack; fewer shipping Quest companion precedents; passthrough/MR depth less proven.
- Fits: Rapid prototype of interaction loop and CI; risk if slice needs full Meta presence suite immediately.

## Largest uncertainties
1. **Real Quest 3 frame times / thermals** for an identical feature set (all three scored partly on expectation).
2. **Agent correction-loop count** building the same prototype in each engine (critical for this project’s working model).
3. **Godot production passthrough + anchors** on current Quest OS.
4. **Current Unity commercial terms** for the intended distribution model.

## Blockers for final selection
- No Quest 3 device in the agent environment.
- No cloud build account wired yet.
- Prototypes not built; acceptance metrics not measured.

## Recommended test order
1. **Godot minimal** – fastest feedback on OpenXR + grab + agent edit loop.  
2. **Unity minimal** – validates Meta-aligned path matching majority of refs.  
3. **Unreal minimal** – only if fidelity or a failed Unity/Godot path requires it.

## Decision rule (after prototypes)
Pick the engine that:
1. Passes PROTOTYPE_ACCEPTANCE_TESTS on Quest 3 (or approved cloud device farm), and  
2. Minimizes agent correction loops for the same feature set, and  
3. Does not exceed license risk acceptable to the project owner.

If two pass (1–2), prefer lower long-term agent friction unless measured performance gap is material.

## Explicit non-decision
**No engine is chosen in M3.** Next step is execute PROTOTYPE_SPEC in the order above.
