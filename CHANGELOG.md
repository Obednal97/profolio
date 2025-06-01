# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release preparation
- Comprehensive security audit and fixes
- Professional documentation suite

## [1.0.12] - 2025-02-01

### Fixed
- **CRITICAL: Installer Git Strategy**: Fixed divergent branches issue preventing updates after security fixes
- **Git Pull Commands**: Replaced `git pull` with `git fetch + git reset --hard` to handle force-pushed history
- **Update Process**: Installer now successfully updates after git history cleanup from v1.0.10 security fixes
- **Checkout Version Function**: Fixed both main branch updates and version-specific checkouts

### Technical Improvements
- **Divergent Branch Handling**: Installer handles git history rewrites gracefully
- **Force Push Compatibility**: Works correctly after repository history cleanup
- **Git Strategy**: Uses `git reset --hard origin/main` for exact remote matching
- **Rollback Protection**: Maintains automatic rollback functionality during failed updates

### Impact
- **Update Reliability**: Resolves update failures after security fixes were applied
- **Git History Cleanup**: Installer compatible with security-driven history rewrites
- **User Experience**: Smooth updates without manual git configuration

## [1.0.11] - 2025-02-01

### Added
- **Configuration Guide**: Comprehensive `CONFIGURATION_GUIDE.md` with setup instructions
- **Firebase Setup Documentation**: Clear explanations for Firebase configuration in public directory
- **Environment Variables Guide**: Detailed explanation of multiple .env files usage
- **Security Best Practices**: Guidelines for safe configuration management
- **Troubleshooting Guide**: Common issues and solutions for configuration problems

### Fixed
- **SECURITY: Hardcoded API Key**: Removed reintroduced hardcoded Firebase API key from auth.tsx
- **Dynamic Firebase Cleanup**: Implemented pattern-based localStorage cleanup instead of hardcoded keys
- **Gitignore Security**: Restored comprehensive .gitignore rules for sensitive files

### Documentation
- **Setup Checklist**: Step-by-step configuration verification
- **Development Workflow**: Clear instructions for new developer onboarding
- **Multi-environment Support**: Explained different .env files for various environments
- **Firebase Integration**: Proper Firebase web app configuration patterns

### Security Improvements
- **Template-Based Configuration**: Users create own configs from secure templates
- **Enhanced .gitignore**: Comprehensive protection against secret exposure
- **Dynamic Secret Handling**: No hardcoded API keys in source code
- **Configuration Validation**: Clear verification steps for proper setup

### Technical Improvements
- **Monorepo Structure**: Clarified frontend/backend environment separation
- **Firebase Best Practices**: Standard Firebase web app configuration patterns
- **Environment Management**: Proper development vs production configuration handling

## [1.0.10] - 2025-02-01

### 🚨 CRITICAL SECURITY FIX 🚨
- **BREAKING**: Complete removal of exposed Firebase API keys from repository and git history
- **Removed**: Firebase configuration file (`frontend/public/firebase-config.json`) containing exposed Google API key
- **Fixed**: Hardcoded API key in authentication localStorage cleanup
- **Enhanced**: Comprehensive .gitignore rules for all sensitive configuration files
- **Added**: Template-based configuration system (`firebase-config.json.template`)

### Security Improvements
- **Git History Cleanup**: Used `git-filter-repo` to completely remove sensitive files from all 199 commits
- **Force Push Applied**: Cleaned git history pushed to GitHub to eliminate secret exposure
- **Dynamic Secret Handling**: Replaced hardcoded API keys with pattern-based approaches
- **Prevention Measures**: Enhanced .gitignore to prevent future secret exposures

### Documentation
- **Security Fix Report**: Complete documentation of issue resolution (`SECURITY_FIX_REPORT.md`)
- **User Action Required**: Instructions for existing users to rotate Firebase API keys
- **Template Configuration**: Clear guidance for secure configuration setup

### Technical Changes
- **Repository History**: 199 commits processed, sensitive files completely removed
- **Backup Created**: `backup-before-security-fix-20250601-150952` branch for recovery
- **Configuration Security**: Template-based approach for all sensitive configuration files

