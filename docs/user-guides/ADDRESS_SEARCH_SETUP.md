# Enhanced Address Search Setup

## Overview

The property form includes smart address auto-fill functionality that can use either:
- **Google Places API** (recommended) - More accurate, comprehensive results using official Google APIs
- **OpenStreetMap/Nominatim** (default) - Free fallback service

## 🗝️ Google Places API Setup (Recommended)

### Step 1: Google Cloud Console Setup
1. **Visit**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Sign in** with your Google account  
3. **Create new project** or select existing one
4. **Enable billing** (required, but includes generous free tier)

### Step 2: Enable Required APIs
In your Google Cloud project, enable these APIs:
- **Places API** (Legacy) - for place details and autocomplete
- **Places API (New)** (recommended for future-proofing)
- **Geocoding API** (optional, for enhanced address parsing)

**Navigation**: APIs & Services → Library → Search for each API → Enable

### Step 3: Create and Secure Your API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. **Copy the generated key immediately**
4. **CRITICAL**: Click **RESTRICT KEY** for security:

   **Application Restrictions** (choose one):
   - **HTTP referrers**: Add `localhost:3000/*` and `yourdomain.com/*`
   - **IP addresses**: For server-side usage only

   **API Restrictions**:
   - Select "Restrict key"
   - Choose only: Places API, Places API (New), Geocoding API

### Step 4: Add to Your Environment
Create/update your `.env.local` file:
```bash
# Google Places API for enhanced address search
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyC_your_actual_api_key_here
```

### Step 5: Restart Development Server
```bash
npm run dev
```

## 💰 Current Google Places API Pricing (2024)

### Free Tier (Monthly)
- **Places Autocomplete**: First 1,000 requests FREE
- **Place Details**: First 1,000 requests FREE
- **Geocoding**: First 40,000 requests FREE

### Paid Rates (After Free Tier)
- **Places Autocomplete**: $0.00283 per request (~$2.83 per 1,000)
- **Place Details**: $0.017 per request (~$17 per 1,000)
- **Most users stay within free tier**

*Source: [Google Maps Platform Pricing](https://developers.google.com/maps/documentation/places/web-service/legacy/search)*

## 🚀 Enhanced Implementation Features

### Google Places API Integration:
- ✅ **Official Google Places Autocomplete API** for real-time suggestions
- ✅ **Place Details API** for structured address components  
- ✅ **Session tokens** for cost optimization
- ✅ **Automatic fallback** to OpenStreetMap if Google fails
- ✅ **Global coverage** with smart country filtering

### Smart Address Parsing:
- 🎯 **Precise field mapping**: Street number + route → street address
- 🏙️ **Locality detection**: City, town, village hierarchy
- 🗺️ **Administrative levels**: State/region parsing
- 📮 **Postal codes**: ZIP/postal code extraction
- 🌍 **Country detection**: Full country names

## Features Comparison

| Feature | Google Places | OpenStreetMap |
|---------|---------------|---------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Global Coverage** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Auto-completion** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Address Parsing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Business Listings** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Cost** | Paid (generous free tier) | Free |
| **Setup Required** | Yes (API key) | No |

## How It Works

### With Google Places API:
1. **Type address** → Real-time suggestions from Google Places Autocomplete
2. **Select suggestion** → Fetch detailed components via Place Details API
3. **Auto-populate** → Street, city, state, postal code, country fields
4. **Fallback** → OpenStreetMap if Google API fails

### Without API Key:
1. **Type address** → Suggestions from OpenStreetMap Nominatim
2. **Select suggestion** → Parse available address components  
3. **Auto-populate** → Available address fields
4. **Still functional** → Just less accurate than Google

## 🔒 Security Best Practices

- ✅ **API key restrictions** to specific APIs and domains
- ✅ **Environment variables** keep keys secure client-side
- ✅ **Session tokens** for cost optimization
- ✅ **Rate limiting** built into implementation
- ✅ **Fallback system** ensures functionality without API key

## 🛠️ Troubleshooting

### Address Search Not Working
1. **Check API key** in `.env.local` file
2. **Verify APIs enabled** in Google Cloud Console  
3. **Check browser console** for error messages
4. **API key restrictions** might be too strict
5. **Billing enabled** in Google Cloud (required even for free tier)

### Common Error Messages
- **"API key not valid"** → Check key is correct and APIs are enabled
- **"Request denied"** → Check API restrictions and referrer settings  
- **"Over query limit"** → You've exceeded free tier (check billing)
- **"Request was denied"** → API might not be enabled

### Getting API Errors
1. **Google Cloud billing** must be set up (even for free usage)
2. **Rate limits** - don't exceed 100 requests/second
3. **API permissions** - ensure key has access to Places APIs
4. **Referrer restrictions** - check domain whitelist matches your site
5. **System automatically falls back** to OpenStreetMap on errors

## 📊 Visual Indicators

The address search shows which service is active:
- 🟢 **"Google Places"** badge - Enhanced search enabled
- 🔵 **"OpenStreetMap"** badge - Using free fallback service  
- ⚠️ **Info banner** - Instructions for enabling Google Places API
- 🔄 **Loading spinner** - API request in progress

## 📚 Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/legacy/search)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Places API Pricing](https://developers.google.com/maps/billing/gmp-billing#places) 