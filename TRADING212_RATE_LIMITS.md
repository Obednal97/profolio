# Trading 212 API Rate Limits Guide

## 🚦 Understanding Rate Limits

Trading 212 implements strict rate limits to protect their servers and ensure fair usage across all API users.

### **Common Rate Limit Errors**
- `429 Too Many Requests` - You've exceeded the allowed request rate
- Rate limits reset after a specific time period
- Limits apply per API key, not per application

## ⏱️ **Rate Limit Details**

### **Typical Limits** (Based on Trading 212 Documentation)
- **Requests per minute**: ~60 requests
- **Requests per hour**: ~1000 requests  
- **Burst requests**: Limited short-term bursts allowed

### **Reset Timing**
- Rate limits typically reset every **1 minute**
- Some limits may have **hourly** reset periods
- Wait times can vary based on usage patterns

## 🔧 **How Profolio Handles Rate Limits**

### **Built-in Rate Limiting (NEW!)**
Profolio now includes intelligent rate limiting to prevent hitting Trading 212's limits:

```typescript
// Automatic 2.5-second spacing between requests (Trading 212 limit is 2s)
private minRequestInterval = 2500; // 2.5 seconds between requests

// Sequential API calls instead of concurrent bursts
const positions = await this.getPortfolio();
const instruments = await this.getInstruments();
const accountCash = await this.getAccountCash();
```

### **Smart Request Management**
- ✅ **Sequential Requests** - No more concurrent API call bursts
- ✅ **Automatic Delays** - 2.5-second minimum between requests
- ✅ **Intelligent Batching** - Groups related requests efficiently
- ✅ **Graceful Fallbacks** - Continues if non-critical requests fail

### **User-Friendly Messages**
- ⏱️ **Clear explanation** of what happened
- 🕒 **Suggested wait time** before retrying
- 💡 **Tips** for avoiding future rate limits

## 🎯 **Best Practices**

### **For Testing API Keys**
1. **Test once** - Don't repeatedly test the same key
2. **Wait between tests** - Allow 1-2 minutes between attempts
3. **Use valid keys** - Invalid keys still count against limits

### **For Portfolio Syncing**
1. **Sync sparingly** - Once per day is usually sufficient
2. **Cache results** - Profolio stores your data locally
3. **Avoid frequent syncs** - Your portfolio doesn't change every minute

### **If You Hit Rate Limits**
1. **Wait 5-10 minutes** before trying again
2. **Check your API usage** - Are other apps using the same key?
3. **Contact Trading 212** if limits seem too restrictive

## 🛠️ **Troubleshooting Rate Limits**

### **Error: "429 Too Many Requests"**
```
⏱️ Trading 212 Rate Limit Exceeded

You've made too many API requests recently. 
Please wait 5-10 minutes before trying again.

Tip: Trading 212 has strict rate limits to protect their servers.
```

**Solutions:**
- ✅ Wait 5-10 minutes before retrying
- ✅ Reduce frequency of API calls
- ✅ Check if other applications are using your API key

### **Persistent Rate Limit Issues**
1. **Check API key usage** across all applications
2. **Review Trading 212 account status**
3. **Contact Trading 212 support** if issues persist

## 📊 **Rate Limit Monitoring**

### **What Profolio Does (ENHANCED!)**
- ✅ **Built-in rate limiting** - 2.5-second minimum between requests
- ✅ **Sequential processing** - No concurrent request bursts
- ✅ **Smart error detection** - Identifies rate limit issues
- ✅ **Automatic delays** - Prevents overwhelming the API
- ✅ **Progress logging** - Shows sync progress in console
- ✅ **Graceful degradation** - Continues if optional data fails

### **What You Should Do**
- ✅ **Test API keys once** when setting up
- ✅ **Sync portfolio occasionally** (daily/weekly)
- ✅ **Wait when prompted** by rate limit messages
- ✅ **Use demo mode** for testing without affecting real quotas

## 🎉 **Success Tips**

### **Efficient API Usage**
1. **One-time setup** - Test and save your API key once
2. **Periodic syncing** - Sync your portfolio weekly or when needed
3. **Local caching** - Rely on Profolio's cached data between syncs
4. **Demo mode testing** - Use demo mode to test features without API calls

### **Avoiding Rate Limits**
- 🚫 **Don't spam the test button** - Test once, then save
- 🚫 **Don't sync repeatedly** - Your data is cached locally
- 🚫 **Don't share API keys** - Each key has its own limits
- ✅ **Do wait when prompted** - Respect the rate limits
- ✅ **Trust Profolio's rate limiting** - Built-in protection prevents issues

## 🔗 **Additional Resources**

- [Trading 212 API Documentation](https://t212public-api-docs.redoc.ly/)
- [Trading 212 Support](https://www.trading212.com/help)
- [API Rate Limiting Best Practices](https://docs.github.com/en/rest/guides/best-practices-for-integrators)

---

**Remember**: Rate limits are there to protect the service. Profolio now includes built-in rate limiting to work with them automatically! 🤝 