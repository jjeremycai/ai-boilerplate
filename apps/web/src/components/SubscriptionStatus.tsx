import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@boilerplate/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@boilerplate/ui/card';
import { Badge } from '@boilerplate/ui/badge';
import { Alert, AlertDescription } from '@boilerplate/ui/alert';
import { useNavigate } from 'wouter';
import type { Subscription } from '@boilerplate/types';

export function SubscriptionStatus() {
  const [, navigate] = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/v1/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) {
    return null;
  }

  const isFreeTier = !subscription || subscription.plan?.slug === 'free';
  const isPastDue = subscription.status === 'past_due';
  const isCanceling = subscription.cancelAtPeriodEnd;

  return (
    <div className="space-y-4">
      {isPastDue && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription payment failed. Please update your payment method to continue using premium features.
          </AlertDescription>
        </Alert>
      )}

      {isCanceling && subscription.currentPeriodEnd && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
            You can resume your subscription anytime before this date.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Subscription
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscription.plan?.name || 'Free'}</div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {isFreeTier ? 'Upgrade to unlock more features' : `$${(subscription.plan?.priceMonthly || 0) / 100}/month`}
            </p>
            <Badge 
              variant={subscription.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {subscription.status}
            </Badge>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/billing')}
            >
              {isFreeTier ? 'Upgrade Plan' : 'Manage Billing'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}