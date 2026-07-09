import React, { forwardRef } from 'react';
import type { SaleOrder } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, isQuotationStatus } from '@/utils/formatId';
import { PAYMENT_METHOD_LABELS } from '../constants/posPaymentMethods';
import {
  DEFAULT_RECEIPT_STYLE,
  receiptDividerCss,
  receiptFontStack,
  resolveReceiptStyle,
  type ReceiptStyleSettings,
} from '@/features/receipts/types/receiptStyle.types';

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

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
  ({ order, branchSettings, receiptStyle }, ref) => {
    if (!order) return null;

    const style = resolveReceiptStyle(receiptStyle || DEFAULT_RECEIPT_STYLE);
    const divider = receiptDividerCss(style.dividerStyle, style.accentColor);
    const paperWidthPx = Math.round(style.paperWidthMm * 3.78);

    const fmtDate = (dateStr: string | Date) => {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div
        ref={ref}
        className="ticket-print-area"
        style={{
          width: `${paperWidthPx}px`,
          maxWidth: '100%',
          padding: '10px',
          margin: '0 auto',
          background: style.backgroundColor,
          color: style.textColor,
          fontFamily: receiptFontStack(style.fontFamily),
          fontSize: `${style.fontSizePx}px`,
          lineHeight: 1.4,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          {style.logoUrl && (
            <img
              src={style.logoUrl}
              alt="Logo"
              style={{ maxWidth: '70%', maxHeight: '64px', objectFit: 'contain', marginBottom: '8px' }}
            />
          )}
          {branchSettings?.posReceiptHeader ? (
            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold', fontSize: `${style.headerFontSizePx}px`, marginBottom: '8px' }}>
              {branchSettings.posReceiptHeader}
            </div>
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: `${style.headerFontSizePx}px` }}>
              {style.titleFallback}
            </div>
          )}

          {style.dividerStyle !== 'none' && <div style={{ margin: '5px 0', borderTop: divider }} />}

          <div style={{ textAlign: 'left' }}>
            {style.showDate && <>Fecha: {fmtDate(order.createdAt)}<br /></>}
            {style.showTicketNumber && <>Ticket #: {formatSaleId(order.id, order.status)}<br /></>}
            {isQuotationStatus(order.status) && <strong>PRESUPUESTO / COTIZACIÓN<br /></strong>}
            {style.showCustomer && (
              order.customerName || order.customer?.fullName
                ? <>Cliente: {order.customerName || order.customer?.fullName}<br /></>
                : <>Cliente: Consumidor Final<br /></>
            )}
          </div>

          {style.dividerStyle !== 'none' && <div style={{ margin: '5px 0', borderTop: divider }} />}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '5px' }}>
            <span style={{ flex: 1 }}>Cant x Desc</span>
            <span style={{ width: '80px', textAlign: 'right' }}>Importe</span>
          </div>
          {order.lines.map((line: any) => {
            const productName = lineProductName(line);
            const variantSku = line.variantSku || line.historicalSku || line.variant?.sku;
            const size = line.variant?.size || line.size;

            return (
              <div key={line.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line.quantity}x {productName} {size ? `(${size})` : ''}
                  </span>
                  <span style={{ width: '80px', textAlign: 'right' }}>
                    {formatCurrency(line.finalPrice)}
                  </span>
                </div>
                {style.showSku && variantSku && (
                  <div style={{ fontSize: `${Math.max(style.fontSizePx - 2, 9)}px`, opacity: 0.75 }}>
                    SKU: {variantSku}
                  </div>
                )}
                {style.showLineDiscounts && line.discountAmount > 0 && (
                  <div style={{ fontSize: `${Math.max(style.fontSizePx - 2, 9)}px`, opacity: 0.75 }}>
                    Bonif: -{formatCurrency(line.discountAmount)} (Orig: {formatCurrency(line.basePrice * line.quantity)})
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {style.dividerStyle !== 'none' && <div style={{ margin: '5px 0', borderTop: divider }} />}

        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
          {style.showSubtotal && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
          )}
          {order.cartDiscountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Descuento Global:</span>
              <span>-{formatCurrency(order.cartDiscountTotal)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: `${style.headerFontSizePx}px`,
              marginTop: '5px',
              paddingTop: '5px',
              borderTop: style.dividerStyle === 'none' ? 'none' : `1px solid ${style.accentColor}`,
              color: style.accentColor,
            }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
          {style.showPaymentMethod && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: `${Math.max(style.fontSizePx - 1, 10)}px` }}>
              <span>Medio de Pago:</span>
              <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {style.dividerStyle !== 'none' && <div style={{ margin: '5px 0', borderTop: divider }} />}
          {order.afipInvoiceId && (
            <div style={{ fontSize: `${Math.max(style.fontSizePx - 1, 10)}px`, marginBottom: '10px' }}>
              CAE: {(order as any).afipCae || 'Pendiente'}<br />
              Vto. CAE: {(order as any).afipCaeVto || '-'}
            </div>
          )}
          {branchSettings?.posReceiptFooter ? (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: `${Math.max(style.fontSizePx - 1, 10)}px` }}>
              {branchSettings.posReceiptFooter}
            </div>
          ) : (
            <div style={{ fontSize: `${Math.max(style.fontSizePx - 1, 10)}px` }}>
              ¡Gracias por su compra!
            </div>
          )}
        </div>

        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .ticket-print-area, .ticket-print-area * {
                visibility: visible;
              }
              .ticket-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: ${style.paperWidthMm}mm !important;
                background: ${style.backgroundColor} !important;
              }
              @page { margin: 0; size: auto; }
            }
          `}
        </style>
      </div>
    );
  },
);
