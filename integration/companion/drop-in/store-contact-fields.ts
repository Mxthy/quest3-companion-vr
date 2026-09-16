/**
 * Merge into CompanionState + create() in src/lib/companion/store.ts
 */

// --- add to type CompanionState ---
export type ContactStoreFields = {
  intensityValue: number;
  intensityBand: string;
  contactZone: string | null;
  setIntensityValue: (v: number) => void;
  setIntensityBand: (b: string) => void;
  setContactZone: (z: string | null) => void;
  onContactPeak: () => void;
};

// --- add to create() initial state ---
export const contactStoreInitial = {
  intensityValue: 0,
  intensityBand: "low",
  contactZone: null as string | null,
  setIntensityValue: (v: number) => {
    /* replaced in store: set({ intensityValue: v }) */
    void v;
  },
  setIntensityBand: (b: string) => {
    void b;
  },
  setContactZone: (z: string | null) => {
    void z;
  },
  onContactPeak: () => {
    /* optional: get().speak(...) or playSoft() */
  },
};

/** Paste inside create((set, get) => ({ ... })) */
export const contactStoreMethods = `
  intensityValue: 0,
  intensityBand: "low",
  contactZone: null as string | null,
  setIntensityValue: (v: number) => set({ intensityValue: v }),
  setIntensityBand: (b: string) => set({ intensityBand: b }),
  setContactZone: (z: string | null) => set({ contactZone: z }),
  onContactPeak: () => {
    const s = get();
    if (s.phase === "playing") {
      // soft feedback only — no content branch required
      s.addBond?.(1);
    }
  },
`;
