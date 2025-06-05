#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - BACKUP MANAGEMENT MODULE v1.0.0
# =============================================================================
# 
# Backup management functionality for the Profolio installer
# Handles backup creation, restoration, and cleanup
#
# Dependencies: utils/logging.sh, utils/ui.sh
# =============================================================================

# Module info function
backup_management_info() {
    echo "Backup Management Module v1.0.0"
    echo "  • Creates automatic backups before installations/updates"
    echo "  • Manages backup rotation (keeps 3 most recent)"
    echo "  • Supports database and application backups"
    echo "  • Provides backup restoration capabilities"
}

# Backup configuration
BACKUP_DIR="/opt/profolio-backups"
BACKUP_RETENTION_COUNT=3

# Create backup with improved feedback
backup_create_backup() {
    local backup_type="$1"
    local backup_name="${backup_type}_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    info "Creating $backup_type backup..."
    
    # Backup database if it exists
    if command -v pg_dump >/dev/null 2>&1 && sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw profolio; then
        info "  → Backing up PostgreSQL database..."
        if sudo -u postgres pg_dump profolio > "$backup_path/database.sql" 2>/dev/null; then
            success "  ✅ Database backup created"
        else
            warn "  ⚠️  Database backup failed (database may not exist yet)"
        fi
    else
        info "  → No PostgreSQL database found to backup"
    fi
    
    # Backup application files
    if [[ -d "/opt/profolio" ]]; then
        info "  → Backing up application files..."
        if cp -r /opt/profolio "$backup_path/application" 2>/dev/null; then
            success "  ✅ Application backup created"
        else
            warn "  ⚠️  Application backup failed"
        fi
    else
        info "  → No application installation found to backup"
    fi
    
    # Backup environment files
    if [[ -f "/opt/profolio/.env" ]]; then
        info "  → Backing up environment configuration..."
        if cp /opt/profolio/.env "$backup_path/environment.env" 2>/dev/null; then
            success "  ✅ Environment configuration backed up"
        else
            warn "  ⚠️  Environment backup failed"
        fi
    fi
    
    # Create backup metadata
    cat > "$backup_path/backup-info.txt" << EOF
Backup Type: $backup_type
Created: $(date)
Created By: Profolio Installer v1.0.0
Platform: $(uname -s) $(uname -r)
EOF
    
    # Calculate backup size
    local backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "unknown")
    
    success "Backup created successfully"
    info "  📁 Location: $backup_path"
    info "  📏 Size: $backup_size"
    
    # Cleanup old backups
    backup_cleanup_old_backups "$backup_type"
    
    echo "$backup_path"  # Return backup path
}

# Cleanup old backups (keep only most recent)
backup_cleanup_old_backups() {
    local backup_type="$1"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        return 0
    fi
    
    # Count backups of this type
    local backup_count=$(ls -1 "$BACKUP_DIR" | grep "^${backup_type}_" | wc -l)
    
    if [[ "$backup_count" -gt "$BACKUP_RETENTION_COUNT" ]]; then
        local backups_to_remove=$((backup_count - BACKUP_RETENTION_COUNT))
        
        info "Cleaning up old backups (keeping $BACKUP_RETENTION_COUNT most recent)..."
        
        # Remove oldest backups
        ls -1t "$BACKUP_DIR" | grep "^${backup_type}_" | tail -n "$backups_to_remove" | while read -r old_backup; do
            if rm -rf "$BACKUP_DIR/$old_backup" 2>/dev/null; then
                info "  🗑️  Removed old backup: $old_backup"
            fi
        done
        
        success "Backup cleanup completed"
    fi
}