### ⚠️ **IMMEDIATE ACTION REQUIRED FOR EXISTING USERS**
1. **Rotate Firebase API Key**: Go to Firebase Console and regenerate your API key
2. **Update Configuration**: Create `firebase-config.json` from template with new key
3. **Review Firebase Logs**: Check for any unauthorized usage during exposure period

**Exposure Period**: May 29, 2025 - February 1, 2025 (approximately 2 months)
**GitGuardian Alerts**: Resolved - Google API Key and Generic High Entropy Secret

## [1.0.9] - 2025-02-01

### Fixed
- **Backend Compilation Errors**: Resolved TypeScript compilation issues after pnpm migration
- **Deprecated @types/cron**: Removed deprecated package since cron v4.3.1 provides its own types
- **Missing Prisma Client**: Generated Prisma client with `pnpm prisma:generate` for database types
- **Missing @nestjs/mapped-types**: Added required dependency for DTO inheritance
- **Backend Startup**: Backend now starts successfully with 0 TypeScript errors

### Technical Improvements
- **Complete Backend Functionality**: All API routes properly mapped and functional
- **Database Integration**: Prisma client properly generated with all models and types
- **Dependency Resolution**: Resolved all missing dependencies after package manager migration
- **Type Safety**: Full TypeScript compilation without errors
- **Service Initialization**: All NestJS modules and services load correctly

### Performance
- **Faster Backend Startup**: Improved compilation and initialization times
- **Efficient Dependencies**: pnpm's optimized dependency resolution in effect

## [1.0.8] - 2025-02-01

### Added
- **Package Manager Standardization**: Standardized on pnpm across all projects for improved performance
- **Dependency Cleanup Script**: `cleanup-dependencies.sh` to resolve node_modules conflicts
- **Component Architecture Improvement**: Organized components into logical directories (`cards/`, `modals/`)
- **Enhanced Property Form**: Dynamic address search with manual entry fallback
- **Google Places API Integration**: Enhanced address autocomplete with OpenStreetMap fallback

### Changed
- **Package Manager**: Migrated from npm to pnpm for 40-60% smaller node_modules and faster installs
- **Project Structure**: Reorganized frontend components for better maintainability
  - Moved individual component files to organized directories
  - `src/components/cards/` - Reusable card components
  - `src/components/modals/` - All modal dialogs
- **Dependency Management**: Removed duplicate React/Next.js dependencies from root package.json
- **Address Input System**: Improved property address forms with dual-mode input (search vs manual)

### Fixed
- **Package Manager Conflicts**: Resolved npm/pnpm lock file conflicts in backend
- **Duplicate Dependencies**: Eliminated redundant React dependencies between root and frontend
- **API Key Validation Issues**: Simplified Google Places API key validation to prevent CORS errors
- **Component Import Paths**: Updated all imports to reflect new organized structure

### Technical Improvements
- **40-60% Smaller Dependencies**: pnpm uses hard links to reduce disk usage (~1.5GB → ~800MB)
- **Faster Builds**: pnpm's efficient dependency resolution improves build times
- **Better Architecture**: Separated concerns with organized component structure
- **Improved Development Workflow**: Consistent package manager across all environments

### Security
- **API Key Handling**: Enhanced Google Places API key management with proper validation
- **Environment Isolation**: Better separation between development and production configurations

## [1.0.7] - 2025-02-01

### Added
- **Commit and Push Guide**: Comprehensive pre-commit checklist and standards
- **Release Process Guide**: Detailed release workflow with documentation requirements
- **Feature Documentation**: Guides for automatic rollback and version management
- **Release Notes**: Created missing release notes for v1.0.4, v1.0.5, and v1.0.6

### Changed
- **Documentation Structure**: Reorganized `/docs` folder with clear subdirectories
  - `/docs/processes/` - Development and release processes
  - `/docs/installer/` - Installer documentation (moved from root)
  - `/docs/features/` - Feature guides and tutorials
  - `/docs/releases/` - Version-specific release notes
