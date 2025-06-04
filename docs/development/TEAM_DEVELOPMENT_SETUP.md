# Team Development Setup Guide
**Profolio Enterprise-Grade Development Environment**

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Active for pnpm Migration & React Hook Optimization

---

## 📋 **Overview**

This guide ensures all team members can effectively work with Profolio's development environment, particularly after the pnpm migration and React Hook optimizations. Follow this guide to set up a consistent, optimized development workflow.

**🚨 CRITICAL**: This project uses **pnpm exclusively**. Do not use npm or yarn.

---

## 🚀 **Quick Start (5 Minutes)**

### **Prerequisites Check**
```bash
# Check Node.js version (required: v18.17.0 or later)
node --version

# Check if pnpm is installed
pnpm --version

# Check Git configuration
git config --global user.name
git config --global user.email
```

### **One-Command Setup**
```bash
# Clone and setup everything
git clone <repository-url>
cd profolio
chmod +x scripts/setup-dev-environment.sh
./scripts/setup-dev-environment.sh
```

---

## 🛠️ **Detailed Setup Instructions**

### **Step 1: Install pnpm (MANDATORY)**
```bash
# Install pnpm globally (required version: 9.14.4)
npm install -g pnpm@9.14.4

# Verify installation
pnpm --version
# Should output: 9.14.4
```

### **Step 2: Clone Repository**
```bash
git clone <repository-url>
cd profolio

# Verify you're on the correct branch
git branch
# Should show: * main (or current development branch)
```

### **Step 3: Backend Setup**
```bash
cd backend

# Install dependencies (uses pnpm-lock.yaml)
pnpm install

# Generate Prisma client (CRITICAL)
pnpm prisma generate

# Verify database models are accessible
pnpm run type-check

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # or your preferred editor
```

### **Step 4: Frontend Setup**
```bash
cd ../frontend

# Install dependencies (uses pnpm-lock.yaml)
pnpm install

# Verify build works
pnpm run build

# Run type checking
pnpm run type-check

# Run linting (should show no React Hook warnings)
pnpm run lint
```

### **Step 5: Environment Validation**
```bash
# Run the validation script
chmod +x scripts/validate-environment.sh
./scripts/validate-environment.sh
```

---

## ⚙️ **IDE Configuration**

### **VS Code Setup (Recommended)**

#### **Required Extensions**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "Prisma.prisma",
    "ms-vscode.vscode-json"
  ]
}
```

#### **VS Code Settings**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "npm.packageManager": "pnpm",
  "typescript.npmLocation": "pnpm"
}
```

#### **Workspace Settings**
Create `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "./frontend/node_modules/typescript/lib",
  "eslint.workingDirectories": ["frontend"],
  "prisma.schemaPath": "./backend/prisma/schema.prisma"
}
```

---

## 🏃 **Development Workflow**

### **Daily Development Commands**
```bash
# Start backend (from backend directory)
cd backend && pnpm run start:dev

# Start frontend (from frontend directory - new terminal)
cd frontend && pnpm dev

# Run tests (if available)
pnpm test

# Check for issues before committing
pnpm run lint
pnpm run type-check
pnpm run build
```

### **Git Workflow**
```bash
# Before starting work
git pull origin main
pnpm install  # Re-sync dependencies

# Before committing (MANDATORY)
pnpm run lint          # Fix any linting issues
pnpm run type-check    # Fix TypeScript errors
pnpm run build         # Ensure build succeeds

# Commit changes
git add .
git commit -m "feat: your feature description"
git push origin feature-branch
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Property 'user' does not exist on type 'PrismaClient'"**
```bash
# Solution: Regenerate Prisma client
cd backend
pnpm prisma generate

# Verify fix
pnpm run type-check
```

### **Issue 2: Package Lock File Conflicts**
```bash
# DO NOT commit package-lock.json or yarn.lock
git rm package-lock.json yarn.lock
echo "package-lock.json" >> .gitignore
echo "yarn.lock" >> .gitignore

# Use only pnpm-lock.yaml
pnpm install
```

### **Issue 3: React Hook Dependency Warnings**
```bash
# Run ESLint to identify issues
pnpm run lint

# Fix missing dependencies in useEffect, useCallback, useMemo
# Example fix:
# useEffect(() => { ... }, [dependency1, dependency2])
```

### **Issue 4: API Proxy Errors (Cannot find module './835.js')**
```bash
# Clear Next.js cache and rebuild
rm -rf .next
pnpm run build

# If still failing, check for corrupted dependencies
pnpm store status
pnpm install --force  # Last resort
```

### **Issue 5: Environment Variables Not Loading**
```bash
# Check .env file exists and has correct format
cat .env

# Verify required variables are set:
# - JWT_SECRET
# - API_ENCRYPTION_KEY  
# - NODE_ENV
# - PORT
# - DATABASE_URL
```

---

## 📊 **Environment Validation Checklist**

### **Backend Validation**
- [ ] `pnpm --version` returns 9.14.4
- [ ] `pnpm install` completes without errors
- [ ] `pnpm prisma generate` succeeds
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run start:dev` starts server on localhost:3001
- [ ] Database connection works
- [ ] JWT_SECRET and API_ENCRYPTION_KEY are set

