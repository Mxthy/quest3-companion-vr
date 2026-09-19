export type SpeechEvent =
  | "enter"
  | "near"
  | "sit"
  | "talk"
  | "cup"
  | "vinyl"
  | "lantern"
  | "all"
  | "high";

const LINES: Record<SpeechEvent, string[]> = {
  enter: [
    "Du bist da. Ich habe das Licht an gelassen.",
    "Der Abend hält still. Komm näher, wenn du willst.",
    "Ich sitze schon. Es gibt keinen Plan.",
  ],
  near: [
    "Ich höre deine Schritte, bevor du sprichst.",
    "Gegenüber ist ein Platz. Er wartet nicht ungeduldig.",
    "Du musst nichts tun. Nur da sein reicht.",
  ],
  sit: [
    "So. Jetzt teilen wir denselben Raum.",
    "Bleib. Der Tee kühlt langsamer, wenn jemand zuhört.",
    "Ich schaue nicht weg. Nur leise.",
  ],
  talk: [
    "Manchmal zähle ich die Lampen, damit die Stille Form hat.",
    "Draußen geht die Stadt weiter. Hier bleibt sie an der Scheibe.",
    "Wenn du gehst, lasse ich das Licht trotzdem an.",
    "Erzähl nichts, wenn du nicht willst. Ich fülle die Pause.",
    "Deine Hände kennen drei Dinge in diesem Raum.",
  ],
  cup: [
    "Warm. Danke. Jetzt bleibt der Raum ein bisschen länger.",
    "Ich halte sie mit beiden Händen. Alte Gewohnheit.",
  ],
  vinyl: [
    "Diese Platte ist für Regen, der nicht kommt.",
    "Ich schwinge mit. Ganz leise, damit nichts zerbricht.",
  ],
  lantern: [
    "Jetzt sieht man uns beide. Gut so.",
    "Ein zweites Licht, und der Abend wird weicher.",
  ],
  all: [
    "Tasse, Platte, Licht. Du hast den Raum verstanden.",
    "Mehr brauchen wir heute nicht.",
  ],
  high: [
    "Ich merke dich, bevor die Tür aufgeht.",
    "Wir müssen nichts beweisen. Nähe reicht.",
    "Bleib, bis die Stadt dünner wird.",
  ],
};

const lastIndex: Partial<Record<SpeechEvent, number>> = {};

export function pickLine(event: SpeechEvent): string {
  const pool = LINES[event];
  if (pool.length === 1) return pool[0]!;
  let i = Math.floor(Math.random() * pool.length);
  if (i === lastIndex[event]) i = (i + 1) % pool.length;
  lastIndex[event] = i;
  return pool[i]!;
}

export function talkEvent(bond: number, usedCount: number): SpeechEvent {
  if (usedCount >= 3) return "all";
  if (bond >= 70) return "high";
  return "talk";
}
