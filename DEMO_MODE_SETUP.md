# Demo Mode Setup for Trading 212 Integration

## ✅ Demo Mode Now Enabled

The Trading 212 integration now supports demo mode, allowing you to test with your real API key without requiring authentication.

## 🔧 How It Works

### Automatic Demo User Fallback
All API endpoints now automatically fall back to a demo user when:
- No authorization header is provided
- Authorization header contains `demo-token` or `dev-token-123`
- JWT token verification fails

### Demo User Details
```javascript
const DEMO_USER = {
  userId: 'demo-user-id',
  email: 'demo@example.com'
};
```

## 🚀 Testing Your Trading 212 API Key

### Step 1: Access Asset Manager
1. Navigate to `/app/assetManager`
2. Click the "API Config" button
3. The modal will open without requiring authentication

### Step 2: Enter Your Trading 212 API Key
1. In the "Trading 212 API Key" field, enter your real API key
2. Click the "Test" button to validate the connection
3. You should see a green checkmark if the key is valid

### Step 3: Save API Key
1. Click "Save API Keys" 
2. Your key will be encrypted and stored securely
3. Associated with the demo user ID for testing

### Step 4: Sync Portfolio
1. After saving your API key, click "Sync Trading 212 Portfolio"
2. The system will:
   - Test your API key connection
   - Fetch your complete portfolio from Trading 212
   - Import all positions, cash, and historical data
   - Show a detailed success summary

## 📊 What Gets Synced

### Portfolio Data
- **All Positions**: Stocks, ETFs, REITs
- **Cash Balance**: Free and invested cash
- **Historical Data**: Price history from your actual trades
- **Dividends**: Complete dividend payment history
- **Performance Metrics**: P&L, ROI, portfolio analytics

### Asset Information
- **Real-time Values**: Current market prices
- **Purchase History**: Your actual buy prices and dates
- **Asset Classification**: Automatic categorization
- **ISIN Codes**: Complete instrument metadata

## 🔒 Security in Demo Mode

### API Key Protection
- Keys are still encrypted with AES-256-GCM
- Stored server-side, not in localStorage
- Associated with demo user ID
- Can be deleted/updated anytime

### Data Isolation
- Demo user data is isolated from production users
- No cross-contamination with real user accounts
- Safe for testing and development

## 🎯 Expected Results

After syncing, you should see:
```
Successfully synced X assets from Trading 212!

Portfolio Summary:
• Total Value: $X,XXX.XX
• Total P&L: +$XXX.XX (X.XX%)
• Cash Balance: $XXX.XX
• Positions: X

Top Holdings:
• Asset Name: $X,XXX.XX (XX.X%)
• Asset Name: $X,XXX.XX (XX.X%)
• Asset Name: $X,XXX.XX (XX.X%)

Synced at: [timestamp]
```

## 🔧 Troubleshooting

### API Key Issues
- Ensure your Trading 212 API key has the correct permissions
- Check that you're using the live Trading 212 API (not demo/paper trading)
- Verify the key hasn't expired

### Connection Problems
- Check your internet connection
- Ensure Trading 212 API is accessible from your location
- Try the "Test" button before syncing

### No Data Synced
- Verify you have positions in your Trading 212 account
- Check that your account has trading history
- Ensure the API key has read permissions

## 📝 API Endpoints Used

The integration uses these Trading 212 API endpoints:
- `/api/v0/equity/account/info` - Account validation
- `/api/v0/equity/portfolio` - Current positions
- `/api/v0/equity/metadata/instruments` - Asset metadata
- `/api/v0/equity/account/cash` - Cash balances
- `/api/v0/equity/history/orders` - Historical trades
- `/api/v0/history/dividends` - Dividend history

## 🎉 Success!

Once synced, your Trading 212 portfolio will be fully integrated into Profolio with:
- Real-time portfolio tracking
- Historical performance analysis
- Comprehensive asset management
- Detailed financial insights

The demo mode allows you to test all features safely before moving to production authentication. 