# Status Now (auto)

## Repo (main)
- Core: adult/*, interaction/*, perf/pools, physics/SoftVerlet
- Integration: contact-bridge, RapierScene, SoftToys, propTextures, toys, PartySocket, FoveationController
- Server: party/index.ts (PartyKit stub)
- Docs: 30+ specs, budgets, levers, cloud arch

## Drive
- quest3-game/archives: grok-workspace.zip, vivi_vrm.zip, VRM refs
- quest3-game/apks: APKS_LOCATION.txt only (APKs stay in Mcp)

## KB (Wissensspeicher)
- webxr: meta-quest-perf-bp, foveated, gamepads, layers, passthrough
- quest3: foveated-rendering-deep, thermal, gpu-profiler, optimization
- textures: ktx2-basis-deep, procedural-noise

## Gates
- G0 Soft-Loop: PASS (user: laeuft fliessig)
- G1 ContactBridge: wired, pending measure
- G2 Rapier rigid: wired, pending measure
- G3 FFR+scale: NEW, pending wire+measure
- P1 Edge: stub ready, pending deploy

## Next action
Wire FoveationController + deploy PartyKit stub. Measure both.
