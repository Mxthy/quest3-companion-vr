export type OutfitItem = {
  id: string;
  name: string;
  unlockLevel: number;
  cloth: string;
  hair: string;
};

export type DecorItem = {
  id: string;
  name: string;
  description: string;
  kind: string;
  place: string;
  unlockLevel: number;
  icon: string;
};

export const LEVEL_OUTFITS = ["cream", "sage", "blush", "navy", "sun"] as const;

export const LEVEL_DECOR = [
  "floor_lamp",
  "wool_rug",
  "wall_poster",
  "fairy_lights",
  "paper_mobile",
  "hanging_frame",
] as const;

export const outfits: OutfitItem[] = [
  { id: "cream", name: "Cream Knit", unlockLevel: 0, cloth: "#e8dcc8", hair: "#3d2b24" },
  { id: "sage", name: "Sage Dress", unlockLevel: 1, cloth: "#8aa390", hair: "#3d2b24" },
  { id: "blush", name: "Blush Cardigan", unlockLevel: 2, cloth: "#c9a3a3", hair: "#4a3038" },
  { id: "navy", name: "Midnight Shirt", unlockLevel: 3, cloth: "#2c3a4a", hair: "#1c1916" },
  { id: "sun", name: "Linen Vest", unlockLevel: 4, cloth: "#cfc3a6", hair: "#6b4423" }
];

export const outfitById: Record<string, OutfitItem> = Object.fromEntries(
  outfits.map((o) => [o.id, o])
);
