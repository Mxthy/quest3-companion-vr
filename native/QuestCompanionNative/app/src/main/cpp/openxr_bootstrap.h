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

private:
    bool InitializeLoader() const;
    bool CreateInstance();
    bool HasExtension(const char* extensionName) const;
    const char* ResultName(XrResult result) const;

    GameActivity* activity_ = nullptr;
    XrInstance instance_ = XR_NULL_HANDLE;
    XrSystemId systemId_ = XR_NULL_SYSTEM_ID;
};

}  // namespace quest_companion
