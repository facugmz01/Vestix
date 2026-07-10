import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { suppliersApi, type CreateSupplierDto } from '@/api/suppliers.api';
import { queryKeys } from '@/api/queryKeys';
import type { Supplier } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
}

export function SupplierFormDrawer({ open, onClose, supplierToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!supplierToEdit;

  const [formData, setFormData] = useState<CreateSupplierDto>({
    companyName: '',
    contactName: '',
    taxId: '',
    email: '',
    initialBalance: 0,
    currency: 'ARS',
  });

  useEffect(() => {
    if (open && supplierToEdit) {
      setFormData({
        companyName: supplierToEdit.companyName,
        contactName: supplierToEdit.contactName || '',
        taxId: supplierToEdit.taxId || '',
        email: supplierToEdit.email || '',
        initialBalance: supplierToEdit.account?.balance || 0,
        currency: supplierToEdit.account?.currency || 'ARS',
      });
    } else if (open && !supplierToEdit) {
      setFormData({
        companyName: '',
        contactName: '',
        taxId: '',
        email: '',
        initialBalance: 0,
        currency: 'ARS',
      });
    }
  }, [open, supplierToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateSupplierDto) => {
      if (isEditing && supplierToEdit) {
        const { initialBalance, currency, ...updateData } = data;
        return suppliersApi.updateSupplier(supplierToEdit.id, updateData);
      }
      return suppliersApi.createSupplier(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Proveedor actualizado' : 'Proveedor creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el proveedor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('La Razón Social es obligatoria');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        <Input
          label="Razón Social / Empresa *"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          required
        />

        <div className="grid-responsive grid-cols-2">
          <Input
            label="CUIT / Tax ID"
            value={formData.taxId || ''}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          />
          <Input
            label="Nombre de Contacto"
            value={formData.contactName || ''}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          />
        </div>

        <Input
          label="Correo Electrónico (Para envío de OCs)"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <hr className={styles.formDivider} />

        <div className={styles.sectionPanel}>
          <h4 className={styles.sectionPanelTitle}>Cuenta Corriente / Financiera</h4>
          
          <div className="grid-responsive grid-cols-2-1">
            <Input
              label="Saldo Inicial de Deuda"
              type="number"
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
              disabled={isEditing}
              helperText="Saldo a favor del proveedor (lo que le debemos)."
            />
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Moneda</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={isEditing}
                className={styles.select}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <p className={styles.hintOrange}>
              * El saldo y la moneda de la cuenta no se pueden modificar desde aquí. Utilizá los pagos o notas de crédito en la ficha financiera.
            </p>
          )}
        </div>
      </form>
    </Drawer>
  );
}
