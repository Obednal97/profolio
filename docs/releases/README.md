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

### Current Stable: v1.3.0
- **Released**: 2025-02-06
- **Highlights**: Enhanced notification system, demo mode banner, auto-updates toggle, critical fixes
- **Release Notes**: [v1.3.0](./v1/v1.3/RELEASE_NOTES_v1.3.0.md)
- **GitHub Release**: [v1.3.0 on GitHub](https://github.com/Obednal97/profolio/releases/tag/v1.3.0)

### Previous Stable: v1.2.1
- **Released**: 2024-12-15
- **Highlights**: Proxmox LXC container support, environment preservation system
- **Release Notes**: [v1.2.1](./v1/v1.2/RELEASE_NOTES_v1.2.1.md)
- **GitHub Release**: [v1.2.1 on GitHub](https://github.com/Obednal97/profolio/releases/tag/v1.2.1)

## 📝 Version History Notes

Some release notes may be missing for certain versions due to:
- Early development releases (v1.0.0, v1.0.1) before formal documentation
- Hotfix releases that were superseded quickly
- Internal testing versions

Available version series:
- **v1.0.x**: v1.0.2 through v1.0.11 (with some gaps)
- **v1.1.x**: v1.1.0
- **v1.2.x**: v1.2.0, v1.2.1
- **v1.3.x**: v1.3.0 (current)

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