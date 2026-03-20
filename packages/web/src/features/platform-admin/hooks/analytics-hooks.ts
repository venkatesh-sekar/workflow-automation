import {
  AnalyticsTimePeriod,
  PlatformAnalyticsReport,
} from '@flow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useContext } from 'react';

import { analyticsApi } from '@/features/platform-admin/api/analytics-api';

import { RefreshAnalyticsContext } from '../stores/refresh-analytics-context';

const analyticsQueryKey = ['analytics'];

export const platformAnalyticsHooks = {
  useAnalytics: (): {
    data: PlatformAnalyticsReport | undefined;
    isLoading: boolean;
  } => {
    const { data, isLoading } = useQuery({
      queryKey: analyticsQueryKey,
      queryFn: () => analyticsApi.get(),
    });
    return { data, isLoading };
  },

  useAnalyticsTimeBased: (
    timePeriod: AnalyticsTimePeriod,
    projectId?: string,
  ): { isLoading: boolean; data: PlatformAnalyticsReport | null } => {
    const selectFilteredByProject = useCallback(
      (report: PlatformAnalyticsReport) => {
        if (!projectId) {
          return report;
        }
        const flows = report.flows.filter(
          (flow) => flow.projectId === projectId,
        );
        const runs = report.runs.filter((run) =>
          flows.some((flow) => flow.flowId === run.flowId),
        );
        return {
          ...report,
          flows,
          runs,
        };
      },
      [projectId],
    );

    const { data, isLoading } = useQuery({
      queryKey: [...analyticsQueryKey, timePeriod],
      queryFn: () => analyticsApi.get(timePeriod),
      select: selectFilteredByProject,
    });

    return {
      isLoading,
      data: data ?? null,
    };
  },

  useRefreshAnalytics: () => {
    const queryClient = useQueryClient();
    const { setIsRefreshing } = useContext(RefreshAnalyticsContext);
    return useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        await new Promise((resolve) => setTimeout(resolve, 5000));

        return analyticsApi.refresh();
      },
      onSuccess: () => {
        setIsRefreshing(false);
        queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
      },
      retry: true,
      retryDelay: 50000,
    });
  },
};
