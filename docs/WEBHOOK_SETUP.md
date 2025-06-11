# PaySuite Webhook Setup Guide

This guide helps you configure PaySuite webhooks properly to ensure payment notifications are received.

## Environment Variables

Add these environment variables to your deployment:

```bash
# Webhook Base URL (highest priority for webhook callbacks)
WEBHOOK_BASE_URL=https://your-app.vercel.app  # or your actual domain

# PaySuite Configuration
PAYSUITE_API_URL=https://paysuite.tech/api/v1
PAYSUITE_API_TOKEN=your_paysuite_api_token
PAYSUITE_WEBHOOK_SECRET=your_webhook_secret

# Fallback (already exists)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Webhook URL Configuration

The webhook URL that PaySuite will call:

```
https://your-app.vercel.app/api/webhooks/paysuite
```

## Current Webhook URL Priority

The system uses this priority for webhook URLs:

1. `WEBHOOK_BASE_URL` (recommended for production)
2. `NEXT_PUBLIC_APP_URL` (fallback)
3. `http://localhost:3000` (development only)

## PaySuite Dashboard Configuration

1. Log into your PaySuite dashboard
2. Go to **API Settings** or **Webhooks**
3. Set the webhook URL to: `https://your-app.vercel.app/api/webhooks/paysuite`
4. Enable these events:
   - `payment.success`
   - `payment.failed`
5. Set the webhook secret and add it to your environment variables

## Testing Webhooks

You can test webhook processing locally using:

```bash
# List pending payments
npm run recover-payment list

# Recover a specific payment (if webhook failed)
npm run recover-payment recover <payment_id>
```

## Webhook Security

The webhook endpoint at `/api/webhooks/paysuite` validates:

- PaySuite signature using HMAC SHA-256
- Idempotency (prevents duplicate processing)
- Payment status and user validation

## Common Issues

### 1. Webhook URL Not Reachable

- **Symptom**: Payment succeeds but no webhook received
- **Solution**: Ensure `WEBHOOK_BASE_URL` points to your deployed app
- **Check**: Verify PaySuite can reach your webhook URL

### 2. Invalid Webhook Signature

- **Symptom**: Webhook received but returns 401 error
- **Solution**: Check `PAYSUITE_WEBHOOK_SECRET` matches dashboard
- **Debug**: Check server logs for signature validation errors

### 3. Local Development

- **Symptom**: Webhooks don't work locally
- **Solution**: Use ngrok or similar to expose localhost
- **Alternative**: Use the recovery script for testing

## Recovery Script Usage

If a payment succeeds but webhooks fail, use the recovery script:

```bash
# List all pending payments
npm run recover-payment list

# Recover a specific payment
npm run recover-payment recover 5e0db02e-b52f-423f-b682-ed1a538a3a98

# Recover with transaction ID (if available)
npm run recover-payment recover 5e0db02e-b52f-423f-b682-ed1a538a3a98 txn_123456
```

## Monitoring

Monitor webhook health by checking:

- Database `webhook_events` table for received webhooks
- Application logs for webhook processing
- PaySuite dashboard for webhook delivery status

## Production Checklist

- [ ] `WEBHOOK_BASE_URL` set to production domain
- [ ] `PAYSUITE_WEBHOOK_SECRET` configured
- [ ] PaySuite dashboard webhook URL updated
- [ ] Test webhook with a small payment
- [ ] Monitor logs for webhook success/failures
- [ ] Have recovery script ready for emergencies
