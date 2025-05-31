#!/bin/bash
set -e
export PATH="/usr/local/bin:/usr/bin:$PATH"
cd /opt/profolio/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm ci --production
fi

# Build the application using npx (no global CLI needed)
npx nest build

# Start the application
npm run start