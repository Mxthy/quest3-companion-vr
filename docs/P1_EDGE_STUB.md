# P1 – Edge-Stub (PartyKit)

Ziel: Connect/Disconnect/Echo ohne Multiplayer-Logik. Gate: Latenz < 80 ms, kein Physik-Overhead.

## Dateien
- `server/party/index.ts` – PartyKit Server (sanitize + echo)
- `integration/companion/drop-in/PartySocket.ts` – Client

## Deploy
```bash
npm i -D partykit
npx partykit deploy
```
URL in `PartySocket` eintragen.

## Client-Nutzung
```ts
import { PartySocket } from './PartySocket';
const ps = new PartySocket('wss://....partykit.dev/room');
ps.connect();
ps.send({ t: 'bond', v: 42 });
```

## Regeln
- Nur quantisierte Events (Bond, Prop-ID, Zone) – nie Physik-Posen
- Whitelist in `sanitize()` erweitern, nicht blind broadcasten
- KB vor Bau: `networking/partykit-rooms-deep`, `networking/serialization-quantization`

## Gate
- [ ] Connect/Disconnect sauber
- [ ] Echo < 80 ms (LAN)
- [ ] Kein Einfluss auf 72–90 Hz Render-Tick
