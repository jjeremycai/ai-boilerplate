import { Hono } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import type { Env } from '../index';
import { StripeService } from '../services/stripe.service';
import { UserService } from '../services/user.service';
import type { 
  CreateCheckoutSessionInput, 
  CreatePortalSessionInput,
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  Invoice
} from '@boilerplate/types';

const billing = new Hono<{ Bindings: Env }>();

// Get subscription plans
billing.get('/plans', async (c) => {
  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const plans = await stripeService.getSubscriptionPlans();
  
  return c.json({ data: plans });
});

// Get current user's subscription
billing.get('/subscription', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const subscription = await stripeService.getUserSubscription(auth.userId);
  
  return c.json({ data: subscription });
});

// Create checkout session
billing.post('/checkout', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const input = await c.req.json<CreateCheckoutSessionInput>();
  
  // Validate input
  if (!input.priceId || !input.successUrl || !input.cancelUrl) {
    return c.json({ 
      error: 'Missing required fields', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  const userService = new UserService(c.env.DB);
  const user = await userService.getById(auth.userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  
  try {
    const session = await stripeService.createCheckoutSession(user, input);
    return c.json({ data: session });
  } catch (error) {
    console.error('Checkout session error:', error);
    return c.json({ 
      error: 'Failed to create checkout session', 
      code: 'CHECKOUT_ERROR' 
    }, 500);
  }
});

// Create customer portal session
billing.post('/portal', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const input = await c.req.json<CreatePortalSessionInput>();
  
  if (!input.returnUrl) {
    return c.json({ 
      error: 'Missing return URL', 
      code: 'INVALID_INPUT' 
    }, 400);
  }

  const userService = new UserService(c.env.DB);
  const user = await userService.getById(auth.userId);
  if (!user || !user.stripeCustomerId) {
    return c.json({ error: 'No billing account found' }, 404);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  
  try {
    const session = await stripeService.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: input.returnUrl,
    });
    return c.json({ data: session });
  } catch (error) {
    console.error('Portal session error:', error);
    return c.json({ 
      error: 'Failed to create portal session', 
      code: 'PORTAL_ERROR' 
    }, 500);
  }
});

// Cancel subscription
billing.post('/subscription/cancel', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const subscription = await stripeService.getUserSubscription(auth.userId);
  
  if (!subscription || !subscription.stripeSubscriptionId) {
    return c.json({ error: 'No active subscription found' }, 404);
  }

  try {
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return c.json({ 
      error: 'Failed to cancel subscription', 
      code: 'CANCEL_ERROR' 
    }, 500);
  }
});

// Resume subscription
billing.post('/subscription/resume', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const subscription = await stripeService.getUserSubscription(auth.userId);
  
  if (!subscription || !subscription.stripeSubscriptionId) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  if (!subscription.cancelAtPeriodEnd) {
    return c.json({ error: 'Subscription is not scheduled for cancellation' }, 400);
  }

  try {
    await stripeService.resumeSubscription(subscription.stripeSubscriptionId);
    return c.json({ data: { success: true } });
  } catch (error) {
    console.error('Resume subscription error:', error);
    return c.json({ 
      error: 'Failed to resume subscription', 
      code: 'RESUME_ERROR' 
    }, 500);
  }
});

// Get payment methods
billing.get('/payment-methods', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const methods = await stripeService.getPaymentMethods(auth.userId);
  
  return c.json({ data: methods });
});

// Get invoices
billing.get('/invoices', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  const invoices = await stripeService.getInvoices(auth.userId);
  
  return c.json({ data: invoices });
});

// Stripe webhook
billing.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400);
  }

  const body = await c.req.text();
  const stripeService = new StripeService(c.env.DB, c.env.STRIPE_SECRET_KEY);
  
  try {
    await stripeService.handleWebhook(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook error' }, 400);
  }
});

export default billing;