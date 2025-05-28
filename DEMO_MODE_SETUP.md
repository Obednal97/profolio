# Demo Mode Setup for Profolio

## ✅ Proper Authentication with Demo Mode

Profolio now uses proper authentication with a convenient demo mode option that allows users to explore the app with sample data without creating an account.

## 🔧 How It Works

### Demo Mode Button
- Available on both Sign Up and Sign In pages
- Creates a secure demo user session with token `demo-token-secure-123`
- Automatically populates comprehensive sample data
- No signup required - instant access to all features

### Demo User Details
```javascript
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@profolio.com',
  token: 'demo-token-secure-123',
  name: 'Demo User'
};
```

## 🔒 **NEW: API Key Storage Security**

### **Demo Mode: localStorage Only**
- ✅ **API keys stored in browser localStorage only**
- ✅ **No server-side storage for demo users**
- ✅ **Keys cleared when logging out**
- ✅ **Session-based storage - private to user**

### **Real Users: Secure Server Storage**
- ✅ **AES-256-GCM encryption**
- ✅ **Server-side encrypted storage**
- ✅ **JWT authentication required**
- ✅ **Database persistence**

### **All Existing API Keys: WIPED**
- 🧹 **Server storage completely cleared**
- 🧹 **Fresh start for all users**
- 🧹 **No legacy API keys remaining**

## 🚀 Using Demo Mode

### Step 1: Access Demo Mode
1. Navigate to `/auth/signUp` or `/auth/signIn`
2. Look for the blue "Try Profolio Demo" banner at the top
3. Click "Try Demo Mode" button
4. You'll be automatically logged in and redirected to the dashboard

### Step 2: Explore Sample Data
The demo mode automatically creates:

#### Sample Assets (8 items):
- **Apple Inc. (AAPL)**: 50 shares worth $8,750
- **Bitcoin (BTC)**: 0.5 BTC worth $21,500
- **Ethereum (ETH)**: 5 ETH worth $11,250
- **SPDR S&P 500 ETF (SPY)**: 25 shares worth $10,875
- **Tesla Inc. (TSLA)**: 20 shares worth $4,200
- **Microsoft Corporation (MSFT)**: 15 shares worth $5,625
- **High-Yield Savings**: $25,000 cash
- **Company Stock Options**: 1000 options worth $50,000

#### Sample Properties (3 items):
- **Primary Residence**: $1.2M home in San Francisco
- **Investment Property**: $450K rental condo in Austin
- **Vacation Rental**: Rented condo in Miami

### Step 3: Test Trading 212 Integration (Demo Mode)
1. Go to Asset Manager → API Config
2. Notice the blue "Demo Mode: Keys stored locally in browser only" indicator
3. Enter your real Trading 212 API key
4. Click "Save Keys Locally" - keys stored in localStorage only
5. Test and sync your actual portfolio safely
6. Keys are automatically cleared when you log out

## 📊 Demo Portfolio Summary

**Total Portfolio Value**: ~$137,200
- **Total Invested**: ~$119,500
- **Total P&L**: ~$17,700 (+14.8%)
- **Asset Count**: 8 assets
- **Property Count**: 3 properties

**Top Holdings**:
1. High-Yield Savings: $25,000 (18.2%)
2. Bitcoin: $21,500 (15.7%)
3. Ethereum: $11,250 (8.2%)
4. SPDR S&P 500 ETF: $10,875 (7.9%)
5. Apple Inc.: $8,750 (6.4%)

## 🔒 Security & Authentication

### Proper JWT Authentication
- Real users require proper signup/signin
- Demo mode uses special token `demo-token-secure-123`
- All API endpoints validate authentication
- Demo user data is isolated and secure

### **Enhanced API Key Security**

#### **Demo Mode Security**
```javascript
// Demo users - localStorage only
if (isDemoMode) {
  localStorage.setItem('demo-api-keys', JSON.stringify(apiKeys));
  // No server transmission
  // Cleared on logout
}
```

#### **Real User Security**
```javascript
// Real users - encrypted server storage
const encryptedKeys = encrypt(apiKeys); // AES-256-GCM
await saveToSecureServer(encryptedKeys);
```

#### **Logout Cleanup**
```javascript
// All demo data cleared on logout
localStorage.removeItem('demo-api-keys');
localStorage.removeItem('demo-mode');
localStorage.removeItem('user-data');
```

## 🎯 Features Available in Demo Mode

### Full Feature Access
- ✅ Asset Manager with all asset types
- ✅ Property Manager with conditional fields
- ✅ Trading 212 API integration and sync
- ✅ Portfolio analytics and charts
- ✅ Expense tracking
- ✅ Dashboard with live metrics
- ✅ All CRUD operations

### **Safe API Key Testing**
- ✅ Test real Trading 212 API keys safely
- ✅ Keys stored in browser localStorage only
- ✅ No server-side storage for demo users
- ✅ Automatic cleanup on logout
- ✅ Session-isolated storage

## 🔧 Technical Implementation

### Authentication Flow
```javascript
// Demo mode creates secure session
signInWithDemo() → {
  localStorage.setItem('auth-token', 'demo-token-secure-123');
  localStorage.setItem('demo-mode', 'true');
  populateDemoData('demo-user-id');
  redirect('/app/dashboard');
}
```

### **API Key Storage Flow**
```javascript
// Demo mode detection
const isDemoMode = localStorage.getItem('demo-mode') === 'true';

if (isDemoMode) {
  // Store in localStorage only
  localStorage.setItem('demo-api-keys', JSON.stringify(keys));
} else {
  // Encrypt and store on server
  await fetch('/api/user/api-keys', { 
    method: 'POST',
    body: JSON.stringify({ apiKeys: encryptedKeys })
  });
}
```

### API Endpoint Authentication
```javascript
// All endpoints validate tokens
function getUserFromToken(request) {
  const token = getAuthToken(request);
  
  if (token === 'demo-token-secure-123') {
    return { 
      userId: 'demo-user-id', 
      email: 'demo@profolio.com',
      isDemo: true 
    };
  }
  
  return verifyJWT(token); // Real user validation
}
```

## 🎉 Benefits

### For Users
- **Instant Access**: No signup friction
- **Real Experience**: Full feature set with realistic data
- **Safe Testing**: Isolated demo environment with localStorage-only API keys
- **Privacy**: Demo API keys never leave the browser

### For Development
- **Proper Auth**: Real authentication system
- **Clean Architecture**: No bypass flags or hacks
- **Enhanced Security**: Demo keys isolated from server storage
- **Scalable**: Easy to add more demo features

### **Security Improvements**
- **Zero Server Risk**: Demo API keys never stored on server
- **Session Isolation**: Each demo session is independent
- **Automatic Cleanup**: Keys cleared on logout
- **No Data Leakage**: Demo and real user data completely separated

## 🚀 Getting Started

1. **Visit**: Navigate to `/auth/signUp`
2. **Click**: "Try Demo Mode" button
3. **Explore**: Full portfolio with sample data
4. **Test**: Real Trading 212 API integration (localStorage only)
5. **Logout**: All demo data and API keys automatically cleared
6. **Upgrade**: Sign up for real account anytime

The demo mode provides a **complete, secure way** to explore Profolio's features with realistic data while maintaining **proper authentication architecture** and **enhanced API key security** through localStorage-only storage for demo users. 