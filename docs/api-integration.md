# 🔌 API Integration Guide

This guide covers integrating external financial APIs with Profolio, with detailed focus on Trading 212 API implementation.

## 📋 **Overview**

Profolio supports secure integration with financial service providers to automatically sync portfolio data. Currently supported:

- **Trading 212 API** - Full integration with live portfolio sync
- **Manual Import** - CSV/JSON file imports
- **Future APIs** - Planned support for additional brokers

---

## 🏦 **Trading 212 Integration**

### **Features Supported**

✅ **Portfolio Sync:**
- Real-time position data
- Historical transaction data
- Account balance information
- Performance metrics

✅ **Security Features:**
- AES-256-GCM API key encryption
- Demo mode for safe testing
- Rate limit compliance
- Secure credential storage

✅ **Data Types:**
- Equity positions (stocks, ETFs)
- Forex positions
- CFD positions (where available)
- Dividend history
- Order history

### **Setup Process**

#### 1. **Get Trading 212 API Key**

1. Log into your Trading 212 account
2. Go to Settings → API Settings
3. Generate a new API key
4. Copy the key securely

#### 2. **Add to Profolio**

**Production Mode:**
```bash
# In Profolio settings:
1. Navigate to Settings → API Keys
2. Select "Trading 212"
3. Enter your API key
4. Click "Save and Encrypt"
5. Test connection
```

**Demo Mode (Safe Testing):**
```bash
# For testing without server storage:
1. Enable Demo Mode in settings
2. API keys stored in browser localStorage only
3. No server-side storage
4. Automatically cleared on logout
```

### **Rate Limits & Usage**

#### **Current Limits**
| Endpoint Type | Requests per Minute | Daily Limit |
|---------------|-------------------|-------------|
| Account Info | 5 requests | 100 requests |
| Portfolio Data | 10 requests | 500 requests |
| Historical Data | 2 requests | 50 requests |
| Order History | 5 requests | 200 requests |

#### **Rate Limit Handling**
- **Automatic Backoff:** Profolio automatically respects rate limits
- **Queue Management:** Requests are queued and spaced appropriately
- **Error Handling:** Graceful degradation when limits are reached
- **User Notification:** Clear messages about rate limit status

#### **Best Practices**
- **Sync Frequency:** Default sync every 15 minutes during market hours
- **Manual Refresh:** Available with rate limit checking
- **Batch Operations:** Multiple data types synced in single API session
- **Caching:** Local caching reduces API calls

### **API Endpoints Used**

#### **Authentication**
```http
GET /equity/account/cash
Authorization: YOUR_API_KEY
```

#### **Portfolio Positions**
```http
GET /equity/portfolio
Authorization: YOUR_API_KEY
```

#### **Historical Data**
```http
GET /history/transactions
Authorization: YOUR_API_KEY
```

#### **Account Information**
```http
GET /equity/account/info
Authorization: YOUR_API_KEY
```

### **Security Implementation**

#### **API Key Protection**
- **Encryption:** AES-256-GCM encryption at rest
- **Transmission:** HTTPS-only communication
- **Storage:** Encrypted in database with unique salt
- **Access:** Server-side decryption only when needed

#### **Demo Mode Security**
```javascript
// Demo mode - localStorage only storage
const demoApiKeys = {
  trading212: 'encrypted_key_here',
  stored: 'localStorage_only',
  server_storage: false
};

// Automatic cleanup on logout
function logout() {
  localStorage.removeItem('demo-api-keys');
  localStorage.removeItem('auth-token');
}
```

#### **Security Audit Results**
✅ **No API keys in source code**  
✅ **Encrypted storage implementation**  
✅ **Secure transmission protocols**  
✅ **Demo mode isolation**  
✅ **Automatic credential rotation support**  

### **Error Handling**

#### **Common Errors**
| Error Code | Description | Resolution |
|------------|-------------|------------|
| 401 | Invalid API key | Check key validity and regenerate |
| 429 | Rate limit exceeded | Wait for reset, adjust sync frequency |
| 503 | Service unavailable | Trading 212 maintenance, retry later |
| 400 | Bad request | Check API parameters |

#### **Error Recovery**
- **Automatic Retry:** Exponential backoff for temporary errors
- **User Notification:** Clear error messages with suggested actions
- **Fallback Mode:** Continue with cached data when API unavailable
- **Health Monitoring:** API status tracking and reporting

### **Data Processing**

#### **Portfolio Sync Process**
1. **Authentication Check** - Verify API key validity
2. **Rate Limit Check** - Ensure within limits
3. **Data Retrieval** - Fetch latest portfolio data
4. **Data Validation** - Verify data integrity
5. **Database Update** - Store normalized data
6. **Cache Update** - Update local cache
7. **UI Refresh** - Update user interface

#### **Data Normalization**
```typescript
interface NormalizedPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  source: 'trading212' | 'manual';
  lastUpdated: Date;
}
```

### **Troubleshooting**

#### **Connection Issues**
```bash
# Test API connectivity
curl -H "Authorization: YOUR_API_KEY" \
     https://live.trading212.com/api/v0/equity/account/cash

# Check rate limit status
curl -H "Authorization: YOUR_API_KEY" \
     https://live.trading212.com/api/v0/equity/account/info
```

#### **Common Solutions**
- **API Key Expired:** Regenerate in Trading 212 settings
- **Rate Limited:** Reduce sync frequency in Profolio settings
- **Data Mismatch:** Verify account type (Live vs Practice)
- **Connection Failed:** Check internet connectivity and Trading 212 status

---

## 🔮 **Future API Integrations**

### **Planned Support**
- **Interactive Brokers** - Professional trading platform
- **Alpaca** - Commission-free trading
- **Yahoo Finance** - Market data and basic portfolio tracking
- **Alpha Vantage** - Financial data and analytics

### **Integration Framework**
```typescript
interface APIProvider {
  name: string;
  authenticate: (credentials: Credentials) => Promise<boolean>;
  fetchPortfolio: () => Promise<Portfolio>;
  fetchTransactions: () => Promise<Transaction[]>;
  rateLimits: RateLimitConfig;
}
```

### **Contributing API Integrations**
See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on adding new API providers.

---

## 📊 **API Usage Analytics**

### **Monitoring Dashboard**
Track your API usage in Profolio:
- Real-time rate limit status
- Daily/monthly API call counts
- Error rate tracking
- Performance metrics

### **Cost Optimization**
- Intelligent sync scheduling
- Delta updates when possible
- Cached data utilization
- Batch operation optimization

---

## 🔗 **External Resources**

- [Trading 212 API Documentation](https://t212openapi.docs.apiary.io/)
- [API Key Security Best Practices](../SECURITY.md)
- [Demo Mode Setup Guide](features/demo-mode.md)
- [Development Setup](../CONTRIBUTING.md)

---

**Need Help?** Open an issue on [GitHub](https://github.com/Obednal97/profolio/issues) with the `api-integration` label. 