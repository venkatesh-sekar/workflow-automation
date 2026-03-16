import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { SkeletonList } from '@/components/ui/skeleton';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';

import SecretManagerProviderCard from './secret-manager-provider-card';

const SecretManagersPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: secretManagerProviders, isLoading } =
    secretManagersHooks.useListSecretManagers();

  return (
    <LockedFeatureGuard
      locked={!platform.plan.secretManagersEnabled}
      lockTitle={'Enable Secret Managers'}
      lockDescription={'Manage your secrets from a single and secure place'}
    >
      <CenteredPage
        title={'Secret Managers'}
        description={'Manage Secret Managers'}
      >
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <SkeletonList numberOfItems={3} className="w-full h-20" />
          ) : (
            secretManagerProviders?.map((provider) => (
              <SecretManagerProviderCard
                key={provider.id}
                provider={provider}
              />
            ))
          )}
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

export default SecretManagersPage;
