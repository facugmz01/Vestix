import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import type { DashboardSummary } from '@/types';

export interface UseDashboardReturn {
  dashboard:  DashboardSummary | undefined;
  isLoading:  boolean;
  isError:    boolean;
  refetch:    () => void;
}

/**
 * Encapsulates all data-fetching logic for the dashboard overview tab.
 * Separates concerns so ReportsPage stays a pure composition component.
 */
export function useDashboard(branchId?: string, enabled = true): UseDashboardReturn {
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports.dashboard(branchId),
    queryFn:  () => reportsApi.getDashboard(branchId),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes — aligns with potential server-side cache TTL
    retry: 1,
  });

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard(branchId) });

  return { dashboard, isLoading, isError, refetch };
}
