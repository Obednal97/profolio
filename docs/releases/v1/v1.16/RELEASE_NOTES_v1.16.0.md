# Release Notes - v1.16.0

**Release Date:** September 6, 2025  
**Version:** 1.16.0  
**Type:** Minor Release - CI/CD & Testing Infrastructure Overhaul

## 🎯 Release Highlights

This release focuses on dramatically improving the development experience and CI/CD pipeline performance. We've reduced CI/CD runtime by **90%** (from 20+ minutes to ~2-3 minutes) and properly configured the monorepo structure for better dependency management.

## 🚀 Key Features

### 1. **Optimized CI/CD Pipeline**
- Reduced CI/CD runtime from 20+ minutes to ~2-3 minutes
- Focused testing on critical paths
- Headless mode by default for all tests
- Minimal browser set for CI environments

### 2. **Testing Infrastructure**
- New automated test environment setup
- Comprehensive troubleshooting guide
- Playwright configuration optimized for CI/CD
- Lighthouse performance testing integration

### 3. **Monorepo Structure**
- Proper pnpm workspace configuration
- Unified dependency management
- Consolidated lockfile (removed individual backend/frontend lockfiles)
- Improved build performance

## 🐛 Bug Fixes

### Critical Fixes
- **Framer Motion Compatibility**: Fixed TypeScript errors with ease animations across all pages
- **Installer Reliability**: Improved rollback mechanism for build failures
- **Security Vulnerability**: Fixed CVE-2025-54798 with tmp package update

### Testing & CI/CD
- Fixed auth test selectors to match actual page elements
- Added proper data-testid attributes for reliable testing
- Fixed Playwright dev server auto-start in CI
- Resolved all TypeScript compilation errors blocking CI

### Build & Configuration
- Added ESLint v9 flat config for backend
- Fixed Prisma client generation in monorepo
- Added missing test scripts to backend
- Fixed CI/CD security scanning permissions

## 🏗️ Infrastructure Improvements

### File Organization
- Created `installer/` directory for secondary installer scripts
- Removed 4 deprecated pages (1,573 lines of obsolete code)
- Removed redundant lockfiles and test scripts
- Cleaned up legacy setup and validation scripts

### Documentation
- Added comprehensive test troubleshooting guide
- Updated testing setup documentation
- Simplified documentation to match current implementation

### Dependencies
- Updated Next.js to 15.5.2
- Added proper workspace configuration
- Consolidated all dependencies at root level

## 📊 Change Statistics

- **Commits**: 20 since v1.15.4
- **Files Changed**: 41
- **Lines Added**: 24,797 (includes test reports and consolidated lockfile)
- **Lines Removed**: 17,311
- **Net Change**: +7,486 lines

## 🔧 Technical Details

### Removed Files
- `frontend/src/app/app/portfolio/page.tsx` (replaced by assetManager)
- `frontend/src/app/app/properties/page.tsx` (replaced by propertyManager)
- `frontend/src/app/app/expenses/import/page.tsx` (orphaned page)
- `frontend/src/app/offline/page.tsx` (handled by NetworkStatus component)
- `backend/pnpm-lock.yaml` (monorepo uses root lockfile)
- `frontend/pnpm-lock.yaml` (monorepo uses root lockfile)
- Various `test_*.sh` scripts (TUI testing complete)

### New Files
- `pnpm-workspace.yaml` - Workspace configuration
- `frontend/playwright.ci.config.ts` - Optimized CI config
- `scripts/run-tests.sh` - Automated test runner
- `scripts/setup-test-environment.sh` - Test environment setup
- `docs/testing/TROUBLESHOOTING.md` - Test troubleshooting guide
- `backend/eslint.config.js` - ESLint v9 configuration

## 💻 For Developers

### Running Tests
```bash
# Setup test environment (first time only)
./scripts/setup-test-environment.sh

# Run all tests
pnpm test:all

# Run tests in headed mode
pnpm test:headed

# Run CI optimized tests
pnpm test:ci

# Run specific test suite
pnpm test:e2e --grep "@security"
```

### Monorepo Commands
```bash
# Install all dependencies (from root)
pnpm install

# Build everything
pnpm build

# Start development servers
pnpm dev

# Start production servers
pnpm start
```

## 🚨 Breaking Changes

None - This release maintains full backward compatibility.

## 📝 Migration Notes

For existing installations:
1. The installer will automatically handle the monorepo structure
2. Old lockfiles will be removed automatically
3. Prisma client will be regenerated during the update

## 🔮 Coming Next

- NextAuth migration from Firebase + custom backend
- Enhanced 2FA with otplib
- Failed password rate limiting
- Performance optimizations for page transitions

## 📦 Installation

### New Installation
```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

### Update Existing Installation
```bash
sudo ./install.sh --version v1.16.0
```

## 🙏 Acknowledgments

Thanks to all contributors who helped identify and fix the CI/CD issues, making the development experience significantly better.

---

**Full Changelog**: https://github.com/Obednal97/profolio/compare/v1.15.4...v1.16.0