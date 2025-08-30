# Stripe Environment Variables Setup

## ⚠️ Security Warning
**NEVER put your Stripe Secret Key in frontend environment variables!**
The secret key has full access to your Stripe account and must only be on the backend.

## Development Setup (Local)

### Frontend Environment Variables
**File:** `/frontend/.env.local`

```env
# Stripe Publishable Key (safe for frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...xyz

# Auth mode (to enable billing menu)
NEXT_PUBLIC_AUTH_MODE=firebase

# Backend URL (if not using default)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend Environment Variables
**File:** `/backend/.env`

```env
# Stripe Secret Key (NEVER put in frontend!)
STRIPE_SECRET_KEY=sk_test_51ABC...xyz

# Webhook Secret (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_ABC123...

# Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_CLOUD_MONTHLY=price_1ABC...
STRIPE_PRICE_CLOUD_ANNUAL=price_2DEF...

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## Production Setup

### Frontend Production Variables
Set these in your hosting platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...xyz
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Backend Production Variables
Set these in your backend hosting platform:

```env
STRIPE_SECRET_KEY=sk_live_51ABC...xyz
STRIPE_WEBHOOK_SECRET=whsec_PROD123...
STRIPE_PRICE_CLOUD_MONTHLY=price_live_1ABC...
STRIPE_PRICE_CLOUD_ANNUAL=price_live_2DEF...
FRONTEND_URL=https://yourdomain.com
```

## Key Types Explained

### Publishable Keys (`pk_`)
- **Safe for frontend** - can be exposed in browser
- Used for creating Stripe Elements and tokens
- Format: `pk_test_...` (test) or `pk_live_...` (production)

### Secret Keys (`sk_`)
- **Backend only** - NEVER expose to frontend
- Used for API operations (charges, subscriptions, etc.)
- Format: `sk_test_...` (test) or `sk_live_...` (production)

## Common Mistakes to Avoid

❌ **DON'T DO THIS:**
```env
# Frontend .env.local
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_test_...  # NEVER DO THIS!
```

❌ **DON'T DO THIS:**
```env
# Mixing test and live keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_live_...  # Mismatched environments!
```

✅ **DO THIS:**
```env
# Frontend - only publishable key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend - only secret key
STRIPE_SECRET_KEY=sk_test_...
```

## Testing Your Setup

1. **Check Frontend Key:**
   - Open browser console
   - The publishable key should be available
   - Should start with `pk_test_` for development

2. **Check Backend Key:**
   - Backend logs should show Stripe initialized
   - Test webhook endpoint with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

3. **Verify Auth Mode:**
   - Check that billing menu appears when signed in
   - On localhost, it should show even for demo users

## Troubleshooting

### Billing menu not showing?
1. Check `NEXT_PUBLIC_AUTH_MODE=firebase` is set
2. Ensure you're signed in
3. Check browser console for auth mode logs

### Stripe checkout not working?
1. Verify publishable key is correct
2. Check browser console for errors
3. Ensure backend has correct secret key

### Webhook errors?
1. Verify webhook secret matches Stripe Dashboard
2. Check backend logs for signature verification errors
3. Use Stripe CLI for local testing

## Security Checklist

- [ ] Secret key is ONLY in backend `.env`
- [ ] Secret key is NEVER committed to git
- [ ] Publishable key is in frontend with `NEXT_PUBLIC_` prefix
- [ ] Test keys used for development
- [ ] Live keys used for production
- [ ] `.env` files are in `.gitignore`
- [ ] Environment variables set in hosting platforms