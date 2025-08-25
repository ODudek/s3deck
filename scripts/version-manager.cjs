#!/usr/bin/env node

/**
 * Version Manager for S3 Deck
 *
 * This script manages version updates across all project files:
 * - package.json
 * - src-tauri/tauri.conf.json
 * - src-tauri/Cargo.toml
 * - CHANGELOG.md
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

function validateVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}

function incrementVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid increment type: ${type}. Use 'major', 'minor', or 'patch'.`);
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

function updatePackageJson(newVersion) {
  try {
    const packagePath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    log(`✅ Updated package.json to version ${newVersion}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error updating package.json: ${error.message}`, 'red');
    return false;
  }
}

function updateTauriConfig(newVersion) {
  try {
    const tauriPath = path.join('src-tauri', 'tauri.conf.json');
    const tauriConfig = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
    tauriConfig.version = newVersion;

    fs.writeFileSync(tauriPath, JSON.stringify(tauriConfig, null, 2) + '\n');
    log(`✅ Updated tauri.conf.json to version ${newVersion}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error updating tauri.conf.json: ${error.message}`, 'red');
    return false;
  }
}

function updateCargoToml(newVersion) {
  try {
    const cargoPath = path.join('src-tauri', 'Cargo.toml');
    let cargoContent = fs.readFileSync(cargoPath, 'utf8');

    // Replace version in [package] section
    cargoContent = cargoContent.replace(
      /^(\[package\][\s\S]*?^version\s*=\s*)"[^"]+"(\s*$)/m,
      `$1"${newVersion}"$2`
    );

    fs.writeFileSync(cargoPath, cargoContent);
    log(`✅ Updated Cargo.toml to version ${newVersion}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error updating Cargo.toml: ${error.message}`, 'red');
    return false;
  }
}

function updateChangelog(newVersion) {
  try {
    const changelogPath = 'CHANGELOG.md';
    let changelogContent = fs.readFileSync(changelogPath, 'utf8');

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if there's an [Unreleased] section
    if (changelogContent.includes('## [Unreleased]')) {
      // Replace [Unreleased] with the new version
      changelogContent = changelogContent.replace(
        /^## \[Unreleased\]/m,
        `## [${newVersion}] - ${today}`
      );

      // Add a new [Unreleased] section at the top
      const headerEnd = changelogContent.indexOf('\n## [');
      if (headerEnd > 0) {
        const beforeVersions = changelogContent.substring(0, headerEnd);
        const afterVersions = changelogContent.substring(headerEnd);

        changelogContent = beforeVersions + '\n## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n' + afterVersions;
      }
    } else {
      // No [Unreleased] section, add the new version after the header
      const headerEnd = changelogContent.indexOf('\n## [');
      if (headerEnd > 0) {
        const beforeVersions = changelogContent.substring(0, headerEnd);
        const afterVersions = changelogContent.substring(headerEnd);

        changelogContent = beforeVersions + `\n## [${newVersion}] - ${today}\n\n### Added\n\n### Changed\n\n### Fixed\n` + afterVersions;
      } else {
        // No existing versions, add after the header
        const lines = changelogContent.split('\n');
        const insertIndex = lines.findIndex(line => line.trim() === '') + 1;
        lines.splice(insertIndex, 0, '', `## [${newVersion}] - ${today}`, '', '### Added', '', '### Changed', '', '### Fixed', '');
        changelogContent = lines.join('\n');
      }
    }

    fs.writeFileSync(changelogPath, changelogContent);
    log(`✅ Updated CHANGELOG.md to version ${newVersion}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error updating CHANGELOG.md: ${error.message}`, 'red');
    return false;
  }
}

function setVersion(newVersion) {
  log(`🔧 Setting version to ${newVersion}...`, 'blue');

  if (!validateVersion(newVersion)) {
    log(`❌ Invalid version format: ${newVersion}`, 'red');
    log('Version must follow semantic versioning (e.g., 1.2.3)', 'yellow');
    return false;
  }

  const updates = [
    updatePackageJson(newVersion),
    updateTauriConfig(newVersion),
    updateCargoToml(newVersion),
    updateChangelog(newVersion)
  ];

  const allSuccessful = updates.every(Boolean);

  if (allSuccessful) {
    log(`🎉 Successfully updated all files to version ${newVersion}`, 'green');
    log('', 'reset');
    log('Next steps:', 'blue');
    log('1. Review the changes with: git diff', 'yellow');
    log('2. Commit the changes: git add . && git commit -m "Bump version to v' + newVersion + '"', 'yellow');
    log('3. Push to main branch to trigger release: git push origin main', 'yellow');
  } else {
    log(`❌ Some files failed to update. Please check the errors above.`, 'red');
  }

  return allSuccessful;
}

function bumpVersion(type) {
  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion, type);

  log(`📈 Bumping version from ${currentVersion} to ${newVersion} (${type})`, 'blue');

  return setVersion(newVersion);
}

function showCurrentVersion() {
  const version = getCurrentVersion();
  log(`Current version: ${version}`, 'blue');

  // Also run consistency check
  try {
    execSync('npm run check-version', { stdio: 'inherit' });
  } catch (error) {
    log('⚠️  Version consistency check failed', 'yellow');
  }
}

function showHelp() {
  log('Version Manager for S3 Deck', 'bold');
  log('', 'reset');
  log('Usage:', 'blue');
  log('  node version-manager.cjs <command> [args]', 'reset');
  log('', 'reset');
  log('Commands:', 'blue');
  log('  current                    - Show current version and check consistency', 'reset');
  log('  set <version>              - Set specific version (e.g., 1.2.3)', 'reset');
  log('  bump patch                 - Increment patch version (1.2.3 -> 1.2.4)', 'reset');
  log('  bump minor                 - Increment minor version (1.2.3 -> 1.3.0)', 'reset');
  log('  bump major                 - Increment major version (1.2.3 -> 2.0.0)', 'reset');
  log('  patch                      - Alias for "bump patch"', 'reset');
  log('  minor                      - Alias for "bump minor"', 'reset');
  log('  major                      - Alias for "bump major"', 'reset');
  log('', 'reset');
  log('Examples:', 'yellow');
  log('  node version-manager.cjs current', 'reset');
  log('  node version-manager.cjs set 1.2.3', 'reset');
  log('  node version-manager.cjs bump patch', 'reset');
  log('  node version-manager.cjs minor', 'reset');
  log('', 'reset');
  log('Files updated:', 'blue');
  log('  • package.json', 'reset');
  log('  • src-tauri/tauri.conf.json', 'reset');
  log('  • src-tauri/Cargo.toml', 'reset');
  log('  • CHANGELOG.md', 'reset');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  switch (command) {
    case 'current':
      showCurrentVersion();
      break;

    case 'set':
      const version = args[1];
      if (!version) {
        log('❌ Version parameter required for set command', 'red');
        log('Usage: node version-manager.cjs set <version>', 'yellow');
        process.exit(1);
      }
      const success = setVersion(version);
      process.exit(success ? 0 : 1);
      break;

    case 'bump':
      const bumpType = args[1];
      if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
        log('❌ Invalid bump type. Use: major, minor, or patch', 'red');
        process.exit(1);
      }
      const bumpSuccess = bumpVersion(bumpType);
      process.exit(bumpSuccess ? 0 : 1);
      break;

    case 'patch':
    case 'minor':
    case 'major':
      const aliasSuccess = bumpVersion(command);
      process.exit(aliasSuccess ? 0 : 1);
      break;

    default:
      log(`❌ Unknown command: ${command}`, 'red');
      log('Use "node version-manager.cjs help" for usage information', 'yellow');
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  setVersion,
  bumpVersion,
  validateVersion,
  incrementVersion,
  updatePackageJson,
  updateTauriConfig,
  updateCargoToml,
  updateChangelog
};
