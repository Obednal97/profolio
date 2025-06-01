# Configuration Guide - Profolio

## 🔥 Firebase Configuration Setup

### Quick Start
```bash
# 1. Copy the template
cp frontend/public/firebase-config.json.template frontend/public/firebase-config.json

# 2. Edit with your Firebase project details
nano frontend/public/firebase-config.json
```

### Why Public Directory?
Firebase configuration goes in `frontend/public/firebase-config.json` because:
- The frontend loads it via `fetch('/firebase-config.json')`
- Firebase API keys are designed to be public (security via Firebase rules)
- This is the standard Firebase web app pattern

### Your Firebase Config
Edit `frontend/public/firebase-config.json`:
```json
{
  "apiKey": "AIza...your-real-firebase-api-key",
  "authDomain": "your-project.firebaseapp.com", 
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef123456",
  "measurementId": "G-XXXXXXXXXX"
}
```

**Get these values from:** [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps

## 🌍 Environment Variables (.env files)

### Multiple .env Files Explained

#### 1. Root `/.env.local` (Project-wide)
```bash
# Project-wide development variables
NODE_ENV=development
```

#### 2. Backend `/backend/.env` (Server secrets)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/profolio"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-here"

# API Keys (backend services only)
TRADING_212_API_KEY="your-trading-212-api-key"
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
POLYGON_API_KEY="your-polygon-key"

# Server config
PORT=3001
```

#### 3. Backend `/backend/.env.development` (Dev overrides)
```bash
# Development-specific overrides
DATABASE_URL="postgresql://localhost:5432/profolio_dev"
LOG_LEVEL="debug"
```

### When to Use Which

| Configuration Type | Location | Purpose | Gitignored |
|-------------------|----------|---------|------------|
| Firebase Config | `frontend/public/firebase-config.json` | Client auth & config | ✅ |
| Backend Secrets | `backend/.env` | Server API keys, DB, JWT | ✅ |
| Dev Overrides | `backend/.env.development` | Development settings | ✅ |
| Project Settings | `/.env.local` | Build & deployment | ✅ |

## 🛡️ Security Best Practices

### ✅ What's Safe
- **Firebase API keys in public directory** (secured by Firebase rules)
- **Environment variables in .env files** (gitignored)
- **Template files** (committed for guidance)

### ❌ What's Dangerous  
- **Committing real .env files** 
- **Hardcoding secrets in source code**
- **Backend API keys in frontend code**

## 🚀 Setup Checklist

### Initial Setup
- [ ] Copy `firebase-config.json.template` to `firebase-config.json`
- [ ] Add your Firebase project details
- [ ] Create `backend/.env` with your secrets
- [ ] Verify files are gitignored: `git status` should not show them

### Security Check
```bash
# These should return empty (files are gitignored):
git status | grep firebase-config.json
git status | grep "\.env"

# These should exist (your local config):
ls frontend/public/firebase-config.json
ls backend/.env
```

### Common Issues

#### "Firebase config not found"
```bash
# Solution: Create the config file
cp frontend/public/firebase-config.json.template frontend/public/firebase-config.json
# Then edit with your Firebase project details
```

#### "Backend API errors"
```bash
# Solution: Check backend/.env exists and has required variables
cat backend/.env  # Should show your environment variables
```

#### "Files showing in git status"
```bash
# Solution: Add to .gitignore
echo "firebase-config.json" >> frontend/.gitignore
echo ".env" >> backend/.gitignore
```

## 🔧 Development Workflow

### 1. New Developer Setup
```bash
# Clone repository
git clone https://github.com/Obednal97/profolio.git
cd profolio

# Setup Firebase
cp frontend/public/firebase-config.json.template frontend/public/firebase-config.json
# Edit firebase-config.json with your project details

# Setup backend environment
cp backend/.env.example backend/.env  # If example exists
# Or create backend/.env with required variables

# Install dependencies
pnpm install
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Environment Management
```bash
# Development
pnpm run dev:backend    # Uses .env and .env.development
pnpm run dev:frontend   # Uses firebase-config.json

# Production
# Uses production Firebase project and backend/.env with production values
```

## 🆘 Troubleshooting

### Firebase Authentication Issues
1. Check `firebase-config.json` exists and has correct project ID
2. Verify Firebase Auth is enabled in Firebase Console
3. Check Firebase Auth domain settings

### Backend API Issues  
1. Verify `backend/.env` has all required variables
2. Check database connection string
3. Confirm API keys are valid

### Build Issues
1. Ensure no sensitive files are missing from .gitignore
2. Check that template files exist for CI/CD
3. Verify environment variables are available in production

## 📚 Related Documentation
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

---

**Need Help?** 
- 🐛 [Report Issues](https://github.com/Obednal97/profolio/issues)
- 📖 [Security Policy](SECURITY.md)
- 🔧 [Contributing Guide](CONTRIBUTING.md) 