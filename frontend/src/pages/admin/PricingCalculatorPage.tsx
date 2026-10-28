import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { 
  PageContainer, 
  Section, 
  Button, 
  Badge, 
  Tabs 
} from '@/components/ui';
import { 
  Calculator, 
  Truck, 
  Package, 
  CreditCard, 
  PlusCircle, 
  Copy, 
  HelpCircle, 
  Trash2, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Info,
  Check
} from 'lucide-react';
import { 
  suggestMercadoPagoPrice, 
  MP_FEE_RATES, 
  type MercadoPagoModality 
} from '@/features/products/utils/mercadopagoPricing';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import styles from './PricingCalculatorPage.module.css';

interface MixedShipmentItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  profitMargin: number;
}

export default function PricingCalculatorPage() {
  const queryClient = useQueryClient();

  // Mode: 'SINGLE' (Cálculo Unitario / Lote) vs 'BATCH' (Envío Mixto con varias prendas)
  const [activeMode, setActiveMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Query price lists to know existing ones
  const { data: priceListsData } = useQuery({
    queryKey: queryKeys.priceLists.all(),
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100 }),
  });
  const existingPriceLists = priceListsData?.data || [];

  // ─── Single Mode States ──────────────────────────────────────────────────
  const [costPrice, setCostPrice] = useState<number>(10000);
  const [shippingTotal, setShippingTotal] = useState<number>(45000);
  const [unitsInOrder, setUnitsInOrder] = useState<number>(90);
  const [otherExpensesTotal, setOtherExpensesTotal] = useState<number>(9000);
  const [otherExpensesUnit, setOtherExpensesUnit] = useState<number>(100);
  const [profitMargin, setProfitMargin] = useState<number>(60);
  const [modality, setModality] = useState<MercadoPagoModality>('POINT_CREDIT_INSTANT');
  const [customFee, setCustomFee] = useState<number>(6.39);
  const [iibbPercent, setIibbPercent] = useState<number>(3.5);
  const [productIvaPercent, setProductIvaPercent] = useState<number>(21);
  const [showFundamentation, setShowFundamentation] = useState<boolean>(true);

  // Derivaciones del Lote
  const proratedShipping = unitsInOrder > 0 ? shippingTotal / unitsInOrder : 0;
  const proratedExpenses = (unitsInOrder > 0 ? otherExpensesTotal / unitsInOrder : 0) + otherExpensesUnit;

  const singleSuggestion = useMemo(() => {
    if (!costPrice || costPrice <= 0) return null;
    try {
      return suggestMercadoPagoPrice({
        costPrice,
        shippingAllocated: proratedShipping,
        otherExpenses: proratedExpenses,
        profitMarginPercent: profitMargin,
        mpModality: modality,
        customMpFeePercent: customFee,
        iibbPercent,
        productIvaPercent,
      });
    } catch {
      return null;
    }
  }, [
    costPrice,
    proratedShipping,
    proratedExpenses,
    profitMargin,
    modality,
    customFee,
    iibbPercent,
    productIvaPercent,
  ]);

  // ─── Batch / Mixed Shipment States ───────────────────────────────────────
  const [batchShippingTotal, setBatchShippingTotal] = useState<number>(60000);
  const [batchOtherExpenses, setBatchOtherExpenses] = useState<number>(10000);
  const [batchItems, setBatchItems] = useState<MixedShipmentItem[]>([
    { id: '1', name: 'Remeras Básicas', quantity: 50, unitCost: 8000, profitMargin: 60 },
    { id: '2', name: 'Jeans Clásicos', quantity: 30, unitCost: 18000, profitMargin: 60 },
    { id: '3', name: 'Buzos Oversize', quantity: 20, unitCost: 26000, profitMargin: 60 },
  ]);

  const totalBatchUnits = useMemo(() => {
    return batchItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  }, [batchItems]);

  const batchProratedShippingUnit = totalBatchUnits > 0 ? batchShippingTotal / totalBatchUnits : 0;
  const batchProratedExpensesUnit = totalBatchUnits > 0 ? batchOtherExpenses / totalBatchUnits : 0;

  const batchResults = useMemo(() => {
    return batchItems.map((item) => {
      const landed = item.unitCost + batchProratedShippingUnit + batchProratedExpensesUnit;
      try {
        const res = suggestMercadoPagoPrice({
          costPrice: item.unitCost,
          shippingAllocated: batchProratedShippingUnit,
          otherExpenses: batchProratedExpensesUnit,
          profitMarginPercent: item.profitMargin,
          mpModality: modality,
          customMpFeePercent: customFee,
          iibbPercent,
          productIvaPercent,
        });
        return {
          ...item,
          landedCost: landed,
          suggestedPrice: res.suggestedPrice,
          cashPrice: res.cashPrice,
          profitUnit: res.expectedNetProfit,
          totalProfit: res.expectedNetProfit * item.quantity,
          totalRevenue: res.suggestedPrice * item.quantity,
          modifierPercentage: res.modifierPercentage,
        };
      } catch {
        return {
          ...item,
          landedCost: landed,
          suggestedPrice: 0,
          cashPrice: 0,
          profitUnit: 0,
          totalProfit: 0,
          totalRevenue: 0,
          modifierPercentage: 0,
        };
      }
    });
  }, [
    batchItems,
    batchProratedShippingUnit,
    batchProratedExpensesUnit,
    modality,
    customFee,
    iibbPercent,
    productIvaPercent,
  ]);

  const batchTotals = useMemo(() => {
    const totalCostMerchandise = batchItems.reduce((acc, it) => acc + it.unitCost * it.quantity, 0);
    const totalInvestment = totalCostMerchandise + batchShippingTotal + batchOtherExpenses;
    const totalExpectedProfit = batchResults.reduce((acc, it) => acc + it.totalProfit, 0);
    const totalProjectedRevenue = batchResults.reduce((acc, it) => acc + it.totalRevenue, 0);
    return {
      totalCostMerchandise,
      totalInvestment,
      totalExpectedProfit,
      totalProjectedRevenue,
    };
  }, [batchItems, batchShippingTotal, batchOtherExpenses, batchResults]);

  // Mutation to create/update price list
  const createPriceListMutation = useMutation({
    mutationFn: async ({ name, modifierPct }: { name: string; modifierPct: number }) => {
      const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);
      const existing = existingPriceLists.find(
        (l) => l.name.toLowerCase() === name.toLowerCase() || l.code === code
      );

      if (existing) {
        return priceListsApi.updatePriceList(existing.id, {
          modifierPercentage: modifierPct,
          isActive: true,
        });
      }

      return priceListsApi.createPriceList({
        name,
        code: code || 'MP_CALCULATED',
        currency: 'ARS',
        type: 'MODIFIER',
        modifierPercentage: modifierPct,
        isActive: true,
        isDefault: false,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Lista de Precios "${vars.name}" guardada (+${vars.modifierPct}%)`);
      queryClient.invalidateQueries({ queryKey: queryKeys.priceLists.all() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al guardar la lista de precios');
    },
  });

  const handleCreateList = () => {
    if (!singleSuggestion) return;
    const defaultName = `Mercado Pago (${MP_FEE_RATES[modality as Exclude<MercadoPagoModality, 'CUSTOM'>]?.days || 'Point'})`;
    createPriceListMutation.mutate({
      name: defaultName,
      modifierPct: singleSuggestion.modifierPercentage,
    });
  };

  const handleCopyFundamentation = () => {
    if (!singleSuggestion) return;
    navigator.clipboard.writeText(singleSuggestion.fundamentationText);
    toast.success('Fundamentación copiada al portapapeles');
  };

  const handleAddBatchItem = () => {
    setBatchItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'Nueva Prenda',
        quantity: 10,
        unitCost: 10000,
        profitMargin: 60,
      },
    ]);
  };

  const handleRemoveBatchItem = (id: string) => {
    if (batchItems.length <= 1) {
      toast.error('Debe haber al menos un producto en el envío');
      return;
    }
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateBatchItem = (id: string, field: keyof MixedShipmentItem, val: any) => {
    setBatchItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Calculadora de Precios & Costos"
      subtitle="Calculá precios sugeridos absorbiendo comisiones de Mercado Pago, prorrateando flete por lote y deducciones fiscales."
      action={
        singleSuggestion ? (
          <Button
            variant="primary"
            icon={<PlusCircle size={16} />}
            loading={createPriceListMutation.isPending}
            onClick={handleCreateList}
          >
            Guardar como Lista (+{singleSuggestion.modifierPercentage}%)
          </Button>
        ) : undefined
      }
    >
      {/* Mode Navigation Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={clsx(styles.tabBtn, activeMode === 'SINGLE' && styles.tabBtnActive)}
          onClick={() => setActiveMode('SINGLE')}
        >
          <Calculator size={16} /> Cálculo por Prenda / Lote
        </button>
        <button
          type="button"
          className={clsx(styles.tabBtn, activeMode === 'BATCH' && styles.tabBtnActive)}
          onClick={() => setActiveMode('BATCH')}
        >
          <Truck size={16} /> Simulador de Envío Mixto (Varios Productos)
        </button>
      </div>

      {activeMode === 'SINGLE' && (
        <div className={styles.calcLayout}>
          {/* Left Column: Cost Inputs & Parameters */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Package size={18} color="#009ee3" />
                1. Costos de Compra y Flete del Pedido
              </h3>
              <Badge color="blue">Prorrateo de Lote</Badge>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Costo Unitario Proveedor ($)</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Total Prendas en el Envío</label>
                <input
                  type="number"
                  value={unitsInOrder || ''}
                  onChange={(e) => setUnitsInOrder(Math.max(1, parseInt(e.target.value) || 1))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.grid2} style={{ marginTop: 12 }}>
              <div className={styles.field}>
                <label className={styles.label}>Flete Total de la Factura ($)</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    value={shippingTotal || ''}
                    placeholder="0"
                    onChange={(e) => setShippingTotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Gastos Globales de Compra ($)</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    value={otherExpensesTotal || ''}
                    placeholder="0"
                    title="Seguros, transferencias bancarias o flete local"
                    onChange={(e) => setOtherExpensesTotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.field} style={{ marginTop: 12 }}>
              <label className={styles.label}>Packaging y Etiquetas Directos por Prenda ($)</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputPrefix}>$</span>
                <input
                  type="number"
                  value={otherExpensesUnit || ''}
                  placeholder="0"
                  onChange={(e) => setOtherExpensesUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={clsx(styles.input, styles.inputWithPrefix)}
                />
              </div>
            </div>

            {/* Flete prorrateado badge */}
            <div className={styles.infoBadge}>
              <Info size={15} />
              <span>
                Flete prorrateado: <strong>${Math.round(proratedShipping).toLocaleString('es-AR')}</strong> por prenda ({((proratedShipping / (costPrice || 1)) * 100).toFixed(1)}% del costo base).
              </span>
            </div>

            {/* Landed Cost Banner */}
            <div className={styles.landedCostBanner}>
              <div>
                <span className={styles.landedCostLabel}>Costo Puesto Unitario (Landed Cost):</span>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  ${costPrice.toLocaleString('es-AR')} (base) + ${Math.round(proratedShipping).toLocaleString('es-AR')} (flete) + ${Math.round(proratedExpenses).toLocaleString('es-AR')} (gastos)
                </div>
              </div>
              <div className={styles.landedCostValue}>
                ${Math.round(costPrice + proratedShipping + proratedExpenses).toLocaleString('es-AR')}
              </div>
            </div>

            {/* Commercial & MP Parameters */}
            <div className={styles.subSectionTitle}>
              <CreditCard size={15} />
              2. Parámetros Comerciales & Mercado Pago
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Modalidad Mercado Pago</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value as MercadoPagoModality)}
                  className={styles.select}
                >
                  {Object.entries(MP_FEE_RATES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} [{val.fee}% + IVA]
                    </option>
                  ))}
                  <option value="CUSTOM">Personalizado (% manual)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Ganancia Neta Deseada (%)</label>
                <input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={styles.input}
                />
              </div>
            </div>

            {modality === 'CUSTOM' && (
              <div className={styles.field} style={{ marginTop: 12 }}>
                <label className={styles.label}>Arancel MP personalizado (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customFee}
                  onChange={(e) => setCustomFee(parseFloat(e.target.value) || 0)}
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.grid2} style={{ marginTop: 12 }}>
              <div className={styles.field}>
                <label className={styles.label}>Ingresos Brutos / Retenciones (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={iibbPercent}
                  onChange={(e) => setIibbPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Alícuota IVA de la Prenda (%)</label>
                <select
                  value={productIvaPercent}
                  onChange={(e) => setProductIvaPercent(parseFloat(e.target.value) || 0)}
                  className={styles.select}
                >
                  <option value="21">21% (General / Indumentaria)</option>
                  <option value="10.5">10.5% (Reducido)</option>
                  <option value="0">0% (Exento)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Suggested Prices & Fundamentation */}
          {singleSuggestion ? (
            <div className={styles.resultHeroCard}>
              <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                <h3 className={styles.cardTitle}>
                  <TrendingUp size={18} color="#10b981" />
                  Precios Sugeridos & Resultados
                </h3>
                <span style={{ fontSize: 12, color: '#009ee3', fontWeight: 600 }}>
                  Margen Neto Protegido
                </span>
              </div>

              {/* Main Price Box */}
              <div className={styles.mainPriceDisplay}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Precio Sugerido al Público (Mercado Pago):
                  </span>
                  <div className={styles.heroPrice}>
                    ${singleSuggestion.suggestedPrice.toLocaleString('es-AR')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Precio Contado / Efectivo:
                  </span>
                  <div className={styles.heroCashPrice}>
                    ${singleSuggestion.cashPrice.toLocaleString('es-AR')}
                  </div>
                  <span style={{ fontSize: 11, color: '#10b981' }}>
                    Descuento mostrador: {Math.round((1 - singleSuggestion.cashPrice / singleSuggestion.suggestedPrice) * 100)}% off
                  </span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricTile}>
                  <span className={styles.metricTileLabel}>Ganancia x Prenda</span>
                  <span className={styles.metricTileValue} style={{ color: '#10b981' }}>
                    +${singleSuggestion.expectedNetProfit.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className={styles.metricTile}>
                  <span className={styles.metricTileLabel}>Ganancia Total Lote</span>
                  <span className={styles.metricTileValue} style={{ color: '#10b981' }}>
                    +${Math.round(singleSuggestion.expectedNetProfit * unitsInOrder).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className={styles.metricTile}>
                  <span className={styles.metricTileLabel}>Modificador Lista</span>
                  <span className={styles.metricTileValue} style={{ color: '#009ee3' }}>
                    +{singleSuggestion.modifierPercentage}%
                  </span>
                </div>

                <div className={styles.metricTile}>
                  <span className={styles.metricTileLabel}>Comisión MP</span>
                  <span className={styles.metricTileValue} style={{ color: '#e11d48' }}>
                    -${singleSuggestion.mpDeductionTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Fundamentation Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Fundamentación & Demostración de Liquidación
                </span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#009ee3', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
                  onClick={() => setShowFundamentation(!showFundamentation)}
                >
                  {showFundamentation ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {showFundamentation && (
                <div className={styles.fundamentationBox}>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={handleCopyFundamentation}
                  >
                    <Copy size={13} /> Copiar
                  </button>
                  {singleSuggestion.fundamentationText}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.card} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Calculator size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Ingresá el costo de la prenda para calcular el precio sugerido de venta.</p>
            </div>
          )}
        </div>
      )}

      {/* Mode BATCH: Mixed Shipment Simulator */}
      {activeMode === 'BATCH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Card: Shipment Globals */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Truck size={18} color="#009ee3" />
                Datos Globales del Envío
              </h3>
              <Badge color="blue">{totalBatchUnits} prendas en total</Badge>
            </div>

            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>Flete Total del Envío ($)</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    value={batchShippingTotal || ''}
                    onChange={(e) => setBatchShippingTotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Gastos Globales Asociados ($)</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputPrefix}>$</span>
                  <input
                    type="number"
                    value={batchOtherExpenses || ''}
                    onChange={(e) => setBatchOtherExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Modalidad Mercado Pago</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value as MercadoPagoModality)}
                  className={styles.select}
                >
                  {Object.entries(MP_FEE_RATES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label} [{val.fee}% + IVA]
                    </option>
                  ))}
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>
            </div>

            <div className={styles.infoBadge} style={{ marginTop: 12 }}>
              <Info size={15} />
              <span>
                Flete prorrateado asignado: <strong>${Math.round(batchProratedShippingUnit).toLocaleString('es-AR')}</strong> por prenda | Gastos: <strong>${Math.round(batchProratedExpensesUnit).toLocaleString('es-AR')}</strong> por prenda.
              </span>
            </div>
          </div>

          {/* Mixed Shipment Table */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Receipt size={18} color="#009ee3" />
                Prendas del Envío y Simulación de Precios
              </h3>
              <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={handleAddBatchItem}>
                Añadir Producto
              </Button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.simTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: 90 }}>Cantidad</th>
                    <th style={{ width: 120 }}>Costo Base</th>
                    <th style={{ width: 110 }}>Costo Puesto</th>
                    <th style={{ width: 90 }}>Margen %</th>
                    <th style={{ width: 130 }}>Precio MP (PVP)</th>
                    <th style={{ width: 120 }}>Precio Contado</th>
                    <th style={{ width: 120 }}>Ganancia Línea</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateBatchItem(item.id, 'name', e.target.value)}
                          className={styles.input}
                          style={{ padding: '4px 8px', fontSize: 13 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          onChange={(e) => handleUpdateBatchItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className={styles.input}
                          style={{ padding: '4px 8px', fontSize: 13 }}
                        />
                      </td>
                      <td>
                        <div className={styles.inputWrap}>
                          <span className={styles.inputPrefix}>$</span>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateBatchItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            className={clsx(styles.input, styles.inputWithPrefix)}
                            style={{ padding: '4px 8px', fontSize: 13 }}
                          />
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        ${Math.round(item.landedCost).toLocaleString('es-AR')}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.profitMargin}
                          onChange={(e) => handleUpdateBatchItem(item.id, 'profitMargin', parseFloat(e.target.value) || 0)}
                          className={styles.input}
                          style={{ padding: '4px 8px', fontSize: 13 }}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#009ee3', fontSize: 14 }}>
                        ${item.suggestedPrice.toLocaleString('es-AR')}
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>
                        ${item.cashPrice.toLocaleString('es-AR')}
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>
                        +${Math.round(item.totalProfit).toLocaleString('es-AR')}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveBatchItem(item.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          title="Eliminar fila"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.simTotalRow}>
                    <td>Totales del Envío</td>
                    <td>{totalBatchUnits} u.</td>
                    <td>${batchTotals.totalCostMerchandise.toLocaleString('es-AR')}</td>
                    <td colSpan={2}>
                      Inversión total: ${batchTotals.totalInvestment.toLocaleString('es-AR')}
                    </td>
                    <td colSpan={2} style={{ color: '#009ee3' }}>
                      Recaudación MP: ${Math.round(batchTotals.totalProjectedRevenue).toLocaleString('es-AR')}
                    </td>
                    <td style={{ color: '#10b981', fontSize: 15 }}>
                      +${Math.round(batchTotals.totalExpectedProfit).toLocaleString('es-AR')}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
