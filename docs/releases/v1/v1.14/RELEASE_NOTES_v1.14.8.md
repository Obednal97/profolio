# Release Notes - v1.14.8

**Released**: 31st August 2025  
**Type**: Critical Runtime Fix  
**Compatibility**: Fully backward compatible

---

## 🚨 **Critical Runtime Fix**

This release fixes a critical runtime error that prevented the backend service from starting when Stripe API keys were not configured.

## 🐛 **Bug Fix**

### Backend Service Startup Failure
- **Issue**: Backend crashed on startup with error: `Neither apiKey nor config.authenticator provided`
- **Cause**: Stripe SDK was being initialized with empty string when API key not configured
- **Fix**: Made Stripe billing completely optional - service starts without Stripe credentials
- **Impact**: Self-hosted installations without billing can now run successfully

## 🔧 **Technical Details**

**File Modified:**
- `backend/src/app/api/billing/billing.service.ts`

**Changes Made:**
1. Initialize Stripe as null when API key not configured
2. Added Stripe availability checks to all billing methods
3. Methods now throw `BadRequestException` with "Billing is not configured" when Stripe unavailable
4. Service logs warning but continues startup without Stripe

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.8:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**This version fixes the runtime error that was causing automatic rollback during updates.**

## 📊 **Release Statistics**

- **Critical Issue Fixed**: Backend service startup failure
- **Files Changed**: 1 (billing.service.ts)
- **Build Status**: ✅ Backend builds and starts successfully
- **Testing**: Verified service starts without Stripe configuration

---

**Important**: This release makes billing features optional, allowing self-hosted installations to run without Stripe integration.