#!/bin/bash

# Profolio Safe Deployment Script
# Replaces the manual deployment process with automated safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/profolio"
BACKUP_DIR="/opt/profolio-backups"
SERVICE_BACKEND="profolio-backend.service"
SERVICE_FRONTEND="profolio-frontend.service"
HEALTH_URL="http://localhost:3001/health"
MAX_ROLLBACK_ATTEMPTS=3

echo -e "${BLUE}🚀 Profolio Safe Deployment${NC}"
echo "=================================="

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to check service status
check_service() {
    local service=$1
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✅ $service is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not running${NC}"
        return 1
    fi
}

# Function to stop services safely
stop_services() {
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    
    if systemctl is-active --quiet $SERVICE_FRONTEND; then
        systemctl stop $SERVICE_FRONTEND
        echo -e "${YELLOW}⏹️  Frontend service stopped${NC}"
    fi
    
    if systemctl is-active --quiet $SERVICE_BACKEND; then
        systemctl stop $SERVICE_BACKEND
        echo -e "${YELLOW}⏹️  Backend service stopped${NC}"
    fi
}

# Function to start services
start_services() {
    echo -e "${BLUE}▶️ Starting services...${NC}"
    
    systemctl start $SERVICE_BACKEND
    sleep 2
    
    systemctl start $SERVICE_FRONTEND
    sleep 2
    
    if check_service $SERVICE_BACKEND && check_service $SERVICE_FRONTEND; then
        echo -e "${GREEN}✅ All services started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start services${NC}"
        return 1
    fi
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/profolio_backup_$timestamp"
    
    if [ -d "$DEPLOY_DIR" ]; then
        cp -r "$DEPLOY_DIR" "$backup_path"
        echo -e "${GREEN}✅ Backup created: $backup_path${NC}"
        
        # Keep only the last 5 backups
        ls -t $BACKUP_DIR/profolio_backup_* | tail -n +6 | xargs rm -rf 2>/dev/null || true
        echo -e "${YELLOW}🧹 Old backups cleaned up${NC}"
        
        echo "$backup_path" > /tmp/profolio_last_backup
    else
        echo -e "${YELLOW}⚠️  No existing deployment to backup${NC}"
    fi
}

# Function to update code
update_code() {
    echo -e "${BLUE}📥 Updating code...${NC}"
    
    cd $DEPLOY_DIR
    
    # Fetch latest changes
    sudo -u profolio git fetch origin
    
    # Get current commit for rollback info
    local current_commit=$(git rev-parse HEAD)
    echo -e "${BLUE}📍 Current commit: ${current_commit:0:8}${NC}"
    
    # Check if there are actually new changes
    local latest_commit=$(git rev-parse origin/main)
    if [ "$current_commit" = "$latest_commit" ]; then
        echo -e "${YELLOW}ℹ️  No new changes to deploy${NC}"
        return 0
    fi
    
    echo -e "${BLUE}📍 Deploying to: ${latest_commit:0:8}${NC}"
    
    # Update to latest
    sudo -u profolio git checkout main
    sudo -u profolio git reset --hard origin/main
    
    echo -e "${GREEN}✅ Code updated successfully${NC}"
}

# Function to install dependencies and build
build_application() {
    echo -e "${BLUE}🔧 Installing dependencies and building...${NC}"
    
    cd $DEPLOY_DIR
    
    # Backend dependencies
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    sudo -u profolio npm ci --production
    
    # Frontend dependencies and build
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd ../frontend
    sudo -u profolio npm ci
    
    echo -e "${BLUE}🏗️  Building frontend...${NC}"
    sudo -u profolio npm run build
    
    # Run database migrations
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    cd ../backend
    sudo -u profolio npx prisma migrate deploy
    
    echo -e "${GREEN}✅ Build completed successfully${NC}"
}

# Function to health check
health_check() {
    echo -e "${BLUE}🔍 Performing health check...${NC}"
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${BLUE}🔍 Health check attempt $attempt/$max_attempts...${NC}"
        
        if curl -f -s $HEALTH_URL > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            return 0
        fi
        
        sleep 3
        ((attempt++))
    done
    
    echo -e "${RED}❌ Health check failed after $max_attempts attempts${NC}"
    return 1
}

# Function to rollback
rollback() {
    echo -e "${RED}🔄 Rolling back deployment...${NC}"
    
    if [ ! -f /tmp/profolio_last_backup ]; then
        echo -e "${RED}❌ No backup found for rollback${NC}"
        return 1
    fi
    
    local backup_path=$(cat /tmp/profolio_last_backup)
    
    if [ ! -d "$backup_path" ]; then
        echo -e "${RED}❌ Backup directory not found: $backup_path${NC}"
        return 1
    fi
    
    stop_services
    
    # Remove failed deployment
    rm -rf $DEPLOY_DIR
    
    # Restore backup
    cp -r "$backup_path" $DEPLOY_DIR
    chown -R profolio:profolio $DEPLOY_DIR
    
    # Start services
    if start_services; then
        echo -e "${GREEN}✅ Rollback completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Rollback failed${NC}"
        return 1
    fi
}

# Main deployment function
deploy() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}🚀 Starting deployment at $(date)${NC}"
    
    # Check if we're in the right directory
    if [ ! -d "$DEPLOY_DIR" ]; then
        echo -e "${RED}❌ Deployment directory not found: $DEPLOY_DIR${NC}"
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Stop services
    stop_services
    
    # Update code
    if ! update_code; then
        echo -e "${RED}❌ Code update failed${NC}"
        rollback
        exit 1
    fi
    
    # Build application
    if ! build_application; then
        echo -e "${RED}❌ Build failed${NC}"
        rollback
        exit 1
    fi
    
    # Start services
    if ! start_services; then
        echo -e "${RED}❌ Failed to start services${NC}"
        rollback
        exit 1
    fi
    
    # Health check
    if ! health_check; then
        echo -e "${RED}❌ Health check failed${NC}"
        rollback
        exit 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}⏱️  Duration: ${duration}s${NC}"
    echo -e "${BLUE}📅 Completed at: $(date)${NC}"
    echo ""
    echo -e "${BLUE}🔗 Application URLs:${NC}"
    echo -e "${YELLOW}   Frontend: http://$(hostname -I | awk '{print $1}')${NC}"
    echo -e "${YELLOW}   Backend:  http://$(hostname -I | awk '{print $1}'):3001${NC}"
    echo ""
    
    # Clean up
    rm -f /tmp/profolio_last_backup
}

# Command line options
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        echo -e "${BLUE}📊 Service Status:${NC}"
        check_service $SERVICE_BACKEND
        check_service $SERVICE_FRONTEND
        ;;
    "health")
        health_check
        ;;
    "logs")
        echo -e "${BLUE}📋 Recent Backend Logs:${NC}"
        journalctl -u $SERVICE_BACKEND -n 20 --no-pager
        echo -e "${BLUE}📋 Recent Frontend Logs:${NC}"
        journalctl -u $SERVICE_FRONTEND -n 20 --no-pager
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|health|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy latest code from main branch (default)"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Check service status"
        echo "  health   - Check application health"
        echo "  logs     - Show recent service logs"
        exit 1
        ;;
esac 