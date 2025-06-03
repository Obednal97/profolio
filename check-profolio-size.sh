#!/bin/bash

# Profolio Size Analysis Tool
# Quick utility to check current installation size and suggest optimizations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function definitions
info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
error() { echo -e "${RED}❌ $*${NC}"; }

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  📊 PROFOLIO SIZE ANALYZER                   ║"
echo "║                  Space Usage & Optimization                  ║"  
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Profolio is installed
if [ ! -d "/opt/profolio" ]; then
    error "Profolio installation not found in /opt/profolio"
    exit 1
fi

cd /opt/profolio

echo ""
info "📊 CURRENT SIZE BREAKDOWN"
echo "═══════════════════════════════════════════════════════════════"

# Overall sizes
total_size=$(du -sh . 2>/dev/null | cut -f1)
frontend_size=$(du -sh frontend 2>/dev/null | cut -f1)
backend_size=$(du -sh backend 2>/dev/null | cut -f1)
frontend_nm_size=$(du -sh frontend/node_modules 2>/dev/null | cut -f1)
backend_nm_size=$(du -sh backend/node_modules 2>/dev/null | cut -f1)
git_size=$(du -sh .git 2>/dev/null | cut -f1)

echo -e "${WHITE}Total Application:${NC} ${CYAN}$total_size${NC}"
echo -e "${WHITE}├── Frontend:${NC} $frontend_size"
echo -e "${WHITE}├── Backend:${NC} $backend_size"
echo -e "${WHITE}├── Git Repository:${NC} $git_size"
echo -e "${WHITE}├── Frontend node_modules:${NC} ${YELLOW}$frontend_nm_size${NC}"
echo -e "${WHITE}└── Backend node_modules:${NC} ${YELLOW}$backend_nm_size${NC}"

