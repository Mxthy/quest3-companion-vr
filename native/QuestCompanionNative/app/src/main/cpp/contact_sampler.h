#pragma once

/**
 * ContactSampler — touch-zone sensing on top of XR_EXT_hand_tracking joints.
 * Sensing only: classification into Tap/Hold/Stroke/Grab/Push happens here,
 * every social decision stays in the TypeScript core layer.
 */

#include <openxr/openxr.h>

#include <cstdint>
#include <queue>
#include <vector>

namespace quest_companion {

enum class BodyRegion : uint8_t {
    Head, FaceL, FaceR,
    ShoulderL, ShoulderR,
    UpperArmL, UpperArmR,
    ForearmL, ForearmR,
    HandL, HandR,
    Chest, Belly, Back,
    HipL, HipR
};

enum class TouchType : uint8_t {
    None, Tap, Hold, Stroke, Grab, Push
};

struct ContactEvent {
    BodyRegion  region;
    TouchType   type;
    float       intensity;      // 0.0–1.0
    float       durationMs;
    XrVector3f  worldPos;
    uint64_t    timestampNs;
    bool        allowed;        // boundary check
};

class ContactSampler final {
public:
    /**
     * Register a touch zone. `centerPose` and all sampled hand joints must be
     * expressed in the same base space passed to Update().
     */
    void RegisterZone(BodyRegion region, XrPosef centerPose, float radius, bool allowed = true);

    void Update(XrTime predictedTime, XrSpace baseSpace,
                const XrHandJointLocationEXT* leftJoints,
                const XrHandJointLocationEXT* rightJoints);

    bool PollEvent(ContactEvent& outEvent);

    [[nodiscard]] size_t ZoneCount() const noexcept { return zones_.size(); }
    [[nodiscard]] bool HasEvents() const noexcept { return !eventQueue_.empty(); }

private:
    struct Zone {
        BodyRegion region;
        XrPosef    pose;
        float      radius;
        bool       allowed;
        // Per-hand state: index 0 = left, 1 = right.
        float       presenceMs[2] = {0.f, 0.f};
        float       presenceDepth[2] = {0.f, 0.f};  // deepest penetration 0..radius
        bool        inside[2] = {false, false};
        float       entrySpeed[2] = {0.f, 0.f};
        XrVector3f  lastHandPos[2] = {};
        bool        grabEmitted = false;
    };

    std::vector<Zone> zones_;
    std::queue<ContactEvent> eventQueue_;

    void EvaluateZone(Zone& zone, const XrVector3f& handPos, XrTime time, bool isLeft);
    void EmitExit(Zone& zone, bool isLeft, XrTime time);
    void EndAllTouches(XrTime time);
};

}  // namespace quest_companion
