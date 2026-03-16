import { t } from 'i18next';
import { Bell } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AlertsSettings = () => {
  return (
    <Alert variant="default">
      <Bell className="w-4 h-4" />
      <div className="flex flex-col gap-1">
        <AlertTitle>{t('Alerts')}</AlertTitle>
        <AlertDescription className="text-sm">
          {t(
            'Flow logs structured alerts to stdout when a flow run fails. Check your application logs or container output for alert details.',
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};
