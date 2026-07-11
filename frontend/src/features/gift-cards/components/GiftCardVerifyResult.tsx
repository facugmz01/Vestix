import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { GiftCardVerification } from '@/api/gift-cards.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/config/app.config';
import styles from './GiftCardVerifyResult.module.css';

interface Props {
  result: GiftCardVerification;
  compact?: boolean;
}

export function GiftCardVerifyResult({ result, compact }: Props) {
  return (
    <div className={compact ? styles.compact : styles.panel}>
      <div className={styles.header}>
        {result.valid ? (
          <ShieldCheck size={22} className={styles.validIcon} />
        ) : (
          <ShieldAlert size={22} className={styles.invalidIcon} />
        )}
        <div>
          <h3 className={styles.title}>
            {result.valid ? 'Gift card válida' : 'Gift card no válida'}
          </h3>
          <p className={styles.subtitle}>
            Verificación emitida por el sistema Vestix
          </p>
        </div>
        <Badge color={result.valid ? 'green' : 'red'}>
          {result.valid ? 'Legítima' : 'Inválida'}
        </Badge>
      </div>

      <dl className={styles.grid}>
        <div>
          <dt>Código</dt>
          <dd><code>{result.code}</code></dd>
        </div>
        <div>
          <dt>Saldo</dt>
          <dd>{formatCurrency(result.balance)}</dd>
        </div>
        <div>
          <dt>Monto inicial</dt>
          <dd>{formatCurrency(result.initialBalance)}</dd>
        </div>
        {result.recipient && (
          <div>
            <dt>Destinatario</dt>
            <dd>{result.recipient}</dd>
          </div>
        )}
        <div>
          <dt>Emitida</dt>
          <dd>{formatDate(result.issuedAt)}</dd>
        </div>
        {result.expiresAt && (
          <div>
            <dt>Vence</dt>
            <dd>{formatDate(result.expiresAt)}</dd>
          </div>
        )}
        <div>
          <dt>Estado</dt>
          <dd>
            {!result.isActive && 'Desactivada'}
            {result.isActive && result.isExpired && 'Vencida'}
            {result.isActive && !result.isExpired && 'Activa'}
          </dd>
        </div>
      </dl>

      {!compact && (
        <p className={styles.hint}>
          También podés escanear el QR desde{' '}
          <Link to="/admin/scanner">Escáner QR</Link> en el menú Comercio.
        </p>
      )}
    </div>
  );
}
