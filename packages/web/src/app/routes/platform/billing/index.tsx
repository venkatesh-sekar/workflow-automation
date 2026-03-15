import {
  FlowEdition,
  FlowFlagId,
  isNil,
} from '@flow/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import {
  LicenseKey,
  billingQueries,
} from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function Billing() {
  const { data: edition } = flagsHooks.useFlag<FlowEdition>(FlowFlagId.EDITION);

  return (
    <LockedFeatureGuard
      locked={edition === FlowEdition.COMMUNITY}
      lockTitle={t('Unlock Billing Page')}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
    >
      <BillingPageDetails />
    </LockedFeatureGuard>
  );
}

function BillingPageDetails() {
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        {t('Failed to load billing information')}
      </article>
    );
  }

  return (
    <CenteredPage
      title={t('Billing')}
      description={t('Manage your usage and plan details.')}
    >
      <div className="flex flex-col gap-6">
        <LicenseKey platform={platform} />
      </div>
    </CenteredPage>
  );
}
