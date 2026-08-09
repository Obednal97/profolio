#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script to update service worker version to match package.json
 * This ensures cache invalidation on each release
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, '../package.json');
const swPath = path.join(__dirname, '../public/sw.js');

try {
  // Read current version from package.json
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = packageJson.version;
  
  console.log(`📦 Updating service worker to version ${version}...`);
  
  // Read service worker file
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update the APP_VERSION constant
  const updatedContent = swContent.replace(
    /const APP_VERSION = '[^']+';/,
    `const APP_VERSION = '${version}';`
  );
  
  // Write updated service worker
  fs.writeFileSync(swPath, updatedContent, 'utf8');
  
  console.log(`✅ Service worker updated to version ${version}`);
  console.log('🔄 This will force cache invalidation for all users');
  
} catch (error) {
  console.error('❌ Failed to update service worker version:', error.message);
  process.exit(1);
} 