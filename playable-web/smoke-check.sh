#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/4] JS syntax check"
node --check game.js

echo "[2/4] required files check"
for f in index.html styles.css game.js manifest.webmanifest sw.js icon.svg; do
  [[ -f "$f" ]] || { echo "missing file: $f"; exit 1; }
done

echo "[3/4] required tags check"
grep -q 'rel="manifest"' index.html
grep -q 'id="game"' index.html

echo "[4/4] done"
echo "smoke-check passed"
