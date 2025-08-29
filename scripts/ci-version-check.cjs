#!/usr/bin/env node

/**
 * CI Version Check for S3 Deck
 *
 * This script handles version consistency checking and tagging decisions
 * for GitHub Actions workflows.
 */

const {
  getCurrentVersion,
  getGitBranch,
  getBranchType,
  addToGitHubSummary,
  setGitHubOutput,
  log,
  getStatusEmoji,
  formatSummaryTable,
  generateSectionHeader,
  execCommand
} = require('./ci-utils.cjs');

function checkVersionConsistency() {
  log('🔍 Checking version consistency across all files...', 'blue');

  try {
    const fs = require('fs');
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const packageVersion = packageJson.version;
    
    // Read tauri.conf.json
    const tauriConf = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    const tauriVersion = tauriConf.version;
    
    // Read Cargo.toml
    const cargoContent = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
    const cargoMatch = cargoContent.match(/^version\s*=\s*"([^"]+)"/m);
    const cargoVersion = cargoMatch ? cargoMatch[1] : null;
    
    const versions = {
      'package.json': packageVersion,
      'src-tauri/tauri.conf.json': tauriVersion,
      'src-tauri/Cargo.toml': cargoVersion
    };
    
    // Check consistency
    const allVersions = Object.values(versions).filter(v => v !== null);
    const isConsistent = allVersions.every(v => v === allVersions[0]);
    
    const result = {
      consistent: isConsistent,
      version: packageVersion,
      versions,
      errors: []
    };
    
    if (!isConsistent) {
      result.errors.push('Version mismatch detected across files');
      const versionsList = Object.entries(versions)
        .map(([file, ver]) => `${file}: ${ver}`)
        .join(', ');
      log(`❌ Version mismatch: ${versionsList}`, 'red');
      return { success: false, error: result.errors.join(', ') };
    }

    log(`✅ All versions are consistent: ${result.version}`, 'green');
    return { success: true, version: result.version };
  } catch (error) {
    log(`❌ Version consistency check failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function checkTaggingDecision() {
  log('🏷️ Checking if tag should be created...', 'blue');

  try {
    const result = execCommand('node scripts/github-utils.cjs check-tag', { silent: true });

    if (!result.success) {
      throw new Error('Tag check failed');
    }

    const tagCheck = JSON.parse(result.output);
    return tagCheck;
  } catch (error) {
    log(`❌ Tag check failed: ${error.message}`, 'red');
    return { shouldCreate: false, error: error.message };
  }
}

function generateVersionSummary(versionCheck, tagCheck) {
  const version = versionCheck.version;
  const branch = getGitBranch();
  const branchType = getBranchType(branch);

  // Add version consistency summary
  addToGitHubSummary(generateSectionHeader('Version Consistency Check', '🔍'));
  addToGitHubSummary('');

  if (versionCheck.success) {
    addToGitHubSummary('✅ **All versions are consistent!**');
  } else {
    addToGitHubSummary('❌ **Version consistency check failed!**');
    addToGitHubSummary('');
    addToGitHubSummary('Please fix version mismatches before proceeding.');
    return;
  }

  // Add version table
  addToGitHubSummary('');
  const versionTable = formatSummaryTable(
    ['File', 'Version'],
    [
      ['📦 package.json', `\`${version}\``],
      ['🦀 tauri.conf.json', `\`${version}\``],
      ['📦 Cargo.toml', `\`${version}\``],
      ['📝 CHANGELOG.md', `\`${version}\``]
    ]
  );
  addToGitHubSummary(versionTable);

  // Add Git Flow information
  addToGitHubSummary(generateSectionHeader('Git Flow Information', '🌊'));
  addToGitHubSummary('');
  addToGitHubSummary(`**Current Branch:** \`${branch}\``);

  let branchTypeDisplay = '';
  switch (branchType) {
    case 'production':
      branchTypeDisplay = '🚀 Production';
      break;
    case 'prerelease':
      branchTypeDisplay = '🧪 Pre-release';
      break;
    case 'feature':
      branchTypeDisplay = '🔧 Feature';
      break;
    case 'hotfix':
      branchTypeDisplay = '🚨 Hotfix';
      break;
    case 'release':
      branchTypeDisplay = '📦 Release';
      break;
    default:
      branchTypeDisplay = '❓ Other';
  }
  addToGitHubSummary(`**Branch Type:** ${branchTypeDisplay}`);

  // Add tagging decision
  addToGitHubSummary('');
  addToGitHubSummary(generateSectionHeader('Tagging Decision', '🏷️'));
  addToGitHubSummary('');

  if (tagCheck.shouldCreate) {
    if (branchType === 'production') {
      addToGitHubSummary(`✅ **Will create production tag:** \`v${version}\``);
    } else if (branchType === 'prerelease') {
      addToGitHubSummary(`✅ **Will create pre-release tag:** \`v${version}-beta\``);
    }
    addToGitHubSummary('');
    addToGitHubSummary('This will trigger the release workflow automatically.');
  } else {
    addToGitHubSummary('ℹ️ **Will not create tag**');
    addToGitHubSummary(`**Reason:** \`${tagCheck.reason || 'unknown'}\``);
  }
}