### **Frontend Validation**
- [ ] `pnpm install` completes without errors
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` shows 0 warnings
- [ ] `pnpm run build` succeeds
- [ ] `pnpm dev` starts on localhost:3000
- [ ] API proxy routes work (no 500 errors)

### **Integration Validation**
- [ ] Frontend can reach backend API
- [ ] Authentication flow works
- [ ] Database queries execute successfully
- [ ] No React Hook dependency warnings
- [ ] Hot reload works in development

---

## 🔧 **Scripts Reference**

### **Backend Scripts**
```bash
pnpm run start:dev      # Start development server
pnpm run build          # Build for production  
pnpm run type-check     # TypeScript validation
pnpm prisma generate    # Regenerate database client
pnpm prisma studio      # Open database GUI
pnpm prisma db push     # Push schema changes
```

### **Frontend Scripts**
```bash
pnpm dev               # Start development server
pnpm run build         # Build for production
pnpm run lint          # Run ESLint (fix React Hook warnings)
pnpm run type-check    # TypeScript validation
pnpm run build:analyze # Analyze bundle size
```

---

## 🧪 **Testing Guidelines**

### **Pre-Commit Testing**
```bash
# MANDATORY before every commit
cd backend && pnpm run type-check
cd frontend && pnpm run lint && pnpm run type-check && pnpm run build

# Verify app functionality
# 1. Start both backend and frontend
# 2. Open localhost:3000
# 3. Check browser console for errors
# 4. Test authentication flow
# 5. Verify API endpoints respond correctly
```

### **Performance Testing**
```bash
# Check React Hook optimization effectiveness
# 1. Open React DevTools Profiler
# 2. Interact with components
# 3. Verify no excessive re-renders
# 4. Check for memory leaks

# Network requests validation
# 1. Open browser Network tab
# 2. Ensure no excessive API calls
# 3. Verify no failed requests (except expected 401s)
```

---

## 📚 **Team Resources**

### **Documentation Links**
- [Code Quality Checklist](../processes/CODE_QUALITY_CHECKLIST.md)
- [Package Manager Migration Guide](PACKAGE_MANAGER_MIGRATION.md)
- [React Hook Optimization Guide](../performance/REACT_HOOK_OPTIMIZATION.md)
- [API Proxy Architecture](../architecture/API_PROXY_ARCHITECTURE.md)

### **Quick Reference Commands**
```bash
# Emergency fixes
pnpm install --force           # Fix corrupted dependencies
rm -rf .next && pnpm run build # Fix Next.js bundling issues
pnpm prisma generate           # Fix database model access

# Development helpers
pnpm run lint --fix           # Auto-fix ESLint issues
pnpm run build:analyze        # Check bundle size
git clean -fd                 # Clean untracked files
```

---

## 🆘 **Getting Help**

### **Internal Resources**
- **Package Manager Issues**: See [PACKAGE_MANAGER_MIGRATION.md](PACKAGE_MANAGER_MIGRATION.md)
- **Performance Questions**: Review React DevTools Profiler results
- **API Issues**: Check backend logs and API proxy configuration
- **Database Problems**: Verify Prisma client generation
- **Build Failures**: Check TypeScript and ESLint output

### **Escalation Path**
1. **Self-Debug**: Use validation scripts and common issues guide
2. **Team Chat**: Ask in development channel with error details
3. **Senior Developer**: For architecture or complex issues
4. **Tech Lead**: For deployment or infrastructure problems

### **Information to Include When Asking for Help**
```bash
# Environment info
node --version && pnpm --version
git branch && git status

# Error reproduction
pnpm run lint > lint-output.txt
pnpm run type-check > type-check-output.txt
pnpm run build > build-output.txt

# Package status
pnpm list --depth=0
pnpm store status
```

---

## 🔄 **Regular Maintenance**

### **Weekly Tasks**
- [ ] Update dependencies: `pnpm update`
- [ ] Clean node_modules: `rm -rf node_modules && pnpm install`
- [ ] Regenerate Prisma: `pnpm prisma generate`
- [ ] Check for security issues: `pnpm audit`

### **Monthly Tasks**
- [ ] Review bundle size: `pnpm run build:analyze`
- [ ] Update IDE extensions
- [ ] Review and update this documentation
- [ ] Performance profiling with React DevTools

---

**🚨 CRITICAL REMINDERS**:
1. **Always use pnpm** - never npm or yarn
2. **Run linting before commits** - fixes React Hook warnings
3. **Regenerate Prisma client** after database changes
4. **Test both frontend and backend** before pushing
5. **Use API proxies** - never direct backend calls from frontend

**📞 Need Help?** Check the troubleshooting section or contact the development team. 