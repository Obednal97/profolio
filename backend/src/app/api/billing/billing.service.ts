import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import Stripe from 'stripe';
import { PriceTier } from './dto/create-checkout-session.dto';

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('Stripe secret key not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey || '', {
      apiVersion: '2025-08-27.basil',
    });

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  /**
   * Get price IDs from environment variables
   */
  private getPriceId(tier: PriceTier): string {
    const priceIds = {
      [PriceTier.CLOUD_MONTHLY]: this.configService.get<string>('STRIPE_PRICE_CLOUD_MONTHLY'),
      [PriceTier.CLOUD_ANNUAL]: this.configService.get<string>('STRIPE_PRICE_CLOUD_ANNUAL'),
    };

    const priceId = priceIds[tier];
    if (!priceId) {
      throw new BadRequestException(`Price ID not configured for tier: ${tier}`);
    }

    return priceId;
  }

  /**
   * Create or retrieve Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Return existing Stripe customer ID if it exists
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id,
      },
    });

    // Save Stripe customer ID to database
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a Stripe Checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    priceId: PriceTier,
    successUrl: string,
    cancelUrl: string,
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(userId);
    const stripePriceId = this.getPriceId(priceId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        userId,
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId,
        },
      },
    });

    return session.url || '';
  }

  /**
   * Create a Stripe Customer Portal session
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new BadRequestException('No subscription found for this user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription details for a user
   */
  async getSubscription(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        subscriptionEndDate: true,
        trialEndDate: true,
      },
    });

    if (!user || !user.subscriptionId) {
      return null;
    }

    // Fetch latest subscription data from Stripe if needed
    if (user.subscriptionId) {
      try {
        const subscription = await this.stripe.subscriptions.retrieve(user.subscriptionId);
        
        // Update local database with latest status
        const currentPeriodEnd = (subscription as any).current_period_end;
        const trialEnd = (subscription as any).trial_end;
        const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;
        
        if (subscription.status !== user.subscriptionStatus) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: subscription.status,
              subscriptionEndDate: currentPeriodEnd 
                ? new Date(currentPeriodEnd * 1000) 
                : null,
            },
          });
        }

        return {
          id: subscription.id,
          status: subscription.status,
          tier: user.subscriptionTier,
          currentPeriodEnd: currentPeriodEnd 
            ? new Date(currentPeriodEnd * 1000) 
            : null,
          trialEnd: trialEnd 
            ? new Date(trialEnd * 1000) 
            : null,
          cancelAtPeriodEnd: cancelAtPeriodEnd,
        };
      } catch (error) {
        this.logger.error('Error fetching subscription from Stripe:', error);
        return {
          status: user.subscriptionStatus,
          tier: user.subscriptionTier,
          currentPeriodEnd: user.subscriptionEndDate,
          trialEnd: user.trialEndDate,
        };
      }
    }

    return {
      status: user.subscriptionStatus,
      tier: user.subscriptionTier,
      currentPeriodEnd: user.subscriptionEndDate,
      trialEnd: user.trialEndDate,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, body: Buffer): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle successful checkout session
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
    
    // Determine tier based on price ID
    let tier = 'cloud_monthly';
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === this.configService.get<string>('STRIPE_PRICE_CLOUD_ANNUAL')) {
      tier = 'cloud_annual';
    }

    const currentPeriodEnd = (subscription as any).current_period_end;
    const trialEnd = (subscription as any).trial_end;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        subscriptionEndDate: new Date(currentPeriodEnd * 1000),
        trialEndDate: trialEnd 
          ? new Date(trialEnd * 1000) 
          : null,
      },
    });

    this.logger.log(`Subscription created for user ${userId}: ${subscription.id}`);
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    // Determine tier based on price ID
    let tier = 'cloud_monthly';
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId === this.configService.get<string>('STRIPE_PRICE_CLOUD_ANNUAL')) {
      tier = 'cloud_annual';
    }

    const currentPeriodEnd = (subscription as any).current_period_end;
    const trialEnd = (subscription as any).trial_end;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        subscriptionEndDate: new Date(currentPeriodEnd * 1000),
        trialEndDate: trialEnd 
          ? new Date(trialEnd * 1000) 
          : null,
      },
    });

    this.logger.log(`Subscription updated for user ${userId}: ${subscription.id}`);
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.error('No userId in subscription metadata');
      return;
    }

    const currentPeriodEnd = (subscription as any).current_period_end;
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: new Date(currentPeriodEnd * 1000),
      },
    });

    this.logger.log(`Subscription canceled for user ${userId}: ${subscription.id}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`User not found for customer ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });

    this.logger.log(`Payment failed for user ${user.id}`);
    
    // TODO: Send email notification to user about failed payment
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.subscriptionId) {
      throw new BadRequestException('No subscription found for this user');
    }

    // Cancel at period end (user keeps access until end of billing period)
    await this.stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceling',
      },
    });

    this.logger.log(`Subscription cancellation scheduled for user ${userId}`);
  }
}