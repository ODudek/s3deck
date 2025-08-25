#!/usr/bin/env node

/**
 * CI Test Runner for S3 Deck
 *
 * This script handles running tests and generating summaries for CI/CD workflows.
 * Supports frontend tests, backend tests, and build tests with proper reporting.
 */

const {
  log,
  getStatusEmoji,
  addToGitHubSummary,
  setGitHubEnv,
  generateSectionHeader,
  execCommand,
  formatDuration,
  createJobSummary
} = require('./ci-utils.cjs');

function runFrontendTests() {
  const startTime = Date.now();
  log('🧪 Running frontend tests...', 'blue');

  addToGitHubSummary(generateSectionHeader('Frontend Tests', '🧪'));
  addToGitHubSummary('');

  try {
    // First capture output to check for "No tests found"
    const result = execCommand('npm test', { silent: true });
    const duration = formatDuration(startTime);

    if (result.success) {
      // Check if output indicates no tests found
      if (result.output && result.output.includes('No tests found')) {
        log('⚠️ No frontend tests found', 'yellow');
        addToGitHubSummary('⚠️ **No frontend tests found**');
        addToGitHubSummary('Consider adding tests for better code quality.');
        addToGitHubSummary(`⏱️ Duration: ${duration}`);
        setGitHubEnv('FRONTEND_TEST_STATUS', '⚠️ No tests');
        return { success: true, duration, noTests: true };
      }

      log('✅ Frontend tests passed', 'green');
      addToGitHubSummary('✅ **Frontend tests passed**');
      addToGitHubSummary(`⏱️ Duration: ${duration}`);
      setGitHubEnv('FRONTEND_TEST_STATUS', '✅ Passed');
      return { success: true, duration };
    } else {
      throw new Error('Frontend tests failed');
    }
  } catch (error) {
    // Check if it's just "no tests found" in error output
    if (error.message.includes('no test') || error.message.includes('No tests found')) {
      log('⚠️ No frontend tests found', 'yellow');
      addToGitHubSummary('⚠️ **No frontend tests found**');
      addToGitHubSummary('Consider adding tests for better code quality.');
      setGitHubEnv('FRONTEND_TEST_STATUS', '⚠️ No tests');
      return { success: true, duration: formatDuration(startTime), noTests: true };
    }

    const duration = formatDuration(startTime);
    log(`❌ Frontend tests failed: ${error.message}`, 'red');
    addToGitHubSummary('❌ **Frontend tests failed**');
    addToGitHubSummary(`⏱️ Duration: ${duration}`);
    addToGitHubSummary(`**Error:** ${error.message}`);
    setGitHubEnv('FRONTEND_TEST_STATUS', '❌ Failed');
    return { success: false, duration, error: error.message };
  }

}

function runBackendTests() {
  const startTime = Date.now();
  log('🦀 Running Rust backend tests...', 'blue');

  addToGitHubSummary(generateSectionHeader('Rust Backend Tests', '🦀'));
  addToGitHubSummary('');

  try {
    const result = execCommand('cargo test', {
      cwd: 'src-tauri',
      env: { ...process.env, RUST_BACKTRACE: '1' },
      silent: true
    });
    const duration = formatDuration(startTime);

    if (result.success) {
      log('✅ Rust backend tests passed', 'green');
      addToGitHubSummary('✅ **Rust backend tests passed**');
      addToGitHubSummary(`⏱️ Duration: ${duration}`);
      setGitHubEnv('BACKEND_TEST_STATUS', '✅ Passed');
      return { success: true, duration };
    } else {
      throw new Error('Backend tests failed');
    }
  } catch (error) {
    const duration = formatDuration(startTime);
    log(`❌ Rust backend tests failed: ${error.message}`, 'red');
    addToGitHubSummary('❌ **Rust backend tests failed**');
    addToGitHubSummary(`⏱️ Duration: ${duration}`);
    addToGitHubSummary(`**Error:** ${error.message}`);
    setGitHubEnv('BACKEND_TEST_STATUS', '❌ Failed');
    return { success: false, duration, error: error.message };
  }
}

function runBuildTest(platform = 'current') {
  const startTime = Date.now();
  log(`🏗️ Running build test for ${platform}...`, 'blue');

  addToGitHubSummary(generateSectionHeader(`Build Test - ${platform}`, '🏗️'));
  addToGitHubSummary('');

  try {
    // Only build frontend for faster CI tests
    // Full Tauri build will be done in release workflow
    log('📦 Building frontend...', 'blue');
    const frontendResult = execCommand('npm run build', { silent: true });
    const duration = formatDuration(startTime);

    if (frontendResult.success) {
      log(`✅ Frontend build successful on ${platform}`, 'green');
      addToGitHubSummary(`✅ **Frontend build successful on ${platform}**`);
      addToGitHubSummary(`⏱️ Duration: ${duration}`);
      addToGitHubSummary('ℹ️ Full Tauri build will be performed during release');
      setGitHubEnv('BUILD_TEST_STATUS', '✅ Passed');
      return { success: true, duration, platform };
    } else {
      throw new Error('Frontend build failed');
    }
  } catch (error) {
    const duration = formatDuration(startTime);
    log(`❌ Build failed on ${platform}: ${error.message}`, 'red');
    addToGitHubSummary(`❌ **Build failed on ${platform}**`);
    addToGitHubSummary(`⏱️ Duration: ${duration}`);
    addToGitHubSummary(`**Error:** ${error.message}`);
    setGitHubEnv('BUILD_TEST_STATUS', '❌ Failed');
    return { success: false, duration, platform, error: error.message };
  }
}

