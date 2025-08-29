#!/usr/bin/env node

/**
 * GitHub Status Check Manager for S3 Deck
 *
 * This script manages GitHub status checks for CI/CD workflows.
 * It can create status checks with different states and descriptions.
 */

const { Octokit } = require('@octokit/rest');

const {
  log,
  getRepositoryInfo
} = require('./ci-utils.cjs');

function createOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  return new Octokit({
    auth: token
  });
}

function parseRepository(repoString) {
  const [owner, repo] = repoString.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository format: ${repoString}. Expected: owner/repo`);
  }
  return { owner, repo };
}

function validateState(state) {
  const validStates = ['error', 'failure', 'pending', 'success'];
  if (!validStates.includes(state)) {
    throw new Error(`Invalid state: ${state}. Must be one of: ${validStates.join(', ')}`);
  }
  return state;
}

async function createStatusCheck(octokit, owner, repo, sha, statusData) {
  try {
    const {
      state,
      context = 'S3 Deck CI/CD',
      description,
      target_url
    } = statusData;

    validateState(state);

    log(`🔍 Creating status check for ${sha.substring(0, 8)}...`, 'blue');
    log(`   Context: ${context}`, 'reset');
    log(`   State: ${state}`, state === 'success' ? 'green' : state === 'failure' ? 'red' : 'yellow');
    log(`   Description: ${description}`, 'reset');

    const { data: status } = await octokit.rest.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      context,
      description,
      target_url
    });

    log(`✅ Status check created successfully: ${status.url}`, 'green');
    return { success: true, status };
  } catch (error) {
    log(`❌ Failed to create status check: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function listStatusChecks(octokit, owner, repo, sha) {
  try {
    log(`📋 Listing status checks for ${sha.substring(0, 8)}...`, 'blue');

    const { data: statuses } = await octokit.rest.repos.listCommitStatusesForRef({
      owner,
      repo,
      ref: sha
    });

    log(`Found ${statuses.length} status checks`, 'green');
    return { success: true, statuses };
  } catch (error) {
    log(`❌ Failed to list status checks: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function getCombinedStatus(octokit, owner, repo, sha) {
  try {
    log(`🔍 Getting combined status for ${sha.substring(0, 8)}...`, 'blue');

    const { data: combined } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: sha
    });

    log(`Combined state: ${combined.state}`, combined.state === 'success' ? 'green' : combined.state === 'failure' ? 'red' : 'yellow');
    return { success: true, combined };
  } catch (error) {
    log(`❌ Failed to get combined status: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function determineStatusFromTestResults(testResults) {
  // Parse test results and determine overall status
  const results = typeof testResults === 'string' ? JSON.parse(testResults) : testResults;
  
  const allTestsPassed = Object.values(results).every(status => status === 'success');
  
  if (allTestsPassed) {
    return {
      state: 'success',
      description: '✅ All checks passed - Ready for review'
    };
  } else {
    const failedTests = Object.entries(results)
      .filter(([, status]) => status !== 'success')
      .map(([test]) => test);
    
    return {
      state: 'failure',
      description: `❌ Some checks failed: ${failedTests.join(', ')}`
    };
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('GitHub Status Check Manager for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node github-status-check.cjs <command> [options]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  create      - Create a status check', 'reset');
    log('  list        - List status checks for a commit', 'reset');
    log('  combined    - Get combined status for a commit', 'reset');
    log('  auto        - Create status check based on test results', 'reset');
    log('  help        - Show this help message', 'reset');
    log('', 'reset');
    log('Environment Variables:', 'blue');
    log('  GITHUB_TOKEN        - GitHub token for API access', 'reset');
    log('  GITHUB_REPOSITORY   - Repository in owner/repo format', 'reset');
    log('  GITHUB_SHA          - Commit SHA to create status for', 'reset');
    log('  STATUS_STATE        - Status state (success, failure, error, pending)', 'reset');
    log('  STATUS_CONTEXT      - Status context (default: "S3 Deck CI/CD")', 'reset');
    log('  STATUS_DESCRIPTION  - Status description', 'reset');
    log('  STATUS_TARGET_URL   - Optional URL for status details', 'reset');
    log('  TEST_RESULTS        - JSON string of test results for auto command', 'reset');
    log('', 'reset');
    log('Examples:', 'yellow');
    log('  node github-status-check.cjs auto', 'reset');
    log('  node github-status-check.cjs create', 'reset');
    log('  node github-status-check.cjs list', 'reset');
    return;
  }

  try {
    const octokit = createOctokit();
    const repository = process.env.GITHUB_REPOSITORY;
    const sha = process.env.GITHUB_SHA;

    if (!repository) {
      throw new Error('GITHUB_REPOSITORY environment variable is required');
    }

    if (!sha) {
      throw new Error('GITHUB_SHA environment variable is required');
    }

    const { owner, repo } = parseRepository(repository);

    switch (command) {
      case 'create':
        const statusData = {
          state: process.env.STATUS_STATE,
          context: process.env.STATUS_CONTEXT || 'S3 Deck CI/CD',
          description: process.env.STATUS_DESCRIPTION,
          target_url: process.env.STATUS_TARGET_URL
        };

        if (!statusData.state) {
          throw new Error('STATUS_STATE environment variable is required for create command');
        }

        if (!statusData.description) {
          throw new Error('STATUS_DESCRIPTION environment variable is required for create command');
        }

        createStatusCheck(octokit, owner, repo, sha, statusData)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'list':
        listStatusChecks(octokit, owner, repo, sha)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'combined':
        getCombinedStatus(octokit, owner, repo, sha)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'auto':
        const testResults = process.env.TEST_RESULTS;
        if (!testResults) {
          throw new Error('TEST_RESULTS environment variable is required for auto command');
        }

        try {
          const autoStatusData = determineStatusFromTestResults(testResults);
          autoStatusData.context = process.env.STATUS_CONTEXT || 'S3 Deck CI/CD';
          autoStatusData.target_url = process.env.STATUS_TARGET_URL;

          createStatusCheck(octokit, owner, repo, sha, autoStatusData)
            .then(result => {
              console.log(JSON.stringify(result, null, 2));
              process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
              log(`❌ Error: ${error.message}`, 'red');
              process.exit(1);
            });
        } catch (parseError) {
          throw new Error(`Invalid TEST_RESULTS JSON: ${parseError.message}`);
        }
        break;

      default:
        log(`❌ Unknown command: ${command}`, 'red');
        log('Use "node github-status-check.cjs help" for usage information', 'yellow');
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
  createOctokit,
  parseRepository,
  validateState,
  createStatusCheck,
  listStatusChecks,
  getCombinedStatus,
  determineStatusFromTestResults
};