# Stripe Billing Setup Guide

This guide will help you set up Stripe Billing for Profolio's cloud subscription service.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard
- Profolio running in cloud mode (Firebase authentication)

## Step 1: Create Stripe Products and Prices

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** in the sidebar
3. Click **+ Add product**
4. Create two products:

### Cloud Monthly Plan
- **Name**: Profolio Cloud Monthly
- **Description**: Monthly subscription to Profolio Cloud
- **Price**: £9.99 per month
- **Billing period**: Monthly
- **Price ID**: Note this ID (e.g., `price_1234...`)

### Cloud Annual Plan
- **Name**: Profolio Cloud Annual
- **Description**: Annual subscription to Profolio Cloud (20% discount)
- **Price**: £95.90 per year
- **Billing period**: Yearly
- **Price ID**: Note this ID (e.g., `price_5678...`)

## Step 2: Configure Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Enter your webhook URL:
   - Development: `http://localhost:3000/api/billing/webhook`
   - Production: `https://yourdomain.com/api/billing/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Set Environment Variables

### Backend (.env)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_CLOUD_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_CLOUD_ANNUAL=price_your_annual_price_id
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_AUTH_MODE=firebase
```

## Step 4: Configure Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer portal**
2. Configure the following:
   - **Functionality**:
     - ✅ Allow customers to update payment methods
     - ✅ Allow customers to update billing address
     - ✅ Allow customers to cancel subscriptions
     - ✅ Allow customers to switch plans
   - **Cancellation**:
     - Choose "Cancel at end of billing period"
   - **Business information**:
     - Add your company name and support email
3. Click **Save**

## Step 5: Run Database Migration

After setting up environment variables, run the database migration to add subscription fields:

```bash
cd backend
pnpm prisma migrate dev --name add-subscription-fields
```

## Step 6: Test the Integration

### Test Mode
Stripe provides test mode for development. Use these test cards:

- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

### Testing Flow
1. Start your development servers:
   ```bash
   pnpm dev
   ```
2. Log in to your application (not in demo mode)
3. Navigate to user menu → "Billing & Subscription"
4. Click "Start Free Trial" or "Upgrade"
5. Complete checkout with a test card
6. Verify subscription is active in billing dashboard

## Step 7: Production Deployment

When ready for production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Update API Keys**:
   - Replace `sk_test_` with `sk_live_`
   - Replace `pk_test_` with `pk_live_`
3. **Update Webhook Endpoint** to production URL
4. **Update Price IDs** to live mode price IDs
5. **Test with real card** (consider using a small amount first)

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is correct
- Verify webhook secret matches
- Check server logs for errors
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:3000/api/billing/webhook
  ```

### Subscription Not Updating
- Verify database migration was run
- Check backend logs for Stripe API errors
- Ensure user has `stripeCustomerId` in database

### Checkout Not Working
- Verify publishable key is correct
- Check browser console for errors
- Ensure prices exist in Stripe Dashboard

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** to prevent fraud
4. **Use HTTPS in production** for all endpoints
5. **Implement rate limiting** on billing endpoints
6. **Log all billing events** for audit trails

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For Profolio integration issues:
- Check backend logs: `docker logs profolio-backend`
- Check frontend console for errors
- Review this guide and environment variables