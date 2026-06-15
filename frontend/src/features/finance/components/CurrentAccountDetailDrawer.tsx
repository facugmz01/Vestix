import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Banknote, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function CurrentAccountDetailDrawer({ open, onClose, accountId }: Props) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'NEW_RECEIPT'>('MOVEMENTS');

  // New Receipt Form State
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptRef, setReceiptRef] = useState('');
  const [receiptDesc, setReceiptDesc] = useState('');

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['finance', 'currentAccounts', accountId],
    queryFn: () => financeApi.getCurrentAccount(accountId!),
    enabled: open && !!accountId,
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: queryKeys.finance.movements(accountId || ''),
    queryFn: () => financeApi.getMovements(accountId!),
    enabled: open && !!accountId && activeTab === 'MOVEMENTS',
  });

  const paymentMutation = useMutation({
    mutationFn: () => financeApi.registerPaymentReceipt(accountId!, { amount: receiptAmount, referenceId: receiptRef, description: receiptDesc }),
    onSuccess: () => {
      toast.success('Pago / Recibo registrado con éxito.');
      queryClient.invalidateQueries({ queryKey: ['finance', 'currentAccounts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.movements(accountId!) });
      setActiveTab('MOVEMENTS');
      setReceiptAmount(0);
      setReceiptRef('');
      setReceiptDesc('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al registrar el recibo'),
  });

  if (!accountId || accountLoading || !account) {
    return <Drawer open={open} onClose={onClose} title="Cargando Cuenta..." width="lg"><div /></Drawer>;
  }

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Determine if it's a customer (balance > 0 means they owe us) or supplier (balance > 0 means we owe them)
  // For clarity: Balance > 0 = Deuda. 
  const isCustomer = account.entityType === 'CUSTOMER';
  const oweText = isCustomer ? 'Saldo Deudor (Nos debe)' : 'Saldo Acreedor (Le debemos)';
  const balanceColor = account.balance > 0 ? (isCustomer ? 'var(--red)' : 'var(--orange)') : 'var(--green)';

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Cuenta Corriente" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
        
        {/* Header / Summary */}
        <div className="grid-responsive grid-cols-2-1">
          <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <Badge color={isCustomer ? 'blue' : 'purple'}>{isCustomer ? 'CLIENTE' : 'PROVEEDOR'}</Badge>
            <h3 style={{ margin: '8px 0 4px', fontSize: '20px', fontWeight: 800 }}>{account.entityName}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>ID Entidad: <span style={{ fontFamily: 'monospace' }}>{account.entityId.split('-')[0]}</span></p>
            
            {account.overdueAmount > 0 && (
              <div style={{ marginTop: '12px', padding: '8px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} /> Deuda Vencida: {fmtCurrency(account.overdueAmount)}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<FileText size={14} />} 
                onClick={async () => {
                  try {
                    const res = await financeApi.sendManualStatement(account.id, { channel: 'WHATSAPP', recipient: '5491100000000' });
                    toast.success(res.message);
                  } catch (e) {
                    toast.error('Error al enviar resumen');
                  }
                }}
              >
                Enviar Resumen (WhatsApp)
              </Button>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>{oweText}</p>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: balanceColor }}>
              {fmtCurrency(Math.abs(account.balance))}
            </h2>
            {account.creditLimit && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Límite de Crédito: {fmtCurrency(account.creditLimit)}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          <Button variant={activeTab === 'MOVEMENTS' ? 'primary' : 'ghost'} onClick={() => setActiveTab('MOVEMENTS')}>Historial y Movimientos</Button>
          <ActionGuard action="manage" subject="Finance">
            <Button variant={activeTab === 'NEW_RECEIPT' ? 'primary' : 'ghost'} onClick={() => setActiveTab('NEW_RECEIPT')} icon={<Banknote size={16} />}>
              Ingresar Pago / Recibo
            </Button>
          </ActionGuard>
        </div>

        {/* Tab Content */}
        {activeTab === 'MOVEMENTS' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {movementsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando movimientos...</div>
            ) : !movementsData?.data.length ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos en esta cuenta.</div>
            ) : (
              <Table
                keyField="id"
                data={movementsData.data}
                columns={[
                  { 
                    key: 'date', 
                    header: 'Fecha', 
                    render: (m) => (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                    ) 
                  },
                  { 
                    key: 'doc', 
                    header: 'Documento', 
                    render: (m) => {
                      let color = 'gray'; let icon = <FileText size={14} />;
                      if (m.documentType === 'INVOICE') { color = 'blue'; }
                      if (m.documentType === 'RECEIPT') { color = 'green'; icon = <Banknote size={14} />; }
                      if (m.documentType === 'DEBIT_NOTE') { color = 'red'; }
                      if (m.documentType === 'CREDIT_NOTE') { color = 'orange'; }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <Badge color={color as any}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{icon} {m.documentType}</span>
                            </Badge>
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.referenceId}</span>
                        </div>
                      );
                    }
                  },
                  { 
                    key: 'debit', 
                    header: 'Débito (+)', 
                    render: (m) => m.debit > 0 ? <span style={{ fontWeight: 'bold', color: 'var(--red)' }}>{fmtCurrency(m.debit)}</span> : '-' 
                  },
                  { 
                    key: 'credit', 
                    header: 'Crédito (-)', 
                    render: (m) => m.credit > 0 ? <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>{fmtCurrency(m.credit)}</span> : '-' 
                  },
                  { 
                    key: 'balance', 
                    header: 'Saldo', 
                    render: (m) => <span style={{ fontWeight: 800 }}>{fmtCurrency(m.balanceAfter)}</span> 
                  },
                  { 
                    key: 'dueDate', 
                    header: 'Vencimiento', 
                    render: (m) => m.dueDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: m.status === 'OVERDUE' ? 'var(--red)' : 'var(--text-secondary)', fontWeight: m.status === 'OVERDUE' ? 'bold' : 'normal' }}>
                        <Calendar size={12} /> {new Date(m.dueDate).toLocaleDateString()}
                      </div>
                    ) : '-'
                  }
                ]}
              />
            )}
          </div>
        )}

        {activeTab === 'NEW_RECEIPT' && (
          <div style={{ flex: 1, padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '16px' }}>Registrar {isCustomer ? 'Cobranza (Recibo)' : 'Pago (Orden de Pago)'}</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
              <Input 
                label="Monto a Aplicar ($)" 
                type="number" 
                min="0" 
                step="0.01" 
                value={receiptAmount} 
                onChange={e => setReceiptAmount(Number(e.target.value))} 
              />
              <Input 
                label="ID de Referencia (Ej: Transferencia Banco X)" 
                value={receiptRef} 
                onChange={e => setReceiptRef(e.target.value)} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Descripción / Concepto</label>
                <textarea 
                  value={receiptDesc} 
                  onChange={e => setReceiptDesc(e.target.value)} 
                  rows={3} 
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} 
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <Button variant="primary" onClick={() => paymentMutation.mutate()} loading={paymentMutation.isPending} disabled={receiptAmount <= 0 || !receiptRef}>
                  Generar y Aplicar Recibo
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
