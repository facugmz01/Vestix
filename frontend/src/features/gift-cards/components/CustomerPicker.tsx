import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Plus, X } from 'lucide-react';
import { customersApi } from '@/api/customers.api';
import type { Customer } from '@/types';
import styles from './CustomerPicker.module.css';

interface Props {
  selectedCustomerId: string;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: () => void;
  disabled?: boolean;
}

export function CustomerPicker({ selectedCustomerId, onSelect, onCreateNew, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customersApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => customersApi.getCustomers({ search: query, pageSize: 15 }),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pickCustomer = (customer: Customer) => {
    onSelect(customer);
    setQuery('');
    setOpen(false);
  };

  const clearCustomer = () => {
    onSelect(null);
    setQuery('');
  };

  const displayLabel = selectedCustomerId && selectedCustomer ? selectedCustomer.fullName : '';

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Cliente destinatario</label>
      <div className={styles.row}>
        <div ref={wrapperRef} className={styles.searchWrap}>
          <div className={styles.inputWrap}>
            <User size={16} className={styles.inputIcon} />
            <input
              type="text"
              value={open ? query : displayLabel}
              placeholder="Buscar cliente por nombre, email o teléfono..."
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => { setOpen(true); if (displayLabel) setQuery(''); }}
              disabled={disabled}
              className={styles.input}
            />
            {selectedCustomerId && !open && (
              <button type="button" onClick={clearCustomer} aria-label="Quitar cliente" className={styles.clearBtn}>
                <X size={14} />
              </button>
            )}
          </div>

          {open && query.length >= 2 && searchResults?.data && (
            <div className={styles.dropdown}>
              {searchResults.data.length === 0 ? (
                <div className={styles.dropdownEmpty}>Sin resultados</div>
              ) : (
                searchResults.data.map(customer => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => pickCustomer(customer)}
                    className={styles.option}
                  >
                    <div className={styles.optionName}>{customer.fullName}</div>
                    {(customer.email || customer.phone) && (
                      <div className={styles.optionMeta}>
                        {[customer.email, customer.phone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          disabled={disabled}
          aria-label="Crear cliente"
          className={styles.addBtn}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
