#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, prefix = "") {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      console.log(prefix + name + "/");
      walk(p, prefix + "  ");
    } else {
      console.log(prefix + name);
    }
  }
}

walk(join(process.cwd(), "docs"));
