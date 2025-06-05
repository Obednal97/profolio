#!/bin/bash

# 🔄 Rollback Management Module
# =============================
# Handles backup creation, rollback execution, and recovery operations
# Used by installer components for safe deployment and recovery

# ==============================================================================
# DEPENDENCIES
# ==============================================================================

# Ensure required modules are available
if [[ "${LOGGING_MODULE_LOADED:-false}" != "true" ]]; then
    echo "⚠️  Warning: Rollback module requires logging module" >&2
fi

# ==============================================================================
# GLOBAL VARIABLES
# ==============================================================================

# Rollback configuration
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
ROLLBACK_COMMIT=""
ROLLBACK_BACKUP_DIR=""
ROLLBACK_BACKUP_PREFIX="${ROLLBACK_BACKUP_PREFIX:-profolio-rollback}"

# Installation paths
INSTALL_PATH="${INSTALL_PATH:-/opt/profolio}"
PROFOLIO_USER="${PROFOLIO_USER:-profolio}"

# Service names
FRONTEND_SERVICE="${FRONTEND_SERVICE:-profolio-frontend}"
BACKEND_SERVICE="${BACKEND_SERVICE:-profolio-backend}"

# ==============================================================================
# ROLLBACK POINT CREATION
# ==============================================================================

# Create rollback point
rollback_create_rollback_point() {
    if [ "$ROLLBACK_ENABLED" = false ]; then
        logging_debug "Rollback disabled, skipping rollback point creation"
        return 0
    fi
    
    logging_info "Creating rollback point..."
    
    # Get current git commit
    if [ -d "$INSTALL_PATH/.git" ]; then
        cd "$INSTALL_PATH"
        ROLLBACK_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
        
        if [ -n "$ROLLBACK_COMMIT" ]; then
            logging_success "Rollback point created: ${ROLLBACK_COMMIT:0:8}"
        else
            logging_warn "Could not determine current git commit"
        fi
    fi
    
    # Create backup directory
    local timestamp=$(date +%Y%m%d_%H%M%S)
    ROLLBACK_BACKUP_DIR="/opt/$ROLLBACK_BACKUP_PREFIX-$timestamp"
    
    if [ -d "$INSTALL_PATH" ]; then
        logging_info "Creating rollback backup..."
        if cp -r "$INSTALL_PATH" "$ROLLBACK_BACKUP_DIR" 2>/dev/null; then
            logging_success "Rollback backup created: $ROLLBACK_BACKUP_DIR"
        else
            logging_warn "Failed to create rollback backup"
            ROLLBACK_BACKUP_DIR=""
        fi
    fi
    
    # Store rollback information
    if [[ -n "$ROLLBACK_BACKUP_DIR" ]]; then
        echo "ROLLBACK_COMMIT=$ROLLBACK_COMMIT" > "$ROLLBACK_BACKUP_DIR/.rollback_info"
        echo "ROLLBACK_TIMESTAMP=$timestamp" >> "$ROLLBACK_BACKUP_DIR/.rollback_info"
        echo "ROLLBACK_PATH=$INSTALL_PATH" >> "$ROLLBACK_BACKUP_DIR/.rollback_info"
    fi
    
    return 0
}

# Create quick backup (without full directory copy)
rollback_create_quick_backup() {
    if [ "$ROLLBACK_ENABLED" = false ]; then
        return 0
    fi
    
    logging_info "Creating quick backup..."
    
    # Get current git commit
    if [ -d "$INSTALL_PATH/.git" ]; then
        cd "$INSTALL_PATH"
        ROLLBACK_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
        
        if [ -n "$ROLLBACK_COMMIT" ]; then
            logging_success "Quick backup point: ${ROLLBACK_COMMIT:0:8}"
            return 0
        fi
    fi
    
    logging_warn "Could not create quick backup (no git repository)"
    return 1
}

# ==============================================================================
# ROLLBACK EXECUTION
# ==============================================================================

