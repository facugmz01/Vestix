import React, { useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { ReceiptPrinter } from './ReceiptPrinter';
import { Printer, X } from 'lucide-react';
import type { SaleOrder } from '@/types';
import type { ReceiptStyleSettings } from '@/features/receipts/types/receiptStyle.types';
import { useGetSettings } from '@/features/settings/hooks/useSettings';
import { resolveReceiptStyle } from '@/features/receipts/types/receiptStyle.types';
import styles from '@/pages/pos/POSPage.module.css';

interface PrintReceiptModalProps {
  open: boolean;
  order: SaleOrder | null;
  branchSettings?: any;
  receiptStyle?: Partial<ReceiptStyleSettings> | null;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  open,
  order,
  branchSettings,
  receiptStyle,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useGetSettings();
  const resolvedStyle = resolveReceiptStyle(receiptStyle || settings?.pos?.receiptStyle);

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Imprimir Ticket">
      <div className={styles.printStack}>
        <div className={styles.printPreview}>
          <ReceiptPrinter ref={printRef} order={order} branchSettings={branchSettings} receiptStyle={resolvedStyle} />
        </div>

        <div className={styles.printActions}>
          <Button variant="secondary" onClick={onClose} className={styles.printBtn}>
            <X size={18} /> Omitir
          </Button>
          <Button variant="primary" onClick={handlePrint} className={styles.printBtn}>
            <Printer size={18} /> Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
