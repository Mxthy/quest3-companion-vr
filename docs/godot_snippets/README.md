# Godot XR Snippet Pack (style + transfer)

These are **teaching snippets**: correct shape of Godot 4 XR code for agents.
They are illustrative (API names match Godot 4 / XR Tools concepts). Always verify against the **installed** XR Tools version in the lab project.

Use: read mental models → copy structure → change **only** domain parts.

## Files

| File | Teaches |
|------|--------|
| `01_start_xr.gd` | Find interface, initialize, emit readiness |
| `02_domain_on_pickable.gd` | Don’t rewrite grab — listen and add value |
| `03_held_state.gd` | Thin domain state driven by XR events |
| `04_extend_not_fork.gd` | When to extend vs use stock nodes |

## How agents should apply

1. Match node types and lifecycle (`_ready`, physics vs process).
2. Keep XR authority in engine/tools nodes.
3. Put companion logic in separate scripts/autoloads.
4. Name domain variables clearly (`bond`, `held_id`) — never shadow tools internals.
