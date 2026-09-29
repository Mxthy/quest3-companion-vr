/**
 * Tiny typed event bus connecting world/player events to the NPC brain.
 * (Blueprint §8 Context/Situation: "Spieler hat gerade die Tür geöffnet"
 * instead of only "Spieler ist da".)
 */
export type NpcEvent =
  | "player_entered"
  | "player_near"
  | "player_touched"
  | "player_talked"
  | "player_left"
  | "object_used";

type Handler = (event: NpcEvent) => void;
const handlers = new Set<Handler>();

export function emitNpc(event: NpcEvent): void {
  for (const h of handlers) {
    try {
      h(event);
    } catch {
      /* listeners must never break the frame loop */
    }
  }
}

export function onNpc(fn: Handler): () => void {
  handlers.add(fn);
  return () => {
    handlers.delete(fn);
  };
}