- **Documentation Standards**: Established consistent formatting and cross-referencing

### Improved
- **Development Workflow**: Clear commit message formats and version update procedures
- **Release Management**: Streamlined release process with templates and checklists
- **Documentation Navigation**: Updated docs/README.md with comprehensive structure guide

### Technical Improvements
- Created standardized documentation templates for consistency
- Established documentation maintenance procedures
- Improved cross-referencing between related documents

## [1.0.6] - 2025-01-31

### Fixed
- **Version Reporting**: Updated all package.json files to correctly show version 1.0.6
- **Installer Banner Spacing**: Fixed text alignment in installer banners for proper centering

### Technical Improvements
- Synchronized version numbers across root, backend, and frontend package.json files
- Improved visual consistency in installer output with properly centered text

## [1.0.5] - 2025-01-31

### Fixed
- **CRITICAL: DOMMatrix SSR Error** - Fixed production build failures caused by PDF.js loading during server-side rendering
- **PDF Parser Browser-Only Loading** - Made PDF.js configuration conditional to only run in browser environment
- **SSR-Safe Dynamic Imports** - Enhanced browser environment guards for PDF-related components

### Technical Improvements
- Added `typeof window` checks to prevent PDF.js from initializing during SSR
- Enhanced `parseBankStatementPDF` function with browser environment validation  
- Improved error handling for server-side rendering scenarios
- Maintained full functionality for client-side PDF processing

### Impact
This release resolves the critical production build error that prevented successful deployments when using the expense import feature. The PDF parsing functionality now works correctly in production while being completely safe during server-side rendering.

## [1.0.4] - 2025-01-31

### Added
- **🚀 Installer v2.0**: Complete overhaul with rollback protection and version control
- **Automatic Rollback**: Git-based restoration with backup fallback on update failures
- **Version-Specific Installation**: Install/update to any specific version (v1.0.3, 1.0.3, main, latest)
- **Manual Rollback Command**: Emergency rollback capability with `--rollback` option
- **Version Management**: List available versions with `--list-versions`
- **Enhanced Update Wizard**: Interactive version selection and rollback options
- **Force Version Support**: Skip version existence checks with `--force-version`

### Improved
- **Production Safety**: Comprehensive failure detection and automatic recovery
- **User Experience**: Enhanced progress indicators and status messages  
- **Error Handling**: Graceful network failure handling and fallback mechanisms
- **Credential Preservation**: Database passwords and API keys maintained across updates
- **Service Recovery**: Automatic service restoration after rollback
- **Version Validation**: Comprehensive version format validation and existence checking

### Technical Features
- **Git-based Rollback**: Commit hash tracking for precise restoration points
- **Filesystem Backup**: Full application backup as rollback fallback
- **Multi-step Verification**: Service status, API connectivity, and frontend accessibility checks
- **Cleanup Management**: Automatic cleanup of old rollback files (keeps 2 most recent)
- **Command Line Interface**: Enhanced argument parsing with comprehensive help system

### Command Line Options
- `--version VERSION` - Install/update to specific version
- `--force-version VERSION` - Force version installation (skip checks)
- `--no-rollback` - Disable automatic rollback protection
- `--list-versions` - Show all available versions
- `--rollback` - Execute manual rollback to previous version
- `--auto` - Unattended installation with defaults
- `--help` - Comprehensive help documentation

## [1.0.3] - 2025-01-31

### Fixed
- **Critical Build Errors**: Resolved DOMMatrix SSR errors in expense import page by implementing dynamic imports
- **API Route Static Generation**: Fixed dynamic server usage errors in API routes preventing production builds
- **PDF Parser SSR Issues**: Prevented PDF.js from being loaded during server-side rendering
- **Yahoo Finance Network Connectivity**: Enhanced error handling for network timeouts and DNS resolution failures

### Technical Improvements
- Added dynamic imports for browser-only components (PDF uploader, transaction review)
- Marked API routes as `dynamic = 'force-dynamic'` to prevent static generation issues
- Improved error handling for market data service failures
- Enhanced loading states for client-side only components

## [1.0.2] - 2025-01-31

