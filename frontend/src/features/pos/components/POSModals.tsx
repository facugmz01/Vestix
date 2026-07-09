import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PauseCircle } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { useAuthStore } from '@/store/auth.store';
import { customersApi } from '@/api/customers.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import { PAYMENT_METHOD_LABELS } from '../constants/posPaymentMethods';
import { Button, Input, Modal } from '@/components/ui';

import { QrPaymentModal } from './QrPaymentModal';
import { PrintReceiptModal } from './PrintReceiptModal';
import { PosMixedPaymentModal } from './PosMixedPaymentModal';
import { CustomerFormDrawer } from '@/features/customers/components/CustomerFormDrawer';
import { ShiftManagerModal } from '@/features/sales/components/ShiftManagerModal';
import type { CashShift, CashRegister } from '@/types';

export function POSModals({
  grandTotal,
  paymentMethod,
  isGeneratingQr,
  onConfirmCheckout,
  isCheckoutLoading,
  activeShift,
  registersData,
  isShiftLoading,
  issueInvoice,
  setIssueInvoice,
}: {
  grandTotal: number;
  paymentMethod: string;
  isGeneratingQr: boolean;
  onConfirmCheckout: (status: 'CONFIRMED' | 'QUOTATION') => void;
  isCheckoutLoading: boolean;
  activeShift: CashShift | null | undefined;
  registersData: CashRegister[] | undefined;
  isShiftLoading: boolean;
  issueInvoice: boolean;
  setIssueInvoice: (issue: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [amountTendered, setAmountTendered] = useState(grandTotal);

  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customersApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });
  const paymentReference = usePosStore(s => s.paymentReference);
  const setPaymentReference = usePosStore(s => s.setPaymentReference);
  const setPaymentSplits = usePosStore(s => s.setPaymentSplits);

  const qrModalOpen = usePosStore(s => s.qrModalOpen);
  const qrData = usePosStore(s => s.qrData);
  const qrOrderId = usePosStore(s => s.qrOrderId);
  const setQrModalOpen = usePosStore(s => s.setQrModalOpen);

  const mixedPaymentModalOpen = usePosStore(s => s.mixedPaymentModalOpen);
  const setMixedPaymentModalOpen = usePosStore(s => s.setMixedPaymentModalOpen);

  const printModalOpen = usePosStore(s => s.printModalOpen);
  const completedOrder = usePosStore(s => s.completedOrder);
  const setPrintModalOpen = usePosStore(s => s.setPrintModalOpen);

  const paymentModalOpen = usePosStore(s => s.paymentModalOpen);
  const setPaymentModalOpen = usePosStore(s => s.setPaymentModalOpen);

  const suspendModalOpen = usePosStore(s => s.suspendModalOpen);
  const setSuspendModalOpen = usePosStore(s => s.setSuspendModalOpen);
  const suspendedSales = usePosStore(s => s.suspendedSales);
  const resumeSale = usePosStore(s => s.resumeSale);

  const shiftModalOpen = usePosStore(s => s.shiftModalOpen);
  const setShiftModalOpen = usePosStore(s => s.setShiftModalOpen);

  const customerFormOpen = usePosStore(s => s.customerFormOpen);
  const setCustomerFormOpen = usePosStore(s => s.setCustomerFormOpen);

  useEffect(() => {
    if (paymentModalOpen) {
      setAmountTendered(grandTotal);
    }
  }, [paymentModalOpen, grandTotal]);

  const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;
  const isCashInsufficient = paymentMethod === 'CASH' && amountTendered < grandTotal;
  const canConfirmSale = !isCashInsufficient && !isCheckoutLoading;

  const handleConfirmSale = () => {
    if (paymentMethod === 'CASH' && amountTendered < grandTotal) return;
    onConfirmCheckout('CONFIRMED');
  };

  return (
    <>
      <ShiftManagerModal 
        open={!activeShift && !isShiftLoading} 
        mode="OPEN"
        activeShift={null}
        registers={registersData}
        allowDismiss
        onDismiss={() => navigate('/')}
        onClose={() => {}}
      />
      
      <ShiftManagerModal 
        open={shiftModalOpen} 
        mode="CLOSE"
        activeShift={activeShift || null}
        onClose={() => setShiftModalOpen(false)}
      />

      <QrPaymentModal 
        open={qrModalOpen} 
        amount={grandTotal}
        orderId={qrOrderId}
        qrData={qrData} 
        isLoading={isGeneratingQr} 
        onClose={() => setQrModalOpen(false)} 
        onPaymentConfirmed={() => {
          setQrModalOpen(false);
          setPaymentModalOpen(true);
        }}
        onForceConfirm={() => {
          setQrModalOpen(false);
          setPaymentModalOpen(true);
        }} 
      />

      <PosMixedPaymentModal
        open={mixedPaymentModalOpen}
        grandTotal={grandTotal}
        onClose={() => setMixedPaymentModalOpen(false)}
        isLoading={isCheckoutLoading}
        onConfirm={(splits) => {
          setPaymentSplits(splits);
          setMixedPaymentModalOpen(false);
          setPaymentModalOpen(true);
        }}
      />

      <PrintReceiptModal 
        open={printModalOpen} 
        order={completedOrder} 
        onClose={() => setPrintModalOpen(false)} 
        branchSettings={user?.branchId === 'CENTRAL' ? { posReceiptHeader: 'VESTIX - SUCURSAL CENTRAL', posReceiptFooter: 'Gracias por tu compra' } : {}}
      />

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Confirmar Pago — ${paymentLabel}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: 600, opacity: 0.8 }}>Monto a Cobrar</div>
            <div style={{ fontSize: '48px', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{formatCurrency(grandTotal)}</div>
          </div>

          {paymentMethod === 'CASH' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Monto Recibido</label>
              <Input 
                type="number" 
                min={grandTotal}
                value={amountTendered} 
                onChange={e => setAmountTendered(Number(e.target.value))} 
                style={{ fontSize: '24px', padding: '14px', background: 'rgba(0,0,0,0.3)' }}
              />
              {amountTendered > grandTotal && (
                <div style={{ marginTop: '16px', color: '#f87171', fontSize: '22px', fontWeight: 'bold' }}>
                  Vuelto a entregar: {formatCurrency(amountTendered - grandTotal)}
                </div>
              )}
              {amountTendered < grandTotal && (
                <div style={{ marginTop: '12px', color: '#f87171', fontSize: '14px' }}>
                  El monto recibido debe ser al menos {formatCurrency(grandTotal)}
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'BANK_TRANSFER' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Referencia de Transferencia</label>
              <Input
                placeholder="Ej: CBU, alias o número de operación"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'CREDIT_CARD' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Cupón / Lote (opcional)</label>
              <Input
                placeholder="Ej: Lote 1234"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'CUSTOMER_CREDIT' && (
            <div style={{ padding: '16px', background: 'rgba(234,179,8,0.1)', borderRadius: '12px', border: '1px solid rgba(234,179,8,0.2)', color: '#fbbf24', fontSize: '14px' }}>
              Se cargará a cuenta corriente de{' '}
              <strong>{selectedCustomer?.fullName || 'cliente seleccionado'}</strong>.
            </div>
          )}

          {paymentMethod === 'QR_MERCADOPAGO' && (
            <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', fontSize: '14px' }}>
              Pago QR MercadoPago confirmado{qrOrderId ? ` — ref. ${qrOrderId}` : ''}.
            </div>
          )}

          {paymentMethod === 'MULTIPLE' && (
            <div style={{ padding: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '14px' }}>
              Pago mixto configurado. Revisá el total y confirmá la venta.
            </div>
          )}

          <div style={{ padding: '10px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px' }}>
              <input type="checkbox" checked={issueInvoice} onChange={e => setIssueInvoice(e.target.checked)} style={{ width: '20px', height: '20px' }} />
              Emitir e Imprimir Factura Electrónica (AFIP)
            </label>
          </div>

          <Button 
            variant="primary" 
            style={{ height: '56px', fontSize: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
            onClick={handleConfirmSale}
            loading={isCheckoutLoading}
            disabled={!canConfirmSale}
          >
            Completar Venta y Emitir Ticket
          </Button>
        </div>
      </Modal>

      <Modal open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title="Ventas Suspendidas">
        {suspendedSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
            <PauseCircle size={48} style={{ margin: '0 auto 16px' }} />
            <p>No hay ventas en suspenso.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suspendedSales.map(sale => (
              <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {formatSaleId(sale.id)}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{sale.customerId ? 'Cliente registrado' : 'Consumidor Final'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(sale.date).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#34d399' }}>{formatCurrency(sale.total)}</div>
                  <Button variant="primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => resumeSale(sale.id)}>
                    Retomar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <CustomerFormDrawer open={customerFormOpen} onClose={() => setCustomerFormOpen(false)} />
    </>
  );
}
