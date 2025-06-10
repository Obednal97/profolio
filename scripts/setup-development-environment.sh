#!/bin/bash

# Profolio Development Environment Setup Script
# This script sets up a complete development environment for Profolio
# Handles both first-time setup and reuse scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🚀 Profolio Development Setup                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if we're in the project root
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "backend" ]]; then
        error "This script must be run from the Profolio project root directory"
        exit 1
    fi
}

# Create comprehensive root .env file
create_root_env() {
    info "Creating root .env file..."
    
    cat > .env << 'EOF'
# Profolio Development Environment Configuration
# This file contains shared, non-sensitive defaults for both frontend & backend

# === Application Information ===
NEXT_PUBLIC_APP_NAME=Profolio
NEXT_PUBLIC_APP_VERSION=1.11.15
NODE_ENV=development

# === Deployment Configuration ===
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
NEXT_PUBLIC_AUTH_MODE=firebase

# === API Configuration ===
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_API_PROXY=true

# === Feature Flags ===
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
NEXT_PUBLIC_SHOW_LANDING_PAGE=true
NEXT_PUBLIC_ALLOW_REGISTRATION=true
NEXT_PUBLIC_SHOW_BRANDING=true

# === Development Settings ===
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=info

# === External API Keys ===
# NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# === Firebase Configuration ===
# Configure these for Firebase authentication:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
EOF

    success "Created root .env file"
}

# Create frontend .env.local file
create_frontend_env() {
    info "Creating frontend .env.local file..."
    
    mkdir -p frontend
    cat > frontend/.env.local << 'EOF'
# Local development overrides
# This file overrides settings for local development

# === Deployment Configuration ===
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
NEXT_PUBLIC_AUTH_MODE=firebase

# === Development Flags ===
NODE_ENV=development
NEXT_PUBLIC_ENABLE_API_PROXY=false
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=false

# === Firebase Configuration for Development ===
# Configure these for Firebase testing:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_dev_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id
EOF

    success "Created frontend .env.local file"
}

# Create backend .env file
create_backend_env() {
    info "Creating backend .env file..."
    
    mkdir -p backend
    cat > backend/.env << 'EOF'
# Profolio Backend Development Configuration
# Contains database and security settings for development

# === Database Configuration ===
# Update with your local PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/profolio_dev"

# === Security Configuration ===
# These are development-only secrets - change in production
JWT_SECRET="dev-jwt-secret-change-in-production-very-long-secret-key"
API_ENCRYPTION_KEY="dev-encryption-key-change-in-production-32-bytes"

# === Application Configuration ===
PORT=3001
NODE_ENV=development

# === Optional Configuration ===
LOG_LEVEL=info
# MAX_CONNECTIONS=100
EOF

    success "Created backend .env file"
}

# Check for existing environment files
check_existing_env() {
    local has_env=false
    
    if [[ -f ".env" ]]; then
        warn "Root .env file already exists"
        has_env=true
    fi
    
    if [[ -f "frontend/.env.local" ]]; then
        warn "Frontend .env.local file already exists"
        has_env=true
    fi
    
    if [[ -f "backend/.env" ]]; then
        warn "Backend .env file already exists"
        has_env=true
    fi
    
    if [[ "$has_env" == true ]]; then
        echo
        echo -e "${CYAN}What would you like to do?${NC}"
        echo "1) Backup existing files and create new ones"
        echo "2) Skip existing files and only create missing ones"
        echo "3) Overwrite all existing files"
        echo "4) Exit without changes"
        echo
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1)
                backup_existing_env
                return 0
                ;;
            2)
                return 1
                ;;
            3)
                return 0
                ;;
            4)
                info "Exiting without changes"
                exit 0
                ;;
            *)
                error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    fi
    
    return 0
}

# Backup existing environment files
backup_existing_env() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    info "Backing up existing environment files..."
    
    if [[ -f ".env" ]]; then
        cp .env ".env.backup_${timestamp}"
        success "Backed up .env to .env.backup_${timestamp}"
    fi
    
    if [[ -f "frontend/.env.local" ]]; then
        cp frontend/.env.local "frontend/.env.local.backup_${timestamp}"
        success "Backed up frontend/.env.local to frontend/.env.local.backup_${timestamp}"
    fi
    
    if [[ -f "backend/.env" ]]; then
        cp backend/.env "backend/.env.backup_${timestamp}"
        success "Backed up backend/.env to backend/.env.backup_${timestamp}"
    fi
}

