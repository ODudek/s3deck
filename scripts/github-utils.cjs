#!/usr/bin/env node

/**
 * GitHub Utilities for S3 Deck
 *
 * This script provides utilities for GitHub operations like creating tags,
 * checking releases, and triggering workflows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : ''
    };
  }
}

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkTagExists(tag) {
  const result = execCommand(`git ls-remote --tags origin refs/tags/${tag}`, { silent: true });
  return result.success && result.output.length > 0;
}

function checkReleaseExists(tag) {
  if (!process.env.GITHUB_TOKEN) {
    log('⚠️  GITHUB_TOKEN not set, cannot check GitHub releases', 'yellow');
    return false;
  }

  const repo = process.env.GITHUB_REPOSITORY || getGitHubRepo();
  if (!repo) {
    log('❌ Cannot determine GitHub repository', 'red');
    return false;
  }

  const result = execCommand(
    `gh api repos/${repo}/releases/tags/${tag} --jq '.tag_name'`,
    { silent: true }
  );

  return result.success && result.output === tag;
}

function getGitHubRepo() {
  const result = execCommand('git remote get-url origin', { silent: true });
  if (!result.success) return null;

  // Extract owner/repo from git URL
  const match = result.output.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return match ? match[1] : null;
}

function createTag(version, message) {
  log(`🏷️  Creating tag v${version}...`, 'blue');

  // Configure git if needed
  const userResult = execCommand('git config user.name', { silent: true });
  if (!userResult.success || !userResult.output) {
    log('🔧 Configuring git user...', 'blue');
    execCommand('git config user.name "github-actions[bot]"');
    execCommand('git config user.email "github-actions[bot]@users.noreply.github.com"');
  }

  // Create tag
  const tag = `v${version}`;
  const tagResult = execCommand(`git tag -a "${tag}" -m "${message || `Release ${tag}`}"`);

  if (!tagResult.success) {
    log(`❌ Failed to create tag: ${tagResult.error}`, 'red');
    return false;
  }

  // Push tag
  const pushResult = execCommand(`git push origin "${tag}"`);

  if (!pushResult.success) {
    log(`❌ Failed to push tag: ${pushResult.error}`, 'red');
    return false;
  }

  log(`✅ Created and pushed tag: ${tag}`, 'green');
  return true;
}

function triggerWorkflow(workflowFile, inputs = {}) {
  if (!process.env.GITHUB_TOKEN) {
    log('❌ GITHUB_TOKEN not set, cannot trigger workflow', 'red');
    return false;
  }

  const repo = process.env.GITHUB_REPOSITORY || getGitHubRepo();
  if (!repo) {
    log('❌ Cannot determine GitHub repository', 'red');
    return false;
  }

  log(`🚀 Triggering workflow: ${workflowFile}`, 'blue');

  let command = `gh workflow run ${workflowFile}`;

  // Add inputs if provided
  if (Object.keys(inputs).length > 0) {
    for (const [key, value] of Object.entries(inputs)) {
      command += ` -f ${key}="${value}"`;
    }
  }

  const result = execCommand(command);

  if (!result.success) {
    log(`❌ Failed to trigger workflow: ${result.error}`, 'red');
    return false;
  }

  log(`✅ Triggered workflow: ${workflowFile}`, 'green');
  return true;
}

function shouldCreateTag() {
  const version = getCurrentVersion();
  const tag = `v${version}`;

  log(`🔍 Checking if tag ${tag} should be created...`, 'blue');

  // Check if tag already exists
  if (checkTagExists(tag)) {
    log(`🏷️  Tag ${tag} already exists`, 'yellow');
    return { shouldCreate: false, version, tag, reason: 'tag_exists' };
  }

  // Check current branch (support Git Flow)
  const branchResult = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true });
  const currentBranch = branchResult.success ? branchResult.output : 'unknown';
  const githubRef = process.env.GITHUB_REF || '';

  // Determine branch type for Git Flow
  let branchType = 'feature';
  if (currentBranch === 'main' || githubRef === 'refs/heads/main') {
    branchType = 'production';
  } else if (currentBranch === 'develop' || githubRef === 'refs/heads/develop') {
    branchType = 'prerelease';
  }

  // Only create tags on main or develop branches
  if (branchType === 'feature') {
    log(`⚠️  Not on main/develop branch (current: ${currentBranch})`, 'yellow');
    return { shouldCreate: false, version, tag, reason: 'not_release_branch', currentBranch, branchType };
  }

  log(`✅ Tag ${tag} should be created on ${branchType} branch`, 'green');
  return { shouldCreate: true, version, tag, branchType };
}

function generateReleaseNotes() {
  try {
    const result = execCommand('npm run release-notes --silent', { silent: true });
    if (result.success) {
      return result.output;
    } else {
      log('⚠️  Could not generate release notes from changelog', 'yellow');
      return 'See [CHANGELOG.md](https://github.com/ODudek/s3deck/blob/main/CHANGELOG.md) for detailed changes.';
    }
  } catch (error) {
    log('⚠️  Could not generate release notes, using fallback', 'yellow');
    return 'See [CHANGELOG.md](https://github.com/ODudek/s3deck/blob/main/CHANGELOG.md) for detailed changes.';
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check-tag':
      const check = shouldCreateTag();
      console.log(JSON.stringify(check));
      break;

    case 'check-branch':
      const branchResult = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true });
      const currentBranch = branchResult.success ? branchResult.output : 'unknown';
      const githubRef = process.env.GITHUB_REF || '';

      let branchType = 'feature';
      if (currentBranch === 'main' || githubRef === 'refs/heads/main') {
        branchType = 'production';
      } else if (currentBranch === 'develop' || githubRef === 'refs/heads/develop') {
        branchType = 'prerelease';
      }

      console.log(JSON.stringify({ currentBranch, branchType, githubRef }));
      break;

    case 'create-tag':
      const version = args[1] || getCurrentVersion();
      const message = args[2];
      const success = createTag(version, message);
      process.exit(success ? 0 : 1);
      break;

    case 'trigger-release':
      const tag = args[1];
      if (!tag) {
        log('❌ Tag parameter required for trigger-release', 'red');
        process.exit(1);
      }
      const triggered = triggerWorkflow('tag-release.yml', { tag });
      process.exit(triggered ? 0 : 1);
      break;

    case 'tag-exists':
      const tagToCheck = args[1];
      if (!tagToCheck) {
        log('❌ Tag parameter required for tag-exists', 'red');
        process.exit(1);
      }
      const exists = checkTagExists(tagToCheck);
      console.log(exists ? 'true' : 'false');
      break;

    case 'release-exists':
      const releaseTag = args[1];
      if (!releaseTag) {
        log('❌ Tag parameter required for release-exists', 'red');
        process.exit(1);
      }
      const releaseExists = checkReleaseExists(releaseTag);
      console.log(releaseExists ? 'true' : 'false');
      break;

    case 'current-version':
      console.log(getCurrentVersion());
      break;

    case 'release-notes':
      console.log(generateReleaseNotes());
      break;

    default:
      log('GitHub Utilities for S3 Deck', 'bold');
      log('', 'reset');
      log('Usage:', 'blue');
      log('  node github-utils.cjs <command> [args]', 'reset');
      log('', 'reset');
      log('Commands:', 'blue');
      log('  check-tag                    - Check if current version should be tagged (JSON output)', 'reset');
      log('  check-branch                 - Check current branch and type (JSON output)', 'reset');
      log('  create-tag [version] [msg]   - Create and push git tag', 'reset');
      log('  trigger-release <tag>        - Trigger GitHub release workflow', 'reset');
      log('  tag-exists <tag>             - Check if git tag exists (true/false)', 'reset');
      log('  release-exists <tag>         - Check if GitHub release exists (true/false)', 'reset');
      log('  current-version              - Get current version from package.json', 'reset');
      log('  release-notes                - Generate release notes from changelog', 'reset');
      log('', 'reset');
      log('Examples:', 'yellow');
      log('  node github-utils.cjs check-tag', 'reset');
      log('  node github-utils.cjs check-branch', 'reset');
      log('  node github-utils.cjs create-tag 0.2.1 "Release v0.2.1"', 'reset');
      log('  node github-utils.cjs trigger-release v0.2.1', 'reset');
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  checkTagExists,
  checkReleaseExists,
  createTag,
  triggerWorkflow,
  shouldCreateTag,
  generateReleaseNotes,
  log,
  colors
};
