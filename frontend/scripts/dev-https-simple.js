#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
 

const { spawn } = require('child_process');
const { join } = require('path');
const { existsSync } = require('fs');

// Check if certificates exist
const certPath = join(__dirname, '../.certificates/localhost+3.pem');
const keyPath = join(__dirname, '../.certificates/localhost+3-key.pem');

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.error('❌ HTTPS certificates not found!');
  console.error('Please run the setup first:');
  console.error('  1. mkcert -install');
  console.error('  2. mkdir -p .certificates');
  console.error('  3. cd .certificates && mkcert localhost 127.0.0.1 ::1 $(ipconfig getifaddr en0)');
  process.exit(1);
}

// Set environment variables for HTTPS
const env = {
  ...process.env,
  HTTPS: 'true',
  SSL_CRT_FILE: certPath,
  SSL_KEY_FILE: keyPath,
  NODE_ENV: 'development'
};

console.log('🚀 Starting Next.js with HTTPS...');
console.log(`📱 PWA testing will be available at:`);
console.log(`   • Desktop: https://localhost:3000`);
console.log(`   • Mobile:  https://YOUR_IP:3000`);

// Start Next.js with HTTPS environment
const nextProcess = spawn('pnpm', ['run', 'dev'], {
  stdio: 'inherit',
  env
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  nextProcess.kill();
  process.exit(0);
});

nextProcess.on('exit', (code) => {
  process.exit(code);
}); 