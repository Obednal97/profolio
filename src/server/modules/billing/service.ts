import "server-only";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/server/db";
import { assertNotDemo, requireUser } from "@/server/auth/session";
import { BadRequest, ServiceUnavailable } from "@/server/http/errors";

/**
 * Stripe subscriptions.
 *
 * Billing is optional. Without STRIPE_SECRET_KEY the endpoints report 503
 * rather than 500 - self-hosted installs have no Stripe account and used to
 * see a server error on the billing page. Reads degrade further still:
 * `getSubscription` answers from the local columns when Stripe cannot be
 * reached, because "we cannot check right now" should not look like "you have
 * no subscription".
 */

const globalForStripe = globalThis as unknown as { stripe?: Stripe | null };

function stripe(): Stripe {
  if (globalForStripe.stripe === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    globalForStripe.stripe = key
      ? new Stripe(key, { apiVersion: "2025-08-27.basil" })
      : null;
  }

  if (!globalForStripe.stripe) {
    throw new ServiceUnavailable("Billing is not configured on this deployment");
  }

  return globalForStripe.stripe;
}

export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const CheckoutSchema = z
  .object({
    priceId: z.enum(["cloud_monthly", "cloud_annual"]),
    successUrl: z.url().optional(),
    cancelUrl: z.url().optional(),
  })
  .strict();
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export const PortalSchema = z
  .object({ returnUrl: z.url().optional() })
  .strict();

function priceIdFor(tier: CheckoutInput["priceId"]): string {
  const configured =
    tier === "cloud_annual"
      ? process.env.STRIPE_PRICE_CLOUD_ANNUAL
      : process.env.STRIPE_PRICE_CLOUD_MONTHLY;

  if (!configured) {
    throw new ServiceUnavailable(`No Stripe price configured for ${tier}`);
  }

  return configured;
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  );
}

async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw new BadRequest("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(input: CheckoutInput) {
  const user = await requireUser();
  assertNotDemo(user);

  const session = await stripe().checkout.sessions.create({
    customer: await getOrCreateCustomer(user.id),
    line_items: [{ price: priceIdFor(input.priceId), quantity: 1 }],
    mode: "subscription",
    success_url: input.successUrl ?? `${appUrl()}/app/billing/success`,
    cancel_url: input.cancelUrl ?? `${appUrl()}/app/billing/cancel`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: { userId: user.id },
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId: user.id },
    },
  });

  return { url: session.url };
}

export async function createPortalSession(returnUrl?: string) {
  const user = await requireUser();
  assertNotDemo(user);

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });
  if (!record?.stripeCustomerId) {
    throw new BadRequest("No subscription found for this account");
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: record.stripeCustomerId,
    return_url: returnUrl ?? `${appUrl()}/app/billing`,
  });

  return { url: session.url };
}

interface SubscriptionPeriods {
  current_period_end?: number | null;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
}

function toDate(seconds: number | null | undefined): Date | null {
  return seconds ? new Date(seconds * 1000) : null;
}

export async function getSubscription() {
  const user = await requireUser();

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      subscriptionId: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      subscriptionEndDate: true,
      trialEndDate: true,
    },
  });

  if (!record?.subscriptionId) return null;

  const local = {
    id: record.subscriptionId,
    status: record.subscriptionStatus ?? "unknown",
    tier: record.subscriptionTier,
    currentPeriodEnd: record.subscriptionEndDate,
    trialEnd: record.trialEndDate,
  };

  if (!billingConfigured()) return local;

  try {
    const subscription = (await stripe().subscriptions.retrieve(
      record.subscriptionId,
    )) as Stripe.Subscription & SubscriptionPeriods;

    if (subscription.status !== record.subscriptionStatus) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: subscription.status,
          subscriptionEndDate: toDate(subscription.current_period_end),
        },
      });
    }

    return {
      id: subscription.id,
      status: subscription.status,
      tier: record.subscriptionTier,
      currentPeriodEnd: toDate(subscription.current_period_end),
      trialEnd: toDate(subscription.trial_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    };
  } catch (error) {
    console.error("Could not read the subscription from Stripe:", error);
    return local;
  }
}

/** Cancels at the end of the paid period, so access is not cut off mid-month. */
export async function cancelSubscription() {
  const user = await requireUser();
  assertNotDemo(user);

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { subscriptionId: true },
  });
  if (!record?.subscriptionId) {
    throw new BadRequest("No subscription found for this account");
  }

  await stripe().subscriptions.update(record.subscriptionId, {
    cancel_at_period_end: true,
  });

  return { success: true as const };
}

/**
 * Applies a verified Stripe event.
 *
 * The signature is checked against the raw request body; any parsing before
 * this point invalidates it, which is why the route reads `request.text()`
 * and passes the string through untouched.
 */
export async function handleWebhook(
  signature: string,
  rawBody: string,
): Promise<{ received: true }> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new ServiceUnavailable("Stripe webhooks are not configured");
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    throw new BadRequest("Invalid webhook signature");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription) break;

      const subscription = (await stripe().subscriptions.retrieve(
        session.subscription as string,
      )) as Stripe.Subscription & SubscriptionPeriods;

      await applySubscription(userId, subscription);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription &
        SubscriptionPeriods;
      const userId = subscription.metadata?.userId;
      if (userId) await applySubscription(userId, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription &
        SubscriptionPeriods;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "canceled",
          subscriptionEndDate: toDate(subscription.current_period_end),
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) break;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "past_due" },
      });
      break;
    }

    default:
      // Stripe sends far more event types than are subscribed to here.
      break;
  }

  return { received: true };
}

async function applySubscription(
  userId: string,
  subscription: Stripe.Subscription & SubscriptionPeriods,
): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id;
  const tier =
    priceId && priceId === process.env.STRIPE_PRICE_CLOUD_ANNUAL
      ? "cloud_annual"
      : "cloud_monthly";

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionTier: tier,
      subscriptionEndDate: toDate(subscription.current_period_end),
      trialEndDate: toDate(subscription.trial_end),
    },
  });
}
