#!/usr/bin/env node

/**
 * Changelog PR Checker for S3 Deck
 *
 * This script checks if CHANGELOG.md has been updated in a PR.
 * It compares the [Unreleased] section between base and head branches.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function getChangelogUnreleasedSection(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Find the [Unreleased] section
    const unreleasedMatch = content.match(/^## \[Unreleased\]([\s\S]*?)^## \[/m);

    if (unreleasedMatch) {
      return unreleasedMatch[1].trim();
    }

    // If no next section found, get everything after [Unreleased]
    const unreleasedToEndMatch = content.match(/^## \[Unreleased\]([\s\S]*)/m);
    if (unreleasedToEndMatch) {
      return unreleasedToEndMatch[1].trim();
    }

    return null;
  } catch (error) {
    log(`Error reading changelog: ${error.message}`, 'red');
    return null;
  }
}

function hasChangelogBeenUpdated() {
  // Get base branch and head branch from environment or git
  const baseBranch = process.env.GITHUB_BASE_REF || 'main';
  const headBranch = process.env.GITHUB_HEAD_REF || execCommand('git rev-parse --abbrev-ref HEAD', { silent: true }).output;

  // Only log if not in summary mode (when CI_MODE is set or summary command is used)
  if (!process.env.CI_MODE && !process.argv.includes('summary')) {
    log(`🔍 Checking CHANGELOG.md changes between ${baseBranch} and ${headBranch}`, 'blue');
  }

  // Fetch the base branch to ensure we have the latest
  const fetchResult = execCommand(`git fetch origin ${baseBranch}`, { silent: true });
  if (!fetchResult.success) {
    log(`⚠️  Could not fetch base branch ${baseBranch}`, 'yellow');
  }

  // Get the CHANGELOG content from base branch
  const baseChangelogResult = execCommand(`git show origin/${baseBranch}:CHANGELOG.md`, { silent: true });
  let baseChangelogContent = null;

  if (baseChangelogResult.success) {
    // Write base changelog to temp file and read unreleased section
    const tempBasePath = '/tmp/changelog-base.md';
    fs.writeFileSync(tempBasePath, baseChangelogResult.output);
    baseChangelogContent = getChangelogUnreleasedSection(tempBasePath);
    fs.unlinkSync(tempBasePath);
  }

  // Get current CHANGELOG content
  const currentChangelogContent = getChangelogUnreleasedSection('CHANGELOG.md');

  // Check if CHANGELOG.md file was modified in this PR
  const changedFilesResult = execCommand('git diff --name-only HEAD~1', { silent: true });
  const changelogModified = changedFilesResult.success &&
                           changedFilesResult.output.includes('CHANGELOG.md');

  // Compare the [Unreleased] sections
  const unreleasedSectionChanged = baseChangelogContent !== currentChangelogContent;

  return {
    fileModified: changelogModified,
    unreleasedSectionChanged,
    baseContent: baseChangelogContent,
    currentContent: currentChangelogContent,
    baseBranch,
    headBranch
  };
}

function checkPRType() {
  // Get PR title and description from environment
  const prTitle = process.env.PR_TITLE || '';
  const prBody = process.env.PR_BODY || '';

  // Check for keywords that might indicate no changelog needed
  const skipKeywords = [
    'docs:', 'doc:', 'documentation',
    'ci:', 'build:', 'chore:',
    'style:', 'refactor:',
    'test:', 'tests:',
    '[skip changelog]', '[no changelog]',
    'typo', 'formatting'
  ];

  const shouldSkip = skipKeywords.some(keyword =>
    prTitle.toLowerCase().includes(keyword.toLowerCase()) ||
    prBody.toLowerCase().includes(keyword.toLowerCase())
  );

  return {
    shouldSkipChangelog: shouldSkip,
    prTitle,
    detectedKeywords: skipKeywords.filter(keyword =>
      prTitle.toLowerCase().includes(keyword.toLowerCase())
    )
  };
}

function generateSummary(changelogCheck, prTypeCheck) {
  const summary = {
    shouldUpdateChangelog: !prTypeCheck.shouldSkipChangelog,
    changelogUpdated: changelogCheck.fileModified && changelogCheck.unreleasedSectionChanged,
    recommendation: '',
    details: {
      ...changelogCheck,
      ...prTypeCheck
    }
  };

  if (prTypeCheck.shouldSkipChangelog) {
    summary.recommendation = 'SKIP';
  } else if (changelogCheck.unreleasedSectionChanged) {
    summary.recommendation = 'PASS';
  } else {
    summary.recommendation = 'UPDATE_NEEDED';
  }

  return summary;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h') {
    log('Changelog PR Checker for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node check-changelog-pr.cjs [check|summary]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  check    - Check if changelog needs updating (exit code based)', 'reset');
    log('  summary  - Generate detailed summary (JSON output)', 'reset');
    log('  help     - Show this help message', 'reset');
    log('', 'reset');
    log('Environment Variables:', 'blue');
    log('  GITHUB_BASE_REF - Base branch (default: main)', 'reset');
    log('  GITHUB_HEAD_REF - Head branch (default: current)', 'reset');
    log('  PR_TITLE        - PR title for type detection', 'reset');
    log('  PR_BODY         - PR body for type detection', 'reset');
    return;
  }

  const changelogCheck = hasChangelogBeenUpdated();
  const prTypeCheck = checkPRType();
  const summary = generateSummary(changelogCheck, prTypeCheck);

  if (command === 'summary') {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // Default: check command
  log('📋 CHANGELOG.md Update Check', 'bold');
  log('', 'reset');

  if (prTypeCheck.shouldSkipChangelog) {
    log('⏭️  Skipping CHANGELOG check', 'yellow');
    log(`Reason: Detected keywords: ${prTypeCheck.detectedKeywords.join(', ')}`, 'yellow');
    log('✅ No CHANGELOG update required for this type of PR', 'green');
    process.exit(0);
  }

  log(`📝 PR Title: ${prTypeCheck.prTitle}`, 'blue');
  log(`🌿 Comparing: ${changelogCheck.baseBranch} → ${changelogCheck.headBranch}`, 'blue');
  log('', 'reset');

  if (changelogCheck.unreleasedSectionChanged) {
    log('✅ CHANGELOG.md [Unreleased] section has been updated', 'green');
    log('', 'reset');

    if (changelogCheck.currentContent) {
      log('📝 Current [Unreleased] content:', 'blue');
      log('```', 'reset');
      log(changelogCheck.currentContent.substring(0, 500) +
          (changelogCheck.currentContent.length > 500 ? '...' : ''), 'reset');
      log('```', 'reset');
    }

    process.exit(0);
  } else {
    log('❌ CHANGELOG.md [Unreleased] section has not been updated', 'red');
    log('', 'reset');
    log('💡 Please update CHANGELOG.md with your changes:', 'yellow');
    log('1. Add your changes to the [Unreleased] section', 'yellow');
    log('2. Use appropriate categories: Added, Changed, Fixed, etc.', 'yellow');
    log('3. Follow the existing format in the file', 'yellow');
    log('', 'reset');
    log('ℹ️  If this PR doesn\'t require changelog updates, add one of these to the title:', 'blue');
    log('   - docs: (for documentation changes)', 'blue');
    log('   - ci: (for CI/CD changes)', 'blue');
    log('   - chore: (for maintenance tasks)', 'blue');
    log('   - [skip changelog] (explicit skip)', 'blue');

    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  hasChangelogBeenUpdated,
  checkPRType,
  generateSummary,
  getChangelogUnreleasedSection
};
