#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function extractLatestReleaseNotes() {
  try {
    // Read CHANGELOG.md
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    
    // Split into lines
    const lines = changelog.split('\n');
    
    // Find the first version header (## [x.x.x])
    let startIndex = -1;
    let endIndex = -1;
    let inReleaseSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for version headers like ## [0.3.0] - 2025-08-29
      if (line.match(/^## \[\d+\.\d+\.\d+\]/)) {
        if (!inReleaseSection) {
          // First version header found
          startIndex = i + 1;
          inReleaseSection = true;
        } else {
          // Second version header found - end of current release
          endIndex = i - 1;
          break;
        }
      }
    }
    
    // If we didn't find a second version header, take until end
    if (startIndex !== -1 && endIndex === -1) {
      endIndex = lines.length - 1;
    }
    
    if (startIndex === -1) {
      console.error('No release notes found in CHANGELOG.md');
      process.exit(1);
    }
    
    // Extract the release notes
    const releaseNotes = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const line = lines[i].trim();
      // Skip empty lines at the beginning and end
      if (line || (releaseNotes.length > 0 && i < endIndex)) {
        releaseNotes.push(lines[i]);
      }
    }
    
    // Remove trailing empty lines
    while (releaseNotes.length > 0 && !releaseNotes[releaseNotes.length - 1].trim()) {
      releaseNotes.pop();
    }
    
    if (releaseNotes.length === 0) {
      console.error('No content found for latest release');
      process.exit(1);
    }
    
    // Output the release notes
    console.log(releaseNotes.join('\n'));
    
  } catch (error) {
    console.error('Error reading CHANGELOG.md:', error.message);
    process.exit(1);
  }
}

// Run the extraction
extractLatestReleaseNotes();