#!/bin/bash

# Script to clean up processes on development ports

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning up development server ports...${NC}"

# Kill processes on port 3000 (frontend)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Found process on port 3000, cleaning up...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Cleaned up port 3000${NC}"
else
    echo -e "${GREEN}✓ Port 3000 is already free${NC}"
fi

# Kill processes on port 3001 (backend)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Found process on port 3001, cleaning up...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Cleaned up port 3001${NC}"
else
    echo -e "${GREEN}✓ Port 3001 is already free${NC}"
fi

echo -e "${GREEN}All development ports are now free!${NC}"