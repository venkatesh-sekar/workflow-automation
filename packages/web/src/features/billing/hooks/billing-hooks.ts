import { useQuery } from '@tanstack/react-query';

import { platformBillingApi } from '../api/billing-plans-api';

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    ['platform-billing-subscription', platformId] as const,
};

export const billingQueries = {
  usePlatformSubscription: (platformId: string) => {
    return useQuery({
      queryKey: billingKeys.platformSubscription(platformId),
      queryFn: platformBillingApi.getSubscriptionInfo,
    });
  },
};
