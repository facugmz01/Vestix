import { useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, FileText } from 'lucide-react';
import { salesApi } from '@/api/sales.api';
import { ReceiptPrinter } from '@/features/pos/components/ReceiptPrinter';
import type { SaleOrder } from '@/types';
import styles from './PublicReceiptPage.module.css';

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
      <div className={styles.centered}>
        <FileText size={48} color="var(--text-muted)" />
        <p>Enlace de comprobante incompleto.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className={styles.centered}>Cargando comprobante...</div>;
  }

  if (error || !data) {
    return (
      <div className={styles.centered}>
        <FileText size={48} color="var(--text-muted)" />
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
    <div className={styles.page}>
      <div className={`no-print ${styles.toolbar}`}>
        <div>
          <h1 className={styles.title}>Comprobante de venta</h1>
          <p className={styles.subtitle}>Podés imprimirlo o guardarlo como PDF desde el navegador.</p>
        </div>
        <button type="button" onClick={handlePrint} className={styles.printButton}>
          <Printer size={18} />
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className={styles.receiptCard}>
        <ReceiptPrinter
          ref={printRef}
          order={receiptOrder}
          branchSettings={data.branchSettings}
          receiptStyle={data.receiptStyle}
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
