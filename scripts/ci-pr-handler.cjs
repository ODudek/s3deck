#!/usr/bin/env node

/**
 * CI PR Handler for S3 Deck
 *
 * This script handles PR-specific CI operations including changelog checking,
 * PR summary generation, and status updates.
 */

const {
  log,
  addToGitHubSummary,
  setGitHubOutput,
  generateSectionHeader,
  execCommand,
  getStatusEmoji,
  createTempFile,
  isPullRequest,
  getRepositoryInfo
} = require('./ci-utils.cjs');

function checkVersionBump() {
  log('🔢 Checking if version was bumped in PR...', 'blue');
  
  try {
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    
    // Get package.json from base branch
    const basePackageResult = execCommand(`git show origin/${baseBranch}:package.json`, { silent: true });
    if (!basePackageResult.success) {
      throw new Error(`Could not get package.json from base branch: ${basePackageResult.error}`);
    }
    
    const basePackage = JSON.parse(basePackageResult.output);
    const baseVersion = basePackage.version;
    
    // Get current package.json
    const fs = require('fs');
    const currentPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = currentPackage.version;
    
    // Compare versions
    const versionBumped = baseVersion !== currentVersion;
    
    log(`Base version: ${baseVersion}, Current version: ${currentVersion}`, 'blue');
    
    if (versionBumped) {
      log(`✅ Version bumped from ${baseVersion} to ${currentVersion}`, 'green');
    } else {
      log(`❌ Version not bumped (still ${currentVersion})`, 'red');
    }
    
    return {
      success: true,
      bumped: versionBumped,
      baseVersion,
      currentVersion
    };
    
  } catch (error) {
    log(`❌ Version check failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message,
      bumped: false
    };
  }
}

function checkChangelogUpdate() {
  log('📋 Checking CHANGELOG update for PR...', 'blue');

  addToGitHubSummary(generateSectionHeader('CHANGELOG Check', '📋'));
  addToGitHubSummary('');

  try {
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
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

    let recommendation = 'UPDATE_NEEDED';
    let changelogUpdated = false;

    if (shouldSkip) {
      recommendation = 'SKIP';
    } else {
      // Check if CHANGELOG.md was modified
      const fs = require('fs');
      
      // Get CHANGELOG content from base branch
      const baseChangelogResult = execCommand(`git show origin/${baseBranch}:CHANGELOG.md`, { silent: true });
      let baseContent = null;
      
      if (baseChangelogResult.success) {
        const tempFile = '/tmp/changelog-base.md';
        fs.writeFileSync(tempFile, baseChangelogResult.output);
        baseContent = getChangelogUnreleasedSection(tempFile);
        fs.unlinkSync(tempFile);
      }
      
      // Get current CHANGELOG content
      const currentContent = getChangelogUnreleasedSection('CHANGELOG.md');
      
      // Compare the [Unreleased] sections
      changelogUpdated = baseContent !== currentContent;
      
      if (changelogUpdated) {
        recommendation = 'PASS';
      }
    }
    
    function getChangelogUnreleasedSection(filePath) {
      try {
        if (!fs.existsSync(filePath)) return null;
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find the [Unreleased] section
        const unreleasedMatch = content.match(/^## \[Unreleased\]([\s\S]*?)^## \[/m);
        if (unreleasedMatch) return unreleasedMatch[1].trim();
        
        // If no next section found, get everything after [Unreleased]
        const unreleasedToEndMatch = content.match(/^## \[Unreleased\]([\s\S]*)/m);
        if (unreleasedToEndMatch) return unreleasedToEndMatch[1].trim();
        
        return null;
      } catch (error) {
        return null;
      }
    }

    // Set outputs for GitHub Actions
    setGitHubOutput('changelog_should_update', (!shouldSkip).toString());
    setGitHubOutput('changelog_updated', changelogUpdated.toString());
    setGitHubOutput('changelog_recommendation', recommendation);

    // Add to summary
    if (recommendation === 'PASS') {
      addToGitHubSummary('✅ **CHANGELOG updated:** Changes documented in [Unreleased] section');
      log('✅ CHANGELOG has been updated', 'green');
    } else if (recommendation === 'SKIP') {
      addToGitHubSummary('⏭️ **CHANGELOG update skipped:** Documentation/CI changes detected');
      log('⏭️ CHANGELOG update skipped for this PR type', 'yellow');
    } else {
      addToGitHubSummary('⚠️ **CHANGELOG needs update:** Please document your changes');
      log('⚠️ CHANGELOG needs to be updated', 'yellow');
    }

    return {
      success: true,
      recommendation,
      shouldUpdate: !shouldSkip,
      updated: changelogUpdated
    };

  } catch (error) {
    log(`❌ Changelog check failed: ${error.message}`, 'red');
    addToGitHubSummary('❌ **CHANGELOG check failed**');
    addToGitHubSummary(`**Error:** ${error.message}`);

    return {
      success: false,
      error: error.message,
      recommendation: 'ERROR'
    };
  }
}

function generatePRSummary(testResults, changelogCheck, versionCheck) {
  log('📝 Generating PR summary...', 'blue');

  try {
    const repo = getRepositoryInfo();

    // Create input for PR summary generator
    const summaryInput = {
      prNumber: process.env.PR_NUMBER || 0,
      version: process.env.VERSION || '0.0.0',
      sourceBranch: process.env.GITHUB_HEAD_REF || 'feature',
      targetBranch: process.env.GITHUB_BASE_REF || 'main',
      commitSha: process.env.GITHUB_SHA || repo.sha,
      versionStatus: testResults.versionStatus || 'unknown',
      frontendStatus: testResults.frontendStatus || 'unknown',
      backendStatus: testResults.backendStatus || 'unknown',
      buildStatus: testResults.buildStatus || 'unknown',
      changelogRecommendation: changelogCheck.recommendation || 'ERROR',
      versionBumped: versionCheck ? versionCheck.bumped : false,
      baseVersion: versionCheck ? versionCheck.baseVersion : null,
      currentVersion: versionCheck ? versionCheck.currentVersion : null,
      workflowRunId: repo.runId,
      repositoryName: repo.full
    };

    // Create temporary file with input
    const inputFile = createTempFile(JSON.stringify(summaryInput, null, 2));

    // Generate PR summary
    const result = execCommand(`cat "${inputFile}" | node scripts/generate-pr-summary.cjs generate`, {
      silent: true
    });

    if (!result.success) {
      throw new Error('PR summary generation failed');
    }

    const summary = result.output;
    log('✅ PR summary generated successfully', 'green');

    return {
      success: true,
      summary,
      input: summaryInput
    };

  } catch (error) {
    log(`❌ PR summary generation failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

function updatePRComment(summary) {
  log('💬 Updating PR comment...', 'blue');

  try {
    // Save summary to environment for GitHub script using GitHub Actions format
    const fs = require('fs');
    const summaryFile = createTempFile(summary);
    
    // Export for GitHub Actions - use GITHUB_ENV to set environment variables
    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(process.env.GITHUB_ENV, `PR_SUMMARY<<EOF\n${summary}\nEOF\n`);
      log('✅ PR summary exported to GitHub Actions environment', 'green');
    } else {
      // Fallback for non-GitHub environments
      process.env.PR_SUMMARY = summary;
      log('✅ PR summary set in local environment', 'green');
    }

    log('✅ PR summary prepared for GitHub Actions', 'green');
    return { success: true, summaryFile };

  } catch (error) {
    log(`❌ Failed to prepare PR comment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function createPRStatusCheck(overallStatus, testResults) {
  log('🔍 Creating PR status check...', 'blue');

  try {
    let state, description;

    if (overallStatus === 'success') {
      state = 'success';
      description = '✅ All checks passed - Ready for review';
    } else {
      state = 'failure';
      description = '❌ Some checks failed - Review required';
    }

    // Prepare status check data
    const statusData = {
      state,
      description,
      context: 'S3 Deck CI/CD',
      testResults,
      timestamp: new Date().toISOString()
    };

    log(`✅ Status check prepared: ${state}`, 'green');
    return { success: true, statusData };

  } catch (error) {
    log(`❌ Failed to create status check: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function runPRWorkflow(testResults) {
  log('🔄 Running PR workflow...', 'blue');

  const results = {
    versionCheck: null,
    changelogCheck: null,
    prSummary: null,
    commentUpdate: null,
    statusCheck: null
  };

  try {
    // Step 1: Check version bump
    results.versionCheck = checkVersionBump();
    
    // Step 2: Check CHANGELOG
    results.changelogCheck = checkChangelogUpdate();

    // Step 3: Generate PR summary
    results.prSummary = generatePRSummary(testResults, results.changelogCheck, results.versionCheck);

    if (results.prSummary.success) {
      // Step 4: Prepare comment update
      results.commentUpdate = updatePRComment(results.prSummary.summary);

      // Step 5: Determine overall status - now including version bump requirement
      const allTestsPassed = Object.values(testResults).every(status => status === 'success');
      const changelogOk = results.changelogCheck.recommendation === 'PASS' ||
                         results.changelogCheck.recommendation === 'SKIP';
      const versionBumped = results.versionCheck.bumped;
      const overallStatus = allTestsPassed && changelogOk && versionBumped ? 'success' : 'failure';

      // Step 5: Create status check
      results.statusCheck = createPRStatusCheck(overallStatus, testResults);

      // Set final outputs
      setGitHubOutput('pr_status', overallStatus);
      setGitHubOutput('all_tests_passed', allTestsPassed.toString());
      setGitHubOutput('changelog_ok', changelogOk.toString());
      setGitHubOutput('version_bumped', versionBumped.toString());
    }

    const success = results.changelogCheck.success &&
                   results.prSummary.success &&
                   results.commentUpdate.success;

    log(success ? '✅ PR workflow completed successfully' : '⚠️ PR workflow completed with issues',
        success ? 'green' : 'yellow');

    return {
      success,
      results,
      summary: {
        changelogStatus: results.changelogCheck.recommendation,
        summaryGenerated: results.prSummary.success,
        commentPrepared: results.commentUpdate.success,
        statusCheckCreated: results.statusCheck.success
      }
    };

  } catch (error) {
    log(`❌ PR workflow failed: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('CI PR Handler for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node ci-pr-handler.cjs <command> [options]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  changelog           - Check CHANGELOG update status', 'reset');
    log('  summary             - Generate PR summary', 'reset');
    log('  workflow            - Run full PR workflow', 'reset');
    log('  help                - Show this help message', 'reset');
    log('', 'reset');
    log('Environment Variables (GitHub Actions):', 'blue');
    log('  GITHUB_BASE_REF     - Target branch (e.g., main)', 'reset');
    log('  GITHUB_HEAD_REF     - Source branch (e.g., feature/name)', 'reset');
    log('  PR_TITLE            - Pull request title', 'reset');
    log('  PR_BODY             - Pull request body', 'reset');
    log('  PR_NUMBER           - Pull request number', 'reset');
    log('  VERSION             - Current version', 'reset');
    log('  *_STATUS            - Test result statuses', 'reset');
    log('', 'reset');
    log('Examples:', 'yellow');
    log('  node ci-pr-handler.cjs changelog', 'reset');
    log('  node ci-pr-handler.cjs workflow', 'reset');
    return;
  }

  if (!isPullRequest() && process.env.NODE_ENV !== 'test') {
    log('⚠️ This script is designed for pull request workflows', 'yellow');
    log('Current event is not a pull request, skipping...', 'yellow');
    process.exit(0);
  }

  try {
    switch (command) {
      case 'changelog':
        const changelogResult = checkChangelogUpdate();
        console.log(JSON.stringify(changelogResult, null, 2));
        process.exit(changelogResult.success ? 0 : 1);
        break;

      case 'summary':
        // Expect test results from environment or stdin
        const testResults = {
          versionStatus: process.env.VERSION_STATUS || 'unknown',
          frontendStatus: process.env.FRONTEND_STATUS || 'unknown',
          backendStatus: process.env.BACKEND_STATUS || 'unknown',
          buildStatus: process.env.BUILD_STATUS || 'unknown'
        };

        const versionCheck = checkVersionBump();
        const changelogCheck = checkChangelogUpdate();
        const summaryResult = generatePRSummary(testResults, changelogCheck, versionCheck);

        console.log(JSON.stringify(summaryResult, null, 2));
        process.exit(summaryResult.success ? 0 : 1);
        break;

      case 'workflow':
        // Get test results from environment
        const workflowTestResults = {
          versionStatus: process.env.VERSION_STATUS || 'unknown',
          frontendStatus: process.env.FRONTEND_STATUS || 'unknown',
          backendStatus: process.env.BACKEND_STATUS || 'unknown',
          buildStatus: process.env.BUILD_STATUS || 'unknown'
        };

        const workflowResult = runPRWorkflow(workflowTestResults);

        // Output result for potential consumption
        if (process.env.CI_OUTPUT_REPORT) {
          console.log(JSON.stringify(workflowResult, null, 2));
        }

        process.exit(workflowResult.success ? 0 : 1);
        break;

      default:
        log(`❌ Unknown command: ${command}`, 'red');
        log('Use "node ci-pr-handler.cjs help" for usage information', 'yellow');
        process.exit(1);
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkVersionBump,
  checkChangelogUpdate,
  generatePRSummary,
  updatePRComment,
  createPRStatusCheck,
  runPRWorkflow
};
