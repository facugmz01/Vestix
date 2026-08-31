import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { usePermissions } from '@/rbac/usePermissions';
import { SupervisorApprovalModal } from '@/components/modals/SupervisorApprovalModal';
import type { AuthorizeActionResult } from '@/api/auth.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { Percent, DollarSign, Tag, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface DiscountApplyData {
  mode: 'LINE' | 'GLOBAL';
  customUnitPrice?: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  supervisorApprovalToken?: string;
  authorizedByName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'LINE' | 'GLOBAL';
  title?: string;
  // Context for Line
  initialBasePrice?: number;
  initialCustomUnitPrice?: number;
  initialQuantity?: number;
  initialDiscountType?: 'PERCENTAGE' | 'FIXED';
  initialDiscountValue?: number;
  productName?: string;
  // Context for Global
  subtotal?: number;
  // Callback
  onApply: (data: DiscountApplyData) => void;
}

export function DiscountModal({
  open,
  onClose,
  mode,
  title,
  initialBasePrice = 0,
  initialCustomUnitPrice,
  initialQuantity = 1,
  initialDiscountType = 'PERCENTAGE',
  initialDiscountValue = 0,
  productName = 'Producto',
  subtotal = 0,
  onApply,
}: Props) {
  const { can, isSuperAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<'DISCOUNT' | 'PRICE'>('DISCOUNT');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(initialDiscountType);
  const [discountValue, setDiscountValue] = useState<number>(initialDiscountValue);
  const [customPrice, setCustomPrice] = useState<number>(initialCustomUnitPrice ?? initialBasePrice);
  const [supervisorToken, setSupervisorToken] = useState<string | undefined>();
  const [authorizedBy, setAuthorizedBy] = useState<string | undefined>();

  // Supervisor modal state
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: string; label: string } | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab('DISCOUNT');
      setDiscountType(initialDiscountType);
      setDiscountValue(initialDiscountValue);
      setCustomPrice(initialCustomUnitPrice ?? initialBasePrice);
      setSupervisorToken(undefined);
      setAuthorizedBy(undefined);
      setSupervisorModalOpen(false);
      setPendingAction(null);
    }
  }, [open, initialDiscountType, initialDiscountValue, initialCustomUnitPrice, initialBasePrice]);

  const hasDiscountPermission = isSuperAdmin() || can('apply', 'Discount') || can('manage', 'Sales');
  const hasPriceOverridePermission = isSuperAdmin() || can('override', 'Price') || can('manage', 'Sales');

  // Mathematical calculations
  const calculations = useMemo(() => {
    if (mode === 'GLOBAL') {
      const merchandise = Math.max(0, subtotal);
      let discountAmt = 0;
      if (discountType === 'PERCENTAGE') {
        const pct = Math.min(100, Math.max(0, discountValue));
        discountAmt = (merchandise * pct) / 100;
      } else {
        discountAmt = Math.min(merchandise, Math.max(0, discountValue));
      }
      const finalTotal = Math.max(0, merchandise - discountAmt);
      const effectivePct = merchandise > 0 ? (discountAmt / merchandise) * 100 : 0;
      return {
        baseTotal: merchandise,
        discountAmount: discountAmt,
        finalTotal,
        effectivePct,
      };
    } else {
      // LINE Mode
      const effectiveBasePrice = customPrice !== undefined && customPrice > 0 ? customPrice : initialBasePrice;
      const grossLine = effectiveBasePrice * Math.max(1, initialQuantity);
      let lineDiscountAmt = 0;

      if (discountType === 'PERCENTAGE') {
        const pct = Math.min(100, Math.max(0, discountValue));
        lineDiscountAmt = (grossLine * pct) / 100;
      } else {
        lineDiscountAmt = Math.min(grossLine, Math.max(0, discountValue));
      }

      const finalLineTotal = Math.max(0, grossLine - lineDiscountAmt);
      const finalUnitEffectivePrice = initialQuantity > 0 ? finalLineTotal / initialQuantity : effectiveBasePrice;
      const isPriceModified = Math.abs(effectiveBasePrice - initialBasePrice) > 0.01;

      return {
        baseTotal: grossLine,
        effectiveBasePrice,
        discountAmount: lineDiscountAmt,
        finalTotal: finalLineTotal,
        finalUnitPrice: finalUnitEffectivePrice,
        isPriceModified,
      };
    }
  }, [mode, subtotal, customPrice, initialBasePrice, initialQuantity, discountType, discountValue]);

  const handleApply = (overrideToken?: string, authorizedName?: string) => {
    const tokenToUse = overrideToken || supervisorToken;
    const nameToUse = authorizedName || authorizedBy;

    // Check permissions
    if (mode === 'LINE' && calculations.isPriceModified && !hasPriceOverridePermission && !tokenToUse) {
      setPendingAction({
        action: 'override:Price',
        label: 'Modificar Precio Unitario',
      });
      setSupervisorModalOpen(true);
      return;
    }

    if (calculations.discountAmount > 0 && !hasDiscountPermission && !tokenToUse) {
      setPendingAction({
        action: 'apply:Discount',
        label: mode === 'GLOBAL' ? 'Aplicar Descuento Global' : 'Aplicar Descuento por Línea',
      });
      setSupervisorModalOpen(true);
      return;
    }

    onApply({
      mode,
      customUnitPrice: mode === 'LINE' && calculations.isPriceModified ? calculations.effectiveBasePrice : undefined,
      discountType: calculations.discountAmount > 0 ? discountType : undefined,
      discountValue: calculations.discountAmount > 0 ? discountValue : 0,
      supervisorApprovalToken: tokenToUse,
      authorizedByName: nameToUse,
    });

    toast.success(mode === 'GLOBAL' ? 'Descuento global aplicado' : 'Precio / descuento aplicado a la línea');
    onClose();
  };

  const handleSupervisorApproved = (res: AuthorizeActionResult) => {
    setSupervisorToken(res.supervisorApprovalToken);
    setAuthorizedBy(res.supervisor.fullName || res.supervisor.email);
    handleApply(res.supervisorApprovalToken, res.supervisor.fullName || res.supervisor.email);
  };

  const modalTitle = title || (mode === 'GLOBAL' ? 'Descuento General' : `Editar ${productName}`);

  return (
    <>
      <Modal
        open={open}
        title={modalTitle}
        onClose={onClose}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setDiscountValue(0);
                setCustomPrice(initialBasePrice);
                handleApply();
              }}
              type="button"
            >
              Restablecer
            </Button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={onClose} type="button">
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => handleApply()} type="button">
                Aplicar Cambios
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tabs for LINE mode */}
          {mode === 'LINE' && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-border-subtle, #e2e8f0)',
                paddingBottom: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('DISCOUNT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: activeTab === 'DISCOUNT' ? 'var(--color-primary-50, #eff6ff)' : 'transparent',
                  color: activeTab === 'DISCOUNT' ? 'var(--color-primary-600, #2563eb)' : 'var(--color-text-muted, #64748b)',
                }}
              >
                <Tag size={16} />
                Descuento
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PRICE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: activeTab === 'PRICE' ? 'var(--color-primary-50, #eff6ff)' : 'transparent',
                  color: activeTab === 'PRICE' ? 'var(--color-primary-600, #2563eb)' : 'var(--color-text-muted, #64748b)',
                }}
              >
                <Edit3 size={16} />
                Modificar Precio Unitario
              </button>
            </div>
          )}

          {/* DISCOUNT TAB */}
          {(mode === 'GLOBAL' || activeTab === 'DISCOUNT') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', display: 'block', marginBottom: '0.4rem' }}>
                  Tipo de Descuento
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('PERCENTAGE'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: discountType === 'PERCENTAGE' ? '2px solid var(--color-primary-500, #3b82f6)' : '1px solid var(--color-border-subtle, #cbd5e1)',
                      background: discountType === 'PERCENTAGE' ? 'var(--color-primary-50, #eff6ff)' : '#fff',
                      color: discountType === 'PERCENTAGE' ? 'var(--color-primary-700, #1d4ed8)' : 'var(--color-text-primary, #1e293b)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Percent size={16} />
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('FIXED'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: discountType === 'FIXED' ? '2px solid var(--color-primary-500, #3b82f6)' : '1px solid var(--color-border-subtle, #cbd5e1)',
                      background: discountType === 'FIXED' ? 'var(--color-primary-50, #eff6ff)' : '#fff',
                      color: discountType === 'FIXED' ? 'var(--color-primary-700, #1d4ed8)' : 'var(--color-text-primary, #1e293b)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <DollarSign size={16} />
                    Monto Fijo ($)
                  </button>
                </div>
              </div>

              <Input
                label={discountType === 'PERCENTAGE' ? 'Porcentaje de Descuento (%)' : 'Monto a Descontar ($)'}
                type="number"
                min="0"
                max={discountType === 'PERCENTAGE' ? 100 : calculations.baseTotal}
                step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                value={discountValue || ''}
                placeholder="0"
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                autoFocus
              />

              {/* Quick Percentage Presets */}
              {discountType === 'PERCENTAGE' && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiscountValue(preset)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border-subtle, #cbd5e1)',
                        background: discountValue === preset ? 'var(--color-primary-100, #dbeafe)' : '#f8fafc',
                        color: discountValue === preset ? 'var(--color-primary-800, #1e40af)' : 'var(--color-text-secondary, #475569)',
                        cursor: 'pointer',
                      }}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRICE OVERRIDE TAB (LINE only) */}
          {mode === 'LINE' && activeTab === 'PRICE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)' }}>
                Precio de lista original: <strong>{formatCurrency(initialBasePrice)}</strong>
              </div>

              <Input
                label="Nuevo Precio Unitario ($) *"
                type="number"
                min="0"
                step="0.01"
                value={customPrice || ''}
                placeholder="0.00"
                onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value)))}
                autoFocus
              />

              {calculations.isPriceModified && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-primary-600, #2563eb)' }}>
                  Variación de precio: {customPrice > initialBasePrice ? '+' : ''}{formatCurrency(customPrice - initialBasePrice)} ({Math.round(((customPrice - initialBasePrice) / initialBasePrice) * 100)}%)
                </div>
              )}
            </div>
          )}

          {/* LIVE SUMMARY CARD */}
          <div
            style={{
              padding: '0.9rem',
              borderRadius: '8px',
              background: 'var(--color-bg-subtle, #f8fafc)',
              border: '1px solid var(--color-border-subtle, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted, #64748b)' }}>
              <span>Subtotal Base:</span>
              <span>{formatCurrency(calculations.baseTotal)}</span>
            </div>

            {calculations.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger-600, #dc2626)', fontWeight: 500 }}>
                <span>
                  Descuento Aplicado {discountType === 'PERCENTAGE' ? `(${discountValue}%)` : ''}:
                </span>
                <span>- {formatCurrency(calculations.discountAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--color-text-primary, #0f172a)',
                borderTop: '1px solid var(--color-border-subtle, #cbd5e1)',
                paddingTop: '0.4rem',
                marginTop: '0.2rem',
              }}
            >
              <span>Total Final:</span>
              <span>{formatCurrency(calculations.finalTotal)}</span>
            </div>
          </div>

          {/* RBAC PERMISSION WARNING / BADGE */}
          {authorizedBy ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                color: '#065f46',
                fontSize: '0.85rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Autorizado por supervisor: <strong>{authorizedBy}</strong></span>
            </div>
          ) : (!hasDiscountPermission || (mode === 'LINE' && calculations.isPriceModified && !hasPriceOverridePermission)) ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '6px',
                color: '#92400e',
                fontSize: '0.85rem',
              }}
            >
              <ShieldAlert size={16} />
              <span>Se solicitará PIN/contraseña de supervisor al confirmar.</span>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* SUPERVISOR APPROVAL MODAL FALLBACK */}
      {pendingAction && (
        <SupervisorApprovalModal
          open={supervisorModalOpen}
          onClose={() => setSupervisorModalOpen(false)}
          action={pendingAction.action}
          actionLabel={pendingAction.label}
          onApproved={handleSupervisorApproved}
        />
      )}
    </>
  );
}
