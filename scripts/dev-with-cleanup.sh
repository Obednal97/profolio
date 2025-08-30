#!/bin/bash

# Script to run dev servers with proper cleanup on exit

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill processes on specific ports
cleanup_ports() {
    echo -e "${YELLOW}Cleaning up processes on ports 3000 and 3001...${NC}"
    
    # Kill processes on port 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Cleaned up port 3000${NC}"
    fi
    
    # Kill processes on port 3001
    if lsof -ti:3001 > /dev/null 2>&1; then
        lsof -ti:3001 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Cleaned up port 3001${NC}"
    fi
    
    # Small delay to ensure ports are freed
    sleep 1
}

# Function to kill process tree (works on macOS)
killtree() {
    local parent=$1
    local child
    for child in $(pgrep -P $parent); do
        killtree $child
    done
    kill -9 $parent 2>/dev/null
}

# Trap function to handle script termination
cleanup_on_exit() {
    echo -e "\n${YELLOW}Shutting down development servers...${NC}"
    
    # Kill the pnpm dev process and all its children
    if [ ! -z "$DEV_PID" ] && kill -0 $DEV_PID 2>/dev/null; then
        # Try graceful shutdown first
        kill -TERM $DEV_PID 2>/dev/null
        sleep 2
        
        # Kill entire process tree if still running
        if kill -0 $DEV_PID 2>/dev/null; then
            killtree $DEV_PID
        fi
    fi
    
    # Clean up any remaining processes on the ports
    cleanup_ports
    
    echo -e "${GREEN}✓ Development servers stopped${NC}"
    exit 0
}

# Set up trap for various termination signals
trap cleanup_on_exit EXIT INT TERM

# Initial cleanup to ensure ports are free
cleanup_ports

echo -e "${GREEN}Starting development servers...${NC}"

# Start the dev servers
# For macOS compatibility, we don't use setsid
pnpm run dev &
DEV_PID=$!

# Store the PID for cleanup
echo "Development servers started with PID: $DEV_PID"

# Wait for the process to complete or be interrupted
wait $DEV_PID