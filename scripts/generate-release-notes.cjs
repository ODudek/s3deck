#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Parses CHANGELOG.md and generates release notes for a specific version
 */
class ChangelogParser {
  constructor(changelogPath) {
    this.changelogPath = changelogPath;
    this.content = '';
  }

  readChangelog() {
    try {
      this.content = fs.readFileSync(this.changelogPath, 'utf8');
      return true;
    } catch (error) {
      console.error('Error reading changelog:', error.message);
      return false;
    }
  }

  /**
   * Extract version section from changelog
   * @param {string} version - Version to extract (e.g., "0.2.0")
   * @returns {object} - Parsed version data
   */
  extractVersionData(version) {
    const lines = this.content.split('\n');
    const versionPattern = new RegExp(`^## \\[${version}\\]`);

    let startIndex = -1;
    let endIndex = -1;

    // Find start of version section
    for (let i = 0; i < lines.length; i++) {
      if (versionPattern.test(lines[i])) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      return null;
    }

    // Find end of version section (next version or end of file)
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith('## [') && !lines[i].includes('Unreleased')) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      endIndex = lines.length;
    }

    const versionLines = lines.slice(startIndex, endIndex);
    return this.parseVersionSection(versionLines, version);
  }

  /**
   * Parse a version section into structured data
   * @param {string[]} lines - Lines of the version section
   * @param {string} version - Version number
   * @returns {object} - Structured version data
   */
  parseVersionSection(lines, version) {
    const data = {
      version,
      date: null,
      sections: {}
    };

    // Extract date from header
    const headerMatch = lines[0].match(/## \[([^\]]+)\] - (.+)/);
    if (headerMatch) {
      data.date = headerMatch[2];
    }

    let currentSection = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('### ')) {
        currentSection = line.replace('### ', '');
        data.sections[currentSection] = [];
      } else if (line.startsWith('- ') && currentSection) {
        data.sections[currentSection].push(line.replace('- ', ''));
      }
    }

    return data;
  }

  /**
   * Get the latest version from package.json
   * @returns {string} - Version string
   */
  getPackageVersion() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageData.version;
    } catch (error) {
      console.error('Error reading package.json:', error.message);
      return null;
    }
  }

  /**
   * Generate formatted release notes
   * @param {object} versionData - Parsed version data
   * @returns {string} - Formatted release notes
   */
  generateReleaseNotes(versionData) {
    if (!versionData) {
      return 'No changelog entry found for this version.';
    }

    let notes = `## 🚀 S3 Deck v${versionData.version}`;

    if (versionData.date) {
      notes += ` - ${versionData.date}`;
    }

    notes += '\n\n';

    // Section order and emojis
    const sectionConfig = {
      'Added': '✨',
      'Changed': '🔄',
      'Fixed': '🐛',
      'Removed': '🗑️',
      'Deprecated': '⚠️',
      'Security': '🔒'
    };

    // Add sections in order
    Object.entries(sectionConfig).forEach(([sectionName, emoji]) => {
      if (versionData.sections[sectionName] && versionData.sections[sectionName].length > 0) {
        notes += `### ${emoji} ${sectionName}\n\n`;
        versionData.sections[sectionName].forEach(item => {
          notes += `- ${item}\n`;
        });
        notes += '\n';
      }
    });

    // Add download instructions
    notes += this.generateDownloadInstructions(versionData);

    return notes.trim();
  }

  /**
   * Generate download instructions for release
   * @param {object} versionData - Version data containing version number
   * @returns {string} - Download instructions
   */
  generateDownloadInstructions(versionData) {
    return `## 🚀 Easy Installation

**One-line installer for all platforms (Recommended):**

\`\`\`bash
# Install latest version
curl -fsSL https://raw.githubusercontent.com/ODudek/s3deck/main/install.sh | bash

# Install this specific version
curl -fsSL https://raw.githubusercontent.com/ODudek/s3deck/main/install.sh | bash -s -- -v v${versionData?.version || 'X.Y.Z'}
\`\`\`

**This installer will:**
- ✅ Auto-detect your OS and architecture
- ✅ Download the correct binary from this release
- ✅ Fix macOS security issues automatically
- ✅ Install to the right location for your platform
- ✅ No prerequisites required - just works!

## 📦 Manual Download

Alternatively, choose the file for your platform:

### 🪟 Windows
- \`*.msi\` - Windows Installer

### 🍎 macOS  
- \`*_aarch64.dmg\` - Apple Silicon (M1/M2/M3/M4)
- \`*_x64.dmg\` - Intel Macs

### 🐧 Linux
- \`*.AppImage\` - Universal Linux binary
- \`*.deb\` - Debian/Ubuntu package

> **macOS Note**: If you see "app is damaged", it's normal for unsigned apps. Use the installer above or run: \`xattr -cr S3Deck.app\`

## 💡 Need Help?

- 📖 [Documentation](https://github.com/ODudek/s3deck/blob/main/README.md)
- 🐛 [Report Issues](https://github.com/ODudek/s3deck/issues)
- 💬 [Discussions](https://github.com/ODudek/s3deck/discussions)

---

**Full Changelog**: https://github.com/ODudek/s3deck/blob/main/CHANGELOG.md
`;
  }

  /**
   * Generate release notes for the current package version
   * @returns {string} - Release notes
   */
  generateCurrentVersionNotes() {
    const version = this.getPackageVersion();
    if (!version) {
      return 'Unable to determine version from package.json';
    }

    if (!this.readChangelog()) {
      return 'Unable to read changelog file';
    }

    const versionData = this.extractVersionData(version);
    return this.generateReleaseNotes(versionData);
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  const parser = new ChangelogParser(changelogPath);

  if (args.length === 0) {
    // Generate notes for current version
    const notes = parser.generateCurrentVersionNotes();
    console.log(notes);
  } else if (args[0] === '--version' && args[1]) {
    // Generate notes for specific version
    if (!parser.readChangelog()) {
      process.exit(1);
    }

    const versionData = parser.extractVersionData(args[1]);
    const notes = parser.generateReleaseNotes(versionData);
    console.log(notes);
  } else {
    console.log('Usage:');
    console.log('  node generate-release-notes.js              # Current version');
    console.log('  node generate-release-notes.js --version X.Y.Z  # Specific version');
    process.exit(1);
  }
}

// Export for use as module
module.exports = ChangelogParser;

// Run if called directly
if (require.main === module) {
  main();
}
