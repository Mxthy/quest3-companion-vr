#!/usr/bin/env node
/**
 * Asset-Backen (offline!) — Vault perf-ship/perf/loading-streaming:
 * Teure Assets werden NIEMALS zur Laufzeit generiert. Dieses Skript optimiert
 * alles einmalig hier und schreibt komprimierte GLBs nach public/models/.
 * Quest-First: Meshopt-Kompression, Mesh-Stats gegen Budgets
 * (perf-ship/perf/quest3-hardware-reference: 72 FPS stabil, Budget je Mesh 100k Tris).
 *
 * VRM-Dateien werden ausgelassen (three-vrm braucht das rohe Format).
 *
 * Nutzung:  npm run assets        (bakt alle GLBs aus raw-assets/)
 *           npm run assets -- <datei.glb>
 */

import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const RAW_DIR = "raw-assets";
const OUT_DIR = "public/models";
const TRI_BUDGET = 100_000;

const cli = (args) => run("npx", ["--no-install", "gltf-transform", ...args]).then((r) => r.stdout);

async function triCount(glbPath) {
  const out = await cli(["inspect", glbPath, "--format", "json"]);
  // inspect json: { meshes: [{ primitives: [{ indices: n }...] }] } — Tris = Summe(indices)/3
  const j = JSON.parse(out);
  const meshes = j.meshes ?? [];
  return meshes.reduce(
    (n, m) =>
      n +
      (m.primitives ?? []).reduce(
        (p, prim) => p + Math.round((prim.indices ?? prim.vertices ?? 0) / 3),
        0,
      ),
    0,
  );
}

const kb = async (f) => ((await stat(f)).size / 1024).toFixed(0);

async function main() {
  const single = process.argv[2];
  await mkdir(OUT_DIR, { recursive: true });
  const all = single ? [single] : await readdir(RAW_DIR);
  const glbs = all.filter((f) => extname(f).toLowerCase() === ".glb");

  for (const v of all.filter((f) => extname(f).toLowerCase() === ".vrm")) {
    console.log(`  - ${v} uebersprungen (VRM bleibt roh fuer three-vrm)`);
  }
  if (glbs.length === 0) {
    console.log(`Keine GLBs in ${RAW_DIR}/ — rohe Assets dort ablegen und erneut laufen lassen.`);
    return;
  }

  for (const f of glbs) {
    const src = join(RAW_DIR, f);
    const name = basename(f, extname(f));
    const dst = join(OUT_DIR, `${name}.glb`);
    const trisBefore = await triCount(src);

    // Kette: dedup+weld+prune+resample+meshopt in einem Durchgang (optimize).
    await cli(["optimize", src, dst, "--texture-compress", "true", "--encoder", "ktx2"]);
    // Meshopt-Ansicht: optimize nutzt standardmaessig meshopt mit Quantisierung.

    const trisAfter = await triCount(dst);
    const warn = trisAfter > TRI_BUDGET ? "  !! UEBER 100k-TRI-BUDGET PRO MESH" : "";
    console.log(
      `  ${f}: ${trisBefore} -> ${trisAfter} Tris, ${(await kb(src))}KB -> ${(await kb(dst))}KB${warn}`,
    );
  }
  console.log(`Fertig: ${glbs.length} GLB(s) nach ${OUT_DIR}/ gebaken.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
