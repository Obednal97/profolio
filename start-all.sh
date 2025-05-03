#!/bin/bash

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
  echo "DATABASE_URL=postgresql://profolio:temppassword@${LAN_IP}:5432/profolio" > "$ENV_FILE_BACKEND"
else
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:temppassword@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
  else
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:temppassword@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
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

# Install and start backend
echo "📦 Installing backend dependencies..."
cd backend
pnpm install

echo "🚀 Starting backend..."
pnpm run start:dev > /dev/null 2>&1 &
BACKEND_PID=$!

# Install and start frontend
cd ../frontend
echo "📦 Installing frontend dependencies..."
pnpm install

echo "🚀 Starting frontend on port 3001..."
PORT=3001 pnpm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 3

# Show access links
echo -e "\n✅ Profolio is now running!"
echo "🔐 Login here: http://${LAN_IP}:3001/login"
echo "🧠 Backend API is available at: http://${LAN_IP}:3000/api"
echo "📦 Container-ready. Both services are now running..."