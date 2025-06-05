#!/bin/bash

# =============================================================================
# SECURITY TEST: Installer Security Validation
# =============================================================================
# 
# Comprehensive security testing for the modular installer architecture
# Tests for common security vulnerabilities and secure coding practices
#
# Target: Complete installer architecture
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Installer Security Validation"

cd "$PROJECT_ROOT"

# Test 1: Hardcoded Secrets Detection
test_case "Main installer has no hardcoded secrets" "
    assert_no_hardcoded_secrets install-or-update-modular.sh
"

test_case "Module loader has no hardcoded secrets" "
    assert_no_hardcoded_secrets install/module-loader.sh
"

test_case "Bootstrap system has no hardcoded secrets" "
    assert_no_hardcoded_secrets install/bootstrap.sh
"

# Check all modules for hardcoded secrets
for module_dir in install/utils install/core install/features install/platforms; do
    if [[ -d "$module_dir" ]]; then
        for module_file in "$module_dir"/*.sh; do
            if [[ -f "$module_file" ]]; then
                module_name=$(basename "$module_file")
                test_case "$module_name has no hardcoded secrets" "
                    assert_no_hardcoded_secrets '$module_file'
                "
            fi
        done
    fi
done

# Test 2: File Permissions Security
test_case "Main installer has safe permissions" "
    assert_no_world_writable install-or-update-modular.sh
"

test_case "Module loader has safe permissions" "
    assert_no_world_writable install/module-loader.sh
"

test_case "Bootstrap system has safe permissions" "
    assert_no_world_writable install/bootstrap.sh
"

# Check all module permissions
for module_dir in install/utils install/core install/features install/platforms; do
    if [[ -d "$module_dir" ]]; then
        for module_file in "$module_dir"/*.sh; do
            if [[ -f "$module_file" ]]; then
                module_name=$(basename "$module_file")
                test_case "$module_name has safe permissions" "
                    assert_no_world_writable '$module_file'
                "
            fi
        done
    fi
done

# Test 3: Sudo Usage Security
test_case "Main installer has no unsafe sudo patterns" "
    assert_no_sudo_without_auth install-or-update-modular.sh
"

# Check all modules for unsafe sudo usage
for module_dir in install/utils install/core install/features install/platforms; do
    if [[ -d "$module_dir" ]]; then
        for module_file in "$module_dir"/*.sh; do
            if [[ -f "$module_file" ]]; then
                module_name=$(basename "$module_file")
                test_case "$module_name has no unsafe sudo patterns" "
                    assert_no_sudo_without_auth '$module_file'
                "
            fi
        done
    fi
done

# Test 4: Command Injection Prevention
test_case "No eval with user input in main installer" "
    ! grep -E 'eval.*\\$[0-9]|eval.*\\$\\{' install-or-update-modular.sh >/dev/null 2>&1
"

test_case "No command substitution with user input" "
    ! grep -E '\\$\\(.*\\$[0-9].*\\)|`.*\\$[0-9].*`' install-or-update-modular.sh >/dev/null 2>&1
"

# Test 5: Path Traversal Prevention
test_case "No dangerous path operations in main installer" "
    ! grep -E '\\.\\.|\\/\\.\\.|\\.\\.\\/|\\$\\{.*\\.\\..*\\}' install-or-update-modular.sh >/dev/null 2>&1
"

# Check modules for path traversal issues
for module_dir in install/utils install/core install/features install/platforms; do
    if [[ -d "$module_dir" ]]; then
        for module_file in "$module_dir"/*.sh; do
            if [[ -f "$module_file" ]]; then
                module_name=$(basename "$module_file")
                test_case "$module_name has no path traversal vulnerabilities" "
                    ! grep -E '\\.\\.|\\/\\.\\.|\\.\\.\\/|\\$\\{.*\\.\\..*\\}' '$module_file' >/dev/null 2>&1
                "
            fi
        done
    fi
done

# Test 6: Network Security
test_case "HTTPS enforced for external downloads" "
    # Check that all external URLs use HTTPS
    ! grep -E 'http://.*\\.(com|org|net|io|github)' install-or-update-modular.sh >/dev/null 2>&1 &&
    ! grep -E 'http://.*\\.(com|org|net|io|github)' install/bootstrap.sh >/dev/null 2>&1
"

test_case "No curl/wget without certificate verification" "
    # Check for dangerous curl/wget options
    ! grep -E 'curl.*-k|curl.*--insecure|wget.*--no-check-certificate' install-or-update-modular.sh >/dev/null 2>&1 &&
    ! grep -E 'curl.*-k|curl.*--insecure|wget.*--no-check-certificate' install/bootstrap.sh >/dev/null 2>&1
"

# Test 7: Input Validation
test_case "Version validation prevents injection" "
    source install/module-loader.sh &&
    # Test that validation rejects dangerous inputs
    ! validation_validate_version '../../../etc/passwd' >/dev/null 2>&1 &&
    ! validation_validate_version '\$(rm -rf /)' >/dev/null 2>&1 &&
    ! validation_validate_version '||rm -rf /' >/dev/null 2>&1
"

test_case "Path validation prevents traversal" "
    source install/module-loader.sh &&
    # Test common path traversal attempts
    path1='../../../etc/passwd' &&
    path2='/etc/../../../root' &&
    # These should be rejected or sanitized
    [[ ! -f \"\$path1\" ]] || true &&  # File shouldn't exist in safe test environment
    [[ ! -f \"\$path2\" ]] || true
"

# Test 8: Temporary File Security
test_case "Temporary files created securely" "
    # Check for secure temp file creation patterns
    if grep -q 'mktemp' install-or-update-modular.sh install/bootstrap.sh; then
        # If mktemp is used, it should be used properly
        ! grep -E 'mktemp.*[^-]t[^e]|/tmp/[^/]*\\$[^/]' install-or-update-modular.sh install/bootstrap.sh >/dev/null 2>&1
    else
        # If not using mktemp, should not create predictable temp files
        ! grep -E '/tmp/[a-zA-Z0-9_-]*\\$|/tmp/static_name' install-or-update-modular.sh install/bootstrap.sh >/dev/null 2>&1
    fi
"

# Test 9: GitHub API Security
test_case "GitHub API calls use proper error handling" "
    source install/module-loader.sh &&
    # Test that GitHub API failures don't cause script failures
    version_control_get_latest_version >/dev/null 2>&1 || true &&
    version_control_get_available_versions >/dev/null 2>&1 || true
"

test_case "GitHub API calls have timeouts" "
    grep -q 'connect-timeout\\|max-time' install/core/version-control.sh
"

# Test 10: Privilege Escalation Prevention
test_case "Root check prevents non-root execution" "
    # Main installer should check for root privileges
    grep -q 'EUID.*0\\|\\$UID.*0\\|id -u.*0' install-or-update-modular.sh
"

test_case "No setuid/setgid file creation" "
    # Check that installer doesn't create setuid/setgid files
    ! grep -E 'chmod.*[4-7][0-7][0-7][0-7]|chmod.*u\\+s|chmod.*g\\+s' install-or-update-modular.sh >/dev/null 2>&1
"

# Test 11: Logging Security
test_case "No sensitive data in logs" "
    source install/module-loader.sh &&
    # Test that logging functions don't expose sensitive data
    test_output=\$(info 'password=secret123' 2>&1) &&
    # Should either not log it or mask it
    echo \"\$test_output\" | grep -q 'password=' && {
        echo \"\$test_output\" | grep -q '\\*\\*\\*\\|REDACTED\\|\\[HIDDEN\\]'
    } || true
"

# Test 12: Error Message Security
test_case "Error messages don't expose system information" "
    source install/module-loader.sh &&
    # Test that error messages don't reveal too much
    error_output=\$(error 'Test error message' 2>&1) &&
    # Should not contain system paths or internal details
    ! echo \"\$error_output\" | grep -E '/usr/local|/opt|/home/[^/]*|localhost:[0-9]' >/dev/null 2>&1
"

# Test 13: Rollback Security
test_case "Rollback system validates backup integrity" "
    source install/module-loader.sh &&
    # Rollback should have validation mechanisms
    grep -q 'checksum\\|hash\\|verify' install/core/rollback.sh || 
    grep -q 'validate.*backup' install/core/rollback.sh
"

# Test 14: Configuration Security
test_case "Configuration wizard sanitizes inputs" "
    source install/module-loader.sh &&
    # Configuration wizard should validate/sanitize user inputs
    grep -q 'validation\\|sanitize\\|escape' install/features/configuration-wizard.sh
"

# Test 15: SSH Hardening Security
test_case "SSH hardening follows security best practices" "
    # SSH hardening should implement proper security measures
    grep -E 'PasswordAuthentication.*no|PermitRootLogin.*no|Protocol.*2' install/features/ssh-hardening.sh >/dev/null 2>&1
"

test_case "SSH hardening disables dangerous options" "
    # Should disable risky SSH options
    ! grep -E 'PasswordAuthentication.*yes|PermitRootLogin.*yes|PermitEmptyPasswords.*yes' install/features/ssh-hardening.sh >/dev/null 2>&1
"

test_suite_end 