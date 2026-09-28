/**
 * Gameplay actions invoked by VR world-space UI — same store methods as the DOM HUD.
 */
import { updateComfort, type VRComfortConfig } from "./comfort-settings";
import { items } from "@/data/items";
import { continueDialogue, chooseDialogue } from "@/lib/companion/apartment/dialogue-actions";
import { useCompanion } from "@/lib/companion/store";

export function vrClosePanel() {
  const store = useCompanion.getState();
  if (store.phase === "paused") {
    store.resume();
  }
  const s = store as unknown as Record<string, unknown>;
  if (typeof s.setPanel === "function") {
    s.setPanel("none");
  }
}

export function vrSelectDialogue(choiceId: string) {
  if (choiceId === "__continue") {
    continueDialogue(null);
  } else {
    chooseDialogue(choiceId);
  }
}

export function vrInventoryUse(itemId: string) {
  const store = useCompanion.getState() as unknown as Record<string, unknown>;
  if (Array.isArray(store.inventory)) {
    const inv = store.inventory as Array<{ id: string; kind?: string }>;
    const it = inv.find((i) => i.id === itemId);
    if (!it) return;
    if (it.kind === "decor") {
      if (typeof store.setPanel === "function") store.setPanel("none");
      if (typeof store.setPlaceMode === "function") store.setPlaceMode(true, it.id);
    }
  }
}

export function vrShopBuy(itemId: string) {
  const shopItem = items.shop.find((i) => i.id === itemId);
  if (!shopItem) return;
  const store = useCompanion.getState() as unknown as Record<string, unknown>;
  const coins = typeof store.coins === "number" ? store.coins : 0;
  if (coins < shopItem.price) {
    if (typeof store.toast === "function") store.toast("Not enough coins");
    return;
  }
  if (typeof store.addStats === "function") store.addStats({ coins: -shopItem.price });
  if (typeof store.addItem === "function") store.addItem(shopItem.id, "gift");
  if (typeof store.toast === "function") store.toast(`Bought ${shopItem.name}`);
}

export function vrFridgeTake(id: string) {
  const store = useCompanion.getState() as unknown as Record<string, unknown>;
  if (typeof store.takeIngredient === "function") {
    store.takeIngredient(id);
  }
}

export function vrFridgeClear() {
  const store = useCompanion.getState() as unknown as Record<string, unknown>;
  if (typeof store.setCookingSlots === "function") {
    store.setCookingSlots([]);
  }
}

export function vrSetOutfit(id: string) {
  const store = useCompanion.getState();
  const s = store as unknown as Record<string, unknown>;
  if (typeof s.setOutfit === "function") {
    s.setOutfit(id);
  } else if (typeof store.setLook === "function") {
    store.setLook(id);
  }
  if (typeof s.toast === "function") s.toast(id);
}

export function vrOpenPhoto() {
  const store = useCompanion.getState() as unknown as Record<string, unknown>;
  if (typeof store.setPanel === "function") store.setPanel("none");
  if (typeof store.setPhotoMode === "function") store.setPhotoMode(true);
}

export function vrToggleComfort(partial: Partial<VRComfortConfig>) {
  updateComfort(partial);
}

export function vrResume() {
  const store = useCompanion.getState();
  store.resume();
  const s = store as unknown as Record<string, unknown>;
  if (typeof s.setPanel === "function") s.setPanel("none");
}

export function vrResetSave() {
  const store = useCompanion.getState();
  const s = store as unknown as Record<string, unknown>;
  if (typeof s.resetSave === "function") {
    s.resetSave();
  } else {
    store.leave();
  }
}
