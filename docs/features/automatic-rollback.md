# Automatic Rollback Feature Guide

The automatic rollback feature in Profolio v1.0.4+ provides enterprise-grade protection against failed updates, ensuring your production environment remains stable.

## Overview

The rollback system automatically detects update failures and restores your previous working version, including:
- Application code
- Database state
- Configuration files
- Service status

## How It Works

### 1. **Rollback Point Creation**

Before any update begins, the installer:
- Records the current Git commit hash
- Creates a complete filesystem backup
- Saves current configuration state
- Notes active service status

```bash
[INFO] Creating rollback point...
[SUCCESS] Rollback point created: fb062285
[SUCCESS] Rollback backup created: /opt/profolio-rollback-20250131_072649
```

### 2. **Failure Detection**

The installer monitors multiple failure points:

#### Build Failures
- Backend compilation errors
- Frontend build failures
- Dependency installation issues
- Database migration failures

#### Service Failures
- Backend service won't start
- Frontend service won't start
- Services crash immediately after starting

#### Connectivity Failures
- Backend API not responding
- Frontend not accessible
- Health check failures

### 3. **Automatic Recovery**

When a failure is detected:

1. **Immediate Stop**: Update process halts
2. **Rollback Initiation**: Previous version restoration begins
3. **Code Restoration**: Git reset to saved commit or filesystem restore
4. **Service Recovery**: Services restarted with previous version
5. **Verification**: Confirms rollback success

## Manual Rollback

You can manually trigger a rollback at any time:

```bash
./install-or-update.sh --rollback
```

This is useful for:
- Post-update issues discovered later
- Testing rollback functionality
- Emergency recovery scenarios

## Configuration Options

### Enable/Disable Rollback

Rollback is enabled by default. To disable (not recommended):

```bash
./install-or-update.sh --no-rollback
```

### Rollback File Management

The system keeps the 2 most recent rollback points. Older backups are automatically cleaned up to save space.

Rollback files location:
- `/opt/profolio-rollback-{timestamp}` - Full backup
- `.rollback_commit` - Git commit hash

## Rollback Scenarios

### Scenario 1: Build Failure

```
[ERROR] Frontend build failed
[INFO] Update failed. Initiating rollback...
[INFO] Restoring from rollback point...
[SUCCESS] Rollback completed successfully
```

### Scenario 2: Service Start Failure

```
[ERROR] Backend service failed to start
[INFO] Update failed. Initiating rollback...
[INFO] Restoring services...
[SUCCESS] Services restored to previous version
```

### Scenario 3: Manual Rollback

```bash
$ ./install-or-update.sh --rollback

🔄 ROLLBACK WIZARD
Restore to previous version

[INFO] Found rollback data from: 2025-01-31 07:26:49
Previous version will be restored

Proceed with rollback? (y/n) [y]: y
```

## What's Preserved During Rollback

### ✅ Preserved
- Database data
- User accounts
- API keys (encrypted)
- Uploaded files
- Configuration settings
- Historical data

### ⚠️ Lost
- Code changes from failed update
- New configuration options
- Database schema changes (rolled back)

## Best Practices

### 1. **Always Keep Rollback Enabled**
Unless you have a specific reason, keep rollback protection active.

### 2. **Test After Rollback**
After any rollback, verify:
- Services are running
- Data is intact
- Features work as expected

### 3. **Check Logs**
Review logs to understand why the update failed:
```bash
sudo journalctl -u profolio-backend -u profolio-frontend --since "1 hour ago"
```

### 4. **Report Issues**
If an update fails and triggers rollback, report the issue with:
- Error messages
- System information
- Update version attempted

## Troubleshooting

### Rollback Fails

If automatic rollback fails:

1. **Check backup exists**:
   ```bash
   ls -la /opt/profolio-rollback-*
   ```

2. **Manual restoration**:
   ```bash
   cd /opt/profolio
   git reset --hard <commit-hash>
   sudo systemctl restart profolio-backend profolio-frontend
   ```

3. **Restore from filesystem backup**:
   ```bash
   rm -rf /opt/profolio
   cp -r /opt/profolio-rollback-{timestamp} /opt/profolio
   cd /opt/profolio
   ./install-or-update.sh --repair
   ```

### No Rollback Data

If rollback data is missing:
- Use `--force-version` to install a specific version
- Restore from your own backups
- Contact support

## Technical Details

### Rollback Implementation

```bash
# Git-based rollback (primary method)
git reset --hard $rollback_commit
git clean -fd

# Filesystem-based rollback (fallback)
rm -rf /opt/profolio/*
cp -r /opt/profolio-rollback-*/* /opt/profolio/
```

### Failure Detection Logic

The installer checks:
1. Exit codes of all commands
2. Service status via systemctl
3. HTTP connectivity to services
4. Response from health endpoints

Any failure triggers immediate rollback.

## FAQ

**Q: How much disk space do rollback backups use?**
A: Each backup uses approximately the same space as your Profolio installation (typically 100-200MB). Only 2 are kept.

**Q: Can I rollback multiple versions?**
A: The automatic rollback only goes back one version. For older versions, use `--version` flag.

**Q: What if I want to proceed despite failures?**
A: Use `--no-rollback` flag, but this is strongly discouraged for production.

**Q: Is data lost during rollback?**
A: No, user data is preserved. Only code changes are reverted.

**Q: How fast is rollback?**
A: Typically completes in 30-60 seconds, depending on installation size.

## Related Documentation

- [Installer v2.0 Features](../installer/INSTALLER_V2_FEATURES.md)
- [Version Management](./version-management.md)
- [Troubleshooting Guide](../troubleshooting.md) 