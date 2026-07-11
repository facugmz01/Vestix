import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Gift, Ban, Search, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar,
  EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, ActiveChip, Input,
} from '@/components/ui';
import { giftCardsApi, type GiftCard } from '@/api/gift-cards.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/config/app.config';
import adminStyles from '@/styles/AdminListShared.module.css';
import { IssueGiftCardDrawer } from '@/features/gift-cards/components/IssueGiftCardDrawer';
import { GiftCardDigitalModal } from '@/features/gift-cards/components/GiftCardDigitalModal';

const FUNDING_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto promocional',
};

export default function GiftCardsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [digitalCard, setDigitalCard] = useState<GiftCard | null>(null);
  const [selected, setSelected] = useState<GiftCard | null>(null);
  const [lookupCode, setLookupCode] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.giftCards.all({ search }),
    queryFn: () => giftCardsApi.getAll(search),
  });

  const lookupMutation = useMutation({
    mutationFn: () => giftCardsApi.getBalance(lookupCode),
    onSuccess: (res) => toast.success(`Saldo ${res.code}: ${formatCurrency(res.balance)}`),
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (code: string) => giftCardsApi.deactivate(code),
    onSuccess: () => {
      toast.success('Gift card desactivada');
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.all() });
      setDeactivateOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cards = data ?? [];

  return (
    <PageContainer
      title="Gift Cards"
      subtitle="Emití tarjetas de regalo, consultá saldos y desactivá códigos."
      action={
        <ActionGuard action="create" subject="Sales">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIssueOpen(true)}>
            Emitir Gift Card
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{cards.length} tarjetas</Badge>}>
        <SearchInput placeholder="Buscar por código o destinatario..." onSearch={setSearch} />
        <div className={adminStyles.inlineLookup}>
          <Input
            placeholder="Consultar código..."
            value={lookupCode}
            onChange={e => setLookupCode(e.target.value)}
          />
          <Button
            variant="secondary"
            icon={<Search size={14} />}
            onClick={() => lookupMutation.mutate()}
            loading={lookupMutation.isPending}
            disabled={!lookupCode.trim()}
          >
            Saldo
          </Button>
        </div>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : cards.length === 0 ? (
          <EmptyState icon={<Gift size={40} />} title="Sin gift cards" description="Emití la primera tarjeta de regalo." />
        ) : (
          <Table
            columns={[
              { key: 'code', label: 'Código', render: (c: GiftCard) => <code>{c.code}</code> },
              { key: 'balance', label: 'Saldo', render: (c: GiftCard) => formatCurrency(c.balance) },
              { key: 'initial', label: 'Monto inicial', render: (c: GiftCard) => formatCurrency(c.initialBalance) },
              {
                key: 'issuedTo',
                label: 'Destinatario',
                render: (c: GiftCard) => c.customer?.fullName || c.issuedTo || '—',
              },
              {
                key: 'funding',
                label: 'Registro',
                render: (c: GiftCard) => c.fundingType ? FUNDING_LABELS[c.fundingType] ?? c.fundingType : '—',
              },
              { key: 'expires', label: 'Vence', render: (c: GiftCard) => c.expiresAt ? formatDate(c.expiresAt) : '—' },
              { key: 'status', label: 'Estado', render: (c: GiftCard) => (
                <ActiveChip active={c.isActive} />
              )},
              { key: 'actions', label: '', render: (c: GiftCard) => (
                <>
                  {c.verificationToken && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<QrCode size={14} />}
                      onClick={() => setDigitalCard(c)}
                      aria-label="Ver tarjeta digital"
                    />
                  )}
                  {c.isActive ? (
                    <ActionGuard action="manage" subject="Sales">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Ban size={14} />}
                        onClick={() => { setSelected(c); setDeactivateOpen(true); }}
                      />
                    </ActionGuard>
                  ) : null}
                </>
              ) },
            ]}
            data={cards}
            keyExtractor={(c: GiftCard) => c.id}
          />
        )}
      </Section>

      <IssueGiftCardDrawer
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onIssued={(card) => setDigitalCard(card)}
      />

      <GiftCardDigitalModal
        open={!!digitalCard}
        card={digitalCard}
        onClose={() => setDigitalCard(null)}
      />

      <ConfirmDialog
        open={deactivateOpen}
        title="Desactivar gift card"
        message={`¿Desactivar la tarjeta ${selected?.code}? El saldo restante quedará bloqueado.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={deactivateMutation.isPending}
        onConfirm={() => selected && deactivateMutation.mutate(selected.code)}
        onCancel={() => setDeactivateOpen(false)}
      />
    </PageContainer>
  );
}
