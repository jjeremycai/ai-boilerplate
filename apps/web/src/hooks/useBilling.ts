import { useState, useEffect } from 'react';
import type { SubscriptionPlan, Subscription, Invoice, PaymentMethod } from '@boilerplate/types';

export function useBilling() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/v1/billing/plans'),
        fetch('/api/v1/billing/subscription'),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.data);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.data);
      }
    } catch (err) {
      setError('Failed to fetch billing data');
      console.error('Billing fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/v1/billing/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/v1/billing/payment-methods');
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        return data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      throw err;
    }
  };

  const createPortalSession = async () => {
    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        return data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (err) {
      console.error('Portal error:', err);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/v1/billing/subscription/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchBillingData();
        return true;
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Cancel subscription error:', err);
      throw err;
    }
  };

  const resumeSubscription = async () => {
    try {
      const response = await fetch('/api/v1/billing/subscription/resume', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchBillingData();
        return true;
      } else {
        throw new Error('Failed to resume subscription');
      }
    } catch (err) {
      console.error('Resume subscription error:', err);
      throw err;
    }
  };

  return {
    plans,
    subscription,
    invoices,
    paymentMethods,
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    resumeSubscription,
    fetchInvoices,
    fetchPaymentMethods,
    refetch: fetchBillingData,
  };
}