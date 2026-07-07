import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Plus, X } from 'lucide-react';
import { customersApi } from '@/api/customers.api';
import { usePosStore } from '../store/usePosStore';
import type { Customer } from '@/types';

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
    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
      <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)', zIndex: 1 }} />
          <input
            type="text"
            value={open ? query : displayLabel}
            placeholder="Buscar cliente..."
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setOpen(true); if (displayLabel) setQuery(''); }}
            aria-label="Buscar cliente"
            style={{
              width: '100%',
              padding: '12px 36px 12px 42px',
              borderRadius: '12px',
              border: creditLow ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {selectedCustomerId && !open && (
            <button type="button" onClick={clearCustomer} aria-label="Quitar cliente"
              style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {open && query.length >= 2 && searchResults?.data && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
            background: 'rgba(19,22,30,0.98)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', zIndex: 50,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}>
            {searchResults.data.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>Sin resultados</div>
            ) : (
              searchResults.data.map(c => (
                <button key={c.id} type="button" onClick={() => pickCustomer(c)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                    background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px',
                  }}>
                  <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                  {c.credit && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Disp. ${c.credit.available.toLocaleString('es-AR')}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {selectedCustomer?.credit && (
          <div style={{ fontSize: '11px', color: creditLow ? '#f87171' : 'var(--text-muted)', marginTop: '4px' }}>
            Crédito disp. ${selectedCustomer.credit.available.toLocaleString('es-AR')}
            {creditLow && ' — insuficiente para esta venta'}
          </div>
        )}
      </div>
      <button type="button" onClick={() => setCustomerFormOpen(true)} aria-label="Nuevo cliente"
        style={{ padding: '0 16px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', cursor: 'pointer' }}>
        <Plus size={20} />
      </button>
    </div>
  );
}
