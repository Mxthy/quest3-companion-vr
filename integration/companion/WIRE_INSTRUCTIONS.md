# Wire ContactBridge (PO Override)

## 1. Copy modules into the app
```
src/core/interaction/*     ← from this repo
integration path OR:
src/components/companion/contact-bridge.tsx  ← from integration/companion/contact-bridge.tsx
  (fix imports to `@/core/interaction/ContactController` if needed)
```

## 2. experience.tsx — add to Scene
```tsx
import { ContactBridge } from "./contact-bridge";
// inside Scene:
<ContactBridge />
```

## 3. store.ts — optional fields (safe no-ops if missing)
```ts
intensityValue: 0,
intensityBand: "low" as string,
contactZone: null as string | null,
setIntensityValue: (v: number) => set({ intensityValue: v }),
setIntensityBand: (b: string) => set({ intensityBand: b }),
setContactZone: (z: string | null) => set({ contactZone: z }),
onContactPeak: () => {
  // optional: speak a short line or play soft sound
},
```

## 4. overlay.tsx — optional HUD
Show `intensityValue` when `phase === "playing"` (e.g. thin bar).

## 5. Desktop controls (ContactBridge)
- Reach point = camera forward 0.55 m (handPoints)
- **F** or **Shift** = holding
- **R** edge = burstPressed

## 6. Do not
- Remove soft props / XR / Elara placeholder
- Load APK assets
