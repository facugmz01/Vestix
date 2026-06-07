import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { customersApi, type CreateCustomerDto } from '@/api/customers.api';
import { queryKeys } from '@/api/queryKeys';
import type { Customer } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export function CustomerFormDrawer({ open, onClose, customerToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!customerToEdit;

  const [formData, setFormData] = useState<CreateCustomerDto>({
    type: 'INDIVIDUAL',
    fullName: '',
    taxId: '',
    email: '',
    phone: '',
    initialCreditLimit: 0,
  });

  useEffect(() => {
    if (open && customerToEdit) {
      setFormData({
        type: customerToEdit.type,
        fullName: customerToEdit.fullName,
        taxId: customerToEdit.taxId || '',
        email: customerToEdit.email || '',
        phone: customerToEdit.phone || '',
        initialCreditLimit: customerToEdit.credit.limit,
      });
    } else if (open && !customerToEdit) {
      setFormData({
        type: 'INDIVIDUAL',
        fullName: '',
        taxId: '',
        email: '',
        phone: '',
        initialCreditLimit: 0,
      });
    }
  }, [open, customerToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateCustomerDto) => {
      if (isEditing && customerToEdit) return customersApi.updateCustomer(customerToEdit.id, data);
      return customersApi.createCustomer(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el cliente');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('El nombre / razón social es obligatorio');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tipo de Cliente</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INDIVIDUAL' | 'BUSINESS' })}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <option value="INDIVIDUAL">Consumidor Final / Individuo</option>
            <option value="BUSINESS">Empresa (B2B)</option>
          </select>
        </div>

        <Input
          label={formData.type === 'BUSINESS' ? 'Razón Social *' : 'Nombre Completo *'}
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label={formData.type === 'BUSINESS' ? 'CUIT / RUT *' : 'DNI / Identificación'}
            value={formData.taxId || ''}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            required={formData.type === 'BUSINESS'}
          />
          <Input
            label="Teléfono"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Condiciones Comerciales
          </h4>
          <Input
            label="Límite de Crédito Autorizado ($)"
            type="number"
            min="0"
            step="1000"
            value={formData.initialCreditLimit}
            onChange={(e) => setFormData({ ...formData, initialCreditLimit: Number(e.target.value) })}
           
            disabled={isEditing} // Generalmente se edita desde otra vista por seguridad financiera
          />
          {isEditing && (
            <p style={{ fontSize: '12px', color: 'var(--orange)', marginTop: '8px' }}>
              * Para modificar límites de crédito de clientes existentes, utilizá el módulo de Riesgo/Finanzas en la vista de detalle.
            </p>
          )}
        </div>

      </form>
    </Drawer>
  );
}