# Install dependencies
install_dependencies() {
    info "Installing dependencies..."
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        error "pnpm is not installed. Please install it first:"
        echo "npm install -g pnpm@9.14.4"
        exit 1
    fi
    
    # Install root dependencies
    pnpm install
    success "Installed root dependencies"
    
    # Install frontend dependencies
    cd frontend
    pnpm install
    success "Installed frontend dependencies"
    cd ..
    
    # Install backend dependencies
    cd backend
    pnpm install
    success "Installed backend dependencies"
    cd ..
}

# Check database connection
check_database() {
    info "Checking database setup..."
    
    # Check if PostgreSQL is running
    if ! command -v psql &> /dev/null; then
        warn "PostgreSQL client (psql) not found. Please install PostgreSQL."
        return 1
    fi
    
    # Try to connect to default database
    if psql -c "SELECT version();" &> /dev/null; then
        success "PostgreSQL is accessible"
        
        # Check if development database exists
        if psql -lqt | cut -d \| -f 1 | grep -qw profolio_dev; then
            success "profolio_dev database exists"
        else
            warn "profolio_dev database not found"
            echo "Create it with: createdb profolio_dev"
        fi
    else
        warn "Cannot connect to PostgreSQL. Please ensure it's running and accessible."
        echo "Update the DATABASE_URL in backend/.env with your PostgreSQL credentials"
    fi
}

# Generate Prisma client
generate_prisma() {
    info "Generating Prisma client..."
    
    cd backend
    if [[ -f "prisma/schema.prisma" ]]; then
        pnpm prisma generate
        success "Generated Prisma client"
    else
        warn "Prisma schema not found. Skipping Prisma generation."
    fi
    cd ..
}

# Display setup completion
show_completion() {
    echo
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  🎉 SETUP COMPLETE                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📁 Created Environment Files:${NC}"
    if [[ -f ".env" ]]; then
        echo -e "   ✅ .env (root configuration)"
    fi
    if [[ -f "frontend/.env.local" ]]; then
        echo -e "   ✅ frontend/.env.local (frontend overrides)"
    fi
    if [[ -f "backend/.env" ]]; then
        echo -e "   ✅ backend/.env (backend configuration)"
    fi
    
    echo
    echo -e "${CYAN}🚀 Next Steps:${NC}"
    echo -e "   ${WHITE}1.${NC} Configure your Firebase project (if using Firebase auth)"
    echo -e "   ${WHITE}2.${NC} Update backend/.env with your PostgreSQL credentials"
    echo -e "   ${WHITE}3.${NC} Create the database: ${CYAN}createdb profolio_dev${NC}"
    echo -e "   ${WHITE}4.${NC} Run migrations: ${CYAN}cd backend && pnpm prisma migrate dev${NC}"
    echo -e "   ${WHITE}5.${NC} Start development: ${CYAN}pnpm run dev${NC} (in both frontend and backend)"
    
    echo
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo -e "   ${WHITE}Frontend:${NC} ${CYAN}cd frontend && pnpm run dev${NC}"
    echo -e "   ${WHITE}Backend:${NC}  ${CYAN}cd backend && pnpm run dev${NC}"
    echo -e "   ${WHITE}Database:${NC} ${CYAN}cd backend && pnpm prisma studio${NC}"
    echo -e "   ${WHITE}Lint:${NC}     ${CYAN}pnpm run lint${NC}"
    echo -e "   ${WHITE}Build:${NC}    ${CYAN}pnpm run build${NC}"
    
    echo
    echo -e "${PURPLE}📚 Documentation: https://github.com/Obednal97/profolio${NC}"
}

# Main execution
main() {
    print_banner
    check_project_root
    
    info "Setting up Profolio development environment..."
    echo
    
    # Check for existing environment files
    local create_all=true
    if check_existing_env; then
        create_all=true
    else
        create_all=false
    fi
    
    # Create environment files
    if [[ "$create_all" == true ]] || [[ ! -f ".env" ]]; then
        create_root_env
    fi
    
    if [[ "$create_all" == true ]] || [[ ! -f "frontend/.env.local" ]]; then
        create_frontend_env
    fi
    
    if [[ "$create_all" == true ]] || [[ ! -f "backend/.env" ]]; then
        create_backend_env
    fi
    
    # Install dependencies
    echo
    read -p "Install dependencies with pnpm? (y/N): " install_deps
    if [[ "$install_deps" =~ ^[Yy]$ ]]; then
        install_dependencies
    fi
    
    # Check database
    echo
    check_database
    
    # Generate Prisma client
    if [[ -d "backend" ]]; then
        echo
        generate_prisma
    fi
    
    # Show completion message
    show_completion
}

# Run the script
main "$@" 