#!/bin/bash
set -e
export PATH="/usr/local/bin:/usr/bin:$PATH"
cd /opt/profolio/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    pnpm install --prod
fi

# Start the application in production mode
pnpm run start