# Execute rollback
rollback_execute_rollback() {
    if [ "$ROLLBACK_ENABLED" = false ]; then
        logging_error "Rollback is disabled"
        return 1
    fi
    
    logging_warn "🔄 EXECUTING AUTOMATIC ROLLBACK..."
    echo ""
    
    # Stop services
    rollback_stop_services
    
    local rollback_success=false
    
    # Try git rollback first
    if [ -n "$ROLLBACK_COMMIT" ] && [ -d "$INSTALL_PATH/.git" ]; then
        logging_info "Rolling back to git commit: ${ROLLBACK_COMMIT:0:8}"
        cd "$INSTALL_PATH"
        
        if sudo -u "$PROFOLIO_USER" git reset --hard "$ROLLBACK_COMMIT"; then
            logging_success "Git rollback successful"
            rollback_success=true
        else
            logging_error "Git rollback failed"
        fi
    fi
    
    # Fallback to backup restoration
    if [ "$rollback_success" = false ] && [ -n "$ROLLBACK_BACKUP_DIR" ] && [ -d "$ROLLBACK_BACKUP_DIR" ]; then
        rollback_success=$(rollback_restore_from_backup "$ROLLBACK_BACKUP_DIR")
    fi
    
    if [ "$rollback_success" = true ]; then
        # Rebuild with previous version
        logging_info "Rebuilding previous version..."
        cd "$INSTALL_PATH"
        
        # Note: setup_environment and build_application functions would need to be available
        # These should be loaded from other modules
        if command -v setup_environment >/dev/null 2>&1 && command -v build_application >/dev/null 2>&1; then
            setup_environment true  # Pass true to indicate rollback mode (prevents re-prompting)
            
            if build_application; then
                # Restart services
                rollback_start_services
                
                # Quick verification
                if rollback_verify_services; then
                    logging_success "🎉 ROLLBACK COMPLETED SUCCESSFULLY"
                    echo ""
                    echo -e "${GREEN}✅ Services restored to previous working version${NC}"
                    echo -e "${YELLOW}⚠️  Please check logs and investigate the update failure${NC}"
                    
                    # Clean up rollback files
                    rollback_cleanup_rollback_files
                    return 0
                else
                    logging_error "Services failed to start after rollback"
                fi
            else
                logging_error "Failed to rebuild after rollback"
            fi
        else
            logging_error "Cannot rebuild - setup_environment or build_application not available"
        fi
    fi
    
    logging_error "❌ ROLLBACK FAILED"
    echo ""
    echo -e "${RED}Manual intervention required:${NC}"
    echo -e "   ${WHITE}1.${NC} Check service logs: journalctl -u $BACKEND_SERVICE -u $FRONTEND_SERVICE -f"
    echo -e "   ${WHITE}2.${NC} Restore manually from: $ROLLBACK_BACKUP_DIR"
    echo -e "   ${WHITE}3.${NC} Contact support if needed"
    
    return 1
}

# Restore from backup directory
rollback_restore_from_backup() {
    local backup_dir="$1"
    
    logging_info "Restoring from backup: $backup_dir"
    
    if [ -d "$INSTALL_PATH" ]; then
        rm -rf "$INSTALL_PATH.failed"
        mv "$INSTALL_PATH" "$INSTALL_PATH.failed"
    fi
    
    if cp -r "$backup_dir" "$INSTALL_PATH"; then
        chown -R "$PROFOLIO_USER:$PROFOLIO_USER" "$INSTALL_PATH"
        logging_success "Backup restoration successful"
        return 0
    else
        logging_error "Backup restoration failed"
        
        # Try to restore the failed directory
        if [ -d "$INSTALL_PATH.failed" ]; then
            mv "$INSTALL_PATH.failed" "$INSTALL_PATH"
            logging_warn "Restored to failed state"
        fi
        return 1
    fi
}

# ==============================================================================
# SERVICE MANAGEMENT
# ==============================================================================

# Stop services for rollback
rollback_stop_services() {
    logging_info "Stopping services..."
    systemctl stop "$FRONTEND_SERVICE" "$BACKEND_SERVICE" 2>/dev/null || true
    systemctl reset-failed "$FRONTEND_SERVICE" "$BACKEND_SERVICE" 2>/dev/null || true
    
    # Wait for services to stop
    sleep 2
}

# Start services after rollback
rollback_start_services() {
    logging_info "Restarting services with previous version..."
    systemctl start "$BACKEND_SERVICE"
    sleep 3
    systemctl start "$FRONTEND_SERVICE"
    sleep 2
}

# Verify services are running
rollback_verify_services() {
    systemctl is-active --quiet "$BACKEND_SERVICE" && systemctl is-active --quiet "$FRONTEND_SERVICE"
}

# ==============================================================================
# CLEANUP OPERATIONS
# ==============================================================================

# Clean up rollback files
rollback_cleanup_rollback_files() {
    if [ -n "$ROLLBACK_BACKUP_DIR" ] && [ -d "$ROLLBACK_BACKUP_DIR" ]; then
        logging_info "Cleaning up rollback backup..."
        rm -rf "$ROLLBACK_BACKUP_DIR"
        logging_success "Rollback backup cleaned up"
    fi
    
    # Keep only 2 most recent rollback backups
    rollback_cleanup_old_backups
}

# Clean up old backup files
rollback_cleanup_old_backups() {
    local backup_pattern="/opt/$ROLLBACK_BACKUP_PREFIX-*"
    local rollback_count=$(ls -1d $backup_pattern 2>/dev/null | wc -l)
    
    if [ "$rollback_count" -gt 2 ]; then
        local backups_to_remove=$((rollback_count - 2))
        ls -1td $backup_pattern 2>/dev/null | tail -n "$backups_to_remove" | while read -r old_backup; do
            if [[ -d "$old_backup" ]]; then
                rm -rf "$old_backup"
                logging_info "Removed old rollback backup: $(basename "$old_backup")"
            fi
        done
    fi
}

# Force cleanup all rollback backups
rollback_cleanup_all_backups() {
    local backup_pattern="/opt/$ROLLBACK_BACKUP_PREFIX-*"
    local backup_count=$(ls -1d $backup_pattern 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 0 ]; then
        logging_info "Cleaning up all rollback backups..."
        rm -rf $backup_pattern
        logging_success "All rollback backups cleaned up ($backup_count removed)"
    else
        logging_info "No rollback backups to clean up"
    fi
}