# List available backups
backup_list_backups() {
    local backup_type="${1:-all}"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        warn "No backup directory found"
        return 1
    fi
    
    echo -e "${CYAN}📁 Available Backups${NC}"
    echo "────────────────────────────────────────"
    
    local backup_found=false
    
    for backup_dir in "$BACKUP_DIR"/*; do
        if [[ -d "$backup_dir" ]]; then
            local backup_name=$(basename "$backup_dir")
            
            # Filter by type if specified
            if [[ "$backup_type" != "all" && ! "$backup_name" =~ ^${backup_type}_ ]]; then
                continue
            fi
            
            backup_found=true
            
            local backup_date=$(echo "$backup_name" | sed 's/.*_\([0-9]\{8\}_[0-9]\{6\}\)/\1/' | sed 's/_/ /')
            local backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "unknown")
            local backup_type_display=$(echo "$backup_name" | sed 's/_[0-9]\{8\}_[0-9]\{6\}$//')
            
            echo -e "${GREEN}•${NC} $backup_name"
            echo -e "  Type: $backup_type_display"
            echo -e "  Date: $backup_date"
            echo -e "  Size: $backup_size"
            echo ""
        fi
    done
    
    if [[ "$backup_found" == "false" ]]; then
        echo "No backups found"
        return 1
    fi
    
    return 0
}

# Restore from backup
backup_restore_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup not found: $backup_name"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  BACKUP RESTORATION${NC}"
    echo -e "${RED}This will replace your current installation with the backup.${NC}"
    echo -e "${RED}Current installation will be backed up before restoration.${NC}"
    echo ""
    
    read -p "Are you sure you want to restore from backup '$backup_name'? (y/n): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        info "Backup restoration cancelled"
        return 0
    fi
    
    # Create backup of current state before restoration
    info "Creating backup of current state before restoration..."
    backup_create_backup "pre-restore"
    
    # Restore application files
    if [[ -d "$backup_path/application" ]]; then
        info "Restoring application files..."
        
        # Stop services if running
        if systemctl is-active --quiet profolio-backend profolio-frontend 2>/dev/null; then
            info "Stopping services..."
            systemctl stop profolio-backend profolio-frontend 2>/dev/null || true
        fi
        
        # Remove current installation
        if [[ -d "/opt/profolio" ]]; then
            rm -rf /opt/profolio
        fi
        
        # Restore from backup
        if cp -r "$backup_path/application" /opt/profolio; then
            success "Application files restored"
        else
            error "Failed to restore application files"
            return 1
        fi
    fi
    
    # Restore database
    if [[ -f "$backup_path/database.sql" ]]; then
        info "Restoring database..."
        
        # Drop and recreate database
        sudo -u postgres dropdb profolio 2>/dev/null || true
        sudo -u postgres createdb profolio
        
        if sudo -u postgres psql profolio < "$backup_path/database.sql" >/dev/null 2>&1; then
            success "Database restored"
        else
            warn "Database restoration failed"
        fi
    fi
    
    # Restore environment configuration
    if [[ -f "$backup_path/environment.env" ]]; then
        info "Restoring environment configuration..."
        if cp "$backup_path/environment.env" /opt/profolio/.env; then
            success "Environment configuration restored"
        else
            warn "Environment configuration restoration failed"
        fi
    fi
    
    # Restart services
    info "Starting services..."
    if systemctl start profolio-backend profolio-frontend 2>/dev/null; then
        success "Services started successfully"
    else
        warn "Failed to start services - manual intervention may be required"
    fi
    
    success "Backup restoration completed"
    info "Restored from: $backup_name"
    
    return 0
}

# Get backup information
backup_get_backup_info() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        echo "Backup not found: $backup_name"
        return 1
    fi
    
    echo -e "${CYAN}📋 Backup Information${NC}"
    echo "────────────────────────────────────────"
    echo -e "${BLUE}Name:${NC} $backup_name"
    
    if [[ -f "$backup_path/backup-info.txt" ]]; then
        while IFS=': ' read -r key value; do
            echo -e "${BLUE}$key:${NC} $value"
        done < "$backup_path/backup-info.txt"
    fi
    
    local backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "unknown")
    echo -e "${BLUE}Size:${NC} $backup_size"
    
    echo ""
    echo -e "${BLUE}Contents:${NC}"
    if [[ -f "$backup_path/database.sql" ]]; then
        echo -e "  ✅ Database backup"
    else
        echo -e "  ❌ No database backup"
    fi
    
    if [[ -d "$backup_path/application" ]]; then
        echo -e "  ✅ Application files"
    else
        echo -e "  ❌ No application files"
    fi
    
    if [[ -f "$backup_path/environment.env" ]]; then
        echo -e "  ✅ Environment configuration"
    else
        echo -e "  ❌ No environment configuration"
    fi
    
    return 0
}

# Verify backup integrity
backup_verify_backup() {
    local backup_name="$1"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup not found: $backup_name"
        return 1
    fi
    
    info "Verifying backup integrity: $backup_name"
    
    local issues=0
    
    # Check backup metadata
    if [[ ! -f "$backup_path/backup-info.txt" ]]; then
        warn "Missing backup metadata file"
        ((issues++))
    fi
    
    # Check application backup
    if [[ -d "$backup_path/application" ]]; then
        if [[ ! -f "$backup_path/application/package.json" ]]; then
            warn "Application backup appears incomplete (no package.json)"
            ((issues++))
        fi
    fi
    
    # Check database backup
    if [[ -f "$backup_path/database.sql" ]]; then
        if [[ ! -s "$backup_path/database.sql" ]]; then
            warn "Database backup file is empty"
            ((issues++))
        fi
    fi
    
    if [[ $issues -eq 0 ]]; then
        success "Backup integrity verified"
        return 0
    else
        warn "Backup has $issues integrity issues"
        return 1
    fi
}

# Backward compatibility aliases
manage_backups() {
    backup_create_backup "$@"
}

# Module metadata
BACKUP_MANAGEMENT_VERSION="1.0.0"
BACKUP_MANAGEMENT_DEPENDENCIES="utils/logging.sh utils/ui.sh" 