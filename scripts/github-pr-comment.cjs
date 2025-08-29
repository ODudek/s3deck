#!/usr/bin/env node

/**
 * GitHub PR Comment Manager for S3 Deck
 *
 * This script manages PR comments for CI/CD status updates.
 * It can create, update, or find existing PR comments.
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');

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

async function findExistingComment(octokit, owner, repo, prNumber, commentIdentifier = 'CI/CD Summary') {
  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber
    });

    return comments.find(comment => 
      comment.body && comment.body.includes(commentIdentifier)
    );
  } catch (error) {
    log(`Warning: Could not fetch existing comments: ${error.message}`, 'yellow');
    return null;
  }
}

async function createPRComment(octokit, owner, repo, prNumber, body) {
  try {
    log(`📝 Creating new PR comment for #${prNumber}...`, 'blue');
    
    const { data: comment } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body
    });

    log(`✅ PR comment created successfully: ${comment.html_url}`, 'green');
    return { success: true, comment };
  } catch (error) {
    log(`❌ Failed to create PR comment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function updatePRComment(octokit, owner, repo, commentId, body) {
  try {
    log(`📝 Updating existing PR comment ${commentId}...`, 'blue');
    
    const { data: comment } = await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body
    });

    log(`✅ PR comment updated successfully: ${comment.html_url}`, 'green');
    return { success: true, comment };
  } catch (error) {
    log(`❌ Failed to update PR comment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function upsertPRComment(octokit, owner, repo, prNumber, body, commentIdentifier = 'CI/CD Summary') {
  try {
    // Try to find existing comment
    const existingComment = await findExistingComment(octokit, owner, repo, prNumber, commentIdentifier);

    if (existingComment) {
      return await updatePRComment(octokit, owner, repo, existingComment.id, body);
    } else {
      return await createPRComment(octokit, owner, repo, prNumber, body);
    }
  } catch (error) {
    log(`❌ Failed to upsert PR comment: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('GitHub PR Comment Manager for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node github-pr-comment.cjs <command> [options]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  create      - Create a new PR comment', 'reset');
    log('  update      - Update existing PR comment by ID', 'reset');
    log('  upsert      - Create or update PR comment (recommended)', 'reset');
    log('  find        - Find existing PR comment', 'reset');
    log('  help        - Show this help message', 'reset');
    log('', 'reset');
    log('Environment Variables:', 'blue');
    log('  GITHUB_TOKEN        - GitHub token for API access', 'reset');
    log('  GITHUB_REPOSITORY   - Repository in owner/repo format', 'reset');
    log('  PR_NUMBER           - Pull request number', 'reset');
    log('  PR_SUMMARY          - Comment body content', 'reset');
    log('', 'reset');
    log('Examples:', 'yellow');
    log('  node github-pr-comment.cjs upsert', 'reset');
    log('  node github-pr-comment.cjs create', 'reset');
    log('  node github-pr-comment.cjs find', 'reset');
    return;
  }

  try {
    const octokit = createOctokit();
    const repository = process.env.GITHUB_REPOSITORY;
    const prNumber = parseInt(process.env.PR_NUMBER || process.env.PULL_REQUEST_NUMBER);
    const commentBody = process.env.PR_SUMMARY;

    if (!repository) {
      throw new Error('GITHUB_REPOSITORY environment variable is required');
    }

    if (!prNumber || isNaN(prNumber)) {
      throw new Error('PR_NUMBER environment variable is required and must be a number');
    }

    const { owner, repo } = parseRepository(repository);

    switch (command) {
      case 'create':
        if (!commentBody) {
          throw new Error('PR_SUMMARY environment variable is required for create command');
        }
        createPRComment(octokit, owner, repo, prNumber, commentBody)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'update':
        const commentId = args[1];
        if (!commentId) {
          throw new Error('Comment ID is required for update command');
        }
        if (!commentBody) {
          throw new Error('PR_SUMMARY environment variable is required for update command');
        }
        updatePRComment(octokit, owner, repo, parseInt(commentId), commentBody)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'upsert':
        if (!commentBody) {
          throw new Error('PR_SUMMARY environment variable is required for upsert command');
        }
        upsertPRComment(octokit, owner, repo, prNumber, commentBody)
          .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      case 'find':
        findExistingComment(octokit, owner, repo, prNumber)
          .then(comment => {
            if (comment) {
              console.log(JSON.stringify({ success: true, comment }, null, 2));
            } else {
              console.log(JSON.stringify({ success: false, message: 'No existing comment found' }, null, 2));
            }
            process.exit(0);
          })
          .catch(error => {
            log(`❌ Error: ${error.message}`, 'red');
            process.exit(1);
          });
        break;

      default:
        log(`❌ Unknown command: ${command}`, 'red');
        log('Use "node github-pr-comment.cjs help" for usage information', 'yellow');
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
  findExistingComment,
  createPRComment,
  updatePRComment,
  upsertPRComment
};