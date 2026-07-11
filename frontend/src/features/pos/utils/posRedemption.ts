export function computePosAmountDue(
  merchandiseTotal: number,
  giftCardAmount: number,
  loyaltyPoints: number,
  redeemValuePerPoint = 1,
): number {
  const loyaltyValue = loyaltyPoints * redeemValuePerPoint;
  return Math.max(0, Math.round((merchandiseTotal - giftCardAmount - loyaltyValue) * 100) / 100);
}
