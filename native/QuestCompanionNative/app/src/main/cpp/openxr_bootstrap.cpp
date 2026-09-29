#include "openxr_bootstrap.h"

#include <android/log.h>
#include <vulkan/vulkan.h>
#include <openxr/openxr_platform.h>

#include <algorithm>
#include <array>
#include <cstring>
#include <cstdio>
#include <vector>

namespace quest_companion {
namespace {

constexpr const char* kLogTag = "QuestCompanionXR";

#define QC_LOGI(...) __android_log_print(ANDROID_LOG_INFO, kLogTag, __VA_ARGS__)
#define QC_LOGE(...) __android_log_print(ANDROID_LOG_ERROR, kLogTag, __VA_ARGS__)

std::vector<XrExtensionProperties> EnumerateExtensions() {
    uint32_t count = 0;
    XrResult result = xrEnumerateInstanceExtensionProperties(nullptr, 0, &count, nullptr);
    if (XR_FAILED(result)) {
        QC_LOGE("xrEnumerateInstanceExtensionProperties(count) failed: %d", result);
        return {};
    }

    std::vector<XrExtensionProperties> extensions(
        count,
        XrExtensionProperties{XR_TYPE_EXTENSION_PROPERTIES});
    result = xrEnumerateInstanceExtensionProperties(nullptr, count, &count, extensions.data());
    if (XR_FAILED(result)) {
        QC_LOGE("xrEnumerateInstanceExtensionProperties(list) failed: %d", result);
        return {};
    }
    extensions.resize(count);
    return extensions;
}

}  // namespace

OpenXrBootstrap::OpenXrBootstrap(GameActivity* activity) noexcept : activity_(activity) {}

OpenXrBootstrap::~OpenXrBootstrap() {
    if (instance_ != XR_NULL_HANDLE) {
        for (auto& tracker : handTrackers_) {
            if (tracker != XR_NULL_HANDLE) {
                PFN_xrDestroyHandTrackerEXT destroy = nullptr;
                xrGetInstanceProcAddr(
                    instance_,
                    "xrDestroyHandTrackerEXT",
                    reinterpret_cast<PFN_xrVoidFunction*>(&destroy));
                if (destroy != nullptr) {
                    destroy(tracker);
                }
                tracker = XR_NULL_HANDLE;
            }
        }
    }
    if (instance_ != XR_NULL_HANDLE) {
        const XrResult result = xrDestroyInstance(instance_);
        if (XR_FAILED(result)) {
            QC_LOGE("xrDestroyInstance failed: %s", ResultName(result));
        }
    }
}

bool OpenXrBootstrap::Initialize() {
    if (activity_ == nullptr || activity_->vm == nullptr || activity_->javaGameActivity == nullptr) {
        QC_LOGE("GameActivity JNI handles are unavailable");
        return false;
    }
    if (!InitializeLoader() || !CreateInstance()) {
        return false;
    }

    QC_LOGI("OpenXR bootstrap initialized; waiting for HMD system");
    TryAcquireSystem();
    return true;
}

bool OpenXrBootstrap::InitializeLoader() const {
    PFN_xrInitializeLoaderKHR initializeLoader = nullptr;
    const XrResult procResult = xrGetInstanceProcAddr(
        XR_NULL_HANDLE,
        "xrInitializeLoaderKHR",
        reinterpret_cast<PFN_xrVoidFunction*>(&initializeLoader));
    if (XR_FAILED(procResult) || initializeLoader == nullptr) {
        QC_LOGE("xrInitializeLoaderKHR is unavailable: %d", procResult);
        return false;
    }

    XrLoaderInitInfoAndroidKHR initInfo{XR_TYPE_LOADER_INIT_INFO_ANDROID_KHR};
    initInfo.applicationVM = activity_->vm;
    initInfo.applicationContext = activity_->javaGameActivity;
    const XrResult result = initializeLoader(
        reinterpret_cast<const XrLoaderInitInfoBaseHeaderKHR*>(&initInfo));
    if (XR_FAILED(result)) {
        QC_LOGE("xrInitializeLoaderKHR failed: %d", result);
        return false;
    }
    return true;
}

bool OpenXrBootstrap::CreateInstance() {
    const auto extensions = EnumerateExtensions();
    if (extensions.empty()) {
        QC_LOGE("OpenXR runtime reported no instance extensions");
        return false;
    }

    for (const auto& extension : extensions) {
        QC_LOGI("OpenXR extension: %s v%u", extension.extensionName, extension.extensionVersion);
    }

    const auto available = [&extensions](const char* name) {
        return std::any_of(
            extensions.begin(),
            extensions.end(),
            [name](const XrExtensionProperties& candidate) {
                return std::strcmp(candidate.extensionName, name) == 0;
            });
    };
    if (!available(XR_KHR_ANDROID_CREATE_INSTANCE_EXTENSION_NAME)) {
        QC_LOGE("Required extension missing: %s", XR_KHR_ANDROID_CREATE_INSTANCE_EXTENSION_NAME);
        return false;
    }

    std::vector<const char*> enabledExtensions{
        XR_KHR_ANDROID_CREATE_INSTANCE_EXTENSION_NAME,
    };
    if (available(XR_KHR_VULKAN_ENABLE2_EXTENSION_NAME)) {
        enabledExtensions.push_back(XR_KHR_VULKAN_ENABLE2_EXTENSION_NAME);
    } else {
        QC_LOGE("Required render extension missing: %s", XR_KHR_VULKAN_ENABLE2_EXTENSION_NAME);
        return false;
    }
    if (available(XR_EXT_HAND_TRACKING_EXTENSION_NAME)) {
        enabledExtensions.push_back(XR_EXT_HAND_TRACKING_EXTENSION_NAME);
        handTrackingAvailable_ = true;
        QC_LOGI("Hand tracking extension enabled");
    } else {
        QC_LOGI("Hand tracking extension unavailable – controller fallback only");
    }

    XrInstanceCreateInfoAndroidKHR androidInfo{XR_TYPE_INSTANCE_CREATE_INFO_ANDROID_KHR};
    androidInfo.applicationVM = activity_->vm;
    androidInfo.applicationActivity = activity_->javaGameActivity;

    XrInstanceCreateInfo createInfo{XR_TYPE_INSTANCE_CREATE_INFO};
    createInfo.next = &androidInfo;
    std::strncpy(
        createInfo.applicationInfo.applicationName,
        "Quest Companion Native",
        XR_MAX_APPLICATION_NAME_SIZE - 1);
    std::strncpy(
        createInfo.applicationInfo.engineName,
        "ZEVRA Native Runtime",
        XR_MAX_ENGINE_NAME_SIZE - 1);
    createInfo.applicationInfo.applicationVersion = 1;
    createInfo.applicationInfo.engineVersion = 1;
    createInfo.applicationInfo.apiVersion = XR_MAKE_VERSION(1, 0, 34);
    createInfo.enabledExtensionCount = static_cast<uint32_t>(enabledExtensions.size());
    createInfo.enabledExtensionNames = enabledExtensions.data();

    const XrResult result = xrCreateInstance(&createInfo, &instance_);
    if (XR_FAILED(result)) {
        QC_LOGE("xrCreateInstance failed: %d", result);
        instance_ = XR_NULL_HANDLE;
        return false;
    }

    XrInstanceProperties properties{XR_TYPE_INSTANCE_PROPERTIES};
    if (XR_SUCCEEDED(xrGetInstanceProperties(instance_, &properties))) {
        QC_LOGI(
            "OpenXR runtime: %s %u.%u.%u",
            properties.runtimeName,
            XR_VERSION_MAJOR(properties.runtimeVersion),
            XR_VERSION_MINOR(properties.runtimeVersion),
            XR_VERSION_PATCH(properties.runtimeVersion));
    }

    LoadHandTrackingFunctions();
    return true;
}

void OpenXrBootstrap::LoadHandTrackingFunctions() {
    if (!handTrackingAvailable_ || instance_ == XR_NULL_HANDLE) {
        return;
    }
    const XrResult create = xrGetInstanceProcAddr(
        instance_,
        "xrCreateHandTrackerEXT",
        reinterpret_cast<PFN_xrVoidFunction*>(&xrCreateHandTrackerEXT_));
    const XrResult locate = xrGetInstanceProcAddr(
        instance_,
        "xrLocateHandJointsEXT",
        reinterpret_cast<PFN_xrVoidFunction*>(&xrLocateHandJointsEXT_));
    if (XR_FAILED(create) || XR_FAILED(locate) ||
        xrCreateHandTrackerEXT_ == nullptr || xrLocateHandJointsEXT_ == nullptr) {
        QC_LOGE("Hand tracking function loading failed: create=%d locate=%d", create, locate);
        handTrackingAvailable_ = false;
        xrCreateHandTrackerEXT_ = nullptr;
        xrLocateHandJointsEXT_ = nullptr;
        return;
    }
    QC_LOGI("Hand tracking functions loaded");
}

bool OpenXrBootstrap::TryAcquireSystem() {
    if (instance_ == XR_NULL_HANDLE || systemId_ != XR_NULL_SYSTEM_ID) {
        return systemId_ != XR_NULL_SYSTEM_ID;
    }

    XrSystemGetInfo getInfo{XR_TYPE_SYSTEM_GET_INFO};
    getInfo.formFactor = XR_FORM_FACTOR_HEAD_MOUNTED_DISPLAY;
    const XrResult result = xrGetSystem(instance_, &getInfo, &systemId_);
    if (result == XR_ERROR_FORM_FACTOR_UNAVAILABLE) {
        systemId_ = XR_NULL_SYSTEM_ID;
        return false;
    }
    if (XR_FAILED(result)) {
        QC_LOGE("xrGetSystem failed: %s", ResultName(result));
        systemId_ = XR_NULL_SYSTEM_ID;
        return false;
    }

    XrSystemProperties properties{XR_TYPE_SYSTEM_PROPERTIES};
    if (XR_SUCCEEDED(xrGetSystemProperties(instance_, systemId_, &properties))) {
        QC_LOGI(
            "OpenXR HMD ready: %s, vendor=%u, maxLayer=%u, maxSwapchain=%ux%u",
            properties.systemName,
            properties.vendorId,
            properties.graphicsProperties.maxLayerCount,
            properties.graphicsProperties.maxSwapchainImageWidth,
            properties.graphicsProperties.maxSwapchainImageHeight);
    }
    return true;
}

void OpenXrBootstrap::PollEvents() {
    if (instance_ == XR_NULL_HANDLE) {
        return;
    }

    XrEventDataBuffer event{XR_TYPE_EVENT_DATA_BUFFER};
    while (xrPollEvent(instance_, &event) == XR_SUCCESS) {
        QC_LOGI("OpenXR event type=%d", event.type);
        if (event.type == XR_TYPE_EVENT_DATA_INSTANCE_LOSS_PENDING) {
            QC_LOGE("OpenXR instance loss pending");
        }
        event = XrEventDataBuffer{XR_TYPE_EVENT_DATA_BUFFER};
    }
}

bool OpenXrBootstrap::HasExtension(const char* extensionName) const {
    const auto extensions = EnumerateExtensions();
    return std::any_of(
        extensions.begin(),
        extensions.end(),
        [extensionName](const XrExtensionProperties& extension) {
            return std::strcmp(extension.extensionName, extensionName) == 0;
        });
}

void OpenXrBootstrap::SetSession(XrSession session) {
    session_ = session;
    if (!handTrackingAvailable_ || session_ == XR_NULL_HANDLE) {
        return;
    }
    if (xrCreateHandTrackerEXT_ == nullptr) {
        QC_LOGE("Cannot create hand trackers: functions not loaded");
        return;
    }
    for (int i = 0; i < 2; ++i) {
        if (handTrackers_[i] != XR_NULL_HANDLE) {
            continue;  // already created
        }
        XrHandTrackerCreateInfoEXT createInfo{XR_TYPE_HAND_TRACKER_CREATE_INFO_EXT};
        createInfo.hand = i == 0 ? XR_HAND_LEFT_EXT : XR_HAND_RIGHT_EXT;
        createInfo.handJointSet = XR_HAND_JOINT_SET_DEFAULT_EXT;
        const XrResult result = xrCreateHandTrackerEXT_(instance_, &createInfo, &handTrackers_[i]);
        if (XR_FAILED(result)) {
            QC_LOGE("xrCreateHandTrackerEXT (%s) failed: %s",
                    i == 0 ? "left" : "right", ResultName(result));
            handTrackers_[i] = XR_NULL_HANDLE;
        }
    }
}

void OpenXrBootstrap::SetBaseSpace(XrSpace space) {
    baseSpace_ = space;
}

bool OpenXrBootstrap::SampleHandJoints(XrTime* predictedTime,
                                        XrHandJointLocationEXT* leftJoints,
                                        XrHandJointLocationEXT* rightJoints) {
    if (session_ == XR_NULL_HANDLE || baseSpace_ == XR_NULL_HANDLE ||
        handTrackers_[0] == XR_NULL_HANDLE || handTrackers_[1] == XR_NULL_HANDLE ||
        xrLocateHandJointsEXT_ == nullptr) {
        if (!handSampleLogEmitted_) {
            handSampleLogEmitted_ = true;
            QC_LOGI("Hand sampling inactive – session gate not reached yet");
        }
        return false;
    }
    if (predictedTime == nullptr || leftJoints == nullptr || rightJoints == nullptr) {
        return false;
    }

    for (int i = 0; i < 2; ++i) {
        XrHandJointsLocateInfoEXT locateInfo{XR_TYPE_HAND_JOINTS_LOCATE_INFO_EXT};
        locateInfo.baseSpace = baseSpace_;
        locateInfo.time = *predictedTime;
        XrHandJointLocationsEXT locations{XR_TYPE_HAND_JOINT_LOCATIONS_EXT};
        locations.jointCount = XR_HAND_JOINT_COUNT_EXT;
        locations.jointLocations = i == 0 ? leftJoints : rightJoints;
        const XrResult result = xrLocateHandJointsEXT_(handTrackers_[i], &locateInfo, &locations);
        if (XR_FAILED(result)) {
            QC_LOGE("xrLocateHandJointsEXT (%s) failed: %s",
                    i == 0 ? "left" : "right", ResultName(result));
            return false;
        }
        if (!locations.isActive) {
            return false;
        }
    }
    return true;
}

const char* OpenXrBootstrap::ResultName(XrResult result) const {
    static thread_local std::array<char, XR_MAX_RESULT_STRING_SIZE> name{};
    if (instance_ != XR_NULL_HANDLE && XR_SUCCEEDED(xrResultToString(instance_, result, name.data()))) {
        return name.data();
    }
    std::snprintf(name.data(), name.size(), "XrResult(%d)", result);
    return name.data();
}

}  // namespace quest_companion
