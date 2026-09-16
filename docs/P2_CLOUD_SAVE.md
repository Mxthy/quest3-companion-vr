# P2 – Cloud-Save (local-first)

Ziel: Bond/Visits/used/muted persistent, ohne den Frame zu blockieren.

## Dateien
- `server/cloud/save-stub.ts` – `saveLocal`, `loadLocal`, `scheduleSync`

## Nutzung
```ts
import { scheduleSync, loadLocal } from './save-stub';

// nach Event:
scheduleSync({ bond, visits, used, muted, ts: Date.now() });

// beim Start:
const cached = loadLocal();
```

## Regeln
- Immer zuerst lokal (localStorage), Sync im Hintergrund (debounced 5 s)
- `keepalive: true` für Unload-Sicherheit
- Niemals im Render-Tick aufrufen – nur auf Events / Idle
- Offline: lokal bleibt gültig, Sync retried später

## Später (P3+)
- RAG-Retrieval für Dialog-Kontext: KB `ai-vibe/rag-pipeline-retrieval`
- NPC-Voice: KB `ai-vibe/npc-dialogue-inworld-convai`
