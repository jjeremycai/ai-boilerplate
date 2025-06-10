import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@boilerplate/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@boilerplate/ui/card';
import { Badge } from '@boilerplate/ui/badge';
import type { SubscriptionPlan, Subscription } from '@boilerplate/types';

export function Billing() {
  const { user } = useUser();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
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
        setCurrentSubscription(subData.data);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!plan.stripePriceId) return;
    
    setCreatingCheckout(plan.id);
    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCreatingCheckout(null);
    }
  };

  const handleManageSubscription = async () => {
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
        window.location.href = data.url;
      } else {
        console.error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      {currentSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              You are currently on the {currentSubscription.plan?.name} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </Badge>
              </div>
              {currentSubscription.currentPeriodEnd && (
                <div>
                  <span className="font-medium">Next billing date:</span>{' '}
                  {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
              {currentSubscription.cancelAtPeriodEnd && (
                <div className="text-destructive">
                  Your subscription will be canceled at the end of the current period
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.planId === plan.id;
          const monthlyPrice = plan.priceMonthly / 100;
          
          return (
            <Card 
              key={plan.id} 
              className={isCurrentPlan ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrentPlan && (
                    <Badge variant="default">Current Plan</Badge>
                  )}
                </div>
                <CardDescription>
                  <div className="text-3xl font-bold">
                    ${monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.slug === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free Plan
                  </Button>
                ) : isCurrentPlan ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleManageSubscription}
                  >
                    Manage Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => handleSubscribe(plan)}
                    disabled={creatingCheckout === plan.id}
                  >
                    {creatingCheckout === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}