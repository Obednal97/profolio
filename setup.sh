#!/bin/bash

# Provisioning and setup script for Profolio environment

# Get LAN IP address
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
if [[ -z "$LAN_IP" ]]; then
  echo "❌ Unable to determine LAN IP address."
  exit 1
fi

# Ensure pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "🔧 pnpm not found. Installing..."
  npm install -g pnpm
fi

# Ensure PostgreSQL is installed
if ! command -v psql &> /dev/null; then
  echo "🔧 PostgreSQL not found. Installing..."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt update && sudo apt install -y postgresql
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install postgresql
  else
    echo "❌ Unsupported OS. Please install PostgreSQL manually."
    exit 1
  fi
fi

# Update/create .env file(s)
echo "📁 Ensuring .env files exist and are updated..."

ENV_FILE_BACKEND="./backend/.env"
ENV_FILE_FRONTEND="./frontend/.env"

mkdir -p ./backend
mkdir -p ./frontend

if [ ! -f "$ENV_FILE_BACKEND" ]; then
  echo "Creating backend .env..."
  echo "DATABASE_URL=postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio" > "$ENV_FILE_BACKEND"
else
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
  else
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
  fi
fi

if [ ! -f "$ENV_FILE_FRONTEND" ]; then
  echo "Creating frontend .env..."
  echo "NEXT_PUBLIC_API_URL=http://${LAN_IP}:3000/api" > "$ENV_FILE_FRONTEND"
else
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://${LAN_IP}:3000/api|" "$ENV_FILE_FRONTEND"
  else
    sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://${LAN_IP}:3000/api|" "$ENV_FILE_FRONTEND"
  fi
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
echo "📦 Installing frontend dependencies..."
pnpm install

echo -e "\n✅ Setup complete!"
echo "🔐 Backend is configured to connect to PostgreSQL at: postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio"
echo "🧠 Frontend is configured to connect to backend API at: http://${LAN_IP}:3000/api"
echo
echo "👉 Next steps:"
echo "   - Start the backend service with: systemctl start profolio-backend"
echo "   - Start the frontend service with: systemctl start profolio-frontend"
echo
echo "📦 Once started, you can access the frontend login page at: http://${LAN_IP}:3001/login"