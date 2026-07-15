import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import type { SaleOrder } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, isQuotationStatus } from '@/utils/formatId';
import { PAYMENT_METHOD_LABELS } from '../constants/posPaymentMethods';
import {
  DEFAULT_RECEIPT_STYLE,
  receiptDividerCss,
  receiptFontStack,
  receiptPrintPageSize,
  resolveReceiptStyle,
  type ReceiptStyleSettings,
} from '@/features/receipts/types/receiptStyle.types';
import styles from './ReceiptPrinter.module.css';

interface ReceiptPrinterProps {
  order: SaleOrder | null;
  branchSettings?: {
    posReceiptHeader?: string;
    posReceiptFooter?: string;
  };
  receiptStyle?: Partial<ReceiptStyleSettings> | null;
}

function lineProductName(line: any) {
  return line.productName || line.historicalName || line.variant?.product?.name || 'Producto';
}

function useReceiptVars(
  ref: React.RefObject<HTMLDivElement | null>,
  vars: Record<string, string | number | undefined>,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined) el.style.setProperty(key, String(value));
    });
  }, [ref, vars]);
}

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
  ({ order, branchSettings, receiptStyle }, ref) => {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
      if (typeof ref === 'function') {
        ref(rootRef.current);
      } else if (ref) {
        ref.current = rootRef.current;
      }
    }, [ref, order]);

    if (!order) return null;

    const style = resolveReceiptStyle(receiptStyle || DEFAULT_RECEIPT_STYLE);
    const divider = receiptDividerCss(style.dividerStyle, style.accentColor);
    const paperWidthPx = Math.round(style.paperWidthMm * 3.78);
    const subFontSize = `${Math.max(style.fontSizePx - 2, 9)}px`;
    const footerFontSize = `${Math.max(style.fontSizePx - 1, 10)}px`;
    const printPageSize = receiptPrintPageSize(style.paperWidthMm);
    const isDocumentSize = style.paperWidthMm >= 148;
    const printMargin = isDocumentSize ? '12mm' : '0';
    const printWidth = isDocumentSize
      ? `calc(${style.paperWidthMm}mm - 24mm)`
      : `${style.paperWidthMm}mm`;

    useReceiptVars(rootRef, {
      '--receipt-width': `${paperWidthPx}px`,
      '--receipt-bg': style.backgroundColor,
      '--receipt-color': style.textColor,
      '--receipt-font': receiptFontStack(style.fontFamily),
      '--receipt-font-size': `${style.fontSizePx}px`,
      '--receipt-header-size': `${style.headerFontSizePx}px`,
      '--receipt-accent': style.accentColor,
      '--receipt-divider': divider,
      '--receipt-sub-size': subFontSize,
      '--receipt-footer-size': footerFontSize,
      '--receipt-paper-mm': `${style.paperWidthMm}mm`,
      '--receipt-print-width': printWidth,
      '--receipt-print-margin': printMargin,
      '--receipt-print-page': printPageSize,
    });

    const fmtDate = (dateStr: string | Date) => {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div ref={rootRef} className={`ticket-print-area ${styles.root}`}>
        <div className={styles.header}>
          {style.logoUrl && (
            <img src={style.logoUrl} alt="Logo" className={styles.logo} />
          )}
          {branchSettings?.posReceiptHeader ? (
            <div className={`${styles.headerText} receipt-header-size`}>
              {branchSettings.posReceiptHeader}
            </div>
          ) : (
            <div className={`${styles.headerTitle} receipt-header-size`}>
              {style.titleFallback}
            </div>
          )}

          {style.dividerStyle !== 'none' && <div className={`${styles.divider} receipt-divider`} />}

          <div className={styles.meta}>
            {style.showDate && <>Fecha: {fmtDate(order.createdAt)}<br /></>}
            {style.showTicketNumber && <>Ticket #: {formatSaleId(order.id, order.status)}<br /></>}
            {isQuotationStatus(order.status) && <strong>PRESUPUESTO / COTIZACIÓN<br /></strong>}
            {style.showCustomer && (
              order.customerName || order.customer?.fullName
                ? <>Cliente: {order.customerName || order.customer?.fullName}<br /></>
                : <>Cliente: Consumidor Final<br /></>
            )}
          </div>

          {style.dividerStyle !== 'none' && <div className={`${styles.divider} receipt-divider`} />}
        </div>

        <div className={styles.linesSection}>
          <div className={styles.linesHeader}>
            <span className={styles.colDesc}>Cant x Desc</span>
            <span className={styles.colAmount}>Importe</span>
          </div>
          {order.lines.map((line: any) => {
            const productName = lineProductName(line);
            const variantSku = line.variantSku || line.historicalSku || line.variant?.sku;
            const size = line.variant?.size || line.size;

            return (
              <div key={line.id} className={styles.lineItem}>
                <div className={styles.lineRow}>
                  <span className={styles.lineName}>
                    {line.quantity}x {productName} {size ? `(${size})` : ''}
                  </span>
                  <span className={styles.colAmount}>
                    {formatCurrency(line.finalPrice)}
                  </span>
                </div>
                {style.showSku && variantSku && (
                  <div className={`${styles.lineSub} receipt-sub-size`}>
                    SKU: {variantSku}
                  </div>
                )}
                {style.showLineDiscounts && line.discountAmount > 0 && (
                  <div className={`${styles.lineSub} receipt-sub-size`}>
                    Bonif: -{formatCurrency(line.discountAmount)} (Orig: {formatCurrency(line.basePrice * line.quantity)})
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {style.dividerStyle !== 'none' && <div className={`${styles.divider} receipt-divider`} />}

        <div className={styles.totals}>
          {style.showSubtotal && (
            <div className={styles.totalRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
          )}
          {order.cartDiscountTotal > 0 && (
            <div className={styles.totalRow}>
              <span>Descuento Global:</span>
              <span>-{formatCurrency(order.cartDiscountTotal)}</span>
            </div>
          )}
          <div
            className={`${styles.totalFinal} ${style.dividerStyle !== 'none' ? styles.totalFinalBordered : ''} receipt-header-size receipt-accent`}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
          {style.showPaymentMethod && (
            <div className={`${styles.paymentRow} receipt-footer-size`}>
              <span>Medio de Pago:</span>
              <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {style.dividerStyle !== 'none' && <div className={`${styles.divider} receipt-divider`} />}
          {order.afipInvoiceId && (
            <div className={`${styles.caeBlock} receipt-footer-size`}>
              CAE: {(order as any).afipCae || 'Pendiente'}<br />
              Vto. CAE: {(order as any).afipCaeVto || '-'}
            </div>
          )}
          {branchSettings?.posReceiptFooter ? (
            <div className={`${styles.footerText} receipt-footer-size`}>
              {branchSettings.posReceiptFooter}
            </div>
          ) : (
            <div className="receipt-footer-size">
              ¡Gracias por su compra!
            </div>
          )}
        </div>

        <style>
          {`
            .ticket-print-area {
              width: var(--receipt-width);
              max-width: 100%;
              background: var(--receipt-bg);
              color: var(--receipt-color);
              font-family: var(--receipt-font);
              font-size: var(--receipt-font-size);
            }
            .receipt-header-size { font-size: var(--receipt-header-size); }
            .receipt-sub-size { font-size: var(--receipt-sub-size); }
            .receipt-footer-size { font-size: var(--receipt-footer-size); }
            .receipt-accent { color: var(--receipt-accent); }
            .receipt-divider { border-top: var(--receipt-divider); }
            @media print {
              body * { visibility: hidden; }
              .ticket-print-area, .ticket-print-area * { visibility: visible; }
              .ticket-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${printWidth} !important;
                max-width: 100% !important;
                background: var(--receipt-bg) !important;
              }
              @page {
                margin: ${printMargin};
                size: ${printPageSize};
              }
            }
          `}
        </style>
      </div>
    );
  },
);
