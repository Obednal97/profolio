#!/bin/bash
set -e
export PATH="/usr/bin:$PATH"
cd /root/profolio/backend
pnpm install
pnpm run start:dev