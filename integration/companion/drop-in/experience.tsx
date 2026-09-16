import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Elara } from "./elara";
import { Interactables } from "./interactables";
import { Player } from "./player";
import { Room } from "./room";
import { ContactBridge } from "./contact-bridge";

function Scene() {
  return (
    <>
      <color attach="background" args={["#120e0c"]} />
      <fog attach="fog" args={["#120e0c", 10, 20]} />
      <Room />
      <Elara />
      <Interactables />
      <Player />
      <ContactBridge />
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.28}
        scale={10}
        blur={2.4}
        far={3.5}
        color="#0a0807"
      />
    </>
  );
}

export function Experience() {
  return (
    <div className="absolute inset-0 bg-bg">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ fov: 66, position: [0.4, 1.4, 2.6], near: 0.07, far: 40 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#120e0c");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.7;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.domElement.style.touchAction = "none";
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