function runAllTests() {
  const startTime = Date.now();
  log('🚀 Running all tests...', 'blue');

  const results = {
    frontend: runFrontendTests(),
    backend: runBackendTests(),
    build: runBuildTest()
  };

  const totalDuration = formatDuration(startTime);
  const allPassed = Object.values(results).every(result => result.success);

  // Generate overall summary
  addToGitHubSummary('');
  addToGitHubSummary(generateSectionHeader('Test Summary', '📊'));
  addToGitHubSummary('');

  const testSummary = [
    ['Frontend Tests', getStatusEmoji(results.frontend.success ? 'success' : 'failure'), results.frontend.duration],
    ['Backend Tests', getStatusEmoji(results.backend.success ? 'success' : 'failure'), results.backend.duration],
    ['Build Tests', getStatusEmoji(results.build.success ? 'success' : 'failure'), results.build.duration]
  ];

  addToGitHubSummary('| Test Suite | Status | Duration |');
  addToGitHubSummary('|------------|--------|----------|');
  testSummary.forEach(([name, status, duration]) => {
    addToGitHubSummary(`| ${name} | ${status} | ${duration} |`);
  });

  addToGitHubSummary('');
  addToGitHubSummary(`**Total Duration:** ${totalDuration}`);
  addToGitHubSummary(`**Overall Status:** ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);

  return {
    results,
    allPassed,
    totalDuration,
    summary: {
      frontend: results.frontend.success,
      backend: results.backend.success,
      build: results.build.success
    }
  };
}

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    allPassed: results.allPassed,
    totalDuration: results.totalDuration,
    tests: {
      frontend: createJobSummary('Frontend Tests', results.results.frontend.success ? 'success' : 'failure', {
        duration: results.results.frontend.duration,
        noTests: results.results.frontend.noTests || false,
        error: results.results.frontend.error || null
      }),
      backend: createJobSummary('Backend Tests', results.results.backend.success ? 'success' : 'failure', {
        duration: results.results.backend.duration,
        error: results.results.backend.error || null
      }),
      build: createJobSummary('Build Tests', results.results.build.success ? 'success' : 'failure', {
        duration: results.results.build.duration,
        platform: results.results.build.platform,
        error: results.results.build.error || null
      })
    }
  };

  return report;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'help' || command === '--help' || command === '-h' || !command) {
    log('CI Test Runner for S3 Deck', 'bold');
    log('', 'reset');
    log('Usage:', 'blue');
    log('  node ci-test-runner.cjs <command> [options]', 'reset');
    log('', 'reset');
    log('Commands:', 'blue');
    log('  frontend            - Run frontend tests only', 'reset');
    log('  backend             - Run backend tests only', 'reset');
    log('  build [platform]    - Run build test (default: current)', 'reset');
    log('  all                 - Run all tests (frontend, backend, build)', 'reset');
    log('  help                - Show this help message', 'reset');
    log('', 'reset');
    log('Examples:', 'yellow');
    log('  node ci-test-runner.cjs frontend', 'reset');
    log('  node ci-test-runner.cjs backend', 'reset');
    log('  node ci-test-runner.cjs build ubuntu-latest', 'reset');
    log('  node ci-test-runner.cjs all', 'reset');
    return;
  }

  try {
    let results;

    switch (command) {
      case 'frontend':
        results = runFrontendTests();
        process.exit(results.success ? 0 : 1);
        break;

      case 'backend':
        results = runBackendTests();
        process.exit(results.success ? 0 : 1);
        break;

      case 'build':
        const platform = args[1] || 'current';
        results = runBuildTest(platform);
        process.exit(results.success ? 0 : 1);
        break;

      case 'all':
        results = runAllTests();
        const report = generateTestReport(results);

        // Output JSON report for consumption by other tools
        if (process.env.CI_OUTPUT_REPORT) {
          console.log(JSON.stringify(report, null, 2));
        }

        process.exit(results.allPassed ? 0 : 1);
        break;

      default:
        log(`❌ Unknown command: ${command}`, 'red');
        log('Use "node ci-test-runner.cjs help" for usage information', 'yellow');
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
  runFrontendTests,
  runBackendTests,
  runBuildTest,
  runAllTests,
  generateTestReport
};
