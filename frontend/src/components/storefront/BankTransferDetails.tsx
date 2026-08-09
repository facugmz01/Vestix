import { useState } from 'react';
import { Building2, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import styles from './storefront.module.css';

export interface BankTransferInfo {
  transferCbu?: string | null;
  transferAlias?: string | null;
  transferHolderName?: string | null;
  transferBankName?: string | null;
  transferCuit?: string | null;
}

export function hasBankTransferDetails(info?: BankTransferInfo | null): boolean {
  if (!info) return false;
  return Boolean(
    info.transferCbu?.trim() ||
      info.transferAlias?.trim() ||
      info.transferHolderName?.trim() ||
      info.transferBankName?.trim(),
  );
}

interface Row {
  label: string;
  value: string;
  copyable?: boolean;
}

function buildRows(info: BankTransferInfo): Row[] {
  const rows: Row[] = [];
  const holder = info.transferHolderName?.trim();
  const cuit = info.transferCuit?.trim();
  const bank = info.transferBankName?.trim();
  const cbu = info.transferCbu?.trim();
  const alias = info.transferAlias?.trim();

  if (holder) rows.push({ label: 'Titular', value: holder, copyable: true });
  if (cuit) rows.push({ label: 'CUIT / CUIL', value: cuit, copyable: true });
  if (bank) rows.push({ label: 'Entidad bancaria', value: bank, copyable: true });
  if (cbu) rows.push({ label: 'CBU / CVU', value: cbu, copyable: true });
  if (alias) rows.push({ label: 'Alias', value: alias, copyable: true });
  return rows;
}

interface Props {
  info: BankTransferInfo;
  amount?: number | null;
  formatAmount?: (value: number) => string;
  className?: string;
  compact?: boolean;
  buyerCuit?: string;
  onBuyerCuitChange?: (v: string) => void;
}

export function BankTransferDetails({ info, amount, formatAmount, className, compact, buyerCuit, onBuyerCuitChange }: Props) {
  const rows = buildRows(info);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (rows.length === 0) return null;

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(label);
      toast.success(`${label} copiado`);
      window.setTimeout(() => setCopiedKey((current) => (current === label ? null : current)), 1600);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className={clsx(styles.bankTransferBox, compact && styles.bankTransferBoxCompact, className)}>
      <div className={styles.bankTransferHeader}>
        <Building2 size={18} />
        <div>
          <p className={styles.bankTransferTitle}>Datos para transferencia</p>
          <p className={styles.bankTransferHint}>
            Transferí el monto exacto e indicá el número de pedido en el concepto.
          </p>
        </div>
      </div>

      {amount != null && formatAmount && (
        <div className={styles.bankTransferAmount}>
          <span>Monto a transferir</span>
          <strong>{formatAmount(amount)}</strong>
        </div>
      )}

      <dl className={styles.bankTransferList}>
        {rows.map((row) => (
          <div key={row.label} className={styles.bankTransferRow}>
            <dt>{row.label}</dt>
            <dd>
              <span className={styles.bankTransferValue}>{row.value}</span>
              {row.copyable && (
                <button
                  type="button"
                  className={styles.bankTransferCopy}
                  onClick={() => copyValue(row.label, row.value)}
                  aria-label={`Copiar ${row.label}`}
                >
                  {copiedKey === row.label ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {onBuyerCuitChange && (
        <div className={styles.buyerCuitSection}>
          <h4 className={styles.buyerCuitTitle}>Tu CUIT / CBU de origen (opcional)</h4>
          <p className={styles.buyerCuitHint}>Ingresar tu CUIT acelera la conciliación del pago</p>
          <input
            type="text"
            className="storefront-input"
            value={buyerCuit || ''}
            onChange={(e) => onBuyerCuitChange(e.target.value)}
            placeholder="Ej. 20111111112"
          />
        </div>
      )}
    </div>
  );
}
