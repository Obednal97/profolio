#!/bin/bash

# Profolio Development Environment Setup Script
# Version: 1.0
# Usage: ./scripts/setup-dev-environment.sh

set -e  # Exit on any error

echo "🚀 Setting up Profolio development environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the project root
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Step 1: Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
if [[ $NODE_VERSION == "not found" ]]; then
    print_error "Node.js is not installed. Please install Node.js v18.17.0 or later"
    print_info "Download from: https://nodejs.org/"
    exit 1
fi

MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
MINOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f2)

if [ "$MAJOR_VERSION" -lt 18 ] || ([ "$MAJOR_VERSION" -eq 18 ] && [ "$MINOR_VERSION" -lt 17 ]); then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to v18.17.0 or later"
    exit 1
fi

print_status "Node.js version $NODE_VERSION is compatible"

# Step 2: Install pnpm if not present
print_info "Checking pnpm installation..."
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found. Installing pnpm@9.14.4..."
    npm install -g pnpm@9.14.4
else
    PNPM_VERSION=$(pnpm --version)
    if [[ $PNPM_VERSION != "9.14.4" ]]; then
        print_warning "pnpm version $PNPM_VERSION found, but project requires 9.14.4. Updating..."
        npm install -g pnpm@9.14.4
    fi
fi

print_status "pnpm $(pnpm --version) is ready"

# Step 3: Backend setup
print_info "Setting up backend..."
cd backend

# Install backend dependencies
print_info "Installing backend dependencies..."
pnpm install

# Generate Prisma client
print_info "Generating Prisma client..."
pnpm prisma generate

# Check for .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning "Creating .env from .env.example template"
        cp .env.example .env
        print_info "Please edit backend/.env with your database and API settings"
    else
        print_warning "No .env.example found. You'll need to create backend/.env manually"
    fi
else
    print_status "Backend .env file already exists"
fi

# Verify backend setup
print_info "Verifying backend setup..."
if pnpm run type-check > /dev/null 2>&1; then
    print_status "Backend TypeScript compilation successful"
else
    print_error "Backend TypeScript compilation failed. Check for missing environment variables."
fi

cd ..

# Step 4: Frontend setup
print_info "Setting up frontend..."
cd frontend

# Install frontend dependencies
print_info "Installing frontend dependencies..."
pnpm install

# Verify frontend build
print_info "Verifying frontend build..."
if pnpm run type-check > /dev/null 2>&1; then
    print_status "Frontend TypeScript compilation successful"
else
    print_warning "Frontend TypeScript compilation has warnings. Run 'pnpm run type-check' to see details."
fi

# Check linting
print_info "Checking ESLint configuration..."
if pnpm run lint > /dev/null 2>&1; then
    print_status "ESLint passes with no warnings"
else
    print_warning "ESLint found issues. Run 'pnpm run lint' to see details and fix React Hook warnings."
fi

cd ..

# Step 5: Git hooks setup (if husky is configured)
if [ -f "frontend/package.json" ] && grep -q "husky" frontend/package.json; then
    print_info "Setting up Git hooks..."
    cd frontend
    npx husky install
    cd ..
    print_status "Git hooks configured"
fi

# Step 6: Create helpful scripts directory if it doesn't exist
mkdir -p scripts

# Create environment validation script
cat > scripts/validate-environment.sh << 'EOF'
#!/bin/bash

# Environment Validation Script for Profolio
echo "🔍 Validating Profolio development environment..."

ERRORS=0

# Check pnpm version
PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "not found")
if [[ $PNPM_VERSION != "9.14.4" ]]; then
    echo "❌ pnpm version should be 9.14.4, found: $PNPM_VERSION"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ pnpm version correct: $PNPM_VERSION"
fi

# Check backend
echo "📦 Checking backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "❌ Backend .env file missing"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Backend .env file exists"
fi

if pnpm run type-check > /dev/null 2>&1; then
    echo "✅ Backend TypeScript compilation successful"
else
    echo "❌ Backend TypeScript compilation failed"
    ERRORS=$((ERRORS + 1))
fi

# Check if Prisma client is generated
if pnpm prisma generate > /dev/null 2>&1; then
    echo "✅ Prisma client generation successful"
else
    echo "❌ Prisma client generation failed"
    ERRORS=$((ERRORS + 1))
fi

cd ../frontend

# Check frontend
echo "🎨 Checking frontend..."

if pnpm run type-check > /dev/null 2>&1; then
    echo "✅ Frontend TypeScript compilation successful"
else
    echo "❌ Frontend TypeScript compilation failed"
    ERRORS=$((ERRORS + 1))
fi

LINT_WARNINGS=$(pnpm run lint 2>&1 | grep -c "react-hooks" || echo "0")
if [[ $LINT_WARNINGS -eq 0 ]]; then
    echo "✅ No React Hook warnings found"
else
    echo "⚠️  Found $LINT_WARNINGS React Hook warnings - run 'pnpm run lint' to see details"
fi

cd ..

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo "🎉 Environment validation successful! You're ready to develop."
    echo ""
    echo "Next steps:"
    echo "1. Start backend: cd backend && pnpm run start:dev"
    echo "2. Start frontend: cd frontend && pnpm dev"
    echo "3. Open http://localhost:3000"
else
    echo "❌ Found $ERRORS error(s). Please fix them before proceeding."
fi
EOF

chmod +x scripts/validate-environment.sh

# Final summary
echo ""
echo "=================================================="
print_status "Profolio development environment setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Node.js $(node --version) verified"
echo "   ✅ pnpm $(pnpm --version) installed"
echo "   ✅ Backend dependencies installed"
echo "   ✅ Prisma client generated"
echo "   ✅ Frontend dependencies installed"
echo "   ✅ Environment validation script created"
echo ""
echo "🚀 To start developing:"
echo "   1. cd backend && pnpm run start:dev"
echo "   2. cd frontend && pnpm dev (in a new terminal)"
echo "   3. Open http://localhost:3000"
echo ""
echo "🔍 To validate your setup anytime:"
echo "   ./scripts/validate-environment.sh"
echo ""
print_info "If you encounter issues, check docs/development/TEAM_DEVELOPMENT_SETUP.md"
print_info "Happy coding! 🎉" 