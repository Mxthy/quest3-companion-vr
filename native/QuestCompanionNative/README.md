# Quest Companion native OpenXR bootstrap

This project is the bounded native Android/C++ runtime for Meta Quest 3. It is not a general-purpose engine and it does not embed the WebXR application.

## Current milestone

The first bootstrap gate intentionally covers only:

- Android GameActivity lifecycle
- ARM64-only C++20 shared library
- Android OpenXR loader initialization
- OpenXR instance creation with Android and Vulkan-enable2 extensions
- HMD system discovery
- structured Logcat output
- reproducible debug APK compilation in GitHub Actions

It does **not** yet create the Vulkan device, OpenXR session, swapchains, stereo views, input actions, or render a frame. Those are the next gates and must not be reported as working until compiled and tested.

## Hand-tracking sensing (compiled, runtime-inactive)

Added on top of the bootstrap gate:

- `XR_EXT_HAND_TRACKING_EXTENSION_NAME` is enabled when the runtime offers it
  (with a controller-fallback log otherwise) and both PFNs
  (`xrCreateHandTrackerEXT`, `xrLocateHandJointsEXT`) are loaded after instance
  creation. Oculus hand-tracking permission + `uses-feature required=false` are
  in the manifest.
- `contact_sampler.h/.cpp` — sensing-only touch zone module: 17 body regions,
  per-hand zone tracking, Tap/Hold/Stroke/Grab/Push classification with
  penetration-based intensity, event queue.
- `main.cpp` caches `com.zevra.questcompanion.ContactBridge` in `JNI_OnLoad`
  and polls sampler events into it in the frame loop.
- `ContactBridge.java` fans events out to registered listeners.

The sampling path stays **inactive at runtime** until the OpenXR session gate
exists (`SetSession` / `SetBaseSpace` are ready to be called by it): there is
no `XrSession` yet, so `SampleHandJoints` returns false and no hand joints
flow. It is compiled by the APK workflow only — not reported as working.

## Pinned build matrix

| Component | Version |
| --- | --- |
| JDK | 17 |
| Gradle | 8.9 |
| Android Gradle Plugin | 8.7.3 |
| compile/target SDK | 35 |
| minimum SDK | 29 |
| Android NDK | 27.2.12479018 |
| CMake | 3.22.1 |
| GameActivity | 4.4.2 |
| Khronos OpenXR Loader AAR | 1.1.63 |
| ABI | arm64-v8a |
| C++ | C++20 |

Versions are centralized in `gradle/libs.versions.toml`, `app/build.gradle.kts`, and the workflow environment. Change them together and re-run the native validator.

## Build

The repository does not commit a Gradle Wrapper JAR. GitHub installs the exact Gradle version through the official Gradle setup action, then runs:

```bash
gradle --no-daemon --stacktrace :app:assembleDebug
```

The workflow publishes the debug-signed APK, SHA-256 checksum, unstripped native library, and toolchain version catalog for 14 days. No release signing key is needed for this bootstrap milestone.

## Device diagnostic

After installing the APK, capture the bootstrap log with:

```bash
adb logcat -s QuestCompanion QuestCompanionXR
```

Success requires the runtime name and `OpenXR HMD ready` message. Stereo, tracking, frame pacing, thermals, and 72 Hz remain physical Quest 3 gates.

## Asset rule

VRM, APK, AAB, keystore, symbol, and generated build files are not committed. VRM binaries remain in Drive and are introduced only after the native VRM loader gate exists.
