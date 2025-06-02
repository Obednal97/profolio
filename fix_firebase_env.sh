#!/bin/bash

# 🔧 Fix Firebase Environment Configuration Script
# This script recreates the .env.production file with correct Firebase credentials

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Firebase Environment Configuration${NC}"
echo ""

# Get current server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "${BLUE}Current server IP: ${SERVER_IP}${NC}"

# Backup existing file
if [ -f "/opt/profolio/frontend/.env.production" ]; then
    BACKUP_FILE="/tmp/env_production_backup_$(date +%Y%m%d_%H%M%S)"
    cp /opt/profolio/frontend/.env.production "$BACKUP_FILE"
    echo -e "${YELLOW}📁 Backed up existing file to: $BACKUP_FILE${NC}"
fi

# Remove existing environment file
echo -e "${YELLOW}🗑️  Removing template environment file...${NC}"
rm -f /opt/profolio/frontend/.env.production

# Create new environment file with correct Firebase credentials
echo -e "${GREEN}✨ Creating new environment file with real Firebase credentials...${NC}"

cat > /opt/profolio/frontend/.env.production << 'ENVEOF'
# Authentication mode - Firebase
NEXT_PUBLIC_AUTH_MODE=firebase

# Backend API URL (your server's URL)
NEXT_PUBLIC_API_URL=http://192.168.1.27:3001

# Node environment
NODE_ENV=production

# Firebase configuration - REAL CREDENTIALS
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBLa_EnmkTGbLU9-SVQN23SCfOv6pn7n0Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=profolio-9c8e0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=profolio-9c8e0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=profolio-9c8e0.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345678
ENVEOF

# Set proper ownership and permissions
chown profolio:profolio /opt/profolio/frontend/.env.production
chmod 600 /opt/profolio/frontend/.env.production

echo -e "${GREEN}✅ Environment file created successfully!${NC}"
echo ""

# Verify the configuration
echo -e "${BLUE}📋 Verifying Firebase configuration:${NC}"
if grep -q "AIzaSyBLa_EnmkTGbLU9-SVQN23SCfOv6pn7n0Q" /opt/profolio/frontend/.env.production; then
    echo -e "   ${GREEN}✅ Real Firebase API key detected${NC}"
else
    echo -e "   ${RED}❌ Firebase API key not found${NC}"
fi

if grep -q "profolio-9c8e0" /opt/profolio/frontend/.env.production; then
    echo -e "   ${GREEN}✅ Correct Firebase project ID${NC}"
else
    echo -e "   ${RED}❌ Wrong Firebase project ID${NC}"
fi

if grep -q "NEXT_PUBLIC_AUTH_MODE=firebase" /opt/profolio/frontend/.env.production; then
    echo -e "   ${GREEN}✅ Firebase authentication mode set${NC}"
else
    echo -e "   ${RED}❌ Authentication mode not set to Firebase${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Firebase environment configuration fixed!${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. ${BLUE}Rebuild frontend:${NC} cd /opt/profolio/frontend && sudo -u profolio npm run build"
echo -e "   2. ${BLUE}Restart services:${NC} systemctl restart profolio-frontend"
echo -e "   3. ${BLUE}Test login:${NC} Visit http://${SERVER_IP}:3000 and try Google sign-in"
echo "" 