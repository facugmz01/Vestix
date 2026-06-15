import React, { useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { ReceiptPrinter } from './ReceiptPrinter';
import { Printer, X } from 'lucide-react';
import type { SaleOrder } from '@/types';

interface PrintReceiptModalProps {
  open: boolean;
  order: SaleOrder | null;
  branchSettings?: any;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ open, order, branchSettings, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Imprimir Ticket">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        
        {/* Scrollable preview area */}
        <div style={{ 
          maxHeight: '50vh', 
          overflowY: 'auto', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '8px',
          padding: '10px',
          background: 'rgba(255,255,255,0.05)'
        }}>
          <ReceiptPrinter ref={printRef} order={order} branchSettings={branchSettings} />
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            <X size={18} style={{ marginRight: '6px' }} /> Omitir
          </Button>
          <Button variant="primary" onClick={handlePrint} style={{ flex: 1, background: 'var(--accent)' }}>
            <Printer size={18} style={{ marginRight: '6px' }} /> Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
