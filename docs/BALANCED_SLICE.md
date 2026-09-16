# Balanced Vertical Slice

Ziel: **gleichmäßig** gut in Leistung · Inhalt · Spielbarkeit · Umsetzung — ohne Stabilität (90 Hz) und Konsistenz zu opfern.

## Vier-Säulen-Budget (nicht maximieren, balancieren)

| Säule | Ziel für Slice | Harte Grenze |
|-------|----------------|--------------|
| **Leistung** | stabil 72–90 Hz Desktop/WebXR | ≤ ~100 Draw Calls, ≤ 2 dynamische Lichter, Physics ≤ wenige Bodies |
| **Inhalt** | 1 Raum, 1 Companion, 3 Soft-Props, optional 2 Soft-Toys | keine offenen World-Streaming-Assets |
| **Spielbarkeit** | klarer Loop: eintreten → greifen → Nähe → Feedback | eine Input-Map Desktop+XR |
| **Umsetzung** | bestehende Module verdrahten, keine Parallel-Engines | ein Physics-Pfad starr (Rapier), ein Soft-Pfad (Verlet) |

Wenn eine Säule „max“ will und eine andere bricht → **Slice kürzen**, nicht Hardware überziehen.

## Was im Slice *drin* ist (P0)

1. **Raum + Elara-Platzhalter** (bereits MVP)
2. **Soft-Props:** Tasse, Platte, Laterne — greifen/platzieren/Bond
3. **Contact-Systeme (neutral):** Zonen + Intensity + HMD-Proxy (optional HUD)
4. **WebXR:** immersive-vr, local-floor, Teleport/Snap wenn schon da
5. **Physik sparsam:**
   - Boden/Tisch **fixed**
   - max. **1–3** dynamic rigid (z. B. Tasse)
   - Soft-Toys: Verlet **oder** erst nur Mesh ohne Soft, wenn FPS knappt

## Was bewusst *raus* / später (P1+)

| Thema | Warum später |
|-------|----------------|
| Physik-Worker + SharedArrayBuffer | Slice braucht ihn nicht bei &lt;10 Bodies |
| Voller Nude-VRM + alle Toys + Soft gleichzeitig | GPU+CPU-Spike |
| Passthrough-Raum-Mesh | extra Collider-Pipeline |
| Dynamic shadows / many lights | Thermal |
| Draco/KTX2-Pipeline-Pflicht | Prototyp Canvas/Primitives ok |

## Konsistenz-Regeln

- **Eine** Source of Truth für Phase: `start | playing | paused`
- **Ein** Grab-Pfad (Store `held` + interact)
- Soft-Verlet und Rapier: **nicht** dieselbe Prop doppelt simulieren
- Tick: keine Allocations (`src/core/perf/pools.ts`)
- Content-Events nur über bestehende `speak` / Bond — keine parallelen Dialogsysteme

## Umsetzungsreihenfolge (stabilitätsorientiert)

```
A. Soft-Loop grün (Raum, Props, Bond)     ← Baseline-FPS messen
B. ContactBridge optional (Zonen/Intensity) ← wenn A ≥ Ziel-FPS
C. Rapier nur Boden+1 Dynamic               ← wenn B ok
D. SoftToys Verlet (1 Toy zuerst)           ← wenn C ok
E. FFR / resolution scale                   ← sobald WebXR-Device-Test
F. GLB/KTX2 replace procedural              ← Inhalt skalieren ohne Architekturwechsel
```

Jeder Schritt: **messen** (FPS, Frame-Zeit) → erst dann nächster.

## Spielbarkeit (Minimum Viable Fun)

| Beat | Erfolg |
|------|--------|
| Enter | Phase playing, Audio unlock |
| 3 Props | je einmal genutzt, Bond steigt |
| Nähe Elara | sitzen / sprechen |
| Optional contact | Intensity sichtbar oder Zone-Hinweis |
| Exit/Pause | State konsistent, Save ok |

Kein Beat darf einen zweiten Engine-Stack brauchen.

## Leistungs-Gates

| Gate | Bedingung |
|------|-----------|
| G0 | Desktop 60+ FPS Soft-Loop |
| G1 | WebXR Quest 72+ sustained |
| G2 | +Contact ohne Drop unter Gate |
| G3 | +1 Rapier dynamic + 1 soft toy |

Unter Gate → Feature zurück, nicht „optimieren und hoffen“.

## Datei-Karte (bereits vorhanden)

| Modul | Säule |
|-------|--------|
| MVP companion components | Inhalt + Spielbarkeit |
| `src/core/interaction/*` | Spielbarkeit (Contact) |
| `src/core/physics/SoftVerlet` | Inhalt Soft, Leistung begrenzt |
| `RapierScene` drop-in | Leistung starr |
| `QUEST3_*` docs | Leistung Leitplanken |
| `propTextures` / toys | Inhalt |
| `pools.ts` | Leistung / Stabilität |

## Agent-Kurzauftrag

1. Nicht alles parallel einschalten.
2. Reihenfolge A→F einhalten.
3. Bei FPS-Einbruch: zuletzt hinzugefügtes Feature aus, nicht Architektur neu erfinden.
