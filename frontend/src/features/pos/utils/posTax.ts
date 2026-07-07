/** IVA incluido en precio (Argentina, 21% por defecto). */
export function computeIvaBreakdown(totalWithTax: number, rate = 0.21) {
  const net = totalWithTax / (1 + rate);
  const iva = totalWithTax - net;
  return {
    net: Number(net.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    total: Number(totalWithTax.toFixed(2)),
    rate,
  };
}
