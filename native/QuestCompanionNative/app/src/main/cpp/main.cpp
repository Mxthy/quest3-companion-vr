#include "contact_sampler.h"
#include "openxr_bootstrap.h"

#include <android/log.h>
#include <game-activity/GameActivity.h>
#include <game-activity/native_app_glue/android_native_app_glue.h>
#include <jni.h>

#include <chrono>
#include <memory>
#include <thread>

namespace {

constexpr const char* kLogTag = "QuestCompanion";

struct LifecycleState {
    bool resumed = false;
    bool hasWindow = false;
};

// ── JNI bridge to com.zevra.questcompanion.ContactBridge ─────────────
// Cached in JNI_OnLoad (app classloader context), used from the native loop.
jclass g_contactBridgeClass = nullptr;
jmethodID g_onNativeContact = nullptr;

quest_companion::ContactSampler g_contactSampler;

void PushContactToJava(JNIEnv* env, const quest_companion::ContactEvent& ev) {
    if (env == nullptr || g_contactBridgeClass == nullptr || g_onNativeContact == nullptr) {
        return;  // bridge not loaded yet — sensing continues, events are dropped
    }
    env->CallStaticVoidMethod(
        g_contactBridgeClass,
        g_onNativeContact,
        static_cast<jint>(ev.region),
        static_cast<jfloat>(ev.intensity),
        static_cast<jfloat>(ev.durationMs),
        static_cast<jlong>(ev.timestampNs));
    if (env->ExceptionCheck()) {
        env->ExceptionClear();
    }
}

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

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
    JNIEnv* env = nullptr;
    if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
        __android_log_print(ANDROID_LOG_ERROR, kLogTag, "JNI_OnLoad: GetEnv failed");
        return JNI_ERR;
    }
    jclass local = env->FindClass("com/zevra/questcompanion/ContactBridge");
    if (local == nullptr) {
        if (env->ExceptionCheck()) env->ExceptionClear();
        __android_log_print(
            ANDROID_LOG_WARN, kLogTag,
            "ContactBridge class not found — native contact events will be dropped");
        return JNI_VERSION_1_6;
    }
    g_onNativeContact = env->GetStaticMethodID(
        local, "onNativeContact", "(IFFJ)V");
    if (g_onNativeContact == nullptr) {
        if (env->ExceptionCheck()) env->ExceptionClear();
        __android_log_print(
            ANDROID_LOG_WARN, kLogTag, "ContactBridge.onNativeContact not found");
    } else {
        g_contactBridgeClass = static_cast<jclass>(env->NewGlobalRef(local));
        __android_log_print(ANDROID_LOG_INFO, kLogTag, "ContactBridge JNI link ready");
    }
    return JNI_VERSION_1_6;
}

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

    // Attach the loop thread once; GameActivity keeps it alive for the app lifetime.
    JNIEnv* jniEnv = nullptr;
    JavaVM* vm = app->activity->vm;
    if (vm != nullptr && vm->AttachCurrentThread(&jniEnv, nullptr) == JNI_OK) {
        __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native loop attached to JVM");
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

        // ── Contact sensing: sample hand joints → zones → events → Java ──
        // Compiled and wired; stays inactive until the OpenXR session gate
        // provides an XrSession + base space (next bootstrap milestone).
        XrTime predictedTime = 0;
        XrHandJointLocationEXT leftJoints[XR_HAND_JOINT_COUNT_EXT] = {};
        XrHandJointLocationEXT rightJoints[XR_HAND_JOINT_COUNT_EXT] = {};
        if (openxr.SampleHandJoints(&predictedTime, leftJoints, rightJoints)) {
            g_contactSampler.Update(predictedTime, XR_NULL_HANDLE, leftJoints, rightJoints);
            quest_companion::ContactEvent ev{};
            while (g_contactSampler.PollEvent(ev)) {
                PushContactToJava(jniEnv, ev);
            }
        }

        if (lifecycle.resumed) {
            std::this_thread::sleep_for(std::chrono::milliseconds(8));
        }
    }

    if (jniEnv != nullptr && vm != nullptr) {
        vm->DetachCurrentThread();
    }
    __android_log_print(ANDROID_LOG_INFO, kLogTag, "Native bootstrap stopped");
}
