# Trading 212 API Integration - Enhanced Features

## 🚀 **Overview**

Profolio now features a comprehensive Trading 212 API integration that utilizes the full spectrum of Trading 212's public API endpoints. This integration goes far beyond basic portfolio syncing to provide deep insights into your Trading 212 account.

## 📊 **Core Features**

### **Portfolio Management**
- ✅ **Complete Portfolio Sync** - All positions, cash, and metadata
- ✅ **Real-time Position Data** - Current prices, P&L, quantities
- ✅ **Historical Price Data** - Built from your actual trading history
- ✅ **Asset Classification** - Automatic categorization (stocks, ETFs, REITs)
- ✅ **Multi-currency Support** - Handles GBP, USD, EUR accounts

### **Pies Integration** 🥧
- ✅ **Pie Discovery** - Automatically detects all your pies
- ✅ **Pie Composition** - Shows which assets belong to which pies
- ✅ **Pie Performance** - Individual pie P&L and progress tracking
- ✅ **Pie Management** - View, create, update, and delete pies
- ✅ **Pie Analytics** - Diversification and allocation insights

### **Advanced Analytics**
- ✅ **Dividend Tracking** - Complete dividend history and projections
- ✅ **Transaction History** - Full order and transaction records
- ✅ **Performance Metrics** - ROI, P&L, appreciation calculations
- ✅ **Risk Analysis** - Portfolio diversification and concentration
- ✅ **Cash Management** - Free cash, invested amounts, pie cash

## 🔧 **API Endpoints Utilized**

### **Account & Authentication**
```
GET /api/v0/equity/account/info     - Account metadata
GET /api/v0/equity/account/cash     - Cash balances
```

### **Portfolio & Positions**
```
GET /api/v0/equity/portfolio        - All positions
GET /api/v0/equity/portfolio/{ticker} - Specific position
POST /api/v0/equity/portfolio/ticker  - Search positions
```

### **Pies Management**
```
GET /api/v0/equity/pies            - All pies
GET /api/v0/equity/pies/{id}       - Pie details
POST /api/v0/equity/pies           - Create pie
POST /api/v0/equity/pies/{id}      - Update pie
DELETE /api/v0/equity/pies/{id}    - Delete pie
POST /api/v0/equity/pies/{id}/duplicate - Duplicate pie
```

### **Orders & Trading**
```
GET /api/v0/equity/orders          - Current orders
GET /api/v0/equity/orders/{id}     - Order details
POST /api/v0/equity/orders/limit   - Place limit order
POST /api/v0/equity/orders/market  - Place market order
POST /api/v0/equity/orders/stop    - Place stop order
DELETE /api/v0/equity/orders/{id}  - Cancel order
```

### **Historical Data**
```
GET /api/v0/equity/history/orders  - Order history
GET /api/v0/history/dividends      - Dividend history
GET /api/v0/history/transactions   - Transaction history
GET /api/v0/history/exports        - Export management
```

### **Metadata**
```
GET /api/v0/equity/metadata/instruments - All instruments
GET /api/v0/equity/metadata/exchanges   - Exchange schedules
```

## 📈 **Enhanced Data Processing**

### **Smart Asset Classification**
```typescript
// Automatic type detection
STOCK → 'stock'     // Regular stocks
ETF   → 'stock'     // ETFs treated as stocks
REIT  → 'property'  // REITs as property investments
```

### **Historical Price Building**
- Uses your actual order history to build price charts
- Deduplicates and sorts chronologically
- Adds current price as latest data point
- Handles multiple fills and partial orders

### **Pie Information Enhancement**
```typescript
// Each asset includes pie context
{
  pie_info: {
    pieId: 4372625,
    pieName: "Tech Growth",
    pieShare: 15.5  // Percentage of pie
  }
}
```

## 🎯 **Profolio Integration**

### **Asset Manager Enhancements**
- **Pie Badges** - Visual indicators for pie membership
- **Enhanced Tooltips** - Shows pie allocation percentages
- **Pie Filtering** - Filter assets by pie membership
- **Pie Performance** - Individual pie P&L tracking