function determineTaggingBehavior(tagCheck, branch) {
  const branchType = getBranchType(branch);

  // Override should_tag based on Git Flow rules
  let shouldTag = false;
  let finalBranchType = branchType;

  if (branch === 'main') {
    // Main branch: production releases
    shouldTag = tagCheck.shouldCreate;
    finalBranchType = 'production';
  } else if (branch === 'develop') {
    // Develop branch: pre-releases
    shouldTag = tagCheck.shouldCreate;
    finalBranchType = 'prerelease';
  } else {
    // Feature/other branches: no tags
    shouldTag = false;
    finalBranchType = 'feature';
  }

  return {
    shouldTag,
    branchType: finalBranchType
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('CI Version Check for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node ci-version-check.cjs <command>', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  check       - Run version consistency check and output results', 'reset');
    log('  summary     - Generate GitHub Actions summary and outputs', 'reset');
    log('  help        - Show this help message', 'reset');
    log('', 'reset');
    log('Environment Variables (GitHub Actions):', 'blue');
    log('  GITHUB_REF           - Git reference (branch)', 'reset');
    log('  GITHUB_OUTPUT        - GitHub Actions output file', 'reset');
    log('  GITHUB_STEP_SUMMARY  - GitHub Actions summary file', 'reset');
    return;
  }

  try {
    const versionCheck = checkVersionConsistency();

    if (!versionCheck.success) {
      process.exit(1);
    }

    const version = versionCheck.version;
    const branch = getGitBranch();
    const tagCheck = checkTaggingDecision();
    const taggingDecision = determineTaggingBehavior(tagCheck, branch);

    if (command === 'check') {
      // Simple check mode - just output status
      console.log(JSON.stringify({
        versionConsistent: versionCheck.success,
        version: version,
        branch: branch,
        branchType: taggingDecision.branchType,
        shouldTag: taggingDecision.shouldTag,
        tagReason: tagCheck.reason || null
      }, null, 2));

    } else if (command === 'summary') {
      // GitHub Actions mode - generate summary and set outputs
      generateVersionSummary(versionCheck, tagCheck);

      // Set GitHub Actions outputs
      setGitHubOutput('version', version);
      setGitHubOutput('should_tag', taggingDecision.shouldTag.toString());
      setGitHubOutput('branch_type', taggingDecision.branchType);

      // Also output for logs
      log(`📋 Version: ${version}`, 'blue');
      log(`🌿 Branch: ${branch} (${taggingDecision.branchType})`, 'blue');
      log(`🏷️ Should tag: ${taggingDecision.shouldTag}`, 'blue');

    } else {
      log(`❌ Unknown command: ${command}`, 'red');
      log('Use "node ci-version-check.cjs help" for usage information', 'yellow');
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
  checkVersionConsistency,
  checkTaggingDecision,
  generateVersionSummary,
  determineTaggingBehavior
};
