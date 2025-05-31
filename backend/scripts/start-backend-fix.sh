#!/bin/bash

echo "🔧 Fixing Backend Service Configuration..."

# 1. Create proper .env file
echo "📝 Creating backend .env file..."
cat > /opt/profolio/backend/.env << 'EOF'
DATABASE_URL="postgresql://profolio:temppassword@192.168.1.27:5432/profolio"
JWT_SECRET="production-jwt-secret-key-change-this-in-production-environment"
API_ENCRYPTION_KEY="production-api-encryption-key-32b!"
PORT=3001
NODE_ENV=production
EOF

# 2. Fix the existing start-backend.sh script
echo "🛠️ Fixing backend start script..."
cat > /opt/profolio/backend/scripts/start-backend.sh << 'EOF'
#!/bin/bash
set -e
export PATH="/usr/local/bin:/usr/bin:$PATH"
cd /opt/profolio/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm ci --production
fi

# Build the application
npm run build

# Start the application
npm run start
EOF

# 3. Make script executable
chmod +x /opt/profolio/backend/scripts/start-backend.sh

# 4. Update systemd service to use correct paths
cat > /etc/systemd/system/profolio-backend.service << 'EOF'
[Unit]
Description=Profolio Backend
After=network.target postgresql.service

[Service]
Type=simple
User=profolio
Group=profolio
WorkingDirectory=/opt/profolio/backend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStartPre=/bin/bash -c '/opt/profolio/backend/scripts/start.sh || true'
ExecStart=/opt/profolio/backend/scripts/start-backend.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 5. Add production build script to package.json
echo "📦 Adding production scripts..."
cd /opt/profolio/backend
npm pkg set scripts.start:prod="npm run build && npm run start"

# 6. Set proper permissions
chown -R profolio:profolio /opt/profolio/
chmod +x /opt/profolio/backend/scripts/start-backend.sh

# 7. Reload systemd
systemctl daemon-reload

echo "✅ Backend service configuration fixed!"
echo "🔄 Now run: sudo systemctl restart profolio-backend" 