### **Dashboard Insights**
- **Portfolio Diversification** - Pie vs individual holdings
- **Performance Attribution** - Pie vs stock performance
- **Risk Metrics** - Concentration analysis
- **Cash Allocation** - Free vs invested vs pie cash

### **Sync Capabilities**
```typescript
// Comprehensive sync response
{
  accountInfo: { id, currency },
  portfolioSummary: { totalValue, totalPnL, ... },
  piesCount: 3,
  piesSummary: [...],
  insights: {
    hasActivePies: true,
    portfolioPerformance: 'positive',
    diversification: { ... }
  }
}
```

## 🛡️ **Security & Error Handling**

### **Enhanced Error Detection**
- **Rate Limit Handling** - Intelligent backoff and user guidance
- **Authentication Errors** - Clear API key troubleshooting
- **Permission Issues** - Specific scope requirement messages
- **Network Timeouts** - Retry suggestions and status checks

### **Error Response Examples**
```json
{
  "error": "Trading 212 rate limit exceeded",
  "details": "Please wait 5-10 minutes before trying again",
  "suggestions": [
    "Wait 5-10 minutes before testing again",
    "Avoid testing the same API key repeatedly",
    "Check if other applications are using the same API key"
  ]
}
```

## 🔍 **API Testing & Validation**

### **Comprehensive Test Endpoint**
```
POST /api/trading212/test
```

**Response includes:**
- Account validation
- Portfolio access verification
- Pie read capabilities
- Cash balance access
- API scope confirmation

### **Test Response Example**
```json
{
  "success": true,
  "message": "Trading 212 API connection successful!",
  "accountInfo": {
    "id": 1340610,
    "currencyCode": "GBP"
  },
  "portfolioSummary": {
    "positionsCount": 15,
    "piesCount": 3,
    "hasCash": true,
    "totalCash": 1250.50
  },
  "apiCapabilities": {
    "canReadPortfolio": true,
    "canReadPies": true,
    "hasPositions": true,
    "hasPies": true
  }
}
```

## 📊 **Data Insights & Analytics**

### **Portfolio Performance**
- **Total P&L** - Absolute and percentage gains/losses
- **Asset Performance** - Individual position tracking
- **Pie Performance** - Pie-level P&L analysis
- **Dividend Yield** - Historical and projected dividends

### **Risk Analysis**
- **Concentration Risk** - Top holdings percentage
- **Diversification Score** - Asset spread analysis
- **Pie Allocation** - Automated vs manual investing
- **Cash Utilization** - Investment efficiency metrics

### **Market Insights**
- **Exchange Distribution** - Geographic diversification
- **Sector Analysis** - Industry allocation (via instrument metadata)
- **Currency Exposure** - Multi-currency risk assessment
- **Trading Activity** - Order frequency and patterns

## 🚀 **Future Enhancements**

### **Planned Features**
- **Order Placement** - Direct trading through Profolio
- **Pie Optimization** - Rebalancing suggestions
- **Alert System** - Price and performance notifications
- **Advanced Analytics** - Sharpe ratio, beta calculations
- **Tax Reporting** - Capital gains and dividend summaries

### **API Expansion**
- **Real-time Data** - WebSocket integration for live prices
- **News Integration** - Company and market news
- **Research Data** - Analyst ratings and recommendations
- **Social Features** - Pie sharing and community insights

## 📚 **Documentation & Support**

### **Resources**
- [Trading 212 API Documentation](https://t212public-api-docs.redoc.ly/)
- [Rate Limits Guide](./TRADING212_RATE_LIMITS.md)
- [Security Audit](./TRADING212_SECURITY_AUDIT.md)

### **Getting Started**
1. **Get API Key** - Enable API access in Trading 212 settings
2. **Test Connection** - Use the API Config modal to test
3. **Sync Portfolio** - Import your complete portfolio
4. **Explore Features** - Discover pies, analytics, and insights

### **Support**
- Check rate limits if experiencing issues
- Verify API key permissions for full functionality
- Review error messages for specific troubleshooting steps
- Contact Trading 212 support for API-related account issues

---

**Note**: This integration respects Trading 212's rate limits and follows their API best practices. All data is processed securely and stored according to Profolio's privacy policy. 