### Added
- **Currency Precision System**: Implemented precise currency handling with configurable decimal places
- **Advanced Asset Management**: Enhanced asset creation/editing with better validation and error handling
- **Market Data Integration**: Added new market data controllers and services for real-time price fetching
- **Symbol Population Service**: Automated system for populating and maintaining market symbols
- **Adaptive Rate Limiting**: Intelligent Yahoo Finance API rate limiting with exponential backoff
- **Time-based Price Filtering**: Optimized price updates to reduce unnecessary API calls
- **Enhanced Money Utilities**: Comprehensive currency conversion and formatting utilities
- **Asset Performance Tracking**: Real-time asset performance calculations and portfolio analytics

### Improved
- **Asset Manager UI**: Complete redesign with better form validation, loading states, and error handling
- **Market Data Widget**: Replaced hardcoded values with dynamic real-time market data
- **Database Schema**: Enhanced precision for financial values and added new asset tracking fields
- **Yahoo Finance Service**: Improved error handling, rate limiting, and data accuracy
- **Price Sync Service**: Optimized background price synchronization with intelligent filtering
- **Authentication System**: Enhanced JWT handling and user profile management
- **Asset Card Components**: Better display of asset information with proper formatting
- **Currency Handling**: Consistent currency formatting across all components

### Fixed
- **Currency Precision Issues**: Resolved floating-point precision errors in financial calculations
- **Market Data Widget Hardcoded Values**: Now uses real market data instead of static values
- **Yahoo Finance Rate Limiting**: Implemented proper rate limiting to prevent API failures
- **Asset Value Calculations**: Fixed percentage calculations and portfolio performance metrics
- **Database Constraints**: Added proper validation and constraints for financial data
- **Frontend Package Dependencies**: Updated and optimized package.json dependencies
- **Asset Modal Validation**: Improved form validation and error messaging

### Security
- **Enhanced JWT Authentication**: Improved JWT token handling and validation
- **Input Sanitization**: Added better validation for user inputs and financial data
- **API Security**: Enhanced security measures for market data endpoints

### Performance
- **Optimized API Calls**: Reduced unnecessary Yahoo Finance API requests through intelligent caching
- **Database Query Optimization**: Improved database query performance for asset operations
- **Frontend Bundle Size**: Optimized frontend dependencies reducing bundle size
- **Real-time Updates**: Efficient real-time market data updates without overloading APIs

### Technical Debt
- **Code Organization**: Restructured components and services for better maintainability
- **Type Safety**: Enhanced TypeScript types for better development experience
- **Error Handling**: Comprehensive error handling across all services
- **Documentation**: Improved inline documentation and code comments

## [1.0.1] - 2024-12-29

### 🔧 **Critical Bug Fixes**

#### **Fixed**
- **CRITICAL: MDX React Context Error** - Resolved `r.createContext is not a function` build failure
  - Fixed conflicting Next.js configuration files (removed outdated `next.config.js`)
  - Upgraded MDX configuration from v2 to v3 syntax
  - Added required `mdx-components.tsx` file for MDX v3 compatibility
  - Added proper TypeScript declarations for `.mdx` file imports
  - Fixed all policy-hub pages with unique component names and proper styling

- **Installer Reliability** - Multiple installer improvements
  - Enhanced error handling and reporting in build process
  - Improved credential preservation logic during repairs
  - Added dynamic completion banners (INSTALLATION/UPDATE/REPAIR COMPLETE)
  - Fixed 4-step verification system with proper error tracking

- **Frontend Build Process** - Complete resolution of build failures
  - Resolved empty MDX files causing component import errors
  - Fixed duplicate React component names in policy-hub pages
  - Added responsive styling containers for all policy pages
  - Implemented proper MDX v3 component rendering

#### **Added**
- **Complete Policy Documentation** - All policy pages now have full content
  - Acceptable Use Policy (291 lines)
  - Terms of Service (297 lines)
  - Privacy Policy (223 lines)
  - Cookie Policy (269 lines)
  - Community Guidelines (319 lines)

