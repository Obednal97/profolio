# Profolio Installer Testing Guide

## Overview

This guide covers testing procedures for the Profolio installer scripts to ensure reliability and compatibility across different environments.

## Test Suite Components

### 1. Validation Script (`tests/installer/validate.sh`)

Performs static analysis and validation:
- **ShellCheck validation** - Checks for shell scripting issues
- **Executable permissions** - Verifies scripts are executable
- **Common issues** - Scans for hardcoded paths, unsafe commands
- **Library dependencies** - Ensures all required modules exist
- **System commands** - Checks for required system utilities

**Usage:**
```bash
./tests/installer/validate.sh
```

### 2. Function Tests (`tests/installer/test-functions.sh`)

Unit tests for installer functions:
- **Version validation** - Tests version format checking
- **Dry-run mode** - Verifies dry-run doesn't make changes
- **File operations** - Tests file operation wrappers
- **Environment detection** - Validates container/Proxmox detection
- **Library loading** - Ensures modules load correctly

**Usage:**
```bash
./tests/installer/test-functions.sh
```

### 3. GitHub Actions Workflow (`.github/workflows/installer-tests.yml`)

Automated CI/CD testing:
- **ShellCheck validation** - All scripts checked on every commit
- **Function tests** - Unit tests run automatically
- **Dry-run test** - Verifies dry-run mode works
- **Help output** - Tests help documentation
- **Security checks** - Scans for unsafe patterns
- **OS compatibility** - Tests on Ubuntu 20.04, 22.04, and latest

## Running Tests Locally

### Quick Test Suite
Run all tests with a single command:
```bash
# Run validation
./tests/installer/validate.sh

# Run function tests
./tests/installer/test-functions.sh

# Test dry-run mode
./install.sh --dry-run --auto
```

### Manual Testing Checklist

#### Basic Installation Test
```bash
# 1. Test help output
./install.sh --help

# 2. List available versions
./install.sh --list-versions

# 3. Test dry-run mode
./install.sh --dry-run

# 4. Test TUI wrapper
./profolio.sh
```

#### Advanced Features Test
```bash
# Test config export (if installed)
./profolio.sh --export-config test-config.json

# Test system validation
./profolio.sh --validate-only

# Test network detection
./profolio.sh --network-detect

# Test health checks (if installed)
./profolio.sh --health-check
```

## Proxmox Testing

### Prerequisites
- Access to a Proxmox VE host (version 7.0+)
- Root or sudo access
- At least 10GB free storage

### Test Procedure

1. **Detection Test**
   ```bash
   # On Proxmox host
   ./install.sh --dry-run
   # Should detect Proxmox and offer container creation
   ```

2. **Container Creation Test**
   ```bash
   # Test container creation workflow
   ./install.sh --advanced
   # Select "Create Proxmox container"
   # Verify container settings
   ```

3. **Container Installation Test**
   ```bash
   # Inside created container
   pct enter <VMID>
   curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | bash
   ```

### Proxmox Test Checklist
- [ ] Detects Proxmox host correctly
- [ ] Offers container creation option
- [ ] Downloads Ubuntu template if missing
- [ ] Creates container with correct settings
- [ ] Container starts successfully
- [ ] Installation works inside container
- [ ] Services auto-start on container boot

## Environment-Specific Testing

### Docker/Container Testing
```bash
# Test in Docker container
docker run -it ubuntu:22.04 bash
apt update && apt install -y curl sudo
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

### LXC Container Testing
```bash
# Inside LXC container
./install.sh
# Should detect container environment
# Should skip certain optimizations
```

### VPS Testing
Test on common VPS providers:
- DigitalOcean
- Linode
- AWS EC2
- Vultr

## Troubleshooting Test Failures

### ShellCheck Errors
```bash
# Run shellcheck manually with explanations
shellcheck -x install.sh

# Ignore specific warnings if needed
shellcheck -e SC1091 install.sh
```

### Function Test Failures
```bash
# Run with debug output
bash -x ./tests/installer/test-functions.sh

# Test individual functions
source install.sh
validate_version "v1.0.0"
echo $?
```

### Dry-Run Issues
```bash
# Verify dry-run mode
./install.sh --dry-run 2>&1 | grep "\[DRY-RUN\]"

# Check no files created
ls -la /opt/profolio 2>/dev/null || echo "Good: Directory not created"
```

## Performance Testing

### Installation Speed Test
```bash
# Time the installation
time ./install.sh --auto --dry-run

# Measure download sizes
./install.sh --dry-run 2>&1 | grep -i download
```

### Resource Usage Test
```bash
# Monitor during installation
top -b -n 1 | head -20
./install.sh --dry-run
```

## Security Testing

### Permission Checks
```bash
# Verify no world-writable files
find . -type f -perm -002

# Check for setuid/setgid
find . -type f \( -perm -4000 -o -perm -2000 \)
```

### Input Validation
```bash
# Test with invalid inputs
./install.sh --version "'; rm -rf /"  # Should safely reject
./install.sh --version "../../../etc/passwd"  # Should safely reject
```

## Regression Testing

Before each release:

1. **Run full test suite**
   ```bash
   ./tests/installer/validate.sh
   ./tests/installer/test-functions.sh
   ```

2. **Test upgrade path**
   ```bash
   # Install previous version
   ./install.sh --version v1.15.4
   
   # Upgrade to latest
   ./install.sh
   ```

3. **Test rollback**
   ```bash
   ./install.sh --rollback
   ```

## Contributing Tests

### Adding New Tests

1. **Add to function tests** (`tests/installer/test-functions.sh`):
   ```bash
   test_new_feature() {
       echo -e "${BLUE}Testing new feature...${NC}"
       # Test implementation
       assert_equals "expected" "actual" "Test description"
   }
   ```

2. **Add to validation** (`tests/installer/validate.sh`):
   ```bash
   # Add new validation check
   check_new_requirement() {
       # Implementation
   }
   ```

3. **Update GitHub Actions** if needed

### Test Coverage Goals

- **Core functions**: 100% coverage
- **Error handling**: All error paths tested
- **User inputs**: All options validated
- **Platform compatibility**: All supported OS versions

## Continuous Improvement

### Monthly Review
- Review test failures from CI/CD
- Update tests for new features
- Add tests for reported bugs
- Performance benchmark updates

### Metrics to Track
- Test pass rate
- Installation success rate
- Average installation time
- Resource usage trends

---

## Quick Reference

### Run All Tests
```bash
# Validation
./tests/installer/validate.sh

# Function tests
./tests/installer/test-functions.sh

# Dry-run test
./install.sh --dry-run --auto
```

### Test New Changes
```bash
# After modifying installer
git add .
./tests/installer/validate.sh
./tests/installer/test-functions.sh
```

### Pre-Commit Hook
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
./tests/installer/validate.sh || exit 1
```

---

*Last Updated: September 2025*
*Version: 1.0.0*