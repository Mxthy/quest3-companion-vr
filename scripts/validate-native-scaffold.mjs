import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("native/QuestCompanionNative");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const versions = await read("gradle/libs.versions.toml");
for (const required of ['agp = "8.7.3"', 'gameActivity = "4.4.2"', 'openxrLoader = "1.1.63"']) {
  assert.ok(versions.includes(required), `missing pinned version: ${required}`);
}

const gradle = await read("app/build.gradle.kts");
for (const required of [
  "compileSdk = 35",
  'ndkVersion = "27.2.12479018"',
  "minSdk = 29",
  "targetSdk = 35",
  'abiFilters += "arm64-v8a"',
  'version = "3.22.1"',
  "prefab = true",
]) {
  assert.ok(gradle.includes(required), `native Gradle contract missing: ${required}`);
}

const manifest = await read("app/src/main/AndroidManifest.xml");
for (const required of [
  "android.hardware.vr.headtracking",
  "com.google.androidgamesdk.GameActivity",
  "com.oculus.intent.category.VR",
  "quest3|quest3s",
]) {
  assert.ok(manifest.includes(required), `manifest contract missing: ${required}`);
}

const bootstrap = await read("app/src/main/cpp/openxr_bootstrap.cpp");
for (const required of [
  "xrInitializeLoaderKHR",
  "XR_KHR_ANDROID_CREATE_INSTANCE_EXTENSION_NAME",
  "XR_KHR_VULKAN_ENABLE2_EXTENSION_NAME",
  "xrCreateInstance",
  "xrGetSystem",
  "xrPollEvent",
]) {
  assert.ok(bootstrap.includes(required), `OpenXR bootstrap missing: ${required}`);
}

const cmake = await read("app/src/main/cpp/CMakeLists.txt");
for (const required of [
  "XR_USE_PLATFORM_ANDROID",
  "XR_USE_GRAPHICS_API_VULKAN",
  "game-activity::game-activity_static",
  "OpenXR::openxr_loader",
  "-Wl,-z,max-page-size=16384",
]) {
  assert.ok(cmake.includes(required), `native CMake contract missing: ${required}`);
}

const workflow = await readFile(".github/workflows/build-native-quest-apk.yml", "utf8");
for (const required of [
  "gradle-version: ${{ env.GRADLE_VERSION }}",
  "ndk;${ANDROID_NDK}",
  ":app:assembleDebug",
  "native-code: 'arm64-v8a'",
  "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
]) {
  assert.ok(workflow.includes(required), `native workflow missing: ${required}`);
}

const banned = new Set([".apk", ".aab", ".vrm", ".keystore", ".jks", ".so"]);
async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const info = await stat(file);
    if (info.isDirectory()) await walk(file);
    else
      assert.ok(
        !banned.has(path.extname(entry).toLowerCase()),
        `binary must not be committed: ${file}`,
      );
  }
}
await walk(root);

console.log("NATIVE_SCAFFOLD_OK: pinned ARM64 GameActivity/OpenXR bootstrap and APK workflow");
