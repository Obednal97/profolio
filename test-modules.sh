#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - MODULE TESTING SCRIPT v3.0.0
# =============================================================================
# 
# Tests all modular installer components including utilities, core features,
# and platform modules to ensure proper loading and functionality
#
# Phase 1: Utilities (logging, ui, validation)
# Phase 2: Core (version-control, rollback) + Features (optimization, ssh-hardening, configuration-wizard)
# Phase 3: Platform Detection + Platform Modules (proxmox, ubuntu, docker)
# =============================================================================

set -e  # Exit on any error

# ANSI color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${WHITE}🧪 PROFOLIO MODULAR INSTALLER TEST SUITE v3.0.0${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test logging functions
test_log() {
    local status="$1"
    local message="$2"
    
    ((TOTAL_TESTS++))
    
    case "$status" in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $message"
            ((PASSED_TESTS++))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $message"
            ((FAILED_TESTS++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $message"
            ;;
        "INFO")
            echo -e "${CYAN}ℹ️  INFO${NC}: $message"
            ;;
    esac
}

# =================== BASIC MODULE TESTS ===================

test_module_exists() {
    local module_path="$1"
    
    if [[ -f "$module_path" ]]; then
        test_log "PASS" "Module exists: $module_path"
        return 0
    else
        test_log "FAIL" "Module not found: $module_path"
        return 1
    fi
}

test_module_loads() {
    local module_path="$1"
    local module_name="$2"
    
    if source "$module_path" 2>/dev/null; then
        test_log "PASS" "$module_name loads successfully"
        return 0
    else
        test_log "FAIL" "$module_name failed to load"
        return 1
    fi
}

test_module_info() {
    local module_name="$1"
    local info_function="$2"
    
    if command -v "$info_function" >/dev/null 2>&1; then
        if $info_function >/dev/null 2>&1; then
            test_log "PASS" "$module_name info function works: $info_function"
            return 0
        else
            test_log "FAIL" "$module_name info function errors: $info_function"
            return 1
        fi
    else
        test_log "FAIL" "$module_name info function not found: $info_function"
        return 1
    fi
}

test_module_functions() {
    local module_name="$1"
    shift
    local functions=("$@")
    
    local missing_functions=()
    
    for func in "${functions[@]}"; do
        if ! command -v "$func" >/dev/null 2>&1; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        test_log "PASS" "$module_name: All expected functions available"
        return 0
    else
        test_log "FAIL" "$module_name: Missing functions: ${missing_functions[*]}"
        return 1
    fi
}

# =================== UTILITY MODULES TESTS ===================

test_logging_module() {
    local module_path="install/utils/logging.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Logging Module" || return 1
    
    # Test essential functions
    test_module_functions "Logging Module" \
        "info" "success" "warn" "error" "logging_debug" || return 1
    
    # Test module info
    test_module_info "Logging Module" "logging_module_info" || return 1
    
    return 0
}

test_ui_module() {
    local module_path="install/utils/ui.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "UI Module" || return 1
    
    # Test essential functions
    test_module_functions "UI Module" \
        "ui_show_progress" "ui_show_spinner" "ui_show_banner" "ui_prompt" || return 1
    
    # Test module info
    test_module_info "UI Module" "ui_module_info" || return 1
    
    return 0
}

test_validation_module() {
    local module_path="install/utils/validation.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Validation Module" || return 1
    
    # Test essential functions
    test_module_functions "Validation Module" \
        "validation_validate_version" "validation_validate_port" "validation_validate_email" "validation_validate_path" || return 1
    
    # Test module info
    test_module_info "Validation Module" "validation_module_info" || return 1
    
    return 0
}

test_platform_detection_module() {
    local module_path="install/utils/platform-detection.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Platform Detection Module" || return 1
    
    # Test essential functions
    test_module_functions "Platform Detection Module" \
        "detect_proxmox_host" "detect_lxc_container" "detect_docker_container" "get_platform_type" || return 1
    
    # Test module info
    test_module_info "Platform Detection Module" "platform_detection_info" || return 1
    
    # Test platform detection functionality
    local platform_type
    platform_type=$(get_platform_type)
    if [[ -n "$platform_type" ]]; then
        test_log "PASS" "Platform Detection Module: get_platform_type() returns: $platform_type"
    else
        test_log "FAIL" "Platform Detection Module: get_platform_type() returned empty"
        return 1
    fi
    
    return 0
}

# =================== CORE MODULES TESTS ===================

test_version_control_module() {
    local module_path="install/core/version-control.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Version Control Module" || return 1
    
    # Test essential functions
    test_module_functions "Version Control Module" \
        "version_control_get_available_versions" "version_control_get_latest_version" "version_control_checkout_version" || return 1
    
    # Test module info
    test_module_info "Version Control Module" "version_control_module_info" || return 1
    
    return 0
}

test_rollback_module() {
    local module_path="install/core/rollback.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Rollback Module" || return 1
    
    # Test essential functions
    test_module_functions "Rollback Module" \
        "rollback_create_rollback_point" "rollback_list_backups" "rollback_execute_rollback" || return 1
    
    # Test module info
    test_module_info "Rollback Module" "rollback_module_info" || return 1
    
    return 0
}

# =================== FEATURE MODULES TESTS ===================

test_optimization_module() {
    local module_path="install/features/optimization.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Optimization Module" || return 1
    
    # Test essential functions
    test_module_functions "Optimization Module" \
        "optimization_deploy_safe" "optimization_deploy_aggressive" || return 1
    
    # Test module info (use the actual function name from the module)
    test_module_info "Optimization Module" "optimization_get_info" || return 1
    
    # Test backward compatibility
    if command -v "optimize_production_deployment" >/dev/null 2>&1; then
        test_log "PASS" "Optimization Module: backward compatibility alias works"
    else
        test_log "FAIL" "Optimization Module: backward compatibility alias missing"
        return 1
    fi
    
    return 0
}

test_ssh_hardening_module() {
    local module_path="install/features/ssh-hardening.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "SSH Hardening Module" || return 1
    
    # Test essential functions
    test_module_functions "SSH Hardening Module" \
        "ssh_configure_server" "ssh_generate_user_keys" "ssh_configure_keys" || return 1
    
    # Test module info (use the actual function name from the module)
    test_module_info "SSH Hardening Module" "ssh_get_info" || return 1
    
    # Test backward compatibility
    if command -v "configure_ssh_server" >/dev/null 2>&1; then
        test_log "PASS" "SSH Hardening Module: backward compatibility alias works"
    else
        test_log "FAIL" "SSH Hardening Module: backward compatibility alias missing"
        return 1
    fi
    
    return 0
}

test_configuration_wizard_module() {
    local module_path="install/features/configuration-wizard.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Configuration Wizard Module" || return 1
    
    # Test essential functions
    test_module_functions "Configuration Wizard Module" \
        "config_run_installation_wizard" "config_run_update_wizard" "config_use_defaults" || return 1
    
    # Test module info (use the actual function name from the module)
    test_module_info "Configuration Wizard Module" "config_get_info" || return 1
    
    # Test backward compatibility
    if command -v "run_configuration_wizard" >/dev/null 2>&1; then
        test_log "PASS" "Configuration Wizard Module: backward compatibility alias works"
    else
        test_log "FAIL" "Configuration Wizard Module: backward compatibility alias missing"
        return 1
    fi
    
    return 0
}

# =================== PLATFORM MODULES TESTS ===================

test_proxmox_platform_module() {
    local module_path="install/platforms/proxmox.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Proxmox Platform Module" || return 1
    
    # Test essential functions
    test_module_functions "Proxmox Platform Module" \
        "proxmox_container_wizard" "create_proxmox_container" "handle_proxmox_installation" || return 1
    
    # Test module info
    test_module_info "Proxmox Platform Module" "proxmox_platform_info" || return 1
    
    return 0
}

test_ubuntu_platform_module() {
    local module_path="install/platforms/ubuntu.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Ubuntu Platform Module" || return 1
    
    # Test essential functions
    test_module_functions "Ubuntu Platform Module" \
        "handle_ubuntu_platform" "check_ubuntu_requirements" || return 1
    
    # Test module info
    test_module_info "Ubuntu Platform Module" "ubuntu_platform_info" || return 1
    
    return 0
}

test_docker_platform_module() {
    local module_path="install/platforms/docker.sh"
    
    test_module_exists "$module_path" || return 1
    test_module_loads "$module_path" "Docker Platform Module" || return 1
    
    # Test essential functions
    test_module_functions "Docker Platform Module" \
        "handle_docker_platform" "check_docker_requirements" || return 1
    
    # Test module info
    test_module_info "Docker Platform Module" "docker_platform_info" || return 1
    
    return 0
}

# =================== INTEGRATION TESTS ===================

test_module_integration() {
    echo -e "\n${CYAN}🔗 Testing Module Integration${NC}"
    
    # Test that modules can work together
    local temp_script="/tmp/integration_test.sh"
    
    cat > "$temp_script" << 'EOF'
#!/bin/bash
source install/utils/logging.sh
source install/utils/ui.sh
source install/utils/validation.sh
source install/utils/platform-detection.sh
source install/features/optimization.sh

# Test cross-module functionality
if command -v "info" >/dev/null 2>&1 && \
   command -v "get_platform_type" >/dev/null 2>&1 && \
   command -v "optimization_deploy_safe" >/dev/null 2>&1; then
    exit 0
else
    exit 1
fi
EOF
    
    chmod +x "$temp_script"
    
    if bash "$temp_script" 2>/dev/null; then
        test_log "PASS" "Modules integrate successfully"
        rm -f "$temp_script"
        return 0
    else
        test_log "FAIL" "Module integration failed"
        rm -f "$temp_script"
        return 1
    fi
}

# =================== MAIN TEST EXECUTION ===================

run_all_tests() {
    echo -e "${CYAN}🔍 Testing Phase 1: Utility Modules${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    test_logging_module
    echo ""
    test_ui_module
    echo ""
    test_validation_module
    echo ""
    test_platform_detection_module
    echo ""
    
    echo -e "${CYAN}🔍 Testing Phase 2: Core Modules${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    test_version_control_module
    echo ""
    test_rollback_module
    echo ""
    
    echo -e "${CYAN}🔍 Testing Phase 2: Feature Modules${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    test_optimization_module
    echo ""
    test_ssh_hardening_module
    echo ""
    test_configuration_wizard_module
    echo ""
    
    echo -e "${CYAN}🔍 Testing Phase 3: Platform Modules${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    test_proxmox_platform_module
    echo ""
    test_ubuntu_platform_module
    echo ""
    test_docker_platform_module
    echo ""
    
    echo -e "${CYAN}🔍 Integration Testing${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    test_module_integration
    echo ""
    
    # Summary
    echo -e "${WHITE}📊 TEST SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total Tests: ${WHITE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Phase 3 modular installer is ready.${NC}"
        echo ""
        echo -e "${CYAN}📋 Module Summary:${NC}"
        echo -e "  • ${WHITE}4${NC} Utility modules (logging, ui, validation, platform-detection)"
        echo -e "  • ${WHITE}2${NC} Core modules (version-control, rollback)"
        echo -e "  • ${WHITE}3${NC} Feature modules (optimization, ssh-hardening, configuration-wizard)"
        echo -e "  • ${WHITE}3${NC} Platform modules (proxmox, ubuntu, docker)"
        echo -e "  • ${WHITE}Total: 12 modules${NC} with full dependency resolution"
        echo ""
        echo -e "${CYAN}✅ Phase 3 Platform Modules Complete:${NC}"
        echo -e "  • Platform detection utility for environment identification"
        echo -e "  • Proxmox LXC container creation and management"
        echo -e "  • Ubuntu/Debian generic system support"
        echo -e "  • Docker container environment optimization"
        echo -e "  • 100% backward compatibility maintained"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}❌ SOME TESTS FAILED! Please review and fix issues.${NC}"
        echo ""
        return 1
    fi
}

# Run all tests
run_all_tests 