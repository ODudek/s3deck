#!/usr/bin/env node

/**
 * Version Consistency Checker
 *
 * This script checks that versions are consistent across:
 * - package.json
 * - src-tauri/tauri.conf.json
 * - CHANGELOG.md
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

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error reading ${filePath}: ${error.message}`, 'red');
    process.exit(1);
  }
}

function readChangelogVersion() {
  try {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const content = fs.readFileSync(changelogPath, 'utf8');

    // Look for version patterns like ## [1.2.3] - YYYY-MM-DD
    const versionMatch = content.match(/^## \[([0-9]+\.[0-9]+\.[0-9]+)\]/m);

    if (versionMatch) {
      return versionMatch[1];
    }

    // Also check for unreleased sections
    const unreleasedMatch = content.match(/^## \[Unreleased\]/m);
    if (unreleasedMatch) {
      log('⚠️  Found [Unreleased] section in CHANGELOG.md', 'yellow');
      log('   Make sure to update it with a version number before release', 'yellow');
      return null;
    }

    return null;
  } catch (error) {
    log(`❌ Error reading CHANGELOG.md: ${error.message}`, 'red');
    return null;
  }
}

function readCargoToml() {
  try {
    const cargoPath = path.join(process.cwd(), 'src-tauri', 'Cargo.toml');
    const content = fs.readFileSync(cargoPath, 'utf8');

    // Look for version in [package] section
    const versionMatch = content.match(/^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m);

    if (versionMatch) {
      return versionMatch[1];
    }

    return null;
  } catch (error) {
    log(`❌ Error reading Cargo.toml: ${error.message}`, 'red');
    return null;
  }
}

function checkVersionConsistency(silent = false) {
  if (!silent) {
    log('🔍 Checking version consistency...', 'blue');
    log('', 'reset');
  }

  try {
    // Read versions from different files
    const packageJson = readJsonFile(path.join(process.cwd(), 'package.json'));
    const tauriConfig = readJsonFile(path.join(process.cwd(), 'src-tauri', 'tauri.conf.json'));
    const changelogVersion = readChangelogVersion();
    const cargoVersion = readCargoToml();

    const packageVersion = packageJson.version;
    const tauriVersion = tauriConfig.version;

    if (!silent) {
      // Display found versions
      log(`📦 package.json version:      ${packageVersion}`, 'blue');
      log(`🦀 tauri.conf.json version:   ${tauriVersion}`, 'blue');
      log(`📦 Cargo.toml version:        ${cargoVersion || 'not found'}`, 'blue');
      log(`📝 CHANGELOG.md version:      ${changelogVersion || 'not found'}`, 'blue');
      log('', 'reset');
    }

    // Check consistency
    let hasErrors = false;
    const errors = [];

    // Check package.json vs tauri.conf.json
    if (packageVersion !== tauriVersion) {
      const error = `Version mismatch between package.json (${packageVersion}) and tauri.conf.json (${tauriVersion})`;
      errors.push(error);
      if (!silent) log(`❌ ${error}`, 'red');
      hasErrors = true;
    } else {
      if (!silent) log(`✅ package.json and tauri.conf.json versions match: ${packageVersion}`, 'green');
    }

    // Check package.json vs Cargo.toml
    if (cargoVersion && packageVersion !== cargoVersion) {
      const error = `Version mismatch between package.json (${packageVersion}) and Cargo.toml (${cargoVersion})`;
      errors.push(error);
      if (!silent) log(`❌ ${error}`, 'red');
      hasErrors = true;
    } else if (cargoVersion) {
      if (!silent) log(`✅ package.json and Cargo.toml versions match: ${packageVersion}`, 'green');
    }

    // Check changelog version if found
    if (changelogVersion) {
      if (packageVersion !== changelogVersion) {
        const error = `Version mismatch between package.json (${packageVersion}) and CHANGELOG.md (${changelogVersion})`;
        errors.push(error);
        if (!silent) log(`❌ ${error}`, 'red');
        hasErrors = true;
      } else {
        if (!silent) log(`✅ package.json and CHANGELOG.md versions match: ${packageVersion}`, 'green');
      }
    } else {
      if (!silent) {
        log(`⚠️  Could not extract version from CHANGELOG.md`, 'yellow');
        log(`   Make sure the latest entry follows the format: ## [X.Y.Z] - YYYY-MM-DD`, 'yellow');
      }
    }

    if (!silent) log('', 'reset');

    if (hasErrors) {
      if (!silent) {
        log('❌ Version consistency check failed!', 'red');
        log('', 'reset');
        log('To fix version mismatches:', 'yellow');
        log('1. Update package.json version:', 'yellow');
        log('   npm version patch|minor|major', 'yellow');
        log('2. Update src-tauri/tauri.conf.json version manually', 'yellow');
        log('3. Update src-tauri/Cargo.toml version manually', 'yellow');
        log('4. Update CHANGELOG.md with the new version', 'yellow');
      }
      return {
        success: false,
        version: packageVersion,
        errors,
        details: {
          packageVersion,
          tauriVersion,
          cargoVersion,
          changelogVersion
        }
      };
    } else {
      if (!silent) {
        log('✅ All versions are consistent!', 'green');
        log(`Current version: ${packageVersion}`, 'bold');
      }
      return {
        success: true,
        version: packageVersion,
        details: {
          packageVersion,
          tauriVersion,
          cargoVersion,
          changelogVersion
        }
      };
    }
  } catch (error) {
    if (!silent) {
      log(`❌ Error checking version consistency: ${error.message}`, 'red');
    }
    return {
      success: false,
      error: error.message
    };
  }
}

function main() {
  const result = checkVersionConsistency(false);
  process.exit(result.success ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { readJsonFile, readChangelogVersion, readCargoToml, checkVersionConsistency };