echo ""
info "🔍 TOP 10 LARGEST FRONTEND DEPENDENCIES"
echo "───────────────────────────────────────────────────────────────"
if [ -d "frontend/node_modules" ]; then
    du -sh frontend/node_modules/* 2>/dev/null | sort -hr | head -10 | while read size dir; do
        dep_name=$(basename "$dir")
        echo -e "  ${YELLOW}$size${NC} - $dep_name"
    done
else
    echo "  No frontend node_modules found"
fi

echo ""
info "🔍 TOP 10 LARGEST BACKEND DEPENDENCIES"
echo "───────────────────────────────────────────────────────────────"
if [ -d "backend/node_modules" ]; then
    du -sh backend/node_modules/* 2>/dev/null | sort -hr | head -10 | while read size dir; do
        dep_name=$(basename "$dir")
        echo -e "  ${YELLOW}$size${NC} - $dep_name"
    done
else
    echo "  No backend node_modules found"
fi

# Check for development dependencies
echo ""
info "🔍 DEVELOPMENT DEPENDENCIES ANALYSIS"
echo "───────────────────────────────────────────────────────────────"

# Frontend dev deps analysis
if [ -f "frontend/package.json" ]; then
    frontend_dev_deps=$(node -e "
        try {
            const pkg = require('./frontend/package.json');
            const devDeps = pkg.devDependencies || {};
            console.log(Object.keys(devDeps).join(' '));
        } catch(e) { console.log(''); }
    " 2>/dev/null)
    
    if [ -n "$frontend_dev_deps" ]; then
        echo -e "${YELLOW}Frontend devDependencies found:${NC}"
        for dep in $frontend_dev_deps; do
            if [ -d "frontend/node_modules/$dep" ]; then
                dep_size=$(du -sh "frontend/node_modules/$dep" 2>/dev/null | cut -f1)
                echo -e "  ❌ $dep (${RED}$dep_size${NC}) - Can be removed"
            else
                echo -e "  ✅ $dep - Already removed"
            fi
        done
    else
        echo -e "${GREEN}✅ No frontend devDependencies detected${NC}"
    fi
fi

# Backend dev deps analysis
if [ -f "backend/package.json" ]; then
    backend_dev_deps=$(node -e "
        try {
            const pkg = require('./backend/package.json');
            const devDeps = pkg.devDependencies || {};
            console.log(Object.keys(devDeps).join(' '));
        } catch(e) { console.log(''); }
    " 2>/dev/null)
    
    if [ -n "$backend_dev_deps" ]; then
        echo -e "${YELLOW}Backend devDependencies found:${NC}"
        for dep in $backend_dev_deps; do
            if [ -d "backend/node_modules/$dep" ]; then
                dep_size=$(du -sh "backend/node_modules/$dep" 2>/dev/null | cut -f1)
                echo -e "  ❌ $dep (${RED}$dep_size${NC}) - Can be removed"
            else
                echo -e "  ✅ $dep - Already removed"
            fi
        done
    else
        echo -e "${GREEN}✅ No backend devDependencies detected${NC}"
    fi
fi

# Size optimization recommendations
echo ""
info "💡 OPTIMIZATION RECOMMENDATIONS"
echo "═══════════════════════════════════════════════════════════════"

# Convert size to MB for calculations
total_mb=$(echo "$total_size" | sed 's/[^0-9.]//g' | cut -d'.' -f1)

if [ "$total_mb" -gt 1000 ]; then
    echo -e "${RED}🚨 Large installation detected ($total_size)${NC}"
    echo ""
    echo -e "${CYAN}Available optimization levels in installer:${NC}"
    echo ""
    echo -e "  ${WHITE}1. Safe Optimization (Recommended):${NC}"
    echo -e "     • Removes only actual devDependencies from package.json"
    echo -e "     • Preserves ALL production dependencies"
    echo -e "     • Expected final size: ${GREEN}~600-800MB${NC}"
    echo -e "     • ${GREEN}✅ Guarantees all features work${NC}"
    echo -e "     • Command: ${CYAN}sudo ./install-or-update.sh${NC} (choose Safe when prompted)"
    echo ""
    echo -e "  ${WHITE}2. Aggressive Optimization (Use with caution):${NC}"
    echo -e "     • Removes devDependencies + additional cleanup"
    echo -e "     • Uses Docker-style optimizations"
    echo -e "     • Expected final size: ${GREEN}~400-500MB${NC}"
    echo -e "     • ${YELLOW}⚠️  May affect debugging capabilities${NC}"
    echo -e "     • Command: ${CYAN}sudo ./install-or-update.sh${NC} (choose Aggressive when prompted)"
    echo ""
    echo -e "  ${WHITE}3. Ultra-Aggressive (Manual):${NC}"
    echo -e "     • Available after aggressive optimization"
    echo -e "     • Maximum space reduction techniques"
    echo -e "     • Expected additional savings: ${GREEN}100-200MB${NC}"
    echo -e "     • ${RED}⚠️  Advanced users only${NC}"
    
elif [ "$total_mb" -gt 600 ]; then
    echo -e "${YELLOW}⚠️  Moderate size installation ($total_size)${NC}"
    echo ""
    echo -e "${CYAN}Optimization options:${NC}"
    echo ""
    echo -e "  ${WHITE}Safe Optimization:${NC}"
    echo -e "     Your installation may already be optimized, but you can ensure"
    echo -e "     all devDependencies are removed with safe optimization"
    echo -e "     Command: ${CYAN}sudo ./install-or-update.sh${NC} (rebuild with Safe optimization)"
    echo ""
    echo -e "  ${WHITE}Aggressive Optimization:${NC}"
    echo -e "     Further reduce size with aggressive techniques"
    echo -e "     Expected final size: ${GREEN}~400-500MB${NC}"
    echo -e "     Command: ${CYAN}sudo ./install-or-update.sh${NC} (rebuild with Aggressive optimization)"
    
else
    echo -e "${GREEN}✅ Well-optimized installation ($total_size)${NC}"
    echo ""
    echo -e "${CYAN}Your installation is well-optimized!${NC}"
    echo ""
    echo -e "  ${WHITE}Current size suggests:${NC}"
    if [ "$total_mb" -lt 500 ]; then
        echo -e "     • Likely using ${GREEN}Aggressive optimization${NC}"
        echo -e "     • Excellent space efficiency achieved"
    else
        echo -e "     • Likely using ${GREEN}Safe optimization${NC}"
        echo -e "     • Good balance of size and functionality"
    fi
    echo ""
    echo -e "  ${WHITE}Optional further optimization:${NC}"
    echo -e "     If you want maximum space savings, you can switch to"
    echo -e "     aggressive optimization by rebuilding your installation:"
    echo -e "     Command: ${CYAN}sudo ./install-or-update.sh${NC} (rebuild with Aggressive)"
fi

# Check for specific heavy packages
echo ""
info "🎯 HEAVY PACKAGE ANALYSIS"
echo "───────────────────────────────────────────────────────────────"

heavy_packages=("@next" "firebase" "lucide-react" "@prisma" "next" "typescript" "eslint")
for package in "${heavy_packages[@]}"; do
    frontend_package_size=""
    backend_package_size=""
    
    if [ -d "frontend/node_modules/$package" ]; then
        frontend_package_size=$(du -sh "frontend/node_modules/$package" 2>/dev/null | cut -f1)
    fi
    
    if [ -d "backend/node_modules/$package" ]; then
        backend_package_size=$(du -sh "backend/node_modules/$package" 2>/dev/null | cut -f1)
    fi
    
    if [ -n "$frontend_package_size" ] || [ -n "$backend_package_size" ]; then
        echo -e "  📦 ${WHITE}$package${NC}"
        [ -n "$frontend_package_size" ] && echo -e "     Frontend: $frontend_package_size"
        [ -n "$backend_package_size" ] && echo -e "     Backend: $backend_package_size"
    fi
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}💡 TIP:${NC} Run this script after optimizations to see the improvements!"
echo -e "${WHITE}📚 Documentation:${NC} https://github.com/Obednal97/profolio"
echo "" 