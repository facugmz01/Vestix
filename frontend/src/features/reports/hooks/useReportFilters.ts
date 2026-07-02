import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DatePreset = 'today' | '7d' | '30d' | 'month';

export interface ReportFilters {
  from: string;
  to: string;
}

export interface UseReportFiltersReturn extends ReportFilters {
  setFrom: (v: string) => void;
  setTo:   (v: string) => void;
  applyPreset: (preset: DatePreset) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getPresetRange(preset: DatePreset): ReportFilters {
  const now = new Date();

  switch (preset) {
    case 'today': {
      return { from: toDateStr(now), to: toDateStr(now) };
    }
    case '7d': {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      return { from: toDateStr(from), to: toDateStr(now) };
    }
    case '30d': {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      return { from: toDateStr(from), to: toDateStr(now) };
    }
    case 'month':
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toDateStr(from), to: toDateStr(now) };
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Centralised date-range state for all report panels.
 * Initialises to the current month by default.
 */
export function useReportFilters(defaultPreset: DatePreset = 'month'): UseReportFiltersReturn {
  const initial = getPresetRange(defaultPreset);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo]     = useState(initial.to);

  const applyPreset = useCallback((preset: DatePreset) => {
    const range = getPresetRange(preset);
    setFrom(range.from);
    setTo(range.to);
  }, []);

  return { from, to, setFrom, setTo, applyPreset };
}

// Re-export the presets list so consumers can render buttons without magic strings
export const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Hoy',  value: 'today' },
  { label: '7D',   value: '7d'    },
  { label: '30D',  value: '30d'   },
  { label: 'Mes',  value: 'month' },
];
