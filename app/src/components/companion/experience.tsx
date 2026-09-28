import { useEffect } from "react";
import { useThree, Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { AdultBridge } from "./adult-bridge";
import { VrmCompanion } from "./vrm-companion";
import { Interactables } from "./interactables";
import { Player } from "./player";
import { Room } from "./room";
import { useCompanion } from "@/lib/companion/store";
import { playerSim } from "@/lib/companion/player-ref";
import { adultRuntime, useAdultHud, useXrSessionActive } from "@/lib/companion/adult";
import { XrLayer } from "./xr-vr";
import { adultAnchors } from "./adult-anchors";

/** Testability probe: window.__quest = { state(), adult() } when ?debug=1 */
function DebugProbe() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!window.location.search.includes("debug=1")) return;
    const w = window as unknown as Record<string, unknown>;
    w.__quest = {
      state: () => {
        const s = useCompanion.getState();
        return {
          phase: s.phase,
          bond: s.bond,
          nearElara: s.nearElara,
          held: s.held,
          speech: s.speech,
        };
      },
      adult: () => useAdultHud.getState(),
      input: () => adultRuntime.input,
      teleport: (x: number, z: number, yaw: number) => {
        playerSim.position = { x, y: 1.62, z };
        playerSim.yaw = yaw;
        playerSim.speed = 0;
      },
      camera: () => {
        const v = camera.getWorldPosition(new THREE.Vector3());
        const d = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
        return { pos: [v.x, v.y, v.z], dir: [d.x, d.y, d.z] };
      },
      anchors: () => {
        const out: Record<string, number[]> = {};
        for (const [id, obj] of adultAnchors) {
          const v = obj.getWorldPosition(new THREE.Vector3());
          out[id] = [v.x, v.y, v.z];
        }
        return out;
      },
    };
  }, [camera]);
  return null;
}

function Scene() {
  const inXR = useXrSessionActive((s) => s.active);
  return (
    <>
      <color attach="background" args={["#120e0c"]} />
      <fog attach="fog" args={["#120e0c", 10, 20]} />
      <Room />
      <VrmCompanion />
      <Interactables />
      <AdultBridge />
      <Player />
      <XrLayer />
      <DebugProbe />
      {!inXR && (
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.28}
          scale={10}
          blur={2.4}
          far={3.5}
          color="#0a0807"
          frames={1}
          resolution={512}
        />
      )}
    </>
  );
}

/** Drives the ported game-world clock: 20 real minutes = 24 game hours. */
function GameClock() {
  useEffect(() => {
    const id = window.setInterval(() => {
      useCompanion.getState().tick(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}

export function Experience() {
  return (
    <div className="absolute inset-0 bg-bg">
      <GameClock />
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
