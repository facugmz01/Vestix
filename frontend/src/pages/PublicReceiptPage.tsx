import { useRef, type CSSProperties } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, FileText } from 'lucide-react';
import { salesApi } from '@/api/sales.api';
import { ReceiptPrinter } from '@/features/pos/components/ReceiptPrinter';
import type { SaleOrder } from '@/types';

export default function PublicReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-receipt', orderId, token],
    queryFn: () => salesApi.getPublicReceipt(orderId!, token),
    enabled: !!orderId && !!token,
    retry: false,
  });

  const handlePrint = () => {
    window.print();
  };

  if (!orderId || !token) {
    return (
      <div style={styles.centered}>
        <FileText size={48} color="#94a3b8" />
        <p>Enlace de comprobante incompleto.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div style={styles.centered}>Cargando comprobante...</div>;
  }

  if (error || !data) {
    return (
      <div style={styles.centered}>
        <FileText size={48} color="#94a3b8" />
        <p>El comprobante no está disponible o el enlace expiró.</p>
      </div>
    );
  }

  const receiptOrder: SaleOrder = {
    id: data.id,
    branchId: '',
    source: data.source as SaleOrder['source'],
    status: data.status as SaleOrder['status'],
    customerName: data.customerName,
    subtotal: data.subtotal,
    cartDiscountTotal: data.cartDiscountTotal,
    grandTotal: data.grandTotal,
    paymentMethod: data.paymentMethod as SaleOrder['paymentMethod'],
    createdAt: data.createdAt,
    lines: data.lines.map((line) => ({
      id: line.id,
      variantId: line.id,
      productName: line.productName,
      variantSku: line.variantSku || undefined,
      quantity: line.quantity,
      basePrice: line.basePrice,
      discountAmount: line.discountAmount,
      finalPrice: line.finalPrice,
      variant: {
        sku: line.variantSku || undefined,
        size: line.size || undefined,
        product: { name: line.productName },
      },
    })),
  };

  return (
    <div style={styles.page}>
      <div className="no-print" style={styles.toolbar}>
        <div>
          <h1 style={styles.title}>Comprobante de venta</h1>
          <p style={styles.subtitle}>Podés imprimirlo o guardarlo como PDF desde el navegador.</p>
        </div>
        <button type="button" onClick={handlePrint} style={styles.printButton}>
          <Printer size={18} />
          Imprimir / Guardar PDF
        </button>
      </div>

      <div style={styles.receiptCard}>
        <ReceiptPrinter
          ref={printRef}
          order={receiptOrder}
          branchSettings={data.branchSettings}
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '24px 16px',
  },
  centered: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
    color: '#64748b',
  },
  toolbar: {
    maxWidth: '360px',
    margin: '0 auto 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    margin: '6px 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  printButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  receiptCard: {
    maxWidth: '360px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
};
