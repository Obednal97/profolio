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

# Check for React Hook warnings - simplified approach
if pnpm run lint 2>&1 | grep -q "react-hooks"; then
    LINT_WARNINGS=$(pnpm run lint 2>&1 | grep -c "react-hooks")
    echo "⚠️  Found $LINT_WARNINGS React Hook warnings - run 'pnpm run lint' to see details"
else
    echo "✅ No React Hook warnings found"
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
    echo ""
    echo "To debug issues:"
    echo "- Backend: cd backend && pnpm run type-check"
    echo "- Frontend: cd frontend && pnpm run type-check"
    echo "- React Hooks: cd frontend && pnpm run lint"
fi 