import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { giftCardsApi, type GiftCard, type IssueGiftCardDto } from '@/api/gift-cards.api';
import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';
import type { Customer } from '@/types';
import { CustomerPicker } from './CustomerPicker';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onIssued: (card: GiftCard) => void;
}

export function IssueGiftCardDrawer({ open, onClose, onIssued }: Props) {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [fundingType, setFundingType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [accountId, setAccountId] = useState('');
  const [fundingNotes, setFundingNotes] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createCustomerMode, setCreateCustomerMode] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.all(),
    queryFn: () => financeApi.getTreasuryAccounts(),
    enabled: open,
  });

  useEffect(() => {
    if (open && accounts.length > 0 && !accountId) {
      const preferred = accounts.find(a => a.type === 'CASH') ?? accounts[0];
      setAccountId(preferred.id);
    }
  }, [open, accounts, accountId]);

  const resetForm = () => {
    setAmount('');
    setCode('');
    setExpiresAt('');
    setFundingType('INCOME');
    setAccountId('');
    setFundingNotes('');
    setSelectedCustomer(null);
    setCreateCustomerMode(false);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
  };

  const issueMutation = useMutation({
    mutationFn: (dto: IssueGiftCardDto) => giftCardsApi.issue(dto),
    onSuccess: (card) => {
      toast.success(`Gift card emitida: ${card.code}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.all() });
      onIssued(card);
      resetForm();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (!accountId) {
      toast.error('Seleccioná una cuenta financiera');
      return;
    }
    if (createCustomerMode && !newCustomerName.trim()) {
      toast.error('Ingresá el nombre del nuevo cliente');
      return;
    }
    if (fundingType === 'EXPENSE' && !fundingNotes.trim()) {
      toast.error('Indicá el motivo del gasto promocional');
      return;
    }

    const dto: IssueGiftCardDto = {
      amount: parsedAmount,
      fundingType,
      accountId,
      code: code.trim() || undefined,
      expiresAt: expiresAt || undefined,
      fundingNotes: fundingNotes.trim() || undefined,
    };

    if (createCustomerMode) {
      dto.newCustomer = {
        fullName: newCustomerName.trim(),
        email: newCustomerEmail.trim() || undefined,
        phone: newCustomerPhone.trim() || undefined,
      };
    } else if (selectedCustomer) {
      dto.customerId = selectedCustomer.id;
    }

    issueMutation.mutate(dto);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Drawer
      open={open}
      title="Emitir Gift Card"
      onClose={handleClose}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button
            variant="primary"
            loading={issueMutation.isPending}
            disabled={!amount || parseFloat(amount) <= 0}
            onClick={handleSubmit}
          >
            Emitir
          </Button>
        </>
      }
    >
      <div className={styles.formStackMd}>
        <Input
          label="Monto *"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <Input
          label="Código (opcional)"
          value={code}
          onChange={e => setCode(e.target.value)}
          helperText="Si se deja vacío se genera automáticamente"
        />

        <Input
          label="Vencimiento (opcional)"
          type="date"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
        />

        <div className={styles.typeToggleGroup}>
          <label className={styles.typeToggleLabel}>Registro financiero *</label>
          <div className="grid-responsive grid-cols-2">
            <Button
              variant={fundingType === 'INCOME' ? 'primary' : 'outline'}
              onClick={() => setFundingType('INCOME')}
              icon={<ArrowDownRight size={18} />}
            >
              Ingreso de dinero
            </Button>
            <Button
              variant={fundingType === 'EXPENSE' ? 'primary' : 'outline'}
              onClick={() => setFundingType('EXPENSE')}
              icon={<ArrowUpRight size={18} />}
            >
              Gasto promocional
            </Button>
          </div>
          <p className={styles.hintText}>
            {fundingType === 'INCOME'
              ? 'Se registra el cobro equivalente al monto de la gift card.'
              : 'Sin ingreso de efectivo: se registra como gasto aclarado en tesorería.'}
          </p>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel} htmlFor="gift-card-account">Cuenta financiera *</label>
          <select
            id="gift-card-account"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className={styles.select}
          >
            <option value="">Seleccionar cuenta...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </div>

        {fundingType === 'EXPENSE' && (
          <div className={styles.textareaGroup}>
            <label className={styles.textareaLabel}>Motivo del gasto *</label>
            <textarea
              value={fundingNotes}
              onChange={e => setFundingNotes(e.target.value)}
              rows={3}
              placeholder="Ej: Regalo de cumpleaños, compensación por demora, campaña de fidelización..."
              className={styles.textarea}
            />
          </div>
        )}

        {!createCustomerMode ? (
          <CustomerPicker
            selectedCustomerId={selectedCustomer?.id ?? ''}
            onSelect={setSelectedCustomer}
            onCreateNew={() => {
              setCreateCustomerMode(true);
              setSelectedCustomer(null);
            }}
          />
        ) : (
          <div className={styles.stackMd}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionTitle}>Nuevo cliente</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreateCustomerMode(false);
                  setNewCustomerName('');
                  setNewCustomerEmail('');
                  setNewCustomerPhone('');
                }}
              >
                Buscar existente
              </Button>
            </div>
            <Input
              label="Nombre completo *"
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={newCustomerEmail}
              onChange={e => setNewCustomerEmail(e.target.value)}
            />
            <Input
              label="Teléfono"
              value={newCustomerPhone}
              onChange={e => setNewCustomerPhone(e.target.value)}
            />
          </div>
        )}
      </div>
    </Drawer>
  );
}
