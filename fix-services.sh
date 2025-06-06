#!/bin/bash

# =============================================================================
# PROFOLIO SERVICE REPAIR SCRIPT
# =============================================================================
# Quick fix for systemd service path issues
# =============================================================================

set -e

echo "🔧 Profolio Service Repair Script"
echo "================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "❌ This script must be run as root"
    echo "Please run: sudo bash fix-services.sh"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROFOLIO_USER="profolio"
PROFOLIO_DIR="/opt/profolio"

info "Detecting executable paths..."

# Find actual executable paths
node_path=$(which node 2>/dev/null || echo "/usr/bin/node")
pnpm_path=""
npm_path=""

# Find pnpm with multiple fallback locations
if command -v pnpm >/dev/null 2>&1; then
    pnpm_path=$(which pnpm 2>/dev/null)
    info "Found pnpm at: $pnpm_path"
elif [[ -f "/root/.local/share/pnpm/pnpm" ]]; then
    pnpm_path="/root/.local/share/pnpm/pnpm"
    info "Found pnpm at: $pnpm_path"
elif [[ -f "/usr/local/bin/pnpm" ]]; then
    pnpm_path="/usr/local/bin/pnpm"
    info "Found pnpm at: $pnpm_path"
else
    warning "pnpm not found"
fi

# Find npm as fallback
if command -v npm >/dev/null 2>&1; then
    npm_path=$(which npm 2>/dev/null || echo "/usr/bin/npm")
    info "Found npm at: $npm_path"
fi

# Determine what to use for frontend
frontend_cmd=""
if [[ -n "$pnpm_path" && -x "$pnpm_path" ]]; then
    frontend_cmd="$pnpm_path start"
    info "Frontend will use pnpm: $frontend_cmd"
elif [[ -n "$npm_path" && -x "$npm_path" ]]; then
    frontend_cmd="$npm_path start"
    info "Frontend will use npm: $frontend_cmd"
else
    error "No package manager found for frontend service"
    exit 1
fi

# Verify node path
if [[ ! -x "$node_path" ]]; then
    error "Node.js not found at: $node_path"
    exit 1
fi

info "Node.js path: $node_path"
info "Frontend command: $frontend_cmd"

# Stop services
info "Stopping services..."
systemctl stop profolio-frontend profolio-backend || true

# Create fixed backend service
info "Creating backend service..."
cat > /etc/systemd/system/profolio-backend.service <<EOF
[Unit]
Description=Profolio Backend
Documentation=https://github.com/Obednal97/profolio
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/backend
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/share/pnpm
ExecStart=$node_path dist/main.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$PROFOLIO_DIR
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

# Create fixed frontend service
info "Creating frontend service..."
cat > /etc/systemd/system/profolio-frontend.service <<EOF
[Unit]
Description=Profolio Frontend
Documentation=https://github.com/Obednal97/profolio
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/share/pnpm
ExecStart=/bin/bash -c '$frontend_cmd'
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$PROFOLIO_DIR
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
info "Reloading systemd..."
systemctl daemon-reload

# Start services
info "Starting backend service..."
if systemctl start profolio-backend; then
    success "Backend service started"
else
    error "Failed to start backend service"
    systemctl status profolio-backend --no-pager
fi

sleep 3

info "Starting frontend service..."
if systemctl start profolio-frontend; then
    success "Frontend service started"
else
    error "Failed to start frontend service"
    systemctl status profolio-frontend --no-pager
fi

sleep 3

# Check service status
info "Checking service status..."
echo ""
echo "=== Backend Service Status ==="
systemctl status profolio-backend --no-pager

echo ""
echo "=== Frontend Service Status ==="
systemctl status profolio-frontend --no-pager

echo ""
if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
    success "🎉 All services are running successfully!"
    echo ""
    echo "🌐 Your Profolio instance is ready!"
    echo ""
    echo "📍 Access URLs:"
    local host_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-server-ip")
    echo "   • Frontend: http://${host_ip}:3000"
    echo "   • Backend:  http://${host_ip}:3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   • Status:  systemctl status profolio-backend profolio-frontend"
    echo "   • Logs:    journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   • Restart: systemctl restart profolio-backend profolio-frontend"
else
    warning "⚠️  Some services may not be running properly"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   • Check logs: journalctl -u profolio-frontend -f"
    echo "   • Manual test: cd $PROFOLIO_DIR/frontend && sudo -u $PROFOLIO_USER $frontend_cmd"
fi

echo ""
success "Service repair completed!" 