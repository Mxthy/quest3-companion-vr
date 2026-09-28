#!/usr/bin/env python3
"""Generate src/data/vivi-voice-schema.json from the voice manifest.

Maps each authored voice clip onto semantic metadata (intent, trigger,
state, mood, relationship, priority, cooldown, object, animation, lookAt,
fallback) so the NPC brain can decide *which* line fits a situation
instead of treating the library as a dumb audio dictionary.

Usage: python3 scripts/gen-voice-schema.py  (from app/ or repo root)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "app"
MANIFEST = ROOT / "src/data/vivi-voice-manifest.json"
OUT = ROOT / "src/data/vivi-voice-schema.json"

INTENSITY = {
    "casual": 0.15, "soft": 0.2, "hand": 0.2, "hand_hold": 0.3, "hand_kiss": 0.35,
    "head": 0.3, "head_more": 0.45, "head_kiss": 0.5,
    "chest": 0.5, "chest_slow": 0.6, "chest_tease": 0.7,
    "intimate": 0.8, "intimate_slow": 0.85,
}
INTERACTION = {
    "hand": "HAND", "hand_hold": "HAND", "hand_kiss": "HAND",
    "head": "HEAD", "head_more": "HEAD", "head_kiss": "HEAD",
    "chest": "CHEST", "chest_slow": "CHEST", "chest_tease": "CHEST", "chest_stop": "CHEST",
    "intimate": "INTIMATE", "intimate_ask": "INTIMATE", "intimate_yes": "INTIMATE",
    "intimate_slow": "INTIMATE", "intimate_stop": "INTIMATE",
    "casual": "BODY", "soft": "BODY",
}
REL_MIN = {"hand": 1, "head": 1, "head_kiss": 2, "chest": 2, "chest_slow": 2,
           "chest_tease": 3, "intimate": 3, "intimate_ask": 2, "intimate_yes": 3,
           "intimate_slow": 3}
CONSENT_REQUIRED = {"chest", "chest_slow", "chest_tease", "intimate", "intimate_slow"}

GIFT_OBJECTS = ["cocoa_box", "hair_ribbon", "honey_tart", "loose_leaf_tea",
                "moon_pendant", "poetry_book", "sleepy_plush", "wildflowers"]

def build(clip_id: str, text: str, file: str, style: str):
    c = {
        "id": clip_id, "text": text, "file": file, "style": style,
        "intent": "", "trigger": "", "moods": [], "relationshipMin": 0,
        "requiresConsent": False, "priority": 5, "cooldownSec": 30,
        "requiredObject": None, "animation": "soft_smile", "lookAt": "player",
        "fallback": None, "intensity": None, "interaction": None,
    }
    m = clip_id

    if m.startswith("touch_"):
        sub = m[len("touch_"):]
        c["interaction"] = INTERACTION.get(sub, "BODY")
        if sub in ("chest_stop", "intimate_stop"):
            c.update(intent="SET_BOUNDARY", trigger="player_touch_refused",
                     moods=["firm", "calm"], priority=9, cooldownSec=10,
                     animation="serious", fallback=None)
        elif sub == "intimate_ask":
            c.update(intent="ASK_PERMISSION", trigger="player_touch_intimate",
                     moods=["quiet", "careful"], priority=8, cooldownSec=15,
                     animation="soft_smile", fallback="consent_ask")
        elif sub == "intimate_yes":
            c.update(intent="CONSENT_GRANT", trigger="player_touch_intimate",
                     moods=["warm", "soft"], priority=8, cooldownSec=15,
                     fallback="consent_yes")
        else:
            c.update(intent="RESPOND_TO_TOUCH", trigger="player_touch",
                     moods=["soft", "affectionate"], priority=6,
                     cooldownSec=20, relationshipMin=REL_MIN.get(sub, 1),
                     requiresConsent=sub in CONSENT_REQUIRED,
                     intensity=INTENSITY.get(sub, 0.3),
                     fallback="touch_soft" if sub != "soft" else None)
        return c

    if m.startswith("consent_"):
        sub = m[len("consent_"):]
        mapping = {
            "ask": ("CONSENT_ASK", "after_intimate_touch", ["careful"], 8, 30),
            "boundaries": ("CONSENT_BOUNDARIES", "check_in", ["firm", "warm"], 8, 45),
            "wait": ("CONSENT_WAIT", "await_player_answer", ["patient"], 7, 20, "consent_ask"),
            "yes": ("CONSENT_GRANT", "after_consent_ask", ["warm", "soft"], 8, 15),
        }
        v = mapping.get(sub)
        intent, trigger, moods, prio, cd = v[0], v[1], v[2], v[3], v[4]
        c.update(intent=intent, trigger=trigger, moods=moods, priority=prio,
                 cooldownSec=cd, fallback=v[5] if len(v) > 5 else "consent_ask",
                 relationshipMin=1, animation="soft_smile")
        return c

    if m.startswith("negotiate_"):
        c.update(intent="NEGOTIATE", trigger="intimacy_negotiation", moods=["calm", "warm"],
                 priority=7, cooldownSec=25, relationshipMin=2, animation="nod")
        topic = m[len("negotiate_"):]
        if topic == "not_tonight":
            c.update(intent="DEFER_SOFT", moods=["soft", "firm"], priority=8)
        elif topic in ("pace_slow", "pace_medium", "pace_explore"):
            c.update(moods=["calm"], trigger="pace_setting")
        elif topic.startswith("region_"):
            c.update(trigger="region_negotiation",
                     requiresConsent=False, relationshipMin=3)
            c["fallback"] = "negotiate_regions"
        return c

    if m.startswith("gift_"):
        obj = m[len("gift_"):]
        if obj in GIFT_OBJECTS:
            c.update(intent="GIFT_RECEIVE", trigger="gift_given", moods=["surprised", "warm"],
                     priority=7, cooldownSec=600, requiredObject=obj,
                     relationshipMin=1, fallback="gift_generic")
        elif obj == "generic":
            c.update(intent="GIFT_RECEIVE", trigger="gift_given", moods=["warm"],
                     priority=6, cooldownSec=600, fallback=None)
        elif obj == "thanks":
            c.update(intent="GIFT_THANKS", trigger="gift_reaction_later", moods=["warm", "soft"],
                     priority=5, cooldownSec=180, fallback="gift_generic")
        return c

    lm = re.fullmatch(r"level([1-5])_[a-z]", m)
    if lm:
        lvl = int(lm.group(1))
        c.update(intent="RELATIONSHIP_MILESTONE", trigger=f"relationship_level_{lvl}",
                 moods=["warm"], priority=9, cooldownSec=10_000_000,
                 relationshipMin=lvl - 1, animation="soft_smile")
        return c

    if re.fullmatch(r"idle_[123]", m):
        c.update(intent="IDLE_AMBIENT", trigger="idle_timeout", moods=["calm", "daydreamy"],
                 priority=2, cooldownSec=120, lookAt="away", animation="think")
        return c

    if m.startswith("morning_"):
        c.update(intent="GREET_MORNING", trigger="player_entered", moods=["soft", "awake"],
                 priority=5, cooldownSec=3600, lookAt="player")
        return c
    if m.startswith("evening_"):
        c.update(intent="GREET_EVENING", trigger="player_entered", moods=["soft", "warm"],
                 priority=5, cooldownSec=3600, lookAt="player")
        return c
    if m in ("night_1", "night_2"):
        c.update(intent="GREET_NIGHT", trigger="player_entered", moods=["quiet"],
                 priority=5, cooldownSec=3600, lookAt="player")
        return c

    if m.startswith("bed_"):
        c.update(intent="INVITE_BED" if m == "bed_invite" else "BED_TALK",
                 trigger="at_bed", moods=["soft"], priority=4, cooldownSec=600,
                 requiredObject="bed", relationshipMin=2, lookAt="player")
        if m == "bed_negotiate":
            c.update(intent="NEGOTIATE", trigger="bed_negotiation", priority=6)
        if m == "bed_sleep":
            c.update(intent="SLEEP_TALK", priority=3)
        return c
    if m in ("sleep_1", "sleep_yes", "sleep_later"):
        c.update(intent="SLEEP_TALK", trigger="late_hour", moods=["sleepy"],
                 priority=3, cooldownSec=1800, lookAt="player",
                 requiredObject=None, relationshipMin=1)
        if m == "sleep_yes":
            c["intent"] = "AGREE_SLEEP"
        if m == "sleep_later":
            c["intent"] = "DEFER_SLEEP"
        return c

    if m.startswith("cook_"):
        dish = m[len("cook_"):]
        c.update(intent="COOK", trigger="cooking", moods=["warm", "playful"],
                 priority=4, cooldownSec=600, requiredObject="stove",
                 lookAt="away", animation="think", fallback="cook_omurice" if dish != "omurice" else None)
        return c
    if m == "need_ingredients" or m == "no_recipe":
        c.update(intent="COOK_MISSING", trigger="cooking", moods=["wry"],
                 priority=5, cooldownSec=300, requiredObject="fridge",
                 lookAt="away", fallback=None)
        return c
    if m == "kettle_1":
        c.update(intent="MAKE_TEA", trigger="at_kettle", moods=["calm"],
                 priority=3, cooldownSec=600, requiredObject="kettle", lookAt="away")
        return c

    if m.startswith("couch_"):
        c.update(intent="REST_COUCH", trigger="at_couch", moods=["soft", "relaxed"],
                 priority=3, cooldownSec=600, requiredObject="couch",
                 lookAt="player", animation="relaxed")
        return c
    if m == "laptop_hello":
        c.update(intent="LAPTOP_TALK", trigger="at_laptop", moods=["surprised"],
                 priority=4, cooldownSec=600, requiredObject="laptop", lookAt="player")
        return c
    if m.startswith("laptop_"):
        c.update(intent="LAPTOP_TALK", trigger="at_laptop", moods=["shy" if m == "laptop_shy" else "warm"],
                 priority=3, cooldownSec=600, requiredObject="laptop",
                 lookAt="player", fallback="laptop_hello")
        return c
    if m == "diary_1":
        c.update(intent="DIARY_TALK", trigger="at_nightstand", moods=["soft", "guarded"],
                 priority=3, cooldownSec=900, requiredObject="nightstand",
                 relationshipMin=2, lookAt="player")
        return c
    if m == "mirror_1":
        c.update(intent="MIRROR_TALK", trigger="at_mirror", moods=["playful"],
                 priority=3, cooldownSec=900, requiredObject="mirror")
        return c
    if m.startswith("photo_"):
        c.update(intent="PHOTO_TALK", trigger="at_photo_frame", moods=["soft"],
                 priority=3, cooldownSec=900, requiredObject="photo_frame",
                 lookAt="player", relationshipMin=1)
        if m == "photo_pose_ask":
            c.update(intent="ASK_PERMISSION", priority=4)
        if m == "photo_pose_heat":
            c.update(moods=["teasing"], relationshipMin=2)
        return c
    if m in ("plant_1", "plant_2"):
        c.update(intent="PLANT_CARE", trigger="at_plant", moods=["soft", "fond"],
                 priority=3, cooldownSec=900, requiredObject="plant", lookAt="away")
        return c
    if m == "watered_already":
        c.update(intent="REFUSE", trigger="at_plant", moods=["wry"], priority=5,
                 cooldownSec=300, requiredObject="plant", lookAt="player")
        return c
    if m in ("shelf_1", "shelf_2"):
        c.update(intent="SHELF_TALK", trigger="at_bookshelf", moods=["thoughtful"],
                 priority=3, cooldownSec=900, requiredObject="bookshelf", lookAt="away",
                 fallback="shelf_1" if m == "shelf_2" else None)
        return c
    if m == "tv_1":
        c.update(intent="WATCH_TV", trigger="at_tv", moods=["relaxed"],
                 priority=3, cooldownSec=900, requiredObject="tv", lookAt="away")
        return c
    if m == "wardrobe_1":
        c.update(intent="WARDROBE_TALK", trigger="at_wardrobe", moods=["playful"],
                 priority=3, cooldownSec=900, requiredObject="wardrobe")
        return c
    if m.startswith("window_"):
        c.update(intent="WINDOW_TALK", trigger="at_window", moods=["quiet", "dreamy"],
                 priority=3, cooldownSec=900, requiredObject="window", lookAt="away")
        return c

    if m.startswith("aftercare_"):
        c.update(intent="AFTERCARE", trigger="after_intimate_moment", moods=["soft", "caring"],
                 priority=8, cooldownSec=120, relationshipMin=3, lookAt="player",
                 animation="soft_smile")
        return c
    if m.startswith("check_in_"):
        c.update(intent="CHECK_IN", trigger="check_in", moods=["caring"],
                 priority=8, cooldownSec=180, relationshipMin=2, lookAt="player")
        return c
    if m.startswith("flirt_kitchen"):
        c.update(intent="FLIRT", trigger="cooking_together", moods=["teasing", "warm"],
                 priority=5, cooldownSec=600, relationshipMin=2, lookAt="player")
        return c

    if m.startswith("vivi_"):
        base = {
            "vivi_curiosity": ("SELF_DISCUSS", ["curious"], 3, "idle_timeout"),
            "vivi_curiosity_soft": ("SELF_DISCUSS", ["soft"], 3, "player_question"),
            "vivi_curiosity_yes": ("SELF_DISCUSS", ["open"], 4, "player_question"),
            "vivi_invite_soft": ("INVITE_PLAYER", ["soft"], 4, "close_moment"),
            "vivi_invite_soft_yes": ("AGREE_INVITE", ["warm"], 4, "player_agreed"),
            "vivi_invite_declined": ("ACKNOWLEDGE_DECLINE", ["calm", "hurt"], 5, "player_declined"),
        }[m]
        c.update(intent=base[0], moods=base[1], priority=base[2] + 2, cooldownSec=300,
                 relationshipMin=2, trigger=base[3])
        return c
    if m == "alpha_done":
        c.update(intent="TASK_DONE", trigger="task_finished", moods=["satisfied"],
                 priority=4, cooldownSec=120, lookAt="away")
        return c
    if m == "pause_honored":
        c.update(intent="BOUNDARY_ACK", trigger="boundary_respected", moods=["grateful"],
                 priority=8, cooldownSec=60, lookAt="player")
        return c

    c.update(intent="GENERIC", trigger="fallback")
    return c


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    clips = []
    for clip_id, meta in manifest.items():
        clips.append(build(clip_id, meta.get("text", ""), meta.get("file", f"{clip_id}.mp3"),
                           meta.get("style", "")))
    out = {
        "version": 1,
        "source": "vivi_dialogue_audio_de_eve",
        "audioBasePath": "/audio/vivi/",
        "clipCount": len(clips),
        "clips": clips,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    ts = ROOT / "src/data/vivi-voice-generated.ts"
    body = json.dumps(clips, ensure_ascii=False, indent=2)
    # satisfy TS as-safe formatting: emit as plain typed array
    ts_body = (
        "/** AUTO-GENERATED by scripts/gen-voice-schema.py — do not edit by hand. */\n"
        "import type { VoiceClip } from \"@/lib/companion/voice/schema\";\n\n"
        "export const VOICE_CLIPS: VoiceClip[] = "
        + body
        + ";\n"
    )
    ts.write_text(ts_body, encoding="utf-8")
    print(f"wrote {OUT} and {ts} with {len(clips)} clips")

if __name__ == "__main__":
    sys.exit(main())
