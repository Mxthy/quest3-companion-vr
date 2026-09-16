# Ausgewogene Architektur: Client / Edge / Cloud

Ziel: **gleichmäßige Last** über Leistung, Inhalt, Spielbarkeit und Umsetzung — ohne die Quest-3-Stabilität zu gefährden. Cloud und Edge übernehmen nur, was den Client entlastet.

Quellen: `docs/BALANCED_SLICE.md`, `docs/QUEST3_ARCHITECTURE_LEVERS.md`, `docs/QUEST3_PHYSICS.md`, Wissensspeicher `networking/*`, `ai-vibe/*`.

---

## 1. Drei-Schichten-Split

| Schicht | Läuft wo | Darf | Darf nicht |
|---------|-----------|------|------------|
| **Client (Quest 3)** | Headset, 90 Hz | Render, Input, Physik (wenige Bodies), Audio, lokale State-SM | LLM-Calls, schwere RAG-Suche, Persistenz-IO |
| **Edge (PartyKit / Cloudflare)** | Cloudflare Workers + Durable Objects | Rooms, Broadcast, Session-State, leichte Validierung, Hibernation | schwere KI, große Vektor-Suchen |
| **Cloud (Backend)** | eigener Server / Functions | RAG-Retrieval, NPC-Dialogue (Inworld/Convai), Save/Load, Auth, Analytics | Frame-kritische Logik, Physik |

**Regel:** Alles, was > ~5 ms dauern kann, geht raus aus dem Client-Tick.

---

## 2. Was gehört wohin (konkret)

### Client behält
- Three.js / R3F Render-Loop, Zero-Alloc Tick (`src/core/perf/pools.ts`)
- Rapier (starr, wenige Dynamics) + Verlet Soft-Toys
- WebXR Session, FFR, Resolution Scale
- Lokale Phase-SM: `start | playing | paused`
- Lokaler Save-Cache (localStorage) → Sync zur Cloud im Hintergrund

### Edge (PartyKit) — *später, nach stabilem Singleplayer*
- Room pro Session / pro „Atelier"
- Broadcast von **quantisierten** States (Position, Bond-Level, Prop-IDs) — nicht Roh-Physik
- Hibernation aktiv (Kosten, Wake-on-Connect)
- KB: `networking/partykit-rooms-deep`, `networking/serialization-quantization`
- Deploy: `npx partykit deploy`

### Cloud — *optional, für „Intelligenz"*
- **RAG:** Embedding + Vector-DB (Pinecone/Weaviate), Hybrid-Retrieval, Rerank — KB `ai-vibe/rag-pipeline-retrieval`
- **NPC-Dialogue:** Inworld / Convai / NVIDIA ACE Web-SDK, latenzbewusst — KB `ai-vibe/npc-dialogue-inworld-convai`
- **Persistenz:** Bond, Visits, used-Flags, Mute → Cloud-Save (statt nur lokal)
- Auth (optional): einfache Token-Prüfung am Edge

---

## 3. Phasen (Balance-Gates)

```
P0  Singleplayer stabil (Soft + Contact + Rapier)     → Gate: ≥72 Hz, kein GC-Spike
P1  Edge-Room (PartyKit) für 1–2 Clients, State-Sync → Gate: Latenz < 80 ms, kein Physik-Overhead
P2  Cloud-Save + RAG-Retrieval (Dialog-Kontext)      → Gate: Client-Tick unverändert
P3  NPC-Voice/Face (Inworld/ACE)                    → Gate: Antwort < 1.5 s, lip-sync optional
P4  Multi-User-Atelier (Yjs/CRDT optional)          → Gate: Konfliktfrei, skalierbar
```

Unter Gate → Feature *aus*, nicht Architektur umbauen.

---

## 4. Datenfluss (Beispiel: Dialog)

```
Spieler spricht / wählt Option
  → Client sendet Intent (klein) an Edge
  → Edge routet an Cloud-RAG / NPC-Service
  → Antwort (Text + optional TTS-URL) zurück
  → Client spielt Audio, setzt Blendshapes
```

Physik und Render laufen **parallel und unabhängig** — die Cloud blockiert nie den Frame.

---

## 5. Was wir *nicht* tun

- Keine Physik im Worker/Cloud (zu teuer, zu latenzanfällig)
- Keine LLM-Calls im Render-Tick
- Kein Voll-State-Sync jeder Physik-Pose (nur Events + Level)
- Kein Open-World-Content vor stabilem Slice

---

## 6. Nächster Schritt

1. P0 abschließen und messen (FPS, GC).
2. Danach `partykit`-Stub anlegen (`server/party/index.ts` + Client-`PartySocket`), **ohne** Multiplayer-Logik — nur Connect/Disconnect + Echo.
3. Cloud-Save-Endpunkt skizzieren (Bond/Visits), lokal zuerst.

KB-Pflicht vor Edge/Cloud-Bau: `wissensspeicher___query_kbpage` mit `networking/partykit-rooms-deep`, `ai-vibe/rag-pipeline-retrieval`, `ai-vibe/npc-dialogue-inworld-convai`.
