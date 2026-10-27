import styles from './Table.module.css';
import { useLayoutEffect, useRef } from 'react';

export interface Column<T = any> {
  key: string;
  header?: React.ReactNode;
  label?: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

function ThWithWidth({ width, children }: { width?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLTableCellElement>(null);
  useLayoutEffect(() => {
    if (ref.current && width) ref.current.style.setProperty('--col-width', width);
  }, [width]);
  return (
    <th ref={ref} className={width ? styles.colWidth : undefined}>{children}</th>
  );
}

export interface Props<T = any> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  keyExtractor?: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T = any>({
  columns, data, keyField, keyExtractor, loading, emptyMessage = 'Sin resultados', onRowClick,
}: Props<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <ThWithWidth key={col.key} width={col.width}>{col.header ?? col.label}</ThWithWidth>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className={styles.center}>
              <div className={styles.loadingRow}>Cargando...</div>
            </td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className={styles.center}>
              <span className={styles.emptyMessage}>{emptyMessage}</span>
            </td></tr>
          ) : (
            data.map((row, index) => {
              const rowKey = keyExtractor
                ? String(keyExtractor(row))
                : keyField
                  ? String(row[keyField])
                  : (row as any)?.id != null
                    ? String((row as any).id)
                    : String(index);

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? styles.clickable : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
