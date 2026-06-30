#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean." >&2
    exit 1
fi

previous_branch="$(git branch --show-current)"
merged_pr=""

if [ "$previous_branch" != "main" ]; then
    merged_pr="$(gh pr list \
        --head "$previous_branch" \
        --base main \
        --state merged \
        --limit 1 \
        --json number \
        --jq '.[0].number // empty')"
fi

git switch main
git pull --ff-only origin main
git fetch --prune origin

if [ "$previous_branch" != "main" ] && [ -n "$merged_pr" ]; then
    git branch -D "$previous_branch"
fi

echo
git status --short --branch
echo
git branch -a
