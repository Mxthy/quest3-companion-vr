# P1 Edge – Progress

## Done
- `server/party/index.ts` – PartyKit server, sanitize + echo
- `integration/companion/drop-in/PartySocket.ts` – client (already present)
- `FoveationController.tsx` – FFR + dynamic scale (GPU lever)

## Next
1. `cd server/party && npm i && npx partykit deploy`
2. Paste URL into `PartySocket` constructor
3. Wire `FoveationController` into `<XR>` tree
4. Measure: echo latency < 80 ms, render tick unaffected

## KB consulted
- `quest3/foveated-rendering-deep`
- `webxr/meta-quest-perf-bp`
- `networking/partykit-rooms-deep` (via P1_EDGE_STUB)

## Gate
- [ ] Connect/Disconnect clean
- [ ] Echo < 80 ms LAN
- [ ] No impact on 72–90 Hz tick
- [ ] FFR medium, scale auto-drops under load
