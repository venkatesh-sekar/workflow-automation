import { PlatformAnalyticsReport, UserStatus } from '@flow/shared';
import { Users } from 'lucide-react';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveUsersMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveUsersMetric = ({ report }: ActiveUsersMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const activeUsers = report.users.filter(
    (user) => user.status === UserStatus.ACTIVE,
  ).length;
  const totalUsers = report.users.length;

  const adoptionRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <MetricCard
      icon={Users}
      title={'Active Users'}
      value={activeUsers.toLocaleString()}
      description={'Users actively using the platform'}
      subtitle={`${adoptionRate}% adoption rate (${totalUsers.toLocaleString()} total users)`}
      iconColor="text-amber-500"
      iconBgColor="bg-amber-500/10"
    />
  );
};
