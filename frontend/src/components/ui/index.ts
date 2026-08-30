// ─── Core UI Primitives ────────────────────────────────────────────────────────
export { Button }       from './Button';
export { Badge }        from './Badge';
export { Card }         from './Card';
export { Input }        from './Input';
export { Table }        from './Table';
export { Modal }        from './Modal';
export { Spinner, PageSpinner } from './Spinner';

// ─── Layout Primitives ────────────────────────────────────────────────────────
export { PageContainer }  from './PageContainer';
export type { PageContainerProps } from './PageContainer';
export { PageHeader }     from './PageHeader';
export type { PageHeaderProps } from './PageHeader';
export { Section, Section as ContentSection } from './Section';
export { SearchInput }    from './SearchInput';
export { FiltersBar }     from './FiltersBar';
export { Pagination }     from './Pagination';
export { Drawer }         from './Drawer';
export { ConfirmDialog }  from './ConfirmDialog';
export { EmptyState }     from './EmptyState';
export { ApiErrorDisplay }from './ApiErrorDisplay';
export { ToggleSwitch }   from './ToggleSwitch';

export {
  Skeleton, TableSkeleton, CardGridSkeleton, StatsSkeleton,
} from './Skeleton';

export {
  StatusChip,
  OrderStatusChip, POStatusChip,
  ActiveChip, PublishedChip, StockStatusChip,
} from './StatusChip';

export * from './Tabs';