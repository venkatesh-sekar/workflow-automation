import { PlatformWithoutSensitiveData } from '@flow/shared';
import { t } from 'i18next';
import { Shield } from 'lucide-react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemFooter,
} from '@/components/custom/item';

import { FeatureStatus } from './features-status';

export const LicenseKey = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Shield />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{t('Platform Features')}</ItemTitle>
      </ItemContent>
      <ItemFooter>
        <div className="flex flex-col gap-2 w-full pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('Enabled Features')}
          </h4>
          <FeatureStatus platform={platform} />
        </div>
      </ItemFooter>
    </Item>
  );
};

LicenseKey.displayName = 'LicenseKeys';
