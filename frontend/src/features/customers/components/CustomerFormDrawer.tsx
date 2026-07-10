import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { customersApi, type CreateCustomerDto } from '@/api/customers.api';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import type { Customer } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

const customerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  fullName: z.string().min(2, 'El nombre/razón social es obligatorio'),
  taxId: z.string().optional(),
  email: z.string().email('Formato de correo inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  initialCreditLimit: z.number().min(0, 'No puede ser negativo'),
  priceListId: z.string().optional(),
}).refine(data => data.type === 'INDIVIDUAL' || (data.type === 'BUSINESS' && !!data.taxId), {
  message: 'El CUIT/RUT es obligatorio para Empresas',
  path: ['taxId'],
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export function CustomerFormDrawer({ open, onClose, customerToEdit }: Props) {
  const queryClient = useQueryClient();
  const enqueueOfflineOp = useOfflineQueueStore(s => s.enqueue);
  const isEditing = !!customerToEdit;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { type: 'INDIVIDUAL', initialCreditLimit: 0, email: '', phone: '', taxId: '', priceListId: '' }
  });

  const selectedType = watch('type');

  const { data: priceListsData } = useQuery({
    queryKey: queryKeys.priceLists.all(),
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100 }),
  });

  useEffect(() => {
    if (open) {
      if (customerToEdit) {
        reset({
          type: customerToEdit.type,
          fullName: customerToEdit.fullName,
          taxId: customerToEdit.taxId || '',
          email: customerToEdit.email || '',
          phone: customerToEdit.phone || '',
          initialCreditLimit: customerToEdit.credit?.limit || 0,
          priceListId: customerToEdit.priceListId || '',
        });
      } else {
        reset({ type: 'INDIVIDUAL', fullName: '', taxId: '', email: '', phone: '', initialCreditLimit: 0, priceListId: '' });
      }
    }
  }, [open, customerToEdit, reset]);

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const dto = data as CreateCustomerDto;

      const enqueueOffline = () => {
        if (isEditing && customerToEdit) {
          enqueueOfflineOp({
            module: 'Customers',
            action: 'updateCustomer',
            description: `Actualizar cliente: ${data.fullName}`,
            endpoint: `/customers/${customerToEdit.id}`,
            method: 'PATCH',
            maxRetries: 5,
            payload: dto,
          });
        } else {
          enqueueOfflineOp({
            module: 'Customers',
            action: 'createCustomer',
            description: `Crear cliente: ${data.fullName}`,
            endpoint: '/customers',
            method: 'POST',
            maxRetries: 5,
            payload: dto,
          });
        }
      };

      if (!isOnline) {
        enqueueOffline();
        return { offline: true };
      }

      try {
        if (isEditing && customerToEdit) {
          return { offline: false, res: await customersApi.updateCustomer(customerToEdit.id, dto) };
        }
        return { offline: false, res: await customersApi.createCustomer(dto) };
      } catch (err: unknown) {
        const axiosErr = err as { response?: unknown; code?: string; message?: string };
        const isNetworkError = !axiosErr.response || axiosErr.code === 'ERR_NETWORK' || axiosErr.message?.includes('Network Error');
        if (isNetworkError) {
          enqueueOffline();
          return { offline: true };
        }
        throw err;
      }
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast('Guardado localmente. Se sincronizará al recuperar la conexión', { icon: '📴', duration: 4000 });
      } else {
        toast.success(isEditing ? 'Cliente actualizado' : 'Cliente creado exitosamente');
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      }
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error crítico al procesar la solicitud');
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      onClose={onClose}
      width="md"
      footer={
        <>
          {!isOnline && (
            <span className={styles.warningInline}>
              <CloudOff size={16} /> Modo Offline
            </span>
          )}
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting || mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting || mutation.isPending}>
            Guardar Cliente
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formStackMd} noValidate>
        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Tipo de Cliente</label>
          <select {...register('type')} className={styles.select}>
            <option value="INDIVIDUAL">Consumidor Final / Individuo</option>
            <option value="BUSINESS">Empresa (B2B)</option>
          </select>
        </div>

        <Input
          label={selectedType === 'BUSINESS' ? 'Razón Social *' : 'Nombre Completo *'}
          {...register('fullName')}
          error={errors.fullName?.message}
        />

        <div className="grid-responsive grid-cols-2">
          <Input
            label={selectedType === 'BUSINESS' ? 'CUIT / RUT *' : 'DNI / Identificación'}
            {...register('taxId')}
            error={errors.taxId?.message}
          />
          <Input
            label="Teléfono"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <hr className={styles.formDivider} />

        <div className={styles.sectionPanel}>
          <h4 className={styles.sectionPanelTitle}>Condiciones Comerciales</h4>
          <Input
            label="Límite de Crédito Autorizado ($)"
            type="number"
            {...register('initialCreditLimit', { valueAsNumber: true })}
            error={errors.initialCreditLimit?.message}
            disabled={isEditing} 
            helperText={isEditing ? "* Se edita desde el módulo de Riesgo/Finanzas" : undefined}
          />
          
          <div className={`${styles.fieldGroupSm} ${styles.fieldGroupMd}`}>
            <label className={styles.selectLabel}>Lista de Precios Asignada</label>
            <select {...register('priceListId')} className={styles.select}>
              <option value="">(Lista por Defecto)</option>
              {priceListsData?.data.map(list => (
                <option key={list.id} value={list.id}>{list.name} ({list.type})</option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
