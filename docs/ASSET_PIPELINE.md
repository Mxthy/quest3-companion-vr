# Asset Pipeline – glTF / Meshopt / KTX2

## Target deliverable

Compressed **GLB** per prop or room section:
- Mesh: Meshopt (preferred for Web) or Draco
- Textures: KTX2 via `KHR_texture_basisu`
- Materials: metallic-roughness, shared where possible

## Recommended CLI (host machine)

```bash
npm i -g @gltf-transform/cli
# mesh + texture pipeline (illustrative)
gltf-transform optimize input.glb output.glb --compress meshopt
# or texture: use toktx / gltf-transform etc for KTX2
```

## Runtime (Three / R3F)

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const ktx2 = new KTX2Loader().setTranscoderPath("/basis/");
ktx2.detectSupport(renderer);
const loader = new GLTFLoader();
loader.setKTX2Loader(ktx2);
loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync("/models/props/cup.glb");
```

## Project phases

| Phase | Assets |
|-------|--------|
| MVP | Procedural canvas textures + primitive meshes (current) |
| Vertical slice | GLB props with shared materials |
| Ship | Meshopt GLB + KTX2, atlased where possible |

Procedural `propTextures.ts` remains valid for prototype; replace maps with KTX2 when baking.
