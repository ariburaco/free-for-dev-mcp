# Release Process

This project uses GitHub Actions for automated npm publishing. There are two ways to create a release:

## Method 1: Automated Release (Recommended)

### For patch releases (bug fixes):
```bash
bun run release:patch
```

### For minor releases (new features):
```bash
bun run release:minor
```

### For major releases (breaking changes):
```bash
bun run release:major
```

These commands will:
1. Run tests
2. Build the project
3. Bump the version in package.json
4. Create a git tag
5. Push to GitHub
6. GitHub Actions will automatically publish to npm

## Method 2: Manual GitHub Release

1. Go to [GitHub Releases](https://github.com/ariburaco/free-for-dev-mcp/releases)
2. Click "Create a new release"
3. Create a new tag (e.g., `v1.0.1`)
4. Fill in release notes
5. Publish the release
6. GitHub Actions will automatically publish to npm

## Method 3: Manual Workflow Dispatch

1. Go to [Actions tab](https://github.com/ariburaco/free-for-dev-mcp/actions)
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Select version type (patch/minor/major)
5. Click "Run workflow"

## Prerequisites

### NPM Token Setup (One-time setup)

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Sign in to your account
3. Go to Access Tokens: https://www.npmjs.com/settings/ariburaco/tokens
4. Click "Generate New Token" → "Classic Token"
5. Select "Automation" type
6. Copy the token

### Add NPM Token to GitHub

1. Go to your repository settings
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

## Version Guidelines

- **Patch (1.0.X)**: Bug fixes, documentation updates
- **Minor (1.X.0)**: New features, non-breaking changes
- **Major (X.0.0)**: Breaking changes, major refactors

## Monitoring Releases

After triggering a release:
1. Check [GitHub Actions](https://github.com/ariburaco/free-for-dev-mcp/actions) for build status
2. Verify on [npm](https://www.npmjs.com/package/@ariburaco/free-for-dev-mcp)
3. Test installation: `npm install -g @ariburaco/free-for-dev-mcp@latest`

## Troubleshooting

### If the GitHub Action fails:

1. Check the [Actions log](https://github.com/ariburaco/free-for-dev-mcp/actions)
2. Common issues:
   - Missing NPM_TOKEN secret
   - Test failures
   - Build errors
   - npm authentication issues

### Manual emergency release:

```bash
# If automation fails, you can manually publish
bun test
bun run build
npm version patch
npm publish --access public
git push origin main --tags
```

## Rollback

If you need to rollback a release:

```bash
# Unpublish from npm (within 72 hours)
npm unpublish @ariburaco/free-for-dev-mcp@VERSION

# Or deprecate a version
npm deprecate @ariburaco/free-for-dev-mcp@VERSION "Contains critical bug, use 1.0.2 instead"
```