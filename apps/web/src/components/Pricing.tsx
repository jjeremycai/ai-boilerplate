import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@boilerplate/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@boilerplate/ui/card';
import { Badge } from '@boilerplate/ui/badge';
import { Switch } from '@boilerplate/ui/switch';
import { Label } from '@boilerplate/ui/label';
import { useNavigate } from 'wouter';
import { useUser } from '@clerk/clerk-react';
import type { SubscriptionPlan } from '@boilerplate/types';

export function Pricing() {
  const { isSignedIn } = useUser();
  const [, navigate] = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/billing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = (plan: SubscriptionPlan) => {
    if (!isSignedIn) {
      navigate('/sign-in');
    } else if (plan.slug === 'free') {
      navigate('/dashboard');
    } else {
      navigate('/billing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Choose the plan that works best for you
          </p>
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle">Monthly</Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle">
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const monthlyPrice = plan.priceMonthly / 100;
            const yearlyPrice = plan.priceYearly ? plan.priceYearly / 100 : monthlyPrice * 12;
            const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
            const isPopular = plan.slug === 'pro';

            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}
              >
                {isPopular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    variant="default"
                  >
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">
                        ${isYearly ? Math.floor(displayPrice / 12) : displayPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {isYearly && plan.priceYearly && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ${yearlyPrice} billed yearly
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.limits && (
                    <div className="mt-4 pt-4 border-t space-y-1">
                      {plan.limits.projects !== -1 && (
                        <div className="text-sm text-muted-foreground">
                          {plan.limits.projects} projects
                        </div>
                      )}
                      {plan.limits.members !== -1 && (
                        <div className="text-sm text-muted-foreground">
                          {plan.limits.members === 1 ? 'Single user' : `Up to ${plan.limits.members} team members`}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleGetStarted(plan)}
                  >
                    {plan.slug === 'free' ? 'Start Free' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}