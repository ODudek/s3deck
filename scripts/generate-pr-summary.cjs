#!/usr/bin/env node

/**
 * PR Summary Generator for S3 Deck
 *
 * This script generates a comprehensive PR summary comment with test results,
 * version information, and CHANGELOG status.
 */

const fs = require('fs');
const path = require('path');

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

function getStatusEmoji(status) {
  switch(status) {
    case 'success': return '✅';
    case 'failure': return '❌';
    case 'skipped': return '⏭️';
    default: return '⚠️';
  }
}

function getChangelogStatus(recommendation) {
  switch(recommendation) {
    case 'PASS': return '✅ Updated';
    case 'SKIP': return '⏭️ Not needed';
    case 'UPDATE_NEEDED': return '⚠️ Needs update';
    default: return '❓ Unknown';
  }
}

function generatePRSummary(options) {
  const {
    prNumber,
    version,
    sourceBranch,
    targetBranch,
    commitSha,
    versionStatus,
    frontendStatus,
    backendStatus,
    buildStatus,
    changelogRecommendation,
    workflowRunId,
    repositoryName
  } = options;

  // Check if all tests passed
  const allTestsPassed = versionStatus === 'success' &&
                        frontendStatus === 'success' &&
                        backendStatus === 'success' &&
                        buildStatus === 'success';

  // Check if changelog is OK
  const changelogOk = changelogRecommendation === 'PASS' ||
                     changelogRecommendation === 'SKIP';

  // Overall status
  const allPassed = allTestsPassed && changelogOk;

  // Build the summary
  let summary = `## 🔍 CI/CD Summary for PR #${prNumber}\n\n`;

  // Build Information section
  summary += `### 📋 Build Information\n`;
  summary += `| Item | Value |\n`;
  summary += `|------|-------|\n`;
  summary += `| **Version** | \`${version}\` |\n`;
  summary += `| **Source Branch** | \`${sourceBranch}\` |\n`;
  summary += `| **Target Branch** | \`${targetBranch}\` |\n`;
  summary += `| **Commit** | \`${commitSha}\` |\n\n`;

  // Test Results section
  summary += `### 📊 Test Results\n`;
  summary += `| Check | Status | Result |\n`;
  summary += `|-------|--------|---------|\n`;
  summary += `| Version Consistency | ${getStatusEmoji(versionStatus)} | ${versionStatus} |\n`;
  summary += `| Frontend Tests | ${getStatusEmoji(frontendStatus)} | ${frontendStatus} |\n`;
  summary += `| Backend Tests | ${getStatusEmoji(backendStatus)} | ${backendStatus} |\n`;
  summary += `| Build Tests (All Platforms) | ${getStatusEmoji(buildStatus)} | ${buildStatus} |\n`;
  summary += `| CHANGELOG Update | ${changelogRecommendation === 'PASS' ? '✅' : changelogRecommendation === 'SKIP' ? '⏭️' : '⚠️'} | ${getChangelogStatus(changelogRecommendation)} |\n\n`;

  // Overall Status section
  summary += `### ${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'READY TO MERGE' : 'NEEDS ATTENTION'}\n\n`;

  if (allPassed) {
    summary += `✅ All checks passed! This PR is ready for review and merge.\n\n`;
  } else {
    let statusMessage = '❌ ';
    if (allTestsPassed) {
      statusMessage += 'Tests passed but ';
    } else {
      statusMessage += 'Some tests failed and ';
    }
    if (!changelogOk) {
      statusMessage += 'CHANGELOG needs updating. ';
    }
    statusMessage += 'Please review and fix any issues before merging.\n\n';
    summary += statusMessage;
  }

  // CHANGELOG Update Required section (if needed)
  if (changelogRecommendation === 'UPDATE_NEEDED') {
    summary += `### 📝 CHANGELOG Update Required\n`;
    summary += `Please add your changes to the \`[Unreleased]\` section of CHANGELOG.md. If this PR doesn't require changelog updates, add one of these prefixes to the title:\n`;
    summary += `- \`docs:\` - Documentation changes\n`;
    summary += `- \`ci:\` - CI/CD changes\n`;
    summary += `- \`chore:\` - Maintenance tasks\n`;
    summary += `- \`[skip changelog]\` - Explicit skip\n\n`;
  }

  // Quick Links section
  summary += `### 🔗 Quick Links\n`;
  summary += `- 🏃‍♂️ [View Workflow Run](https://github.com/${repositoryName}/actions/runs/${workflowRunId})\n`;
  summary += `- 📝 [View Changelog](https://github.com/${repositoryName}/blob/main/CHANGELOG.md)\n`;
  summary += `- 🔧 [Repository Actions](https://github.com/${repositoryName}/actions)\n\n`;

  // Footer
  summary += `---\n`;
  summary += `*This comment is automatically updated on each push to the PR.*`;

  return summary;
}

