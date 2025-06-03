#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */

const { createServer } = require('https');
const { parse } = require('url');
const { readFileSync } = require('fs');
const { join } = require('path');
const next = require('next');

const hostname = 'localhost';
const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// HTTPS options with mkcert certificates
const httpsOptions = {
  key: readFileSync(join(__dirname, '../.certificates/localhost+3-key.pem')),
  cert: readFileSync(join(__dirname, '../.certificates/localhost+3.pem')),
};

app.prepare().then(() => {
  const server = createServer(httpsOptions, async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.listen(port, () => {
    const networkInterfaces = require('os').networkInterfaces();
    const networkIP = Object.values(networkInterfaces)
      .flat()
      .find(iface => iface?.family === 'IPv4' && !iface?.internal)?.address || '192.168.1.69';

    console.log(`\n🚀 HTTPS Frontend ready on https://${hostname}:${port}`);
    console.log(`📱 PWA testing ready at:`);
    console.log(`   • Desktop: https://localhost:${port}`);
    console.log(`   • Mobile:  https://${networkIP}:${port}`);
    console.log(`\n🔧 PWA DevTools: Open Chrome DevTools > Application > Service Workers`);
    console.log(`📋 Testing Guide: See PWA_TESTING_GUIDE.md for complete instructions`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down HTTPS server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 