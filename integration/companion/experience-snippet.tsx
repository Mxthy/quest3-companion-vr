/** Replace Scene() body wiring — illustrative snippet */
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Elara } from "./elara";
import { Interactables } from "./interactables";
import { Player } from "./player";
import { Room } from "./room";
import { ContactBridge } from "./contact-bridge";

export function Scene() {
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
