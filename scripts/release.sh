#!/bin/bash

# Release script for free-for-dev-mcp
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

echo "🚀 Starting release process for $VERSION_TYPE version bump..."

# Ensure we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "❌ You must be on main/master branch to release"
  exit 1
fi

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory is not clean. Commit or stash changes first."
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $BRANCH

# Run tests
echo "🧪 Running tests..."
bun test

# Build
echo "📦 Building..."
bun run build

# Bump version
echo "📝 Bumping version..."
npm version $VERSION_TYPE

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

# Push changes and tags
echo "📤 Pushing to GitHub..."
git push origin $BRANCH
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION created!"
echo ""
echo "The GitHub Action will now:"
echo "1. Run tests"
echo "2. Build the project"
echo "3. Publish to npm"
echo ""
echo "Monitor the progress at:"
echo "https://github.com/ariburaco/free-for-dev-mcp/actions"