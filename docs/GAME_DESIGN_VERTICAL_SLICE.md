# GAME DESIGN – Vertical Slice (Build-Agent Spec)

**Product working title:** (open – agent must not invent trademarked names from APKs)  
**Platform:** Meta Quest 3 standalone · optional WebXR preview  
**Fantasy:** Quiet presence with a companion in a personal space; soft bond, not combat.

## Tone
- Intimate, calm, slightly melancholic warmth
- No horror jump-scares, no explicit adult content in P0–P1 unless product owner later expands scope
- Cherry-VR-class *immersion density* as benchmark only — original characters/world

## Core loop (90–180 seconds repeatable)
1. Enter space (start → playing)
2. Notice companion (proximity / look)
3. Interact with 1–3 props (grab, place, toggle)
4. Hear short line + soft audio
5. Bond ticks up; optional sit / stay
6. Pause or leave; state saved

## Session beats (first 5 minutes)
| Time | Beat | Player action | System |
|------|------|---------------|--------|
| 0:00 | Threshold | Confirm enter / XR start | phase=playing, unlock audio |
| 0:20 | Presence | Look at companion | proximity speech |
| 0:45 | First prop | Grab + place cup | held, bond+, SFX |
| 1:30 | Second prop | Vinyl or lantern | toggle music/light |
| 2:30 | Sit / stay | Sit near companion | seated state, line |
| 3:30 | Third prop | Complete set | "all props" line |
| 4:30 | Soft close | Pause or leave | save bond/visits |

## Progression (soft)
- `bond` 0–100; thresholds 30 / 70 unlock denser lines only (no hard locks in slice)
- `visits` increments on enter
- `used` flags per prop — complete set is a moment, not a quest log

## Failure / empty states
- No prop nearby → prompt "look / reach"
- Audio locked until first gesture → unlock on enter
- XR unsupported → desktop fallback still playable

## Out of scope for this slice
Multiplayer, IAP, full voice chat, full Meta Avatar body tracking, long branching story, open world.

## Acceptance (design)
Player can complete one full loop without tutorial text walls; emotional readability of companion presence within 60s.
