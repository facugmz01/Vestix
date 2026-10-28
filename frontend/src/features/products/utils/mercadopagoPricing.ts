export type MercadoPagoModality =
  | 'POINT_DEBIT'
  | 'POINT_CREDIT_INSTANT'
  | 'POINT_CREDIT_10D'
  | 'POINT_CREDIT_18D'
  | 'QR_ACCOUNT_MONEY'
  | 'QR_CREDIT_INSTANT'
  | 'CUSTOM';

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
  iibbDeduction: number;
  productIvaAmount: number;
  netPrice: number;
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
 * IVA sobre arancel de MP (21%), IIBB y el IVA del producto, garantizando
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

  // 2. Determinar comisiones e impuestos
  const rawMpFee = mpModality === 'CUSTOM'
    ? (customMpFeePercent ?? 6.39)
    : MP_FEE_RATES[mpModality].fee;

  // Mercado Pago retiene su comisión + 21% de IVA sobre su propia comisión (Factura A de MP)
  const effectiveMpRate = (rawMpFee * 1.21) / 100;
  const iibbRate = iibbPercent / 100;
  const ivaRate = productIvaPercent / 100;

  // 3. Fórmula de absorción matemática exacta
  const divisorNeto = 1 - iibbRate - ((1 + ivaRate) * effectiveMpRate);

  if (divisorNeto <= 0) {
    throw new Error('Las deducciones de comisiones e impuestos superan el 100% del valor de venta.');
  }

  const netPrice = netRequired / divisorNeto;
  const finalPrice = Math.round(netPrice * (1 + ivaRate));
  const exactNetPrice = finalPrice / (1 + ivaRate);
  const ivaAmount = finalPrice - exactNetPrice;
  const mpDeduction = finalPrice * effectiveMpRate;
  const iibbDeduction = exactNetPrice * iibbRate;

  // Precio de contado / efectivo (sin la deducción del arancel de Mercado Pago)
  const cashDivisor = 1 - iibbRate;
  const cashNet = netRequired / cashDivisor;
  const cashPrice = Math.round(cashNet * (1 + ivaRate));

  // Multiplicador / modificador sobre el costo base para la lista de precios de Vestix
  const modifierPercentage = Number((((finalPrice / costPrice) - 1) * 100).toFixed(2));

  const round = (val: number) => Math.round((val + Number.EPSILON) * 100) / 100;

  const modalityLabel = mpModality === 'CUSTOM'
    ? `Personalizado (${rawMpFee}%)`
    : MP_FEE_RATES[mpModality].label;

  const fundamentationText =
`FUNDAMENTACIÓN DEL PRECIO SUGERIDO: $${finalPrice.toLocaleString('es-AR')}
================================================================================
1. COSTO PUESTO EN LOCAL (Landed Cost): $${round(landedCost).toLocaleString('es-AR')}
   - Costo de compra según proveedor: $${round(costPrice).toLocaleString('es-AR')}
   ${shippingAllocated > 0 ? `- Flete / gastos de envío compra: $${round(shippingAllocated).toLocaleString('es-AR')}\n   ` : ''}${otherExpenses > 0 ? `- Gastos asociados / packaging: $${round(otherExpenses).toLocaleString('es-AR')}\n   ` : ''}
2. GANANCIA NETA OBJETIVO (${profitMarginPercent}%): $${round(targetProfit).toLocaleString('es-AR')}
   - Monto líquido que te queda en mano una vez pagados todos los costos e impuestos.

3. COBRO CON MERCADO PAGO: ${modalityLabel}
   - Arancel base de MP: ${rawMpFee}% + IVA de comisión (21%) = ${(rawMpFee * 1.21).toFixed(2)}% real retenido.
   - Retención estimada de Mercado Pago: -$${round(mpDeduction).toLocaleString('es-AR')} sobre el total cobrado.

4. OBLIGACIONES FISCALES:
   - IVA Débito Fiscal (${productIvaPercent}%): -$${round(ivaAmount).toLocaleString('es-AR')}
   - Ingresos Brutos / Percepciones (${iibbPercent}%): -$${round(iibbDeduction).toLocaleString('es-AR')}

DEMOSTRACIÓN DE LA LIQUIDACIÓN REAL:
   $${finalPrice.toLocaleString('es-AR')} (Total cobrado al cliente con Mercado Pago)
 - $${round(mpDeduction).toLocaleString('es-AR')} (Comisión e IVA de Mercado Pago)
 - $${round(iibbDeduction).toLocaleString('es-AR')} (Ingresos Brutos)
 - $${round(ivaAmount).toLocaleString('es-AR')} (IVA de la venta)
 -------------------------------------------------------------
 = $${round(finalPrice - mpDeduction - iibbDeduction - ivaAmount).toLocaleString('es-AR')} Remanente neto en tu cuenta
 - $${round(landedCost).toLocaleString('es-AR')} (Recuperación de costo de compra y flete)
 = $${round(finalPrice - mpDeduction - iibbDeduction - ivaAmount - landedCost).toLocaleString('es-AR')} (Ganancia Neta exacta del ${profitMarginPercent}%)

* PRECIO SUGERIDO EN EFECTIVO / CONTADO: $${cashPrice.toLocaleString('es-AR')}
  (Permite ofrecer un descuento por pago en efectivo sin resignar ganancia).`;

  return {
    suggestedPrice: finalPrice,
    cashPrice,
    modifierPercentage,
    landedCost: round(landedCost),
    expectedNetProfit: round(targetProfit),
    mpDeductionTotal: round(mpDeduction),
    iibbDeduction: round(iibbDeduction),
    productIvaAmount: round(ivaAmount),
    netPrice: round(exactNetPrice),
    fundamentationText,
    breakdown: [
      { concept: 'Costo de compra + flete', amount: round(landedCost), percentageOfPrice: round((landedCost / finalPrice) * 100) },
      { concept: 'Ganancia neta negocio', amount: round(targetProfit), percentageOfPrice: round((targetProfit / finalPrice) * 100) },
      { concept: 'Comisión Mercado Pago (con IVA)', amount: round(mpDeduction), percentageOfPrice: round((mpDeduction / finalPrice) * 100) },
      { concept: 'Ingresos Brutos (IIBB)', amount: round(iibbDeduction), percentageOfPrice: round((iibbDeduction / finalPrice) * 100) },
      { concept: 'IVA Débito Fiscal', amount: round(ivaAmount), percentageOfPrice: round((ivaAmount / finalPrice) * 100) },
    ],
  };
}
