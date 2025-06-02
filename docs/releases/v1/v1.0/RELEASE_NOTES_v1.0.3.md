# Profolio v1.0.3 Release Notes

**Release Date**: January 31, 2025

## 🚨 Critical Production Build Fixes

This is a **critical patch release** that resolves production build failures introduced in v1.0.2. If you experienced build errors when updating to v1.0.2, this release fixes those issues.

## 🐛 Key Fixes

### **Build & Deployment Issues**
- ✅ **Fixed DOMMatrix SSR Error**: Resolved `DOMMatrix is not defined` error in expense import page
- ✅ **Fixed API Route Static Generation**: Resolved dynamic server usage errors preventing production builds
- ✅ **Fixed PDF Parser SSR Issues**: Prevented PDF.js from being loaded during server-side rendering
- ✅ **Enhanced Network Error Handling**: Better handling of Yahoo Finance API connectivity issues

### **Technical Improvements**
- **Dynamic Imports**: Implemented dynamic imports for browser-only components (PDF uploader, transaction review)
- **API Route Configuration**: Marked API routes as `dynamic = 'force-dynamic'` to prevent static generation
- **Loading States**: Added proper loading states for client-side only components
- **Error Recovery**: Improved error handling for market data service failures

## 🔧 What Was Fixed

### **Production Build Errors**
```
Error: DOMMatrix is not defined
Error: Route couldn't be rendered statically because it used `request.headers`
Error: Route couldn't be rendered statically because it used `request.url`
```

### **Pages Affected**
- ✅ Expense Import Page (`/app/expenses/import`)
- ✅ API Routes (`/api/integrations/product-search/search`)
- ✅ API Routes (`/api/integrations/symbols/cached-price/[symbol]`)
- ✅ API Routes (`/api/user/api-keys`)
- ✅ API Routes (`/api/market-data/portfolio-history/[userId]`)

## 🚀 Migration Notes

### **Upgrading from v1.0.2**
This is a **drop-in replacement** - no database changes or configuration updates required.

1. **Pull latest changes**: `git pull origin main`
2. **Install dependencies**: `npm install` (if needed)
3. **Rebuild frontend**: The build should now complete successfully
4. **Restart services**: No service configuration changes needed

### **New Installations**
No special considerations - the installer will work normally with these fixes included.

## 📊 Impact

**Before v1.0.3**: Production builds failed with SSR and static generation errors  
**After v1.0.3**: Clean production builds with proper client-side hydration

## 🔗 Related Issues

This release specifically addresses:
- Server-side rendering errors with PDF.js library
- Static generation failures in API routes
- Network connectivity issues with Yahoo Finance API
- Loading state improvements for dynamic components

## 📝 Support

If you still experience build issues after upgrading to v1.0.3:

1. **Clear build cache**: `rm -rf .next && npm run build`
2. **Check logs**: Look for any remaining SSR errors
3. **Report issues**: Create a GitHub issue with build logs

---

**Previous Release**: [v1.0.2 Release Notes](RELEASE_NOTES_v1.0.2.md)  
**Full Changelog**: [View on GitHub](../../CHANGELOG.md)

Thank you for your patience with these build issues! 🚀 