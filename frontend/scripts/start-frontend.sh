#!/bin/bash
set -e
export PATH="/usr/bin:$PATH"
cd /root/profolio/frontend
pnpm install
pnpm exec next dev -p 3001