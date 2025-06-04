#!/bin/bash
set -e
export PATH="/usr/local/bin:/usr/bin:$PATH"
cd /opt/profolio/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    pnpm install --prod
fi

# Build the application using pnpm
pnpm run build

# Start the application
pnpm run start