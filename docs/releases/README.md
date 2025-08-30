# Release Notes Directory

This directory contains comprehensive release notes for all versions of Profolio, organized by major and minor version series.

## 📁 Directory Structure

```
docs/releases/
└── v1/                         # Major version 1.x.x
    ├── v1.0/                   # Minor version series 1.0.x
    │   ├── RELEASE_NOTES_v1.0.0.md
    │   ├── RELEASE_NOTES_v1.0.1.md
    │   ├── RELEASE_NOTES_v1.0.2.md
    │   ├── ...
    │   └── RELEASE_NOTES_v1.0.12.md
    ├── v1.1/                   # Minor version series 1.1.x
    │   └── RELEASE_NOTES_v1.1.0.md
    ├── v1.2/                   # Minor version series 1.2.x
    │   ├── RELEASE_NOTES_v1.2.0.md
    │   ├── RELEASE_NOTES_v1.2.1.md
    │   └── RELEASE_NOTES_v1.2.3.md
    └── v1.3/                   # Minor version series 1.3.x
        └── RELEASE_NOTES_v1.3.0.md
```

Future major versions (v2, v3, etc.) will follow the same pattern.

## 🎯 Release Notes Content

Each release notes file contains:

- **🎯 Release Highlights** - Key improvements and changes
- **✨ New Features** - New functionality with clear benefits
- **🐛 Critical Bug Fixes** - Important fixes with technical details
- **🎨 UI/UX Improvements** - User experience enhancements
- **🔧 Technical Improvements** - Under-the-hood improvements
- **🛡️ Security & Compatibility** - Security and compatibility updates
- **📚 Documentation** - Documentation changes
- **🚀 Performance** - Performance improvements
- **🔄 Migration Guide** - Breaking changes and upgrade steps
- **📦 Installation & Updates** - Installation commands
- **🙏 Acknowledgments** - Contributors and community thanks
- **📊 Release Statistics** - Commit counts, files changed, etc.
- **🔗 Related Resources** - Links to GitHub, changelog, etc.

## 📋 Latest Releases

### Current Stable: v1.13.1
- **Released**: 2025-06-12
- **Highlights**: Component architecture planning (93% file size reduction roadmap), Apple Liquid Glass design system, modern GlassCard/GlassModal components
- **Release Notes**: [v1.13.1](./v1/v1.13/RELEASE_NOTES_v1.13.1.md)
- **GitHub Release**: [v1.13.1 on GitHub](https://github.com/Obednal97/profolio/releases/tag/v1.13.1)

### Previous Stable: v1.13.0
- **Released**: 2025-06-11
- **Highlights**: Technical debt cleanup, complete removal of inappropriate mockApi usage, enhanced API patterns
- **Release Notes**: [v1.13.0](./v1/v1.13/RELEASE_NOTES_v1.13.0.md)
- **GitHub Release**: [v1.13.0 on GitHub](https://github.com/Obednal97/profolio/releases/tag/v1.13.0)

## 📝 Version History Notes

Some release notes may be missing for certain versions due to:
- Early development releases (v1.0.0, v1.0.1) before formal documentation
- Hotfix releases that were superseded quickly
- Internal testing versions

Available version series:
- **v1.0.x**: v1.0.2 through v1.0.11 (with some gaps)
- **v1.1.x**: v1.1.0
- **v1.2.x**: v1.2.0, v1.2.1, v1.2.3
- **v1.3.x**: v1.3.0
- **v1.4.x**: v1.4.0, v1.4.1
- **v1.5.x**: v1.5.0
- **v1.6.x**: v1.6.0
- **v1.7.x**: v1.7.0
- **v1.8.x**: v1.8.0 through v1.8.8
- **v1.9.x**: v1.9.0, v1.9.1
- **v1.10.x**: v1.10.0
- **v1.11.x**: v1.11.0 through v1.11.16 (series summary available)
- **v1.12.x**: v1.12.0 through v1.12.5
- **v1.13.x**: v1.13.0, v1.13.1 (current)

## 🔍 Finding Release Notes

### By Version Number
1. Identify the major version (e.g., `1` in `v1.3.0`)
2. Navigate to `v1/`
3. Identify the minor version series (e.g., `v1.3` for `v1.3.0`)
4. Navigate to `v1.3/`
5. Open `RELEASE_NOTES_v1.3.0.md`

### By Date or Feature
- Browse the directory structure chronologically
- Major versions are organized in order
- Minor version series within each major version are in order
- Patch versions within each minor series are in order

## 📖 Version Information

### Semantic Versioning
Profolio follows [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.3.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version History Overview

#### v1.13.x Series - Component Architecture & Glass Design System
- Comprehensive component improvement plan (93% file size reduction)
- Apple Liquid Glass design system implementation
- Modern GlassCard and GlassModal components
- Technical debt cleanup and API modernization

#### v1.12.x Series - E2E Testing & Production Fixes
- Comprehensive Playwright E2E testing framework
- Security, performance, and accessibility testing
- Critical production environment fixes
- Database migration improvements

#### v1.11.x Series - Installation & Security Enhancements
- Enterprise diagnostic system for installer
- Critical security vulnerability fixes
- PWA implementation improvements

#### v1.10.x Series - Security Overhaul
- Complete authentication system security overhaul
- JWT and Firebase token validation improvements
- CORS and encryption enhancements

#### v1.9.x Series - PWA & Performance
- Complete Progressive Web App implementation
- Critical performance optimizations
- Service worker and offline support

#### v1.8.x Series - UI/UX & Optimization
- Markdown support in release notes
- Mobile-first updates page
- Space optimization improvements

#### v1.7.x Series - Logo & Design System
- SVG logo system implementation
- Modern favicon support
- PWA icon complete set

#### v1.6.x Series - Landing Page Modernization
- Glass morphism design implementation
- Animated backgrounds with Framer Motion
- Responsive design improvements

#### v1.5.x Series - Documentation
- Self-hosted focus documentation
- Security documentation overhaul

#### v1.4.x Series - Stability & Performance
- Circuit breaker pattern implementation
- Yahoo Finance rate limiting fixes
- Build system improvements

#### v1.3.x Series - Notification & UX Enhancements
- Enhanced notification system with badges
- Demo mode improvements
- Auto-updates for self-hosted deployments
- Next.js 15+ compatibility

#### v1.2.x Series - Development & Documentation
- Proxmox LXC container support
- Environment preservation system
- Demo mode session management
- Documentation improvements

#### v1.1.x Series - Authentication System
- Unified authentication (local + Firebase)
- Self-hosted and cloud deployment modes
- Enhanced demo mode

#### v1.0.x Series - Foundation & Stability
- Initial public release
- Core portfolio management features
- Installer system with rollback protection
- Security improvements
- Package manager standardization

## 🔗 Related Resources

- **Main Changelog**: [CHANGELOG.md](../../CHANGELOG.md)
- **GitHub Releases**: [All Releases](https://github.com/Obednal97/profolio/releases)
- **Installation Guide**: [README.md](../../README.md)
- **Release Process**: [Release Process Guide](../processes/RELEASE_PROCESS_GUIDE.md)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📝 Contributing to Release Notes

When creating new release notes:

1. Follow the established directory structure
2. Use the comprehensive template provided in the [Release Process Guide](../processes/RELEASE_PROCESS_GUIDE.md)
3. Include all required sections
4. Update this README with the latest release information
5. Cross-reference with the main CHANGELOG.md

---

**Questions or Issues?** Please open an issue on [GitHub](https://github.com/Obednal97/profolio/issues) or refer to our [Contributing Guidelines](../../CONTRIBUTING.md). 