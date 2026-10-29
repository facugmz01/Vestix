export type MercadoPagoModality =
  | 'POINT_DEBIT'
  | 'POINT_CREDIT_INSTANT'
  | 'POINT_CREDIT_10D'
  | 'POINT_CREDIT_18D'
  | 'QR_ACCOUNT_MONEY'
  | 'QR_CREDIT_INSTANT'
  | 'CUSTOM';

export type MercadoPagoInstallmentPlan =
  | 'NONE'
  | 'INSTALLMENTS_2'
  | 'INSTALLMENTS_3'
  | 'INSTALLMENTS_6'
  | 'INSTALLMENTS_9'
  | 'INSTALLMENTS_12'
  | 'CUOTA_SIMPLE_3'
  | 'CUOTA_SIMPLE_6'
  | 'CUSTOM_INSTALLMENTS';

export interface InstallmentPlanDetail {
  installments: number;
  financingFee: number;
  label: string;
  description: string;
}

export const MP_INSTALLMENT_PLANS: Record<
  Exclude<MercadoPagoInstallmentPlan, 'CUSTOM_INSTALLMENTS'>,
  InstallmentPlanDetail
> = {
  NONE: {
    installments: 1,
    financingFee: 0,
    label: '1 pago (Sin cuotas)',
    description: 'Solo arancel base de tarjeta',
  },
  INSTALLMENTS_2: {
    installments: 2,
    financingFee: 5.99,
    label: '2 cuotas sin interés (+5.99%)',
    description: 'Tasa estándar Mercado Pago',
  },
  INSTALLMENTS_3: {
    installments: 3,
    financingFee: 8.99,
    label: '3 cuotas sin interés (+8.99%)',
    description: 'Tasa estándar Mercado Pago',
  },
  INSTALLMENTS_6: {
    installments: 6,
    financingFee: 16.49,
    label: '6 cuotas sin interés (+16.49%)',
    description: 'Tasa estándar Mercado Pago',
  },
  INSTALLMENTS_9: {
    installments: 9,
    financingFee: 24.99,
    label: '9 cuotas sin interés (+24.99%)',
    description: 'Tasa estándar Mercado Pago',
  },
  INSTALLMENTS_12: {
    installments: 12,
    financingFee: 32.99,
    label: '12 cuotas sin interés (+32.99%)',
    description: 'Tasa estándar Mercado Pago',
  },
  CUOTA_SIMPLE_3: {
    installments: 3,
    financingFee: 6.03,
    label: 'Cuota Simple 3 (+6.03%)',
    description: 'Programa oficial indumentaria nacional',
  },
  CUOTA_SIMPLE_6: {
    installments: 6,
    financingFee: 11.54,
    label: 'Cuota Simple 6 (+11.54%)',
    description: 'Programa oficial indumentaria nacional',
  },
};

export interface MercadoPagoPricingInput {
  /** Costo base de compra del producto según proveedor */
  costPrice: number;
  /** Gastos de envío / flete prorrateados por unidad (opcional) */
  shippingAllocated?: number;
  /** Otros gastos directos de la compra (etiquetado, packaging, aduana) */
  otherExpenses?: number;
  /** Margen de ganancia deseado sobre el costo puesto (%) */
  profitMarginPercent: number;
  /** Modalidad de cobro de Mercado Pago seleccionada */
  mpModality?: MercadoPagoModality;
  /** Comisión personalizada si mpModality === 'CUSTOM' (% arancel sin IVA) */
  customMpFeePercent?: number;
  /** Plan de cuotas sin interés para el cliente */
  installmentPlan?: MercadoPagoInstallmentPlan;
  /** Cantidad de cuotas personalizadas */
  customInstallmentsCount?: number;
  /** Costo de financiación personalizado si installmentPlan === 'CUSTOM_INSTALLMENTS' */
  customInstallmentFeePercent?: number;
  /** Alícuota de Ingresos Brutos / retenciones de plataforma digitales (ej. 3.5%) */
  iibbPercent?: number;
  /** Alícuota de IVA del producto (ej. 21% o 10.5%) */
  productIvaPercent?: number;
}

