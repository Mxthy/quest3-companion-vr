import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRENT_SAVE_VERSION,
  LEGACY_FUSED_SAVE_KEY,
  legacyProgressFrom,
  mergeLegacyProgress,
  unwrapLegacySave,
} from "../src/lib/companion/save-migration.mjs";

const current = {
  version: 1,
  bond: 34,
  used: { cup: true, vinyl: false, lantern: false },
  visits: 2,
  muted: true,
};

const fusedState = {
  day: 7,
  gameMinutes: 820,
  affection: 81,
  comfort: 76,
  energy: 63,
  coins: 245,
  level: 3,
  outfit: "midnight",
  unlockedOutfits: ["cream", "midnight"],
  unlockedDecor: ["floor_lamp", "book_stack"],
  interacted: ["radio", "lamp", "laptop"],
  photos: ["living-1"],
  giftedCount: 4,
  dishesCooked: 3,
  alphaComplete: true,
  radioOn: true,
  lampOn: true,
};

test("unwraps Zustand's persisted FUSED save envelope", () => {
  assert.deepEqual(unwrapLegacySave({ state: fusedState, version: 1 }), fusedState);
  assert.deepEqual(unwrapLegacySave(fusedState), fusedState);
  assert.equal(unwrapLegacySave(null), null);
});

test("keeps rich FUSED progression as import metadata", () => {
  const progress = legacyProgressFrom({ state: fusedState, version: 1 });
  assert.equal(progress.source, LEGACY_FUSED_SAVE_KEY);
  assert.equal(progress.day, 7);
  assert.equal(progress.affection, 81);
  assert.equal(progress.outfit, "midnight");
  assert.deepEqual(progress.interacted, ["radio", "lamp", "laptop"]);
  assert.equal(progress.alphaComplete, true);
});

test("maps compatible progress without reducing current achievements", () => {
  const imported = mergeLegacyProgress(current, { state: fusedState, version: 1 });
  assert.equal(imported.version, CURRENT_SAVE_VERSION);
  assert.equal(imported.bond, 81);
  assert.equal(imported.visits, 7);
  assert.equal(imported.muted, true);
  assert.deepEqual(imported.used, { cup: true, vinyl: true, lantern: true });
  assert.equal(imported.importedProgress.coins, 245);
});

test("current progress wins when it is further ahead", () => {
  const imported = mergeLegacyProgress(
    { ...current, bond: 96, visits: 12 },
    { state: fusedState, version: 1 },
  );
  assert.equal(imported.bond, 96);
  assert.equal(imported.visits, 12);
});

test("rejects malformed legacy saves without touching current data", () => {
  assert.equal(mergeLegacyProgress(current, null), current);
});
