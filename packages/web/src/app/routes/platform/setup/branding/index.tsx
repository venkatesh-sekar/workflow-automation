import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AppearanceSection } from '@/app/routes/platform/setup/branding/appearance-section';
import { platformHooks } from '@/hooks/platform-hooks';

export const BrandingPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      locked={!platform.plan.customAppearanceEnabled}
      lockTitle={'Brand Flow'}
      lockDescription={'Give your users an experience that looks like you by customizing the color, logo and more'}
      lockVideoUrl=""
    >
      <CenteredPage
        title={'Branding'}
        description={'Configure the appearance for your platform.'}
      >
        <AppearanceSection />
      </CenteredPage>
    </LockedFeatureGuard>
  );
};
