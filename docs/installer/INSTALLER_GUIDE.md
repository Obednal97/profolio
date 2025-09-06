# Profolio Installer Guide

## Quick Start

Profolio offers two main installation methods:

### 1. Interactive TUI Installation (Recommended)
```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh)"
```

This provides an interactive menu with:
- Step-by-step installation wizard
- System validation and health checks
- Configuration management
- Diagnostic tools
- Update and repair options

### 2. Direct Installation (Fastest)
```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

This runs the installation directly with default settings.

## Installer Architecture

### Main Scripts

1. **`profolio.sh`** - Enhanced TUI wrapper
   - Provides interactive menu system
   - Integrates all library modules
   - Falls back to install.sh for actual installation
   - Supports command-line arguments for automation

2. **`install.sh`** - Core installer
   - Comprehensive installation logic
   - Rollback protection
   - Version control
   - Proxmox container support
   - File optimization

### Library Modules

All located in `lib/` directory:

- **`tui-functions.sh`** - TUI framework (whiptail/dialog)
- **`config-manager.sh`** - Configuration import/export
- **`resource-validator.sh`** - System requirement validation
- **`network-detector.sh`** - Network auto-detection
- **`health-checks.sh`** - Service health monitoring
- **`diagnostics.sh`** - Diagnostic data collection

## Command-Line Options

### TUI Installer (profolio.sh)
```bash
sudo ./profolio.sh [OPTIONS]

Options:
  --help, -h              Show help message
  --import-config FILE    Import configuration from JSON
  --export-config FILE    Export current configuration
  --validate-only         Run system validation only
  --health-check          Check health of existing installation
  --diagnostics           Collect diagnostic information
  --network-detect        Auto-detect network configuration
```

### Direct Installer (install.sh)
```bash
sudo ./install.sh [OPTIONS]

Options:
  --version VERSION       Install specific version
  --rollback             Manual rollback to previous version
  --advanced             Advanced installation mode
  --help                 Show help message
```

## Installation Modes

### Quick Install
- Uses recommended defaults
- Fastest installation path
- Suitable for most users

### Advanced Install
- Customize all settings
- Choose specific versions
- Configure network manually
- Set resource allocations

### Update Mode
- Updates existing installation
- Preserves data and configuration
- Automatic rollback on failure

### Repair Mode
- Fixes broken installations
- Rebuilds services
- Validates configuration

## Configuration Management

### Export Configuration
Save your installation settings for reuse:
```bash
sudo ./profolio.sh --export-config my-config.json
```

### Import Configuration
Use saved configuration for automated deployment:
```bash
sudo ./profolio.sh --import-config my-config.json
```

### Configuration Format
```json
{
  "version": "1.0",
  "installation": {
    "type": "advanced",
    "version": "v1.16.0",
    "path": "/opt/profolio"
  },
  "resources": {
    "cpu": 2,
    "ram": 4096,
    "disk": 20
  },
  "network": {
    "ipv4": {
      "method": "dhcp"
    }
  }
}
```

## System Requirements

### Minimum
- OS: Ubuntu 20.04+ / Debian 11+
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- Network: Internet connection

### Recommended
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB
- SSL certificate for production

## Troubleshooting

### Pre-Installation Validation
```bash
sudo ./profolio.sh --validate-only
```

### Health Check
```bash
sudo ./profolio.sh --health-check
```

### Collect Diagnostics
```bash
sudo ./profolio.sh --diagnostics
```

### Manual Rollback
```bash
sudo ./install.sh --rollback
```

## Documentation

- **[User Guide](USER_GUIDE.md)** - Detailed feature documentation
- **[GitHub Repository](https://github.com/Obednal97/profolio)** - Source code and issues

## Support

For issues or questions:
1. Run diagnostics: `sudo ./profolio.sh --diagnostics`
2. Check the [User Guide](USER_GUIDE.md)
3. Open an issue on [GitHub](https://github.com/Obednal97/profolio/issues)

---

*Version: 1.16.0 | Last Updated: September 2025*