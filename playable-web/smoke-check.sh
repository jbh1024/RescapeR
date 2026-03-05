#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/4] JS syntax check (Engine & Systems)"
node --check game.js
for f in systems/*.js; do
  node --check "$f"
done

echo "[2/4] required files check"
# Root files
for f in index.html styles.css game.js manifest.webmanifest sw.js icon.svg; do
  [[ -f "$f" ]] || { echo "missing root file: $f"; exit 1; }
done

# System modules
SYSTEM_FILES=(
  "utils.js" "data-config.js" "audio-system.js" "fx-system.js" 
  "asset-manager.js" "save-system.js" "combat-system.js" "ui-system.js" 
  "render-system.js" "monster-archetype-system.js" "floor-system.js" 
  "player-system.js" "ai-system.js" "input-system.js"
)
for f in "${SYSTEM_FILES[@]}"; do
  [[ -f "systems/$f" ]] || { echo "missing system module: systems/$f"; exit 1; }
done

echo "[3/4] required tags check"
grep -q 'rel="manifest"' index.html
grep -q 'id="game"' index.html
grep -q 'type="module"' index.html
grep -q 'src="game.js"' index.html

echo "[4/4] done"
echo "smoke-check passed"
