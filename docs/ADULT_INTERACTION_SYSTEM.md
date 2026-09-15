# Adult Interaction System (explicit build)

**Scope:** Product owner confirmed **adult build**. Interactions must be tangible (touch/grab) and show visible/audible effect — not fade-to-black.

**Benchmark (agency only, not IP):** Captain Hardcore–class *player agency*: touch-reactive body, pleasure progression, grabable body regions, dynamic reactions. We implement an **original** systems layer for *our* companion (VRM + zones), not CH assets/code.

## Design pillars
1. **Touch is the verb** – hand/controller contact on body zones drives state.
2. **Effect is visible** – expression, audio, pleasure meter, optional idle pose shift.
3. **Player-paced** – no forced scene; intensity follows sustained contact / explicit use action.
4. **Graduated** – tease → aroused → peak → afterglow; can stop anytime (release / step back).
5. **VR-first mapping** – sphere/capsule colliders on bones; desktop ray+hold simulates touch.

## Body zones (companion)
| zone_id | Bone / approx attach | Default act |
|---------|----------------------|-------------|
| `head` | head | stroke hair / face |
| `mouth` | head offset | finger near lips → oral tease cue |
| `breast_l` / `breast_r` | upper chest | cup / rub |
| `waist` | spine/hips | hold / pull closer |
| `hip_l` / `hip_r` | hips | grab |
| `glute_l` / `glute_r` | hips back | spank / squeeze |
| `thigh_l` / `thigh_r` | upper leg | stroke |
| `groin` | hips front | direct stimulation |
| `hand_l` / `hand_r` | hands | hold hands |

Each zone: `radius_m`, `sensitivity` (0.5–1.5), `unlock_bond` (0 = always).

## Player verbs
| verb | Input (VR) | Input (desktop) | Effect |
|------|------------|-----------------|--------|
| `touch` | hand/controller inside zone collider | ray on zone + hold LMB | arousal += rate * sensitivity * dt |
| `grab_zone` | grip while in zone | E/hold | locks relative offset; higher arousal rate |
| `use_intense` | trigger while touching groin/mouth/breast | F while touching | burst arousal + strong reaction |
| `spank` | short velocity impulse on glute | click impulse | one-shot reaction + small arousal |
| `release` | grip release / leave collider | release key | decay toward afterglow if peak recently |
| `approach` | body proximity | walk near | enables soft lines; not sex by itself |

## Pleasure model
```text
arousal ∈ [0, 100]
levels: idle (0–15) | tease (15–40) | hot (40–75) | peak_build (75–95) | orgasm (95–100)

on touch:  arousal += base_rate * sensitivity * grab_mult * dt
on release: arousal -= decay_rate * dt (faster if not peaked)
orgasm: when arousal hits 100 → play orgasm reaction → drop to 35 (afterglow) → refractory_s
```
Config in `content/adult_interaction.yaml`.

## Reactions (must be perceivable)
| trigger | Presentation |
|---------|----------------|
| zone_enter | short breath / glance |
| sustained_touch | loop soft moan layer; expression weight ↑ |
| grab | stronger moan; optional lean toward hand |
| spank | one-shot vocal + blink/flinch blend |
| level_up (tease→hot→…) | distinct line from adult dialogue pool |
| orgasm | climax line + expression max + audio stinger; brief busy lock |
| stop / walk away | afterglow or soft disappointed line if high arousal |

VRM: drive `expression` / blendshape proxies (`joy`, `a`, `blink`) and simple procedural lean if no full animation set yet.

## Soft props still valid
Cup / vinyl / lantern remain; adult path is **additional**. Bond can rise faster from successful intimate beats (`bond_on_orgasm`, `bond_on_first_hot`).

## Explicit non-goals (this slice)
- Full soft-body / penetration physics solver (CH-depth) – **phase 2**
- Toy inventory 20+ – **phase 2**
- Multi-character sandbox director – **out of scope**
- Non-consensual framing – companion is always willing/engaged in fiction; player can always disengage

## Agency checklist (CH-oriented, our implementation)
- [ ] Can touch multiple zones and see different reactions
- [ ] Can grab and hold a zone
- [ ] Arousal rises only while interacting
- [ ] Orgasm peak is readable (audio + face + meter)
- [ ] Can stop mid-interaction; state recovers cleanly
- [ ] Works desktop + WebXR hands/controllers

## Safety / product
- Adult content warning on start screen once per session.
- No minors in content or models.
- Third-party VRM rights per `VRM_INVENTORY.md`.