# ==============================================================================
# ROLLBACK INFORMATION
# ==============================================================================

# List available rollback points
rollback_list_backups() {
    local backup_pattern="/opt/$ROLLBACK_BACKUP_PREFIX-*"
    local backups=$(ls -1td $backup_pattern 2>/dev/null || echo "")
    
    if [[ -n "$backups" ]]; then
        echo -e "${CYAN}📋 Available rollback points:${NC}"
        echo "$backups" | while read -r backup; do
            local backup_name=$(basename "$backup")
            local timestamp=$(echo "$backup_name" | sed "s/$ROLLBACK_BACKUP_PREFIX-//")
            local date_formatted=$(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")
            
            echo "   • $backup_name ($date_formatted)"
            
            # Show additional info if available
            if [[ -f "$backup/.rollback_info" ]]; then
                local commit=$(grep "ROLLBACK_COMMIT=" "$backup/.rollback_info" | cut -d'=' -f2)
                if [[ -n "$commit" ]]; then
                    echo "     Git commit: ${commit:0:8}"
                fi
            fi
        done
        echo ""
        return 0
    else
        echo -e "${YELLOW}No rollback points available${NC}"
        return 1
    fi
}

# Get rollback status
rollback_get_status() {
    echo "Rollback Status:"
    echo "================"
    echo "Enabled: $ROLLBACK_ENABLED"
    
    if [[ -n "$ROLLBACK_COMMIT" ]]; then
        echo "Current rollback commit: ${ROLLBACK_COMMIT:0:8}"
    fi
    
    if [[ -n "$ROLLBACK_BACKUP_DIR" ]]; then
        echo "Current backup directory: $ROLLBACK_BACKUP_DIR"
    fi
    
    local backup_count=$(ls -1d /opt/$ROLLBACK_BACKUP_PREFIX-* 2>/dev/null | wc -l)
    echo "Available backup points: $backup_count"
}

# ==============================================================================
# ADVANCED ROLLBACK OPERATIONS
# ==============================================================================

# Rollback to specific backup
rollback_to_specific_backup() {
    local backup_name="$1"
    local backup_path="/opt/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        logging_error "Backup not found: $backup_name"
        return 1
    fi
    
    logging_info "Rolling back to specific backup: $backup_name"
    
    # Stop services
    rollback_stop_services
    
    # Restore from specific backup
    if rollback_restore_from_backup "$backup_path"; then
        # Start services
        rollback_start_services
        
        if rollback_verify_services; then
            logging_success "Rollback to $backup_name completed successfully"
            return 0
        else
            logging_error "Services failed to start after rollback"
            return 1
        fi
    else
        logging_error "Failed to restore from backup: $backup_name"
        return 1
    fi
}

# Create named backup
rollback_create_named_backup() {
    local backup_name="$1"
    
    if [[ -z "$backup_name" ]]; then
        logging_error "Backup name required"
        return 1
    fi
    
    local backup_path="/opt/$ROLLBACK_BACKUP_PREFIX-$backup_name"
    
    if [[ -d "$backup_path" ]]; then
        logging_error "Backup already exists: $backup_name"
        return 1
    fi
    
    logging_info "Creating named backup: $backup_name"
    
    if cp -r "$INSTALL_PATH" "$backup_path" 2>/dev/null; then
        # Store rollback information
        local timestamp=$(date +%Y%m%d_%H%M%S)
        echo "ROLLBACK_COMMIT=$(cd "$INSTALL_PATH" && git rev-parse HEAD 2>/dev/null || echo "")" > "$backup_path/.rollback_info"
        echo "ROLLBACK_TIMESTAMP=$timestamp" >> "$backup_path/.rollback_info"
        echo "ROLLBACK_PATH=$INSTALL_PATH" >> "$backup_path/.rollback_info"
        echo "ROLLBACK_NAME=$backup_name" >> "$backup_path/.rollback_info"
        
        logging_success "Named backup created: $backup_name"
        return 0
    else
        logging_error "Failed to create named backup: $backup_name"
        return 1
    fi
}

# ==============================================================================
# ALIASES FOR BACKWARD COMPATIBILITY
# ==============================================================================

# Maintain compatibility with existing installer code
create_rollback_point() { rollback_create_rollback_point "$@"; }
execute_rollback() { rollback_execute_rollback "$@"; }
cleanup_rollback_files() { rollback_cleanup_rollback_files "$@"; }

# ==============================================================================
# MODULE INFORMATION
# ==============================================================================

# Module version and info
ROLLBACK_MODULE_VERSION="1.0.0"
ROLLBACK_MODULE_LOADED=true

# Display module info
rollback_module_info() {
    echo "Rollback Module v$ROLLBACK_MODULE_VERSION"
    echo "Provides: Backup creation, rollback execution, recovery operations"
    echo "Status: Loaded and ready"
} 