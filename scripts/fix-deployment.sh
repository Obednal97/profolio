#!/bin/bash

echo "🚀 Profolio Deployment Fix Script"
echo "=================================="

# 1. Fix Backend Service
echo "🔧 Fixing Backend Service..."

# Create proper .env file
echo "📝 Creating backend .env file..."
cat > /opt/profolio/backend/.env << 'EOF'
DATABASE_URL="postgresql://profolio:temppassword@192.168.1.27:5432/profolio"
JWT_SECRET="production-jwt-secret-key-change-this-in-production-environment"
API_ENCRYPTION_KEY="production-api-encryption-key-32b!"
PORT=3001
NODE_ENV=production
EOF

# Fix the existing start-backend.sh script
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

chmod +x /opt/profolio/backend/scripts/start-backend.sh

# 2. Fix Frontend MDX Issues
echo "🔧 Fixing Frontend Build Issues..."

cd /opt/profolio/frontend

# Install missing MDX dependencies
echo "📦 Installing MDX dependencies..."
sudo -u profolio npm install @next/mdx @mdx-js/loader @mdx-js/react

# Add MDX configuration to next.config.js
echo "🔍 Checking Next.js configuration..."
if ! grep -q "@next/mdx" next.config.js 2>/dev/null; then
    echo "⚠️  Adding MDX configuration to next.config.js..."
    
    # Backup existing config
    if [ -f "next.config.js" ]; then
        cp next.config.js next.config.js.backup
    fi
    
    # Create/update next.config.js with MDX support
    cat > next.config.js << 'EOF'
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    mdxRs: false,
  },
}

module.exports = withMDX(nextConfig)
EOF
    
    echo "✅ MDX configuration added"
else
    echo "✅ MDX configuration already present"
fi

# 3. Update systemd service
echo "🔧 Updating systemd service..."
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

# 4. Set proper permissions
echo "🔐 Setting permissions..."
chown -R profolio:profolio /opt/profolio/
chmod +x /opt/profolio/backend/scripts/start-backend.sh

# 5. Add production scripts
echo "📦 Adding production scripts..."
cd /opt/profolio/backend
npm pkg set scripts.start:prod="npm run build && npm run start"

# 6. Reload systemd
systemctl daemon-reload

# 7. Test frontend build
echo "🏗️  Testing frontend build..."
cd /opt/profolio/frontend
sudo -u profolio npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed - check logs above"
    exit 1
fi

echo ""
echo "✅ All fixes applied successfully!"
echo "🔄 Now run: sudo systemctl restart profolio-backend profolio-frontend"
echo "📊 Check status: sudo systemctl status profolio-backend profolio-frontend" 