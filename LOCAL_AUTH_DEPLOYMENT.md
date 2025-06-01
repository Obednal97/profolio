# Local Authentication Deployment Guide

## 🎯 What We Built

We've created a **unified authentication system** that automatically detects whether to use:

- **🏠 Local Authentication** - For self-hosted (talks to your backend API)
- **☁️ Firebase Authentication** - For hosted/SaaS (with Google sign-in)

## 🚀 Deploy to Production

### Option 1: Environment Variable (Recommended)

1. **SSH into your production server:**
   ```bash
   ssh profolio@192.168.1.27
   ```

2. **Create frontend environment file:**
   ```bash
   sudo nano /opt/profolio/frontend/.env.production
   ```

3. **Add this content:**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_AUTH_MODE=local
   NODE_ENV=production
   ```

4. **Update and restart:**
   ```bash
   cd /opt
   sudo ./install-or-update.sh
   ```

### Option 2: Remove Firebase Config (Automatic Detection)

If you prefer automatic detection, just ensure there's no `firebase-config.json`:

```bash
sudo rm -f /opt/profolio/frontend/public/firebase-config.json
```

The system will automatically detect this and switch to local auth mode.

## ✅ What You'll Get

### Self-Hosted Mode Features:
- ✅ **Local database authentication** (PostgreSQL + JWT)
- ✅ **Username/password sign-up and sign-in**
- ✅ **Demo mode** (sample data, no account needed)
- ✅ **No Firebase dependency**
- ✅ **No Google sign-in button** (perfect for offline/air-gapped)
- ✅ **Privacy-focused** (all data stays local)

### UI Changes:
- **Sign-in page shows:** "🏠 Self-hosted mode"
- **Only shows:** Email/Password fields + Demo mode
- **No Google sign-in button**
- **No "Forgot password" link**

## 🔧 Backend API Endpoints

Your backend already has these endpoints working:

- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user  
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/profile` - Get user profile

## 🎮 Test the System

1. **Visit your site:** https://profolio.bednal.com
2. **Try Demo Mode:** Click "Try Demo" (no account needed)
3. **Create Account:** Use the sign-up form
4. **Sign In:** Use your new credentials

## 🔀 Switch Between Modes

You can easily switch between authentication modes:

### Force Local Mode:
```bash
export NEXT_PUBLIC_AUTH_MODE=local
```

### Force Firebase Mode:
```bash
export NEXT_PUBLIC_AUTH_MODE=firebase
```

### Automatic Detection:
Remove the environment variable and it will auto-detect based on Firebase config availability.

## 🚨 Migration Notes

**Existing Firebase Users:** If you have existing Firebase users, they won't be able to sign in to the local system. You'll need to:

1. Export user list from Firebase Console
2. Create accounts in the local system
3. Or run both systems in parallel during migration

**Data:** All your existing portfolio data should remain intact since it's stored in the PostgreSQL database.

## 🎉 Benefits Achieved

✅ **True Self-Hosted** - No external dependencies  
✅ **Privacy-Focused** - All authentication stays local  
✅ **Network Independent** - Works offline/air-gapped  
✅ **Simple Setup** - Just username/password  
✅ **Maintains UX** - Same interface, different backend  
✅ **Demo Mode** - Easy testing without accounts  

Your Profolio is now truly self-hosted! 🏠 