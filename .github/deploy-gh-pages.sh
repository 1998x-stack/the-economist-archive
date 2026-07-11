#!/bin/bash
set -e

# Deploy out/ to gh-pages branch for GitHub Pages
# Run from repo root after npm run build

cd "$(dirname "$0")/.."
REPO_DIR="$PWD"

# Save current state
CURRENT_BRANCH=$(git branch --show-current)

# Create gh-pages branch
git branch -D gh-pages 2>/dev/null || true
git checkout --orphan gh-pages
git rm -rf --quiet . 2>/dev/null || true

# Copy out/ contents to repo root
cp -a "$REPO_DIR/out/"* "$REPO_DIR/"

# Add and commit
git add -A
git commit -m "deploy: static site to GitHub Pages" || true

# Push
git push origin gh-pages --force

# Switch back
git checkout "$CURRENT_BRANCH"
