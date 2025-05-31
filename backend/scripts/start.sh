#!/bin/bash

# Get LAN IP address
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
if [[ -z "$LAN_IP" ]]; then
  echo "❌ Unable to determine LAN IP address."
  exit 1
fi

# Update backend .env file with current IP
ENV_FILE_BACKEND="$(dirname "$0")/backend/.env"

if [ -f "$ENV_FILE_BACKEND" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
  else
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://profolio:CHANGE_THIS_PASSWORD@${LAN_IP}:5432/profolio|" "$ENV_FILE_BACKEND"
  fi
  echo "✅ Updated DATABASE_URL in backend/.env"
else
  echo "❌ backend/.env not found. Cannot update DATABASE_URL."
  exit 1
fi

exit 0