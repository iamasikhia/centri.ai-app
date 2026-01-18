# Stripe Integration Test Instructions

## ✅ Configuration Complete

Your Stripe integration is now configured with:
- **Secret Key**: `sk_test_...` (Test mode)
- **Webhook Secret**: `whsec_...`
- **Pro Price ID**: `price_1prod_ToLwDUUyQeKAnhUsDj`

## 🧪 Testing Steps

### 1. Test Backend Connection

The backend should be running on `http://localhost:3001`. Test the pricing endpoint:

```bash
curl http://localhost:3001/stripe/pricing
```

### 2. Test Checkout Flow

#### Option A: Via Frontend (Recommended)
1. Go to `http://localhost:3002/pricing`
2. Click "Start Free Trial" on the Pro plan
3. You'll be redirected to Stripe Checkout (test mode)
4. Use Stripe test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC, any ZIP

#### Option B: Via API Directly
```bash
curl -X POST http://localhost:3001/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-id" \
  -d '{
    "tier": "pro",
    "successUrl": "http://localhost:3002/settings/billing?success=true",
    "cancelUrl": "http://localhost:3002/pricing?canceled=true"
  }'
```

This will return a checkout URL. Open it in your browser.

### 3. Set Up Webhook Forwarding (Local Development)

To receive webhook events locally:

1. Install Stripe CLI (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local backend:
   ```bash
   stripe listen --forward-to localhost:3001/stripe/webhook
   ```

4. Copy the webhook signing secret it provides and update `.env` if different

### 4. Test Webhook Events

After completing a test checkout, you should see webhook events in:
- Stripe CLI output (if running)
- Backend logs (`/tmp/api_stripe_test.log`)
- Stripe Dashboard → Developers → Webhooks

### 5. Verify Subscription Status

After a successful checkout:

```bash
curl -H "x-user-id: test-user-id" http://localhost:3001/stripe/subscription
```

## 🎯 Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0027 6000 3184`

## 📋 Checklist

- [x] Stripe credentials configured in `.env`
- [x] Pro Price ID set
- [x] Backend running on port 3001
- [x] Frontend running on port 3002
- [ ] Test checkout flow
- [ ] Test webhook events
- [ ] Verify subscription in database

## 🔍 Monitoring

- **Backend Logs**: `tail -f /tmp/api_stripe_test.log`
- **Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
- **Frontend**: http://localhost:3002/pricing

## 🐛 Troubleshooting

1. **Webhook signature verification fails**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`
   - Check that raw body middleware is configured in `main.ts`

2. **Checkout URL not working**
   - Verify Pro Price ID exists in Stripe Dashboard
   - Check backend logs for errors

3. **Subscription not updating**
   - Check webhook events in Stripe Dashboard
   - Verify webhook endpoint is accessible (use ngrok for production)

## 🚀 Next Steps

1. Complete a test checkout
2. Verify webhook events are received
3. Check database for subscription updates
4. Test subscription cancellation/resume
5. Test customer portal access


