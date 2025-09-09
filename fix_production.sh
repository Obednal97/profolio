#!/bin/bash
#
# Profolio Production Fix Script
# Fixes the immediate prisma:generate and build issues
#
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "════════════════════════════════════════"
echo "🔧 Profolio Production Fix Script"
echo "════════════════════════════════════════"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root (use sudo)"
    exit 1
fi

# Navigate to profolio directory
if [ ! -d "/opt/profolio" ]; then
    error "Profolio installation not found at /opt/profolio"
    exit 1
fi

cd /opt/profolio

info "🛑 Stopping services..."
systemctl stop profolio-backend profolio-frontend 2>/dev/null || true

info "🧹 Cleaning up build artifacts..."
rm -rf backend/dist frontend/.next backend/node_modules frontend/node_modules 2>/dev/null || true

info "📦 Installing backend dependencies..."
cd backend
if ! sudo -u profolio pnpm install --frozen-lockfile=false; then
    warn "Backend dependency installation had issues, but continuing..."
fi

info "🔨 Generating Prisma client..."
if ! sudo -u profolio pnpm run prisma:generate; then
    warn "Initial Prisma generation failed, attempting recovery..."
    
    # Try installing prisma specifically
    if sudo -u profolio pnpm install prisma @prisma/client; then
        info "Prisma packages installed, retrying generation..."
        if sudo -u profolio pnpm run prisma:generate; then
            success "Prisma client generated successfully after recovery"
        else
            error "Failed to generate Prisma client after recovery attempts"
            exit 1
        fi
    else
        error "Failed to install Prisma packages"
        exit 1
    fi
fi

info "🏗️ Building backend..."
if ! sudo -u profolio pnpm run build; then
    error "Backend build failed"
    exit 1
fi

cd /opt/profolio

info "📦 Installing frontend dependencies..."
cd frontend
if ! sudo -u profolio pnpm install --frozen-lockfile=false; then
    warn "Frontend dependency installation had issues, but continuing..."
fi

info "🏗️ Building frontend..."
if ! sudo -u profolio pnpm run build; then
    error "Frontend build failed"
    exit 1
fi

cd /opt/profolio

info "🔧 Fixing permissions..."
chown -R profolio:profolio /opt/profolio

info "🚀 Starting services..."
systemctl start profolio-backend
sleep 5
systemctl start profolio-frontend

info "✅ Verifying services..."
sleep 10

backend_status=$(systemctl is-active profolio-backend || echo "failed")
frontend_status=$(systemctl is-active profolio-frontend || echo "failed")

if [ "$backend_status" = "active" ] && [ "$frontend_status" = "active" ]; then
    success "🎉 All services are running successfully!"
    echo ""
    echo "Profolio should now be accessible at:"
    local_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    echo "  http://$local_ip"
    echo "  http://localhost"
else
    warn "⚠️  Some services may not be running properly:"
    echo "  Backend: $backend_status"
    echo "  Frontend: $frontend_status"
    echo ""
    echo "Check logs with:"
    echo "  journalctl -u profolio-backend -f"
    echo "  journalctl -u profolio-frontend -f"
fi

echo ""
success "🔧 Production fix completed!"