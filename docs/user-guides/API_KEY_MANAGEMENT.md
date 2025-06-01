# 🗝️ API Key Management - User Guide

## Easy Google Places API Setup (No File Editing Required!)

Your property forms now include a user-friendly way to add Google Places API keys for enhanced address search - **no manual file editing needed**!

## 🚀 How to Add Your API Key

### Step 1: Access API Key Settings
When adding or editing a property, look for the address search section and click:
- **"Add API Key"** (if no key is set up)
- **"Manage API Key"** (if you already have one)

### Step 2: Get Your Google API Key
1. **Click the "Get API Key →" link** in the modal
2. **Follow the setup guide** built into the interface
3. **Copy your API key** from Google Cloud Console

### Step 3: Add & Test Your Key
1. **Paste your API key** into the input field
2. **Click "Test Key"** to verify it works
3. **Click "Save & Use"** to activate enhanced search

## 🎯 What You'll See

### Status Indicators
The address search shows which service is active:
- 🟢 **"Google Places (Stored)"** - Your API key is active
- 🟢 **"Google Places (Env)"** - Developer set key is active
- 🔵 **"OpenStreetMap"** - Using free fallback service

### Enhanced Features with Google API Key
- ⚡ **Real-time suggestions** as you type
- 🎯 **Precise address parsing** into separate fields
- 🌍 **Global coverage** with local knowledge
- 🏢 **Business locations** and landmarks
- 📍 **Accurate geocoding** for exact locations

## 🔧 Built-in Features

### API Key Validation
- **Live testing** verifies your key works
- **Detailed error messages** help troubleshoot issues
- **Status checking** shows connection problems

### Security & Privacy
- ✅ **Local storage** - keys stay on your device
- ✅ **No server uploads** - keys never leave your browser
- ✅ **Easy removal** - delete keys anytime
- ✅ **Environment fallback** - works with developer keys too

### Smart Fallback System
- **Automatic detection** of available API keys
- **Graceful degradation** to OpenStreetMap if Google fails
- **Visual feedback** shows which service is active
- **No data loss** - address search always works

## 🎉 Benefits of This Approach

### For Users
- **No technical setup** - just click and paste
- **Instant feedback** - test before saving
- **Visual guidance** - clear instructions included
- **Flexible management** - add, test, or remove keys easily

### For Developers
- **User empowerment** - users can enhance their own experience
- **No support burden** - users self-serve API setup
- **Backward compatibility** - environment variables still work
- **Progressive enhancement** - works without API keys

## 🔄 How Storage Works

### Priority Order
1. **User-stored key** (highest priority)
2. **Environment variable** (developer fallback)
3. **OpenStreetMap** (always available)

### Data Persistence
- **localStorage** keeps your API key between sessions
- **Browser-specific** - each device needs its own key
- **Instantly active** - no app restart required
- **Easy backup** - just save your API key text

## 🛠️ Troubleshooting

### "API Key Invalid" Error
- ✅ Check the key was copied correctly
- ✅ Verify Places API is enabled in Google Cloud
- ✅ Ensure billing is set up (required even for free tier)
- ✅ Check domain restrictions aren't too strict

### "Request Denied" Error
- ✅ Add your domain to API key restrictions
- ✅ Verify the API key has Places API permissions
- ✅ Check you haven't exceeded usage limits

### Address Search Not Working
- ✅ Try the "Test Key" button to verify connection
- ✅ Check browser console for error messages
- ✅ The system automatically falls back to OpenStreetMap

## 💡 Tips for Best Results

### API Key Setup
- **Restrict your key** to only Places APIs for security
- **Add domain restrictions** to prevent unauthorized use
- **Monitor usage** in Google Cloud Console
- **Start with free tier** - 1,000 searches/month free

### Using Address Search
- **Type at least 3 characters** before suggestions appear
- **Select from suggestions** for best field population
- **Use "Enter manually"** if you prefer typing addresses
- **Mix and match** - some fields auto-fill, others you can edit

This new system makes it easy for anyone to enhance their address search experience without needing technical knowledge! 🎉 