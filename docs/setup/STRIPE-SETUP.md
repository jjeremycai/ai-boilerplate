# Stripe Billing Setup Guide

This guide will help you set up Stripe billing for your boilerplate application.

## Prerequisites

- A Stripe account (create one at [stripe.com](https://stripe.com))
- Access to your Stripe dashboard

## Step 1: Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your test keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## Step 2: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL:
   - Local development: `http://localhost:8787/api/v1/billing/webhook`
   - Production: `https://your-domain.com/api/v1/billing/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 3: Configure Environment Variables

### For Local Development

Create a `.env` file in `apps/backend/` (copy from `.env.example`):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### For Production (Cloudflare Workers)

Set secrets using Wrangler CLI:

```bash
wrangler secret put STRIPE_SECRET_KEY
# Enter your secret key when prompted

wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter your webhook secret when prompted

wrangler secret put STRIPE_PUBLISHABLE_KEY
# Enter your publishable key when prompted
```

## Step 4: Create Products and Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Create products for each tier:

### Free Tier
- Name: Free
- Price: $0/month

### Pro Tier
- Name: Pro
- Price: $9.99/month (or $99.90/year)
- Price ID: Copy this for your database

### Team Tier
- Name: Team
- Price: $29.99/month (or $299.90/year)
- Price ID: Copy this for your database

### Enterprise Tier
- Name: Enterprise
- Price: $99.99/month (or $999.90/year)
- Price ID: Copy this for your database

## Step 5: Update Database with Price IDs

Update the `subscription_plans` table with your Stripe Price IDs:

```sql
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxx' 
WHERE slug = 'pro';

UPDATE subscription_plans 
SET stripe_price_id = 'price_yyy' 
WHERE slug = 'team';

UPDATE subscription_plans 
SET stripe_price_id = 'price_zzz' 
WHERE slug = 'enterprise';
```

## Step 6: Frontend Configuration

Add the Stripe publishable key to your frontend environment:

### Web App (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

### Mobile App
Add to your app configuration or environment file.

## Testing

### Test Cards

Use these test card numbers in test mode:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test Webhook Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8787/api/v1/billing/webhook
```

## Usage in Your App

### Create Checkout Session

```typescript
const response = await fetch('/api/v1/billing/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: 'price_xxx',
    successUrl: window.location.origin + '/billing/success',
    cancelUrl: window.location.origin + '/billing/cancel',
  }),
});

const { data } = await response.json();
// Redirect to Stripe Checkout
window.location.href = data.url;
```

### Access Customer Portal

```typescript
const response = await fetch('/api/v1/billing/portal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    returnUrl: window.location.href,
  }),
});

const { data } = await response.json();
// Redirect to Stripe Customer Portal
window.location.href = data.url;
```

## Security Best Practices

1. **Never expose your secret key** - Only use it on the server
2. **Verify webhook signatures** - Already implemented in the service
3. **Use HTTPS in production** - Required for webhooks
4. **Implement proper access controls** - Check user permissions
5. **Monitor for suspicious activity** - Use Stripe Radar

## Troubleshooting

### Webhook Errors

- Check webhook signature is correct
- Ensure endpoint is publicly accessible
- Verify selected events match handler

### Subscription Not Updating

- Check database migrations are run
- Verify webhook events are being received
- Check logs for errors

### Payment Failures

- Test with different card numbers
- Check for client-side errors
- Verify price IDs are correct