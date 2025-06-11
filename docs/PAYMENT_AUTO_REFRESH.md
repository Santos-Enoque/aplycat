# Payment Auto-Refresh System

This document describes the enhanced payment success handling that automatically refreshes user credits after PaySuite payments.

## Problem Solved

**Before**: When users returned from PaySuite payments, they had to manually refresh the page to see their updated credit balance, even though the webhook had successfully processed the payment.

**After**: The system automatically detects PaySuite payments and polls for credit updates, refreshing the UI once the webhook has processed.

## How It Works

### 1. Enhanced Payment Success Hook (`hooks/use-payment-success.ts`)

The `usePaymentSuccess` hook now:

- Detects the payment provider from URL parameters (`?payment=success&provider=paysuite`)
- For PaySuite payments, automatically polls for credit updates
- For Stripe payments, refreshes immediately (credits are processed synchronously)

### 2. Smart Polling System

When a PaySuite payment returns:

1. **Initial Check**: Gets current credit balance
2. **Polling Loop**: Checks credits every 2 seconds (configurable)
3. **Success Detection**: Stops when credits increase
4. **Timeout Handling**: Forces refresh after 12 seconds max
5. **UI Updates**: Calls `onCreditsUpdated()` to refresh the interface

### 3. Optimized Credit Endpoint

New lightweight endpoint `/api/user/credits` provides:

- Just the credit balance and last updated timestamp
- Faster response than full dashboard data
- Optimized for polling scenarios

## Configuration Options

The `usePaymentSuccess` hook accepts these options:

```typescript
usePaymentSuccess({
  onSuccess: () => {
    // Called when credits are updated
    refetchDashboardData();
  },
  pollForCredits: true, // Enable polling (default: true)
  maxPollAttempts: 6, // Max polls (default: 6 = 12 seconds)
  pollInterval: 2000, // Poll every 2 seconds (default: 2000ms)
});
```

## Provider-Specific Behavior

### PaySuite Payments

- Shows: "🎉 PaySuite payment successful! Your credits are being added..."
- Polls for credit updates (webhooks can take 1-5 seconds)
- Updates UI automatically when credits increase

### Stripe Payments

- Shows: "🎉 Purchase successful! Your credits have been added..."
- Refreshes immediately (Stripe webhooks are usually instant)

## User Experience Flow

1. **User completes payment** on PaySuite
2. **PaySuite redirects** to: `/dashboard?payment=success&provider=paysuite`
3. **Hook detects PaySuite** payment and shows "processing" toast
4. **Polling starts** checking credits every 2 seconds
5. **Webhook processes** in background (adds credits)
6. **Polling detects** credit increase
7. **UI refreshes** automatically showing new balance
8. **Success toast** appears with final credit count

## Fallback Behavior

If polling times out (unlikely):

- Shows: "Payment processed! Refreshing your account..."
- Forces UI refresh anyway
- User sees updated credits (webhook will have completed by then)

## Integration

Components using this system:

- `components/dashboard/payment-integration.tsx`
- `components/unified-navbar.tsx`
- Any component with payment success handling

## Testing

To test the auto-refresh:

1. Make a PaySuite payment
2. Complete payment in PaySuite
3. Watch for automatic credit update (no manual refresh needed)
4. Check browser console for polling logs

## Monitoring

Monitor webhook and polling health via:

- Browser console logs
- `/api/user/credits` endpoint response times
- `webhook_events` database table
- PaySuite dashboard webhook delivery status

## Benefits

- ✅ **No manual refresh needed** after PaySuite payments
- ✅ **Real-time credit updates** when webhooks complete
- ✅ **Provider-aware messaging** (PaySuite vs Stripe)
- ✅ **Automatic timeout handling** with graceful fallbacks
- ✅ **Optimized polling** with lightweight API calls
- ✅ **Better user experience** with instant feedback
