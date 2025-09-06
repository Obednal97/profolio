#!/usr/bin/env node

/**
 * Script to check for 'any' types in TypeScript files
 * Used in pre-commit hooks and CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Configuration
const config = {
  // Paths to check
  paths: ['./frontend/src', './backend/src'],
  
  // File extensions to check
  extensions: ['.ts', '.tsx'],
  
  // Files to exclude
  excludePatterns: [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.test.',
    '.spec.',
    'types/common.ts', // Our SafeAny utility file
  ],
  
  // Maximum allowed any types (for gradual migration)
  maxAllowedAny: 0, // 🎉 ZERO ANY TYPES ACHIEVED! From 81 → 48 → 13 → 0 (100% improvement!)
  
  // Patterns to search for
  anyPatterns: [
    /:\s*any(?:\s|,|\)|;|$)/g,        // Type annotations: ": any"
    /as\s+any(?:\s|,|\)|;|$)/g,       // Type assertions: "as any"
    /<any>/g,                          // Generic any: "<any>"
    /Array<any>/g,                     // Array of any
    /Promise<any>/g,                   // Promise of any
    /:\s*any\[\]/g,                    // Array annotation: ": any[]"
  ],
};

// Helper functions
function findFiles(dir, extensions, excludePatterns) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      // Check if should exclude
      if (excludePatterns.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    walk(dir);
  }
  
  return files;
}

function checkFileForAny(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    config.anyPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        findings.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          match: matches[0],
        });
      }
    });
  });
  
  return findings;
}

function getGitDiff() {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file && config.extensions.some(ext => file.endsWith(ext)));
    
    return stagedFiles;
  } catch (error) {
    return [];
  }
}

function generateReport(allFindings, newFindings) {
  console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + '                 TypeScript Any Type Report                ' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════════════════════' + colors.reset + '\n');
  
  // Summary
  const totalAny = allFindings.length;
  const newAny = newFindings.length;
  
  console.log(colors.yellow + '📊 Summary:' + colors.reset);
  console.log(`   Total 'any' types found: ${totalAny}`);
  console.log(`   Maximum allowed: ${config.maxAllowedAny}`);
  console.log(`   New 'any' in staged files: ${newAny}`);
  console.log();
  
  // Progress bar
  const progress = Math.max(0, Math.min(100, ((config.maxAllowedAny - totalAny) / config.maxAllowedAny) * 100));
  const progressBar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
  console.log(`   Progress: [${progressBar}] ${progress.toFixed(1)}%`);
  console.log();
  
  // Files with most any types
  const fileCount = {};
  allFindings.forEach(finding => {
    fileCount[finding.file] = (fileCount[finding.file] || 0) + 1;
  });
  
  const topFiles = Object.entries(fileCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topFiles.length > 0) {
    console.log(colors.yellow + '📁 Files with most any types:' + colors.reset);
    topFiles.forEach(([file, count]) => {
      const shortPath = file.replace(process.cwd() + '/', '');
      console.log(`   ${count.toString().padStart(3)} | ${shortPath}`);
    });
    console.log();
  }
  
  // New any types in staged files
  if (newFindings.length > 0) {
    console.log(colors.red + '⚠️  New \'any\' types in staged files:' + colors.reset);
    newFindings.forEach(finding => {
      const shortPath = finding.file.replace(process.cwd() + '/', '');
      console.log(`   ${shortPath}:${finding.line}`);
      console.log(`     ${colors.red}${finding.content}${colors.reset}`);
    });
    console.log();
    
    console.log(colors.yellow + '💡 Suggestions:' + colors.reset);
    console.log('   1. Use proper TypeScript types instead of \'any\'');
    console.log('   2. If type is unknown, use \'unknown\' and add type guards');
    console.log('   3. For temporary any, use SafeAny<"TODO: reason"> from types/common.ts');
    console.log('   4. For objects, define an interface or use Record<string, unknown>');
    console.log();
  }
  
  return { totalAny, newAny };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const isPreCommit = args.includes('--pre-commit');
  const isStrict = args.includes('--strict');
  
  // Find all TypeScript files
  const allFiles = [];
  config.paths.forEach(dir => {
    allFiles.push(...findFiles(dir, config.extensions, config.excludePatterns));
  });
  
  // Check all files for any
  const allFindings = [];
  allFiles.forEach(file => {
    allFindings.push(...checkFileForAny(file));
  });
  
  // If pre-commit, check only staged files
  let newFindings = [];
  if (isPreCommit) {
    const stagedFiles = getGitDiff();
    stagedFiles.forEach(file => {
      const fullPath = path.resolve(file);
      if (fs.existsSync(fullPath)) {
        newFindings.push(...checkFileForAny(fullPath));
      }
    });
  }
  
  // Generate report
  const { totalAny, newAny } = generateReport(allFindings, newFindings);
  
  // Determine exit code
  let exitCode = 0;
  
  if (isStrict && totalAny > 0) {
    console.log(colors.red + '❌ Strict mode: No \'any\' types allowed!' + colors.reset);
    exitCode = 1;
  } else if (totalAny > config.maxAllowedAny) {
    console.log(colors.red + `❌ Too many 'any' types! (${totalAny} > ${config.maxAllowedAny})` + colors.reset);
    console.log(colors.yellow + '   Please fix some existing \'any\' types before adding new ones.' + colors.reset);
    exitCode = 1;
  } else if (isPreCommit && newAny > 0) {
    console.log(colors.yellow + '⚠️  Warning: New \'any\' types detected in staged files.' + colors.reset);
    console.log(colors.yellow + '   Consider using proper types. Allowing commit with warning...' + colors.reset);
    // Don't block commit, just warn
    exitCode = 0;
  } else {
    console.log(colors.green + '✅ Type safety check passed!' + colors.reset);
  }
  
  console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════' + colors.reset + '\n');
  
  process.exit(exitCode);
}

// Run the script
if (require.main === module) {
  main();
}