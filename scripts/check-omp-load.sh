#!/usr/bin/env bash
# Loads SLYE's OMP entry point in the locally installed OMP and fails when OMP
# cannot link it. Node tests run against Pi's TUI library, so they cannot catch
# an import that OMP's library lacks. Requires `omp` on PATH; makes no model call.
set -euo pipefail

if ! command -v omp >/dev/null 2>&1; then
  echo "Skipping OMP load check: omp is not on PATH."
  exit 0
fi

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
home="$(mktemp -d)"
trap 'rm -rf "$home"' EXIT

# Closed stdin makes OMP exit right after loading extensions; it then reports
# that no model is configured, which is expected in the empty temporary HOME.
output="$(cd "$home" && HOME="$home" omp --no-extensions -e "$repo/src/omp.ts" --mode rpc --no-ui --no-session </dev/null 2>&1 || true)"

if [[ "$output" == *"Failed to load extension"* ]] || [[ "$output" != *"No default model selected"* ]]; then
  printf '%s\n' "$output" | head -3 >&2
  echo "OMP did not load the SLYE extension successfully." >&2
  exit 1
fi

echo "OMP loaded the SLYE extension."
