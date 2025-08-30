#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Validation script to ensure CHANGELOG.md and release notes are synchronized
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Get all versions from CHANGELOG.md
 */
function getChangelogVersions() {
  const changelogPath = join(PROJECT_ROOT, 'CHANGELOG.md');
  const content = readFileSync(changelogPath, 'utf8');
  
  // Match version entries like: ## [v1.13.1] - 2025-06-12
  const versionPattern = /## \[v([\d.]+)\] - (\d{4}-\d{2}-\d{2})/g;
  const versions = [];
  let match;
  
  while ((match = versionPattern.exec(content)) !== null) {
    versions.push({
      version: match[1],
      date: match[2],
      source: 'CHANGELOG.md'
    });
  }
  
  return versions;
}

/**
 * Get all release notes files recursively
 */
function getReleaseNotesFiles(dir = join(PROJECT_ROOT, 'docs/releases')) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.startsWith('RELEASE_NOTES_v') && item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

/**
 * Extract version and date from release notes file
 */
function extractReleaseInfo(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const fileName = filePath.split('/').pop();
  
  // Extract version from filename: RELEASE_NOTES_v1.13.1.md
  const versionMatch = fileName.match(/RELEASE_NOTES_v([\d.]+)\.md/);
  if (!versionMatch) return null;
  
  const version = versionMatch[1];
  
  // Extract date from content: **Released**: 12th June 2025
  const dateMatch = content.match(/\*\*Released\*\*:\s*(\d+)(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/);
  
  if (dateMatch) {
    // Convert to ISO date format
    const months = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const day = dateMatch[1].padStart(2, '0');
    const month = months[dateMatch[2]] || '01';
    const year = dateMatch[3];
    
    return {
      version,
      date: `${year}-${month}-${day}`,
      file: filePath.replace(PROJECT_ROOT, '.')
    };
  }
  
  return {
    version,
    date: null,
    file: filePath.replace(PROJECT_ROOT, '.')
  };
}

/**
 * Main validation function
 */
function validateSync() {
  info('Validating synchronization between CHANGELOG.md and release notes...\n');
  
  // Get all versions from CHANGELOG
  const changelogVersions = getChangelogVersions();
  info(`Found ${changelogVersions.length} versions in CHANGELOG.md`);
  
  // Get all release notes files
  const releaseFiles = getReleaseNotesFiles();
  info(`Found ${releaseFiles.length} release notes files\n`);
  
  // Extract version info from release notes
  const releaseVersions = [];
  for (const file of releaseFiles) {
    const info = extractReleaseInfo(file);
    if (info) {
      releaseVersions.push(info);
    }
  }
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check for missing release notes
  log('Checking for missing release notes...', 'cyan');
  for (const changelogVersion of changelogVersions) {
    const releaseNote = releaseVersions.find(r => r.version === changelogVersion.version);
    
    if (!releaseNote) {
      error(`Missing release notes for v${changelogVersion.version} (in CHANGELOG.md)`);
      hasErrors = true;
    } else {
      success(`v${changelogVersion.version} has both CHANGELOG and release notes`);
      
      // Check date consistency
      if (releaseNote.date && releaseNote.date !== changelogVersion.date) {
        warn(`  Date mismatch for v${changelogVersion.version}:`);
        warn(`    CHANGELOG.md: ${changelogVersion.date}`);
        warn(`    Release notes: ${releaseNote.date}`);
        hasWarnings = true;
      }
    }
  }
  
  // Check for orphaned release notes
  log('\nChecking for orphaned release notes...', 'cyan');
  for (const releaseVersion of releaseVersions) {
    const changelogEntry = changelogVersions.find(c => c.version === releaseVersion.version);
    
    if (!changelogEntry) {
      error(`Orphaned release notes: ${releaseVersion.file} (not in CHANGELOG.md)`);
      hasErrors = true;
    }
  }
  
  // Check docs/releases/README.md is up to date
  log('\nChecking docs/releases/README.md...', 'cyan');
  const releasesReadmePath = join(PROJECT_ROOT, 'docs/releases/README.md');
  const releasesReadme = readFileSync(releasesReadmePath, 'utf8');
  
  // Get latest version from CHANGELOG
  const latestVersion = changelogVersions[0];
  if (latestVersion) {
    const currentStablePattern = /### Current Stable: v([\d.]+)/;
    const match = releasesReadme.match(currentStablePattern);
    
    if (match) {
      if (match[1] !== latestVersion.version) {
        error(`docs/releases/README.md shows v${match[1]} as current, but CHANGELOG shows v${latestVersion.version}`);
        hasErrors = true;
      } else {
        success(`docs/releases/README.md correctly shows v${latestVersion.version} as current stable`);
      }
    } else {
      warn('Could not find "Current Stable" version in docs/releases/README.md');
      hasWarnings = true;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (!hasErrors && !hasWarnings) {
    success('\n🎉 All release documentation is synchronized!\n');
    return 0;
  } else if (hasErrors) {
    error(`\n❌ Validation failed with errors!\n`);
    if (hasWarnings) {
      warn('Also found warnings that should be addressed.\n');
    }
    return 1;
  } else {
    warn('\n⚠️  Validation passed with warnings.\n');
    return 0;
  }
}

// Run validation
const exitCode = validateSync();
process.exit(exitCode);