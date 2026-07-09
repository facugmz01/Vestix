import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Plus, X } from 'lucide-react';
import { customersApi } from '@/api/customers.api';
import { usePosStore } from '../store/usePosStore';
import type { Customer } from '@/types';
import styles from '@/pages/pos/POSPage.module.css';

export function PosCustomerSearch({ grandTotal }: { grandTotal: number }) {
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);
  const setCustomerId = usePosStore(s => s.setCustomerId);
  const setCustomerFormOpen = usePosStore(s => s.setCustomerFormOpen);

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

  const pickCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setQuery('');
    setOpen(false);
  };

  const clearCustomer = () => {
    setCustomerId('');
    setQuery('');
  };

  const displayLabel = selectedCustomerId && selectedCustomer ? selectedCustomer.fullName : '';
  const creditLow = selectedCustomer?.credit && selectedCustomer.credit.available < grandTotal;

  return (
    <div className={styles.customerRow}>
      <div ref={wrapperRef} className={styles.customerSearchWrap}>
        <div className={styles.customerInputWrap}>
          <User size={18} className={styles.customerInputIcon} />
          <input
            type="text"
            value={open ? query : displayLabel}
            placeholder="Buscar cliente..."
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); if (displayLabel) setQuery(''); }}
            aria-label="Buscar cliente"
            className={`${styles.customerInput} ${creditLow ? styles.customerInputWarning : ''}`}
          />
          {selectedCustomerId && !open && (
            <button type="button" onClick={clearCustomer} aria-label="Quitar cliente" className={styles.customerClearBtn}>
              <X size={16} />
            </button>
          )}
        </div>

        {open && query.length >= 2 && searchResults?.data && (
          <div className={styles.customerDropdown}>
            {searchResults.data.length === 0 ? (
              <div className={styles.customerDropdownEmpty}>Sin resultados</div>
            ) : (
              searchResults.data.map(c => (
                <button key={c.id} type="button" onClick={() => pickCustomer(c)} className={styles.customerOption}>
                  <div className={styles.customerOptionName}>{c.fullName}</div>
                  {c.credit && (
                    <div className={styles.customerOptionCredit}>
                      Disp. ${c.credit.available.toLocaleString('es-AR')}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {selectedCustomer?.credit && (
          <div className={`${styles.customerCreditHint} ${creditLow ? styles.customerCreditHintLow : ''}`}>
            Crédito disp. ${selectedCustomer.credit.available.toLocaleString('es-AR')}
            {creditLow && ' — insuficiente para esta venta'}
          </div>
        )}
      </div>
      <button type="button" onClick={() => setCustomerFormOpen(true)} aria-label="Nuevo cliente" className={styles.customerAddBtn}>
        <Plus size={20} />
      </button>
    </div>
  );
}
