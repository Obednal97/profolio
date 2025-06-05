#!/bin/bash

# Profolio Development Tools Script
# Provides common development automation tasks
# Usage: ./scripts/dev-tools.sh <command>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📝 $1${NC}"
}

print_header() {
    echo -e "${BLUE}🔧 $1${NC}"
    echo "======================================"
}

# Check if we're in project root
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

show_help() {
    echo "Profolio Development Tools"
    echo ""
    echo "Usage: ./scripts/dev-tools.sh <command>"
    echo ""
    echo "Commands:"
    echo "  setup           - Complete development environment setup"
    echo "  validate        - Validate entire environment"
    echo "  clean           - Clean all build artifacts and caches"
    echo "  fresh-install   - Clean install of all dependencies"
    echo "  check-deps      - Check for outdated dependencies"
    echo "  check-security  - Run security audit on dependencies"
    echo "  fix-lint        - Fix all linting issues automatically"
    echo "  pre-commit      - Run pre-commit checks (type-check, lint, build)"
    echo "  db-reset        - Reset database to clean state (dev only)"
    echo "  update-versions - Update all package versions to match root"
    echo "  release         - Interactive release preparation"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev-tools.sh setup"
    echo "  ./scripts/dev-tools.sh validate"
    echo "  ./scripts/dev-tools.sh pre-commit"
}

setup_environment() {
    print_header "Setting up development environment"
    ./scripts/setup-dev-environment.sh
}

validate_environment() {
    print_header "Validating environment"
    ./scripts/validate-environment.sh
}

clean_all() {
    print_header "Cleaning all build artifacts and caches"
    
    print_info "Cleaning frontend..."
    cd frontend
    rm -rf .next
    rm -rf node_modules/.cache
    cd ..
    
    print_info "Cleaning backend..."
    cd backend
    rm -rf dist
    rm -rf node_modules/.cache
    cd ..
    
    print_status "All build artifacts cleaned"
}

fresh_install() {
    print_header "Fresh installation of all dependencies"
    
    print_warning "This will delete all node_modules and reinstall everything"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi
    
    print_info "Removing all node_modules..."
    rm -rf node_modules
    rm -rf frontend/node_modules
    rm -rf backend/node_modules
    
    print_info "Installing root dependencies..."
    pnpm install
    
    print_info "Installing frontend dependencies..."
    cd frontend && pnpm install && cd ..
    
    print_info "Installing backend dependencies..."
    cd backend && pnpm install && cd ..
    
    print_info "Generating Prisma client..."
    cd backend && pnpm prisma generate && cd ..
    
    print_status "Fresh installation completed"
}

check_dependencies() {
    print_header "Checking for outdated dependencies"
    
    print_info "Checking root dependencies..."
    pnpm outdated
    
    print_info "Checking frontend dependencies..."
    cd frontend && pnpm outdated && cd ..
    
    print_info "Checking backend dependencies..."
    cd backend && pnpm outdated && cd ..
}

check_security() {
    print_header "Running security audit"
    
    print_info "Auditing root dependencies..."
    pnpm audit
    
    print_info "Auditing frontend dependencies..."
    cd frontend && pnpm audit && cd ..
    
    print_info "Auditing backend dependencies..."
    cd backend && pnpm audit && cd ..
}

fix_lint() {
    print_header "Fixing linting issues"
    
    print_info "Fixing frontend linting..."
    cd frontend
    pnpm run lint || print_warning "Some frontend lint issues couldn't be auto-fixed"
    cd ..
    
    print_info "Fixing backend linting..."
    cd backend
    pnpm run lint || print_warning "Some backend lint issues couldn't be auto-fixed"
    cd ..
    
    print_status "Linting completed"
}

pre_commit_checks() {
    print_header "Running pre-commit checks"
    
    print_info "Running type checks..."
    npm run type-check
    
    print_info "Running linting..."
    npm run lint
    
    print_info "Testing builds..."
    npm run build
    
    print_status "All pre-commit checks passed!"
}

db_reset() {
    print_header "Resetting database (development only)"
    
    print_warning "This will delete all data in your development database"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi
    
    cd backend
    pnpm prisma migrate reset --force
    cd ..
    
    print_status "Database reset completed"
}

update_versions() {
    print_header "Updating package versions to match root"
    
    ROOT_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
    print_info "Root version: $ROOT_VERSION"
    
    # Update frontend version
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$ROOT_VERSION\"/" frontend/package.json && rm frontend/package.json.bak
    print_status "Updated frontend/package.json to $ROOT_VERSION"
    
    # Update backend version
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$ROOT_VERSION\"/" backend/package.json && rm backend/package.json.bak
    print_status "Updated backend/package.json to $ROOT_VERSION"
}

interactive_release() {
    print_header "Interactive release preparation"
    
    echo "Current version info:"
    grep '"version"' package.json backend/package.json frontend/package.json
    echo ""
    
    read -p "Enter new version (e.g., 1.10.1): " NEW_VERSION
    
    if [ -z "$NEW_VERSION" ]; then
        print_error "Version cannot be empty"
        exit 1
    fi
    
    print_info "Preparing release v$NEW_VERSION..."
    npm run prepare-release "$NEW_VERSION"
}

# Main command handling
case "$1" in
    setup)
        setup_environment
        ;;
    validate)
        validate_environment
        ;;
    clean)
        clean_all
        ;;
    fresh-install)
        fresh_install
        ;;
    check-deps)
        check_dependencies
        ;;
    check-security)
        check_security
        ;;
    fix-lint)
        fix_lint
        ;;
    pre-commit)
        pre_commit_checks
        ;;
    db-reset)
        db_reset
        ;;
    update-versions)
        update_versions
        ;;
    release)
        interactive_release
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 