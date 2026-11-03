import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Plus, X } from 'lucide-react';
import { customersApi } from '@/api/customers.api';
import { usePosStore } from '../store/usePosStore';
import type { Customer } from '@/types';
import styles from '@/pages/pos/POSPage.module.css';

export function PosCustomerSearch({
  amountDue,
  onApplyCreditBalance,
}: {
  amountDue: number;
  onApplyCreditBalance?: (balance: number) => void;
}) {
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
  const creditLow = selectedCustomer?.credit && selectedCustomer.credit.available < amountDue;
  const customerCreditBalance = Number(selectedCustomer?.creditBalance) || 0;

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
              searchResults.data.map(c => {
                const bal = Number(c.creditBalance) || 0;
                return (
                  <button key={c.id} type="button" onClick={() => pickCustomer(c)} className={styles.customerOption}>
                    <div className={styles.customerOptionName}>{c.fullName}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {bal > 0 && (
                        <span style={{ color: 'var(--green, #10b981)', fontSize: 11, fontWeight: 600 }}>
                          Favor: ${bal.toLocaleString('es-AR')}
                        </span>
                      )}
                      {c.credit && c.credit.available > 0 && (
                        <span className={styles.customerOptionCredit}>
                          Cta: ${c.credit.available.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {customerCreditBalance > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              marginTop: 4,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--green, #10b981)',
            }}
          >
            <span>
              Saldo a favor: <strong>${customerCreditBalance.toLocaleString('es-AR')}</strong>
            </span>
            {amountDue > 0 && onApplyCreditBalance && (
              <button
                type="button"
                onClick={() => onApplyCreditBalance(customerCreditBalance)}
                style={{
                  background: 'var(--green, #10b981)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Descontar
              </button>
            )}
          </div>
        )}

        {selectedCustomer?.credit && customerCreditBalance <= 0 && (
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
