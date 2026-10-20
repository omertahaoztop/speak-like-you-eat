#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT

if ! (cd "$temp" && npm install --no-save --ignore-scripts --silent @earendil-works/pi-coding-agent@0.87.1); then
  echo "Pi 0.87.1 compatibility check failed: could not install Pi 0.87.1." >&2
  exit 1
fi

cat >"$temp/check-old-pi.mjs" <<'EOF'
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const [repo, temp] = process.argv.slice(2);
const codingAgent = pathToFileURL(
  join(temp, "node_modules/@earendil-works/pi-coding-agent/dist/index.js"),
).href;
const customEntry = pathToFileURL(
  join(temp, "node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/custom-entry.js"),
).href;
const { discoverAndLoadExtensions, initTheme } = await import(codingAgent);
const { CustomEntryComponent } = await import(customEntry);

try {
  initTheme("dark");
  const agentDir = join(temp, "agent");
  mkdirSync(agentDir);
  const loaded = await discoverAndLoadExtensions([join(repo, "src/index.ts")], repo, agentDir);

  assert.deepEqual(loaded.errors, [], "Pi 0.87.1 could not load the SLYE extension.");
  assert.equal(loaded.extensions.length, 1, "Pi 0.87.1 did not load one SLYE extension.");
  for (const extension of loaded.extensions) {
    assert.equal(extension.shortcuts.size, 0, "Pi 0.87.1 registered an unsupported shortcut.");
  }

  const extension = loaded.extensions[0];
  const renderer = extension.entryRenderers.get("slye.rewrite");
  assert.ok(renderer, "Pi 0.87.1 did not register the SLYE entry renderer.");
  const entry = {
    type: "custom",
    id: "saved",
    parentId: null,
    timestamp: "now",
    customType: "slye.rewrite",
    data: { display: "Simple text", rewrite: "Rewrite text" },
  };
  const component = new CustomEntryComponent(entry, renderer.renderer ?? renderer);
  const rendered = component
    .render(70)
    .map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""))
    .join("\n");

  assert.match(rendered, /🤌 Speak like you eat:/, "Pi 0.87.1 did not render the legacy heading.");
  assert.match(rendered, /Simple text/, "Pi 0.87.1 did not render the Simple text.");
  assert.doesNotMatch(rendered, /Rewrite text/, "Pi 0.87.1 rendered the unsupported Rewrite text.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Pi 0.87.1 compatibility check failed: ${message}`);
  process.exit(1);
}

console.log("Pi 0.87.1 compatibility check passed.");
EOF

node "$temp/check-old-pi.mjs" "$repo" "$temp"
