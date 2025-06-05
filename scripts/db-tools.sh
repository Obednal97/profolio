#!/bin/bash

# Profolio Database Tools Script
# Provides database management automation for development
# Usage: ./scripts/db-tools.sh <command>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}📝 $1${NC}"
}

print_header() {
    echo -e "${BLUE}🗄️  $1${NC}"
    echo "======================================"
}

# Check if we're in project root and backend exists
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if backend has Prisma
if [ ! -f "backend/prisma/schema.prisma" ]; then
    print_error "Prisma schema not found. This project may not use Prisma."
    exit 1
fi

show_help() {
    echo "Profolio Database Tools"
    echo ""
    echo "Usage: ./scripts/db-tools.sh <command>"
    echo ""
    echo "Commands:"
    echo "  status          - Show database connection status"
    echo "  generate        - Generate Prisma client"
    echo "  migrate         - Run database migrations"
    echo "  migrate-dev     - Run migrations in development mode"
    echo "  migrate-reset   - Reset database and run all migrations"
    echo "  seed            - Seed database with sample data (if available)"
    echo "  studio          - Open Prisma Studio"
    echo "  backup          - Create database backup (PostgreSQL only)"
    echo "  restore         - Restore database from backup"
    echo "  logs            - Show recent database logs"
    echo "  inspect         - Inspect database schema"
    echo ""
    echo "Examples:"
    echo "  ./scripts/db-tools.sh status"
    echo "  ./scripts/db-tools.sh migrate-dev"
    echo "  ./scripts/db-tools.sh studio"
}

db_status() {
    print_header "Database Status"
    
    cd backend
    
    print_info "Checking database connection..."
    if pnpm prisma db pull --force 2>/dev/null; then
        print_status "Database connection successful"
    else
        print_error "Database connection failed"
        print_info "Check your DATABASE_URL in backend/.env"
        exit 1
    fi
    
    print_info "Checking Prisma client..."
    if [ -d "node_modules/.prisma" ]; then
        print_status "Prisma client is generated"
    else
        print_warning "Prisma client not found - run 'generate' command"
    fi
    
    cd ..
}

generate_client() {
    print_header "Generating Prisma Client"
    
    cd backend
    print_info "Generating Prisma client..."
    pnpm prisma generate
    print_status "Prisma client generated successfully"
    cd ..
}

run_migrations() {
    print_header "Running Database Migrations"
    
    cd backend
    print_info "Running migrations..."
    pnpm prisma migrate deploy
    print_status "Migrations completed successfully"
    cd ..
}

migrate_dev() {
    print_header "Running Development Migrations"
    
    cd backend
    print_info "Running development migrations..."
    pnpm prisma migrate dev
    print_status "Development migrations completed"
    cd ..
}

migrate_reset() {
    print_header "Resetting Database"
    
    print_warning "This will DELETE ALL DATA in your database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi
    
    cd backend
    print_info "Resetting database..."
    pnpm prisma migrate reset --force
    print_status "Database reset completed"
    cd ..
}

seed_database() {
    print_header "Seeding Database"
    
    cd backend
    
    # Check if seed script exists
    if grep -q '"prisma"' package.json && grep -q '"seed"' package.json; then
        print_info "Running database seed..."
        pnpm prisma db seed
        print_status "Database seeded successfully"
    else
        print_warning "No seed script found in backend/package.json"
        print_info "To add seeding, add this to backend/package.json:"
        echo '  "prisma": {'
        echo '    "seed": "ts-node prisma/seed.ts"'
        echo '  }'
    fi
    
    cd ..
}

open_studio() {
    print_header "Opening Prisma Studio"
    
    cd backend
    print_info "Starting Prisma Studio..."
    print_info "Studio will open at http://localhost:5555"
    pnpm prisma studio
    cd ..
}

backup_database() {
    print_header "Creating Database Backup"
    
    # Extract database URL components
    cd backend
    if [ ! -f ".env" ]; then
        print_error "Backend .env file not found"
        exit 1
    fi
    
    DATABASE_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2- | tr -d '"')
    
    if [[ $DATABASE_URL == postgresql* ]]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backups/profolio_backup_${TIMESTAMP}.sql"
        
        mkdir -p backups
        
        print_info "Creating PostgreSQL backup..."
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        print_status "Backup created: backend/$BACKUP_FILE"
    else
        print_error "Backup only supported for PostgreSQL databases"
        exit 1
    fi
    
    cd ..
}

restore_database() {
    print_header "Restoring Database from Backup"
    
    cd backend
    
    if [ ! -d "backups" ]; then
        print_error "No backups directory found"
        exit 1
    fi
    
    echo "Available backups:"
    ls -la backups/*.sql 2>/dev/null || {
        print_error "No backup files found"
        exit 1
    }
    
    read -p "Enter backup filename (from backups/): " BACKUP_FILE
    
    if [ ! -f "backups/$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    DATABASE_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2- | tr -d '"')
    
    print_warning "This will overwrite your current database!"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 0
    fi
    
    print_info "Restoring from backup..."
    psql "$DATABASE_URL" < "backups/$BACKUP_FILE"
    print_status "Database restored successfully"
    
    cd ..
}

show_logs() {
    print_header "Database Logs"
    
    print_info "Showing recent database activity..."
    print_warning "Log location depends on your database setup"
    
    # For Docker Compose setups
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.prod.yml" ]; then
        print_info "Checking Docker container logs..."
        docker compose logs db --tail=50 2>/dev/null || {
            print_info "No Docker database container found or not running"
        }
    fi
    
    # For local PostgreSQL
    if command -v pg_ctl &> /dev/null; then
        print_info "For local PostgreSQL, check:"
        echo "  - macOS: /usr/local/var/log/postgres.log"
        echo "  - Ubuntu: /var/log/postgresql/"
        echo "  - Windows: C:\\Program Files\\PostgreSQL\\{version}\\data\\log\\"
    fi
}

inspect_schema() {
    print_header "Inspecting Database Schema"
    
    cd backend
    
    print_info "Current Prisma schema:"
    echo "--------------------------------"
    cat prisma/schema.prisma
    echo "--------------------------------"
    
    print_info "Database introspection:"
    pnpm prisma db pull --print
    
    cd ..
}

# Main command handling
case "$1" in
    status)
        db_status
        ;;
    generate)
        generate_client
        ;;
    migrate)
        run_migrations
        ;;
    migrate-dev)
        migrate_dev
        ;;
    migrate-reset)
        migrate_reset
        ;;
    seed)
        seed_database
        ;;
    studio)
        open_studio
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    logs)
        show_logs
        ;;
    inspect)
        inspect_schema
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 