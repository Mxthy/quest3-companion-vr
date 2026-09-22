#include "openxr_bootstrap.h"

#include <android/log.h>
#include <game-activity/native_app_glue/android_native_app_glue.h>

#include <chrono>
#include <memory>
#include <thread>

namespace {

constexpr const char* kLogTag = "QuestCompanion";

struct LifecycleState {
    bool resumed = false;
    bool hasWindow = false;
};

void HandleAppCommand(android_app* app, int32_t command) {
    auto* state = static_cast<LifecycleState*>(app->userData);
    if (state == nullptr) {
        return;
    }

    switch (command) {
        case APP_CMD_RESUME:
            state->resumed = true;
            __android_log_print(ANDROID_LOG_INFO, kLogTag, "GameActivity resumed");
            break;
        case APP_CMD_PAUSE:
            state->resumed = false;
            __android_log_print(ANDROID_LOG_INFO, kLogTag, "GameActivity paused");
            break;
        case APP_CMD_INIT_WINDOW:
            state->hasWindow = app->window != nullptr;
            __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native window created");
            break;
        case APP_CMD_TERM_WINDOW:
            state->hasWindow = false;
            __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native window destroyed");
            break;
        case APP_CMD_DESTROY:
            __android_log_print(ANDROID_LOG_INFO, kLogTag, "GameActivity destroy requested");
            break;
        default:
            break;
    }
}

}  // namespace

extern "C" void android_main(android_app* app) {
    LifecycleState lifecycle;
    app->userData = &lifecycle;
    app->onAppCmd = HandleAppCommand;

    __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native bootstrap starting");
    quest_companion::OpenXrBootstrap openxr(app->activity);
    if (!openxr.Initialize()) {
        __android_log_print(ANDROID_LOG_ERROR, kLogTag, "OpenXR bootstrap failed");
        GameActivity_finish(app->activity);
    }

    while (!app->destroyRequested) {
        android_poll_source* source = nullptr;
        const int timeoutMilliseconds = lifecycle.resumed ? 0 : -1;
        int events = 0;
        const int result = ALooper_pollOnce(
            timeoutMilliseconds,
            nullptr,
            &events,
            reinterpret_cast<void**>(&source));
        if (result >= 0 && source != nullptr) {
            source->process(app, source);
        }

        openxr.PollEvents();
        if (lifecycle.resumed && lifecycle.hasWindow && !openxr.HasSystem()) {
            openxr.TryAcquireSystem();
        }

        if (lifecycle.resumed) {
            std::this_thread::sleep_for(std::chrono::milliseconds(8));
        }
    }

    __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native bootstrap stopped");
}
