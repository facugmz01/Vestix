import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, Button } from '@/components/ui';
import { buildGiftCardVerifyUrl, type GiftCard } from '@/api/gift-cards.api';
import { settingsApi } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/config/app.config';
import { resolveGiftCardTemplate } from '@/features/gift-cards/types/giftCardTemplate.types';
import { GiftCardRenderer } from './GiftCardRenderer';
import {
  buildGiftCardPrintDocument,
  printGiftCardHtml,
  svgElementToDataUrl,
} from '../utils/giftCardPrint';
import styles from './GiftCardDigitalModal.module.css';

interface Props {
  open: boolean;
  card: GiftCard | null;
  onClose: () => void;
}

export function GiftCardDigitalModal({ open, card, onClose }: Props) {
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: settingsApi.getSettings,
    enabled: open,
  });

  if (!card) return null;

  const template = resolveGiftCardTemplate(settings?.giftCards?.template);
  const verifyUrl = buildGiftCardVerifyUrl(card.verificationToken);
  const recipient = card.customer?.fullName || card.issuedTo || 'Sin destinatario';

  const renderData = {
    amount: formatCurrency(card.initialBalance),
    code: card.code,
    recipient,
    expiresAt: card.expiresAt ? formatDate(card.expiresAt) : null,
    verifyUrl,
  };

  const handlePrint = () => {
    const svg = qrContainerRef.current?.querySelector('svg');
    const qrDataUrl = svg ? svgElementToDataUrl(svg) : undefined;

    const html = buildGiftCardPrintDocument(
      template,
      { ...renderData, qrDataUrl },
      `Gift Card ${card.code}`,
    );
    printGiftCardHtml(html);
  };

  return (
    <Modal open={open} title="Tarjeta digital" onClose={onClose} size="sm">
      <div className={styles.previewWrap}>
        <div ref={qrContainerRef}>
          <GiftCardRenderer template={template} data={renderData} />
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={handlePrint}>Imprimir</Button>
        <Button variant="primary" onClick={onClose}>Listo</Button>
      </div>
    </Modal>
  );
}
