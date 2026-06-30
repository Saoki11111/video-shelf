#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

bash -n scripts/*.sh
node --check js/app.js
node --check js/all.js
node --check js/shared.js
node --check js/timeline.js
node --check js/video.js
python3 -m json.tool data/videos.json >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

root = Path(".")
videos = json.loads((root / "data/videos.json").read_text())
required = {
    "id",
    "title",
    "description",
    "publishedAt",
    "tags",
    "thumbnail",
    "driveFileId",
    "sortOrder",
}

if not videos:
    raise SystemExit("data/videos.json must contain at least one video")

ids = set()
for video in videos:
    missing = required - video.keys()
    if missing:
        raise SystemExit(f"{video.get('id', '<unknown>')}: missing {sorted(missing)}")
    if video["id"] in ids:
        raise SystemExit(f"duplicate video id: {video['id']}")
    if not (root / video["thumbnail"]).is_file():
        raise SystemExit(f"missing thumbnail: {video['thumbnail']}")
    ids.add(video["id"])
PY

echo "All checks passed."
