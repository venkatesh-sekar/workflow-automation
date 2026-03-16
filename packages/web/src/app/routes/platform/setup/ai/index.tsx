import { PlatformRole, FlowFlagId } from '@flow/shared';
import { CenteredPage } from '@/app/components/centered-page';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderQueries,
  aiProviderMutations,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

export default function AIProvidersPage() {
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();
  const allowWrite = flags?.[FlowFlagId.CAN_CONFIGURE_AI_PROVIDER] === true;

  const { mutate: deleteProvider, isPending: isDeleting } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
    });

  return (
    <LockedFeatureGuard
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={'Unlock AI'}
      lockDescription={'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces'}
    >
      <CenteredPage
        title={'AI Providers'}
        description={
          allowWrite
            ? 'Set provider credentials that will be used by universal AI pieces, i.e Text AI.'
            : 'Available AI providers that will be used by universal AI pieces, i.e Text AI.'
        }
      >
        <div className="flex flex-col gap-4">
          {SUPPORTED_AI_PROVIDERS.map((providerDef) => {
            const config = providers?.find(
              (p) => p.provider === providerDef.provider,
            );

            return (
              <AIProviderCard
                key={providerDef.provider}
                providerInfo={providerDef}
                providerConfig={config}
                isDeleting={isDeleting}
                onDelete={(id) => deleteProvider(id)}
                onSave={() => refetch()}
                allowWrite={allowWrite}
              />
            );
          })}
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
}
