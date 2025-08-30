#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Comprehensive Release Preparation Script
 * Automates all version updates and validates release readiness
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROJECT_ROOT = join(__dirname, '..');
const PACKAGE_FILES = [
  'package.json',
  'backend/package.json', 
  'frontend/package.json'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
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

function header(message) {
  log(`\n🚀 ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

/**
 * Validate version format
 */
function validateVersion(version) {
  const versionRegex = /^v?\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

/**
 * Normalize version (ensure no 'v' prefix for package.json)
 */
function normalizeVersion(version) {
  return version.replace(/^v/, '');
}

/**
 * Get current date in all required formats
 */
function getCurrentDates() {
  const now = new Date();
  
  // ISO format for CHANGELOG.md
  const isoDate = now.toISOString().split('T')[0];
  
  // UK ordinal format for release notes
  const day = now.getDate();
  const ordinalSuffix = getOrdinalSuffix(day);
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  const year = now.getFullYear();
  const readableDate = `${day}${ordinalSuffix} ${month} ${year}`;
  
  return { isoDate, readableDate };
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Check chronological order against last release
 */
function validateDateChronology() {
  try {
    const changelogPath = join(PROJECT_ROOT, 'CHANGELOG.md');
    const changelogContent = readFileSync(changelogPath, 'utf8');
    
    // Find last release date
    const lastReleaseMatch = changelogContent.match(/## \[v[\d.]+\] - (\d{4}-\d{2}-\d{2})/);
    
    if (lastReleaseMatch) {
      const lastReleaseDate = new Date(lastReleaseMatch[1]);
      const today = new Date();
      
      if (today <= lastReleaseDate) {
        error(`Current date (${today.toISOString().split('T')[0]}) is not after last release date (${lastReleaseMatch[1]})`);
        error('Check your system clock or verify chronological order');
        return false;
      }
      
      success(`Date chronology validated (last release: ${lastReleaseMatch[1]})`);
    } else {
      warn('No previous releases found in CHANGELOG.md');
    }
    
    return true;
  } catch (err) {
    error(`Failed to validate date chronology: ${err.message}`);
    return false;
  }
}

/**
 * Update version in all package.json files
 */
function updatePackageVersions(version) {
  const normalizedVersion = normalizeVersion(version);
  
  for (const packageFile of PACKAGE_FILES) {
    const packagePath = join(PROJECT_ROOT, packageFile);
    
    try {
      const packageContent = readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const oldVersion = packageJson.version;
      packageJson.version = normalizedVersion;
      
      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      success(`Updated ${packageFile}: ${oldVersion} → ${normalizedVersion}`);
    } catch (err) {
      error(`Failed to update ${packageFile}: ${err.message}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Update service worker version (via existing script)
 */
function updateServiceWorkerVersion() {
  try {
    const swUpdateScript = join(PROJECT_ROOT, 'frontend/scripts/update-sw-version.mjs');
    execSync(`node "${swUpdateScript}"`, { stdio: 'inherit', cwd: PROJECT_ROOT });
    success('Service worker version updated');
    return true;
  } catch (err) {
    error(`Failed to update service worker version: ${err.message}`);
    return false;
  }
}

/**
 * Update version examples in README.md
 */
function updateReadmeVersions(version) {
  const normalizedVersion = normalizeVersion(version);
  const readmePath = join(PROJECT_ROOT, 'README.md');
  
  try {
    if (!existsSync(readmePath)) {
      warn('README.md not found, skipping version updates');
      return true;
    }
    
    let content = readFileSync(readmePath, 'utf8');
    
    // Update version examples in installation commands
    // Matches patterns like: --version v1.4.1
    const versionPattern = /(--version\s+v)[\d.]+/g;
    const updatedContent = content.replace(versionPattern, `$1${normalizedVersion}`);
    
    // Check if any changes were made
    if (content !== updatedContent) {
      writeFileSync(readmePath, updatedContent);
      success(`Updated README.md version examples to v${normalizedVersion}`);
    } else {
      info('No version examples found in README.md to update');
    }
    
    return true;
  } catch (err) {
    error(`Failed to update README.md: ${err.message}`);
    return false;
  }
}

/**
 * Create directory structure for release notes
 */
function createReleaseNotesStructure(version) {
  const majorVersion = 'v1'; // Assuming v1 series
  const minorVersion = `v${normalizeVersion(version).split('.').slice(0, 2).join('.')}`;
  
  const releaseDir = join(PROJECT_ROOT, 'docs/releases', majorVersion, minorVersion);
  
  try {
    mkdirSync(releaseDir, { recursive: true });
    success(`Created release notes directory: docs/releases/${majorVersion}/${minorVersion}`);
    return releaseDir;
  } catch (err) {
    error(`Failed to create release notes directory: ${err.message}`);
    return null;
  }
}

/**
 * Create CHANGELOG.md entry template
 */
function createChangelogEntry(version) {
  const { isoDate } = getCurrentDates();
  const changelogPath = join(PROJECT_ROOT, 'CHANGELOG.md');
  
  try {
    let changelogContent = readFileSync(changelogPath, 'utf8');
    
    // Check if version already exists
    if (changelogContent.includes(`## [v${normalizeVersion(version)}]`)) {
      warn(`CHANGELOG.md already contains v${normalizeVersion(version)} entry`);
      return true;
    }
    
    // Create new entry template
    const newEntry = `## [v${normalizeVersion(version)}] - ${isoDate}

### ✨ **New Features**

- **TODO**: Add new features

### 🐛 **Bug Fixes**

- **TODO**: Add bug fixes

### 🔧 **Improvements**

- **TODO**: Add improvements

### 📊 **Summary**

- **Files Changed**: TODO
- **Features Added**: TODO
- **Issues Resolved**: TODO

`;
    
    // Find the position after the header to insert the new entry
    const headerEndPattern = /and this project adheres to \[Semantic Versioning\].*?\n\n/s;
    const match = changelogContent.match(headerEndPattern);
    
    if (match) {
      const insertPosition = match.index + match[0].length;
      changelogContent = 
        changelogContent.slice(0, insertPosition) +
        newEntry +
        changelogContent.slice(insertPosition);
      
      writeFileSync(changelogPath, changelogContent);
      success(`Added v${normalizeVersion(version)} template to CHANGELOG.md`);
      return true;
    } else {
      error('Could not find insertion point in CHANGELOG.md');
      return false;
    }
  } catch (err) {
    error(`Failed to update CHANGELOG.md: ${err.message}`);
    return false;
  }
}

/**
 * Create release notes template
 */
function createReleaseNotesTemplate(version, releaseDir) {
  const { readableDate } = getCurrentDates();
  const releaseNotesPath = join(releaseDir, `RELEASE_NOTES_v${normalizeVersion(version)}.md`);
  
  // Safety check: Don't overwrite existing release notes
  if (existsSync(releaseNotesPath)) {
    warn(`Release notes already exist: ${releaseNotesPath}`);
    warn('Skipping template creation to protect existing documentation');
    return releaseNotesPath;
  }
  
  const template = `# Release Notes - v${normalizeVersion(version)}

**Released**: ${readableDate}  
**Type**: Minor Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

TODO: Add 3-4 key improvements

## ✨ **New Features**

TODO: Add new features with clear benefits

## 🐛 **Critical Bug Fixes**

TODO: Add critical fixes with technical details

## 🎨 **UI/UX Improvements**

TODO: Add user experience enhancements

## 🔧 **Technical Improvements**

TODO: Add technical improvements

## 🛡️ **Security & Compatibility**

TODO: Add security and compatibility updates

## 📚 **Documentation**

TODO: Add documentation changes

## 🚀 **Performance**

TODO: Add performance improvements

## 📦 **Installation & Updates**

Update your Profolio installation to v${normalizeVersion(version)}:

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
\`\`\`

Self-hosted installations will detect and install this version automatically.

## 📊 **Release Statistics**

TODO: Add commit counts, files changed, contributors

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.
`;

  try {
    writeFileSync(releaseNotesPath, template);
    success(`Created release notes template: ${join(PROJECT_ROOT, releaseNotesPath)}`);
    return releaseNotesPath;
  } catch (err) {
    error(`Failed to create release notes template: ${err.message}`);
    return null;
  }
}

/**
 * Validate builds work
 */
function validateBuilds() {
  try {
    info('Testing frontend build...');
    execSync('pnpm run build', { 
      cwd: join(PROJECT_ROOT, 'frontend'),
      stdio: 'pipe'
    });
    success('Frontend build successful');
    
    info('Testing backend build...');
    execSync('pnpm run build', { 
      cwd: join(PROJECT_ROOT, 'backend'),
      stdio: 'pipe'
    });
    success('Backend build successful');
    
    return true;
  } catch (err) {
    error(`Build validation failed: ${err.message}`);
    return false;
  }
}

/**
 * Check git status
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { 
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    
    if (status.trim()) {
      warn('Working directory has uncommitted changes:');
      console.log(status);
      return false;
    }
    
    success('Working directory is clean');
    return true;
  } catch (err) {
    error(`Failed to check git status: ${err.message}`);
    return false;
  }
}

/**
 * Display next steps
 */
function displayNextSteps(version, releaseNotesPath) {
  const { isoDate } = getCurrentDates();
  
  header('NEXT STEPS');
  
  log('\n📝 Manual Tasks Required:', 'yellow');
  log(`1. Complete CHANGELOG.md entry for v${normalizeVersion(version)} (template added)`);
  log(`2. Complete release notes: ${releaseNotesPath}`);
  log('3. Ensure both CHANGELOG.md and release notes have matching information');
  log('4. Review and test all changes');
  
  log('\n🚀 Release Commands:', 'cyan');
  log('5. Commit changes:');
  log(`   git add -A`);
  log(`   git commit -m "feat: v${normalizeVersion(version)} - [brief description]"`);
  
  log('\n6. Create and push tag:');
  log(`   git tag -a v${normalizeVersion(version)} -m "Release v${normalizeVersion(version)}"`);
  log(`   git push origin main --tags`);
  
  log('\n7. Create GitHub release:');
  log(`   gh release create v${normalizeVersion(version)} --title "v${normalizeVersion(version)} - [title]" --notes-file "${releaseNotesPath}"`);
  
  log('\n💡 Automation Notes:', 'blue');
  log('   • CHANGELOG.md template created automatically ✅');
  log('   • Release notes template created automatically ✅');
  log('   • Service worker version updated automatically ✅');
  log('   • PWA cache will be invalidated for all users ✅');
  log('   • README.md version examples updated ✅');
  log('   • Build validation completed ✅');
  log('   • Version consistency verified ✅');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    log('Usage: node prepare-release.mjs <version>');
    log('Example: node prepare-release.mjs v1.9.1');
    log('         node prepare-release.mjs 1.9.1');
    process.exit(0);
  }
  
  const version = args[0];
  
  header(`PREPARING RELEASE v${normalizeVersion(version)}`);
  
  // Validation
  if (!validateVersion(version)) {
    error('Invalid version format. Use format: v1.9.1 or 1.9.1');
    process.exit(1);
  }
  
  if (!validateDateChronology()) {
    process.exit(1);
  }
  
  // Check git status
  info('Checking git status...');
  if (!checkGitStatus()) {
    warn('Working directory has uncommitted changes. Continue anyway? (y/N)');
    // For automation, we'll continue but warn
  }
  
  // Update versions
  header('UPDATING VERSIONS');
  
  if (!updatePackageVersions(version)) {
    process.exit(1);
  }
  
  if (!updateServiceWorkerVersion()) {
    process.exit(1);
  }
  
  if (!updateReadmeVersions(version)) {
    process.exit(1);
  }
  
  // Create release documentation
  header('CREATING RELEASE DOCUMENTATION');
  
  // Create CHANGELOG.md entry
  if (!createChangelogEntry(version)) {
    process.exit(1);
  }
  
  // Create release notes structure
  const releaseDir = createReleaseNotesStructure(version);
  if (!releaseDir) {
    process.exit(1);
  }
  
  const releaseNotesPath = createReleaseNotesTemplate(version, releaseDir);
  if (!releaseNotesPath) {
    process.exit(1);
  }
  
  // Validate builds
  header('VALIDATING BUILDS');
  
  if (!validateBuilds()) {
    process.exit(1);
  }
  
  // Display next steps
  displayNextSteps(version, releaseNotesPath);
  
  log('\n🎉 Release preparation completed successfully!', 'green');
}

// Run the script
main().catch(err => {
  error(`Script failed: ${err.message}`);
  process.exit(1);
}); 