export interface MercadoPagoPricingSuggestion {
  suggestedPrice: number;
  cashPrice: number;
  modifierPercentage: number;
  landedCost: number;
  expectedNetProfit: number;
  mpDeductionTotal: number;
  mpBaseFeeAmount: number;
  mpFinancingFeeAmount: number;
  iibbDeduction: number;
  productIvaAmount: number;
  netPrice: number;
  installmentsCount: number;
  installmentAmount: number;
  installmentPlanLabel: string;
  fundamentationText: string;
  breakdown: Array<{ concept: string; amount: number; percentageOfPrice: number }>;
}

export const MP_FEE_RATES: Record<Exclude<MercadoPagoModality, 'CUSTOM'>, { fee: number; label: string; days: string }> = {
  POINT_CREDIT_INSTANT: { fee: 6.39, label: 'Point Crédito (En el momento)', days: 'Inmediata' },
  POINT_CREDIT_10D: { fee: 4.29, label: 'Point Crédito (A los 10 días)', days: '10 días' },
  POINT_CREDIT_18D: { fee: 3.39, label: 'Point Crédito (A los 18 días)', days: '18 días' },
  POINT_DEBIT: { fee: 1.49, label: 'Point Débito (En el momento)', days: 'Inmediata' },
  QR_ACCOUNT_MONEY: { fee: 0.80, label: 'QR Dinero en cuenta MP', days: 'Inmediata' },
  QR_CREDIT_INSTANT: { fee: 4.99, label: 'QR Tarjeta de Crédito (En el momento)', days: 'Inmediata' },
};

/**
 * Calcula el precio de venta sugerido absorbiendo comisiones de Mercado Pago,
 * costos financieros por ofrecer cuotas sin interés (T&C oficiales),
 * IVA sobre cargos de MP (21%), IIBB y el IVA del producto, garantizando
 * que la ganancia neta en pesos sea exactamente la esperada.
 */
