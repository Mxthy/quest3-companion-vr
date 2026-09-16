# Quest 3 – 5 Architecture Levers (Performance)

Snapdragon XR2 Gen 2 + 90 Hz WebXR: automatic optimizers are not enough. These decisions are binding for this project.

## 1. Multi-threading (CPU)

| Decision | Physics + heavy sim off main thread when scaled |
|----------|--------------------------------------------------|
| Now | Rapier on main for vertical slice (few bodies) |
| Next | Rapier/Jolt in **Web Worker**; positions via messages or SharedArrayBuffer |
| Soft toys | Verlet stays cheap on main (few points) or same worker later |

Never run dense physics + full scene graph mutation on one JS thread at 90 Hz under load.

## 2. Forward rendering + baked light (GPU)

| Decision | **Forward** only; no deferred G-buffer path on Quest Web |
|----------|----------------------------------------------------------|
| Lights | Strict limit (1–2 dynamic, prefer **none** dynamic) |
| Content | **Baked lightmaps** for room; probes/SH for dynamics |
| Shadows | Prefer **blob/contact shadow planes**; avoid cascaded realtime |

Trade: GPU budget → textures / mesh detail, not many realtime lights.

## 3. Foveated rendering + dynamic resolution

| Decision | Enable **Fixed Foveated Rendering** (medium/high) via WebXR |
|----------|------------------------------------------------------------|
| Plus | **Resolution scale** down if FPS &lt; 90 instead of hitching |

Meta WebXR perf BP: sustained performance &gt; peak.

## 4. Instancing + shared materials (draw calls)

| Decision | Cap ~**100–150** draw calls; instance identical props |
|----------|------------------------------------------------------|
| Assets | Texture **atlases**; share `MeshStandardMaterial` |
| Soft toys | Few unique meshes; no one-material-per-segment if avoidable |

## 5. Zero allocation in tick (GC killer)

| Decision | **No `new`** in `useFrame` / rAF / physics tick |
|----------|------------------------------------------------|
| Pattern | Module-level `Vector3`/`Quaternion`/`Matrix4` pools; `.set()` / `.copy()` |
| Verlet | Reuse point buffers; no per-frame object literals in hot path |

GC pause = VR freeze = immersion break.

---

## Asset format (mandatory direction)

| Format | Role |
|--------|------|
| **glTF 2.0 / GLB** | Scene + props |
| **Meshopt** and/or **Draco** | Geometry compression |
| **KTX2 (Basis UASTC/ETC1S)** | GPU textures (`KHR_texture_basisu`) |
| Avoid in ship builds | Raw PNG/JPG floods, unoptimized FBX |

Pipeline sketch: author → GLB → `gltf-transform` (meshopt + ktx2) → load with Three `GLTFLoader` + `KTX2Loader` + MeshoptDecoder.

See also: `docs/QUEST3_PHYSICS.md`, `docs/TEXTURES_AND_TOYS.md`, Wissensspeicher `textures/ktx2-*`, `webxr/meta-quest-perf-bp`.
