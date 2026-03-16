import { PlatformAnalyticsReport } from '@flow/shared';
import { TrendingUp } from 'lucide-react';

import { AnalyticsAreaChart } from './analytics-area-chart';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
};

export function RunsChart({ report }: RunsChartProps) {
  const chartData =
    report?.runs
      .map((data) => ({ date: data.day, runs: data.runs }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) ?? [];

  return (
    <AnalyticsAreaChart
      title={'Flow Runs Over Time'}
      subtitle={'Track your automation execution trends'}
      tooltipLabel={'Runs'}
      dataKey="runs"
      color="#8b5cf6"
      gradientId="fillRuns"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={<TrendingUp className="h-10 w-10 text-muted-foreground/50" />}
      emptyText={'No runs recorded yet. Data will appear here once your flows start running.'}
      downloadFilename="flow-runs"
    />
  );
}
