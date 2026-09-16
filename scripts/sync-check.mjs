#!/usr/bin/env node
/** Fail if critical repo paths are missing. */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "tsconfig.core.json",
  "docs/PRODUCT_OWNER_OVERRIDE_INTERACTION.md",
  "docs/NEUTRAL_INTERACTION_SYSTEMS.md",
  "docs/DEPENDENCIES.md",
  "docs/REPO_INDEX.md",
  "docs/DRIVE_AND_CONNECTORS.md",
  "src/core/interaction/ContactController.ts",
  "src/core/interaction/IntensityModel.ts",
  "src/core/interaction/ColliderZones.ts",
  "src/core/interaction/TrackingProxy.ts",
  "integration/companion/drop-in/APPLY.md",
  "integration/companion/drop-in/contact-bridge.tsx",
  "integration/companion/drop-in/experience.tsx",
  "integration/companion/drop-in/IntensityHud.tsx",
  "integration/companion/drop-in/store-contact-fields.ts",
  "TASK_STATE.yaml",
  "PROJECT_MANIFEST.yaml",
  "AGENTS.md",
];

let missing = 0;
for (const rel of required) {
  const ok = existsSync(join(root, rel));
  console.log(ok ? "OK " : "MISSING ", rel);
  if (!ok) missing++;
}
process.exit(missing ? 1 : 0);
