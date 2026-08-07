#!/usr/bin/env bash
# Refresh the real-HTML fixtures under test/fixtures/.
# Run after xvideos.com changes its layout on purpose (the fixture tests
# will fail first, then you regenerate with this script and commit).
set -euo pipefail

cd "$(dirname "$0")/.."

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
FIXTURES="test/fixtures"
mkdir -p "$FIXTURES"

fetch() {
  local name="$1" url="$2"
  curl -s -L -A "$UA" "$url" -o "$FIXTURES/$name"
  echo "$name: $(wc -c < "$FIXTURES/$name") bytes"
}

# Note: /new and /new/0 return a "Not found" page — /new/1 is the de-facto
# first page of the New Videos listing (the site labels it "page 2").
fetch listing-dashboard.html "https://www.xvideos.com/"
fetch listing-fresh.html "https://www.xvideos.com/new/1"
fetch listing-verified.html "https://www.xvideos.com/verified/videos"
fetch listing-best.html "https://www.xvideos.com/best"
fetch listing-category.html "https://www.xvideos.com/c/AI-239"

VIDEO_PATH="$(grep -m1 -oE 'href="/video\.[^"]+"' "$FIXTURES/listing-dashboard.html" | sed 's/href="//;s/"$//')"
if [ -n "$VIDEO_PATH" ]; then
  fetch video-detail.html "https://www.xvideos.com$VIDEO_PATH"
else
  echo "WARNING: could not extract a video path from the dashboard; video-detail.html not refreshed"
fi

echo "Done. Run: npm run test:unit"
