import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

export const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const action = searchParams.get('action') || '';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/platform/setup/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const getActionConfig = () => {
    switch (action) {
      case 'upgrade':
        return {
          icon: TrendingUp,
          iconBg: 'bg-success-50',
          iconColor: 'text-success-600',
          title: 'Successfully Upgraded!',
          description: 'Subscription updated successfully',
        };
      case 'downgrade':
        return {
          icon: TrendingDown,
          iconBg: 'bg-warning-50',
          iconColor: 'text-warning-600',
          title: 'Plan Downgraded',
          description: 'Subscription updated successfully',
        };
      case 'create':
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Success!',
          description: 'Subscription created successfully',
        };
      case 'ai-credit-auto-topup':
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Success!',
          description: 'AI credit auto topup enabled successfully',
        };
      case 'ai-credit-payment':
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Success!',
          description: 'AI credits purchased successfully',
        };
      default:
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Success!',
          description: 'Subscription updated successfully',
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  return (
    <div className="h-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6">
            <div
              className={`mx-auto w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center`}
            >
              <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {config.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {config.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => navigate('/')} className="w-full">
                {'Go to Dashboard'}
              </Button>

              <Button
                onClick={() => navigate('/platform/setup/billing')}
                variant="outline"
                className="w-full"
              >
                {'View Billing Details'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {`Redirecting to billing in ${countdown} seconds...`}
            </p>
          </div>
        </CardContent>
      </div>
    </div>
  );
};
