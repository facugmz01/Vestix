import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Star } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Button, Input, Badge, SearchInput,
  ApiErrorDisplay, TableSkeleton, EmptyState,
} from '@/components/ui';
import { loyaltyApi } from '@/api/loyalty.api';
import { customersApi } from '@/api/customers.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ApiError } from '@/api/client';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from '@/features/settings/components/SettingsShared.module.css';

export default function LoyaltyPage() {
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.loyalty.settings(),
    queryFn: () => loyaltyApi.getSettings(),
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: queryKeys.customers.all({ search: customerSearch, pageSize: 8 }),
    queryFn: () => customersApi.getCustomers({ search: customerSearch, pageSize: 8 }),
    enabled: customerSearch.trim().length >= 2,
  });

  const { data: account, isLoading: accountLoading, error: accountError, refetch } = useQuery({
    queryKey: queryKeys.loyalty.account(selectedCustomerId ?? ''),
    queryFn: () => loyaltyApi.getAccount(selectedCustomerId!),
    enabled: !!selectedCustomerId,
    retry: false,
  });

  const ensureMutation = useMutation({
    mutationFn: (customerId: string) => loyaltyApi.ensureAccount(customerId),
    onSuccess: () => {
      toast.success('Cuenta de fidelización creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.account(selectedCustomerId!) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const redeemMutation = useMutation({
    mutationFn: () => loyaltyApi.redeem(selectedCustomerId!, parseInt(redeemPoints, 10), 'Canje manual admin'),
    onSuccess: () => {
      toast.success('Puntos canjeados');
      setRedeemPoints('');
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.account(selectedCustomerId!) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const adjustMutation = useMutation({
    mutationFn: () => loyaltyApi.adjust(selectedCustomerId!, parseInt(adjustPoints, 10)),
    onSuccess: () => {
      toast.success('Puntos ajustados');
      setAdjustPoints('');
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.account(selectedCustomerId!) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const accountNotFound = accountError && (accountError as ApiError).status === 404;

  return (
    <PageContainer
      title="Programa de Fidelización"
      subtitle="Consultá puntos, canjeá recompensas y ajustá cuentas de clientes."
    >
      {settingsLoading ? (
        <TableSkeleton rows={2} />
      ) : settings && (
        <Section>
          <div className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}><Star size={18} /> Reglas activas</h3>
            </header>
            <div className={styles.cardBody}>
              <div className={adminStyles.statsRow}>
                <Badge color={settings.enabled ? 'green' : 'gray'}>
                  {settings.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
                <span>{settings.pointsPerAmount} punto(s) cada {formatCurrency(settings.amountUnit)}</span>
                <span>Valor canje: {formatCurrency(settings.redeemValuePerPoint)} por punto</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section>
        <h3 className={adminStyles.sectionTitle}>Buscar cliente</h3>
        <SearchInput placeholder="Nombre, email o DNI/CUIT..." onSearch={setCustomerSearch} />
        {customersLoading && <TableSkeleton rows={3} />}
        {(customersData?.data ?? []).length > 0 && (
          <div className={adminStyles.searchResults}>
            {customersData!.data.map(c => (
              <button
                key={c.id}
                type="button"
                className={adminStyles.searchResultItem}
                onClick={() => setSelectedCustomerId(c.id)}
              >
                <strong>{c.fullName}</strong>
                <span className={adminStyles.cellMuted}>{c.email || c.taxId || c.phone}</span>
              </button>
            ))}
          </div>
        )}
      </Section>

      {selectedCustomerId && (
        <Section>
          {accountLoading ? (
            <TableSkeleton rows={2} />
          ) : accountNotFound ? (
            <EmptyState
              icon={<Gift size={32} />}
              title="Sin cuenta de fidelización"
              description="Este cliente aún no tiene puntos acumulados."
              action={
                <ActionGuard action="create" subject="Sales">
                  <Button variant="primary" onClick={() => ensureMutation.mutate(selectedCustomerId)} loading={ensureMutation.isPending}>
                    Crear cuenta
                  </Button>
                </ActionGuard>
              }
            />
          ) : accountError ? (
            <ApiErrorDisplay error={accountError} onRetry={refetch} />
          ) : account ? (
            <div className={styles.card}>
              <header className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{account.points} puntos</h3>
                <Badge color="blue">Tier: {account.tier}</Badge>
              </header>
              <div className={`${styles.cardBody} ${styles.grid} ${styles.grid2}`}>
                <ActionGuard action="update" subject="Sales">
                  <div>
                    <Input
                      label="Canjear puntos"
                      type="number"
                      value={redeemPoints}
                      onChange={e => setRedeemPoints(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      className={adminStyles.mtSm}
                      onClick={() => redeemMutation.mutate()}
                      loading={redeemMutation.isPending}
                      disabled={!redeemPoints || parseInt(redeemPoints, 10) <= 0}
                    >
                      Canjear
                    </Button>
                  </div>
                </ActionGuard>
                <ActionGuard action="manage" subject="Sales">
                  <div>
                    <Input
                      label="Ajustar puntos (±)"
                      type="number"
                      value={adjustPoints}
                      onChange={e => setAdjustPoints(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      className={adminStyles.mtSm}
                      onClick={() => adjustMutation.mutate()}
                      loading={adjustMutation.isPending}
                      disabled={!adjustPoints || adjustPoints === '0'}
                    >
                      Ajustar
                    </Button>
                  </div>
                </ActionGuard>
              </div>
            </div>
          ) : null}
        </Section>
      )}
    </PageContainer>
  );
}
