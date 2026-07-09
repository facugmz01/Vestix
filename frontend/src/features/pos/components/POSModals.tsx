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
import styles from '@/pages/pos/POSPage.module.css';

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
        <div className={styles.modalStack}>
          <div className={styles.payHero}>
            <div className={styles.payHeroLabel}>Monto a Cobrar</div>
            <div className={styles.payHeroAmount}>{formatCurrency(grandTotal)}</div>
          </div>

          {paymentMethod === 'CASH' && (
            <div className={styles.payFieldBox}>
              <label className={styles.payFieldLabel}>Monto Recibido</label>
              <Input
                type="number"
                min={grandTotal}
                value={amountTendered}
                onChange={e => setAmountTendered(Number(e.target.value))}
                className={styles.payFieldInput}
              />
              {amountTendered > grandTotal && (
                <div className={styles.payChange}>
                  Vuelto a entregar: {formatCurrency(amountTendered - grandTotal)}
                </div>
              )}
              {amountTendered < grandTotal && (
                <div className={styles.payInsufficient}>
                  El monto recibido debe ser al menos {formatCurrency(grandTotal)}
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'BANK_TRANSFER' && (
            <div className={styles.payFieldBox}>
              <label className={styles.payFieldLabel}>Referencia de Transferencia</label>
              <Input
                placeholder="Ej: CBU, alias o número de operación"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'CREDIT_CARD' && (
            <div className={styles.payFieldBox}>
              <label className={styles.payFieldLabel}>Cupón / Lote (opcional)</label>
              <Input
                placeholder="Ej: Lote 1234"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'CUSTOMER_CREDIT' && (
            <div className={styles.alertCredit}>
              Se cargará a cuenta corriente de{' '}
              <strong>{selectedCustomer?.fullName || 'cliente seleccionado'}</strong>.
            </div>
          )}

          {paymentMethod === 'QR_MERCADOPAGO' && (
            <div className={styles.alertQr}>
              Pago QR MercadoPago confirmado{qrOrderId ? ` — ref. ${qrOrderId}` : ''}.
            </div>
          )}

          {paymentMethod === 'MULTIPLE' && (
            <div className={styles.alertMixed}>
              Pago mixto configurado. Revisá el total y confirmá la venta.
            </div>
          )}

          <div className={styles.invoiceCheck}>
            <label className={styles.invoiceCheckLabel}>
              <input
                type="checkbox"
                checked={issueInvoice}
                onChange={e => setIssueInvoice(e.target.checked)}
                className={styles.invoiceCheckbox}
              />
              Emitir e Imprimir Factura Electrónica (AFIP)
            </label>
          </div>

          <Button
            variant="primary"
            className={styles.confirmSaleBtn}
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
          <div className={styles.suspendEmpty}>
            <PauseCircle size={48} className={styles.suspendEmptyIcon} />
            <p>No hay ventas en suspenso.</p>
          </div>
        ) : (
          <div className={styles.suspendList}>
            {suspendedSales.map(sale => (
              <div key={sale.id} className={styles.suspendCard}>
                <div>
                  <div className={styles.suspendId}>
                    {formatSaleId(sale.id)}
                  </div>
                  <div className={styles.suspendCustomer}>{sale.customerId ? 'Cliente registrado' : 'Consumidor Final'}</div>
                  <div className={styles.suspendDate}>{new Date(sale.date).toLocaleString()}</div>
                </div>
                <div className={styles.suspendRow}>
                  <div className={styles.suspendTotal}>{formatCurrency(sale.total)}</div>
                  <Button variant="primary" className={styles.suspendResumeBtn} onClick={() => resumeSale(sale.id)}>
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
