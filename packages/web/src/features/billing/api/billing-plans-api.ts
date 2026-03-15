import {
  PlatformBillingInformation,
} from '@flow/shared';

import { api } from '@/lib/api';

export const platformBillingApi = {
  getSubscriptionInfo() {
    return api.get<PlatformBillingInformation>('/v1/platform-billing/info');
  },
};
