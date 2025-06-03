#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Icon sizes that need PNG versions for compatibility
const ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 256, 384, 512
];

const ICONS_DIR = 'public/icons';

/**
 * Check if ImageMagick is available
 */
async function checkImageMagick() {
  try {
    await execAsync('convert -version');
    return true;
  } catch {
    console.log('⚠️  ImageMagick not found. Installing would enable PNG conversion.');
    console.log('   On macOS: brew install imagemagick');
    console.log('   On Ubuntu: sudo apt-get install imagemagick');
    return false;
  }
}

/**
 * Generate PNG from SVG using ImageMagick
 */
async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    await execAsync(`convert -background none -size ${size}x${size} "${svgPath}" "${pngPath}"`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${svgPath} to PNG:`, error.message);
    return false;
  }
}

/**
 * Generate PNG icons from existing SVG files
 */
async function generatePngIcons() {
  console.log('🎨 Starting PNG icon generation...\n');

  // Check if icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`❌ Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  // Check ImageMagick availability
  const hasImageMagick = await checkImageMagick();
  
  let successCount = 0;
  let totalCount = 0;

  for (const size of ICON_SIZES) {
    const svgFile = `icon-${size}x${size}.svg`;
    const pngFile = `icon-${size}x${size}.png`;
    const svgPath = path.join(ICONS_DIR, svgFile);
    const pngPath = path.join(ICONS_DIR, pngFile);

    totalCount++;

    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  SVG not found: ${svgFile}`);
      continue;
    }

    if (hasImageMagick) {
      // Convert using ImageMagick
      const success = await convertSvgToPng(svgPath, pngPath, size);
      if (success) {
        console.log(`✅ Generated PNG: ${pngFile}`);
        successCount++;
      }
    } else {
      // Create a fallback note
      console.log(`⏭️  Skipped: ${pngFile} (ImageMagick not available)`);
    }
  }

  console.log(`\n📊 PNG Generation Summary:`);
  console.log(`   Total icons: ${totalCount}`);
  console.log(`   Successfully generated: ${successCount}`);
  
  if (!hasImageMagick) {
    console.log(`\n💡 To generate PNG icons, install ImageMagick:`);
    console.log(`   macOS: brew install imagemagick`);
    console.log(`   Ubuntu: sudo apt-get install imagemagick`);
    console.log(`   Then run this script again.`);
  }

  return successCount;
}

/**
 * Main execution
 */
async function main() {
  try {
    const generated = await generatePngIcons();
    
    if (generated > 0) {
      console.log(`\n🎉 Successfully generated ${generated} PNG icons!`);
      console.log(`📁 Location: ${ICONS_DIR}/`);
    } else {
      console.log(`\n⚠️  No PNG icons were generated. Check the requirements above.`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 