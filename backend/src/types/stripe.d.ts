import Stripe from 'stripe';

// Extend Stripe types to include properties that exist at runtime but aren't in the type definitions
declare module 'stripe' {
  namespace Stripe {
    interface Subscription {
      current_period_end: number;
      trial_end: number | null;
      cancel_at_period_end: boolean;
    }
  }
}

// Type for subscription with extended properties
export type StripeSubscriptionExtended = Stripe.Subscription & {
  current_period_end: number;
  trial_end: number | null;
  cancel_at_period_end: boolean;
};