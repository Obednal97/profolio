# Profolio Scripts

This directory contains automation scripts for development, testing, deployment, and database management.

## 🚀 **Quick Start**

```bash
# New developer setup
npm run setup-dev
npm run install-hooks

# Daily development
npm run dev                    # Start both frontend and backend
npm run validate-env          # Check environment health

# Release workflow
npm run prepare-release 1.10.1  # Automated release prep
```

## 📁 **Available Scripts**

### **Development Automation**

| Script                     | Command                   | Purpose                        |
| -------------------------- | ------------------------- | ------------------------------ |
| `dev-tools.sh`             | `npm run dev-tools <cmd>` | All-in-one development tools   |
| `setup-dev-environment.sh` | `npm run setup-dev`       | Complete dev environment setup |
| `validate-environment.sh`  | `npm run validate-env`    | Validate environment health    |
| `install-git-hooks.sh`     | `npm run install-hooks`   | Install pre-commit validation  |

### **Database Management**

| Script        | Command                  | Purpose                            |
| ------------- | ------------------------ | ---------------------------------- |
| `db-tools.sh` | `npm run db-tools <cmd>` | Database operations and management |

### **Release Management**

| Script                  | Command                             | Purpose                          |
| ----------------------- | ----------------------------------- | -------------------------------- |
| `prepare-release.mjs`   | `npm run prepare-release <version>` | Comprehensive release automation |
| `check-release-date.sh` | `./scripts/check-release-date.sh`   | Date chronology validation       |

## 🔧 **Development Tools (`dev-tools.sh`)**

```bash
npm run dev-tools <command>

Commands:
  setup           - Complete development environment setup
  validate        - Validate entire environment
  clean           - Clean all build artifacts and caches
  fresh-install   - Clean install of all dependencies
  check-deps      - Check for outdated dependencies
  check-security  - Run security audit on dependencies
  fix-lint        - Fix all linting issues automatically
  pre-commit      - Run pre-commit checks (type-check, lint, build)
  db-reset        - Reset database to clean state (dev only)
  update-versions - Update all package versions to match root
  release         - Interactive release preparation
```

**Examples:**

```bash
npm run dev-tools setup         # First-time setup
npm run dev-tools validate      # Health check
npm run dev-tools pre-commit    # Before committing
npm run dev-tools clean         # Clean build artifacts
```

## 🗄️ **Database Tools (`db-tools.sh`)**

```bash
npm run db-tools <command>

Commands:
  status          - Show database connection status
  generate        - Generate Prisma client
  migrate         - Run database migrations
  migrate-dev     - Run migrations in development mode
  migrate-reset   - Reset database and run all migrations
  seed            - Seed database with sample data (if available)
  studio          - Open Prisma Studio
  backup          - Create database backup (PostgreSQL only)
  restore         - Restore database from backup
  logs            - Show recent database logs
  inspect         - Inspect database schema
```

**Examples:**

```bash
npm run db-tools status         # Check DB connection
npm run db-tools migrate-dev    # Dev migrations
npm run db-tools studio        # Open Prisma Studio
npm run db-tools backup        # Create backup
```

## 🎯 **NPM Script Shortcuts**

### **Core Development**

```bash
npm run dev                    # Start both frontend and backend
npm run build                  # Build both frontend and backend
npm run test                   # Run all tests
npm run type-check             # TypeScript validation
npm run lint                   # Lint all code
```

### **Individual Services**

```bash
npm run dev:frontend          # Frontend only
npm run dev:backend           # Backend only
npm run build:frontend        # Build frontend only
npm run build:backend         # Build backend only
```

### **Quality & Maintenance**

```bash
npm run pre-commit            # Pre-commit validation
npm run validate-env          # Environment health check
npm run install-hooks         # Install Git hooks
```

## 🔗 **Git Hooks Integration**

After running `npm run install-hooks`:

### **Pre-commit Hook**

- ✅ **TypeScript checks** - Validates all TS/TSX files
- ✅ **Linting with auto-fix** - Fixes issues automatically
- ✅ **Security scanning** - Detects potential secrets
- ✅ **Merge conflict detection** - Prevents broken commits
- ✅ **File size validation** - Warns about large files

### **Commit Message Hook**

- 📝 **Format assistance** - Provides commit message templates
- 📝 **Standard compliance** - Ensures consistent format
- 📝 **Context awareness** - Shows modified files

**Bypass hooks (emergency only):**

```bash
git commit --no-verify
```

## 📦 **Release Automation**

### **Automated Release Workflow**

```bash
# 1. Prepare release (fully automated)
npm run prepare-release 1.10.1

# 2. Complete manual tasks (guided by script output)
# - Update CHANGELOG.md
# - Complete release notes

# 3. Commit and tag
git add -A
git commit -m "feat: v1.10.1 - brief description"
git tag -a v1.10.1 -m "Release v1.10.1"
git push origin main --tags

# 4. Create GitHub release
gh release create v1.10.1 --title "v1.10.1 - Title" --notes-file docs/releases/v1/v1.10/RELEASE_NOTES_v1.10.1.md
```

### **What's Automated in Release Prep**

- ✅ **Version updates** - All package.json files synced
- ✅ **Service worker versioning** - Forces cache invalidation
- ✅ **Date validation** - Ensures chronological order
- ✅ **Build testing** - Validates frontend/backend builds
- ✅ **Directory structure** - Creates proper release notes folders
- ✅ **Template generation** - Pre-filled release notes template

## 🔍 **Troubleshooting Guide**

### **Environment Issues**

```bash
# Complete environment reset
npm run dev-tools fresh-install

# Clean build artifacts
npm run dev-tools clean

# Validate everything
npm run validate-env
```

### **Database Issues**

```bash
# Check connection
npm run db-tools status

# Reset development database
npm run db-tools migrate-reset

# Regenerate Prisma client
npm run db-tools generate
```

### **Release Issues**

```bash
# Check if builds work
npm run build

# Validate date chronology
./scripts/check-release-date.sh

# Interactive release helper
npm run dev-tools release
```

## 📋 **Dependencies**

### **Required Tools**

- **Node.js** v18.17.0 or later
- **pnpm** 9.14.4 (auto-installed by setup)
- **Git** (for hooks and releases)
- **PostgreSQL** (for database operations)

### **Optional Tools**

- **GitHub CLI** (`gh`) - For automated release creation
- **Docker** - For containerized database management

## 🛡️ **Security Features**

### **Pre-commit Security**

- 🔒 **Secret detection** - Scans for API keys, passwords, tokens
- 🔒 **Pattern matching** - Identifies sensitive data patterns
- 🔒 **File validation** - Checks for unexpected file types

### **Database Security**

- 🔒 **Backup encryption** - PostgreSQL dumps secured
- 🔒 **Connection validation** - Verifies secure connections
- 🔒 **Access control** - Development-only operations

## 📚 **Best Practices**

### **Daily Workflow**

1. **Start day**: `npm run validate-env`
2. **Before committing**: `npm run pre-commit` (automated by hooks)
3. **Before release**: `npm run prepare-release`

### **Team Collaboration**

- 🤝 **Consistent environment** - All developers use same setup
- 🤝 **Automated quality** - Git hooks prevent broken commits
- 🤝 **Standardized releases** - Consistent release process

### **Maintenance**

- 🔧 **Weekly**: `npm run dev-tools check-deps`
- 🔧 **Monthly**: `npm run dev-tools check-security`
- 🔧 **As needed**: `npm run dev-tools clean`

---

**💡 Tip**: Run any script with `--help` or `-h` for detailed usage information.
