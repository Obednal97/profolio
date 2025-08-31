# Environment Configuration Templates

This file contains environment templates for different deployment scenarios.

## Important: Environment Preservation During Updates

When updating Profolio using the installer (`install.sh`), the installer will:
- **Preserve existing environment files by default** when you choose "Yes" for environment preservation (default option)
- **Preserve custom settings** like Stripe keys, Firebase Admin SDK, and other custom configurations
- **Update only core settings** like database credentials while keeping your custom configurations intact
- **Automatically detect** which environment files you're using (.env, .env.production, .env.local)

## Development Environment Template (.env)

```bash
# Profolio Development Environment Configuration
# This file contains shared, non-sensitive defaults for both frontend & backend

# === Application Information ===
NEXT_PUBLIC_APP_NAME=Profolio
NEXT_PUBLIC_APP_VERSION=1.11.15
NODE_ENV=development

# === Deployment Configuration ===
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted
NEXT_PUBLIC_AUTH_MODE=firebase

# === API Configuration ===
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_API_PROXY=true

# === Feature Flags ===
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
NEXT_PUBLIC_SHOW_LANDING_PAGE=true
NEXT_PUBLIC_ALLOW_REGISTRATION=true
NEXT_PUBLIC_SHOW_BRANDING=true

# === Development Settings ===
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=info

# === External API Keys ===
# NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# === Firebase Configuration ===
# Configure these for Firebase authentication:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
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
NEXT_PUBLIC_API_URL=http://SERVER_IP:3001
NEXT_PUBLIC_ENABLE_API_PROXY=false

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

## Backend Environment Template (.env)

```bash
# Profolio Backend Configuration
# Contains database and security settings

# === Database Configuration ===
DATABASE_URL="postgresql://profolio:GENERATED_PASSWORD@localhost:5432/profolio"

# === Security Configuration ===
JWT_SECRET="GENERATED_JWT_SECRET"
API_ENCRYPTION_KEY="GENERATED_API_KEY"

# === Application Configuration ===
PORT=3001
NODE_ENV=production

# === Optional Configuration ===
# LOG_LEVEL=info
# MAX_CONNECTIONS=100

# === Stripe Configuration (Optional) ===
# Billing features - will be preserved during updates
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
# STRIPE_PRICE_CLOUD_MONTHLY=price_your_monthly_price_id
# STRIPE_PRICE_CLOUD_ANNUAL=price_your_annual_price_id

# === Firebase Admin SDK (Optional) ===
# For server-side Firebase operations - will be preserved during updates
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

## Local Development Frontend Override (.env.local)

```bash
# Local development overrides
# This file overrides settings for local development

# === Authentication Mode Override ===
NEXT_PUBLIC_AUTH_MODE=firebase

# === Development Flags ===
NODE_ENV=development
NEXT_PUBLIC_ENABLE_API_PROXY=false
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=true

# === Firebase Configuration for Development ===
# Configure these for Firebase testing:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_dev_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id
```