export function suggestMercadoPagoPrice(input: MercadoPagoPricingInput): MercadoPagoPricingSuggestion {
  const {
    costPrice,
    shippingAllocated = 0,
    otherExpenses = 0,
    profitMarginPercent,
    mpModality = 'POINT_CREDIT_INSTANT',
    customMpFeePercent,
    installmentPlan = 'NONE',
    customInstallmentsCount = 1,
    customInstallmentFeePercent = 0,
    iibbPercent = 3.5,
    productIvaPercent = 21,
  } = input;

  if (costPrice <= 0) {
    throw new Error('El costo del producto debe ser mayor a 0');
  }

  // 1. Costo real unitario puesto (Landed Cost)
  const landedCost = costPrice + Math.max(0, shippingAllocated) + Math.max(0, otherExpenses);
  const targetProfit = landedCost * (profitMarginPercent / 100);
  const netRequired = landedCost + targetProfit;

  // 2. Determinar arancel base y costo de cuotas sin interés
  const rawMpBaseFee = mpModality === 'CUSTOM'
    ? (customMpFeePercent ?? 6.39)
    : MP_FEE_RATES[mpModality].fee;

  let installmentsCount = 1;
  let rawFinancingFee = 0;
  let installmentPlanLabel = '1 pago (Sin cuotas)';

  if (installmentPlan === 'CUSTOM_INSTALLMENTS') {
    installmentsCount = Math.max(1, customInstallmentsCount);
    rawFinancingFee = Math.max(0, customInstallmentFeePercent);
    installmentPlanLabel = `${installmentsCount} cuotas sin interés (+${rawFinancingFee}%)`;
  } else {
    const planDetail = MP_INSTALLMENT_PLANS[installmentPlan];
    installmentsCount = planDetail.installments;
    rawFinancingFee = planDetail.financingFee;
    installmentPlanLabel = planDetail.label;
  }

  // Costo total de Mercado Pago antes de IVA
  const totalRawMpFee = rawMpBaseFee + rawFinancingFee;

  // Mercado Pago retiene IVA (21%) sobre todos sus cargos (arancel de procesamiento + costo de cuotas)
  const effectiveMpRate = (totalRawMpFee * 1.21) / 100;
  const iibbRate = iibbPercent / 100;
  const ivaRate = productIvaPercent / 100;

  // 3. Fórmula de absorción matemática exacta
  const divisorNeto = 1 - iibbRate - ((1 + ivaRate) * effectiveMpRate);

  if (divisorNeto <= 0) {
    throw new Error('Las deducciones de comisiones, cuotas e impuestos superan el 100% del valor de venta.');
  }

  const netPrice = netRequired / divisorNeto;
  const finalPrice = Math.round(netPrice * (1 + ivaRate));
  const exactNetPrice = finalPrice / (1 + ivaRate);
  const ivaAmount = finalPrice - exactNetPrice;

  // Desglose de Mercado Pago (Base vs Cuotas)
  const effectiveBaseRate = (rawMpBaseFee * 1.21) / 100;
  const effectiveFinancingRate = (rawFinancingFee * 1.21) / 100;
  const mpBaseFeeAmount = finalPrice * effectiveBaseRate;
  const mpFinancingFeeAmount = finalPrice * effectiveFinancingRate;
  const mpDeductionTotal = finalPrice * effectiveMpRate;

  const iibbDeduction = exactNetPrice * iibbRate;

  // Precio de contado / efectivo (sin comisión de MP ni costo de cuotas)
  const cashDivisor = 1 - iibbRate;
  const cashNet = netRequired / cashDivisor;
  const cashPrice = Math.round(cashNet * (1 + ivaRate));

  // Valor de cada cuota fija
  const installmentAmount = Math.round((finalPrice / installmentsCount) * 100) / 100;

  // Modificador sobre el costo base para la lista de precios de Vestix
  const modifierPercentage = Number((((finalPrice / costPrice) - 1) * 100).toFixed(2));

  const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const modalityLabel = mpModality === 'CUSTOM'
    ? `Personalizado (${rawMpBaseFee}%)`
    : MP_FEE_RATES[mpModality].label;

  const fundamentationText =
`FUNDAMENTACIÓN DEL PRECIO SUGERIDO: $${finalPrice.toLocaleString('es-AR')}
${installmentsCount > 1 ? `(${installmentsCount} cuotas fijas de $${installmentAmount.toLocaleString('es-AR')} sin interés)` : '(1 pago)'}
================================================================================
1. COSTO PUESTO EN LOCAL (Landed Cost): $${round(landedCost).toLocaleString('es-AR')}
   - Costo de compra según proveedor: $${round(costPrice).toLocaleString('es-AR')}
   ${shippingAllocated > 0 ? `- Flete / gastos de envío compra: $${round(shippingAllocated).toLocaleString('es-AR')}\n   ` : ''}${otherExpenses > 0 ? `- Gastos asociados / packaging: $${round(otherExpenses).toLocaleString('es-AR')}\n   ` : ''}
2. GANANCIA NETA OBJETIVO (${profitMarginPercent}%): $${round(targetProfit).toLocaleString('es-AR')}
   - Monto líquido que te queda en mano una vez pagados todos los costos e impuestos.

3. COSTOS DE MERCADO PAGO:
   - Arancel base (${modalityLabel}): ${rawMpBaseFee}% (+ 21% IVA = ${(rawMpBaseFee * 1.21).toFixed(2)}% real) -> -$${round(mpBaseFeeAmount).toLocaleString('es-AR')}
   ${installmentsCount > 1 ? `- Costo financiero ${installmentPlanLabel}: ${rawFinancingFee}% (+ 21% IVA = ${(rawFinancingFee * 1.21).toFixed(2)}% real) -> -$${round(mpFinancingFeeAmount).toLocaleString('es-AR')}\n   - Total retenido por MP: -${(totalRawMpFee * 1.21).toFixed(2)}% real (-$${round(mpDeductionTotal).toLocaleString('es-AR')})` : `- Total retenido por MP: -${(totalRawMpFee * 1.21).toFixed(2)}% real (-$${round(mpDeductionTotal).toLocaleString('es-AR')})`}

4. OBLIGACIONES FISCALES:
   - IVA Débito Fiscal (${productIvaPercent}%): -$${round(ivaAmount).toLocaleString('es-AR')}
   - Ingresos Brutos / Percepciones (${iibbPercent}%): -$${round(iibbDeduction).toLocaleString('es-AR')}

DEMOSTRACIÓN DE LA LIQUIDACIÓN REAL:
   $${finalPrice.toLocaleString('es-AR')} (Total cobrado al cliente en ${installmentsCount} cuota${installmentsCount > 1 ? 's' : ''})
 - $${round(mpBaseFeeAmount).toLocaleString('es-AR')} (Arancel procesamiento MP + IVA)
 ${installmentsCount > 1 ? `- $${round(mpFinancingFeeAmount).toLocaleString('es-AR')} (Costo financiero cuotas sin interés + IVA)\n ` : ''}- $${round(iibbDeduction).toLocaleString('es-AR')} (Ingresos Brutos)
 - $${round(ivaAmount).toLocaleString('es-AR')} (IVA de la venta)
 -------------------------------------------------------------
 = $${round(finalPrice - mpDeductionTotal - iibbDeduction - ivaAmount).toLocaleString('es-AR')} Remanente neto en tu cuenta
 - $${round(landedCost).toLocaleString('es-AR')} (Recuperación de costo de compra y flete)
 = $${round(finalPrice - mpDeductionTotal - iibbDeduction - ivaAmount - landedCost).toLocaleString('es-AR')} (Ganancia Neta exacta del ${profitMarginPercent}%)

* PRECIO SUGERIDO EN EFECTIVO / CONTADO: $${cashPrice.toLocaleString('es-AR')}
  (Permite ofrecer un descuento por pago en efectivo sin resignar ganancia).`;

  const breakdown = [
    { concept: 'Costo de compra + flete', amount: round(landedCost), percentageOfPrice: round((landedCost / finalPrice) * 100) },
    { concept: 'Ganancia neta negocio', amount: round(targetProfit), percentageOfPrice: round((targetProfit / finalPrice) * 100) },
    { concept: 'Arancel base MP (con IVA)', amount: round(mpBaseFeeAmount), percentageOfPrice: round((mpBaseFeeAmount / finalPrice) * 100) },
  ];

  if (installmentsCount > 1) {
    breakdown.push({
      concept: `Financiación ${installmentsCount} cuotas (con IVA)`,
      amount: round(mpFinancingFeeAmount),
      percentageOfPrice: round((mpFinancingFeeAmount / finalPrice) * 100),
    });
  }

  breakdown.push(
    { concept: 'Ingresos Brutos (IIBB)', amount: round(iibbDeduction), percentageOfPrice: round((iibbDeduction / finalPrice) * 100) },
    { concept: 'IVA Débito Fiscal', amount: round(ivaAmount), percentageOfPrice: round((ivaAmount / finalPrice) * 100) },
  );

  return {
    suggestedPrice: finalPrice,
    cashPrice,
    modifierPercentage,
    landedCost: round(landedCost),
    expectedNetProfit: round(targetProfit),
    mpDeductionTotal: round(mpDeductionTotal),
    mpBaseFeeAmount: round(mpBaseFeeAmount),
    mpFinancingFeeAmount: round(mpFinancingFeeAmount),
    iibbDeduction: round(iibbDeduction),
    productIvaAmount: round(ivaAmount),
    netPrice: round(exactNetPrice),
    installmentsCount,
    installmentAmount,
    installmentPlanLabel,
    fundamentationText,
    breakdown,
  };
}
