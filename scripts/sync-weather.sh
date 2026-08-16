#!/usr/bin/env bash
#
# Sync the weather app from the standalone repo into Flowerapp.
#
# The two trees are identical apart from where things sit: Flowerapp hosts the
# weather app under a /weather prefix, so its routes live at
# src/app/api/weather/* and its components at src/components/weather/*. Library
# files and component-relative imports are the same in both, so only the API
# paths a client component fetches need rewriting — and that rewrite is the
# whole reason this script exists. Copying verbatim once left the Local, Water,
# History and Archive panels fetching /api/local, /api/water, /api/history and
# /api/archive, none of which exist in this repo. They returned 404 and the
# cards sat empty, which looks exactly like an upstream being down.
#
# Usage: scripts/sync-weather.sh [path-to-weather-repo]

set -euo pipefail

SRC="${1:-/workspace/weather}"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -d "$SRC/src" ] || { echo "No weather checkout at $SRC" >&2; exit 1; }

echo "Syncing $SRC -> $DEST"

# --- libraries: identical in both trees ---------------------------------
mkdir -p "$DEST/src/lib"
for f in "$SRC"/src/lib/*.ts; do
  base="$(basename "$f")"
  # types.ts in Flowerapp belongs to the plant app, not the weather app.
  [ "$base" = "types.ts" ] && continue
  cp "$f" "$DEST/src/lib/$base"
done

# --- components: same files, one directory deeper -----------------------
# Sibling imports written as "@/components/X" resolve to src/components/X,
# which is one level above where these files land here. They are siblings
# either way, so rewrite them to "./X" rather than "@/components/weather/X" —
# it matches how the rest of these files already import each other.
mkdir -p "$DEST/src/components/weather"
for f in "$SRC"/src/components/*.tsx; do
  cp "$f" "$DEST/src/components/weather/$(basename "$f")"
done
perl -pi -e 's{(["'"'"'])\@/components/(?!weather/)}{$1./}g' \
  "$DEST"/src/components/weather/*.tsx

# --- routes: same files under the /weather prefix -----------------------
mkdir -p "$DEST/src/app/api/weather"
for d in "$SRC"/src/app/api/*/; do
  name="$(basename "$d")"
  mkdir -p "$DEST/src/app/api/weather/$name"
  cp -r "$d." "$DEST/src/app/api/weather/$name/"
done

# --- the rewrite this script exists for ---------------------------------
# Every /api/<x> becomes /api/weather/<x>, in fetch URLs and in the route doc
# comments alike — the comments name the path the route is actually served at,
# so leaving them behind makes the next reader trust a URL that 404s. The
# negative lookahead means running this twice is a no-op rather than producing
# /api/weather/weather/. /api/identify is the plant app's and is excluded.
find "$DEST/src/components/weather" "$DEST/src/app/api/weather" \
  -type f \( -name '*.tsx' -o -name '*.ts' \) -print0 |
  xargs -0 perl -pi -e 's{/api/(?!weather/|identify)}{/api/weather/}g'

echo "Checking no /api/ path escaped the rewrite:"
if grep -rn '/api/' "$DEST/src/components/weather" "$DEST/src/app/api/weather" |
     grep -v '/api/weather/' | grep -v '/api/identify'; then
  echo "  ^ these still point outside /api/weather — fix before committing" >&2
  exit 1
fi
echo "  all clear"
