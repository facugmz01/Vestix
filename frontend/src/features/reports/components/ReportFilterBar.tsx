import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store, Calendar, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import {
  DATE_PRESETS,
  type DatePreset,
  type UseDashboardFiltersReturn,
} from '../hooks/useDashboardFilters';
import styles from './ReportFilterBar.module.css';

interface Props {
  filters: UseDashboardFiltersReturn;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ReportFilterBar({ filters, onRefresh, isRefreshing }: Props) {
  const { branchId, setBranchId, preset, applyPreset, from, to, setFrom, setTo } = filters;

  const { data: branchData } = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: () => branchesApi.getBranches({ pageSize: 100 }),
    staleTime: 1000 * 60 * 10,
  });

  const branches = branchData?.items || [];

  return (
    <div className={clsx('glass-panel', styles.filterBarSticky)}>
      <div className={styles.leftControls}>
        {/* Selector de Sucursal */}
        <div className={styles.selectGroup}>
          <Store size={16} className={styles.selectIcon} />
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className={styles.branchSelect}
            aria-label="Filtrar por sucursal"
          >
            <option value="">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Presets rápidos */}
        <div className={styles.presetGroup}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              className={clsx(styles.presetBtn, preset === p.value && styles.presetBtnActive)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Rango de fechas manual cuando está en Custom o para ajuste fino */}
        <div className={styles.dateRangeCustom}>
          <Calendar size={14} className={styles.selectIcon} />
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className={styles.dateInput}
            aria-label="Fecha desde"
          />
          <span className={styles.dateSep}>—</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className={styles.dateInput}
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      {onRefresh && (
        <div className={styles.rightControls}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            loading={isRefreshing}
            icon={<RefreshCw size={13} className={isRefreshing ? 'animate-spin' : undefined} />}
          >
            Actualizar
          </Button>
        </div>
      )}
    </div>
  );
}
