import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { giftCardsApi } from '@/api/gift-cards.api';
import { loyaltyApi } from '@/api/loyalty.api';
import { queryKeys } from '@/api/queryKeys';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/pages/pos/POSPage.module.css';

interface Props {
  merchandiseTotal: number;
}

export function PosRedemptionPanel({ merchandiseTotal }: Props) {
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);
  const giftCardCode = usePosStore(s => s.giftCardCode);
  const giftCardAmount = usePosStore(s => s.giftCardAmount);
  const loyaltyPointsToRedeem = usePosStore(s => s.loyaltyPointsToRedeem);
  const setGiftCardCode = usePosStore(s => s.setGiftCardCode);
  const setGiftCardAmount = usePosStore(s => s.setGiftCardAmount);
  const setLoyaltyPointsToRedeem = usePosStore(s => s.setLoyaltyPointsToRedeem);
  const clearGiftCardRedemption = usePosStore(s => s.clearGiftCardRedemption);
  const clearLoyaltyRedemption = usePosStore(s => s.clearLoyaltyRedemption);

  const [codeInput, setCodeInput] = useState('');
  const [lookupCode, setLookupCode] = useState<string | null>(null);

  const { data: giftBalance, isFetching: giftLoading, error: giftError } = useQuery({
    queryKey: ['gift-cards', 'balance', lookupCode],
    queryFn: () => giftCardsApi.getBalance(lookupCode!),
    enabled: !!lookupCode,
    retry: false,
  });

  const { data: loyaltySettings } = useQuery({
    queryKey: queryKeys.loyalty.settings(),
    queryFn: () => loyaltyApi.getSettings(),
  });

  const { data: loyaltyAccount } = useQuery({
    queryKey: queryKeys.loyalty.account(selectedCustomerId ?? ''),
    queryFn: () => loyaltyApi.ensureAccount(selectedCustomerId!),
    enabled: !!selectedCustomerId && !!loyaltySettings?.enabled,
  });

  const loyaltyValue = loyaltySettings?.enabled
    ? loyaltyPointsToRedeem * (loyaltySettings.redeemValuePerPoint ?? 1)
    : 0;

  const remainingAfterGift = Math.max(0, merchandiseTotal - giftCardAmount);
  const redeemValuePerPoint = loyaltySettings?.redeemValuePerPoint ?? 1;
  const maxLoyaltyPoints = loyaltyAccount
    ? Math.min(
        loyaltyAccount.points,
        Math.floor(remainingAfterGift / redeemValuePerPoint),
      )
    : 0;

  const handleLookupGiftCard = () => {
    const code = codeInput.trim();
    if (!code) return;
    setLookupCode(code);
    setGiftCardCode(code);
  };

  const applyGiftBalance = () => {
    if (!giftBalance) return;
    const maxApply = Math.min(giftBalance.balance, merchandiseTotal - loyaltyValue);
    setGiftCardAmount(Math.round(maxApply * 100) / 100);
    toast.success(`Gift card aplicada: ${formatCurrency(maxApply)}`);
  };

  const handleLoyaltyChange = (points: number) => {
    const safe = Math.max(0, Math.min(maxLoyaltyPoints, Math.floor(points)));
    setLoyaltyPointsToRedeem(safe);
  };

  return (
    <div className={styles.redemptionPanel}>
      <div className={styles.redemptionBlock}>
        <div className={styles.redemptionTitle}>
          <Gift size={14} /> Gift Card
        </div>
        <div className={styles.redemptionRow}>
          <input
            type="text"
            className={styles.redemptionInput}
            placeholder="Código..."
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleLookupGiftCard()}
          />
          <button type="button" className={styles.redemptionBtn} onClick={handleLookupGiftCard} disabled={giftLoading}>
            Buscar
          </button>
        </div>
        {giftError && <div className={styles.redemptionHintError}>Gift card no válida</div>}
        {giftBalance && (
          <div className={styles.redemptionMeta}>
            <span>Saldo: {formatCurrency(giftBalance.balance)}</span>
            <button type="button" className={styles.redemptionLink} onClick={applyGiftBalance}>
              Aplicar máximo
            </button>
            {giftCardAmount > 0 && (
              <button type="button" className={styles.redemptionClear} onClick={clearGiftCardRedemption} aria-label="Quitar gift card">
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {giftCardAmount > 0 && (
          <div className={styles.redemptionApplied}>
            Aplicado: {formatCurrency(giftCardAmount)} ({giftCardCode})
          </div>
        )}
      </div>

      {selectedCustomerId && loyaltySettings?.enabled && (
        <div className={styles.redemptionBlock}>
          <div className={styles.redemptionTitle}>
            <Star size={14} /> Puntos
            {loyaltyAccount ? (
              <span className={styles.redemptionBadge}>{loyaltyAccount.points} pts</span>
            ) : (
              <span className={styles.redemptionBadgeMuted}>Cargando...</span>
            )}
          </div>
          {loyaltyAccount && maxLoyaltyPoints > 0 ? (
            <>
              <input
                type="number"
                min={0}
                max={maxLoyaltyPoints}
                className={styles.redemptionInput}
                value={loyaltyPointsToRedeem || ''}
                placeholder="Puntos a canjear"
                onChange={e => handleLoyaltyChange(Number(e.target.value))}
              />
              {loyaltyPointsToRedeem > 0 && (
                <div className={styles.redemptionApplied}>
                  Canje: {loyaltyPointsToRedeem} pts ({formatCurrency(loyaltyValue)})
                  <button type="button" className={styles.redemptionClear} onClick={clearLoyaltyRedemption} aria-label="Quitar puntos">
                    <X size={14} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.redemptionHint}>Sin puntos disponibles para esta venta</div>
          )}
        </div>
      )}
    </div>
  );
}
