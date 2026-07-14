import { Drawer, StatusChip, Badge, Button, Table } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { customersApi } from '@/api/customers.api';
import { loyaltyApi } from '@/api/loyalty.api';
import { priceListsApi } from '@/api/priceLists.api';
import type { Customer } from '@/types';
import { ShoppingCart, Star, CreditCard, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

function formatTierLabel(tier?: string) {
  if (!tier) return '—';
  if (tier === 'STANDARD') return 'Estándar';
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

export function CustomerDetailDrawer({ open, onClose, customer }: Props) {
  const customerId = customer?.id ?? '';

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.customers.history(customerId),
    queryFn: () => customersApi.getHistory(customerId),
    enabled: open && !!customerId,
  });

  const { data: loyaltyAccount, isLoading: loyaltyLoading, isError: loyaltyError } = useQuery({
    queryKey: queryKeys.loyalty.account(customerId),
    queryFn: () => loyaltyApi.getAccount(customerId),
    enabled: open && !!customerId,
    retry: false,
  });

  const { data: priceListsData } = useQuery({
    queryKey: queryKeys.priceLists.all(),
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100 }),
    enabled: open && !!customer?.priceListId,
  });

  if (!customer) return null;

  const priceList = customer.priceListId
    ? priceListsData?.data.find((list) => list.id === customer.priceListId)
    : null;

  const priceListLabel = customer.priceListId
    ? (priceList ? `${priceList.name}${priceList.type ? ` (${priceList.type})` : ''}` : 'Cargando…')
    : 'Lista por defecto';

  return (
    <Drawer open={open} onClose={onClose} title="Ficha del Cliente" width="lg">
      <div className={styles.stack}>

        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {customer.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.profileTitleRow}>
              <h3 className={styles.profileTitle}>
                {customer.fullName}
              </h3>
              <Badge color={customer.type === 'BUSINESS' ? 'blue' : 'gray'}>
                {customer.type === 'BUSINESS' ? 'B2B (Empresa)' : 'B2C (Final)'}
              </Badge>
              {customer.source === 'STOREFRONT' && <Badge color="green">Tienda online</Badge>}
              {customer.source === 'POS' && <Badge color="blue">POS</Badge>}
              {customer.credit.onHold && <StatusChip label="Crédito Retenido" color="red" size="sm" />}
            </div>
            <p className={styles.profileMeta}>
              {customer.email} • {customer.phone} • {customer.taxId ? `DNI/CUIT: ${customer.taxId}` : ''}
              {customer.taxCondition ? ` • ${customer.taxCondition}` : ''}
            </p>
          </div>
        </div>

        <div className={styles.cardsGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <CreditCard size={18} color="var(--accent)" />
              <h4 className={styles.infoCardTitle}>Cuenta Corriente</h4>
            </div>
            <div className={styles.infoCardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Límite Total:</span>
                <span className={styles.infoValue}>{formatCurrency(customer.credit.limit)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Utilizado:</span>
                <span className={customer.credit.used > 0 ? styles.infoValueRed : styles.infoValue}>
                  {formatCurrency(customer.credit.used)}
                </span>
              </div>
              <div className={styles.infoRowTotal}>
                <span className={styles.infoValue}>Disponible:</span>
                <span className={styles.infoValueGreen}>{formatCurrency(customer.credit.available)}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <Star size={18} color="var(--yellow)" fill="var(--yellow)" />
              <h4 className={styles.infoCardTitle}>Fidelización</h4>
            </div>
            <div className={styles.infoCardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nivel:</span>
                {loyaltyLoading ? (
                  <span className={styles.infoValue}>—</span>
                ) : loyaltyError || !loyaltyAccount ? (
                  <Badge color="gray">Sin cuenta</Badge>
                ) : (
                  <Badge color="blue">{formatTierLabel(loyaltyAccount.tier)}</Badge>
                )}
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Lista de Precios:</span>
                <span className={styles.infoValue}>{priceListLabel}</span>
              </div>
              <div className={styles.infoRowTotal}>
                <span className={styles.infoLabel}>Puntos Acumulados:</span>
                <span className={styles.infoValueBold}>
                  {loyaltyLoading
                    ? '—'
                    : loyaltyError || !loyaltyAccount
                      ? '0 pts'
                      : `${loyaltyAccount.points.toLocaleString('es-AR')} pts`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.historyHeader}>
            <ShoppingCart size={18} color="var(--text-secondary)" />
            <h4 className={styles.historyTitle}>Historial de Compras</h4>
          </div>

          <div className={styles.historyTableWrap}>
            {isLoading ? (
              <div className={styles.emptyState}>Cargando historial...</div>
            ) : (!history || history.length === 0) ? (
              <div className={styles.emptyState}>El cliente aún no tiene compras registradas.</div>
            ) : (
              <Table
                keyField="id"
                data={history}
                columns={[
                  { key: 'date', header: 'Fecha', render: (h) => new Date(h.createdAt).toLocaleDateString() },
                  { key: 'id', header: 'Ticket / Factura', render: (h) => <span className={styles.mono}>{formatSaleId(h.id, h.status)}</span> },
                  { key: 'source', header: 'Canal', render: (h) => <Badge color={h.source === 'ECOMMERCE' ? 'green' : 'gray'}>{h.source === 'ECOMMERCE' ? 'Tienda' : h.source}</Badge> },
                  { key: 'total', header: 'Total', render: (h) => <strong>{formatCurrency(h.grandTotal)}</strong> },
                  { key: 'method', header: 'Método', render: (h) => <Badge color="gray">{h.paymentMethod}</Badge> },
                  { key: 'action', header: '', render: () => <Button variant="ghost" size="sm"><ExternalLink size={14} /></Button> }
                ]}
              />
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
