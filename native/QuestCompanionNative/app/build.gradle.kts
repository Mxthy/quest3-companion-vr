plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.zevra.questcompanion"
    compileSdk = 35
    ndkVersion = "27.2.12479018"

    defaultConfig {
        applicationId = "com.zevra.questcompanion"
        minSdk = 29
        targetSdk = 35
        versionCode = providers.environmentVariable("GITHUB_RUN_NUMBER")
            .orElse("1")
            .map { it.toInt() }
            .get()
        versionName = "0.1.0"

        ndk {
            abiFilters += "arm64-v8a"
        }

        externalNativeBuild {
            cmake {
                arguments += listOf(
                    "-DANDROID_STL=c++_shared",
                    "-DANDROID_ARM_NEON=TRUE",
                )
                cppFlags += listOf(
                    "-std=c++20",
                    "-Wall",
                    "-Wextra",
                    "-Wpedantic",
                    "-Werror=return-type",
                )
            }
        }
    }

    buildFeatures {
        prefab = true
        buildConfig = false
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            isJniDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        create("development") {
            initWith(getByName("debug"))
            matchingFallbacks += listOf("debug")
            applicationIdSuffix = ".development"
            versionNameSuffix = "-development"
        }
        release {
            isMinifyEnabled = false
            isDebuggable = false
        }
    }

    packaging {
        jniLibs {
            keepDebugSymbols += "**/libquest_companion.so"
        }
    }
}

dependencies {
    implementation(libs.game.activity)
    implementation(libs.openxr.loader)
}