- **Enhanced MDX Support** - Professional documentation rendering
  - Custom styled MDX components with dark mode support
  - Responsive typography and layout for policy pages
  - Proper table, code, and content formatting
  - Accessibility improvements for documentation

#### **Technical Improvements**
- **Configuration Management** - Cleaned up conflicting configurations
  - Unified Next.js configuration with proper MDX v3 setup
  - Added TypeScript support for MDX imports
  - Improved build performance and reliability

- **Component Architecture** - Better React component organization
  - Fixed component naming conflicts across policy pages
  - Added proper styling containers and responsive layouts
  - Enhanced component reusability and maintainability

### 🏆 **Impact**
This release resolves the critical installer failure that prevented successful deployments. The installer now consistently completes all build steps and properly starts services.

**Before v1.0.1**: Installer failed at frontend build step with React context errors  
**After v1.0.1**: Complete successful installation with working policy pages and enhanced documentation

## [1.0.0] - 2024-12-28

### 🚀 **Initial Public Release**

#### **Added**
- **One-Command Installation** - Proxmox community standard installer
- **Smart Install/Update System** - Detects existing installations automatically
- **Professional Portfolio Management** - Multi-asset support (stocks, crypto, real estate)
- **Real-Time Market Data** - Trading 212 API integration
- **Demo Mode** - Safe API key testing with localStorage-only storage
- **Modern Web Stack** - NestJS backend + Next.js frontend + TypeScript
- **Security Features** - AES-256-GCM encryption, JWT auth, input validation
- **Self-Hosted Focus** - Complete data privacy and control
- **Proxmox LXC Ready** - Optimized for Proxmox deployments
- **Comprehensive Documentation** - Installation, development, contributing guides

#### **GitHub Repository Features**
- **Professional Issue Templates** - Bug reports, feature requests, questions
- **Automated CI/CD Workflows** - Testing, security scanning, releases
- **Community Guidelines** - Contributing, security policy, code of conduct
- **Documentation Suite** - Complete GitHub setup guides and references
- **Security Scanning** - CodeQL analysis, Dependabot, secret scanning

#### **Installation & Deployment**
- **SSH Configuration** - Comprehensive SSH setup with key management
- **Network Configuration** - DHCP and static IP support
- **Security Hardening** - Encrypted secrets, proper user permissions
- **Backup Management** - Automatic backups with retention policies
- **Service Management** - Systemd integration for reliability

#### **Security**
- **API Key Encryption** - AES-256-GCM encryption for sensitive data
- **JWT Authentication** - Secure session management
- **Input Validation** - Comprehensive data sanitization
- **SQL Injection Protection** - Prisma ORM with parameterized queries
- **CORS Protection** - Configured cross-origin resource sharing
- **Environment Security** - Secrets stored in environment variables

#### **Portfolio Features**
- **Asset Manager** - Track stocks, ETFs, crypto, real estate, bonds
- **Performance Analytics** - Portfolio performance tracking and metrics
- **Risk Analysis** - Diversification and risk assessment tools
- **Expense Manager** - Personal finance and expense tracking
- **Property Manager** - Real estate portfolio management
- **P&L Analysis** - Detailed profit/loss reporting

#### **Technical Features**
- **TypeScript** - Full type safety across frontend and backend
- **Responsive Design** - Mobile-first design that works on all devices
- **Dark Mode** - Professional dark theme interface
- **Interactive Charts** - Real-time portfolio visualization
- **Health Checks** - Built-in system monitoring and diagnostics

---

## 📋 **Version History Guidelines**

### **Version Numbers**
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### **Change Categories**
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

### **Release Process**
1. Update this CHANGELOG.md
2. Create GitHub Release with version tag
3. Update version in package.json files
4. Test installation process
5. Announce in community channels

---

## 🔗 **Links**
- **GitHub Releases:** [View all releases](https://github.com/Obednal97/profolio/releases)
- **Release Notes:** [docs/releases/](docs/releases/)
- **Installation Guide:** [README-INSTALLATION.md](README-INSTALLATION.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security Policy:** [SECURITY.md](SECURITY.md) 