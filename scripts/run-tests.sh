#!/bin/bash

# Test Runner Script
# Ensures application is running before executing tests
# Default: Runs tests in headless mode for better performance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Profolio Test Runner"
echo "======================"
echo ""

# Function to check if port is open
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $service (port $port)..."
    while ! check_port $port && [ $attempt -lt $max_attempts ]; do
        sleep 1
        echo -n "."
        attempt=$((attempt + 1))
    done
    
    if check_port $port; then
        echo -e " ${GREEN}✓${NC}"
        return 0
    else
        echo -e " ${RED}✗${NC}"
        return 1
    fi
}

# Parse arguments
TEST_TYPE=""
AUTO_START="true"
HEADED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED=true
            shift
            ;;
        --no-auto-start)
            AUTO_START="false"
            shift
            ;;
        --help)
            echo "Usage: $0 [TEST_TYPE] [OPTIONS]"
            echo ""
            echo "Test Types:"
            echo "  e2e         Run E2E tests (default)"
            echo "  e2e:ui      Run E2E tests with UI"
            echo "  security    Run security tests"
            echo "  performance Run performance tests"
            echo "  all         Run all tests"
            echo "  ci          Run CI optimized tests"
            echo "  quick       Run quick tests (no slow/visual)"
            echo ""
            echo "Options:"
            echo "  --headed        Run tests with browser windows visible"
            echo "  --no-auto-start Don't auto-start services"
            echo "  --help          Show this help message"
            echo ""
            echo "By default, tests run in headless mode for better performance."
            exit 0
            ;;
        *)
            TEST_TYPE=$1
            shift
            ;;
    esac
done

# Default test type if not specified
TEST_TYPE=${TEST_TYPE:-"e2e"}

# Check if services are running
FRONTEND_RUNNING=false
BACKEND_RUNNING=false

if check_port 3000; then
    echo -e "${GREEN}✓${NC} Frontend is running on port 3000"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️${NC} Frontend is not running"
fi

if check_port 3001; then
    echo -e "${GREEN}✓${NC} Backend is running on port 3001"
    BACKEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️${NC} Backend is not running"
fi

# Start services if needed and requested
if [ "$AUTO_START" = "true" ]; then
    if [ "$FRONTEND_RUNNING" = false ] || [ "$BACKEND_RUNNING" = false ]; then
        echo ""
        echo "Starting services..."
        
        # Start backend
        if [ "$BACKEND_RUNNING" = false ]; then
            echo "Starting backend..."
            cd backend && pnpm run dev > /tmp/backend.log 2>&1 &
            BACKEND_PID=$!
            wait_for_service 3001 "backend"
        fi
        
        # Start frontend
        if [ "$FRONTEND_RUNNING" = false ]; then
            echo "Starting frontend..."
            cd frontend && pnpm run dev > /tmp/frontend.log 2>&1 &
            FRONTEND_PID=$!
            wait_for_service 3000 "frontend"
        fi
    fi
else
    if [ "$FRONTEND_RUNNING" = false ] || [ "$BACKEND_RUNNING" = false ]; then
        echo ""
        echo -e "${RED}Error: Services are not running${NC}"
        echo "Please start the services manually:"
        echo "  Backend: cd backend && pnpm run dev"
        echo "  Frontend: cd frontend && pnpm run dev"
        echo ""
        echo "Or run this script with auto-start:"
        echo "  $0 $TEST_TYPE true"
        exit 1
    fi
fi

echo ""
echo "Running tests..."
echo ""

# Navigate to frontend for tests
cd frontend

# Display mode
if [ "$HEADED" = true ]; then
    echo "Mode: Headed (browser windows visible)"
    export HEADED=true
else
    echo "Mode: Headless (optimized for performance)"
fi
echo ""

# Run appropriate test command
case "$TEST_TYPE" in
    "e2e")
        echo "Running E2E tests..."
        if [ "$HEADED" = true ]; then
            pnpm run test:headed
        else
            pnpm run test:headless
        fi
        ;;
    "e2e:ui")
        echo "Running E2E tests with UI..."
        pnpm run test:e2e:ui
        ;;
    "security")
        echo "Running security tests..."
        pnpm run test:security
        ;;
    "performance")
        echo "Running performance tests (always headless)..."
        pnpm run test:performance
        ;;
    "all")
        echo "Running all tests..."
        if [ "$HEADED" = true ]; then
            HEADED=true pnpm run test:all
        else
            pnpm run test:all
        fi
        ;;
    "ci")
        echo "Running CI optimized tests (always headless)..."
        pnpm run test:ci
        ;;
    "quick")
        echo "Running quick tests (no slow/visual)..."
        pnpm run test:quick
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Available options: e2e, e2e:ui, security, performance, all, ci, quick"
        exit 1
        ;;
esac

# Cleanup if we started services
if [ "$AUTO_START" = "true" ]; then
    if [ ! -z "$BACKEND_PID" ]; then
        echo ""
        echo "Stopping backend..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
fi

echo ""
echo -e "${GREEN}✓${NC} Tests complete!"