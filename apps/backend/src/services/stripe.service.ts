import Stripe from 'stripe';
import type { D1Database } from '@cloudflare/workers-types';
import type { 
  User, 
  SubscriptionPlan, 
  Subscription,
  PaymentMethod,
  Invoice,
  CreateCheckoutSessionInput,
  CreatePortalSessionInput
} from '@boilerplate/types';

export class StripeService {
  private stripe: Stripe;
  private db: D1Database;

  constructor(db: D1Database, stripeSecretKey: string) {
    this.db = db;
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27.acacia',
      httpClient: Stripe.createFetchHttpClient(), // Use fetch for Cloudflare Workers
    });
  }

  // Create or get Stripe customer
  async createOrGetCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    // Update user with Stripe customer ID
    await this.db.prepare(
      'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
    ).bind(customer.id, user.id).run();

    return customer.id;
  }

  // Create checkout session for subscription
  async createCheckoutSession(
    user: User,
    input: CreateCheckoutSessionInput
  ): Promise<{ sessionId: string; url: string }> {
    const customerId = await this.createOrGetCustomer(user);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: user.id,
        ...input.metadata,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  // Create customer portal session
  async createPortalSession(
    input: CreatePortalSessionInput
  ): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });

    return { url: session.url };
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await this.db.prepare(
      'UPDATE subscriptions SET cancel_at_period_end = 1 WHERE stripe_subscription_id = ?'
    ).bind(subscriptionId).run();
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    await this.db.prepare(
      'UPDATE subscriptions SET cancel_at_period_end = 0 WHERE stripe_subscription_id = ?'
    ).bind(subscriptionId).run();
  }

  // Get subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const result = await this.db.prepare(
      'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly ASC'
    ).all<SubscriptionPlan>();

    return result.results.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features as string),
      limits: JSON.parse(plan.limits as string),
    }));
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const result = await this.db.prepare(`
      SELECT s.*, p.* 
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ? AND s.status = 'active'
      LIMIT 1
    `).bind(userId).first<Subscription & SubscriptionPlan>();

    if (!result) return null;

    return {
      id: result.id,
      userId: result.userId,
      planId: result.planId,
      stripeSubscriptionId: result.stripeSubscriptionId,
      stripeCustomerId: result.stripeCustomerId,
      status: result.status,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      trialEnd: result.trialEnd,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      plan: {
        id: result.planId,
        name: result.name,
        slug: result.slug,
        stripePriceId: result.stripePriceId,
        priceMonthly: result.priceMonthly,
        priceYearly: result.priceYearly,
        features: JSON.parse(result.features as string),
        limits: JSON.parse(result.limits as string),
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    };
  }

  // Get payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const result = await this.db.prepare(
      'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
    ).bind(userId).all<PaymentMethod>();

    return result.results;
  }

  // Get invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    const result = await this.db.prepare(`
      SELECT i.* 
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      WHERE s.user_id = ?
      ORDER BY i.created_at DESC
    `).bind(userId).all<Invoice>();

    return result.results;
  }

  // Handle webhook events
  async handleWebhook(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error('Invalid webhook signature');
    }

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
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Get the plan from database
    const plan = await this.db.prepare(
      'SELECT * FROM subscription_plans WHERE stripe_price_id = ?'
    ).bind(subscription.items.data[0].price.id).first<SubscriptionPlan>();

    if (!plan) {
      console.error('Plan not found for price:', subscription.items.data[0].price.id);
      return;
    }

    // Create subscription record
    await this.db.prepare(`
      INSERT INTO subscriptions (
        user_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, trial_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      plan.id,
      subscription.id,
      subscription.customer as string,
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    ).run();

    // Update user subscription tier
    await this.db.prepare(
      'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?'
    ).bind(plan.slug, subscription.status, userId).run();
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    // Update subscription status
    await this.db.prepare(`
      UPDATE subscriptions 
      SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = ?
    `).bind(
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.id
    ).run();

    // Get user ID and update user status
    const sub = await this.db.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    ).bind(subscription.id).first<{ user_id: string }>();

    if (sub) {
      await this.db.prepare(
        'UPDATE users SET subscription_status = ? WHERE id = ?'
      ).bind(subscription.status, sub.user_id).run();
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Update subscription status
    await this.db.prepare(
      'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
    ).bind('canceled', subscription.id).run();

    // Get user ID and revert to free tier
    const sub = await this.db.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    ).bind(subscription.id).first<{ user_id: string }>();

    if (sub) {
      await this.db.prepare(
        'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?'
      ).bind('free', 'canceled', sub.user_id).run();
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    await this.db.prepare(`
      INSERT INTO invoices (
        subscription_id, stripe_invoice_id, amount_paid, amount_due,
        currency, status, invoice_pdf, hosted_invoice_url,
        period_start, period_end
      )
      SELECT 
        s.id, ?, ?, ?, ?, ?, ?, ?, ?, ?
      FROM subscriptions s
      WHERE s.stripe_subscription_id = ?
    `).bind(
      invoice.id,
      invoice.amount_paid,
      invoice.amount_due,
      invoice.currency,
      invoice.status || 'paid',
      invoice.invoice_pdf,
      invoice.hosted_invoice_url,
      invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      invoice.subscription
    ).run();
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Update subscription status to past_due
    await this.db.prepare(
      'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
    ).bind('past_due', invoice.subscription).run();

    // Update user status
    const sub = await this.db.prepare(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?'
    ).bind(invoice.subscription as string).first<{ user_id: string }>();

    if (sub) {
      await this.db.prepare(
        'UPDATE users SET subscription_status = ? WHERE id = ?'
      ).bind('past_due', sub.user_id).run();
    }
  }
}