import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  suggestMercadoPagoPrice, 
  MP_FEE_RATES, 
  MP_INSTALLMENT_PLANS,
  type MercadoPagoModality,
  type MercadoPagoInstallmentPlan
} from '../utils/mercadopagoPricing';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import { 
  Check, 
  HelpCircle, 
  Copy, 
  TrendingUp, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './MercadoPagoPriceSuggester.module.css';

interface Props {
  costPrice: number;
  onApplyPrice: (price: number) => void;
  existingPriceLists?: Array<{ id: string; name: string; type: string; modifierPercentage?: number }>;
}

export function MercadoPagoPriceSuggester({ 
  costPrice, 
  onApplyPrice, 
  existingPriceLists = [] 
}: Props) {
  const queryClient = useQueryClient();

  const [profitMargin, setProfitMargin] = useState<number>(60);
  const [shippingAllocated, setShippingAllocated] = useState<number>(0);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [modality, setModality] = useState<MercadoPagoModality>('POINT_CREDIT_INSTANT');
  const [customFee, setCustomFee] = useState<number>(6.39);
  const [installmentPlan, setInstallmentPlan] = useState<MercadoPagoInstallmentPlan>('NONE');
  const [customInstallmentsCount, setCustomInstallmentsCount] = useState<number>(3);
  const [customInstallmentFee, setCustomInstallmentFee] = useState<number>(8.99);
  const [iibbPercent, setIibbPercent] = useState<number>(3.5);
  const [productIvaPercent, setProductIvaPercent] = useState<number>(21);

  const [showAdvancedTaxes, setShowAdvancedTaxes] = useState<boolean>(false);
  const [showFundamentation, setShowFundamentation] = useState<boolean>(false);
  const [creatingList, setCreatingList] = useState<boolean>(false);

  // Cálculo en tiempo real
  const suggestion = useMemo(() => {
    if (!costPrice || costPrice <= 0) return null;
    try {
      return suggestMercadoPagoPrice({
        costPrice,
        shippingAllocated,
        otherExpenses,
        profitMarginPercent: profitMargin,
        mpModality: modality,
        customMpFeePercent: customFee,
        installmentPlan,
        customInstallmentsCount,
        customInstallmentFeePercent: customInstallmentFee,
        iibbPercent,
        productIvaPercent,
      });
    } catch {
      return null;
    }
  }, [
    costPrice,
    shippingAllocated,
    otherExpenses,
    profitMargin,
    modality,
    customFee,
    installmentPlan,
    customInstallmentsCount,
    customInstallmentFee,
    iibbPercent,
    productIvaPercent,
  ]);

  // Mutation para crear o actualizar la lista de precios en Vestix
  const createPriceListMutation = useMutation({
    mutationFn: async (modifierPct: number) => {
      const planSuffix = suggestion?.installmentsCount && suggestion.installmentsCount > 1
        ? ` (${suggestion.installmentPlanLabel})`
        : ' (Point/QR)';
      const listName = `Mercado Pago${planSuffix}`;
      const listCode = suggestion?.installmentsCount && suggestion.installmentsCount > 1
        ? `MP_${suggestion.installmentsCount}CUOTAS`
        : 'MP_POINT';
      
      const existing = existingPriceLists.find(
        l => l.name.toLowerCase() === listName.toLowerCase() || (l as { code?: string }).code === listCode
      );

      if (existing) {
        return priceListsApi.updatePriceList(existing.id, {
          modifierPercentage: modifierPct,
          isActive: true,
        });
      }

      return priceListsApi.createPriceList({
        name: listName,
        code: listCode,
        currency: 'ARS',
        type: 'MODIFIER',
        modifierPercentage: modifierPct,
        isActive: true,
        isDefault: false,
      });
    },
    onSuccess: (_, modifierPct) => {
      toast.success(`Lista de Precios guardada (+${modifierPct}%)`);
      queryClient.invalidateQueries({ queryKey: queryKeys.priceLists.all() });
      setCreatingList(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al crear la lista de precios');
      setCreatingList(false);
    },
  });

  const handleCreatePriceList = () => {
    if (!suggestion) return;
    setCreatingList(true);
    createPriceListMutation.mutate(suggestion.modifierPercentage);
  };

  const handleCopyFundamentation = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion.fundamentationText);
    toast.success('Fundamentación copiada al portapapeles');
  };

  if (!costPrice || costPrice <= 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <CreditCard size={18} color="#009ee3" />
          <h4 className={styles.title}>Sugeridor de Precios Mercado Pago</h4>
          <span className={styles.mpBadge}>Aranceles Oficiales</span>
          <span className={styles.guaranteeBadge}>Margen Protegido</span>
        </div>

        <button
          type="button"
          className={styles.taxToggleBtn}
          onClick={() => setShowAdvancedTaxes(prev => !prev)}
        >
          {showAdvancedTaxes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAdvancedTaxes ? 'Ocultar tasas fiscales' : 'Ajustar tasas fiscales (IIBB / IVA)'}
        </button>
      </div>

      {/* Advanced taxes row */}
      {showAdvancedTaxes && (
        <div className={styles.taxesRow}>
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
            <label className={styles.label}>IVA del Producto (%)</label>
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
      )}

      {/* Main control grid */}
      <div className={styles.gridControls}>
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

        {modality === 'CUSTOM' && (
          <div className={styles.field}>
            <label className={styles.label}>Arancel MP personalizado (%)</label>
            <input
              type="number"
              step="0.01"
              value={customFee}
              onChange={(e) => setCustomFee(parseFloat(e.target.value) || 0)}
              className={styles.input}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Cuotas Sin Interés</label>
          <select
            value={installmentPlan}
            onChange={(e) => setInstallmentPlan(e.target.value as MercadoPagoInstallmentPlan)}
            className={styles.select}
          >
            <option value="NONE">1 pago (Sin cuotas)</option>
            <option value="CUOTA_SIMPLE_3">Cuota Simple 3 (+6.03%)</option>
            <option value="CUOTA_SIMPLE_6">Cuota Simple 6 (+11.54%)</option>
            <option value="INSTALLMENTS_2">2 cuotas (+5.99%)</option>
            <option value="INSTALLMENTS_3">3 cuotas (+8.99%)</option>
            <option value="INSTALLMENTS_6">6 cuotas (+16.49%)</option>
            <option value="INSTALLMENTS_9">9 cuotas (+24.99%)</option>
            <option value="INSTALLMENTS_12">12 cuotas (+32.99%)</option>
            <option value="CUSTOM_INSTALLMENTS">Personalizado (% cuotas)</option>
          </select>
        </div>

        {installmentPlan === 'CUSTOM_INSTALLMENTS' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Cant. de Cuotas</label>
              <input
                type="number"
                min={2}
                max={24}
                value={customInstallmentsCount}
                onChange={(e) => setCustomInstallmentsCount(parseInt(e.target.value) || 2)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tasa Financiera Cuotas (%)</label>
              <input
                type="number"
                step="0.1"
                value={customInstallmentFee}
                onChange={(e) => setCustomInstallmentFee(parseFloat(e.target.value) || 0)}
                className={styles.input}
              />
            </div>
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Ganancia Neta Deseada (%)</label>
          <input
            type="number"
            step="1"
            value={profitMargin}
            onChange={(e) => setProfitMargin(Math.max(0, parseFloat(e.target.value) || 0))}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Flete unitario de compra ($)</label>
          <input
            type="number"
            step="10"
            value={shippingAllocated || ''}
            placeholder="0"
            onChange={(e) => setShippingAllocated(Math.max(0, parseFloat(e.target.value) || 0))}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Packaging / Otros gastos ($)</label>
          <input
            type="number"
            step="10"
            value={otherExpenses || ''}
            placeholder="0"
            onChange={(e) => setOtherExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
            className={styles.input}
          />
        </div>
      </div>

      {/* Result Card */}
      {suggestion && (
        <div className={styles.resultCard}>
          <div className={styles.resultMainRow}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceLabel}>
                Precio Sugerido Final (Mercado Pago):
              </span>
              <div className={styles.suggestedPrice}>
                ${suggestion.suggestedPrice.toLocaleString('es-AR')}
              </div>
              {suggestion.installmentsCount > 1 && (
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0284c7', marginTop: 2 }}>
                  💳 {suggestion.installmentsCount} cuotas fijas de ${suggestion.installmentAmount.toLocaleString('es-AR')} sin interés
                </div>
              )}
              <div className={styles.secondaryPrices}>
                <span className={styles.cashPriceText}>
                  💵 Contado / Efectivo: ${suggestion.cashPrice.toLocaleString('es-AR')}
                </span>
                <span className={styles.profitText}>
                  ✨ Ganancia Neta: +${suggestion.expectedNetProfit.toLocaleString('es-AR')}
                </span>
                <span style={{ color: '#009ee3', fontWeight: 600 }}>
                  📈 Modificador: +{suggestion.modifierPercentage}%
                </span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<PlusCircle size={16} />}
                loading={creatingList || createPriceListMutation.isPending}
                onClick={handleCreatePriceList}
                title="Crea o actualiza una lista de precios modificadora con el porcentaje calculado"
              >
                Generar Lista MP (+{suggestion.modifierPercentage}%)
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<HelpCircle size={16} />}
                onClick={() => setShowFundamentation(prev => !prev)}
              >
                {showFundamentation ? 'Ocultar Fundamentación' : 'Ver Fundamentación'}
              </Button>
            </div>
          </div>

          {/* Section Fundamentación */}
          {showFundamentation && (
            <div className={styles.explanationSection}>
              {/* Resumen en fichas */}
              <div className={styles.breakdownGrid}>
                {suggestion.breakdown.map((item, idx) => (
                  <div key={idx} className={styles.breakdownItem}>
                    <span className={styles.breakdownItemLabel}>{item.concept}</span>
                    <span className={styles.breakdownItemValue}>
                      ${item.amount.toLocaleString('es-AR')}
                    </span>
                    <span className={styles.breakdownItemPct}>({item.percentageOfPrice}%)</span>
                  </div>
                ))}
              </div>

              {/* Fundamentación en texto con botón de copia */}
              <div className={styles.fundamentationBox}>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyFundamentation}
                >
                  <Copy size={13} /> Copiar
                </button>
                {suggestion.fundamentationText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
