import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FileText, Building2, User } from 'lucide-react';
import { Drawer, Button, Input } from '@/components/ui';
import { invoicesApi, type IssueInvoiceDto } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import type { InvoiceType } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  saleOrderId?: string;
}

type FormValues = Omit<IssueInvoiceDto, 'saleOrderId' | 'type'> & {
  saleOrderId?: string;
};

const IVA_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor Final',
  'No Responsable',
];

export function IssueInvoiceDrawer({ open, onClose, saleOrderId }: Props) {
  const queryClient = useQueryClient();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('FACTURA_B');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      saleOrderId: saleOrderId || '',
      receiverName: '',
      receiverDocType: 'DNI',
      receiverDocNumber: '',
      receiverIvaCondition: 'Consumidor Final',
      receiverAddress: { street: '', city: '', state: '', zipCode: '', country: 'Argentina' },
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        saleOrderId: saleOrderId || '',
        receiverName: '',
        receiverDocType: 'DNI',
        receiverDocNumber: '',
        receiverIvaCondition: 'Consumidor Final',
        receiverAddress: { street: '', city: '', state: '', zipCode: '', country: 'Argentina' },
      });
      setInvoiceType('FACTURA_B');
    }
  }, [open, saleOrderId, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const resolvedSaleId = (saleOrderId || data.saleOrderId || '').trim();
      if (!resolvedSaleId) {
        throw new Error('Indicá el ID de la venta a facturar');
      }
      const { saleOrderId: _ignored, ...receiver } = data;
      return invoicesApi.issueInvoice({
        ...receiver,
        saleOrderId: resolvedSaleId,
        type: invoiceType,
      });
    },
    onSuccess: (_res, vars) => {
      const resolvedSaleId = (saleOrderId || vars.saleOrderId || '').trim();
      toast.success('Comprobante enviado a AFIP. Aguardando CAE...');
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
      if (resolvedSaleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.bySale(resolvedSaleId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(resolvedSaleId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      }
      onClose();
      reset();
    },
    onError: (err: any) => toast.error(err.message || 'Error al iniciar la emisión'),
  });

  const invoiceTypes: { value: InvoiceType; label: string; desc: string }[] = [
    { value: 'FACTURA_A', label: 'Factura A', desc: 'Responsables Inscriptos con descuento de IVA' },
    { value: 'FACTURA_B', label: 'Factura B', desc: 'Consumidores finales y Monotributistas' },
    { value: 'FACTURA_C', label: 'Factura C', desc: 'Emisores Monotributistas / No inscritos' },
    { value: 'NOTA_CREDITO_A', label: 'N/C A', desc: 'Nota de Crédito para Factura A' },
    { value: 'NOTA_CREDITO_B', label: 'N/C B', desc: 'Nota de Crédito para Factura B' },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Emitir Comprobante Electrónico"
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit(d => mutation.mutate(d))} loading={mutation.isPending} icon={<FileText size={16} />}>
            Enviar a AFIP
          </Button>
        </>
      }
    >
      <form className={styles.formStack}>

        <div>
          <label className={styles.formLabel}>Tipo de Comprobante *</label>
          <div className={styles.typeGrid}>
            {invoiceTypes.map(t => {
              const active = invoiceType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setInvoiceType(t.value)}
                  className={`${styles.typeOption} ${active ? styles.typeOptionActive : ''}`}
                >
                  <span className={`${styles.typeOptionLabel} ${active ? styles.typeOptionLabelActive : ''}`}>{t.label}</span>
                  <span className={styles.typeOptionDesc}>{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {saleOrderId ? (
          <div className={styles.linkedSaleBox}>
            <FileText size={16} color="var(--accent)" />
            <span className={styles.linkedSaleText}>
              Vinculado a Venta <strong className={styles.mono}>{saleOrderId}</strong>
            </span>
          </div>
        ) : (
          <Input
            label="ID de Venta *"
            placeholder="UUID de la venta a facturar"
            {...register('saleOrderId', { required: 'Indicá la venta a facturar' })}
            error={errors.saleOrderId?.message}
          />
        )}

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>
            <User size={14} /> Datos Fiscales del Receptor
          </legend>

          <div className={styles.fieldGroup}>
            <Input
              label="Razón Social / Nombre *"
              {...register('receiverName', { required: 'Campo obligatorio' })}
              error={errors.receiverName?.message}
            />

            <div className="grid-responsive grid-cols-120-1">
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipo Doc.</label>
                <select {...register('receiverDocType')} className={styles.select}>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="DNI">DNI</option>
                </select>
              </div>
              <Input
                label="Número de Documento *"
                {...register('receiverDocNumber', {
                  required: 'Requerido',
                  pattern: { value: /^\d{7,11}$/, message: 'Solo números (7–11 dígitos)' }
                })}
                error={errors.receiverDocNumber?.message}
              />
            </div>

            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Condición IVA</label>
              <select {...register('receiverIvaCondition')} className={styles.select}>
                {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {(invoiceType === 'FACTURA_A' || invoiceType === 'NOTA_CREDITO_A') && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              <Building2 size={14} /> Domicilio Fiscal (Factura A — Requerido)
            </legend>
            <div className={styles.fieldGroup}>
              <Input
                label="Calle y Número"
                {...register('receiverAddress.street', { required: invoiceType === 'FACTURA_A' ? 'Requerido para Factura A' : false })}
                error={errors.receiverAddress?.street?.message}
              />
              <div className={styles.addressGrid}>
                <Input label="Ciudad" {...register('receiverAddress.city')} />
                <Input label="Provincia" {...register('receiverAddress.state')} />
                <Input label="C.P." {...register('receiverAddress.zipCode')} />
              </div>
            </div>
          </fieldset>
        )}

        <div className={styles.warningBox}>
          <strong>Nota:</strong> Una vez enviado a AFIP, el comprobante queda registrado en el libro fiscal y no puede eliminarse. Para anular, se emite una Nota de Crédito.
        </div>

      </form>
    </Drawer>
  );
}
