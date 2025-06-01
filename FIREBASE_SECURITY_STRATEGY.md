# Firebase Security Strategy for Monorepo

## 🎯 **The Challenge**
How to securely handle Firebase configuration in a monorepo that serves both:
- **🏠 Self-hosted** (no Firebase needed)
- **☁️ Cloud/SaaS** (requires Firebase secrets)

## 🛡️ **Multi-Layer Security Strategy**

### **1. Environment-Based Configuration**

#### **Development Environment**
```bash
# .env.local (never committed)
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project
```

#### **Production Cloud Environment**
```bash
# Deployed via CI/CD or hosting platform
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_prod_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_prod_project
```

#### **Self-Hosted Environment**
```bash
# .env.production (on self-hosted server)
NEXT_PUBLIC_AUTH_MODE=local
# No Firebase variables needed
```

### **2. Dynamic Configuration Loading**

#### **Enhanced AuthConfig with Environment Variables**
```typescript
// Enhanced version of authConfig.ts
function getFirebaseConfigFromEnv() {
  if (typeof window === 'undefined') return null;
  
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

async function getFirebaseConfig() {
  // Try environment variables first
  const envConfig = getFirebaseConfigFromEnv();
  if (envConfig && envConfig.apiKey) {
    return envConfig;
  }
  
  // Fallback to firebase-config.json for backward compatibility
  try {
    const response = await fetch('/firebase-config.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Firebase config file not found, using environment variables');
  }
  
  return null;
}
```

### **3. Deployment Strategies**

#### **Option A: Environment-Only (Recommended)**
- **No `firebase-config.json` in repository**
- **All secrets via environment variables**
- **CI/CD injects secrets at build time**

```yaml
# GitHub Actions example
- name: Build for Cloud
  env:
    NEXT_PUBLIC_AUTH_MODE: firebase
    NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
  run: npm run build
```

#### **Option B: Separate Repositories**
- **Main repo**: Self-hosted only (no Firebase)
- **Private cloud repo**: Fork with Firebase secrets
- **Automated sync**: Changes from main → cloud repo

#### **Option C: Template-Based**
- **Repository contains**: `firebase-config.template.json`
- **Deployment script**: Generates real config from environment
- **Self-hosted**: Skips Firebase config entirely

### **4. Build-Time Configuration**

#### **Smart Build Script**
```javascript
// next.config.js
module.exports = {
  env: {
    AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || 'local',
  },
  
  // Conditionally exclude Firebase if not needed
  webpack: (config, { isServer }) => {
    if (process.env.NEXT_PUBLIC_AUTH_MODE === 'local') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/app': false,
        'firebase/auth': false,
      };
    }
    return config;
  },
};
```

## 🚀 **Recommended Implementation**

### **Step 1: Remove firebase-config.json from Repository**
```bash
git rm frontend/public/firebase-config.json
echo "frontend/public/firebase-config.json" >> .gitignore
```

### **Step 2: Update Firebase Initialization**
```typescript
// lib/firebase.ts
export async function initializeFirebase() {
  const config = getFirebaseConfigFromEnv();
  
  if (!config || !config.apiKey) {
    throw new Error('Firebase configuration not available');
  }
  
  const { initializeApp } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  
  const app = initializeApp(config);
  return { auth: getAuth(app) };
}
```

### **Step 3: Secure Deployment Patterns**

#### **For Cloud/SaaS Deployment**
```bash
# Vercel/Netlify environment variables
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myapp-prod
```

#### **For Self-Hosted Deployment**
```bash
# .env.production on server
NEXT_PUBLIC_AUTH_MODE=local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎛️ **Configuration Matrix**

| Environment | Auth Mode | Firebase Config | Source |
|-------------|-----------|----------------|---------|
| **Development** | Firebase | Required | `.env.local` |
| **Cloud Production** | Firebase | Required | CI/CD env vars |
| **Self-Hosted** | Local | Not needed | `.env.production` |
| **Demo/Testing** | Local | Not needed | Default |

## 🔒 **Security Benefits**

✅ **No Secrets in Repository**: All sensitive data via environment  
✅ **Environment Isolation**: Dev/staging/prod completely separate  
✅ **Self-Hosted Privacy**: No Firebase deps or network calls  
✅ **CI/CD Security**: Secrets injected at build time only  
✅ **Backward Compatible**: Existing installs continue working  

## 🚨 **Security Checklist**

- [ ] Remove `firebase-config.json` from repository
- [ ] Add Firebase config to `.gitignore`
- [ ] Set up environment variables in deployment platforms
- [ ] Test both auth modes in staging
- [ ] Verify no secrets in build artifacts
- [ ] Document deployment process for each mode

## 📖 **For Your Setup**

### **Self-Hosted (Current)**
```bash
# Your production server
echo 'NEXT_PUBLIC_AUTH_MODE=local' | sudo tee -a /opt/profolio/frontend/.env.production
```

### **Future Cloud Deployment**
```bash
# When you deploy SaaS version
export NEXT_PUBLIC_AUTH_MODE=firebase
export NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
export NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
# etc...
```

This strategy provides **maximum security** while supporting both deployment modes from the same codebase! 🛡️ 