function generateStatusSummary(options) {
  const {
    version,
    sourceBranch,
    targetBranch,
    versionStatus,
    frontendStatus,
    backendStatus,
    buildStatus,
    changelogRecommendation
  } = options;

  const allTestsPassed = versionStatus === 'success' &&
                        frontendStatus === 'success' &&
                        backendStatus === 'success' &&
                        buildStatus === 'success';

  const changelogOk = changelogRecommendation === 'PASS' ||
                     changelogRecommendation === 'SKIP';

  return {
    allTestsPassed,
    changelogOk,
    allPassed: allTestsPassed && changelogOk,
    version,
    sourceBranch,
    targetBranch,
    testResults: {
      versionConsistency: versionStatus,
      frontendTests: frontendStatus,
      backendTests: backendStatus,
      buildTests: buildStatus,
      changelogUpdate: changelogRecommendation
    }
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('PR Summary Generator for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node generate-pr-summary.cjs <command> [options]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  generate    - Generate PR summary comment (JSON input)', 'reset');
    log('  status      - Generate status summary (JSON input)', 'reset');
    log('  help        - Show this help message', 'reset');
    log('', 'reset');
    log('Input (JSON via stdin):', 'blue');
    log('  {', 'reset');
    log('    "prNumber": 123,', 'reset');
    log('    "version": "0.2.0",', 'reset');
    log('    "sourceBranch": "feature/branch",', 'reset');
    log('    "targetBranch": "main",', 'reset');
    log('    "commitSha": "abc123...",', 'reset');
    log('    "versionStatus": "success",', 'reset');
    log('    "frontendStatus": "success",', 'reset');
    log('    "backendStatus": "success",', 'reset');
    log('    "buildStatus": "success",', 'reset');
    log('    "changelogRecommendation": "PASS",', 'reset');
    log('    "workflowRunId": "123456789",', 'reset');
    log('    "repositoryName": "owner/repo"', 'reset');
    log('  }', 'reset');
    log('', 'reset');
    log('Examples:', 'yellow');
    log('  echo \'{"prNumber":123,...}\' | node generate-pr-summary.cjs generate', 'reset');
    log('  echo \'{"version":"0.2.0",...}\' | node generate-pr-summary.cjs status', 'reset');
    return;
  }

  // Read JSON input from stdin
  let inputData = '';
  if (process.stdin.isTTY) {
    log('❌ This script expects JSON input via stdin', 'red');
    log('Usage: echo \'{"key":"value"}\' | node generate-pr-summary.cjs command', 'yellow');
    process.exit(1);
  }

  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
      inputData += chunk;
    }
  });

  process.stdin.on('end', () => {
    try {
      const options = JSON.parse(inputData.trim());

      switch (command) {
        case 'generate':
          const summary = generatePRSummary(options);
          console.log(summary);
          break;

        case 'status':
          const status = generateStatusSummary(options);
          console.log(JSON.stringify(status, null, 2));
          break;

        default:
          log(`❌ Unknown command: ${command}`, 'red');
          log('Use "node generate-pr-summary.cjs help" for usage information', 'yellow');
          process.exit(1);
      }
    } catch (error) {
      log(`❌ Error processing input: ${error.message}`, 'red');
      process.exit(1);
    }
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generatePRSummary,
  generateStatusSummary,
  getStatusEmoji,
  getChangelogStatus
};
