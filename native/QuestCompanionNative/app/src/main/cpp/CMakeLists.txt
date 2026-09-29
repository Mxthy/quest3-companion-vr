cmake_minimum_required(VERSION 3.22.1)
project(quest_companion_native LANGUAGES C CXX)

find_package(game-activity REQUIRED CONFIG)
find_package(OpenXR REQUIRED CONFIG)

add_library(quest_companion SHARED
    main.cpp
    openxr_bootstrap.cpp
    contact_sampler.cpp
)

target_compile_features(quest_companion PRIVATE cxx_std_20)
target_compile_definitions(quest_companion PRIVATE
    XR_USE_PLATFORM_ANDROID
    XR_USE_GRAPHICS_API_VULKAN
    _FORTIFY_SOURCE=2
)
target_compile_options(quest_companion PRIVATE
    -fstack-protector-strong
    -Wformat
    -Werror=format-security
)
target_link_options(quest_companion PRIVATE
    -Wl,-z,relro
    -Wl,-z,now
    -Wl,-z,max-page-size=16384
)
target_include_directories(quest_companion PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}")

target_link_libraries(quest_companion PRIVATE
    game-activity::game-activity_static
    OpenXR::openxr_loader
    android
    log
    vulkan
)
