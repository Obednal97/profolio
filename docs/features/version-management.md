# Version Management Feature Guide

The version management system in Profolio v1.0.4+ allows precise control over which version to install or update to, providing flexibility for testing, rollbacks, and specific deployments.

## Overview

Version management enables:
- Installing specific versions instead of just "latest"
- Downgrading to previous versions
- Testing new releases before production deployment
- Maintaining version consistency across environments

## Available Commands

### List Available Versions

```bash
./install-or-update.sh --list-versions
```

Output:
```
Available Profolio versions:
  v1.0.6 (latest)
  v1.0.5
  v1.0.4
  v1.0.3
  v1.0.2
  v1.0.1
  v1.0.0
```

### Install Specific Version

```bash
# Using version tag
./install-or-update.sh --version v1.0.3

# Without 'v' prefix
./install-or-update.sh --version 1.0.3

# Special versions
./install-or-update.sh --version latest
./install-or-update.sh --version main
```

### Force Version Installation

Skip version validation (for custom builds):

```bash
./install-or-update.sh --force-version feature-branch
./install-or-update.sh --force-version dev
```

## Version Formats

### Supported Formats

| Format | Example | Description |
|--------|---------|-------------|
| Tag with v | `v1.0.3` | Standard version tag |
| Tag without v | `1.0.3` | Convenience format |
| Latest | `latest` | Most recent release |
| Main | `main` | Current main branch |
| Branch | `feature-xyz` | Any git branch (with --force-version) |
| Commit | `abc123` | Specific commit (with --force-version) |

### Version Validation

The installer validates versions by:
1. Checking GitHub releases API
2. Verifying tag exists in repository
3. Ensuring version is properly formatted

## Use Cases

### 1. **Testing New Releases**

Test a new version on staging before production:

```bash
# On staging server
./install-or-update.sh --version v1.0.6

# After testing, update production
./install-or-update.sh --version v1.0.6
```

### 2. **Downgrading**

Revert to a previous stable version:

```bash
# Current version: v1.0.6
# Downgrade to v1.0.4
./install-or-update.sh --version v1.0.4
```

### 3. **Environment Consistency**

Ensure all environments run the same version:

```bash
# Deploy specific version to all servers
for server in prod1 prod2 staging; do
    ssh $server "cd /opt && ./install-or-update.sh --version v1.0.5"
done
```

### 4. **Feature Branch Testing**

Test unreleased features:

```bash
./install-or-update.sh --force-version feature-payment-integration
```

## Interactive Version Selection

When running without version specified, the installer offers choices:

```
Version Options:
  1) Latest version (recommended)
  2) Specific version
  3) List available versions
  4) Keep current version

Select option [1]:
```

Selecting option 2 shows:

```
Enter version (e.g., v1.0.3, 1.0.3, latest, main): v1.0.5
```

## Version Information

### Check Current Version

```bash
# From package.json
grep '"version"' /opt/profolio/package.json

# From installer
./install-or-update.sh --version current
```

### Version in Installer Output

The installer always shows version information:

```
Current Version: 1.0.4
Latest Version: 1.0.6
[SUCCESS] Update available: 1.0.4 → 1.0.6
```

## Best Practices

### 1. **Production Deployments**

Always specify exact versions in production:

```bash
# Good - explicit version
./install-or-update.sh --version v1.0.6

# Risky - might get unexpected update
./install-or-update.sh
```

### 2. **Version Documentation**

Document deployed versions:

```bash
echo "$(date): Deployed v1.0.6" >> /opt/profolio/deployment.log
```

### 3. **Staged Rollouts**

Deploy to environments progressively:

1. Development: `--version main`
2. Staging: `--version v1.0.6-rc1`
3. Production: `--version v1.0.6`

### 4. **Emergency Rollbacks**

Keep note of last known good version:

```bash
# Save before updating
echo "v1.0.5" > /opt/profolio/.last-known-good

# Quick rollback if needed
./install-or-update.sh --version $(cat /opt/profolio/.last-known-good)
```

## Troubleshooting

### Version Not Found

```
[ERROR] Version 'v1.0.99' not found in releases
```

**Solution**: Check available versions with `--list-versions`

### Force Version Warnings

```
[WARNING] Skipping version validation for 'custom-branch'
[WARNING] Installing unverified version at your own risk
```

**Note**: Only use `--force-version` when you know the branch/commit exists

### Version Mismatch After Update

If version shows incorrectly after update:

1. Check all package.json files:
   ```bash
   grep -h '"version"' package.json backend/package.json frontend/package.json
   ```

2. Manually fix if needed:
   ```bash
   VERSION="1.0.6"
   sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json backend/package.json frontend/package.json
   ```

## Technical Details

### Version Detection

```bash
# Get latest version from GitHub API
curl -s https://api.github.com/repos/Obednal97/profolio/releases/latest | jq -r .tag_name

# List all versions
curl -s https://api.github.com/repos/Obednal97/profolio/releases | jq -r '.[].tag_name'
```

### Version Installation Process

1. **Validation**: Checks if version exists
2. **Backup**: Creates rollback point
3. **Checkout**: Git switches to specified version
4. **Build**: Compiles the specific version
5. **Verify**: Confirms version installed correctly

## FAQ

**Q: Can I install a version newer than "latest"?**
A: Yes, use `--force-version` with a branch name or commit hash.

**Q: What happens to my data when downgrading?**
A: Data is preserved, but database migrations may need attention.

**Q: How do I install a pre-release version?**
A: Use the exact tag: `./install-or-update.sh --version v1.0.7-beta1`

**Q: Can I automate version updates?**
A: Yes, use `--auto` flag: `./install-or-update.sh --version v1.0.6 --auto`

**Q: What if I specify a non-existent version?**
A: The installer will show an error and list available versions.

## Related Documentation

- [Automatic Rollback](./automatic-rollback.md)
- [Installer v2.0 Features](../installer/INSTALLER_V2_FEATURES.md)
- [Release Process](../processes/RELEASE_PROCESS_GUIDE.md) 