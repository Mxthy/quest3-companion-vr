# FFR + Dynamic Resolution – Apply

## Files
- `FoveationController.tsx` – runtime scale + foveation adjust
- `ffrSessionInit()` – pass to `navigator.xr.requestSession('immersive-vr', ffrSessionInit())`

## Wire
```tsx
import { FoveationController, ffrSessionInit } from './FoveationController';

// session start:
const session = await navigator.xr.requestSession('immersive-vr', ffrSessionInit());

// in <XR> tree:
<FoveationController targetFfr={2/3} />
```

## KB sources
- `quest3/foveated-rendering-deep`
- `webxr/meta-quest-perf-bp`
- Meta: https://developers.meta.com/horizon/documentation/web/webxr-ffr/

## Gate
- [ ] sustained >= 72 Hz under load
- [ ] no visible center blur at medium FFR
- [ ] scale drops before frame-time spikes
