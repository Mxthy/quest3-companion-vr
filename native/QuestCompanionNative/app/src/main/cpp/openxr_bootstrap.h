#pragma once

#include <game-activity/GameActivity.h>
#include <openxr/openxr.h>

namespace quest_companion {

class OpenXrBootstrap final {
public:
    explicit OpenXrBootstrap(GameActivity* activity) noexcept;
    ~OpenXrBootstrap();

    OpenXrBootstrap(const OpenXrBootstrap&) = delete;
    OpenXrBootstrap& operator=(const OpenXrBootstrap&) = delete;

    bool Initialize();
    void PollEvents();
    bool TryAcquireSystem();

    [[nodiscard]] bool IsReady() const noexcept { return instance_ != XR_NULL_HANDLE; }
    [[nodiscard]] bool HasSystem() const noexcept { return systemId_ != XR_NULL_SYSTEM_ID; }
    [[nodiscard]] bool HandTrackingEnabled() const noexcept { return handTrackingAvailable_; }

    /**
     * Session gate (future milestone): create hand trackers once an
     * XrSession exists. No-op until then.
     */
    void SetSession(XrSession session);
    void SetBaseSpace(XrSpace space);

    /**
     * Sample hand joints into the provided XR_HAND_JOINT_COUNT_EXT arrays.
     * Returns false while the session gate is not reached (no real joints).
     */
    bool SampleHandJoints(XrTime* predictedTime,
                          XrHandJointLocationEXT* leftJoints,
                          XrHandJointLocationEXT* rightJoints);

private:
    bool InitializeLoader() const;
    bool CreateInstance();
    void LoadHandTrackingFunctions();
    bool HasExtension(const char* extensionName) const;
    const char* ResultName(XrResult result) const;

    GameActivity* activity_ = nullptr;
    XrInstance instance_ = XR_NULL_HANDLE;
    XrSystemId systemId_ = XR_NULL_SYSTEM_ID;
    bool handTrackingAvailable_ = false;
    XrSession session_ = XR_NULL_HANDLE;
    XrSpace baseSpace_ = XR_NULL_HANDLE;
    XrHandTrackerEXT handTrackers_[2] = {XR_NULL_HANDLE, XR_NULL_HANDLE};
    PFN_xrCreateHandTrackerEXT xrCreateHandTrackerEXT_ = nullptr;
    PFN_xrLocateHandJointsEXT xrLocateHandJointsEXT_ = nullptr;
    bool handSampleLogEmitted_ = false;
};

}  // namespace quest_companion
