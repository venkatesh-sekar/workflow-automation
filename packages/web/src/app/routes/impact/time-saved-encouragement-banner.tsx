import { PlatformAnalyticsReport } from '@flow/shared';
import { Lightbulb, Pencil } from 'lucide-react';

type TimeSavedEncouragementBannerProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedEncouragementBanner({
  report,
}: TimeSavedEncouragementBannerProps) {
  if (!report) {
    return null;
  }

  const flows = report.flows ?? [];
  const flowsWithoutTimeSaved = flows.filter(
    (flow) =>
      flow.timeSavedPerRun === null || flow.timeSavedPerRun === undefined,
  );

  if (flowsWithoutTimeSaved.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            {`You have ${flowsWithoutTimeSaved.length} ${flowsWithoutTimeSaved.length === 1 ? 'flow' : 'flows'} without time saved per run. Add it to see your complete automation impact!`}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {'Click the'}{' '}
            <Pencil className="h-3 w-3 inline-block align-middle mx-0.5" />{' '}
            {'pencil icon in the table below to set time saved per run'}
          </p>
        </div>
      </div>
    </div>
  );
}
