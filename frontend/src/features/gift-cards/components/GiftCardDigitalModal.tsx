import { QRCodeSVG } from 'qrcode.react';
import { Gift } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { buildGiftCardVerifyUrl, type GiftCard } from '@/api/gift-cards.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/config/app.config';
import styles from './GiftCardDigitalModal.module.css';

interface Props {
  open: boolean;
  card: GiftCard | null;
  onClose: () => void;
}

export function GiftCardDigitalModal({ open, card, onClose }: Props) {
  if (!card) return null;

  const verifyUrl = buildGiftCardVerifyUrl(card.verificationToken);
  const recipient = card.customer?.fullName || card.issuedTo || 'Sin destinatario';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Gift Card ${card.code}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 24px; }
            .code { font-family: monospace; font-size: 18px; margin: 12px 0; }
            .amount { font-size: 28px; font-weight: bold; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h2>Gift Card</h2>
          <div class="amount">${formatCurrency(card.initialBalance)}</div>
          <div class="code">${card.code}</div>
          <p>Para: ${recipient}</p>
          ${card.expiresAt ? `<p>Vence: ${formatDate(card.expiresAt)}</p>` : ''}
          <p style="font-size:12px;color:#666;">Escaneá el QR para validar legitimidad</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal open={open} title="Tarjeta digital" onClose={onClose} size="sm">
      <div className={styles.card}>
        <div className={styles.brand}>
          <Gift size={16} />
          Gift Card
        </div>
        <div className={styles.amount}>{formatCurrency(card.initialBalance)}</div>
        <div className={styles.code}>{card.code}</div>
        <div className={styles.recipient}>Para: {recipient}</div>
        {card.expiresAt && (
          <div className={styles.recipient}>Vence: {formatDate(card.expiresAt)}</div>
        )}
        <div className={styles.qrWrap}>
          <QRCodeSVG value={verifyUrl} size={180} level="H" includeMargin />
        </div>
        <p className={styles.hint}>
          El QR permite verificar que la tarjeta fue emitida por el sistema y consultar su estado.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
          <Button variant="primary" onClick={onClose}>Listo</Button>
        </div>
      </div>
    </Modal>
  );
}
