import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface DashboardFilters {
  branchId: string; // '' means all branches
  preset: DatePreset;
  from: string;
  to: string;
}

export interface UseDashboardFiltersReturn extends DashboardFilters {
  setBranchId: (branchId: string) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  applyPreset: (preset: DatePreset) => void;
  clearFilters: () => void;
}

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculatePresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const todayStr = formatDateStr(now);

  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr };

    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = formatDateStr(yesterday);
      return { from: yStr, to: yStr };
    }

    case 'week': {
      // Monday as start of week
      const current = new Date(now);
      const day = current.getDay(); // 0 is Sunday
      const diff = (day === 0 ? -6 : 1) - day;
      current.setDate(current.getDate() + diff);
      return { from: formatDateStr(current), to: todayStr };
    }

    case 'month':
    default: {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatDateStr(startOfMonth), to: todayStr };
    }
  }
}

export const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Esta Semana', value: 'week' },
  { label: 'Este Mes', value: 'month' },
  { label: 'Personalizado', value: 'custom' },
];

/**
 * Unified filter hook for Dashboard and Reports.
 * Synchronises state with URL search params so filters persist on tab switch, page reload, or link sharing.
 */
export function useDashboardFilters(): UseDashboardFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const branchId = searchParams.get('branchId') || '';
  const preset = (searchParams.get('preset') as DatePreset) || 'month';

  const { defaultFrom, defaultTo } = useMemo(() => {
    const range = calculatePresetRange('month');
    return { defaultFrom: range.from, defaultTo: range.to };
  }, []);

  const from = searchParams.get('from') || defaultFrom;
  const to = searchParams.get('to') || defaultTo;

  const setBranchId = useCallback(
    (newBranchId: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (newBranchId) {
          next.set('branchId', newBranchId);
        } else {
          next.delete('branchId');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const applyPreset = useCallback(
    (newPreset: DatePreset) => {
      if (newPreset === 'custom') {
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('preset', 'custom');
          return next;
        });
        return;
      }

      const range = calculatePresetRange(newPreset);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('preset', newPreset);
        next.set('from', range.from);
        next.set('to', range.to);
        return next;
      });
    },
    [setSearchParams],
  );

  const setFrom = useCallback(
    (newFrom: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('preset', 'custom');
        next.set('from', newFrom);
        return next;
      });
    },
    [setSearchParams],
  );

  const setTo = useCallback(
    (newTo: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('preset', 'custom');
        next.set('to', newTo);
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    const range = calculatePresetRange('month');
    setSearchParams({
      preset: 'month',
      from: range.from,
      to: range.to,
    });
  }, [setSearchParams]);

  return {
    branchId,
    preset,
    from,
    to,
    setBranchId,
    setFrom,
    setTo,
    applyPreset,
    clearFilters,
  };
}
