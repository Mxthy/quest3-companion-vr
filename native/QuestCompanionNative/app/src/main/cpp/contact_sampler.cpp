#include "contact_sampler.h"

#include <cmath>

namespace quest_companion {
namespace {

constexpr float kTapMaxMs   = 200.f;
constexpr float kHoldMinMs  = 1500.f;
constexpr float kPushSpeed  = 1.5f;  // m/s entry speed for a push
constexpr float kPushMaxMs  = 300.f;
constexpr float kFrameMs    = 16.f;  // fallback when no timestamp delta exists

inline float Distance(const XrVector3f& a, const XrVector3f& b) {
    const float dx = a.x - b.x;
    const float dy = a.y - b.y;
    const float dz = a.z - b.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

inline float Clamp01(float v) { return v < 0.f ? 0.f : (v > 1.f ? 1.f : v); }

}  // namespace

void ContactSampler::RegisterZone(BodyRegion region, XrPosef centerPose, float radius, bool allowed) {
    Zone z;
    z.region = region;
    z.pose = centerPose;
    z.radius = radius;
    z.allowed = allowed;
    zones_.push_back(z);
}

void ContactSampler::Update(XrTime predictedTime, XrSpace /*baseSpace*/,
                            const XrHandJointLocationEXT* leftJoints,
                            const XrHandJointLocationEXT* rightJoints) {
    // Hand joints are only valid while tracking works. Missing hands end all
    // in-flight touches so listeners always see Hold/Stroke exits.
    const bool leftValid =
        leftJoints != nullptr &&
        (leftJoints[XR_HAND_JOINT_PALM_EXT].locationFlags & XR_SPACE_LOCATION_POSITION_VALID_BIT) != 0;
    const bool rightValid =
        rightJoints != nullptr &&
        (rightJoints[XR_HAND_JOINT_PALM_EXT].locationFlags & XR_SPACE_LOCATION_POSITION_VALID_BIT) != 0;

    if (!leftValid && !rightValid) {
        EndAllTouches(predictedTime);
        return;
    }

    for (auto& zone : zones_) {
        if (leftValid) {
            EvaluateZone(zone, leftJoints[XR_HAND_JOINT_PALM_EXT].pose.position, predictedTime, true);
        } else if (zone.inside[0]) {
            EmitExit(zone, true, predictedTime);
        }
        if (rightValid) {
            EvaluateZone(zone, rightJoints[XR_HAND_JOINT_PALM_EXT].pose.position, predictedTime, false);
        } else if (zone.inside[1]) {
            EmitExit(zone, false, predictedTime);
        }

        // Grab: both hands inside the same zone at once.
        const bool both = zone.inside[0] && zone.inside[1];
        if (both && !zone.grabEmitted) {
            zone.grabEmitted = true;
            ContactEvent ev{};
            ev.region = zone.region;
            ev.type = TouchType::Grab;
            ev.intensity = 0.6f;
            const float dur = zone.presenceMs[0] < zone.presenceMs[1]
                ? zone.presenceMs[0] : zone.presenceMs[1];
            ev.durationMs = dur;
            ev.worldPos = zone.pose.position;
            ev.timestampNs = static_cast<uint64_t>(predictedTime);
            ev.allowed = zone.allowed;
            eventQueue_.push(ev);
        } else if (!both) {
            zone.grabEmitted = false;
        }
    }
}

void ContactSampler::EvaluateZone(Zone& zone, const XrVector3f& handPos,
                                   XrTime time, bool isLeft) {
    const size_t h = isLeft ? 0 : 1;
    const float d = Distance(handPos, zone.pose.position);

    if (d <= zone.radius) {
        const XrVector3f& prev = zone.lastHandPos[h];
        const float step = Distance(handPos, prev);
        const float speed = zone.inside[h] && step > 0.f ? step / (kFrameMs * 0.001f) : 0.f;
        if (!zone.inside[h]) {
            zone.inside[h] = true;
            zone.presenceMs[h] = 0.f;
            zone.presenceDepth[h] = d;
            zone.entrySpeed[h] = speed;
        } else {
            zone.presenceMs[h] += kFrameMs;
            if (d < zone.presenceDepth[h]) zone.presenceDepth[h] = d;
            zone.entrySpeed[h] = zone.entrySpeed[h] * 0.7f + speed * 0.3f;
        }
        zone.lastHandPos[h] = handPos;
    } else if (zone.inside[h]) {
        EmitExit(zone, isLeft, time);
    }
}

void ContactSampler::EmitExit(Zone& zone, bool isLeft, XrTime time) {
    const size_t h = isLeft ? 0 : 1;
    const float durationMs = zone.presenceMs[h];
    const float penetration = Clamp01(1.f - zone.presenceDepth[h] / zone.radius);

    TouchType type = TouchType::Stroke;
    if (durationMs < kTapMaxMs) type = TouchType::Tap;
    if (durationMs >= kHoldMinMs) type = TouchType::Hold;
    if (zone.entrySpeed[h] > kPushSpeed && durationMs < kPushMaxMs) type = TouchType::Push;

    ContactEvent ev{};
    ev.region = zone.region;
    ev.type = type;
    // Intensity: penetration depth (deeper = stronger) plus a small dwell bonus.
    ev.intensity = Clamp01(0.35f + 0.5f * penetration + durationMs / 8000.f);
    ev.durationMs = durationMs;
    ev.worldPos = zone.lastHandPos[h];
    ev.timestampNs = static_cast<uint64_t>(time);
    ev.allowed = zone.allowed;
    eventQueue_.push(ev);

    zone.inside[h] = false;
    zone.presenceMs[h] = 0.f;
    zone.presenceDepth[h] = 0.f;
    zone.entrySpeed[h] = 0.f;
    zone.grabEmitted = false;
}

void ContactSampler::EndAllTouches(XrTime time) {
    for (auto& zone : zones_) {
        if (zone.inside[0]) EmitExit(zone, true, time);
        if (zone.inside[1]) EmitExit(zone, false, time);
    }
}

bool ContactSampler::PollEvent(ContactEvent& outEvent) {
    if (eventQueue_.empty()) return false;
    outEvent = eventQueue_.front();
    eventQueue_.pop();
    return true;
}

}  // namespace quest_companion
