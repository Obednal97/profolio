# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release preparation
- Comprehensive security audit and fixes
- Professional documentation suite

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
- **Installation Guide:** [README-INSTALLATION.md](README-INSTALLATION.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security Policy:** [SECURITY.md](SECURITY.md) 