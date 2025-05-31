#!/bin/bash

echo "🔧 Setting up environment files for production deployment..."

# Detect if we're in development or production
if [ "$NODE_ENV" = "development" ] || [ -f "/Users/$(whoami)" ]; then
    echo "🔍 Development environment detected"
    DB_HOST="localhost"
    DB_NAME="profolio_dev"
    PORT=3001
else
    echo "🚀 Production environment detected"
    DB_HOST="192.168.1.27"
    DB_NAME="profolio"
    PORT=3001
fi

# Create backend .env file
echo "📝 Creating backend .env file..."
cat > /opt/profolio/backend/.env << EOF
DATABASE_URL="postgresql://profolio:temppassword@${DB_HOST}:5432/${DB_NAME}"
JWT_SECRET="production-jwt-secret-change-this-in-production-environment"
API_ENCRYPTION_KEY="production-api-encryption-key-32b!"
PORT=${PORT}
NODE_ENV=production
EOF

# Set proper permissions
chown profolio:profolio /opt/profolio/backend/.env 2>/dev/null || echo "Note: Could not set ownership (running as non-root)"
chmod 600 /opt/profolio/backend/.env

echo "✅ Environment configured successfully"
echo "🔐 Database: ${DB_HOST}:5432/${DB_NAME}"
echo "🔐 Backend will run on port ${PORT}" 