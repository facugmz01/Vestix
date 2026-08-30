import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PauseCircle } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { useAuthStore } from '@/store/auth.store';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
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
  amountDue,
  paymentMethod,
  isGeneratingQr,
  onConfirmCheckout,
  isCheckoutLoading,
  activeShift,
  registersData,
  isShiftLoading,
  issueInvoice,
  setIssueInvoice,
  invoiceType,
  setInvoiceType,
}: {
  grandTotal: number;
  amountDue: number;
  paymentMethod: string;
  isGeneratingQr: boolean;
  onConfirmCheckout: (status: 'CONFIRMED' | 'QUOTATION') => void;
  isCheckoutLoading: boolean;
  activeShift: CashShift | null | undefined;
  registersData: CashRegister[] | undefined;
  isShiftLoading: boolean;
  issueInvoice: boolean;
  setIssueInvoice: (issue: boolean) => void;
  invoiceType?: string;
  setInvoiceType?: (type: string) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [amountTendered, setAmountTendered] = useState(grandTotal);

  const [localInvoiceType, setLocalInvoiceType] = useState('FACTURA_B');
  const [fiscalTaxId, setFiscalTaxId] = useState('');
  const [fiscalBusinessName, setFiscalBusinessName] = useState('');
  const [fiscalTaxCondition, setFiscalTaxCondition] = useState('Consumidor Final');

  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customersApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  useEffect(() => {
    if (selectedCustomer) {
      setFiscalTaxId(selectedCustomer.taxId || '');
      setFiscalBusinessName(selectedCustomer.fullName || '');
      const condition = selectedCustomer.taxCondition || 'Consumidor Final';
      setFiscalTaxCondition(condition);
      if (condition === 'RESPONSABLE_INSCRIPTO' || condition === 'Responsable Inscripto') {
        setLocalInvoiceType('FACTURA_A');
      } else {
        setLocalInvoiceType('FACTURA_B');
      }
    } else {
      setFiscalTaxId('');
      setFiscalBusinessName('');
      setFiscalTaxCondition('Consumidor Final');
      setLocalInvoiceType('FACTURA_B');
    }
  }, [selectedCustomer]);

  const activeInvoiceType = invoiceType || localInvoiceType;
  const handleSelectInvoiceType = (type: string) => {
    setLocalInvoiceType(type);
    if (setInvoiceType) setInvoiceType(type);
  };

  const { data: branch } = useQuery({
    queryKey: queryKeys.branches.detail(user?.branchId ?? ''),
    queryFn: () => branchesApi.getBranch(user!.branchId!),
    enabled: !!user?.branchId,
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
      setAmountTendered(amountDue);
    }
  }, [paymentModalOpen, amountDue]);

  const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;
  const isCashInsufficient = paymentMethod === 'CASH' && amountDue > 0.01 && amountTendered < amountDue;
  const canConfirmSale = (amountDue <= 0.01 || !isCashInsufficient) && !isCheckoutLoading;

  const handleConfirmSale = () => {
    if (paymentMethod === 'CASH' && amountDue > 0.01 && amountTendered < amountDue) return;
    const fiscalCustomerData = issueInvoice ? {
      taxId: fiscalTaxId.trim() || undefined,
      docType: (fiscalTaxId.trim().length === 11 ? 'CUIT' : 'DNI') as 'CUIT' | 'DNI',
      businessName: fiscalBusinessName.trim() || undefined,
      taxCondition: fiscalTaxCondition || undefined,
    } : undefined;

    (onConfirmCheckout as any)('CONFIRMED', {
      invoiceType: activeInvoiceType,
      fiscalCustomerData,
    });
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
        amount={amountDue}
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
        grandTotal={amountDue}
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
        branchSettings={branch?.settings}
      />

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={`Confirmar Pago — ${paymentLabel}`}>
        <div className={styles.modalStack}>
          <div className={styles.payHero}>
            <div className={styles.payHeroLabel}>Monto a Cobrar</div>
            <div className={styles.payHeroAmount}>{formatCurrency(amountDue)}</div>
            {amountDue < grandTotal && (
              <div className={styles.payHeroSub}>Total venta: {formatCurrency(grandTotal)}</div>
            )}
          </div>

          {paymentMethod === 'CASH' && amountDue > 0.01 && (
            <div className={styles.payFieldBox}>
              <label className={styles.payFieldLabel}>Monto Recibido</label>
              <Input
                type="number"
                min={amountDue}
                value={amountTendered}
                onChange={e => setAmountTendered(Number(e.target.value))}
                className={styles.payFieldInput}
              />
              {amountTendered > amountDue && (
                <div className={styles.payChange}>
                  Vuelto a entregar: {formatCurrency(amountTendered - amountDue)}
                </div>
              )}
              {amountTendered < amountDue && (
                <div className={styles.payInsufficient}>
                  El monto recibido debe ser al menos {formatCurrency(amountDue)}
                </div>
              )}
            </div>
          )}

          {amountDue <= 0.01 && (
            <div className={styles.alertQr}>
              La venta queda cubierta por gift card y/o puntos de fidelización.
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
              Emitir Factura Electrónica (AFIP / ARCA)
            </label>

            {issueInvoice && (
              <div className={styles.invoiceOptionsBox}>
                <div>
                  <label className={styles.payFieldLabel} style={{ marginBottom: 6, fontSize: 13 }}>
                    Tipo de Comprobante
                  </label>
                  <div className={styles.invoiceTypeGrid}>
                    <button
                      type="button"
                      className={`${styles.invoiceTypeBtn} ${activeInvoiceType === 'FACTURA_B' ? styles.invoiceTypeBtnActive : ''}`}
                      onClick={() => handleSelectInvoiceType('FACTURA_B')}
                    >
                      Factura B
                    </button>
                    <button
                      type="button"
                      className={`${styles.invoiceTypeBtn} ${activeInvoiceType === 'FACTURA_A' ? styles.invoiceTypeBtnActive : ''}`}
                      onClick={() => handleSelectInvoiceType('FACTURA_A')}
                    >
                      Factura A
                    </button>
                    <button
                      type="button"
                      className={`${styles.invoiceTypeBtn} ${activeInvoiceType === 'FACTURA_C' ? styles.invoiceTypeBtnActive : ''}`}
                      onClick={() => handleSelectInvoiceType('FACTURA_C')}
                    >
                      Factura C
                    </button>
                  </div>
                </div>

                <div className={styles.fiscalFieldsGrid}>
                  <div>
                    <label className={styles.payFieldLabel} style={{ marginBottom: 4, fontSize: 12 }}>
                      {activeInvoiceType === 'FACTURA_A' ? 'CUIT Receptor *' : 'DNI / CUIT (Opcional)'}
                    </label>
                    <Input
                      placeholder={activeInvoiceType === 'FACTURA_A' ? 'CUIT (11 dígitos)' : 'DNI o CUIT'}
                      value={fiscalTaxId}
                      onChange={e => setFiscalTaxId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.payFieldLabel} style={{ marginBottom: 4, fontSize: 12 }}>
                      {activeInvoiceType === 'FACTURA_A' ? 'Razón Social *' : 'Nombre / Razón Social'}
                    </label>
                    <Input
                      placeholder="Nombre o Razón Social"
                      value={fiscalBusinessName}
                      onChange={e => setFiscalBusinessName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            className={styles.confirmSaleBtn}
            onClick={handleConfirmSale}
            loading={isCheckoutLoading}
            disabled={!canConfirmSale}
          >
            {issueInvoice ? 'Completar Venta y Emitir Factura AFIP' : 'Cobrar e Imprimir Ticket (No Fiscal)'}
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
