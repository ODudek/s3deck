# GitHub Actions Workflow Guide

This document explains the GitHub Actions workflows for S3 Deck and how to manage releases.

## Workflow Overview

S3 Deck uses a two-stage workflow system for automated releases:

1. **CI Workflow** (`ci.yml`) - Runs on every push to `main`, handles testing and auto-tagging
2. **Tag Release Workflow** (`tag-release.yml`) - Builds and publishes releases from tags

## CI Workflow (ci.yml)

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

#### 1. Version Consistency Check
- **Purpose**: Ensures all version numbers are synchronized across files
- **Files checked**:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `CHANGELOG.md`
- **Outputs**: Current version and whether a new tag should be created

#### 2. Frontend Tests
- Installs Node.js dependencies
- Runs linting (if available)
- Builds frontend
- Runs tests (if available)

#### 3. Backend Tests
- Sets up Rust toolchain
- Installs system dependencies
- Runs `cargo check` and `cargo test`

#### 4. Build Tests
- Builds Tauri app on all platforms (macOS, Linux, Windows)
- Ensures the app compiles correctly

#### 5. Auto-Tagging (main branch only)
- **Triggers**: Only on successful CI completion on `main` branch
- **Conditions**: 
  - All tests pass
  - Version is consistent across files
  - Tag doesn't already exist
- **Actions**:
  - Creates git tag (e.g., `v0.2.0`)
  - Pushes tag to repository
  - Triggers release workflow

## Tag Release Workflow (tag-release.yml)

### Triggers
- Automatic: When CI workflow completes successfully and creates a new tag
- Manual: Workflow dispatch with specific tag input

### Jobs

#### 1. Get Release Tag
- Determines which tag to release
- Checks if tag already has a release
- Decides whether to proceed with release

#### 2. Build and Release
- **Platforms**: macOS (Intel + Apple Silicon), Linux (x64), Windows (x64)
- **Actions**:
  - Checks out code at specific tag
  - Builds Tauri app for each platform
  - Generates release notes from changelog
  - Creates GitHub release with artifacts
  - Uploads platform-specific installers

## Version Management

### Version Consistency Requirements

All three files must have matching versions:

```json
// package.json
{
  "version": "0.2.0"
}
```

```json
// src-tauri/tauri.conf.json
{
  "version": "0.2.0"
}
```

```markdown
<!-- CHANGELOG.md -->
## [0.2.0] - 2024-08-25
```

### Check Version Consistency

Run the version check locally:

```bash
npm run check-version
```

### Updating Versions

**Recommended: Use the version manager script (updates all files at once)**:

```bash
npm run version:patch   # 0.2.0 -> 0.2.1
npm run version:minor   # 0.2.0 -> 0.3.0  
npm run version:major   # 0.2.0 -> 1.0.0
npm run version:set 1.2.3  # Set specific version
```

This automatically updates:
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `CHANGELOG.md` (moves [Unreleased] to new version)

**Manual method (not recommended)**:
1. Update each file individually
2. Run `npm run check-version` to verify consistency

## Release Process

### Automatic Release (Recommended)

1. **Prepare release**:
   ```bash
   # Update versions across all files
   npm run version:minor
   
   # Verify consistency
   npm run check-version
   ```

2. **Commit and push to main**:
   ```bash
   git add .
   git commit -m "Release v0.3.0"
   git push origin main
   ```

3. **Automatic process**:
   - CI runs version consistency check using Node.js scripts
   - If successful, creates tag using `github-utils.cjs`
   - Tag creation triggers release workflow
   - Release workflow builds and publishes artifacts using Node.js scripts

### Manual Release

If you need to release a specific tag manually:

1. **Go to GitHub Actions**
2. **Select "Tag Release" workflow**
3. **Click "Run workflow"**
4. **Enter tag name** (e.g., `v0.2.0`)
5. **Click "Run workflow"**

## Troubleshooting

### Version Consistency Failures

**Error**: Version mismatch between files

**Solution**:
1. Run `npm run check-version` to see mismatches
2. Use `npm run version:set X.Y.Z` to update all files at once
3. Commit and push changes

### Failed Auto-Tagging

**Error**: Tag already exists

**Solution**:
1. Delete existing tag if needed:
   ```bash
   git tag -d v0.2.0
   git push --delete origin v0.2.0
   ```
2. Push changes to trigger new CI run

### Release Build Failures

**Error**: Platform-specific build fails

**Solution**:
1. Check the specific platform logs in GitHub Actions
2. Common issues:
   - Missing system dependencies
   - Rust compilation errors
   - Frontend build failures
3. Fix issues and create new tag

### Manual Release Recovery

If automatic release fails, you can manually trigger:

```bash
# Create tag locally
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# Then use manual workflow dispatch
```

## Node.js Scripts

S3 Deck uses Node.js scripts for consistent automation across local development and CI/CD:

### Version Management Scripts

- **`npm run version:show`** - Show current version and check consistency
- **`npm run version:patch`** - Increment patch version (0.2.0 → 0.2.1)
- **`npm run version:minor`** - Increment minor version (0.2.0 → 0.3.0)
- **`npm run version:major`** - Increment major version (0.2.0 → 1.0.0)
- **`npm run version:set 1.2.3`** - Set specific version

### GitHub Utilities Scripts

- **`npm run gh:check-tag`** - Check if current version should be tagged
- **`npm run gh:current-version`** - Get current version from package.json
- **`npm run check-version`** - Verify version consistency across all files

### Direct Script Usage

```bash
# Version management
node scripts/version-manager.cjs current
node scripts/version-manager.cjs patch
node scripts/version-manager.cjs set 1.2.3

# GitHub utilities
node scripts/github-utils.cjs check-tag
node scripts/github-utils.cjs create-tag 1.2.3 "Release v1.2.3"
node scripts/github-utils.cjs trigger-release v1.2.3

# Version consistency check
node scripts/check-version-consistency.cjs
```

## Workflow Files

- **`.github/workflows/ci.yml`** - Main CI pipeline with auto-tagging
- **`.github/workflows/tag-release.yml`** - Release builder and publisher
- **`scripts/version-manager.cjs`** - Version management utilities
- **`scripts/github-utils.cjs`** - GitHub API operations
- **`scripts/check-version-consistency.cjs`** - Version consistency checker

## Environment Variables

The workflows use these GitHub secrets:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- No additional secrets required

## Release Artifacts

Each release creates:

- **macOS**: `.dmg` files for Intel and Apple Silicon
- **Windows**: `.msi` installer
- **Linux**: `.AppImage` and `.deb` packages

All artifacts are automatically uploaded to the GitHub release.