#!/usr/bin/env node

/**
 * CI Utilities for S3 Deck
 *
 * Common utilities and functions shared across CI scripts for GitHub Actions,
 * version management, and workflow automation.
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
    throw new Error(`Cannot read version from package.json: ${error.message}`);
  }
}

function getGitBranch() {
  // Try environment variables first (GitHub Actions)
  if (process.env.GITHUB_REF) {
    return process.env.GITHUB_REF.replace('refs/heads/', '');
  }

  // Fallback to git command
  const result = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true });
  return result.success ? result.output : 'unknown';
}

function getBranchType(branch = null) {
  const currentBranch = branch || getGitBranch();

  if (currentBranch === 'main') {
    return 'production';
  } else if (currentBranch === 'develop') {
    return 'prerelease';
  } else if (currentBranch.startsWith('feature/')) {
    return 'feature';
  } else if (currentBranch.startsWith('hotfix/')) {
    return 'hotfix';
  } else if (currentBranch.startsWith('release/')) {
    return 'release';
  } else {
    return 'other';
  }
}

function addToGitHubSummary(content) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, content + '\n');
  }
}

function setGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

function setGitHubEnv(key, value) {
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `${key}=${value}\n`);
  }
}

function getStatusEmoji(status) {
  switch(status) {
    case 'success': return '✅';
    case 'failure': return '❌';
    case 'skipped': return '⏭️';
    case 'cancelled': return '🚫';
    default: return '⚠️';
  }
}

function formatSummaryTable(headers, rows) {
  let table = `| ${headers.join(' | ')} |\n`;
  table += `|${headers.map(() => '------').join('|')}|\n`;

  for (const row of rows) {
    table += `| ${row.join(' | ')} |\n`;
  }

  return table;
}

function generateSectionHeader(title, emoji = '📋') {
  return `## ${emoji} ${title}`;
}

function isGitHubActions() {
  return !!process.env.GITHUB_ACTIONS;
}

function isPullRequest() {
  return process.env.GITHUB_EVENT_NAME === 'pull_request';
}

function isMainBranch() {
  return getGitBranch() === 'main';
}

function isDevelopBranch() {
  return getGitBranch() === 'develop';
}

function isReleaseBranch() {
  const branchType = getBranchType();
  return branchType === 'production' || branchType === 'prerelease';
}

function getRepositoryInfo() {
  const repo = process.env.GITHUB_REPOSITORY || '';
  const [owner, name] = repo.split('/');

  return {
    full: repo,
    owner: owner || '',
    name: name || '',
    runId: process.env.GITHUB_RUN_ID || '',
    sha: process.env.GITHUB_SHA || '',
    ref: process.env.GITHUB_REF || '',
    actor: process.env.GITHUB_ACTOR || ''
  };
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Cannot read JSON file ${filePath}: ${error.message}`);
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  } catch (error) {
    throw new Error(`Cannot write JSON file ${filePath}: ${error.message}`);
  }
}

function createTempFile(content, extension = '.json') {
  const tempDir = process.env.RUNNER_TEMP || '/tmp';
  const fileName = `s3deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
  const filePath = path.join(tempDir, fileName);

  fs.writeFileSync(filePath, content);
  return filePath;
}

function validateEnvironment(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function summarizeTestResults(results) {
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(status => status === 'success').length;
  const failed = total - passed;

  return {
    total,
    passed,
    failed,
    allPassed: failed === 0,
    summary: `${passed}/${total} passed`
  };
}

function createJobSummary(jobName, status, details = {}) {
  const emoji = getStatusEmoji(status);
  const timestamp = new Date().toISOString();

  return {
    job: jobName,
    status,
    emoji,
    timestamp,
    ...details
  };
}

function formatDuration(startTime, endTime = null) {
  const end = endTime || Date.now();
  const duration = Math.round((end - startTime) / 1000);

  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

// Export all utilities
module.exports = {
  // Logging and output
  log,
  colors,
  getStatusEmoji,

  // Command execution
  execCommand,

  // Version and Git utilities
  getCurrentVersion,
  getGitBranch,
  getBranchType,

  // GitHub Actions integration
  addToGitHubSummary,
  setGitHubOutput,
  setGitHubEnv,
  isGitHubActions,
  isPullRequest,
  isMainBranch,
  isDevelopBranch,
  isReleaseBranch,
  getRepositoryInfo,

  // File utilities
  readJsonFile,
  writeJsonFile,
  createTempFile,

  // Formatting utilities
  formatSummaryTable,
  generateSectionHeader,
  formatDuration,

  // Validation and checking
  validateEnvironment,
  summarizeTestResults,
  createJobSummary
};
