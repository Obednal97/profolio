#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for database
wait_for_database() {
    log_info "Waiting for database connection..."
    
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; then
            log_success "Database is ready"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Database not ready yet (attempt $count/$retries). Retrying in 2 seconds..."
        sleep 2
    done
    
    log_error "Database failed to become ready after $retries attempts"
    exit 1
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."
    cd /app/backend
    
    if pnpm prisma db push; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    log_info "Starting backend service..."
    cd /app/backend
    
    # Start backend in the background
    node dist/main.js &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            log_success "Backend service is ready"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Backend not ready yet (attempt $count/$retries). Retrying in 2 seconds..."
        sleep 2
    done
    
    log_error "Backend failed to start after $retries attempts"
    exit 1
}

# Function to start frontend
start_frontend() {
    log_info "Starting frontend service..."
    cd /app/frontend
    
    # Start frontend in the background
    node server.js &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log_success "Frontend service is ready"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Frontend not ready yet (attempt $count/$retries). Retrying in 2 seconds..."
        sleep 2
    done
    
    log_error "Frontend failed to start after $retries attempts"
    exit 1
}

# Function to handle graceful shutdown
cleanup() {
    log_info "Received shutdown signal, stopping services..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        log_info "Stopping frontend service..."
        kill -TERM $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        log_info "Stopping backend service..."
        kill -TERM $BACKEND_PID 2>/dev/null || true
    fi
    
    # Wait for processes to terminate
    wait $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    
    log_success "Services stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Main execution
main() {
    log_info "🚀 Starting Profolio application..."
    
    # Validate environment variables
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRET environment variable is required"
        exit 1
    fi
    
    if [ -z "$API_ENCRYPTION_KEY" ]; then
        log_error "API_ENCRYPTION_KEY environment variable is required"
        exit 1
    fi
    
    # Wait for database to be ready
    wait_for_database
    
    # Run database migrations
    run_migrations
    
    # Start backend service
    start_backend
    
    # Start frontend service
    start_frontend
    
    log_success "🎉 Profolio application is running!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend API: http://localhost:3001"
    log_info "Health check: http://localhost:3001/health"
    
    # Keep the script running and wait for any process to exit
    while true; do
        # Check if backend is still running
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "Backend process died unexpectedly"
            exit 1
        fi
        
        # Check if frontend is still running
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "Frontend process died unexpectedly"
            exit 1
        fi
        
        sleep 5
    done
}

# Run main function
main "$@" 