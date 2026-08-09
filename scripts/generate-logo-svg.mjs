#!/usr/bin/env node

/**
 * Profolio Logo SVG Generator
 * 
 * Generates SVG logo files at multiple sizes for favicon creation.
 * Uses React server-side rendering to create consistent SVG output
 * that matches the ProfolioLogoSVG component.
 * 
 * Usage: node scripts/generate-logo-svg.mjs
 * Output: Creates profolio-logo-{size}px.svg files in the root directory
 * 
 * @requires react
 * @requires react-dom/server
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const CONFIG = {
  OUTPUT_DIR: path.join(__dirname, '..'), // Save to frontend root
  SIZES: [16, 32, 48, 64, 72, 96, 128, 144, 152, 192, 256, 384, 512],
  FILENAME_TEMPLATE: 'profolio-logo-{size}px.svg',
  XML_DECLARATION: '<?xml version="1.0" encoding="UTF-8"?>',
};

// Design constants (must match ProfolioLogoSVG.tsx)
const DESIGN_CONSTANTS = {
  SQUIRCLE_RATIO: 140 / 512,
  ICON_SCALE: 0.6 / 512,
  ICON_OFFSET_X: 80 / 512,
  ICON_OFFSET_Y: 100 / 512,
  GRADIENT_COLORS: {
    START: '#2563eb',
    END: '#9333ea',
  },
  SHADOW: {
    BLUR: '3',
    COLOR: 'rgba(0,0,0,0.15)',
  },
};

// Font Awesome fa-chart-pie path data
const PIE_CHART_PATH = 'M304 240l0-223.4c0-9 7-16.6 16-16.6C443.7 0 544 100.3 544 224c0 9-7.6 16-16.6 16L304 240zM32 272C32 150.7 122.1 50.3 239 34.3c9.2-1.3 17 6.1 17 15.4L256 288 412.5 444.5c6.7 6.7 6.2 17.7-1.5 23.1C371.8 495.6 323.8 512 272 512C139.5 512 32 404.6 32 272zm526.4 16c9.3 0 16.6 7.8 15.4 17c-7.7 55.9-34.6 105.6-73.9 142.3c-6 5.6-15.4 5.2-21.2-.7L320 288l238.4 0z';

/**
 * Self-contained ProfolioLogo SVG component
 * Renders exactly the same as ProfolioLogoSVG.tsx but using React.createElement
 * for Node.js compatibility
 */
function ProfolioLogoSVG({ size = 512 }) {
  // Calculate dimensions using the same logic as the React component
  const dimensions = {
    borderRadius: size * DESIGN_CONSTANTS.SQUIRCLE_RATIO,
    iconScale: DESIGN_CONSTANTS.ICON_SCALE * size,
    offsetX: size * DESIGN_CONSTANTS.ICON_OFFSET_X,
    offsetY: size * DESIGN_CONSTANTS.ICON_OFFSET_Y,
  };

  // Create unique IDs for this size
  const ids = {
    gradient: 'grad',
    shadow: 'drop-shadow',
  };

  const iconTransform = `translate(${dimensions.offsetX}, ${dimensions.offsetY}) scale(${dimensions.iconScale})`;

  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    fill: 'none'
  }, [
    // Definitions
    React.createElement('defs', { key: 'defs' }, [
      React.createElement('linearGradient', {
        key: 'gradient',
        id: ids.gradient,
        x1: '0',
        y1: '0',
        x2: '1',
        y2: '1'
      }, [
        React.createElement('stop', { 
          key: 'stop1', 
          offset: '0%', 
          stopColor: DESIGN_CONSTANTS.GRADIENT_COLORS.START 
        }),
        React.createElement('stop', { 
          key: 'stop2', 
          offset: '100%', 
          stopColor: DESIGN_CONSTANTS.GRADIENT_COLORS.END 
        })
      ]),
      React.createElement('filter', {
        key: 'filter',
        id: ids.shadow,
        x: '-20%',
        y: '-20%',
        width: '140%',
        height: '140%'
      }, [
        React.createElement('feDropShadow', {
          key: 'shadow',
          dx: '0',
          dy: '4',
          stdDeviation: DESIGN_CONSTANTS.SHADOW.BLUR,
          floodColor: DESIGN_CONSTANTS.SHADOW.COLOR
        })
      ])
    ]),
    
    // Background rectangle
    React.createElement('rect', {
      key: 'background',
      width: size,
      height: size,
      rx: dimensions.borderRadius,
      fill: `url(#${ids.gradient})`,
      filter: `url(#${ids.shadow})`
    }),
    
    // Icon group
    React.createElement('g', {
      key: 'pie',
      transform: iconTransform
    }, [
      React.createElement('path', {
        key: 'fa-pie',
        fill: 'white',
        d: PIE_CHART_PATH
      })
    ])
  ]);
}

/**
 * Generate and save SVG file for a specific size
 */
async function generateSVGFile(size) {
  try {
    // Create React element and render to static markup
    const logoElement = React.createElement(ProfolioLogoSVG, { size });
    const svgString = renderToStaticMarkup(logoElement);
    
    // Add XML declaration and format
    const cleanSvg = `${CONFIG.XML_DECLARATION}\n${svgString}`;
    
    // Generate filename and path
    const filename = CONFIG.FILENAME_TEMPLATE.replace('{size}', size.toString());
    const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);
    
    // Write file
    await fs.writeFile(outputPath, cleanSvg, 'utf8');
    console.log(`✅ Generated: ${filename}`);
    
    return filename;
  } catch (error) {
    console.error(`❌ Failed to generate ${size}px SVG:`, error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎨 Generating Profolio logo SVG files...\n');
  
  try {
    // Generate all sizes in parallel for better performance
    const promises = CONFIG.SIZES.map(size => generateSVGFile(size));
    const filenames = await Promise.all(promises);
    
    console.log('\n✅ All SVG sizes generated successfully!');
    console.log(`📁 Files saved to: ${CONFIG.OUTPUT_DIR}`);
    console.log('🔗 Use these SVGs with https://realfavicongenerator.net to create favicons');
    console.log(`📝 Generated ${filenames.length} files:`, filenames.join(', '));
    
  } catch (error) {
    console.error('\n❌ SVG generation failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 