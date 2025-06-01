#!/bin/bash

echo "🧹 Cleaning up node_modules and package manager conflicts..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm globally..."
    npm install -g pnpm@9.14.4
fi

echo "🗑️  Removing all node_modules directories..."
rm -rf node_modules
rm -rf frontend/node_modules  
rm -rf backend/node_modules

echo "🗑️  Removing conflicting lock files..."
rm -f package-lock.json
rm -f frontend/package-lock.json
rm -f backend/package-lock.json

echo "📦 Installing dependencies with pnpm..."
echo ""

# Install backend dependencies
echo "⚙️  Installing backend dependencies..."
cd backend
pnpm install
cd ..

# Install frontend dependencies  
echo "🎨 Installing frontend dependencies..."
cd frontend
pnpm install
cd ..

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 New node_modules sizes:"
du -sh */node_modules 2>/dev/null || echo "All dependencies installed with pnpm efficiency!"
echo ""
echo "🚀 You can now run:"
echo "   pnpm dev:backend   # Start backend"
echo "   pnpm dev:frontend  # Start frontend" 