# What still limits agent effectiveness (and what closes it)

Goal: **max efficiency + freedom to implement**, **min hallucination** when context is thin.

## Already in place

| Piece | Role |
|-------|------|
| Mental models + snippets | How Godot XR is written |
| Agent rules + teaching prompt | Stock vs domain |
| POC sources | Where truth lives (MIT repos) |
| Transfer doc | Other engines → Godot mapping |
| Product override / neutral interaction docs (if present) | What not to moralize away |

## Gaps that still cause invention

### 1. No frozen lab project pin

**Risk:** Agent invents node/signal names for “XR Tools 2023” while you use another version.

**Close:** One `quest3-godot-lab` repo (or submodule) with **pinned** Godot version, XR Tools version, OpenXR Vendors version, and a `LAB_VERSIONS.md`.

### 2. No single INTERACTION_CONTRACT as source of truth

**Risk:** Agent fills unspecified distances, layers, button bindings.

**Close:** One YAML/JSON: grips, layers, item ids, phase rules, acceptance tests. Agent may only extend with `// ASSUMPTION:` lines you must accept.

### 3. No “allowed API surface” cheat sheet

**Risk:** Hallucinated methods (`xr.grab_object()`, Unity-like APIs).

**Close:** Short `docs/GODOT_ALLOWED_APIS.md`: XRServer, XROrigin3D, XRController3D, CharacterBody3D, RigidBody3D, Area3D, Skeleton3D, AnimationTree, and “use XR Tools nodes listed in lab”.

### 4. No fail-closed rule for unknowns

**Risk:** Thin context → creative physics.

**Close:** Agent rule: *If not in contract / snippets / lab, output QUESTION and stop coding that part.*

### 5. Domain vs XR boundary not enforced in repo layout

**Risk:** Bond logic inside pickable fork.

**Close:** Folders: `xr/` (tools only) vs `domain/` (game only). CI or review: domain must not implement ray grab.

### 6. Asset ground truth missing in-agent context

**Risk:** Invents mesh paths, VRM bone names.

**Close:** `assets/MANIFEST.yaml` (real paths, licenses, bone list for companion).

### 7. No golden scene

**Risk:** Every session rebuilds player rig differently.

**Close:** One committed `player_rig.tscn` that already works; agent only **attaches** domain scripts.

### 8. Performance budget not numeric

**Risk:** SoftBody + lights “because AAA”.

**Close:** `PERF_BUDGET.md`: 72/90 Hz target, max dynamic lights, SoftBody = optional off switch.

### 9. Dual-runtime confusion (Web vs Godot vs Unity)

**Risk:** R3F patterns in GDScript.

**Close:** One line in every agent prompt: *This task is Godot-only | Web-only | Unity-only.*

### 10. Verification loop not automated

**Risk:** Agent claims done without test.

**Close:** Checklist per feature; human Quest pass required for XR feel; agent runs Godot headless/script checks where possible.

## Freedom worth keeping

- How to structure domain scripts
- Prop content, dialogue, bond curves
- Choosing stock pickable vs physics-hand **when contract allows both**
- Refactors inside `domain/` for clarity

## Freedom to restrict

- New locomotion modes without contract entry
- New physics engines
- New XR input schemes
- Copying commercial game code

## Minimal next pack (highest ROI)

1. Pin lab versions (`LAB_VERSIONS.md`)
2. Fill `INTERACTION_CONTRACT.yaml` with concrete numbers
3. `GODOT_ALLOWED_APIS.md` (one page)
4. Fail-closed sentence in every agent system prompt
5. One golden `player_rig` path documented

When these five exist, agents stay effective **and** stop filling holes with fiction.
