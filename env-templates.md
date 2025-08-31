# Environment Configuration Templates

This file contains environment templates for different deployment scenarios.

## Important: Environment Preservation During Updates

When updating Profolio using the installer (`install.sh`), the installer will:
- **Preserve existing environment files by default** when you choose "Yes" for environment preservation (default option)
- **Preserve custom settings** like Stripe keys, Firebase Admin SDK, and other custom configurations
- **Update only core settings** like database credentials while keeping your custom configurations intact
- **Automatically detect** which environment files you're using (.env, .env.production, .env.local)

## Environment File Structure

Profolio uses the following environment file hierarchy:

1. **Root `.env`** - Shared configuration across frontend and backend (public variables)
2. **Backend `backend/.env`** - Backend-only secrets and configuration (database, JWT, Stripe keys, etc.)
3. **Frontend `frontend/.env.local`** - Local development overrides for frontend
4. **Frontend `frontend/.env.production`** - Production frontend configuration (created by installer)

## Root Environment Template (.env)

```bash
# Profolio Root Environment Configuration
# Shared configuration across frontend and backend

# === Application Metadata ===
NEXT_PUBLIC_APP_NAME=Profolio
NEXT_PUBLIC_APP_VERSION=1.14.8
NODE_ENV=production
INSTALL_DATE=2025-08-31
INSTALLER_VERSION=v2.1

# === Deployment Configuration ===
NEXT_PUBLIC_DEPLOYMENT_MODE=cloud
# NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
NEXT_PUBLIC_AUTH_MODE=firebase
# NEXT_PUBLIC_AUTH_MODE=local

# === Server Configuration ===
NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_API_URL=http://192.168.1.27:3001
SERVER_IP=192.168.1.27
FRONTEND_PORT=3000
BACKEND_PORT=3001

# === Feature Flags ===
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_SHOW_LANDING_PAGE=true
NEXT_PUBLIC_ALLOW_REGISTRATION=true
NEXT_PUBLIC_SHOW_BRANDING=true
NEXT_PUBLIC_USE_MOCK_API=false

# === Firebase Client Configuration (Public) ===
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# === Stripe Configuration ===
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
# NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

## Frontend Local Environment Template (.env.local)

```bash
# Local development overrides for frontend
# This file overrides settings for local development only
# Created by installer for production deployments

# === Development Settings ===
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=warn
NEXT_PUBLIC_ENABLE_API_PROXY=true

# === External API Keys (Frontend Only) ===
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Backend Environment Template (.env)

```bash
# Profolio Backend Configuration
# Contains backend-only secrets and configuration

# === Database Configuration ===
DATABASE_URL="postgresql://username@localhost:5432/profolio_dev"

# === Security Secrets (NEVER COMMIT TO VERSION CONTROL) ===
JWT_SECRET=your_jwt_secret_base64_encoded
API_ENCRYPTION_KEY="your_api_encryption_key_base64"

# === Firebase Admin SDK Configuration (Backend Only) ===
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# === Stripe Configuration (Backend Only) ===
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# Webhook endpoint URL: https://your-domain.com/api/billing/webhook
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_CLOUD_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_CLOUD_ANNUAL=price_your_annual_price_id

# === Backend Application Configuration ===
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Production Frontend Environment Template (.env.production)

```bash
# Profolio Production Frontend Configuration
# Created by installer for production deployments

# === Application Information ===
NEXT_PUBLIC_APP_NAME=Profolio
NODE_ENV=production

# === Deployment Configuration ===
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
NEXT_PUBLIC_AUTH_MODE=local

# === API Configuration ===
NEXT_PUBLIC_API_URL=http://192.168.1.27:3001
NEXT_PUBLIC_ENABLE_API_PROXY=true

# === Feature Flags ===
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
NEXT_PUBLIC_SHOW_LANDING_PAGE=true
NEXT_PUBLIC_ALLOW_REGISTRATION=true
NEXT_PUBLIC_SHOW_BRANDING=true

# === Production Settings ===
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=warn

# === External API Keys ===
# NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# === Firebase Configuration (Optional) ===
# Uncomment and configure for Firebase authentication:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```
