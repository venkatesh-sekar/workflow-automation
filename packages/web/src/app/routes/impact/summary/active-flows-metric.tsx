import { FlowStatus, PlatformAnalyticsReport } from '@flow/shared';
import { Workflow } from 'lucide-react';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveFlowsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveFlowsMetric = ({ report }: ActiveFlowsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const activeFlows = report.flows.filter(
    (flow) => flow.status === FlowStatus.ENABLED,
  ).length;
  const totalFlows = report.flows.length;

  return (
    <MetricCard
      icon={Workflow}
      title={'Active Flows'}
      value={activeFlows.toLocaleString()}
      description={'Number of currently active flows'}
      subtitle={`${totalFlows.toLocaleString()} total flows created`}
      iconColor="text-purple-500"
      iconBgColor="bg-purple-500/10"
    />
  );
};
