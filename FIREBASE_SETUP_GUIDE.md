# 🔥 Firebase Setup Guide for Cloud Mode

## 🎯 Overview
This guide will help you set up Firebase authentication for your Profolio installation running in cloud mode (exposed to the internet for friends to access).

## 📋 Prerequisites
- Firebase account (free tier is sufficient)
- Your Profolio server accessible from the internet

## 🚀 Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name**: `profolio-production` (or your preferred name)
4. **Disable Google Analytics** (not needed for authentication)
5. **Click "Create project"**

## 🔧 Step 2: Configure Authentication

1. **In Firebase Console, go to Authentication > Get started**
2. **Go to "Sign-in method" tab**
3. **Enable Email/Password**:
   - Click "Email/Password"
   - Enable "Email/Password"
   - Click "Save"
4. **Enable Google Sign-in**:
   - Click "Google"
   - Enable "Google"
   - Set support email (your email)
   - Click "Save"

## 🔑 Step 3: Get Configuration Values

1. **Go to Project Settings** (gear icon)
2. **Scroll down to "Your apps"**
3. **Click "Add app" > Web (</>) icon**
4. **Enter app nickname**: `profolio-web`
5. **Click "Register app"**
6. **Copy the config values** (you'll need these)

Example config:
```javascript
{
  apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q",
  authDomain: "profolio-production.firebaseapp.com",
  projectId: "profolio-production",
  storageBucket: "profolio-production.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
}
```

## 🌐 Step 4: Configure Authorized Domains

1. **In Firebase Console, go to Authentication > Settings**
2. **Scroll to "Authorized domains"**
3. **Add your domain**: `your-server.example.com` (your actual domain)
4. **Add localhost for testing**: `localhost` (if not already there)

## ⚙️ Step 5: Set Environment Variables

### **For Your Home Server**

Create or edit `/opt/profolio/frontend/.env.production`:

```bash
# Navigate to your server
ssh profolio@192.168.1.27
cd /opt/profolio/frontend

# Create production environment file
sudo nano .env.production
```

Add these variables:
```bash
# Authentication mode
NEXT_PUBLIC_AUTH_MODE=firebase

# Firebase configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=profolio-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=profolio-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=profolio-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345678

# Backend API URL (your server's URL)
NEXT_PUBLIC_API_URL=https://your-server.example.com:3001
```

### **For Development**

Create `frontend/.env.local` on your development machine:
```bash
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔧 Step 6: Update and Deploy

```bash
# On your server
cd /opt/profolio
sudo ./install-or-update.sh

# The installer will now use the environment variables
# and build in Firebase cloud mode
```

## ✅ Step 7: Verify Setup

1. **Visit your Profolio URL**
2. **You should see**:
   - ☁️ "Cloud mode" indicator on sign-in page
   - Google sign-in button
   - Firebase authentication working

## 🧪 Step 8: Test Authentication

1. **Try signing up** with a new email
2. **Try Google sign-in**
3. **Invite friends** to test the system
4. **Check Firebase Console** > Authentication > Users to see registered users

## 🔒 Security Best Practices

### **Environment Variables Only**
- ✅ Firebase config via environment variables
- ❌ No firebase-config.json in repository
- ✅ Each environment has separate config

### **Domain Security**
- Only add trusted domains to Firebase authorized domains
- Use HTTPS for production domains
- Restrict API keys if needed

### **Firebase Security Rules**
Add to Firebase Console > Authentication > Settings > Advanced:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 🚨 Troubleshooting

### **Build Fails with Auth Errors**
```bash
# Check environment variables are set
cd /opt/profolio/frontend
cat .env.production

# Should show your Firebase config
```

### **"Firebase config not available"**
1. Verify `.env.production` file exists
2. Check all required variables are set
3. Restart the build process

### **"Domain not authorized"**
1. Add your domain to Firebase authorized domains
2. Wait 5-10 minutes for changes to propagate

### **Google Sign-in Not Working**
1. Verify Google provider is enabled in Firebase
2. Check your domain is authorized
3. Ensure HTTPS is used (required for Google auth)

## 📊 Configuration Matrix

| Environment | File | Auth Mode | Firebase Config | Backend URL |
|-------------|------|-----------|----------------|-------------|
| **Your Server** | `.env.production` | `firebase` | Environment vars | `https://yourserver:3001` |
| **Development** | `.env.local` | `firebase` | Environment vars | `http://localhost:3001` |
| **Demo/Local** | Default | `local` | Not needed | `http://localhost:3001` |

## 🎉 Success!

Your Profolio instance is now running in cloud mode with:
- ✅ Firebase authentication
- ✅ Google sign-in for friends
- ✅ Secure environment-based configuration
- ✅ Professional user experience

**Your friends can now sign up and use your Profolio installation!** 🎊 