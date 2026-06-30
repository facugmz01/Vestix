import React, { forwardRef } from 'react';
import type { SaleOrder } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';

interface ReceiptPrinterProps {
  order: SaleOrder | null;
  branchSettings?: any;
}

export const ReceiptPrinter = forwardRef<HTMLDivElement, ReceiptPrinterProps>(
  ({ order, branchSettings }, ref) => {
    if (!order) return null;



    const fmtDate = (dateStr: string | Date) => {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div 
        ref={ref}
        className="ticket-print-area"
        style={{
          width: '300px', // Standard 80mm thermal paper width
          padding: '10px',
          margin: '0 auto',
          background: '#fff',
          color: '#000',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.4',
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          {branchSettings?.posReceiptHeader && (
            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              {branchSettings.posReceiptHeader}
            </div>
          )}
          {!branchSettings?.posReceiptHeader && (
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>TICKET DE VENTA</div>
          )}
          
          <div style={{ margin: '5px 0' }}>
            --------------------------------
          </div>
          <div style={{ textAlign: 'left' }}>
            Fecha: {fmtDate(order.createdAt)}<br />
            Ticket #: {order.id.split('-')[0].toUpperCase()}<br />
            {order.status === 'QUOTATION' && <strong>PRESUPUESTO / COTIZACIÓN<br/></strong>}
            {order.customerId ? `Cliente ID: ${order.customerId}\n` : 'Cliente: Consumidor Final\n'}
          </div>
          <div style={{ margin: '5px 0' }}>
            --------------------------------
          </div>
        </div>

        {/* ITEMS */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '5px' }}>
            <span style={{ flex: 1 }}>Cant x Desc</span>
            <span style={{ width: '80px', textAlign: 'right' }}>Importe</span>
          </div>
          {order.lines.map((line: any) => (
            <div key={line.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {line.quantity}x {line.variant?.product?.name || 'Producto'} {line.variant?.size ? `(${line.variant?.size})` : ''}
                </span>
                <span style={{ width: '80px', textAlign: 'right' }}>
                  {formatCurrency(line.finalPrice)}
                </span>
              </div>
              {line.discountAmount > 0 && (
                <div style={{ fontSize: '10px', color: '#555' }}>
                  Bonif: -{formatCurrency(line.discountAmount)} (Orig: {formatCurrency(line.basePrice * line.quantity)})
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ margin: '5px 0', borderTop: '1px dashed #000' }}></div>

        {/* TOTALS */}
        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.cartDiscountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Descuento Global:</span>
              <span>-{formatCurrency(order.cartDiscountTotal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #000' }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px' }}>
            <span>Medio de Pago:</span>
            <span>{order.paymentMethod}</span>
          </div>
        </div>

        {/* AFIP / FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ margin: '5px 0' }}>
            --------------------------------
          </div>
          {order.afipInvoiceId && (
            <div style={{ fontSize: '11px', marginBottom: '10px' }}>
              CAE: {(order as any).afipCae || 'Pendiente'}<br />
              Vto. CAE: {(order as any).afipCaeVto || '-'}
            </div>
          )}
          {branchSettings?.posReceiptFooter && (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
              {branchSettings.posReceiptFooter}
            </div>
          )}
          {!branchSettings?.posReceiptFooter && (
            <div style={{ fontSize: '11px' }}>
              ¡Gracias por su compra!
            </div>
          )}
        </div>

        {/* INVISIBLE CSS FOR PRINTING ONLY */}
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
                width: 80mm !important;
                background: white !important;
              }
              /* Hide standard print headers/footers */
              @page { margin: 0; size: auto; }
            }
          `}
        </style>
      </div>
    );
  }
);
